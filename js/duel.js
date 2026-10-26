/* 대련. main.js 다음에 불러야 한다. 대련장, 신청과 수락, 수 고르기, 구인 게시판, 대련 이벤트.
   마을 화면은 duWatch 를, 메뉴와 프로필은 arena, duChallenge 를, 주기 확인은 devClaim, duPoll 을 그대로 부른다. */
let unDu=null,DUI=[],duVer={},duBusy=false;
// 대련 중 표시: 대련을 시작하면 내 플레이어 기록에 시작 시각(db)을 남기고, 끝나면 0으로 지운다.
// 표시가 DU_BUSY(30분)보다 오래되면(창을 그냥 닫은 경우 등) 대련 중이 아닌 것으로 본다.
const duOn=()=>!!(C&&C.du&&!C.du.fin),duBusyOf=p=>!!p&&Number(p.db)>0&&Date.now()-Number(p.db)<DU_BUSY;
function duMark(){if(!DB||!AUTH.uid)return;DB.doc("players/"+UID+"/db").set(duOn()?(C.du.t0||Date.now()):0).catch(()=>{})}
const duEl=()=>DU_SPS[(C&&C.a&&C.a[0])]?C.a[0]:"불";
async function duHash(t){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
const duArr=v=>Array.isArray(v)?v:v&&typeof v==="object"?Object.keys(v).sort((a,b)=>a-b).map(k=>v[k]):[];
// 두 사람의 공개된 수를 처음부터 다시 따라가며 지금 상태를 계산한다(새로고침해도 똑같이 나온다).
function duReplay(me,op){const S=[{hp:DU_HP,mp:DU_MP0,sp:0,e:DU_SPS[me.e]?me.e:"불"},{hp:DU_HP,mp:DU_MP0,sp:0,e:DU_SPS[op.e]?op.e:"불"}],La=duArr(me.L),Lb=duArr(op.L),n=Math.min(La.length,Lb.length,DU_ROUNDS),log=[];
 for(let i=0;i<n;i++){const act=[La[i],Lb[i]].map((a,k)=>{const s=S[k];if(!DU_ACT[a])return"foc";if(a==="mag"&&s.mp<DU_MAG)return"foc";if(a==="sp"&&(s.sp||s.mp<DU_SP))return"foc";return a});
  // 비기를 쓰는 쪽은 무방비(집중과 같은 처지)로 보고 기본 피해를 계산한다.
  const ef=act.map(a=>a==="sp"?"foc":a),dm=[0,1].map(k=>DU_TAKE[ef[k]][ef[1-k]]);
  const txt=[];[0,1].forEach(k=>{if(act[k]!=="sp")return;const sp=DU_SPS[S[k].e][1];if(sp.ev||sp.gd)dm[k]=0});
  [0,1].forEach(k=>{if(act[k]!=="sp")return;const s=DU_SPS[S[k].e],sp=s[1];if(!(act[1-k]==="sp"&&DU_SPS[S[1-k].e][1].gd))dm[1-k]+=sp.d||0;if(sp.h)S[k].hp=Math.min(DU_HP,S[k].hp+sp.h);txt.push((k?"상대":"나")+"의 비기 「"+s[0]+"」!")});
  [0,1].forEach(k=>{const s=S[k],a=act[k];if(a==="foc")s.mp=Math.min(DU_MPMAX,s.mp+DU_FOC);if(a==="mag")s.mp-=DU_MAG;if(a==="sp"){s.mp-=DU_SP;s.sp=1}s.hp-=dm[k]});
  [0,1].forEach(k=>{if(act[k]==="sp"&&DU_SPS[S[k].e][1].dr)S[1-k].mp=0});
  log.push({r:i+1,a:act,d:dm,t:txt.join(" ")});if(S[0].hp<=0||S[1].hp<=0)break}
 const r=log.length,over=S[0].hp<=0||S[1].hp<=0||r>=DU_ROUNDS;let win=0;if(over)win=S[0].hp>S[1].hp?1:S[0].hp<S[1].hp?-1:0;return{S,log,r,over,win}}
function duAvail(){return ONL.filter(p=>p.u!==UID)}
async function duChallenge(u,n){if(!C||!XON()||!u||u===UID)return;if(C.fall){toast("타락한 동안에는 대련할 수 없다.");return}if(C.du&&!C.du.fin){toast("이미 대련 중이다.");arena();return}
 try{const ps=await DB.doc("players/"+u).get(),pp=ps.data();if(duBusyOf(pp)){toast(String(n||"상대")+"님은 지금 다른 대련 중이다. 끝난 뒤에 다시 신청하자.");return}}catch(e){}
 const mid=UID+"_"+u+"_"+Date.now().toString(36);C.du={mid,o:u,on:String(n||"상대").slice(0,20),t0:Date.now(),ch:1};save();
 try{await DB.doc("rooms/xb"+mid+"/"+UID).set({n:nmOf(),e:duEl(),ts:Date.now()});await DB.doc("rooms/xa"+u+"/"+UID).set({n:nmOf(),mid,e:duEl(),ts:Date.now()})}
 catch(e){C.du=null;save();toast("대련을 신청하지 못했다. 인터넷 연결을 확인하자.");return}
 duMark();note("duel",C.du.on+"님에게 대련을 신청했다.");arena()}
async function duAccept(inv){if(!C||C.fall)return toast("타락한 동안에는 대련할 수 없다.");if(C.du&&!C.du.fin)return toast("이미 대련 중이다.");
 C.du={mid:inv.mid,o:inv.u,on:String(inv.n||"상대").slice(0,20),t0:Date.now()};C.duSeen=keepIds(C.duSeen,inv.mid);save();DUI=DUI.filter(x=>x.mid!==inv.mid);
 try{await DB.doc("rooms/xb"+inv.mid+"/"+UID).set({n:nmOf(),e:duEl(),ts:Date.now()})}catch(e){C.du=null;save();toast("대련에 들어가지 못했다.");return}duMark();arena()}
/* 내가 보낸 대련 신청 지우기: 그 사이 같은 상대에게 새로 신청했으면(재대결) 새 신청은 지우지 않는다.
   예전에는 대련이 끝나고 15초 뒤에 '보낸 신청'을 무조건 지워서, 곧바로 다시 신청한 재대결 신청이 상대에게서 사라졌다. */
async function duDelInv(o,mid){try{const v=(await DB.doc("rooms/xa"+o+"/"+UID).get()).data();if(v&&v.mid===mid)await DB.doc("rooms/xa"+o+"/"+UID).delete()}catch(e){}}
function duLeave(){const d=C.du;if(!d)return;if(unDu){unDu();unDu=null}DB.doc("rooms/xb"+d.mid+"/"+UID).delete().catch(()=>{});if(d.ch)duDelInv(d.o,d.mid);C.du=null;save();duMark();arena()}
async function duWrite(me){me.ts=Date.now();await DB.doc("rooms/xb"+C.du.mid+"/"+UID).set(me)}
async function duPick(a){const d=C.du;if(!d||duBusy)return;const me=Object.assign({},d.me||{}),r=duArr(me.L).length;if(duArr(me.H).length>r)return;duBusy=true;
 try{const s=Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2),h=await duHash(a+"|"+s+"|"+r+"|"+d.mid);d.p={r,a,s};save();
  me.H=duArr(me.H).concat(h);me.L=duArr(me.L);me.S=duArr(me.S);me.n=nmOf();me.e=duEl();await duWrite(me);d.me=me;$("#dum").textContent=""}catch(e){$("#dum").style.color="var(--bad)";$("#dum").textContent="수를 올리지 못했다. 다시 눌러 보자."}finally{duBusy=false}duDraw()}
