/* 무기. 가방의 무기 칸과 상점의 무기 칸.
   main.js 다음에 불러야 한다. 강화 단계와 장착, 성공 확률은 js/common/formula.js 의 wlv, eq, wup, upr 을 그대로 부른다. */
function bagWeapons(rowEl){const wp=$("#bgw");wp.innerHTML="";
 if(!C.wps.length)wp.innerHTML="<p class='hint'>가진 무기가 없다. 상점에서 살 수 있다.</p>";
 C.wps.forEach(i=>{const L=wlv(i),cost=L+1,mx=L>=5,have=C.inv.mana||0,on=C.wp===i;
  wp.appendChild(rowEl(WP[i][0]+(L?" +"+L:""),"전투력 +"+(WP[i][3]+wup(i))+(mx?" (최대 강화)":" · 다음 강화 성공 확률 "+upr(L)+"%"+(armed("whet")?", 실패해도 숫돌이 마력석을 지켜 준다":"")),[
   [on?"장착 중":"장착",()=>{C.wp=on?-1:i;save();bag(on?WP[i][0]+"을(를) 해제했다.":WP[i][0]+"을(를) 장착했다.")}],
   [mx?"최대":"강화 "+upr(L)+"% (마력석 "+cost+"개)",()=>{if(mx||(C.inv.mana||0)<cost)return;C.inv.mana-=cost;titleState();
    if(Math.random()*100<upr(L)){C.wl["w"+i]=L+1;C.stats.upgrades=(C.stats.upgrades||0)+1;save();checkTitles();bag("강화 성공! "+WP[i][0]+"이(가) +"+(L+1)+"이 되었다.")}
    // 실패해도 단계는 떨어지지 않는다. 보호의 숫돌을 준비해 두면 숫돌이 대신 깨지고 마력석은 돌려받는다.
    else{C.stats.upgradeFails=(C.stats.upgradeFails||0)+1;let t;
     if(useItem("whet")){C.inv.mana=(C.inv.mana||0)+cost;t="보호의 숫돌이 대신 깨지면서 마력석 "+cost+"개를 지켜 냈다.";
      // 남은 숫돌이 있으면 다음 강화를 위해 자동으로 다시 준비한다.
      const rest=C.inv.whet||0;if(rest>0){C.arm.whet=true;t+=" 남은 숫돌 "+rest+"개 중 하나를 다시 준비했다."}}
     else t="마력석 "+cost+"개가 사라졌다.";
     save();bag("강화 실패. "+WP[i][0]+"은(는) +"+L+" 그대로다. "+t);$("#bgm").style.color="var(--bad)"}},mx||have<cost]]))})}

function shopWeapons(){const w=$("#wl");w.innerHTML="";C.wps=C.wps||[];WP.forEach((it,i)=>{const own=C.wps.includes(i),on=C.wp===i,pc=pr(it[2]),st=on?"장착 중":own?"장착하기":pc+"골드";const b=document.createElement("button");b.type="button";b.className="chip sq";
  b.innerHTML="<b></b><small class='item-feature'></small><small></small>";b.querySelector("b").textContent=it[0]+(wlv(i)?" +"+wlv(i):"");b.querySelector(".item-feature").textContent=it[1]+" 전투력 +"+it[3]+".";b.querySelectorAll("small")[1].textContent=st;
  b.title=it[1]+" 전투력 +"+it[3];b.setAttribute("aria-label",it[0]+", "+st+". 전투력 +"+it[3]);
  b.disabled=!own&&(C.gd||0)<pc;b.setAttribute("aria-pressed",on?"true":"false");
  b.onclick=()=>{if(on){C.wp=-1;shopWrite({wp:-1});shop(it[0]+"을(를) 해제했다.");return}const fields={wp:i};if(!own){if((C.gd||0)<pc)return;C.gd-=pc;C.wps.push(i);titleState();C.stats.purchases=(C.stats.purchases||0)+1;fields.gd=C.gd;fields.wps=C.wps;fields["stats/purchases"]=C.stats.purchases}C.wp=i;shopWrite(fields);checkTitles();shop(it[0]+"을(를) 장착했다.")};w.appendChild(b)})}
