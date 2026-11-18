/* 사역마 출정 서버 권위.
   · 표·대사는 data/pet-raid.js 와 맞춘다. 고치면 양쪽 + Functions 배포.
   · 출발: pex/go/{uid}/{reqId} → c/pex/{runId} 스탬프만(타이머 스케줄 없음).
   · 귀환: pex/take/{uid}/{runId} → 시드 굴림 · 지급 · c/pex 제거. 롤백 없음.
   · 이중 지급 방지: accounts/{uid}/pexpay/{sd}=1 을 보상과 같은 update 에.
   · sid:"pex" → 클라 accSync 가 서버 지급으로 받는다. */
"use strict";

const {ServerValue} = require("firebase-admin/database");
const {accountExists} = require("./write");

const PEX_MAX = 3;
const PEX_EARLY_MS = 3600000;
const PEX_CONS_N = [[1, .65], [2, .25], [3, .1]];

const PEX = [
  ["usher", "어셔벨", 8, {id: "bond", n: 2}, {id: "m_shard", n: 1}, {g: 500}, {id: "m_forest", n: 4}, {g: 250}, {g: 250}],
  ["batil", "바틸리카", 4, {id: "bond", n: 1}, {id: "m_shard", n: 1}, {g: 250}, {id: "m_coast", n: 2}, {id: "m_herb", n: 1}, {id: "m_dew", n: 5}],
  ["calow", "칼로웰", 4, {id: "bond", n: 1}, {id: "m_shard", n: 1}, {g: 250}, {id: "m_valley", n: 1}, {id: "m_ore", n: 1}, {id: "g4", n: 1}],
  ["downh", "다운힐트", 8, {id: "bond", n: 2}, {id: "m_shard", n: 1}, {g: 500}, {id: "m_abyss", n: 1}, {id: "m_crown", n: 1}, {id: "m_shard", n: 10}]
];
const PEXM = Object.fromEntries(PEX.map(x => [x[0], x]));

const PEX_EV = [
  ["힘냇멍", "${사역마이름}(이)가 입에 약초를 문 채 신나게 달려왔다! 귀엽지만, 아무래도 약으로 쓰기에는 힘들 것 같다. ${사역마이름}(을)를 쓰다듬어주었다."],
  ["칭찬해달라냥", "${사역마이름}(이)가 당당하게 주머니를 내밀었다. 어디선가 돈을 받아온 듯 하다. ...어떻게?!"]
];
const PEX_EV_EARLY = [
  ["진짜제가싸워여?", "${사역마이름}(이)가 거대한 마수 앞에서 나를 되돌아보고 있었다. ${사역마이름}! 돌아와! 응응. 집이 최고지?"],
  ["나그래도힘냇어진짜루", "${사역마이름}(이)가 헐레벌떡 당신 품으로 뛰어들어왔다. 당신의 손 앞에 고개를 드밀어 바라보니, 금화 한 닢을 위에 내려두었다. 그 사이에 챙겨 온 거니?"]
];
const PEX_EV_MAP = {
  usher: [
    ["어셔벨의 인품은 세계제일", "${사역마이름}(이)가 톨랑톨랑 걸어온다. 봇짐에 주먹밥이 함께 들어있다. \"늘 고생이 많구나.\" ...자세히 보니 사역마의 입가에도... ..."],
    ["열심히 도왔음! / 진짜?", "오늘 ${사역마이름}은(는) 마을 사람들을 도운 듯 했다. 짐을 옮기거나, 감시를 돕거나... 어, '어셔벨 초소 감시병 마음 위로비'...?"]
  ],
  batil: [
    ["또 와줘!", "호다닥 뛰어오는 ${사역마이름}의 주변에 풀 냄새와 반짝이는 가루가 가득하다. 요정들과 즐거운 시간을 보낸 걸까?"],
    ["아프디마", "${사역마이름}(이)가 치유사와 함께 돌아왔다. 급한 시간대에, 환자 인솔을 도와주었음에 감사 인사를 하러 왔다고 한다."]
  ],
  calow: [
    ["조오오은 걸 차고 다니라고", "${사역마이름}의 목걸이가 어째 더... ...반짝반짝해졌다? 주머니를 확인해보니, 새로 만든 목걸이의 관리법에 대해 적혀있다. ...도대체 어떤 대장장이가 이런 일을?"],
    ["많은 도움이 됐어", "칼로웰은 높은 요새를 가졌으나, 그것이 사냥 실력까지 증명하지는 않는다. ${사역마이름}(이)가 마수 사냥을 많이 도왔다고 한다."]
  ],
  downh: [
    ["불안한 그림자", "${사역마이름}의 뒤 쪽에서 보여서는 안 될 그림자가 일렁였다. ${사역마이름}은 전에 비해 강해진 것 같지만..."],
    ["귀여움 앞에는 장사 없다", "${사역마이름}의 털이 평소에 비해 유독 반짝인다. ...많이 쓰다듬을 받고 온 것 같다."]
  ]
};

