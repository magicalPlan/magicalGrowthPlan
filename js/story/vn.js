/* 공용 비주얼 노벨. 버튼을 누르는 쪽에서 vnOpen 으로 띄운다.
   장기 의뢰 단서 조각(storyFlag)과 세계관 > 이벤트 탭(WORLD_STORY_OPEN)에서 연다.
   글과 갈림길은 호출하는 쪽이 객체로 넘긴다. 이 파일은 서버에 묻지 않고, 고른 선택도 저장하지 않는다.
   스토리는 모두에게 같은 글이므로 계정마다 다른 값이 필요 없다. 창을 닫으면 재생은 사라진다.

   챕터 파일: data/story/chapters/*.json → { id, title, lead, shards:[ 에피소드… ] }
   목록: data/story/index.json. 에피소드(이야기) 객체 모양:
   {
     id, title,
     cast: { "화자키": { name:"이름표", img:"스탠딩 주소", side:"left 또는 right" } },
     start: "처음 노드 id",
     nodes: {
       "노드id": {
         lines: [ { who:"화자키 또는 빈 문자열(지문)", text:"대사", stand:"이 줄만 쓸 그림 주소", fx:"dark" } ],
         choose: [ { label:"선택지 문장", next:"고른 뒤 갈 노드 id" } ],
         next: "선택지 없이 대사가 끝난 뒤 이어질 노드 id"
       }
     }
   }
   lines 가 끝나면 choose 가 있을 때 선택지를 보여 준다. choose 가 없으면 next 로 넘어간다.
   choose 도 next 도 없으면 그 노드의 마지막 대사에서 이야기가 끝난다.
   fx:"dark" 인 줄은 암전: 화면이 까맣게 가라앉고 스탠딩이 사라진다. text 를 비우면 대화창도 숨는다.
   img 와 stand 가 비어 있으면 이름만 있는 실루엣을 세운다. 그림 주소를 넣으면 그 그림을 세운다.
   화면을 바꾸면 main.js 의 show 가 vnClose 를 불러 창을 닫는다. */
let vnRoot=null,vnState=null,vnBack=null,vnOnClose=null;
/* 스탠딩 주소 → Promise. 줄마다 img 를 지웠다 다시 쓰면 깜빡이므로, 미리 받아 두고 준비된 뒤에만 갈아끼운다. */
const vnImgPre={};

function vnPreload(src){
  src=String(src||"").trim();
  if(!src)return Promise.resolve(null);
  if(vnImgPre[src])return vnImgPre[src];
  return vnImgPre[src]=new Promise(function(ok){
    const im=new Image();
    im.onload=im.onerror=function(){ok(im)};
    im.src=src
  })
}

function vnPreStory(story){
  if(!story)return;
  const cast=story.cast||{};
  Object.keys(cast).forEach(function(k){const c=cast[k];if(c&&c.img)vnPreload(c.img)});
  const nodes=story.nodes||{};
  Object.keys(nodes).forEach(function(id){
    const lines=nodes[id]&&Array.isArray(nodes[id].lines)?nodes[id].lines:[];
    lines.forEach(function(L){if(L&&L.stand)vnPreload(L.stand)})
  })
}

function vnCast(story,who) {
  const c = story && story.cast && who ? story.cast[who] : null;
  return c || { name : who || "", img : "", side:"right" }
}

/* skipCb: vnOpen 이 새 이야기를 열기 전에 이전 창만 지울 때 true. */
function vnClose (skipCb) {
  if (vnRoot) {
    vnRoot.remove();
    vnRoot = null
  }
  vnState = null;
  document.body.classList.remove("vn-open");

  const back = vnBack;
  vnBack = null;
  if (back && typeof back.focus==="function") {
    try {
      back.focus()
    } catch (e) {}
  }
  const cb = vnOnClose;
  vnOnClose = null;
  if (!skipCb && typeof cb === "function") {
    try { cb() } catch (e) {}
  }
}

function vnNode () {
  const s = vnState;
  if (!s) return null;
  return s.story.nodes && s.story.nodes[s.node] || null
}

/* 대사가 없는 노드는 선택지나 다음 노드로 바로 넘긴다. 서로가 가리키며 비면 스무 번에서 멈춘다. */
function vnLand () {
  let g = 0;
  while (vnState && g++<20) {
    const n = vnNode();
    if (!n) {
      vnState.phase = "end";
      return
    }
  const lines = Array.isArray (n.lines) ? n.lines : [];
  if (vnState.line < lines.length) {
    vnState.phase = "line";
    return
  }
  if (Array.isArray(n.choose) && n.choose.length) {
    vnState.phase = "choose";
    return
  }
  if (n.next) { 
    vnState.node = n.next;
    vnState.line = 0;
    continue
  }
  vnState.phase = "end";
  return
}
if (vnState) vnState.phase = "end"
}

function vnAdvance () {
  if (!vnState || vnState.phase !== "line") return;
  vnState.line++;
  vnLand();
  vnPaint()
}

function vnPick (next) {
  if (!vnState || !next) return;
  vnState.node = next;
  vnState.line = 0;
  vnState.phase = "line";
  vnLand();
  vnPaint()
}

/** 스탠딩을 위한 함수. "who": ""는 독백으로 인식한다.
    같은 그림이면 DOM 을 건드리지 않는다. 다른 그림은 preload 후 한 번에 교체해 빈 칸 깜빡임을 줄인다. */
