/* 사역마의 알. 이벤트 알 인수인계: data/event/HANDOFF.md §8
   main.js 다음. 출정·장기 토벌 petDrop, 성장 기록 petBuyEgg · petIncubate · petHatch.
   시즌 알: pack.js EVENT_PACKS[].egg → PET_EV(eggsEv) / PET_EV2(eggsEv2).
   petEvOn / petEv2On ← eventLive().egg.inv (날짜 또는 EVENT_FORCE). 서버 boost.js 는 날짜만.
   egg.ev: 1 → PET_EV, 2 → PET_EV2. */
/* 알 개수는 0 이상의 정수만. 품는 중 {t0,t1}. 회귀로 시각이 깨지면 개수로 되돌린다. */
function eggNum(n){n=Math.floor(Number(n));return isFinite(n)&&n>0?n:0}
function eggEvKind(e){const v=e&&e.ev;return v===2?2:v?1:0}
function eggEvBag(kind){return kind===2?(typeof PET_EV2!=="undefined"?PET_EV2:null):kind===1?(typeof PET_EV!=="undefined"?PET_EV:null):null}
function eggFix(){if(!C)return false;let ch=false;if(C.eggs!=null&&C.eggs!==eggNum(C.eggs)){C.eggs=eggNum(C.eggs);ch=true}
 if(C.eggsEv!=null&&C.eggsEv!==eggNum(C.eggsEv)){C.eggsEv=eggNum(C.eggsEv);ch=true}
 if(C.eggsEv2!=null&&C.eggsEv2!==eggNum(C.eggsEv2)){C.eggsEv2=eggNum(C.eggsEv2);ch=true}
 const e=C.egg;if(e==null||e===false){if(e!=null){C.egg=null;ch=true}return ch}
 if(typeof e==="number"||typeof e==="string"){C.eggs+=eggNum(e);C.egg=null;return true}
 if(typeof e!=="object"){C.egg=null;return true}
 const t0=Number(e.t0),t1=Number(e.t1);if(!isFinite(t0)||!isFinite(t1)){const k=eggEvKind(e);if(k===2)C.eggsEv2=(C.eggsEv2||0)+1;else if(k===1)C.eggsEv=(C.eggsEv||0)+1;else C.eggs=(C.eggs||0)+1;C.egg=null;return true}
 if(e.t0!==t0||e.t1!==t1){e.t0=t0;e.t1=t1;ch=true}return ch}
/* 회귀: 부화 중 알·알 재고를 전부 0으로 비운다. 환불·부화 없음. */
function eggRstAbort(ch){if(!ch||typeof ch!=="object")return false;
 const had=!!(ch.egg||ch.eggs||ch.eggsEv||ch.eggsEv2);
 ch.egg=null;ch.eggs=0;ch.eggsEv=0;ch.eggsEv2=0;return had}
/* 알 떨어뜨리기(출정·장기 토벌). 받았으면 안내 문구를 돌려준다.
   기본 확률 PET_DROP_X(출정)·PET_DROP_LH(장기). 행운이면 +0.05(%p) — 일반 알·이벤트 알(eggsEv/eggsEv2) 각각 독립 판정.
   매지컬 마치는 서버 marchSide 가 같은 식으로 굴린다(클라 petDrop 안 탐). */
function petDrop(src){const p=Math.min(1,(src==="lh"?PET_DROP_LH:PET_DROP_X)+(C&&C.t==="행운"?0.05:0)),out=[];
 if(Math.random()<p){C.eggs=(C.eggs||0)+1;note("quest","사역마의 알을 주웠다! 성장 기록에서 품을 수 있다.");out.push("🥚 사역마의 알을 주웠다!")}
 if(petEvOn()&&Math.random()<p){C.eggsEv=(C.eggsEv||0)+1;const until=typeof eventRangeTxt==="function"?eventRangeTxt(PET_EV.from,PET_EV.to):"";note("quest",PET_EV.nm+"을(를) 주웠다!"+(until?" "+until+"에만 얻을 수 있는 알이다.":""));try{toast(PET_EV.ic+" "+PET_EV.nm+"을(를) 주웠다!")}catch(e){}out.push(PET_EV.ic+" "+PET_EV.nm+"을(를) 주웠다!")}
 if(petEv2On()&&Math.random()<p){C.eggsEv2=(C.eggsEv2||0)+1;const until=typeof eventRangeTxt==="function"?eventRangeTxt(PET_EV2.from,PET_EV2.to):"";note("quest",PET_EV2.nm+"을(를) 주웠다!"+(until?" "+until+"에만 얻을 수 있는 알이다.":""));try{toast(PET_EV2.ic+" "+PET_EV2.nm+"을(를) 주웠다!")}catch(e){}out.push(PET_EV2.ic+" "+PET_EV2.nm+"을(를) 주웠다!")}
 return out.join(" ")}
