/* 출정 재료·단서 굴림. 인수인계: data/event/HANDOFF.md
   MAT_DROP·MAT_VIL ↔ data/craft.js.
   단서 시즌 일정: data/event/seasons.js → (predeploy) event-seasons.js.
   시드: 출정·uid 고정. EVENT_FORCE 없음. */
const {CLP_SEASONS, CLP, clpAt} = require("./event-seasons");

const MAT_DROP = {
  x_ok: [["m_shard", 1, 1], ["m_shard", 1, .4], ["m_herb", 1, .2], ["m_ore", 1, .2]],
  x_hi: [["m_shard", 1, .6], ["m_dew", 1, .15]],
  x_ab: [["m_dew", 1, .6], ["m_ash", 1, 1], ["m_abyss", [1, 3], .1]],
  x_fail: [["m_ash", 1, 1], ["m_shard", 1, .3]],
  x_s1: [["m_forest", [1, 3], .3]],
  x_s2: [["m_coast", [1, 3], .3]],
  x_s3: [["m_valley", [1, 3], .3]]
};
const MAT_VIL = {B: "m_herb", D: "m_ash"};

function seedHash(str) {
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

function rollQty(n, rand) {
  if (Array.isArray(n)) {
    const lo = Math.floor(Number(n[0]) || 1), hi = Math.floor(Number(n[1]) || lo);
    if (hi <= lo) return Math.max(0, lo);
    return lo + Math.floor(rand() * (hi - lo + 1));
  }
  return Math.max(0, Math.floor(Number(n) || 0));
}

/* 정기 출정 재료. tables: x_ok/x_hi/x_ab/x_s1·2·3 또는 x_fail. */
function rollMats(tables, village, rand) {
  const got = {};
  (tables || []).filter(Boolean).forEach(k => {
    (MAT_DROP[k] || []).forEach(([id, n, p]) => {
      if (rand() < p) got[id] = (got[id] || 0) + rollQty(n, rand);
    });
  });
  const bonus = MAT_VIL[village];
  if (bonus && got[bonus]) got[bonus]++;
  return got;
}

function rollClp(ok, now, rand) {
  now = now || Date.now();
  const s = clpAt(now);
  if (!s) return 0;
  const p = ok ? s.drop.x_ok : s.drop.x_fail;
  return rand() < p ? 1 : 0;
}

/* 성공 시 성급 조각: ★→x_s1, ★★→x_s2, ★★★→x_s3(+x_hi), 심연→x_hi+x_ab(심연의 조각 포함).
   x_hi 는 예전처럼 rw≥1.4(★★★·심연)에 붙인다. */
function marchDropTables(r) {
  if (!r) return [];
  if (!r.ok) return ["x_fail"];
  const rw = Number(r.rw) || 1;
  if (r.ab) return ["x_ok", "x_hi", "x_ab"];
  if (rw >= 1.4) return ["x_ok", "x_hi", "x_s3"];
  if (rw >= 1) return ["x_ok", "x_s2"];
  return ["x_ok", "x_s1"];
}

/* MAT_DROP 에 한 번이라도 나오는 재료 id(중복 없음). 수집가 무작위 풀. */
function matPool() {
  const ids = [];
  Object.keys(MAT_DROP).forEach(k => {
    (MAT_DROP[k] || []).forEach(row => {
      if (row && row[0] && ids.indexOf(row[0]) < 0) ids.push(row[0]);
    });
  });
  return ids;
}
/* 수집가: 풀에서 균등 1개. rand 는 0~1. */
function pickMat(rand) {
  const ids = matPool();
  if (!ids.length) return "";
  const r = typeof rand === "function" ? rand() : Math.random();
  return ids[Math.floor(r * ids.length)] || "";
}

module.exports = {MAT_DROP, MAT_VIL, CLP, CLP_SEASONS, clpAt, seedHash, rng, rollQty, rollMats, rollClp, marchDropTables, matPool, pickMat};
