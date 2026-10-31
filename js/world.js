/* 세계관. 개요 글은 이 파일에만 있다. 화면을 처음 열 때 그리고, 그 뒤에는 다시 그리지 않는다.
   개요 칸은 html/world/overview.html, 이벤트는 html/world/event.html, Q&A는 html/world/qa.html.
   탭은 html/home/main.html, 전환은 js/main.js 의 show 와 navGroup.
   서버에 묻지 않는다. 로그인하지 않아도 된다. */
function worldLines(text){const p=elT("p","world-p");String(text).split("\n").forEach((line,i)=>{if(i)p.appendChild(document.createElement("br"));p.appendChild(document.createTextNode(line))});return p}
function worldFold(title,tone,nodes){const d=elT("details","world-fold"+(tone?" "+tone:""));const s=document.createElement("summary");
 s.append(elT("span","world-name",title),elT("span","world-mark","펼치기"));d.appendChild(s);const body=elT("div","world-body");nodes.forEach(n=>body.appendChild(n));d.appendChild(body);
 d.addEventListener("toggle",()=>{const m=s.querySelector(".world-mark");if(m)m.textContent=d.open?"접기":"펼치기"});return d}
function worldView(){show("world");const root=$("#v-world");if(!root||root.dataset.ready)return;root.dataset.ready="1";root.replaceChildren();
 root.append(elT("h2","world-page","세계관"),elT("p","world-lead","우리는 또다시 희망하고, 절망한다."));

const village = (name, text) => {
  const box = elT("div", "world-village-box"); // 필요시 CSS 클래스명 변경
  box.append(elT("h3", "world-name", name), worldLines(text)); // h3 태그를 사용하여 마을 이름 표시
  return box;
 };
 
 root.append(
  worldFold("개요","",[
   worldLines("우리가 사는 세계는 총 세 가지로 나뉜다."),
   worldLines("아무런 힘도 없지만, 그 자체로 뛰어난 힘을 가진 이름 없는 세계.\n이름 없는 세계의 꿈과 희망을 기반으로 돌아가는 매지컬 랜드.\n이름 없는 세계의 절망과 괴로움을 기반으로 돌아가는 타르타로스."),
   worldLines("세계는 그렇게, 오늘로 돌아간다.")]),
  worldFold("이름 없는 세계","",[
   worldLines("특별한 명칭이 없는 세계. 평범한 사람들은 이곳만이 유일한 세계라고 생각하며 살아간다.\nA마을, B마을, C마을, D마을로 이루어져 있다."),
   village("A마을","물건이 풍부한 항구 마을. 다양한 사람들이 모여 살고 있다. 어시장, 경매장 등이 있어 이름 없는 세계의 모든 돈은 A마을로 통한다고 볼 수 있는데, 그만큼 치안이 좋지 않아 뒷골목에는 밀수꾼 등이 자리해 있다. 특히 가장 많이 언급되는 것으론 사라지지 않는 유령선의 이야기가 괴담처럼 떠돌고 있다."),
   village("B마을","치유의 숲이 존재하는 마을. 다양한 치유사들과 크고 작은 종교 단체 등이 존재한다. 대부분의 정령이 이 곳에서 살고 있다. 그 외에도 치유의 숲 깊은 곳에는 배척당한 이종족들의 거처가 존재한다고 전해진다."),
   village("C마을","대장간이 많은 요새 마을. 대장장이들이 많은 만큼 학구열과 기술력이 다른 마을에 비해 월등히 높다. 오래 전 매지컬랜드 여왕과의 약속을 통해 C마을 출신의 계약직 마법사들은 재계약을 할때 특권을 받게 된다."),
   village("D마을","포탈의 그림자가 드리운 마을. 먼 옛날 타르타로스에서 도망쳐온 하위 마인들이 모여 만들어낸 마을이다. 지금은 그 피가 옅어져 마인은 존재하지 않는다. (아마도?) 가장 많은 포탈이 열리며, 가장 많은 절망이 쏟아져나오는 곳이지만 그만큼 강한 계약직 마법사들이 자리해 있다.")]),
  worldFold("매지컬 랜드","hope",[
   worldLines("이름 없는 세계의 꿈과 희망 등 긍정적인 감정을 기반으로 돌아가는 세계. 매지컬랜드 왕궁 깊숙한 곳에 숨겨진 ‘코어’가 그 감정의 결정체이다. 뛰어난 마법을 가진 여왕 이사벨 매지컬이 3000년 이상 군림해 있으며, 아이들은 모두 동등하게 ‘신비로운 나무’에서 자라난다. 이 중 1만 년에 한 번 태어나는 특별한 아이가 왕/여왕이 된다.\n기본적으로 귀족 등은 존재하지 않으며, 왕 아래 모두 평등하다."),
   worldLines("가족이라는 결속 없이 모든 아이가 평등하게 모든 어른들 아래에서 자란다. ‘가족’이라는 제한을 두지 않는 것에 가깝다. 결혼도, 따로 가족이 되고 싶다 생각한 상대가 생겨 가족이 되는 것도 자유다.")]),
  worldFold("타르타로스","despair",[
   worldLines("이름 없는 세계의 절망과 괴로움 등 부정적인 감정을 기반으로 돌아가는 세계. 최근 새로운 마왕이 즉위했으며, 현재 전쟁의 원인은 그 마왕. 허나 마왕의 정체는 베일에 싸여있다. 상상하기도 싫은 권악징선과 약육강식만이 존재하는 세계. 아이들은 거대한 꽃이 가득 만발한 ‘시작의 꽃밭’에서 자라난다. 이 중 1만 년에 한번 태어나는 특별한 아이가 마왕이 된다. 마수, 하급 마인, 상급 마인, 마왕 순의 계급 체재가 있다."),
   worldLines("특별한 목적을 가지고 아이를 꽃밭에서 데려오면 부모가 될 수 있다. 허나 대부분의 마인의 ‘특별한 목적’은 가족 구성이라기보단 비윤리적인 이유가 대부분이다."),
   worldLines("타르타로스에는 불문율이 있다. 이는 ‘어린 마인을 건드리지 않는다’는 내용으로, 이런 불문율이 생긴 데에는 두 가지 이유가 있다. 첫째로는 종족 유지. 두번째로는 어린아이로 변신하여 허점을 노리는 마인이 많았기 때문. 따라서 마인들은 14살까지는 보호받다가, 14살이 되는 순간 약육강식의 세계에 던져진다.")]))}

