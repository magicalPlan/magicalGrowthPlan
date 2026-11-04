/* 마수 포탈. main.js 다음에 불러야 한다. 집결, 출동, 치유.
   마을 화면은 hubPortal 과 pTick 을, 알림은 portalView 를 그대로 부른다.
   참가 명단은 열린 포탈만 먼저 한 번씩 읽어 그린 뒤에 연결한다. 마을·포탈 화면이 열려 있는 동안만 연결하고, 사람이 늘거나 치유가 바뀔 때만 받는다.
   치유도 출동과 같이 내 칸(portal/{포탈}/h/{나})만 쓰고, 끝난 뒤 포탈 전체를 다시 받지 않는다. 연결이 옛 내용을 가져와도 내 치유 칸은 덮지 않는다.
   시작 시각은 서버에도 남기고, 이 기기(C.ph)에도 두어 연결이 늦어도 1분 뒤 완료를 누를 수 있다.
   포탈 화면은 캐시(pData)로 먼저 그리고, 읽기·연결은 뒤에서 이어서 한다. 치유 시작의 C.ph 는 작은 칸에 바로 두고, 전체 save 는 쓰기 뒤·idle 에 미룬다.
   캐시로 그리는 동안에는 카드에 갱신 중을 붙여, 숫자가 잠깐 옛것일 수 있음을 알린다. */
const pDawn=t=>{const hr=Math.floor((t/3600000+9)%24);return hr<6};
function pInfo(h){const id="p"+h,g=rng(hs32(id)),p=n=>Math.floor(g()*n),m=p(50),v="ABCD"[p(4)],r=p(1000),T0=h*PS+m*60000,rg=pDawn(T0)?P_DAWN:P_DAY,need=rg[0]+r%(rg[1]-rg[0]+1);
 return{id,h,v,need,nm:VL[v].n+" "+PNAMES[p(PNAMES.length)],T0,G:T0+PGATHER,E:T0+PGATHER+PHEAL}}
/* 출동 기록의 시각은 서버가 적는다. 집결이 끝났는지도 그 시계(srvNow)로 본다.
   기기 시계만 쓰면, 빠른 기기는 아직 모집 중인데 버튼을 닫고, 느린 기기는 마감 뒤에 적혀 인원에 안 들어간다. */
const pNow=()=>typeof srvNow==="function"?srvNow():Date.now();
const pHour=()=>Math.floor(pNow()/PS);
// 지금 진행 중인 포탈(집결 중이거나 치유 단계)
const pCur=()=>{const h=pHour(),now=pNow();return [pInfo(h),pInfo(h-1),pInfo(h-2)].filter(x=>now>=x.T0&&now<x.E)};
const pHealer=()=>(C.a||[]).some(a=>a==="빛"||a==="물")||C.t==="치유의 손길";
const pData={};
function pState(x,d){d=d||{};const j=d.j||{},hh=d.h||{},now=pNow();
 const joined=Object.keys(j).filter(u=>j[u]&&typeof j[u]==="object"&&(typeof j[u].ts!=="number"||j[u].ts<=x.G)).sort((a,b)=>(j[a].ts||0)-(j[b].ts||0));
 const win=joined.length>=x.need,W=win?0:Math.ceil((x.need-joined.length)/x.need*P_HURT),healed=Object.values(hh).reduce((a,v)=>a+(Number(v&&v.amt)||0),0);
 return{j,hh,joined,win,gather:now<x.G,W,healed,left:Math.max(0,W-healed)}}
async function pFetch(x){try{const s=await DB.doc("portal/"+x.id).get();pData[x.id]=(s.exists&&s.data())||{};return pData[x.id]}catch(e){return null}}
// 참가한 포탈의 결과 보상(한 번만)
function pClaim(x,st){if(!C||!C.pj||!C.pj[x.id]||(C.pc&&C.pc[x.id])||pNow()<x.G)return;C.pc=keepIds(C.pc,x.id);titleState();
 if(st.win){C.gd=(C.gd||0)+50;C.stats.portalWins=(C.stats.portalWins||0)+1;gain(30,5);guardAdd(30);note("portal",x.nm+" 토벌 성공! "+st.joined.length+"명이 함께했다. 골드 50, 마을 점수 30")}
 else{C.gd=(C.gd||0)+10;gain(10,8);guardAdd(5);note("portal",x.nm+"에 정원이 모이지 않아 주민 "+st.W+"명이 다쳤다. 치유를 도와주자. (골드 10, 마을 점수 5)")}
 save();checkTitles()}
