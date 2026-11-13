/* 사역마의 알. main.js 다음에 불러야 한다. 얻기, 품기, 부화.
   출정과 장기 토벌은 petDrop 을, 성장 기록은 petBuyEgg, petIncubate, petHatch 를 그대로 부른다. */
/* 알 개수는 0 이상의 정수만 남긴다. 품고 있는 알은 {t0, t1} 시각이 둘 다 있어야 한다.
   회귀 뒤에 시각이 비거나 NaN이면 '알을 품는 중'인데 남은 시간이 NaN으로 뜬다. 그 알은 다시 개수로 돌려준다. */
function eggNum(n){n=Math.floor(Number(n));return isFinite(n)&&n>0?n:0}
function eggFix(){if(!C)return false;let ch=false;if(C.eggs!=null&&C.eggs!==eggNum(C.eggs)){C.eggs=eggNum(C.eggs);ch=true}if(C.eggsEv!=null&&C.eggsEv!==eggNum(C.eggsEv)){C.eggsEv=eggNum(C.eggsEv);ch=true}
 const e=C.egg;if(e==null||e===false){if(e!=null){C.egg=null;ch=true}return ch}
 if(typeof e==="number"||typeof e==="string"){C.eggs+=eggNum(e);C.egg=null;return true}
 if(typeof e!=="object"){C.egg=null;return true}
 const t0=Number(e.t0),t1=Number(e.t1);if(!isFinite(t0)||!isFinite(t1)){if(e.ev)C.eggsEv+=1;else C.eggs+=1;C.egg=null;return true}
 if(e.t0!==t0||e.t1!==t1){e.t0=t0;e.t1=t1;ch=true}return ch}
// 알 떨어뜨리기(출정·장기 토벌). 받았으면 안내 문구를 돌려준다.
function petDrop(src){const p=src==="lh"?PET_DROP_LH:PET_DROP_X,out=[];
 if(Math.random()<p){C.eggs=(C.eggs||0)+1;note("quest","사역마의 알을 주웠다! 성장 기록에서 품을 수 있다.");out.push("🥚 사역마의 알을 주웠다!")}
 // 기간 한정: 서리 드래곤의 알은 따로 굴린다.
 if(petEvOn()&&Math.random()<p){C.eggsEv=(C.eggsEv||0)+1;note("quest",PET_EV.nm+"을(를) 주웠다! 11월 22일까지만 얻을 수 있는 알이다.");try{toast(PET_EV.ic+" "+PET_EV.nm+"을(를) 주웠다!")}catch(e){}out.push(PET_EV.ic+" "+PET_EV.nm+"을(를) 주웠다!")}
 return out.join(" ")}
// 이벤트 기간인지. 기간 한정 사역마와 서리 드래곤의 알은 이 안에서만 얻는다.
const petEvOn=()=>{const t=Date.now();return t>=PET_EV.from&&t<PET_EV.to};
// 기간이 끝났는데 품지 않은 서리 드래곤의 알이 남아 있으면 평범한 사역마의 알로 바꾼다.
function petEvMelt(){if(!C||!(C.eggsEv>0)||Date.now()<PET_EV.to)return false;const n=C.eggsEv;C.eggs=(C.eggs||0)+n;C.eggsEv=0;note("quest","이벤트가 끝나 "+PET_EV.nm+" "+n+"개가 녹아 평범한 사역마의 알이 되었다.");save();return true}
// 서리 드래곤의 알 부화: 전설 PET_EV.leg, 기간 한정 PET_EV.lim(같은 희귀도 안에서 균등), 희귀 PET_EV.rare, 나머지는 일반.
function petRollEv(){const r=Math.random(),pick=rar=>{const l=Object.values(PETS).filter(x=>x[3]===rar);return l[Math.floor(Math.random()*l.length)][0]};
 if(r<PET_EV.leg)return pick(3);if(r<PET_EV.leg+PET_EV.lim)return pick(4);if(r<PET_EV.leg+PET_EV.lim+(PET_EV.rare||0))return pick(2);return pick(1)}