/* 활성 이벤트 알. eventLive().egg.inv 기준 (FORCE·날짜 동일). */
const petEvOn=()=>{const e=typeof eventLive==="function"?eventLive():null;return !!(e&&e.egg&&e.egg.inv==="eggsEv")};
const petEv2On=()=>{const e=typeof eventLive==="function"?eventLive():null;return !!(e&&e.egg&&e.egg.inv==="eggsEv2")};
function petEvMelt(){if(!C||!(C.eggsEv>0)||Date.now()<PET_EV.to)return false;const n=C.eggsEv;C.eggs=(C.eggs||0)+n;C.eggsEv=0;note("quest","이벤트가 끝나 "+PET_EV.nm+" "+n+"개가 녹아 평범한 사역마의 알이 되었다.");save();return true}
function petEv2Melt(){if(!C||!(C.eggsEv2>0)||typeof PET_EV2==="undefined"||Date.now()<PET_EV2.to)return false;const n=C.eggsEv2;C.eggs=(C.eggs||0)+n;C.eggsEv2=0;note("quest","이벤트가 끝나 "+PET_EV2.nm+" "+n+"개가 부서져 평범한 사역마의 알이 되었다.");save();return true}
/* 서리 알: 기간 한정은 PET_EV.ids 가 있으면 그 목록만, 없으면 희귀도 4 전체(옛 호환). */
function petRollEv(){const r=Math.random(),pick=rar=>{const l=Object.values(PETS).filter(x=>x[3]===rar);return l[Math.floor(Math.random()*l.length)][0]};
 const leg=PET_EV.leg||0,ids=Array.isArray(PET_EV.ids)?PET_EV.ids.filter(id=>PETS[id]):[],lim=ids.length?(PET_EV.lim||0):(PET_EV.lim||0),limPool=ids.length?ids:null;
 if(r<leg)return pick(3);
 if(lim&&r<leg+lim){if(limPool&&limPool.length)return limPool[Math.floor(Math.random()*limPool.length)];return pick(4)}
 if(r<leg+lim+(PET_EV.rare||0))return pick(2);return pick(1)}
/* 금이 간 알: 기간 한정은 PET_EV2.ids 가 있을 때만 lim 칸을 쓴다. ids 가 비면 lim 확률은 희귀·일반 쪽으로 넘긴다. */
function petRollEv2(){const r=Math.random(),pick=rar=>{const l=Object.values(PETS).filter(x=>x[3]===rar);return l[Math.floor(Math.random()*l.length)][0]};
 const leg=PET_EV2.leg||0,ids=Array.isArray(PET_EV2.ids)?PET_EV2.ids.filter(id=>PETS[id]):[],lim=ids.length?(PET_EV2.lim||0):0,rare=PET_EV2.rare||0;
 if(r<leg)return pick(3);if(lim&&r<leg+lim)return ids[Math.floor(Math.random()*ids.length)];
 if(r<leg+lim+rare)return pick(2);return pick(1)}
function petIncubateEv(){petEvMelt();eggFix();if(!(C.eggsEv>0)||C.egg)return;if((C.pets||[]).length>=petCap()){petMsg("사역마는 "+petCap()+"마리까지 데리고 있을 수 있다. 한 마리를 보내 주거나, 공방의 '사역마 조련 허가증'으로 상한을 늘려야 새로 품을 수 있다.",1);return}
 const t0=Date.now();C.eggsEv-=1;C.egg={t0,t1:t0+PET_HATCH,ev:1};save();growth(PET_EV.nm+"을(를) 품기 시작했다. 차가운 알이 조금씩 따뜻해진다. 1시간 뒤에 깨어난다.")}
function petIncubateEv2(){petEv2Melt();eggFix();if(!(C.eggsEv2>0)||C.egg)return;if((C.pets||[]).length>=petCap()){petMsg("사역마는 "+petCap()+"마리까지 데리고 있을 수 있다. 한 마리를 보내 주거나, 공방의 '사역마 조련 허가증'으로 상한을 늘려야 새로 품을 수 있다.",1);return}
 const t0=Date.now();C.eggsEv2-=1;C.egg={t0,t1:t0+PET_HATCH,ev:2};save();growth(PET_EV2.nm+"을(를) 품기 시작했다. 깨어날 수 없었던 알에 마력이 스며든다. 1시간 뒤에 깨어난다.")}
