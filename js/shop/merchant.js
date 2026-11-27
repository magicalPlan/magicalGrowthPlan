/* 수상한 상인(상점 가챠). shop.js 다음에 불러야 한다.
   화면: html/shop/shop.html #shdbox.
   · 10회 열기 = SHADY_COST(2000)골드 · 보상 10칸.
   · 굴림·차감·지급은 Functions(shadyPull). 클라는 요청·표시·확률표만.
   · 요청: shady/go/{uid}/{reqId} → done·show. 계정은 sid:"shady" sync. */
const SHADY_COST=2000,SHADY_N=10,SHADY_UNIT=SHADY_COST/SHADY_N;
const SHADY_TIER_P=[.67,.28,.04,.01];
const SHADY_POOL=[
 [{k:"inv",id:"mana",n:2},{k:"inv",id:"charm",n:1},{k:"inv",id:"map",n:1},{k:"inv",id:"flag",n:1},{k:"inv",id:"seal",n:1},{k:"inv",id:"hope",n:1},{k:"inv",id:"g2",n:1},{k:"gd",n:50},{k:"inv",id:"m_forest",n:1},{k:"inv",id:"m_coast",n:1},{k:"inv",id:"m_valley",n:1}],
 [{k:"inv",id:"m_shard",n:2},{k:"inv",id:"m_herb",n:2},{k:"inv",id:"m_ore",n:2},{k:"inv",id:"m_dew",n:2},{k:"inv",id:"m_ash",n:10},{k:"inv",id:"m_crown",n:1},{k:"gd",n:500},{k:"inv",id:"petcan",n:3},{k:"inv",id:"m_abyss",n:2}],
 [{k:"inv",id:"g4",n:3},{k:"inv",id:"pfcandy",n:3},{k:"eggs",n:2},{k:"eggsEv",n:2},{k:"gd",n:5000},{k:"inv",id:"petfeast",n:2},{k:"inv",id:"trcyan",n:1},{k:"inv",id:"trblue",n:1},{k:"inv",id:"trcast",n:1}],
 [{k:"inv",id:"prism",n:1},{k:"inv",id:"license",n:1},{k:"inv",id:"vtown",n:1},{k:"inv",id:"milk",n:1},{k:"inv",id:"m_world",n:1},{k:"inv",id:"m_aspire",n:1}]
];
let shadyBusy=false,shadyBuilt=false;
/* 가챠 대기 중 클라 PATCH 가 서버 차감·지급(골드·알·가방·통계)을 덮지 않게 한다. */
function shadyStripPatch(body){if(!body||!shadyBusy)return body;Object.keys(body).forEach(k=>{
 if(k==="c/gd"||k==="c/eggs"||k==="c/eggsEv"||k==="c/eggsEv2"||k==="shadypay"||k.indexOf("shadypay/")===0
  ||k.indexOf("c/inv/")===0||k==="c/stats"||k.indexOf("c/stats/")===0)delete body[k]});return body}
const shadyWhy={gold:"골드가 부족하다. 10회 열기에 "+SHADY_COST+"골드가 필요하다.",acc:"계정을 찾지 못했다.",bad:"요청이 올바르지 않다.",dup:"이미 처리된 요청이다.",err:"서버에서 상자를 열지 못했다."};
function shadyEvEgg(){const live=typeof eventLive==="function"?eventLive():null,inv=live&&live.egg&&live.egg.inv;
 if(inv==="eggsEv2")return{inv:"eggsEv2",meta:typeof PET_EV2!=="undefined"?PET_EV2:null};
 if(inv==="eggsEv")return{inv:"eggsEv",meta:typeof PET_EV!=="undefined"?PET_EV:null};
 return null}
function shadyOpen(){try{return localStorage.getItem("mgr_shop_shd")!=="0"}catch(e){return true}}
function shadyFold(open){const b=$("#shdtog"),box=$("#shdbox");if(!b||!box)return;box.hidden=!open;b.textContent=open?"접기 ▲":"펼치기 ▼";b.setAttribute("aria-expanded",open?"true":"false");try{localStorage.setItem("mgr_shop_shd",open?"1":"0")}catch(e){}
 shopShady()}
