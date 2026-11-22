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

/* ── '멸망까지' 카운트다운 (현실 28일 · 게임 14일) ──
   기간은 doom 한 칸뿐이다. 운영자가 다시 저장하면 그 날짜가 이전 날짜를 갈아 끼운다. 로그인한 사람은 읽고, 운영자만 고친다.
   시작일은 운영자에게만 보이고, 진행 중인 타이머는 모두에게 보인다.
   운영자가 시작일을 고르면 그날이 시작, 현실 28일 뒤가 D-DAY다. 값: {d:"2026-10-27", ts} 또는 {off:1, ts}(꺼짐).
   시계: 현실 2일=게임 1일(최대 D-14). 시작부터 홀수째 현실일=낮, 짝수째=밤. */
const DOOM_DAYS = 28;
const DOOM_REAL_PER_GAME = 2;
let DOOM = null;
const doomOk = o => !!o&&typeof o==="object"&&/^\d{4}-\d{2}-\d{2}$/.test(String(o.d||""));
const doomYmd = t => {
   const d = new Date(t);
   return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const doomDay=s=>{const [y,m,d]=String(s).split("-").map(Number);return Math.round(Date.UTC(y,m-1,d)/86400000)};
function doomState(o){
   if(!doomOk(o))return null;
   const st = doomDay(o.d),end=st+DOOM_DAYS,today=doomDay(doomYmd(srvNow())),left=end-today;
   const e = new Date(Date.UTC(1970,0,1)+end*86400000),endTx=(e.getUTCMonth()+1)+"월 "+e.getUTCDate()+"일";
   const [,sm,sd]=o.d.split("-").map(Number);
 /* elapsed: 시작일=0. 홀수째(1,3,…) 현실일 → 낮, 짝수째 → 밤. gLeft: 남은 게임일(표시용). */
   const elapsed=Math.max(0,Math.min(DOOM_DAYS,today-st));
   const nth = elapsed+1;
   const dayPhase = nth % 2 === 1
   const gLeft = left <= 0 ? 0 : Math.ceil(left/DOOM_REAL_PER_GAME)
   const gDay = Math.min(DOOM_DAYS/DOOM_REAL_PER_GAME , Math.floor(elapsed/DOOM_REAL_PER_GAME)+1);
   return {left,gLeft,gDay,dayPhase,before:today<st,after:today>end,endTx,startTx:sm+"월 "+sd+"일",pct:Math.max(0,Math.min(100,(today-st)/DOOM_DAYS*100))}}

async function loadDoom(){
   if(!XON())return;
   try{
      const r = await DB.doc("doom").get();
      const d = r.exists ? r.data() : null;
      DOOM = doomOk(d)?d:null
   } catch (e) {

   }
   drawDoom()
}

function drawDoom () {
   const b = $("#doom");
   
   if (!b) return;
   
   const isA = !!(C&&ADM[UID])
   const src = XON() ? DOOM : (C&&C.doom) || null
   const st = doomState(src);
   
   if(b.querySelector(".doom-form:not([hidden]) input:focus"))return;// 운영자가 날짜를 고르는 중이면 다시 그리지 않는다
   
   b.innerHTML="";
   const live=!!st&&!st.before&&!st.after,show=!!C&&(live||isA);b.hidden=!show;
   if(!show)return;
   
   /* 마지막 게임일(D-1·D-DAY): 낮/밤 무시, 기존 붉은 테마. */
   const final=live&&st.gLeft<=1,phase=live&&!final?(st.dayPhase?"day":"night"):"",phaseTx=st&&st.dayPhase?"낮":"밤",phaseMark=st&&st.dayPhase?"☀":"☾";
 const c=elT("div","doom-card"+(live&&(final||st.gLeft<=2)?" near":"")+(live&&st.left<=0?" dday":"")+(live?"":" off")+(phase?" "+phase:""));
 const l=elT("div","doom-l");l.append(elT("p","doom-t","멸망까지"+" · "+phaseMark));
 if(live)l.append(elT("p","doom-s",st.left<=0?"오늘 18:00시, 세계가 끝난다.":final?st.endTx+" 18:00시 멸망 · "+st.startTx+" 시작":st.endTx+" 18:00시 멸망 · 게임 "+st.gDay+"일째 "+phaseTx));
 else l.append(elT("p","doom-s",!st?"카운트다운이 꺼져 있다.":st.before?st.startTx+"에 시작한다 (D-14 · 현실 28일).":"멸망의 날("+st.endTx+" 18:00시)이 지났다."));
 c.append(l,elT("p","doom-n",live?(st.left<=0?"D-DAY":"D-"+st.gLeft):"—"));
 if(live){const bar=elT("div","bar doom-bar"),i=elT("i");i.style.width=st.pct+"%";bar.appendChild(i);c.appendChild(bar)}
 b.appendChild(c);
 if(isA){const set=elT("button","chip doom-set","⏳ 시작일 설정");set.type="button";
  const f=elT("form","doom-form");f.hidden=true;const inp=elT("input");inp.type="date";inp.value=doomOk(src)?src.d:doomYmd(srvNow());inp.setAttribute("aria-label","카운트다운 시작일");
  const hint=elT("p","hint","고른 날부터 현실 28일(표시 D-14). 2일=1일, 홀수째 낮·짝수째 밤.");
  const go=elT("button","btn","저장");go.type="submit";const off=elT("button","btn g","카운트다운 끄기");off.type="button";off.hidden=!doomOk(src);const cancel=elT("button","btn g","취소");cancel.type="button";const msg=elT("p","msg","");
  const upd=()=>{const v=doomState({d:inp.value});hint.textContent=v?"시작 "+v.startTx+" (D-14) → 멸망 "+v.endTx+" (D-DAY) · 현실 28일":"날짜를 골라야 한다."};inp.oninput=upd;upd();
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
   본선은 Cloud Function accountRst: 계정당 accounts 되돌림 → 그 UID players/who 반영을 한 흐름으로.
   클라는 공용 wipe·회귀 마커(rst/rstu)만 쓰고, 계정·명부 쓰기는 서버에 맡긴다.
   시즌은 players/{운영자}/rst 에 {id}. 캐릭터 C.rsv 가 그 id 이상이면 같은 회귀는 다시 안 돈다.
   접속(boot) 때는 이미 서버에 반영된 기록을 읽고, C.rstn < due 이면 알림만(다시 회귀시키지 않음).
   남기는 것: 이름·성별·마을·처음 속성·특성, 프로필, 칭호·도감·통계(대련 전적 제외), 사역마(친밀도·보유 상한),
   친구 관계(fr 등), flags, 보상·알림 표시.
   처음으로: 레벨·경험·골드, 등급 E, 시험 속성, 아이템·무기·각인·절망, 대련 전적 등.
   강제 취소: 장기 토벌(lh)·단서 탐색(clue). 알 부화·재고 0. 등대·시설 개인 칸 비움.
   시즌 wipe: 채팅·선물·마을·보스·타락·대련 방 등(계정 친구 목록 fr 은 남김). */
let RST=null;
/* lh·clue: KEEP에 넣지 않는다. 회귀 때 진행·완료 미수령도 강제 취소(보상 없음). lhGot·clueGot 도 함께 비움.
   egg·eggs·eggsEv·eggsEv2: KEEP에 넣지 않는다. 회귀 때 부화·재고 전부 0.
   lv·ex·xv·gd 는 KEEP에 넣지 않아 레벨 1·경험 0·골드 100으로 돌아간다. rstn 도 KEEP에 넣지 않는다(회귀마다 알림을 다시 띄우려고). */
/* scf(시즌 제작 1회 기록)는 KEEP에 넣지 않는다. 회귀하면 다시 만들 수 있다. */
/* duSeen·duNt·du·duD 는 KEEP에 넣지 않는다. 회귀하면 대련 신청 표시·진행·일일 보상 횟수가 비워진다. stats.duW/duL/duD 는 rstShape 에서 0으로 맞춘다. */
/* flags(일반·스토리 플래그 가방)는 시즌 회귀에도 남긴다 — 스토리/해금 진행 유지. */
/* 친구: fr·fq·fo·fs(워터마크). rel(프로필 관계란)도 유지.
   사역마: pets(각 lm=친밀도 상한)·pet·petMax(보유 상한)·stats(안에 petMax). 알 재고는 비움. */
const RST_KEEP=["n","s","v","a","t","img","pf","rel","picSig","titles","ti","dex","stats","pets","pet","petSeen","petGone","petMax",
 "fr","fq","fo","fs","flags","cmp","founder","origin","rescued","tut","healOff","ntcl","doom","rst","born","last",
 "rs","gs","nts","ntcSeen","vcSeen","bdSeen","rsn","pn","drn","drw","wvn1","wvn2","pc","wvc","wbc","gwc"];
const rstOld=p=>!!RST&&!!p&&typeof p==="object"&&(Number(p.rv)||0)<RST.id;
const rstNoteTxt=one=>one?"🌑 운영자가 이 캐릭터만 회귀시켰다. 이름·사역마·친구·프로필·기록은 남고, 장기 토벌·단서 탐색은 강제 취소되며 알 재고·부화는 비워지고, 레벨·경험치·골드·대련 전적과 시험으로 얻은 속성은 사라지며 등급은 E로 돌아간다.":"🌑 새 시즌이 시작되었다. 이름·사역마·친구·프로필·기록은 남고, 장기 토벌·단서 탐색은 강제 취소되며 알 재고·부화는 비워지고, 레벨·경험치·골드·대련 전적과 시험으로 얻은 속성은 사라지며 등급은 E로 돌아간다.";
const rstAlertMsg=one=>(one?"운영자가 이 캐릭터만 회귀시켰다.":"운영자가 시즌을 초기화했다.")+"\n\n남은 것: 이름·성별·마을·처음 속성·특성, 프로필, 칭호·도감·기록, 사역마(친밀도·보유 상한), 친구 목록\n처음으로 돌아간 것: 레벨·경험치·골드, 등급(E)·시험으로 얻은 속성·아이템·무기·각인·절망도·대련 전적 등\n강제 취소: 장기 토벌·단서 탐색(진행 중·완료 미수령 포함, 보상 없음), 알 재고·부화 중 알(전부 0)\n\n"+(one?"다른 사람의 기록은 그대로다.":"새로운 이야기를 시작하자.");
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
 /* 장기 토벌·단서: 진행 중·완료 미수령도 강제 취소(보상 없음). 정산 중복 방지 칸도 비움. */
 delete keep.lh;delete keep.clue;delete keep.lhGot;delete keep.clueGot;delete keep.egg;delete keep.eggs;delete keep.eggsEv;delete keep.eggsEv2;
 const next=Object.assign({lv:1,ex:0,xv:3,cl:0,dz:0,b:0,gd:100,inv:{},wps:[],wp:-1,wl:{},titles:[],ti:""},keep,{rsv:id,nt:[],g:(typeof GL==="string"&&GL[0])||"E"});
 next.lh=null;next.clue=null;next.lhGot={};next.clueGot={};
 /* 알: 부화·재고 전부 0(환불 없음). */
 try{if(typeof eggRstAbort==="function")eggRstAbort(next);else{next.egg=null;next.eggs=0;next.eggsEv=0;next.eggsEv2=0}}catch(e){next.egg=null;next.eggs=0;next.eggsEv=0;next.eggsEv2=0}
 /* 희망의 등대·마을 시설 개인 칸: 기여·기억 단계·일일 이용 비움(공용 tally/vfac 는 시즌 wipe). */
 next.wf=0;next.wfl=0;next.wfDone=null;next.wfu=null;next.fc={};next.facl={};next.fu=null;
 next.stats=Object.assign({},next.stats);next.stats.maxGold=Math.max(Number(next.stats.maxGold)||0,Number(next.gd)||0,100);
 next.stats.duW=0;next.stats.duL=0;next.stats.duD=0;
 next.stats.wfGive=0;next.stats.facGive=0;next.stats.facUses=0;
 /* 사역마 보유 상한: petMax 와 stats.petMax 중 큰 쪽을 맞춘다(허가증 기록 유지). */
 {const pm=Math.max(Number(next.petMax)||0,Number(next.stats.petMax)||0);if(pm>0){next.petMax=pm;next.stats.petMax=Math.max(Number(next.stats.petMax)||0,pm)}}
 try{if(typeof flagsEnsure==="function")flagsEnsure(next);else if(!next.flags)next.flags={flag:{},story_flag:{}}}catch(e){}
 const prev=C;C=next;try{if(typeof eggFix==="function")eggFix()}catch(e){}const out=C;C=prev;return out}
/* 등록자 미러만: Cloud Function(rosterMirrorSync). 캐릭터는 안 바꿈.
   회귀(되돌림+명부)는 accountRstCall → accountRst. */
function rosterCacheClear(){try{if(typeof plClear==="function")plClear();else if(typeof PLC!=="undefined")PLC=null}catch(e){}
 try{if(typeof rsSnapClear==="function")rsSnapClear()}catch(e){}}
async function rosterPeekMaxLv(){let max=0,n=0;try{const sn=await once(DB.collection("players").by("lv").limit(8));(sn.docs||[]).forEach(d=>{const lv=Math.max(0,Number((d.data()||{}).lv)||0);if(lv>max)max=lv;n++})}catch(e){try{const sn=await once(DB.collection("players").by("pw").limit(8));(sn.docs||[]).forEach(d=>{const lv=Math.max(0,Number((d.data()||{}).lv)||0);if(lv>max)max=lv;n++})}catch(e2){}}
 return{max,n}}
/* 서버 응답을 그대로 담아 실패 종류(write/read/…)를 화면 문구에 쓴다. */
function rosterMirrorErr(j,status){const e=new Error((j&&j.why)||("MIRROR_"+status));e.why=j&&j.why;e.payload=j||null;e.status=status;return e}
function rosterMirrorFailTxt(rost){const rf=Number(rost&&rost.readFail)||0,wf=Number(rost&&rost.writeFail)||0,parts=[];
 if(rf)parts.push("계정 조회 실패 "+rf+"명");
 if(wf)parts.push("공개 카드·명부 쓰기 실패 "+wf+"명(조회만 되고 PATCH/update 가 거절됨)");
 return parts.join(" · ")}
async function rosterMirrorCall(mode,uids){const url=typeof FB_ROSTER_MIRROR_URL==="string"&&FB_ROSTER_MIRROR_URL;if(!url)throw new Error("MIRROR_URL");
 if(!AUTH.tok)throw new Error("auth");
 const body={mode:mode==="rst"?"rst":"sync"};
 if(Array.isArray(uids)&&uids.length)body.uids=uids.filter(u=>/^[A-Za-z0-9]{8,128}$/.test(String(u||"")));
 const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+AUTH.tok},body:JSON.stringify(body)});
 let j=null;try{j=await r.json()}catch(e){j=null}
 if(r.status===401||r.status===403)throw rosterMirrorErr(j||{why:String(r.status)},r.status);
 /* 207·500 등: 본문에 집계가 있으면 호출측이 문구로 보여 준다. */
 if(!r.ok||!(j&&j.ok)){const err=rosterMirrorErr(j,r.status);if(j)err.partial=j;throw err}
 return j}
