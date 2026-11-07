/* 정기 출정. main.js 다음에 불러야 한다. 5분마다 열리는 출정, 참가, 자동 출발, 선택, 결과.
   목록은 매지컬 마치 화면(v-rooms)에서만 본다. 목록 칸이 펼쳐져 보일 때만 참가 자리(rooms/xm)를 연결로 지킨다.
   화면·구독 모두 정렬(기본=인덱스 / 높은 등급 / 낮은 등급) 앞쪽 xShowN(기본 5)칸만.
   구독은 자리 doc live 여러 개(보이는 칸 + 내가 참가한 칸). 묶음 prefix 전체 live 는 쓰지 않는다.
   접히거나 화면을 벗어나면 끊는다. 마을에는 목록을 두지 않는다. 끝난 방은 서버 함수가 지운다. */
const isAbyss = (s,i) => i === ( (s % XN) + XN) % XN || (s % 2 === 0 && i === ( (s + 5) % XN + XN) % XN);

// 정기 출정 기록 위치: 서버 규칙에 이미 열려 있는 rooms 아래에 둔다
// 자리: rooms/xm{묶음}_e{번호}/{나}(이름·전투 정보 포함), 투표: rooms/xv{출정}_c{번호}/{나}.
// 예전 이름 목록(xn)과 자리 ts 는 쓰지 않는다. 서버 만료 함수만 남은 xn 을 지운다.
const xSeat = (s, i) => "rooms/xm" + s + "_e" + i, xVote = (id, c) => "rooms/xv" + id + "_c" + c;

/* 출정 시각·마감·연출·drop 은 서버 보정 시각(srvNow)을 쓴다. 시계 동기 전에는 Date.now 로 둔다.
   목록·틱·참가 전에 clockSync 를 불러 SKEW 를 채워 둔다(포탈 pTick 과 같음). */
// 서버 시간 보정 함수 1. 게임에서 쓰는 지금 시간. (srvNow는 서버 보정 시간, 없으면 Date.now)
const xNow = () => typeof srvNow === "function" ? srvNow() : Date.now();
// 서버 시간 보정 함수 2. 참가 마감 뒤 유예 시간. 클라이언트에서 마감 된 후라도 5초 정도 더
const xGrace = () => typeof X_JOIN_GRACE === "number" ? X_JOIN_GRACE : 5000;
// 서버 시간 보정 함수 3. 그 출정의 실질 참가 인정 마감 (x.close + xGrace(). 화면 마감은 2분 전, 하지만 2분 5초 정도 더 받음을 알림)
const xCloseAt = x => Number(x.close) + xGrace();
// 서버 시간 보정 함수 4. 가능하다면 clockSync()를 바로 호춣해 기기/서버 시각 차이를 맞춤. 왜 쓰는 거지?
const xClock = () => { 
   if (typeof clockSync === "function") clockSync()
   };
// 서버 시간 보정 함수 5. apiClockSync가 있으면 동기화 Promise를 돌려줌. force면 강제.  없으면 즉시 resolve. 참가 시 백그라운드에서 맞춤.
// 백그라운드에서도 잘 돌아가는지 확인 필요. 
const xClockWait = force => typeof apiClockSync === "function" ? apiClockSync(!!force) : Promise.resolve();

// 출정의 고정 정보를 계산. (저장 없이 id 시드로 결정..? 이걸 왜 서버에서 처리하지 않죠?)
/*
   id :: x{s}_{i}  / v :: 마을 / d :: 위험도(심연은 4) / nm :: 이름 / total :: 전투 횟수 / T0 :: 출발 시각 (s+1)*XS / close :: 화면 참가 마감 T0 - XCLOSE
   같은 (s, i)면 모든 플레이어에게 같은 출정이 보임
   이 함수가 왜 서버 사이드에서가 아니라 클라이언트에서 돌지
*/
function xInfo (s, i) {
   const id = "x" + s + "_" + i, g = rng(hs32(id)), p = n => Math.floor(g() * n), v = "ABCD"[p(4)], ab = isAbyss(s, i), d = ab ? 4 : 1 + p(3);
   const pl = XPL[p(XPL.length)], t = 3 + p(3);
   return{id, s, i, v, d, nm : ab ? ABYSS_PL[((s + (i === ((s % XN) + XN) % XN ? 0 : 2)) % ABYSS_PL.length + ABYSS_PL.length) % ABYSS_PL.length] : VL[v].n + " " + pl, total : ab ? 5 : t, T0 : (s + 1) * XS, close : (s+1) * XS - XCLOSE
   }
}
const xSlot = () => Math.floor(xNow() /XS);
// 지금 참가할 수 있는 출정 묶음(마감이 지나면 다음 묶음). 유예는 서버 집계·미반영 쓰기용.
const xLs = () => {
   const s = xSlot();
   return xNow() >= (s + 1) * XS-XCLOSE ? s+1 : s};
const jtOf = v => typeof(v && v.jt) === "number" ? v.jt : 0;
const xParty = (x, m) => Object.keys(m || {}).filter(u => m[u] && typeof m[u] === "object" && jtOf(m[u]) <= xCloseAt(x)).sort((a, b) => jtOf(m[a]) - jtOf(m[b]) || (a< b ? -1 : 1)).slice(0, XMAX);
const xFmt = ms => {
   const t = Math.max(0, Math.ceil(ms / 1000));
   return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0")
};
const xHM = d => {
   const t = new Date(d);
   return String(t.getHours()).padStart(2, "0") + ":" + String(t.getMinutes()).padStart(2, "0")
};
const xCdTxt = () => {
   const x = xInfo(xLs(), 0);
   return "다음 출발 " + xHM(x.T0) + " · 참가 마감까지 " + xFmt(x.close-xNow())
};
let xSnap = {}, xS = -1, unX = null, xPoll = null, xPolls = null, XR = null, xAuto = "", xPh = "", xChK = "", xMyV = null, xJob = 0, xGone = null, xPend = null, xMine = null, xShowN = 5, xSort = "def", xWatchKey = "";

/* 목록 칸(#xbox)이 펼쳐져 보일 때만 참가 자리 xm 을 연결로 지킨다.
   보이는 자리(정렬 앞 xShowN)와 내 참가 자리만 doc live. live 거절 시 그 칸만 POLL_FAST.
   접히거나 매지컬 마치를 벗어나면 끊는다. 참가·취소는 서버 응답을 기다리지 않고 화면부터 고친다.
   xGone 은 방금 빠진 자리다. 서버 목록이 아직 나를 안고 있어도 화면에서는 뺀다. */
const X_PAGE = 5;

function xOverlay (x, raw) {
   const m = Object.assign({}, raw || {});
   if (xGone && xGone.s === x.s && xGone.i === x.i && !(C && C.mj && C.mj.id === x.id) )delete m[UID];
   if (C && C.mj && C.mj.id === x.id && (!m[UID] || typeof m[UID] !== "object")) m[UID] = Object.assign({}, me(), {jt : Math.min(xNow(), xCloseAt(x))});
   return m
}

function xListOpen () {
   const box = $("#xbox");
   return !!(!$("#v-rooms").hidden && box && !box.hidden)
}

function xWatchOn () {
   if (!XON()) return false;
   if (xListOpen()) return true;
   if ($("#v-xm").hidden || !(C && C.mj)) return false;
   return !(XR && XR.id === C.mj.id && XR.pl)
}

function xWatchSlot () {
   return !$("#v-xm").hidden && C && C.mj && !(XR && XR.id === C.mj.id && XR.pl) ? C.mj.s : xLs()
}

