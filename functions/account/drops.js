/* 출정 재료·단서 굴림. data/craft.js MAT_DROP·MAT_VIL, data/clue/piece.js CLP.drop 과 맞춘다.
   시드는 출정·uid 로 고정해 재시도해도 같은 결과가 나오게 한다. */
const MAT_DROP = {
  x_ok: [["m_shard", 1, 1], ["m_shard", 1, .4], ["m_herb", 1, .2], ["m_ore", 1, .2]],
  x_hi: [["m_shard", 1, .6], ["m_dew", 1, .15]],
  x_ab: [["m_dew", 1, .6], ["m_ash", 1, 1]],
  x_fail: [["m_ash", 1, 1], ["m_shard", 1, .3]]
};
const MAT_VIL = {B: "m_herb", D: "m_ash"};
/* 2026-11 단서 이벤트. 기간이 아니면 clp=0. */
const CLP = {
  id: "clue-2026-11",
  from: Date.UTC(2026, 9, 31, 15),
  to: Date.UTC(2026, 10, 14, 15),
  drop: {x_ok: .35, x_fail: .1}
};

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

/* 정기 출정 재료. tables: x_ok/x_hi/x_ab 또는 x_fail. */
function rollMats(tables, village, rand) {
  const got = {};
  (tables || []).filter(Boolean).forEach(k => {
    (MAT_DROP[k] || []).forEach(([id, n, p]) => {
      if (rand() < p) got[id] = (got[id] || 0) + n;
    });
  });
  const bonus = MAT_VIL[village];
  if (bonus && got[bonus]) got[bonus]++;
  return got;
}

function rollClp(ok, now, rand) {
  now = now || Date.now();
  if (now < CLP.from || now >= CLP.to) return 0;
  const p = ok ? CLP.drop.x_ok : CLP.drop.x_fail;
  return rand() < p ? 1 : 0;
}

function marchDropTables(r) {
  if (!r) return [];
  if (r.ok) return ["x_ok", (Number(r.rw) || 1) >= 1.4 ? "x_hi" : null, r.ab ? "x_ab" : null];
  return ["x_fail"];
}

module.exports = {MAT_DROP, MAT_VIL, CLP, seedHash, rng, rollMats, rollClp, marchDropTables};
