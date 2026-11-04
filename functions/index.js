/* 정기 출정 방을 지우고, 매지컬 마치와 정기 출정의 전투 계산을 돌린다.
   사건 글은 data/events, 판정 숫자는 scripts/pack-sim.js, 특성 규칙은 functions/sim/engine.js.
   배포: firebase deploy --only functions  (배포가 scripts/pack-sim.js 로 tables.js 를 다시 만든다.)
   투표 집계: wait 최초 write 시 Wd=now+15s, live/x due + Cloud Task(xVoteDue). 분 스케줄은 백업. */
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onValueWritten} = require("firebase-functions/v2/database");
const {onTaskDispatched} = require("firebase-functions/v2/tasks");
const {initializeApp} = require("firebase-admin/app");
const {getDatabase} = require("firebase-admin/database");
const {getFunctions} = require("firebase-admin/functions");
const sim = require("./sim/engine");

initializeApp({databaseURL: "https://magical-growth-default-rtdb.asia-southeast1.firebasedatabase.app"});

const XS = 300000, XN = 15, X_DROP = 2 * 60 * 1000, X_HARD = 20 * 60 * 1000;
/* 투표 마감 Wd 뒤 집계 여유. readXVotes 가 Wd+1000 초과 표를 버리므로 집계도 1초면 충분하다(옛 3초). */
const X_VOTE_GRACE = 1000;
const plain = v => JSON.parse(JSON.stringify(v));
/* RTDB 는 배열·빈 배열을 객체로 바꾸거나 키 자체를 지운다.
   picks[c]==null 로 다시 wait 하면 같은 선택지가 now+15초로 재개되어 루프한다.
   → 슬롯은 항상 비어 있지 않은 객체로 저장하고, 확정 개수 pc 로 재생한다. */
function asPickList(v) {
  if (v == null) return null;
  if (Array.isArray(v)) return v.map(Number).filter(n => Number.isFinite(n));
  if (typeof v === "object") {
    return Object.keys(v).filter(k => k !== "_" && Number.isFinite(Number(k))).map(Number).sort((a, b) => a - b)
      .map(k => Number(v[k])).filter(n => Number.isFinite(n));
  }
  const n = Number(v);
  return Number.isFinite(n) ? [n] : [];
}
function normPicks(raw) {
  if (raw == null) return [];
  const keys = Array.isArray(raw)
    ? raw.map((_, i) => i).filter(i => raw[i] != null)
    : Object.keys(raw || {}).map(Number).filter(Number.isFinite);
  const out = [];
  const max = keys.length ? Math.max(...keys) : -1;
  for (let i = 0; i <= max; i++) {
    if (raw[i] == null) continue;
    const list = asPickList(raw[i]);
    /* 센티널 {_} 만 있어도 "이미 집계된 빈 표" 로 칸을 유지한다. */
    out[i] = list || [];
  }
  return out;
}
function picksForStore(picks) {
  const o = {};
  const src = Array.isArray(picks) ? picks : normPicks(picks);
  src.forEach((v, i) => {
    if (v == null) return;
    const list = Array.isArray(v) ? v.map(Number).filter(n => Number.isFinite(n)) : (asPickList(v) || []);
    const slot = {_: 1};
    list.forEach((n, j) => { slot[String(j)] = n; });
    o[String(i)] = slot;
  });
  return o;
}
function pickCount(pc, picks) {
  if (typeof pc === "number" && Number.isFinite(pc) && pc >= 0) return Math.floor(pc);
  const src = Array.isArray(picks) ? picks : normPicks(picks);
  let n = 0;
  for (let i = 0; i < src.length; i++) if (src[i] != null) n = i + 1;
  return n;
}
function seqLen(v) {
  if (Array.isArray(v)) return v.length;
  if (v && typeof v === "object") {
    const ks = Object.keys(v).map(Number).filter(Number.isFinite);
    return ks.length ? Math.max(...ks) + 1 : 0;
  }
  return 0;
}