function accountRstFailTxt(j){const f=Number(j&&j.fail)||0,e=Number(j&&j.empty)||0,parts=[];
 if(f)parts.push("실패 "+f+"명");if(e)parts.push("기록 없음 "+e+"명");return parts.join(" · ")}
/* 회귀 본선: 서버가 계정당 accounts 되돌림 → 그 UID players/who 반영. */
async function accountRstCall(rstId,uids){const url=typeof FB_ACCOUNT_RST_URL==="string"&&FB_ACCOUNT_RST_URL;if(!url)throw new Error("RST_URL");
 if(!AUTH.tok)throw new Error("auth");
 const body={id:Number(rstId)||0};
 if(Array.isArray(uids)&&uids.length)body.uids=uids.filter(u=>/^[A-Za-z0-9]{8,128}$/.test(String(u||"")));
 const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+AUTH.tok},body:JSON.stringify(body)});
 let j=null;try{j=await r.json()}catch(e){j=null}
 if(r.status===401||r.status===403)throw rosterMirrorErr(j||{why:String(r.status)},r.status);
 if(!r.ok||!(j&&j.ok)){const err=rosterMirrorErr(j,r.status);if(j)err.partial=j;throw err}
 return j}
async function rosterForceRun(btn,msg){if(!ADM[UID]||!XON()||!DB)return;
 const t=prompt("서버가 accounts 기준으로 등록자(players)·명부(who)를 다시 쓴다. 캐릭터 본문은 건드리지 않는다.\n이름·등급·특성·속성·레벨·토벌·전투력·칭호·사역마 요약 등을 맞춘다. 계정 없는 고아 명부는 지운다.\n\n계속하려면 '동기화'라고 입력해 줘.");
 if((t||"").trim()!=="동기화"){msg.style.color="var(--mu)";msg.textContent="취소했다.";return}
 btn.disabled=true;msg.style.color="var(--mu)";msg.textContent="서버에서 명부를 맞추는 중...";
 try{const rost=await rosterMirrorCall("sync");rosterCacheClear();
  let peak={max:0};try{peak=await rosterPeekMaxLv()}catch(e){}
  try{if(typeof roster==="function"&&$("#v-roster")&&!$("#v-roster").hidden)roster()}catch(e){}
  const peakTxt=peak.max?" · 동기화 후 players 최고 레벨 "+peak.max:"";
  const failTxt=rosterMirrorFailTxt(rost);
  msg.style.color=failTxt?"var(--bad)":"var(--mu)";msg.textContent="동기화했다. 대상 "+(rost.total||0)+"명 · 맞춤 "+(rost.synced||0)+"명"+(rost.gone?" · 고아 삭제 "+rost.gone+"명":"")+(failTxt?" · "+failTxt:"")+peakTxt+".";
  alertBox("📋 명부 강제 동기화",msg.textContent+(failTxt?"\n\n"+failTxt+". 잠시 뒤 다시 동기화해 보자.":"")+(peak.max>20?"\n\n아직 레벨 "+peak.max+" 카드가 보인다. 계정(c)이 회귀되지 않았거나, 접속 중인 옛 탭이 다시 올렸을 수 있다.":"")+"\n\n등록자 탭을 다시 열면 맞춘 목록이 보인다.")}
 catch(e){const c=String(e&&e.why||e&&e.message||e),partial=e&&e.partial;
  if(partial){rosterCacheClear();const failTxt=rosterMirrorFailTxt(partial)||(c==="write"?"공개 카드·명부 쓰기(PATCH/update) 실패":"명부 동기화 실패");
   msg.style.color="var(--bad)";msg.textContent="조회는 했으나 쓰기에 실패했다. 맞춤 "+(partial.synced||0)+"/"+(partial.total||0)+" · "+failTxt+(partial.msg?" ("+partial.msg+")":"")+".";
   alertBox("📋 명부 강제 동기화",msg.textContent+"\n\n다시 '명부 강제 동기화'를 눌러 보자.");btn.disabled=false;return}
  msg.style.color="var(--bad)";msg.textContent=c==="403"||c==="401"?"운영자만 서버 명부 동기화를 쓸 수 있다.":c==="MIRROR_URL"?"서버 주소를 찾지 못했다. 배포·캐시를 확인해 보자.":c==="write"?"계정은 조회됐지만 공개 카드·명부 쓰기에 실패했다. 잠시 뒤 다시 시도해 보자.":"동기화를 끝내지 못했다. 인터넷 연결과 함수 배포를 확인하고 다시 시도해 보자."}
 btn.disabled=false}
