/* 이야기 잠금 플래그.
   세계관 > 이벤트 탭에서는 이야기를 열지 않는다. 그 탭은 잠긴 안내만 남긴다(js/world.js 의 worldEvent).
   플래그는 storyFlag 다. true 일 때만 실전 > 장기 의뢰의 단서 조각 칸에 '스토리 보기'가 생긴다(js/event-boss/piece.js 의 clpStories).
   서버에 이 잠금을 묻거나 저장하지 않는다. 장기 의뢰가 이미 받아 둔 모두의 합계(CLPN)와 이 기기의 시각만 본다.
   한 줄의 뜻:
     id  data/story/shards.json 의 이야기 id
     n   단서 조각 합계가 이 개수 이상이어야 한다
     at  이 시각을 지난 뒤여야 한다. 없으면 개수만 본다.
   at 는 한국 시간 0시다. Date.UTC 의 월은 0부터라 11월은 10이고, 시각 15는 한국 0시다.
   개수나 날짜를 바꾸면 이 목록만 고친다. 대사를 고치면 아래 STORY_URL 의 v 숫자를 올린다. */
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
/* true 면 그 이야기를 열 수 있다. n 은 단서 조각 합계, now 는 밀리초 시각. */
function storyFlag(lock,n,now){if(!lock)return false;if((Number(n)||0)<(Number(lock.n)||0))return false;if(lock.at!=null&&(Number(now)||Date.now())<lock.at)return false;return true}
