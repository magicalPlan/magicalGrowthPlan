/* 이야기 잠금 플래그.
   · STORY_LOCK + storyFlag: 실전 > 장기 의뢰 단서 조각 칸(js/event-boss/piece.js clpStories).
     서버 합계 CLPN·기기 시각으로 연다. 세계관 탭과 무관하다.
   · WORLD_STORY_OPEN: 설정 > 세계관 > 이벤트 탭(js/world.js worldEvent).
     open:true 인 것만 버튼을 그린다. 개수·날짜와 무관 — 이 목록만 손으로 켠다/끈다.
   대사를 고치면 STORY_URL 의 v 숫자를 올린다. */
   /*
   테스트 시:: storyLoad().then(book => vnOpen(book.shards.find(s => s.id === "shard-1")))
   */
const STORY_URL="data/story/shards.json?v=3";
const STORY_LOCK=[
 {id:"shard-1",n:2500},
 {id:"shard-2",n:5000,at:Date.UTC(2026,10,3,15)},
 {id:"shard-3",n:7500,at:Date.UTC(2026,10,6,15)},
 {id:"shard-4",n:10000,at:Date.UTC(2026,10,9,15)}
];
/* true 면 장기 의뢰 칸에서 그 이야기를 열 수 있다. n 은 단서 조각 합계, now 는 밀리초 시각. */
function storyFlag(lock,n,now){if(!lock)return false;if((Number(n)||0)<(Number(lock.n)||0))return false;if(lock.at!=null&&(Number(now)||Date.now())<lock.at)return false;return true}

/* 세계관 > 이벤트 탭 전용. open 을 true 로 바꾸면 그 이야기가 탭에 보인다. CLPN·STORY_LOCK 과 별개다.
   예: 이벤트 종료 뒤 보관용으로 shard-1·2 만 켠다. */
const WORLD_STORY_OPEN=[
 {id:"shard-1",open:true},
 {id:"shard-2",open:true},
 {id:"shard-3",open:false},
 {id:"shard-4",open:false}
];
