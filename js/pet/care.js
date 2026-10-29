/* 사역마를 데리고 돌보는 화면. main.js 다음에 불러야 한다.
   가방은 drawPets 를, 출정은 petXp 를 그대로 부른다. */
function petXp(n){const q=petCur();if(!q||!n)return;const b=petLv(q);q.xp=Math.min(PET_LV[PET_LV.length-1],(q.xp||0)+n);const a=petLv(q);if(a>b){note("quest",PETS[q.sp][1]+" "+q.nm+"와(과)의 친밀도가 "+a+"단계가 되었다!");toast(PETS[q.sp][2]+" "+q.nm+" 친밀도 "+a+"단계!")}}
function petPat(q){if(q.pd===today())return;q.pd=today();petXp0(q,PET_PAT);save();bag(PETS[q.sp][2]+" "+q.nm+"을(를) 쓰다듬었다. 기분이 좋아 보인다. (친밀도 +"+PET_PAT+")")}
function petFeed(q){if((C.gd||0)<PET_SNACK_G)return;if(!q.fd||q.fd.d!==today())q.fd={d:today(),n:0};if(q.fd.n>=PET_SNACK_N){petMsg("오늘은 간식을 충분히 먹었다.",1);return}q.fd.n++;C.gd-=PET_SNACK_G;petXp0(q,PET_FEED);save();bag(PETS[q.sp][2]+" "+q.nm+"이(가) 간식을 맛있게 먹었다. (친밀도 +"+PET_FEED+")")}
function petXp0(q,n){const cur=C.pet;C.pet=q.id;petXp(n);C.pet=cur;regPlayer()}
function petRename(q){const nm=(prompt("새 이름 (최대 10자)",q.nm)||"").trim().slice(0,10);if(!nm)return;q.nm=nm;save();regPlayer();bag("이름을 '"+nm+"'(으)로 바꿨다.")}
function petBye(q){if(!confirm(q.nm+"을(를) 보내 줄까? 다시 돌아오지 않는다."))return;C.pets=C.pets.filter(x=>x!==q);C.petGone=C.petGone||{};C.petGone[q.id]=1;if(C.pet===q.id)C.pet=(C.pets[0]||{}).id||null;save();regPlayer();bag(q.nm+"이(가) 몇 번이나 뒤를 돌아보다가 숲으로 돌아갔다.")}
function drawPets(){const box=$("#bgpt");if(!box||!C)return;try{petEvMelt()}catch(e){}box.innerHTML="";C.pets=Array.isArray(C.pets)?C.pets:[];const now=Date.now();C.petSeen=C.petSeen||{};C.pets.forEach(q=>{if(q&&PETS[q.sp])C.petSeen[q.sp]=1});
 box.appendChild(elT("p","hint","곁을 지키는 작은 마수. '함께하기'로 정한 한 마리의 효과를 받는다. 쓰다듬고, 간식을 주고, 함께 출정할수록 친밀도가 올라 효과가 커진다."));
 // 알
 const ec=elT("div","card pet-card"),eb=elT("div","pet-body");ec.append(elT("span","pet-ic","🥚"),eb);
 if(C.egg){const done=now>=C.egg.t1;if(C.egg.ev)ec.querySelector(".pet-ic").textContent=PET_EV.ic;eb.append(elT("b","",done?(C.egg.ev?PET_EV.nm+"에 금이 간다!":"알이 흔들린다!"):(C.egg.ev?PET_EV.nm+"을(를) 품는 중":"알을 품는 중")),elT("small","",done?"곧 무언가 깨어날 것 같다.":"부화까지 "+cdTxt(C.egg.t1-now)));const a=elT("div","pet-act"),b=elT("button","chip",done?"부화시키기":"기다리는 중");b.type="button";b.disabled=!done;b.onclick=petHatch;a.appendChild(b);eb.appendChild(a)}
 else{eb.append(elT("b","","사역마의 알 "+(C.eggs||0)+"개"),elT("small","","상점가 "+PET_EGG_G+"골드(하루 1개) · 출정에서 가끔, 장기 토벌 성공 시 종종 줍는다. 품으면 1시간 뒤 깨어난다. (일반 70% · 희귀 27% · 전설 3%)"));
  const a=elT("div","pet-act"),b1=elT("button","chip","알 품기");b1.type="button";b1.disabled=!(C.eggs>0);b1.onclick=petIncubate;const b2=elT("button","chip","알 사기 ("+PET_EGG_G+"골드)");b2.type="button";b2.disabled=(C.gd||0)<PET_EGG_G||C.eggBuy===today();b2.onclick=petBuyEgg;a.append(b1,b2);eb.appendChild(a)}
 box.appendChild(ec);
 // 기간 한정: 서리 드래곤의 알. 이벤트 기간이거나 가지고 있을 때만 보인다. 상점에서는 살 수 없다.
 if(petEvOn()||(C.eggsEv||0)>0){const vc=elT("div","card pet-card pet-ev"),vb=elT("div","pet-body"),end=new Date(PET_EV.to-1);vc.append(elT("span","pet-ic",PET_EV.ic),vb);
  vb.append(elT("b","pet-r4",PET_EV.nm+" "+(C.eggsEv||0)+"개 · 기간 한정"),elT("small","",PET_EV.ds),
   elT("small","","11월 1일 ~ 11월 14일에만 출정·장기 토벌 성공 때 사역마의 알처럼 줍는다(상점에서는 팔지 않는다). 전설 "+Math.round(PET_EV.leg*100)+"% · 기간 한정 사역마 "+Math.round(PET_EV.lim*100)+"% · 나머지는 일반·희귀. 기간이 끝나면 품지 않은 알은 녹아 평범한 사역마의 알이 된다."+(petEvOn()?" (남은 기간 "+cdTxt(PET_EV.to-now)+")":"")),
   elT("small","","기간 한정 사역마: "+Object.values(PETS).filter(x=>x[3]===4).map(x=>x[2]+" "+x[1]).join(" · ")));
  const a=elT("div","pet-act"),b=elT("button","chip",PET_EV.nm+" 품기");b.type="button";b.disabled=!(C.eggsEv>0)||!!C.egg;b.title=C.egg?"지금 품고 있는 알이 깨어나야 품을 수 있다.":"";b.onclick=petIncubateEv;a.appendChild(b);vb.appendChild(a);box.appendChild(vc)}
 {const all=Object.values(PETS),seen=all.filter(x=>C.petSeen[x[0]]);box.appendChild(elT("p","hint","만난 사역마 "+seen.length+" / "+all.length+"종: "+all.map(x=>C.petSeen[x[0]]?x[2]:"❔").join(" ")))}
 if(!C.pets.length){box.appendChild(elT("p","hint","아직 사역마가 없다. 알을 품어 보자."));return}
 C.pets.forEach(q=>{const P=PETS[q.sp];if(!P)return;const L=petLv(q),on=C.pet===q.id,nx=PET_LV[L],c=elT("div","card pet-card"+(on?" on":"")),bd=elT("div","pet-body");c.append(elT("span","pet-ic",P[2]),bd);
  bd.append(elT("b","pet-r"+P[3],P[1]+" '"+q.nm+"'"+(on?" · 함께하는 중":"")+(P[3]===4?" ❄한정":P[3]===3?" ★전설":P[3]===2?" ◆희귀":"")),elT("small","",P[4]),elT("small","","효과: "+P[5](L)+" · 친밀도 "+L+"단계"+(nx!=null?" ("+(q.xp||0)+" / "+nx+")":" (최고)")));
  const bar=elT("div","bar"),f=elT("i");const pv=PET_LV[L-1]||0;f.style.width=(nx!=null?Math.min(100,((q.xp||0)-pv)/(nx-pv)*100):100)+"%";bar.appendChild(f);bd.appendChild(bar);
  const a=elT("div","pet-act"),mk=(t,fn,dis)=>{const b=elT("button","chip",t);b.type="button";b.disabled=!!dis;b.onclick=fn;a.appendChild(b)};
  if(!on)mk("함께하기",()=>{C.pet=q.id;save();regPlayer();bag(q.nm+"와(과) 함께하기로 했다.")});
  mk(q.pd===today()?"쓰다듬기 (내일 다시)":"쓰다듬기 (+"+PET_PAT+")",()=>petPat(q),q.pd===today());
  const fn=(q.fd&&q.fd.d===today())?q.fd.n:0;mk("간식 "+PET_SNACK_G+"골드 ("+fn+"/"+PET_SNACK_N+")",()=>petFeed(q),fn>=PET_SNACK_N||(C.gd||0)<PET_SNACK_G);
  mk("이름 바꾸기",()=>petRename(q));mk("보내 주기",()=>petBye(q));bd.appendChild(a);box.appendChild(c)})}
