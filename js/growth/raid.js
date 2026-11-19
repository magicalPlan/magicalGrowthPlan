/* 사역마 출정. 성장 기록 › 무인 상점 #gsrbox.
   표·대사는 data/pet-raid.js. 출발·보상은 서버(functions/pex.js). 클라는 요청·표시만.
   · 함께하기 펫은 보낼 수 없다. 동시에 최대 PEX_MAX마리. 맵은 여러 마리가 같아도 된다.
   · 완료 시각(t1) 스탬프만 두고, 받을 때 서버가 굴린다(클라 타이머 보상 금지). */
let pexBusy=false,pexPickPet=null,pexPickMap=null,pexNtBusy=false;
const pexWhy={
 bad:"요청이 올바르지 않다.",acc:"계정을 찾지 못했다.",pet:"그 사역마가 없다.",with:"함께하는 사역마는 보낼 수 없다.",
 full:"이미 세 마리가 출정 중이다.",busy:"그 사역마는 이미 출정 중이다.",
 wait:"아직 돌아올 시각이 아니다.",gone:"이미 돌아온 출정이다.",dup:"이미 받은 보상이다.",err:"서버에서 처리하지 못했다."
};
function pexRuns(){if(!C||!C.pex||typeof C.pex!=="object")return[];return Object.keys(C.pex).map(id=>{const r=C.pex[id];if(!r||typeof r!=="object")return null;const row=typeof PEXM!=="undefined"&&PEXM[r.k];if(!row)return null;return{id,petId:String(r.petId||""),k:String(r.k||""),t0:Number(r.t0)||0,t1:Number(r.t1)||0,sd:String(r.sd||""),nt:r.nt?1:0,row}}).filter(x=>x&&x.petId&&x.t1>x.t0)}
function pexAwaySet(){const s=new Set();pexRuns().forEach(r=>s.add(r.petId));return s}
function pexAway(q){return!!(q&&pexAwaySet().has(q.id))}
function pexPetOf(id){return(C&&Array.isArray(C.pets)?C.pets:[]).find(q=>q&&q.id===id)||null}
function pexLootCell(cell){if(!cell||typeof cell!=="object")return"";if(cell.g)return"골드 "+cell.g;const id=cell.id,n=Math.max(1,Math.floor(Number(cell.n)||1));let nm=id;try{if(typeof matNm==="function")nm=matNm(id);else{const it=typeof ITM!=="undefined"&&ITM.find(t=>t[0]===id);const m=typeof MAT!=="undefined"&&MAT.find(t=>t[0]===id);nm=(it&&it[1])||(m&&m[1])||id}}catch(e){}return nm+(n>1?" ×"+n:"")}
/* 맵 칸용 짧은 보상. 기본·조각·특별(+50%)만. */
function pexLootLite(L){if(!L)return"";const a=[pexLootCell(L[3]),pexLootCell(L[6]),pexLootCell(L[7])].filter(Boolean);const bonus=pexLootCell(L[8]);if(bonus)a.push(bonus+"(50%)");return a.join(" · ")}
function pexFill(tpl,nm){return String(tpl||"").replace(/\$\{사역마\s*이름\}/g,nm).replace(/\$\{사역마이름\}/g,nm)}
function pexStripPatch(body){if(!body)return body;Object.keys(body).forEach(k=>{if(k==="c/pex"||k.indexOf("c/pex/")===0||k==="pexpay"||k.indexOf("pexpay/")===0)delete body[k]});return body}
async function pexSync(){try{if(typeof accSyncIfNewer==="function")await accSyncIfNewer()}catch(e){}
 try{if(!C||!DB||!UID)return;const s=await DB.doc("accounts/"+UID+"/c/pex").get();C.pex=s.exists?s.data():null}catch(e){}}
/* done 직후 UI를 막고 기다리지 않는다. 계정·가방 sync 는 백그라운드. */
function pexSyncBg(after){
 const go=async()=>{
  try{accSeen=0;if(typeof accSyncIfNewer==="function")await accSyncIfNewer();else await pexSync()}catch(e){try{await pexSync()}catch(e2){}}
  try{if(typeof after==="function")after()}catch(e){}
 };
 go()
}
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
 const runs=pexRuns(); if(runs.length>=(typeof PEX_MAX==="number"?PEX_MAX:3)){toast("동시에 세 마리까지만 보낼 수 있다.");return}
 if(!confirm(q.nm+"을(를) "+row[1]+"("+row[2]+"시간)으로 보낼까?\n돌아오면 성장 기록 › 무인 상점에서 보상을 받는다."))return;
 pexBusy=true;drawPex();
 const reqId="r"+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36);
 try{
  await DB.doc("pex/go/"+UID+"/"+reqId).set({petId,k,ts:Date.now()});
  const res=await pexWait("pex/go/"+UID+"/"+reqId,25000);
  if(!res||!res.ok){pexSyncBg();toast(pexWhy[(res&&res.why)||"err"]||"출발하지 못했다.");return}
  /* 응답 run 으로 바로 그리고, 계정 sync 는 백그라운드. */
  if(res.id&&res.run){C.pex=C.pex&&typeof C.pex==="object"?C.pex:{};C.pex[res.id]=res.run}
  pexPickPet=null;
  toast("🐾 "+q.nm+" → "+row[1]+"! "+row[2]+"시간 뒤에 돌아온다.");
  try{note("quest",q.nm+"을(를) "+row[1]+"로 보냈다. "+row[2]+"시간 뒤에 돌아온다.")}catch(e){}
  pexSyncBg(()=>{try{if(typeof drawPex==="function"&&$("#gsrbox")&&!$("#gsrbox").hidden)drawPex()}catch(e){}
   try{if(typeof drawPets==="function"&&$("#gr-pet")&&!$("#gr-pet").hidden)drawPets()}catch(e){}});
 }catch(e){toast("출발 요청을 보내지 못했다.")}
 finally{pexBusy=false;drawPex();try{if(typeof drawPets==="function"&&$("#gr-pet")&&!$("#gr-pet").hidden)drawPets()}catch(e){}}}
