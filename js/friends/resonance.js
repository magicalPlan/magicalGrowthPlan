/* 공명. friend.js 다음에 불러야 한다. sendF 가 이미 있어야 한다. 친구에게 청하기, 수락·거절, 절망도 감소.
   마을 화면은 applyRes 를, 친구 소식은 rqRetry 와 resHeard 를, 프로필은 resBtn 을 그대로 부른다. */
$("#pfr").onclick=async()=>{const m=$("#pfm"),u=pfU;if(!u||u===UID)return;if(!(C.fr&&C.fr[u])){m.style.color="var(--bad)";m.textContent="친구에게만 공명할 수 있다. 먼저 친구 추가를 해 보자.";return}const last=(C.rl&&C.rl[u])||0,left=RES_CD-(Date.now()-last);
 if(left>0){m.style.color="var(--bad)";m.textContent="같은 상대에게는 3시간에 한 번만 공명할 수 있다. 약 "+Math.ceil(left/3600000)+"시간 뒤에 다시 할 수 있다.";return}
 $("#pfr").disabled=true;
 try{await DB.doc("res/"+u+"/"+UID).set({ts:{".sv":"timestamp"},n:String(C.n).replace(/👑/g,"").slice(0,20),a:(C.a.includes("빛")?3:0)+(C.t==="치유의 손길"?3:0)});
  // 공명은 '청하기'다. 상대가 받아들이면 그때 나와 상대 모두 절망도가 내려간다. 내 몫은 지금 계산해 두었다가 수락 소식이 오면 적용한다.
  C.rl=C.rl||{};C.rl[u]=Date.now();titleState();C.stats.resonances=(C.stats.resonances||0)+1;const rb=C.rsb?5:0;C.rsb=0;
  C.rq=C.rq||{};C.rq[u]={ts:Date.now(),amt:rqAmt(rb)};save();checkTitles();
  m.style.color="var(--mu)";m.textContent="공명을 청했다. 상대가 받아들이면 둘 다 절망도가 내려간다. (거절하면 3시간 대기도 풀린다)"}
 catch(e){m.style.color="var(--bad)";m.textContent="지금은 공명할 수 없다. 같은 상대에게는 3시간에 한 번만 가능하다."}
 resBtn(u)};
/* 공명을 청한 쪽이 받을 절망도 감소량. 청할 때 계산해 두지만, 기록이 사라졌으면(복구·다른 기기) 수락 소식이 올 때 다시 계산한다. */
const rqAmt=(rb=0)=>Math.round((disMine()==="frost"?.5:1)*(VL[C.v].rz+(C.t==="다정함"?5:0)+(eq(4)?2:0)+(rb||0)+facLv("chapel")));
/* 수락·거절 소식을 상대에게 보내지 못했으면 기억해 두었다가 다시 보낸다. 이 소식이 가야 청한 쪽의 절망도가 내려간다. */
function rqSend(f,t){C.rqOut=C.rqOut||{};C.rqOut[f]=t;save();return sendF(f,t).then(()=>{if(C&&C.rqOut&&C.rqOut[f]===t){delete C.rqOut[f];save()}}).catch(()=>{})}
function rqRetry(){if(!C||!C.rqOut)return;Object.keys(C.rqOut).forEach(f=>rqSend(f,C.rqOut[f]))}
const resLeft=u=>Math.max(0,RES_CD-(Date.now()-((C&&C.rl&&C.rl[u])||0)));
function resBtn(u){const b=$("#pfr");if(!u||!C)return;const isF=!!(C.fr&&C.fr[u]),left=resLeft(u);
 b.disabled=!isF||left>0;b.textContent=!isF?"공명하기 (친구만 가능)":left>0?"공명하기 ("+cdTxt(left)+" 뒤에 가능)":"공명하기"}
