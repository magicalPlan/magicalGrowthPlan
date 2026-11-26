/* 전투력, 경험치, 절망도, 가격, 강화처럼 여러 화면이 같이 쓰는 계산.
   사역마가 보태는 값은 js/pet/effect.js 의 petEff 를 부른다.
   등대·시설·재해·사역마는 이 파일보다 뒤에 읽히므로, 없거나 아직 없으면 0으로 본다(wfLv is not defined 로 로그인이 깨지지 않게). */

// 등급 칸. GL 은 "EDCBAS" 라서 E 는 0, S 는 5 다. 전투력은 칸마다 8 이 더해진다.
const gi=()=>GL.indexOf(C.g);
const _fn=(n,f)=>{try{return typeof f==="function"?f():0}catch(e){return 0}};
const _wfLv=()=>_fn("wfLv",typeof wfLv!=="undefined"?wfLv:0);
const _petEff=k=>_fn("petEff",typeof petEff!=="undefined"?()=>petEff(k):0);
const _facLv=k=>_fn("facLv",typeof facLv!=="undefined"?()=>facLv(k):0);
const _disMine=()=>{try{return typeof disMine==="function"?disMine():""}catch(e){return ""}};
const _witchCurse=()=>{try{return typeof witchCurse==="function"?witchCurse():null}catch(e){return null}};
const _attrs=()=>Array.isArray(C&&C.a)?C.a:[];
/* 특성 전투력(평탄 가산만). 천재·폭주(%)는 pw() 끝의 비율 곱에 있다.
   대기만성: 레벨 50 전 -5, 50~99는 0, 100부터 floor(레벨/5).
   불안정한 마력 +6. 상처 입은 마음 +5. 그 밖은 0. */
const tpw=()=>{const t=C.t,lv=C.lv||1;return t==="대기만성"?(lv<50?-5:lv>=100?Math.floor(lv/5):0):t==="불안정한 마력"?6:t==="상처 입은 마음"?5:0};
// 강화 단계. 무기 번호 i 의 기록(w0, w1, ...)이 없으면 0.
const wlv=i=>(C.wl&&C.wl["w"+i])||0;
// 지금 그 번호의 무기를 장착 중이면 참.
const eq=i=>C.wp===i;
const pwCandyTmp=()=>C&&C.pwtmp&&C.pwtmp.day===today()?Math.max(0,Number(C.pwtmp.v)||0):0;
// 강화가 전투력에 더하는 값. 칼(0번)은 단계마다 2, 다른 무기는 단계마다 1.
const wup=i=>wlv(i)*(i===0?2:1);
/* 전투력.
   1) 평탄 합 = 10 + 특성 평탄(tpw) + 등급×8 + 레벨×3 + C.b + 무기·강화·임시
      + 불 6 + 어둠(절망≥50) 6 + 힘의 각인×4 + 등대5 WF_PW + 사역마 평탄 pw
   2) 비율 곱 = 평탄 합 × (1 + 사역마 pwp + 천재 0.05 + 폭주(절망≥60) 0.08), 반올림
      · %는 더해서 한 번만 곱한다(예: 천재+폭주 → ×1.13).
      · 평탄이 100이면 폭주만 있을 때 108.
   매지컬 마치 참가 때 me().p 로 자리(xm)에 올리며, 서버는 이 값을 다시 계산하지 않는다.
   권장(적정) 전투력 식은 js/room.js·functions/sim/engine.js 의 recPw / battleT 다.
   목록용 슬림식은 functions/roster-mirror.js mirrorPw 와 맞춘다. */