// 상대가 공개한 수가 봉인과 맞는지 확인한다. 맞지 않으면 속임수로 보고 내가 이긴다.
async function duVerify(op){const L=duArr(op.L),S=duArr(op.S),H=duArr(op.H),k=C.du.mid;duVer[k]=duVer[k]||0;
 for(let i=duVer[k];i<L.length;i++){if((await duHash(L[i]+"|"+S[i]+"|"+i+"|"+C.du.mid))!==H[i])return false;duVer[k]=i+1}return true}
async function duTick(data){const d=C&&C.du;if(!d||d.fin)return duDraw();const me=(data||{})[UID],op=(data||{})[d.o];d.me=me||d.me;d.op=op||null;
 if(op&&!(await duVerify(op)))return duFinish(1,"상대의 수가 봉인과 맞지 않는다. 속임수로 판정되어 이겼다.");
 if(op&&op.busy&&!duArr(op.H).length){toast(d.on+"님은 지금 다른 대련 중이라 신청이 취소되었다.");note("duel",d.on+"님은 다른 대련 중이라 신청이 취소되었다.");duLeave();return}
 if(op&&op.gv)return duFinish(1,d.on+"님이 기권했다.");
 if(me&&op){const r=duArr(me.L).length;if(duArr(me.H).length===r+1&&duArr(op.H).length>=r+1&&d.p&&d.p.r===r){const m2=Object.assign({},me,{L:duArr(me.L).concat(d.p.a),S:duArr(me.S).concat(d.p.s)});try{await duWrite(m2);d.me=m2}catch(e){}}
  const R=duReplay(d.me,op);if(R.over)return duFinish(R.win,R.win>0?"승리!":R.win<0?"패배.":"무승부.")}
 duDraw()}
