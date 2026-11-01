/* 정기 출정. main.js 다음에 불러야 한다. 5분마다 열리는 출정, 참가, 자동 출발, 선택, 결과.
   마을 화면은 watchHub 를, 매지컬 마치 목록은 watchX 와 drawXAll 을, 방 정리는 xSweep 를 그대로 부른다. */
function watchHub(){watchX();drawXAll()}
const isAbyss=(s,i)=>i===((s%XN)+XN)%XN||(s%2===0&&i===((s+5)%XN+XN)%XN);
// 정기 출정 기록 위치: 서버 규칙에 이미 열려 있는 rooms 아래에 둔다(별도 규칙 추가가 필요 없다).
// 자리: rooms/xm{묶음}_e{번호}/{나}, 투표: rooms/xv{출정}_c{번호}/{나}. 예전 파일의 방 정리 기능이 지우지 않도록 ts도 함께 남긴다.
const xSeat=(s,i)=>"rooms/xm"+s+"_e"+i,xVote=(id,c)=>"rooms/xv"+id+"_c"+c;
function xInfo(s,i){const id="x"+s+"_"+i,g=rng(hs32(id)),p=n=>Math.floor(g()*n),v="ABCD"[p(4)],ab=isAbyss(s,i),d=ab?4:1+p(3);const pl=XPL[p(XPL.length)],t=3+p(3);return{id,s,i,v,d,nm:ab?ABYSS_PL[((s+(i===((s%XN)+XN)%XN?0:2))%ABYSS_PL.length+ABYSS_PL.length)%ABYSS_PL.length]:VL[v].n+" "+pl,total:ab?5:t,T0:(s+1)*XS,close:(s+1)*XS-XCLOSE}}
const xSlot=()=>Math.floor(Date.now()/XS);
// 지금 참가할 수 있는 출정 묶음(마감이 지나면 다음 묶음)
const xLs=()=>{const s=xSlot();return Date.now()>=(s+1)*XS-XCLOSE?s+1:s};
const jtOf=v=>typeof(v&&v.jt)==="number"?v.jt:0;
const xParty=(x,m)=>Object.keys(m||{}).filter(u=>m[u]&&typeof m[u]==="object"&&jtOf(m[u])<=x.close).sort((a,b)=>jtOf(m[a])-jtOf(m[b])||(a<b?-1:1)).slice(0,XMAX);
const xFmt=ms=>{const t=Math.max(0,Math.ceil(ms/1000));return Math.floor(t/60)+":"+String(t%60).padStart(2,"0")};
const xHM=d=>{const t=new Date(d);return String(t.getHours()).padStart(2,"0")+":"+String(t.getMinutes()).padStart(2,"0")};
const xCdTxt=()=>{const x=xInfo(xLs(),0);return "다음 출발 "+xHM(x.T0)+" · 참가 마감까지 "+xFmt(x.close-Date.now())};
let xSnap={},xS=-1,unX=null,XR=null,xBusy=false,xAuto="",xPh="",xChK="",xMyV=null,xJob=0,xGone=null,xPend=null;
/* 마을·출정 목록이 보이는 동안 이번 묶음(15자리) 연결을 연다. 자리가 바뀔 때만 받는다.
   연결이 거절되면 POLL_HUB(20초)마다 묻는 방식으로 돌아간다. 화면을 벗어나거나 묶음이 바뀌면 연결을 끊는다.
   참가·취소는 서버 응답을 기다리지 않고 화면부터 고친다. 서버가 거절하면 그때 되돌린다.
   xGone 은 방금 빠진 자리다. 서버 목록이 아직 나를 안고 있어도 화면에서는 뺀다. */
function xOverlay(x,raw){const m=Object.assign({},raw||{});
 if(xGone&&xGone.s===x.s&&xGone.i===x.i&&!(C&&C.mj&&C.mj.id===x.id))delete m[UID];
 if(C&&C.mj&&C.mj.id===x.id&&(!m[UID]||typeof m[UID]!=="object"))m[UID]=Object.assign({},me(),{jt:Math.min(Date.now(),x.close)});
 return m}
