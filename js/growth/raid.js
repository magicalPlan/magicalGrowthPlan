/* 사역마 출정. 성장 기록 › 무인 상점 #gsrbox.
   표·대사는 data/pet-raid.js. 출발·보상은 서버(functions/pex.js). 클라는 요청·표시만.
   · 함께하기 펫은 보낼 수 없다. 동시에 최대 PEX_MAX마리, 맵은 겹치지 않는다.
   · 완료 시각(t1) 스탬프만 두고, 받을 때 서버가 굴린다(클라 타이머 보상 금지). */
let pexBusy=false,pexPickPet=null,pexPickMap=null,pexNtBusy=false;
const pexWhy={
 bad:"요청이 올바르지 않다.",acc:"계정을 찾지 못했다.",pet:"그 사역마가 없다.",with:"함께하는 사역마는 보낼 수 없다.",
 full:"이미 세 마리가 출정 중이다.",busy:"그 사역마는 이미 출정 중이다.",map:"그곳에는 이미 다른 사역마가 가 있다.",
 wait:"아직 돌아올 시각이 아니다.",soon:"떠난 지 한 시간이 지나야 부를 수 있다.",gone:"이미 돌아온 출정이다.",dup:"이미 받은 보상이다.",err:"서버에서 처리하지 못했다."
};
function pexRuns(){if(!C||!C.pex||typeof C.pex!=="object")return[];return Object.keys(C.pex).map(id=>{const r=C.pex[id];if(!r||typeof r!=="object")return null;const row=typeof PEXM!=="undefined"&&PEXM[r.k];if(!row)return null;return{id,petId:String(r.petId||""),k:String(r.k||""),t0:Number(r.t0)||0,t1:Number(r.t1)||0,sd:String(r.sd||""),nt:r.nt?1:0,row}}).filter(x=>x&&x.petId&&x.t1>x.t0)}
function pexAwaySet(){const s=new Set();pexRuns().forEach(r=>s.add(r.petId));return s}
function pexAway(q){return!!(q&&pexAwaySet().has(q.id))}
function pexPetOf(id){return(C&&Array.isArray(C.pets)?C.pets:[]).find(q=>q&&q.id===id)||null}
function pexLootCell(cell){if(!cell||typeof cell!=="object")return"";if(cell.g)return"골드 "+cell.g;const id=cell.id,n=Math.max(1,Math.floor(Number(cell.n)||1));let nm=id;try{if(typeof matNm==="function")nm=matNm(id);else{const it=typeof ITM!=="undefined"&&ITM.find(t=>t[0]===id);const m=typeof MAT!=="undefined"&&MAT.find(t=>t[0]===id);nm=(it&&it[1])||(m&&m[1])||id}}catch(e){}return nm+(n>1?" ×"+n:"")}
function pexFill(tpl,nm){return String(tpl||"").replace(/\$\{사역마\s*이름\}/g,nm).replace(/\$\{사역마이름\}/g,nm)}
function pexStripPatch(body){if(!body)return body;Object.keys(body).forEach(k=>{if(k==="c/pex"||k.indexOf("c/pex/")===0||k==="pexpay"||k.indexOf("pexpay/")===0)delete body[k]});return body}
async function pexSync(){try{if(typeof accSyncIfNewer==="function")await accSyncIfNewer()}catch(e){}
 try{if(!C||!DB||!UID)return;const s=await DB.doc("accounts/"+UID+"/c/pex").get();C.pex=s.exists?s.data():null}catch(e){}}
async function pexWait(path,ms){ms=ms||20000;const t0=Date.now();
 while(Date.now()-t0<ms){try{const s=await DB.doc(path).get(),v=s.exists?s.data():null;if(v&&v.done)return v}catch(e){}await new Promise(r=>setTimeout(r,400))}
 return null}
function pexShowRw(res){if(!res||!res.ok)return;
 const nm=res.nm||"출정",tag=res.early?"중도 귀환":"귀환",head=res.head||(res.early?"중간에 돌아왔다.":"토벌을 마치고 돌아왔다.");
 const sc=res.sc&&res.sc.tx?("\n\n「"+(res.sc.ti||"")+"」\n"+pexFill(res.sc.tx,res.petNm||"사역마")):"";
 const rw=res.rw||(Array.isArray(res.lines)?res.lines.join(", "):"");
 try{if(res.inv&&typeof dexAdd==="function")Object.keys(res.inv).forEach(id=>{try{if(id==="bond"||id==="g4")dexAdd("it",id);else dexAdd("mat",id)}catch(e){}})}catch(e){}
 try{if(typeof checkTitles==="function")checkTitles()}catch(e){}
 alertBox("🐾 "+nm+" · "+tag,head+sc+"\n\n"+rw);
 try{if(typeof note==="function")note("quest",nm+": "+head+(rw?" ("+rw+")":""))}catch(e){}}