const devOn=()=>Date.now()>=DEV.t0&&Date.now()<DEV.t1;
function devAdd(win,o){if(!devOn()||!C||!o)return 0;if(!C.dev||C.dev.id!==DEV.id)C.dev={id:DEV.id,pt:0,w:0,n:0,t:0,pp:{}};const day=today();if(!C.dev.pp||C.dev.pp.d!==day)C.dev.pp={d:day};
 const used=C.dev.pp[o]||0;if(used>=DEV.PAIR)return 0;C.dev.pp[o]=used+1;const p=win>0?DEV.PT.w:win<0?DEV.PT.l:DEV.PT.d;C.dev.pt+=p;C.dev.n++;if(win>0)C.dev.w++;C.dev.t=Date.now();return p}
// 순위: 점수 → 승리 수 → 먼저 그 점수에 도달한 사람 순.
async function devRank(maxAge){let docs=[];try{docs=(await plAll(maxAge)).docs}catch(e){}const L=[];docs.forEach(x=>{const p=x.data();if(p&&p.ev&&p.ev.id===DEV.id&&Number(p.ev.pt)>0)L.push({u:x.id,n:p.n,pt:Number(p.ev.pt)||0,w:Number(p.ev.w)||0,c:Number(p.ev.n)||0,t:Number(p.ev.t)||0})});
 if(C&&C.dev&&C.dev.id===DEV.id&&C.dev.pt>0){const me=L.find(x=>x.u===UID),mine={u:UID,n:C.n,pt:C.dev.pt,w:C.dev.w,c:C.dev.n,t:C.dev.t};if(me)Object.assign(me,mine);else L.push(mine)}
 return L.sort((a,b)=>b.pt-a.pt||b.w-a.w||a.t-b.t)}
const devRwTxt=r=>"골드 "+r.g+(r.m?", 마력석 "+r.m:"");
let devBusy=false;
async function devClaim(){if(!C||!AUTH.uid||devBusy||Date.now()<DEV.t1+DEV.GRACE)return;C.cmp=C.cmp||{};const k=DEV.id+"-rw";if(C.cmp[k])return;devBusy=true;try{
 const mine=C.dev&&C.dev.id===DEV.id?C.dev:null;if(!mine||!mine.n){C.cmp[k]=-1;save();return}
 const L=await devRank(0);if(!L.length)return;const i=L.findIndex(x=>x.u===UID),rk=i+1;C.cmp[k]=Date.now();const got=[];
 if(rk>=1&&rk<=DEV.RW.length){const r=DEV.RW[rk-1];giveRw(r);C.devR=rk;got.push(rk+"위 보상: "+devRwTxt(r))}
 if(mine.n>=DEV.JOIN.n){giveRw({g:DEV.JOIN.g});got.push("참가 보상: 골드 "+DEV.JOIN.g)}
 save();regPlayer();checkTitles();if(got.length){note("duel",DEV.nm+" 결과 "+(rk?rk+"위":"")+" · "+got.join(" · "));setTimeout(()=>alertBox("⚔ "+DEV.nm+" 결과","최종 순위: "+(rk>0?rk+"위":"순위 밖")+" (점수 "+mine.pt+")\n\n"+got.join("\n")),700)}}finally{devBusy=false}}