/* 이벤트 스토리. 글과 선택지는 data/story/shards.json, 창은 js/story/vn.js 의 vnOpen.
   기억의 파편 버튼을 누르면 그 이야기만 띄운다. JSON을 한 번 읽어 이 탭에 기억해 두고, 서버에는 저장하지 않는다.
   글을 고친 뒤에는 아래 주소의 v 숫자를 올린다. */
const WORLD_STORY_URL="data/story/shards.json?v=2";
let worldStoryBusy=false;
function worldShard(story){const b=elT("button","world-shard",story.title||"기억의 파편");b.type="button";b.onclick=()=>{if(typeof vnOpen==="function")vnOpen(story)};return b}
function worldEventDraw(root,book){const list=Array.isArray(book&&book.shards)?book.shards:[];
 root.appendChild(elT("p","world-lead","기억의 파편. 누르면 그 기억이 대화로 펼쳐진다."));
 if(!list.length){root.appendChild(elT("p","hint","아직 적힌 기억이 없다."));return}
 list.forEach(story=>{if(story&&story.start)root.appendChild(worldShard(story))})}
function worldEvent(){show("wev");const root=$("#v-wev");if(!root||root.dataset.ready||worldStoryBusy)return;worldStoryBusy=true;
 fetch(WORLD_STORY_URL,{cache:"no-cache"}).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json()}).then(book=>{
  if(!root||root.dataset.ready)return;const err=root.querySelector(".story-err");if(err)err.remove();worldEventDraw(root,book);root.dataset.ready="1"}).catch(()=>{
  worldStoryBusy=false;if(root&&!root.querySelector(".story-err"))root.appendChild(elT("p","hint story-err","기억을 불러오지 못했다. 새로고침해 보자."))})}

  
/* Q&A. 글은 data/world/qa.json.
   한 란은 { "title": "제목", "tone": "hope 또는 despair, 없으면 생략", "qa": [ { "q": "질문", "a": "답변" } ] }.
   답을 여러 줄로 쓰려면 a 안에 \n 을 넣는다. 질문을 고친 뒤에는 아래 주소의 v 숫자를 올린다. */
const WORLD_QA_URL="data/world/qa.json?v=1";
function worldQaItem(it){const q=String(it&&it.q||"").trim();if(!q)return null;const box=elT("div","qa-item"),qp=elT("p","qa-q");
 qp.append(elT("b","qa-tag","Q"),document.createTextNode(q));const ap=elT("div","qa-a");ap.append(elT("b","qa-tag","A"),worldLines(it.a||""));box.append(qp,ap);return box}
function worldQaDraw(root,list){(Array.isArray(list)?list:[]).forEach(sec=>{if(!sec||!sec.title)return;const nodes=(Array.isArray(sec.qa)?sec.qa:[]).map(worldQaItem).filter(Boolean);
  root.appendChild(worldFold(String(sec.title),sec.tone||"",nodes.length?nodes:[elT("p","hint","아직 적힌 질문이 없다.")]))})}
let wqaBusy=false;
function worldQa(){show("wqa");const root=$("#v-wqa");if(!root||root.dataset.ready||wqaBusy)return;wqaBusy=true;
 fetch(WORLD_QA_URL,{cache:"no-cache"}).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json()}).then(list=>{
  if(!root||root.dataset.ready)return;const err=root.querySelector(".qa-err");if(err)err.remove();worldQaDraw(root,list);root.dataset.ready="1"}).catch(()=>{
  wqaBusy=false;if(root&&!root.querySelector(".qa-err"))root.appendChild(elT("p","hint qa-err","Q&A를 불러오지 못했다. 새로고침해 보자."))})}
