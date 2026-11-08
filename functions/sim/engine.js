/* 출정 계산. 사건 표는 functions/sim/tables.js(배포 때 scripts/pack-sim.js 가 만듦)를 읽는다.
   사건 글은 data/events, 판정 숫자는 scripts/pack-sim.js, 특성으로 갈라지는 규칙(불굴·번뜩임·예민함·속성)은 이 파일이다. */
"use strict";
const T = require("./tables");
const {EV, VEV, SOLO_EV, BJ, EARTH_P, SCY_CRIT, SOLO_DF, SOLO_DZ, SOLO_EVP, CHOICE_MS, XSTEP, XS, XN, X_STARS, XCLOSE, X_JOIN_GRACE, XMAX, XPL, ABYSS_PL, XDF, VLN} = T;
const {BJ_SOFT, BJ_HARD, BJ_LOW, BT_BASE, BT_STEP, BT_K} = T;
const EVM = {};
EV.concat(SOLO_EV, ...Object.values(VEV)).forEach(x => { EVM[x.id] = x; });

const hs32 = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = seed => { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const seeded = (seed, f) => { const o = Math.random; Math.random = rng(seed); try { return f(); } finally { Math.random = o; } };
const R = n => Math.floor(Math.random() * n);
const vtx = (t, v) => String(t).replace(/\{v\}/g, VLN[v] || "마을");
const fxTxt = x => { const a = []; if (x.ex) a.push("경험치 +" + x.ex); if (x.gd) a.push("골드 " + (x.gd > 0 ? "+" : "") + x.gd); if (x.mm) a.push("마력석 +" + x.mm); if (x.gi) a.push("작은 꽃다발 +" + x.gi); if (x.pw) a.push("이번 출정 전투력 " + (x.pw > 0 ? "+" : "") + x.pw); if (x.bt) a.push(x.bt > 0 ? "전투 +" + x.bt : "전투 " + x.bt); if (x.tc) a.push("다음 재계약 시험 판정 +" + x.tc); if (x.rb) a.push("다음 공명 효과 증가"); if (x.wa) a.push("오늘 하루 무기 +1"); if (x.dh) a.push("절망도 70 이상인 사람만 절망도 " + (x.dh > 0 ? "+" : "") + x.dh); if (x.dz > 0) a.push("절망도 +" + x.dz); if (x.dz < 0) a.push("절망도 " + x.dz); return a.length ? " (" + a.join(", ") + ")" : ""; };
const evCtx = r => { const ps = Object.values(r.pl || {}); return { ps, n: ps.length, at: a => ps.some(p => String(p.a || "").includes(a)), tr: t => ps.some(p => p.t === t), hiDz: ps.some(p => (Number(p.dz) || 0) >= 70) }; };
/* 적정(권장) 전투력·성공 기준치(클라 js/room.js 와 동일).
   권장_i (2026-11 갱신, 반올림) =
     57×i×(df×(0.95−0.1×i)) + 15×df×(randbetween(7,17)×0.1)
   구 권장: (BT_BASE + BT_STEP×i) × df
   T = clamp(15…85, round(50 + BT_K×(P/권장_i − 1)))  ← 유지
   상수 BT_K·BJ_*·XDF.df 는 tables.js(원본 scripts/pack-sim.js). 랜덤은 replay 시드 RNG. */
const recPw = (i, df) => Math.round(57 * i * (df * (0.95 - 0.1 * i)) + 15 * df * ((7 + Math.floor(Math.random() * 11)) * 0.1));
// 구: const battleT = (P, i, df) => Math.max(15, Math.min(85, Math.round(50 + BT_K * (P / ((BT_BASE + BT_STEP * i) * df) - 1))));
const battleT = (P, i, df) => Math.max(15, Math.min(85, Math.round(50 + BT_K * (P / Math.max(1, recPw(i, df)) - 1))));
const battleJ = (n, Th, cd) => n >= BJ_HARD ? 0 : n <= Math.max(1, Math.floor(Th / (cd || 5))) ? 3 : n <= Th ? 2 : n <= Math.min(BJ_HARD - 1, Math.max(BJ_LOW, Th + BJ_SOFT)) ? 1 : 0;

function startSim(room) {
  /* room.pl[uid].p ← 클라 me().p(참가 때 xm 자리). 서버는 전투력을 다시 계산하지 않고 이 값을 쓴다.
     sim.avg = 파티 p 평균(+깃발·협력·스태프). battleT(avg+ab, i, df) 의 P. */
  const ps = Object.values(room.pl), has = t => ps.some(p => p.t === t), solo = ps.length === 1, sum = ps.reduce((a, p) => a + p.p + (solo && p.t === "고독" ? 8 : 0), 0), fl = ps.some(p => p.f), mp = ps.some(p => p.m), co = ps.length >= 2 && has("협력자"), stf = ps.some(p => p.w === 6);
  room.seq = [];
  room.rt = room.rt || room.total;
  if (solo) { room.solo = 1; if (!room.sdf) { room.sdf = 1; room.df = (room.df || 1) * SOLO_DF; room.dzm = (room.dzm || 1) * SOLO_DZ; } room.seq.push("⚔ 고독한 출정: 함께할 동료 없이 홀로 길을 나섰다. 마수들이 혼자인 마법소녀를 노린다. (권장 전투력 ×" + SOLO_DF + ")"); }
  if (mp) { room.total = 3; room.seq.push("마수 사냥 지도를 따라 전투 3번으로 끝나는 길을 골랐다."); }
  if (fl) room.seq.push("용기의 깃발이 펄럭였다. 파티 전원의 전투력이 5 올랐다.");
  if (solo && has("고독")) room.seq.push("홀로 나선 길, 고독이 힘이 되었다. 전투력이 8 올랐다.");
  if (co) room.seq.push("협력자가 파티의 호흡을 맞췄다. 파티 전투력이 3 올랐다.");
  if (stf) room.seq.push("스태프가 큰 마력을 나눠 파티 전투력이 2 올랐다.");
  const psk = id => ps.filter(p => (p.sk || []).includes(id)).length, wt = psk("water"), wd = psk("wind"), dk = psk("dark");
  if (wt) room.seq.push("정화의 물결이 파티를 감쌌다. 이번 출정의 절망도 상승이 줄어든다.");
  if (dk) room.seq.push("그림자 계약이 맺어졌다. 파티 전투력이 8 올랐다.");
  if (wd) room.seq.push("바람의 길잡이가 앞장섰다. 운명이 한 번 파티 편을 든다.");
  room.wsk = wt > 0;
  const twb = Math.max(0, ...ps.map(p => Math.min(5, Number(p.tw) || 0)));
  if (twb) room.seq.push("감시탑이 마수의 움직임을 미리 알려 주었다. 전투 판정 +" + twb + ".");
  if (ps.some(p => p.w === 2)) room.seq.push("낫의 날이 서늘하게 빛난다. 수확의 일격: 대성공이 더 잘 나온다.");
  room.sim = { scy: ps.some(p => p.w === 2), i: 1, ok: true, ev: 0, ex: 0, gx: 0, ab: dk ? 8 : 0, tw: twb, lucky: wd, rev: false, avg: sum / ps.length + (fl ? 5 : 0) + (co ? 3 : 0) + (stf ? 2 : 0) };
  room.pend = null; room.ch = null; room.fin = false;
  simStep(room);
}
function simStep(r) {
  const ps = Object.values(r.pl), has = t => ps.some(p => p.t === t), S = r.sim;
  while (S.i <= r.total && S.ok) {
    const i = S.i, Th = Math.min(90, battleT(S.avg + S.ab, i, r.df || 1) + (S.tw || 0)), J0 = () => battleJ(1 + R(100), Th, S.scy ? SCY_CRIT : 5);
    let j = J0();
    if (j === 0 && !S.rev && has("불굴")) { S.rev = true; r.seq.push("전투 " + i + "/" + r.total + ": 쓰러질 뻔했지만 불굴의 의지로 다시 일어섰다."); j = J0(); }
    if (j === 0 && !S.earth && ps.some(p => String(p.a || "").includes("땅"))) { S.earth = true; if (Math.random() < EARTH_P) { j = 1; r.seq.push("전투 " + i + "/" + r.total + ": 무너질 뻔한 순간, 대지가 솟아올라 파티를 받쳐 주었다."); } }
    const J = BJ[j], jdz = Math.round(J.dz * (J.dz > 0 ? (r.dzm || 1) : 1));
    S.jc = S.jc || [0, 0, 0, 0]; S.jc[j]++; S.ex += J.ex; S.ev += jdz;
    r.seq.push("전투 " + i + "/" + r.total + " · " + J.n + "! " + J.t[R(J.t.length)] + fxTxt({ ex: J.ex, dz: J.dz }));
    S.i++;
    if (j === 0) { S.ok = false; break; }
    if (i < r.total && Math.random() < (has("번뜩임") ? .85 : .6)) {
      const vs = [...new Set(ps.map(p => p.v).concat(r.zv ? [r.zv] : []).filter(v => VEV[v]))];
      const cx = evCtx(r), okE = e => !e.cond || e.cond(cx), pk = list => { const l = list.filter(okE); for (let t = 0; t < 10; t++) { const e = l[R(l.length)]; if (!e.rare || Math.random() < .3) return e; } return l.find(e => !e.rare) || l[0]; };
      let x, v = vs[0] || "A";
      if (r.solo && Math.random() < SOLO_EVP) x = pk(SOLO_EV);
      else if (vs.length && Math.random() < .3) { v = vs[R(vs.length)]; x = pk(VEV[v]); }
      else x = pk(EV);
      r.evs = r.evs || [];
      if (!r.evs.includes(x.id)) r.evs.push(x.id);
      if (x.o) { r.pend = { id: x.id, v }; return; }
      applyEv(r, x, v);
    }
  }
  const jc = S.jc || [0, 0, 0, 0];
  r.seq.push("판정 결과: 대성공 " + jc[3] + " · 성공 " + jc[2] + " · 실패 " + jc[1] + " · 대실패 " + jc[0]);
  r.seq.push(S.ok ? "토벌 완료! 파티가 무사히 돌아왔다." : "토벌 실패. 파티가 후퇴했다.");
  r.ok = S.ok; r.ev = S.ev; r.ex = S.ex; r.gx = S.gx;
  r.fx = { mm: S.mm || 0, gi: S.gi || 0, tc: S.tc || 0, rb: S.rb || 0, wa: S.wa || 0, wp: S.wp || 0, dh: S.dh || 0 };
  r.fin = true;
}
function applyEv(r, x, v) {
  const ps = Object.values(r.pl), has = t => ps.some(p => p.t === t), S = r.sim, fl = has("번뜩임");
  if (x.trap && has("예민함")) { r.seq.push("예민한 감각으로 위험을 미리 알아채 피했다."); return; }
  const ex = (x.ex || 0) * (fl ? 2 : 1);
  let tx = vtx(x.t, v);
  if (tx.includes("{f}")) tx = tx.replace(/\{f\}/g, "이름 모를 마법소녀");
  r.seq.push(tx + fxTxt(Object.assign({}, x, { ex })) + (x.ex && fl ? " (번뜩임: 경험치 2배)" : ""));
  S.ev += x.dz || 0; S.ex += ex; S.gx += x.gd || 0; S.ab += x.pw || 0;
  S.mm = (S.mm || 0) + (x.mm || 0); S.gi = (S.gi || 0) + (x.gi || 0); S.tc = Math.max(S.tc || 0, x.tc || 0);
  if (x.rb) S.rb = 1; if (x.wa) S.wa = 1; if (x.wpile) S.wp = 1; S.dh = (S.dh || 0) + (x.dh || 0);
  if (x.bt) r.total = Math.max(S.i - 1, r.total + x.bt);
}
function resolveChoice(r, picks) {
  const x = EVM[r.ch.id], v = r.ch.v;
  if (!x) { r.ch = null; r.pend = null; simStep(r); return; }
  const ops = (r.ch.ops && r.ch.ops.length) ? r.ch.ops : x.o.map((_, i) => i);
  picks = (picks || []).filter(p => ops.includes(p));
  const cnt = ops.map(i => picks.filter(p => p === i).length), mx = Math.max(...cnt), top = ops.filter((i, j) => cnt[j] === mx), pick = top[R(top.length)], o = x.o[pick];
  r.seq.push(vtx(x.q, v));
  r.seq.push("선택: " + o.l + (picks.length ? " (" + picks.filter(p => p === pick).length + "표)" : " (아무도 고르지 않아 운명에 맡겼다)"));
  let out = o.r;
  if (out.p != null) { if ((r.sim.lucky || 0) > 0) { r.sim.lucky--; r.seq.push("바람의 길잡이가 운명을 바꾸었다."); out = out.win; } else out = Math.random() < out.p ? out.win : out.lose; }
  applyEv(r, out, v); r.ch = null; r.pend = null; simStep(r);
}

function shownCount(r, now) {
  const seq = r.seq || [];
  if (!r || r.st === "lobby") return 0;
  if (r.st === "done") return seq.length;
  if (typeof r.phaseAt !== "number") return Math.min(seq.length, r.step || 0);
  const from = r.segFrom || 0;
  return Math.min(seq.length, Math.max(from, from + Math.floor(Math.max(0, now - r.phaseAt) / XSTEP)));
}
function choiceOf(r, now) {
  if (r.ch && typeof r.ch.until === "number") return r.ch;
  if (!r.pend || !EVM[r.pend.id]) return null;
  const x = EVM[r.pend.id], cx = evCtx(r), ops = x.o.map((o, i) => i).filter(i => !x.o[i].req || x.o[i].req(cx)), h = (cx.tr("번뜩임") || cx.tr("예민함")) ? x.o.findIndex(o => o.ok) : -1;
  const seq = r.seq || [], from = r.segFrom || 0, at = typeof r.phaseAt === "number" ? r.phaseAt : now;
  return { id: r.pend.id, v: r.pend.v, k: seq.length, until: at + (seq.length - from) * XSTEP + CHOICE_MS, ops, h };
}
function roomView(r, now) {
  const seq = r.seq || [], shown = shownCount(r, now);
  if (!r || r.st === "lobby") return { mode: "lobby", shown: 0 };
  if (r.st === "done") return { mode: "done", shown: seq.length };
  if (shown < seq.length) return { mode: "lines", shown };
  if (r.pend && !r.fin) { const ch = choiceOf(r, now), until = ch ? ch.until : now + CHOICE_MS; return now < until ? { mode: "choice", shown, until, ch } : { mode: "resolve", shown, until, ch }; }
  if (r.fin) { const at = typeof r.phaseAt === "number" ? r.phaseAt : now; return { mode: "finish", shown, until: at + (seq.length - (r.segFrom || 0)) * XSTEP }; }
  return { mode: "lines", shown };
}
function catchUp(cur, picks, k, now) {
  let first = true, changed = false;
  for (let n = 0; n < 12; n++) {
    const v = roomView(cur, now);
    if (v.mode === "lines" || v.mode === "choice" || v.mode === "done") break;
    if (v.mode === "finish") { cur.st = "done"; cur.doneAt = now; changed = true; break; }
    if (v.mode !== "resolve") break;
    if (first && (cur.seq || []).length !== k) return null;
    const from = (cur.seq || []).length, until = v.until;
    if (!cur.ch) { const ch = choiceOf(cur, now); if (!ch) { cur.pend = null; simStep(cur); } else cur.ch = ch; }
    if (cur.ch) resolveChoice(cur, first ? picks || [] : []);
    cur.phaseAt = until; cur.segFrom = from; cur.ch = null; first = false; changed = true;
  }
  if (!changed) return null;
  cur.ts = now;
  return cur;
}
function marchChoice(room, now) {
  const v = roomView(room, now);
  return v.mode === "resolve" ? v.ch || null : null;
}
function stepMarch(room, picks, now) {
  if (!room || room.st !== "run") return null;
  if (!(room.seq || []).length) {
    if (!room.total) room.total = 3;
    startSim(room);
    if (typeof room.phaseAt !== "number") room.phaseAt = now;
    room.segFrom = room.segFrom || 0;
    room.ts = now;
    return room;
  }
  return catchUp(room, picks, (room.seq || []).length, now);
}

function xGrades(s) {
  const base = Array.isArray(X_STARS) && X_STARS.length === XN ? X_STARS : [1, 1, 2, 2, 2, 3, 3, 3, 4, 4];
  const a = base.slice(), g = rng(hs32("xg" + s));
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(g() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function isAbyss(s, i) { return xGrades(s)[i] === 4; }
function expeditionInfo(s, i) {
  const id = "x" + s + "_" + i, g = rng(hs32(id)), p = n => Math.floor(g() * n), v = "ABCD"[p(4)], d = xGrades(s)[i], ab = d === 4;
  p(XPL.length); const t = 3 + p(3);
  return { id, s, i, v, d, total: ab ? 5 : t, T0: (s + 1) * XS, close: (s + 1) * XS - XCLOSE };
}
function partyIds(info, seat) {
  const jtOf = v => typeof (v && v.jt) === "number" ? v.jt : 0;
  const grace = typeof X_JOIN_GRACE === "number" ? X_JOIN_GRACE : 5000;
  const until = info.close + grace;
  return Object.keys(seat || {}).filter(u => seat[u] && typeof seat[u] === "object" && jtOf(seat[u]) <= until).sort((a, b) => jtOf(seat[a]) - jtOf(seat[b]) || (a < b ? -1 : 1)).slice(0, XMAX);
}
/* prevWait: 같은 c 의 기존 wait. 있으면 Ws/Wd 를 그대로 쓴다(연장·재오픈 금지).
   새 wait 는 최초 write 시에만 Wd = now + CHOICE_MS (실시계 15초). */
function replayExpedition(info, pl, picks, now, pc, prevWait) {
  const r = { code: info.id, pl: {}, total: info.total, seq: [], evs: [], df: XDF[info.d].df, rw: XDF[info.d].rw, dzm: XDF[info.d].dz || 1, ab: info.d === 4 ? 1 : 0, zv: info.v };
  Object.keys(pl || {}).forEach(u => { r.pl[u] = pl[u]; });
  const L = [];
  let wait = null;
  const wall = typeof now === "number" && Number.isFinite(now) ? now : Date.now();
  /* pc = 이미 집계·확정된 선택 수. picks 칸이 RTDB 에서 비어도 같은 c 로 다시 wait 하지 않는다. */
  let resolved = typeof pc === "number" && Number.isFinite(pc) ? Math.max(0, Math.floor(pc)) : -1;
  if (resolved < 0) {
    resolved = 0;
    const src = picks || [];
    for (let i = 0; i < src.length; i++) if (src[i] != null) resolved = i + 1;
  }
  seeded(hs32(info.id + "#sim"), () => {
    startSim(r);
    let c = 0;
    while (r.pend && !r.fin) {
      const xe = EVM[r.pend.id];
      if (!xe) { r.pend = null; simStep(r); continue; }
      const cx = evCtx(r), ops = xe.o.map((o, i) => i).filter(i => !xe.o[i].req || xe.o[i].req(cx)), h = (cx.tr("번뜩임") || cx.tr("예민함")) ? xe.o.findIndex(o => o.ok) : -1;
      L.push(r.seq.length);
      if (c >= resolved) {
        let Ws, Wd;
        if (prevWait && Number(prevWait.c) === c && typeof prevWait.Wd === "number") {
          Ws = prevWait.Ws; Wd = prevWait.Wd;
        } else {
          Wd = wall + CHOICE_MS;
          Ws = Wd - CHOICE_MS;
        }
        r.ch = { id: r.pend.id, v: r.pend.v, k: c, until: Wd, ops, h };
        wait = { c, Ws, Wd };
        break;
      }
      r.ch = { id: r.pend.id, v: r.pend.v, k: c, until: wall, ops, h };
      const raw = picks && picks[c];
      const ballots = Array.isArray(raw) ? raw : (raw == null ? [] : [raw].flatMap(x => typeof x === "number" ? [x] : []));
      resolveChoice(r, ballots);
      c++;
    }
  });
  const lineAt = j => info.T0 + (j + 1) * XSTEP + CHOICE_MS * L.filter(l => l <= j).length;
  const lines = [];
  for (let j = 0; j < r.seq.length; j++) lines.push(lineAt(j));
  return { r, wait, lineAt: lines, done: !!r.fin && !wait, endAt: lineAt(Math.max(0, r.seq.length - 1)) + 800, picks: picks || [], pc: resolved };
}

function marchDue(room, now) {
  if (!room || room.st !== "run") return null;
  if (!(room.seq || []).length) return now;
  if (room.pend && !room.fin) {
    const ch = choiceOf(room, now);
    if (ch && ch.until > now) return ch.until;
    return now;
  }
  if (room.fin) {
    const at = typeof room.phaseAt === "number" ? room.phaseAt : now;
    const until = at + ((room.seq || []).length - (room.segFrom || 0)) * XSTEP;
    return until > now ? until : now;
  }
  return now + 60000;
}

module.exports = { stepMarch, marchChoice, marchDue, expeditionInfo, partyIds, replayExpedition };
