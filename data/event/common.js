/* =============================================================================
   장기 의뢰 — 공통 양식 (수치·보상·규칙)
   상세 인수인계: data/event/HANDOFF.md
   -----------------------------------------------------------------------------
   · 시즌 일정: data/event/seasons.js. 테마: pack.js EVENT_PACKS.
   · 이 파일은 밸런스·보상 구조가 바뀔 때만. js/event-boss/* 로직은 그대로.
   · 로드: craft.js → 이 파일 → seasons.js → pack.js → js/event-boss/*

   Functions: seasons.js → (predeploy pack-event-seasons.js) → event-seasons.js
   · drops / boost 가 require. EVENT_FORCE 없음.

   UTC
   · Date.UTC(y, m0, d, h) — 월은 0부터. KST = UTC+9.
     예) 11/22 18:00 KST → Date.UTC(2026,10,22,9)
   ============================================================================= */

/* 이벤트 보스 공통. list(타이틀·설명·약점)는 pack.boss.list.
   HP 식: (최고 전투력자 레벨 + 전투력×(전투력−레벨)) ÷ ((전투력÷레벨)÷hpX).
   실제 hp0 는 Functions bossHitHp. 패턴 시각은 js/boss.js bpAt 과 같음. */
const EBOSS_FORM={
 nm:"이벤트 보스",
 until:"내일 0시까지",
 t:3,
 hpX:1.9,
 dz:2,
 hit:15,
 kill:{g:180,m:2},
 mvp:1,
 /* 토벌 참가자 전원 재료. [MAT id, 개수] — data/craft.js */
 drop:[["m_ore",1],["m_dew",1]]
};

/* 단서 조각 기본값. 팩이 clp:{goal,ms,drop} 을 주면 그 시즌만 덮어쓴다(pack.eventClpMerge).
   명칭·기간: pack.piece + seasons. 단계 표시명: piece.msNames.
   drop: x_ok/x_fail·lh·clue·eb (출정 서버 x_ok/x_fail 는 seasons.drop 도 맞춤).
   ms: [합계 비율, 보상]. 보상 키: g,m,it,mat,evEgg(활성 egg.inv). */
const CLP_FORM={
 goal:10000,
 drop:{x_ok:.35,x_fail:.1,lh:.35,clue:{base:2,extra:.5,fail:.5,early:.5},eb:3},
 ms:[
  [.25,{g:1000,mat:{m_dew:5}}],
  [.5,{m:10,mat:{m_shard:10,m_herb:10},it:{g2:3}}],
  [.75,{it:{hope:3},evEgg:3}],
  [1,{g:3000,m:10,mat:{m_dew:10,m_ash:20}}]
 ]
};

/* 단서 탐색 공통(보상·시간·권장 전투력). nm·ds 는 pack.clue.rows(같은 순서).
   골드·경험치 = 노브×경과시간×roundBetween(95−5×(st−1), 100−5×(st−1))×0.01.
   성공 확률은 장기 토벌 lhChance 와 동일. */
const CLUE_FORM=[
 {id:"gate",  hr:1,  pw:0,   g:420,ex:550,dz:15,m:0,clp:3, st:1},
 {id:"hall",  hr:3,  pw:100, g:420,ex:550,dz:25,m:0,clp:8, st:2},
 {id:"garden",hr:6,  pw:250, g:420,ex:550,dz:45,m:0,clp:15,st:3},
 {id:"room",  hr:12, pw:400, g:420,ex:550,dz:65,m:0,clp:30,st:4}
];
const CLUE_FAIL_DZ=10,CLUE_EARLY=.5;
/* 재료 표 이름 — data/craft.js MAT_DROP */
const CLUE_DROP={ok:"lh_hr",fail:"lh_fail"};
