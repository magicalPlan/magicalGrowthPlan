/* 이야기 잠금·목록 플래그. 이벤트 연동: data/event/HANDOFF.md §9
   · 글: data/story/index.json → chapters/*.json
   · STORY_LOCK: pack.js 가 표시 팩 storyLock 으로 세움 (장기 의뢰 단서 칸 · clpStories).
   · WORLD_STORY_OPEN: 세계관 › 이벤트 탭만. CLPN·STORY_LOCK 과 독립.
   대사 수정 시 chapters/*.json ?v= 와 STORY_INDEX_URL v 를 올린다. */
   /*
   테스트 시:: storyLoad().then(book => vnOpen(book.shards.find(s => s.id === "shard-1")))
   새 챕터 추가:: chapters/새파일.json 작성 → index.json chapters 에 한 줄 → 필요 시 WORLD_STORY_OPEN.
   */

const STORY_INDEX_URL="data/story/index.json?v=3";
/* 예전 단일 파일 주소. storyLoad 가 index 형태가 아닐 때만 쓰이던 호환용 — 지금은 index 를 쓴다. */
const STORY_URL=STORY_INDEX_URL;

/* STORY_LOCK 은 data/event/pack.js 가 활성(표시) 팩의 storyLock 으로 세운다. */

/* true 면 장기 의뢰 칸에서 그 이야기를 열 수 있다. n 은 단서 조각 합계, now 는 밀리초 시각. */
function storyFlag (lock, n, now) {
  if (!lock) return false;
  if ((Number(n) || 0) < (Number(lock.n) || 0)) return false;
  if (lock.at != null && (Number(now) || Date.now()) < lock.at) return false;
  return true
}

/* 합계만 충족했는지. 날짜 잠금이면 행은 보여 주고 열림 시각만 안내한다. */
function storyReachN (lock, n) {
  return !!lock && (Number(n) || 0) >= (Number(lock.n) || 0)
}

/* lock.at(UTC ms)을 한국 시각 기준 'M월 D일 0시' 문구로. */
function storyAtTxt (at) {
  const t = Number(at);
  if (!Number.isFinite(t)) return "";
  const k = new Date(t + 9 * 3600000);
  return (k.getUTCMonth() + 1) + "월 " + k.getUTCDate() + "일 0시"
}

/* 세계관 > 이벤트 탭 전용. open 을 true 로 바꾸면 그 에피소드가 탭에 보인다. CLPN·STORY_LOCK 과 별개다.
   챕터 묶음·소제목은 chapters/*.json 의 title·lead, 에피소드 제목은 shards[].title. */
const WORLD_STORY_OPEN=[
 {id: "shard-1",open:true},
 {id: "shard-2",open:true},
 {id: "shard-3",open:true},
 {id: "shard-4",open:true},
 {id: "shady-merchant-1", open:true},
 {id: "flanders-1", open:false},
 {id: "flanders-2", open:false},
 {id: "flanders-3", open:true},
 {id: "flanders-side", open:false},
 {id: "flanders-4", open: true},
 {id: "flanders-5", open: true},
 {id: "flanders-side2", open: true}
];
