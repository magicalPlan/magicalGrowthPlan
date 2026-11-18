/* 사역마 출정 RTDB 트리거.
   · pex/go/{uid}/{reqId} = { petId, k, ts } → 출발 스탬프
   · pex/take/{uid}/{runId} = { early?, ts } → 귀환·보상(서버 굴림)
   배포: firebase deploy --only functions:pexStart,functions:pexClaim
   RTDB 규칙: pex/go·pex/take 는 auth.uid==uid 쓰기 허용 필요. */
"use strict";

const {onValueWritten} = require("firebase-functions/v2/database");
const {applyPexStart, applyPexClaim} = require("./account/pet-raid");

const RTDB = {
  instance: "magical-growth-default-rtdb",
  region: "asia-southeast1",
  timeoutSeconds: 30,
  memory: "256MiB"
};

function createPexStart(getDatabase) {
  return onValueWritten({
    ref: "/pex/go/{uid}/{reqId}",
    ...RTDB
  }, async event => {
    if (!event.data.after.exists()) return;
    const after = event.data.after.val() || {};
    if (after.done) return;
    const uid = String(event.params.uid || "");
    const reqId = String(event.params.reqId || "");
    if (!uid || !reqId) return;
    const db = getDatabase();
    let res = {ok: 0, why: "err"};
    try {
      res = await applyPexStart(db, uid, after);
    } catch (e) {
      res = {ok: 0, why: "err"};
    }
    try {
      await db.ref("pex/go/" + uid + "/" + reqId).set({
        done: 1,
        ok: res.ok ? 1 : 0,
        why: res.why || "",
        id: res.id || "",
        run: res.run || null,
        nm: res.nm || "",
        hr: res.hr || 0,
        ts: Date.now()
      });
    } catch (e2) { /* ignore */ }
  });
}

function createPexClaim(getDatabase) {
  return onValueWritten({
    ref: "/pex/take/{uid}/{runId}",
    ...RTDB
  }, async event => {
    if (!event.data.after.exists()) return;
    const after = event.data.after.val() || {};
    if (after.done) return;
    const uid = String(event.params.uid || "");
    const runId = String(event.params.runId || "");
    if (!uid || !runId) return;
    const db = getDatabase();
    let res = {ok: 0, why: "err"};
    try {
      res = await applyPexClaim(db, uid, runId, after);
    } catch (e) {
      res = {ok: 0, why: "err"};
    }
    try {
      await db.ref("pex/take/" + uid + "/" + runId).set({
        done: 1,
        ok: res.ok ? 1 : 0,
        why: res.why || "",
        early: res.early ? 1 : 0,
        nm: res.nm || "",
        petNm: res.petNm || "",
        head: res.head || "",
        rw: res.rw || "",
        lines: res.lines || null,
        sc: res.sc || null,
        g: res.g || 0,
        inv: res.inv || null,
        ts: Date.now()
      });
    } catch (e2) { /* ignore */ }
  });
}

module.exports = {createPexStart, createPexClaim};
