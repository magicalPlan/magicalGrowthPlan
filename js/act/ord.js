/* 장기 의뢰. main.js 다음에 불러야 한다. 실전 하위 탭.
   화면은 html/act/ord.html, 탭은 html/home/main.html, 전환은 js/main.js 의 show 와 navGroup.
   이벤트 보스는 data/event-boss/boss.js 와 js/event-boss/boss.js.
   옆의 대련은 html/duel/arena.html 과 js/duel.js 이다.
   좁은 화면에서는 위의 탭(단서 조각 · 이벤트 보스 · 단서 탐색)으로 한 칸씩 보고, 넓은 화면에서는 두 칸으로 모두 보인다.
   고른 탭은 이 기기에 기억한다. 받을 보상이 있거나 탐색에서 돌아왔으면 탭에 점을 찍는다(ordMarks). */
function ord(){eboss();ordTab()}
function ordTab(p){const v=$("#v-ord");if(!v)return;try{if(p)localStorage.setItem("mgr_ordtab",p);else p=localStorage.getItem("mgr_ordtab")||"clp"}catch(e){p=p||"clp"}
 if(!["clp","boss","clue"].includes(p))p="clp";v.dataset.tab=p;v.querySelectorAll(".ord-tabs [data-p]").forEach(b=>b.setAttribute("aria-selected",b.dataset.p===p?"true":"false"));ordMarks()}
function ordMarks(){const v=$("#v-ord");if(!v||!C)return;const now=Date.now();
 const clp=typeof CLP!=="undefined"&&typeof clpMine==="function"&&(()=>{const me=clpMine();return me.n>0&&CLP.ms.some((s,i)=>!me.got[i]&&CLPN>=Math.ceil(CLP.goal*s[0]))})();
 const clue=!!(C.clue&&C.clue.t1&&now>=C.clue.t1);
 const boss=!!(C.eb&&C.eb.d===today()&&(C.eb.n||0)<(typeof EBOSS!=="undefined"?EBOSS.t:0))&&!C.fall;
 [["clp",clp],["clue",clue],["boss",boss]].forEach(([k,on])=>{const d=v.querySelector('.ord-tabs [data-p="'+k+'"] .ord-dot');if(d)d.hidden=!on})}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#v-ord .ord-tabs [data-p]");if(!b)return;ordTab(b.dataset.p);try{window.scrollTo({top:$("#v-ord").offsetTop-8,behavior:"smooth"})}catch(err){}});
