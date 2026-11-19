/* 특별 의뢰(미니게임 목록·진입).
   화면: html/act/special.html (#v-special) · 본문 자리 html/act/mini.html (#v-mini)
   목록: data/act/special-list.js (SPECIAL_GAMES).
   상위 메뉴: 실전(html/home/main.html) — 장기 의뢰와 대련 사이.
   주소: #/special(목록) · #/{path}(미니, SPECIAL_GAMES.path). 뒤로가기=history.back.

   ── 목록·진입 전 불필요 통신 금지 (이 파일 규칙) ─────────────────
   · 목록을 그릴 때 DB.doc / live / onSnapshot / poll / fetch(RTDB) 를 부르지 않는다.
   · special() · specialDraw() · specialPlay() 진입 직전·직후에 계정 저장(save)·친구·채팅·출정
     구독을 새로 열지 않는다. (show() 가 다른 화면 구독은 끄지만, 여기서 다시 켜지 말 것.)
   · 미니게임 정적 스크립트(src)는 「목록 클릭으로 mini 화면에 들어온 뒤」에만 불러도 된다.
     목록만 볼 때는 src 파일을 미리 받지 않는다.
   · 미니게임 안에서 RTDB·HTTP 가 필요하면, 게임 시작 버튼 등 명시적 조작 이후에만 연다.
   · 허용: 로컬 DOM 그리기, localStorage(접기 기억 등 UI만), show() 화면 전환,
     location.hash / history.pushState·replaceState·back (라우팅만; RTDB 아님).
   ─────────────────────────────────────────────────────────────── */
let spCur=null;
let spRouteSkip=false;

