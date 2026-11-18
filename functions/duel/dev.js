/* 대련 이벤트 점수·순위 보상 (서버 권위).
   클라 data/game.js DEV 와 id·기간·점수·보상을 맞춘다. 바꾸면 여기도 같이.
   · 점수: duel/q/{uid}/{mid} 요청 → c/dev · duel/score · duel/roster.ev
   · 보상: duel/claim/{uid} 요청 → 골드/마력석 · c/cmp · c/devRw · note
   배포: firebase deploy --only functions:duelDevScore,functions:duelDevClaim,database */
"use strict";

const {ServerValue} = require("firebase-admin/database");
const {todayStr} = require("../account/boost");

const DEV = {
  id: "duel-ev-20261207",
  nm: "대련 이벤트",
  t0: Date.parse("2026-11-30T00:00:00+09:00"),
  t1: Date.parse("2026-12-08T00:00:00+09:00"),
  PAIR: 2,
  GRACE: 3600000,
  PT: {w: 3, d: 2, l: 1},
  RW: [
    {g: 1500, m: 15},
    {g: 1000, m: 10},
    {g: 700, m: 7},
    {g: 500, m: 5},
    {g: 300, m: 3}
  ],
  JOIN: {n: 3, g: 100}
};

function devOn(now) {
  now = now == null ? Date.now() : now;
  return now >= DEV.t0 && now < DEV.t1;
}

function ptOf(win) {
  const w = Number(win);
  if (w > 0) return DEV.PT.w;
  if (w < 0) return DEV.PT.l;
  return DEV.PT.d;
}

function normalizeNt(cur) {
  if (Array.isArray(cur)) return cur.filter(n => n && typeof n === "object");
  if (cur && typeof cur === "object") {
    return Object.keys(cur).sort((a, b) => Number(a) - Number(b) || String(a).localeCompare(String(b)))
      .map(k => cur[k]).filter(n => n && typeof n === "object");
  }
  return [];
}

async function pushNote(root, text) {
  const t = String(text || "").slice(0, 160);
  if (!t) return;
  const entry = {k: "duel", t, u: "", ts: Date.now(), r: false};
  await root.child("c/nt").transaction(cur => [entry].concat(normalizeNt(cur)).slice(0, 60));
}