/* 자리 live 구독 전부 끊기. xPolls 에 해제 함수가 들어 있다. */
function stopX(){
 if(xPolls){xPolls.forEach(u=>{try{u()}catch(e){}});xPolls=null}
 if(xPoll){try{xPoll()}catch(e){}xPoll=null}
 unX=null;xWatchKey=""}
/* 지금 화면에 그릴·구독할 자리 번호. xOrdered(기본·높은·낮은) 앞 xShowN개 + 같은 묶음에 내가 참가한 칸. */
function xVisibleIdx(ls){
 const n=Math.min(XN,Math.max(X_PAGE,xShowN)),seen={},out=[];
 xOrdered(ls).slice(0,n).forEach(i=>{if(seen[i])return;seen[i]=1;out.push(i)});
 if(C&&C.mj&&Number(C.mj.s)===Number(ls)){const i=Number(C.mj.i);if(Number.isFinite(i)&&i>=0&&i<XN&&!seen[i])out.push(i)}
 return out}

function xOrdered (ls) {
   const a = Array.from({ length : XN}, ( _ , i) => i );
   if (xSort === "hi") a.sort((i, j) => {
      const di = xInfo(ls, i).d,dj = xInfo(ls, j).d;
      return dj - di || i - j
   });
   else if (xSort === "lo") a.sort( (i, j) => {
      const di = xInfo(ls, i).d,dj = xInfo(ls, j).d;
      return di - dj || i - j});
   return a
}

function xSetSort(k){if(k!=="def"&&k!=="hi"&&k!=="lo")return;if(xSort===k)return;xSort=k;xShowN=X_PAGE;try{localStorage.setItem("mgr_xsort",k)}catch(e){}if(xListOpen())watchX();drawXAll()}
function xMore(){if(xShowN>=XN)return;xShowN=Math.min(XN,xShowN+X_PAGE);if(xListOpen())watchX();drawXAll()}
/* 매지컬 마치 목록 칸 열고 닫기. 이 기기에서 마지막 상태를 기억한다. 펼칠 때만 참가 자리를 지킨다. */
function xFold(open){const b=$("#xtog"),box=$("#xbox");if(!b||!box)return;if(open)xClock();box.hidden=!open;b.textContent=open?"접기 ▲":"펼치기 ▼";b.setAttribute("aria-expanded",open?"true":"false");try{localStorage.setItem("mgr_xopen",open?"1":"0")}catch(e){}
 if(open){xShowN=X_PAGE;xWatchKey="";if(!$("#v-rooms").hidden)watchX();drawXAll()}else{stopX();xS=-1}}
/* 한 번 읽기(재참가 등)용. 구독 경로가 아닌 grab 결과를 xSnap 에 반영한다. */
function xTake(s,docs){const o={};(docs||[]).forEach(d=>{const m=String(d.id).match(/_e(\d+)$/);if(m)o["e"+m[1]]=d.data()||{}});
 if(xGone){const seat=o["e"+xGone.i];if(!seat||!seat[UID]||Date.now()>xGone.till)xGone=null}
 if(!unX||xS===s){xS=s;xSnap={};Object.keys(o).forEach(k=>xSnap[k]=o[k])}xBindFrom(s,xSnap);
 const k=s+"|"+JSON.stringify(xSnap);if(xTake.k===k)return;xTake.k=k;drawXAll();if(!$("#v-xm").hidden)xRender()}
/* 자리 live 한 칸이 바뀌면 xSnap 만 고치고 목록을 다시 그린다(다른 칸은 유지). */
function xSnapPaint(s){
 if(xGone){const seat=xSnap["e"+xGone.i];if(!seat||!seat[UID]||Date.now()>xGone.till)xGone=null}
 xBindFrom(s,xSnap);const k=s+"|"+JSON.stringify(xSnap);if(xTake.k===k)return;xTake.k=k;drawXAll();if(!$("#v-xm").hidden)xRender()}
async function xGrab(s){try{return await DB.collection("rooms").prefix("xm"+s+"_").grab()}catch(e){const docs=[];
 await Promise.all(Array.from({length:XN},(_,i)=>DB.doc(xSeat(s,i)).get().then(sn=>{if(sn.exists&&sn.data())docs.push({id:"xm"+s+"_e"+i,data:()=>sn.data()})}).catch(()=>{})));return {docs}}}
async function xPull(s){if(!XON())return;if(s==null)s=xLs();try{const sn=await xGrab(s);if(xS===s||!unX)xTake(s,sn.docs)}catch(e){}}
function xRemember(id,m){const k=id+"|"+JSON.stringify(m||{});if(xRemember.k===k)return;xRemember.k=k;xMine={id,m:m||{}};drawXAll();if(!$("#v-xm").hidden)xRender()}
async function xMinePull(){const j=C&&C.mj;if(!j||!XON()||(XR&&XR.id===j.id&&XR.pl)){xMine=null;xRemember.k="";return}
 if(xS===j.s){xMine={id:j.id,m:xSnap["e"+j.i]||{}};return}
 try{const sn=await DB.doc(xSeat(j.s,j.i)).get();if(!C||!C.mj||C.mj.id!==j.id)return;xRemember(j.id,sn.exists?sn.data()||{}:{})}catch(e){}}
/* 보이는 자리(+내 참가)만 doc live. 정렬·더 보기가 바뀌면 xWatchKey 가 달라져 다시 연다. */
function watchX(s){if(s==null)s=xLs();if(!XON())return;xClock();
 const idxs=xVisibleIdx(s),key=s+"|"+xSort+"|"+xShowN+"|"+idxs.join(",");
 if(unX&&xWatchKey===key)return;
 const prev=xS;stopX();
 if(prev!==s){xSnap={};xTake.k=""}
 else{const keep={};idxs.forEach(i=>keep["e"+i]=1);Object.keys(xSnap).forEach(k=>{if(!keep[k])delete xSnap[k]})}
 xS=s;xWatchKey=key;
 xPolls=idxs.map(i=>DB.doc(xSeat(s,i)).live().onSnapshot(sn=>{
  if(xS!==s)return;xSnap["e"+i]=sn.exists&&sn.data()&&typeof sn.data()==="object"?sn.data():{};
  xSnapPaint(s);if(C&&C.mj&&C.mj.s!==s)xMinePull()},()=>{},POLL_FAST));
 unX=()=>{stopX()}}
/* 서버 자리에 내가 있으면 창을 닫았다가 켜도 그 출정으로 다시 묶는다. 정원 7명 안에 든 사람만 묶는다. */
function xBindFrom(s,o){if(!C||C.mj||!o||!UID)return false;const now=xNow();
 for(let i=0;i<XN;i++){const x=xInfo(s,i);if(C.ms===x.id)continue;if(XR&&XR.id===x.id&&(XR.fin||XR.gone))continue;if(xGone&&xGone.s===s&&xGone.i===i&&now<xGone.till)continue;if(now>=x.T0+X_RUN_MAX)continue;
  const ids=xParty(x,o["e"+i]||{});if(!ids.includes(UID))continue;C.mj={id:x.id,s,i,T0:x.T0};save();return true}return false}
async function xRejoin(){if(!C||C.mj||!XON()||!UID)return;const now=xNow(),base=xSlot(),skip=xS>=0?xS:xLs(),ss=[];
 for(let s=base-2;s<=base;s++){if(s<0||s===skip)continue;const T0=(s+1)*XS;if(now>=T0+X_RUN_MAX||T0-now>XS+XCLOSE)continue;ss.push(s)}
 for(const s of ss){if(C.mj)return;try{const sn=await xGrab(s);const o={};(sn.docs||[]).forEach(d=>{const m=String(d.id).match(/_e(\d+)$/);if(m)o["e"+m[1]]=d.data()||{}});if(xBindFrom(s,o)&&!$("#v-rooms").hidden)drawXAll()}catch(e){}}}