function pBtn(){const b=$("#b-portal");if(!b||!C)return;const now=pNow(),list=pCur(),g=list.find(x=>now<x.G),hl=list.find(x=>{if(!pSeen[x.id])return false;const st=pState(x,pData[x.id]);return !st.gather&&st.left>0});b.textContent=g?"마수 포탈 (열림! "+xFmt(g.G-now)+")":hl?"마수 포탈 (치유 필요)":"마수 포탈"}
function pNote(){if(!C||!XON())return;const now=pNow();pCur().forEach(x=>{if(now>=x.G||(C.pn&&C.pn[x.id]))return;C.pn=keepIds(C.pn,x.id);save();const t="☄ "+x.nm+"이(가) 열렸다! "+xHM(x.G)+"까지 "+x.need+"명이 모여야 한다.";note("portal",t);toast(t,portalView);ding()});pBtn()}
let pWatch={},pWatchKey="",pWatchGen=0,pWarm={},pSeen={},pMiss={},pAct="",pRefreshing=false,pPhHydrated=false;
const P_PH_SS="mgr_pph";
/* C.ph 만 sessionStorage 에 바로 둔다. 전체 save 보다 가볍고, 새로고침 직후에도 치유 타이머를 이어 갈 수 있다. */
function pPhWrite(){try{if(!C)return;sessionStorage.setItem(P_PH_SS,JSON.stringify(C.ph&&typeof C.ph==="object"?C.ph:{}))}catch(e){}}
function pPhEnsure(){if(pPhHydrated||!C)return;pPhHydrated=true;try{const j=JSON.parse(sessionStorage.getItem(P_PH_SS)||"{}");if(!j||typeof j!=="object")return;C.ph=C.ph||{};Object.keys(j).forEach(id=>{if(!C.ph[id]&&j[id]&&typeof j[id]==="object")C.ph[id]=j[id]})}catch(e){}}
function pWatchStop(){pWatchGen++;Object.keys(pWatch).forEach(id=>{try{pWatch[id]()}catch(e){}delete pWatch[id]});pWatchKey="";pWarm={}}
function pMine(id){pPhEnsure();const a=(pData[id]&&pData[id].h&&pData[id].h[UID])||{},b=(C&&C.ph&&C.ph[id])||{};const s=typeof a.s==="number"?a.s:(typeof b.s==="number"?b.s:null);
 return{u:a.u||UID,n:a.n||(typeof nmOf==="function"?nmOf():(C&&C.n)||""),k:Number(a.k)||Number(b.k)||0,amt:Number(a.amt)||Number(b.amt)||0,per:Number(a.per)||Number(b.per)||(pHealer()?6:3),s:s}}
function pStale(id){return!!(pWarm[id]||pRefreshing)}
function pKeepMine(id,data){if(!UID||!pData[id])return data;data=data&&typeof data==="object"?data:{};
 if(pAct===id+"/j"&&pData[id].j&&pData[id].j[UID]){data=Object.assign({},data);data.j=Object.assign({},data.j||{},{[UID]:pData[id].j[UID]})}
 const loc=pData[id].h&&pData[id].h[UID],rem=data.h&&data.h[UID];
 if(loc&&typeof loc==="object"){const keep=pAct===id+"/h"||(typeof loc.s==="number"&&(!rem||typeof rem.s!=="number")&&(Number(rem&&rem.k)||0)===(Number(loc.k)||0))||(typeof loc.s!=="number"&&rem&&(Number(rem.k)||0)<(Number(loc.k)||0));
  if(keep){data=Object.assign({},data);data.h=Object.assign({},data.h||{},{[UID]:Object.assign({},rem||{},loc)})}}
 return data}
function pApply(id,data){pSeen[id]=1;data=pKeepMine(id,data&&typeof data==="object"?data:{});
 pData[id]=data;const x=pInfo(Number(String(id).slice(1)));if(x&&x.id===id)pClaim(x,pState(x,pData[id]));if(!$("#v-portal").hidden)pRender();if(!$("#v-hub").hidden)hubPortal();pBtn()}
function pLive(id,gen){if(gen!==pWatchGen||pWatch[id]||document.hidden||!$("#v-hub")||!$("#v-portal")||($("#v-hub").hidden&&$("#v-portal").hidden))return;pWatch[id]=DB.doc("portal/"+id).live().onSnapshot(s=>{if(!pWatch[id])return;pApply(id,s.exists?s.data()||{}:{})},()=>{},POLL_HUB)}
/* 마을·포탈 화면에서만 지금 열린 포탈을 본다. 아직 못 받은 포탈은 한 번 읽어 그린 뒤에 연결한다. 읽기와 연결을 동시에 열지 않는다.
   연결이 거절되면 20초마다 묻는 방식으로 돌아간다. */
