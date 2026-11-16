/* 출정 재료·단서 굴림. data/craft.js MAT_DROP·MAT_VIL, data/clue/piece.js CLP.drop 과 맞춘다.
   시드는 출정·uid 로 고정해 재시도해도 같은 결과가 나오게 한다.
   줄: [id, 개수|[min,max], 확률]. 개수가 배열이면 확률에 걸린 뒤 구간 균등. */
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
/* 단서 조각(출정 서버 경로). data/event/pack.js 의 piece.id·from·to 및
   common.js CLP_FORM.drop.x_ok/x_fail 과 맞춘다. 다음 이벤트 때 pack 과 함께 고치고 배포. */
const CLP = {
  id: "clue-2026-11",
  from: Date.UTC(2026, 9, 31, 15),
  to: Date.UTC(2026, 10, 22, 9),
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
  if (now < CLP.from || now >= CLP.to) return 0;
  const p = ok ? CLP.drop.x_ok : CLP.drop.x_fail;
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

module.exports = {MAT_DROP, MAT_VIL, CLP, seedHash, rng, rollQty, rollMats, rollClp, marchDropTables};
