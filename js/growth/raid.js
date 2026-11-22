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
 /* 사역마 출정 대사(도감 k=px). 제목(ti)이 있으면 발견한 것만 기록. */
 try{const ti=res.sc&&res.sc.ti;if(ti&&typeof dexAdd==="function"&&dexAdd("px",String(ti))){try{if(typeof note==="function")note("dex","도감에 새 사역마 출정 사건이 기록되었다: "+ti)}catch(e){}try{if(typeof save==="function")save()}catch(e){}}}catch(e){}
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
/* 맵 칸용 보상 목록: [글, 50% 여부]. 기본·조각·특별(확정)·특별(50%). */
function pexLootList(L){if(!L)return[];const a=[];[L[3],L[6],L[7]].forEach(c=>{const t=pexLootCell(c);if(t)a.push([t,0])});const bn=pexLootCell(L[8]);if(bn)a.push([bn,1]);return a}
/* 출정 칸.
   UI 정리(2026-11-19): 위에서 아래로 안내 카드(용량 칸) → 출정 중 카드 → 보내기 1·2단계 → 출정 버튼.
   · 돌아온 출정은 흐리게 하지 않고 금색으로 강조, '보상 받기'를 주 버튼으로.
   · 사역마는 드롭다운 대신 칩으로 고른다. 목적지는 넓은 화면에서 두 칸.
   · 보상은 작은 알약(.pex-rw), 50% 확률은 점선 알약. */
function drawPex(){const box=$("#gsrbox");if(!box)return;
 if(!C){box.innerHTML="";box.appendChild(elT("p","hint","캐릭터를 불러온 뒤 다시 열어 주세요."));return}
 try{
  box.innerHTML="";
  const max=typeof PEX_MAX==="number"?PEX_MAX:3,runs=pexRuns(),now=Date.now(),away=pexAwaySet();
  const onMap={};runs.forEach(r=>{onMap[r.k]=(onMap[r.k]|0)+1});
  if(pexPickPet&&(away.has(pexPickPet)||C.pet===pexPickPet||!pexPetOf(pexPickPet)))pexPickPet=null;

  /* [안내] 요약 + 출정 칸(●●○). */
  const head=elT("div","pex-head");
  const hl=elT("div","pex-head-tx");
  hl.append(elT("p","hint pex-lead","함께하지 않는 사역마를 보내 보상을 얻는다. 다 돌아오기 전에 부르면 보상은 없다."));
  const cap=elT("div","pex-cap");cap.title="출정 중 "+runs.length+" / 동시에 "+max+"마리";cap.setAttribute("aria-label",cap.title);
  for(let i=0;i<max;i++)cap.appendChild(elT("i",i<runs.length?"on":""));
  cap.appendChild(elT("span","pex-cap-n",runs.length+" / "+max));
  head.append(hl,cap);box.appendChild(head);

  /* [출정 중] 돌아온 것을 먼저. */
  if(runs.length){
   const sec=elT("section","pex-sec pex-on-sec");
   sec.appendChild(elT("h3","pex-sec-h","출정 중"));
   const list=elT("div","pex-on");
   runs.slice().sort((x,y)=>((now>=y.t1)-(now>=x.t1))||(x.t1-y.t1)).forEach(r=>{
    const q=pexPetOf(r.petId),P=q&&PETS[q.sp],done=now>=r.t1;
    const pct=Math.min(100,Math.max(0,(now-r.t0)/Math.max(1,r.t1-r.t0)*100));
    const w=elT("div","pex-run"+(done?" done":""));
    const nm=q?q.nm:r.petId,ic=P?P[2]:"🐾";
    w.appendChild(elT("span","pex-run-ic",ic));
    const cp=elT("div","pex-run-copy");
    const t=elT("div","pex-run-top");
    t.append(elT("b","pex-run-nm",nm),elT("span","pex-run-to","→ "+r.row[1]));
    const bar=elT("div","bar pex-bar"),f=elT("i");f.style.width=pct+"%";bar.appendChild(f);
    cp.append(t,elT("small","pex-run-st",done?"✨ 돌아왔다! 보상을 받자.":"남은 시간 "+cdTxt(r.t1-now)+" · "+Math.floor(pct)+"%"),bar);
    const b=elT("button",done?"btn pex-take":"chip pex-call",done?"보상 받기":"불러오기");b.type="button";b.disabled=!!pexBusy;
    b.title=done?"":"완료 전에 부르면 보상을 받지 못한다";
    b.onclick=()=>pexClaim(r,!done);
    w.append(cp,b);list.appendChild(w)
   });
   sec.appendChild(list);box.appendChild(sec)
  }

  if(runs.length>=max){
   box.appendChild(elT("p","pex-full","출정 칸이 모두 찼다. 사역마가 돌아오면 다시 보낼 수 있다."));
   return
  }

  /* [보내기] 1. 사역마 칩 → 2. 목적지 카드 → 출정 버튼. */
  const send=elT("section","pex-sec pex-send");
  send.appendChild(elT("h3","pex-sec-h","보내기"));

  const pets=(C.pets||[]).filter(q=>q&&PETS[q.sp]&&C.pet!==q.id&&!away.has(q.id));
  if(!pexPickPet&&pets.length)pexPickPet=pets[0].id; /* 기본: 보낼 수 있는 목록의 맨 위 */
  const sel=elT("div","pex-step");
  sel.appendChild(elT("p","pex-step-h","① 보낼 사역마"));
  if(!pets.length)sel.appendChild(elT("p","hint pex-none","보낼 사역마가 없다. 함께하기를 바꾸거나 돌아오기를 기다리자."));
  else{
   const row=elT("div","pex-pets");row.setAttribute("role","group");row.setAttribute("aria-label","출정 사역마");
   pets.forEach(q=>{
    const P=PETS[q.sp],on=pexPickPet===q.id,c=elT("button","pex-pet"+(on?" on":""));c.type="button";c.disabled=!!pexBusy;
    c.setAttribute("aria-pressed",on?"true":"false");
    c.append(elT("span","pex-pet-ic",P[2]),elT("span","pex-pet-nm",q.nm));
    c.onclick=()=>{pexPickPet=q.id;drawPex()};row.appendChild(c)
   });
   sel.appendChild(row)
  }
  send.appendChild(sel);

  /* 목적지: 이름 · 시간 뱃지 · 보내 둔 수, 아래에 보상 알약. 같은 맵 중복 출정 가능. */
  const mapsWrap=elT("div","pex-step");
  mapsWrap.appendChild(elT("p","pex-step-h","② 목적지"));
  const maps=elT("div","pex-maps");
  (typeof PEX!=="undefined"?PEX:[]).forEach(L=>{
   const n=onMap[L[0]]|0,on=pexPickMap===L[0];
   const row=elT("button","pex-map"+(on?" on":""));row.type="button";row.disabled=!!pexBusy;
   row.setAttribute("aria-pressed",on?"true":"false");
   const top=elT("div","pex-map-top");
   top.appendChild(elT("b","pex-map-nm",(on?"✓ ":"")+L[1]));
   const meta=elT("span","pex-map-meta");
   meta.appendChild(elT("span","pex-tm","⏱ "+L[2]+"시간"));
   if(n)meta.appendChild(elT("span","pex-tm pex-tm-n","🐾 "+n));
   top.appendChild(meta);
   const rw=elT("div","pex-rws");
   pexLootList(L).forEach(([t,half])=>rw.appendChild(elT("span","pex-rw"+(half?" half":""),t+(half?" · 50%":""))));
   row.append(top,rw);
   row.onclick=()=>{pexPickMap=L[0];drawPex()};
   maps.appendChild(row)
  });
  mapsWrap.appendChild(maps);send.appendChild(mapsWrap);

  const qp=pexPetOf(pexPickPet),mp=typeof PEXM!=="undefined"&&PEXM[pexPickMap];
  const ready=!!(qp&&mp&&!pexBusy);
  const go=elT("button","btn pex-go"+(ready?"":" g"),pexBusy?"처리 중...":ready?"🐾 "+qp.nm+" → "+mp[1]+" 출정 ("+mp[2]+"시간)":qp?"목적지를 골라 주세요":"사역마 출정");
  go.type="button";go.disabled=!ready;go.onclick=pexStart;
  send.appendChild(go);
  box.appendChild(send);
 }catch(e){box.innerHTML="";box.appendChild(elT("p","hint","출정 화면을 그리지 못했다. 새로고침 후 다시 열어 주세요."))}
}
/* 귀환 알림은 출정 sd 당 1회. c/pex 는 서버 권한이므로 nt 를 계정에 쓰지 않고,
   로컬(mgr_pex_nt)에만 남긴다. sync 가 C.pex 를 덮어도 같은 출정은 다시 울리지 않는다. */
