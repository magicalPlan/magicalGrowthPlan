/* 로컬: pack.js + seasons.js 조립이 깨지는지 확인. */
"use strict";
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
global.EBOSS_FORM = {nm: "x", list: [], t: 3, hpX: 1.9};
global.CLP_FORM = {
  goal: 10000,
  drop: {x_ok: .35, x_fail: .1, lh: .35, clue: {base: 2}, eb: 3},
  ms: [[.25, {g: 1}], [.5, {g: 1}], [.75, {g: 1}], [1, {g: 1}]]
};
global.CLUE_FORM = [{id: "gate"}, {id: "hall"}, {id: "garden"}, {id: "room"}];
global.TITLE_LIST = [];
eval(fs.readFileSync(path.join(root, "data/event/seasons.js"), "utf8"));
eval(fs.readFileSync(path.join(root, "data/event/pack.js"), "utf8"));
function assert(c, m) { if (!c) throw new Error(m); }
assert(EVENT && EVENT.key, "EVENT missing");
assert(EVENT.piece && EVENT.piece.id, "piece.id missing — seasons bind failed?");
assert(Number.isFinite(EVENT.from) && Number.isFinite(EVENT.to), "from/to missing");
assert(CLP && CLP.id && CLP.goal && CLP.ms && CLP.ms.length === 4, "CLP broken");
assert(EBOSS.list && EBOSS.list.length === 6, "EBOSS.list");
assert(CLUE.length === 4 && CLUE[0].nm, "CLUE rows");
assert(EVENT_ORD && EVENT_ORD.title, "EVENT_ORD");
assert(typeof eventLive === "function" && eventLive(), "eventLive should be on when FORCE or in window");
console.log("ok", EVENT.key, CLP.id, EVENT_ORD.title, "force="+EVENT_FORCE);
