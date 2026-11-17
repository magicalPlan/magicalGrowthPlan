/* 사역마 특성 클라.
   · 정의: data/pet-traits.js. 굴림·쓰기는 서버(functions/pettr.js → grantPetTraits).
   · 받기: 자동 요청 없음. 성장 기록 › 사역마 카드의 '특성 받기'만 pettr/{uid}/{petId} 에 요청(특성 id 금지).
   · 효과: petTraitEff(k) → petEff 가 종 효과에 더한다. 출정 배율은 서버 boost 도 같은 키를 합친다.
   · 표시: petTrLines(q). 토스트는 서버본이 들어온 뒤(요청 후 accSync) 한다. */
/* q.tr → 정규화 맵 { "5":{c,r}, … }. */
function petTrMap(q){
 const raw=q&&q.tr,out={};
 if(!raw||typeof raw!=="object"||typeof PET_TR_LV==="undefined")return out;
 PET_TR_LV.forEach(lv=>{
  const slot=raw[lv]!=null?raw[lv]:raw[String(lv)];
  if(!slot||typeof slot!=="object")return;
  const c=Math.floor(Number(slot.c)||0),r=Math.min(3,Math.max(1,Math.floor(Number(slot.r)||1)));
  if(typeof PET_TRM!=="undefined"&&PET_TRM[c])out[String(lv)]={c,r};
 });
 return out;
}
/* 해금됐는데 아직 서버 특성이 없는 슬롯이 있으면 true. */
function petTrNeed(q){
 if(!q||typeof PET_TR_LV==="undefined"||typeof petLv!=="function")return false;
 const L=petLv(q),tr=petTrMap(q);
 return PET_TR_LV.some(lv=>L>=lv&&!tr[String(lv)]);
}
/* 화면용 줄 목록(알림·토스트용). UI 슬롯은 petTrPanel. */
function petTrLines(q){
 const tr=petTrMap(q),lines=[];
 if(typeof PET_TR_LV==="undefined")return lines;
 PET_TR_LV.forEach(lv=>{
  const slot=tr[String(lv)];
  if(!slot){if(typeof petLv==="function"&&petLv(q)>=lv)lines.push(lv+"단계 특성: 받을 수 있음");return}
  lines.push(lv+"단계 · "+(typeof petTrTxt==="function"?petTrTxt(slot.c,slot.r):("코드 "+slot.c)));
 });
 return lines;
}
/* 펫마다 특성 칸 펼침 기억(이 기기·세션). */
let petTrOpen={};
function petTrFilled(q){
 const tr=petTrMap(q);let n=0;
 if(typeof PET_TR_LV!=="undefined")PET_TR_LV.forEach(lv=>{if(tr[String(lv)])n++});
 return n;
}
/* 성장 기록 사역마 카드 하단: 특성 접기/펼치기 + 슬롯 3칸(5·10·15). */
function petTrPanel(q){
 const wrap=elT("div","pet-tr-wrap");
 if(!q||typeof PET_TR_LV==="undefined")return wrap;
 const L=typeof petLv==="function"?petLv(q):0,tr=petTrMap(q),filled=petTrFilled(q),need=typeof petTrNeed==="function"&&petTrNeed(q);
 const id=q.id,open=!!petTrOpen[id];
 const lab=(open?"특성 접기 ▲":"특성 펼치기 ▼")+(filled||need?" · "+filled+"/3":"");
 const tog=elT("span","pet-tr-tog",lab);tog.setAttribute("role","button");tog.tabIndex=0;
 tog.setAttribute("aria-expanded",open?"true":"false");
 const flip=()=>{petTrOpen[id]=!petTrOpen[id];if(typeof drawPets==="function")drawPets()};
 tog.onclick=flip;tog.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();flip()}};
 const box=elT("div","pet-tr-box");box.hidden=!open;
 const slots=elT("div","pet-tr-slots");
 PET_TR_LV.forEach(lv=>{
  const slot=elT("div","pet-tr-slot"),got=tr[String(lv)];
  let fx;
  if(got){slot.classList.add("on","r"+(got.r||1));fx=typeof petTrTxt==="function"?petTrTxt(got.c,got.r):("코드 "+got.c)}
  else if(L>=lv){slot.classList.add("ready");fx="받을 수 있음"}
  else{slot.classList.add("lock");fx="친밀도 "+lv+" 필요"}
  slot.append(elT("span","pet-tr-lv",lv+"단계"),elT("span","pet-tr-sep","|"),elT("span","pet-tr-fx",fx));
  slots.appendChild(slot);
 });
 box.appendChild(slots);
 if(need){const row=elT("div","pet-tr-act"),busy=!!(typeof petTrAskBusy==="object"&&petTrAskBusy[id]);
  const b=elT("button","chip",busy?"특성 받는 중…":"특성 받기");b.type="button";b.disabled=busy;
  b.onclick=()=>{if(typeof petTrAsk==="function")petTrAsk(q)};row.appendChild(b);box.appendChild(row)}
 wrap.append(tog,box);return wrap;
}
/* 함께하는 사역마 특성 합산. %p 키는 이미 /100 된 값. trial·up 은 정수. */
function petTraitEff(k){
 if(!k||!C||typeof PET_TRM==="undefined")return 0;
 const q=typeof petCur==="function"?petCur():null;
 if(!q)return 0;
 const tr=petTrMap(q);let sum=0;
 Object.keys(tr).forEach(lv=>{
  const slot=tr[lv],def=PET_TRM[slot.c];
  if(!def||def[1]!==k)return;
  sum+=(typeof petTrVal==="function"?petTrVal(slot.c,slot.r):0);
 });
 return sum;
}
/* 서버에 특성 부여 요청. 특성 내용은 보내지 않는다. 버튼에서만 호출. */
let petTrAskBusy={};
function petTrAsk(q){
 if(!q||!q.id||typeof XON!=="function"||!XON()||!AUTH||!AUTH.uid||!DB)return;
 if(!petTrNeed(q))return;
 const id=q.id;if(petTrAskBusy[id])return;petTrAskBusy[id]=1;
 const before=JSON.stringify(petTrMap(q));
 toast((q.nm||"사역마")+" 특성을 받는 중…");
 DB.doc("pettr/"+UID+"/"+id).set({ts:{".sv":"timestamp"}}).then(()=>{
  const wait=async()=>{
   for(let i=0;i<8;i++){
    try{if(typeof accSyncIfNewer==="function")await accSyncIfNewer()}catch(e){}
    const nowQ=(C.pets||[]).find(x=>x&&x.id===id);
    if(nowQ&&JSON.stringify(petTrMap(nowQ))!==before&&!petTrNeed(nowQ)){
     const lines=petTrLines(nowQ).filter(t=>t.indexOf("받을 수 있음")<0);
     if(lines.length){const P=typeof PETS!=="undefined"&&PETS[nowQ.sp];toast((P?P[2]+" ":"")+(nowQ.nm||"사역마")+" 특성: "+lines[lines.length-1]);note("quest",(nowQ.nm||"사역마")+"이(가) 새 특성을 얻었다. "+lines.join(" · "))}
     if(typeof drawPets==="function"&&$("#v-growth")&&!$("#v-growth").hidden)drawPets();
     break;
    }
    await new Promise(r=>setTimeout(r,400+i*200));
   }
   if(petTrAskBusy[id]){const nowQ=(C.pets||[]).find(x=>x&&x.id===id);if(nowQ&&petTrNeed(nowQ))toast("특성을 아직 받지 못했다. 잠시 뒤 다시 '특성 받기'를 눌러 보자.")}
  };
  return wait();
 }).catch(()=>{toast("특성 요청에 실패했다. 연결을 확인하고 다시 눌러 보자.")}).finally(()=>{petTrAskBusy[id]=0});
}
/* 변광석(가방): 클라가 즉시 굴림 → confirm → 예일 때만 특성·아이템 PATCH.
   첫 받기(pettr)와 달리 변경은 프리즘처럼 즉시 반영. 확률표는 PET_TR_RATE 와 동일. */
