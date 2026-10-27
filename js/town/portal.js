/* 마수 포탈. main.js 다음에 불러야 한다. 집결, 출동, 치유.
   마을 화면은 hubPortal 과 pTick 을, 알림은 portalView 를 그대로 부른다.
   참가 명단은 마을·포탈 화면이 열려 있는 동안만 연결하고, 사람이 늘거나 치유가 바뀔 때만 받는다. */
const pDawn=t=>{const hr=Math.floor((t/3600000+9)%24);return hr<6};
function pInfo(h){const id="p"+h,g=rng(hs32(id)),p=n=>Math.floor(g()*n),m=p(50),v="ABCD"[p(4)],r=p(1000),T0=h*PS+m*60000,rg=pDawn(T0)?P_DAWN:P_DAY,need=rg[0]+r%(rg[1]-rg[0]+1);
 return{id,h,v,need,nm:VL[v].n+" "+PNAMES[p(PNAMES.length)],T0,G:T0+PGATHER,E:T0+PGATHER+PHEAL}}
const pHour=()=>Math.floor(Date.now()/PS);
// 지금 진행 중인 포탈(집결 중이거나 치유 단계)
const pCur=()=>{const h=pHour(),now=Date.now();return [pInfo(h),pInfo(h-1),pInfo(h-2)].filter(x=>now>=x.T0&&now<x.E)};
const pHealer=()=>(C.a||[]).some(a=>a==="빛"||a==="물")||C.t==="치유의 손길";
const pData={};
function pState(x,d){d=d||{};const j=d.j||{},hh=d.h||{},now=Date.now();
 const joined=Object.keys(j).filter(u=>j[u]&&typeof j[u]==="object"&&(typeof j[u].ts!=="number"||j[u].ts<=x.G)).sort((a,b)=>(j[a].ts||0)-(j[b].ts||0));
 const win=joined.length>=x.need,W=win?0:Math.ceil((x.need-joined.length)/x.need*P_HURT),healed=Object.values(hh).reduce((a,v)=>a+(Number(v&&v.amt)||0),0);
 return{j,hh,joined,win,gather:now<x.G,W,healed,left:Math.max(0,W-healed)}}
async function pFetch(x){try{const s=await DB.doc("portal/"+x.id).get();pData[x.id]=(s.exists&&s.data())||{};return pData[x.id]}catch(e){return null}}
// 참가한 포탈의 결과 보상(한 번만)
function pClaim(x,st){if(!C||!C.pj||!C.pj[x.id]||(C.pc&&C.pc[x.id])||Date.now()<x.G)return;C.pc=keepIds(C.pc,x.id);titleState();
 if(st.win){C.gd=(C.gd||0)+50;C.stats.portalWins=(C.stats.portalWins||0)+1;gain(30,5);guardAdd(30);note("portal",x.nm+" 토벌 성공! "+st.joined.length+"명이 함께했다. 골드 50, 마을 점수 30")}
 else{C.gd=(C.gd||0)+10;gain(10,8);guardAdd(5);note("portal",x.nm+"에 정원이 모이지 않아 주민 "+st.W+"명이 다쳤다. 치유를 도와주자. (골드 10, 마을 점수 5)")}
 save();checkTitles()}
