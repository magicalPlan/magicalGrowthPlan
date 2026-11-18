/* =============================================================================
   장기 의뢰 — 이벤트 카탈로그 (테마 번들)
   상세 인수인계: data/event/HANDOFF.md
   -----------------------------------------------------------------------------
   기간·piece.id·eggInv·drop 일정: data/event/seasons.js (단일 출처).
   이 파일은 테마(ord·문구·보스·단서·알 이름·storyLock·titles)만.
   로드 직후 eventBindSeasons() 가 seasons 로 from/to/id/egg.inv 를 채운다.
   서버는 scripts/pack-event-seasons.js 가 seasons 를 functions 로 복사 (pack-sim 과 동일).

   활성
   · EVENT_FORCE = "snow" | "flanders" | null — 로컬/테스트. 배포 전 null. 서버 없음.
   · eventPick / eventLive — HANDOFF §2

   번들 필드 (EVENT_PACKS[key]) — 일정 제외
   · key, ord, piece(nm·ic·ds·msNames), boss, clue, egg(nm·ic·ds·leg·lim·rare·ids), storyLock, titles
   ============================================================================= */

/* 로컬/테스트 전용. 배포 빌드에서는 반드시 null. */
const EVENT_FORCE=null;

const EVENT_PACKS={
 snow:{
  key:"snow",
  ord:{
   kicker:"❄ 기간 한정 장기 의뢰",
   title:"눈의 여왕",
   lead:"닿지 못한 염원과 사랑이 얼어붙어 탄생한 '눈의 여왕'. 소중한 것을 되찾고 싶다면, 온 몸을 다해 부딪혀라.",
   clueHelp:"눈의 여왕이 남긴 흔적을 찾아 떠난다. 떠나 있는 동안 게임을 꺼 두어도 되고, 그 동안에는 장기 토벌과 정기 출정에 참가할 수 없다. 중간에 돌아가면 지난 시간만큼의 절반만 받는다. 끝까지 가면 추가 조사를 발견할 수 있다. 단서 조각이 가장 많이 나오는 곳이다."
  },
  piece:{
   nm:"단서 조각",
   ic:"🧩",
   ds:"서리 드래곤이 감춘 진실의 한 조각. 혼자서는 아무것도 알 수 없지만, 모두의 조각이 모이면 숨겨진 이야기가 드러난다.",
   msNames:["첫 번째 실마리","흩어진 기억","얼음 속의 목소리","드러난 진실"]
  },
  boss:{
   list:[
    ["눈의 여왕이 만들어낸 허상","당신의 소중한 것을 앗아갔다. 되찾으러 가기 위해서는 힘을 모아야 한다.","빛"],
    ["얼음에 비친 그림자","눈의 여왕이 세운 거대한 벽. 골렘의 형상을 띤다. 당신의 가장 추악한 모습을 비춘다.","어둠"],
    ["가장 아름다운 장미","붉은 꽃잎은 분노와 질투로 이루어져있다. 화려한 꽃향기는 추악함을 숨기기 위함이다.","땅"],
    ["서리 드래곤","눈의 여왕이 궁전을 지키고자 지배한 것. 공허한 눈은 오직 여왕을 위해 존재한다.","물"],
    ["숙원의 눈보라","여왕의 집념이 당신을 거세게 밀어낸다. 궁전으로 향하기 위해 반드시 뚫어내야만 할 관문.","바람"],
    ["망각의 마녀","모든 것을 잊고, 이 곳에서 쉬어가자. 벽난로 앞에서 몸을 뉘이자. 온기는 이따금씩 적의를 가린다.","불"]
   ]
  },
  clue:{
   rows:[
    {nm:"눈의 여왕의 소문을 찾아 헤매기",ds:"마을 사람들로부터 눈의 여왕에 대한 소문을 듣는다."},
    {nm:"눈 내린 벌판",ds:"전 루프에서는 없었던 곳. 눈의 여왕이 차지한 땅 그 언저리를 탐색한다."},
    {nm:"서리 정원",ds:"한겨울에만 피어나는 꽃 사이를 헤맨다. 이슬이 얼어 구슬이 되어 있다."},
    {nm:"얼음 성",ds:"눈의 여왕이 머무르는 거처. 당신들의 소중한 것이 이 안에 있다."}
   ],
   log:[
    "눈 위에 찍힌 작은 발자국이 성 안으로 이어진다.",
    "성벽 틈에서 봄의 바람이 한 줌 새어 나온다.",
    "얼어붙은 초인종을 누르자, 아무도 없는 복도에서 대답이 들린다.",
    "마력이 고인 샘이 유리처럼 굳어 있다. 바닥에는 금화가 박혀 있다.",
    "누군가 놓고 간 장갑이 한 짝. 아직 체온이 남아 있다.",
    "소중한 것을 통째로 잃어버린 자가 당신에게 구원을 청했다.",
    "새파란 빛으로 빛나는 마법석은 당신의 기억에 없던 것이다.",
    "서리 사이에 오래된 결계석이 희미하게 빛나고 있다.",
    "'질투는 가장 아름다운 장미의 빛을 띠고 있단다.' 목소리가 울렸다.",
    "멀리서 자장가 비슷한 노랫소리가 들렸다가 눈보라에 묻힌다.",
    "쓰러진 얼음 조각 사이에서 반짝이는 파편을 주웠다.",
    "손을 뻗어도, 소중한 것에는 닿지 못했다.",
    "먼 길을 떠나는 당신에게 마을 주민이 따듯한 목도리를 쥐여주었다.",
    "성문 안쪽에, 돌아가라는 경고가 손톱으로 새겨져 있다."
   ],
   extra:[
    ["glass","금이 간 유리구슬","눈송이 사이에서 주웠다. 안에는 여름의 빛이 얼어 있다.",.45,1],
    ["letter","누군가의 편지","사랑하고 아끼는 이들의 이름이 적혀있는 편지. 서리에 덮여 이름은 보이지 않는다.",.35,3],
    ["mirror","서리 거울","비친 얼굴이 잠시 다른 사람의 얼굴이 되었다. 그 사람은 웃고 있었다.",.22,6],
    ["heart","얼지 않은 심장","침소 가장 깊은 곳. 차갑지 않은 것이 하나, 아직 뛰고 있다.",.12,12]
   ]
  },
  egg:{nm:"서리 드래곤의 알",ic:"❄️",ds:"얼음 궁전 깊은 곳, 서리 드래곤이 품고 있던 알. 차갑게 반짝이지만, 귀를 대면 작은 심장 소리가 들린다.",leg:.03,lim:.18,rare:.30},
  storyLock:[
   {id:"shard-1",n:2500},
   {id:"shard-2",n:5000,at:Date.UTC(2026,10,3,15)},
   {id:"shard-3",n:7500,at:Date.UTC(2026,10,6,15)},
   {id:"shard-4",n:10000,at:Date.UTC(2026,10,9,15)}
  ],
  titles:[
   ["pet_snow","서리 속의 손님","2026년 겨울, 서리 드래곤의 알에서 기간 한정 사역마를 깨웠다.",c=>(c.pets||[]).some(q=>q&&(q.sp==="reindeer"||q.sp==="mirror"||q.sp==="rose"))||(c.stats?.petEv||0)>=1]
  ]
 },

 flanders:{
  key:"flanders",
  ord:{
   kicker:"🎨 기간 한정 장기 의뢰",
   title:"플랜더스의 개",
   lead:"버려진 그림과 남겨진 약속. 화가와 아이, 그리고 개의 발자국을 따라가면, 금이 간 이야기 조각이 보인다.",
   clueHelp:"플랜더스의 흔적을 찾아 떠난다. 떠나 있는 동안 게임을 꺼 두어도 되고, 그 동안에는 장기 토벌과 정기 출정에 참가할 수 없다. 중간에 돌아가면 지난 시간만큼의 절반만 받는다. 끝까지 가면 추가 조사를 발견할 수 있다. 단서 조각이 가장 많이 나오는 곳이다."
  },
  piece:{
   nm:"단서 조각",
   ic:"🧩",
   ds:"금이 간 캔버스에 남은 진실의 한 조각. 혼자서는 흐릿하지만, 모두의 조각이 모이면 그림이 드러난다.",
   msNames:["첫 붓질","흩어진 물감","캔버스의 균열","완성된 그림"]
  },
  boss:{
   list:[
    ["빈 캔버스의 그림자","그려지지 못한 얼굴이 버티고 선다. 붓을 들어야만 지나갈 수 있다.","빛"],
    ["시장 골목의 빚쟁이","값을 치르지 못한 약속이 발목을 잡는다.","어둠"],
    ["성당 앞의 석상","돌이 된 눈동자가 소녀와 개를 내려다본다.","땅"],
    ["금이 간 액자","액자 속에서 누군가의 숨소리가 새어 나온다.","물"],
    ["북풍이 부는 들판","멀리 성당 탑이 보인다. 바람은 발걸음을 되돌리려 한다.","바람"],
    ["마지막 작품","완성되지 않은 그림이 스스로 움직인다. 당신의 기억을 물감으로 삼으려 한다.","불"]
   ]
  },
  clue:{
   rows:[
    {nm:"화가의 소문을 듣다",ds:"마을 사람들로부터 플랜더스의 화가와 아이, 개에 대한 이야기를 모은다."},
    {nm:"낡은 화실",ds:"물감 냄새가 배어 있는 방. 찢긴 스케치가 바닥에 흩어져 있다."},
    {nm:"성당으로 가는 길",ds:"먼 탑을 향해 이어진 길. 작은 발자국과 네 발 자국이 나란하다."},
    {nm:"성당의 제단",ds:"그림이 걸려 있어야 할 자리. 금이 간 액자만 남아 있다."}
   ],
   log:[
    "발자국이 성당 탑을 가리킨다.",
    "팔레트에 마른 물감이 무지개처럼 갈라져 있다.",
    "누군가 놓고 간 목걸이가 흙에 반쯤 묻혀 있다.",
    "개 발자국 옆에 작은 구두 자국이 겹친다.",
    "화실 창문으로 노을이 들어온다. 그림 속 하늘과 같다.",
    "빚문서 한쪽이 찢긴 채 바람에 날린다.",
    "성당 종소리가 멀리서 한 번 울렸다.",
    "'조금만 더…' 속삭임이 붓털 사이에서 새어 나온다.",
    "금이 간 캔버스 뒤로 따뜻한 숨결이 느껴진다.",
    "마을 아이가 길을 알려 주며 빵 조각을 건넨다.",
    "액자 틈에서 오래된 편지 한 장이 떨어진다.",
    "그림을 완성하려는 손과, 막으려는 손이 겹친다.",
    "탑 아래에서 개가 한동안 울다가 그쳤다.",
    "제단 앞, 빈자리가 당신을 기다려 온 것처럼 고요하다."
   ],
   extra:[
    ["sketch","찢긴 스케치","개의 눈만 또렷하다. 나머지 선은 지워져 있다.",.45,1],
    ["brush","부러진 붓","자루에 이니셜이 희미하다. 아직 물감이 묻어 있다.",.35,3],
    ["frame","금 간 액자 조각","액자 안쪽 면에 작은 기도문이 새겨져 있다.",.22,6],
    ["portrait","미완성 초상","얼굴은 비어 있고, 눈빛만 남아 있다.",.12,12]
   ]
  },
  egg:{nm:"금이 간 알",ic:"🎨",ds:"이미 부서져 태어날 가능성 없던 알에, 당신과 화가의 마력이 깃들었다.",leg:.03,lim:0,rare:.30,ids:[]},
  storyLock:[
   {id:"flanders-1",n:2500},
   {id:"flanders-2",n:5000,at:Date.UTC(2026,10,25,15)},
   {id:"flanders-3",n:7500,at:Date.UTC(2026,10,28,15)},
   {id:"flanders-4",n:10000,at:Date.UTC(2026,11,1,15)}
  ],
  titles:[
   ["pet_flanders","금 간 캔버스의 손님","금이 간 알에서 플랜더스 시즌의 사역마를 깨웠다.",c=>{const ids=typeof PET_EV2!=="undefined"&&Array.isArray(PET_EV2.ids)?PET_EV2.ids:[];return (c.stats&&c.stats.petEv2||0)>=1||(c.pets||[]).some(q=>q&&ids.indexOf(q.sp)>=0)}]
  ]
 }
};