function devLeft(){const ms=DEV.t1-Date.now(),h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000);return h>=24?Math.floor(h/24)+"일 "+(h%24)+"시간":h>0?h+"시간 "+m+"분":m+"분"}
async function devDraw(){const box=$("#dev");if(!box||!C)return;const now=Date.now();if(now<DEV.t0||now>DEV.t1+7*86400000){box.innerHTML="";return}
 const L=await devRank(30000);if($("#v-arena").hidden)return;box.innerHTML="";const c=elT("div","card");c.style.marginBottom="14px";const end=new Date(DEV.t1-1);
 c.append(elT("h2","","⚔ "+DEV.nm+(devOn()?" 진행 중":" 종료")),elT("p","hint",(devOn()?"남은 시간 "+devLeft()+" · ":"")+(end.getMonth()+1)+"월 "+end.getDate()+"일 밤 12시까지. 승리 "+DEV.PT.w+"점 · 무승부 "+DEV.PT.d+"점 · 패배 "+DEV.PT.l+"점. 같은 상대와는 하루 "+DEV.PAIR+"번까지만 점수가 된다."));
 const rw=elT("p","boss-info",DEV.RW.map((r,i)=>(i+1)+"위 "+devRwTxt(r)).join(" · ")+" · "+DEV.JOIN.n+"판 이상 참가 시 골드 "+DEV.JOIN.g+" · 1위는 칭호 「대련장의 별」, 5위 안은 「대련 이벤트 입상」");c.appendChild(rw);
 const top=L.slice(0,5);if(!top.length)c.appendChild(elT("p","hint","아직 점수를 낸 사람이 없다. 첫 대련의 주인공이 되자!"));
 top.forEach((x,i)=>{const r=elT("div","dq"+(x.u===UID?" done":"")),cp=elT("div","dq-copy");cp.append(elT("b","",["🥇","🥈","🥉","4위","5위"][i]+" "+cn(x.u,x.n)),elT("small","",x.pt+"점 · "+x.w+"승 / "+x.c+"판"));r.appendChild(cp);r.style.cursor="pointer";r.onclick=()=>openProfile(x.u);c.appendChild(r)});
 const mi=L.findIndex(x=>x.u===UID);c.appendChild(elT("p","boss-info","내 기록: "+(mi>=0?(mi+1)+"위 · "+L[mi].pt+"점 · "+L[mi].w+"승 / "+L[mi].c+"판":"아직 점수가 없다")+(Date.now()>=DEV.t1&&Date.now()<DEV.t1+DEV.GRACE?" · 순위 확정까지 잠시 기다리는 중":"")));
 box.appendChild(c)}
function duFinish(win,why){const d=C.du;if(!d||d.fin)return duDraw();d.fin=1;d.res={win,why};const day=today();if(!C.duD||C.duD.d!==day)C.duD={d:day,n:0};let rw=0;
 if(C.duD.n<DU_DAY){C.duD.n++;rw=win>0?DU_RW.w:DU_RW.l;C.gd=(C.gd||0)+rw}d.rw=rw;titleState();if(win>0)C.stats.duW=(C.stats.duW||0)+1;else if(win<0)C.stats.duL=(C.stats.duL||0)+1;else C.stats.duD=(C.stats.duD||0)+1;
 const ep=devAdd(win,d.o);note("duel",d.on+"님과의 대련: "+why+(rw?" (골드 +"+rw+")":"")+(ep?" · 이벤트 점수 +"+ep:""));save();duMark();regPlayer();checkTitles();if(unDu){unDu();unDu=null}
 setTimeout(()=>{DB.doc("rooms/xb"+d.mid+"/"+UID).delete().catch(()=>{});if(d.ch)duDelInv(d.o,d.mid)},15000);duDraw()}
function duGiveUp(){const d=C.du;if(!d||d.fin||!confirm("기권할까? 패배로 기록된다."))return;const me=Object.assign({},d.me||{},{gv:1});duWrite(me).catch(()=>{});duFinish(-1,"기권했다.")}
function duWatch(){if(unDu){unDu();unDu=null}const d=C&&C.du;if(!d||d.fin||!DB)return;const mid=d.mid;unDu=DB.doc("rooms/xb"+mid).onSnapshot(s=>{if(C.du&&C.du.mid===mid)duTick(s.data()||{})},()=>{},POLL_FAST)}
// 받은 대련 신청 확인(6초마다)
async function duPoll(){if(!C||!XON()||!AUTH.uid)return;try{const s=await DB.doc("rooms/xa"+UID).get(),v=s.data()||{},now=Date.now();
 DUI=Object.keys(v).filter(k=>k!=="ts"&&v[k]&&typeof v[k]==="object"&&v[k].mid&&now-(Number(v[k].ts)||0)<DU_INV&&!(C.duSeen&&C.duSeen[v[k].mid])).map(k=>Object.assign({u:k},v[k]));
 // 대련 중에는 새 신청을 받지 않는다. 보낸 사람에게 '대련 중'이라고 답해 두면 그쪽 신청이 바로 취소된다.
 if(duOn()){DUI.filter(x=>x.mid!==C.du.mid).forEach(x=>{C.duSeen=keepIds(C.duSeen,x.mid);DB.doc("rooms/xb"+x.mid+"/"+UID).set({busy:1,n:nmOf(),ts:Date.now()}).then(()=>setTimeout(()=>DB.doc("rooms/xb"+x.mid+"/"+UID).delete().catch(()=>{}),180000)).catch(()=>{})});if(DUI.length)save();DUI=[]}
 DUI.forEach(x=>{const key="i_"+x.mid;if(!(C.duNt&&C.duNt[key])){C.duNt=keepIds(C.duNt,key);note("duel",String(x.n||"누군가")+"님이 대련을 신청했다! 대련장에서 받을 수 있다.");toast("⚔ "+String(x.n||"누군가")+"님의 대련 신청! (2분 안에 수락)");ding();save()}});
 updNav();const sig=DUI.map(x=>x.mid).join(",");if(sig!==duSig){duSig=sig;if(!$("#v-arena").hidden&&!(C.du&&!C.du.fin)&&!duFoc)duDraw()}}catch(e){}}
