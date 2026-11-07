/* 무기. 가방의 무기 칸과 상점의 무기 칸.
   main.js 다음에 불러야 한다. 강화 단계와 장착, 성공 확률은 js/common/formula.js 의 wlv, eq, wup, upr 을 그대로 부른다. */
/* 무기 목록 아래의 강화 설명. 칸은 html/bag/bag.html 의 #bgwh.
   화면에 적히는 숫자는 여기서 만든다. 설명을 고칠 때는 이 함수를 고친다.
   · 최대 단계와 기본 성공 확률: data/game.js 의 UPR. 앞칸부터 +0→+1, +1→+2 … 이고, 칸 수가 최대 단계다.
   · 마력석: 아래 강화 버튼의 cost 와 같다. 지금 단계 L 에서 다음은 L+1 개(+0 은 1개, 마지막 단계는 UPR 칸 수만큼).
   · 확률에 더해지는 값: js/common/formula.js 의 upr. 이 문장의 +5 와 +2 는 그 함수의 행운 특성, 마을 공방(시설 forge)과 같은 숫자다.
     마을 보너스는 data/game.js VL 의 up(지금 C마을 5). 사역마는 petEff("up"). 합은 100 을 넘기지 않는다.
   · 실패: 단계는 그대로이고 마력석만 사라진다. 보호의 숫돌(아이템 whet)을 준비해 두면 숫돌이 깨지고 마력석을 돌려받는다. 남은 숫돌은 다시 준비된다. 동작은 아래 강화 버튼.
   · 전투력: js/common/formula.js 의 wup. 칼(무기 0번)은 단계마다 2, 다른 무기는 단계마다 1. */
function bagUpHint(){const el=$("#bgwh");if(!el||typeof UPR==="undefined")return;const max=UPR.length,rates=UPR.map((p,i)=>"+"+i+"→+"+(i+1)+" "+p+"%").join(", ");
 const bonus=["행운 특성 +5%p","마을 공방 단계마다 +2%p"];
 if(typeof VL!=="undefined")Object.keys(VL).forEach(k=>{if(VL[k].up)bonus.push(VL[k].n+" +"+VL[k].up+"%p")});
 bonus.push("함께하는 사역마의 강화 보너스");
 el.innerHTML="";
 el.append(elT("p","","마력석으로 가진 무기를 강화한다. 최대는 +"+max+"이다."),
  elT("p","","강화 실패 시 마력석이 사라진다. 보호의 숫돌을 준비해 두면 실패할 때 숫돌이 대신 깨지고 마력석을 돌려받는다."),
)}
function bagWeapons(rowEl){const wp=$("#bgw");wp.innerHTML="";bagUpHint();
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

/* 상점 무기 칸(#wl). WP 전체를 chip 버튼으로 채운다(구매·장착·해제).
   가로 몇 칸인지는 CSS(#v-shop #wl)가 정한다 — 좁으면 1열, 넓으면 2열. 이 함수는 칸 수만 채운다. */
function shopWeapons(){const w=$("#wl");w.innerHTML="";C.wps=C.wps||[];WP.forEach((it,i)=>{const own=C.wps.includes(i),on=C.wp===i,pc=pr(it[2]),st=on?"장착 중":own?"장착하기":pc+"골드";const b=document.createElement("button");b.type="button";b.className="chip sq";
  b.innerHTML="<b></b><small class='item-feature'></small><small></small>";b.querySelector("b").textContent=it[0]+(wlv(i)?" +"+wlv(i):"");b.querySelector(".item-feature").textContent=it[1]+" 전투력 +"+it[3]+".";b.querySelectorAll("small")[1].textContent=st;
  b.title=it[1]+" 전투력 +"+it[3];b.setAttribute("aria-label",it[0]+", "+st+". 전투력 +"+it[3]);
  b.disabled=!own&&(C.gd||0)<pc;b.setAttribute("aria-pressed",on?"true":"false");
  b.onclick=()=>{if(on){C.wp=-1;shopWrite({wp:-1});shop(it[0]+"을(를) 해제했다.");return}const fields={wp:i};if(!own){if((C.gd||0)<pc)return;C.gd-=pc;C.wps.push(i);titleState();C.stats.purchases=(C.stats.purchases||0)+1;fields.gd=C.gd;fields.wps=C.wps;fields["stats/purchases"]=C.stats.purchases}C.wp=i;shopWrite(fields);checkTitles();shop(it[0]+"을(를) 장착했다.")};w.appendChild(b)})}