async function withLock(db, key, fn) {
  const ref = db.ref("tally/mlock/" + key);
  const now = Date.now();
  const res = await ref.transaction(c => {
    if (c && now - Number(c.at) < 20000) return;
    return {at: now};
  });
  if (!res.committed) return;
  try { await fn(); } finally { await ref.set(null); }
}

/* 방 삭제는 endAt+X_DROP(또는 빈 방이면 now+X_DROP) 기준.
   이미 더 늦은 예약이 있으면 유지하고, 더 이른 예약만 늦춘다(빠른 클라가 수명을 당기지 못하게). */
async function scheduleXDrop(db, s, i, at) {
  await db.ref("live/xdrop/" + s + "_" + i).transaction(c => {
    if (typeof c === "number" && Number.isFinite(c)) {
      if (c >= at) return;
      return at;
    }
    return at;
  });
}
function xDropAt(doc, now) {
  return (doc && typeof doc.endAt === "number" ? doc.endAt : now) + X_DROP;
}
function xDue(doc, now) {
  if (doc && doc.wait && typeof doc.wait.Wd === "number") return doc.wait.Wd + X_VOTE_GRACE;
  return now + 40 * 60000;
}
/* live/x 에 due 를 쓰고, 가능하면 Cloud Task 로 Wd+grace 에 집계를 예약한다. Task 실패 시 분 스케줄이 백업. */
async function armXDue(db, s, i, doc, now) {
  const at = xDue(doc, now);
  await db.ref("live/x/" + s + "_" + i).set(at);
  if (!(doc && doc.wait && typeof doc.wait.Wd === "number")) return;
  const delaySec = Math.max(1, Math.ceil((at - now) / 1000));
  try {
    const queue = getFunctions().taskQueue("xVoteDue");
    await queue.enqueue({s, i, c: Number(doc.wait.c), Wd: doc.wait.Wd}, {
      scheduleDelaySeconds: delaySec,
      dispatchDeadlineSeconds: 60
    });
  } catch (e) { /* Blaze·Tasks 미준비면 live/x + expireMarch 만으로 진행 */ }
}

async function dropOne(db, s, i) {
  const updates = {};
  updates["xm" + s + "_e" + i] = null;
  updates["xn" + s + "_e" + i] = null; // 예전 이름 목록. 새 참가는 xn 을 쓰지 않지만 남은 칸은 지운다.
  updates["xr" + s + "_" + i] = null;
  await db.ref("live/x/" + s + "_" + i).set(null);
  await db.ref("live/xdrop/" + s + "_" + i).set(null);
  const pref = "xvx" + s + "_" + i + "_c";
  const votes = await db.ref("rooms").orderByKey().startAt(pref).endAt(pref + "\uf8ff").get();
  if (votes.exists()) votes.forEach(ch => { updates[ch.key] = null; });
  await db.ref("rooms").update(updates);
}

async function readMarchVotes(db, code, room, ch) {
  const picks = [];
  const ids = Object.keys(room.pl || {}).filter(k => !String(k).startsWith("bot"));
  for (const u of ids) {
    const d = (await db.ref("rooms/" + code + "v_" + u).get()).val();
    if (d && d.k === ch.k && (ch.ops || []).includes(d.i)) picks.push(d.i);
  }
  return picks;
}

async function stepOneMarch(db, id, now) {
  const ref = db.ref("rooms/" + id);
  const room = (await ref.get()).val();
  if (!room || room.st !== "run") {
    await db.ref("live/m/" + id).set(null);
    return;
  }
  let picks = [];
  const ch = sim.marchChoice(room, now);
  if (ch) picks = await readMarchVotes(db, id, room, ch);
  const next = sim.stepMarch(plain(room), picks, now);
  const saved = next || room;
  if (next) {
    next.calc = 0;
    next.ts = now;
    await ref.set(plain(next));
  } else if (room.calc === 1) await ref.child("calc").set(0);
  const due = sim.marchDue(saved, now);
  await db.ref("live/m/" + id).set(!due || saved.st === "done" ? null : due);
}

