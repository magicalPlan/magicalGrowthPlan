/* 친구. main.js 다음에, 공명 파일보다 먼저 불러야 한다. 신청, 수락, 삭제, 친구 목록과 검색, 목록에 보이는 절망도.
   메뉴와 알림은 friends 를, 프로필은 frBtn 과 frDo 를 그대로 부른다.
   공명은 sendF 를 쓰고, 친구 소식은 실행 중에 rqRetry 와 resHeard 를 부른다.
   소식과 친구의 플레이어 기록은 친구 화면을 열 때만 한 번 읽는다. 실시간으로 지켜보지 않고, 목록은 20명씩 받는다. */
/* 친구: 신청 -> 수락의 양방향 구조. 친구 목록은 내 계정에 저장하고, 신청/수락/삭제 알림은 서버의 fmsg(받는 사람만 읽을 수 있음)로 주고받는다. */
const sendF=(to,t)=>DB.doc("fmsg/"+to+"/"+UID).set({t,ts:{".sv":"timestamp"},n:nmOf()});
async function frDo(a,u,nm){C.fr=C.fr||{};C.fq=C.fq||{};C.fo=C.fo||{};
 if(a==="req"){await sendF(u,"req");C.fo[u]=Date.now()}
 else if(a==="ok"){await sendF(u,"ok");C.fr[u]=C.fq[u]||nm||"";delete C.fq[u]}
 else if(a==="del"){await sendF(u,"del");delete C.fr[u]}
 save();updNav();checkTitles()}
function frBtn(uid,name){const b=$("#pff");C.fr=C.fr||{};C.fq=C.fq||{};C.fo=C.fo||{};
 // 공명은 친구에게만 할 수 있다.
 $("#pfr").hidden=uid===UID;resBtn(uid);b.hidden=uid===UID||!AUTH.uid;b.disabled=false;b.dataset.n=name||"";$("#pfg").hidden=!(C.fr[uid]&&uid!==UID&&AUTH.uid);
 if(C.fr[uid]){b.textContent="친구 삭제";b.dataset.a="del"}else if(C.fq[uid]){b.textContent="친구 신청 수락";b.dataset.a="ok"}else if(C.fo[uid]){b.textContent="친구 신청을 보냈다";b.disabled=true;b.dataset.a=""}else{b.textContent="친구 추가";b.dataset.a="req"}}
$("#pff").onclick=async()=>{const u=pfU,b=$("#pff"),a=b.dataset.a,nm=b.dataset.n,m=$("#pfm");if(!u||!a)return;
 if(a==="del"&&!confirm("친구를 삭제할까? 상대의 친구 목록에서도 사라진다."))return;
 b.disabled=true;
 try{await frDo(a,u,nm);m.style.color="var(--mu)";m.textContent=a==="req"?"친구 신청을 보냈다.":a==="ok"?"친구가 되었다.":"친구를 삭제했다."}
 catch(e){m.style.color="var(--bad)";m.textContent="지금은 할 수 없다. 잠시 뒤에 다시 시도해야 한다."}
 frBtn(u,nm)};
// 나에게 온 친구 신청, 수락, 삭제를 확인해서 목록에 반영한다.
async function syncFr(){if(!AUTH.uid||!C||!DB)return;try{rqRetry();const s=await once(DB.collection("fmsg/"+UID));if(!C)return;C.fr=C.fr||{};C.fq=C.fq||{};C.fo=C.fo||{};C.fs=C.fs||{};const notes=[];let ch=false;
 s.docs.map(d=>[d.id,d.data()]).filter(([f,v])=>v&&v.ts>(C.fs[f]||0)).sort((a,b)=>a[1].ts-b[1].ts).forEach(([f,v])=>{C.fs[f]=v.ts;ch=true;const n=String(v.n||"누군가");
  if(v.t==="req"){if(C.fr[f])sendF(f,"ok").catch(()=>{});else if(C.fo[f]){C.fr[f]=n;delete C.fo[f];sendF(f,"ok").catch(()=>{});(notes.push(n+"님과 친구가 되었다"),note("fr",n+"님과 친구가 되었다"+".",f))}else{C.fq[f]=n;(notes.push(n+"님이 친구 신청을 보냈다"),note("fr",n+"님이 친구 신청을 보냈다"+".",f))}}
  else if(v.t==="ok"){C.fr[f]=n;delete C.fo[f];delete C.fq[f];(notes.push(n+"님이 친구 신청을 수락했다"),note("fr",n+"님이 친구 신청을 수락했다"+".",f))}
  else if(v.t==="del"){delete C.fr[f];delete C.fq[f];delete C.fo[f];(notes.push(n+"님과 친구가 끊어졌다"),note("fr",n+"님과 친구가 끊어졌다"+".",f))}
  else if(v.t==="rok"||v.t==="rno")resHeard(f,v,n,notes)});
 if(!ch)return;save();updNav();checkTitles();
 if($("#v-friends").hidden&&!$("#v-hub").hidden&&notes.length){const h=$("#hm");h.style.color="var(--mu)";h.textContent=notes.join(", ")+"."}}catch(e){}}
