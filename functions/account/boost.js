/* 마치 서버 지급 배율·부가(절망 포함). 클라 settle 산식과 맞추되, 실행은 서버 applyMarchPay 만.
   클라가 같은 식으로 gain 하면 이중 반영이므로 js/march xGrant 는 serverPay 로 산식을 끈다.
   시설: vfac/{v}/{k}.lv 또는 sum→FAC_LV. 펫: accounts/.../c/pet+pets. 재해: 슬롯 시드+tally/dr. */
"use strict";

const FAC_LV = [300, 800, 1600, 3000, 5000];
const WF_LV = [20000, 50000, 100000, 180000, 300000];
const WF_SHARE = .12;
const WF_EXP = .05;
const WF_GOLD = .05;
const WF_CALM = .05;
const WAND_EX = .08;
const SCY_DZ = 2;
const PET_LV = [0, 20, 50, 90, 140];
const DIS = ["fire", "flood", "storm", "quake", "frost", "eclipse"];
const DIS_MS = 6 * 3600000;
const DIS_P = .6;
const DIS_GOAL = 12;
const VL = ["A", "B", "C", "D"];
const VL_DZ = {A: 0, B: 0, C: 0, D: 6};
const RN_MAX = 5;

function hs32(str) {
  let h = 2166136261 >>> 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function facLvOf(pts) {
  const n = Math.max(0, Number(pts) || 0);
  return FAC_LV.filter(t => n >= t).length;
}
function facLvFromRec(rec) {
  if (!rec || typeof rec !== "object") return 0;
  if (typeof rec.lv === "number" && rec.lv >= 0) return Math.min(FAC_LV.length, Math.floor(rec.lv));
  return facLvOf(rec.sum);
}

function petLv(q) {
  if (!q) return 0;
  const xp = Number(q.xp) || 0;
  return PET_LV.filter(n => xp >= n).length;
}
function petCur(c) {
  if (!c || !Array.isArray(c.pets)) return null;
  const id = c.pet;
  return c.pets.find(q => q && q.id === id) || null;
}
/* gd/ex 만. 클라 js/pet/effect.js 와 동일. */
function petEff(q, k) {
  if (!q) return 0;
  const L = petLv(q), sp = q.sp;
  if (k === "ex") return sp === "rabbit" ? .02 * L : sp === "hope" ? .02 * L : 0;
  if (k === "gd") return sp === "sparrow" ? .02 * L : sp === "hope" ? .02 * L : sp === "dragon" ? .03 * L : 0;
  if (k === "dz") return sp === "jelly" ? .02 * L : sp === "hope" ? .02 * L : 0;
  if (k === "mana") return sp === "crow" ? .03 * L : 0;
  return 0;
}
function hasAttr(seat, c, name) {
  if (attrsOf(c).includes(name)) return true;
  return String((seat && seat.a) || "").includes(name);
}
function armedItem(c, id) {
  if (!c || !id || !c.arm || !c.arm[id]) return false;
  return Math.max(0, Number((c.inv || {})[id]) || 0) > 0;
}
function armedCharm(c) {
  return armedItem(c, "charm");
}
const PET_XP_RUN = 1;
const PET_DROP_X = .02;
const PET_EV = {from: Date.UTC(2026, 9, 31, 15), to: Date.UTC(2026, 10, 14, 15)};
const SOLO_RW_MP = .5;
const COLLECTOR_P = .3;
const SK_NM = {water: "정화의 물결", wind: "바람의 길잡이", dark: "그림자 계약"};
const PET_XP_CAP = PET_LV[PET_LV.length - 1];
function petEvOn(now) {
  const t = now == null ? Date.now() : now;
  return t >= PET_EV.from && t < PET_EV.to;
}

/* 클라 today() 와 같은 날짜 문자열. 서버는 KST(+9) 기준. */
function todayStr(now) {
  const d = new Date((now == null ? Date.now() : now) + 9 * 3600000);
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");
}
/* 무기 더미 표. 클라 settle fx.wp 와 동일. */
const WP_PILE = [
  ["칼", {ex: 10}], ["총", {gd: 20}], ["낫", {ex: 15}], ["방패", {dz: -8}],
  ["오브", {dz: -5}], ["완드", {ex: 12}], ["스태프", {mm: 1}]
];
function wpPile(wpIdx) {
  const i = Number(wpIdx);
  if (i >= 0 && i < WP_PILE.length) return WP_PILE[i];
  return ["맨손", {gd: 10}];
}
/* gain() 절망 보정. */
function gainDzMod(dz, seat, c, boost) {
  let d = dz;
  const title = (seat && seat.t) || (c && c.t) || "";
  if (c && c.fall && d < 0) d = 0;
  if (d > 0) {
    if (title === "냉정") d *= .8;
    if (title === "상처 입은 마음") d *= 1.2;
  }
  if (d < 0 && title === "낙천") d *= 1.3;
  if (d > 0) {
    d *= 1 - .04 * rnLv(c && c.rn, "calm");
    if ((boost && boost.wfl || 0) >= 3) d *= 1 - WF_CALM;
    d *= 1 - petEff(petCur(c), "dz");
  }
  if (d > 0 && hasAttr(seat, c, "물")) d = Math.max(1, Math.round(d * .75));
  else d = Math.round(d);
  return d;
}
/* gain() 경험 보정(wx·상처 제외). 무기 더미 경험용. */
function gainExMod(ex, seat, c) {
  if (!(ex > 0)) return 0;
  let e = ex;
  e *= 1 + .04 * rnLv(c && c.rn, "wis");
  if (((seat && seat.t) || (c && c.t) || "") === "끈기") e *= 1.2;
  if (c && c.fall) e = 0;
  if (hasAttr(seat, c, "바람")) e = Math.round(e * 1.15);
  else e = Math.round(e);
  return Math.max(0, e);
}

/* 출정 부가 전체. 클라 settle 과 맞춤.
   fx·절망 + 깃발/지도/스킬 소모 + 펫 XP·알 + 수집가/까마귀/고독 마력석.
   rand 는 출정·uid 시드(재시도 동일). */
function marchSide(r, seat, c, boost, rand, now) {
  seat = seat || {};
  c = c || {};
  boost = boost || {};
  const roll = typeof rand === "function" ? rand : Math.random;
  const fx = (r && r.fx) || {};
  let mm = Math.max(0, Math.floor(Number(fx.mm) || 0));
  const gi = Math.max(0, Math.floor(Number(fx.gi) || 0));
  const tc = Math.max(0, Math.floor(Number(fx.tc) || 0));
  const rb = fx.rb ? 1 : 0;
  const wa = fx.wa ? 1 : 0;
  const title = seat.t || c.t || "";
  const gdGuard = title === "수호" ? 4 : 0;
  const wp = seat.w != null ? Number(seat.w) : Number(c.wp);
  const sc = wp === 2 ? SCY_DZ : 0;
  const msk = Array.isArray(seat.sk) ? seat.sk.filter(id => SK_NM[id]) : [];
  const dkz = msk.includes("dark") ? 6 : 0;
  const wtz = r && r.wsk ? 5 : 0;
  const village = seat.v || c.v || "";
  const vDz = VL_DZ[village] != null ? VL_DZ[village] : 0;
  const water = hasAttr(seat, c, "물");
  const charm = armedCharm(c);
  /* 좌석에 깃발·지도가 찍혀 있으면 소모(시뮬에 이미 반영됨). 인벤이 없으면 장착만 해제. */
  const flag = seat.f ? 1 : 0;
  const map = seat.m ? 1 : 0;
  let raw;
  if (r && r.ok) {
    raw = Math.max(0, (Number(r.ev) || 0) + vDz + (Number(r.total) || 0) * 3 - gdGuard + sc - wtz + dkz);
  } else {
    raw = Math.max(0, (wp === 3 ? 12 : 25) - gdGuard + sc - wtz + dkz);
  }
  if (charm && raw > 0) raw = raw * (water ? 2 / 3 : .5);
  let dz = gainDzMod(raw, seat, c, boost);
  let gAdd = 0, exAdd = 0;
  let wpn = "", wpOn = 0, dh = 0;
  if (fx.wp) {
    const pile = wpPile(wp);
    wpn = pile[0];
    wpOn = 1;
    const e = pile[1] || {};
    if (e.gd) gAdd += Math.round(Number(e.gd) || 0);
    if (e.mm) mm += Math.max(0, Math.floor(Number(e.mm) || 0));
    if (e.ex) exAdd += gainExMod(Number(e.ex) || 0, seat, c);
    if (e.dz) dz += gainDzMod(Number(e.dz) || 0, seat, c, boost);
  }
  if (fx.dh && (Number(seat.dz) || 0) >= 70) {
    dh = Math.round(Number(fx.dh) || 0);
    dz += gainDzMod(dh, seat, c, boost);
  }
  let petXp = 0, egg = 0, eggEv = 0, collector = 0, crow = 0, soloM = 0;
  if (r && r.ok) {
    if (petCur(c)) petXp = PET_XP_RUN;
    if (title === "수집가" && roll() < COLLECTOR_P) { mm++; collector = 1; }
    const manaP = petEff(petCur(c), "mana");
    if (manaP && roll() < manaP) { mm++; crow = 1; }
    if (r.solo && roll() < SOLO_RW_MP) { mm++; soloM = 1; }
    if (roll() < PET_DROP_X) egg = 1;
    if (petEvOn(now) && roll() < PET_DROP_X) eggEv = 1;
  }
  return {
    dz, mm, gi, tc, charm: charm ? 1 : 0,
    rb, wa, wp: wpOn, wpn, dh, gAdd, exAdd,
    flag, map, sk: msk, skNm: msk.map(id => SK_NM[id]),
    petXp, egg, eggEv, collector, crow, soloM
  };
}

function disSlot(t) {
  return Math.floor((t / 3600000 + 9) / 6);
}
function disInfo(sl) {
  const id = "d" + sl;
  const g = rng(hs32(id));
  const r = g();
  const v = VL[Math.floor(g() * 4)];
  const k = DIS[Math.floor(g() * DIS.length)];
  const T0 = (sl * 6 - 9) * 3600000;
  return r < DIS_P ? {id, sl, v, k, T0, T1: T0 + DIS_MS} : null;
}
function disLive(now, ptsMap) {
  const t = now == null ? Date.now() : now;
  const x = disInfo(disSlot(t));
  if (!x || t < x.T0 || t >= x.T1) return null;
  const pts = Math.max(0, Number((ptsMap && ptsMap[x.id]) || 0) || 0);
  if (pts >= DIS_GOAL) return null;
  return x;
}
/* 내 마을 재해 키. 없으면 "". */
function disMine(now, village, ptsMap) {
  const x = disLive(now, ptsMap);
  return x && x.v === village ? x.k : "";
}

function wfLvOf(d) {
  if (!d || !(Number(d.sum) >= 0)) return 0;
  let l = 0;
  for (const T of WF_LV) {
    if (d.sum < T || !VL.every(k => (d.v[k] || 0) >= T * WF_SHARE)) break;
    l++;
  }
  return l;
}
function wfPack(wf) {
  if (!wf || typeof wf.sum !== "number") return null;
  return {
    sum: Number(wf.sum) || 0,
    v: {A: Number(wf.A) || 0, B: Number(wf.B) || 0, C: Number(wf.C) || 0, D: Number(wf.D) || 0}
  };
}
function wfLvFrom(pack, wfl) {
  const live = pack ? wfLvOf(pack) : 0;
  if (pack && Number(pack.sum) > 0) return live;
  return Math.max(live, Math.max(0, Math.floor(Number(wfl) || 0)));
}

function rnLv(rn, k) {
  if (!rn || typeof rn !== "object") return 0;
  return Math.min(RN_MAX, Math.max(0, Math.floor(Number(rn[k]) || 0)));
}
function attrsOf(c) {
  const a = c && c.a;
  if (Array.isArray(a)) return a;
  if (typeof a === "string") return a ? [a] : [];
  return [];
}

/* seat + account c + 공유 캐시 → {gMul, exMul}. */
function marchMuls(seat, c, shared) {
  const village = (seat && seat.v) || (c && c.v) || "";
  const dis = shared.disMine[village] != null
    ? shared.disMine[village]
    : disMine(shared.now, village, shared.drPts);
  shared.disMine[village] = dis;

  const quake = dis === "quake";
  const workshop = quake ? 0 : (shared.fac[village + "/workshop"] || 0);
  const drill = quake ? 0 : (shared.fac[village + "/drill"] || 0);
  const q = petCur(c);
  const wp = seat && seat.w != null ? Number(seat.w) : Number(c && c.wp);
  const wand = wp === 5;
  const wfl = wfLvFrom(shared.wf, c && c.wfl);
  const title = (seat && seat.t) || (c && c.t) || "";
  const luck = rnLv(c && c.rn, "luck");
  const wis = rnLv(c && c.rn, "wis");

  let gMul = 1;
  gMul *= 1 + .05 * workshop;
  if (dis === "eclipse") gMul *= .7;
  gMul *= 1 + .05 * luck;
  if (wfl >= 2) gMul *= 1 + WF_GOLD;
  gMul *= 1 + petEff(q, "gd");

  let exMul = 1;
  if (wand) exMul *= 1 + WAND_EX;
  exMul *= 1 + .03 * drill;
  if (wfl >= 1) exMul *= 1 + WF_EXP;
  exMul *= 1 + petEff(q, "ex");
  if (dis === "storm") exMul *= .8;
  /* gain() 경험 보너스(상처·타락 제외). */
  exMul *= 1 + .04 * wis;
  if (title === "끈기") exMul *= 1.2;
  if (attrsOf(c).includes("바람") || String((seat && seat.a) || "").includes("바람")) exMul *= 1.15;

  return {gMul, exMul, dis, workshop, drill, wfl, wand};
}

async function ensureShared(db, cache, now) {
  if (cache.ready) return cache;
  cache.now = now;
  cache.fac = cache.fac || {};
  cache.disMine = cache.disMine || {};
  cache.drPts = cache.drPts || {};
  cache.wf = cache.wf || null;
  cache.vfacLoaded = cache.vfacLoaded || {};

  const x = disInfo(disSlot(now));
  if (x) {
    try {
      const sn = await db.ref("tally/dr/" + x.id).get();
      const p = sn.exists() ? sn.val() : null;
      if (p && p.pts != null) cache.drPts[x.id] = Math.max(0, Number(p.pts) || 0);
    } catch (e) { /* ignore */ }
  }
  try {
    const sn = await db.ref("tally/wf").get();
    cache.wf = wfPack(sn.exists() ? sn.val() : null);
  } catch (e) { cache.wf = null; }

  cache.ready = true;
  return cache;
}

async function loadFacKeys(db, cache, village) {
  if (!village || !VL.includes(village)) return;
  if (cache.vfacLoaded[village]) return;
  cache.vfacLoaded[village] = 1;
  for (const k of ["workshop", "drill"]) {
    try {
      const sn = await db.ref("vfac/" + village + "/" + k).get();
      cache.fac[village + "/" + k] = facLvFromRec(sn.exists() ? sn.val() : null);
    } catch (e) {
      cache.fac[village + "/" + k] = 0;
    }
  }
}

/* db·uid·좌석·now·공유캐시 → {gMul, exMul, ...}. 실패 시 배수 1. */
async function loadMarchBoost(db, uid, seat, now, cache) {
  const shared = await ensureShared(db, cache || {}, now == null ? Date.now() : now);
  let c = null;
  try {
    const sn = await db.ref("accounts/" + uid + "/c").get();
    c = sn.exists() ? sn.val() : null;
  } catch (e) { c = null; }
  const village = (seat && seat.v) || (c && c.v) || "";
  await loadFacKeys(db, shared, village);
  const muls = marchMuls(seat || {}, c || {}, shared);
  muls.c = c || {};
  return muls;
}

module.exports = {
  FAC_LV, WF_LV, WF_SHARE, WF_EXP, WF_GOLD, WF_CALM, WAND_EX, SCY_DZ, PET_LV, PET_XP_RUN, PET_DROP_X, PET_XP_CAP,
  DIS_GOAL, VL_DZ, WP_PILE, SK_NM, SOLO_RW_MP, COLLECTOR_P,
  facLvOf, facLvFromRec, petLv, petCur, petEff, armedCharm, armedItem, hasAttr, todayStr, wpPile, gainDzMod, gainExMod, petEvOn,
  disSlot, disInfo, disLive, disMine, wfLvOf, wfPack, wfLvFrom, rnLv,
  marchMuls, marchSide, loadMarchBoost, ensureShared, loadFacKeys
};
