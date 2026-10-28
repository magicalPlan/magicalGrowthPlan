/* 화면 HTML을 지금 읽고 있는 자리에 붙인다.
   이 호출은 본문을 읽는 동안 끝나야 한다. 아래 게임 스크립트는 버튼과 칸을 바로 찾는다. */
function includeHtml(src){
 var x=new XMLHttpRequest();
 x.open("GET",src+(src.indexOf("?")<0?"?":"&")+"_="+Date.now(),false);
 x.send(null);
 if(x.status!==200||!x.responseText)throw new Error(src+" 를 읽지 못했다");
 document.write(x.responseText);
}
