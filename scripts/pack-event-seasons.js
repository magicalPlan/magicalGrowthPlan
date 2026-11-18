/* 배포 직전: data/event/seasons.js → functions/account/event-seasons.js
   firebase.json functions.predeploy. pack-sim.js 와 같은 방식.
   시즌 기간·단서 id·알 inv 는 seasons.js 만 고친다. 이 스크립트·생성 파일은 직접 고치지 않는다. */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(root, "data", "event", "seasons.js"), "utf8");
const out = `/* 자동 생성. 고치지 말 것. scripts/pack-event-seasons.js 가 배포 직전에 다시 만든다.
   출처: data/event/seasons.js */

"use strict";
${src}
function clpAt(now) {
  now = now == null ? Date.now() : now;
  for (let i = 0; i < EVENT_SEASONS.length; i++) {
    const s = EVENT_SEASONS[i];
    if (now >= s.from && now < s.to) return s;
  }
  return null;
}
function eggWindow(inv) {
  for (let i = 0; i < EVENT_SEASONS.length; i++) {
    if (EVENT_SEASONS[i].eggInv === inv) {
      const s = EVENT_SEASONS[i];
      return {from: s.from, to: s.to};
    }
  }
  return {from: 0, to: 0};
}
const CLP_SEASONS = EVENT_SEASONS.map(s => ({id: s.id, from: s.from, to: s.to, drop: s.drop}));
const CLP = CLP_SEASONS[0];
const PET_EV = eggWindow("eggsEv");
const PET_EV2 = eggWindow("eggsEv2");
module.exports = {EVENT_SEASONS, CLP_SEASONS, CLP, clpAt, eggWindow, PET_EV, PET_EV2};
`;
const destDir = path.join(root, "functions", "account");
fs.mkdirSync(destDir, {recursive: true});
const dest = path.join(destDir, "event-seasons.js");
fs.writeFileSync(dest, out);
console.log("functions/account/event-seasons.js");
