/* 사역마 특성 서버 굴림·PATCH.
   · 클라 data/pet-traits.js 와 숫자·코드를 맞춘다. 고치면 양쪽 + Functions 배포.
   · 호출: functions/pettr.js (pettr/{uid}/{petId} 쓰기) → grantPetTraits.
   · 계정은 c/pets/{i}/tr/{lv} 리프만 update. pets 배열 통째 교체 금지.
   · 클라가 보낸 특성 id는 쓰지 않는다. 레벨·빈 슬롯·시드만 서버가 본다.
   · 15레벨 슬롯은 전설(r=3) 고정. 같은 펫에 동일 코드(c) 중복 없음.
   · 변광석 변경은 클라 PATCH(가방). 서버 pettrr/pettrp 없음. */
"use strict";

/* 친밀도 단계(boost.js 와 동일). boost 를 require 하면 petTraitEff 순환이 생기므로 여기만 둔다. */
const PET_LV = (() => { const a = [0]; for (let i = 0; i < 14; i++) a.push(a[i] + 10 * (i + 2)); return a; })();
const PET_LV_DEF = 5, PET_LV_HARD = 15;
function petLvCap(q) {
  if (!q) return PET_LV_DEF;
  const n = Math.floor(Number(q.lm));
  return Math.min(PET_LV_HARD, Math.max(PET_LV_DEF, isFinite(n) ? n : PET_LV_DEF));
}
function petLv(q) {
  if (!q) return 0;
  const xp = Number(q.xp) || 0;
  return Math.min(petLvCap(q), PET_LV.filter(n => xp >= n).length);
}

/* data/pet-traits.js 와 동일. */
const PET_TR_LV = [5, 10, 15];
const PET_TR_RATE = [[1, .7], [2, .27], [3, .03]];
const PET_TR = [
  [1, "ex", "출정 경험치", 1, 2, 3, "pp"],
  [2, "gd", "출정 골드", 1, 2, 3, "pp"],
  [3, "heal", "자연 회복", 1, 2, 3, "n"],
  [4, "dz", "절망도 감소", 1, 2, 3, "pp"],
  [5, "pw", "전투력", 5, 10, 15, "n"],
  [6, "lh", "장기 토벌 성공률", 2, 4, 6, "pp"],
  [7, "gift", "친구 선물 효과", 10, 20, 30, "pp"],
  [8, "shop", "상점 가격 할인", 2, 4, 6, "pp"],
  [9, "trial", "재계약 시험 판정", 1, 2, 3, "n"],
  [10, "mana", "마력석 획득률", 5, 10, 15, "pp"],
  [11, "up", "무기 강화 성공률", 10, 20, 30, "n"],
  [12, "res", "공명 시 절망도 감소", 5, 10, 15, "n"],
  [13, "mat", "공방 재료 획득률", 2, 4, 6, "pp"],
  [14, "boss", "보스 레이드 피해", 3, 6, 9, "pp"],
  [15, "raid", "타락 레이드 피해", 3, 6, 9, "pp"],
  [16, "wave", "몬스터 웨이브 피해", 3, 6, 9, "pp"]
];
const PET_TRM = Object.fromEntries(PET_TR.map(t => [t[0], t]));
const PET_TR_CODES = PET_TR.map(t => t[0]);

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

function petTrRaw(code, r) {
  const t = PET_TRM[code];
  if (!t) return 0;
  const i = Math.min(3, Math.max(1, Math.floor(Number(r) || 1)));
  return Number(t[2 + i]) || 0;
}
function petTrVal(code, r) {
  const t = PET_TRM[code];
  if (!t) return 0;
  const raw = petTrRaw(code, r);
  return t[6] === "pp" ? raw / 100 : raw;
}

/* 등급 굴림. forceLeg 이면 전설(3). */
function rollPetTrRare(rand, forceLeg) {
  if (forceLeg) return 3;
  const roll = typeof rand === "function" ? rand() : Math.random();
  let acc = 0;
  for (let i = 0; i < PET_TR_RATE.length; i++) {
    acc += PET_TR_RATE[i][1];
    if (roll < acc) return PET_TR_RATE[i][0];
  }
  return 1;
}

