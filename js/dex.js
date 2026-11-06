/* 도감. main.js 다음에 불러야 한다. 출정 이벤트, 보스, 무기, 아이템, 마법 수집과 절반·완성 보상.
   출정과 상점, 보스는 dexAdd 를, 칭호 화면은 setRec 을, 기록 탭은 dex 를 그대로 부른다. */
/* 도감: 출정 이벤트, 보스, 무기, 아이템, 마법. 분류마다 절반과 전부를 모으면 보상을 받는다.
   C.dex = {ev:{id:1}, bs:{이름:1 만남 / 2 처치}, it:{id:1}, sk:{id:1}, rw:{분류+h/f:받음}}. 무기는 가진 무기 목록으로 센다. */
const evVil=id=>Object.keys(VEV).find(v=>VEV[v].some(x=>x.id===id));
const evName=(x,v)=>{const t=String(x.t||x.q).replace(/\{v\}/g,VL[v]?VL[v].n:"마을").replace(/\{f\}/g,"누군가"),i=t.indexOf(":");return i>0?[t.slice(0,i),t.slice(i+1).trim()]:[t,""]};
function dexAdd(k,id,val){if(!C)return false;val=val||1;C.dex=C.dex||{};C.dex[k]=C.dex[k]||{};if((C.dex[k][id]||0)>=val)return false;C.dex[k][id]=val;return true}
/* 속성 마법 도감: 속성을 얻거나 프리즘으로 바꾸면 기록한다(쓰지 않아도). */
function dexSkAttr(a){const k=typeof SK!=="undefined"&&SK[a];return !!(k&&dexAdd("sk",k.id))}
function dexSkOwn(){if(!C)return;(C.a||[]).forEach(a=>dexSkAttr(a))}
const dexHas=(c,k,id)=>k==="wp"?(c.wps||[]).includes(Number(String(id).slice(1))):!!(c.dex&&c.dex[k]&&c.dex[k][id]);
const DEX_ITEMS={};
function dexItems(k){if(DEX_ITEMS[k])return DEX_ITEMS[k];const d=DEX.find(x=>x.k===k);return DEX_ITEMS[k]=d?d.items():[]}
const dexN=(c,k)=>dexItems(k).filter(it=>dexHas(c,k,it.id)).length;
const dexTot=k=>dexItems(k).length;
const dexClaimable=d=>{const n=dexN(C,d.k),t=dexTot(d.k),r=(C.dex&&C.dex.rw)||{};return[["h",Math.ceil(t/2)],["f",t]].filter(([k,need])=>!r[d.k+k]&&n>=need)};
let recTab="dex",dexCat="ev",dexBusy=false;
function setRec(t){recTab=t;$("#dex-box").hidden=t!=="dex";$("#ttl-box").hidden=t!=="ttl";document.querySelectorAll("#rec-t button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.r===t?"true":"false"))}
function openRec(){if(recTab==="ttl")titles();else dex()}

/* 도감 기록은 탭을 열 때 서버에서 한 번만 받는다. 분류를 누르거나 보상을 받는 동안에는 다시 묻지 않는다. */
async function readDex(){if(!C||!AUTH.uid||LOCAL||!DB||dexBusy)return;dexBusy=true;let redraw=false;try{
 if(savePending&&typeof saveCloud==="function"){try{await saveCloud(true)}catch(e){}}if(savePending)return;
 const stamp=JSON.stringify(C.dex||null);let d=null;try{const s=await DB.doc("accounts/"+UID+"/c/dex").get();d=s.exists?s.data():null}catch(e){return}
 if(savePending||JSON.stringify(C.dex||null)!==stamp||!d||typeof d!=="object")return;
 if(JSON.stringify(d)===stamp)return;C.dex=d;redraw=true;
 if(typeof accBase!=="undefined"&&accBase){try{accBase.dex=JSON.parse(JSON.stringify(d))}catch(e){}}}
 finally{dexBusy=false}if(redraw&&!$("#v-titles").hidden&&recTab==="dex")dex(undefined,1)}
function dex(msg,again){const fresh=!again&&($("#v-titles").hidden||recTab!=="dex");show("titles");setRec("dex");titleState();C.dex=C.dex||{};C.dex.rw=C.dex.rw||{};ITM.forEach(x=>{if(((C.inv||{})[x[0]]||0)>0)dexAdd("it",x[0])});dexSkOwn();
 let got=0,all=0;DEX.forEach(d=>{got+=dexN(C,d.k);all+=dexTot(d.k)});
 const sm=$("#dex-sum");sm.innerHTML="";const bar=elT("div","bar"),fi=elT("i");fi.style.width=(got/all*100)+"%";bar.appendChild(fi);
 sm.append(elT("h2","","마법소녀 도감"), elT("p","hint","출정, 보스, 상점, 마법에서 만난 것들이 기록된다. 분류마다 절반과 전부를 모으면 보상을 받는다."),bar,elT("p","hint","전체 수집률 " + Math.floor(got/all*100)+"% ("+got+" / "+all+")"));
 const cs=$("#dex-cats");cs.innerHTML="";DEX.forEach(d=>{const b=elT("button","chip",d.nm+" "+dexN(C,d.k)+"/"+dexTot(d.k)+(dexClaimable(d).length?" ●":""));b.type="button";b.setAttribute("aria-pressed",dexCat===d.k?"true":"false");b.onclick=()=>{dexCat=d.k;dex()};cs.appendChild(b)});
 const pb=elT("button","chip","사역마 "+petDexN()+"/"+petDexTot());pb.type="button";pb.setAttribute("aria-pressed",dexCat==="pt"?"true":"false");pb.onclick=()=>{dexCat="pt";dex()};cs.appendChild(pb);
 const hd=$("#dex-cat");hd.innerHTML="";const l=$("#dex-list");l.innerHTML="";hideDexMat();const m=$("#dex-msg");m.style.color="var(--mu)";
 if(dexCat==="pt"){drawPetDex(l);m.textContent=msg||"더 많은 사역마를 만나 기록을 이어나가자.";if(fresh)readDex();return}
 const d=DEX.find(x=>x.k===dexCat),n=dexN(C,d.k),t=dexTot(d.k);
 const rw=(lab,need,key,r)=>{const done=C.dex.rw[d.k+key],ok=n>=need,b=elT("button",done?"chip":"btn"+(ok?"":" g"),done?lab+" 받음":lab+" ("+need+"개) · "+rwTxt(r));b.type="button";b.disabled=!!done||!ok;b.style.cssText="width:auto;margin:0;padding:9px 12px;font-size:.88rem";
  b.onclick=()=>{if(C.dex.rw[d.k+key]||dexN(C,d.k)<need)return;C.dex.rw[d.k+key]=1;giveRw(r);note("dex","도감 "+d.nm+" "+lab+": "+rwTxt(r));save();checkTitles();dex(d.nm+" "+lab+"을 받았다: "+rwTxt(r))};return b};
 const row=elT("div","row");row.style.marginBottom="10px";row.append(rw("절반 보상",Math.ceil(t/2),"h",d.half),rw("완성 보상",t,"f",d.full));hd.appendChild(row);
 dexItems(d.k).forEach(it=>{const has=dexHas(C,d.k,it.id),c=elT("div","chip sq dex-it"+(has?"":" lock"));
  const star=(d.k==="bs"&&C.dex.bs&&C.dex.bs[it.id]>=2)||(d.k==="wp"&&has&&wlv(Number(it.id.slice(1)))>=5)?" ★":"";
  if(d.k==="it"){const ic=itIc(it.id,"lg");if(ic)c.appendChild(ic)}c.append(elT("small","dex-tag",it.tag),elT("b","",has?it.nm+star:"???"),elT("small","",has?it.ds:it.hint));l.appendChild(c)});
 if(d.k==="it")drawDexMat();
 m.textContent=msg||(d.k==="bs"?"★는 처치까지 함께한 보스다.":d.k==="wp"?"★는 +5까지 강화한 무기다.":d.k==="ev"?"마을 전용 이벤트는 그 마을 출신과 함께 출정해야 만날 수 있다.":"");if(fresh)readDex()}

/* 사역마 도감. 알에서 깨어난 종만 이름·설명·성능을 적는다. 기간 한정은 칸 모양이 다르다. */
function petMet(sp){if(!C||!sp)return false;if(C.petSeen&&C.petSeen[sp])return true;return Array.isArray(C.pets)&&C.pets.some(q=>q&&q.sp===sp)}
function petDexCard(P){const lim=P[3]===4,got=petMet(P[0]),c=elT("div","chip sq dex-it pet-dex-it"+(lim?" lim":"")+(got?"":" lock"));
 c.appendChild(elT("span","pet-ic",got?P[2]:(lim?"❄️":"❔")));
 c.appendChild(elT("small","dex-tag",got?(lim?"기간 한정":(PET_RARE[P[3]]||"")):(lim?"기간 한정":"사역마")));
 c.appendChild(elT("b",got?"pet-r"+P[3]:"",got?P[1]:"???"));
 c.appendChild(elT("small","",got?P[4]:(lim?"우연이 닿아야만 만날 수 있는 이들이 있다.":"아직 만나지 못한 사역마이다.")));
 if(got)c.appendChild(elT("small","pet-dex-fx",""+P[5](1)));
 return c}
function petDexAll(){return typeof PETS==="undefined"?[]:Object.values(PETS)}
function petDexN(){return petDexAll().filter(x=>petMet(x[0])).length}
function petDexTot(){return petDexAll().length}
function drawPetDex(l){if(!l)return;petDexAll().filter(x=>x[3]!==4).forEach(p=>l.appendChild(petDexCard(p)));petDexAll().filter(x=>x[3]===4).forEach(p=>l.appendChild(petDexCard(p)))}

/* 기록 > 도감 > 아이템 칸 아래의 재료 목록. 화면은 html/record/titles.html 의 #dex-mat.
   서버나 가방(C.inv)을 보지 않는다. 얻었는지와 관계없이 아래 표만 읽어 전부 펼친다.
   카드의 이름·설명은 data/craft.js MAT 의 둘째·넷째 칸이고, 그림은 data/game.js ITEM_IMG 가 있으면 itIc 가 붙인다.
   얻는 곳 목록은 matLines 가 만든다. 사역마가 재료를 더 주는 효과(data/pets.js 의 북극광 순록, js/pet/effect.js 의 lhmat)는 여기 적지 않는다. */
/* 개수와 확률. 확률 1은 확정이라 퍼센트를 붙이지 않는다. */
const matBit=(n,p)=>n+"개"+(Number(p)>=1?"":" ("+Math.round(Number(p)*100)+"%)");
/* data/craft.js MAT_WHERE 의 표시 이름. 표 키가 없으면 키를 그대로 쓴다.
   data/clue/hunt.js CLUE_DROP 이 그 표를 단서 탐색에 쓰면, 같은 줄 뒤에 탐색 성공·실패를 붙인다. */
function matPlace(k){const base=(typeof MAT_WHERE!=="undefined"&&MAT_WHERE[k])||k,more=[];
 if(typeof CLUE_DROP!=="undefined"){if(CLUE_DROP.ok===k)more.push("단서 탐색 성공, 시간마다");if(CLUE_DROP.fail===k)more.push("단서 탐색 실패")}
 return more.length?base+" · "+more.join(" · "):base}
/* 제작에 넣는 것의 이름. 재료는 data/craft.js MATM, 아이템은 data/game.js ITM. */
function matNm(id){const m=typeof MATM!=="undefined"&&MATM[id];if(m)return m[1];const x=typeof ITM!=="undefined"&&ITM.find(t=>t[0]===id);return x?x[1]:id}
/* 재료 한 개의 얻는 곳. 순서대로 이어 붙이고, 하나도 없으면 MAT 다섯째 칸을 그대로 적는다.
   1. MAT_DROP: 출정·장기 토벌·보스 레이드에서 굴리는 표. 줄은 [재료 id, 개수, 확률]. 표시 이름은 matPlace.
   2. MAT_VIL: 그 마을 출신이면 이 재료가 나올 때 1개 더. 마을 이름은 data/game.js VL.
   3. RCP: 만드는 결과(둘째 칸)가 이 재료인 제작법. 필요한 마을 공방 단계·골드·개수도 여기 있다.
   4. EBOSS.drop (data/event-boss/boss.js): 이벤트 보스 토벌 보상. [재료 id, 개수].
   5. MAT_CROWN_P: 검은 왕관의 조각만. 절망의 마인을 공격할 때의 확률. 실제 지급은 js/corruption.js.
   6. CLP.ms (data/clue/piece.js): 단서 조각 단계 보상의 mat {재료 id: 개수}. */
function matLines(id){const lines=[];
 if(typeof MAT_DROP==="object")Object.keys(MAT_DROP).forEach(k=>{const rows=(MAT_DROP[k]||[]).filter(r=>r[0]===id);if(rows.length)lines.push(matPlace(k)+": "+rows.map(r=>matBit(r[1],r[2])).join(", "))});
 if(typeof MAT_VIL==="object")Object.keys(MAT_VIL).forEach(v=>{if(MAT_VIL[v]===id)lines.push((VL[v]?VL[v].n:v)+": 이 재료가 나오면 1개 더")});
 if(typeof RCP!=="undefined")RCP.filter(r=>r[1]===id).forEach(r=>{const need=Object.keys(r[3]).map(k=>matNm(k)+" "+r[3][k]).join(", "),g=r[4]?", 골드 "+r[4]:"";
  lines.push("공방 제작"+(r[5]?" (마을 공방 "+r[5]+"단계)":"")+": "+need+g+" → "+r[2]+"개")});
 if(typeof EBOSS!=="undefined"&&EBOSS.drop)EBOSS.drop.filter(x=>x[0]===id).forEach(x=>lines.push((EBOSS.nm||"이벤트 보스")+" 토벌 보상: "+x[1]+"개"));
 if(id==="m_crown"&&typeof MAT_CROWN_P==="number")lines.push("절망의 마인 공격: "+matBit(1,MAT_CROWN_P));
 if(typeof CLP!=="undefined"&&CLP.ms)CLP.ms.forEach(s=>{const n=s[1]&&s[1].mat&&s[1].mat[id];if(n)lines.push((CLP.nm||"단서 조각")+" 「"+s[2]+"」 보상: "+n+"개")});
 if(!lines.length&&MATM[id]&&MATM[id][4])lines.push(MATM[id][4]);
 return lines}
/* 아이템이 아닌 분류를 열면 재료 칸을 비우고 숨긴다. */
function hideDexMat(){const box=$("#dex-mat");if(!box)return;box.hidden=true;box.innerHTML=""}
/* MAT 순서대로 카드를 그린다. 분류 버튼이 이미 여섯 개라 재료는 별도 탭이 아니라 아이템 칸 아래에만 둔다. */
function drawDexMat(){const box=$("#dex-mat");if(!box||typeof MAT==="undefined")return;box.hidden=false;box.innerHTML="";
 const rule=document.createElement("hr");rule.className="dex-rule";
 box.append(rule,elT("h2","","재료"));
 MAT.forEach(m=>{const c=elT("div","card mat-card"),hd=elT("div","mat-hd"),ic=typeof itIc==="function"?itIc(m[0],"lg"):null,tx=elT("div","");
  if(ic)hd.appendChild(ic);tx.append(elT("b","",m[1]),elT("p","hint",m[3]));hd.appendChild(tx);c.appendChild(hd);
  const ul=elT("ul","mat-src");matLines(m[0]).forEach(t=>ul.appendChild(elT("li","",t)));c.appendChild(ul);box.appendChild(c)})}
$("#rec-t").onclick = e => {
   const t = e.target.dataset && e.target.dataset.r;
   if(t === "dex") dex(); else if (t==="ttl") titles()
   };
