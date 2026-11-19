/* 특별 의뢰(미니게임) 목록.
   화면: html/act/special.html · 그리기·진입 js/act/special.js
   항목: nm(표시 이름) · src(소스 경로, 목록에 그대로 보여 줌) · id · path(해시 주소 조각, #/path) · ds(짧은 설명).
   새 미니게임을 넣을 때 여기에 한 줄 추가하고, 클릭 시 specialPlay 가 #/{path} 로 보낸다. */
const SPECIAL_GAMES=[
 {id:"demo",path:"minigame1",nm:"(자리) 예시 미니게임",src:"js/act/mini/demo.js",ds:"목록·진입 틀만. 실제 미니게임 코드를 src 경로에 두고 연결한다."}
];