/* 회귀 본선은 서버 accountRst(계정당 되돌림+명부). 클라 rstWrite 는 쓰지 않는다. */
function rstClearTripUI(){try{lhDefer=null}catch(e){}
 try{if(typeof hubLH==="function")hubLH()}catch(e){}
 try{if(typeof clueDraw==="function")clueDraw()}catch(e){}
 try{if(typeof drawPets==="function"&&$("#v-growth")&&!$("#v-growth").hidden)drawPets()}catch(e){}
 try{if(typeof titleState==="function")titleState()}catch(e){}}
async function rstTakeCloud(due){if(!C||!UID||!DB)return false;
 try{const s=await DB.doc("accounts/"+UID).get();const ch=s.exists&&s.data()&&s.data().c;if(!ch||typeof ch!=="object"||(Number(ch.rsv)||0)<due)return false;
  /* 회귀 수령: 장기·단서 강제 취소. 알 부화·재고는 0(옛 서버본에 남아 있어도). */
  C=ch;C.lh=null;C.clue=null;C.lhGot={};C.clueGot={};
  try{if(typeof eggRstAbort==="function")eggRstAbort(C);else{C.egg=null;C.eggs=0;C.eggsEv=0;C.eggsEv2=0}}catch(e){C.egg=null;C.eggs=0;C.eggsEv=0;C.eggsEv2=0}
  try{clearPend()}catch(e){}try{if(typeof accMark==="function")accMark()}catch(e){}try{keep("mgr_rr_"+UID,String(due))}catch(e){}
  try{if(typeof raidClear==="function")raidClear()}catch(e){}try{regPlayer()}catch(e){}rstClearTripUI();save();return true}catch(e){return false}}
async function rstCheck(boot){if(!C||!XON())return;const R=await rstLoad(),one=await rstOneLoad(),rr=await rstRr();if(!C)return;
 const cur=Number(C.rsv)||0,gid=R?R.id:0,oid=Math.max(one?one.id:0,rr),due=Math.max(gid,oid);if(!(due>0))return;
 const isOne=oid>0&&oid>=gid&&oid>=due;
 if(Number(C.born)>due){if(cur<due){C.rsv=due;save()}return}
 if(cur<due){const ok=await rstTakeCloud(due);if(!ok){C=rstShape(C,due);try{clearPend()}catch(e){}try{keep("mgr_rr_"+UID,String(due))}catch(e){}
  try{saveCloud(true)}catch(e){}try{regPlayer()}catch(e){}try{if(typeof raidClear==="function")raidClear()}catch(e){}rstClearTripUI()}}
 if(!boot||(Number(C.rstn)||0)>=due)return;
 C.rstn=due;note("notice",rstNoteTxt(isOne));save();
 setTimeout(()=>alertBox(isOne?"🌑 개인 회귀":"🌑 새 시즌",rstAlertMsg(isOne)),900)}
