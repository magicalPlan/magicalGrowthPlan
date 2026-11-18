/* 장기 의뢰. 인수인계: data/event/HANDOFF.md
   main.js 다음. 화면 html/act/ord.html, 전환 show · navGroup.
   히어로·단서 안내: pack.js EVENT_ORD ← ordPaint(). 테마만 바꿀 때 ord.html 하드코딩 금지.
   보스 js/event-boss/boss.js · 조각 piece.js · 탐색 clue.js.
   좁은 화면 탭 / 넓은 화면 그리드. 탭 기억 mgr_ordtab. 점 표시 ordMarks. */
function ordPaint(){
 const o=typeof EVENT_ORD!=="undefined"&&EVENT_ORD||{};
 const k=$("#ord-kicker"),t=$("#ord-title"),l=$("#ord-lead"),h=$("#ord-clue-help");
 if(k)k.textContent=o.kicker||"기간 한정 장기 의뢰";
 if(t)t.textContent=o.title||"장기 의뢰";
 if(l)l.textContent=o.lead||"";
 if(h)h.textContent=o.clueHelp||""
}
function ord(){ordPaint();eboss();ordTab()}
function ordTab(p){const v=$("#v-ord");if(!v)return;try{if(p)localStorage.setItem("mgr_ordtab",p);else p=localStorage.getItem("mgr_ordtab")||"clp"}catch(e){p=p||"clp"}
 if(!["clp","boss","clue"].includes(p))p="clp";v.dataset.tab=p;v.querySelectorAll(".ord-tabs [data-p]").forEach(b=>b.setAttribute("aria-selected",b.dataset.p===p?"true":"false"));ordMarks()}
function ordMarks(){const v=$("#v-ord");if(!v||!C)return;const now=Date.now();
 const clp=typeof CLP!=="undefined"&&typeof clpMine==="function"&&(()=>{const me=clpMine();return me.n>0&&CLP.ms.some((s,i)=>!me.got[i]&&CLPN>=Math.ceil(CLP.goal*s[0]))})();
 const clue=!!(C.clue&&C.clue.t1&&now>=C.clue.t1);
 const boss=!!(C.eb&&C.eb.d===today()&&(C.eb.n||0)<(typeof EBOSS!=="undefined"?EBOSS.t:0))&&!C.fall;
 [["clp",clp],["clue",clue],["boss",boss]].forEach(([k,on])=>{const d=v.querySelector('.ord-tabs [data-p="'+k+'"] .ord-dot');if(d)d.hidden=!on})}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#v-ord .ord-tabs [data-p]");if(!b)return;ordTab(b.dataset.p);try{window.scrollTo({top:$("#v-ord").offsetTop-8,behavior:"smooth"})}catch(err){}});
