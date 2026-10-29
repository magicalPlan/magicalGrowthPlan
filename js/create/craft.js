/* 제작(공방). main.js 다음에 불러야 한다. 마을 하위 탭.
   화면은 html/create/craft.html, 탭은 html/home/main.html, 전환은 js/main.js 의 show 와 navGroup.
   재료와 제작법 숫자는 data/craft.js 에 있다. 캐릭터 제작은 js/create.js 와 html/create/create.html 이다.
   출정(js/room.js 의 settle), 장기 토벌(js/main.js 의 lhClaim), 보스 레이드(js/boss.js)는 matGain 을 그대로 부른다. */
let craftQ=1,craftBusy=false;

// 이름표: 아이템이면 ITM, 재료면 MAT 에서 찾는다.
const cfName=id=>{const m=MATM[id];if(m)return m[2]+" "+m[1];const x=ITM.find(t=>t[0]===id);return x?x[1]:id};
const cfHave=id=>((C.inv||{})[id]||0);

/* 재료 얻기: MAT_DROP 의 표 이름 목록을 받아 줄마다 굴린다. times 가 있으면 그 표를 그만큼 반복한다(장기 토벌의 시간마다).
   C.inv 에만 더하고 저장은 하지 않는다. 부른 쪽이 원래 하던 대로 저장한다. 얻은 것이 없으면 빈 글자를 돌려준다. */
function matGain(tables,times){if(!C)return "";C.inv=C.inv||{};const got={},bonus=MAT_VIL[C.v];
 (tables||[]).filter(Boolean).forEach(k=>{const tb=MAT_DROP[k]||[];for(let i=0;i<(times||1);i++)tb.forEach(([id,n,p])=>{if(Math.random()<p)got[id]=(got[id]||0)+n})});
 // 북극광 순록(기간 한정 사역마): 장기 토벌 시간마다 재료 1개 더
 if(times&&(tables||[]).includes("lh_hr")&&typeof petEff==="function"){const pe=petEff("lhmat"),ids=(MAT_DROP.lh_hr||[]).map(x=>x[0]);for(let i=0;i<times;i++)if(Math.random()<pe){const id=ids[Math.floor(Math.random()*ids.length)];got[id]=(got[id]||0)+1}}
 if(bonus&&got[bonus])got[bonus]++;
 const ks=Object.keys(got);if(!ks.length)return "";
 ks.forEach(id=>{C.inv[id]=(C.inv[id]||0)+got[id]});C.stats=C.stats||{};C.stats.mats=(C.stats.mats||0)+ks.reduce((s,id)=>s+got[id],0);
 return "공방 재료: "+ks.map(id=>cfName(id)+" +"+got[id]).join(", ")}

// 이 제작법으로 지금 몇 개까지 만들 수 있는지. 재료, 골드, 들고 있을 수 있는 수(계약의 촛불은 1개)를 모두 본다.
const cfGold=r=>r[4]?pr(r[4]):0;
const cfCap=r=>r[1]==="candle"?Math.max(0,1-cfHave("candle")):99;
function cfMax(r){let n=cfCap(r);Object.entries(r[3]).forEach(([id,k])=>{n=Math.min(n,Math.floor(cfHave(id)/k))});const g=cfGold(r);if(g)n=Math.min(n,Math.floor((C.gd||0)/g));return Math.max(0,n)}

// 마을 공방 단계를 읽어 온 뒤 다시 그린다. 상점과 같은 방식으로 탭을 열 때 한 번만 묻는다.
async function craftRead(){if(craftBusy||!C||!XON()||typeof loadFac!=="function")return;craftBusy=true;try{await loadFac()}catch(e){}finally{craftBusy=false}if(!$("#v-craft").hidden)craft()}

