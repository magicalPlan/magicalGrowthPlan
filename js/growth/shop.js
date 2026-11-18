/* 무인 상점. 성장 기록 하위 탭.
   화면은 html/growth/shop.html (성장 화면 #gr-shop 에 한 번 붙인다).
   접기는 상점 무기·아이템(shopWpFold · shopItFold)과 같다.
   출정 mgr_gshop_raid / #gsrtog · #gsrbox → js/growth/raid.js 의 drawPex
   제작 mgr_gshop_craft / #gsctog · #gscbox
   강화 mgr_gshop_enhance / #gsetog · #gsebox */
function growthShopMount(){
 const host=$("#gr-shop"),inner=$("#gr-shop-inner");
 if(!host||!inner)return;
 if(inner.parentNode!==host)host.appendChild(inner);
 inner.hidden=false
}
function growthShopOpen(key){try{return localStorage.getItem(key)!=="0"}catch(e){return true}}
function growthShopFold(tog,box,key,open){
 const b=$(tog),el=$(box);if(!b||!el)return;
 el.hidden=!open;b.textContent=open?"접기 ▲":"펼치기 ▼";b.setAttribute("aria-expanded",open?"true":"false");
 try{localStorage.setItem(key,open?"1":"0")}catch(e){}
}
function growthShopBind(tog,box,key){
 const b=$(tog);if(!b||b._gshopFold)return;b._gshopFold=1;
 b.onclick=()=>growthShopFold(tog,box,key,!!($(box)&&$(box).hidden))
}
function drawGrowthShop(){
 growthShopMount();
 growthShopFold("#gsrtog","#gsrbox","mgr_gshop_raid",growthShopOpen("mgr_gshop_raid"));
 growthShopFold("#gsctog","#gscbox","mgr_gshop_craft",growthShopOpen("mgr_gshop_craft"));
 growthShopFold("#gsetog","#gsebox","mgr_gshop_enhance",growthShopOpen("mgr_gshop_enhance"));
 growthShopBind("#gsrtog","#gsrbox","mgr_gshop_raid");
 growthShopBind("#gsctog","#gscbox","mgr_gshop_craft");
 growthShopBind("#gsetog","#gsebox","mgr_gshop_enhance");
 if(typeof drawPex==="function"&&!$("#gsrbox").hidden)drawPex()
}
growthShopMount();
