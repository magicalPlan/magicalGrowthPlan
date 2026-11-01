/* 관계란. main.js 다음에 불러야 한다.
   다른 마법사의 프로필 창에서 '관계 맺기'를 눌러 관계 이름(예: 소꿉친구)과 한 줄 설명을 적는다.
   내 관계 목록은 C.rel 에 [{u: 상대 uid, n: 상대 이름, r: 관계 이름, d: 설명}] 로 저장하고, 공개 카드(players/{나}.rel)에도 올라가 누구나 프로필에서 볼 수 있다.
   프로필 창(js/main.js 의 openProfile)은 relSection 과 relBtn 을, 마을 카드(js/village.js 의 hub)는 relRows 를 그대로 부른다.
   상대의 사진과 바뀐 이름은 프로필 창을 열 때만 한 번씩 읽는다(최대 REL_MAX명). 숫자만 고치면 바뀐다. */
const REL_MAX=12,REL_R=12,REL_D=100;
const relList=()=>Array.isArray(C&&C.rel)?C.rel:[];
const relOf=u=>relList().find(x=>x.u===u)||null;
// 공개 카드에서 읽은 관계 목록을 안전하게 걸러 낸다.
const relClean=a=>(Array.isArray(a)?a:[]).filter(x=>x&&typeof x.u==="string"&&x.u).slice(0,REL_MAX).map(x=>({u:x.u,n:String(x.n||"").slice(0,20),r:String(x.r||"").slice(0,REL_R),d:String(x.d||"").slice(0,REL_D)}));

function relSave(list,msg){C.rel=list;save();regPlayer();const m=$("#pfm");if(m){m.style.color="var(--mu)";m.textContent=msg||""}}

/* 프로필 창 안의 '관계' 칸. 내 프로필이면 항목마다 지우기 버튼이 붙는다. */
function relSection(b,p,uid){const L=relClean(p.rel);if(!L.length)return;const mine=uid===UID;
 const sec=elT("section","profile-section rel-sec");sec.appendChild(elT("h3",null,"관계"));const ul=elT("div","rel-list");
 L.forEach(x=>{const row=elT("div","rel-row"),go=elT("button","rel-go");go.type="button";go.onclick=()=>openProfile(x.u);
  const av=elT("span","rel-av",String(x.n||"?").slice(0,1)),tx=elT("span","rel-tx"),hd=elT("span","rel-hd");
  const nm=elT("b","rel-n",cn(x.u,x.n||"이름 없음"));hd.append(nm);if(x.r)hd.append(elT("span","rel-r",x.r));tx.appendChild(hd);if(x.d)tx.appendChild(elT("small","rel-d",x.d));
  go.append(av,tx);go.setAttribute("aria-label",(x.n||"")+(x.r?", "+x.r:"")+(x.d?". "+x.d:"")+". 프로필 보기");row.appendChild(go);
  if(mine){const del=elT("button","chip rel-del","✕");del.type="button";del.title="이 관계 지우기";del.setAttribute("aria-label",(x.n||"")+"와(과)의 관계 지우기");
   del.onclick=()=>{if(!confirm((x.n||"이 마법사")+"와(과)의 관계를 지울까?"))return;relSave(relList().filter(y=>y.u!==x.u),"관계를 지웠다.");openProfile(UID)};row.appendChild(del)}
  ul.appendChild(row);
  // 상대의 사진과 지금 이름을 한 번 읽어 채운다.
  DB.doc("players/"+x.u).get().then(s=>{const q=s.exists?s.data():null;if(!q){nm.textContent=cn(x.u,x.n||"떠난 마법사");return}
   if(q.n){nm.textContent=cn(x.u,q.n);av.textContent=String(q.n).slice(0,1)}
   if(typeof q.im==="string"&&q.im.length<20000&&/^data:image\/(jpeg|png|webp);base64,/.test(q.im)){av.textContent="";const im=document.createElement("img");im.src=q.im;im.alt="";av.appendChild(im)}}).catch(()=>{})});
 sec.appendChild(ul);b.appendChild(sec)}

/* '관계 맺기' 버튼과 입력 상자. 다른 사람의 프로필에서만 보인다. */
function relBtn(uid,name){const bt=$("#pfrel"),box=$("#relbox");if(!bt||!box)return;box.hidden=true;box.innerHTML="";
 if(!C||uid===UID||!AUTH.uid){bt.hidden=true;return}const cur=relOf(uid);bt.hidden=false;bt.textContent=cur?"관계 고치기":"관계 맺기";
 bt.onclick=()=>{if(!box.hidden){box.hidden=true;return}box.innerHTML="";box.hidden=false;const now=relOf(uid);
  if(!now&&relList().length>=REL_MAX){box.appendChild(elT("p","hint","관계는 "+REL_MAX+"명까지 적을 수 있다. 내 프로필에서 하나를 지운 뒤 다시 해 보자."));return}
  box.appendChild(elT("p","hint",(name||"이 마법사")+"와(과)의 관계를 적는다. 내 프로필의 '관계' 칸에 보이고, 다른 사람도 볼 수 있다."));
  const r=elT("input");r.type="text";r.maxLength=REL_R;r.placeholder="관계 (예: 소꿉친구, 라이벌) 최대 "+REL_R+"자";r.setAttribute("aria-label","관계 이름");r.value=now?now.r:"";
  const d=elT("textarea");d.rows=2;d.maxLength=REL_D;d.placeholder="한 줄 설명 (선택, 최대 "+REL_D+"자)";d.setAttribute("aria-label","관계 설명");d.value=now?now.d:"";
  const ok=elT("button","btn","저장");ok.type="button";const row=elT("div","rel-btns");row.appendChild(ok);
  if(now){const rm=elT("button","btn g","관계 지우기");rm.type="button";rm.onclick=()=>{relSave(relList().filter(y=>y.u!==uid),"관계를 지웠다.");openProfile(uid)};row.appendChild(rm)}
  ok.onclick=()=>{const rv=r.value.trim().slice(0,REL_R),dv=d.value.trim().slice(0,REL_D);const m=$("#pfm");if(!rv){m.style.color="var(--bad)";m.textContent="관계 이름을 적어야 한다.";r.focus();return}
   const ent={u:uid,n:String(name||"").replace(/👑/g,"").slice(0,20),r:rv,d:dv},L=relList().filter(y=>y.u!==uid);
   const at=relList().findIndex(y=>y.u===uid);if(at>=0)L.splice(at,0,ent);else L.push(ent);relSave(L,(name||"")+"와(과)의 관계를 「"+rv+"」(으)로 적었다.");box.hidden=true;bt.textContent="관계 고치기"};
  box.append(elT("h2","lbl","관계"),r,elT("h2","lbl","설명"),d,row);r.focus({preventScroll:true})}}

/* 마을 카드의 '자세히' 안에 넣는 짧은 관계 목록(사진 없이 이름과 관계만). */
function relRows(list){const L=relClean(list);if(!L.length)return null;const dl=document.createElement("dl");dl.className="kv";
 const dt=elT("dt",null,"관계"),dd=elT("dd");dd.style.whiteSpace="pre-wrap";dd.textContent=L.map(x=>(x.n||"이름 없음")+(x.r?" · "+x.r:"")).join("\n");dl.append(dt,dd);return dl}