function craft(msg){if(!C)return;C.inv=C.inv||{};const fresh=$("#v-craft").hidden,again=!fresh,y=window.scrollY;show("craft");if(again)window.scrollTo(0,y);
 const lv=facLv("workshop"),vb={A:"A마을 주민은 제작 골드가 10% 싸다.",B:"B마을 주민은 치유의 약초를 1개 더 얻는다.",C:"C마을 주민은 제작할 때 "+Math.round(CRAFT_C_BONUS*100)+"% 확률로 하나를 더 만든다.",D:"D마을 주민은 절망의 재를 1개 더 얻는다."}[C.v]||"";
 $("#cfh").textContent=(VL[C.v]?VL[C.v].n+" ":"")+"공방 "+lv+"단계. 마을 사람들이 공방을 지을수록 만들 수 있는 것이 늘어난다. "+vb;
 const mm=$("#cfmsg");mm.style.color="var(--mu)";mm.textContent=msg||"";if(msg&&again)toast(msg);
 // 가진 재료
 const ml=$("#cfm");ml.innerHTML="";MAT.forEach(m=>{const c=elT("button","chip cf-mat");c.type="button";c.title=m[3]+" 얻는 곳: "+m[4];c.onclick=()=>{mm.style.color="var(--mu)";mm.textContent=m[2]+" "+m[1]+": "+m[3]+" 얻는 곳: "+m[4]+"."};
  c.append(elT("span","cf-ic",m[2]),elT("b",null,m[1]),elT("span","cf-n",String(cfHave(m[0]))));c.setAttribute("aria-label",m[1]+" "+cfHave(m[0])+"개. "+m[3]+" 얻는 곳: "+m[4]);ml.appendChild(c)});
 // 만들 수량
 const qb=$("#cfq");qb.innerHTML="";qb.appendChild(elT("span","shopq-l","만들 수량"));
 [1,5,10,99].forEach(n=>{const b=elT("button","chip",n===99?"최대":n+"개");b.type="button";b.setAttribute("aria-pressed",craftQ===n?"true":"false");b.onclick=()=>{craftQ=n;craft()};qb.appendChild(b)});
 // 제작법
 const rl=$("#cfl");rl.innerHTML="";RCP.forEach(r=>{const lock=lv<r[5],mx=lock?0:cfMax(r),k=Math.min(craftQ,mx),g=cfGold(r),b=document.createElement("button");b.type="button";b.className="chip sq cf-r"+(lock?" lock":"");
  const it=ITM.find(t=>t[0]===r[1]),ds=it?it[2]:(MATM[r[1]]||[])[3]||"";
  b.appendChild(elT("b",null,(MATM[r[1]]?"정화 → ":"")+cfName(r[1])+(r[2]>1?" ×"+r[2]:"")));b.appendChild(elT("small","item-feature",r[6]+" "+ds));
  const need=elT("small","cf-need");Object.entries(r[3]).forEach(([id,n])=>{const s=elT("span",cfHave(id)>=n?"ok":"no",cfName(id)+" "+cfHave(id)+"/"+n);need.appendChild(s)});if(g)need.appendChild(elT("span",(C.gd||0)>=g?"ok":"no","골드 "+g));b.appendChild(need);
  const st=lock?"🔒 마을 공방 "+r[5]+"단계에 열린다":mx<=0?(r[1]==="candle"&&cfHave("candle")>=1?"계약의 촛불은 1개까지만 가질 수 있다":"재료가 모자라다"):"지금 "+mx+"개까지 만들 수 있다"+(k>1?" · "+k+"개 만들기":"");
  b.appendChild(elT("small",null,st));b.appendChild(elT("small",null,"보유 "+cfHave(r[1])));
  b.setAttribute("aria-label",cfName(r[1])+" 만들기. "+st+". "+r[6]);b.disabled=lock||mx<=0;b.onclick=()=>doCraft(r[0]);rl.appendChild(b)});
 if(fresh)craftRead()}

// 만들기: 재료와 골드를 쓰고 결과물을 가방에 넣는다. 바뀐 칸만 저장한다.
function doCraft(rid){const r=RCP.find(x=>x[0]===rid);if(!r||!C)return;if(facLv("workshop")<r[5])return;const k=Math.min(craftQ,cfMax(r));if(k<=0)return;
 C.inv=C.inv||{};C.stats=C.stats||{};const g=cfGold(r)*k,fields={};
 Object.entries(r[3]).forEach(([id,n])=>{C.inv[id]=cfHave(id)-n*k;fields["inv/"+id]=C.inv[id]});
 if(g){C.gd=(C.gd||0)-g;fields.gd=C.gd}
 let out=r[2]*k,extra=0;if(C.v==="C")for(let i=0;i<k;i++)if(Math.random()<CRAFT_C_BONUS)extra+=r[2];if(r[1]==="candle")extra=0;out+=extra;
 C.inv[r[1]]=cfHave(r[1])+out;fields["inv/"+r[1]]=C.inv[r[1]];
 if(ITM.some(t=>t[0]===r[1])&&dexAdd("it",r[1]))fields["dex/it/"+r[1]]=C.dex.it[r[1]];
 C.stats.crafts=(C.stats.crafts||0)+k;fields["stats/crafts"]=C.stats.crafts;
 apiAccountWrite(fields).catch(()=>{try{save()}catch(e){}});titleState();checkTitles();
 craft("🔨 "+cfName(r[1])+" "+out+"개를 만들었다."+(extra?" (C마을의 솜씨로 "+extra+"개 더!)":"")+(g?" (골드 "+g+")":""))}

