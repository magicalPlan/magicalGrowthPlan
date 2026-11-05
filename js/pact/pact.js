/* 계약 화면. 마법 → 재계약 시험 도전 → 운명의 재계약(한 화면 스크롤).
   화면은 html/pact/pact.html, 재계약 시험 본문은 js/trial.js · html/trial/trial.html.
   마법 그리기는 js/main.js 의 drawSkills, 운명의 재계약은 js/growth/growth.js 의 drawRetrait. */
function pact(msg){show("pact");
 if(typeof drawSkills==="function")drawSkills();
 if(typeof trBtnPaint==="function")trBtnPaint($("#b-trial"));
 if(typeof drawRetrait==="function")drawRetrait();
 const m=$("#pcm");if(m){m.style.color="var(--mu)";m.textContent=msg||""}}
