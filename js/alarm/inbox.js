/* 알림함. main.js 다음에 불러야 한다. 알림을 쌓고, 종류별로 보고, 누르면 관련 화면으로 간다.
   한 번에 10개만 보여주고, 더 보기로 이전 10개를 이어서 본다.
   출정·마을·친구·공지는 note 를, 하단 메뉴는 inbox 를 그대로 부른다.
   중복: id(사건 키)가 있으면 같은 id 는 한 번만. 없으면 맨 앞과 k·t·u 가 같고 5초 안이면 건너뛴다.
   (공명 rqRetry·다기기 재처리로 같은 알림이 여러 번 쌓이던 것을 막는다. 서버 부하는 늘지 않는다.)

   알림 전용 벨 ntin/{나}/{id} = { k, t, u, ts }.
   · live 1개로 받아 note 한 뒤 칸을 지운다. 계정 c/nt·accSync 를 기다리지 않는다.
   · 게시판·공명·친구·선물·공지·1:1 벨이 여기를 쓴다. */
function note(k,t,u,id){
 if(!C)return false;
 C.nt=Array.isArray(C.nt)?C.nt:[];
 const tx=String(t).slice(0,160),uu=u||"",now=Date.now(),sid=id!=null&&id!==""?String(id):"";
 if(sid){if(C.nt.some(n=>n&&n.id===sid))return false}
 else{const h=C.nt[0];if(h&&h.k===k&&h.t===tx&&(h.u||"")===uu&&now-(Number(h.ts)||0)<5000)return false}
 C.nt.unshift(sid?{k,t:tx,u:uu,ts:now,r:false,id:sid}:{k,t:tx,u:uu,ts:now,r:false});
 ntTrim();save();
 if(!$("#v-inbox").hidden)inbox(true);
 return true}

function ntGo (n) { 
   const u = n.u;
   if (n.k === "notice") {
      keep("mgr_ntc_x", "");
      drawNotice();
      hub();
      return
   }
   if (n.k === "dm" && u) {
      goDM(u);
   } else if (n.k === "fr") {
      friends();
   } else if (n.k==="res") {
      friends();
   } else if (n.k === "gift" && u) {
      openProfile(u);
   }else if (n.k === "title") {
      titles();
   } else if (n.k === "boss") {
      bossView();
   } else if (n.k === "raid" && u) {
      openRaid(u);
   } else if (n.k === "fall" && C.fall) {
      openRaid(UID);
   } else if (n.k === "dex") {
      dex();
   } else if (n.k === "portal") {
      portalView();
   } else if (n.k === "guard") {
      guardView();
   } else if (n.k === "fac") {
      facView();
   } else if (n.k ==="disaster") {
      hub();
   } else if (n.k === "wave") {
      waveView();
   } else if (n.k === "board") {
      board(n.u || null);
   } else if (n.k === "quest" || n.k === "warn" || n.k === "fall") {
      hub()
   }
}

let ntCat = "all", ntNew = new Set(), ntShown = 10;
const NT_PAGE = 10, NT_MAX = 60, NT_CAT_MAX = 30;
const ntCatOf = k => {
   const c = NT_CAT.find(x => x[2] && x[2].includes(k));
   return c ? c[0] : "etc"
};

/* 최신이 앞에 있다. 종류마다 30개, 전체를 60개만 남긴다. 잘린 알림은 저장할 때 서버 목록에서도 빠진다. */
function ntTrim(){if(!C)return false;const prev=Array.isArray(C.nt)?C.nt:[],count={},list=[];
 for(const n of prev){if(!n||typeof n!=="object")continue;const c=ntCatOf(n.k);if((count[c]||0)>=NT_CAT_MAX)continue;if(list.length>=NT_MAX)break;count[c]=(count[c]||0)+1;list.push(n)}
 if(list.length===prev.length&&list.every((n,i)=>n===prev[i]))return false;C.nt=list;return true}
