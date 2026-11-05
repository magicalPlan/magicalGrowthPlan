/* 성장 기록. 사역마.
   화면은 html/growth/growth.html, 탭은 html/home/main.html.
   사역마 목록은 js/pet/care.js 의 drawPets 를 그대로 부른다.
   운명의 재계약은 js/pact/pact.js · html/pact/pact.html.
   마력 각인 그리기(drawRunes)는 남겨 두었으나 성장 화면에는 사역마만 둔다. */
function growth(msg){show("growth");
 if(typeof drawPets==="function")drawPets();
 const m=$("#grm");if(m){m.style.color="var(--mu)";m.textContent=msg||""}}
function drawRunes(){const box=$("#bgr");if(!box||!C)return;box.innerHTML="";const have=(C.inv||{}).mana||0;
 $("#rnh").textContent="마력석을 바쳐 몸에 각인을 새긴다. 실패하지 않고, 한 번 새긴 각인은 영원히 남는다. 가진 마력석 "+have+"개.";
 RN.forEach(([k,nm,ic,ef])=>{const L=rnLv(k),mx=L>=RN_MAX,cost=rnCost(L),w=document.createElement("div");w.style.cssText="display:flex;gap:8px";
  const i=elT("div","chip it-row rn-row"+(L?"":" rn-off"));i.style.cssText="flex:1;text-align:left;cursor:default";const tx=elT("div");tx.style.minWidth="0";tx.append(elT("b","",nm+" "+L+" / "+RN_MAX),elT("small","",(L?"지금: "+ef(L):"아직 새기지 않았다")+(mx?" (최고 단계)":" → 다음: "+ef(L+1))));
  const im=document.createElement("img");im.src="assets/runes/"+k+(k==="luck"?".svg":".png")+"?v="+RN_IMG_V;im.alt="";im.width=32;im.height=32;im.decoding="async";im.className="it-ic";im.onerror=()=>im.replaceWith(elT("span","rn-ic",ic));i.append(im,tx);
  i.querySelector("small").style.cssText="display:block;color:var(--mu);font-weight:400";
  const b=elT("button","chip",mx?"완성":"새기기 (마력석 "+cost+"개)");b.type="button";b.disabled=mx||have<cost;b.onclick=()=>rnUp(k);w.append(i,b);box.appendChild(w)})}
function rnUp(k){const r=RN.find(x=>x[0]===k),L=rnLv(k),cost=rnCost(L);if(!r||L>=RN_MAX||((C.inv||{}).mana||0)<cost)return;
 C.inv.mana-=cost;C.rn=C.rn||{};C.rn[k]=L+1;titleState();C.stats.runes=(C.stats.runes||0)+1;save();regPlayer();checkTitles();
 note("quest",r[1]+"을 "+(L+1)+"단계로 새겼다. ("+r[3](L+1)+")");growth("마력석 "+cost+"개가 녹아들며 "+r[2]+" "+r[1]+"이 "+(L+1)+"단계가 되었다. "+r[3](L+1)+".")}
function rtReq(){const cdl=Math.max(0,RT_CD-(Date.now()-(C.rtT||0))),mana=(C.inv||{}).mana||0;
 const sw=(C.stats&&C.stats.soloWins)||0,L=[[sw>=RT_SOLO,"고독한 출정 성공 "+RT_SOLO+"회 이상 (지금 "+sw+"회) · 혼자 나선 길에서 자신과 마주해야 한다"],[(C.cl||0)>=RT_CL,"토벌 성공 "+RT_CL+"회 이상 (지금 "+(C.cl||0)+"회)"],[mana>=RT_MANA,"마력석 "+RT_MANA+"개 (가진 것 "+mana+")"],[(C.gd||0)>=RT_GOLD,"골드 "+RT_GOLD+" (가진 것 "+(C.gd||0)+")"],
  [(C.dz||0)<=RT_DZMAX&&!C.fall,"절망도 "+RT_DZMAX+" 이하 (지금 "+(C.dz||0)+")"+(C.fall?" · 타락 중에는 불가":"")],[cdl<=0,cdl>0?"다음 재계약까지 "+(cdl>=86400000?Math.floor(cdl/86400000)+"일 "+Math.floor(cdl%86400000/3600000)+"시간":cdTxt(cdl)):"지난 재계약에서 7일 경과"]];return{L,ok:L.every(x=>x[0])}}
function drawRetrait(){const box=$("#bgrt");if(!box||!C)return;box.innerHTML="";const r=rtReq(),c=elT("div","card rt-card");
 c.append(elT("p","hint","계약의 원천 앞에서 계약을 처음부터 다시 맺는다. 지금 특성 「"+C.t+"」은(는) 사라지고, 다른 특성 하나가 무작위로 새겨진다. 좋은 특성이 나온다는 보장은 없고, 되돌릴 수 없다. 의식이 끝나면 절망도가 "+RT_DZ+" 오른다."));
 const ul=elT("ul","pm-req");r.L.forEach(([ok,t])=>ul.appendChild(elT("li",ok?"ok":"",(ok?"✓ ":"· ")+t)));c.appendChild(ul);
 const b=elT("button","btn"+(r.ok?"":" g"),r.ok?"운명의 재계약을 맺는다":"조건을 모두 채워야 한다");b.type="button";b.disabled=!r.ok;b.onclick=retrait;c.appendChild(b);box.appendChild(c)}
function retrait(){const r=rtReq();if(!r.ok)return;
 if(!confirm("정말 운명의 재계약을 맺을까?\n\n· 지금 특성 「"+C.t+"」은(는) 사라진다\n· 새 특성은 무작위다 (좋지 않은 특성이 나올 수도 있다)\n· 되돌릴 수 없다\n· 마력석 "+RT_MANA+"개, 골드 "+RT_GOLD+"를 쓰고 절망도가 "+RT_DZ+" 오른다"))return;
 const old=C.t,pool=TR.filter(t=>t!==old),nt=pool[Math.floor(Math.random()*pool.length)];
 C.inv.mana-=RT_MANA;C.gd-=RT_GOLD;C.t=nt;C.rtT=Date.now();titleState();C.stats.traitChanges=(C.stats.traitChanges||0)+1;
 note("quest","운명의 재계약: 특성이 「"+old+"」에서 「"+nt+"」(으)로 바뀌었다.");gain(0,RT_DZ);save();regPlayer();checkTitles();
 alertBox("✦ 운명의 재계약","계약의 원천이 빛을 삼키고, 오래된 계약의 문양이 부서졌다.\n그리고 새로운 문양이 살갗 위로 떠올랐다.\n\n「"+old+"」 → 「"+nt+"」\n"+(TD[nt]||"")+"\n\n대가로 절망도가 "+RT_DZ+" 올랐다.");if(typeof pact==="function")pact();else growth()}
