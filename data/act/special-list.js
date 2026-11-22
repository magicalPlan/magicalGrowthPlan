/* 특별 의뢰(미니게임) 목록.
   화면: html/act/special.html · 그리기·진입 js/act/special.js
   항목: nm(표시 이름) · src(로딩용 경로, 화면에 안 보임) · id · path(해시 주소 조각, #/path) · ds(짧은 설명)
        · data(선택, 미니게임 숫자·그림 데이터 파일. src 보다 먼저 불러온다. 화면에 안 보임).
   새 미니게임을 넣을 때 여기에 한 줄 추가하고, 클릭 시 specialPlay 가 #/{path} 로 보낸다. */
const SPECIAL_GAMES=[
 {id:"flanders",path:"minigame1",nm:"🎨 플랜더스의 밑그림",src:"js/act/mini/demo.js",data:"data/act/mini/flanders.js",ds:"1분 동안 흐릿한 밑그림 선을 최대한 많이 따라 그린다. 한 판 최고 장수로 랭킹이 매겨진다."}
];
