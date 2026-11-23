/* 공명 요청 벨: res/{to}/{from} 쓰기 → ntin/{to}/res:q:{from}:{ts}
   수락·거절 벨은 fmsgFriend(rok|rno) 가 ntin 에 넣는다.
   클라는 ntin live→note. applyRes 는 rqIn 목록만 채우고 note 하지 않는다.
   배포: firebase deploy --only functions:resNtin */
"use strict";

const {onValueWritten} = require("firebase-functions/v2/database");
const {pushNtin, TEXT_MAX} = require("./ntin");

const RTDB = {
  instance: "magical-growth-default-rtdb",
  region: "asia-southeast1",
  timeoutSeconds: 30,
  memory: "256MiB"
};

function createResNtin(getDatabase) {
  return onValueWritten({
    ref: "/res/{to}/{from}",
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
    if (before && Number(before.ts) === at) return;
    const name = String(after.n || "누군가").slice(0, 20);
    const id = "res:q:" + from + ":" + at;
    try {
      await pushNtin(getDatabase(), to, id, {
        k: "res",
        t: (name + "님이 공명을 청했다. 친구 화면에서 받아들이거나 거절할 수 있다.").slice(0, TEXT_MAX),
        u: from,
        ts: at
      });
    } catch (e) { /* ignore */ }
  });
}

module.exports = {createResNtin};
