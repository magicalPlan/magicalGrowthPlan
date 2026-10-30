/* 여러 화면이 함께 쓰는 기본 도구. data/game.js 다음, main.js 보다 먼저 불러야 한다. */
const $=s=>document.querySelector(s);
// 0 이상 n 미만의 정수 하나. 배열에서 하나를 고를 때 쓴다.
const R=n=>Math.floor(Math.random()*n);
// 요소를 만들어 클래스와 글자를 한 번에 넣는다. cls 나 txt 를 비우면 그 항목은 건너뛴다.
const elT=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e};
// 아이템 도트 그림. 그림이 없는 아이템이면 null. cls: "lg"(카드 위 큰 그림) · "sm"(글 앞 작은 그림). 목록은 data/game.js 의 ITEM_IMG.
const itIc=(id,cls)=>{if(typeof ITEM_IMG==="undefined"||!ITEM_IMG[id])return null;const i=document.createElement("img");i.src="assets/items/"+id+".png?v="+ITEM_IMG_V;i.alt="";i.width=32;i.height=32;i.decoding="async";i.className="it-ic"+(cls?" "+cls:"");return i};
// 채팅·게시글에 넣을 글에서 HTML 로 읽힐 문자를 글자 그대로 보이게 바꾼다.
const esc=t=>t.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
// 최근 참여 기록은 최대 6개만 남긴다. 새 id 를 넣고, 더 오래된 키부터 지운다.
const keepIds=(o,id)=>{o=o||{};o[id]=true;const ks=Object.keys(o);ks.slice(0,Math.max(0,ks.length-6)).forEach(x=>delete o[x]);return o};
// 서버 조회를 한 번만 받고 구독을 끊는다. 실시간으로 계속 지켜보는 곳이 아닌 곳에서 쓴다.
// grab 이 있으면 그 한 번만 받는다. 주기 조회가 쓰는 ETag 확인으로 들어가지 않는다.
const once=q=>new Promise((ok,no)=>{if(q&&typeof q.grab==="function"){q.grab().then(ok,no);return}let un=null,done=false;un=q.onSnapshot(s=>{if(done)return;done=true;un&&un();ok(s)},e=>{if(done)return;done=true;un&&un();no(e)})});
// 진짜 서버에 로그인된 상태. 이 브라우저 안에서만 도는 연습 저장소는 제외한다.
const XON=()=>!!DB&&!LOCAL&&!!FBU;
// 서버에 올릴 이름. 운영자 왕관 문자는 빼고 20자까지만 남긴다.
const nmOf=()=>String(C.n).replace(/👑/g,"").slice(0,20);
// 화면에 보일 이름. 운영자 계정이면 앞에 왕관을 붙이고, 이름 안에 섞인 왕관 문자는 뺀다.
const cn=(u,n)=>(ADM[u]?"👑 ":"")+String(n==null?"":n).replace(/👑/g,"");
// 보상 객체 {g:골드, m:마력석} 을 "골드 10, 마력석 1" 같은 문장으로 만든다. 없는 항목은 뺀다.
const rwTxt=r=>[r.g?"골드 "+r.g:"",r.m?"마력석 "+r.m:""].filter(Boolean).join(", ");
// 골드와 마력석 보상을 캐릭터에게 더한다. 경험치와 절망도는 gain 이 다룬다.
function giveRw(r){C.gd=(C.gd||0)+(r.g||0);if(r.m){C.inv=C.inv||{};C.inv.mana=(C.inv.mana||0)+r.m}titleState();C.stats.maxGold=Math.max(C.stats.maxGold||0,C.gd)}
