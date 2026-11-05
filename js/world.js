/* 세계관(설정 하위 개요·이벤트·Q&A). 개요 글은 data/world/overview.json, Q&A는 data/world/qa.json.
   화면: html/world/*. 탭 전환은 js/main.js 의 show·navGroup. 서버에 묻지 않는다. */
function worldLines(text){const p=elT("p","world-p");String(text).split("\n").forEach((line,i)=>{if(i)p.appendChild(document.createElement("br"));p.appendChild(document.createTextNode(line))});return p}
function worldFold(title,tone,nodes){const d=elT("details","world-fold"+(tone?" "+tone:""));const s=document.createElement("summary");
 s.append(elT("span","world-name",title),elT("span","world-mark","펼치기"));d.appendChild(s);const body=elT("div","world-body");nodes.forEach(n=>body.appendChild(n));d.appendChild(body);
 d.addEventListener("toggle",()=>{const m=s.querySelector(".world-mark");if(m)m.textContent=d.open?"접기":"펼치기"});return d}
function worldVillage(name,text){const box=elT("div","world-village-box");box.append(elT("h3","world-name",name),worldLines(text));return box}
/* 개요 JSON. folds[]: { title, tone?, paras?:string[], villages?:{name,text}[] }. 글을 고치면 URL 의 v 를 올린다. */
const WORLD_OV_URL="data/world/overview.json?v=1";
let wovBusy=false,wovData=null,wovP=null;
function worldOvLoad(){if(wovData)return Promise.resolve(wovData);if(wovP)return wovP;
 wovP=fetch(WORLD_OV_URL).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json()}).then(d=>{wovData=d;wovP=null;return d}).catch(e=>{wovP=null;throw e});return wovP}
function worldOvDraw(root,data){const d=data&&typeof data==="object"?data:{};
 root.append(elT("h2","world-page",String(d.title||"세계관")),elT("p","world-lead",String(d.lead||"")));
 (Array.isArray(d.folds)?d.folds:[]).forEach(sec=>{if(!sec||!sec.title)return;const nodes=[];
  (Array.isArray(sec.paras)?sec.paras:[]).forEach(t=>{if(t!=null&&String(t).trim())nodes.push(worldLines(String(t)))});
  (Array.isArray(sec.villages)?sec.villages:[]).forEach(v=>{if(v&&v.name)nodes.push(worldVillage(String(v.name),String(v.text||"")))});
  root.appendChild(worldFold(String(sec.title),sec.tone||"",nodes.length?nodes:[elT("p","hint","아직 적힌 글이 없다.")]))})}
function worldView(){show("world");const root=$("#v-world");if(!root||root.dataset.ready||wovBusy)return;wovBusy=true;
 worldOvLoad().then(data=>{if(!root||root.dataset.ready)return;root.replaceChildren();const err=root.querySelector(".wov-err");if(err)err.remove();worldOvDraw(root,data);root.dataset.ready="1";wovBusy=false}).catch(()=>{
  wovBusy=false;if(root&&!root.dataset.ready&&!root.querySelector(".wov-err"))root.appendChild(elT("p","hint wov-err","세계관 개요를 불러오지 못했다. 새로고침해 보자."))})}

/* 세계관 > 이벤트. 버튼은 data/story/lock.js 의 WORLD_STORY_OPEN(open:true) 만 본다.
   장기 의뢰 단서 조각(STORY_LOCK·CLPN·clpStories)과 별개다. open 은 lock.js 에서 손으로 켠다. */
function worldEvent(){show("wev");const root=$("#v-wev");if(!root)return;root.replaceChildren();
 const open=(typeof WORLD_STORY_OPEN!=="undefined"?WORLD_STORY_OPEN:[]).filter(r=>r&&r.open&&r.id);
 if(!open.length){root.append(elT("p","world-lead","이 기억은 아직 잠겨 있다."),elT("p","hint","장기 의뢰의 단서 조각이 모이면, 그 칸에서 이야기를 볼 수 있다."));return}
 root.appendChild(elT("p","world-lead","열린 이벤트 이야기"));
 const slot=elT("div","clp-stories"),box=elT("div","card");box.appendChild(slot);root.appendChild(box);
 if(typeof storyLoad!=="function"){slot.appendChild(elT("p","hint","이야기를 불러올 수 없다."));return}
 storyLoad().then(book=>{const list=Array.isArray(book&&book.shards)?book.shards:[];
  open.forEach(row=>{const story=list.find(s=>s&&s.id===row.id);if(!story||!story.start)return;const line=elT("div","clp-story");
   line.appendChild(elT("span","clp-story-name",story.title||"이야기"));const b=elT("button","chip","스토리 보기");b.type="button";
   b.onclick=()=>{if(typeof vnOpen==="function")vnOpen(story)};line.appendChild(b);slot.appendChild(line)});
  if(!slot.childNodes.length){root.replaceChildren(elT("p","world-lead","이 기억은 아직 잠겨 있다."),elT("p","hint","이야기 글을 찾지 못했다."));}}).catch(()=>{slot.appendChild(elT("p","hint","이야기를 불러오지 못했다."))})}

  
/* Q&A. 글은 data/world/qa.json.
   한 란은 { "title": "제목", "tone": "hope 또는 despair, 없으면 생략", "qa": [ { "q": "질문", "a": "답변" } ] }.
   답을 여러 줄로 쓰려면 a 안에 \n 을 넣는다. 질문을 고친 뒤에는 아래 주소의 v 숫자를 올린다. */
const WORLD_QA_URL="data/world/qa.json?v=2";
function worldQaItem(it){const q=String(it&&it.q||"").trim();if(!q)return null;const box=elT("div","qa-item"),qp=elT("p","qa-q");
 qp.append(elT("b","qa-tag","Q"),document.createTextNode(q));const ap=elT("div","qa-a");ap.append(elT("b","qa-tag","A"),worldLines(it.a||""));box.append(qp,ap);return box}
function worldQaDraw(root,list){(Array.isArray(list)?list:[]).forEach(sec=>{if(!sec||!sec.title)return;const nodes=(Array.isArray(sec.qa)?sec.qa:[]).map(worldQaItem).filter(Boolean);
  root.appendChild(worldFold(String(sec.title),sec.tone||"",nodes.length?nodes:[elT("p","hint","아직 적힌 질문이 없다.")]))})}
/* Q&A JSON은 세션 동안 메모리에 두고, 주소의 v 가 바뀌면 새로 받는다. */
let wqaBusy=false,wqaList=null,wqaP=null;
function worldQaLoad(){if(wqaList)return Promise.resolve(wqaList);if(wqaP)return wqaP;
 wqaP=fetch(WORLD_QA_URL).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json()}).then(list=>{wqaList=list;wqaP=null;return list}).catch(e=>{wqaP=null;throw e});return wqaP}
function worldQa(){show("wqa");const root=$("#v-wqa");if(!root||root.dataset.ready||wqaBusy)return;wqaBusy=true;
 worldQaLoad().then(list=>{if(!root||root.dataset.ready)return;const err=root.querySelector(".qa-err");if(err)err.remove();worldQaDraw(root,list);root.dataset.ready="1"}).catch(()=>{
  wqaBusy=false;if(root&&!root.querySelector(".qa-err"))root.appendChild(elT("p","hint qa-err","Q&A를 불러오지 못했다. 새로고침해 보자."))})}