function shadyName(r){
 if(r.k==="gd")return"골드";
 if(r.k==="eggs")return"사역마의 알";
 if(r.k==="eggsEv"){const e=shadyEvEgg();return e&&e.meta&&e.meta.nm?e.meta.nm:(e?"시즌 알":"사역마의 알")}
 if(typeof ITM!=="undefined"){const x=ITM.find(t=>t[0]===r.id);if(x)return x[1]}
 if(typeof MAT!=="undefined"){const x=MAT.find(t=>t[0]===r.id);if(x)return x[1]}
 return r.id||"?"}
function shadyPaintGold(){const sg=$("#sg");if(!sg||!C)return;
 sg.textContent="보유 골드 "+(C.gd||0)+". 골드는 토벌과 시련에서 얻는다."+(C.v==="A"?" A마을 주민은 10% 할인을 받는다.":"")}
function shadyPaintBtns(){const b=$("#shd10");if(!b||!C)return;const g=C.gd||0;
 b.disabled=shadyBusy||g<SHADY_COST;
 b.textContent=shadyBusy?"여는 중...":"10회 열기 ("+SHADY_COST+"골드)"}
function shadyPaintGrid(list){const grid=$("#shdgrid");if(!grid)return;
 const cells=grid.children;for(let i=0;i<SHADY_N;i++){const cell=cells[i];if(!cell)continue;const r=list&&list[i];
  cell.className="shady-cell"+(r?" t"+r.tier:" empty");cell.innerHTML="";
  if(!r){cell.appendChild(elT("span","shady-q","?"));continue}
  if(r.k==="inv"&&typeof itIc==="function"){const ic=itIc(r.id,"sm");if(ic)cell.appendChild(ic)}
  else if(r.k==="eggs"||r.k==="eggsEv"){const e=r.k==="eggsEv"?shadyEvEgg():null;cell.appendChild(elT("span","shady-ic",e&&e.meta&&e.meta.ic?e.meta.ic:"🥚"))}
  else if(r.k==="gd"){const i=document.createElement("img");i.src="assets/items/gold.png"+(typeof ITEM_IMG_V!=="undefined"?"?v="+ITEM_IMG_V:"");i.alt="";i.width=32;i.height=32;i.decoding="async";i.className="it-ic sm";cell.appendChild(i)}
  cell.appendChild(elT("b","",shadyName(r)));cell.appendChild(elT("small","","×"+r.n))}}
async function shadyWait(path,ms){ms=ms||25000;const t0=Date.now();
 while(Date.now()-t0<ms){try{const s=await DB.doc(path).get(),v=s.exists?s.data():null;if(v&&v.done)return v}catch(e){}await new Promise(r=>setTimeout(r,400))}
 return null}
async function shadySyncBg(after){
 try{if(typeof accSeen!=="undefined")accSeen=0;if(typeof accSyncIfNewer==="function")await accSyncIfNewer()}catch(e){}
 try{if(typeof after==="function")after()}catch(e){}}
