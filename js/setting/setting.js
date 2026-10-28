/* 설정 화면. main.js 다음에 불러야 한다. 메뉴의 설정은 drawSetting 을 그대로 부른다.
   앱 버전은 include.js 의 APP_VER 를 이 브라우저 mgr_ver 에 남긴다. 설정 화면 오른쪽 아래에서 같은 글을 본다. */
function verKeep(){const v=typeof APP_VER==="string"&&APP_VER?APP_VER:"1.0.0";try{localStorage.setItem("mgr_ver",v)}catch(e){}const el=$("#set-ver");if(el)el.textContent="앱 버전 "+v}
verKeep();
function drawSetting(){
 const lt=document.documentElement.dataset.theme==="light";
 $("#set-thm").textContent=lt?"지금은 화이트 모드다.":"지금은 블랙 모드다.";
 $("#set-theme").textContent=lt?"☾ 블랙 모드":"☀ 화이트 모드";
 $("#set-note").textContent=AUTH.uid?"로그인한 계정이다. 로그아웃하면 이 브라우저의 로그인만 풀린다.":"혼자 하기에서는 기록이 이 브라우저에만 남는다.";
 $("#set-out").hidden=!AUTH.uid;
 $("#setm").textContent="";
 verKeep();
}
$("#set-theme").onclick=()=>{thmSet(document.documentElement.dataset.theme==="light"?"dark":"light");drawSetting()};
$("#set-srv").onclick=()=>{const u=prompt("Firebase Realtime Database 주소를 입력한다.\n예: https://프로젝트이름-default-rtdb.firebaseio.com");if(u&&/^https:\/\//.test(u.trim())){try{localStorage.setItem("mgr_fb",u.trim())}catch(e){}location.reload()}else if(u)$("#setm").textContent="주소는 https:// 로 시작해야 한다."};
$("#set-out").onclick=()=>{const o=$("#b-out");if(o)o.click()};
