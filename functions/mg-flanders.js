/* 플랜더스 밑그림 제출 트리거.
   · event_minigame/flanders/go/{uid}/{reqId} = { c, n, ts } → 세션 확인 후 rank·total_amount
   배포: firebase deploy --only functions:mgFlandersSubmit
   RTDB 규칙: scripts/event-minigame-rules-fragment.txt */
"use strict";

const {onValueWritten} = require("firebase-functions/v2/database");
const {applyMgFlanders} = require("./account/mg-flanders");

const RTDB = {
  instance: "magical-growth-default-rtdb",
  region: "asia-southeast1",
  timeoutSeconds: 30,
  memory: "256MiB"
};

function createMgFlandersSubmit(getDatabase) {
  return onValueWritten({
    ref: "/event_minigame/flanders/go/{uid}/{reqId}",
    ...RTDB
  }, async event => {
    if (!event.data.after.exists()) return;
    const after = event.data.after.val() || {};
    if (after.done) return;
    const uid = String(event.params.uid || "");
    const reqId = String(event.params.reqId || "");
    if (!uid || !reqId) return;
    const db = getDatabase();
    let res = {ok: 0, why: "err", c: 0, err: ""};
    try {
      res = await applyMgFlanders(db, uid, after);
      if (!res.err) res.err = "";
    } catch (e) {
      res = {ok: 0, why: "err", c: 0, err: String((e && e.message) || e || "exception").slice(0, 160)};
    }
    try {
      await db.ref("event_minigame/flanders/go/" + uid + "/" + reqId).set({
        done: 1,
        ok: res.ok ? 1 : 0,
        why: res.why || "",
        err: res.err || "",
        c: res.c || 0,
        run: res.run || 0,
        best: res.best ? 1 : 0,
        ts: Date.now()
      });
    } catch (e2) { /* ignore */ }
  });
}

module.exports = {createMgFlandersSubmit};