setInterval(()=>{if(!document.hidden||duOn())duPoll()},10000);
function arena(){show("arena");$("#dum").textContent="";devDraw();duDraw();duPoll();if(C.du&&!C.du.fin)duWatch();dubT=0;duBoard();duRecLoad(true)}
let duQ="",duFoc=false,duRulesOpen=false,duSig="";
// 검색 결과만 다시 그린다(입력칸은 그대로 두어 글자를 치는 중에 끊기지 않게).
function duFind(){const gl=$("#dusr");if(!gl||!C)return;gl.innerHTML="";const q=duQ.trim().toLowerCase();
 if(!q){gl.appendChild(elT("p","hint","찾고 싶은 마법소녀의 이름을 입력하자. 프로필 창의 '대련 신청'으로도 신청할 수 있다."));return}
 if(!DUP.length){gl.appendChild(elT("p","hint","플레이어 목록을 불러오는 중…"));return}
 const hit=DUP.filter(p=>p.u!==UID&&String(p.n||"").toLowerCase().includes(q)).sort((a,b)=>(isOn(b)-isOn(a))||String(a.n||"").localeCompare(String(b.n||""),"ko")).slice(0,20);
 if(!hit.length){gl.appendChild(elT("p","hint","'"+duQ.trim()+"'(이)라는 이름을 찾지 못했다."));return}
 hit.forEach(p=>{const on=isOn(p),bz=duBusyOf(p),b=elT("button","chip du-cand"+(on?" on":""));b.type="button";b.append(elT("b","",(on?"● ":"○ ")+cn(p.u,p.n)),elT("small","",(p.g||"?")+"등급 · "+String(p.a||"").split(" · ")[0]+" 속성 · "+(bz?"⚔ 대련 중":on?"접속 중":"접속 안 함")));
  b.disabled=!!C.fall||bz||duOn();b.onclick=()=>{if(!on&&!confirm(String(p.n||"상대")+"님은 지금 접속 중이 아니다. 신청은 2분 안에 수락하지 않으면 사라진다. 그래도 신청할까?"))return;duChallenge(p.u,p.n)};gl.appendChild(b)})}
document.addEventListener("focusin",e=>{if(e.target&&(e.target.id==="dusq"||e.target.id==="durm"))duFoc=true});document.addEventListener("focusout",e=>{if(e.target&&(e.target.id==="dusq"||e.target.id==="durm"))setTimeout(()=>{const a=document.activeElement;duFoc=!!a&&(a.id==="dusq"||a.id==="durm")},0)});let DUR=[],durT=0,duRM="",durBusy=false;
async function duRecLoad(force){if(!C||!XON()||durBusy)return;if(!force&&Date.now()-durT<15000)return;durBusy=true;durT=Date.now();
 try{const v=(await DB.doc("rooms/xr").get()).data()||{},now=Date.now();DUR=Object.keys(v).filter(k=>k!=="ts"&&v[k]&&typeof v[k]==="object"&&now-(Number(v[k].ts)||0)<DUR_TTL).map(k=>Object.assign({u:k},v[k])).sort((a,b)=>b.ts-a.ts)}catch(e){}finally{durBusy=false}duRecDraw()}
const duRecMine=()=>DUR.find(x=>x.u===UID);
async function duRecPost(){if(!C||!XON())return;if(C.fall){toast("타락한 동안에는 대련할 수 없다.");return}const m=String(duRM||"").trim().slice(0,DUR_MSG),d={n:nmOf(),e:duEl(),g:C.g,m,ts:Date.now()};
 try{await DB.doc("rooms/xr/"+UID).set(d);DUR=DUR.filter(x=>x.u!==UID);DUR.unshift(Object.assign({u:UID},d));duRM="";toast("⚔ 대련 구인 게시판에 이름을 올렸다. (2시간 동안 보인다)")}catch(e){toast("이름을 올리지 못했다. 인터넷 연결을 확인하자.")}duRecDraw()}
