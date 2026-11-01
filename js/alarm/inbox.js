/* 알림함. main.js 다음에 불러야 한다. 알림을 쌓고, 종류별로 보고, 누르면 관련 화면으로 간다.
   한 번에 10개만 보여주고, 더 보기로 이전 10개를 이어서 본다.
   출정·마을·친구·공지는 note 를, 하단 메뉴는 inbox 를 그대로 부른다. */
function note(k,t,u){if(!C)return;C.nt=Array.isArray(C.nt)?C.nt:[];C.nt.unshift({k,t:String(t).slice(0,160),u:u||"",ts:Date.now(),r:false});if(C.nt.length>80)C.nt.length=80;save();if(!$("#v-inbox").hidden)inbox(true)}
function ntGo(n){const u=n.u;if(n.k==="notice"){keep("mgr_ntc_x","");drawNotice();hub();return}if(n.k==="dm"&&u)goDM(u);else if(n.k==="fr")friends();else if(n.k==="res")friends();else if(n.k==="gift"&&u)openProfile(u);else if(n.k==="title")titles();else if(n.k==="boss")bossView();
 else if(n.k==="raid"&&u)openRaid(u);else if(n.k==="fall"&&C.fall)openRaid(UID);else if(n.k==="dex")dex();else if(n.k==="portal")portalView();else if(n.k==="guard")guardView();else if(n.k==="fac")facView();else if(n.k==="disaster")hub();else if(n.k==="wave")waveView();else if(n.k==="board")board(n.u||null);else if(n.k==="quest"||n.k==="warn"||n.k==="fall")hub()}
let ntCat="all",ntNew=new Set(),ntShown=10;
const NT_PAGE=10;
const ntCatOf=k=>{const c=NT_CAT.find(x=>x[2]&&x[2].includes(k));return c?c[0]:"etc"};
const ntIn=(n,cat)=>cat==="all"||ntCatOf(n.k)===cat;
function inbox(keep){const fresh=$("#v-inbox").hidden;show("inbox");if(fresh&&typeof checkDM==="function")checkDM();if(!keep||fresh)ntShown=NT_PAGE;C.nt=Array.isArray(C.nt)?C.nt:[];const l=$("#ntl");l.innerHTML="";
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