/* 회귀는 서버에서 캐릭터를 통째로 바꾼 뒤, 로그인·공지 화면의 rstCheck 로만 맞춘다.
   마을에 머무는 동안 rr 실시간 연결은 두지 않는다. */
// 서버의 공용 데이터 지우기. 프로필 사진(wboss/pic·picm)과 시계 맞추기(wboss/clk)는 남긴다.
async function rstWipe(){const done=[],fail=[];
 const del=async(p,label)=>{try{await DB.doc(p).delete();done.push(label)}catch(e){fail.push(label+" ("+String(e&&e.message||e)+")")}};
 for(const [p,l] of [["chat","단체·마을 채팅과 게시판"],["board","게시판 댓글"],["dm","1:1 채팅"],["dmn","1:1 새 메시지 표시"],["fmsg","친구 신청·소식"],["res","공명 요청"],["gift","선물"],["giftn","선물 도착 표시"],["ginbox","받은 선물함"],["guard","마을 경쟁"],["vfac","마을 시설 단계"],["vfactop","마을 시설 기여 순위"],["tally/wf","희망의 등대 합계"],["tally/dr","재해 진압 합계"],["tally/seed","등대·시설 시드 자물쇠"],["score","시설·등대·재해 기여 카드"],["raid","타락 레이드"],["raidhit","타락 레이드 기록"],["event_minigame/flanders","플랜더스 밑그림 랭킹·합계"]])await del(p,l);
 try{if(typeof WFD==="object"){WFD={sum:0,v:{},top:[]}}if(typeof FACD==="object")FACD={};if(typeof facSrv==="object")facSrv={};if(typeof facFly==="object")facFly={};if(typeof vfacReady==="object")vfacReady={};if(typeof DRP==="object"){for(const k of Object.keys(DRP))delete DRP[k]}if(typeof scoreSig!=="undefined")scoreSig="";if(typeof facAt!=="undefined")facAt=0}catch(e){}
 /* 1:1 방 목록은 rooms/xd{uid}. 대련은 xa(신청)·xb(대련)·xr(구인 게시판, 키 정확히 xr). 출정(xm·xv·xr{묶음}_{번호})은 남긴다. */
 try{const r=await fetch(FBU.replace(/\/+$/,"")+"/rooms.json?shallow=true"+(AUTH.tok?"&auth="+encodeURIComponent(AUTH.tok):""));if(!r.ok)throw new Error(r.status);
  const all=Object.keys((await r.json())||{}),xd=all.filter(k=>String(k).indexOf("xd")===0),du=all.filter(k=>{const s=String(k);return s.indexOf("xa")===0||s.indexOf("xb")===0||s==="xr"});
  let bad=0;for(const k of xd){try{await DB.doc("rooms/"+k).delete()}catch(e){bad++}}if(bad)fail.push("1:1 방 목록 "+bad+"/"+xd.length+"개");else done.push("1:1 방 목록 "+xd.length+"개");
  bad=0;for(const k of du){try{await DB.doc("rooms/"+k).delete()}catch(e){bad++}}if(bad)fail.push("대련 방 "+bad+"/"+du.length+"개");else done.push("대련 방 "+du.length+"개")}catch(e){fail.push("1:1·대련 방 ("+String(e&&e.message||e)+")")}
 try{const r=await fetch(FBU.replace(/\/+$/,"")+"/wboss.json?shallow=true"+(AUTH.tok?"&auth="+encodeURIComponent(AUTH.tok):""));if(!r.ok)throw new Error(r.status);const ks=Object.keys((await r.json())||{}).filter(k=>!["pic","picm","clk"].includes(k));
  let bad=0;for(const k of ks){try{await DB.doc("wboss/"+k).delete()}catch(e){bad++}}if(bad)fail.push("보스·웨이브 기록 "+bad+"/"+ks.length+"개");else done.push("보스·웨이브 기록 "+ks.length+"개")}catch(e){fail.push("보스·웨이브 기록 ("+String(e&&e.message||e)+")")}
 return {done,fail}}
async function rstRun(btn,msg){if(!ADM[UID]||!XON())return;
 const t=prompt("모든 플레이어의 캐릭터와 채팅·게시판·친구 신청 우편함·마을 경쟁·보스·대련 방/전적·미니게임 랭킹이 지금 서버에서 초기화된다. 장기 토벌·단서 탐색은 진행·완료 미수령이어도 강제 취소(보상 없음). 알 재고·부화는 전부 0. 계정 친구 목록·사역마 상한은 남는다. 되돌릴 수 없다.\n\n계속하려면 '초기화'라고 입력해 줘.");
 if((t||"").trim()!=="초기화"){msg.textContent="취소했다.";return}
 btn.disabled=true;msg.style.color="var(--mu)";msg.textContent="초기화하는 중이다. 창을 닫지 말자...";
 try{const R={id:Date.now(),ts:Date.now()};C.rst=R;save();await DB.doc("players/"+UID+"/rst").set(R);RST={id:R.id,by:UID};
  msg.textContent="공용 기록을 지우는 중...";const w=await rstWipe();try{if(typeof plClear==="function")plClear();else PLC=null}catch(e){}
  msg.textContent="서버에서 캐릭터·명부를 계정당 되돌리는 중...";
  let rost={synced:0,total:0,empty:0,fail:0},rstErr="",rstPartial=null;
  try{rost=await accountRstCall(R.id)}catch(e){rstErr=String(e&&e.why||e&&e.message||e);rstPartial=e&&e.partial||null;if(rstPartial)rost=rstPartial}
  if(C){const self=await rstTakeCloud(R.id);if(!self){C=rstShape(C,R.id);try{clearPend()}catch(e){}try{keep("mgr_rr_"+UID,String(R.id))}catch(e){}try{saveCloud(true)}catch(e){}try{regPlayer()}catch(e){}rstClearTripUI()}
   C.rstn=R.id;save();try{if(typeof pubScore==="function")pubScore()}catch(e){}try{hub()}catch(e){}try{if(typeof hubFac==="function")hubFac()}catch(e){}}
  rosterCacheClear();
  let peak={max:0};try{peak=await rosterPeekMaxLv()}catch(e){}
  const peakTxt=peak.max?" 회귀 후 players 최고 레벨 "+peak.max+".":"";
  const failTxt=accountRstFailTxt(rost);
  const lateTxt=rstErr||failTxt?"\n\n회귀: "+(failTxt||("서버 처리 실패 ("+rstErr+")"))+". 실패한 UID는 개인 회귀로 다시 돌리거나, 계정만 맞다면 '명부 강제 동기화'를 눌러 보자.":"";
  alertBox("🌑 시즌 초기화 완료","서버에서 캐릭터 "+(rost.total||0)+"명 중 "+(rost.synced||0)+"명을 되돌리고 명부에 반영했다."+(rost.empty?" 기록 없음 "+rost.empty+"명.":"")+(rost.fail?" 실패 "+rost.fail+"명.":"")+peakTxt+lateTxt+"\n플레이어에게는 다음 접속 때 알림이 한 번 뜬다.\n\n지운 것: "+(w.done.join(", ")||"없음")+(w.fail.length?"\n\n지우지 못한 것: "+w.fail.join(", ")+"\n(서버 규칙에서 운영자 쓰기가 막혀 있을 수 있다. Firebase 콘솔에서 직접 지워야 한다.)":""));
  msg.textContent=""}
 catch(e){msg.style.color="var(--bad)";msg.textContent="초기화를 끝내지 못했다. 인터넷 연결·함수 배포를 확인하고 다시 시도해 보자."}btn.disabled=false}