async function duRecDown(){try{await DB.doc("rooms/xr/"+UID).delete();DUR=DUR.filter(x=>x.u!==UID);toast("대련 구인 게시판에서 이름을 내렸다.")}catch(e){toast("이름을 내리지 못했다.")}duRecDraw()}
function duRecDraw(){const rb=$("#durb");if(!rb||!C)return;const keepF=document.activeElement&&document.activeElement.id==="durm";rb.innerHTML="";const mine=duRecMine(),now=Date.now();
 const me=elT("div","du-rec-me");
 if(mine){me.append(elT("p","hint","✓ 내 이름이 올라가 있다 · "+agoTxt(mine.ts)+(mine.m?" · 「"+mine.m+"」":"")+" · 약 "+Math.max(1,Math.ceil((DUR_TTL-(now-mine.ts))/60000))+"분 뒤 자동으로 내려간다"));const row=elT("div","row");
  const up=elT("button","chip","다시 올리기 (시간 연장)");up.type="button";up.onclick=()=>{duRM=mine.m||"";duRecPost()};const dn=elT("button","chip","내리기");dn.type="button";dn.onclick=duRecDown;row.append(up,dn);me.appendChild(row)}
 else{const f=elT("form","row");f.style.flexWrap="nowrap";const i=elT("input");i.type="text";i.id="durm";i.maxLength=DUR_MSG;i.placeholder="한마디 (선택, 예: 빛 속성 환영!)";i.setAttribute("aria-label","대련 구인 한마디");i.value=duRM;i.style.flex="1";i.oninput=()=>{duRM=i.value};
  const b=elT("button","btn","이름 올리기");b.type="submit";b.style.cssText="width:auto;margin:0;padding:9px 14px";b.disabled=!!C.fall;f.append(i,b);f.onsubmit=e=>{e.preventDefault();duRecPost()};me.appendChild(f);if(keepF)setTimeout(()=>{i.focus();i.setSelectionRange(i.value.length,i.value.length)})}
 rb.appendChild(me);const others=DUR.filter(x=>x.u!==UID);
 if(!others.length){rb.appendChild(elT("p","hint","지금 대련 상대를 찾는 사람이 없다. 이름을 올려 두면 다른 사람이 신청할 수 있다."));return}
 const pmap={};(typeof DUP!=="undefined"?DUP:[]).forEach(p=>pmap[p.u]=p);
 others.slice(0,20).forEach(x=>{const p=pmap[x.u]||{},on=isOn(p),bz=duBusyOf(p),w=elT("div","dq"),cp=elT("div","dq-copy");
  cp.append(elT("b","",(on?"● ":"○ ")+cn(x.u,x.n)+" · "+(x.g||"?")+"등급 · "+(x.e||"?")+" 속성"),elT("small","",(x.m?"「"+x.m+"」 · ":"")+agoTxt(x.ts)+" 올림"+(bz?" · ⚔ 대련 중":on?"":" · 접속 안 함")));
  const b=elT("button","chip","대련 신청");b.type="button";b.disabled=!!C.fall||bz||duOn();b.onclick=()=>duChallenge(x.u,x.n);w.append(cp,b);rb.appendChild(w)})}