function watchX(s){if(s==null)s=xLs();if(unX&&xS===s)return;unX&&unX();unX=null;xS=s;xSnap={};if(!XON())return;
 unX=DB.collection("rooms").prefix("xm"+s+"_").live().onSnapshot(sn=>{if(xS!==s)return;const o={};sn.docs.forEach(d=>{const m=String(d.id).match(/_e(\d+)$/);if(m)o["e"+m[1]]=d.data()||{}});xSnap=o;
  if(xGone){const seat=xSnap["e"+xGone.i];if(!seat||!seat[UID]||Date.now()>xGone.till)xGone=null}drawXAll()},e=>{},POLL_HUB)}
function drawXAll(){["#hl","#rl"].forEach(q=>{const el=$(q);if(el&&!el.closest("[hidden]"))drawX(el)})}
function xSay(t,bad){[$("#hm"),$("#rm")].forEach(e=>{if(e){e.style.color=bad?"var(--bad)":"var(--mu)";e.textContent=t}})}
/* 참가 자리 저장만 30초를 기다린다. 다른 요청은 20초다. 출발 마감이 2분이라 그보다 길게 기다리지 않는다. */
const X_NET=30000;
/* 참가 쓰기가 거절된 이유. 상태 코드와 끊김을 나눠, 같은 "참가하지 못했다"로 뭉개지지 않게 한다. */
function xErrKind(e){const name=e&&e.name,m=String(e&&e.message||"");if(m==="timeout"||name==="AbortError"||/abort/i.test(m))return "timeout";if(/^(401|403|400|404|412|413)$/.test(m))return m;if(/^\d{3}$/.test(m))return m;if(m==="offline"||/failed to fetch|networkerror|load failed|offline|network/i.test(m))return "offline";return ""}
const xDown=e=>{const c=xErrKind(e);return c==="timeout"||c==="offline"};
function xNetWhy(e,ms){const c=xErrKind(e);if(c==="timeout")return "서버 응답이 "+Math.round((ms||20000)/1000)+"초 안에 오지 않았다.";if(c==="offline")return "네트워크에 연결되지 않았다.";if(c==="401")return "로그인이 만료되었다. 새로고침한 뒤 다시 로그인해 보자.";if(c==="403")return "서버가 기록을 거절했다. 위쪽 로그인 경고가 있으면 그 안내를 먼저 해결해야 한다.";if(c==="400")return "서버가 기록 형식을 거절했다.";if(c==="404")return "서버에서 출정 자리 주소를 찾지 못했다.";if(c==="412")return "다른 기록과 겹쳐 서버가 저장을 거절했다.";if(c==="413")return "참가 기록이 너무 커서 서버가 거절했다.";if(/^\d{3}$/.test(c))return "서버가 오류 코드 "+c+"로 응답했다.";const raw=String(e&&e.message||"").replace(/\s+/g," ").slice(0,80);return raw?raw:"원인을 확인하지 못했다."}
function xJoinWhy(e,dropped){const lost=dropped?"이전 출정 자리는 지워졌고, ":"";return lost+"참가하지 못했다. "+xNetWhy(e,X_NET)+(xErrKind(e)==="401"?"":" 잠시 뒤에 다시 시도해 보자.")}
function drawX(el){el.innerHTML="";if(!C)return;
 if(!XON()){el.innerHTML="<p class='hint'>"+(LOCAL?"혼자 하기에서는 정기 출정이 열리지 않는다. 서버에 연결해 로그인하면 출정할 수 있다.":"서버에 연결되어야 정기 출정에 참가할 수 있다.")+"</p>";return}
 const now=Date.now(),ls=xLs(),mj=C.mj;el.appendChild(elT("p","x-cd",xCdTxt()));
 if(mj){const x=xInfo(mj.s,mj.i),w=elT("div","xm on"),cp=elT("div","xm-copy"),b=elT("button","chip","보기");cp.append(elT("b","","참가한 출정: "+x.nm),elT("small","",now<x.T0?"출발 "+xHM(x.T0)+" · 출발 시각에 자동으로 출발한다.":"출정 중이다."));b.type="button";b.onclick=xView;w.append(cp,b);el.appendChild(w)}
 for(let i=0;i<XN;i++){const x=xInfo(ls,i),m=xOverlay(x,(ls===xS?xSnap["e"+i]:null)||{}),ids=xParty(x,m),onSrv=ids.includes(UID)&&(!mj||mj.id===x.id),inI=!!(mj&&mj.id===x.id)||onSrv,full=ids.length>=XMAX&&!inI,lock=!!mj&&!inI&&mj.s!==ls;
  const ab=x.d===4,weak=ab&&pw()<ABYSS_MIN&&!inI,w=elT("div","xm"+(inI?" on":"")+(ab?" abyss":"")),cp=elT("div","xm-copy");
  cp.append(elT("b","",(ab?"🜏 ":"")+x.nm),elT("small","",XDF[x.d].n+(ab?" · 보상 2배 · 전투력 "+ABYSS_MIN+" 이상":"")+" · 전투 "+x.total+"번 · 파티 "+ids.length+"/"+XMAX+(ids.length?" · "+ids.map(u=>cn(u,m[u].n)).join(", "):"")));
  const b=elT("button","chip",inI?"참가 취소":full?"정원 마감":lock?"참가 불가":weak?"전투력 부족":mj?"이쪽으로 변경":"참가");b.type="button";b.disabled=full||lock||weak;b.onclick=()=>{if(inI){if(!(C.mj&&C.mj.id===x.id))C.mj={id:x.id,s:x.s,i:x.i,T0:x.T0};xLeave()}else xJoin(ls,i)};w.append(cp,b);el.appendChild(w)}}
