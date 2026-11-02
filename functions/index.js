/* 정기 출정 방을 지우고, 매지컬 마치와 정기 출정의 전투 계산을 돌린다.
   사건 글은 data/events, 판정 숫자는 scripts/pack-sim.js, 특성 규칙은 functions/sim/engine.js.
   배포: firebase deploy --only functions  (배포가 scripts/pack-sim.js 로 tables.js 를 다시 만든다.) */
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onValueWritten} = require("firebase-functions/v2/database");
const {initializeApp} = require("firebase-admin/app");
const {getDatabase} = require("firebase-admin/database");
const sim = require("./sim/engine");

initializeApp({databaseURL: "https://magical-growth-default-rtdb.asia-southeast1.firebasedatabase.app"});

const XS = 300000, XN = 15, X_DROP = 2 * 60 * 1000, X_HARD = 20 * 60 * 1000;
const plain = v => JSON.parse(JSON.stringify(v));

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

async function dropOne(db, s, i) {
  const updates = {};
  updates["xm" + s + "_e" + i] = null;
  updates["xn" + s + "_e" + i] = null;
  updates["xr" + s + "_" + i] = null;
  await db.ref("live/x/" + s + "_" + i).set(null);
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

async function stepOneExpedition(db, s, i, now) {
  const info = sim.expeditionInfo(s, i);
  if (now < info.T0) return;
  const ref = db.ref("rooms/xr" + s + "_" + i);
  const cur = (await ref.get()).val();
  if (cur && cur.empty) {
    await db.ref("live/x/" + s + "_" + i).set(xDue(null, now));
    return;
  }
  if (!cur || !cur.r) {
    const seat = (await db.ref("rooms/xm" + s + "_e" + i).get()).val() || {};
    const all = {};
    Object.keys(seat).forEach(u => { if (seat[u] && typeof seat[u] === "object" && typeof seat[u].jt === "number") all[u] = seat[u].jt; });
    const ids = sim.partyIds(info, seat);
    if (!ids.length) {
      await ref.set({empty: 1, all});
      await db.ref("live/x/" + s + "_" + i).set(xDue(null, now));
      return;
    }
    const pl = {};
    ids.forEach(u => { pl[u] = seat[u]; });
    const doc = sim.replayExpedition(info, pl, []);
    doc.all = all;
    doc.calc = 0;
    await ref.set(plain(doc));
    await db.ref("live/x/" + s + "_" + i).set(xDue(doc, now));
    return;
  }
  if (!cur.wait || now < cur.wait.Wd + 3000) {
    await db.ref("live/x/" + s + "_" + i).set(xDue(cur, now));
    return;
  }
  const votes = await readXVotes(db, info.id, cur.wait, cur.r.pl || {});
  const picks = Array.isArray(cur.picks) ? cur.picks.slice() : [];
  picks[cur.wait.c] = votes;
  const doc = sim.replayExpedition(info, cur.r.pl, picks);
  doc.all = cur.all || {};
  doc.calc = 0;
  await ref.set(plain(doc));
  await db.ref("live/x/" + s + "_" + i).set(xDue(doc, now));
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

function xDue(doc, now) {
  if (doc && doc.wait && typeof doc.wait.Wd === "number") return doc.wait.Wd + 3000;
  return now + 40 * 60000;
}

async function runExpeditions(db, now) {
  const cur = Math.floor(now / XS);
  const dueMap = (await db.ref("live/x").get()).val() || {};
  for (let s = cur - 2; s <= cur - 1; s++) {
    if (s < 0 || (s + 1) * XS > now) continue;
    for (let i = 0; i < XN; i++) {
      const due = Number(dueMap[s + "_" + i]);
      if (Number.isFinite(due) && due > now) continue;
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
  const cur = Math.floor(now / XS);
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
  const liveFrom = Math.max(hardTo + 1, cur - 6);
  for (let s = liveFrom; s <= cur - 1; s++) {
    if ((s + 1) * XS > now) continue;
    const rows = await Promise.all(Array.from({length: XN}, (_, i) => db.ref("rooms/xm" + s + "_e" + i + "/done").get().then(sn => ({i, done: sn.val()}))));
    for (const row of rows) {
      if (typeof row.done === "number" && now >= row.done + X_DROP) await dropOne(db, s, row.i);
    }
  }
  await runExpeditions(db, now);
  await runLiveMarch(db, now);
});

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
