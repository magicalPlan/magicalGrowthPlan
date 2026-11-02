/* 배포 직전에 서버 계산용 표를 만든다. firebase deploy 가 이 스크립트를 실행한다.
   사건 글·효과: data/events/common.js, village.js, solo.js 를 고친다. 이 스크립트가 그 파일 전체를 복사한다.
   판정 문장·경험치·절망도(BJ), 대성공 폭(BJ_SOFT·BJ_LOW·BJ_HARD), 권장 전투력(BT_*), 땅 보정(EARTH_P), 낫(SCY_CRIT),
   고독 배율(SOLO_*), 선택 시간(CHOICE_MS), 문장 간격(XSTEP), 출정 간격(XS·XN·XCLOSE·XMAX), 위험도(XDF), 마을 이름(VLN):
   아래 상수 묶음을 고친다. data/game.js 의 같은 숫자는 화면용이라, 출정 결과를 바꾸려면 여기도 같이 고친다.
   불굴·번뜩임·예민함처럼 계산 중간의 특성 규칙은 functions/sim/engine.js.
   functions/sim/tables.js 는 결과물이므로 직접 고치지 않는다. */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
const out = `/* 자동 생성. 고치지 말 것. scripts/pack-sim.js 가 배포 직전에 이 파일을 다시 만든다. */
"use strict";
${read("data/events/common.js")}
${read("data/events/village.js")}
${read("data/events/solo.js")}
const BJ=[{n:"대실패",ex:0,dz:10,t:["마수 무리에 포위당해 간신히 퇴각했다.","공격이 모두 빗나가고 파티가 무너졌다.","예상보다 훨씬 강한 마수에게 짓밟혔다."]},
{n:"실패",ex:2,dz:5,t:["밀려났지만 이를 악물고 버텨 냈다.","상처를 입었지만 겨우 길을 열었다.","마수를 놓쳤지만 다시 대열을 정비했다."]},
{n:"성공",ex:8,dz:0,t:["마수 무리를 쓰러뜨렸다.","호흡을 맞춰 마수를 정리했다.","침착하게 마수를 하나씩 베어 냈다."]},
{n:"대성공",ex:15,dz:-2,t:["완벽한 연계로 마수를 한순간에 쓸어버렸다!","마력이 폭발하며 마수 무리를 단숨에 소멸시켰다!","빈틈 하나 없는 움직임으로 마수를 압도했다!"]}];
const EARTH_P=.3,SCY_CRIT=3.5,SOLO_DF=1.15,SOLO_DZ=1.2,SOLO_EVP=.55,CHOICE_MS=15000,XSTEP=2200;
const XS=300000,XN=15,XCLOSE=120000,XMAX=7;
const XPL=["외곽","폐허","숲길","지하수로","옛 성채","묘지","포탈 흔적","버려진 광산","안개 골짜기","무너진 다리"];
const ABYSS_PL=["심연의 입구","심연 · 잊힌 제단","심연 · 무저갱","심연 · 검은 왕좌","심연 · 끝없는 회랑"];
const XDF=[null,{n:"위험도 ★",df:.85,rw:.8},{n:"위험도 ★★",df:1,rw:1},{n:"위험도 ★★★",df:1.2,rw:1.4},{n:"위험도 ★★★★ 심연",df:1.45,rw:2,dz:1.5}];
const VLN={A:"A마을",B:"B마을",C:"C마을",D:"D마을"};
const BJ_SOFT=40,BJ_HARD=96,BJ_LOW=80,BT_BASE=300,BT_STEP=60,BT_K=60;
module.exports={EV,VEV,SOLO_EV,BJ,EARTH_P,SCY_CRIT,SOLO_DF,SOLO_DZ,SOLO_EVP,CHOICE_MS,XSTEP,XS,XN,XCLOSE,XMAX,XPL,ABYSS_PL,XDF,VLN,BJ_SOFT,BJ_HARD,BJ_LOW,BT_BASE,BT_STEP,BT_K};
`;
fs.mkdirSync(path.join(root, "functions", "sim"), {recursive: true});
fs.writeFileSync(path.join(root, "functions", "sim", "tables.js"), out);
console.log("functions/sim/tables.js");
