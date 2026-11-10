/* 수상한 상인(상점 가챠). shop.js 다음에 불러야 한다.
   화면: html/shop/shop.html #shdbox.
   · 버튼은 '10회 열기' 하나. 총 SHADY_COST(2000)골드로 보상 10칸(2×5) = 칸당 200골드.
   · 등급 확률 후 등급 안 균등. UI 는 결과 칸·버튼·골드만 고친다(상점 통째 재구성 금지).
   · 로컬에서 골드·보상을 한 번에 반영한 뒤 칸 PATCH. 실패 시 스냅샷으로 되돌린다. */
const SHADY_COST=2000,SHADY_N=10,SHADY_UNIT=SHADY_COST/SHADY_N;
/* 등급 뽑기 확률(합 100%). 칸마다 독립. 등급 안 아이템은 균등 → 표의 8.38%/4%/1%/0.33% 와 같음. */
const SHADY_TIER_P=[.67,.28,.04,.01];
/* [등급0..][보상]. k: inv(가방·재료)·gd·eggs·eggsEv. n: 개수. */
const SHADY_POOL=[
 [{k:"inv",id:"mana",n:2},{k:"inv",id:"charm",n:1},{k:"inv",id:"map",n:1},{k:"inv",id:"flag",n:1},{k:"inv",id:"seal",n:1},{k:"inv",id:"hope",n:1},{k:"inv",id:"g2",n:1},{k:"gd",n:50}],
 [{k:"inv",id:"m_shard",n:2},{k:"inv",id:"m_herb",n:2},{k:"inv",id:"m_ore",n:2},{k:"inv",id:"m_dew",n:2},{k:"inv",id:"m_ash",n:10},{k:"inv",id:"m_crown",n:1},{k:"gd",n:500}],
 [{k:"inv",id:"g4",n:3},{k:"eggs",n:1},{k:"eggsEv",n:1},{k:"gd",n:5000}],
 [{k:"inv",id:"prism",n:1},{k:"inv",id:"license",n:1},{k:"inv",id:"vtown",n:1}]
];
let shadyBusy=false,shadyBuilt=false;
function shadyOpen(){try{return localStorage.getItem("mgr_shop_shd")!=="0"}catch(e){return true}}
function shadyFold(open){const b=$("#shdtog"),box=$("#shdbox");if(!b||!box)return;box.hidden=!open;b.textContent=open?"접기 ▲":"펼치기 ▼";b.setAttribute("aria-expanded",open?"true":"false");try{localStorage.setItem("mgr_shop_shd",open?"1":"0")}catch(e){}
 if(open)shopShady()}
function shadyRollOne(){let r=Math.random(),acc=0,ti=SHADY_TIER_P.length-1;
 for(let i=0;i<SHADY_TIER_P.length;i++){acc+=SHADY_TIER_P[i];if(r<acc){ti=i;break}}
 const pool=SHADY_POOL[ti]||SHADY_POOL[0],pick=pool[Math.floor(Math.random()*pool.length)];
 return Object.assign({tier:ti+1},pick)}
function shadyRollPack(){const a=[];for(let i=0;i<SHADY_N;i++)a.push(shadyRollOne());return a}
function shadyName(r){
 if(r.k==="gd")return "골드";
 if(r.k==="eggs")return"사역마의 알";
 if(r.k==="eggsEv")return typeof PET_EV!=="undefined"?PET_EV.nm:"시즌 알";
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
  cell.className="shady-cell"+(r?" t"+r.tier:"");cell.innerHTML="";
  if(!r){cell.appendChild(elT("small","","—"));continue}
  if(r.k==="inv"&&typeof itIc==="function"){const ic=itIc(r.id,"sm");if(ic)cell.appendChild(ic)}
  else if(r.k==="eggs"||r.k==="eggsEv")cell.appendChild(elT("span","shady-ic",r.k==="eggsEv"&&typeof PET_EV!=="undefined"?PET_EV.ic:"🥚"));
  else if(r.k==="gd")cell.appendChild(elT("span","shady-ic","💰"));
  cell.appendChild(elT("b","",shadyName(r)));cell.appendChild(elT("small","","×"+r.n))}}
function shadySnap(){const inv={};C.inv=C.inv||{};Object.keys(C.inv).forEach(k=>{inv[k]=C.inv[k]});
 return{gd:C.gd||0,eggs:C.eggs||0,eggsEv:C.eggsEv||0,inv,mats:(C.stats&&C.stats.mats)||0}}