function pWatchSync(){if(!C||!XON()||!DB||document.hidden||!$("#v-hub")||!$("#v-portal")||($("#v-hub").hidden&&$("#v-portal").hidden)){pWatchStop();return Promise.resolve()}
 const xs=pCur(),ids=xs.map(x=>x.id),key=ids.join(",");
 if(key!==pWatchKey){pWatchGen++;pWatchKey=key;Object.keys(pWatch).forEach(id=>{if(ids.indexOf(id)<0){try{pWatch[id]()}catch(e){}delete pWatch[id]}});Object.keys(pWarm).forEach(id=>{if(ids.indexOf(id)<0)delete pWarm[id]})}
 if(ids.every(id=>pWatch[id]||pWarm[id]))return Promise.resolve();
 const gen=pWatchGen,jobs=[];
 xs.forEach(x=>{const id=x.id;if(pWatch[id]||pWarm[id])return;if(pSeen[id]){pLive(id,gen);return}pWarm[id]=1;jobs.push(pFetch(x).then(d=>{if(gen!==pWatchGen)return;if(d!=null)pApply(id,d);pLive(id,gen)}).finally(()=>{delete pWarm[id]}))});
 return Promise.all(jobs)}
async function pSettle(){if(!C||!XON())return;const now=pNow();
 for(const id of Object.keys(C.pj||{})){if(C.pc&&C.pc[id])continue;const x=pInfo(Number(String(id).slice(1)));if(!x||x.id!==id||now<x.G)continue;
  if(pWatch[id]){if(pSeen[id])pClaim(x,pState(x,pData[id]||{}));continue}
  if(pMiss[id])continue;pMiss[id]=1;const d=await pFetch(x);if(d==null){pMiss[id]=0;continue}pApply(id,d)}}
function pTick(){if(typeof clockSync==="function")clockSync();pNote();return Promise.resolve(pWatchSync()).then(()=>pSettle())}
setInterval(()=>{if(document.hidden){pWatchStop();return}pTick()},10000);
/* 마을 탭 요약: 진행 중인 마수 포탈과 이번 주 마을 순위를 짧게 보여 준다. 누르면 자세한 화면으로 간다. */
function hubPortal(){const box=$("#hpo");if(!box||!C)return;box.innerHTML="";if(!XON()){box.appendChild(elT("p","hint","서버에 연결되어야 마수 포탈이 열린다."));return}
 const now=pNow(),list=pCur().sort((a,b)=>a.T0-b.T0).reverse();
 if(!list.length){box.appendChild(elT("p","hint","지금 열린 포탈이 없다. 한 시간에 한 번, 예고 없이 열린다."));return}
 list.forEach(x=>{const seen=!!pSeen[x.id],st=pState(x,pData[x.id]),w=elT("div","dq"+(seen&&st.gather?" done":"")),cp=elT("div","dq-copy");let lab;
  if(!seen){cp.append(elT("b","","☄ "+x.nm),elT("small","","인원을 불러오는 중..."));lab="보기"}
  else if(st.gather){const sp=elT("small","",x.need+"명 필요 · "+st.joined.length+"명 출동 · 마감까지 ");const t=elT("b","",xFmt(x.G-now));t.style.display="inline";t.dataset.pt=x.G;sp.appendChild(t);cp.append(elT("b","","☄ "+x.nm),sp);if(pStale(x.id))cp.appendChild(elT("small","","갱신 중"));lab=st.joined.includes(UID)?"출동함":"출동"}
  else if(st.win){cp.append(elT("b","",x.nm),elT("small","","토벌 성공 · "+st.joined.length+"명이 함께했다"));if(pStale(x.id))cp.appendChild(elT("small","","갱신 중"));lab="보기"}
  else{cp.append(elT("b","",x.nm),elT("small","",st.left>0?"부상자 "+st.left+"명 남음 · 치유가 필요하다":"부상자를 모두 치유했다"));if(pStale(x.id))cp.appendChild(elT("small","","갱신 중"));lab=st.left>0?"치유":"보기"}
  const b=elT("button","chip",lab);b.type="button";b.onclick=portalView;w.append(cp,b);box.appendChild(w)})}
