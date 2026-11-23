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
   · key, ord, piece(nm·ic·ds·msNames·img?), boss, clue, egg(…), storyLock({id,at?,mg?}), titles
   · steps (권장) [n1,n2,n3,n4] — 물감/조각 단계 공통값. eventBindSteps 가
     storyLock[i].n 과 clp.goal·단계 비율에 같이 넣는다. 숫자 바꿀 때는 여기만.
   · piece.img (선택) — assets/event_items/{img}.png. 장기 의뢰 단서 칸·탐색 칩·획득 문구.
   · ord.introShard (선택) — 장기 의뢰 제목 옆 ▶ 로 재생할 스토리 shard id.
     있으면 #ord-intro-play 표시, 없으면 hidden. 예: flanders → "flanders-1".
     스토리가 아직 chapters 에 없어도 필드는 두어도 되고, 클릭 시 "아직 없다" 안내만 난다.
   · clp (선택) { ms, drop } — 보상·드롭만. goal·단계 개수는 steps 가 채움(없으면 CLP_FORM).
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
   img:"wt_puzzle_piece",
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
  egg:{nm:"서리 드래곤의 알",ic:"❄️",ds:"얼음 궁전 깊은 곳, 서리 드래곤이 품고 있던 알. 차갑게 반짝이지만, 귀를 대면 작은 심장 소리가 들린다.",leg:.03,lim:.18,rare:.30,ids:["reindeer","mirror","rose"]},
  /* 단계 공통값 → storyLock.n · CLP 목표/단계 (eventBindSteps). */
  steps:[2500,5000,7500,10000],
  storyLock:[
   {id:"shard-1"},
   {id:"shard-2",at:Date.UTC(2026,10,3,15)},
   {id:"shard-3",at:Date.UTC(2026,10,6,15)},
   {id:"shard-4",at:Date.UTC(2026,10,9,15)}
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
   /* 제목 옆 ▶. chapters/flanders.json 의 shard id. 없으면 버튼 hidden. */
   introShard:"flanders-1",
   lead:"제 형태를 잃고 망집에 휘말린 동물들을 찾는다. 마법을 이용해, 동물들을 집으로 돌려보내자.",
   clueHelp:"마을 여기저기를 탐험하며 집으로 돌아가길 바라는 동물들을 찾는다. 떠나 있는 동안 게임을 꺼 두어도 되고, 그 동안에는 장기 토벌과 정기 출정에 참가할 수 없다. 중간에 돌아가면 지난 시간만큼의 절반만 받는다. 끝까지 가면 추가 조사를 발견할 수 있다. 단서 조각이 가장 많이 나오는 곳이다."
  },
  piece:{
   nm:"물감",
   ic:"🖌️",
   img:"yellow_paint_fd",
   ds:"여린 동물을 덮친 집착. 물감의 형태로 화한 것을 덜어내고 모으자.",
   msNames:["마수를 닮은 짐승","귀갓길","나는 닿을 수 없어.","집착의 색"]
  },
  boss:{
   list:[
    ["제 색을 잃은 불개","살아남고자, 살아남아 더 오래 주인의 곁에 있고자. 스스로 물감을 뒤집어썼다.","빛"],
    ["꼬리 아홉 달린 매구","때로 이해 관계가 일치하는 자들이 있다. 목적을 위해 몸을 내놓았고, 화가는 이를 받아들였다.","어둠"],
    ["카토블레파스","최초이자 최후의 카토블레파스. 그는 여전히 암소의 꿈을 꾼다..","땅"],
    ["마카라","모든 생물이 주인을 가지는 것은 아니다. 물을 조심하라. ","물"],
    ["닷발 괴물","이 새는 여전히 배운 단어를 반복하고 있다.","바람"],
    ["헬 워커","불을 뿜음에도 여전히 산책을 청한다. 개로서의 형상은 이제 희미하다","불"]
   ]
  },
  clue:{
   rows:[
    {nm:"마을 소문을 찾아 헤매기",ds:"마을 사람들로부터 소문을 듣는다. 기괴하게 변한 동물들에 대한 이야기를."},
    {nm:"골목길로 향하기",ds: "똑똑한 짐승들은 자신의 모습이 달라졌음을 인지하고 있다. 몸을 숨기는 방법도 알고 있다."},
    {nm:"변두리 숲 탐색",ds:"사람과 친해진 동물들은 집 근처를 맴돈다. 그들이 그들 자신을 잊기 전까지는."},
    {nm:"왜곡된 귀갓길",ds:"이미 돌아갈 길을 잊어버린 자들이 있다. 주변인의 소중함도, 따스한 손길조차..."}
   ],
   log:[
    "고양이가 꼬리를 흔들며 당신을 기다렸다. 꼬리 두 개 달린 그것은 당신의 손길을 피하지 않았다.",
    "팔레트에 마른 물감이 무지개처럼 갈라져 있다. 허나 이 곳에는 비도, 빛도 없다.",
    "모든 것이 끝난 후, 고양이는 자신의 주인에게서 츄르를 얻어먹었다.",
    "주민이 사라진 동물을 찾아 헤맸다. 옷조차 제대로 챙겨입지 못한 이는 자신이 제대로 안아주지 못해 아이가 도망쳤다며 슬퍼하고 있었다.",
    "당신은 절망에 빠져 구원을 기다려 본 적 있는가?",
    "결계 안의 동물들은 뒤틀렸음에도 퍽 편안해 보인다. 돌아가지 못할 뿐. 그들은 이 결계의 주인에게 사랑 받고 있으리라.",
    "허나 그 사랑이 과연 어설픈 현실의 것보다 낫던가...",
    "허상 뿐인 '콩쿠르' 속에서 살아 숨쉬는 이는 '플랜더스의 화가' 뿐이다.",
    "방해하지 마.",
    "짙은 빛의 물감이 당신을 덮치고 지나갔다. 당신이라 망정이었지, 그게 만약 사역마나 모르는 짐승이었다면...",
    "겨우 본모습을 되찾은 동물을 주인에게 돌려 보냈다. 『바보야. 어떤 모습을 했든. 너는 내 동생인데...』",
    "주인과 반려동물의 포옹을 한참이고 바라보다 돌아 나왔다.",
    "우유 싣던 수레는 망가진 지 오래이다. 그 위로 보라 새가 둥지를 지었다.",
    "부숴져야만 강해질 수 있는 이들이 있다.",
    "소중한 반려가 있는가?"
   ],
   extra:[
    ["patrasche","아직은 갈 수 없멍","미술 작품 가득한 결계 속, 유일하게 동물의 형태 띤 것이 당신들을 바라보고 있었다. 그 개에게는 그림자가 없었다.",.45,1],
    ["probably_dog","텅 빈 짐승","플랜더스의 화가의 근처까지 다가갔으나, 검은 짐승이 곧 당신을 밀어내었다.",.35,3],
    ["artist","갈구한다 한들","흑요석으로 이루어진 것은 붓이 될 수 없다. 너무나도 딱딱한 탓이다. 너무 큰 탓에 그릴 수 없다. 그의 손은 작은 펜에 익숙한 탓이다.",.22,6],
    ["nechromancer","새로운 주인, 가족.","조금 더 살아갈 수 있게 된 동물들은 자발적으로 이 결계를 지키고 있다",.12,12]
   ]
  },
  egg:{nm:"금이 간 알",ic:"🎨",ds:"이미 부서져 태어날 가능성 없던 알에, 당신과 화가의 마력이 깃들었다.",leg:.03,lim:.18,rare:.30,ids:["magicalhound","olberssnake"]},
  /* 단계 공통값 → storyLock.n · CLP 목표/단계 (eventBindSteps). 숫자 변경은 여기만. */
  steps:[5000,10000,15000,20000],
  /* storyLock: at=열림 시각(UTC), mg=밑그림 총합(event_minigame/flanders/total_amount). n 은 steps. */
  storyLock:[
   {id:"flanders-2"},
   {id:"flanders-3",at:Date.UTC(2026,11,24,15),mg:5000},
   {id:"flanders-4",at:Date.UTC(2026,11,27,15)},
   {id:"flanders-5",at:Date.UTC(2026,11,30,15)}
  ],
  titles:[
   ["flanders_mg","플랜더스의","특별 의뢰 '플랜더스의 밑그림'을 한 번 그려 보았다.",c=>!!(c.stats&&c.stats.mgFlanders)],
   ["flanders_mg100","그림쟁이","플랜더스의 밑그림을 100번 이상 플레이했다. 『너도 화가에 관심 있어?』",c=>(c.stats&&c.stats.mgFlanders||0)>=100],
   /* 모두 합쳐(total_amount)≥200 인 뒤 한 판을 마치면 stats.mgFlandersConcours=1 → 칭호. 스토리 flanders-side. */
   ["flanders_concours","콩쿠르 입상","모두 합쳐 밑그림이 200장을 넘긴 뒤 플랜더스의 밑그림을 그렸다.",c=>!!(c.stats&&c.stats.mgFlandersConcours)],
   ["pet_flanders","포기하는 게 아니야","더 먼 세상을 여행하길 바라며. 금이 간 알에 생명을 불어넣었다.",c=>{const ids=typeof PET_EV2!=="undefined"&&Array.isArray(PET_EV2.ids)?PET_EV2.ids:[];return (c.stats&&c.stats.petEv2||0)>=1||(c.pets||[]).some(q=>q&&ids.indexOf(q.sp)>=0)}]
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
/* steps[n1..n4] → storyLock[i].n + clp.goal·단계 비율. 보상 칸(ms[1])·drop 은 clp/CLP_FORM 유지. */
function eventBindSteps(){
 Object.keys(EVENT_PACKS).forEach(function(key){
  const p=EVENT_PACKS[key],raw=p&&p.steps;if(!Array.isArray(raw)||!raw.length)return;
  const nums=raw.map(function(x){return Math.max(0,Number(x)||0)});
  const goal=nums[nums.length-1]||0;
  if(Array.isArray(p.storyLock))p.storyLock.forEach(function(lock,i){if(lock&&nums[i]!=null)lock.n=nums[i]});
  const base=typeof CLP_FORM!=="undefined"?CLP_FORM:{ms:[]};
  const o=p.clp||{},msSrc=Array.isArray(o.ms)&&o.ms.length?o.ms:(base.ms||[]);
  const ms=msSrc.length===nums.length&&goal>0
   ?msSrc.map(function(row,i){return [Math.min(1,nums[i]/goal),row[1]]})
   :o.ms;
  p.clp=Object.assign({},o,{goal:goal},ms?{ms:ms}:{});
 })
}
eventBindSeasons();
eventBindSteps();

function eventPackList () {
  return Object.keys(EVENT_PACKS).map(
    function (k) {
      return EVENT_PACKS[k]
    }
  )
}

function eventPick (now) {
  now = now == null ? Date.now() : now;
  if (EVENT_FORCE && EVENT_PACKS[EVENT_FORCE]) return EVENT_PACKS[EVENT_FORCE];
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

/* 팩 clp + CLP_FORM. goal·단계 비율은 보통 eventBindSteps(steps)가 이미 채움. */
function eventClpMerge(pack){
 const o=pack&&pack.clp||{},base=CLP_FORM;
 const goal=o.goal!=null?Number(o.goal):base.goal;
 const drop=o.drop?Object.assign({},base.drop,o.drop):base.drop;
 const rows=Array.isArray(o.ms)&&o.ms.length?o.ms:base.ms;
 const names=pack&&pack.piece&&pack.piece.msNames||[];
 return{
  goal:goal,
  drop:drop,
  ms:rows.map(function(row,i){return [row[0],row[1],names[i]||""]})
 }
}

/* —— 전역 조립 (로직이 보는 이름). EVENT_PACKS / EVENT_FORCE / seasons 를 고친다. —— */
const EVENT_PACK=EVENT?{piece:Object.assign({},EVENT.piece,{from:EVENT.from,to:EVENT.to}),boss:EVENT.boss,clue:EVENT.clue}:null;
const EBOSS=Object.assign({},EBOSS_FORM,{list:EVENT&&EVENT.boss&&EVENT.boss.list||[]});
const _clp=eventClpMerge(EVENT);
const CLP=Object.assign({},CLP_FORM,{
 id:EVENT&&EVENT.piece?EVENT.piece.id:"clue-none",
 nm:EVENT&&EVENT.piece?EVENT.piece.nm:"단서 조각",
 ic:EVENT&&EVENT.piece?EVENT.piece.ic:"🧩",
 img:EVENT&&EVENT.piece&&EVENT.piece.img?EVENT.piece.img:"",
 ds:EVENT&&EVENT.piece?EVENT.piece.ds:"",
 from:EVENT?EVENT.from:0,
 to:EVENT?EVENT.to:0,
 goal:_clp.goal,
 drop:_clp.drop,
 ms:_clp.ms
});
/* 획득 문구의 CLP.ic 를 그림으로 바꿀 때 쓴다(js/event-boss/piece.js clpImgHtml). */
const CLP_MARK=CLP.ic;
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