/* 속성의 프리즘: 가방에서 '사용'을 누르면 아래 상자가 열린다. 바꿀 속성(가진 것)과 새 속성(아직 없는 것)을 고르고 확인하면 바뀐다.
   준비해 둔 마법은 속성이 맞을 때만 쓰이므로(armedSk), 사라진 속성의 마법은 저절로 쓰이지 않는다. 숫자는 data/game.js 의 PRISM_DZ. */
let prismOn=false,prismPick=null;
function prismBox(){const box=elT("div","card prism-box"),own=C.a||[],free=AT.filter(t=>!own.includes(t[0]));
 if(prismPick==null&&own.length===1)prismPick={from:own[0],to:null};prismPick=prismPick||{from:null,to:null};
 const chipRow=(list,key)=>{const r=elT("div","row");list.forEach(t=>{const b=elT("button","chip",t[0]);b.type="button";b.style.setProperty("--c",t[1]);b.title=t[2];b.setAttribute("aria-pressed",prismPick[key]===t[0]?"true":"false");b.onclick=()=>{prismPick[key]=t[0];bag()};r.appendChild(b)});return r};
 box.appendChild(elT("p","hint","바꿀 속성"));box.appendChild(chipRow(AT.filter(t=>own.includes(t[0])),"from"));
 box.appendChild(elT("p","hint","새 속성"));box.appendChild(chipRow(free,"to"));
 const to=AT.find(t=>t[0]===prismPick.to);if(to)box.appendChild(elT("p","hint",to[0]+" 속성: "+to[2]+" · 마법 「"+((SK[to[0]]||{}).nm||"")+"」"));
 const ok=!!prismPick.from&&!!prismPick.to,b=elT("button","btn"+(ok?"":" g"),ok?"「"+prismPick.from+"」을(를) 「"+prismPick.to+"」(으)로 바꾼다":"두 속성을 모두 골라야 한다");b.type="button";b.disabled=!ok;b.onclick=prismUse;box.appendChild(b);return box}
function prismUse(){const p=prismPick||{},own=C.a||[];if(!p.from||!p.to||!own.includes(p.from)||own.includes(p.to)||!AT.some(t=>t[0]===p.to))return;
 if((C.inv.prism||0)<1)return;if(C.fall){bag("타락한 동안에는 프리즘이 빛을 굴절시키지 못한다.");$("#bgm").style.color="var(--bad)";return}
 if(!confirm("속성 「"+p.from+"」을(를) 「"+p.to+"」(으)로 바꿀까?\n\n· 「"+p.from+"」의 효과와 마법은 사라진다\n· 되돌릴 수 없다 (다시 바꾸려면 프리즘이 하나 더 필요하다)\n· 절망도가 "+PRISM_DZ+" 오른다"))return;
 C.inv.prism--;C.a=own.map(a=>a===p.from?p.to:a);C.stats=C.stats||{};C.stats.attrChanges=(C.stats.attrChanges||0)+1;prismOn=false;prismPick=null;titleState();
 note("quest","속성의 프리즘: 속성이 「"+p.from+"」에서 「"+p.to+"」(으)로 바뀌었다.");gain(0,PRISM_DZ);save();regPlayer();checkTitles();
 const t=AT.find(x=>x[0]===p.to);alertBox("✦ 속성의 프리즘","프리즘을 들어 올리자 계약의 빛이 갈라졌다.\n"+p.from+"의 힘이 스러지고, "+p.to+"의 힘이 몸에 스며든다.\n\n「"+p.from+"」 → 「"+p.to+"」\n"+(t?t[2]:"")+"\n\n대가로 절망도가 "+PRISM_DZ+" 올랐다.");bag()}
