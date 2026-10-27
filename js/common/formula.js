/* 전투력, 경험치, 절망도, 가격, 강화처럼 여러 화면이 같이 쓰는 계산.
   사역마가 보태는 값은 js/pet/effect.js 의 petEff 를 부른다.
   화면이 이 함수들을 부를 때는 시설·재해·사역마 스크립트까지 이미 읽힌 뒤다. */

// 등급 칸. GL 은 "EDCBAS" 라서 E 는 0, S 는 5 다. 전투력은 칸마다 8 이 더해진다.
const gi=()=>GL.indexOf(C.g);
/* 특성 전투력.
   천재 +4.
   대기만성: 레벨 8 전에는 -2. 그 뒤에는 레벨의 절반(최대 8)과 레벨의 1/4 중 큰 값.
   폭주: 절망도 60 이상이면 +6.
   불안정한 마력 +6. 상처 입은 마음 +5. 그 밖은 0. */
const tpw=()=>{const t=C.t,lv=C.lv||1,dz=C.dz||0;return t==="천재"?4:t==="대기만성"?(lv<8?-2:Math.max(Math.min(8,Math.floor(lv/2)),Math.floor(lv/4))):t==="폭주"?(dz>=60?6:0):t==="불안정한 마력"?6:t==="상처 입은 마음"?5:0};
// 강화 단계. 무기 번호 i 의 기록(w0, w1, ...)이 없으면 0.
const wlv=i=>(C.wl&&C.wl["w"+i])||0;
// 지금 그 번호의 무기를 장착 중이면 참.
const eq=i=>C.wp===i;
// 강화가 전투력에 더하는 값. 칼(0번)은 단계마다 2, 다른 무기는 단계마다 1.
const wup=i=>wlv(i)*(i===0?2:1);
/* 전투력.
   10
   + 특성 보너스
   + 등급 칸 × 8
   + 레벨 × 3
   + 추가 전투력 C.b
   + 장착 무기 기본 전투력 + 강화 보너스 + 오늘만 붙는 임시 강화
   + 불 속성이면 6
   + 어둠 속성이고 절망도가 50 이상이면 6
   + 힘의 각인 단계 × 4
   + 희망의 등대 5단계면 WF_PW
   + 함께하는 사역마의 전투력 */
const pw=()=>tpw()+10+gi()*8+C.lv*3+(C.b||0)+(C.wp>=0?WP[C.wp][3]+wup(C.wp)+(C.wtmp&&C.wtmp.day===today()?(Number(C.wtmp.v)||1):0):0)+(C.a.includes("불")?6:0)+(C.a.includes("어둠")&&C.dz>=50?6:0)+4*rnLv("pow")+(wfLv()>=5?WF_PW:0)+petEff("pw");

// 각인 비용. 지금 단계 L 에서 다음 단계로 가는 마력석은 L+2 개다. 0단계면 2개, 1단계면 3개.
const rnCost=L=>L+2;
// 몸에 새긴 각인 단계. 없으면 0, RN_MAX 를 넘기지 않는다.
function rnLv(k){return C&&C.rn?Math.min(RN_MAX,Math.max(0,Number(C.rn[k])||0)):0}

/* 레벨과 경험치. 레벨이 오를수록 다음 레벨까지 필요한 경험치가 늘어난다. 숫자는 data/game.js 의 XP_BASE, XP_STEP.
   xpNeed(L) 은 L 에서 L+1 로 가는 경험치. xpAt(L) 은 레벨 L 이 시작되는 누적 경험치. lvOf 는 누적 경험치로 본 레벨. */
function xpNeed(lv){return XP_BASE+XP_STEP*(Math.max(1,Number(lv)||1)-1)}
function xpAt(lv){const n=Math.max(1,Number(lv)||1)-1;return XP_BASE*n+XP_STEP*n*(n-1)/2}
function lvOf(ex){ex=Math.max(0,Number(ex)||0);let L=1;while(L<9999&&xpAt(L+1)<=ex)L++;return L}
// 예전 방식(40마다 1레벨)으로 쌓인 경험치를 새 방식으로 옮긴다. 레벨은 그대로 두고, 그 레벨 안에서 채운 비율도 그대로 옮긴다. 한 번만.
function xpMigrate(){if(!C||C.xv>=2)return;const ex=Math.max(0,Number(C.ex)||0),L=1+Math.floor(ex/40),r=(ex-(L-1)*40)/40;C.ex=xpAt(L)+Math.floor(r*xpNeed(L));C.lv=L;C.xv=2}