async function xJoin(s,i){const x=xInfo(s,i);if(!XON())return;if(lhOn()){toast("장기 토벌을 떠나 있는 동안에는 정기 출정에 참가할 수 없다.");return}if(typeof clueOn==="function"&&clueOn()){toast("단서 탐색을 떠나 있는 동안에는 정기 출정에 참가할 수 없다.");return}
 if(C.fall)return xSay("타락한 동안에는 출정할 수 없다.",1);if(C.dz>=90)return xSay("절망도가 너무 높아 출정할 수 없다. 공명으로 절망도를 낮춘 뒤에 다시 오자.",1);
 if(Date.now()>=x.close)return xSay("이 출정은 참가가 마감되었다.",1);if(x.d===4&&pw()<ABYSS_MIN)return xSay("심연에는 전투력 "+ABYSS_MIN+" 이상만 들어갈 수 있다. (지금 "+pw()+")",1);
 if(C.mj&&xExpired(C.mj))xRelease();
 const mj=C.mj;if(mj&&mj.id===x.id)return;if(mj&&mj.s!==s)return xSay("이미 참가한 출정이 있다. 그 출정이 끝난 뒤에 참가할 수 있다.",1);
 const party=xParty(x,(xS===s?xSnap["e"+i]:null)||{});
 if(party.includes(UID)){C.mj={id:x.id,s,i,T0:x.T0};save();drawXAll();xSay(x.nm+" 출정에 이미 참가해 있다. "+xHM(x.T0)+"에 출발한다.");return}
 if(party.length>=XMAX)return xSay("정원이 찼다.",1);
 const job=++xJob,me0=me(),body=Object.assign({},me0,{jt:{".sv":"timestamp"}});C.mj={id:x.id,s,i,T0:x.T0};xGone=mj?{s:mj.s,i:mj.i,till:Date.now()+X_NET}:null;
 xPend={s,i,id:x.id,body,prev:mj?{s:mj.s,i:mj.i}:null,prevGone:!mj};
 if(xS===s){if(mj&&xSnap["e"+mj.i])delete xSnap["e"+mj.i][UID];(xSnap["e"+i]=xSnap["e"+i]||{})[UID]=Object.assign({},me0,{jt:Date.now()})}
 drawXAll();xSay(x.nm+" 출정에 참가했다. "+xHM(x.T0)+"에 자동으로 출발한다. 준비한 아이템과 마법은 참가한 순간을 기준으로 쓰인다.");
 let dropped=false;
 try{if(mj){await DB.doc(xSeat(mj.s,mj.i)+"/"+UID).delete(X_NET);dropped=true;if(xPend&&xPend.id===x.id)xPend.prevGone=true}
  await DB.doc(xSeat(s,i)+"/"+UID).set(body,X_NET);DB.doc(xSeat(s,i)+"/ts").set(Date.now()).catch(()=>{});
  if(job!==xJob){if(!C.mj||C.mj.id!==x.id)await DB.doc(xSeat(s,i)+"/"+UID).delete().catch(()=>{});return}if(C.mj&&C.mj.pend)delete C.mj.pend;if(xPend&&xPend.id===x.id)xPend=null;save()}
 catch(e){if(job!==xJob)return;if(xDown(e)&&C.mj&&C.mj.id===x.id){C.mj.pend=1;save();xSay(x.nm+" 참가는 이 기기에 남겨 두었다. 연결되면 서버에 올린다.");return}xPend=null;C.mj=dropped?null:mj;xGone=null;if(xS===s&&xSnap["e"+i])delete xSnap["e"+i][UID];save();drawXAll();xSay(xJoinWhy(e,dropped),1)}}