/* seasons.js 의 일정을 팩에 붙인다. from/to/piece.id/egg.inv. */
function eventBindSeasons(){
 if(typeof EVENT_SEASONS==="undefined"||!EVENT_SEASONS||!EVENT_SEASONS.length)return;
 EVENT_SEASONS.forEach(function(s){
  const p=EVENT_PACKS[s.key];if(!p)return;
  p.from=s.from;p.to=s.to;
  p.piece=p.piece||{};p.piece.id=s.id;
  p.egg=p.egg||{};p.egg.inv=s.eggInv
 })
}
eventBindSeasons();

function eventPackList(){return Object.keys(EVENT_PACKS).map(function(k){return EVENT_PACKS[k]})}
function eventPick(now){
 now=now==null?Date.now():now;
 if(EVENT_FORCE&&EVENT_PACKS[EVENT_FORCE])return EVENT_PACKS[EVENT_FORCE];
 const list=eventPackList(),live=list.find(function(e){return now>=e.from&&now<e.to});
 if(live)return live;
 const up=list.filter(function(e){return now<e.from}).sort(function(a,b){return a.from-b.from});
 if(up.length)return up[0];
 const past=list.filter(function(e){return now>=e.to}).sort(function(a,b){return b.to-a.to});
 return past[0]||list[0]||null
}
function eventLive(now){
 now=now==null?Date.now():now;
 const e=eventPick(now);if(!e)return null;
 if(EVENT_FORCE&&EVENT_FORCE===e.key)return e;
 if(now>=e.from&&now<e.to)return e;
 return null
}