function pBtn(){const b=$("#b-portal");if(!b||!C)return;const now=Date.now(),list=pCur(),g=list.find(x=>now<x.G),hl=list.find(x=>{const st=pState(x,pData[x.id]);return !st.gather&&st.left>0});b.textContent=g?"마수 포탈 (열림! "+xFmt(g.G-now)+")":hl?"마수 포탈 (치유 필요)":"마수 포탈"}
function pNote(){if(!C||!XON())return;const now=Date.now();pCur().forEach(x=>{if(now>=x.G||(C.pn&&C.pn[x.id]))return;C.pn=keepIds(C.pn,x.id);save();const t="☄ "+x.nm+"이(가) 열렸다! "+xHM(x.G)+"까지 "+x.need+"명이 모여야 한다.";note("portal",t);toast(t,portalView);ding()});pBtn()}
let pWatch={},pWatchKey="",pSeen={},pMiss={};
function pWatchStop(){Object.keys(pWatch).forEach(id=>{try{pWatch[id]()}catch(e){}delete pWatch[id]});pWatchKey=""}
function pApply(id,data){pSeen[id]=1;pData[id]=data&&typeof data==="object"?data:{};const x=pInfo(Number(String(id).slice(1)));if(x&&x.id===id)pClaim(x,pState(x,pData[id]));if(!$("#v-portal").hidden)pRender();if(!$("#v-hub").hidden)hubPortal();pBtn()}
/* 마을·포탈 화면에서만 지금 열린 포탈에 연결한다. 연결이 거절되면 20초마다 묻는 방식으로 돌아간다. */
function pWatchSync(){if(!C||!XON()||!DB||document.hidden||($("#v-hub").hidden&&$("#v-portal").hidden)){pWatchStop();return}
 const ids=pCur().map(x=>x.id),key=ids.join(",");if(key===pWatchKey&&ids.every(id=>pWatch[id]))return;pWatchStop();pWatchKey=key;
 ids.forEach(id=>{pWatch[id]=DB.doc("portal/"+id).live().onSnapshot(s=>{if(!pWatch[id])return;pApply(id,s.exists?s.data()||{}:{})},()=>{},POLL_HUB)})}
async function pSettle(){if(!C||!XON())return;const now=Date.now();
 for(const id of Object.keys(C.pj||{})){if(C.pc&&C.pc[id])continue;const x=pInfo(Number(String(id).slice(1)));if(!x||x.id!==id||now<x.G)continue;
  if(pWatch[id]){if(pSeen[id])pClaim(x,pState(x,pData[id]||{}));continue}
  if(pMiss[id])continue;pMiss[id]=1;const d=await pFetch(x);if(d==null){pMiss[id]=0;continue}pApply(id,d)}}
function pTick(){pNote();pWatchSync();return pSettle()}
setInterval(()=>{if(document.hidden){pWatchStop();return}pTick()},10000);
/* 마을 탭 요약: 진행 중인 마수 포탈과 이번 주 마을 순위를 짧게 보여 준다. 누르면 자세한 화면으로 간다. */
function hubPortal(){const box=$("#hpo");if(!box||!C)return;box.innerHTML="";if(!XON()){box.appendChild(elT("p","hint","서버에 연결되어야 마수 포탈이 열린다."));return}
 const now=Date.now(),list=pCur().sort((a,b)=>a.T0-b.T0).reverse();
 if(!list.length){box.appendChild(elT("p","hint","지금 열린 포탈이 없다. 한 시간에 한 번, 예고 없이 열린다."));return}
 list.forEach(x=>{const st=pState(x,pData[x.id]),w=elT("div","dq"+(st.gather?" done":"")),cp=elT("div","dq-copy");let sub,lab;
  if(st.gather){const sp=elT("small","",x.need+"명 필요 · "+st.joined.length+"명 출동 · 마감까지 ");const t=elT("b","",xFmt(x.G-now));t.style.display="inline";t.dataset.pt=x.G;sp.appendChild(t);cp.append(elT("b","","☄ "+x.nm),sp);lab=st.j[UID]?"출동함":"출동"}
  else if(st.win){cp.append(elT("b","",x.nm),elT("small","","토벌 성공 · "+st.joined.length+"명이 함께했다"));lab="보기"}
  else{cp.append(elT("b","",x.nm),elT("small","",st.left>0?"부상자 "+st.left+"명 남음 · 치유가 필요하다":"부상자를 모두 치유했다"));lab=st.left>0?"치유":"보기"}
  const b=elT("button","chip",lab);b.type="button";b.onclick=portalView;w.append(cp,b);box.appendChild(w)})}