const ITEM_NM = {
  bond: "유대의 증거", m_shard: "마수의 파편", m_forest: "삼림의 조각", m_coast: "해안의 조각",
  m_valley: "골짜기의 조각", m_abyss: "심연의 조각", m_herb: "치유의 약초", m_dew: "꿈의 이슬",
  m_ore: "요새 철광석", g4: "꿈꾸는 오르골", m_crown: "검은 왕관의 조각", m_ash: "절망의 재"
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

function pexList(raw) {
  if (!raw || typeof raw !== "object") return [];
  return Object.keys(raw).map(id => {
    const r = raw[id];
    if (!r || typeof r !== "object") return null;
    const k = String(r.k || "");
    if (!PEXM[k]) return null;
    return {
      id: String(id),
      petId: String(r.petId || ""),
      k,
      t0: Number(r.t0) || 0,
      t1: Number(r.t1) || 0,
      sd: String(r.sd || ""),
      nt: r.nt ? 1 : 0
    };
  }).filter(x => x && x.petId && x.sd && x.t1 > x.t0);
}

function petsArr(raw) {
  if (Array.isArray(raw)) return raw.filter(q => q && q.id);
  if (raw && typeof raw === "object") {
    return Object.keys(raw).map(k => raw[k]).filter(q => q && q.id);
  }
  return [];
}

function addLoot(g, inv, cell) {
  if (!cell || typeof cell !== "object") return g;
  const gold = Math.max(0, Math.floor(Number(cell.g) || 0));
  if (gold) g += gold;
  const id = String(cell.id || "");
  const n = Math.max(0, Math.floor(Number(cell.n) || 0));
  if (id && n && id.indexOf("/") < 0) inv[id] = (inv[id] || 0) + n;
  return g;
}

function rollConsCount(rand) {
  const roll = typeof rand === "function" ? rand() : Math.random();
  let acc = 0;
  for (let i = 0; i < PEX_CONS_N.length; i++) {
    acc += PEX_CONS_N[i][1];
    if (roll < acc) return PEX_CONS_N[i][0];
  }
  return 1;
}

function fillScript(tpl, nm) {
  return String(tpl || "")
    .replace(/\$\{사역마\s*이름\}/g, nm)
    .replace(/\$\{사역마이름\}/g, nm);
}

function pickScript(pool, rand, nm) {
  if (!pool || !pool.length) return null;
  const row = pool[Math.floor((typeof rand === "function" ? rand() : Math.random()) * pool.length)];
  if (!row) return null;
  return {ti: String(row[0] || ""), tx: fillScript(row[1], nm)};
}

function lootLines(g, inv) {
  const a = [];
  if (g > 0) a.push("골드 +" + g);
  Object.keys(inv).forEach(id => {
    const n = inv[id];
    if (!(n > 0)) return;
    a.push((ITEM_NM[id] || id) + " +" + n);
  });
  return a;
}

function rollPexPay(row, early, seed, petNm) {
  const rand = rng(seedHash("pex|" + seed));
  const nm = String(petNm || "사역마").slice(0, 20);
  if (early) {
    const inv = {m_ash: 10};
    const sc = pickScript(PEX_EV_EARLY, rand, nm);
    return {g: 0, inv, early: 1, sc, lines: lootLines(0, inv)};
  }
  let g = 0;
  const inv = {};
  g = addLoot(g, inv, row[3]);
  g = addLoot(g, inv, row[6]);
  g = addLoot(g, inv, row[7]);
  const n = rollConsCount(rand);
  for (let i = 0; i < n; i++) {
    const cell = rand() < .5 ? row[4] : row[5];
    g = addLoot(g, inv, cell);
  }
  if (rand() < .5) g = addLoot(g, inv, row[8]);
  const pool = PEX_EV.concat(PEX_EV_MAP[row[0]] || []);
  const sc = pickScript(pool, rand, nm);
  return {g, inv, early: 0, sc, lines: lootLines(g, inv)};
}

function normalizeNt(cur) {
  if (Array.isArray(cur)) return cur.filter(n => n && typeof n === "object");
  if (cur && typeof cur === "object") {
    return Object.keys(cur).sort((a, b) => Number(a) - Number(b) || String(a).localeCompare(String(b)))
      .map(k => cur[k]).filter(n => n && typeof n === "object");
  }
  return [];
}

async function pushPexNote(root, text) {
  const t = String(text || "").slice(0, 160);
  if (!t) return;
  const entry = {k: "quest", t, u: "", ts: Date.now(), r: false};
  await root.child("c/nt").transaction(cur => [entry].concat(normalizeNt(cur)).slice(0, 60));
}

function runId() {
  return "p" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
}
function seedId() {
  return String(Math.floor(Math.random() * 1e9)) + Date.now().toString(36).slice(-4);
}

/* 출발. 함께하기 펫·이미 출정·맵 중복·3마리 초과 거절. */
async function applyPexStart(db, uid, body) {
  const petId = String((body && body.petId) || "").replace(/[\/.#$\[\]]/g, "").slice(0, 40);
  const k = String((body && body.k) || "");
  const row = PEXM[k];
  if (!uid || !petId || !row) return {ok: 0, why: "bad"};
  if (!(await accountExists(db, uid))) return {ok: 0, why: "acc"};

  const root = db.ref("accounts/" + uid);
  const pets = petsArr((await root.child("c/pets").get()).val());
  const pet = pets.find(q => q && String(q.id) === petId);
  if (!pet) return {ok: 0, why: "pet"};
  const together = String((await root.child("c/pet").get()).val() || "");
  if (together && together === petId) return {ok: 0, why: "with"};

  const runs = pexList((await root.child("c/pex").get()).val());
  if (runs.length >= PEX_MAX) return {ok: 0, why: "full"};
  if (runs.some(r => r.petId === petId)) return {ok: 0, why: "busy"};
  if (runs.some(r => r.k === k)) return {ok: 0, why: "map"};

  const now = Date.now();
  const id = runId();
  const sd = seedId();
  const hr = Math.max(1, Math.floor(Number(row[2]) || 1));
  const run = {petId, k, t0: now, t1: now + hr * 3600000, sd};
  await root.update({
    ["c/pex/" + id]: run,
    ts: now,
    sid: "pex"
  });
  return {ok: 1, id, run, nm: row[1], hr};
}

/* 귀환. early=1 이면 1시간 지난 뒤만, 절망의 재 10 + 중도 대사. */
async function applyPexClaim(db, uid, runIdKey, body) {
  const id = String(runIdKey || "").replace(/[\/.#$\[\]]/g, "").slice(0, 40);
  if (!uid || !id) return {ok: 0, why: "bad"};
  if (!(await accountExists(db, uid))) return {ok: 0, why: "acc"};

  const root = db.ref("accounts/" + uid);
  const raw = (await root.child("c/pex/" + id).get()).val();
  if (!raw || typeof raw !== "object") return {ok: 0, why: "gone"};
  const k = String(raw.k || "");
  const row = PEXM[k];
  const sd = String(raw.sd || "");
  const petId = String(raw.petId || "");
  const t0 = Number(raw.t0) || 0;
  const t1 = Number(raw.t1) || 0;
  if (!row || !sd || !petId || !(t1 > t0)) return {ok: 0, why: "bad"};

  const now = Date.now();
  const done = now >= t1;
  const wantEarly = !!(body && (body.early === 1 || body.early === true || body.early === "1"));
  if (!done && !wantEarly) return {ok: 0, why: "wait"};
  if (!done && wantEarly && now < t0 + PEX_EARLY_MS) return {ok: 0, why: "soon"};
  const early = !done;

  const paid = await root.child("pexpay/" + sd).get();
  if (paid.exists() && paid.val()) {
    await root.update({["c/pex/" + id]: null, ts: now, sid: "pex"}).catch(() => {});
    return {ok: 1, why: "dup", early: early ? 1 : 0};
  }

  const pets = petsArr((await root.child("c/pets").get()).val());
  const pet = pets.find(q => q && String(q.id) === petId);
  const petNm = pet && pet.nm ? String(pet.nm).slice(0, 20) : "사역마";
  const pay = rollPexPay(row, early, sd, petNm);

  const bump = {
    ["c/pex/" + id]: null,
    ["pexpay/" + sd]: 1,
    ts: now,
    sid: "pex"
  };
  if (pay.g > 0) bump["c/gd"] = ServerValue.increment(pay.g);
  Object.keys(pay.inv || {}).forEach(itemId => {
    const n = Math.max(0, Math.floor(Number(pay.inv[itemId]) || 0));
    if (!n) return;
    bump["c/inv/" + itemId] = ServerValue.increment(n);
  });
  const matN = Object.keys(pay.inv || {}).reduce((s, itemId) => {
    if (itemId === "mana" || itemId === "g1" || itemId === "charm" || itemId === "flag" || itemId === "map") return s;
    return s + Math.max(0, Math.floor(Number(pay.inv[itemId]) || 0));
  }, 0);
  if (matN > 0) bump["c/stats/mats"] = ServerValue.increment(matN);
  if (!early) bump["c/stats/pexDone"] = ServerValue.increment(1);

  await root.update(bump);

  const head = early ? "중간에 돌아왔다." : "토벌을 마치고 돌아왔다.";
  const rw = (pay.lines || []).join(", ") || "보상 없음";
  const noteText = row[1] + ": " + head + " (" + rw + ")";
  try { await pushPexNote(root, noteText); } catch (e) { /* 지급은 유지 */ }

  return {
    ok: 1,
    early: early ? 1 : 0,
    k,
    nm: row[1],
    petNm,
    g: pay.g,
    inv: pay.inv,
    lines: pay.lines,
    sc: pay.sc,
    head,
    rw
  };
}

module.exports = {
  PEX_MAX,
  PEX_EARLY_MS,
  PEXM,
  applyPexStart,
  applyPexClaim
};
