/* 수상한 상인 상자 — 서버 권위.
   흐름: shadypay 잠금 → 골드 판단 → 굴림 → c/gd·보상·통계를 한 번의 update(차감·보상골드 포함) → 결과.
   · 요청: shady/go/{uid}/{reqId} = { ts }
   · 표: js/shop/merchant.js SHADY_* 와 맞춘다.
   · c 통째·accounts 통째 트랜잭션 금지(클라 PATCH 충돌 → err). */
"use strict";

const {ServerValue} = require("firebase-admin/database");
const {accountExists} = require("./write");
const {clpAt} = require("./event-seasons");

const SHADY_COST = 2000;
const SHADY_N = 10;
const SHADY_TIER_P = [0.67, 0.28, 0.04, 0.01];
const SHADY_POOL = [
  [
    {k: "inv", id: "mana", n: 2}, {k: "inv", id: "charm", n: 1}, {k: "inv", id: "map", n: 1},
    {k: "inv", id: "flag", n: 1}, {k: "inv", id: "seal", n: 1}, {k: "inv", id: "hope", n: 1},
    {k: "inv", id: "g2", n: 1}, {k: "gd", n: 50},
    {k: "inv", id: "m_forest", n: 1}, {k: "inv", id: "m_coast", n: 1}, {k: "inv", id: "m_valley", n: 1}
  ],
  [
    {k: "inv", id: "m_shard", n: 2}, {k: "inv", id: "m_herb", n: 2}, {k: "inv", id: "m_ore", n: 2},
    {k: "inv", id: "m_dew", n: 2}, {k: "inv", id: "m_ash", n: 10}, {k: "inv", id: "m_crown", n: 1},
    {k: "gd", n: 500}, {k: "inv", id: "petcan", n: 3}, {k: "inv", id: "m_abyss", n: 2}
  ],
  [
    {k: "inv", id: "g4", n: 3}, {k: "inv", id: "pfcandy", n: 3}, {k: "eggs", n: 2}, {k: "eggsEv", n: 2},
    {k: "gd", n: 5000}, {k: "inv", id: "petfeast", n: 2},
    {k: "inv", id: "trcyan", n: 1}, {k: "inv", id: "trblue", n: 1}, {k: "inv", id: "trcast", n: 1}
  ],
  [
    {k: "inv", id: "prism", n: 1}, {k: "inv", id: "license", n: 1},
    {k: "inv", id: "vtown", n: 1}, {k: "inv", id: "milk", n: 1}
  ]
];

const MAT_IDS = {
  m_forest: 1, m_coast: 1, m_valley: 1, m_shard: 1, m_herb: 1, m_ore: 1,
  m_dew: 1, m_ash: 1, m_crown: 1, m_abyss: 1
};

function shadyKey(reqId) {
  return String(reqId || "").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 64);
}

function liveEggInv(now) {
  const s = clpAt(now == null ? Date.now() : now);
  const inv = s && s.eggInv;
  return inv === "eggsEv" || inv === "eggsEv2" ? inv : null;
}

function readGd(val) {
  const g = Math.floor(Number(val));
  return Number.isFinite(g) ? Math.max(0, g) : 0;
}

function rollOne() {
  let r = Math.random(), acc = 0, ti = SHADY_TIER_P.length - 1;
  for (let i = 0; i < SHADY_TIER_P.length; i++) {
    acc += SHADY_TIER_P[i];
    if (r < acc) { ti = i; break; }
  }
  const pool = SHADY_POOL[ti] || SHADY_POOL[0];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return Object.assign({tier: ti + 1}, pick);
}

function rollPack() {
  const a = [];
  for (let i = 0; i < SHADY_N; i++) a.push(rollOne());
  return a;
}

function slimShow(show) {
  return (show || []).map(r => {
    const o = {
      k: r.k,
      n: Math.max(0, Math.floor(Number(r.n) || 0)),
      tier: Math.max(1, Math.floor(Number(r.tier) || 1))
    };
    if (r.id) o.id = String(r.id).slice(0, 32);
    return o;
  });
}