/* 경험치 ex 와 절망도 dz 를 캐릭터에 반영한다. 양수는 오름, 음수는 내림.
   타락 중에는 절망도가 내려가지 않고, 경험치도 0 이 된다.
   절망도가 오를 때: 냉정 ×0.8, 상처 입은 마음 ×1.2, 평온 각인 단계마다 4% 감소,
   등대 3단계면 WF_CALM 만큼 더 줄고, 사역마 dz 만큼 더 줄인다.
   절망도가 내릴 때: 낙천 ×1.3, 사역마 dz 는 오를 때만 쓴다.
   경험치: 지혜 각인 단계마다 4% 증가, 끈기 ×1.2, 후유증이 남아 있으면 ×0.5.
   물 속성은 오르는 절망도를 75% 로 줄이되 최소 1. 바람 속성은 경험치 ×1.15.
   반영 전에 옛 경험치를 새 곡선으로 옮기고, 레벨은 누적 경험치로 다시 계산한다. 절망도는 0~100 으로 자른다.
   100 이 되면 타락하고, 90 을 처음 넘으면 타락 직전을 알린다. */
function gain(ex,dz){const oldDz=C.dz||0,t=C.t;if(C.fall&&dz<0)dz=0;if(dz>0){if(t==="냉정")dz*=.8;if(t==="상처 입은 마음")dz*=1.2}if(dz<0&&t==="낙천")dz*=1.3;if(dz>0)dz*=(1-.04*rnLv("calm"))*(wfLv()>=3?1-WF_CALM:1)*(1-petEff("dz"));if(ex>0)ex*=1+.04*rnLv("wis");if(ex>0&&t==="끈기")ex*=1.2;if(ex>0&&C.fall)ex=0;if(ex>0&&scarLeft()>0)ex*=.5;if(dz>0&&C.a.includes("물"))dz=Math.max(1,Math.round(dz*.75));if(ex>0&&C.a.includes("바람"))ex=Math.round(ex*1.15);xpMigrate();C.ex+=Math.round(ex);C.lv=lvOf(C.ex);C.dz=Math.max(0,Math.min(100,C.dz+Math.round(dz)));titleState();C.stats.maxDespair=Math.max(C.stats.maxDespair||0,C.dz);if(oldDz>0&&C.dz===0)C.stats.reachedZero=true;if(C.dz>=95&&!C.fall)C.edge=1;if(C.fall)C.edge=0;if(C.edge&&C.dz===0){C.edge=0;C.stats.edgeHope=1}save();checkTitles();
 if(!C.fall){if(C.dz>=100)fallen();else if(oldDz<90&&C.dz>=90)note("warn","절망도가 "+C.dz+"에 이르렀다. 타락 직전이다."),alertBox("타락 직전","절망도가 "+C.dz+"에 이르렀다. 마음이 무너지기 직전이다.\n절망도가 100이 되면 타락해 마수가 된다. 공명이나 선물로 친구들의 도움을 받자.")}}

/* 10분마다 내려가는 절망도.
   HEAL_DZ 에 온천(spring) 단계와 사역마 회복을 더한다.
   우리 마을이 홍수이거나 마인의 저주가 있으면 그 각각이 절반으로 만든다. 둘 다면 1/4.
   줄어든 뒤에만 올림해서, 1 미만이 되어 회복이 사라지지 않게 한다. */
const healAmt=()=>{const h=HEAL_DZ+facLv("spring")+petEff("heal"),f=(disMine()==="flood"?.5:1)*(witchCurse()?.5:1);return f<1?Math.ceil(h*f):h};
// 다음 자연 회복까지 남은 분. 주기는 HEAL_MS 이고, 마지막 회복 시각 C.dzT 부터 다시 센다.
const healTxt=()=>{if(!C)return "";if(C.fall)return "타락 중에는 절망도가 자연히 회복되지 않는다.";if(C.healOff)return "자연 회복을 꺼 두었다. 절망도가 저절로 내려가지 않는다.";if(!(C.dz>0))return "";const left=HEAL_MS-(Date.now()-(C.dzT||Date.now()))%HEAL_MS;return "다음 자연 회복(-"+healAmt()+")까지 "+Math.max(1,Math.ceil(left/60000))+"분"};

/* 상점 가격. 정가 p 에 할인과 할증을 곱한 뒤 올린다.
   A마을은 ×0.9.
   시장 시설 단계마다 2% 할인.
   사역마 shop 만큼 더 할인.
   우리 마을에 산불이 있으면 ×1.2. */
const pr=p=>Math.ceil(p*(C.v==="A"?.9:1)*(1-.02*facLv("market"))*(1-petEff("shop"))*(disMine()==="fire"?1.2:1));

/* 강화 성공 확률(%). 표 UPR[단계] 에서 시작한다.
   행운 특성이면 +5, 대장간 단계마다 +2, 마을에 강화 보너스가 있으면 그 값을 더하고, 사역마 up 을 더한다.
   100 을 넘기지 않는다. */
const upr=L=>Math.min(100,UPR[L]+(C.t==="행운"?5:0)+2*facLv("forge")+((VL[C.v]||{}).up||0)+petEff("up"));

/* 장기 토벌 성공 확률. 전투력÷권장 전투력 × 0.85 에 사역마 lh 를 더한다.
   30% 보다 낮아지지 않고, 95% 보다 높아지지 않는다. */
const lhChance=(pwv,req)=>Math.max(.3,Math.min(.95,pwv/req*.85+petEff("lh")));