async function readXVotes(db, id, wait, pl) {
  const body = (await db.ref("rooms/xv" + id + "_c" + wait.c).get()).val() || {};
  const picks = [];
  Object.keys(body).forEach(uid => {
    const v = body[uid];
    if (!v || typeof v !== "object" || !pl[uid]) return;
    if (typeof v.ts === "number" && v.ts > wait.Wd + 1000) return;
    picks.push(Number(v.i));
  });
  return picks;
}

/* 선택 이후에는 이미 받은 문장·시각은 그대로 두고, 새로 쌓인 seq/lineAt 칸과 바뀐 메타만 update 한다.
   첫 기록·빈 출정은 set 으로 통째로 쓴다. */
async function writeExpeditionPatch(ref, prev, doc) {
  const next = plain(doc);
  const prevSeq = seqLen(prev && prev.r && prev.r.seq);
  const prevAt = seqLen(prev && prev.lineAt);
  if (!prev || !prev.r || prevSeq === 0) {
    next.picks = picksForStore(next.picks);
    next.pc = pickCount(next.pc, next.picks);
    await ref.set(next);
    return;
  }
  const r = next.r || {};
  const seq = Array.isArray(r.seq) ? r.seq : [];
  const lineAt = Array.isArray(next.lineAt) ? next.lineAt : [];
  const updates = {
    wait: next.wait == null ? null : next.wait,
    done: !!next.done,
    endAt: next.endAt == null ? null : next.endAt,
    picks: picksForStore(next.picks),
    pc: pickCount(next.pc, next.picks),
    calc: 0,
    all: next.all || prev.all || {}
  };
  Object.keys(r).forEach(k => {
    if (k === "seq" || k === "pl") return; // 파티 자리는 첫 기록 이후 그대로 둔다.
    updates["r/" + k] = r[k] == null ? null : r[k];
  });
  /* RTDB seq 가 객체여도 길이만 맞춰 이어 붙인다. */
  const seqObj = Array.isArray(r.seq) ? r.seq : (r.seq || {});
  for (let j = prevSeq; j < Math.max(seq.length, seqLen(seqObj)); j++) {
    const line = Array.isArray(r.seq) ? r.seq[j] : seqObj[j];
    if (line != null) updates["r/seq/" + j] = line;
  }
  const atObj = Array.isArray(next.lineAt) ? next.lineAt : (next.lineAt || {});
  for (let j = prevAt; j < Math.max(lineAt.length, seqLen(atObj)); j++) {
    const t = Array.isArray(next.lineAt) ? next.lineAt[j] : atObj[j];
    if (t != null) updates["lineAt/" + j] = t;
  }
  await ref.update(updates);
}