function xMsClear(){if(!C||!C.ms)return;const m=String(C.ms).match(/^x(\d+)_\d+$/);if(m&&xNow()<(Number(m[1])+1)*XS+X_RUN_MAX)return;delete C.ms;save()}
function xSig(){return (xTake.k||"")+"|"+(xRemember.k||"")+"|"+(xPh||"")+"|"+xSort+"|"+xShowN}

/* 정기 출정 목록 HTML.
   drawXAll: #rl 이 보이면 서명(xSig)이 바뀌었을 때만 drawX 를 다시 부른다.
   drawX: #rl 안을 비우고 카운트다운·정렬·참가 중 카드·자리 행·더 보기를 elT 로 붙인다.
   자리 데이터(me)와 무관 — 화면만 그린다. */
function drawXAll(){
 const sig=xSig(),el=$("#rl");
 if(!el||el.closest("[hidden]"))return;
 if(el.dataset.xs===sig&&el.childElementCount)return;
 el.dataset.xs=sig;
 drawX(el)
}
/* 목록 행 제목 옆 권장 전투력 하한. 성급 d=1~4(심연). 실제 판정 기준치는 파티 평균·battleT. */
function xRecLo(d){d=Number(d)||1;return d>=4?(typeof ABYSS_MIN==="number"?ABYSS_MIN:450):d===3?300:d===2?150:0}
function xRecTxt(d){return "권장 전투력 ( "+xRecLo(d)+" ~ )"}
function xTitle(x){const ab=x.d===4,b=elT("b","xm-title");b.append(document.createTextNode((ab?"🜏 ":"")+x.nm+" "),elT("small","xm-rec",xRecTxt(x.d)));return b}

function xSeatMap(x){if(xS===x.s)return xSnap["e"+x.i]||{};if(xMine&&xMine.id===x.id&&xMine.m)return xMine.m;return null}
function xFace(x){return xOverlay(x,xSeatMap(x)||{})}
function xWho(ids,pl){const who=ids.map(u=>cn(u,(pl[u]||{}).n)).filter(Boolean).join(", ");return "파티 "+ids.length+"/"+XMAX+(who?" · "+who:"")}
function xSay(t,bad){[$("#rm"),$("#hm")].forEach(e=>{if(e){e.style.color=bad?"var(--bad)":"var(--mu)";e.textContent=t}})}
/* 참가 자리 저장만 30초를 기다린다. 다른 요청은 20초다. 출발 마감이 2분이라 그보다 길게 기다리지 않는다. */
const X_NET=30000;
/* 참가 쓰기가 거절된 이유. 상태 코드와 끊김을 나눠, 같은 "참가하지 못했다"로 뭉개지지 않게 한다. */
function xErrKind(e){const name=e&&e.name,m=String(e&&e.message||"");if(m==="timeout"||name==="AbortError"||/abort/i.test(m))return "timeout";if(/^(401|403|400|404|412|413)$/.test(m))return m;if(/^\d{3}$/.test(m))return m;if(m==="offline"||/failed to fetch|networkerror|load failed|offline|network/i.test(m))return "offline";return ""}
const xDown=e=>{const c=xErrKind(e);return c==="timeout"||c==="offline"};
function xNetWhy(e,ms){const c=xErrKind(e);if(c==="timeout")return "서버 응답이 "+Math.round((ms||20000)/1000)+"초 안에 오지 않았다.";if(c==="offline")return "네트워크에 연결되지 않았다.";if(c==="401")return "로그인이 만료되었다. 새로고침한 뒤 다시 로그인해 보자.";if(c==="403")return "서버가 기록을 거절했다. 위쪽 로그인 경고가 있으면 그 안내를 먼저 해결해야 한다.";if(c==="400")return "서버가 기록 형식을 거절했다.";if(c==="404")return "서버에서 출정 자리 주소를 찾지 못했다.";if(c==="412")return "다른 기록과 겹쳐 서버가 저장을 거절했다.";if(c==="413")return "참가 기록이 너무 커서 서버가 거절했다.";if(/^\d{3}$/.test(c))return "서버가 오류 코드 "+c+"로 응답했다.";const raw=String(e&&e.message||"").replace(/\s+/g," ").slice(0,80);return raw?raw:"원인을 확인하지 못했다."}
function xJoinWhy(e,dropped){const lost=dropped?"이전 출정 자리는 지워졌고, ":"";return lost+"참가하지 못했다. "+xNetWhy(e,X_NET)+(xErrKind(e)==="401"?"":" 잠시 뒤에 다시 시도해 보자.")}
/* 매지컬 마치 #rl 목록 DOM. 인자 el 은 보통 #rl.
   위: 마감 안내·정렬 칩. 있으면 내가 참가 중인 카드. 아래: 지금 묶음 자리 행(제목+권장 전투력·별·인원·참가 버튼). */
function drawX(el){el.innerHTML="";if(!C)return;
 if(!XON()){el.innerHTML="<p class='hint'>서버에 연결되어야 정기 출정에 참가할 수 있다.</p>";return}
 const now=xNow(),ls=xLs(),mj=C.mj,ord=xOrdered(ls),n=Math.min(XN,Math.max(X_PAGE,xShowN));
 el.appendChild(elT("p","x-cd",xCdTxt()));
 {const row=elT("div","row x-sort");[["def","기본"],["hi","높은 등급"],["lo","낮은 등급"]].forEach(([k,lab])=>{const b=elT("button","chip",lab);b.type="button";b.setAttribute("aria-pressed",xSort===k?"true":"false");b.onclick=()=>xSetSort(k);row.appendChild(b)});el.appendChild(row)}
 if(mj){const x=xInfo(mj.s,mj.i),m=xFace(x),ids=xParty(x,m),pend=!!(mj.pend||(xPend&&xPend.id===mj.id)),w=elT("div","xm on"),cp=elT("div","xm-copy"),b=elT("button","chip","보기");
  const tit=elT("b","xm-title");tit.append(document.createTextNode("참가한 출정: "+x.nm+" "),elT("small","xm-rec",xRecTxt(x.d)));
  cp.append(tit,elT("small","",(now<x.T0?"출발 "+xHM(x.T0)+" · ":"")+xWho(ids,m)+(pend?" · 서버에 자리를 남기는 중":now<x.T0?" · 출발 시각에 자동으로 출발한다.":" · 출정 중이다.")));b.type="button";b.onclick=xView;w.append(cp,b);if(xQuitOpen(x)){const q=elT("button","chip","나가기");q.type="button";q.onclick=xQuit;w.appendChild(q)}el.appendChild(w)}
 for(let t=0;t<n;t++){const i=ord[t],x=xInfo(ls,i),m=xFace(x),ids=xParty(x,m),onSrv=ids.includes(UID)&&(!mj||mj.id===x.id),inI=!!(mj&&mj.id===x.id)||onSrv,full=ids.length>=XMAX&&!inI,lock=!!mj&&!inI&&mj.s!==ls;
  const ab=x.d===4,weak=ab&&pw()<ABYSS_MIN&&!inI,quit=inI&&xQuitOpen(x),late=now>=x.close,w=elT("div","xm"+(inI?" on":"")+(ab?" abyss":"")),cp=elT("div","xm-copy");
  cp.append(xTitle(x),elT("small","",XDF[x.d].n+(ab?" · 보상 2배 · 전투력 "+ABYSS_MIN+" 이상":"")+" · 전투 "+x.total+"번 · "+xWho(ids,m)));
  const b=elT("button","chip",quit?"나가기":inI?(late?"마감":"참가 취소"):full?"정원 마감":lock?"참가 불가":weak?"전투력 부족":mj?"이쪽으로 변경":"참가");b.type="button";b.disabled=quit?false:inI?late:full||lock||weak;b.onclick=()=>{if(quit){xQuit();return}if(inI){if(late)return;if(!(C.mj&&C.mj.id===x.id))C.mj={id:x.id,s:x.s,i:x.i,T0:x.T0};xLeave()}else xJoin(ls,i)};w.append(cp,b);el.appendChild(w)}
 if(n<XN){const more=elT("button","btn g","참가 자리 "+Math.min(X_PAGE,XN-n)+"개 더 열기 ("+n+"/"+XN+")");more.type="button";more.onclick=xMore;el.appendChild(more)}
 else el.appendChild(elT("p","hint","참가 자리 "+XN+"개를 모두 열고 있다."))}
