/* =============================================================================
   장기 의뢰 — 시즌 일정 (단일 출처)
   상세: data/event/HANDOFF.md
   -----------------------------------------------------------------------------
   · from / to / piece.id / eggInv / drop 만 둔다. 테마 문구는 pack.js.
   · 클라: index.html 이 pack.js 보다 먼저 로드. pack 이 이 표로 from·to·id 를 채운다.
   · 서버: firebase predeploy 의 scripts/pack-event-seasons.js 가
     functions/account/event-seasons.js 로 복사한다 (pack-sim 과 같은 방식).
   · EVENT_FORCE 는 여기 없음 (클라 pack.js 전용).

   UTC: Date.UTC(y, m0, d, h). KST = UTC+9.
     11/22 19:00 KST → Date.UTC(2026,10,22,10)
   ============================================================================= */
const EVENT_SEASONS=[
 /* 눈의 여왕 — 2026-11-01 0:00 ~ 11-22 18:00 KST */
 {key:"snow",id:"clue-2026-11",from:Date.UTC(2026,9,31,15),to:Date.UTC(2026,10,22,9),eggInv:"eggsEv",drop:{x_ok:.35,x_fail:.1}},
 /* 플랜더스의 개 — 2026-11-22 19:00 ~ 12-20 18:00 KST */
 {key:"flanders",id:"clue-2026-flanders",from:Date.UTC(2026,10,22,10),to:Date.UTC(2026,11,20,9),eggInv:"eggsEv2",drop:{x_ok:.35,x_fail:.1}}
];