/* 네트워크가 끊겨 참가 기록을 못 올렸어도 신청은 유지한다. 마감 전에 연결되면 같은 자리를 다시 쓴다. */
function xHold(){if(xPend||!C||!C.mj||!C.mj.pend)return xPend;const j=C.mj;xPend={s:j.s,i:j.i,id:j.id,body:Object.assign({},me(),{jt:{".sv":"timestamp"}}),prev:null,prevGone:true};return xPend}
async function xFlush(){const p=xHold();if(!p||!C||!C.mj||C.mj.id!==p.id||!XON()||xFlush.busy)return;const x=xInfo(p.s,p.i);if(Date.now()>=x.close)return;xFlush.busy=true;
 try{if(p.prev&&!p.prevGone){await DB.doc(xSeat(p.prev.s,p.prev.i)+"/"+UID).delete(X_NET);p.prevGone=true}if(xPend!==p||!C.mj||C.mj.id!==p.id)return;
  await DB.doc(xSeat(p.s,p.i)+"/"+UID).set(p.body,X_NET);if(!C.mj||C.mj.id!==p.id){await DB.doc(xSeat(p.s,p.i)+"/"+UID).delete().catch(()=>{});return}
  DB.doc(xSeat(p.s,p.i)+"/ts").set(Date.now()).catch(()=>{});if(C.mj.pend)delete C.mj.pend;if(xPend===p)xPend=null;save();xSay(x.nm+" 출정 참가를 서버에 남겼다. "+xHM(x.T0)+"에 출발한다.")}catch(e){}finally{xFlush.busy=false}}
async function xLeave(){const mj=C.mj;if(!mj||Date.now()>=xInfo(mj.s,mj.i).close)return;const job=++xJob;if(xPend&&xPend.id===mj.id)xPend=null;C.mj=null;xGone={s:mj.s,i:mj.i,till:Date.now()+X_NET};
 if(xS===mj.s&&xSnap["e"+mj.i])delete xSnap["e"+mj.i][UID];save();drawXAll();xSay("출정 참가를 취소했다.");if(!$("#v-xm").hidden)hub();
 try{await DB.doc(xSeat(mj.s,mj.i)+"/"+UID).delete(X_NET)}catch(e){if(job!==xJob)return;C.mj=mj;xGone=null;if(xS===mj.s){(xSnap["e"+mj.i]=xSnap["e"+mj.i]||{})[UID]=Object.assign({},me(),{jt:Date.now()})}save();drawXAll();xSay("참가 취소를 서버에 기록하지 못했다. "+xNetWhy(e,X_NET),1)}}
