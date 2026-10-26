/* 공지. main.js 다음에 불러야 한다. 화면 위 공지 칸, 공지 탭, 운영자의 게시와 내리기.
   마을 화면은 loadNotice 를, 알림함과 메뉴는 drawNotice, ntcView, NTC 를 그대로 부른다. */
/* 공지: 운영자(admins 목록에 있는 계정)만 쓸 수 있고, 모든 플레이어의 화면 위쪽에 보인다. 서버 기록: notice/{번호}
   새 공지가 올라오면 한 번 알림(화면 위 알림·알림함)을 띄운다. 각자 ✕로 닫을 수 있고, 더 새 공지가 오면 다시 보인다. 최근 5개까지만 남긴다. */
let NTC=[],ntcT=0;// 운영자 한 명당 최근 30개까지 보관
// 공지 탭: 모든 공지를 최근 순으로. 연 순간 읽은 것으로 표시한다.
function ntcView(keep){if(!keep){show("ntc");loadNotice(true)}const l=$("#ntcl");if(!l||!C)return;l.innerHTML="";const seen=C.ntcSeen||0;
 if(ADM[UID]){const w=elT("p","hint","공지 쓰기와 내리기는 화면 위쪽 공지 칸의 '📢 공지 쓰기'에서 할 수 있다.");l.appendChild(w)}
 if(!NTC.length){l.appendChild(elT("p","hint","아직 공지가 없다."));}
 NTC.forEach(n=>{const d=new Date(Number(n.ts)),c=elT("div","ntc-card ntc-item"+(n.u?" urgent":"")+(Number(n.ts)>seen?" new":""));
  c.append(elT("p","ntc-tag",(n.u?"📢 중요 공지":"📢 공지")+" · "+d.getFullYear()+"."+(d.getMonth()+1)+"."+d.getDate()+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")+(n.n?" · "+String(n.n).slice(0,20):"")+(Number(n.ts)>seen?" · 새 공지":"")),elT("p","ntc-t",String(n.t).slice(0,300)));
  if(ADM[UID]&&n.src==="p"&&n.by===UID){const x=elT("button","chip","이 공지 내리기");x.type="button";x.style.cssText="margin-top:8px;padding:5px 12px;font-size:.8rem";x.onclick=async()=>{if(!confirm("이 공지를 내릴까?"))return;C.ntcl=(C.ntcl||[]).filter(o=>o.id!==n.id);save();try{await DB.doc("players/"+UID+"/ntc").set(C.ntcl)}catch(e){}NTC=NTC.filter(o=>o!==n);drawNotice();ntcView(true)};c.appendChild(x)}
  l.appendChild(c)});
 if(NTC.length&&Number(NTC[0].ts)>seen){C.ntcSeen=Number(NTC[0].ts);save()}updNav()}
async function loadNotice(force){if(!C||!XON())return;if(!force&&Date.now()-ntcT<20000)return;ntcT=Date.now();let list=null;
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
function drawNotice(){const b=$("#ntc");if(!b)return;const isA=!!(C&&ADM[UID]),top=NTC[0],hid=!!top&&lget("mgr_ntc_x")===String(top.ts),openForm=!!b.querySelector(".ntc-adm:not([hidden]) textarea");
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