async function stepOneExpedition(db, s, i, now) {
  const info = sim.expeditionInfo(s, i);
  if (now < info.T0) return;
  const ref = db.ref("rooms/xr" + s + "_" + i);
  const cur = (await ref.get()).val();
  if (cur && cur.empty) {
    await db.ref("live/x/" + s + "_" + i).set(null);
    await scheduleXDrop(db, s, i, now + X_DROP);
    return;
  }
  if (!cur || !cur.r) {
    const seat = (await db.ref("rooms/xm" + s + "_e" + i).get()).val() || {};
    const all = {};
    Object.keys(seat).forEach(u => { if (seat[u] && typeof seat[u] === "object" && typeof seat[u].jt === "number") all[u] = seat[u].jt; });
    const ids = sim.partyIds(info, seat);
    if (!ids.length) {
      await ref.set({empty: 1, all});
      await db.ref("live/x/" + s + "_" + i).set(null);
      await scheduleXDrop(db, s, i, now + X_DROP);
      return;
    }
    const pl = {};
    ids.forEach(u => { pl[u] = seat[u]; });
    const doc = sim.replayExpedition(info, pl, [], now, 0, null);
    doc.all = all;
    doc.calc = 0;
    doc.pc = 0;
    doc.picks = picksForStore(doc.picks);
    await ref.set(plain(doc));
    await armXDue(db, s, i, doc, now);
    if (doc.done) await scheduleXDrop(db, s, i, xDropAt(doc, now));
    return;
  }
  const pc0 = pickCount(cur.pc, cur.picks);
  /* 집계는 pc === wait.c 일 때만. wait 없거나 커서가 어긋나면 재생으로 맞춘다. */
  if (!cur.wait) {
    if (cur.done) {
      await db.ref("live/x/" + s + "_" + i).set(null);
      await scheduleXDrop(db, s, i, xDropAt(cur, now));
    } else {
      const picks = normPicks(cur.picks);
      const doc = sim.replayExpedition(info, cur.r.pl, picks, now, pc0, null);
      doc.all = cur.all || {};
      doc.calc = 0;
      doc.pc = pc0;
      doc.picks = picksForStore(picks);
      await writeExpeditionPatch(ref, cur, doc);
      await armXDue(db, s, i, doc, now);
      if (doc.done) await scheduleXDrop(db, s, i, xDropAt(doc, now));
    }
    if (cur.calc === 1) await ref.child("calc").set(0);
    return;
  }
  const waitC = Number(cur.wait.c);
  if (pc0 !== waitC) {
    const picks = normPicks(cur.picks);
    const doc = sim.replayExpedition(info, cur.r.pl, picks, now, pc0, null);
    doc.all = cur.all || {};
    doc.calc = 0;
    doc.pc = pc0;
    doc.picks = picksForStore(picks);
    await writeExpeditionPatch(ref, cur, doc);
    await armXDue(db, s, i, doc, now);
    if (doc.done) await scheduleXDrop(db, s, i, xDropAt(doc, now));
    if (cur.calc === 1) await ref.child("calc").set(0);
    return;
  }
  if (now < Number(cur.wait.Wd) + X_VOTE_GRACE) {
    await armXDue(db, s, i, cur, now);
    if (cur.calc === 1) await ref.child("calc").set(0);
    return;
  }
  const votes = await readXVotes(db, info.id, cur.wait, cur.r.pl || {});
  const picks = normPicks(cur.picks);
  picks[waitC] = votes;
  const pc = waitC + 1;
  const doc = sim.replayExpedition(info, cur.r.pl, picks, now, pc, null);
  doc.all = cur.all || {};
  doc.calc = 0;
  doc.pc = pc;
  doc.picks = picksForStore(picks);
  /* 새 wait(다음 c)만 실시계 Wd. 같은 c 가 재생에 또 나오면 버그이므로 기존 Wd 유지. */
  if (doc.wait && Number(doc.wait.c) === waitC) {
    doc.wait = { c: cur.wait.c, Ws: cur.wait.Ws, Wd: cur.wait.Wd };
    if (doc.r && doc.r.ch) doc.r.ch.until = cur.wait.Wd;
  }
  await writeExpeditionPatch(ref, cur, doc);
  await armXDue(db, s, i, doc, now);
  if (doc.done) await scheduleXDrop(db, s, i, xDropAt(doc, now));
}

async function runLiveMarch(db, now) {
  const live = await db.ref("live/m").get();
  if (!live.exists()) return;
  const codes = [];
  live.forEach(ch => {
    const due = Number(ch.val());
    if (Number.isFinite(due) && due > now) return;
    codes.push(ch.key);
  });
  for (const id of codes) await withLock(db, "m" + id, () => stepOneMarch(db, id, now));
}