/* 초마다 숫자만 고치면, 집결이 끝나도 출동 버튼이 남고 치유 1분이 지나도 완료 버튼이 안 켜진다.
   단계가 바뀔 때만 버튼을 다시 그린다. 포탈이 새로 열리면 그때 연결도 연다. */
let pPhaseWas="";
function pPhase(){const now=pNow();return pCur().map(x=>{const mine=pMine(x.id);return x.id+(now<x.G?"g":"d")+(typeof mine.s==="number"&&now-mine.s>=PHEAL_WAIT?"r":"")}).join("|")}
setInterval(()=>{if(!C||document.hidden)return;const ph=pPhase(),ch=ph!==pPhaseWas;pPhaseWas=ph;if(ch){pWatchSync();pNote()}
 if(!$("#v-portal").hidden){if(ch)pRender();else pRender(true)}
 if(!$("#v-hub").hidden){if(ch)hubPortal();else{const now=pNow();document.querySelectorAll("#hpo [data-pt]").forEach(e=>e.textContent=xFmt(Number(e.dataset.pt)-now))}}
 pBtn()},1000);
/* 진입: 이미 받은 pData·C.ph 로 바로 그린 뒤, pTick(읽기·연결)은 백그라운드에서 돌린다.
   그동안 pRefreshing 으로 카드에 갱신 중을 붙여, 캐시 숫자가 잠깐 옛것일 수 있음을 알린다. */
function portalView(){show("portal");$("#pm").textContent="";pPhEnsure();pRefreshing=true;pRender();
 Promise.resolve(pTick()).then(()=>{pRefreshing=false;if(!$("#v-portal").hidden)pRender()}).catch(()=>{pRefreshing=false})}
/* 치유 등에서 전체 save() 를 누르자마자 하면 저사양에서 메인 스레드가 잠깐 멈춘다.
   시작은 pPhWrite(작은 칸)만 바로 하고, 계정 전체 save 는 쓰기 성공 뒤 idle 로 미룬다. 실패·롤백은 바로 save 한다. */
let pSaveT=null;
function pSaveCancel(){if(pSaveT==null)return;try{if(typeof cancelIdleCallback==="function")cancelIdleCallback(pSaveT)}catch(e){}try{clearTimeout(pSaveT)}catch(e){}pSaveT=null}
function pSaveSoon(){if(pSaveT!=null)return;const run=()=>{pSaveT=null;try{if(typeof save==="function")save()}catch(e){};pPhWrite()};
 if(typeof requestIdleCallback==="function")pSaveT=requestIdleCallback(run,{timeout:800});else pSaveT=setTimeout(run,0)}
function pSaveNow(){pSaveCancel();try{if(typeof save==="function")save()}catch(e){}pPhWrite()}
function pSay(t,bad){const m=$("#pm");m.style.color=bad?"var(--bad)":"var(--mu)";m.textContent=t}
function pWhy(what,e){const c=String(e&&e.message||e);if(c==="403")return what+"하지 못했다. 서버 규칙에서 portal 경로가 막혀 있다.";if(c==="401")return what+"하지 못했다. 로그인이 만료되었다. 새로고침한 뒤 다시 로그인해 보자.";if(c==="timeout"||/abort/i.test(c))return what+"하지 못했다. 서버 응답이 20초 안에 오지 않았다. 잠시 뒤에 다시 눌러 보자.";if(c==="offline"||/failed to fetch|network|offline/i.test(c))return what+"하지 못했다. 네트워크에 연결되지 않았다.";return what+"하지 못했다. ("+c.replace(/\s+/g," ").slice(0,40)+")"}
async function pJoin(x){if(pAct)return;if(AUTH.uid&&UID!==AUTH.uid)UID=AUTH.uid;if(!AUTH.uid||!XON())return pSay("서버에 로그인되어야 출동할 수 있다.",1);if(C.fall)return pSay("타락한 동안에는 포탈에 갈 수 없다.",1);if(C.dz>=90)return pSay("절망도가 너무 높아 싸울 수 없다.",1);if(pNow()>=x.G){pRender();return pSay("이미 집결 시간이 끝났다.",1)}
 const st0=pState(x,pData[x.id]);if(st0.joined.includes(UID))return pSay("이미 이 포탈에 출동해 있다.");
 let power=0;try{power=Math.round(Number(pw())||0)}catch(e){return pSay("전투력을 계산하지 못해 출동하지 못했다.",1)}
 const d=pData[x.id]=pData[x.id]||{},prev=d.j&&d.j[UID];(d.j=d.j||{})[UID]={u:UID,n:nmOf(),p:power,ts:pNow()};pAct=x.id+"/j";pRender();
 try{await DB.doc("portal/"+x.id+"/j/"+UID).set({u:UID,n:nmOf(),p:power,ts:{".sv":"timestamp"}});C.pj=keepIds(C.pj,x.id);save();pSay(x.nm+"에 출동했다. 집결이 끝나면 결과가 나온다.")}
 catch(e){if(prev)d.j[UID]=prev;else delete d.j[UID];pSay(pWhy("출동",e),1)}
 finally{if(pAct===x.id+"/j")pAct="";pRender()}}
