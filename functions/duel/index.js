/* 대련 이벤트 RTDB 트리거.
   · duel/q/{uid}/{mid} = { o, win, ts } → 점수
   · duel/claim/{uid} = { id, ts } → 순위 보상
   배포: firebase deploy --only functions:duelDevScore,functions:duelDevClaim */
"use strict";

const {onValueWritten} = require("firebase-functions/v2/database");
const {applyDevScore, applyDevClaim} = require("./dev");

function createDuelDevScore(getDatabase) {
  return onValueWritten({
    ref: "/duel/q/{uid}/{mid}",
    instance: "magical-growth-default-rtdb",
    region: "asia-southeast1",
    timeoutSeconds: 30,
    memory: "256MiB"
  }, async event => {
    if (!event.data.after.exists()) return;
    const uid = String(event.params.uid || "");
    const mid = String(event.params.mid || "");
    if (!uid || !mid) return;
    const body = event.data.after.val() || {};
    const db = getDatabase();
    let done = false;
    try {
      const r = await applyDevScore(db, uid, mid, body);
      done = !!(r && r.ok);
    } catch (e) { done = false; }
    /* 성공(또는 중복/페어 소진)일 때만 지운다. 실패면 남겨 재시도. */
    if (done) {
      try { await db.ref("duel/q/" + uid + "/" + mid).set(null); } catch (e2) { /* ignore */ }
    }
  });
}

function createDuelDevClaim(getDatabase) {
  return onValueWritten({
    ref: "/duel/claim/{uid}",
    instance: "magical-growth-default-rtdb",
    region: "asia-southeast1",
    timeoutSeconds: 60,
    memory: "512MiB"
  }, async event => {
    if (!event.data.after.exists()) return;
    const after = event.data.after.val() || {};
    /* 결과가 이미 써진 칸(done)이면 재처리하지 않는다. */
    if (after.done) return;
    const uid = String(event.params.uid || "");
    if (!uid) return;
    const db = getDatabase();
    let res = {ok: 0};
    try {
      res = await applyDevClaim(db, uid, after);
    } catch (e) {
      res = {ok: 0, why: "err"};
    }
    try {
      await db.ref("duel/claim/" + uid).set({
        done: 1,
        ok: res.ok ? 1 : 0,
        why: res.why || "",
        rw: res.rw || null,
        ts: Date.now()
      });
    } catch (e2) { /* ignore */ }
  });
}

module.exports = {createDuelDevScore, createDuelDevClaim};