async function runExpeditions(db, now) {
  const dueMap = (await db.ref("live/x").get()).val() || {};
  /* due 가 지난 방만 집계(서버 강제). */
  for (const [k, raw] of Object.entries(dueMap)) {
    const due = Number(raw);
    if (!Number.isFinite(due) || due > now) continue;
    const p = String(k).indexOf("_");
    if (p < 0) continue;
    const s = Number(String(k).slice(0, p)), i = Number(String(k).slice(p + 1));
    if (!Number.isFinite(s) || !Number.isFinite(i)) continue;
    await withLock(db, "x" + s + "_" + i, () => stepOneExpedition(db, s, i, now));
  }
  /* 출발했는데 live/x 가 없는 방: xr 최초 생성. */
  const cur = Math.floor(now / XS);
  for (let s = cur - 2; s <= cur - 1; s++) {
    if (s < 0 || (s + 1) * XS > now) continue;
    for (let i = 0; i < XN; i++) {
      if (dueMap[s + "_" + i] != null) continue;
      await withLock(db, "x" + s + "_" + i, () => stepOneExpedition(db, s, i, now));
    }
  }
}

exports.expireMarch = onSchedule({
  schedule: "every 1 minutes",
  timeZone: "Asia/Seoul",
  region: "asia-southeast1",
  timeoutSeconds: 120,
  memory: "256MiB"
}, async () => {
  const db = getDatabase();
  const now = Date.now();
  const hardCap = Math.floor((now - X_HARD) / XS) - 1;
  const cursor = db.ref("tally/marchgc");
  const prevSnap = await cursor.get();
  let prev = Number(prevSnap.val());
  if (!Number.isFinite(prev)) prev = hardCap - 12;
  const hardTo = Math.min(hardCap, prev + 3);
  if (hardTo > prev) {
    for (let s = prev + 1; s <= hardTo; s++) {
      for (let i = 0; i < XN; i++) await dropOne(db, s, i);
    }
    await cursor.set(hardTo);
  }
  const dropMap = (await db.ref("live/xdrop").get()).val() || {};
  for (const [k, at] of Object.entries(dropMap)) {
    const t = Number(at);
    if (!Number.isFinite(t) || now < t) continue;
    const p = String(k).indexOf("_");
    if (p < 0) continue;
    const s = Number(String(k).slice(0, p)), i = Number(String(k).slice(p + 1));
    if (!Number.isFinite(s) || !Number.isFinite(i)) continue;
    await dropOne(db, s, i);
  }
  await runExpeditions(db, now);
  await runLiveMarch(db, now);
});

/* 투표 마감 due 전용 Task. wait 기록 시 armXDue 가 예약한다. */
exports.xVoteDue = onTaskDispatched({
  region: "asia-southeast1",
  timeoutSeconds: 60,
  memory: "256MiB",
  retryConfig: {maxAttempts: 5, minBackoffSeconds: 10},
  rateLimits: {maxConcurrentDispatches: 40}
}, async event => {
  const s = Number(event.data && event.data.s), i = Number(event.data && event.data.i);
  if (!Number.isFinite(s) || !Number.isFinite(i)) return;
  const db = getDatabase();
  await withLock(db, "x" + s + "_" + i, () => stepOneExpedition(db, s, i, Date.now()));
});

/* 클라 calc 는 보조(xr 최초 생성·비상). 투표 마감 집계의 본선은 xVoteDue + live/x 스케줄. */
exports.roomCalc = onValueWritten({
  ref: "/rooms/{roomId}/calc",
  instance: "magical-growth-default-rtdb",
  region: "asia-southeast1",
  timeoutSeconds: 60,
  memory: "256MiB"
}, async event => {
  if (!event.data.after.exists() || event.data.after.val() !== 1) return;
  const id = String(event.params.roomId || "");
  const db = getDatabase();
  const now = Date.now();
  const xm = id.match(/^xr(\d+)_(\d+)$/);
  if (xm) { await withLock(db, "x" + xm[1] + "_" + xm[2], () => stepOneExpedition(db, Number(xm[1]), Number(xm[2]), now)); return; }
  if (/^[A-Z0-9]{4}$/.test(id)) await withLock(db, "m" + id, () => stepOneMarch(db, id, now));
});