const pw=(()=>{const base=()=>tpw()+10+gi()*8+(C.lv||1)*3+(C.b||0)+(C.wp>=0&&typeof WP!=="undefined"&&WP[C.wp]?WP[C.wp][3]+wup(C.wp)+(C.wtmp&&C.wtmp.day===today()?(Number(C.wtmp.v)||1):0):0)+pwCandyTmp()+(_attrs().includes("불")?6:0)+(_attrs().includes("어둠")&&C.dz>=50?6:0)+4*rnLv("pow")+(_wfLv()>=5&&typeof WF_PW==="number"?WF_PW:0)+_petEff("pw");return()=>{const b=base(),pct=_petEff("pwp")+(C&&C.t==="천재"?0.05:0)+(C&&C.t==="폭주"&&(C.dz||0)>=60?0.08:0);return pct?Math.round(b*(1+pct)):b}})();
/* 허브 프로필용 임시·조건 평탄 증가량. 폭주(+8%)는 %라서 숫자 합이 아니라 pwExtraTxt 에 따로 적는다. */
function pwCond(){if(!C)return 0;return _attrs().includes("어둠")&&(C.dz||0)>=50?6:0}
function pwTmp(){if(!C)return 0;return C.wtmp&&typeof today==="function"&&C.wtmp.day===today()?(Number(C.wtmp.v)||1):0}
function pwExtraTxt(){if(!C)return "";const n=pwCond()+pwTmp()+pwCandyTmp(),bits=[];if(n)bits.push("+"+n);if(C.t==="폭주"&&(C.dz||0)>=60)bits.push("+8%");return bits.length?"("+bits.join(", ")+")":""}
const dzFloorToday=()=>C&&C.dzFloor&&C.dzFloor.day===today()?Math.max(0,Math.min(100,Number(C.dzFloor.v)||0)):0;

// 각인 비용. 지금 단계 L 에서 다음 단계로 가는 마력석은 L+2 개다. 0단계면 2개, 1단계면 3개.
const rnCost=L=>L+2;
// 몸에 새긴 각인 단계. 없으면 0, RN_MAX 를 넘기지 않는다.
function rnLv(k){return C&&C.rn?Math.min(RN_MAX,Math.max(0,Number(C.rn[k])||0)):0}

/* 레벨과 경험치. 숫자는 data/game.js 의 XP_BASE, XP_STEP, XP_BEND, XP_BEND_DIV.
   21→22까지는 40부터 10씩 늘어난다. 22→23부터는 (L-20)²/4 를 더한다.
   xpNeed(L) 은 L 에서 L+1 로 가는 경험치. xpAt(L) 은 레벨 L 이 시작되는 누적 경험치. lvOf 는 누적 경험치로 본 레벨. */
function xpNeed(lv){lv=Math.max(1,Number(lv)||1);const lin=XP_BASE+XP_STEP*(lv-1),over=lv-(XP_BEND||20);return over>0?lin+Math.floor(over*over/(XP_BEND_DIV||4)):lin}
function xpSqSum(m){m=Math.floor(Number(m)||0);if(m<=0)return 0;return Math.round((m*(m+1)*(2*m+1)/6-((m+1)>>1))/4)}
function xpAt(lv){const n=Math.max(1,Number(lv)||1)-1,lin=XP_BASE*n+XP_STEP*n*(n-1)/2,bend=XP_BEND||20,div=XP_BEND_DIV||4,m=n-bend;if(!(m>0))return lin;if(div===4)return lin+xpSqSum(m);let s=0;for(let i=1;i<=m;i++)s+=Math.floor(i*i/div);return lin+s}
function lvOf(ex){ex=Math.max(0,Number(ex)||0);let L=1;while(L<9999&&xpAt(L+1)<=ex)L++;return L}
function xpNeedV2(lv){return XP_BASE+XP_STEP*(Math.max(1,Number(lv)||1)-1)}
function xpAtV2(lv){const n=Math.max(1,Number(lv)||1)-1;return XP_BASE*n+XP_STEP*n*(n-1)/2}
function lvOfV2(ex){ex=Math.max(0,Number(ex)||0);let L=1;while(L<9999&&xpAtV2(L+1)<=ex)L++;return L}
/* 예전 곡선의 누적 경험치를 지금 곡선으로 옮긴 값. xv 가 3 이상이면 이미 지금 곡선이다.
   2 는 10씩 늘어나던 곡선, 그 아래는 40마다 1레벨이던 곡선. 레벨과 그 칸의 비율은 그대로다. */
