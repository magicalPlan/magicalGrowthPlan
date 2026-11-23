/* 1:1 벨: dmn/{to}/{from} 쓰기 → ntin/{to}/dm:…
   dmn·rooms/xd DB 는 그대로. 알림(note·토스트)만 ntin 공통 live.
   퇴장(left)은 k=dmleft(알림함 note 없음). 클라는 ntin live→dmHear.
   배포: firebase deploy --only functions:dmNtin */
"use strict";

const {onValueWritten} = require("firebase-functions/v2/database");
const {pushNtin, TEXT_MAX} = require("./ntin");

const RTDB = {
  instance: "magical-growth-default-rtdb",
  region: "asia-southeast1",
  timeoutSeconds: 30,
  memory: "256MiB"
};

function createDmNtin(getDatabase) {
  return onValueWritten({
    ref: "/dmn/{to}/{from}",
    ...RTDB
  }, async event => {
    if (!event.data.after.exists()) return;
    const to = String(event.params.to || "");
    const from = String(event.params.from || "");
    if (!to || !from || to === from) return;
    const after = event.data.after.val() || {};
    const ts = Number(after.ts);
    const at = Number.isFinite(ts) && ts > 0 ? ts : Date.now();
    const before = event.data.before.exists() ? event.data.before.val() || {} : null;
    if (before && Number(before.ts) === at && !!before.left === !!after.left) return;
    const name = String(after.n || "누군가").slice(0, 20);
    try {
      if (after.left) {
        await pushNtin(getDatabase(), to, "dm:left:" + from + ":" + at, {
          k: "dmleft",
          t: "left",
          u: from,
          ts: at
        });
        return;
      }
      const x = String(after.x || "").slice(0, 40);
      const t = (name + "님에게서 1:1 메시지가 왔다" + (x ? ": " + x : ".")).slice(0, TEXT_MAX);
      await pushNtin(getDatabase(), to, "dm:" + from + ":" + at, {
        k: "dm",
        t,
        u: from,
        ts: at
      });
    } catch (e) { /* ignore */ }
  });
}

module.exports = {createDmNtin};