let petTrStoneOn=null,petTrStonePick=null;
function petTrAltOf(q){
 const a=q&&q.trAlt;if(!a||typeof a!=="object")return null;
 const lv=Math.floor(Number(a.lv)||0);if(typeof PET_TR_LV!=="undefined"&&PET_TR_LV.indexOf(lv)<0)return null;
 const old=a.old&&typeof a.old==="object"?a.old:null,neu=a.neu&&typeof a.neu==="object"?a.neu:null;
 if(!old||!neu||typeof PET_TRM==="undefined"||!PET_TRM[old.c]||!PET_TRM[neu.c])return null;
 return {lv,old:{c:Math.floor(Number(old.c)||0),r:Math.min(3,Math.max(1,Math.floor(Number(old.r)||1)))},neu:{c:Math.floor(Number(neu.c)||0),r:Math.min(3,Math.max(1,Math.floor(Number(neu.r)||1)))},item:String(a.item||"")};
}
function petTrStoneSlotLine(slot){if(!slot)return "-";return typeof petTrTxt==="function"?petTrTxt(slot.c,slot.r):("코드 "+slot.c)}
function petTrStonePets(lv){return (C.pets||[]).filter(q=>{if(!q||!PETS[q.sp])return false;const tr=petTrMap(q);return !!tr[String(lv)]})}
function petTrRollRare(forceLeg){
 if(forceLeg)return 3;
 if(typeof PET_TR_RATE==="undefined")return 1;
 let acc=0,roll=Math.random();
 for(let i=0;i<PET_TR_RATE.length;i++){acc+=PET_TR_RATE[i][1];if(roll<acc)return PET_TR_RATE[i][0]}
 return 1;
}
function petTrRollCode(owned){
 const have=new Set((owned||[]).map(Number).filter(n=>n>0));
 const pool=(typeof PET_TR!=="undefined"?PET_TR:[]).map(t=>t[0]).filter(c=>!have.has(c));
 if(!pool.length)return null;
 return pool[Math.floor(Math.random()*pool.length)];
}
/* 지금 슬롯 포함 보유 코드는 빼서 항상 다른 특성이 나오게 한다. */
function petTrRollNew(q,lv){
 const tr=petTrMap(q),owned=Object.keys(tr).map(k=>tr[k].c);
 const c=petTrRollCode(owned);if(c==null)return null;
 return {c,r:petTrRollRare(lv===15)};
}
function petTrStoneBox(itemId){
 const box=elT("div","card prism-box"),lv=typeof PET_TR_STONE!=="undefined"?PET_TR_STONE[itemId]:0;
 if(!lv){box.appendChild(elT("p","hint","이 변광석의 슬롯을 찾지 못했다."));return box}
 const pend=(C.pets||[]).map(q=>({q,alt:petTrAltOf(q)})).find(x=>x.alt);
 if(pend){const {q,alt}=pend;
  box.append(elT("p","hint",q.nm+"의 "+alt.lv+"단계 결과가 아직 남았다. 변광석은 이미 쓰였다."),
   elT("p","hint",petTrStoneSlotLine(alt.old)+" → "+petTrStoneSlotLine(alt.neu)));
  const b=elT("button","btn","결과 고르기");b.type="button";
  b.onclick=()=>petTrStoneResolveAlt(q);box.appendChild(b);return box}
 const pets=petTrStonePets(lv);
 box.appendChild(elT("p","hint",lv+"단계 특성이 있는 사역마"));
 if(!pets.length){box.appendChild(elT("p","hint","아직 이 단계 특성을 받은 사역마가 없다. 성장 기록에서 특성을 먼저 받자."));return box}
 const row=elT("div","row");pets.forEach(q=>{const P=PETS[q.sp],tr=petTrMap(q),b=elT("button","chip",P[2]+" "+q.nm);b.type="button";b.title=petTrStoneSlotLine(tr[String(lv)]);b.setAttribute("aria-pressed",petTrStonePick===q.id?"true":"false");b.onclick=()=>{petTrStonePick=q.id;bag()};row.appendChild(b)});box.appendChild(row);
 const q=pets.find(x=>x.id===petTrStonePick),ok=!!q;
 if(q)box.appendChild(elT("p","hint","지금 "+lv+"단계: "+petTrStoneSlotLine(petTrMap(q)[String(lv)])));
 const b=elT("button","btn"+(ok?"":" g"),ok?q.nm+"의 "+lv+"단계 특성 바꾸기":"사역마를 골라야 한다");b.type="button";b.disabled=!ok;
 b.onclick=()=>petTrStoneRerollAsk(q,itemId);box.appendChild(b);return box}
