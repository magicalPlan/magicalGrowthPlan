/* 도감. main.js 다음에 불러야 한다. 출정 이벤트, 보스, 무기, 아이템, 마법 수집과 절반·완성 보상.
   출정과 상점, 보스는 dexAdd 를, 칭호 화면은 setRec 을, 기록 탭은 dex 를 그대로 부른다. */
/* 도감: 출정 이벤트, 보스, 무기, 아이템, 마법. 분류마다 절반과 전부를 모으면 보상을 받는다.
   C.dex = {ev:{id:1}, bs:{이름:1 만남 / 2 처치}, it:{id:1}, sk:{id:1}, rw:{분류+h/f:받음}}. 무기는 가진 무기 목록으로 센다. */
const evVil=id=>Object.keys(VEV).find(v=>VEV[v].some(x=>x.id===id));
const evName=(x,v)=>{const t=String(x.t||x.q).replace(/\{v\}/g,VL[v]?VL[v].n:"마을").replace(/\{f\}/g,"누군가"),i=t.indexOf(":");return i>0?[t.slice(0,i),t.slice(i+1).trim()]:[t,""]};
function dexAdd(k,id,val){if(!C)return false;val=val||1;C.dex=C.dex||{};C.dex[k]=C.dex[k]||{};if((C.dex[k][id]||0)>=val)return false;C.dex[k][id]=val;return true}
const dexHas=(c,k,id)=>k==="wp"?(c.wps||[]).includes(Number(String(id).slice(1))):!!(c.dex&&c.dex[k]&&c.dex[k][id]);
const DEX_ITEMS={};
function dexItems(k){if(DEX_ITEMS[k])return DEX_ITEMS[k];const d=DEX.find(x=>x.k===k);return DEX_ITEMS[k]=d?d.items():[]}
const dexN=(c,k)=>dexItems(k).filter(it=>dexHas(c,k,it.id)).length;
const dexTot=k=>dexItems(k).length;
const dexClaimable=d=>{const n=dexN(C,d.k),t=dexTot(d.k),r=(C.dex&&C.dex.rw)||{};return[["h",Math.ceil(t/2)],["f",t]].filter(([k,need])=>!r[d.k+k]&&n>=need)};
let recTab="dex",dexCat="ev",dexBusy=false;
function setRec(t){recTab=t;$("#dex-box").hidden=t!=="dex";$("#ttl-box").hidden=t!=="ttl";document.querySelectorAll("#rec-t button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.r===t?"true":"false"))}
/* 도감 기록은 탭을 열 때 서버에서 한 번만 받는다. 분류를 누르거나 보상을 받는 동안에는 다시 묻지 않는다. */
async function readDex(){if(!C||!AUTH.uid||LOCAL||!DB||dexBusy)return;dexBusy=true;let redraw=false;try{
 if(savePending&&typeof saveCloud==="function"){try{await saveCloud(true)}catch(e){}}if(savePending)return;
 const stamp=JSON.stringify(C.dex||null);let d=null;try{const s=await DB.doc("accounts/"+UID+"/c/dex").get();d=s.exists?s.data():null}catch(e){return}
 if(savePending||JSON.stringify(C.dex||null)!==stamp||!d||typeof d!=="object")return;
 if(JSON.stringify(d)===stamp)return;C.dex=d;redraw=true;
 if(typeof accBase!=="undefined"&&accBase){try{accBase.dex=JSON.parse(JSON.stringify(d))}catch(e){}}}
 finally{dexBusy=false}if(redraw&&!$("#v-titles").hidden&&recTab==="dex")dex(undefined,1)}
function dex(msg,again){const fresh=!again&&($("#v-titles").hidden||recTab!=="dex");show("titles");setRec("dex");titleState();C.dex=C.dex||{};C.dex.rw=C.dex.rw||{};ITM.forEach(x=>{if(((C.inv||{})[x[0]]||0)>0)dexAdd("it",x[0])});
 let got=0,all=0;DEX.forEach(d=>{got+=dexN(C,d.k);all+=dexTot(d.k)});
 const sm=$("#dex-sum");sm.innerHTML="";const bar=elT("div","bar"),fi=elT("i");fi.style.width=(got/all*100)+"%";bar.appendChild(fi);
 sm.append(elT("h2","","마법소녀 도감"),elT("p","hint","출정, 보스, 상점, 마법에서 만난 것들이 기록된다. 분류마다 절반과 전부를 모으면 보상을 받는다."),bar,elT("p","hint","전체 수집률 "+Math.floor(got/all*100)+"% ("+got+" / "+all+")"));
 const cs=$("#dex-cats");cs.innerHTML="";DEX.forEach(d=>{const b=elT("button","chip",d.nm+" "+dexN(C,d.k)+"/"+dexTot(d.k)+(dexClaimable(d).length?" ●":""));b.type="button";b.setAttribute("aria-pressed",dexCat===d.k?"true":"false");b.onclick=()=>{dexCat=d.k;dex()};cs.appendChild(b)});
 const d=DEX.find(x=>x.k===dexCat),n=dexN(C,d.k),t=dexTot(d.k),hd=$("#dex-cat");hd.innerHTML="";
 const rw=(lab,need,key,r)=>{const done=C.dex.rw[d.k+key],ok=n>=need,b=elT("button",done?"chip":"btn"+(ok?"":" g"),done?lab+" 받음":lab+" ("+need+"개) · "+rwTxt(r));b.type="button";b.disabled=!!done||!ok;b.style.cssText="width:auto;margin:0;padding:9px 12px;font-size:.88rem";
  b.onclick=()=>{if(C.dex.rw[d.k+key]||dexN(C,d.k)<need)return;C.dex.rw[d.k+key]=1;giveRw(r);note("dex","도감 "+d.nm+" "+lab+": "+rwTxt(r));save();checkTitles();dex(d.nm+" "+lab+"을 받았다: "+rwTxt(r))};return b};
 const row=elT("div","row");row.style.marginBottom="10px";row.append(rw("절반 보상",Math.ceil(t/2),"h",d.half),rw("완성 보상",t,"f",d.full));hd.appendChild(row);
 const l=$("#dex-list");l.innerHTML="";dexItems(d.k).forEach(it=>{const has=dexHas(C,d.k,it.id),c=elT("div","chip sq dex-it"+(has?"":" lock"));
  const star=(d.k==="bs"&&C.dex.bs&&C.dex.bs[it.id]>=2)||(d.k==="wp"&&has&&wlv(Number(it.id.slice(1)))>=5)?" ★":"";
  if(d.k==="it"){const ic=itIc(it.id,"lg");if(ic)c.appendChild(ic)}c.append(elT("small","dex-tag",it.tag),elT("b","",has?it.nm+star:"???"),elT("small","",has?it.ds:it.hint));l.appendChild(c)});
 const m=$("#dex-msg");m.style.color="var(--mu)";m.textContent=msg||(d.k==="bs"?"★는 처치까지 함께한 보스다.":d.k==="wp"?"★는 +5까지 강화한 무기다.":d.k==="ev"?"마을 전용 이벤트는 그 마을 출신과 함께 출정해야 만날 수 있다.":"");if(fresh)readDex()}
$("#rec-t").onclick=e=>{const t=e.target.dataset&&e.target.dataset.r;if(t==="dex")dex();else if(t==="ttl")titles()};