function xpCurve(ex,xv){ex=Math.max(0,Number(ex)||0);xv=Number(xv)||0;if(xv>=3)return ex;let L,r;
 if(xv<2){L=1+Math.floor(ex/40);r=(ex-(L-1)*40)/40}else{L=lvOfV2(ex);const need=xpNeedV2(L);r=need>0?(ex-xpAtV2(L))/need:0}
 if(!(r>0))r=0;return xpAt(L)+Math.floor(r*xpNeed(L))}
// 캐릭터의 경험치를 지금 곡선으로 옮긴다. 레벨은 그대로 두고, 그 레벨 안에서 채운 비율도 그대로 옮긴다. 한 번만.
function xpMigrate(){if(!C||Number(C.xv)>=3)return false;const ex=xpCurve(C.ex,C.xv),lv=lvOf(ex);if(C.ex===ex&&C.lv===lv&&Number(C.xv)===3)return false;C.ex=ex;C.lv=lv;C.xv=3;return true}

/* 경험치 ex 와 절망도 dz 를 캐릭터에 반영한다. 양수는 오름, 음수는 내림.
   타락 중에는 절망도가 내려가지 않고, 경험치도 0 이 된다.
   절망도가 오를 때: 냉정 ×0.8, 상처 입은 마음 ×1.2, 평온 각인 단계마다 4% 감소,
   등대 3단계면 WF_CALM 만큼 더 줄고, 사역마 dz 만큼 더 줄인다.
   절망도가 내릴 때: 낙천 ×1.15, 사역마 dz 는 오를 때만 쓴다.
   경험치: 지혜 각인 단계마다 4% 증가, 끈기 ×1.15, 후유증이 남아 있으면 ×0.5.
   물 속성은 오르는 절망도를 75% 로 줄이되 최소 1. 바람 속성은 경험치 ×1.15.
   반영 전에 옛 경험치를 새 곡선으로 옮기고, 레벨은 누적 경험치로 다시 계산한다. 절망도는 0~100 으로 자른다.
   100 이 되면 타락하고, 90 을 처음 넘으면 타락 직전을 알린다. */
function gain(ex,dz){const oldDz=C.dz||0,t=C.t;if(C.fall&&dz<0)dz=0;if(dz>0){if(t==="냉정")dz*=.8;if(t==="상처 입은 마음")dz*=1.2}if(dz<0&&t==="낙천")dz*=1.15;if(dz>0)dz*=(1-.04*rnLv("calm"))*(_wfLv()>=3&&typeof WF_CALM==="number"?1-WF_CALM:1)*(1-_petEff("dz"));if(ex>0)ex*=1+.04*rnLv("wis");if(ex>0&&t==="끈기")ex*=1.15;if(ex>0&&C.fall)ex=0;if(ex>0&&scarLeft()>0)ex*=.5;if(dz>0&&_attrs().includes("물"))dz=Math.max(1,Math.round(dz*.75));if(ex>0&&_attrs().includes("바람"))ex=Math.round(ex*1.15);xpMigrate();C.ex+=Math.round(ex);C.lv=lvOf(C.ex);C.dz=Math.max(dzFloorToday(),Math.min(100,C.dz+Math.round(dz)));titleState();C.stats.maxDespair=Math.max(C.stats.maxDespair||0,C.dz);if(oldDz>0&&C.dz===0)C.stats.reachedZero=true;if(C.dz>=95&&!C.fall)C.edge=1;if(C.fall)C.edge=0;if(C.edge&&C.dz===0){C.edge=0;C.stats.edgeHope=1}save();checkTitles();
 if(!C.fall){if(C.dz>=100)fallen();else if(oldDz<90&&C.dz>=90)note("warn","절망도가 "+C.dz+"에 이르렀다. 타락 직전이다."),alertBox("타락 직전","절망도가 "+C.dz+"에 이르렀다. 마음이 무너지기 직전이다.\n절망도가 100이 되면 타락해 마수가 된다. 공명이나 선물로 친구들의 도움을 받자.")}}