async function pexClaim(run,early){if(pexBusy||!run||!DB||!UID)return;
 const now=Date.now(),done=now>=run.t1;
 if(!done&&!early)return;
 if(early){if(!confirm("지금 불러올까? 중도 귀환이면 보상을 받지 못한다."))return}
 pexBusy=true;drawPex();
 try{
  await DB.doc("pex/take/"+UID+"/"+run.id).set({early:early?1:0,ts:Date.now()});
  const res=await pexWait("pex/take/"+UID+"/"+run.id,25000);
  if(!res||!res.ok){pexSyncBg();toast(pexWhy[(res&&res.why)||"err"]||"보상을 받지 못했다.");return}
  /* 서버가 이미 지급·pex 제거. 클라 가산 금지. done 요약으로 팝업 먼저, sync 는 백그라운드. */
  if(C.pex&&C.pex[run.id])delete C.pex[run.id];
  pexShowRw(res);
  pexSyncBg(()=>{
   try{if(typeof titleState==="function")titleState()}catch(e){}
   try{if(typeof drawPex==="function"&&$("#gsrbox")&&!$("#gsrbox").hidden)drawPex()}catch(e){}
   try{if(typeof drawPets==="function"&&$("#gr-pet")&&!$("#gr-pet").hidden)drawPets()}catch(e){}
  });
 }catch(e){toast("귀환 요청을 보내지 못했다.")}
 finally{pexBusy=false;drawPex();try{if(typeof drawPets==="function"&&$("#gr-pet")&&!$("#gr-pet").hidden)drawPets()}catch(e){}}}
/* 화면 그리기.
   UI 정리(2026-11): 긴 안내 문단을 한 줄+용량 뱃지로 줄이고,
   출정 중 / 보내기(펫·맵·버튼) 구역을 나눔. 맵은 이름·시간·보상 줄을 분리. */
