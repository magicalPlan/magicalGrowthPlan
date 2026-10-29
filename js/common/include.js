/* 앱 버전. 설정 화면과 화면 HTML 캐시가 이 값을 쓴다.
   화면 HTML을 고친 배포에서는 이 문자열과 index.html 의 include.js 주소 뒤 버전을 같이 올린다. */
var APP_VER="1.0.0.15";
/* 화면 HTML을 지금 읽고 있는 자리에 붙인다.
   이 호출은 본문을 읽는 동안 끝나야 한다. 아래 게임 스크립트는 버튼과 칸을 바로 찾는다.
   같은 버전의 화면은 이 브라우저에 남겨 두고, 다음 방문에서는 서버에 다시 묻지 않는다. */

function includeSweep() {
 try{
  var p="mgr_inc_"+APP_VER+"_";
  for(var i=localStorage.length-1;i>=0;i--){
   var k=localStorage.key(i);
   if(k&&k.indexOf("mgr_inc_")==0&&k.indexOf(p)!==0)localStorage.removeItem(k);
  }
 }catch(e){}
}
function includeHtml(src){
 var key="mgr_inc_"+APP_VER+"_"+src,hit="";
 try{hit=localStorage.getItem(key)||""}catch(e){}
 if(!hit){
  var x=new XMLHttpRequest();
  x.open("GET",src+(src.indexOf("?")<0?"?":"&")+"v="+encodeURIComponent(APP_VER),false);
  x.send(null);
  if(x.status!==200||!x.responseText)throw new Error(src+" 를 읽지 못했다");
  hit=x.responseText;
  try{localStorage.setItem(key,hit)}catch(e){}
 }
 document.write(hit);
}
includeSweep();