function petRoll(){let r=Math.random(),rar=1;for(const [k,p] of PET_RATE){if(r<p){rar=k;break}r-=p}const l=Object.values(PETS).filter(x=>x[3]===rar);return l[Math.floor(Math.random()*l.length)][0]}
function petMsg(t,bad){const m=$("#grm")||$("#bgm");if(m){m.style.color=bad?"var(--bad)":"var(--mu)";m.textContent=t}}
function petBuyEgg(){if((C.gd||0)<PET_EGG_G)return;if(C.eggBuy===today()){petMsg("알은 하루에 한 개만 살 수 있다.",1);return}C.gd-=PET_EGG_G;C.eggBuy=today();C.eggs=(C.eggs||0)+1;save();growth("사역마의 알을 샀다. 따뜻하게 품어 주자.")}
function petIncubate(){eggFix();if(!(C.eggs>0)||C.egg)return;if((C.pets||[]).length>=petCap()){petMsg("사역마는 "+petCap()+"마리까지 데리고 있을 수 있다. 한 마리를 보내 주거나, 공방의 '사역마 조련 허가증'으로 상한을 늘려야 새로 품을 수 있다.",1);return}
 const t0=Date.now();C.eggs-=1;C.egg={t0,t1:t0+PET_HATCH};save();growth("알을 품기 시작했다. 1시간 뒤에 깨어난다.")}
function petHatch(){const e=C.egg;if(!e||Date.now()<e.t1)return;const kind=eggEvKind(e),sp=kind===2?petRollEv2():kind===1?petRollEv():petRoll(),P=PETS[sp],nm=(prompt(P[2]+" "+P[1]+"이(가) 깨어났다!\n이름을 지어 주자. (최대 10자)",P[1])||P[1]).trim().slice(0,10)||P[1];
 const q={id:"p"+Date.now().toString(36),sp,nm,xp:0,born:Date.now()};C.pets=Array.isArray(C.pets)?C.pets:[];C.pets.push(q);C.egg=null;if(!C.pet)C.pet=q.id;titleState();C.stats.hatched=(C.stats.hatched||0)+1;if(PETS[sp][3]===3)C.stats.petLeg=1;if(PETS[sp][3]===4){if(kind===2)C.stats.petEv2=(C.stats.petEv2||0)+1;else C.stats.petEv=(C.stats.petEv||0)+1}C.petSeen=C.petSeen||{};C.petSeen[sp]=1;
 /* 로컬·화면은 바로 반영(낙관적). 서버만 즉시 PATCH+재시도. save() 디바운스만 쓰면 닫기·다른 탭과 겹쳐 사역마가 빠질 수 있다.
    saveNowRetry 가 pubSync 로 공개 카드 펫 칸도 고친다. 여기서 regPlayer 를 또 부르면 players/who 가 연달아 나간다. */
 note("quest","알에서 "+P[1]+" '"+nm+"'이(가) 깨어났다!");
 if(typeof saveNowRetry==="function"){void(async()=>{if(!await saveNowRetry(4,1500)){try{toast("사역마는 이 기기에 남겼다. 서버 저장을 계속 시도한다.")}catch(e){}try{if(typeof accSoftSync==="function")accSoftSync()}catch(e){}}})()}
 else save();
 checkTitles();
 alertBox(P[2]+" 부화!",(P[3]===4?"❄ 기간 한정 사역마 ❄\n":P[3]===3?"★ 전설의 사역마 ★\n":P[3]===2?"희귀한 사역마!\n":"")+"알에서 "+P[1]+" '"+nm+"'이(가) 깨어났다.\n\n"+P[4]+"\n\n함께하면: "+P[5](1)+" (친밀도 1단계)\n친밀도가 오를수록 효과가 커진다.");growth()}
setInterval(()=>{if(C&&C.egg&&!C.egg.nt&&Date.now()>=C.egg.t1){C.egg.nt=1;save();note("quest","사역마의 알이 흔들린다! 성장 기록에서 부화시키자.");toast("🥚 알이 흔들린다! 성장 기록에서 부화시키자.");try{ding()}catch(e){}}if(C&&C.egg&&!$("#v-growth").hidden)drawPets()},30000);