/* 치유: 시작은 s 시각만 남기고, 완료는 치유한 인원만 올린다. 둘 다 내 칸만 쓴다. 포탈 전체를 다시 읽지 않는다(출동과 같음).
   완료 때 더하는 인원은 남은 부상자 수를 넘지 않는다.
   시작: C.ph 는 pPhWrite 로 바로 두고, 전체 save 는 서버 성공 뒤 pSaveSoon. 실패 롤백은 pSaveNow. */
async function pHeal(x,fin){if(pAct)return;if(AUTH.uid&&UID!==AUTH.uid)UID=AUTH.uid;if(!AUTH.uid||!XON())return pSay("서버에 로그인되어야 치유할 수 있다.",1);
 const d=pData[x.id]=pData[x.id]||{},mine=pMine(x.id),k=mine.k,amt=mine.amt,per=mine.per,st=pState(x,d),now=pNow();
 if(now>=x.E)return pSay("치유할 수 있는 시간이 끝났다.",1);if(st.left<=0)return pSay("다친 주민이 모두 치유되었다.");if(k>=PHEAL_MAX)return pSay("이 포탈에서는 이미 3번 치유했다.",1);
 if(fin&&(typeof mine.s!=="number"||now-mine.s<PHEAL_WAIT))return pSay("아직 치유 중이다. 남은 시간이 끝난 뒤에 완료를 누르자.",1);
 const prev=(d.h&&d.h[UID])||null,prevPh=C&&C.ph&&C.ph[x.id]?Object.assign({},C.ph[x.id]):null;pAct=x.id+"/h";pRender();
 try{if(!fin){const row={u:UID,n:nmOf(),k,amt,per,s:now};(d.h=d.h||{})[UID]=row;C.ph=C.ph||{};C.ph[x.id]={k,amt,per,s:now};Object.keys(C.ph).slice(0,-4).forEach(k=>delete C.ph[k]);pPhWrite();
  await DB.doc("portal/"+x.id+"/h/"+UID).set({u:UID,n:nmOf(),k,amt,per,s:{".sv":"timestamp"}});pSaveSoon();pSay("치유를 시작했다. 1분 뒤에 '치유 완료'를 누르자.")}
  else{const add=Math.min(per,st.left),row={u:UID,n:nmOf(),k:k+1,amt:amt+add,per};(d.h=d.h||{})[UID]=row;if(C.ph)delete C.ph[x.id];pPhWrite();
   await DB.doc("portal/"+x.id+"/h/"+UID).set(row);C.gd=(C.gd||0)+15;titleState();C.stats.heals=(C.stats.heals||0)+1;gain(5,-3);guardAdd(10);checkTitles();pSaveSoon();pSay("주민 "+add+"명을 치유했다. 골드 15, 마을 점수 10. 마음이 조금 가벼워졌다.")}}
 catch(e){if(prev)(d.h=d.h||{})[UID]=prev;else if(d.h)delete d.h[UID];if(C){C.ph=C.ph||{};if(prevPh)C.ph[x.id]=prevPh;else delete C.ph[x.id]}pSaveNow();pSay(pWhy("치유",e),1)}
 finally{if(pAct===x.id+"/h")pAct="";pRender()}}