function tallyShow(show, eggInv) {
  let goldGain = 0, eggs = 0, eggsEv = 0, eggsEv2 = 0, mats = 0, t1 = 0, t4 = 0;
  const invInc = {};
  (show || []).forEach(r => {
    if (!r) return;
    const n = Math.max(0, Math.floor(Number(r.n) || 0));
    if (r.tier === 1) t1++;
    if (r.tier === 4) t4++;
    if (r.k === "gd") { goldGain += n; return; }
    if (r.k === "eggs") { eggs += n; return; }
    if (r.k === "eggsEv") {
      if (eggInv === "eggsEv2") eggsEv2 += n;
      else if (eggInv === "eggsEv") eggsEv += n;
      else eggs += n;
      return;
    }
    if (r.k === "inv" && r.id && String(r.id).indexOf("/") < 0) {
      const id = String(r.id);
      invInc[id] = (invInc[id] || 0) + n;
      if (MAT_IDS[id]) mats += n;
    }
  });
  return {goldGain, eggs, eggsEv, eggsEv2, mats, t1, t4, invInc};
}

/* 1) shadypay 잠금  2) 골드 판단  3) 굴림  4) 골드·보상 한 update  5) 결과 */
async function applyShadyPull(db, uid, reqId) {
  uid = String(uid || "");
  const gk = shadyKey(reqId);
  if (!uid || !gk) return {ok: 0, why: "bad"};
  if (!(await accountExists(db, uid))) return {ok: 0, why: "acc"};

  const root = db.ref("accounts/" + uid);

  /* 1. 영수증 잠금(같은 req 재진입 → dup) */
  const lock = await root.child("shadypay/" + gk).transaction(v => {
    if (v != null && v !== 0) return;
    return 1;
  });
  if (!lock.committed) return {ok: 1, why: "dup", show: null, cost: SHADY_COST};

  const unlock = async () => {
    try { await root.child("shadypay/" + gk).set(null); } catch (e) { /* 잠금 해제 실패 */ }
  };

  /* 2. 골드 판단 */
  const have = readGd((await root.child("c/gd").get()).val());
  if (have < SHADY_COST) {
    await unlock();
    return {ok: 0, why: "gold", cost: SHADY_COST};
  }

  /* 3. 계산 */
  const show = rollPack();
  const eggInv = liveEggInv();
  const pay = tallyShow(show, eggInv);
  const netGd = -SHADY_COST + pay.goldGain;
  const gdAfter = have + netGd;

  /* 4. 차감·보상골드·알·가방·통계를 한 번에 (pex claim 과 동일 패턴) */
  const now = Date.now();
  const bump = {
    "c/gd": ServerValue.increment(netGd),
    ts: now,
    sid: "shady",
    "c/stats/shadyBoxes": ServerValue.increment(show.length)
  };
  if (pay.eggs) bump["c/eggs"] = ServerValue.increment(pay.eggs);
  if (pay.eggsEv) bump["c/eggsEv"] = ServerValue.increment(pay.eggsEv);
  if (pay.eggsEv2) bump["c/eggsEv2"] = ServerValue.increment(pay.eggsEv2);
  Object.keys(pay.invInc).forEach(id => {
    bump["c/inv/" + id] = ServerValue.increment(pay.invInc[id]);
  });
  if (pay.mats) bump["c/stats/mats"] = ServerValue.increment(pay.mats);
  if (pay.t1) bump["c/stats/shadyT1"] = ServerValue.increment(pay.t1);
  if (pay.t4) bump["c/stats/shadyT4"] = ServerValue.increment(pay.t4);
  try {
    const st = Math.max(0, Math.floor(Number((await root.child("c/stats/maxGold").get()).val()) || 0));
    if (gdAfter > st) bump["c/stats/maxGold"] = gdAfter;
  } catch (e) { /* maxGold 생략 */ }

  try {
    await root.update(bump);
  } catch (e) {
    await unlock();
    return {ok: 0, why: "err", cost: SHADY_COST};
  }

  /* 5. 결과 */
  return {ok: 1, show: slimShow(show), cost: SHADY_COST, eggInv: eggInv || ""};
}

module.exports = {
  applyShadyPull,
  SHADY_COST,
  SHADY_N,
  SHADY_TIER_P,
  SHADY_POOL,
  liveEggInv
};