/* 공지 탭 접기. 가방·상점·의뢰와 같은 fold-h / 접기▲·펼치기▼. */
function ntcListFold(open){const b=$("#ntctog"),box=$("#ntcbox");if(!b||!box)return;box.hidden=!open;b.textContent=open?"접기 ▲":"펼치기 ▼";b.setAttribute("aria-expanded",open?"true":"false");try{localStorage.setItem("mgr_ntc_list",open?"1":"0")}catch(e){}}
function rstFoldOpen(id,def){try{const v=localStorage.getItem("mgr_rst_"+id);if(v==null)return !!def;return v!=="0"}catch(e){return !!def}}
function rstFoldApply(btn,box,open,id){if(!btn||!box)return;box.hidden=!open;btn.textContent=open?"접기 ▲":"펼치기 ▼";btn.setAttribute("aria-expanded",open?"true":"false");if(id)try{localStorage.setItem("mgr_rst_"+id,open?"1":"0")}catch(e){}}
/* 운영 카드: 제목만 두고 본문은 접는다. 기본 접힘(defOpen=false). {c,box} */
function rstFoldCard(title,id,extraClass,defOpen){const c=elT("div","card rst-card"+(extraClass?" "+extraClass:""));c.style.marginTop="12px";
 const box=elT("div","rst-fold");box.id="rstb-"+id;
 const btn=elT("button","chip fold-btn","");btn.type="button";btn.setAttribute("aria-controls",box.id);btn.setAttribute("aria-label",title+" 접기 펼치기");
 const h=elT("h2","fold-h");h.append(elT("span","",title),btn);c.append(h,box);
 const open=rstFoldOpen(id,defOpen);rstFoldApply(btn,box,open,id);btn.onclick=()=>rstFoldApply(btn,box,box.hidden,id);
 return{c,box}}
function drawRst(){const box=$("#rstbox");if(!box)return;if(box.querySelector(".rst-one input:focus,.adm-grant input:focus,.adm-grant select:focus,.adm-grant textarea:focus"))return;box.innerHTML="";box.hidden=!(C&&ADM[UID]&&XON());if(box.hidden)return;
 const season=rstFoldCard("🌑 시즌 초기화 (운영자 전용)","season","",false);season.c.style.marginTop="0";
 season.box.append(elT("p","hint","버튼을 누르면 서버가 등록된 모든 캐릭터를 계정당 되돌리고, 같은 흐름에서 등록자(players)·명부(who)까지 맞춘다. 이름·성별·마을·처음 속성·특성, 프로필, 칭호·도감·기록, 사역마(친밀도·보유 상한), 친구 목록은 남고, 장기 토벌·단서 탐색은 강제 취소되며 알 재고·부화는 0이 되고, 레벨·경험치·골드·대련 전적과 시험으로 얻은 속성·등급(E)은 돌아간다."),
  elT("p","hint","함께 지우는 것: 단체·마을·1:1 채팅과 1:1 방 목록, 게시판, 친구 신청·공명·선물 우편함(계정 친구 목록은 유지), 마을 경쟁, 마을 시설 단계·기여 순위, 희망의 등대 합계·기여 카드·재해 진압 합계, 보스·웨이브·타락 레이드 기록, 대련 신청·대련·구인 방, 플랜더스 밑그림 랭킹·합계. 캐릭터의 등대·시설 기여와 대련 전적도 0으로 돌아간다. 공지와 '멸망까지', 출정 방은 남는다."),
  elT("p","hint","플레이어 알림(팝업)은 다음 접속 때 한 번만 뜬다. 같은 회귀 번호는 다시 돌리지 않는다."),
  elT("p","hint",RST?"마지막 초기화: "+new Date(RST.id).toLocaleString("ko-KR"):"아직 초기화한 적이 없다."));
 const b=elT("button","btn rst-go","시즌 초기화 실행"),m=elT("p","msg","");b.type="button";b.onclick=()=>rstRun(b,m);season.box.append(b,m);box.appendChild(season.c);
 const vfac=rstFoldCard("🏛 시설 기여 복구 (운영자 전용)","vfac","",false);
 vfac.box.append(elT("p","hint","각 플레이어 카드와 기여 기록에 남아 있는 시설 기여를 읽어, 마을별 전체 기여·단계와 개인 순위를 지금 기록에 맞춘다. 프로필 사진은 받지 않는다. 다시 실행해도 점수가 두 배로 쌓이지 않는다."));
 const rb=elT("button","btn","시설 기여 복구"),rm=elT("p","msg","");rb.type="button";rb.onclick=async()=>{if(!ADM[UID]||!XON()||typeof apiVfacRecover!=="function")return;
  const t=prompt("플레이어에게 저장된 시설 기여로 마을 단계와 순위를 다시 쓴다.\n기부가 몰리는 때는 피하고, 한 번만 실행하면 된다.\n\n계속하려면 '복구'라고 입력해 줘.");
  if((t||"").trim()!=="복구"){rm.style.color="var(--mu)";rm.textContent="취소했다.";return}
  rb.disabled=true;rm.style.color="var(--mu)";rm.textContent="복구하는 중이다. 창을 닫지 말자...";
  try{const w=await apiVfacRecover(s=>{rm.textContent=s});rm.style.color="var(--mu)";rm.textContent="복구했다. 플레이어 "+w.players+"명 중 기여 "+w.used+"명."+(w.skipped?" 마을이 없는 기록 "+w.skipped+"명.":"")+(w.failRead?" 읽지 못한 플레이어 "+w.failRead+"명.":"")+(w.failWrite?" 쓰지 못한 칸 "+w.failWrite+"개.":"")+(w.removed?" 옛 순위 "+w.removed+"개 삭제.":"");
   alertBox("🏛 시설 기여 복구",rm.textContent+(w.lines.length?"\n\n"+w.lines.join("\n"):"\n\n옮길 시설 기여가 없었다.")+"\n\n마을 탭에 다시 들어가면 맞춘 단계가 보인다.");}
  catch(e){rm.style.color="var(--bad)";rm.textContent="복구하지 못했다. 운영자 계정인지, 마을 단계 규칙이 서버에 올라갔는지 확인해 보자."}rb.disabled=false};
 vfac.box.append(rb,rm);box.appendChild(vfac.c);
 const one=rstFoldCard("👤 개인 회귀 (운영자 전용)","one","rst-one",false);
 one.box.append(elT("p","hint","UID 한 명을 서버에서 되돌리고, 같은 흐름에서 그 사람 등록자·명부도 맞춘다(시즌과 동일 경로). 이름·성별·마을·처음 속성·특성, 프로필, 칭호·도감·기록, 사역마(친밀도·보유 상한), 친구 목록은 남고, 장기 토벌·단서 탐색은 강제 취소되며 알 재고·부화는 0이 되고, 레벨·경험치·골드·대련 전적과 시험으로 얻은 속성은 사라지며 등급은 E로 돌아간다."),
  elT("p","hint","접속 중이 아니어도 서버 기록은 바로 바뀐다. 그 사람의 팝업 알림은 다음 접속 때 한 번. 채팅·게시판·선물·마을·보스·공용 대련 방과 다른 사람의 기록은 그대로 둔다."));
 const row=elT("div","row");row.style.marginTop="8px";const inp=elT("input");inp.type="text";inp.maxLength=128;inp.placeholder="계정 UID";inp.setAttribute("aria-label","회귀할 계정 UID");inp.autocomplete="off";inp.spellcheck=false;inp.style.flex="1";
 const pb=elT("button","btn","이 사람만 회귀"),pm=elT("p","msg","");pb.type="button";pb.style.cssText="width:auto;margin:0;padding:9px 14px";pb.onclick=()=>rstOne(pb,inp,pm);row.append(inp,pb);one.box.append(row,pm);box.appendChild(one.c);
 const sync=rstFoldCard("📋 명부 강제 동기화 (운영자 전용)","roster","",false);
 sync.box.append(elT("p","hint","미러만 한다. 서버가 accounts 기준으로 등록자(players)·명부(who)를 다시 쓸 뿐, 캐릭터 본문·회귀는 하지 않는다. 계정은 맞는데 명부만 어긋날 때 쓴다."),
  elT("p","hint","이름·등급·특성·속성·레벨·토벌·전투력·칭호·사역마 요약을 맞춘다. 접속·휴면·사진(on/la/dm/im)은 건드리지 않는다. 상세 프로필·정밀 전투력은 각자 접속할 때 보정된다."));
 const sb=elT("button","btn","명부 강제 동기화"),sm=elT("p","msg","");sb.type="button";sb.onclick=()=>rosterForceRun(sb,sm);sync.box.append(sb,sm);box.appendChild(sync.c);
 const ghost=rstFoldCard("☍ 유령 친구 정리 (운영자 전용)","ghost","",false);
 ghost.box.append(elT("p","hint","캐릭터 이름(c/n)이 없는 계정을 유령으로 본다. 다른 사람의 친구·신청 칸(fr·fq·fo)에서 빼고, 계약직 명부(who)·공개 카드(players)·대련 roster 고아 칸도 지운다. 탈퇴 누락분 정리용이다."),
  elT("p","hint","접속 중인 사람은 새로고침·재로그인 후 친구 목록이 맞춰진다. 캐시된 계약직 목록은 잠시 뒤·명부 다시 열면 갱신된다."));
 const fb=elT("button","btn","유령 친구·명부 정리"),fm=elT("p","msg","");fb.type="button";fb.onclick=()=>frGhostRun(fb,fm);ghost.box.append(fb,fm);box.appendChild(ghost.c);
 drawAdmGrant(box)}