setInterval(()=>{if(!C||document.hidden)return;if(!$("#v-portal").hidden)pRender(true);if(!$("#v-hub").hidden){const now=Date.now();document.querySelectorAll("#hpo [data-pt]").forEach(e=>e.textContent=xFmt(Number(e.dataset.pt)-now))}pBtn()},1000);
function portalView(){show("portal");$("#pm").textContent="";pTick().then(()=>pRender())}
function pSay(t,bad){const m=$("#pm");m.style.color=bad?"var(--bad)":"var(--mu)";m.textContent=t}
async function pJoin(x){if(C.fall)return pSay("타락한 동안에는 포탈에 갈 수 없다.",1);if(C.dz>=90)return pSay("절망도가 너무 높아 싸울 수 없다.",1);if(Date.now()>=x.G)return pSay("이미 집결 시간이 끝났다.",1);
 try{await DB.doc("portal/"+x.id+"/j/"+UID).set({u:UID,n:nmOf(),p:pw(),ts:{".sv":"timestamp"}});C.pj=keepIds(C.pj,x.id);save();const d=pData[x.id]=pData[x.id]||{};(d.j=d.j||{})[UID]={u:UID,n:nmOf(),p:pw(),ts:Date.now()};pSay(x.nm+"에 출동했다. 집결이 끝나면 결과가 나온다.");pRender()}
 catch(e){pSay("출동하지 못했다. 이미 출동했거나 서버 규칙에서 portal 경로가 막혀 있다.",1)}}
async function pHeal(x,fin){const d=pData[x.id]||{},mine=(d.h||{})[UID]||{},k=Number(mine.k)||0,amt=Number(mine.amt)||0,per=Number(mine.per)||(pHealer()?6:3),st=pState(x,d);
 if(Date.now()>=x.E)return pSay("치유할 수 있는 시간이 끝났다.",1);if(st.left<=0)return pSay("다친 주민이 모두 치유되었다.");if(k>=PHEAL_MAX)return pSay("이 포탈에서는 이미 3번 치유했다.",1);
 try{if(!fin){await DB.doc("portal/"+x.id+"/h/"+UID).set({u:UID,n:nmOf(),k,amt,per,s:{".sv":"timestamp"}});pSay("치유를 시작했다. 1분 뒤에 '치유 완료'를 누르자.")}
  else{if(typeof mine.s!=="number"||Date.now()-mine.s<PHEAL_WAIT)return;const add=Math.min(per,st.left);await DB.doc("portal/"+x.id+"/h/"+UID).set({u:UID,n:nmOf(),k:k+1,amt:amt+per,per});
   C.gd=(C.gd||0)+15;titleState();C.stats.heals=(C.stats.heals||0)+1;gain(5,-3);guardAdd(10);save();checkTitles();pSay("주민 "+add+"명을 치유했다. 골드 15, 마을 점수 10. 마음이 조금 가벼워졌다.")}
  await pFetch(x);pRender()}
 catch(e){pSay("치유하지 못했다. 서버 규칙에서 portal 경로가 막혀 있다.",1)}}