async function pexStart(){if(pexBusy||!C||!DB||!UID)return;
 const petId=pexPickPet,k=pexPickMap,row=typeof PEXM!=="undefined"&&PEXM[k],q=pexPetOf(petId);
 if(!row||!q){toast("사역마와 맵을 골라 주세요.");return}
 if(C.pet===petId){toast("함께하는 사역마는 보낼 수 없다.");return}
 if(pexAway(q)){toast("이미 출정 중인 사역마다.");return}
 const runs=pexRuns();if(runs.length>=(typeof PEX_MAX==="number"?PEX_MAX:3)){toast("동시에 세 마리까지만 보낼 수 있다.");return}
 if(runs.some(r=>r.k===k)){toast("그곳에는 이미 다른 사역마가 가 있다.");return}
 if(!confirm(q.nm+"을(를) "+row[1]+"("+row[2]+"시간)으로 보낼까?\n돌아오면 성장 기록 › 무인 상점에서 보상을 받는다."))return;
 pexBusy=true;drawPex();
 const reqId="r"+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36);
 try{
  await DB.doc("pex/go/"+UID+"/"+reqId).set({petId,k,ts:Date.now()});
  const res=await pexWait("pex/go/"+UID+"/"+reqId,25000);
  await pexSync();
  if(!res||!res.ok){toast(pexWhy[(res&&res.why)||"err"]||"출발하지 못했다.");return}
  if(res.id&&res.run){C.pex=C.pex&&typeof C.pex==="object"?C.pex:{};C.pex[res.id]=res.run}
  pexPickPet=null;pexPickMap=null;
  toast("🐾 "+q.nm+" → "+row[1]+"! "+row[2]+"시간 뒤에 돌아온다.");
  try{note("quest",q.nm+"을(를) "+row[1]+"로 보냈다. "+row[2]+"시간 뒤에 돌아온다.")}catch(e){}
 }catch(e){toast("출발 요청을 보내지 못했다.")}
 finally{pexBusy=false;drawPex();try{if(typeof drawPets==="function"&&$("#gr-pet")&&!$("#gr-pet").hidden)drawPets()}catch(e){}}}
async function pexClaim(run,early){if(pexBusy||!run||!DB||!UID)return;
 const now=Date.now(),done=now>=run.t1;
 if(!done&&!early)return;
 if(early){if(now<run.t0+(typeof PEX_EARLY_MS==="number"?PEX_EARLY_MS:3600000)){toast("떠난 지 한 시간이 지나야 부를 수 있다.");return}
  if(!confirm("지금 불러올까? 토벌 보상 대신 절망의 재 10개만 받는다."))return}
 pexBusy=true;drawPex();
 try{
  await DB.doc("pex/take/"+UID+"/"+run.id).set({early:early?1:0,ts:Date.now()});
  const res=await pexWait("pex/take/"+UID+"/"+run.id,25000);
  if(!res||!res.ok){await pexSync();toast(pexWhy[(res&&res.why)||"err"]||"보상을 받지 못했다.");return}
  /* 서버가 이미 지급·pex 제거. 클라 가산 금지(롤백·이중 지급 방지). 계정본만 받는다. */
  try{accSeen=0;if(typeof accSyncIfNewer==="function")await accSyncIfNewer();else await pexSync()}catch(e){try{await pexSync()}catch(e2){}}
  pexShowRw(res);
  try{if(typeof titleState==="function")titleState()}catch(e){}
 }catch(e){toast("귀환 요청을 보내지 못했다.")}
 finally{pexBusy=false;drawPex();try{if(typeof drawPets==="function"&&$("#gr-pet")&&!$("#gr-pet").hidden)drawPets()}catch(e){}}}