/* 유령: accounts 에 c/n 이 없는 UID.
   1) accounts shallow → c/n 있는 것만 생존
   2) 생존 계정 fr·fq·fo 에서 유령 peer PATCH
   3) who/players/duel/roster 에만 남은 고아 UID 삭제 (계약직 명부 잔재) */
/* 생존 = accounts/.../c/n 이 있음. 읽기 실패는 생존으로 본다(오삭제 방지).
   목록은 accounts 루트 shallow(운영자만 규칙 허용). who/players 우회 목록은 쓰지 않는다. */
async function frGhostAlive(){let keys=[];
 try{keys=Object.keys((await DB.doc("accounts").peek())||{})}catch(e){}
 keys=keys.filter(u=>/^[A-Za-z0-9]{8,128}$/.test(u));
 const alive={};const chunk=40;let unsure=0,named=0;
 for(let i=0;i<keys.length;i+=chunk){const part=keys.slice(i,i+chunk);
  await Promise.all(part.map(async uid=>{
   try{const s=await DB.doc("accounts/"+uid+"/c/n").get();const n=s.exists?s.data():null;
    if(n!=null&&n!==""){alive[uid]=1;named++}
   }catch(e){alive[uid]=1;unsure++}}))}
 return{alive,unsure,scanned:keys.length,named,src:"accounts"}}
async function frGhostFix(uid,alive){const body={},take=async(path,prefix)=>{const s=await DB.doc("accounts/"+uid+"/c/"+path).get();const v=s.exists?s.data():null;if(!v||typeof v!=="object")return;
  Object.keys(v).forEach(p=>{if(p&&!alive[p])body["c/"+prefix+"/"+p]=null})};
 await take("fr","fr");await take("fq","fq");await take("fo","fo");
 const n=Object.keys(body).length;if(!n)return 0;
 body.ts=Date.now();body.sid="fr-ghost";
 await DB.doc("accounts/"+uid).patch(body);
 if(uid===UID&&C){Object.keys(body).forEach(k=>{const m=String(k).match(/^c\/(fr|fq|fo)\/(.+)$/);if(!m)return;C[m[1]]=C[m[1]]||{};delete C[m[1]][m[2]]});try{updNav()}catch(e){}try{save()}catch(e){}}
 return n}
/* who·players·duel/roster 고아 + 빈 accounts 껍질 삭제. */
async function frGhostRoster(alive){let whoK=[],plK=[],accK=[];
 try{whoK=Object.keys((await DB.doc("who").peek())||{})}catch(e){}
 try{plK=Object.keys((await DB.doc("players").peek())||{})}catch(e){}
 try{accK=Object.keys((await DB.doc("accounts").peek())||{})}catch(e){}
 const bag={};whoK.concat(plK).concat(accK).forEach(u=>{if(/^[A-Za-z0-9]{8,128}$/.test(u)&&!alive[u])bag[u]=1});
 const ids=Object.keys(bag);let gone=0,fail=0,at=0;
 async function worker(){for(;;){const i=at++;if(i>=ids.length)return;const uid=ids[i];
  try{await Promise.allSettled([DB.doc("who/"+uid).delete(),DB.doc("players/"+uid).delete(),DB.doc("duel/roster/"+uid).delete(),DB.doc("accounts/"+uid).delete()]);gone++}catch(e){fail++}}}
 if(ids.length)await Promise.all(Array.from({length:Math.min(6,ids.length)},worker));
 try{if(typeof plClear==="function")plClear()}catch(e){}
 return{gone,fail,n:ids.length}}
