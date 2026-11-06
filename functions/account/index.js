/* 서버용 계정 API.
   accounts/{uid} 작은 경로 PATCH·경험 레벨 동기화·출정 재료/단서 굴림·배율.
   클라 js/db/account.js 와 역할이 같고, 여기는 Cloud Functions(Admin) 전용. */
const xp = require("./xp");
const write = require("./write");
const drops = require("./drops");
const boost = require("./boost");

module.exports = {
  lvOf: xp.lvOf,
  xpAt: xp.xpAt,
  applyMarchPay: write.applyMarchPay,
  accountExists: write.accountExists,
  addClueTally: write.addClueTally,
  rollMats: drops.rollMats,
  rollClp: drops.rollClp,
  marchDropTables: drops.marchDropTables,
  seedHash: drops.seedHash,
  rng: drops.rng,
  CLP: drops.CLP,
  loadMarchBoost: boost.loadMarchBoost,
  marchMuls: boost.marchMuls,
  marchSide: boost.marchSide,
  todayStr: boost.todayStr
};