/* 예: 특성 PATCH + 돌 1개 소모. 아니오: 아무 것도 안 씀. */
function petTrStoneRerollAsk(q,itemId){
 if(!q||!q.id||!itemId||!C)return;
 const lv=typeof PET_TR_STONE!=="undefined"?PET_TR_STONE[itemId]:0;if(!lv)return;
 const old=petTrMap(q)[String(lv)];if(!old)return bag("이 단계 특성이 없다.");
 if(((C.inv&&C.inv[itemId])||0)<1)return bag("변광석이 없다.");
 if(petTrAltOf(q))return petTrStoneResolveAlt(q);
 const neu=petTrRollNew(q,lv);if(!neu)return bag("바꿀 수 있는 특성이 남지 않았다.");
 if(!confirm(q.nm+"의 새로운 가능성이 떠올랐다.\n"+petTrStoneSlotLine(old)+" → "+petTrStoneSlotLine(neu)+"\n바꾸시겠습니까?"))return;
 const i=(C.pets||[]).findIndex(x=>x&&x.id===q.id);if(i<0)return;
 C.inv=C.inv||{};C.inv[itemId]=(C.inv[itemId]||0)-1;if(C.inv[itemId]<1)delete C.inv[itemId];
 q.tr=q.tr&&typeof q.tr==="object"?q.tr:{};q.tr[String(lv)]={c:neu.c,r:neu.r};if(q.trAlt)delete q.trAlt;
 const fields={};fields["inv/"+itemId]=C.inv[itemId]||0;fields["pets/"+i+"/tr/"+lv]={c:neu.c,r:neu.r};fields["pets/"+i+"/trAlt"]=null;
 const line=petTrStoneSlotLine(neu);
 note("quest",q.nm+"의 "+lv+"단계 특성: "+line+" (변광석)");
 if(typeof apiAccountWrite==="function")apiAccountWrite(fields).catch(()=>{try{save()}catch(e){}});else save();
 toast(q.nm+" · "+lv+"단계 → "+line);
 petTrStoneOn=null;petTrStonePick=null;
 if(typeof drawPets==="function"&&$("#v-growth")&&!$("#v-growth").hidden)drawPets();
 if(typeof bag==="function")bag();
}
/* 예전에 서버 pettrr 로 남은 trAlt 정리. 예=neu PATCH, 아니오=trAlt 만 지움. */
function petTrStoneResolveAlt(q){
 const alt=petTrAltOf(q);if(!alt||!q)return;
 const ok=confirm(q.nm+"의 새로운 가능성이 떠올랐다.\n"+petTrStoneSlotLine(alt.old)+" → "+petTrStoneSlotLine(alt.neu)+"\n바꾸시겠습니까?");
 const i=(C.pets||[]).findIndex(x=>x&&x.id===q.id);if(i<0)return;
 const fields={};fields["pets/"+i+"/trAlt"]=null;delete q.trAlt;
 if(ok){q.tr=q.tr&&typeof q.tr==="object"?q.tr:{};q.tr[String(alt.lv)]={c:alt.neu.c,r:alt.neu.r};fields["pets/"+i+"/tr/"+alt.lv]={c:alt.neu.c,r:alt.neu.r};
  const line=petTrStoneSlotLine(alt.neu);note("quest",q.nm+"의 "+alt.lv+"단계 특성: "+line+" (변광석)");toast(q.nm+" · "+alt.lv+"단계 → "+line)}
 else toast(q.nm+"의 특성은 그대로 두었다.");
 if(typeof apiAccountWrite==="function")apiAccountWrite(fields).catch(()=>{try{save()}catch(e){}});else save();
 petTrStoneOn=null;petTrStonePick=null;
 if(typeof drawPets==="function"&&$("#v-growth")&&!$("#v-growth").hidden)drawPets();
 if(typeof bag==="function")bag();
}

