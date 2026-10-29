/* 이벤트 보스. data/game.js 와 data/craft.js 다음에 불러야 한다.
   싸움은 js/event-boss/boss.js, 화면은 html/act/ord.html (실전 > 장기 의뢰).
   패턴이 바뀌는 시각과 순서는 지금 나와 있는 오전·오후 보스(js/boss.js 의 bpAt)와 같다.
   체력은 그 보스 체력의 hpX배. 자정(이 기기 시각의 today())에 보스와 공격 횟수가 다시 시작된다.
   숫자와 이름만 고치면 바뀐다. */

/* 오늘 보스: [이름, 설명, 약점 속성]. 날짜 번호(dayN)로 하루씩 다음 보스로 넘어간다. */
const EBOSS={
 list:[
  ["눈의 여왕이 만들어낸 허상","당신의 소중한 것을 앗아갔다. 되찾으러 가기 위해서는 힘을 모아야 한다.","땅"]],
 nm:"이벤트 보스",
 until:"내일 0시까지",
 t:3,
 hpX:2,
 dz:2,
 hit:15,
 kill:{g:180,m:2},
 mvp:1,
 /* 토벌 보상으로 참가한 모두에게 주는 재료. [재료 id, 개수]. id 는 data/craft.js 의 MAT. */
 drop:[["m_ore",1],["m_dew",1]]};