function pexNtKey(){return UID?"mgr_pex_nt_"+UID:""}
function pexNtLoad(){const k=pexNtKey();if(!k)return{};try{const o=JSON.parse(localStorage.getItem(k)||"{}");return o&&typeof o==="object"?o:{}}catch(e){return{}}}
function pexNtSave(o){const k=pexNtKey();if(!k||!o)return;try{const ks=Object.keys(o);if(ks.length>40)ks.slice(0,ks.length-40).forEach(x=>delete o[x]);localStorage.setItem(k,JSON.stringify(o))}catch(e){}}
function pexNtHad(sd){const k=String(sd||"");return!!(k&&pexNtLoad()[k])}
function pexNtMark(sd){const k=String(sd||"");if(!k)return;const o=pexNtLoad();o[k]=1;pexNtSave(o)}
setInterval(()=>{if(!C||!UID||pexNtBusy)return;const due=pexRuns().filter(r=>Date.now()>=r.t1&&!r.nt&&!pexNtHad(r.sd));if(!due.length)return;pexNtBusy=true;
 try{due.forEach(r=>{if(C.pex&&C.pex[r.id])C.pex[r.id].nt=1;pexNtMark(r.sd);const q=pexPetOf(r.petId),nm=q?q.nm:r.row[1];
  try{note("quest",nm+"이(가) "+r.row[1]+"에서 돌아왔다! 무인 상점에서 보상을 받자.")}catch(e){}
  try{toast("🐾 "+nm+" · "+r.row[1]+"에서 돌아왔다!")}catch(e){}
  try{ding()}catch(e){}});
  if(typeof drawPex==="function"&&$("#gsrbox")&&$("#v-growth")&&!$("#v-growth").hidden)drawPex()}
 finally{pexNtBusy=false}},30000);