/* 표시·조립용 현재 팩 (live 또는 upcoming/past). */
const EVENT=eventPick();
const EVENT_ORD=EVENT&&EVENT.ord||{kicker:"",title:"장기 의뢰",lead:"",clueHelp:""};
/* 칭호는 모든 시즌 분을 붙인다(이미 딴 칭호가 목록에서 사라지지 않게). */
const EVENT_TITLES=[];
eventPackList().forEach(function(p){if(Array.isArray(p.titles))Array.prototype.push.apply(EVENT_TITLES,p.titles)});

/* 알 전역: 모든 팩의 egg 를 inv 별로 남긴다 (녹·품기 호환). */
function eventEggOf(inv){
 const p=eventPackList().find(function(e){return e.egg&&e.egg.inv===inv});
 if(!p||!p.egg)return null;
 return Object.assign({},p.egg,{from:p.from,to:p.to})
}
var PET_EV=eventEggOf("eggsEv")||{from:0,to:0,nm:"이벤트 알",ic:"🥚",ds:"",leg:.03,lim:0,rare:.3};
var PET_EV2=eventEggOf("eggsEv2")||{from:0,to:0,nm:"이벤트 알",ic:"🥚",ds:"",leg:.03,lim:0,rare:.3,ids:[]};

/* 장기 의뢰 스토리 잠금 — 표시 중인 팩 기준. */
var STORY_LOCK=(EVENT&&Array.isArray(EVENT.storyLock)?EVENT.storyLock:[]).slice();