async function frGhostRun(btn,msg){if(!ADM[UID]||!XON()||!DB)return;
 const t=prompt("탈퇴·삭제된 계정이 친구 목록·신청 칸·계약직 명부(who)에 남은 것을 지금 서버에서 지운다.\n이름이 있는 정상 계정은 지우지 않는다.\n캐릭터 본문은 받지 않는다.\n\n계속하려면 '정리'라고 입력해 줘.");
 if((t||"").trim()!=="정리"){msg.style.color="var(--mu)";msg.textContent="취소했다.";return}
 btn.disabled=true;msg.style.color="var(--mu)";msg.textContent="생존 계정을 모으는 중(이름 확인)…";
 let alive={},unsure=0,scanned=0,src="";
 try{const r=await frGhostAlive();alive=r.alive||{};unsure=r.unsure||0;scanned=r.scanned||0;src=r.src||""}catch(e){msg.style.color="var(--bad)";msg.textContent="등록자 목록을 읽지 못했다.";btn.disabled=false;return}
 const ids=Object.keys(alive);
 if(!scanned){msg.style.color="var(--bad)";msg.textContent="accounts 목록을 읽지 못했다. 운영자만 accounts 루트 읽기가 열려 있는지 규칙을 게시한 뒤 다시 하자.";btn.disabled=false;return}
 if(!ids.length){msg.style.color="var(--bad)";msg.textContent="accounts "+scanned+"개 중 이름이 있는 계정을 확인하지 못했다. 정리하지 않았다.";btn.disabled=false;return}
 let at=0,cleared=0,touched=0,fail=0;const total=ids.length;
 async function worker(){for(;;){const i=at++;if(i>=total)return;const uid=ids[i];if(i%6===0)msg.textContent="유령 친구 정리 중... "+i+" / "+total+" (칸 "+cleared+", 실패 "+fail+")";
  try{const n=await frGhostFix(uid,alive);cleared+=n;if(n)touched++}catch(e){fail++}}}
 try{await Promise.all(Array.from({length:Math.min(6,total)},worker));
  msg.textContent="계약직 명부·공개 카드 고아를 지우는 중…";
  const rost=await frGhostRoster(alive);
  msg.style.color="var(--mu)";msg.textContent="정리했다. 검사 "+total+"명 · 친구 칸 "+cleared+"개 · 명부 고아 "+rost.gone+"/"+rost.n+"개"+(fail||rost.fail?" · 실패 "+(fail+(rost.fail||0)):"")+".";
  alertBox("☍ 유령 친구·명부 정리","친구/신청: 검사 "+total+"명 · 손본 "+touched+"명 · 지운 칸 "+cleared+"개\n계약직 명부·카드: 고아 "+rost.n+"명 중 "+rost.gone+"명 삭제"+(unsure?"\n이름 읽기 실패(보존) "+unsure+"명":"")+(fail||rost.fail?"\n실패 "+(fail+(rost.fail||0))+"건":"")+"\n\n접속 중인 사람은 새로고침·재로그인 후 친구 목록이 맞춰진다. 계약직 명부는 다시 열어 보자.")}
 catch(e){msg.style.color="var(--bad)";msg.textContent="정리를 끝내지 못했다. 인터넷 연결을 확인하고 다시 시도해 보자."}
 btn.disabled=false}
async function rstOne(btn,inp,msg){if(!ADM[UID]||!XON())return;const uid=String(inp.value||"").trim();
 if(!/^[A-Za-z0-9]{8,128}$/.test(uid)){msg.style.color="var(--bad)";msg.textContent="UID는 영문과 숫자 8자 이상이어야 한다.";return}
 let name="";try{const s=await DB.doc("players/"+uid+"/n").get();if(s.exists&&typeof s.data()==="string")name=s.data().replace(/👑/g,"").trim().slice(0,20)}catch(e){}
 const who=name?name+" ("+uid+")":uid;
 const t=prompt(who+" 의 캐릭터를 지금 서버에서 되돌린다. 장기 토벌·단서 탐색은 진행·완료 미수령이어도 강제 취소(보상 없음). 알 재고·부화는 전부 0. 접속 중이 아니어도 적용된다. 채팅·게시판·선물·마을·보스와 다른 사람의 기록은 그대로다. 되돌릴 수 없다.\n\n계속하려면 '회귀'라고 입력해 줘.");
 if((t||"").trim()!=="회귀"){msg.style.color="var(--mu)";msg.textContent="취소했다.";return}
 btn.disabled=true;msg.style.color="var(--mu)";msg.textContent="서버에서 캐릭터·명부를 되돌리는 중이다. 창을 닫지 말자...";
 try{const R={id:Date.now(),ts:Date.now()};
  let rost=null;
  try{rost=await accountRstCall(R.id,[uid])}catch(e){const why=String(e&&e.why||e&&e.message||e);const part=e&&e.partial;
   if(part&&Number(part.synced)>0)rost=part;else{
    if(why==="401"||why==="403"||why==="admin")throw new Error(why);
    if(why==="RST_URL")throw new Error("RST_URL");
    if(part&&Number(part.empty)>0&&!(Number(part.synced)>0))throw new Error("empty");
    throw e||new Error(why)}}
  if(!(rost&&Number(rost.synced)>0)){if(rost&&Number(rost.empty)>0)throw new Error("empty");throw new Error("fail")}
  await DB.doc("players/"+UID+"/rstu/"+uid).set(R);
  rosterCacheClear();
  if(uid===UID){const self=await rstTakeCloud(R.id);if(!self){C=rstShape(C,R.id);try{clearPend()}catch(e){}try{if(typeof accMark==="function")accMark()}catch(e){}try{keep("mgr_rr_"+UID,String(R.id))}catch(e){}try{regPlayer()}catch(e){}rstClearTripUI()}
   C.rstn=R.id;note("notice",rstNoteTxt(true));save();try{if(typeof pubScore==="function")pubScore()}catch(e){}try{hub()}catch(e){}try{if(typeof hubFac==="function")hubFac()}catch(e){}msg.textContent="이 계정을 지금 회귀했다.";inp.value=""}
  else msg.textContent=who+" 의 캐릭터를 서버에서 지금 되돌리고 명부에 반영했다. 알림은 그 사람이 다음에 접속할 때 한 번 뜬다.";inp.value=""}
 catch(e){const c=String(e&&e.why||e&&e.message||e);msg.style.color="var(--bad)";msg.textContent=c==="401"||c==="403"||c==="admin"?"운영자만 서버 회귀를 쓸 수 있다.":c==="RST_URL"?"서버 주소를 찾지 못했다. 배포·캐시를 확인해 보자.":c==="empty"?"그 UID의 캐릭터 기록을 찾지 못했다.":"저장하지 못했다. 인터넷 연결과 함수 배포를 확인하고 다시 시도해 보자."}
 btn.disabled=false}

/* ── 전체·개인 보상 지급 (운영자 전용) ──
   공지 탭 하단. 전체는 accounts 등록자 전원, 개인은 UID 한 명. 접속 여부와 상관없이 서버 기록에 바로 더한다.
   골드·경험치·마력석·사역마 알·이벤트 알·가방 아이템·재료(이벤트 재료 포함)를 고르고 개수를 정한다.
   원격 지급: 캐릭터 통째 GET/PATCH 금지. 이름·(경험 시)ex·nt 만 읽고, 재화·가방은 increment 칸 PATCH. */
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
/* 원격 지급용. 골드·알·가방은 increment. 캐릭터 통째 GET/PATCH 하지 않는다. */
function admGrantInc(n){return typeof apiInc==="function"?apiInc(n):{".sv":{"increment":Math.trunc(Number(n)||0)}}}
function admGrantPatchBody(r){const body={ts:Date.now(),sid:"admin-grant"};
 if(r.g)body["c/gd"]=admGrantInc(r.g);if(r.eggs)body["c/eggs"]=admGrantInc(r.eggs|0);if(r.eggsEv)body["c/eggsEv"]=admGrantInc(r.eggsEv|0);
 if(r.m)body["c/inv/mana"]=admGrantInc(r.m);
 Object.entries(r.inv||{}).forEach(([id,n])=>{n=n|0;if(!id||n<=0)return;body["c/inv/"+id]=admGrantInc(n)});
 return body}