function drawPex(){const box=$("#gsrbox");if(!box)return;
 if(!C){box.innerHTML="";box.appendChild(elT("p","hint","캐릭터를 불러온 뒤 다시 열어 주세요."));return}
 try{
  box.innerHTML="";
  const max=typeof PEX_MAX==="number"?PEX_MAX:3,runs=pexRuns(),now=Date.now(),away=pexAwaySet();
  const onMap={};runs.forEach(r=>{onMap[r.k]=(onMap[r.k]|0)+1});
  if(pexPickPet&&(away.has(pexPickPet)||C.pet===pexPickPet||!pexPetOf(pexPickPet)))pexPickPet=null;

  /* [안내] 예전: 규칙 전부를 한 hint 문단에. 지금: 요약 한 줄 + (n/max) 뱃지. */
  const head=elT("div","pex-head");
  head.appendChild(elT("p","hint pex-lead","함께하지 않는 사역마를 보내 보상을 얻는다. 완료 전 귀환은 보상 없음."));
  const cap=elT("span","pex-cap",runs.length+" / "+max);cap.title="출정 중 / 동시 상한";
  head.appendChild(cap);
  box.appendChild(head);

  /* [출정 중] 진행 바·귀환 버튼. 비어 있으면 구역 자체를 숨김(빈 안내 문구 제거). */
  if(runs.length){
   const sec=elT("section","pex-sec pex-on-sec");
   sec.appendChild(elT("h3","pex-sec-h","출정 중"));
   const list=elT("div","pex-on");
   runs.forEach(r=>{
    const q=pexPetOf(r.petId),P=q&&PETS[q.sp],done=now>=r.t1;
    const w=elT("div","dq pex-run"+(done?" got":"")),cp=elT("div","dq-copy");
    const bar=elT("div","bar"),f=elT("i");
    f.style.width=Math.min(100,(now-r.t0)/Math.max(1,r.t1-r.t0)*100)+"%";bar.appendChild(f);
    const nm=q?q.nm:r.petId,ic=P?P[2]:"🐾";
    cp.append(
     elT("b","",ic+" "+nm+" · "+r.row[1]),
     elT("small","",done?"돌아왔다. 보상을 받자.":"남은 시간 "+cdTxt(r.t1-now)),
     bar
    );
    const b=elT("button","chip",done?"보상 받기":"불러오기");b.type="button";b.disabled=!!pexBusy;
    b.title=done?"":"완료 전에 부르면 보상을 받지 못한다";
    b.onclick=()=>pexClaim(r,!done);
    w.append(cp,b);list.appendChild(w)
   });
   sec.appendChild(list);box.appendChild(sec)
  }

  if(runs.length>=max){
   box.appendChild(elT("p","hint pex-full","동시에 "+max+"마리까지. 돌아온 뒤 다시 보낼 수 있다."));
   return
  }

  /* [보내기] 펫 select → 맵 목록 → 출정 버튼. 예전의 "출정 보내기" 제목·칩 나열을 셀렉트+맵 카드로. */
  const send=elT("section","pex-sec pex-send");
  send.appendChild(elT("h3","pex-sec-h","보내기"));

  const pets=(C.pets||[]).filter(q=>q&&PETS[q.sp]&&C.pet!==q.id&&!away.has(q.id));
  if(!pexPickPet&&pets.length)pexPickPet=pets[0].id; /* 기본: 보낼 수 있는 목록의 맨 위 */
  const sel=elT("div","pex-sel");
  const lab=elT("label","pex-sel-lab","사역마");lab.setAttribute("for","pex-pet");
  sel.appendChild(lab);
  if(!pets.length)sel.appendChild(elT("p","hint","보낼 사역마가 없다. 함께하기를 끄거나 귀환을 기다리자."));
  else{
   const dd=elT("select","pex-pet-sel");dd.id="pex-pet";dd.setAttribute("aria-label","출정 사역마");dd.disabled=!!pexBusy;
   pets.forEach(q=>{
    const P=PETS[q.sp],o=elT("option");o.value=q.id;o.textContent=P[2]+" "+q.nm;
    if(pexPickPet===q.id)o.selected=true;dd.appendChild(o)
   });
   dd.onchange=()=>{pexPickPet=dd.value||null;drawPex()};
   sel.appendChild(dd)
  }
  send.appendChild(sel);

  /* 맵: 한 줄에 이름·시간·출정 수, 아래에 짧은 보상. 같은 맵 중복 출정 가능. */
  const mapsWrap=elT("div","pex-maps-wrap");
  mapsWrap.appendChild(elT("p","pex-maps-lab","목적지"));
  const maps=elT("div","pex-maps");
  (typeof PEX!=="undefined"?PEX:[]).forEach(L=>{
   const n=onMap[L[0]]|0,on=pexPickMap===L[0];
   const row=elT("button","pex-map"+(on?" on":""));row.type="button";row.disabled=!!pexBusy;
   row.setAttribute("aria-pressed",on?"true":"false");
   const top=elT("div","pex-map-top");
   top.appendChild(elT("b","pex-map-nm",L[1]));
   const meta=elT("span","pex-map-meta",L[2]+"시간"+(n?" · "+n+"마리":""));
   top.appendChild(meta);
   const cp=elT("div","pex-map-copy");
   cp.append(top,elT("small","pex-map-rw",pexLootLite(L)));
   row.appendChild(cp);
   row.onclick=()=>{pexPickMap=L[0];drawPex()};
   maps.appendChild(row)
  });
  mapsWrap.appendChild(maps);send.appendChild(mapsWrap);

  const go=elT("button","btn pex-go"+(pexPickPet&&pexPickMap&&!pexBusy?"":" g"),pexBusy?"처리 중...":"사역마 출정");
  go.type="button";go.disabled=!pexPickPet||!pexPickMap||!!pexBusy;go.onclick=pexStart;
  send.appendChild(go);
  box.appendChild(send);
 }catch(e){box.innerHTML="";box.appendChild(elT("p","hint","출정 화면을 그리지 못했다. 새로고침 후 다시 열어 주세요."))}
}
/* 돌아올 시각이면 한 번 알린다. 보상은 버튼으로만 받는다. */
setInterval(async()=>{if(!C)return;const runs=pexRuns(),due=runs.filter(r=>Date.now()>=r.t1&&!r.nt);if(!due.length||pexNtBusy)return;pexNtBusy=true;
 try{for(const r of due){if(C.pex&&C.pex[r.id])C.pex[r.id].nt=1;const q=pexPetOf(r.petId),nm=q?q.nm:r.row[1];
  try{note("quest",nm+"이(가) "+r.row[1]+"에서 돌아왔다! 무인 상점에서 보상을 받자.")}catch(e){}
  try{toast("🐾 "+nm+" · "+r.row[1]+"에서 돌아왔다!")}catch(e){}
  try{ding()}catch(e){}}
  /* nt 는 클라 표시용. 서버 c/pex 는 건드리지 않는다(보상 PATCH 금지). */
  if(typeof drawPex==="function"&&$("#gsrbox")&&$("#v-growth")&&!$("#v-growth").hidden)drawPex()}
 finally{pexNtBusy=false}},30000);
