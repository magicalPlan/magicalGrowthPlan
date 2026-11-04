/* 공지. main.js 다음에 불러야 한다. 화면 위 공지 칸, 공지 탭, 운영자의 게시와 내리기.
   공지와 시즌 표시는 공지 탭을 열 때 받는다. 목록은 DAY_MS(하루) 동안 메모리에 두어, 탭을 다시 열면 바로 보여 준다.
   멸망 카운트는 접속할 때 한 번 받아, 진행 중이면 모든 화면 오른쪽 위에 보인다. */
/* 공지: 운영자(admins 목록에 있는 계정)만 쓸 수 있고, 모든 플레이어의 화면 위쪽에 보인다. 서버 기록: notice/{번호}
   새 공지가 올라오면 한 번 알림(화면 위 알림·알림함)을 띄운다. 각자 ✕로 닫을 수 있고, 더 새 공지가 오면 다시 보인다. 최근 5개까지만 남긴다. */
let NTC=[],ntcShown=10,ntcMark=0,ntcAt=0;// 운영자 한 명당 최근 30개까지 보관. 공지 탭은 한 번에 10개.
const NTC_PAGE=10,NTC_TTL=DAY_MS;
// 공지 탭: 최근 공지부터 10개씩. 연 순간 읽은 것으로 표시하고, 더 보기로 연 뒤에도 이번 화면의 새 공지 표시는 남긴다.
function ntcView(keep){if(!keep){show("ntc");ntcShown=NTC_PAGE;ntcMark=C?Number(C.ntcSeen)||0:0;if(!(ntcAt&&Date.now()-ntcAt<NTC_TTL))loadNotice()}try{drawRst()}catch(e){}const l=$("#ntcl");if(!l||!C)return;l.innerHTML="";const seen=ntcMark;
 if(ADM[UID]){const w=elT("p","hint","공지 쓰기와 내리기는 화면 위쪽 공지 칸의 '📢 공지 쓰기'에서 할 수 있다.");l.appendChild(w)}
 if(!NTC.length){l.appendChild(elT("p","hint","아직 공지가 없다."));}
 NTC.slice(0,ntcShown).forEach(n=>{const d=new Date(Number(n.ts)),c=elT("div","ntc-card ntc-item"+(n.u?" urgent":"")+(Number(n.ts)>seen?" new":""));
  c.append(elT("p","ntc-tag",(n.u?"📢 중요 공지":"📢 공지")+" · "+d.getFullYear()+"."+(d.getMonth()+1)+"."+d.getDate()+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")+(n.n?" · "+String(n.n).slice(0,20):"")+(Number(n.ts)>seen?" · 새 공지":"")),elT("p","ntc-t",String(n.t).slice(0,300)));
  if(ADM[UID]&&n.src==="p"&&n.by===UID){const x=elT("button","chip","이 공지 내리기");x.type="button";x.style.cssText="margin-top:8px;padding:5px 12px;font-size:.8rem";x.onclick=async()=>{if(!confirm("이 공지를 내릴까?"))return;C.ntcl=(C.ntcl||[]).filter(o=>o.id!==n.id);save();try{await DB.doc("players/"+UID+"/ntc").set(C.ntcl)}catch(e){}NTC=NTC.filter(o=>o!==n);ntcAt=Date.now();drawNotice();ntcView(true)};c.appendChild(x)}
  l.appendChild(c)});
 if(NTC.length>ntcShown){const left=NTC.length-ntcShown,more=elT("button","btn g","이전 공지 "+Math.min(NTC_PAGE,left)+"개 더 보기");more.type="button";more.id="ntc-more";more.style.marginTop="12px";more.onclick=()=>{ntcShown+=NTC_PAGE;ntcView(true)};l.appendChild(more)}
 if(NTC.length&&Number(NTC[0].ts)>(C.ntcSeen||0)){C.ntcSeen=Number(NTC[0].ts);save()}updNav()}
let ntcBusy=false,ntcAgain=false;
async function loadNotice(){if(!C||!XON())return;if(ntcBusy){ntcAgain=true;return}ntcBusy=true;try{do{ntcAgain=false;await loadDoom();await rstCheck(false);let list=null;
 // 공지는 운영자 본인의 플레이어 기록(players/{운영자}/ntc)에 저장한다. 그 칸은 운영자 본인만 쓸 수 있고, 운영자 목록(admins)은 콘솔에서만 바뀌므로
 // 서버 규칙을 따로 추가하지 않아도 운영자만 공지를 올릴 수 있다. notice 규칙이 있으면 그쪽 공지도 함께 읽는다.
 const all=[];let okAny=false;
 try{const sn=await once(DB.collection("notice").limit(5));okAny=true;sn.docs.forEach(d=>all.push(Object.assign({id:d.id,src:"n"},d.data()||{})))}catch(e){}
 for(const u of Object.keys(ADM)){try{const d=(await DB.doc("players/"+u+"/ntc").get()).data();okAny=true;Object.values(d||{}).forEach(n=>{if(n&&typeof n==="object")all.push(Object.assign({},n,{src:"p",by:u}))})}catch(e){}}
 if(okAny)list=all.filter(n=>typeof n.t==="string"&&n.t.trim()&&Number(n.ts)).sort((a,b)=>Number(b.ts)-Number(a.ts)).slice(0,NTC_KEEP);
 if(!list)return;NTC=list;ntcAt=Date.now();const top=NTC[0];try{updNav();if(!$("#v-ntc").hidden)ntcView(true)}catch(e){}
 // 처음 확인할 때는 이미 있던 공지로 알림을 띄우지 않고, 그 뒤에 올라온 공지부터 알린다.
 if(C.nts==null){C.nts=top?Number(top.ts)||1:1;save()}
 else if(top&&(Number(top.ts)||0)>C.nts){const first=false;C.nts=Number(top.ts)||Date.now();save();if(!first){note("notice","공지: "+top.t.slice(0,120));toast("📢 공지: "+top.t.slice(0,60),()=>{keep("mgr_ntc_x","");drawNotice()});ding()}}
 drawNotice()}while(ntcAgain)}finally{ntcBusy=false}}
function drawNotice(){try{drawDoom()}catch(e){}const b=$("#ntc");if(!b)return;const isA=!!(C&&ADM[UID]),top=NTC[0],hid=!!top&&lget("mgr_ntc_x")===String(top.ts),openForm=!!b.querySelector(".ntc-adm:not([hidden]) textarea");
 if(openForm)return;// 운영자가 공지를 쓰는 중이면 다시 그리지 않는다
 b.innerHTML="";const show=!!C&&((top&&!hid)||isA);b.hidden=!show;if(!show)return;
 if(top&&!hid){const c=elT("div","ntc-card"+(top.u?" urgent":"")),d=new Date(Number(top.ts)||Date.now());
  c.append(elT("p","ntc-tag",(top.u?"📢 중요 공지":"📢 공지")+" · "+(d.getMonth()+1)+"/"+d.getDate()+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")+(top.n?" · "+String(top.n).slice(0,20):"")),elT("p","ntc-t",top.t.slice(0,300)));
  const x=elT("button","ntc-x","✕");x.type="button";x.setAttribute("aria-label","공지 닫기");x.onclick=()=>{keep("mgr_ntc_x",String(top.ts));drawNotice()};c.appendChild(x);b.appendChild(c)}
 if(isA){const row=elT("div","row");row.style.marginTop="8px";const w=elT("button","chip","📢 공지 쓰기");w.type="button";w.style.cssText="flex:0 0 auto;padding:6px 12px;font-size:.85rem";row.appendChild(w);
  if(top){const del=elT("button","chip","현재 공지 내리기");del.type="button";del.style.cssText="flex:0 0 auto;padding:6px 12px;font-size:.85rem";del.onclick=async()=>{if(!confirm("지금 공지를 내릴까?"))return;try{if(top.src==="p"&&top.by===UID){C.ntcl=(C.ntcl||[]).filter(o=>o.id!==top.id);save();await DB.doc("players/"+UID+"/ntc").set(C.ntcl)}else if(top.src==="n")await DB.doc("notice/"+top.id).delete();else{alert("다른 운영자가 올린 공지는 그 운영자만 내릴 수 있다.");return}NTC.shift();ntcAt=Date.now();drawNotice()}catch(e){alert("공지를 내리지 못했다.")}};row.appendChild(del)}
  const f=elT("form","ntc-adm");f.hidden=true;const ta=elT("textarea");ta.rows=3;ta.maxLength=300;ta.placeholder="모두에게 보일 공지 (최대 300자)";ta.setAttribute("aria-label","공지 내용");
  const lb=elT("label","");lb.style.cssText="display:flex;align-items:center;gap:6px;margin-top:6px;font-size:.88rem;color:var(--mu)";const ck=elT("input");ck.type="checkbox";lb.append(ck,document.createTextNode("중요 공지 (붉게 강조)"));
  const go=elT("button","btn","게시하기");go.type="submit";const cancel=elT("button","btn g","취소");cancel.type="button";cancel.onclick=()=>{f.hidden=true;drawNotice()};const msg=elT("p","msg","");
  f.append(ta,lb,go,cancel,msg);w.onclick=()=>{f.hidden=!f.hidden;if(!f.hidden)ta.focus()};
  f.onsubmit=async e=>{e.preventDefault();const t=ta.value.trim().slice(0,300);if(!t){msg.textContent="내용을 적어야 한다.";return}go.disabled=true;
   try{const id=Date.now().toString(36),nt={id,t,n:nmOf(),u:ck.checked?1:0,ts:Date.now()};C.ntcl=[nt].concat(C.ntcl||[]).slice(0,NTC_KEEP);save();await DB.doc("players/"+UID+"/ntc").set(C.ntcl);
    keep("mgr_ntc_x","");f.hidden=true;ta.value="";await loadNotice();toast("공지를 게시했다.")}
   catch(err){msg.textContent="게시하지 못했다. 인터넷 연결을 확인하고 다시 시도해 보자."}go.disabled=false};
  b.append(row,f)}}

/* ── '멸망까지' 카운트다운 (D-14) ──
   기간은 doom 한 칸뿐이다. 운영자가 다시 저장하면 그 날짜가 이전 날짜를 갈아 끼운다. 로그인한 사람은 읽고, 운영자만 고친다.
   시작일은 운영자에게만 보이고, 진행 중인 타이머는 모두에게 보인다.
   운영자가 시작일을 고르면 그날이 D-14, 14일 뒤가 D-DAY다. 값: {d:"2026-10-27", ts} 또는 {off:1, ts}(꺼짐). */
const DOOM_DAYS=14;let DOOM=null;
const doomOk=o=>!!o&&typeof o==="object"&&/^\d{4}-\d{2}-\d{2}$/.test(String(o.d||""));
const doomYmd=t=>{const d=new Date(t);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const doomDay=s=>{const [y,m,d]=String(s).split("-").map(Number);return Math.round(Date.UTC(y,m-1,d)/86400000)};
function doomState(o){if(!doomOk(o))return null;const st=doomDay(o.d),end=st+DOOM_DAYS,today=doomDay(doomYmd(srvNow())),left=end-today;
 const e=new Date(Date.UTC(1970,0,1)+end*86400000),endTx=(e.getUTCMonth()+1)+"월 "+e.getUTCDate()+"일";
 const [,sm,sd]=o.d.split("-").map(Number);
 return {left,before:today<st,after:today>end,endTx,startTx:sm+"월 "+sd+"일",pct:Math.max(0,Math.min(100,(today-st)/DOOM_DAYS*100))}}
async function loadDoom(){if(!XON())return;
 try{const r=await DB.doc("doom").get();const d=r.exists?r.data():null;DOOM=doomOk(d)?d:null}catch(e){}
 drawDoom()}
function drawDoom(){const b=$("#doom");if(!b)return;const isA=!!(C&&ADM[UID]),src=XON()?DOOM:(C&&C.doom)||null,st=doomState(src);
 if(b.querySelector(".doom-form:not([hidden]) input:focus"))return;// 운영자가 날짜를 고르는 중이면 다시 그리지 않는다
 b.innerHTML="";const live=!!st&&!st.before&&!st.after,show=!!C&&(live||isA);b.hidden=!show;if(!show)return;
 const c=elT("div","doom-card"+(live&&st.left<=3?" near":"")+(live&&st.left<=0?" dday":"")+(live?"":" off"));
 const l=elT("div","doom-l");l.append(elT("p","doom-t","멸망까지 · 18:00시"));
 if(live)l.append(elT("p","doom-s",st.left<=0?"오늘 18:00시, 세계가 끝난다.":st.endTx+" 18:00시 멸망 · "+st.startTx+" 시작"));
 else l.append(elT("p","doom-s",!st?"카운트다운이 꺼져 있다.":st.before?st.startTx+"에 시작한다 (D-14).":"멸망의 날("+st.endTx+" 18:00시)이 지났다."));
 c.append(l,elT("p","doom-n",live?(st.left<=0?"D-DAY":"D-"+st.left):"—"));
 if(live){const bar=elT("div","bar doom-bar"),i=elT("i");i.style.width=st.pct+"%";bar.appendChild(i);c.appendChild(bar)}
 b.appendChild(c);
 if(isA){const set=elT("button","chip doom-set","⏳ 시작일 설정");set.type="button";
  const f=elT("form","doom-form");f.hidden=true;const inp=elT("input");inp.type="date";inp.value=doomOk(src)?src.d:doomYmd(srvNow());inp.setAttribute("aria-label","카운트다운 시작일");
  const hint=elT("p","hint","고른 날이 D-14, 14일 뒤가 D-DAY가 된다.");
  const go=elT("button","btn","저장");go.type="submit";const off=elT("button","btn g","카운트다운 끄기");off.type="button";off.hidden=!doomOk(src);const cancel=elT("button","btn g","취소");cancel.type="button";const msg=elT("p","msg","");
  const upd=()=>{const v=doomState({d:inp.value});hint.textContent=v?"시작 "+v.startTx+" (D-14) → 멸망 "+v.endTx+" (D-DAY)":"날짜를 골라야 한다."};inp.oninput=upd;upd();
  f.append(inp,hint,go,off,cancel,msg);set.onclick=()=>{f.hidden=!f.hidden;if(!f.hidden)inp.focus()};cancel.onclick=()=>{f.hidden=true;drawDoom()};
  const put=async v=>{if(XON()&&!ADM[UID])return;go.disabled=off.disabled=true;msg.textContent="";
   try{if(XON()){await DB.doc("doom").set(v?{d:v.d,ts:v.ts}:{off:1,ts:Date.now()});DOOM=v}else{C.doom=v;save()}
   f.hidden=true;drawDoom();toast(v?"'멸망까지' 시작일을 "+doomState(v).startTx+"로 정했다. 모든 운영자와 플레이어가 이 날짜를 본다.":"'멸망까지' 카운트다운을 껐다.")}
   catch(e){const c=String(e&&e.message||e);msg.style.color="var(--bad)";msg.textContent=c==="401"||c==="403"?"공통 칸(doom) 저장이 거절되었다. 데이터베이스 규칙에서 운영자 쓰기가 열려 있는지 확인해야 한다. (오류 "+c+")":"저장하지 못했다. 인터넷 연결을 확인하고 다시 시도해 보자. (오류 "+c+")"}
   go.disabled=off.disabled=false};
  f.onsubmit=e=>{e.preventDefault();if(!/^\d{4}-\d{2}-\d{2}$/.test(inp.value)){msg.textContent="날짜를 골라야 한다.";return}put({d:inp.value,ts:Date.now()})};
  off.onclick=()=>{if(confirm("카운트다운을 끌까? 모두의 화면에서 사라진다."))put(null)};
  b.append(set,f)}}
  
/* ── 시즌 초기화·개인 회귀 ──
   운영자가 버튼을 누르면 그 자리에서 accounts 전원(또는 UID 한 명)을 서버에서 되돌리고, players/{uid}/rr 에 시각을 남긴다.
   시즌은 players/{운영자}/rst 에도 {id}를 남긴다. 캐릭터의 C.rsv 가 그 id 이상이 되면 같은 회귀는 다시 돌리지 않는다.
   접속(boot) 때는 이미 서버에 반영된 기록을 읽고, C.rstn < due 이면 알림만 한 번 띄운다(다시 회귀시키지 않음).
   접속 중 rr 가 커지면 서버 캐릭터를 다시 읽어 맞추고 알림함만 남긴다. 팝업 알림은 다음 접속 때.
   남기는 것: 이름·성별·마을·처음 속성·특성, 프로필, 칭호·도감·통계, 사역마, 레벨·경험·골드, 장기 토벌·단서, 보상·알림 표시.
   처음으로: 등급 E, 시험 속성, 아이템·무기·각인·절망·친구 등. 시즌 때 공용 채팅·선물·마을·보스·타락은 함께 지운다. */
let RST=null;
/* lh·clue: 장기 진행. lv·ex·xv·gd: 레벨·경험·골드(회귀로 날아가지 않게). rstn 은 KEEP에 넣지 않는다(회귀마다 알림을 다시 띄우려고). */
const RST_KEEP=["n","s","v","a","t","img","pf","rel","picSig","titles","ti","dex","stats","pets","pet","petSeen","petGone","egg","petMax",
 "cmp","founder","origin","rescued","tut","healOff","ntcl","doom","rst","born","last","lh","clue","lv","ex","xv","gd",
 "fs","rs","gs","nts","ntcSeen","vcSeen","bdSeen","duSeen","rsn","pn","duNt","drn","drw","wvn1","wvn2","pc","wvc","wbc","gwc"];
const rstOld=p=>!!RST&&!!p&&typeof p==="object"&&(Number(p.rv)||0)<RST.id;
const rstNoteTxt=one=>one?"🌑 운영자가 이 캐릭터만 회귀시켰다. 이름·레벨·골드·사역마·장기 토벌/단서 진행과 프로필·기록은 남고, 시험으로 얻은 속성은 사라지며 등급은 E로 돌아간다.":"🌑 새 시즌이 시작되었다. 이름·레벨·골드·사역마·장기 토벌/단서 진행과 프로필·기록은 남고, 시험으로 얻은 속성은 사라지며 등급은 E로 돌아간다.";
const rstAlertMsg=one=>(one?"운영자가 이 캐릭터만 회귀시켰다.":"운영자가 시즌을 초기화했다.")+"\n\n남은 것: 이름·성별·마을·처음 속성·특성, 프로필, 칭호·도감·기록, 사역마, 레벨·경험치·골드, 장기 토벌·단서 탐색 진행\n처음으로 돌아간 것: 등급(E)·시험으로 얻은 속성·아이템·무기·각인·절망도·친구 목록 등\n\n"+(one?"다른 사람의 기록은 그대로다.":"새로운 이야기를 시작하자.");
async function rstLoad(){if(!XON())return RST;let best=null,ok=false;const us=new Set(Object.keys(ADM));
 for(const u of us){try{const d=(await DB.doc("players/"+u+"/rst").get()).data();ok=true;if(d&&Number(d.id)>0&&(!best||Number(d.id)>Number(best.id)))best={id:Number(d.id),by:u}}catch(e){}}
 if(ok)RST=best;return RST}
async function rstOneLoad(){if(!XON()||!UID)return null;let best=null;
 for(const u of Object.keys(ADM)){try{const d=(await DB.doc("players/"+u+"/rstu/"+UID).get()).data();const id=d&&Number(d.id)||0;if(id>0&&(!best||id>best.id))best={id,by:u}}catch(e){}}
 return best}
async function rstRr(){if(!XON()||!UID)return 0;try{const s=await DB.doc("players/"+UID+"/rr").get();return s.exists?Number(s.data())||0:0}catch(e){return 0}}
async function rstFresh(){if(!C||!UID||!DB)return;const id=await rstRr();if(!id||id<=(Number(lget("mgr_rr_"+UID))||0))return;try{localStorage.removeItem("mgr_pend_"+UID)}catch(e){}try{keep("mgr_rr_"+UID,String(id))}catch(e){}}
/* 회귀: 캐릭터를 만들 때 고른 첫 속성만 남긴다. 재계약 시험으로 뒤에 붙은 속성은 지운다. */
function rstAttrs(list){const a=(Array.isArray(list)?list:[]).filter(x=>typeof AT!=="undefined"&&AT.some(t=>t[0]===x));return a.length?[a[0]]:["불"]}
function rstShape(src,id){const base=JSON.parse(JSON.stringify(src||{})),keep={};RST_KEEP.forEach(k=>{if(base[k]!==undefined)keep[k]=base[k]});
 keep.a=rstAttrs(keep.a);
 const next=Object.assign({lv:1,ex:0,xv:3,cl:0,dz:0,b:0,gd:100,inv:{},wps:[],wp:-1,wl:{},titles:[],ti:""},keep,{rsv:id,nt:[],g:(typeof GL==="string"&&GL[0])||"E"});
 next.stats=Object.assign({},next.stats);next.stats.maxGold=Math.max(Number(next.stats.maxGold)||0,Number(next.gd)||0,100);
 const prev=C;C=next;try{if(typeof eggFix==="function")eggFix()}catch(e){}const out=C;C=prev;return out}
function rstPub(ch){const prev=C;let power=0,pet=null;C=ch;try{power=typeof pw==="function"?pw():0;const q=typeof petCur==="function"?petCur():null;pet=q?{s:q.sp,n:String(q.nm||"").slice(0,10),l:typeof petLv==="function"?petLv(q):1}:null}catch(e){}C=prev;
 return{g:ch.g,a:(ch.a||[]).join(" · "),lv:ch.lv||1,cl:0,ex:ch.ex||0,dz:0,wp:"없음",pw:power,rv:Number(ch.rsv)||0,fc:null,wf:null,fl:null,db:null,dr:null,ev:null,hf:ch.healOff?1:0,pet:pet,ts:Date.now()}}
/* 한 계정 서버 회귀. 표시보다 뒤에 만든 캐릭터는 내용 없이 rsv 만 맞춘다. */
async function rstWrite(uid,src,R){if(!src||typeof src!=="object")throw new Error("empty");
 const ch=Number(src.born)>R.id?Object.assign(JSON.parse(JSON.stringify(src)),{rsv:R.id}):rstShape(src,R.id);
 await DB.doc("accounts/"+uid).patch({c:ch,prog:{lv:ch.lv||1,ex:ch.ex||0,xv:ch.xv||3},ts:Date.now(),sid:"admin-rst"});
 await DB.doc("players/"+uid+"/rr").set(R.id);
 const pub=rstPub(ch),late=[];
 try{await DB.doc("players/"+uid).patch(pub)}catch(e){late.push("공개 카드")}
 try{await DB.doc("who/"+uid).patch({g:String(ch.g||"").slice(0,2),a:String(pub.a||"").slice(0,40),lv:ch.lv||1,pw:pub.pw||0,dz:0,fl:null,rv:R.id,db:null})}catch(e){late.push("명부")}
 try{await DB.doc("raid/"+uid).delete()}catch(e){}
 return{ch,late}}
async function rstTakeCloud(due){if(!C||!UID||!DB)return false;
 try{const s=await DB.doc("accounts/"+UID).get();const ch=s.exists&&s.data()&&s.data().c;if(!ch||typeof ch!=="object"||(Number(ch.rsv)||0)<due)return false;
  C=ch;try{clearPend()}catch(e){}try{if(typeof accMark==="function")accMark()}catch(e){}try{keep("mgr_rr_"+UID,String(due))}catch(e){}
  try{if(typeof raidClear==="function")raidClear()}catch(e){}try{regPlayer()}catch(e){}save();return true}catch(e){return false}}
async function rstCheck(boot){if(!C||!XON())return;const R=await rstLoad(),one=await rstOneLoad(),rr=await rstRr();if(!C)return;
 const cur=Number(C.rsv)||0,gid=R?R.id:0,oid=Math.max(one?one.id:0,rr),due=Math.max(gid,oid);if(!(due>0))return;
 const isOne=oid>0&&oid>=gid&&oid>=due;
 if(Number(C.born)>due){if(cur<due){C.rsv=due;save()}return}
 if(cur<due){const ok=await rstTakeCloud(due);if(!ok){C=rstShape(C,due);try{clearPend()}catch(e){}try{keep("mgr_rr_"+UID,String(due))}catch(e){}
  try{saveCloud(true)}catch(e){}try{regPlayer()}catch(e){}try{if(typeof raidClear==="function")raidClear()}catch(e){}}}
 if(!boot||(Number(C.rstn)||0)>=due)return;
 C.rstn=due;note("notice",rstNoteTxt(isOne));save();
 setTimeout(()=>alertBox(isOne?"🌑 개인 회귀":"🌑 새 시즌",rstAlertMsg(isOne)),900)}
/* 접속 중 rr: 서버에 이미 회귀된 캐릭터를 읽어 맞춘다. 팝업은 띄우지 않고(다음 접속 rstCheck), 알림함만 남긴다. */
let unRr=null,rrGen=0;
function rrWatch(){if(!AUTH.uid||!C||!DB||LOCAL||unRr)return;const uid=UID,gen=++rrGen;
 const take=async sn=>{if(gen!==rrGen||!C||UID!==uid)return;const id=sn.exists?Number(sn.data())||0:0;if(!(id>(Number(C.rsv)||0)))return;
  if(Number(C.born)>id){C.rsv=id;try{keep("mgr_rr_"+uid,String(id))}catch(e){}save();return}
  const ok=await rstTakeCloud(id);if(!ok){C=rstShape(C,id);try{clearPend()}catch(e){}try{keep("mgr_rr_"+uid,String(id))}catch(e){}
   try{saveCloud(true)}catch(e){}try{regPlayer()}catch(e){}try{if(typeof raidClear==="function")raidClear()}catch(e){}}
  note("notice",rstNoteTxt(!(RST&&Number(RST.id)===id)));save();try{hub()}catch(e){}};
 unRr=DB.doc("players/"+uid+"/rr").live().onSnapshot(take,()=>{},120000)}
// 서버의 공용 데이터 지우기. 프로필 사진(wboss/pic·picm)과 시계 맞추기(wboss/clk)는 남긴다.
async function rstWipe(){const done=[],fail=[];
 const del=async(p,label)=>{try{await DB.doc(p).delete();done.push(label)}catch(e){fail.push(label+" ("+String(e&&e.message||e)+")")}};
 for(const [p,l] of [["chat","단체·마을 채팅과 게시판"],["dm","1:1 채팅"],["dmn","1:1 새 메시지 표시"],["fmsg","친구 신청·소식"],["res","공명 요청"],["gift","선물"],["giftn","선물 도착 표시"],["guard","마을 경쟁"],["vfac","마을 시설 단계"],["vfactop","마을 시설 기여 순위"],["raid","타락 레이드"],["raidhit","타락 레이드 기록"]])await del(p,l);
 /* 1:1 방 목록은 rooms/xd{uid}. 출정(xm·xv)·대련(xa·xb·xr) 방은 같은 rooms 아래에 있으므로 통째로 지우지 않는다. */
 try{const r=await fetch(FBU.replace(/\/+$/,"")+"/rooms.json?shallow=true"+(AUTH.tok?"&auth="+encodeURIComponent(AUTH.tok):""));if(!r.ok)throw new Error(r.status);const ks=Object.keys((await r.json())||{}).filter(k=>String(k).indexOf("xd")===0);
  let bad=0;for(const k of ks){try{await DB.doc("rooms/"+k).delete()}catch(e){bad++}}if(bad)fail.push("1:1 방 목록 "+bad+"/"+ks.length+"개");else done.push("1:1 방 목록 "+ks.length+"개")}catch(e){fail.push("1:1 방 목록 ("+String(e&&e.message||e)+")")}
 try{const r=await fetch(FBU.replace(/\/+$/,"")+"/wboss.json?shallow=true"+(AUTH.tok?"&auth="+encodeURIComponent(AUTH.tok):""));if(!r.ok)throw new Error(r.status);const ks=Object.keys((await r.json())||{}).filter(k=>!["pic","picm","clk"].includes(k));
  let bad=0;for(const k of ks){try{await DB.doc("wboss/"+k).delete()}catch(e){bad++}}if(bad)fail.push("보스·웨이브 기록 "+bad+"/"+ks.length+"개");else done.push("보스·웨이브 기록 "+ks.length+"개")}catch(e){fail.push("보스·웨이브 기록 ("+String(e&&e.message||e)+")")}
 return {done,fail}}
async function rstRun(btn,msg){if(!ADM[UID]||!XON())return;
 const t=prompt("모든 플레이어의 캐릭터와 채팅·게시판·친구·마을 경쟁·보스 기록이 지금 서버에서 초기화된다. 되돌릴 수 없다.\n\n계속하려면 '초기화'라고 입력해 줘.");
 if((t||"").trim()!=="초기화"){msg.textContent="취소했다.";return}
 btn.disabled=true;msg.style.color="var(--mu)";msg.textContent="초기화하는 중이다. 창을 닫지 말자...";
 try{const R={id:Date.now(),ts:Date.now()};C.rst=R;save();await DB.doc("players/"+UID+"/rst").set(R);RST={id:R.id,by:UID};
  msg.textContent="공용 기록을 지우는 중...";const w=await rstWipe();try{if(typeof plClear==="function")plClear();else PLC=null}catch(e){}
  msg.textContent="등록자를 모으는 중...";let ids=[];try{ids=await admGrantIds()}catch(e){ids=[]}
  let at=0,ok=0,empty=0,fail=0;const total=ids.length;
  async function worker(){for(;;){const i=at++;if(i>=total)return;const uid=ids[i];if(i%6===0)msg.textContent="캐릭터 회귀 중... "+i+" / "+total+" (성공 "+ok+", 실패 "+fail+")";
   try{const s=await DB.doc("accounts/"+uid).get();const acc=s.exists?s.data():null;if(!acc||!acc.c||typeof acc.c!=="object"){empty++;continue}
    await rstWrite(uid,acc.c,R);ok++}catch(e){String(e&&e.message||e)==="empty"?empty++:fail++}}}
  if(total)await Promise.all(Array.from({length:Math.min(6,total)},worker));
  if(C){const self=await rstTakeCloud(R.id);if(!self){C=rstShape(C,R.id);try{clearPend()}catch(e){}try{keep("mgr_rr_"+UID,String(R.id))}catch(e){}try{saveCloud(true)}catch(e){}try{regPlayer()}catch(e){}}
   C.rstn=R.id;save();try{hub()}catch(e){}}
  alertBox("🌑 시즌 초기화 완료","서버에서 캐릭터 "+total+"명 중 "+ok+"명을 되돌렸다."+(empty?" 기록 없음 "+empty+"명.":"")+(fail?" 실패 "+fail+"명.":"")+"\n플레이어에게는 다음 접속 때 알림이 한 번 뜬다.\n\n지운 것: "+(w.done.join(", ")||"없음")+(w.fail.length?"\n\n지우지 못한 것: "+w.fail.join(", ")+"\n(서버 규칙에서 운영자 쓰기가 막혀 있을 수 있다. Firebase 콘솔에서 직접 지워야 한다.)":""));
  msg.textContent=""}
 catch(e){msg.style.color="var(--bad)";msg.textContent="초기화를 끝내지 못했다. 인터넷 연결을 확인하고 다시 시도해 보자."}btn.disabled=false}
function drawRst(){const box=$("#rstbox");if(!box)return;if(box.querySelector(".rst-one input:focus,.adm-grant input:focus,.adm-grant select:focus,.adm-grant textarea:focus"))return;box.innerHTML="";box.hidden=!(C&&ADM[UID]&&XON());if(box.hidden)return;
 const c=elT("div","card rst-card");c.append(elT("h2","","🌑 시즌 초기화 (운영자 전용)"),
  elT("p","hint","버튼을 누르면 등록된 모든 캐릭터를 지금 서버에서 되돌린다. 이름·성별·마을·처음 속성·특성, 프로필, 칭호·도감·기록, 사역마, 레벨·골드, 장기 토벌·단서 진행은 남고, 시험으로 얻은 속성과 등급(E로)은 돌아간다."),
  elT("p","hint","함께 지우는 것: 단체·마을·1:1 채팅과 1:1 방 목록, 게시판, 친구 목록과 신청·공명·선물, 마을 경쟁, 마을 시설 단계와 기여 순위, 보스·웨이브·타락 레이드 기록. 공지와 '멸망까지', 출정·대련 방은 남는다."),
  elT("p","hint","플레이어 알림(팝업)은 다음 접속 때 한 번만 뜬다. 같은 회귀 번호는 다시 돌리지 않는다."),
  elT("p","hint",RST?"마지막 초기화: "+new Date(RST.id).toLocaleString("ko-KR"):"아직 초기화한 적이 없다."));
 const b=elT("button","btn rst-go","시즌 초기화 실행"),m=elT("p","msg","");b.type="button";b.onclick=()=>rstRun(b,m);c.append(b,m);box.appendChild(c);
 const rc=elT("div","card rst-card");rc.style.marginTop="12px";rc.append(elT("h2","","🏛 시설 기여 복구 (운영자 전용)"),
  elT("p","hint","각 플레이어 카드와 기여 기록에 남아 있는 시설 기여를 읽어, 마을별 전체 기여·단계와 개인 순위를 지금 기록에 맞춘다. 프로필 사진은 받지 않는다. 다시 실행해도 점수가 두 배로 쌓이지 않는다."));
 const rb=elT("button","btn","시설 기여 복구"),rm=elT("p","msg","");rb.type="button";rb.onclick=async()=>{if(!ADM[UID]||!XON()||typeof apiVfacRecover!=="function")return;
  const t=prompt("플레이어에게 저장된 시설 기여로 마을 단계와 순위를 다시 쓴다.\n기부가 몰리는 때는 피하고, 한 번만 실행하면 된다.\n\n계속하려면 '복구'라고 입력해 줘.");
  if((t||"").trim()!=="복구"){rm.style.color="var(--mu)";rm.textContent="취소했다.";return}
  rb.disabled=true;rm.style.color="var(--mu)";rm.textContent="복구하는 중이다. 창을 닫지 말자...";
  try{const w=await apiVfacRecover(s=>{rm.textContent=s});rm.style.color="var(--mu)";rm.textContent="복구했다. 플레이어 "+w.players+"명 중 기여 "+w.used+"명."+(w.skipped?" 마을이 없는 기록 "+w.skipped+"명.":"")+(w.failRead?" 읽지 못한 플레이어 "+w.failRead+"명.":"")+(w.failWrite?" 쓰지 못한 칸 "+w.failWrite+"개.":"")+(w.removed?" 옛 순위 "+w.removed+"개 삭제.":"");
   alertBox("🏛 시설 기여 복구",rm.textContent+(w.lines.length?"\n\n"+w.lines.join("\n"):"\n\n옮길 시설 기여가 없었다.")+"\n\n마을 탭에 다시 들어가면 맞춘 단계가 보인다.");}
  catch(e){rm.style.color="var(--bad)";rm.textContent="복구하지 못했다. 운영자 계정인지, 마을 단계 규칙이 서버에 올라갔는지 확인해 보자."}rb.disabled=false};
 rc.append(rb,rm);box.appendChild(rc);
 const pc=elT("div","card rst-card rst-one");pc.style.marginTop="12px";pc.append(elT("h2","","👤 개인 회귀 (운영자 전용)"),
  elT("p","hint","UID 한 명의 캐릭터만 시즌 초기화와 같이 지금 서버에서 되돌린다. 이름·성별·마을·처음 속성·특성, 프로필, 칭호·도감·기록, 사역마, 레벨·골드, 장기 토벌·단서 진행은 남고, 시험으로 얻은 속성은 사라지며 등급은 E로 돌아간다."),
  elT("p","hint","접속 중이 아니어도 서버 기록은 바로 바뀐다. 그 사람의 팝업 알림은 다음 접속 때 한 번. 채팅·게시판·선물·마을·보스와 다른 사람의 기록은 그대로 둔다."));
 const row=elT("div","row");row.style.marginTop="8px";const inp=elT("input");inp.type="text";inp.maxLength=128;inp.placeholder="계정 UID";inp.setAttribute("aria-label","회귀할 계정 UID");inp.autocomplete="off";inp.spellcheck=false;inp.style.flex="1";
 const pb=elT("button","btn","이 사람만 회귀"),pm=elT("p","msg","");pb.type="button";pb.style.cssText="width:auto;margin:0;padding:9px 14px";pb.onclick=()=>rstOne(pb,inp,pm);row.append(inp,pb);pc.append(row,pm);box.appendChild(pc);
 drawAdmGrant(box)}
async function rstOne(btn,inp,msg){if(!ADM[UID]||!XON())return;const uid=String(inp.value||"").trim();
 if(!/^[A-Za-z0-9]{8,128}$/.test(uid)){msg.style.color="var(--bad)";msg.textContent="UID는 영문과 숫자 8자 이상이어야 한다.";return}
 let name="";try{const s=await DB.doc("players/"+uid+"/n").get();if(s.exists&&typeof s.data()==="string")name=s.data().replace(/👑/g,"").trim().slice(0,20)}catch(e){}
 const who=name?name+" ("+uid+")":uid;
 const t=prompt(who+" 의 캐릭터를 지금 서버에서 되돌린다. 접속 중이 아니어도 적용된다. 채팅·게시판·선물·마을·보스와 다른 사람의 기록은 그대로다. 되돌릴 수 없다.\n\n계속하려면 '회귀'라고 입력해 줘.");
 if((t||"").trim()!=="회귀"){msg.style.color="var(--mu)";msg.textContent="취소했다.";return}
 btn.disabled=true;msg.style.color="var(--mu)";msg.textContent="기록을 되돌리는 중이다. 창을 닫지 말자...";
 try{const R={id:Date.now(),ts:Date.now()};
  let src=null;if(uid===UID&&C)src=C;else{const s=await DB.doc("accounts/"+uid).get();const acc=s.exists?s.data():null;if(!acc||!acc.c||typeof acc.c!=="object")throw new Error("empty");src=acc.c}
  const w=await rstWrite(uid,src,R);await DB.doc("players/"+UID+"/rstu/"+uid).set(R);
  if(uid===UID){C=w.ch;try{clearPend()}catch(e){}try{if(typeof accMark==="function")accMark()}catch(e){}try{keep("mgr_rr_"+UID,String(R.id))}catch(e){}
   C.rstn=R.id;note("notice",rstNoteTxt(true));save();try{hub()}catch(e){}msg.textContent="이 계정을 지금 회귀했다.";inp.value=""}
  else msg.textContent=who+" 의 캐릭터를 서버에서 지금 되돌렸다. 알림은 그 사람이 다음에 접속할 때 한 번 뜬다."+(w.late.length?" "+w.late.join(", ")+"은 그 사람이 다음에 접속하면 맞춰진다.":"");inp.value=""}
 catch(e){const c=String(e&&e.message||e);msg.style.color="var(--bad)";msg.textContent=c==="401"||c==="403"?"이 계정의 기록을 운영자가 직접 바꾸지 못했다. 데이터베이스 규칙에서 운영자의 계정 읽기와 쓰기가 열려 있는지 확인해야 한다.":c==="empty"?"그 UID의 캐릭터 기록을 찾지 못했다.":"저장하지 못했다. 인터넷 연결을 확인하고 다시 시도해 보자."}
 btn.disabled=false}

/* ── 전체·개인 보상 지급 (운영자 전용) ──
   공지 탭 하단. 전체는 accounts 등록자 전원, 개인은 UID 한 명. 접속 여부와 상관없이 서버 기록에 바로 더한다.
   골드·경험치·마력석·사역마 알·이벤트 알·가방 아이템·재료(이벤트 재료 포함)를 고르고 개수를 정한다. */
function admGrantNum(v,max){const n=Math.floor(Number(v)||0);if(!isFinite(n)||n<=0)return 0;return Math.min(max||999999,n)}
function admGrantTxt(r){const a=[];if(r.g)a.push("골드 +"+r.g);if(r.ex)a.push("경험치 +"+r.ex);if(r.m)a.push("마력석 +"+r.m);if(r.eggs)a.push("사역마의 알 +"+r.eggs);
 if(r.eggsEv)a.push((typeof PET_EV!=="undefined"?PET_EV.nm:"이벤트 알")+" +"+r.eggsEv);
 Object.entries(r.inv||{}).forEach(([id,n])=>{if(!(n>0))return;const it=typeof ITM!=="undefined"&&ITM.find(t=>t[0]===id);if(it){a.push(it[1]+" +"+n);return}
  const mat=typeof MAT!=="undefined"&&MAT.find(t=>t[0]===id);a.push((mat?mat[1]:id)+" +"+n)});
 return a.join(", ")||"없음"}
function admGrantOnChar(ch,r){const prev=C;C=ch;try{
  if(typeof xpMigrate==="function")xpMigrate();
  if(r.ex){C.ex=(Number(C.ex)||0)+r.ex;C.lv=typeof lvOf==="function"?lvOf(C.ex):(C.lv||1);C.xv=3}
  if(r.g){C.gd=(Number(C.gd)||0)+r.g;C.stats=C.stats||{};C.stats.maxGold=Math.max(Number(C.stats.maxGold)||0,Number(C.gd)||0)}
  C.inv=C.inv||{};if(r.m)C.inv.mana=(Number(C.inv.mana)||0)+r.m;
  if(r.eggs)C.eggs=(Number(C.eggs)||0)+(r.eggs|0);if(r.eggsEv)C.eggsEv=(Number(C.eggsEv)||0)+(r.eggsEv|0);
  Object.entries(r.inv||{}).forEach(([id,n])=>{n=n|0;if(!id||n<=0)return;C.inv[id]=(Number(C.inv[id])||0)+n});
  const txt=admGrantTxt(r);C.nt=Array.isArray(C.nt)?C.nt:[];C.nt.unshift({k:"gift",t:("운영자 보상: "+txt).slice(0,160),u:"",ts:Date.now(),r:false});
  try{if(typeof ntTrim==="function")ntTrim()}catch(e){}try{if(typeof eggFix==="function")eggFix()}catch(e){}
 }finally{C=prev}return ch}
async function admGrantIds(){let ids=[];
 try{ids=Object.keys((await DB.doc("accounts").peek())||{})}catch(e){}
 if(!ids.length){try{ids=Object.keys((await DB.doc("who").peek())||{})}catch(e){}}
 if(!ids.length){try{ids=Object.keys((await DB.doc("players").peek())||{})}catch(e){}}
 return ids.filter(u=>/^[A-Za-z0-9]{8,128}$/.test(u))}
async function admGrantSave(uid,r){if(uid===UID&&C){admGrantOnChar(C,r);try{if(typeof titleState==="function")titleState()}catch(e){}try{save();await saveCloud(true)}catch(e){throw e||new Error("save")}return "self"}
 const s=await DB.doc("accounts/"+uid).get();const acc=s.exists?s.data():null;if(!acc||!acc.c||typeof acc.c!=="object")throw new Error("empty");
 const ch=admGrantOnChar(JSON.parse(JSON.stringify(acc.c)),r);
 await DB.doc("accounts/"+uid).patch({c:ch,prog:{lv:ch.lv||1,ex:ch.ex||0,xv:ch.xv||3},ts:Date.now(),sid:"admin-grant"});return "ok"}
async function admGrantRun(btn,msg,getR){if(!ADM[UID]||!XON()||!DB)return;const r=getR();if(!r){msg.style.color="var(--bad)";msg.textContent="지급할 보상을 하나 이상 정해 줘.";return}
 const preview=admGrantTxt(r);const t=prompt("등록된 모든 캐릭터에 아래 보상을 지금 서버에 더한다. 접속 중이 아니어도 적용된다.\n\n"+preview+"\n\n계속하려면 '지급'이라고 입력해 줘.");
 if((t||"").trim()!=="지급"){msg.style.color="var(--mu)";msg.textContent="취소했다.";return}
 btn.disabled=true;msg.style.color="var(--mu)";msg.textContent="등록자를 모으는 중...";
 let ids=[];try{ids=await admGrantIds()}catch(e){msg.style.color="var(--bad)";msg.textContent="등록자 목록을 읽지 못했다.";btn.disabled=false;return}
 if(!ids.length){msg.style.color="var(--bad)";msg.textContent="지급할 등록자가 없다.";btn.disabled=false;return}
 let at=0,ok=0,empty=0,fail=0;const total=ids.length;
 async function worker(){for(;;){const i=at++;if(i>=total)return;const uid=ids[i];if(i%6===0)msg.textContent="지급하는 중... "+i+" / "+total+" (성공 "+ok+", 실패 "+fail+")";
  try{await admGrantSave(uid,r);ok++}catch(e){String(e&&e.message||e)==="empty"?empty++:fail++}}}
 await Promise.all(Array.from({length:Math.min(6,total)},worker));
 msg.style.color="var(--mu)";msg.textContent="지급했다. 대상 "+total+"명 · 성공 "+ok+"명"+(empty?" · 기록 없음 "+empty+"명":"")+(fail?" · 실패 "+fail+"명":"")+".";
 alertBox("🎁 전체 보상 지급","보상: "+preview+"\n\n"+msg.textContent+(fail?"\n\n실패한 계정은 데이터베이스 규칙(운영자 계정 읽기·쓰기)을 확인해 보자.":"")+"\n\n접속 중인 사람은 탭을 다시 보이거나 잠시 뒤 기록이 맞춰질 수 있다.");
 btn.disabled=false}
async function admGrantOne(btn,msg,getR,uidInp){if(!ADM[UID]||!XON()||!DB)return;const uid=String(uidInp&&uidInp.value||"").trim();
 if(!/^[A-Za-z0-9]{8,128}$/.test(uid)){msg.style.color="var(--bad)";msg.textContent="UID는 영문과 숫자 8자 이상이어야 한다.";return}
 const r=getR();if(!r){msg.style.color="var(--bad)";msg.textContent="지급할 보상을 하나 이상 정해 줘.";return}
 let name="";try{const s=await DB.doc("players/"+uid+"/n").get();if(s.exists&&typeof s.data()==="string")name=s.data().replace(/👑/g,"").trim().slice(0,20)}catch(e){}
 const who=name?name+" ("+uid+")":uid,preview=admGrantTxt(r);
 const t=prompt(who+" 에게 아래 보상을 지금 서버에 더한다. 접속 중이 아니어도 적용된다.\n\n"+preview+"\n\n계속하려면 '지급'이라고 입력해 줘.");
 if((t||"").trim()!=="지급"){msg.style.color="var(--mu)";msg.textContent="취소했다.";return}
 btn.disabled=true;msg.style.color="var(--mu)";msg.textContent="지급하는 중이다...";
 try{await admGrantSave(uid,r);msg.style.color="var(--mu)";msg.textContent=who+" 에게 지급했다. "+preview;uidInp.value="";
  alertBox("🎁 개인 보상 지급",who+" 에게 지급했다.\n\n보상: "+preview+"\n\n접속 중이면 탭을 다시 보이거나 잠시 뒤 기록이 맞춰질 수 있다.")}
 catch(e){const c=String(e&&e.message||e);msg.style.color="var(--bad)";msg.textContent=c==="401"||c==="403"?"이 계정의 기록을 운영자가 직접 바꾸지 못했다. 데이터베이스 규칙에서 운영자의 계정 읽기와 쓰기가 열려 있는지 확인해야 한다.":c==="empty"?"그 UID의 캐릭터 기록을 찾지 못했다.":"저장하지 못했다. 인터넷 연결을 확인하고 다시 시도해 보자."}
 btn.disabled=false}
function admGrantRow(opts,aria){const row=elT("div","row");row.style.cssText="margin-top:6px;gap:6px;align-items:center";
 const sel=elT("select");sel.style.cssText="flex:1;min-width:0";sel.setAttribute("aria-label",aria);const z=elT("option");z.value="";z.textContent="(선택 안 함)";sel.appendChild(z);
 opts.forEach(([id,nm])=>{const o=elT("option");o.value=id;o.textContent=nm;sel.appendChild(o)});
 const qty=elT("input");qty.type="number";qty.min="0";qty.max="9999";qty.step="1";qty.value="0";qty.placeholder="개수";qty.setAttribute("aria-label",aria+" 개수");qty.style.cssText="width:88px;flex:0 0 auto";
 row.append(sel,qty);return{row,sel,qty}}
function admGrantFields(gc){const evNm=typeof PET_EV!=="undefined"?PET_EV.nm:"이벤트 알";
 const mkNum=(label,aria)=>{const wrap=elT("label","");wrap.style.cssText="display:flex;align-items:center;gap:8px;margin-top:6px;font-size:.88rem;color:var(--mu)";
  const sp=elT("span","",label);sp.style.cssText="flex:0 0 7.5em";const inp=elT("input");inp.type="number";inp.min="0";inp.max="999999";inp.step="1";inp.value="0";inp.setAttribute("aria-label",aria);inp.style.cssText="flex:1;min-width:0";
  wrap.append(sp,inp);return{wrap,inp}};
 const gIn=mkNum("골드","지급 골드"),exIn=mkNum("경험치","지급 경험치"),mIn=mkNum("마력석","지급 마력석"),egIn=mkNum("사역마 알","지급 사역마 알"),evIn=mkNum("이벤트 알","지급 "+evNm);
 gc.append(gIn.wrap,exIn.wrap,mIn.wrap,egIn.wrap,evIn.wrap);
 const itBox=elT("div");itBox.style.marginTop="10px";itBox.appendChild(elT("p","hint","가방 아이템"));const itRows=[];
 const itOpts=(typeof ITM!=="undefined"?ITM:[]).filter(t=>t[0]!=="mana").map(t=>[t[0],t[1]]);
 const addIt=()=>{const x=admGrantRow(itOpts,"가방 아이템");itRows.push(x);itBox.appendChild(x.row)};addIt();
 const itAdd=elT("button","chip","아이템 칸 추가");itAdd.type="button";itAdd.style.cssText="margin-top:6px;padding:5px 12px;font-size:.8rem";itAdd.onclick=()=>addIt();itBox.appendChild(itAdd);gc.appendChild(itBox);
 const matBox=elT("div");matBox.style.marginTop="10px";matBox.appendChild(elT("p","hint","재료·이벤트 아이템"));const matRows=[];
 const matOpts=(typeof MAT!=="undefined"?MAT:[]).map(t=>[t[0],t[1]]);
 const addMat=()=>{const x=admGrantRow(matOpts,"재료 아이템");matRows.push(x);matBox.appendChild(x.row)};if(matOpts.length){addMat();
  const matAdd=elT("button","chip","재료 칸 추가");matAdd.type="button";matAdd.style.cssText="margin-top:6px;padding:5px 12px;font-size:.8rem";matAdd.onclick=()=>addMat();matBox.appendChild(matAdd);gc.appendChild(matBox)}
 return()=>{const inv={};const take=(rows)=>{rows.forEach(({sel,qty})=>{const id=String(sel.value||"");const n=admGrantNum(qty.value,9999);if(!id||!n)return;inv[id]=(inv[id]||0)+n})};
  take(itRows);take(matRows);const r={g:admGrantNum(gIn.inp.value),ex:admGrantNum(exIn.inp.value),m:admGrantNum(mIn.inp.value),eggs:admGrantNum(egIn.inp.value,9999),eggsEv:admGrantNum(evIn.inp.value,9999),inv};
  if(!r.g&&!r.ex&&!r.m&&!r.eggs&&!r.eggsEv&&!Object.keys(inv).length)return null;return r}}
function drawAdmGrant(box){const evNm=typeof PET_EV!=="undefined"?PET_EV.nm:"이벤트 알";
 const gc=elT("div","card rst-card adm-grant");gc.style.marginTop="12px";
 gc.append(elT("h2","","🎁 전체 보상 지급 (운영자 전용)"),
  elT("p","hint","accounts 에 캐릭터가 있는 모든 등록자에게 보상을 바로 더한다. 접속 여부와 상관없다. 알림함에도 '운영자 보상'이 남는다."),
  elT("p","hint","골드·경험치·마력석·사역마 알·"+evNm+"·가방 아이템·재료를 고르고 개수를 정한 뒤 지급한다."));
 const getAll=admGrantFields(gc);const gb=elT("button","btn","전체에게 지급"),gm=elT("p","msg","");gb.type="button";gb.style.marginTop="12px";gb.onclick=()=>admGrantRun(gb,gm,getAll);gc.append(gb,gm);box.appendChild(gc);
 const pc=elT("div","card rst-card adm-grant");pc.style.marginTop="12px";
 pc.append(elT("h2","","🎁 개인 보상 지급 (운영자 전용)"),
  elT("p","hint","UID 한 명의 캐릭터에만 보상을 더한다. 접속 중이 아니어도 서버 기록에 바로 반영된다. 보상 종류는 전체 지급과 같다."),
  elT("p","hint","골드·경험치·마력석·사역마 알·"+evNm+"·가방 아이템·재료를 고르고 개수를 정한 뒤, 대상 UID를 넣고 지급한다."));
 const urow=elT("div","row");urow.style.cssText="margin-top:8px;gap:6px";const uinp=elT("input");uinp.type="text";uinp.maxLength=128;uinp.placeholder="계정 UID";uinp.setAttribute("aria-label","보상 받을 계정 UID");uinp.autocomplete="off";uinp.spellcheck=false;uinp.style.flex="1";urow.appendChild(uinp);pc.appendChild(urow);
 const getOne=admGrantFields(pc);const pb=elT("button","btn","이 사람에게 지급"),pm=elT("p","msg","");pb.type="button";pb.style.marginTop="12px";pb.onclick=()=>admGrantOne(pb,pm,getOne,uinp);pc.append(pb,pm);box.appendChild(pc)}