/* 10분마다 내려가는 절망도.
   HEAL_DZ 에 온천(spring) 단계와 사역마 회복을 더한다.
   우리 마을이 홍수이거나 마인의 저주가 있으면 그 각각이 절반으로 만든다. 둘 다면 1/4.
   줄어든 뒤에만 올림해서, 1 미만이 되어 회복이 사라지지 않게 한다. */
const healAmt=()=>{const h=HEAL_DZ+_facLv("spring")+_petEff("heal"),f=(_disMine()==="flood"?.5:1)*(_witchCurse()?.5:1);return f<1?Math.ceil(h*f):h};
// 다음 자연 회복까지 남은 분. 주기는 HEAL_MS 이고, 마지막 회복 시각 C.dzT 부터 다시 센다.
const healTxt=()=>{if(!C)return "";if(C.fall)return "타락 중에는 절망도가 자연히 회복되지 않는다.";if(C.healOff)return "자연 회복을 꺼 두었다. 절망도가 저절로 내려가지 않는다.";if(!(C.dz>0))return "";const left=HEAL_MS-(Date.now()-(C.dzT||Date.now()))%HEAL_MS;return "다음 자연 회복(-"+healAmt()+")까지 "+Math.max(1,Math.ceil(left/60000))+"분"};

/* 상점 가격. 정가 p 에 할인과 할증을 곱한 뒤 올린다.
   A마을은 ×0.9.
   시장 시설 단계마다 2% 할인.
   사역마 shop 만큼 더 할인.
   우리 마을에 산불이 있으면 ×1.2. */
const pr=p=>Math.ceil(p*(C.v==="A"?.9:1)*(1-.02*_facLv("market"))*(1-_petEff("shop"))*(_disMine()==="fire"?1.2:1));

/* 강화 성공 확률(%). 표 UPR[단계] 에서 시작한다.
   대장간 단계마다 +2, 마을에 강화 보너스가 있으면 그 값을 더하고, 사역마 up 을 더한다.
   100 을 넘기지 않는다. (행운은 강화가 아니라 출정 골드·알 드롭에 쓴다.) */
const upr=L=>Math.min(100,UPR[L]+2*_facLv("forge")+((VL[C.v]||{}).up||0)+_petEff("up"));

/* 장기 토벌 성공 확률. 전투력÷권장 전투력 × 0.85 에 사역마 lh 를 더한다.
   최저 30%. 상한은 lh 사역마(거북·용·순록)가 있으면 100%, 없으면 95%.
   (예전에 min(.95, 기본+펫)이라 펫 +%p 가 상한에 막혀 보이지 않았다.) */
const lhChance=(pwv,req)=>{const pe=_petEff("lh"),cap=pe>0?1:.95,base=Number(req)>0?pwv/req*.85:cap;return Math.max(.3,Math.min(cap,base+pe))};
/* 집중: 장기 토벌·단서 탐색 소요 ms ×0.95. 완주 보상은 표의 기준 시간(L[2]/L.hr) 그대로. */
const tripMsMul=()=>C&&C.t==="집중"?0.95:1;
const tripDurMs=hr=>Math.max(1,Math.round((Number(hr)||0)*3600000*tripMsMul()));
const tripWaitTxt=hr=>{const m=Math.max(1,Math.round(tripDurMs(hr)/60000));if(m<60)return m+"분";const h=Math.floor(m/60),mm=m%60;return mm?h+"시간 "+mm+"분":h+"시간"};
/* 장기 토벌 골드·경험치 % 구간. 단계 1 → 95~100, 2 → 90~95, … (양끝 포함). */
const lhPctRange=st=>{const s=Math.max(1,Number(st)||1),lo=95-5*(s-1),hi=100-5*(s-1);return[lo,hi]};
const lhRollPct=(st,rand)=>{const[lo,hi]=lhPctRange(st);return lo+Math.floor(rand()*(hi-lo+1))};
/* 목록 '약' 표시용. 구간 중앙 % 로 노브×시간×0.01. */
const lhEst=(knob,hr,st)=>{const[lo,hi]=lhPctRange(st);return Math.round(Number(knob)*Number(hr)*((lo+hi)/2)*0.01)};