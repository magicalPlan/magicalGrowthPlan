/* 단서 조각. js/event-boss/clue.js 다음에 불러야 한다. 숫자는 data/clue/piece.js.
   화면은 html/act/ord.html 의 #clp (실전 > 장기 의뢰 맨 위). 장기 의뢰를 열 때(js/event-boss/boss.js 의 eboss) clpDraw 를 부른다.
   출정(js/room.js 의 settle), 장기 토벌(js/main.js 의 lhClaim), 단서 탐색(js/event-boss/clue.js 의 clueClaim), 이벤트 보스 토벌 보상(js/event-boss/boss.js 의 ebGrant)은 clpGain 을 그대로 부른다.
   내 기록은 C.clp = {id, n: 찾은 개수, got: {단계 번호: 1}}.
   서버 합계는 tally/clue/{CLP.id} = {n: 합계, top: [{u, n: 이름, pt: 그 사람이 찾은 개수}]} 한 칸이다(희망의 등대 tally/wf 와 같은 방식).
   그 칸에 쓸 수 없으면 재해 진압 합계와 같은 tally/dr/{CLP.id} 에 대신 쓴다. 읽을 때는 두 칸 중 큰 값을 쓴다.
   장기 의뢰 화면이 열려 있고 이벤트 중일 때만 두 칸에 연결한다. 더 커진 합계만 반영하고, 화면을 벗어나거나 기간이 끝나면 연결을 닫는다. */
let CLPN=0,CLPTOP=[],clpBusy=false,clpAt=0;
const clpOn=()=>{const t=Date.now();return t>=CLP.from&&t<CLP.to};
const clpMine=()=>{if(!C)return{id:CLP.id,n:0,got:{}};if(!C.clp||C.clp.id!==CLP.id)C.clp={id:CLP.id,n:0,got:{}};C.clp.got=C.clp.got||{};return C.clp};
const clpPath=()=>"tally/clue/"+CLP.id,clpAlt=()=>"tally/dr/"+CLP.id;

/* 조각 발견. src: "x"(출정) · "lh"(장기 토벌) · "clue"(단서 탐색) · "eb"(이벤트 보스 토벌 보상). o: {ok: 성공, done: 끝까지 마쳤는지, hr: 시간}.
   이벤트 기간이 아니면 아무것도 하지 않는다. 찾았으면 안내 문구를 돌려준다. 저장은 부른 쪽이 한다. */
function clpGain(src,o){if(!C||!clpOn())return "";o=o||{};const D=CLP.drop;let n=0;
 if(src==="x")n=Math.random()<(o.ok?D.x_ok:D.x_fail)?1:0;
 else if(src==="lh"){if(o.done&&o.ok)for(let i=0;i<(o.hr||0);i++)if(Math.random()<D.lh)n++}
 else if(src==="eb")n=Math.max(0,Number(D.eb)||0);
 else if(src==="clue"){const c=D.clue,hr=Math.max(0,o.hr||0);
  if(o.done){let k=0;for(let i=0;i<hr;i++){k+=c.base;if(Math.random()<c.extra)k++}n=o.ok?k:Math.round(k*c.fail)}
  else for(let i=0;i<Math.floor(hr);i++)if(Math.random()<c.early)n++}
 if(n<=0)return "";const me=clpMine();me.n+=n;C.stats=C.stats||{};C.stats.clpN=Math.max(C.stats.clpN||0,me.n);clpAdd(n);
 return CLP.ic+" "+CLP.nm+" +"+n+" (내가 찾은 조각 "+me.n+"개)"}

// 서버 합계에 더한다. 실패해도 게임은 그대로 이어진다.
function clpAdd(n){if(!DB||!UID||!n||typeof XON==="function"&&!XON())return;const me=clpMine(),nm=String(typeof nmOf==="function"?nmOf():C.n||"").slice(0,20);
 const step=cur=>{const b=cur&&typeof cur.n==="number"?cur:{n:0,top:[]},o={n:Math.min(1e8,(Number(b.n)||0)+n),top:(Array.isArray(b.top)?b.top:[]).filter(t=>t&&t.u!==UID)};
  if(typeof b.pts==="number")o.pts=o.n;o.top.push({u:UID,n:nm,pt:me.n});o.top=o.top.sort((a,x)=>x.pt-a.pt).slice(0,5);return o};
 CLPN+=n;DB.doc(clpPath()).transact(step).then(v=>{if(v)clpTake(v)}).catch(()=>DB.doc(clpAlt()).transact(cur=>{const o=step(cur);o.pts=o.n;return o}).then(v=>{if(v)clpTake(v)}).catch(()=>{}))}
