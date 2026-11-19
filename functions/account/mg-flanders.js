/* 플랜더스 밑그림 기록 확정.
   · 클라: event_minigame/flanders/play/{uid}={ts}(시작) → go/{uid}/{reqId}={c,n,ts}(종료)
   · 서버: play 세션(약 1분) 확인 후 rank·total_amount increment. 클라는 rank/합계를 직접 못 씀.
   · 숫자: js/act/mini/demo.js · data/act/mini/flanders.js 의 한 판(60초)·상한과 맞춤. */
"use strict";

const {ServerValue} = require("firebase-admin/database");

const MG_PATH = "event_minigame/flanders";
const MAX_C = 40;          /* 한 판 완성 상한(클라 규칙·RTDB validate 와 동일) */
const MIN_PLAY_MS = 55000; /* 시작 후 최소 경과(1분 판 − 여유) */
const MAX_PLAY_MS = 180000;/* 시작 후 최대 경과(지연·백그라운드 여유) */

function applyMgFlanders(db, uid, body) {
  const cRaw = Math.floor(Number(body && body.c) || 0);
  const c = Math.max(0, Math.min(MAX_C, cRaw));
  const nm = String((body && body.n) || "").slice(0, 20);
  if (!uid || !nm) return Promise.resolve({ok: 0, why: "bad"});

  const playRef = db.ref(MG_PATH + "/play/" + uid);
  return playRef.transaction(cur => {
    if (!cur || typeof cur !== "object") return;
    if (cur.used) return;
    const ts = Number(cur.ts);
    if (!isFinite(ts)) return;
    const age = Date.now() - ts;
    if (age < MIN_PLAY_MS || age > MAX_PLAY_MS) return;
    return {ts, used: 1};
  }).then(tx => {
    const v = tx && tx.snapshot && tx.snapshot.val();
    if (!tx || !tx.committed || !v || !v.used) {
      return playRef.once("value").then(s => {
        const cur = s.val();
        if (!cur || typeof cur !== "object" || cur.used) return {ok: 0, why: "nosession"};
        const age = Date.now() - Number(cur.ts);
        if (!isFinite(age) || age < MIN_PLAY_MS) return {ok: 0, why: "early"};
        if (age > MAX_PLAY_MS) return {ok: 0, why: "late"};
        return {ok: 0, why: "busy"};
      });
    }
    if (!c) {
      return playRef.set(null).then(() => ({ok: 1, why: "zero", c: 0}));
    }
    const patch = {};
    patch[MG_PATH + "/rank/" + uid + "/n"] = nm;
    patch[MG_PATH + "/rank/" + uid + "/c"] = ServerValue.increment(c);
    patch[MG_PATH + "/total_amount"] = ServerValue.increment(c);
    patch[MG_PATH + "/play/" + uid] = null;
    return db.ref().update(patch).then(() => ({ok: 1, why: "ok", c}));
  });
}

module.exports = {applyMgFlanders, MG_PATH, MAX_C, MIN_PLAY_MS, MAX_PLAY_MS};
