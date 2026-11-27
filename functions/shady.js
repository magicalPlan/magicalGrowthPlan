/* 수상한 상인 상자 RTDB 트리거.
   · shady/go/{uid}/{reqId} = { ts }
   · 서버: 골드 판단 → 굴림 → 차감·지급 → 이 칸에 done·show
   · 배포: firebase deploy --only functions:shadyPull */
"use strict";

const {onValueWritten} = require("firebase-functions/v2/database");
const {applyShadyPull} = require("./account/shady");

const RTDB = {
  instance: "magical-growth-default-rtdb",
  region: "asia-southeast1",
  timeoutSeconds: 30,
  memory: "256MiB"
};

function createShadyPull(getDatabase) {
  return onValueWritten({
    ref: "/shady/go/{uid}/{reqId}",
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
      res = await applyShadyPull(db, uid, reqId);
    } catch (e) {
      res = {ok: 0, why: "err"};
    }
    try {
      await db.ref("shady/go/" + uid + "/" + reqId).set({
        done: 1,
        ok: res.ok ? 1 : 0,
        why: res.why || "",
        cost: res.cost || 0,
        eggInv: res.eggInv || "",
        show: res.show || null,
        ts: Date.now()
      });
    } catch (e2) { /* ignore */ }
  });
}

module.exports = {createShadyPull};
