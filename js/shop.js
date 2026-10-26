/* 상점. main.js 다음에 불러야 한다. 구매 수량과 아이템 구매.
   가격은 js/common/formula.js 의 pr 을, 무기 칸은 shopWeapons 를 그대로 부른다. */
let shopQ=1;
function itemMax(id){C.inv=C.inv||{};if(id==="charm")return Math.max(0,CHARM_MAX-charmToday());if(id==="candle")return (C.inv.candle||0)>=1?0:1;return 99}
function shop(msg){C.wps=C.wps||[];const again=!$("#v-shop").hidden,y=window.scrollY;show("shop");if(again)window.scrollTo(0,y);
 $("#sg").textContent="보유 골드 "+(C.gd||0)+". 골드는 토벌과 시련에서 얻는다."+(C.v==="A"?" A마을 주민은 10% 할인을 받는다.":"");
 const sm=$("#sm");sm.style.color="var(--mu)";sm.textContent=msg||"";if(msg&&again)toast(msg);
 shopWeapons();
 // 구매 수량 고르기
 const qb=$("#shopq");qb.innerHTML="";const qlab=elT("span","shopq-l","구매 수량");qb.appendChild(qlab);
 const set=n=>{shopQ=Math.max(1,Math.min(99,n|0||1));shop()};
 const mkB=(t,f,lab)=>{const b=elT("button","chip",t);b.type="button";if(lab)b.setAttribute("aria-label",lab);b.onclick=f;return b};
 const inp=elT("input");inp.type="number";inp.min="1";inp.max="99";inp.value=shopQ;inp.id="shopqn";inp.setAttribute("aria-label","구매 수량");inp.onchange=()=>set(Number(inp.value));
 qb.append(mkB("−",()=>set(shopQ-1),"하나 줄이기"),inp,mkB("+",()=>set(shopQ+1),"하나 늘리기"));[1,5,10].forEach(n=>{const b=mkB(n+"개",()=>set(n));b.setAttribute("aria-pressed",shopQ===n?"true":"false");qb.appendChild(b)});
 const il=$("#il");il.innerHTML="";C.inv=C.inv||{};ITM.forEach(x=>{const id=x[0],pc=pr(x[3]),b=document.createElement("button");b.type="button";b.className="chip sq";
  const mx=itemMax(id),n=Math.min(shopQ,mx),cost=pc*n,lim=id==="charm",ct2=lim?charmToday():0;
  const cnt="보유 "+(C.inv[id]||0)+(lim?" · 오늘 "+ct2+"/"+CHARM_MAX:"")+(id==="candle"?" · 최대 1개":"");
  const st=mx<=0?(id==="candle"?"이미 가지고 있다":"오늘은 품절"):n>1?pc+"골드 × "+n+" = "+cost+"골드":pc+"골드"+(shopQ>1&&n<shopQ?" (1개만 살 수 있다)":"");
  b.innerHTML="<b></b><small class='item-feature'></small><small></small><small></small>";const bs=b.querySelectorAll("small");b.querySelector("b").textContent=x[1];bs[0].textContent=x[2];bs[1].textContent=st;bs[2].textContent=cnt;
  b.title=x[2];b.setAttribute("aria-label",x[1]+", "+st+", "+cnt+". "+x[2]);b.disabled=mx<=0||(C.gd||0)<cost;
  b.onclick=()=>{const k=Math.min(shopQ,itemMax(id)),c=pc*k;if(k<=0||(C.gd||0)<c)return;if(lim)C.daily={d:today(),charm:charmToday()+k};
   C.gd-=c;C.inv[id]=(C.inv[id]||0)+k;dexAdd("it",id);titleState();C.stats.purchases=(C.stats.purchases||0)+k;C.stats.maxGold=Math.max(C.stats.maxGold||0,C.gd||0);save();checkTitles();
   shop(x[1]+(k>1?" "+k+"개를":"을(를)")+" 샀다. ("+c+"골드)")};il.appendChild(b)})}