function pRender(timeOnly){const box=$("#pl3");if(!box||!C)return;const now=Date.now(),list=pCur().sort((a,b)=>b.T0-a.T0);
 if(timeOnly){box.querySelectorAll("[data-pt]").forEach(e=>{const t=Number(e.dataset.pt);e.textContent=xFmt(t-now)});return}
 box.innerHTML="";if(!XON()){box.appendChild(elT("p","hint","서버에 연결되어야 마수 포탈에 갈 수 있다."));return}
 if(!list.length){box.appendChild(elT("p","hint","지금 열린 마수 포탈이 없다. 포탈은 예고 없이, 한 시간에 한 번 어딘가에 열린다. 열리면 화면 위에 알림이 뜬다."));return}
 list.forEach(x=>{const d=pData[x.id]||{},st=pState(x,d),c=elT("div","card boss-card w");c.style.marginBottom="12px";
  const cd=(lab,t)=>{const p=elT("p","hint",lab+" ");const s=elT("b","",xFmt(t-now));s.dataset.pt=t;p.appendChild(s);return p};
  c.append(elT("p","boss-tag",VL[x.v].n+"에 열린 포탈"),elT("h2","",x.nm));
  if(st.gather){c.append(elT("p","","필요 인원 "+x.need+"명 · 모인 인원 "+st.joined.length+"명"),cd("집결 마감까지",x.G));
   const bar=elT("div","bar"),f=elT("i");f.style.width=Math.min(100,st.joined.length/x.need*100)+"%";bar.appendChild(f);c.appendChild(bar);
   if(st.joined.length)c.appendChild(elT("p","boss-info","출동: "+st.joined.map(u=>cn(u,st.j[u].n)).join(", ")));
   const inI=!!st.j[UID],b=elT("button","btn",inI?"출동했다":"포탈로 출동한다");b.type="button";b.disabled=inI||!!C.fall||C.dz>=90;b.onclick=()=>pJoin(x);c.appendChild(b);
   c.appendChild(elT("p","boss-info","성공하면 골드 50과 마을 점수 30. 정원이 모자라면 모자란 비율만큼 주민이 다친다(최대 30명)."))}
  else if(st.win){c.append(elT("p","boss-dead","토벌 성공!"),elT("p","hint",st.joined.length+"명이 함께 포탈을 닫았다: "+st.joined.map(u=>cn(u,st.j[u].n)).join(", ")))}
  else{c.append(elT("p","fallbar","정원이 모이지 않아 마수가 쏟아졌다. 주민 "+st.W+"명이 다쳤다."),elT("p","","치유됨 "+Math.min(st.healed,st.W)+" / "+st.W+" · 남은 부상자 "+st.left+"명"));
   const bar=elT("div","bar"),f=elT("i");f.style.width=(st.W?Math.min(100,st.healed/st.W*100):100)+"%";f.style.background="linear-gradient(90deg,#2e6b5a,#6fd1a8)";bar.appendChild(f);c.appendChild(bar);
   if(st.left>0){c.appendChild(cd("치유 마감까지",x.E));const mine=st.hh[UID]||{},k=Number(mine.k)||0,per=Number(mine.per)||(pHealer()?6:3),pending=typeof mine.s==="number";
    const ready=pending&&now-mine.s>=PHEAL_WAIT,b=elT("button","btn",k>=PHEAL_MAX?"이번 포탈에서는 3번 모두 치유했다":pending?(ready?"치유 완료 (+"+per+"명)":"치유하는 중..."):"치유 시작 (한 번에 "+per+"명)");b.type="button";
    b.disabled=k>=PHEAL_MAX||(pending&&!ready);b.onclick=()=>pHeal(x,pending);c.appendChild(b);
    if(pending&&!ready)c.appendChild(cd("치유 완료까지",mine.s+PHEAL_WAIT));
    c.appendChild(elT("p","boss-info","내 치유 "+k+" / "+PHEAL_MAX+"번 · 치유할 때마다 골드 15, 마을 점수 10, 절망도 -3"+(pHealer()?" · 치유계라서 한 번에 6명을 치유한다.":" · 빛·물 속성이나 '치유의 손길' 특성이면 한 번에 6명을 치유한다.")))}
   else c.appendChild(elT("p","boss-dead","다친 주민이 모두 치유되었다."));
   const hs=Object.keys(st.hh).filter(u=>Number(st.hh[u].amt)>0);if(hs.length)c.appendChild(elT("p","boss-info","치유한 사람: "+hs.map(u=>cn(u,st.hh[u].n)+" "+st.hh[u].amt+"명").join(", ")))}
  box.appendChild(c)})}
$("#pb").onclick=()=>hub();