/* 자리 쓰기: rooms/xm{묶음}_e{번호}/{uid} ← me() 본문 + jt 서버 시각.
   권장 전투력 자체는 올리지 않는다. 개인 전투력 p(및 깃발·특성·무기…)만 올리고,
   출발 시 서버가 파티 p 로 권장·기준치(battleT)를 계산한다(functions/sim/engine.js).
   flush 는 set 실패로 pend 가 남은 경우에만 다시 올린다. */
async function xSeatWrite(s,i,body){await DB.doc(xSeat(s,i)+"/"+UID).set(body,X_NET)}
async function xJoin(s,i){xClock();xClockWait(false).catch(()=>{});const x=xInfo(s,i);if(!XON())return;if(lhOn()){toast("장기 토벌을 떠나 있는 동안에는 정기 출정에 참가할 수 없다.");return}if(typeof clueOn==="function"&&clueOn()){toast("단서 탐색을 떠나 있는 동안에는 정기 출정에 참가할 수 없다.");return}
 if(C.fall)return xSay("타락한 동안에는 출정할 수 없다.",1);if(C.dz>=90)return xSay("절망도가 너무 높아 출정할 수 없다. 공명으로 절망도를 낮춘 뒤에 다시 오자.",1);
 if(xNow()>=x.close)return xSay("이 출정은 참가가 마감되었다.",1);if(x.d===4&&pw()<ABYSS_MIN)return xSay("심연에는 전투력 "+ABYSS_MIN+" 이상만 들어갈 수 있다. (지금 "+pw()+")",1);
 if(C.mj&&xExpired(C.mj))xRelease();
 const mj=C.mj;if(mj&&mj.id===x.id)return;if(mj&&mj.s!==s)return xSay("이미 참가한 출정이 있다. 그 출정이 끝난 뒤에 참가할 수 있다.",1);
 const party=xParty(x,xFace(x));
 if(party.includes(UID)){C.mj={id:x.id,s,i,T0:x.T0};if(C.ms===x.id)delete C.ms;xPh="";save();drawXAll();xSay(x.nm+" 출정에 이미 참가해 있다. "+xHM(x.T0)+"에 출발한다.");return}
 if(party.length>=XMAX)return xSay("정원이 찼다.",1);
 /* me0.p = 참가 순간 pw(). 이후 강화·레벨업은 이 자리 기록에 자동 반영되지 않는다. */
 const job=++xJob,me0=me(),body=Object.assign({},me0,{jt:{".sv":"timestamp"}});C.mj={id:x.id,s,i,T0:x.T0,pend:1};if(C.ms===x.id)delete C.ms;xGone=mj?{s:mj.s,i:mj.i,till:Date.now()+X_NET}:null;
 xPend={s,i,id:x.id,body,prev:mj?{s:mj.s,i:mj.i}:null,prevGone:!mj};
 if(xS===s){if(mj&&xSnap["e"+mj.i])delete xSnap["e"+mj.i][UID];(xSnap["e"+i]=xSnap["e"+i]||{})[UID]=Object.assign({},me0,{jt:Math.min(xNow(),xCloseAt(x))});xTake.k=""}
 /* 낙관 mj·pend 를 바로 남겨, set 전에 새로고침해도 xFlush 가 이어서 올린다.
    pend 는 다른 기기가 이어서 올릴 수 있게 saveNow 로 계정에 바로 남긴다. */
 (typeof saveNow==="function"?saveNow:save)();drawXAll();xSay(x.nm+" 출정 자리를 서버에 남기는 중… "+xHM(x.T0)+"에 자동으로 출발한다. 준비한 아이템과 마법은 참가한 순간을 기준으로 쓰인다.");
 let dropped=false;
 try{if(mj){await DB.doc(xSeat(mj.s,mj.i)+"/"+UID).delete(X_NET);dropped=true;if(xPend&&xPend.id===x.id)xPend.prevGone=true}
  await xSeatWrite(s,i,body);
  if(job!==xJob){if(!C.mj||C.mj.id!==x.id)DB.doc(xSeat(s,i)+"/"+UID).delete().catch(()=>{});return}
  if(C.mj&&C.mj.pend)delete C.mj.pend;if(xPend&&xPend.id===x.id)xPend=null;save();xSay(x.nm+" 출정에 참가했다. "+xHM(x.T0)+"에 자동으로 출발한다.")}
 catch(e){if(job!==xJob)return;if(xDown(e)&&C.mj&&C.mj.id===x.id){C.mj.pend=1;(typeof saveNow==="function"?saveNow:save)();xSay(x.nm+" 참가는 이 기기에 남겨 두었다. 연결되면 서버에 올린다.");return}DB.doc(xSeat(s,i)+"/"+UID).delete().catch(()=>{});xPend=null;C.mj=dropped?null:mj;xGone=null;if(xS===s&&xSnap["e"+i])delete xSnap["e"+i][UID];xTake.k="";save();drawXAll();xSay(xJoinWhy(e,dropped),1)}}
/* 네트워크가 끊겨 참가 기록을 못 올렸어도 신청은 유지한다. 마감(+유예) 전에 연결되면 같은 자리를 다시 쓴다. */
function xHold(){if(xPend||!C||!C.mj||!C.mj.pend)return xPend;const j=C.mj;xPend={s:j.s,i:j.i,id:j.id,body:Object.assign({},me(),{jt:{".sv":"timestamp"}}),prev:null,prevGone:true};return xPend}
async function xFlush(){const p=xHold();if(!p||!C||!C.mj||C.mj.id!==p.id||!XON()||xFlush.busy)return;const x=xInfo(p.s,p.i);if(xNow()>=xCloseAt(x))return;xFlush.busy=true;
 try{if(p.prev&&!p.prevGone){await DB.doc(xSeat(p.prev.s,p.prev.i)+"/"+UID).delete(X_NET);p.prevGone=true}if(xPend!==p||!C.mj||C.mj.id!==p.id)return;
  p.body=Object.assign({},me(),{jt:{".sv":"timestamp"}});await xSeatWrite(p.s,p.i,p.body);if(!C.mj||C.mj.id!==p.id){DB.doc(xSeat(p.s,p.i)+"/"+UID).delete().catch(()=>{});return}
  if(C.mj.pend)delete C.mj.pend;if(xPend===p)xPend=null;save();drawXAll();xSay(x.nm+" 출정 참가를 서버에 남겼다. "+xHM(x.T0)+"에 출발한다.")}catch(e){}finally{xFlush.busy=false}}
