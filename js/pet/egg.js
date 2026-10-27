/* 사역마의 알. main.js 다음에 불러야 한다. 얻기, 품기, 부화.
   출정과 장기 토벌은 petDrop 을, 가방은 petBuyEgg, petIncubate, petHatch 를 그대로 부른다. */
// 알 떨어뜨리기(출정·장기 토벌). 받았으면 안내 문구를 돌려준다.
function petDrop(src){if(Math.random()>=(src==="lh"?PET_DROP_LH:PET_DROP_X))return "";C.eggs=(C.eggs||0)+1;note("quest","사역마의 알을 주웠다! 가방에서 품을 수 있다.");return "🥚 사역마의 알을 주웠다!"}
function petRoll(){let r=Math.random(),rar=1;for(const [k,p] of PET_RATE){if(r<p){rar=k;break}r-=p}const l=Object.values(PETS).filter(x=>x[3]===rar);return l[Math.floor(Math.random()*l.length)][0]}
function petMsg(t,bad){const m=$("#bgm");if(m){m.style.color=bad?"var(--bad)":"var(--mu)";m.textContent=t}}
function petBuyEgg(){if((C.gd||0)<PET_EGG_G)return;if(C.eggBuy===today()){petMsg("알은 하루에 한 개만 살 수 있다.",1);return}C.gd-=PET_EGG_G;C.eggBuy=today();C.eggs=(C.eggs||0)+1;save();bag("사역마의 알을 샀다. 따뜻하게 품어 주자.")}
function petIncubate(){if(!(C.eggs>0)||C.egg)return;if((C.pets||[]).length>=PET_MAX){petMsg("사역마는 "+PET_MAX+"마리까지 데리고 있을 수 있다. 한 마리를 보내 주어야 새로 품을 수 있다.",1);return}
 C.eggs--;C.egg={t0:Date.now(),t1:Date.now()+PET_HATCH};save();bag("알을 품기 시작했다. 1시간 뒤에 깨어난다.")}
function petHatch(){const e=C.egg;if(!e||Date.now()<e.t1)return;const sp=petRoll(),P=PETS[sp],nm=(prompt(P[2]+" "+P[1]+"이(가) 깨어났다!\n이름을 지어 주자. (최대 10자)",P[1])||P[1]).trim().slice(0,10)||P[1];
 const q={id:"p"+Date.now().toString(36),sp,nm,xp:0,born:Date.now()};C.pets=Array.isArray(C.pets)?C.pets:[];C.pets.push(q);C.egg=null;if(!C.pet)C.pet=q.id;titleState();C.stats.hatched=(C.stats.hatched||0)+1;if(PETS[sp][3]===3)C.stats.petLeg=1;C.petSeen=C.petSeen||{};C.petSeen[sp]=1;
 note("quest","알에서 "+P[1]+" '"+nm+"'이(가) 깨어났다!");save();regPlayer();checkTitles();
 alertBox(P[2]+" 부화!",(P[3]===3?"★ 전설의 사역마 ★\n":P[3]===2?"희귀한 사역마!\n":"")+"알에서 "+P[1]+" '"+nm+"'이(가) 깨어났다.\n\n"+P[4]+"\n\n함께하면: "+P[5](1)+" (친밀도 1단계)\n친밀도가 오를수록 효과가 커진다.");bag()}
setInterval(()=>{if(C&&C.egg&&!C.egg.nt&&Date.now()>=C.egg.t1){C.egg.nt=1;save();note("quest","사역마의 알이 흔들린다! 가방에서 부화시키자.");toast("🥚 알이 흔들린다! 가방에서 부화시키자.");try{ding()}catch(e){}}if(C&&C.egg&&!$("#v-bag").hidden)drawPets()},30000);