const ntIn=(n,cat)=>cat==="all"||ntCatOf(n.k)===cat;
/* 서버→클라 알림 벨. 허브·알림함 진입 때 연다. 연결 거절 시 30초 폴링.
   공명 요청→applyRes, 공명 수락·거절·친구→syncFr, 공지→loadNotice, 1:1→dmHear. note 는 여기서만. */
let unNtin=null,ntinGen=0,ntinSeen={};
function ntinToast(k,t,u){const s=String(t||"").slice(0,60);try{
 if(k==="board"){toast("📝 "+s);ding()}else if(k==="res"){toast("♡ "+s);ding()}
 else if(k==="gift"){toast("🎁 "+s);ding()}else if(k==="fr"){toast("☍ "+s);ding()}
 else if(k==="dm"){const n=(String(t).match(/^(.{1,20}?)님/)||[])[1]||"상대";toast("✉ "+s,u?()=>{try{if(typeof goDM==="function")goDM(u,n)}catch(e){}}:undefined);ding()}
 else if(k==="notice"){toast("📢 "+s,()=>{try{keep("mgr_ntc_x","");if(typeof loadNotice==="function")loadNotice();else if(typeof drawNotice==="function")drawNotice()}catch(e){}});ding()}
}catch(e){}}
function ntinSide(k,id,v){const sid=String(id||"");
 if(k==="notice"){try{if(typeof loadNotice==="function")loadNotice()}catch(e){}return}
 if(k==="fr"){try{if(typeof syncFr==="function")syncFr()}catch(e){}return}
 if(k==="dmleft"){const f=v&&v.u;if(f&&typeof dmHear==="function")dmHear(f,{left:1,ts:Number(v.ts)||Date.now()});return}
 if(k!=="res")return;
 if(sid.indexOf("res:q:")===0){try{if(typeof applyRes==="function")applyRes()}catch(e){}return}
 if(sid.indexOf("res:rok:")===0||sid.indexOf("res:rno:")===0){try{if(typeof syncFr==="function")syncFr()}catch(e){}}}
function ntinApply(docs){if(!AUTH.uid||!C||!DB)return;
 (docs||[]).forEach(d=>{const id=d&&d.id;if(!id||ntinSeen[id])return;const v=typeof d.data==="function"?d.data():d;if(!v||typeof v!=="object")return;
  const k=String(v.k||""),t=String(v.t||"");if(!k||!t){ntinSeen[id]=1;DB.doc("ntin/"+UID+"/"+id).delete().catch(()=>{});return}
  ntinSeen[id]=1;
  if(k==="dmleft"){ntinSide(k,id,v);DB.doc("ntin/"+UID+"/"+id).delete().catch(()=>{});return}
  if(k==="dm"){const hear=typeof dmHear==="function"?dmHear(v.u||"",{n:(String(t).match(/^(.{1,20}?)님/)||[])[1]||"",ts:Number(v.ts)||0}):"bell";
   if(hear==="bell"){const ok=note(k,t,v.u||"",id);if(ok)ntinToast(k,t,v.u||"")}
   DB.doc("ntin/"+UID+"/"+id).delete().catch(()=>{});return}
  const ok=note(k,t,v.u||"",id);if(ok)ntinToast(k,t,v.u||"");ntinSide(k,id,v);
  DB.doc("ntin/"+UID+"/"+id).delete().catch(()=>{})})}
function ntinWatch(){if(!AUTH.uid||!C||!DB||LOCAL||unNtin)return;const gen=++ntinGen;
 const take=sn=>{if(gen!==ntinGen||!C)return;ntinApply(sn.docs||[])};
 try{once(DB.collection("ntin/"+UID)).then(take).catch(()=>{})}catch(e){}
 unNtin=DB.collection("ntin/"+UID).live().onSnapshot(take,()=>{},30000)}