/* 백그라운드·탭 전환 직후엔 interval 이 늦어지므로 gap 없이 한 번 올린다. */
function xFlushNow(){if(!(xPend||(C&&C.mj&&C.mj.pend)))return;xFlush.at=0;xFlush()}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)xFlushNow()});
document.addEventListener("pagehide",()=>xFlushNow());
async function xLeave(){const mj=C.mj;if(!mj||xNow()>=xInfo(mj.s,mj.i).close)return;const job=++xJob;if(xPend&&xPend.id===mj.id)xPend=null;C.mj=null;xGone={s:mj.s,i:mj.i,till:Date.now()+X_NET};
 if(xS===mj.s&&xSnap["e"+mj.i])delete xSnap["e"+mj.i][UID];xTake.k="";save();drawXAll();xSay("출정 참가를 취소했다.");if(!$("#v-xm").hidden)openRooms();
 try{await DB.doc(xSeat(mj.s,mj.i)+"/"+UID).delete(X_NET)}catch(e){if(job!==xJob)return;C.mj=mj;xGone=null;if(xS===mj.s){(xSnap["e"+mj.i]=xSnap["e"+mj.i]||{})[UID]=Object.assign({},me(),{jt:xNow()})}xTake.k="";save();drawXAll();xSay("참가 취소를 서버에 기록하지 못했다. "+xNetWhy(e,X_NET),1)}}
/* RTDB picks 가 배열이 아닌 객체로 오면 Array.isArray 검사가 깨져 표를 잃는다. 클라·서버 모두 같은 정규화를 쓴다. */
function xNormPicks(raw){if(raw==null)return[];const keys=Array.isArray(raw)?raw.map((_,i)=>i).filter(i=>raw[i]!=null):Object.keys(raw||{}).map(Number).filter(Number.isFinite);const out=[],max=keys.length?Math.max(...keys):-1;
 for(let i=0;i<=max;i++){if(raw[i]==null)continue;const v=raw[i];if(Array.isArray(v))out[i]=v.map(Number).filter(n=>Number.isFinite(n));
  else if(v&&typeof v==="object")out[i]=Object.keys(v).map(Number).filter(Number.isFinite).sort((a,b)=>a-b).map(k=>Number(v[k])).filter(n=>Number.isFinite(n));
  else{const n=Number(v);if(Number.isFinite(n))out[i]=[n]}}return out}
// 처음부터 다시 계산한다. 같은 씨앗, 같은 파티, 같은 표라면 누구의 화면에서든 결과가 같다.
function xReplay(X){const x=X.x,r={code:x.id,pl:{},total:x.total,seq:[],evs:[],df:XDF[x.d].df,rw:XDF[x.d].rw,dzm:XDF[x.d].dz||1,ab:x.d===4?1:0,zv:x.v},L=[],picks=xNormPicks(X.picks),wall=xNow(),prev=X.res&&X.res.wait;let wait=null;
 let resolved=typeof X.pc==="number"&&Number.isFinite(X.pc)?Math.max(0,Math.floor(X.pc)):-1;if(resolved<0){resolved=0;for(let i=0;i<picks.length;i++)if(picks[i]!=null)resolved=i+1}
 Object.keys(X.pl).forEach(u=>r.pl[u]=X.pl[u]);
 seeded(hs32(x.id+"#sim"),()=>{startSim(r);let c=0;
  while(r.pend&&!r.fin){const xe=EVM[r.pend.id];if(!xe){r.pend=null;simStep(r);continue}
   const cx=evCtx(r),ops=xe.o.map((o,i)=>i).filter(i=>!xe.o[i].req||xe.o[i].req(cx)),h=(cx.tr("번뜩임")||cx.tr("예민함"))?xe.o.findIndex(o=>o.ok):-1;
   L.push(r.seq.length);
   if(c>=resolved){let Ws,Wd;if(prev&&Number(prev.c)===c&&typeof prev.Wd==="number"){Ws=prev.Ws;Wd=prev.Wd}else{Wd=wall+CHOICE_MS;Ws=Wd-CHOICE_MS}
    r.ch={id:r.pend.id,v:r.pend.v,k:c,until:Wd,ops,h};wait={c,Ws,Wd};break}
   r.ch={id:r.pend.id,v:r.pend.v,k:c,until:wall,ops,h};resolveChoice(r,picks[c]||[]);c++}});
 const lineAt=j=>x.T0+(j+1)*XSTEP+CHOICE_MS*L.filter(l=>l<=j).length;
 return{r,wait,lineAt,done:!!r.fin&&!wait,endAt:lineAt(Math.max(0,r.seq.length-1))+800}}
/* lock=true(기본): 의도 퇴장·확정 실패. C.ms·XR.gone 으로 같은 출정 재바인딩을 막는다.
   lock=false: 일시 실패(xr 미수신·한도 초과). C.ms 를 남기지 않고 XR 을 비워, 서버 자리가 있으면 다시 묶이게 한다.
   알림함 note("march") 는 쓰지 않는다. 보상 알림은 서버 지급(c/nt)만. 미수신은 화면만 접고 재연결. */
function xAbandon(why,lock){if(!C)return;const hold=lock!==false,j=C.mj;if(j&&xPend&&xPend.id===j.id)xPend=null;C.mj=null;
 if(hold){if(j)C.ms=j.id;if(XR){XR.gone=1;XR.why=why}}else XR=null;
 stopXr();save();drawXAll();
 /* 확정 실패(빈 파티·자리 누락)만 화면 문구. 미수신·한도는 알림·오류 문구 없이 재연결. */
 if(hold)xSay(why,1);
 if(j){xAuto=j.id;if(hold&&XON()&&xNow()<Number(j.T0))DB.doc(xSeat(j.s,j.i)+"/"+UID).delete().catch(()=>{});if(!hold){try{xRejoin()}catch(e){}}}}
function xWhyFetch(x,late){const waitM=Math.max(1,Math.round(X_FETCH_GIVEUP/60000)),lateS=Math.max(0,Math.round((late||0)/1000));
 return x.nm+" 출정 결과 방(xr)을 출발 후 "+waitM+"분 안에 받지 못했다(원인: 서버 기록 미생성 또는 수신 실패, 대기 "+lateS+"초). 서버 자리는 유지되니 마을·목록에 다시 들어오면 묶일 수 있다."}
function xWhyHard(x,late){const limM=Math.round(X_HARD_LIMIT/60000),lateM=Math.max(1,Math.round((late||0)/60000));
 return x.nm+" 출정이 출발 후 "+limM+"분 한도를 넘겨도 끝나지 않아 화면만 정리했다(원인: 진행 한도 초과, 경과 약 "+lateM+"분). 서버에 자리가 있으면 다시 묶일 수 있다."}
function xWhyEmpty(x){return x.nm+" 출정은 출발 시각에 참가자가 한 명도 없어 전투를 시작하지 않았다(원인: 빈 파티)."}
const xEmptyRetry=()=>typeof X_EMPTY_RETRY==="number"?X_EMPTY_RETRY:60000;
/* empty 문서인데 all 에 내 자리 jt 만 있으면 유예 초과·정원 초과로 본다(진짜 빈 방과 구분). */
function xWhyEmptyDoc(x,doc){const all=doc&&doc.all||{},jt=all[UID];if(jt==null)return xWhyEmpty(x);const d={};Object.keys(all).forEach(u=>{d[u]={jt:all[u]}});return xSeatMiss(x,d)}
// 출발 시각이 지난 자리는 지우지 않는다. 창을 닫았다가 돌아온 사람이 같은 파티로 이어가야 한다.
// 다만 결과 수령·확정 실패 뒤에는 C.ms 로 같은 출정에 다시 묶이지 않게 한다.
function xExpired(j){if(!j)return false;const s=Number(j.s),i=Number(j.i),T0=Number(j.T0);if(!Number.isFinite(s)||!Number.isFinite(i)||!Number.isFinite(T0))return true;
 if(XR&&XR.id===j.id&&(XR.fin||XR.gone))return true;return xNow()>=T0+X_RUN_MAX}
