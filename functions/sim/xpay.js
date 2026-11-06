/* 매지컬 마치 서버 지급 훅.
   계정 PATCH 는 functions/account. 산식·원장·호출만.
   지급: 경제·재료·단서·절망·전 fx·깃발/지도/스킬 소모·펫 XP·알·수집가/까마귀/고독 마력석.
   배율: boost.js. 원장 rooms/xr…/pay/{uid}. 배포: 신클라 먼저 → Functions. */
const acc = require("../account");

const SOLO_M = 1, SOLO_RW_G = 40;
const PARTY_M = [0, .6, .7, .8, .87, .93, .97, 1];
const VL_X = {A: 1.15, B: 1, C: 1, D: 1.3};

function corePay(r, uid, seedKey, now, boost) {
  if (!r || !r.pl || !r.pl[uid]) return null;
  const pl = r.pl;
  const n = Object.keys(pl).length;
  const m = (n === 1 && r.solo ? SOLO_M : (PARTY_M[n] || 1)) * (Number(r.rw) || 1);
  const base = Number(r.rt) || Number(r.total) || 0;
  const seat = pl[uid] || {};
  const vx = VL_X[seat.v] != null ? VL_X[seat.v] : 1;
  const gx = Number(r.gx) || 0;
  const gMul = Math.max(0, Number(boost && boost.gMul) || 1);
  const exMul = Math.max(0, Number(boost && boost.exMul) || 1);
  let g = 0, ex = 0, cl = 0;
  if (r.ok) {
    g = Math.round((30 + 10 * base) * m);
    if (seat.t === "행운") g = Math.round(g * 1.1);
    g = Math.round(g * gMul);
    g += gx;
    if (r.solo) g += SOLO_RW_G;
    ex = Math.round(((30 + 10 * base) * vx * m + (Number(r.ex) || 0)) * exMul);
    cl = 1;
  } else {
    g = 5 + gx;
    ex = Math.round((8 + (Number(r.ex) || 0)) * exMul);
  }
  const rand = acc.rng(acc.seedHash(String(seedKey || "") + "|" + uid));
  const inv = acc.rollMats(acc.marchDropTables(r), seat.v, rand);
  const clp = acc.rollClp(!!r.ok, now, rand);
  const side = acc.marchSide(r, seat, (boost && boost.c) || {}, boost || {}, rand, now);
  if (side.mm) inv.mana = (inv.mana || 0) + side.mm;
  if (side.gi) inv.g1 = (inv.g1 || 0) + side.gi;
  if (side.gAdd) g += side.gAdd;
  if (side.exAdd) ex += side.exAdd;
  const day = acc.todayStr(now);
  return {
    g: Math.max(0, g),
    ex: Math.max(0, ex),
    cl,
    inv,
    clp,
    dz: side.dz || 0,
    tc: side.tc || 0,
    charm: side.charm || 0,
    rb: side.rb || 0,
    wa: side.wa || 0,
    wp: side.wp || 0,
    wpn: side.wpn || "",
    dh: side.dh || 0,
    day: side.wa ? day : day,
    flag: side.flag || 0,
    map: side.map || 0,
    sk: side.sk || [],
    skNm: side.skNm || [],
    petXp: side.petXp || 0,
    egg: side.egg || 0,
    eggEv: side.eggEv || 0,
    collector: side.collector || 0,
    crow: side.crow || 0,
    soloM: side.soloM || 0
  };
}

function payHas(amt) {
  if (!amt) return false;
  if (amt.g > 0 || amt.ex > 0 || amt.cl > 0 || amt.clp > 0) return true;
  if (amt.dz || amt.tc || amt.charm || amt.rb || amt.wa || amt.wp || amt.dh) return true;
  if (amt.flag || amt.map || amt.petXp || amt.egg || amt.eggEv) return true;
  if (amt.sk && amt.sk.length) return true;
  return !!(amt.inv && Object.keys(amt.inv).some(k => amt.inv[k] > 0));
}

async function grantMarchCore(db, s, i, doc) {
  if (!doc || !doc.done || doc.empty || !doc.r || !doc.r.pl) return;
  const ids = Object.keys(doc.r.pl).filter(u => u && !String(u).startsWith("bot"));
  const seedKey = (doc.r && doc.r.code) || ("x" + s + "_" + i);
  const now = Date.now();
  const cache = {};
  for (const uid of ids) {
    const seat = doc.r.pl[uid] || {};
    let boost = {gMul: 1, exMul: 1, c: {}};
    try {
      boost = await acc.loadMarchBoost(db, uid, seat, now, cache);
    } catch (e) { /* 배수 없이 기본 지급 */ }
    const amt = corePay(doc.r, uid, seedKey, now, boost);
    if (!payHas(amt)) continue;
    const payRef = db.ref("rooms/xr" + s + "_" + i + "/pay/" + uid);
    let claimed = false;
    const body = Object.assign({}, amt, {at: now, ok: 0});
    try {
      const tx = await payRef.transaction(cur => {
        if (cur && (cur.ok === 1 || cur.ok === true)) return;
        if (cur && cur.ok === 0 && now - (Number(cur.at) || 0) < 60000) return;
        return body;
      });
      claimed = !!(tx && tx.committed);
    } catch (e) { continue; }
    if (!claimed) continue;
    try {
      const ok = await acc.applyMarchPay(db, uid, amt);
      if (!ok) { await payRef.set(null); continue; }
      await payRef.update({ok: 1});
    } catch (e) {
      try { await payRef.set(null); } catch (e2) { /* ignore */ }
    }
  }
}

module.exports = {grantMarchCore, corePay, lvOf: acc.lvOf};