setInterval(()=>{if(C&&!$("#v-arena").hidden&&!duOn())duRecLoad()},15000);
let DUP=[];
let DUB=[],dubT=0;async function duBoard(){if(!XON()||Date.now()-dubT<60000)return;dubT=Date.now();try{const sn=await plAll();DUP=sn.docs.map(x=>Object.assign({u:x.id},x.data()||{})).filter(p=>p&&p.n);DUB=DUP.filter(p=>p.du&&Number(p.du.w)>0).sort((a,b)=>b.du.w-a.du.w).slice(0,5);if(!$("#v-arena").hidden&&!(C.du&&!C.du.fin)){if(duFoc)duFind();else duDraw()}}catch(e){}}
function duDraw(){const box=$("#dua");if(!box||!C)return;box.innerHTML="";const d=C.du;
 if(d){const c=elT("div","card du-card");box.appendChild(c);
  if(d.fin){const R=d.res||{};c.append(elT("h2","du-res "+(R.win>0?"w":R.win<0?"l":"d"),R.win>0?"🏆 승리":R.win<0?"패배":"무승부"),elT("p","hint",(R.why||"")+(d.rw?" · 골드 +"+d.rw:" · 오늘 보상 횟수("+DU_DAY+"번)를 다 써서 보상은 없다")));
   if(d.me&&d.op){const R2=duReplay(d.me,d.op);c.appendChild(duLog(R2))}const b=elT("button","btn","대련장으로 돌아가기");b.type="button";b.onclick=duLeave;c.appendChild(b);if(DUI.length)c.appendChild(elT("p","hint","⚔ 새 대련 신청이 "+DUI.length+"건 와 있다. '대련장으로 돌아가기'를 누르면 받을 수 있다."));return}
  const me=d.me,op=d.op;c.appendChild(elT("h2","","⚔ "+d.on+"님과의 대련"));
  if(!op){c.appendChild(elT("p","hint",d.ch?"상대가 수락하기를 기다리는 중이다… (2분이 지나면 신청이 사라진다)":"대련장에 들어가는 중…"));if(d.ch&&Date.now()-d.t0>DU_INV+10000)c.appendChild(elT("p","hint","응답이 없다. 취소하고 다른 상대를 찾아보자."));
   const b=elT("button","btn g","신청 취소");b.type="button";b.onclick=duLeave;c.appendChild(b);return}
  const R=duReplay(me||{},op),A=R.S[0],B=R.S[1],r=duArr((me||{}).L).length,mc=duArr((me||{}).H).length>r,oc=duArr(op.H).length>r;
  const hpRow=(nm,s,mine)=>{const w=elT("div","du-side"+(mine?" me":""));const bar=elT("div","bar du-hp"),f=elT("i");f.style.width=Math.max(0,s.hp)/DU_HP*100+"%";bar.appendChild(f);
   w.append(elT("b","",nm+" · "+s.e+" 속성"),bar,elT("small","","체력 "+Math.max(0,s.hp)+" / "+DU_HP+" · 마력 "+"●".repeat(s.mp)+"○".repeat(Math.max(0,DU_MPMAX-s.mp))+(s.sp?" · 비기 사용함":"")));return w};
  c.append(hpRow(cn(d.o,d.on),B,0),hpRow("나 ("+C.n+")",A,1));
  c.appendChild(elT("p","du-round","제 "+(R.r+1)+" 판 / "+DU_ROUNDS));
  if(!mc){const row=elT("div","du-acts");Object.keys(DU_ACT).forEach(k=>{const [nm,ic]=DU_ACT[k],b=elT("button","chip du-act");b.type="button";
    const sub=k==="mag"?"마력 "+DU_MAG:k==="sp"?DU_SPS[A.e][0]+" · 마력 "+DU_SP:k==="foc"?"마력 +"+DU_FOC:k==="atk"?"마법을 끊는다":"공격을 막는다";b.append(elT("b","",ic+" "+nm),elT("small","",sub));
    b.disabled=duBusy||(k==="mag"&&A.mp<DU_MAG)||(k==="sp"&&(A.sp||A.mp<DU_SP));b.onclick=()=>duPick(k);row.appendChild(b)});c.appendChild(row);
   c.appendChild(elT("p","hint","★ "+DU_SPS[A.e][0]+": "+DU_SPS[A.e][2]+" · 상대("+B.e+")의 비기 「"+DU_SPS[B.e][0]+"」: "+DU_SPS[B.e][2]))}
  else c.appendChild(elT("p","du-wait",oc?"서로의 수가 열리는 중…":"수를 정했다: "+DU_ACT[(d.p||{}).a||"foc"][1]+" "+DU_ACT[(d.p||{}).a||"foc"][0]+" · 상대가 고르기를 기다리는 중…"));
  if(R.log.length)c.appendChild(duLog(R));
  const idle=Date.now()-(Number(op.ts)||Date.now());const bt=elT("div","row");bt.style.marginTop="8px";
  if(mc&&idle>DU_IDLE){const b=elT("button","btn","상대가 응답하지 않는다 · 승리로 끝내기");b.type="button";b.onclick=()=>duFinish(1,d.on+"님이 오래 응답하지 않아 이겼다.");bt.appendChild(b)}
  const g=elT("button","btn g","기권");g.type="button";g.onclick=duGiveUp;bt.appendChild(g);c.appendChild(bt);return}
 // 대련 중이 아닐 때: 받은 신청, 접속 중인 상대, 순위, 규칙
 if(C.fall)box.appendChild(elT("p","hint","타락한 동안에는 대련할 수 없다."));
 if(DUI.length){box.appendChild(elT("h2","","받은 대련 신청"));DUI.forEach(x=>{const w=elT("div","dq"),cp=elT("div","dq-copy");cp.append(elT("b","",cn(x.u,x.n)+" · "+(x.e||"?")+" 속성"),elT("small","",Math.max(0,Math.ceil((DU_INV-(Date.now()-x.ts))/1000))+"초 안에 수락할 수 있다"));
  const b=elT("button","chip","수락");b.type="button";b.disabled=!!C.fall;b.onclick=()=>duAccept(x);const n=elT("button","chip","거절");n.type="button";n.onclick=()=>{C.duSeen=keepIds(C.duSeen,x.mid);save();DUI=DUI.filter(y=>y!==x);duDraw()};w.append(cp,b,n);box.appendChild(w)})}
 // 대련 구인 게시판: 내 이름을 올려 두면 다른 사람이 보고 바로 대련을 신청할 수 있다.
 box.appendChild(elT("h2","","대련 구인 게시판"));const rb=elT("div","du-rec");rb.id="durb";box.appendChild(rb);duRecDraw();
 // 상대 찾기: 이름으로 검색한다. 접속 중인 사람은 ● 표시가 붙는다(신청은 2분 안에 수락해야 하므로 접속 중인 상대가 좋다).
 box.appendChild(elT("h2","","대련 상대 찾기"));const sf=elT("input");sf.type="search";sf.id="dusq";sf.placeholder="이름으로 검색 (한 글자 이상)";sf.setAttribute("aria-label","대련 상대 이름 검색");sf.value=duQ;sf.maxLength=20;
 const gl=elT("div","du-list");gl.id="dusr";sf.oninput=()=>{duQ=sf.value;duFind()};box.append(sf,gl);duFind();if(duFoc){sf.focus();sf.setSelectionRange(sf.value.length,sf.value.length)}
 const st=C.stats||{};box.appendChild(elT("p","boss-info","내 전적 "+(st.duW||0)+"승 "+(st.duL||0)+"패 "+(st.duD||0)+"무 · 오늘 보상 "+((C.duD&&C.duD.d===today())?C.duD.n:0)+" / "+DU_DAY+"번 (승리 골드 "+DU_RW.w+", 그 밖 "+DU_RW.l+")"));
 if(DUB.length){box.appendChild(elT("h2","","대련 순위"));const ol=elT("ol","boss-rank");DUB.forEach(p=>ol.appendChild(elT("li",p.u===UID?"me":"",cn(p.u,p.n)+" · "+p.du.w+"승 "+(p.du.l||0)+"패")));box.appendChild(ol)}
 const rl=elT("details","du-rules");rl.open=duRulesOpen;rl.addEventListener("toggle",()=>{duRulesOpen=rl.open});rl.append(elT("summary","","대련 규칙"),elT("p","hint","무기·레벨·등급·특성·각인은 모두 무시한다. 두 사람 모두 체력 "+DU_HP+", 마력 "+DU_MP0+"로 시작하고, 매 판 동시에 행동을 고른다. "+DU_ROUNDS+"판이 지나면 체력이 많은 쪽이 이긴다."),
  elT("p","hint","⚔ 공격은 ✦ 마법을 끊고(-22), 🛡 방어는 ⚔ 공격을 막고 반격하며(-8), ✦ 마법(마력 "+DU_MAG+")은 🛡 방어를 뚫는다(-25). 공격끼리 -15씩, 마법끼리 -25씩. ◎ 집중은 마력 +"+DU_FOC+"(최대 "+DU_MPMAX+")지만 공격에 -15, 마법에 -25를 맞는다."),
  elT("p","hint","★ 비기(마력 "+DU_SP+", 한 번): 첫 번째 속성의 필살기. "+Object.keys(DU_SPS).map(k=>k+" 「"+DU_SPS[k][0]+"」 "+DU_SPS[k][2]).join(" · ")+". 쓰는 판에는 무방비다."));box.appendChild(rl)}
function duLog(R){const lg=elT("div","log du-log");R.log.slice().reverse().forEach(x=>{const a=x.a.map(k=>DU_ACT[k][1]+" "+DU_ACT[k][0]);lg.appendChild(elT("p","","제"+x.r+"판 · 나 "+a[0]+" vs 상대 "+a[1]+" → 나 "+(x.d[0]?"-"+x.d[0]:"피해 없음")+", 상대 "+(x.d[1]?"-"+x.d[1]:"피해 없음")+(x.t?" · "+x.t:"")))});return lg}
setInterval(()=>{if(C&&C.du&&!C.du.fin&&!$("#v-arena").hidden&&!duBusy)duDraw()},15000);
$("#fb3").onclick=()=>hub();
$("#dub").onclick=()=>hub();
$("#pfdu").onclick=()=>{const u=pfU,h=$("#pfb h2"),p=(ONL.find(x=>x.u===u)||{});$("#pfo").hidden=true;duChallenge(u,p.n||(h?h.textContent:"상대"))};
