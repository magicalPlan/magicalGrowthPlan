/* 사역마의 알. main.js 다음에 불러야 한다. 얻기, 품기, 부화.
   출정과 장기 토벌은 petDrop 을, 가방은 petBuyEgg, petIncubate, petHatch 를 그대로 부른다. */
// 알 떨어뜨리기(출정·장기 토벌). 받았으면 안내 문구를 돌려준다.
function petDrop(src){const p=src==="lh"?PET_DROP_LH:PET_DROP_X,out=[];
 if(Math.random()<p){C.eggs=(C.eggs||0)+1;note("quest","사역마의 알을 주웠다! 가방에서 품을 수 있다.");out.push("🥚 사역마의 알을 주웠다!")}
 // 기간 한정: 서리 여왕의 알은 따로 굴린다.
 if(petEvOn()&&Math.random()<p){C.eggsEv=(C.eggsEv||0)+1;note("quest",PET_EV.nm+"을(를) 주웠다! 11월 14일까지만 얻을 수 있는 알이다.");try{toast(PET_EV.ic+" "+PET_EV.nm+"을(를) 주웠다!")}catch(e){}out.push(PET_EV.ic+" "+PET_EV.nm+"을(를) 주웠다!")}
 return out.join(" ")}
// 이벤트 기간인지. 기간 한정 사역마와 서리 여왕의 알은 이 안에서만 얻는다.
const petEvOn=()=>{const t=Date.now();return t>=PET_EV.from&&t<PET_EV.to};
// 기간이 끝났는데 품지 않은 서리 여왕의 알이 남아 있으면 평범한 사역마의 알로 바꾼다.
function petEvMelt(){if(!C||!(C.eggsEv>0)||Date.now()<PET_EV.to)return false;const n=C.eggsEv;C.eggs=(C.eggs||0)+n;C.eggsEv=0;note("quest","이벤트가 끝나 "+PET_EV.nm+" "+n+"개가 녹아 평범한 사역마의 알이 되었다.");save();return true}
// 서리 여왕의 알 부화: 전설 3%, 기간 한정 3%, 나머지는 일반·희귀를 평소 비율로.
function petRollEv(){const r=Math.random(),pick=rar=>{const l=Object.values(PETS).filter(x=>x[3]===rar);return l[Math.floor(Math.random()*l.length)][0]};
 if(r<PET_EV.leg)return pick(3);if(r<PET_EV.leg+PET_EV.lim)return pick(4);const a=PET_RATE.find(x=>x[0]===1)[1],b=PET_RATE.find(x=>x[0]===2)[1];return pick(Math.random()<a/(a+b)?1:2)}
function petIncubateEv(){petEvMelt();if(!(C.eggsEv>0)||C.egg)return;if((C.pets||[]).length>=PET_MAX){petMsg("사역마는 "+PET_MAX+"마리까지 데리고 있을 수 있다. 한 마리를 보내 주어야 새로 품을 수 있다.",1);return}
 C.eggsEv--;C.egg={t0:Date.now(),t1:Date.now()+PET_HATCH,ev:1};save();bag(PET_EV.nm+"을(를) 품기 시작했다. 차가운 알이 조금씩 따뜻해진다. 1시간 뒤에 깨어난다.")}
function petRoll(){let r=Math.random(),rar=1;for(const [k,p] of PET_RATE){if(r<p){rar=k;break}r-=p}const l=Object.values(PETS).filter(x=>x[3]===rar);return l[Math.floor(Math.random()*l.length)][0]}
function petMsg(t,bad){const m=$("#bgm");if(m){m.style.color=bad?"var(--bad)":"var(--mu)";m.textContent=t}}
function petBuyEgg(){if((C.gd||0)<PET_EGG_G)return;if(C.eggBuy===today()){petMsg("알은 하루에 한 개만 살 수 있다.",1);return}C.gd-=PET_EGG_G;C.eggBuy=today();C.eggs=(C.eggs||0)+1;save();bag("사역마의 알을 샀다. 따뜻하게 품어 주자.")}
function petIncubate(){if(!(C.eggs>0)||C.egg)return;if((C.pets||[]).length>=PET_MAX){petMsg("사역마는 "+PET_MAX+"마리까지 데리고 있을 수 있다. 한 마리를 보내 주어야 새로 품을 수 있다.",1);return}
 C.eggs--;C.egg={t0:Date.now(),t1:Date.now()+PET_HATCH};save();bag("알을 품기 시작했다. 1시간 뒤에 깨어난다.")}
function petHatch(){const e=C.egg;if(!e||Date.now()<e.t1)return;const sp=e.ev?petRollEv():petRoll(),P=PETS[sp],nm=(prompt(P[2]+" "+P[1]+"이(가) 깨어났다!\n이름을 지어 주자. (최대 10자)",P[1])||P[1]).trim().slice(0,10)||P[1];
 const q={id:"p"+Date.now().toString(36),sp,nm,xp:0,born:Date.now()};C.pets=Array.isArray(C.pets)?C.pets:[];C.pets.push(q);C.egg=null;if(!C.pet)C.pet=q.id;titleState();C.stats.hatched=(C.stats.hatched||0)+1;if(PETS[sp][3]===3)C.stats.petLeg=1;if(PETS[sp][3]===4)C.stats.petEv=(C.stats.petEv||0)+1;C.petSeen=C.petSeen||{};C.petSeen[sp]=1;
 note("quest","알에서 "+P[1]+" '"+nm+"'이(가) 깨어났다!");save();regPlayer();checkTitles();
 alertBox(P[2]+" 부화!",(P[3]===4?"❄ 기간 한정 사역마 ❄\n":P[3]===3?"★ 전설의 사역마 ★\n":P[3]===2?"희귀한 사역마!\n":"")+"알에서 "+P[1]+" '"+nm+"'이(가) 깨어났다.\n\n"+P[4]+"\n\n함께하면: "+P[5](1)+" (친밀도 1단계)\n친밀도가 오를수록 효과가 커진다.");bag()}
setInterval(()=>{if(C&&C.egg&&!C.egg.nt&&Date.now()>=C.egg.t1){C.egg.nt=1;save();note("quest","사역마의 알이 흔들린다! 가방에서 부화시키자.");toast("🥚 알이 흔들린다! 가방에서 부화시키자.");try{ding()}catch(e){}}if(C&&C.egg&&!$("#v-bag").hidden)drawPets()},30000);