function xRelease(why){const j=C&&C.mj;if(!j||!C)return;const s=Number(j.s),i=Number(j.i),id=j.id,T0=Number(j.T0);if(xPend&&xPend.id===id)xPend=null;C.mj=null;C.ms=id;if(XR&&XR.id===id)XR=null;stopXr();if(why){note("march",why);xSay(why,1)}save();drawXAll();
 if(XON()&&Number.isFinite(s)&&Number.isFinite(i)&&!(Number.isFinite(T0)&&xNow()>=T0))DB.doc(xSeat(s,i)+"/"+UID).delete().catch(()=>{})}
/* 방 삭제 예약은 endAt+X_DROP 을 기준으로 한다. 이미 더 늦은 시각이 있으면 유지하고, 더 이른 예약만 endAt 기준으로 늦춘다. */
function xMarkDone(s,i,endAt){if(!XON()||!Number.isFinite(Number(s))||!Number.isFinite(Number(i)))return;const now=xNow(),want=Number.isFinite(Number(endAt))?Number(endAt)+X_DROP:now+X_DROP;
 DB.doc(xSeat(s,i)+"/done").transact(c=>{if(typeof c==="number"&&c>0)return;return now}).catch(()=>{});
 DB.doc("live/xdrop/"+s+"_"+i).transact(c=>{if(typeof c==="number"&&c>0){if(c>=want)return;return want}return want}).catch(()=>{})}
/* 끝난 뒤 1분이 지났거나, 출발 후 5분이 지났으면 수동으로 나갈 수 있다. 서버가 방을 못 지워도 화면에서 풀려난다.
   나가기는 화면·자리만 정리한다. 골드·경험·절망·가방은 Functions 가 이미 계정에 썼거나, xGrant(serverPay) 가 다시 쓰지 않는다. */
function xQuitOpen(x){if(!C||!x)return false;const now=xNow(),mine=C.mj&&C.mj.id===x.id,done=XR&&XR.id===x.id&&XR.fin;if(!mine&&!done)return false;const end=XR&&XR.id===x.id&&XR.res&&Number(XR.res.endAt);if(end&&now>=end+X_QUIT)return true;if(done)return true;return now>=Number(x.T0)+X_STUCK}
/* 나가기: 확인·보상 포기 문구 없음. 미정산이면 xGrant(serverPay) 로 문구·통계만 넣고, 목록으로 돌린다. */
function xQuit(){if(XR&&!XR.fin){const j=C&&C.mj,x=j&&XR.id===j.id?xInfo(j.s,j.i):(XR.x||null);if(x&&XR.id===x.id)xGrant(x)}
 const j=C&&C.mj,done=XR&&XR.fin&&(!j||XR.id===j.id);if(!j&&!done)return;
 const id=j?j.id:(XR&&XR.id);if(j){if(xPend&&xPend.id===j.id)xPend=null;C.mj=null}if(id)C.ms=id;XR=null;stopXr();save();drawXAll();
 if(typeof openRooms==="function")openRooms();else show("rooms")}
/* 출발 시각에 내 자리가 파티에 없는 이유. 기록 없음, 마감 이후 기록, 정원 초과를 구분한다. */
function xSeatMiss(x,d){const mine=d&&d[UID];if(!mine||typeof mine!=="object")return x.nm+" 출정 전투 파티에 들어가지 못했다(원인: 서버 자리 기록 없음 — 참가 미저장·출발 전 삭제).";if(jtOf(mine)>xCloseAt(x))return x.nm+" 출정 전투 파티에 들어가지 못했다(원인: 참가 시각이 마감 유예("+xHM(xCloseAt(x))+") 이후 — 기기 시각이 서버보다 느릴 수 있음).";return x.nm+" 출정 전투 파티에 들어가지 못했다(원인: 마감 전 정원 "+XMAX+"명 초과)."}
/* 출정 결과는 연결로 받는다. 서버가 기록을 고칠 때만 바뀐 내용이 오고, 1초마다 전체를 다시 읽지 않는다.
   live 가 거절되면 POLL_FAST 간격으로 묻고, X_XR_CD 뒤 다시 live 를 연다(목록용 20초보다 짧게). */
let xCalcAsk="",unXr=null,xrPoll=null,xrRetryT=null,xrMissT=null,xrMode="",xrKey="",xrMissAt=0;
/* xr 빈 응답 대기는 X_FETCH_GIVEUP 과 같게 둔다. expireMarch 가 최대 ~1분 늦을 수 있고, T0 calc 킥·분 주기 스케줄이 그 안에 기록을 만든다. */
const X_XR_CD=10000,X_XR_MISS=X_FETCH_GIVEUP;
function stopXr(){if(unXr){try{unXr()}catch(e){}}unXr=null;if(xrPoll){try{xrPoll()}catch(e){}}xrPoll=null;if(xrRetryT){clearTimeout(xrRetryT);xrRetryT=null}if(xrMissT){clearTimeout(xrMissT);xrMissT=null}xrMode="";xrKey="";xrMissAt=0}
/* 투표 마감 집계는 서버(xVoteDue Task + live/x due + expireMarch). 클라는 xr 미생성 시에만 calc 로 보조 깨운다. */
function xAskCalc(x,mark,flip){if(!x||!mark||xCalcAsk===mark)return;const prev=xCalcAsk;xCalcAsk=mark;const ref=DB.doc("rooms/xr"+x.s+"_"+x.i+"/calc");
 const go=()=>ref.set(1).catch(()=>{if(xCalcAsk===mark)xCalcAsk=""});
 if(flip&&prev)ref.set(0).then(go).catch(go);else go()}
