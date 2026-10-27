/* 공지. main.js 다음에 불러야 한다. 화면 위 공지 칸, 공지 탭, 운영자의 게시와 내리기.
   마을 화면은 loadNotice 를, 알림함과 메뉴는 drawNotice, ntcView, NTC 를 그대로 부른다. */
/* 공지: 운영자(admins 목록에 있는 계정)만 쓸 수 있고, 모든 플레이어의 화면 위쪽에 보인다. 서버 기록: notice/{번호}
   새 공지가 올라오면 한 번 알림(화면 위 알림·알림함)을 띄운다. 각자 ✕로 닫을 수 있고, 더 새 공지가 오면 다시 보인다. 최근 5개까지만 남긴다. */
let NTC=[],ntcT=0,ntcShown=10,ntcMark=0;// 운영자 한 명당 최근 30개까지 보관. 공지 탭은 한 번에 10개.
const NTC_PAGE=10;
// 공지 탭: 최근 공지부터 10개씩. 연 순간 읽은 것으로 표시하고, 더 보기로 연 뒤에도 이번 화면의 새 공지 표시는 남긴다.
function ntcView(keep){if(!keep){show("ntc");ntcShown=NTC_PAGE;ntcMark=C?Number(C.ntcSeen)||0:0;loadNotice(true)}try{drawRst()}catch(e){}const l=$("#ntcl");if(!l||!C)return;l.innerHTML="";const seen=ntcMark;
 if(ADM[UID]){const w=elT("p","hint","공지 쓰기와 내리기는 화면 위쪽 공지 칸의 '📢 공지 쓰기'에서 할 수 있다.");l.appendChild(w)}
 if(!NTC.length){l.appendChild(elT("p","hint","아직 공지가 없다."));}
 NTC.slice(0,ntcShown).forEach(n=>{const d=new Date(Number(n.ts)),c=elT("div","ntc-card ntc-item"+(n.u?" urgent":"")+(Number(n.ts)>seen?" new":""));
  c.append(elT("p","ntc-tag",(n.u?"📢 중요 공지":"📢 공지")+" · "+d.getFullYear()+"."+(d.getMonth()+1)+"."+d.getDate()+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")+(n.n?" · "+String(n.n).slice(0,20):"")+(Number(n.ts)>seen?" · 새 공지":"")),elT("p","ntc-t",String(n.t).slice(0,300)));
  if(ADM[UID]&&n.src==="p"&&n.by===UID){const x=elT("button","chip","이 공지 내리기");x.type="button";x.style.cssText="margin-top:8px;padding:5px 12px;font-size:.8rem";x.onclick=async()=>{if(!confirm("이 공지를 내릴까?"))return;C.ntcl=(C.ntcl||[]).filter(o=>o.id!==n.id);save();try{await DB.doc("players/"+UID+"/ntc").set(C.ntcl)}catch(e){}NTC=NTC.filter(o=>o!==n);drawNotice();ntcView(true)};c.appendChild(x)}
  l.appendChild(c)});
 if(NTC.length>ntcShown){const left=NTC.length-ntcShown,more=elT("button","btn g","이전 공지 "+Math.min(NTC_PAGE,left)+"개 더 보기");more.type="button";more.id="ntc-more";more.style.marginTop="12px";more.onclick=()=>{ntcShown+=NTC_PAGE;ntcView(true)};l.appendChild(more)}
 if(NTC.length&&Number(NTC[0].ts)>(C.ntcSeen||0)){C.ntcSeen=Number(NTC[0].ts);save()}updNav()}
async function loadNotice(force){if(!C||!XON())return;if(!force&&Date.now()-ntcT<20000)return;ntcT=Date.now();loadDoom();rstCheck();let list=null;
 // 공지는 운영자 본인의 플레이어 기록(players/{운영자}/ntc)에 저장한다. 그 칸은 운영자 본인만 쓸 수 있고, 운영자 목록(admins)은 콘솔에서만 바뀌므로
 // 서버 규칙을 따로 추가하지 않아도 운영자만 공지를 올릴 수 있다. notice 규칙이 있으면 그쪽 공지도 함께 읽는다.
 const all=[];let okAny=false;
 try{const sn=await once(DB.collection("notice").limit(5));okAny=true;sn.docs.forEach(d=>all.push(Object.assign({id:d.id,src:"n"},d.data()||{})))}catch(e){}
 for(const u of Object.keys(ADM)){try{const d=(await DB.doc("players/"+u+"/ntc").get()).data();okAny=true;Object.values(d||{}).forEach(n=>{if(n&&typeof n==="object")all.push(Object.assign({},n,{src:"p",by:u}))})}catch(e){}}
 if(okAny)list=all.filter(n=>typeof n.t==="string"&&n.t.trim()&&Number(n.ts)).sort((a,b)=>Number(b.ts)-Number(a.ts)).slice(0,NTC_KEEP);
 if(!list)return;NTC=list;const top=NTC[0];try{updNav();if(!$("#v-ntc").hidden)ntcView(true)}catch(e){}
 // 처음 확인할 때는 이미 있던 공지로 알림을 띄우지 않고, 그 뒤에 올라온 공지부터 알린다.
 if(C.nts==null){C.nts=top?Number(top.ts)||1:1;save()}
 else if(top&&(Number(top.ts)||0)>C.nts){const first=false;C.nts=Number(top.ts)||Date.now();save();if(!first){note("notice","공지: "+top.t.slice(0,120));toast("📢 공지: "+top.t.slice(0,60),()=>{keep("mgr_ntc_x","");drawNotice()});ding()}}
 drawNotice()}
setInterval(()=>{if(!document.hidden)loadNotice()},60000);
function drawNotice(){try{drawDoom()}catch(e){}const b=$("#ntc");if(!b)return;const isA=!!(C&&ADM[UID]),top=NTC[0],hid=!!top&&lget("mgr_ntc_x")===String(top.ts),openForm=!!b.querySelector(".ntc-adm:not([hidden]) textarea");
 if(openForm)return;// 운영자가 공지를 쓰는 중이면 다시 그리지 않는다
 b.innerHTML="";const show=!!C&&((top&&!hid)||isA);b.hidden=!show;if(!show)return;
 if(top&&!hid){const c=elT("div","ntc-card"+(top.u?" urgent":"")),d=new Date(Number(top.ts)||Date.now());
  c.append(elT("p","ntc-tag",(top.u?"📢 중요 공지":"📢 공지")+" · "+(d.getMonth()+1)+"/"+d.getDate()+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")+(top.n?" · "+String(top.n).slice(0,20):"")),elT("p","ntc-t",top.t.slice(0,300)));
  const x=elT("button","ntc-x","✕");x.type="button";x.setAttribute("aria-label","공지 닫기");x.onclick=()=>{keep("mgr_ntc_x",String(top.ts));drawNotice()};c.appendChild(x);b.appendChild(c)}
 if(isA){const row=elT("div","row");row.style.marginTop="8px";const w=elT("button","chip","📢 공지 쓰기");w.type="button";w.style.cssText="flex:0 0 auto;padding:6px 12px;font-size:.85rem";row.appendChild(w);
  if(top){const del=elT("button","chip","현재 공지 내리기");del.type="button";del.style.cssText="flex:0 0 auto;padding:6px 12px;font-size:.85rem";del.onclick=async()=>{if(!confirm("지금 공지를 내릴까?"))return;try{if(top.src==="p"&&top.by===UID){C.ntcl=(C.ntcl||[]).filter(o=>o.id!==top.id);save();await DB.doc("players/"+UID+"/ntc").set(C.ntcl)}else if(top.src==="n")await DB.doc("notice/"+top.id).delete();else{alert("다른 운영자가 올린 공지는 그 운영자만 내릴 수 있다.");return}NTC.shift();drawNotice()}catch(e){alert("공지를 내리지 못했다.")}};row.appendChild(del)}
  const f=elT("form","ntc-adm");f.hidden=true;const ta=elT("textarea");ta.rows=3;ta.maxLength=300;ta.placeholder="모두에게 보일 공지 (최대 300자)";ta.setAttribute("aria-label","공지 내용");
  const lb=elT("label","");lb.style.cssText="display:flex;align-items:center;gap:6px;margin-top:6px;font-size:.88rem;color:var(--mu)";const ck=elT("input");ck.type="checkbox";lb.append(ck,document.createTextNode("중요 공지 (붉게 강조)"));
  const go=elT("button","btn","게시하기");go.type="submit";const cancel=elT("button","btn g","취소");cancel.type="button";cancel.onclick=()=>{f.hidden=true;drawNotice()};const msg=elT("p","msg","");
  f.append(ta,lb,go,cancel,msg);w.onclick=()=>{f.hidden=!f.hidden;if(!f.hidden)ta.focus()};
  f.onsubmit=async e=>{e.preventDefault();const t=ta.value.trim().slice(0,300);if(!t){msg.textContent="내용을 적어야 한다.";return}go.disabled=true;
   try{const id=Date.now().toString(36),nt={id,t,n:nmOf(),u:ck.checked?1:0,ts:Date.now()};C.ntcl=[nt].concat(C.ntcl||[]).slice(0,NTC_KEEP);save();await DB.doc("players/"+UID+"/ntc").set(C.ntcl);
    keep("mgr_ntc_x","");f.hidden=true;ta.value="";await loadNotice(true);toast("공지를 게시했다.")}
   catch(err){msg.textContent="게시하지 못했다. 인터넷 연결을 확인하고 다시 시도해 보자."}go.disabled=false};
  b.append(row,f)}}

/* ── '멸망까지' 카운트다운 (D-14) ──
   운영자가 시작일을 고르면 그날이 D-14, 14일 뒤가 D-DAY다. 모든 화면 위쪽에 보인다.
   저장 위치는 공지와 같은 방식: 운영자 본인의 플레이어 기록(players/{운영자}/dd). 그 칸은 운영자 본인만 쓸 수 있어서
   서버 규칙을 따로 추가하지 않아도 운영자만 날짜를 바꿀 수 있다. 값: {d:"2026-10-27"(시작일), ts:저장 시각} 또는 비어 있음(꺼짐). */
const DOOM_DAYS=14;let DOOM=null,doomT=0;
const doomOk=o=>!!o&&typeof o==="object"&&/^\d{4}-\d{2}-\d{2}$/.test(String(o.d||""));
const doomYmd=t=>{const d=new Date(t);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const doomDay=s=>{const [y,m,d]=String(s).split("-").map(Number);return Math.round(Date.UTC(y,m-1,d)/86400000)};
function doomState(o){if(!doomOk(o))return null;const st=doomDay(o.d),end=st+DOOM_DAYS,today=doomDay(doomYmd(srvNow())),left=end-today;
 const e=new Date(Date.UTC(1970,0,1)+end*86400000),endTx=(e.getUTCMonth()+1)+"월 "+e.getUTCDate()+"일";
 const [,sm,sd]=o.d.split("-").map(Number);
 return {left,before:today<st,after:today>end,endTx,startTx:sm+"월 "+sd+"일",pct:Math.max(0,Math.min(100,(today-st)/DOOM_DAYS*100))}}
async function loadDoom(){if(!XON())return;let best=null,ok=false;
 for(const u of Object.keys(ADM)){try{const d=(await DB.doc("players/"+u+"/dd").get()).data();ok=true;if(d&&typeof d==="object"&&(!best||Number(d.ts||0)>Number(best.ts||0)))best=d}catch(e){}}
 if(ok){DOOM=best&&best.d?best:null;doomT=Date.now();drawDoom()}}
function drawDoom(){const b=$("#doom");if(!b)return;const isA=!!(C&&ADM[UID]),src=XON()?DOOM:(C&&C.doom)||null,st=doomState(src);
 if(b.querySelector(".doom-form:not([hidden]) input:focus"))return;// 운영자가 날짜를 고르는 중이면 다시 그리지 않는다
 b.innerHTML="";const live=!!st&&!st.before&&!st.after,show=!!C&&(live||isA);b.hidden=!show;if(!show)return;
 const c=elT("div","doom-card"+(live&&st.left<=3?" near":"")+(live&&st.left<=0?" dday":"")+(live?"":" off"));
 const l=elT("div","doom-l");l.append(elT("p","doom-t","멸망까지"));
 if(live)l.append(elT("p","doom-s",st.left<=0?"오늘, 세계가 끝난다.":st.endTx+" 멸망 · "+st.startTx+" 시작"));
 else l.append(elT("p","doom-s",!st?"카운트다운이 꺼져 있다. 운영자만 보인다.":st.before?st.startTx+"에 시작한다 (D-14). 운영자만 보인다.":"멸망의 날("+st.endTx+")이 지났다. 운영자만 보인다."));
 c.append(l,elT("p","doom-n",live?(st.left<=0?"D-DAY":"D-"+st.left):"—"));
 if(live){const bar=elT("div","bar doom-bar"),i=elT("i");i.style.width=st.pct+"%";bar.appendChild(i);c.appendChild(bar)}
 b.appendChild(c);
 if(isA){const set=elT("button","chip doom-set","⏳ 시작일 설정");set.type="button";
  const f=elT("form","doom-form");f.hidden=true;const inp=elT("input");inp.type="date";inp.value=doomOk(src)?src.d:doomYmd(srvNow());inp.setAttribute("aria-label","카운트다운 시작일");
  const hint=elT("p","hint","고른 날이 D-14, 14일 뒤가 D-DAY가 된다.");
  const go=elT("button","btn","저장");go.type="submit";const off=elT("button","btn g","카운트다운 끄기");off.type="button";off.hidden=!doomOk(src);const cancel=elT("button","btn g","취소");cancel.type="button";const msg=elT("p","msg","");
  const upd=()=>{const v=doomState({d:inp.value});hint.textContent=v?"시작 "+v.startTx+" (D-14) → 멸망 "+v.endTx+" (D-DAY)":"날짜를 골라야 한다."};inp.oninput=upd;upd();
  f.append(inp,hint,go,off,cancel,msg);set.onclick=()=>{f.hidden=!f.hidden;if(!f.hidden)inp.focus()};cancel.onclick=()=>{f.hidden=true;drawDoom()};
  const put=async v=>{go.disabled=off.disabled=true;try{C.doom=v;save();if(XON()){await DB.doc("players/"+UID+"/dd").set(v);DOOM=v}f.hidden=true;drawDoom();toast(v?"'멸망까지' 시작일을 "+doomState(v).startTx+"로 정했다.":"'멸망까지' 카운트다운을 껐다.")}
   catch(e){msg.textContent="저장하지 못했다. 인터넷 연결을 확인하고 다시 시도해 보자."}go.disabled=off.disabled=false};
  f.onsubmit=e=>{e.preventDefault();if(!/^\d{4}-\d{2}-\d{2}$/.test(inp.value)){msg.textContent="날짜를 골라야 한다.";return}put({d:inp.value,ts:Date.now()})};
  off.onclick=()=>{if(confirm("카운트다운을 끌까? 모두의 화면에서 사라진다."))put(null)};
  b.append(set,f)}}
setInterval(()=>{if(document.hidden)return;if(XON()&&Date.now()-doomT>60000)loadDoom();else drawDoom()},30000);
/* ── 시즌 초기화 ──
   운영자가 '시즌 초기화'를 실행하면 운영자 본인의 플레이어 기록(players/{운영자}/rst)에 {id:실행 시각}을 남긴다(공지·카운트다운과 같은 방식).
   모든 플레이어는 접속할 때와 1분마다 이 표시를 확인하고, 내 캐릭터가 그보다 오래된 시즌이면(C.rsv < id) 한 번 초기화한다.
   남기는 것: 이름·성별·마을·등급·속성·특성, 프로필(사진·설정), 기록(칭호·도감·통계), 사역마(+품고 있는 알).
   이미 받은 보상·이미 본 알림 표시도 남긴다(초기화 뒤 같은 보상을 다시 받거나 옛 알림이 다시 뜨지 않게).
   그 밖의 진행(레벨·경험치·골드·아이템·무기·각인·절망도·친구·선물·의뢰·시설 기여 등)은 캐릭터를 처음 만든 상태로 돌린다.
   공용 데이터(채팅·1:1·게시판, 친구 소식·공명·선물, 마을 경쟁, 보스·웨이브·타락 레이드)는 운영자가 실행할 때 서버에서 지운다. */
let RST=null,rstT=0;
const RST_KEEP=["n","s","v","a","g","t","img","pf","picSig","titles","ti","dex","stats","pets","pet","petSeen","petGone","egg",
 "cmp","founder","origin","rescued","tut","healOff","ntcl","doom","rst","born","last",
 "fs","rs","gs","nts","ntcSeen","vcSeen","bdSeen","duSeen","rsn","pn","duNt","drn","drw","wvn1","wvn2","pc","wvc","wbc","gwc"];
const rstOld=p=>!!RST&&!!p&&typeof p==="object"&&(Number(p.rv)||0)<RST.id;
async function rstLoad(){if(!XON())return RST;let best=null,ok=false;const us=new Set(Object.keys(ADM).concat(typeof ADMIN_FIXED!=="undefined"?ADMIN_FIXED:[]));
 for(const u of us){try{const d=(await DB.doc("players/"+u+"/rst").get()).data();ok=true;if(d&&Number(d.id)>0&&(!best||Number(d.id)>Number(best.id)))best={id:Number(d.id),by:u}}catch(e){}}
 if(ok){RST=best;rstT=Date.now()}return RST}
async function rstCheck(boot){if(!C||!XON())return;if(!boot&&Date.now()-rstT<55000)return;const R=await rstLoad();if(!R||!C)return;
 if((Number(C.rsv)||0)>=R.id)return;
 if(Number(C.born)>R.id){C.rsv=R.id;save();return}// 초기화 뒤에 새로 만든 캐릭터
 rstApply(R,boot)}
function rstApply(R,boot){const keep={};RST_KEEP.forEach(k=>{if(C[k]!==undefined)keep[k]=C[k]});
 C=Object.assign({lv:1,ex:0,xv:2,cl:0,dz:0,b:0,gd:100,inv:{},wps:[],wp:-1,wl:{},titles:[],ti:""},keep,{rsv:R.id,nt:[]});
 C.stats=C.stats||{};C.stats.maxGold=Math.max(Number(C.stats.maxGold)||0,100);
 note("notice","🌑 새 시즌이 시작되었다. 이름·속성·특성·사역마와 프로필·기록은 그대로 남고, 나머지는 처음부터 다시 시작한다.");
 save();try{saveCloud(true)}catch(e){}try{regPlayer()}catch(e){}
 const msg="운영자가 시즌을 초기화했다.\n\n남은 것: 이름·성별·마을·등급·속성·특성, 프로필, 칭호·도감·기록, 사역마\n처음으로 돌아간 것: 레벨·골드·아이템·무기·각인·절망도·친구 목록 등\n\n새로운 이야기를 시작하자.";
 if(boot)setTimeout(()=>alertBox("🌑 새 시즌",msg),900);else{alertBox("🌑 새 시즌",msg);try{hub()}catch(e){}}}
// 서버의 공용 데이터 지우기. 프로필 사진(wboss/pic·picm)과 시계 맞추기(wboss/clk)는 남긴다.
async function rstWipe(){const done=[],fail=[];
 const del=async(p,label)=>{try{await DB.doc(p).delete();done.push(label)}catch(e){fail.push(label+" ("+String(e&&e.message||e)+")")}};
 for(const [p,l] of [["chat","단체·마을 채팅과 게시판"],["dm","1:1 채팅"],["dmn","1:1 새 메시지 표시"],["fmsg","친구 신청·소식"],["res","공명 요청"],["gift","선물"],["giftn","선물 도착 표시"],["guard","마을 경쟁"],["vfac","마을 시설 단계"],["vfactop","마을 시설 기여 순위"],["raid","타락 레이드"],["raidhit","타락 레이드 기록"]])await del(p,l);
 try{const r=await fetch(FBU.replace(/\/+$/,"")+"/wboss.json?shallow=true"+(AUTH.tok?"&auth="+encodeURIComponent(AUTH.tok):""));if(!r.ok)throw new Error(r.status);const ks=Object.keys((await r.json())||{}).filter(k=>!["pic","picm","clk"].includes(k));
  let bad=0;for(const k of ks){try{await DB.doc("wboss/"+k).delete()}catch(e){bad++}}if(bad)fail.push("보스·웨이브 기록 "+bad+"/"+ks.length+"개");else done.push("보스·웨이브 기록 "+ks.length+"개")}catch(e){fail.push("보스·웨이브 기록 ("+String(e&&e.message||e)+")")}
 return {done,fail}}
async function rstRun(btn,msg){if(!ADM[UID]||!XON())return;
 const t=prompt("모든 플레이어의 캐릭터와 채팅·게시판·친구·마을 경쟁·보스 기록이 초기화된다. 되돌릴 수 없다.\n\n계속하려면 '초기화'라고 입력해 줘.");
 if((t||"").trim()!=="초기화"){msg.textContent="취소했다.";return}
 btn.disabled=true;msg.style.color="var(--mu)";msg.textContent="초기화하는 중이다. 창을 닫지 말자...";
 try{const R={id:Date.now(),ts:Date.now()};C.rst=R;save();await DB.doc("players/"+UID+"/rst").set(R);RST={id:R.id,by:UID};rstT=Date.now();
  const w=await rstWipe();try{PLC=null}catch(e){}
  rstApply(RST,false);
  alertBox("🌑 시즌 초기화 완료","플레이어들은 다음 접속(또는 1분 안)에 각자 초기화된다.\n\n지운 것: "+(w.done.join(", ")||"없음")+(w.fail.length?"\n\n지우지 못한 것: "+w.fail.join(", ")+"\n(서버 규칙에서 운영자 쓰기가 막혀 있을 수 있다. Firebase 콘솔에서 직접 지워야 한다.)":""));
  msg.textContent=""}
 catch(e){msg.style.color="var(--bad)";msg.textContent="초기화 표시를 저장하지 못했다. 인터넷 연결을 확인하고 다시 시도해 보자. (아무것도 바뀌지 않았다)"}btn.disabled=false}
function drawRst(){const box=$("#rstbox");if(!box)return;box.innerHTML="";box.hidden=!(C&&ADM[UID]&&XON());if(box.hidden)return;
 const c=elT("div","card rst-card");c.append(elT("h2","","🌑 시즌 초기화 (운영자 전용)"),
  elT("p","hint","모든 플레이어의 캐릭터를 처음 상태로 돌린다. 이름·성별·마을·등급·속성·특성, 프로필, 칭호·도감·기록, 사역마는 남는다."),
  elT("p","hint","함께 지우는 것: 단체·마을·1:1 채팅, 게시판, 친구 목록과 신청·공명·선물, 마을 경쟁, 마을 시설 단계와 기여 순위, 보스·웨이브·타락 레이드 기록. 공지와 '멸망까지'는 남는다."),
  elT("p","hint",RST?"마지막 초기화: "+new Date(RST.id).toLocaleString("ko-KR"):"아직 초기화한 적이 없다."));
 const b=elT("button","btn rst-go","시즌 초기화 실행"),m=elT("p","msg","");b.type="button";b.onclick=()=>rstRun(b,m);c.append(b,m);box.appendChild(c)}