// 처음부터 다시 계산한다. 같은 씨앗, 같은 파티, 같은 표라면 누구의 화면에서든 결과가 같다.
function xReplay(X){const x=X.x,r={code:x.id,pl:{},total:x.total,seq:[],evs:[],df:XDF[x.d].df,rw:XDF[x.d].rw,dzm:XDF[x.d].dz||1,ab:x.d===4?1:0,zv:x.v},L=[];let wait=null;
 Object.keys(X.pl).forEach(u=>r.pl[u]=X.pl[u]);
 seeded(hs32(x.id+"#sim"),()=>{startSim(r);let c=0;
  while(r.pend&&!r.fin){const xe=EVM[r.pend.id];if(!xe){r.pend=null;simStep(r);continue}
   const cx=evCtx(r),ops=xe.o.map((o,i)=>i).filter(i=>!xe.o[i].req||xe.o[i].req(cx)),h=(cx.tr("번뜩임")||cx.tr("예민함"))?xe.o.findIndex(o=>o.ok):-1,Ws=x.T0+r.seq.length*XSTEP+c*CHOICE_MS;
   L.push(r.seq.length);r.ch={id:r.pend.id,v:r.pend.v,k:c,until:Ws+CHOICE_MS,ops,h};
   if(X.picks[c]==null){wait={c,Ws,Wd:Ws+CHOICE_MS};break}resolveChoice(r,X.picks[c]);c++}});
 const lineAt=j=>x.T0+(j+1)*XSTEP+CHOICE_MS*L.filter(l=>l<=j).length;
 return{r,wait,lineAt,done:!!r.fin&&!wait,endAt:lineAt(r.seq.length-1)+800}}
function xAbandon(why){if(!C)return;const j=C.mj;if(j&&xPend&&xPend.id===j.id)xPend=null;C.mj=null;if(XR){XR.gone=1;XR.why=why}save();note("march",why);drawXAll();xSay(why,1);if(j){xAuto=j.id;if(XON())DB.doc(xSeat(j.s,j.i)+"/"+UID).delete().catch(()=>{})}}
// 끝난 출정에 아직 묶여 있으면 참가를 풀어 준다. 결과를 이미 받았거나, 끝난 뒤 10분이 지났거나, 출발 후 진행 한도와 10분이 지났으면 묶인 것이다.
function xExpired(j){if(!j)return false;const s=Number(j.s),i=Number(j.i),T0=Number(j.T0);if(!Number.isFinite(s)||!Number.isFinite(i)||!Number.isFinite(T0))return true;
 if(XR&&XR.id===j.id&&XR.fin)return true;if(XR&&XR.id===j.id&&XR.res&&XR.res.done&&Number.isFinite(XR.res.endAt)&&Date.now()>=XR.res.endAt+X_AFTER)return true;return Date.now()>=T0+X_RUN_MAX+X_AFTER}