function clpTake(v){if(!v)return false;const k=Math.max(Number(v.n)||0,Number(v.pts)||0);if(k<CLPN)return false;CLPN=k;if(Array.isArray(v.top))CLPTOP=v.top;return true}
/* 장기 의뢰를 보고 있는 동안에만 합계 두 칸을 연결로 본다. 처음 한 번 받고, 이후에는 더 커진 합계만 반영한다.
   연결이 거절되면 POLL_HUB 마다 다시 묻되, 같으면 본문은 받지 않는다. */
let unClp=null,clpGen=0;
function clpWatchStop(){if(!unClp)return;clpGen++;unClp.forEach(u=>{try{u()}catch(e){}});unClp=null}
function clpWatchStart(){if(!DB||typeof XON!=="function"||!XON()||unClp)return;const now=Date.now();if(now<CLP.from||now>=CLP.to)return;const gen=++clpGen;
 const take=v=>{if(gen!==clpGen||!clpTake(v))return;if(typeof $==="function"&&$("#v-ord")&&!$("#v-ord").hidden)clpDraw(true)};
 unClp=[clpPath(),clpAlt()].map(p=>DB.doc(p).live().onSnapshot(sn=>take(sn.exists?sn.data():null),()=>{},POLL_HUB))}
async function clpLoad(){if(!DB||clpBusy)return;clpBusy=true;try{const rs=await Promise.all([clpPath(),clpAlt()].map(p=>DB.doc(p).get().then(s=>s.exists?s.data():null).catch(()=>null)));
  let n=0,top=[];rs.forEach(v=>{if(!v)return;const k=Math.max(Number(v.n)||0,Number(v.pts)||0);if(k>=n){n=k;if(Array.isArray(v.top))top=v.top}});if(n>=CLPN){CLPN=n;CLPTOP=top}clpAt=Date.now()}finally{clpBusy=false}
 if($("#v-ord")&&!$("#v-ord").hidden)clpDraw(true)}

// 단계 보상 받기: 합계가 그 단계에 닿았고, 조각을 1개 이상 찾았고, 아직 안 받았을 때만.
function clpClaim(i){const me=clpMine(),s=CLP.ms[i];if(!s||me.got[i]||me.n<1||CLPN<Math.ceil(CLP.goal*s[0]))return;const r=s[1],bits=[];
 C.inv=C.inv||{};if(r.g){C.gd=(C.gd||0)+r.g;bits.push("골드 +"+r.g)}if(r.m){C.inv.mana=(C.inv.mana||0)+r.m;bits.push("마력석 +"+r.m)}
 Object.entries(r.it||{}).forEach(([id,k])=>{C.inv[id]=(C.inv[id]||0)+k;try{dexAdd("it",id)}catch(e){}const x=ITM.find(t=>t[0]===id);bits.push((x?x[1]:id)+" +"+k)});
 Object.entries(r.mat||{}).forEach(([id,k])=>{C.inv[id]=(C.inv[id]||0)+k;bits.push((typeof cfName==="function"?cfName(id):id)+" +"+k)});
 if(r.evEgg){C.eggsEv=(C.eggsEv||0)+r.evEgg;bits.push((typeof PET_EV!=="undefined"?PET_EV.ic+" "+PET_EV.nm:"이벤트 알")+" +"+r.evEgg)}
 me.got[i]=1;titleState();if(s[0]>=1)C.stats.clpGoal=1;C.stats.maxGold=Math.max(C.stats.maxGold||0,C.gd||0);
 note("quest",CLP.nm+" '"+s[2]+"' 보상: "+bits.join(", "));save();checkTitles();toast(CLP.ic+" '"+s[2]+"' 보상을 받았다!");clpDraw(true)}

function clpRwTxt(r){const b=[];if(r.g)b.push("골드 "+r.g);if(r.m)b.push("마력석 "+r.m);
 Object.entries(r.it||{}).forEach(([id,k])=>{const x=ITM.find(t=>t[0]===id);b.push((x?x[1]:id)+" "+k)});
 Object.entries(r.mat||{}).forEach(([id,k])=>b.push((typeof cfName==="function"?cfName(id):id)+" "+k));
 if(r.evEgg)b.push((typeof PET_EV!=="undefined"?PET_EV.nm:"이벤트 알")+" "+r.evEgg);return b.join(", ")}

/* 장기 의뢰의 단서 조각 칸. 이벤트 전에는 예고만, 기간 중에는 진행도, 끝난 뒤에는 결과와 남은 보상을 보여 준다.
   위: 모두의 합계(큰 숫자)와 단계 표시가 달린 막대 · 가운데: 단계 보상 2×2 · 아래: 내 조각, 많이 찾은 사람, 찾는 곳. */