function spGames(){
 return typeof SPECIAL_GAMES!=="undefined"&&Array.isArray(SPECIAL_GAMES)?SPECIAL_GAMES:[]
}
function spGame(id){
 return spGames().find(g=>g&&g.id===id)||null
}
function spGameByPath(path){
 const p=String(path||"").replace(/^\/+/,"")
 return spGames().find(g=>g&&String(g.path||g.id)===p)||null
}
function spHashNow(){
 return String(location.hash||"").replace(/^#/,"")
}
function spPathOf(g){
 if(!g)return "#/special"
 const p=String(g.path||g.id||"").replace(/^\/+/,"")
 return p?("#/"+p):"#/special"
}
function spPush(hash){
 const h=hash.charAt(0)==="#"?hash:("#"+hash)
 if(location.hash===h)return
 spRouteSkip=true
 try{history.pushState({sp:1},"",h)}catch(e){location.hash=h}
 spRouteSkip=false
}
function spReplace(hash){
 const h=hash.charAt(0)==="#"?hash:("#"+hash)
 if(location.hash===h)return
 spRouteSkip=true
 try{history.replaceState({sp:1},"",h)}catch(e){location.hash=h}
 spRouteSkip=false
}
function specialDraw(){
 const box=$("#sp-list");if(!box)return
 box.innerHTML=""
 const list=spGames()
 if(!list.length){box.appendChild(elT("p","hint","등록된 특별 의뢰가 없다."));return}
 list.forEach(g=>{
  if(!g||!g.id)return
  const row=elT("button","sp-item");row.type="button"
  const nm=String(g.nm||g.id),src=String(g.src||"")
  row.appendChild(elT("b","sp-item-nm",nm))
  if(src)row.appendChild(elT("small","sp-item-src",src))
  if(g.path)row.appendChild(elT("small","sp-item-path","#/"+String(g.path).replace(/^\/+/,"")))
  if(g.ds)row.appendChild(elT("small","sp-item-ds",String(g.ds)))
  row.onclick=()=>specialPlay(g.id,true)
  box.appendChild(row)
 })
}
/* 목록만. 네트워크·RTDB 없음 — 위 금지 규칙. */
function special(opts){
 if(typeof includeHeal==="function"&&!$("#sp-list")){includeHeal();return}
 const push=!(opts&&opts.noPush)
 show("special")
 specialDraw()
 const m=$("#sp-msg");if(m)m.textContent=""
 if(push)spPush("#/special")
 else if(spHashNow()!=="/special")spReplace("#/special")
}
/* 미니게임 화면. push=true 이면 #/{path} 를 history 에 쌓음.
   RTDB 를 열지 않는다. 게임 본문이 필요하면 mini-root 에만 붙인다. */
function specialPlay(id,push){
 const g=spGame(id)
 if(!g){toast("그 특별 의뢰를 찾지 못했다.");return}
 const same=spCur&&spCur.id===g.id&&typeof curView!=="undefined"&&curView==="mini"
 spCur=g
 if(typeof includeHeal==="function"&&!$("#mini-root")){includeHeal();return}
 show("mini")
 if(push)spPush(spPathOf(g))
 else if(spHashNow()!==("/"+String(g.path||g.id).replace(/^\/+/,"")))spReplace(spPathOf(g))
 const t=$("#mini-title"),s=$("#mini-src"),d=$("#mini-ds"),root=$("#mini-root"),msg=$("#mini-msg")
 if(t)t.textContent=g.nm||g.id
 if(s)s.textContent=g.src?("소스: "+g.src):""
 if(d)d.textContent=g.ds||""
 if(msg)msg.textContent=""
 if(root&&!same){
  root.innerHTML=""
  spMiniLoad(g,root)
 }
}
/* 미니게임 스크립트(g.src)는 mini 화면에 들어온 뒤 한 번만 불러온다(정적 파일, RTDB 아님).
   스크립트는 SP_MINI[g.id] = {mount(root,g), stop()} 를 등록한다. 없으면 자리 안내만 보인다. */
const spMiniJs={}
function spMiniLoad(g,root){
 const go=()=>{
  if(!root.isConnected||!spCur||spCur.id!==g.id)return
  const m=typeof SP_MINI!=="undefined"&&SP_MINI[g.id]
  if(m&&typeof m.mount==="function"){try{m.mount(root,g)}catch(e){root.innerHTML="";root.appendChild(elT("p","hint","미니게임을 열지 못했다."))}return}
  root.innerHTML=""
  root.appendChild(elT("p","hint","미니게임 본문 자리. 실제 로직은 "+(g.src||"src")+" 에 두고 SP_MINI[\""+g.id+"\"] 를 등록하면 된다."))
 }
 if(!g.src||(typeof SP_MINI!=="undefined"&&SP_MINI[g.id])){go();return}
 root.appendChild(elT("p","hint","불러오는 중…"))
 if(!spMiniJs[g.src])spMiniJs[g.src]=new Promise((ok,no)=>{const s=document.createElement("script");s.src=g.src+(typeof APP_VER!=="undefined"?"?v="+APP_VER:"");s.onload=ok;s.onerror=no;document.head.appendChild(s)})
 spMiniJs[g.src].then(go).catch(()=>{delete spMiniJs[g.src];if(root.isConnected){root.innerHTML="";root.appendChild(elT("p","hint","미니게임 파일을 불러오지 못했다. 새로고침 후 다시 열어 주세요."))}})
}
/* 뒤로가기 버튼 = 브라우저 history.back (스택과 맞춤). */
function specialBack(){
 if(history.length>1)history.back()
 else{spCur=null;special({noPush:true})}
}
function spRouteApply(){
 if(spRouteSkip)return
 const raw=spHashNow()
 const path=raw.charAt(0)==="/"?raw.slice(1):raw
 if(path==="special"){
  spCur=null
  if(typeof includeHeal==="function"&&!$("#sp-list")){includeHeal();return}
  show("special")
  specialDraw()
  const m=$("#sp-msg");if(m)m.textContent=""
  return
 }
 if(path){
  const g=spGameByPath(path)
  if(g){specialPlay(g.id,false);return}
 }
 if(typeof curView!=="undefined"&&(curView==="special"||curView==="mini")){
  spCur=null
 }
}
(()=>{
 const on=()=>spRouteApply()
 window.addEventListener("hashchange",on)
 window.addEventListener("popstate",on)
 const b=$("#mini-back")
 if(b&&!b._spBack){b._spBack=1;b.onclick=()=>specialBack()}
})();