function xRelease(why){const j=C&&C.mj;if(!j||!C)return;const s=Number(j.s),i=Number(j.i),id=j.id;if(xPend&&xPend.id===id)xPend=null;C.mj=null;if(XR&&XR.id===id)XR=null;if(why){note("march",why);xSay(why,1)}save();drawXAll();if(XON()&&Number.isFinite(s)&&Number.isFinite(i))DB.doc(xSeat(s,i)+"/"+UID).delete().catch(()=>{})}
function xMarkDone(s,i){if(!XON()||!Number.isFinite(Number(s))||!Number.isFinite(Number(i)))return;const seat=xSeat(s,i);DB.doc(seat+"/done").transact(c=>{if(typeof c==="number"&&c>0)return;return Date.now()}).catch(()=>{});setTimeout(()=>{DB.doc(seat).delete().catch(()=>{})},X_AFTER)}
/* 출발 시각에 내 자리가 파티에 없는 이유. 기록 없음, 마감 이후 기록, 정원 초과를 구분한다. */
function xSeatMiss(x,d){const mine=d&&d[UID];if(!mine||typeof mine!=="object")return x.nm+" 출정 자리를 서버에서 찾지 못했다. 참가가 저장되지 않았거나 출발 전에 지워져 출발하지 못했다.";if(jtOf(mine)>x.close)return x.nm+" 출정은 서버에 기록된 참가 시각이 마감("+xHM(x.close)+") 이후라 출발하지 못했다. 마감 전에 눌렀다면 기기 시각이 서버보다 느린지 확인해 보자.";return "마감 전에 먼저 참가한 "+XMAX+"명이 차서 "+x.nm+" 출정에 들어가지 못했다. 이번 출정은 정원 "+XMAX+"명이다."}
/* 진행 중 표시(xBusy)가 40초 넘게 풀리지 않으면 멈춘 것으로 보고 풀어 준다(새로고침 없이 출정이 다시 진행된다). */
let xBusyT=0;
async function xTick(){const j=C&&C.mj;if(xBusy&&Date.now()-xBusyT>40000)xBusy=false;if(!j||!XON()||xBusy||Date.now()<j.T0)return;
 if(XR&&XR.id===j.id&&XR.res&&XR.res.wait&&Date.now()<XR.res.wait.Wd+3000)return;xBusy=true;xBusyT=Date.now();
 try{const x=xInfo(j.s,j.i),late=Date.now()-x.T0;if(!XR||XR.id!==x.id)XR={id:x.id,x,pl:null,picks:[],fin:"",drawn:-1};
  if(late>X_HARD_LIMIT&&!XR.fin){xAbandon(x.nm+" 출정이 너무 오래 끝나지 않아 정리했다. 다시 참가할 수 있다.");return}
  if(!XR.pl){let d=null;try{d=(await DB.doc(xSeat(x.s,x.i)).get()).data()||{}}catch(e){if(late>X_FETCH_GIVEUP)xAbandon(x.nm+" 출정 자리를 불러오지 못해 출발하지 못했다. "+xNetWhy(e)+" 잠시 뒤에 다시 참가해 보자.");return}
   const ids=xParty(x,d);
   if(!ids.includes(UID)){xHold();if(xPend&&xPend.id===j.id&&late<=X_FETCH_GIVEUP)return;if(xPend&&xPend.id===j.id)xPend=null;xAbandon(xSeatMiss(x,d));return}
   if(xPend&&xPend.id===j.id)xPend=null;
   XR.pl={};ids.forEach(u=>XR.pl[u]=d[u]);
   // 파티가 확정되어 실제로 출발하는 순간 한 번만 알린다(새로고침해도 다시 울리지 않는다).
   if(!j.st){j.st=1;save();xSound("start");toast("⚑ "+x.nm+" 출정 출발! 파티와 함께 마수를 향해 나아간다.")}}
  let R0=xReplay(XR);
  if(R0.wait&&Date.now()>=R0.wait.Wd+3000){let p=[];
   try{const body=(await DB.doc(xVote(x.id,R0.wait.c)).get()).data()||{};Object.keys(body).forEach(id=>{const v=body[id];if(!v||typeof v!=="object"||!XR.pl[id])return;if(typeof v.ts==="number"&&v.ts>R0.wait.Wd+1000)return;p.push(Number(v.i))})}
   catch(e){if(Date.now()<R0.wait.Wd+X_VOTE_GIVEUP)return;p=[]}// 표를 끝내 못 읽으면 운명에 맡기고 계속 진행한다.
   XR.picks[R0.wait.c]=p;R0=xReplay(XR)}
  XR.res=R0;
  if(R0.done&&Date.now()>=R0.endAt&&!XR.fin){let h="";try{h=settle(R0.r)}catch(e){h="<p>결과를 정리하는 중에 문제가 생겼다.</p>"}XR.fin=h||"<p>이미 결과를 받은 출정이다.</p>";const ss=x.s,ii=x.i;C.mj=null;save();drawXAll();xMarkDone(ss,ii);if(h)xSound(R0.r&&R0.r.ok?"win":"lose")}}
 catch(e){}finally{xBusy=false}}
