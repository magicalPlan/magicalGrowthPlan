/* 플랜더스 밑그림 기록 확정.
   · 클라: event_minigame/flanders/play/{uid}={ts}(시작) → go/{uid}/{reqId}={c,n,ts}(종료)
   · 서버: play 세션 확인 후 rank 는 한 판 최고(c)만 유지, total_amount 는 합산 increment.
   · 숫자: js/act/mini/demo.js · data/act/mini/flanders.js 의 한 판(60초)·상한과 맞춤. */
"use strict";

const {ServerValue} = require("firebase-admin/database");

const MG_PATH = "event_minigame/flanders";
const MAX_C = 40;          /* 한 판 완성 상한(클라 규칙·RTDB validate 와 동일) */
const MIN_PLAY_MS = 55000; /* 시작 후 최소 경과(1분 판 − 여유) */
const MAX_PLAY_MS = 180000;/* 시작 후 최대 경과(지연·백그라운드 여유) */

function playWhy(cur) {
  if (!cur || typeof cur !== "object" || cur.used) return "nosession";
  const age = Date.now() - Number(cur.ts);
  if (!isFinite(age) || age < MIN_PLAY_MS) return "early";
  if (age > MAX_PLAY_MS) return "late";
  return "";
}

/* play 세션 소비.
   play 자체에 transaction(used) 을 걸면, 리스너 없을 때 첫 콜백 null → 즉시 중단 → busy 가 난다.
   paid/{uid}/{ts} 는 비어 있을 때 새로 만드는 transaction 이라 null 이 정상 시작값이다. */
async function claimPlay(db, uid) {
  const playRef = db.ref(MG_PATH + "/play/" + uid);
  const snap = await playRef.get();
  const cur = snap.val();
  const why = playWhy(cur);
  if (why) return {ok: 0, why};
  const ts = Number(cur.ts);
  const paidRef = db.ref(MG_PATH + "/paid/" + uid + "/" + ts);
  const tx = await paidRef.transaction(v => {
    if (v) return;
    return {at: Date.now()};
  });
  if (!tx || !tx.committed) return {ok: 0, why: "dup"};
  try { await playRef.set(null); } catch (e) { /* 잠금은 됐으니 합계는 진행 */ }
  return {ok: 1, ts};
}

async function applyMgFlanders(db, uid, body) {
  const cRaw = Math.floor(Number(body && body.c) || 0);
  const c = Math.max(0, Math.min(MAX_C, cRaw));
  const nm = String((body && body.n) || "").slice(0, 20);
  if (!uid || !nm) return {ok: 0, why: "bad"};

  const claim = await claimPlay(db, uid);
  if (!claim.ok) return {ok: 0, why: claim.why || "busy", c: 0};

  if (!c) {
    return {ok: 1, why: "zero", c: 0, run: 0, best: 0};
  }

  /* 모두 합쳐: 매번 합산. 개인 랭킹: 60초 한 판 최고만. */
  await db.ref().update({
    [MG_PATH + "/total_amount"]: ServerValue.increment(c)
  });

  let best = c, improved = 1;
  const rankRef = db.ref(MG_PATH + "/rank/" + uid);
  const tx = await rankRef.transaction(cur => {
    const prev = cur && typeof cur === "object" ? Math.max(0, Math.floor(Number(cur.c) || 0)) : 0;
    best = Math.max(prev, c);
    improved = c > prev ? 1 : 0;
    return {n: nm, c: best};
  });
  if (!tx || !tx.committed) {
    const again = (await rankRef.get()).val();
    best = Math.max(c, again && typeof again === "object" ? Math.max(0, Math.floor(Number(again.c) || 0)) : 0);
    improved = 0;
    await rankRef.set({n: nm, c: best});
  } else {
    const v = tx.snapshot && tx.snapshot.val();
    if (v && typeof v === "object") best = Math.max(0, Math.floor(Number(v.c) || 0));
  }

  return {ok: 1, why: improved ? "ok" : "same", c: best, run: c, best: improved};
}

module.exports = {applyMgFlanders, MG_PATH, MAX_C, MIN_PLAY_MS, MAX_PLAY_MS};