/* —— 전역 조립 (로직이 보는 이름). EVENT_PACKS / EVENT_FORCE 를 고친다. —— */
const EVENT_PACK=EVENT?{piece:Object.assign({},EVENT.piece,{from:EVENT.from,to:EVENT.to}),boss:EVENT.boss,clue:EVENT.clue}:null;
const EBOSS=Object.assign({},EBOSS_FORM,{list:EVENT&&EVENT.boss&&EVENT.boss.list||[]});
const CLP=Object.assign({},CLP_FORM,{
 id:EVENT&&EVENT.piece?EVENT.piece.id:"clue-none",
 nm:EVENT&&EVENT.piece?EVENT.piece.nm:"단서 조각",
 ic:EVENT&&EVENT.piece?EVENT.piece.ic:"🧩",
 ds:EVENT&&EVENT.piece?EVENT.piece.ds:"",
 from:EVENT?EVENT.from:0,
 to:EVENT?EVENT.to:0,
 ms:CLP_FORM.ms.map(function(row,i){return [row[0],row[1],EVENT&&EVENT.piece&&EVENT.piece.msNames&&EVENT.piece.msNames[i]||""]})
});
const CLUE=CLUE_FORM.map(function(row,i){return Object.assign({},row,EVENT&&EVENT.clue&&EVENT.clue.rows&&EVENT.clue.rows[i]||{})});
const CLUE_LOG=EVENT&&EVENT.clue&&EVENT.clue.log||[];
const CLUE_EXTRA=EVENT&&EVENT.clue&&EVENT.clue.extra||[];

/* 이벤트 칭호를 TITLE_LIST 에 붙인다 (list.js 가 먼저 로드됨). */
if(typeof TITLE_LIST!=="undefined"&&EVENT_TITLES.length)Array.prototype.push.apply(TITLE_LIST,EVENT_TITLES);

/* KST 기간 안내 문구. care · toast 공용. */
function eventRangeTxt(from,to){
 function one(t){const d=new Date(Number(t)+9*36e5);const mi=d.getUTCMinutes();return (d.getUTCMonth()+1)+"월 "+d.getUTCDate()+"일"+(d.getUTCHours()||mi?" "+d.getUTCHours()+"시"+(mi?String(mi).padStart(2,"0")+"분":""):"")}
 return one(from)+" ~ "+one(to)
}