function xView(){show("xm");xChK="";$("#xpl").dataset.k="";if(XR)XR.drawn=-1;xRender()}
function xRender(){if($("#v-xm").hidden)return;const now=Date.now(),mj=C.mj,X=XR&&(!mj||XR.id===mj.id)?XR:null,x=X?X.x:mj?xInfo(mj.s,mj.i):null;if(!x){hub();return}
 const stuck=!!mj&&!(X&&X.fin)&&now>=x.T0&&(X&&X.res?now>X.res.endAt+60000:now>x.T0+180000);$("#xq").hidden=!stuck;
 $("#xt").textContent=x.nm+" · "+XDF[x.d].n;
 const pl=X&&X.pl?X.pl:xOverlay(x,(xS===x.s&&xSnap["e"+x.i])||{}),ids=X&&X.pl?Object.keys(pl):xParty(x,pl),l=$("#xpl"),key=ids.join(",");
 if(l.dataset.k!==key){l.dataset.k=key;l.innerHTML="";ids.forEach(u=>{const p=pl[u]||{},d=elT("div","chip",(p.tn?"「"+String(p.tn).slice(0,20)+"」 ":"")+cn(u,p.n)+(u===UID?" (나)":"")+" · "+(p.g||"-")+"등급 "+(p.a||"")+" · 전투력 "+(p.p||0));d.style.textAlign="left";if(u!==UID){d.style.cursor="pointer";d.onclick=()=>openProfile(u)}l.appendChild(d)})}
 const g=$("#xlg"),cv=$("#xch");
 if(!X||!X.res){const why=X&&X.gone?(X.why||"이번 출정에는 참가하지 못했다."):"";$("#xs").textContent=why||(now<x.T0?"전투 "+x.total+"번 예정 · "+(now<x.close?"마감까지 "+xFmt(x.close-now)+" · ":"참가 마감 · ")+"출발까지 "+xFmt(x.T0-now):"출발 준비 중...");
  const mark=why?"g":"1";if(g.dataset.w!==mark){g.dataset.w=mark;g.innerHTML="";g.appendChild(elT("p","",why||"출발을 기다리고 있다."))}cv.hidden=true;return}
 g.dataset.w="";const R0=X.res,r=R0.r,w=R0.wait;let n=0;while(n<r.seq.length&&R0.lineAt(n)<=now)n++;
 if(X.drawn!==n||X.fd!==!!X.fin){X.drawn=n;X.fd=!!X.fin;g.innerHTML=r.seq.slice(0,n).map(t=>"<p>"+t+"</p>").join("")||"<p>출발한다...</p>";if(X.fin&&n>=r.seq.length)g.innerHTML+=X.fin}
 $("#xs").textContent=X.fin?"출정 종료":w&&n>=r.seq.length?(now<w.Wd?"선택의 순간":"표를 세는 중"):"출정 중";
 if(w&&n>=r.seq.length&&now<w.Wd&&X.pl[UID]&&EVM[r.ch.id]){const k=x.id+"_"+w.c;
  if(xChK!==k){xChK=k;xMyV=null;cv.hidden=false;cv.innerHTML="";const xe=EVM[r.ch.id];cv.appendChild(elT("p","choice-q",vtx(xe.q,r.ch.v)));const row=elT("div","row");
   r.ch.ops.forEach(i=>{const o=xe.o[i],b=elT("button","chip",o.l+(o.rl?" ("+o.rl+")":"")+(r.ch.h===i?" ✦":""));b.type="button";b.setAttribute("aria-pressed","false");
    b.onclick=async()=>{if(Date.now()>=w.Wd)return;xMyV=i;row.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",c===b?"true":"false"));try{await DB.doc(xVote(x.id,w.c)+"/"+UID).set({i,ts:{".sv":"timestamp"}});DB.doc(xVote(x.id,w.c)+"/ts").set(Date.now()).catch(()=>{})}catch(e){}};row.appendChild(b)});
   cv.appendChild(row);if(r.ch.h>=0)cv.appendChild(elT("p","hint","✦ 파티의 직감(번뜩임·예민함)이 답을 속삭인다."));cv.appendChild(elT("p","hint x-ct",""))}
  const t=cv.querySelector(".x-ct");if(t)t.textContent=(xMyV!=null?"선택했다. ":"")+"남은 시간 "+Math.max(0,Math.ceil((w.Wd-now)/1000))+"초 · 파티원이 함께 고른다. 표가 갈리면 무작위로 정해진다."}
 else{cv.hidden=true;xChK=""}}
$("#xb").onclick=()=>hub();
// 출정이 멈춘 것처럼 보이면(예정보다 1분 넘게 안 끝나거나, 출발 후 3분째 준비 중) 직접 정리할 수 있다.
$("#xq").onclick=()=>{if(!confirm("이 출정을 정리하고 빠져나올까? 이번 출정의 보상은 받지 못한다."))return;xAbandon("출정을 직접 정리하고 빠져나왔다.");hub()};
// 오래된 출정 자리. rooms 전체를 다시 받지 않고, sweepRooms 가 넘겨 준 키만 지운다.
// 끝난 시각이 있으면 그로부터 10분 뒤에, 없으면 출발 후 진행 한도+10분이 지나면 자리와 표 기록을 지운다.
function xSweep(keys){if(!XON()||!keys||!keys.length)return;const now=Date.now();
 keys.forEach(id=>{const xm=String(id).match(/^xm(\d+)_e\d+$/),xv=String(id).match(/^xvx(\d+)_/),s=xm?Number(xm[1]):xv?Number(xv[1]):NaN;if(!Number.isFinite(s))return;const T0=(s+1)*XS;
  if(now>=T0+X_RUN_MAX+X_AFTER){DB.doc("rooms/"+id).delete().catch(()=>{});return}
  if(!xm||now<T0)return;DB.doc("rooms/"+id).get().then(sn=>{const v=sn&&sn.exists?sn.data():null,done=Number(v&&v.done)||0;if(done&&now-done>=X_AFTER)DB.doc("rooms/"+id).delete().catch(()=>{})}).catch(()=>{})})}
setInterval(()=>{if(!C||!DB)return;const now=Date.now(),hubOn=!$("#v-hub").hidden,rmOn=!$("#v-rooms").hidden,xOn=!$("#v-xm").hidden;
 if(C.mj&&xExpired(C.mj)){const fin=XR&&XR.id===C.mj.id&&XR.fin;xRelease(fin?"출정 결과가 정리되어 다시 참가할 수 있다.":"지난 출정이 끝난 뒤 10분이 지나 자리를 정리했다. 다시 참가할 수 있다.")}
 if((xPend||(C.mj&&C.mj.pend))&&(!xFlush.at||now-xFlush.at>=5000)){xFlush.at=now;xFlush()}
 if(XON()&&(hubOn||rmOn||xOn)){watchX(xOn&&C.mj&&now<C.mj.T0?C.mj.s:xLs());const ph=xLs()+"_"+(C.mj?C.mj.id+(now>=C.mj.T0):"");if(ph!==xPh){xPh=ph;drawXAll()}document.querySelectorAll(".x-cd").forEach(e=>e.textContent=xCdTxt())}
 else if(unX){unX();unX=null;xS=-1}
 if(C.mj&&now>=C.mj.T0&&xAuto!==C.mj.id&&(hubOn||rmOn)){xAuto=C.mj.id;xView()}
 xTick().then(xRender)},1000);
function xSound(k){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const a=ding.c||(ding.c=new A());if(a.state==="suspended")a.resume();const t0=a.currentTime+.02;
 (XSND[k]||[]).forEach(([f,st,du])=>{const o=a.createOscillator(),g=a.createGain();o.type="triangle";o.frequency.setValueAtTime(f,t0+st);g.gain.setValueAtTime(.0001,t0+st);g.gain.exponentialRampToValueAtTime(.16,t0+st+.02);g.gain.exponentialRampToValueAtTime(.0001,t0+st+du);o.connect(g);g.connect(a.destination);o.start(t0+st);o.stop(t0+st+du+.05)})}catch(e){}}