function watchXr(s,i){const key=s+"_"+i;if(xrKey===key&&(unXr||xrPoll))return;stopXr();xrKey=key;if(!XON())return;
 const path="rooms/xr"+s+"_"+i;
 /* 출발 직후 서버가 xr 을 쓰기 전 live 가 빈 값을 줄 수 있다. X_FETCH_GIVEUP 동안 구독을 유지한다.
    live 가 null 을 한 번만 보내도 타이머로 포기 시각을 맞춘다. 그사이 문서가 오면 타이머를 끈다. */
 const onDoc=sn=>{if(!C||!C.mj||C.mj.s!==s||C.mj.i!==i)return;const x=xInfo(s,i);
  if(!sn.exists){if(!xrMissAt){xrMissAt=xNow();if(xrMissT)clearTimeout(xrMissT);xrMissT=setTimeout(()=>{xrMissT=null;if(xrKey!==key||!C||!C.mj||C.mj.s!==s||C.mj.i!==i||!xrMissAt)return;if(XR&&XR.id===C.mj.id&&XR.res&&XR.res.r){xrMissAt=0;return}const xx=xInfo(s,i),late=xNow()-xx.T0;stopXr();xAbandon(xWhyFetch(xx,late),false)},X_XR_MISS)}return}
  xrMissAt=0;if(xrMissT){clearTimeout(xrMissT);xrMissT=null}
  const doc=sn.data();if(!doc)return;
  if(doc.empty){/* 서버 X_EMPTY_RETRY 안이면 xm 재집계를 기다리며 포기하지 않는다. */
   if(xNow()<x.T0+xEmptyRetry()){if(!$("#v-xm").hidden)xRender();return}
   stopXr();xAbandon(xWhyEmptyDoc(x,doc),true);return}
  if(!doc.r)return;
  if(!doc.r.pl||!doc.r.pl[UID]){const d={};Object.keys(doc.all||{}).forEach(u=>{d[u]={jt:doc.all[u]}});stopXr();xHold();const late=xNow()-x.T0;if(xPend&&xPend.id===x.id&&late<=X_FETCH_GIVEUP)return;if(xPend&&xPend.id===x.id)xPend=null;xAbandon(xSeatMiss(x,d),true);return}
  if(xPend&&xPend.id===x.id)xPend=null;xApplyDoc(x,doc);if(!$("#v-xm").hidden)xRender()};
 const armLive=()=>{if(unXr){try{unXr()}catch(e){}}unXr=null;xrMode="live";
  unXr=DB.doc(path).live().onSnapshot(onDoc,()=>{if(xrKey!==key||xrMode!=="live")return;xrMode="poll";if(unXr){try{unXr()}catch(e){}}unXr=null;
   if(xrPoll){try{xrPoll()}catch(e){}}xrPoll=DB.doc(path).onSnapshot(onDoc,()=>{},POLL_FAST);
   if(xrRetryT)clearTimeout(xrRetryT);xrRetryT=setTimeout(()=>{if(xrKey!==key||!C||!C.mj||C.mj.s!==s||C.mj.i!==i)return;if(xrPoll){try{xrPoll()}catch(e){}}xrPoll=null;armLive()},X_XR_CD)},0)};
 armLive()}
function xApplyDoc(x,doc){if(!XR||XR.id!==x.id)XR={id:x.id,x,pl:null,picks:[],pc:0,fin:"",drawn:-1};XR.pl=doc.r.pl||{};XR.picks=xNormPicks(doc.picks);XR.pc=typeof doc.pc==="number"?doc.pc:XR.picks.filter(v=>v!=null).length;XR.res=doc;const j=C&&C.mj;
 if(j&&j.id===x.id&&!j.st){j.st=1;save();xSound("start");toast("⚑ "+x.nm+" 출정 출발! 파티와 함께 마수를 향해 나아간다.")}
 xGrant(x)}
/* 매지컬 마치 결과 반영(방어).
   · 권한: 골드·경험·절망·재료·소모·펫·보상 알림(c/nt)은 Functions 만(afterExpeditionDone → grantMarchCore → applyMarchPay).
   · 클라: settle(…, {serverPay:true}) 로 통계·칭호·결과 HTML만. gain()/절망/note("march") 금지.
   · 왜: 결과 기록(xr)은 endAt 보다 먼저 오고, 서버는 done 직후 이미 지급한다. serverPay 없이 settle 하면
     연출 중 동기화로 한 번, 종료 settle 로 또 한 번 절망이 오른다.
   · pay: rooms/xr…/pay/{uid} 영수증. 있으면 문구에 서버가 준 양을 그대로 적는다(클라 재계산 금지).
   · accSyncIfNewer: 서버 ts 가 앞서면 저장 전에 맞춘다(알림함·수치). */
function xGrant(x){const doc=XR&&XR.id===x.id?XR.res:null;if(!doc||!doc.done||XR.fin||xNow()<Number(doc.endAt))return;
 const pay=doc.pay&&UID&&doc.pay[UID]?doc.pay[UID]:null;
 let h="";try{h=settle(doc.r,{serverPay:true,pay})}catch(e){h="<p>결과를 정리하는 중에 문제가 생겼다.</p>"}XR.fin=h||"<p>이미 결과를 받은 출정이다.</p>";const ss=x.s,ii=x.i;
 if(C){C.ms=x.id;if(C.mj&&C.mj.id===x.id)C.mj=null}save();drawXAll();xMarkDone(ss,ii,doc.endAt);stopXr();if(h)xSound(doc.r&&doc.r.ok?"win":"lose");
 if(typeof accSyncIfNewer==="function")accSyncIfNewer().catch(()=>{})}
function xTick(){const j=C&&C.mj;if(!j||!XON()||xNow()<j.T0){stopXr();return}
 if(XR&&XR.id===j.id&&XR.fin){stopXr();return}
 const x=xInfo(j.s,j.i),late=xNow()-x.T0;
 if(late>X_HARD_LIMIT&&!(XR&&XR.fin)){stopXr();xAbandon(xWhyHard(x,late),false);return}
 watchXr(j.s,j.i);
 /* 출발 직후 기록이 없으면 roomCalc 를 깨워 xr 을 바로 만들게 한다. expireMarch(1분)만 기다리지 않는다.
    응답이 없으면 20초마다 다시 요청한다(같은 값 1 쓰기가 트리거를 안 줄 수 있어 0→1 로 다시 올린다). */
 const got=XR&&XR.id===x.id&&XR.res&&(XR.res.r||XR.res.empty);
 if(!got){const boot="boot_"+x.id+"_"+Math.floor(late/20000);
  if(xCalcAsk!==boot){const prev=xCalcAsk;xCalcAsk=boot;const ref=DB.doc("rooms/xr"+x.s+"_"+x.i+"/calc");
   const go=()=>ref.set(1).catch(()=>{if(xCalcAsk===boot)xCalcAsk=""});
   if(prev&&String(prev).indexOf("boot_"+x.id+"_")===0)ref.set(0).then(go).catch(go);else go()}
  if(late>X_FETCH_GIVEUP){stopXr();xAbandon(xWhyFetch(x,late),false);return}
  return}
 xGrant(x)}
