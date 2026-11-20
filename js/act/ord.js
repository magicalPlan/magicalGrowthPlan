/* 장기 의뢰. 인수인계: data/event/HANDOFF.md
   main.js 다음. 화면 html/act/ord.html, 전환 show · navGroup.
   히어로·단서 안내: pack.js EVENT_ORD ← ordPaint(). 테마만 바꿀 때 ord.html 하드코딩 금지.
   CSS: #v-ord[data-event=EVENT.key] ← css/event/{key}.css.
   보스 js/event-boss/boss.js · 조각 piece.js · 탐색 clue.js.
   좁은 화면 탭 / 넓은 화면 그리드. 탭 기억 mgr_ordtab. 점 표시 ordMarks.

   인트로 재생(#ord-intro-play)
   · 데이터: EVENT_ORD.introShard = chapters/*.json 의 shard id (없으면 버튼 hidden).
   · 동작: 수상한 상인 shadyStoryPlay 와 같음 — storyLoad → vnOpen.
   · 새 이벤트: pack.js ord 에 introShard 만 넣으면 된다. HTML/JS 분기 추가 금지. */
function ordIntroFail(msg){
 if(typeof toast==="function")toast(msg||"이야기를 열지 못했다.");
 else{const m=$("#ebm");if(m){m.style.color="var(--bad)";m.textContent=msg||"이야기를 열지 못했다."}}
}
/* shardId: EVENT_ORD.introShard. 로드 실패·미등록이면 안내만. */
function ordIntroPlay(shardId){
 const id=String(shardId||"").trim();
 if(!id){ordIntroFail("이 이벤트에는 인트로가 없다.");return}
 if(typeof storyLoad!=="function"||typeof vnOpen!=="function"){ordIntroFail("이야기 기능을 불러오지 못했다.");return}
 const play=$("#ord-intro-play");if(play)play.disabled=true;
 storyLoad().then(book=>{
  const list=Array.isArray(book&&book.shards)?book.shards:[];
  const story=list.find(s=>s&&s.id===id);
  if(!story||!story.start){ordIntroFail("인트로 이야기가 아직 없다.");return}
  vnOpen(story)
 }).catch(()=>ordIntroFail("이야기를 불러오지 못했다.")).finally(()=>{if(play)play.disabled=false})
}
function ordPaint(){
 const o=typeof EVENT_ORD!=="undefined"&&EVENT_ORD||{};
 const v=$("#v-ord"),key=(typeof EVENT!=="undefined"&&EVENT&&EVENT.key)||"";
 if(v)v.dataset.event=key;
 const k=$("#ord-kicker"),t=$("#ord-title"),l=$("#ord-lead"),h=$("#ord-clue-help"),play=$("#ord-intro-play");
 if(k)k.textContent=o.kicker||"기간 한정 장기 의뢰";
 if(t)t.textContent=o.title||"장기 의뢰";
 if(l)l.textContent=o.lead||"";
 if(h)h.textContent=o.clueHelp||"";
 /* introShard 가 비어 있으면 버튼 숨김(눈의 여왕 등). 있으면 표시·클릭 연결. */
 const intro=String(o.introShard||"").trim();
 if(play){
  play.hidden=!intro;
  play.setAttribute("aria-label",(o.title||"이벤트")+" 인트로 재생");
  if(intro&&!play._ordIntro){
   play._ordIntro=1;
   play.onclick=()=>ordIntroPlay(String((typeof EVENT_ORD!=="undefined"&&EVENT_ORD&&EVENT_ORD.introShard)||"").trim())
  }
 }
}
function ord(){
 /* 예전 캐시 HTML: #ord-kicker 없음 · 인트로 버튼 없음 → includeHeal 로 조각 다시 받음. */
 if(typeof includeHeal==="function"&&(!$("#ord-kicker")||!$("#ord-intro-play"))){includeHeal();return}
 ordPaint();eboss();ordTab()
}
function ordTab(p){const v=$("#v-ord");if(!v)return;try{if(p)localStorage.setItem("mgr_ordtab",p);else p=localStorage.getItem("mgr_ordtab")||"clp"}catch(e){p=p||"clp"}
 if(!["clp","boss","clue"].includes(p))p="clp";v.dataset.tab=p;v.querySelectorAll(".ord-tabs [data-p]").forEach(b=>b.setAttribute("aria-selected",b.dataset.p===p?"true":"false"));ordMarks()}
function ordMarks(){const v=$("#v-ord");if(!v||!C)return;const now=Date.now();
 const clp=typeof CLP!=="undefined"&&typeof clpMine==="function"&&(()=>{const me=clpMine();return me.n>0&&CLP.ms.some((s,i)=>!me.got[i]&&CLPN>=Math.ceil(CLP.goal*s[0]))})();
 const clue=!!(C.clue&&C.clue.t1&&now>=C.clue.t1);
 const boss=!!(C.eb&&C.eb.d===today()&&(C.eb.n||0)<(typeof EBOSS!=="undefined"?EBOSS.t:0))&&!C.fall;
 [["clp",clp],["clue",clue],["boss",boss]].forEach(([k,on])=>{const d=v.querySelector('.ord-tabs [data-p="'+k+'"] .ord-dot');if(d)d.hidden=!on})}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#v-ord .ord-tabs [data-p]");if(!b)return;ordTab(b.dataset.p);try{window.scrollTo({top:$("#v-ord").offsetTop-8,behavior:"smooth"})}catch(err){}});