function petIncubateEv(){petEvMelt();eggFix();if(!(C.eggsEv>0)||C.egg)return;if((C.pets||[]).length>=petCap()){petMsg("사역마는 "+petCap()+"마리까지 데리고 있을 수 있다. 한 마리를 보내 주거나, 공방의 '사역마 조련 허가증'으로 상한을 늘려야 새로 품을 수 있다.",1);return}
 const t0=Date.now();C.eggsEv-=1;C.egg={t0,t1:t0+PET_HATCH,ev:1};save();growth(PET_EV.nm+"을(를) 품기 시작했다. 차가운 알이 조금씩 따뜻해진다. 1시간 뒤에 깨어난다.")}
function petRoll(){let r=Math.random(),rar=1;for(const [k,p] of PET_RATE){if(r<p){rar=k;break}r-=p}const l=Object.values(PETS).filter(x=>x[3]===rar);return l[Math.floor(Math.random()*l.length)][0]}
function petMsg(t,bad){const m=$("#grm")||$("#bgm");if(m){m.style.color=bad?"var(--bad)":"var(--mu)";m.textContent=t}}
function petBuyEgg(){if((C.gd||0)<PET_EGG_G)return;if(C.eggBuy===today()){petMsg("알은 하루에 한 개만 살 수 있다.",1);return}C.gd-=PET_EGG_G;C.eggBuy=today();C.eggs=(C.eggs||0)+1;save();growth("사역마의 알을 샀다. 따뜻하게 품어 주자.")}
function petIncubate(){eggFix();if(!(C.eggs>0)||C.egg)return;if((C.pets||[]).length>=petCap()){petMsg("사역마는 "+petCap()+"마리까지 데리고 있을 수 있다. 한 마리를 보내 주거나, 공방의 '사역마 조련 허가증'으로 상한을 늘려야 새로 품을 수 있다.",1);return}
 const t0=Date.now();C.eggs-=1;C.egg={t0,t1:t0+PET_HATCH};save();growth("알을 품기 시작했다. 1시간 뒤에 깨어난다.")}
function petHatch(){const e=C.egg;if(!e||Date.now()<e.t1)return;const sp=e.ev?petRollEv():petRoll(),P=PETS[sp],nm=(prompt(P[2]+" "+P[1]+"이(가) 깨어났다!\n이름을 지어 주자. (최대 10자)",P[1])||P[1]).trim().slice(0,10)||P[1];
 const q={id:"p"+Date.now().toString(36),sp,nm,xp:0,born:Date.now()};C.pets=Array.isArray(C.pets)?C.pets:[];C.pets.push(q);C.egg=null;if(!C.pet)C.pet=q.id;titleState();C.stats.hatched=(C.stats.hatched||0)+1;if(PETS[sp][3]===3)C.stats.petLeg=1;if(PETS[sp][3]===4)C.stats.petEv=(C.stats.petEv||0)+1;C.petSeen=C.petSeen||{};C.petSeen[sp]=1;
 /* save() 가 pubSync 로 공개 카드 펫 칸을 이미 고친다. 여기서 regPlayer 를 또 부르면 players/who 가 연달아 나간다. */
 note("quest","알에서 "+P[1]+" '"+nm+"'이(가) 깨어났다!");save();checkTitles();
 alertBox(P[2]+" 부화!",(P[3]===4?"❄ 기간 한정 사역마 ❄\n":P[3]===3?"★ 전설의 사역마 ★\n":P[3]===2?"희귀한 사역마!\n":"")+"알에서 "+P[1]+" '"+nm+"'이(가) 깨어났다.\n\n"+P[4]+"\n\n함께하면: "+P[5](1)+" (친밀도 1단계)\n친밀도가 오를수록 효과가 커진다.");growth()}
setInterval(()=>{if(C&&C.egg&&!C.egg.nt&&Date.now()>=C.egg.t1){C.egg.nt=1;save();note("quest","사역마의 알이 흔들린다! 성장 기록에서 부화시키자.");toast("🥚 알이 흔들린다! 성장 기록에서 부화시키자.");try{ding()}catch(e){}}if(C&&C.egg&&!$("#v-growth").hidden)drawPets()},30000);
