/* 공용 비주얼 노벨. 세계관 이벤트뿐 아니라, 버튼을 누르는 다른 곳에서도 vnOpen 으로 띄운다.
   글과 갈림길은 호출하는 쪽이 객체로 넘긴다. 이 파일은 서버에 묻지 않고, 고른 선택도 저장하지 않는다.
   스토리는 모두에게 같은 글이므로 계정마다 다른 값이 필요 없다. 창을 닫으면 재생은 사라진다.

   이야기 객체 모양 (data/story/shards.json 이 이 모양을 쓴다):
   {
     id, title,
     cast: { "화자키": { name:"이름표", img:"스탠딩 주소", side:"left 또는 right" } },
     start: "처음 노드 id",
     nodes: {
       "노드id": {
         lines: [ { who:"화자키 또는 빈 문자열(지문)", text:"대사", stand:"이 줄만 쓸 그림 주소" } ],
         choose: [ { label:"선택지 문장", next:"고른 뒤 갈 노드 id" } ],
         next: "선택지 없이 대사가 끝난 뒤 이어질 노드 id"
       }
     }
   }
   lines 가 끝나면 choose 가 있을 때 선택지를 보여 준다. choose 가 없으면 next 로 넘어간다.
   choose 도 next 도 없으면 그 노드의 마지막 대사에서 이야기가 끝난다.
   img 와 stand 가 비어 있으면 이름만 있는 실루엣을 세운다. 그림 주소를 넣으면 그 그림을 세운다.
   화면을 바꾸면 main.js 의 show 가 vnClose 를 불러 창을 닫는다. */
let vnRoot=null,vnState=null,vnBack=null;
function vnCast(story,who){const c=story&&story.cast&&who?story.cast[who]:null;return c||{name:who||"",img:"",side:"right"}}
function vnClose(){if(vnRoot){vnRoot.remove();vnRoot=null}vnState=null;document.body.classList.remove("vn-open");
 const back=vnBack;vnBack=null;if(back&&typeof back.focus==="function"){try{back.focus()}catch(e){}}}
function vnNode(){const s=vnState;if(!s)return null;return s.story.nodes&&s.story.nodes[s.node]||null}
/* 대사가 없는 노드는 선택지나 다음 노드로 바로 넘긴다. 서로가 가리키며 비면 스무 번에서 멈춘다. */
function vnLand(){let g=0;while(vnState&&g++<20){const n=vnNode();if(!n){vnState.phase="end";return}
  const lines=Array.isArray(n.lines)?n.lines:[];if(vnState.line<lines.length){vnState.phase="line";return}
  if(Array.isArray(n.choose)&&n.choose.length){vnState.phase="choose";return}
  if(n.next){vnState.node=n.next;vnState.line=0;continue}
  vnState.phase="end";return}if(vnState)vnState.phase="end"}
function vnAdvance(){if(!vnState||vnState.phase!=="line")return;vnState.line++;vnLand();vnPaint()}
function vnPick(next){if(!vnState||!next)return;vnState.node=next;vnState.line=0;vnState.phase="line";vnLand();vnPaint()}
function vnStand(host,line){host.replaceChildren();if(!vnState)return;const who=line&&line.who||vnState.who||"";if(line&&line.who)vnState.who=line.who;
 if(!who&&!(line&&line.stand)){host.hidden=true;return}host.hidden=false;
 const cast=vnCast(vnState.story,who),side=cast.side==="left"?"left":"right";host.dataset.side=side;
 const src=String(line&&line.stand||cast.img||"").trim(),fig=elT("div","vn-fig");
 if(src){const img=document.createElement("img");img.alt="";img.src=src;img.addEventListener("error",()=>{img.remove();fig.appendChild(vnSil(cast.name))});fig.appendChild(img)}
 else fig.appendChild(vnSil(cast.name));host.appendChild(fig)}
function vnSil(name){const s=elT("div","vn-sil");s.appendChild(elT("span","vn-sil-name",name||"???"));return s}
function vnPaint(){if(!vnRoot||!vnState)return;vnLand();const n=vnNode(),lines=n&&Array.isArray(n.lines)?n.lines:[];
 const showLine=vnState.phase==="line"||vnState.phase==="end",idx=lines.length?Math.min(vnState.line,lines.length-1):-1;
 const line=showLine&&idx>=0?lines[idx]:null;if(line)vnState.shown=line;const spoken=line||vnState.shown;
 const name=vnRoot.querySelector(".vn-name"),text=vnRoot.querySelector(".vn-text"),next=vnRoot.querySelector(".vn-next"),choices=vnRoot.querySelector(".vn-choices");
 vnStand(vnRoot.querySelector(".vn-stand"),spoken||null);
 const who=spoken&&spoken.who||"";name.hidden=!who;name.textContent=who?vnCast(vnState.story,who).name||who:"";
 text.textContent=spoken&&spoken.text||"";
 const choosing=vnState.phase==="choose",ended=vnState.phase==="end";
 next.hidden=choosing;next.textContent=ended?"닫기":"다음";next.onclick=ended?vnClose:vnAdvance;
 choices.hidden=!choosing;choices.replaceChildren();
 if(choosing&&n)n.choose.forEach(ch=>{if(!ch||!ch.label)return;const b=elT("button","vn-choice",ch.label);b.type="button";b.onclick=()=>vnPick(ch.next);choices.appendChild(b)});
 const focus=choosing?choices.querySelector("button"):next;if(focus)focus.focus()}
function vnOpen(story){if(!story||!story.nodes||!story.start)return;const opener=document.activeElement;vnClose();vnBack=opener&&opener!==document.body?opener:null;
 vnState={story,node:story.start,line:0,phase:"line",who:""};vnLand();
 const root=elT("div","vn-float");root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");root.setAttribute("aria-label",story.title||"이야기");
 root.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();vnClose();return}if(vnState&&vnState.phase==="choose")return;if(e.key==="Enter"||e.key===" "){e.preventDefault();if(vnState&&vnState.phase==="end")vnClose();else vnAdvance()}});
 root.addEventListener("click",e=>{if(e.target.closest("button"))return;if(!vnState)return;if(vnState.phase==="end"){vnClose();return}if(vnState.phase!=="line")return;vnAdvance()});
 const stage=elT("div","vn-stage"),stand=elT("div","vn-stand"),x=elT("button","vn-x","닫기");x.type="button";x.setAttribute("aria-label","이야기 닫기");x.onclick=vnClose;
 const box=elT("div","vn-box"),name=elT("p","vn-name"),text=elT("p","vn-text"),row=elT("div","vn-row"),next=elT("button","vn-next","다음");next.type="button";
 const choices=elT("div","vn-choices");stage.append(stand,x);row.appendChild(next);box.append(name,text,choices,row);root.append(stage,box);
 document.body.appendChild(root);document.body.classList.add("vn-open");vnRoot=root;vnPaint()}
