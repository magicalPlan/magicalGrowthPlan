/* 보스·이벤트 보스 체력(hp0)과 누적 피해(_hp)를 서버가 맞춘다.
   클라가 wboss/{보스}/{uid} 에 공격 기록을 쓰면 bossHitHp 가 이 모듈로 _hp 를 만들거나 sum 을 더한다.
   공식은 data/game.js · data/event-boss/boss.js · js/boss.js bossHpEst 와 같게 둔다.
   배포: firebase deploy --only functions:bossHitHp,database */
const {onValueWritten} = require("firebase-functions/v2/database");

const WITCH_HP = 3;
const D_HP_X = 2;
const EBOSS_HP_X = 1.9;
const BOSS_SCALE_FROM = {d: "d-2026-10-27a", w: "w-2026-10-26"};
const BOSS_NEW_FROM = {d: "d-2026-10-19a", w: "w-2026-10-19"};
const BOSS = {
  d: {base: 25000, k: 5.5, m: 4.5},
  w: {base: 250000, k: 12.5, m: 44}
};
const BOSS_OLD = {
  d: {base: 3000, k: 6.5, m: 0},
  w: {base: 60000, k: 22, m: 0}
};
const SKIP_K = {pic: 1, picm: 1, clk: 1};

function bossKind(id) {
  const s = String(id || "");
  if (s.indexOf("d-") === 0) return "d";
  if (s.indexOf("w-") === 0) return "w";
  if (s.indexOf("e-") === 0) return "e";
  return null;
}

function scaled(k, id) {
  return !!id && String(id) >= BOSS_SCALE_FROM[k];
}

function scaleHp(k, lv, pw) {
  if (!(lv > 0 && pw > 0)) return 0;
  const core = lv + pw * (pw - lv);
  const ratio = pw / lv;
  const scale = k === "d" ? 1.1 : k === "e" ? EBOSS_HP_X : 1;
  return Math.round(k === "w" ? core * ratio : core / (ratio / scale));
}

function witchHp(p) {
  return (300 + Math.max(0, Number(p) || 0) * 12) * WITCH_HP;
}

function legacyCfg(k, id) {
  return id && String(id) < BOSS_NEW_FROM[k] ? BOSS_OLD[k] : BOSS[k];
}

/* 참가 기록이 없을 때(첫 시드)는 1위 전투력만으로 스케일·마인 공식을 쓴다.
   옛 합산 공식(base+k×합)은 참가자 전투력이 필요해, 시드 단계에서는 base 만 둔다. */
function calcSeedHp(bossId, lv, pw) {
  const k = bossKind(bossId);
  if (!k) return 0;
  if (k === "e" || scaled(k, bossId)) return scaleHp(k === "e" ? "e" : k, lv, pw);
  if (k === "d" && !(String(bossId) < BOSS_NEW_FROM.d)) {
    return Math.round(witchHp(pw) * D_HP_X);
  }
  const c = legacyCfg(k, bossId);
  return Math.round(Number(c.base) || 0);
}

async function readTopCombat(db, uid) {
  let pw = 0, lv = 1;
  try {
    const sn = await db.ref("players").orderByChild("pw").limitToLast(1).get();
    sn.forEach(c => {
      const v = c.val() || {};
      pw = Math.max(0, Number(v.pw) || 0);
      lv = Math.max(1, Number(v.lv) || 1);
    });
  } catch (e) {}
  if (uid) {
    try {
      const mine = await db.ref("players/" + uid).get();
      if (mine.exists()) {
        const v = mine.val() || {};
        const mp = Math.max(0, Number(v.pw) || 0);
        const ml = Math.max(1, Number(v.lv) || 1);
        if (mp > pw) {
          pw = mp;
          lv = ml;
        }
      }
    } catch (e) {}
  }
  return {pw, lv};
}

async function applyBossHit(db, bossId, uid, add, first) {
  const kind = bossKind(bossId);
  if (!kind || !(add > 0)) return null;
  const ref = db.ref("wboss/" + bossId + "/_hp");
  let cur = null;
  try {
    const sn = await ref.get();
    cur = sn.exists() ? sn.val() : null;
  } catch (e) {
    return null;
  }
  let hp0 = Number(cur && cur.hp0) || 0;
  if (!(hp0 > 0)) {
    const top = await readTopCombat(db, uid);
    hp0 = calcSeedHp(bossId, top.lv, top.pw);
  }
  if (!(hp0 > 0)) return null;
  const tx = await ref.transaction(p => {
    const prev = p && typeof p === "object" ? p : null;
    const hp = Number(prev && prev.hp0) || hp0;
    if (!(hp > 0)) return;
    const sum0 = Number(prev && prev.sum) || 0;
    if (prev && (prev.x === 1 || sum0 >= hp)) return;
    const sum = sum0 + add;
    return {
      hp0: hp,
      sum,
      n: (Number(prev && prev.n) || 0) + (first ? 1 : 0),
      x: sum >= hp ? 1 : 0
    };
  });
  return tx && tx.snapshot ? tx.snapshot.val() : null;
}

function createBossHitHp(getDatabase) {
  return onValueWritten({
    ref: "/wboss/{bossId}/{uid}",
    instance: "magical-growth-default-rtdb",
    region: "asia-southeast1",
    timeoutSeconds: 30,
    memory: "256MiB"
  }, async event => {
    const bossId = String(event.params.bossId || "");
    const uid = String(event.params.uid || "");
    if (!bossId || !uid || uid === "_hp" || SKIP_K[bossId] || !bossKind(bossId)) return;
    if (!event.data.after.exists()) return;
    const after = event.data.after.val() || {};
    if (!after.u) return;
    const before = event.data.before.exists() ? event.data.before.val() || {} : null;
    const add = Math.max(0, (Number(after.d) || 0) - (Number(before && before.d) || 0));
    if (!(add > 0)) return;
    const first = !before || !before.u;
    await applyBossHit(getDatabase(), bossId, uid, add, first);
  });
}

module.exports = {
  createBossHitHp,
  applyBossHit,
  calcSeedHp,
  bossKind,
  EBOSS_HP_X,
  BOSS_SCALE_FROM
};