function pRender(timeOnly){const box=$("#pl3");if(!box||!C)return;const now=pNow(),list=pCur().sort((a,b)=>b.T0-a.T0);
 if(timeOnly){box.querySelectorAll("[data-pt]").forEach(e=>{const t=Number(e.dataset.pt);e.textContent=xFmt(t-now)});return}
 box.innerHTML="";if(!XON()){box.appendChild(elT("p","hint","서버에 연결되어야 마수 포탈에 갈 수 있다."));return}
 if(!list.length){box.appendChild(elT("p","hint","지금 열린 마수 포탈이 없다. 포탈은 예고 없이, 한 시간에 한 번 어딘가에 열린다. 열리면 화면 위에 알림이 뜬다."));return}
 list.forEach(x=>{const d=pData[x.id]||{},seen=!!pSeen[x.id],st=pState(x,d),c=elT("div","card boss-card w");c.style.marginBottom="12px";
  const cd=(lab,t)=>{const p=elT("p","hint",lab+" ");const s=elT("b","",xFmt(t-now));s.dataset.pt=t;p.appendChild(s);return p};
  c.append(elT("p","boss-tag",VL[x.v].n+"에 열린 포탈"),elT("h2","",x.nm));
  if(!seen){c.appendChild(elT("p","hint","인원을 불러오는 중..."));box.appendChild(c);return}
  if(pStale(x.id))c.appendChild(elT("p","hint","갱신 중 · 방금 본 내용일 수 있다"));
  if(st.gather){c.append(elT("p","","필요 인원 "+x.need+"명 · 모인 인원 "+st.joined.length+"명"),cd("집결 마감까지",x.G));
   const bar=elT("div","bar"),f=elT("i");f.style.width=Math.min(100,st.joined.length/x.need*100)+"%";bar.appendChild(f);c.appendChild(bar);
   if(st.joined.length)c.appendChild(elT("p","boss-info","출동: "+st.joined.map(u=>cn(u,st.j[u].n)).join(", ")));
   const inI=st.joined.includes(UID),busy=pAct===x.id+"/j",b=elT("button","btn",busy?"출동하는 중...":inI?"출동했다":C.fall?"타락 중에는 출동할 수 없다":C.dz>=90?"절망도가 너무 높아 출동할 수 없다":"포탈로 출동한다");b.type="button";b.disabled=busy||inI||!!C.fall||C.dz>=90;b.onclick=()=>pJoin(x);c.appendChild(b);
   c.appendChild(elT("p","boss-info","성공하면 골드 50과 마을 점수 30. 정원이 모자라면 모자란 비율만큼 주민이 다친다(최대 30명)."))}
  else if(st.win){c.append(elT("p","boss-dead","토벌 성공!"),elT("p","hint",st.joined.length+"명이 함께 포탈을 닫았다: "+st.joined.map(u=>cn(u,st.j[u].n)).join(", ")))}
  else{c.append(elT("p","fallbar","정원이 모이지 않아 마수가 쏟아졌다. 주민 "+st.W+"명이 다쳤다."),elT("p","","치유됨 "+Math.min(st.healed,st.W)+" / "+st.W+" · 남은 부상자 "+st.left+"명"));
   const bar=elT("div","bar"),f=elT("i");f.style.width=(st.W?Math.min(100,st.healed/st.W*100):100)+"%";f.style.background="linear-gradient(90deg,#2e6b5a,#6fd1a8)";bar.appendChild(f);c.appendChild(bar);
   if(st.left>0){c.appendChild(cd("치유 마감까지",x.E));const mine=pMine(x.id),k=mine.k,per=mine.per,pending=typeof mine.s==="number";
    const ready=pending&&now-mine.s>=PHEAL_WAIT,busy=pAct===x.id+"/h",b=elT("button","btn",busy?"기록하는 중...":k>=PHEAL_MAX?"이번 포탈에서는 3번 모두 치유했다":pending?(ready?"치유 완료 (+"+Math.min(per,st.left)+"명)":"치유하는 중..."):"치유 시작 (한 번에 "+per+"명)");b.type="button";
    b.disabled=busy||k>=PHEAL_MAX||(pending&&!ready);b.onclick=()=>pHeal(x,pending);c.appendChild(b);
    if(pending&&!ready)c.appendChild(cd("치유 완료까지",mine.s+PHEAL_WAIT));
    c.appendChild(elT("p","boss-info","내 치유 "+k+" / "+PHEAL_MAX+"번 · 치유할 때마다 골드 15, 마을 점수 10, 절망도 -3"+(pHealer()?" · 치유계라서 한 번에 6명을 치유한다.":" · 빛·물 속성이나 '치유의 손길' 특성이면 한 번에 6명을 치유한다.")))}
   else c.appendChild(elT("p","boss-dead","다친 주민이 모두 치유되었다."));
   const hs=Object.keys(st.hh).filter(u=>Number(st.hh[u].amt)>0);if(hs.length)c.appendChild(elT("p","boss-info","치유한 사람: "+hs.map(u=>cn(u,st.hh[u].n)+" "+st.hh[u].amt+"명").join(", ")))}
  box.appendChild(c)})}
$("#pb").onclick=()=>hub();