function vnStand (host,line) {
  if (!vnState){host.replaceChildren();return}
  
  const who = line && line.who !== undefined ? line.who : (vnState.who || "");

  if (line && line.who !== undefined) vnState.who = line.who;

  if (!who && !(line && line.stand)) {
    host._vnGen=(host._vnGen||0)+1;
    host.hidden = true;
    host.replaceChildren();
    return
  }
  host.hidden = false;
  
  const cast = vnCast(vnState.story, who), side = cast.side === "left" ? "left" : "right";
  host.dataset.side = side;
  const src = String(line && line.stand || cast.img || "").trim();
  const cur = host.querySelector(".vn-fig img");
  const curSrc = cur && (cur.getAttribute("src") || "") || "";

  if (src && cur && curSrc === src) return;

  if (!src) {
    host._vnGen=(host._vnGen||0)+1;
    host.replaceChildren();
    host.appendChild(elT("div", "vn-fig"));
    return
  }

  const gen = (host._vnGen = (host._vnGen || 0) + 1);
  vnPreload(src).then(function () {
    if (!vnState || host._vnGen !== gen) return;
    const fig = elT("div", "vn-fig");
    const img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    img.src = src;
    img.addEventListener("error", function () { img.remove() });
    fig.appendChild(img);
    host.replaceChildren(fig)
  })
}

function vnSil (name) {
  const s = elT("div", "vn-sil");
  s.appendChild(elT("span", "vn-sil-name", name || "???" ));
  return s
}

function vnPaint() {
  if (!vnRoot || !vnState) return;
  vnLand();
  const n = vnNode(), lines = n && Array.isArray(n.lines) ? n.lines : [];
  const showLine = vnState.phase === "line" || vnState.phase === "end", idx = lines.length ? Math.min(vnState.line, lines.length - 1) : -1;
  const line = showLine && idx >= 0 ? lines[idx] : null;

  if (line) vnState.shown = line;

  const spoken = line || vnState.shown;
  const name = vnRoot.querySelector(".vn-name"), text = vnRoot.querySelector(".vn-text"), next = vnRoot.querySelector(".vn-next"), choices = vnRoot.querySelector(".vn-choices");
  
  vnStand(vnRoot.querySelector(".vn-stand"), spoken || null);
  const dark = !!(spoken && spoken.fx === "dark");
  vnRoot.classList.toggle("vn-dark", dark);
  vnRoot.classList.toggle("vn-dark-quiet", dark && !(spoken.text || "").trim() && vnState.phase === "line");

  const who = vnState.who || "";

  name.hidden =! who;
  name.textContent = who ? vnCast(vnState.story,who).name || who : "";
  text.textContent = spoken && spoken.text || "";

  const choosing = vnState.phase === "choose", ended = vnState.phase === "end";

  next.hidden = choosing;
  next.textContent = ended ? "닫기" : "다음";
  next.onclick = ended ? vnClose : vnAdvance;
  choices.hidden =! choosing;
  choices.replaceChildren();

  if (choosing && n) n.choose.forEach ( ch => { 
    if (!ch || !ch.label) return;
    const b = elT("button", "vn-choice", ch.label);
    b.type = "button";
    b.onclick = () => vnPick(ch.next);
    choices.appendChild(b) }
  );

  const focus = choosing ? choices.querySelector("button") : next;

  if (focus) focus.focus()
}

/* opt.onClose: 창을 닫은 뒤(다 읽거나 X·Esc) 한 번 호출. */
function vnOpen (story, opt) {
  if (!story || !story.nodes || !story.start) return;
  const opener = document.activeElement;
  vnClose(true);
  vnOnClose = opt && typeof opt.onClose === "function" ? opt.onClose : null;
  vnBack = opener && opener !== document.body ? opener : null;
  vnPreStory(story);
  vnState = {
    story, node: story.start, line : 0, phase : "line", who : ""};
    vnLand();

    const root = elT("div", "vn-float");

    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", story.title || "이야기");

    root.addEventListener("keydown", e => {
      // 추가됨: 버튼 포커스 시 키보드 이벤트 무시 (Double skip 방지)
      if (e.target.tagName === 'BUTTON') return;

      if (e.key === "Escape") {
          e.preventDefault();
          vnClose();
          return
        }
        if (vnState && vnState.phase === "choose") return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if(vnState&&vnState.phase === "end") vnClose(); else vnAdvance()
          }
        }
      );

    root.addEventListener("click", e => {
      if (e.target.closest("button")) return;
      if(!vnState)return;if(vnState.phase==="end"){vnClose();return}if(vnState.phase!=="line")return;vnAdvance()});
      const col = elT("div", "vn-col"), stage = elT("div", "vn-stage"), stand = elT("div", "vn-stand"), x = elT("button", "vn-x", "닫기");
      x.type = "button";
      x.setAttribute("aria-label", "이야기 닫기");
      x.onclick = vnClose;
      const box = elT("div", "vn-box"), name = elT("p", "vn-name"), text = elT("p","vn-text"), row = elT("div", "vn-row"), next = elT("button", "vn-next", "다음");
      next.type = "button";
      const choices = elT("div", "vn-choices");
      stage.appendChild(stand);
      row.appendChild(next);
      box.append(name, text, choices, row);
      col.append(stage, box);
      root.append(x, col);
      document.body.appendChild(root);
      document.body.classList.add("vn-open");
      vnRoot = root;vnPaint()
}