/* 대련 한 판 점수. mid 당 1회. PAIR·기간은 서버만. */
async function applyDevScore(db, uid, mid, body) {
  const now = Date.now();
  if (!devOn(now)) return {ok: 0, why: "off"};
  mid = String(mid || "").replace(/[\/.#$\[\]]/g, "").slice(0, 80);
  const opp = String((body && body.o) || "").replace(/[\/.#$\[\]]/g, "").slice(0, 64);
  const win = Number(body && body.win);
  if (!uid || !mid || !opp || opp === uid || !Number.isFinite(win)) return {ok: 0, why: "bad"};

  const paid = db.ref("duel/paid/" + uid + "/" + mid);
  if ((await paid.get()).exists()) return {ok: 1, why: "dup"};

  const scoreRef = db.ref("duel/score/" + uid);
  const day = todayStr(now);
  let added = 0;
  const tx = await scoreRef.transaction(cur => {
    const base = cur && cur.id === DEV.id
      ? {
          id: DEV.id,
          pt: Math.max(0, Number(cur.pt) || 0),
          w: Math.max(0, Number(cur.w) || 0),
          n: Math.max(0, Number(cur.n) || 0),
          t: Number(cur.t) || 0,
          pp: cur.pp && typeof cur.pp === "object" ? Object.assign({}, cur.pp) : {}
        }
      : {id: DEV.id, pt: 0, w: 0, n: 0, t: 0, pp: {}};
    if (base.pp.d !== day) base.pp = {d: day};
    const used = Math.max(0, Number(base.pp[opp]) || 0);
    if (used >= DEV.PAIR) return;
    base.pp[opp] = used + 1;
    added = ptOf(win);
    base.pt += added;
    base.n += 1;
    if (win > 0) base.w += 1;
    base.t = now;
    return base;
  });

  if (!tx.committed) {
    await paid.set(1).catch(() => {});
    return {ok: 1, why: "pair"};
  }
  const sc = tx.snapshot.val() || {};
  await paid.set(1).catch(() => {});

  const root = db.ref("accounts/" + uid);
  const exists = (await root.child("c/n").get()).exists() || (await root.child("c/ex").get()).exists();
  if (exists) {
    await root.update({
      "c/dev": {
        id: DEV.id,
        pt: Math.max(0, Number(sc.pt) || 0),
        w: Math.max(0, Number(sc.w) || 0),
        n: Math.max(0, Number(sc.n) || 0),
        t: Number(sc.t) || now,
        pp: sc.pp || {d: day}
      },
      ts: now,
      sid: "dev"
    }).catch(() => {});
  }

  const ev = {
    id: DEV.id,
    pt: Math.max(0, Number(sc.pt) || 0),
    w: Math.max(0, Number(sc.w) || 0),
    n: Math.max(0, Number(sc.n) || 0),
    t: Number(sc.t) || now
  };
  await db.ref("duel/roster/" + uid).update({ev}).catch(() => {});
  await db.ref("players/" + uid).update({ev}).catch(() => {});

  return {ok: 1, pt: added, total: ev.pt};
}

/* 순위 보상. DEV.t1+GRACE 이후 1회. 순위는 duel/roster.ev 기준. */
async function applyDevClaim(db, uid, body) {
  const now = Date.now();
  if (now < DEV.t1 + DEV.GRACE) return {ok: 0, why: "early"};
  const id = String((body && body.id) || DEV.id);
  if (id !== DEV.id) return {ok: 0, why: "id"};

  const root = db.ref("accounts/" + uid);
  const cmpKey = "c/cmp/" + DEV.id + "-rw";
  const had = await root.child(cmpKey).get();
  if (had.exists() && had.val()) {
    const prev = (await root.child("c/devRw").get()).val();
    return {ok: 1, why: "dup", rw: prev};
  }

  const mineSnap = await db.ref("duel/score/" + uid).get();
  const mine = mineSnap.exists() ? mineSnap.val() : null;
  if (!mine || mine.id !== DEV.id || !(Number(mine.n) > 0)) {
    await root.update({[cmpKey]: -1, ts: now, sid: "dev"}).catch(() => {});
    return {ok: 1, why: "none"};
  }

  const sn = await db.ref("duel/roster").get();
  const L = [];
  sn.forEach(c => {
    const p = c.val() || {};
    const ev = p.ev;
    if (ev && ev.id === DEV.id && Number(ev.pt) > 0) {
      L.push({
        u: c.key,
        pt: Number(ev.pt) || 0,
        w: Number(ev.w) || 0,
        n: Number(ev.n) || 0,
        t: Number(ev.t) || 0
      });
    }
  });
  /* score 칸이 roster 보다 앞설 수 있어 내 점수는 score 로 맞춘다. */
  const meIdx = L.findIndex(x => x.u === uid);
  const meRow = {
    u: uid,
    pt: Number(mine.pt) || 0,
    w: Number(mine.w) || 0,
    n: Number(mine.n) || 0,
    t: Number(mine.t) || 0
  };
  if (meIdx >= 0) L[meIdx] = meRow;
  else if (meRow.pt > 0) L.push(meRow);
  L.sort((a, b) => b.pt - a.pt || b.w - a.w || a.t - b.t);
  const i = L.findIndex(x => x.u === uid);
  const rk = i + 1;

  const bump = {[cmpKey]: now, ts: now, sid: "dev"};
  const got = [];
  let g = 0, m = 0;
  if (rk >= 1 && rk <= DEV.RW.length) {
    const r = DEV.RW[rk - 1];
    g += Math.max(0, Number(r.g) || 0);
    m += Math.max(0, Number(r.m) || 0);
    got.push(rk + "위 보상: 골드 " + r.g + (r.m ? ", 마력석 " + r.m : ""));
    bump["c/devR"] = rk;
  }
  if ((Number(mine.n) || 0) >= DEV.JOIN.n) {
    g += Math.max(0, Number(DEV.JOIN.g) || 0);
    got.push("참가 보상: 골드 " + DEV.JOIN.g);
  }
  if (g > 0) bump["c/gd"] = ServerValue.increment(g);
  if (m > 0) bump["c/inv/mana"] = ServerValue.increment(m);

  const rw = {
    id: DEV.id,
    rk,
    pt: Number(mine.pt) || 0,
    got,
    g,
    m,
    ts: now
  };
  bump["c/devRw"] = rw;

  await root.update(bump);
  if (got.length) {
    await pushNote(root, DEV.nm + " 결과 " + (rk ? rk + "위" : "") + " · " + got.join(" · "));
  }
  return {ok: 1, rw};
}

module.exports = {DEV, applyDevScore, applyDevClaim, devOn};
