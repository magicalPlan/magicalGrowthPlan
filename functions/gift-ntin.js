/* 선물 도착 벨: ginbox/{to}/{id} 생성 → ntin/{to}/gift:{id}
   받은 함 목록은 계속 ginbox live. 알림(note·토스트)만 ntin 공통 통로.
   배포: firebase deploy --only functions:giftNtin */
"use strict";

const {onValueWritten} = require("firebase-functions/v2/database");
const {pushNtin, TEXT_MAX} = require("./ntin");

const RTDB = {
  instance: "magical-growth-default-rtdb",
  region: "asia-southeast1",
  timeoutSeconds: 30,
  memory: "256MiB"
};

/* data/game.js ITM 선물 이름과 맞춘다. */
const GIFT_NM = {g1: "작은 꽃다발", g2: "별빛 쿠키", g3: "달빛 편지", g4: "꿈꾸는 오르골"};

function createGiftNtin(getDatabase) {
  return onValueWritten({
    ref: "/ginbox/{to}/{id}",
    ...RTDB
  }, async event => {
    if (!event.data.after.exists() || event.data.before.exists()) return;
    const to = String(event.params.to || "");
    const id = String(event.params.id || "");
    if (!to || !id) return;
    const after = event.data.after.val() || {};
    const from = String(after.u || "");
    const name = String(after.n || "누군가").slice(0, 20);
    const gid = String(after.g || "");
    const gift = GIFT_NM[gid] || "선물";
    const ts = Number(after.ts);
    const at = Number.isFinite(ts) && ts > 0 ? ts : Date.now();
    try {
      await pushNtin(getDatabase(), to, "gift:" + id, {
        k: "gift",
        t: (name + "님이 「" + gift + "」을(를) 보냈다. 가방의 받은 선물함에 넣어 두었다.").slice(0, TEXT_MAX),
        u: from,
        ts: at
      });
    } catch (e) { /* ignore */ }
  });
}

module.exports = {createGiftNtin};