function drawPex(){const box=$("#gsrbox");if(!box||!C)return;box.innerHTML="";
 const max=typeof PEX_MAX==="number"?PEX_MAX:3,runs=pexRuns(),now=Date.now(),away=pexAwaySet();
 box.appendChild(elT("p","hint","함께하지 않는 사역마를 마을로 보내 보상을 얻는다. 동시에 "+max+"마리까지, 맵은 겹치지 않는다. 지정 시간이 되면 돌아오며, 보상은 서버가 확정한다. 한 시간 뒤에는 중간에 부를 수 있으나 절망의 재만 받는다."));
 if(runs.length){const list=elT("div","pex-on");runs.forEach(r=>{const q=pexPetOf(r.petId),P=q&&PETS[q.sp],done=now>=r.t1,w=elT("div","dq"+(done?" got":"")),cp=elT("div","dq-copy"),bar=elT("div","bar"),f=elT("i");
  f.style.width=Math.min(100,(now-r.t0)/Math.max(1,r.t1-r.t0)*100)+"%";bar.appendChild(f);
  const nm=q?q.nm:(r.petId),ic=P?P[2]:"🐾";
  cp.append(elT("b","",ic+" "+nm+" · "+r.row[1]+(done?" · 귀환!":" · 출정 중")),elT("small","",done?"토벌을 마치고 돌아왔다. 보상을 받자.":"남은 시간 "+cdTxt(r.t1-now)),bar);
  const b=elT("button","chip",done?"보상 받기":"불러오기");b.type="button";b.disabled=!!pexBusy||(!done&&now<r.t0+(typeof PEX_EARLY_MS==="number"?PEX_EARLY_MS:3600000));
  b.title=!done&&now<r.t0+(typeof PEX_EARLY_MS==="number"?PEX_EARLY_MS:3600000)?"떠난 지 한 시간 뒤에 부를 수 있다":"";
  b.onclick=()=>pexClaim(r,!done);w.append(cp,b);list.appendChild(w)});box.appendChild(list)}
 else box.appendChild(elT("p","hint","지금 출정 중인 사역마가 없다."));

 if(runs.length<max){const send=elT("div","pex-send");
  send.appendChild(elT("b","","출정 보내기"));
  const pets=(C.pets||[]).filter(q=>q&&PETS[q.sp]&&C.pet!==q.id&&!away.has(q.id));
  if(!pets.length)send.appendChild(elT("p","hint","보낼 수 있는 사역마가 없다. 함께하기를 끄거나, 출정에서 돌아온 뒤 보내 보자."));
  else{const prow=elT("div","row");pets.forEach(q=>{const P=PETS[q.sp],b=elT("button","chip",P[2]+" "+q.nm);b.type="button";b.setAttribute("aria-pressed",pexPickPet===q.id?"true":"false");b.onclick=()=>{pexPickPet=q.id;drawPex()};prow.appendChild(b)});send.appendChild(prow)}
  const used=new Set(runs.map(r=>r.k)),mrow=elT("div","row");
  (typeof PEX!=="undefined"?PEX:[]).forEach(L=>{const busy=used.has(L[0]),b=elT("button","chip",L[1]+" · "+L[2]+"시간"+(busy?" (출정 중)":""));b.type="button";b.disabled=busy;b.setAttribute("aria-pressed",pexPickMap===L[0]?"true":"false");b.onclick=()=>{pexPickMap=L[0];drawPex()};mrow.appendChild(b)});
  send.appendChild(mrow);
  if(pexPickMap&&PEXM[pexPickMap]){const L=PEXM[pexPickMap],prev=elT("p","hint");
   prev.textContent="기본 "+pexLootCell(L[3])+" · 조각 "+pexLootCell(L[6])+" · 특별 "+pexLootCell(L[7])+" · 특별(50%) "+pexLootCell(L[8])+" · 소모품 "+pexLootCell(L[4])+" / "+pexLootCell(L[5])+" (1~3개)";
   send.appendChild(prev)}
  const go=elT("button","btn"+(pexPickPet&&pexPickMap&&!pexBusy?"":" g"),pexBusy?"처리 중...":"사역마 출정");go.type="button";go.disabled=!pexPickPet||!pexPickMap||!!pexBusy;go.onclick=pexStart;send.appendChild(go);
  box.appendChild(send)}

 const table=elT("details","pex-table");table.open=false;
 table.appendChild(elT("summary","","맵별 보상 표"));
 const ul=elT("ul","pm-req");
 (typeof PEX!=="undefined"?PEX:[]).forEach(L=>{ul.appendChild(elT("li","",L[1]+" · "+L[2]+"시간 — 기본 "+pexLootCell(L[3])+", 소모품 "+pexLootCell(L[4])+" / "+pexLootCell(L[5])+", 조각 "+pexLootCell(L[6])+", 특별 "+pexLootCell(L[7])+", 특별(50%) "+pexLootCell(L[8]))});
 table.appendChild(ul);box.appendChild(table)}
/* 돌아올 시각이면 한 번 알린다. 보상은 버튼으로만 받는다. */
setInterval(async()=>{if(!C)return;const runs=pexRuns(),due=runs.filter(r=>Date.now()>=r.t1&&!r.nt);if(!due.length||pexNtBusy)return;pexNtBusy=true;
 try{for(const r of due){if(C.pex&&C.pex[r.id])C.pex[r.id].nt=1;const q=pexPetOf(r.petId),nm=q?q.nm:r.row[1];
  try{note("quest",nm+"이(가) "+r.row[1]+"에서 돌아왔다! 무인 상점에서 보상을 받자.")}catch(e){}
  try{toast("🐾 "+nm+" · "+r.row[1]+"에서 돌아왔다!")}catch(e){}
  try{ding()}catch(e){}}
  /* nt 는 클라 표시용. 서버 c/pex 는 건드리지 않는다(보상 PATCH 금지). */
  if(typeof drawPex==="function"&&$("#gsrbox")&&$("#v-growth")&&!$("#v-growth").hidden)drawPex()}
 finally{pexNtBusy=false}},30000);