/* 표시만. wait/Wd 는 서버 xr, 내 표는 xv. 마을 복귀 때 키·표를 비우지 않는다. */
function xView(){xClock();if(C&&C.mj)xAuto=C.mj.id;show("xm");$("#xpl").dataset.k="";if(XR)XR.drawn=-1;if(xWatchOn())watchX(xWatchSlot());xRender()}
function xRender(){if($("#v-xm").hidden)return;const now=xNow(),mj=C.mj,X=XR&&(!mj||XR.id===mj.id)?XR:null,x=X?X.x:mj?xInfo(mj.s,mj.i):null;if(!x){if(typeof hub==="function")hub();else show("hub");return}
 $("#xq").hidden=!xQuitOpen(x);
 $("#xt").textContent=x.nm+" · "+XDF[x.d].n;
 let pl,ids;
 if(X&&X.pl){pl=X.pl;ids=Object.keys(pl)}
 else{pl=xFace(x);ids=xParty(x,pl)}
 const l=$("#xpl"),key=(X&&X.pl?"f":"l")+"|"+ids.map(u=>{const p=pl[u]||{};return u+":"+(p.n||"")+"."+(p.g||"")+"."+(p.p||0)}).join(",");
 if(l.dataset.k!==key){l.dataset.k=key;l.innerHTML="";ids.forEach(u=>{const p=pl[u]||{},stat=p.g||p.a||p.p?" · "+(p.g||"-")+"등급 "+(p.a||"")+" · 전투력 "+(p.p||0):"",d=elT("div","chip",(p.tn?"「"+String(p.tn).slice(0,20)+"」 ":"")+cn(u,p.n)+(u===UID?" (나)":"")+stat);d.style.textAlign="left";if(u!==UID){d.style.cursor="pointer";d.onclick=()=>openProfile(u)}l.appendChild(d)})}
 const g=$("#xlg"),cv=$("#xch");
 if(!X||!X.res){const why=X&&X.gone?(X.why||"이번 출정에는 참가하지 못했다."):"",who=xWho(ids,pl);$("#xs").textContent=why||(now<x.T0?"전투 "+x.total+"번 예정 · "+who+" · "+(now<x.close?"마감까지 "+xFmt(x.close-now)+" · ":"참가 마감 · ")+"출발까지 "+xFmt(x.T0-now):"출발 준비 중... · "+who);
  const mark=why?"g":"1";if(g.dataset.w!==mark){g.dataset.w=mark;g.innerHTML="";g.appendChild(elT("p","",why||"출발을 기다리고 있다."))}cv.hidden=true;return}
 g.dataset.w="";const R0=X.res,r=R0.r,w=R0.wait,at=i=>Array.isArray(R0.lineAt)?R0.lineAt[i]:R0.lineAt(i);let n=0;while(n<r.seq.length&&at(n)<=now)n++;
 /* wait 가 열려 있으면 연출 lineAt 때문에 투표 UI 가 가려지지 않게 문장을 다 보여 준다. */
 if(w)n=Math.max(n,r.seq.length);
 if(X.drawn!==n||X.fd!==!!X.fin){X.drawn=n;X.fd=!!X.fin;g.innerHTML=r.seq.slice(0,n).map(t=>"<p>"+t+"</p>").join("")||"<p>출발한다...</p>";if(X.fin&&n>=r.seq.length)g.innerHTML+=X.fin}
 $("#xs").textContent=(X.fin?"출정 종료":w?(now<w.Wd?"선택의 순간":"표를 세는 중"):"출정 중")+" · "+xWho(ids,pl);
 /* 키 = 출정+c+Wd. Wd 가 안 바뀌면 재마운트 없음. 표는 xv 에서만 복구. */
 if(w&&now<w.Wd&&X.pl[UID]&&r.ch&&EVM[r.ch.id]){const k=x.id+"_"+w.c+"_"+w.Wd,mark=()=>{const row=cv.querySelector(".row");if(!row)return;row.querySelectorAll(".chip").forEach((c,n)=>{const on=xMyV!=null&&r.ch.ops[n]===xMyV;c.disabled=xMyV!=null;c.setAttribute("aria-pressed",on?"true":"false")})};
  if(xChK!==k){xChK=k;xMyV=null;cv.hidden=false;cv.innerHTML="";const xe=EVM[r.ch.id];cv.appendChild(elT("p","choice-q",vtx(xe.q,r.ch.v)));const row=elT("div","row");
   r.ch.ops.forEach(i=>{const o=xe.o[i],b=elT("button","chip",o.l+(o.rl?" ("+o.rl+")":"")+(r.ch.h===i?" ✦":""));b.type="button";b.setAttribute("aria-pressed","false");
    b.onclick=async()=>{if(xNow()>=w.Wd||xMyV!=null)return;xMyV=i;mark();try{const saved=await DB.doc(xVote(x.id,w.c)+"/"+UID).transact(c=>{if(c&&typeof c==="object"&&typeof c.i==="number")return;return{i,ts:xNow()}});xMyV=saved&&typeof saved.i==="number"?saved.i:i;mark()}catch(e){if(xMyV===i)xMyV=null;mark()}};row.appendChild(b)});
   cv.appendChild(row);if(r.ch.h>=0)cv.appendChild(elT("p","hint","✦ 파티의 직감(번뜩임·예민함)이 답을 속삭인다."));cv.appendChild(elT("p","hint x-ct",""));
   DB.doc(xVote(x.id,w.c)+"/"+UID).get().then(sn=>{if(xChK!==k)return;const d=sn.exists?sn.data():null;if(d&&typeof d.i==="number"){xMyV=d.i;mark()}}).catch(()=>{})}
  cv.hidden=false;const t=cv.querySelector(".x-ct");if(t)t.textContent=(xMyV!=null?"선택을 마쳤다. 다시 고를 수 없다. ":"")+"남은 시간 "+Math.max(0,Math.ceil((w.Wd-now)/1000))+"초 · 파티원이 함께 고른다. 표가 갈리면 무작위로 정해진다."}
 else{cv.hidden=true;if(!w)xChK=""}}
/* 마을로: 출정 목록(openRooms)은 타락·절망도 막힘에 걸릴 수 있어 hub() 로 보낸다.
   show("hub") 만 하면 마을 DOM 이 옛 절망도·전투력 그대로라, 보상 반영 뒤에도 안 오른 것처럼 보인다.
   진행 중이면 xAuto 를 찍어 두어, 목록·마을에 있어도 같은 출정 화면으로 다시 끌어오지 않는다(보기 버튼으로만 복귀). */
$("#xb").onclick=()=>{if(C&&C.mj)xAuto=C.mj.id;if(XR&&(XR.fin||XR.gone)){if(C&&XR.id)C.ms=XR.id;XR=null;save();drawXAll()}
 if(typeof hub==="function")hub();else show("hub")};
$("#xq").onclick=()=>xQuit();
setInterval(()=>{if(!C||!DB)return;const rmOn=!$("#v-rooms").hidden,need=!!(C.mj||xWatchOn()||rmOn);if(need)xClock();
 const now=xNow(),wall=Date.now();xMsClear();
 if(C.mj&&xExpired(C.mj)){const fin=XR&&XR.id===C.mj.id&&XR.fin;xRelease(fin?"출정 결과가 정리되어 다시 참가할 수 있다.":"출정 시간이 지나 자리를 정리했다. 다시 참가할 수 있다.")}
 if(xPend||(C.mj&&C.mj.pend)){const j=C.mj,xx=j?xInfo(j.s,j.i):null,near=xx&&xNow()>=xCloseAt(xx)-15000,gap=near?2000:5000;if(!xFlush.at||wall-xFlush.at>=gap){xFlush.at=wall;xFlush()}}
 if(xWatchOn()){watchX(xWatchSlot());const ph=xLs()+"_"+(C.mj?C.mj.id+(now>=C.mj.T0):"");if(ph!==xPh){xPh=ph;drawXAll()}document.querySelectorAll(".x-cd").forEach(e=>e.textContent=xCdTxt())}
 else if(unX){stopX();xS=-1}
 if(C.mj&&now>=C.mj.T0&&xAuto!==C.mj.id&&(rmOn||!$("#v-hub").hidden)){xAuto=C.mj.id;xView()}
 xTick();xRender()},1000);
function xSound(k){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const a=ding.c||(ding.c=new A());if(a.state==="suspended")a.resume();const t0=a.currentTime+.02;
 (XSND[k]||[]).forEach(([f,st,du])=>{const o=a.createOscillator(),g=a.createGain();o.type="triangle";o.frequency.setValueAtTime(f,t0+st);g.gain.setValueAtTime(.0001,t0+st);g.gain.exponentialRampToValueAtTime(.16,t0+st+.02);g.gain.exponentialRampToValueAtTime(.0001,t0+st+du);o.connect(g);g.connect(a.destination);o.start(t0+st);o.stop(t0+st+du+.05)})}catch(e){}}
if($("#xtog")){$("#xtog").onclick=()=>xFold($("#xbox").hidden);(()=>{let v="1";try{v=localStorage.getItem("mgr_xopen")||"1"}catch(e){}if(v==="0")xFold(false)})()}
(()=>{try{const s=localStorage.getItem("mgr_xsort");if(s==="def"||s==="hi"||s==="lo")xSort=s}catch(e){}})();