/* 친구 목록은 이 계정에 이름이 있다. 등급·접속·절망도는 그 친구의 플레이어 기록을 20명씩만 받아 채운다. */
const FR_PAGE=20;
let frShown=FR_PAGE,frBusy=false,fPl={};
function frList(){C.fr=C.fr||{};return Object.keys(C.fr).sort((a,b)=>String(C.fr[a]||"").localeCompare(String(C.fr[b]||""),"ko")||(a<b?-1:1))}
function frIds(){const q=$("#fsq").value.trim().toLowerCase();return frList().filter(u=>!q||String(C.fr[u]||"").toLowerCase().includes(q))}
async function loadFr(ids){await Promise.all(ids.filter(u=>fPl[u]==null).slice(0,FR_PAGE).map(async u=>{try{const s=await DB.doc("players/"+u).get();const d=s.exists?s.data():null;fPl[u]=d&&d.n?d:{}}catch(e){fPl[u]={}}}))}
async function frMore(){if(frBusy||!C||!DB)return;const all=frIds();if(frShown>=all.length)return;const from=frShown;frBusy=true;frShown=Math.min(all.length,frShown+FR_PAGE);
 try{await loadFr(all.slice(from,frShown));if(!$("#v-friends").hidden)paintFriends()}finally{frBusy=false}}
function paintFriends(msg){const fm=$("#fm");if(typeof msg==="string"){fm.style.color="var(--mu)";fm.textContent=msg}
 rqDraw();const q=$("#fql"),l=$("#ffl"),o=$("#fol");C.fr=C.fr||{};C.fq=C.fq||{};C.fo=C.fo||{};
 const row=(uid,fb,btns)=>{const w=document.createElement("div");w.style.cssText="display:flex;gap:8px";const p=fPl[uid]&&fPl[uid].n?fPl[uid]:null,nb=document.createElement("button");nb.type="button";nb.className="chip";nb.style.cssText="flex:1;text-align:left";
  nb.textContent=(p&&isOn(p)?"🟢 ":"")+cn(uid,(p&&p.n)||fb)+(p&&tiName(p.ti,p.tn)?" 「"+tiName(p.ti,p.tn)+"」":"")+(p?" ("+p.g+"등급 "+p.a+")":"");nb.onclick=()=>openProfile(uid);if(p&&C.fr&&C.fr[uid])nb.appendChild(frDz(p));w.appendChild(nb);w.className="fr-row";w.dataset.nm=String((p&&p.n)||fb||"").toLowerCase();
  btns.forEach(([t,fn])=>{const b=document.createElement("button");b.type="button";b.className="chip";b.style.cssText="flex:0 0 auto;min-width:0;padding:10px 14px";b.textContent=t;b.onclick=fn;w.appendChild(b)});return w};
 const act=(a,u,nm)=>async()=>{try{await frDo(a,u,nm);paintFriends("")}catch(e){paintFriends("지금은 할 수 없다. 잠시 뒤에 다시 시도해야 한다.");$("#fm").style.color="var(--bad)"}};
 const fill=(el,items,empty)=>{el.innerHTML="";if(!items.length){el.innerHTML="<p class='hint'>"+empty+"</p>";return}items.forEach(x=>el.appendChild(x))};
 fill(q,Object.keys(C.fq).map(u=>row(u,C.fq[u],[["수락",act("ok",u,C.fq[u])],["거절",()=>{delete C.fq[u];save();updNav();paintFriends("")}]])),"받은 신청이 없다.");
 const ids=frIds(),show=ids.slice(0,frShown),searching=$("#fsq").value.trim();
 fill(l,show.map(u=>row(u,C.fr[u],[["1:1 대화",()=>goDM(u,(fPl[u]&&fPl[u].n)||C.fr[u])]])),searching?"검색 결과가 없다.":"아직 친구가 없다. 다른 사람의 프로필에서 친구 추가를 눌러보자.");
 let more=$("#fr-more");
 if(ids.length>show.length){if(!more){more=document.createElement("button");more.id="fr-more";more.type="button";more.className="btn g";more.onclick=()=>frMore();l.insertAdjacentElement("afterend",more)}more.hidden=false;more.textContent="친구 "+Math.min(FR_PAGE,ids.length-show.length)+"명 더 보기"}
 else if(more)more.hidden=true;
 fill(o,Object.keys(C.fo).map(u=>row(u,"",[])),"보낸 신청이 없다.");fFilter()}