function shadyRestore(s){if(!s||!C)return;C.gd=s.gd;C.eggs=s.eggs;C.eggsEv=s.eggsEv;C.inv=Object.assign({},s.inv);
 C.stats=C.stats||{};C.stats.mats=s.mats}
function shadyApplyOne(r,fields){if(!r||!C)return;
 if(r.k==="gd"){C.gd=(C.gd||0)+r.n;fields.gd=C.gd;return}
 if(r.k==="eggs"){C.eggs=(C.eggs||0)+r.n;fields.eggs=C.eggs;return}
 if(r.k==="eggsEv"){C.eggsEv=(C.eggsEv||0)+r.n;fields.eggsEv=C.eggsEv;return}
 if(r.k==="inv"&&r.id){C.inv=C.inv||{};C.inv[r.id]=(C.inv[r.id]||0)+r.n;fields["inv/"+r.id]=C.inv[r.id];
  try{if(typeof dexAdd==="function"){if(typeof MATM!=="undefined"&&MATM[r.id])dexAdd("mat",r.id);else dexAdd("it",r.id)}}catch(e){}
  if(typeof MATM!=="undefined"&&MATM[r.id]){C.stats=C.stats||{};C.stats.mats=(C.stats.mats||0)+r.n;fields["stats/mats"]=C.stats.mats}}}
/* 10회 열기 = 보상 10칸을 한 번에. 비용 SHADY_COST(2000, 칸당 SHADY_UNIT). */
async function shadyPull(){if(shadyBusy||!C)return;const cost=SHADY_COST;
 if((C.gd||0)<cost){const sm=$("#sm");if(sm){sm.style.color="var(--bad)";sm.textContent="골드가 부족하다. 10회 열기에 "+cost+"골드가 필요하다."}shadyPaintBtns();return}
 shadyBusy=true;shadyPaintBtns();const snap=shadySnap(),fields={};
 try{C.gd=(C.gd||0)-cost;fields.gd=C.gd;C.stats=C.stats||{};
  const show=shadyRollPack();show.forEach(r=>shadyApplyOne(r,fields));
  C.stats.maxGold=Math.max(C.stats.maxGold||0,C.gd||0);fields["stats/maxGold"]=C.stats.maxGold;
  shadyPaintGrid(show);shadyPaintGold();shadyPaintBtns();
  /* 한 번의 PATCH 로 골드·보상 칸을 같이 남긴다. 실패 시 스냅샷으로 되돌린 뒤 저장해 서버와 맞춘다. */
  if(typeof apiAccountWrite==="function")await apiAccountWrite(fields);
  else if(typeof save==="function")save();
  const sm=$("#sm");if(sm){sm.style.color="var(--mu)";sm.textContent="상자를 10회 열었다. (-"+cost+"골드)"}
  try{if(typeof checkTitles==="function")checkTitles()}catch(e){}}
 catch(e){shadyRestore(snap);shadyPaintGrid(null);shadyPaintGold();
  try{if(typeof save==="function")save()}catch(_){}
  const sm=$("#sm");if(sm){sm.style.color="var(--bad)";sm.textContent="상자를 열지 못했다. 골드는 그대로다."}}
 finally{shadyBusy=false;shadyPaintBtns()}}
function shopShady(){if(!C)return;const box=$("#shdbox");if(!box||box.hidden)return;
 if(!shadyBuilt||!$("#shdgrid")||!$("#shdgrid").children.length){
  const grid=$("#shdgrid");if(grid){grid.innerHTML="";for(let i=0;i<SHADY_N;i++)grid.appendChild(elT("div","shady-cell",""));shadyBuilt=true}
  const b10=$("#shd10");if(b10&&!b10._shady){b10._shady=1;b10.onclick=()=>shadyPull()}
  const tog=$("#shdtog");if(tog&&!tog._shady){tog._shady=1;tog.onclick=()=>shadyFold(!!$("#shdbox")&&!!$("#shdbox").hidden)}}
 /* 안내 문구: 기획 변경 시 html #shdlead 또는 아래 한 줄만 고친다.
    기본: "수상한 상인이 상자를 판다. 상자 안에는 상상 이상으로 좋은 상품도, 꽝도 있다." */
 shadyPaintBtns()}