function shadyFail(msg){const sm=$("#sm");if(sm){sm.style.color="var(--bad)";sm.textContent=msg||shadyWhy.err}shadyPaintGold();shadyPaintBtns()}
/* 클라는 요청만. 골드 판단·굴림·차감·지급은 서버. */
async function shadyPull(){if(shadyBusy||!C)return;const cost=SHADY_COST;
 if((C.gd||0)<cost){shadyFail(shadyWhy.gold);return}
 if(!AUTH||!AUTH.uid||!DB||typeof LOCAL!=="undefined"&&LOCAL){shadyFail("온라인에서만 상자를 열 수 있다.");return}
 shadyBusy=true;shadyPaintBtns();
 const reqId="r"+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36);
 const path="shady/go/"+AUTH.uid+"/"+reqId;
 try{
  await DB.doc(path).set({ts:Date.now()});
  const res=await shadyWait(path,25000);
  if(!res||!res.done){shadyFail("서버 응답이 늦다. 잠시 뒤 다시 시도해 보자.");await shadySyncBg(()=>{shadyPaintGold();shadyPaintBtns()});return}
  if(!res.ok){shadyFail(shadyWhy[res.why]||shadyWhy.err);await shadySyncBg(()=>{shadyPaintGold();shadyPaintBtns()});return}
  if(res.why==="dup"||!Array.isArray(res.show)){await shadySyncBg(()=>{shadyPaintGold();shadyPaintBtns()});
   const sm=$("#sm");if(sm){sm.style.color="var(--mu)";sm.textContent="이미 처리된 요청이다."}return}
  shadyPaintGrid(res.show);
  const sm=$("#sm");if(sm){sm.style.color="var(--mu)";
   const pool=typeof SHADY_SAY!=="undefined"&&SHADY_SAY.length?SHADY_SAY:["상자를 10회 열었다. (-{cost}골드)"];
   sm.textContent=String(pool[Math.floor(Math.random()*pool.length)]||"").replace(/\{cost\}/g,String(res.cost||cost))}
  try{res.show.forEach(r=>{if(!r||r.k!=="inv"||!r.id)return;
   try{if(typeof MATM!=="undefined"&&MATM[r.id])dexAdd("mat",r.id);else dexAdd("it",r.id)}catch(e){}})}catch(e){}
  await shadySyncBg(()=>{
   try{if(typeof titleState==="function")titleState()}catch(e){}
   try{if(typeof checkTitles==="function")checkTitles()}catch(e){}
   shadyPaintGold();shadyPaintBtns()
  });
 }catch(e){shadyFail(shadyWhy.err);await shadySyncBg(()=>{shadyPaintGold();shadyPaintBtns()})}
 finally{shadyBusy=false;shadyPaintBtns();try{if(typeof savePending!=="undefined"&&savePending&&typeof saveCloud==="function")saveCloud()}catch(e){}}}
function shadyStoryFail(msg){const sm=$("#sm");if(sm){sm.style.color="var(--bad)";sm.textContent=msg||"이야기를 열지 못했다."}else if(typeof toast==="function")toast(msg||"이야기를 열지 못했다.")}
function shadyStoryPlay(){if(typeof storyLoad!=="function"||typeof vnOpen!=="function"){shadyStoryFail("이야기 기능을 불러오지 못했다.");return}
 const play=$("#shdplay");if(play)play.disabled=true;
 storyLoad().then(book=>{
  const list=Array.isArray(book&&book.shards)?book.shards:[];
  const story=list.find(s=>s&&s.id==="shady-merchant-1");
  if(!story||!story.start){shadyStoryFail("수상한 상인 이야기가 아직 없다.");return}
  vnOpen(story)}).catch(()=>shadyStoryFail("이야기를 불러오지 못했다.")).finally(()=>{if(play)play.disabled=false})}
function shopShady(){if(!C)return;
 const play=$("#shdplay");if(play&&!play._shady){play._shady=1;play.onclick=()=>shadyStoryPlay()}
 const tog=$("#shdtog");if(tog&&!tog._shady){tog._shady=1;tog.onclick=()=>shadyFold(!!$("#shdbox")&&!!$("#shdbox").hidden)}
 const box=$("#shdbox");if(!box||box.hidden)return;
 if(!shadyBuilt||!$("#shdgrid")||!$("#shdgrid").children.length){
  const grid=$("#shdgrid");if(grid){grid.innerHTML="";for(let i=0;i<SHADY_N;i++)grid.appendChild(elT("div","shady-cell",""));shadyBuilt=true;shadyPaintGrid(null)}
  const b10=$("#shd10");if(b10&&!b10._shady){b10._shady=1;b10.onclick=()=>shadyPull()}}
 shadyPaintBtns()}