/* 아직 없는 코드 중 하나. 없으면 null. */
function rollPetTrCode(ownedCodes, rand) {
  const have = new Set((ownedCodes || []).map(Number).filter(n => n > 0));
  const pool = PET_TR_CODES.filter(c => !have.has(c));
  if (!pool.length) return null;
  const i = Math.floor((typeof rand === "function" ? rand() : Math.random()) * pool.length);
  return pool[Math.max(0, Math.min(pool.length - 1, i))];
}

function rollPetTrait(ownedCodes, forceLeg, rand) {
  const r = rollPetTrRare(rand, forceLeg);
  const c = rollPetTrCode(ownedCodes, rand);
  if (c == null) return null;
  return {c, r};
}

/* q.tr 을 { "5": {c,r}, … } 객체로 정규화. */
function readTr(q) {
  const raw = q && q.tr;
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  PET_TR_LV.forEach(lv => {
    const slot = raw[lv] != null ? raw[lv] : raw[String(lv)];
    if (!slot || typeof slot !== "object") return;
    const c = Math.floor(Number(slot.c) || 0);
    const r = Math.min(3, Math.max(1, Math.floor(Number(slot.r) || 1)));
    if (PET_TRM[c]) out[String(lv)] = {c, r};
  });
  return out;
}

function ownedCodesFromTr(tr) {
  return Object.keys(tr || {}).map(k => tr[k] && tr[k].c).filter(c => c);
}

/* 함께하는 펫의 특성 합산(효과 키 → 값). marchMuls·marchSide 용. */
function petTraitEff(q, k) {
  if (!q || !k) return 0;
  const tr = readTr(q);
  let sum = 0;
  Object.keys(tr).forEach(lv => {
    const slot = tr[lv];
    const def = PET_TRM[slot.c];
    if (!def || def[1] !== k) return;
    sum += petTrVal(slot.c, slot.r);
  });
  return sum;
}

function findPet(pets, petId) {
  if (!petId) return null;
  if (Array.isArray(pets)) {
    const i = pets.findIndex(q => q && q.id === petId);
    if (i < 0) return null;
    return {q: pets[i], path: String(i)};
  }
  if (pets && typeof pets === "object") {
    const keys = Object.keys(pets);
    for (let k = 0; k < keys.length; k++) {
      const q = pets[keys[k]];
      if (q && q.id === petId) return {q, path: keys[k]};
    }
  }
  return null;
}

/* 빈 해금 슬롯만 굴려 PATCH. 반환: 새로 넣은 슬롯 수. */
async function grantPetTraits(db, uid, petId) {
  if (!uid || !petId) return 0;
  const root = db.ref("accounts/" + uid);
  const petsSnap = await root.child("c/pets").get();
  if (!petsSnap.exists()) return 0;
  const pets = petsSnap.val();
  const found = findPet(pets, petId);
  if (!found) return 0;
  const q = found.q;
  const L = petLv(q);
  const tr = readTr(q);
  const owned = ownedCodesFromTr(tr);
  const bump = {ts: Date.now(), sid: "pettr"};
  let n = 0;
  for (let i = 0; i < PET_TR_LV.length; i++) {
    const lv = PET_TR_LV[i];
    if (L < lv) continue;
    if (tr[String(lv)]) continue;
    const forceLeg = lv === 15;
    const rand = rng(seedHash(String(uid) + "|" + String(petId) + "|" + lv + "|" + (Number(q.xp) || 0)));
    const got = rollPetTrait(owned, forceLeg, rand);
    if (!got) continue;
    bump["c/pets/" + found.path + "/tr/" + lv] = {c: got.c, r: got.r};
    owned.push(got.c);
    tr[String(lv)] = got;
    n++;
  }
  if (!n) return 0;
  await root.update(bump);
  return n;
}

module.exports = {
  PET_TR_LV, PET_TR_RATE, PET_TR, PET_TRM, PET_TR_CODES,
  petTrRaw, petTrVal, petTraitEff, readTr, ownedCodesFromTr,
  rollPetTrRare, rollPetTrCode, rollPetTrait, grantPetTraits,
  seedHash, rng, PET_LV, PET_LV_DEF, PET_LV_HARD, petLv, petLvCap
};
