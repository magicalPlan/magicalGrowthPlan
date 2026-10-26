/* 친구. main.js 다음에 불러야 한다. 신청, 수락, 삭제, 친구 목록과 검색, 목록에 보이는 절망도.
   마을 화면은 syncFr 를, 메뉴와 알림은 friends 를, 프로필은 frBtn 과 frDo 를 그대로 부른다. */
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
 if(!$("#v-friends").hidden)friends();else if(!$("#v-hub").hidden&&notes.length){const h=$("#hm");h.style.color="var(--mu)";h.textContent=notes.join(", ")+"."}}catch(e){}}
async function friends(msg){show("friends");updNav();rqDraw();const fm=$("#fm");fm.style.color="var(--mu)";fm.textContent=msg||"";
 const q=$("#fql"),l=$("#ffl"),o=$("#fol");
 if(!AUTH.uid){q.innerHTML=l.innerHTML=o.innerHTML="";fm.textContent="로그인해야 친구를 만들 수 있다.";return}
 C.fr=C.fr||{};C.fq=C.fq||{};C.fo=C.fo||{};let pl={};try{const s=await plAll();s.docs.forEach(d=>pl[d.id]=d.data())}catch(e){}
 if($("#v-friends").hidden)return;
 const row=(uid,fb,btns)=>{const w=document.createElement("div");w.style.cssText="display:flex;gap:8px";const p=pl[uid],nb=document.createElement("button");nb.type="button";nb.className="chip";nb.style.cssText="flex:1;text-align:left";
  nb.textContent=(p&&isOn(p)?"🟢 ":"")+cn(uid,(p&&p.n)||fb)+(p&&tiName(p.ti,p.tn)?" 「"+tiName(p.ti,p.tn)+"」":"")+(p?" ("+p.g+"등급 "+p.a+")":"");nb.onclick=()=>openProfile(uid);if(p&&C.fr&&C.fr[uid])nb.appendChild(frDz(p));w.appendChild(nb);w.className="fr-row";w.dataset.nm=String((p&&p.n)||fb||"").toLowerCase();
  btns.forEach(([t,fn])=>{const b=document.createElement("button");b.type="button";b.className="chip";b.style.cssText="flex:0 0 auto;min-width:0;padding:10px 14px";b.textContent=t;b.onclick=fn;w.appendChild(b)});return w};
 const act=(a,u,nm)=>async()=>{try{await frDo(a,u,nm);friends()}catch(e){friends("지금은 할 수 없다. 잠시 뒤에 다시 시도해야 한다.");$("#fm").style.color="var(--bad)"}};
 const fill=(el,items,empty)=>{el.innerHTML="";if(!items.length){el.innerHTML="<p class='hint'>"+empty+"</p>";return}items.forEach(x=>el.appendChild(x))};
 fill(q,Object.keys(C.fq).map(u=>row(u,C.fq[u],[["수락",act("ok",u,C.fq[u])],["거절",()=>{delete C.fq[u];save();updNav();friends()}]])),"받은 신청이 없다.");
 fill(l,Object.keys(C.fr).map(u=>row(u,C.fr[u],[["1:1 대화",()=>{chat();setT("d");openDM(u,(pl[u]&&pl[u].n)||C.fr[u])}]])),"아직 친구가 없다. 다른 사람의 프로필에서 친구 추가를 눌러보자.");
 fill(o,Object.keys(C.fo).map(u=>row(u,"",[])),"보낸 신청이 없다.");
 fPl=pl;fRow=row;fFilter()}
/* 친구 검색: 이름에 검색어가 들어간 사람만 보여 준다. 친구가 아닌 플레이어도 함께 찾아 준다. */
let fPl={},fRow=null;
function fFilter(){const q=$("#fsq").value.trim().toLowerCase();
 ["#fql","#ffl","#fol"].forEach(s=>{const el=$(s),rows=[...el.querySelectorAll(".fr-row")];let n=0;rows.forEach(w=>{const ok=!q||w.dataset.nm.includes(q);w.hidden=!ok;if(ok)n++});
  let e=el.querySelector(".fr-none");if(rows.length&&!n){if(!e){e=elT("p","hint fr-none","검색 결과가 없다.");el.appendChild(e)}}else if(e)e.remove()});
 const box=$("#fsb"),r=$("#fsr");box.hidden=!q;r.innerHTML="";if(!q||!fRow)return;
 const known=u=>u===UID||C.fr[u]||C.fq[u]||C.fo[u],hits=Object.keys(fPl).filter(u=>fPl[u]&&!known(u)&&String(fPl[u].n||"").toLowerCase().includes(q)).sort((a,b)=>(fPl[b].ts||0)-(fPl[a].ts||0)).slice(0,10);
 if(!hits.length){r.innerHTML="<p class='hint'>이름이 맞는 다른 플레이어가 없다.</p>";return}
 hits.forEach(u=>r.appendChild(fRow(u,"",[["친구 추가",async()=>{try{await frDo("req",u,fPl[u].n);friends(fPl[u].n+"님에게 친구 신청을 보냈다.")}catch(e){friends("지금은 할 수 없다. 잠시 뒤에 다시 시도해야 한다.");$("#fm").style.color="var(--bad)"}}]])))}
$("#fsq").oninput=fFilter;

/* 친구 목록의 절망도: 친구가 마지막으로 접속했을 때의 절망도에서, 그 뒤 흐른 시간만큼 자연 회복을 반영한 추정값을 보여 준다. */
function frDz(p){const fall=!!p.fl,base=Math.max(0,Math.min(100,Number(p.dz)||0)),ts=Number(p.ts)||Date.now(),est=fall?100:p.hf?base:Math.max(0,base-HEAL_DZ*Math.floor(Math.max(0,Date.now()-ts)/HEAL_MS));
 const w=elT("span","fr-dz"+(fall?" fall":est>=90?" warn":""));w.style.display="flex";const bar=elT("span","bar"),f=elT("i");bar.style.display="block";f.style.width=est+"%";bar.appendChild(f);
 w.append(elT("span","",fall?"타락":"절망도"),bar,elT("b","",String(est)));w.title=fall?"타락한 상태다. 마을의 '타락한 친구'에서 함께 되돌려 주자.":"마지막 접속 기준으로 자연 회복을 반영한 값이다.";return w}