function checkNtin(){if(!AUTH.uid||!C||!DB||LOCAL)return;ntinWatch()}

function inbox(keep){const fresh=$("#v-inbox").hidden;show("inbox");if(fresh&&typeof checkNtin==="function")checkNtin();if(!keep||fresh)ntShown=NT_PAGE;if(ntTrim())save();C.nt=Array.isArray(C.nt)?C.nt:[];const l=$("#ntl");l.innerHTML="";
 // 화면을 처음 열 때 안 읽은 알림을 기억해 두고(종류를 바꿔도 '새 알림' 표시가 남게), 바로 읽음으로 바꾼다.
 if(!keep)ntNew=new Set(C.nt.filter(n=>!n.r).map(n=>n.ts+"|"+n.t));
 const cb=$("#ntcat");cb.innerHTML="";NT_CAT.forEach(([k,nm])=>{const all=C.nt.filter(n=>ntIn(n,k)),nw=all.filter(n=>ntNew.has(n.ts+"|"+n.t)).length;if(k==="etc"&&!all.length)return;
  const b=elT("button","chip nt-cat",nm+(k==="all"?"":" "+all.length));b.type="button";b.setAttribute("role","tab");b.setAttribute("aria-selected",ntCat===k?"true":"false");if(nw)b.appendChild(elT("span","nav-n",String(nw)));b.onclick=()=>{ntCat=k;ntShown=NT_PAGE;inbox(true)};cb.appendChild(b)});
 if(!NT_CAT.some(c=>c[0]===ntCat)||(ntCat==="etc"&&!C.nt.some(n=>ntIn(n,"etc"))))ntCat="all";
 $("#nt-clr").textContent=ntCat==="all"?"모두 지우기":"'"+NT_CAT.find(c=>c[0]===ntCat)[1]+"' 알림 지우기";
 const list=C.nt.filter(n=>ntIn(n,ntCat)),shown=list.slice(0,ntShown);
 if(!list.length){l.innerHTML=C.nt.length?"<p class='hint'>이 종류의 알림이 없다.</p>":"<p class='hint'>아직 알림이 없다.</p>"}
 const t0=today(),y=new Date();y.setDate(y.getDate()-1);const t1=ymd(y);let last="";
 shown.forEach(n=>{const d=new Date(n.ts),day=ymd(d);if(day!==last){last=day;l.appendChild(elT("p","nt-day",day===t0?"오늘":day===t1?"어제":day.replace(/-/g,".")))}
  const b=elT("button","nt"+(ntNew.has(n.ts+"|"+n.t)?" new":""));b.type="button";const ic=NTI[n.k]||["·",""];
  b.append(elT("span","nt-ic "+ic[1],ic[0]),elT("span","nt-tx",n.t),elT("span","nt-tm",String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")));b.onclick=()=>ntGo(n);l.appendChild(b)});
 if(list.length>shown.length){const left=list.length-shown.length,more=elT("button","btn g","이전 알림 "+Math.min(NT_PAGE,left)+"개 더 보기");more.type="button";more.id="nt-more";more.style.marginTop="12px";more.onclick=()=>{ntShown+=NT_PAGE;inbox(true)};l.appendChild(more)}
 // 화면을 연 순간 모두 읽음으로 바꾼다(이번 화면에서는 새 알림 표시가 남아 있다).
 if(C.nt.some(n=>!n.r)){C.nt.forEach(n=>n.r=true);save()}updNav()}
$("#nt-clr").onclick=()=>{if(!C.nt||!C.nt.length)return;const c=NT_CAT.find(x=>x[0]===ntCat);if(ntCat==="all"){if(!confirm("알림을 모두 지울까?"))return;C.nt=[]}else{if(!C.nt.some(n=>ntIn(n,ntCat)))return;if(!confirm("'"+c[1]+"' 알림만 지울까?"))return;C.nt=C.nt.filter(n=>!ntIn(n,ntCat))}save();inbox(true)};