setInterval(()=>{if(pfU&&!$("#pfo").hidden&&pfU!==UID)resBtn(pfU)},1000);
async function applyRes(){if(!AUTH.uid||!C||!DB)return;try{const s=await once(DB.collection("res/"+UID)),rs=C.rs||0,nm=[];let mx=rs;C.rqIn=C.rqIn||{};
 s.docs.forEach(d=>{const v=d.data();if(v&&v.ts>rs){const n=String(v.n||"누군가");nm.push(n);C.rqIn[d.id]={n,a:Math.min(6,Math.max(0,Number(v.a)||0)),ts:v.ts};note("res",n+"님이 공명을 청했다. 친구 화면에서 받아들이거나 거절할 수 있다.",d.id);mx=Math.max(mx,v.ts)}});
 rqExpire();if(!nm.length)return;C.rs=mx;save();updNav();toast("♡ "+nm.slice(0,2).join(", ")+(nm.length>2?" 외 "+(nm.length-2)+"명":"")+"이(가) 공명을 청했다");if(!$("#v-friends").hidden)rqDraw()}catch(e){}}
function rqExpire(){const now=Date.now();let ch=false;Object.keys(C.rqIn||{}).forEach(f=>{if(now-(C.rqIn[f].ts||0)>RQ_TTL){delete C.rqIn[f];ch=true}});Object.keys(C.rq||{}).forEach(f=>{if(now-(C.rq[f].ts||0)>RQ_TTL+3600000){delete C.rq[f];ch=true}});if(ch)save()}
function rqAnswer(f,ok){const q=(C.rqIn||{})[f];if(!q)return;delete C.rqIn[f];rqSend(f,ok?"rok":"rno");
 if(ok){const b0=C.dz,dn=5+q.a+(eq(4)?2:0)+petEff("res");gain(0,-dn);note("res",q.n+"님의 공명을 받아들였다."+(C.fall?" (타락 중이라 절망도는 그대로다)":" 절망도가 "+(b0-C.dz)+" 내려갔다."),f);$("#fm").style.color="var(--mu)";$("#fm").textContent=q.n+"님의 공명을 받아들였다. 마음이 맞닿는다."+(C.fall?"":" 절망도 -"+(b0-C.dz))}
 else{note("res",q.n+"님의 공명을 거절했다.",f);$("#fm").style.color="var(--mu)";$("#fm").textContent=q.n+"님의 공명을 거절했다."}save();updNav();rqDraw()}
function rqDraw(){const l=$("#rql");if(!l||!C)return;rqExpire();l.innerHTML="";const qs=Object.entries(C.rqIn||{}).sort((a,b)=>b[1].ts-a[1].ts);
 if(!qs.length){l.innerHTML="<p class='hint'>받은 공명이 없다.</p>";return}
 qs.forEach(([f,q])=>{const w=elT("div","dq"),cp=elT("div","dq-copy");cp.append(elT("b","","♡ "+cn(f,q.n)),elT("small","",agoTxt(q.ts)+" · 받아들이면 절망도 -"+(5+q.a+(eq(4)?2:0)+petEff("res"))));
  const y=elT("button","chip","수락");y.type="button";y.onclick=()=>rqAnswer(f,true);const n=elT("button","chip","거절");n.type="button";n.onclick=()=>rqAnswer(f,false);w.append(cp,y,n);l.appendChild(w)})}
/* 청한 쪽에 도착한 수락·거절. 친구 소식(syncFr)이 그대로 부른다. */
function resHeard(f,v,n,notes){
if(v.t==="rok"){const q=(C.rq||{})[f];delete (C.rq||{})[f];C.rkT=C.rkT||{};const fresh=q||!(C.rkT[f]&&Date.now()-C.rkT[f]<RES_CD);const b0=C.dz;if(fresh){C.rkT[f]=Date.now();gain(0,-((q&&q.amt>0?q.amt:rqAmt())+petEff("res")))}notes.push(n+"님이 공명을 받아들였다");note("res",n+"님이 공명을 받아들였다."+(fresh&&!C.fall?" 절망도가 "+(b0-C.dz)+" 내려갔다.":""),f);toast("♡ "+n+"님이 공명을 받아들였다"+(fresh&&!C.fall?" · 절망도 -"+(b0-C.dz):""))}
  else if(v.t==="rno"){delete (C.rq||{})[f];if(C.rl)delete C.rl[f];notes.push(n+"님이 공명을 거절했다");note("res",n+"님이 공명을 거절했다. 지금 바로 다시 청할 수 있다.",f)}
}