/* 등록자 UID 목록: accounts 루트 shallow. 운영자 accounts .read 규칙이 필요하다(who 우회 없음). */
async function admGrantIds(){let ids=[];
 try{ids=Object.keys((await DB.doc("accounts").peek())||{})}catch(e){}
 return ids.filter(u=>/^[A-Za-z0-9]{8,128}$/.test(u))}
/* 전체 보상용. who.dm=1(휴면·화원)은 빼고, accounts 본문은 받지 않는다.
   시즌 회귀(rstRun)는 admGrantIds 전체(휴면 포함)를 쓴다. */
async function admGrantActiveIds(){const ids=await admGrantIds();let dm={};
 try{const sn=typeof plAll==="function"?await plAll(0):null;(sn&&sn.docs||[]).forEach(d=>{const p=d.data()||{};if(Number(p.dm)===1)dm[d.id]=1})}catch(e){
  try{const sn=await once(DB.collection("who"));(sn.docs||[]).forEach(d=>{const p=d.data()||{};if(Number(p.dm)===1)dm[d.id]=1})}catch(e2){}}
 return ids.filter(u=>!dm[u])}
async function admGrantSave(uid,r){if(uid===UID&&C){admGrantOnChar(C,r);try{if(typeof titleState==="function")titleState()}catch(e){}try{save();await saveCloud(true)}catch(e){throw e||new Error("save")}return "self"}
 /* 존재만 확인(이름 칸). 본문 전체는 받지 않는다. */
 const nm=await DB.doc("accounts/"+uid+"/c/n").get();if(!nm.exists||nm.data()==null||nm.data()==="")throw new Error("empty");
 const body=admGrantPatchBody(r);
 if(r.ex){let cur=0;try{const s=await DB.doc("accounts/"+uid+"/c/ex").get();cur=Number(s.exists?s.data():0)||0}catch(e){}
  const add=r.ex|0,next=Math.max(0,cur+add),lv=typeof lvOf==="function"?lvOf(next):1;
  body["c/ex"]=admGrantInc(add);body["c/lv"]=lv;body["c/xv"]=3;body["prog/ex"]=admGrantInc(add);body["prog/lv"]=lv;body["prog/xv"]=3}
 const note={k:"gift",t:("운영자 보상: "+admGrantTxt(r)).slice(0,160),u:"",ts:Date.now(),r:false};
 try{const s=await DB.doc("accounts/"+uid+"/c/nt").get();let nt=s.exists&&Array.isArray(s.data())?s.data().slice():[];
  nt.unshift(note);const max=typeof NT_MAX==="number"?NT_MAX:60;if(nt.length>max)nt=nt.slice(0,max);body["c/nt"]=nt}
 catch(e){body["c/nt"]=[note]}
 await DB.doc("accounts/"+uid).patch(body);return "ok"}
async function admGrantRun(btn,msg,getR){if(!ADM[UID]||!XON()||!DB)return;const r=getR();if(!r){msg.style.color="var(--bad)";msg.textContent="지급할 보상을 하나 이상 정해 줘.";return}
 const preview=admGrantTxt(r);const t=prompt("등록된 모든 캐릭터에 아래 보상을 지금 서버에 더한다. 접속 중이 아니어도 적용된다.\n\n"+preview+"\n\n계속하려면 '지급'이라고 입력해 줘.");
 if((t||"").trim()!=="지급"){msg.style.color="var(--mu)";msg.textContent="취소했다.";return}
 btn.disabled=true;msg.style.color="var(--mu)";msg.textContent="등록자를 모으는 중...";
 let ids=[];try{ids=await admGrantActiveIds()}catch(e){msg.style.color="var(--bad)";msg.textContent="등록자 목록을 읽지 못했다.";btn.disabled=false;return}
 if(!ids.length){msg.style.color="var(--bad)";msg.textContent="지급할 등록자가 없다.";btn.disabled=false;return}
 let at=0,ok=0,empty=0,fail=0;const total=ids.length;
 async function worker(){for(;;){const i=at++;if(i>=total)return;const uid=ids[i];if(i%6===0)msg.textContent="지급하는 중... "+i+" / "+total+" (성공 "+ok+", 실패 "+fail+")";
  try{await admGrantSave(uid,r);ok++}catch(e){String(e&&e.message||e)==="empty"?empty++:fail++}}}
 await Promise.all(Array.from({length:Math.min(6,total)},worker));
 msg.style.color="var(--mu)";msg.textContent="지급했다. 대상 "+total+"명(휴면 제외) · 성공 "+ok+"명"+(empty?" · 기록 없음 "+empty+"명":"")+(fail?" · 실패 "+fail+"명":"")+".";
 alertBox("🎁 전체 보상 지급","보상: "+preview+"\n\n"+msg.textContent+(fail?"\n\n실패한 계정은 데이터베이스 규칙(운영자 계정 읽기·쓰기)을 확인해 보자.":"")+"\n\n휴면(화원) 계정은 제외했다. 접속 중인 사람은 탭을 다시 보이거나 잠시 뒤 기록이 맞춰질 수 있다.");
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
 const all=rstFoldCard("🎁 전체 보상 지급 (운영자 전용)","grant_all","adm-grant",false);
 all.box.append(elT("p","hint","accounts 에 캐릭터가 있는 등록자에게 보상을 바로 더한다. 휴면(화원)은 제외한다. 접속 여부와 상관없다. 알림함에도 '운영자 보상'이 남는다."),
  elT("p","hint","골드·경험치·마력석·사역마 알·"+evNm+"·가방 아이템·재료를 고르고 개수를 정한 뒤 지급한다."));
 const getAll=admGrantFields(all.box);const gb=elT("button","btn","전체에게 지급"),gm=elT("p","msg","");gb.type="button";gb.style.marginTop="12px";gb.onclick=()=>admGrantRun(gb,gm,getAll);all.box.append(gb,gm);box.appendChild(all.c);
 const one=rstFoldCard("🎁 개인 보상 지급 (운영자 전용)","grant_one","adm-grant",false);
 one.box.append(elT("p","hint","UID 한 명의 캐릭터에만 보상을 더한다. 접속 중이 아니어도 서버 기록에 바로 반영된다. 보상 종류는 전체 지급과 같다."),
  elT("p","hint","골드·경험치·마력석·사역마 알·"+evNm+"·가방 아이템·재료를 고르고 개수를 정한 뒤, 대상 UID를 넣고 지급한다."));
 const urow=elT("div","row");urow.style.cssText="margin-top:8px;gap:6px";const uinp=elT("input");uinp.type="text";uinp.maxLength=128;uinp.placeholder="계정 UID";uinp.setAttribute("aria-label","보상 받을 계정 UID");uinp.autocomplete="off";uinp.spellcheck=false;uinp.style.flex="1";urow.appendChild(uinp);one.box.appendChild(urow);
 const getOne=admGrantFields(one.box);const pb=elT("button","btn","이 사람에게 지급"),pm=elT("p","msg","");pb.type="button";pb.style.marginTop="12px";pb.onclick=()=>admGrantOne(pb,pm,getOne,uinp);one.box.append(pb,pm);box.appendChild(one.c)}
(()=>{const t=$("#ntctog");if(t)t.onclick=()=>ntcListFold($("#ntcbox")&&$("#ntcbox").hidden);
 let v="1";try{v=localStorage.getItem("mgr_ntc_list")||"1"}catch(e){}if(v==="0")ntcListFold(false)})();