async function friends(msg){const fresh=$("#v-friends").hidden;show("friends");updNav();
 if(!AUTH.uid){$("#fql").innerHTML=$("#ffl").innerHTML=$("#fol").innerHTML="";const more=$("#fr-more");if(more)more.hidden=true;rqDraw();const fm=$("#fm");fm.style.color="var(--mu)";fm.textContent="로그인해야 친구를 만들 수 있다.";return}
 if(fresh){frShown=FR_PAGE;fPl={}}
 paintFriends(msg||"");if(!C||!DB||frBusy)return;frBusy=true;
 try{await syncFr();if(typeof applyRes==="function")await applyRes();if($("#v-friends").hidden)return;const ids=frIds().slice(0,frShown);ids.forEach(u=>delete fPl[u]);await loadFr(ids);if(!$("#v-friends").hidden)paintFriends()}
 catch(e){if(!$("#v-friends").hidden){const fm=$("#fm");fm.style.color="var(--bad)";fm.textContent="친구 목록을 불러오지 못했다. 잠시 뒤에 다시 열어 보자."}}
 finally{frBusy=false}}
/* 검색은 이미 받아 둔 친구 이름과 신청만 거른다. 전체 플레이어 목록은 읽지 않는다. */
function fFilter(){const q=$("#fsq").value.trim().toLowerCase();
 ["#fql","#fol"].forEach(s=>{const el=$(s),rows=[...el.querySelectorAll(".fr-row")];let n=0;rows.forEach(w=>{const ok=!q||w.dataset.nm.includes(q);w.hidden=!ok;if(ok)n++});
  let e=el.querySelector(".fr-none");if(rows.length&&!n){if(!e){e=elT("p","hint fr-none","검색 결과가 없다.");el.appendChild(e)}}else if(e)e.remove()})}
$("#fsq").oninput=()=>{if($("#v-friends").hidden||!AUTH.uid||!C)return;frShown=FR_PAGE;paintFriends()};

/* 친구 목록의 절망도: 친구가 마지막으로 접속했을 때의 절망도에서, 그 뒤 흐른 시간만큼 자연 회복을 반영한 추정값을 보여 준다. */
function frDz(p){const fall=!!p.fl,base=Math.max(0,Math.min(100,Number(p.dz)||0)),ts=Number(p.ts)||Date.now(),est=fall?100:p.hf?base:Math.max(0,base-HEAL_DZ*Math.floor(Math.max(0,Date.now()-ts)/HEAL_MS));
 const w=elT("span","fr-dz"+(fall?" fall":est>=90?" warn":""));w.style.display="flex";const bar=elT("span","bar"),f=elT("i");bar.style.display="block";f.style.width=est+"%";bar.appendChild(f);
 w.append(elT("span","",fall?"타락":"절망도"),bar,elT("b","",String(est)));w.title=fall?"타락한 상태다. 마을의 '타락한 친구'에서 함께 되돌려 주자.":"마지막 접속 기준으로 자연 회복을 반영한 값이다.";return w}