function clpDraw(noFetch){const box=$("#clp");if(!box||!C)return;const now=Date.now(),me=clpMine(),before=now<CLP.from,after=now>=CLP.to;box.innerHTML="";
 const c=elT("div","card clp-card");box.appendChild(c);
 const hd=elT("div","clp-hd");hd.append(elT("span","clp-ic",CLP.ic),(()=>{const t=elT("div","clp-ht");t.append(elT("p","boss-tag","서버 공동 이벤트 · "+(before?"11월 1일 시작":after?"종료":"남은 시간 "+cdTxt(CLP.to-now))),elT("h2","",CLP.nm+" 모으기"));return t})());c.appendChild(hd);
 c.appendChild(elT("p","clp-ds",CLP.ds));
 if(before){c.appendChild(elT("p","hint","11월 1일 0시부터 14일 24시까지 출정, 장기 토벌, 단서 탐색, 이벤트 보스 토벌에서 찾을 수 있다. 단서 탐색에서 가장 많이 나온다. 모두가 찾은 조각이 하나로 모여 목표 "+CLP.goal.toLocaleString()+"개에 도전한다."));if(typeof ordMarks==="function")ordMarks();return}
 const pct=Math.min(1,CLPN/CLP.goal),big=elT("div","clp-big");
 big.append(elT("b",null,CLPN.toLocaleString()),elT("span",null," / "+CLP.goal.toLocaleString()+"개"),elT("em",null,CLPN>=CLP.goal?"목표 달성!":Math.floor(pct*100)+"%"));c.appendChild(big);
 const bar=elT("div","bar clp-bar"),f=elT("i");f.style.width=(pct*100)+"%";bar.appendChild(f);
 CLP.ms.forEach(s=>{const t=elT("span","clp-tick"+(CLPN>=CLP.goal*s[0]?" on":""));t.style.left=(s[0]*100)+"%";bar.appendChild(t)});c.appendChild(bar);
 const grid=elT("div","clp-ms");CLP.ms.forEach((s,i)=>{const need=Math.ceil(CLP.goal*s[0]),reach=CLPN>=need,got=!!me.got[i],w=elT("div","clp-m"+(got?" got":reach?" ready":""));
  w.append(elT("small","clp-mn",(got?"✓ ":reach?"🎁 ":"")+need.toLocaleString()+"개"),elT("b",null,s[2]),elT("small","clp-mr",clpRwTxt(s[1])));
  if(!reach)w.appendChild(elT("span","clp-lock","🔒 "+(need-CLPN).toLocaleString()+"개 남음"));
  else{const b=elT("button","chip",got?"받았다":me.n<1?"조각 1개 필요":"보상 받기");b.type="button";b.disabled=got||me.n<1;b.onclick=()=>clpClaim(i);w.appendChild(b)}grid.appendChild(w)});c.appendChild(grid);
 const ft=elT("div","clp-ft");ft.appendChild(elT("p","clp-me","내가 찾은 조각 "+me.n.toLocaleString()+"개"+(me.n<1?" · 1개 이상 찾아야 보상을 받는다":"")));
 if(CLPTOP.length){const tp=elT("div","clp-top");tp.appendChild(elT("small",null,"많이 찾은 마법소녀"));CLPTOP.slice(0,5).forEach((t,i)=>tp.appendChild(elT("span","clp-chip"+(t.u===UID?" me":""),["🥇","🥈","🥉","4","5"][i]+" "+cn(t.u,t.n)+" "+(Number(t.pt)||0))));ft.appendChild(tp)}
 const wh=elT("div","clp-where");wh.appendChild(elT("small",null,"찾는 곳"));[["🔍 단서 탐색","시간당 약 2.5개"],["🗺 장기 토벌","시간당 "+Math.round(CLP.drop.lh*100)+"%"],["⚑ 출정","성공 "+Math.round(CLP.drop.x_ok*100)+"%"],["❄ 이벤트 보스","토벌 보상 "+CLP.drop.eb+"개"]].forEach(([a,b])=>{const sp=elT("span","clp-chip");sp.append(elT("b",null,a+" "),document.createTextNode(b));wh.appendChild(sp)});ft.appendChild(wh);
 c.appendChild(ft); if(typeof ordMarks==="function")ordMarks();
 if(!before&&!after){if(!unClp)clpWatchStart();if(!clpAt)clpLoad()}
 else{if(unClp)clpWatchStop();if(!noFetch&&Date.now()-clpAt>30000)clpLoad()}}
