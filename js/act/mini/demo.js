/* 특별 의뢰 › 플랜더스의 밑그림 (선 따라 그리기 미니게임).
   목록: data/act/special-list.js 의 {id:"flanders", path:"minigame1", src:"js/act/mini/demo.js"}.
   이 파일은 미니게임 화면(#v-mini)에 들어온 뒤에만 js/act/special.js 의 spMiniLoad 가 불러온다.
   불러오면 SP_MINI.flanders = {mount(root,g), stop()} 를 등록하고, specialPlay 가 mount 를 부른다.
   이탈 시 special.js 의 spMiniStop() → stop(). here() 는 st.gameId===spCur.id 로만 판별(id 하드코딩 금지).

   ── 규칙 ───────────────────────────────────────────────
   · 1분 동안 흐릿한 안내선(밑그림)을 따라 그린다. 잘 따라 그리면 1장 완성, 다음 선이 나온다.
   · 완성 장수가 늘수록 어려워진다(3·6·9·10번째 장부터 단계 상승). 선이 복잡해지고 안내선이 옅어지며 허용 오차가 줄어든다.
   · 장수·난이도 단계·완성 기준·미리 그려 둔 밑그림(shapes)은 data/act/mini/flanders.js 의 MG_FLANDERS.
     그 파일이 없으면 아래 MG_DEF(무작위 선만)로 돈다. 단계는 next() 때만 바뀌고, 그리던 장을 도중에 바꾸지 않는다.
   · 서버 통신(기록용)은 시작·종료·랭킹 읽기뿐이다. rank·total_amount 는 클라가 직접 쓰지 않는다.
     ① 그리기 시작: play/{uid}={ts} 쓰기를 await 한 뒤에만 타이머 시작(실패면 시작 안 함).
     ② 1분 종료·완성>0: 결과·장수는 바로 두고, go 제출은 백그라운드. 「한 번 더」는 확정될 때까지 비활성.
     ③ 결과·'랭킹 보기': rank 는 한 판(60초) 최고 장수, total_amount 는 모두 합산.
   · 게임 중 다른 화면으로 나가면(curView 가 mini 가 아니거나 주소가 바뀌면) 그 판은 버리고,
     go 제출을 하지 않는다. 그림(이미지)은 저장하지 않는다.
   · DB 규칙: scripts/event-minigame-rules-fragment.txt (rank·total_amount 클라 쓰기 금지, rank .indexOn c).
   ─────────────────────────────────────────────────────── */
var SP_MINI = window.SP_MINI || (window.SP_MINI = {});
(() => {
 const MG_W = 600;                  // 캔버스 내부 좌표 크기(정사각형). 데이터의 tol 도 이 크기 기준.
 /* 데이터 파일이 없을 때 쓰는 기본값(무작위 선만). 실제 값은 data/act/mini/flanders.js */
 const MG_DEF = { sec: 60, path: "event_minigame/flanders", top: 10, pass: { cover: .82, acc: .72 },
  levels: [{ at: 0, tol: 30, alpha: .42, pick: ["line"] }, { at: 3, tol: 26, alpha: .36, pick: ["bend"] }, { at: 6, tol: 22, alpha: .30, pick: ["curve"] }, { at: 9, tol: 19, alpha: .24, pick: ["zig"] }, { at: 10, tol: 16, alpha: .18, pick: ["wave"] }],
  shapes: {} };
 const MG = (() => { const d = typeof MG_FLANDERS !== "undefined" && MG_FLANDERS && typeof MG_FLANDERS === "object" ? MG_FLANDERS : {};
  const lv = Array.isArray(d.levels) && d.levels.length ? d.levels.filter(x => x && Array.isArray(x.pick) && x.pick.length).sort((a, b) => (a.at || 0) - (b.at || 0)) : MG_DEF.levels;
  return { sec: Math.max(5, Number(d.sec) || MG_DEF.sec), path: String(d.path || MG_DEF.path), top: Math.max(1, Number(d.top) || MG_DEF.top),
   pass: { cover: Number(d.pass && d.pass.cover) || MG_DEF.pass.cover, acc: Number(d.pass && d.pass.acc) || MG_DEF.pass.acc },
   levels: lv.length ? lv : MG_DEF.levels, shapes: d.shapes && typeof d.shapes === "object" ? d.shapes : {} } })();
 const MG_SEC = MG.sec, MG_PATH = MG.path, MG_TOP = MG.top, MG_LV = MG.levels;
 const PASS_COVER = MG.pass.cover, PASS_ACC = MG.pass.acc;
 const GEN = { line: 1, bend: 1, curve: 1, zig: 1, wave: 1 };   // 코드로 만드는 무작위 선 이름

 let st = null;   // 지금 판의 상태. 판이 끝나거나 버려지면 null.
 let mgId = "flanders"; // mount(g) 때 SPECIAL_GAMES.id 와 맞춤. here()·SP_MINI 키.
 let mgG = null;        // 마지막 mount 의 g. 시작 실패 시 인트로로 돌릴 때 씀.

 const rnd = (a, b) => a + Math.random() * (b - a);
 /* n = 지금 그릴 장 번호(1부터). levels[].at 이상이면 그 단계. */
 const lvAt = n => { let L = 0; MG_LV.forEach((x, i) => { if (n >= x.at) L = i }); return L };

 /* 안내선 점 목록. 4px 간격으로 고르게 다시 뽑는다. */
 function resample(pts, gap) {
  const out = [pts[0]]; let carry = 0;
  for (let i = 1; i < pts.length; i++) {
   const a = pts[i - 1], b = pts[i], d = Math.hypot(b.x - a.x, b.y - a.y);
   let t = gap - carry;
   while (t <= d) { out.push({ x: a.x + (b.x - a.x) * t / d, y: a.y + (b.y - a.y) * t / d }); t += gap }
   carry = d - (t - gap);
  }
  const last = pts[pts.length - 1]; out.push(last); return out
 }
 function bez(p0, p1, p2, p3, n) {
  const o = [];
  for (let i = 0; i <= n; i++) {
   const t = i / n, u = 1 - t;
   o.push({ x: u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x, y: u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y })
  }
  return o
 }
 /* 미리 그려 둔 밑그림(0~1 좌표)을 판 위에 놓는다. 크기를 조금 바꾸고, 절반은 좌우를 뒤집는다. */
 function placeShape(raw) {
  const m = 60, span = MG_W - 2 * m, s = rnd(.82, 1), flip = Math.random() < .5;
  const dx = rnd(-(1 - s) / 2, (1 - s) / 2), dy = rnd(-(1 - s) / 2, (1 - s) / 2);
  return raw.filter(p => Array.isArray(p) && p.length >= 2 && isFinite(p[0]) && isFinite(p[1]))
   .map(([x, y]) => { const u = flip ? 1 - Number(x) : Number(x); return { x: m + span * ((u - .5) * s + .5 + dx), y: m + span * ((Number(y) - .5) * s + .5 + dy) } })
 }
 /* 이 단계에서 나올 선 하나를 고른다. 바로 앞과 같은 것은 되도록 피한다. */
 let lastPick = "";
 function pickKind(L) {
  const ok = (MG_LV[L].pick || []).filter(k => GEN[k] || (Array.isArray(MG.shapes[k]) && MG.shapes[k].length >= 2));
  if (!ok.length) return "line";
  const pool = ok.length > 1 ? ok.filter(k => k !== lastPick) : ok;
  return lastPick = pool[Math.floor(Math.random() * pool.length)]
 }
 function makeLine(kind) {
  const m = 70, R = () => ({ x: rnd(m, MG_W - m), y: rnd(m, MG_W - m) });
  let pts;
  if (!GEN[kind] && Array.isArray(MG.shapes[kind])) {
   pts = placeShape(MG.shapes[kind]);
   if (pts.length < 2) pts = [{ x: m, y: MG_W / 2 }, { x: MG_W - m, y: MG_W / 2 }]
  } else if (kind === "line") {
   let a, b; do { a = R(); b = R() } while (Math.hypot(a.x - b.x, a.y - b.y) < 260);
   pts = [a, b]
  } else if (kind === "bend") {
   let a, b, c; do { a = R(); b = R(); c = R() } while (Math.hypot(a.x - b.x, a.y - b.y) < 180 || Math.hypot(b.x - c.x, b.y - c.y) < 180);
   pts = [a, b, c]
  } else if (kind === "curve") {
   let a, d; do { a = R(); d = R() } while (Math.hypot(a.x - d.x, a.y - d.y) < 280);
   pts = bez(a, R(), R(), d, 60)
  } else if (kind === "zig") {
   const n = 4 + Math.floor(Math.random() * 2), hor = Math.random() < .5; pts = [];
   for (let i = 0; i < n; i++) {
    const t = m + (MG_W - 2 * m) * i / (n - 1), s = rnd(m, MG_W - m);
    pts.push(hor ? { x: t, y: i % 2 ? rnd(m, MG_W / 2) : rnd(MG_W / 2, MG_W - m) } : { x: i % 2 ? rnd(m, MG_W / 2) : rnd(MG_W / 2, MG_W - m), y: t });
    void s
   }
  } else {
   /* 물결: 가로나 세로로 지나가는 사인 곡선 */
   const hor = Math.random() < .5, amp = rnd(60, 110), waves = rnd(1.5, 2.6), ph = rnd(0, Math.PI * 2), mid = rnd(220, MG_W - 220);
   pts = [];
   for (let i = 0; i <= 80; i++) {
    const t = m + (MG_W - 2 * m) * i / 80, w = mid + Math.sin(i / 80 * waves * Math.PI * 2 + ph) * amp;
    pts.push(hor ? { x: t, y: w } : { x: w, y: t })
   }
  }
  if (Math.random() < .5) pts.reverse();
  return resample(pts, 4)
 }

 /* 판정: 안내선 점마다 그린 선이 가까이 지나갔는지(덮은 비율), 그린 점마다 안내선 가까이 있는지(정확도). */
 function judge(guide, drawn, tol) {
  if (drawn.length < 4) return { ok: false, cover: 0, acc: 0 };
  const d = resample(drawn, 4), t2 = tol * tol;
  const near = (p, arr) => { for (let i = 0; i < arr.length; i++) { const dx = arr[i].x - p.x, dy = arr[i].y - p.y; if (dx * dx + dy * dy <= t2) return true } return false };
  let hit = 0; guide.forEach(p => { if (near(p, d)) hit++ });
  let on = 0; d.forEach(p => { if (near(p, guide)) on++ });
  const cover = hit / guide.length, acc = on / d.length;
  return { ok: cover >= PASS_COVER && acc >= PASS_ACC, cover, acc }
 }

 /* 지금 화면이 이 미니게임인지. 아니면 판을 버린다(서버 통신 없음). id 는 mount 때 받은 g.id. */
 function here(token) {
  return st && st.token === token && st.gameId === mgId && typeof curView !== "undefined" && curView === "mini" && typeof spCur !== "undefined" && spCur && spCur.id === st.gameId
 }

 function el(tag, cls, tx) { return typeof elT === "function" ? elT(tag, cls, tx) : Object.assign(document.createElement(tag), { className: cls || "", textContent: tx == null ? "" : tx }) }

 /* ───────── 화면 ───────── */
 function mount(root, g, note) {
  mgId = String((g && g.id) || mgId || "flanders");
  mgG = g || mgG || {id: mgId};
  stop();
  root.innerHTML = "";
  root.classList.add("mg-root");
  const intro = el("div", "mg-intro");
  /* 시작 전 미리보기만. assets/mini_game_preview/{id}.png — 게임 중·결과 화면에는 안 붙인다. */
  const prev = document.createElement("img");
  prev.className = "mg-preview";
  prev.src = "assets/mini_game_preview/" + mgId + ".png" + (typeof APP_VER !== "undefined" ? "?v=" + APP_VER : "");
  prev.alt = "";
  prev.decoding = "async";
  prev.onerror = () => { try { prev.remove() } catch (e) {} };
  intro.append(
   prev,
   el("p", "mg-lead", "흐릿한 밑그림 선을 따라 그려 그림을 완성하자. 1분 동안 최대한 많이!"),
   (() => { const u = el("ul", "mg-rules");
    ["안내선을 따라 한 번에 쭉 그린다. 잘 따라 그리면 다음 선이 나온다.", "장을 많이 완성할수록 선이 복잡해지고, 안내선도 점점 옅어진다.", "1분이 끝나면 그 판의 장수가 최고 기록이면 랭킹에 오른다. 도중에 화면을 나가면 그 판은 기록되지 않는다."].forEach(t => u.appendChild(el("li", "", t)));
    return u })()
  );
  if (note) intro.appendChild(el("p", "hint mg-send", String(note)));
  const btns = el("div", "mg-btns");
  const go = el("button", "btn mg-go", "그리기 시작"); go.type = "button"; go.onclick = () => start(root);
  const rk = el("button", "btn g mg-rk-btn", "랭킹 보기"); rk.type = "button"; rk.onclick = () => showRank(root, null);
  btns.append(go, rk);
  intro.appendChild(btns);
  root.appendChild(intro);
  root.appendChild(el("div", "mg-rank-box"));
 }

 function stop() {
  if (st) { st.dead = true; if (st.raf) cancelAnimationFrame(st.raf) }
  st = null
 }

 /* go/{uid}/{reqId} 에 done 이 올 때까지 짧게 묻는다(출정 pexWait 과 같은 방식). */
 async function mgWait(path, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
   try { const s = await DB.doc(path).get(), v = s.exists ? s.data() : null; if (v && v.done) return v } catch (e) {}
   await new Promise(r => setTimeout(r, 400))
  }
  return null
 }
 /* 그리기 시작 세션. 성공해야 타이머를 돌린다. LOCAL·비로그인은 기록 없이 true. */
 async function mgPlayStamp() {
  if (typeof DB === "undefined" || !DB || typeof LOCAL !== "undefined" && LOCAL || !UID) return true
  await DB.doc(MG_PATH + "/play/" + UID).set({ts: Date.now()})
  return true
 }

 async function start(root) {
  stop();
  root.innerHTML = "";
  root.classList.add("mg-root");
  root.appendChild(el("p", "hint mg-send", "준비 중…"));
  try {
   await mgPlayStamp()
  } catch (e) {
   if (!root.isConnected) return
   mount(root, mgG, "세션을 만들지 못했다. 연결을 확인한 뒤 다시 시작해 보자.")
   return
  }
  if (!root.isConnected) return
  if (typeof curView !== "undefined" && curView !== "mini") return

  root.innerHTML = "";
  root.classList.add("mg-root");
  const token = Date.now() + "_" + Math.random();
  const hud = el("div", "mg-hud");
  const tm = el("b", "mg-time", MG_SEC + "초"), cnt = el("b", "mg-cnt", "완성 0"), lv = el("span", "mg-lv", "1단계");
  hud.append(tm, lv, cnt);
  const bar = el("div", "bar mg-bar"), fill = el("i"); fill.style.width = "100%"; bar.appendChild(fill);
  const wrap = el("div", "mg-cv-wrap");
  const cv = document.createElement("canvas"); cv.className = "mg-cv"; cv.setAttribute("aria-label", "따라 그리기 판");
  const say = el("p", "mg-say", "안내선을 따라 그려 보자.");
  wrap.appendChild(cv);
  root.append(hud, bar, wrap, say);

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = MG_W * dpr; cv.height = MG_W * dpr;
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  st = { token, gameId: mgId, t0: performance.now(), count: 0, L: 0, guide: null, drawn: [], down: false, flash: 0, flashOk: false, raf: 0, dead: false, ended: false };
  /* 장 번호 = 완성한 수 + 1. 단계는 여기서만 올리고, 그리던 장을 도중에 바꾸지 않는다. */
  const next = () => {
   st.L = lvAt(st.count + 1);
   lv.textContent = (st.L + 1) + "단계";
   st.guide = makeLine(pickKind(st.L));
   st.drawn = []
  };
  next();

  const css = getComputedStyle(document.documentElement);
  const ink = (css.getPropertyValue("--ink") || "#eee").trim() || "#eee";
  const hi = (css.getPropertyValue("--gold") || css.getPropertyValue("--hi") || "#c9a96a").trim() || "#c9a96a";

  const pos = ev => { const r = cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) / r.width * MG_W, y: (ev.clientY - r.top) / r.height * MG_W } };
  cv.addEventListener("pointerdown", ev => { if (!here(token) || st.ended) return; ev.preventDefault(); try { cv.setPointerCapture(ev.pointerId) } catch (e) {} st.down = true; st.drawn = [pos(ev)] });
  cv.addEventListener("pointermove", ev => { if (!st || st.token !== token || !st.down) return; ev.preventDefault(); const p = pos(ev), l = st.drawn[st.drawn.length - 1]; if (!l || Math.hypot(p.x - l.x, p.y - l.y) > 2) st.drawn.push(p) });
  const up = ev => {
   if (!st || st.token !== token || !st.down) return; st.down = false; if (st.ended) return;
   const r = judge(st.guide, st.drawn, MG_LV[st.L].tol);
  if (r.ok) {
    st.count++;
    cnt.textContent = "완성 " + st.count; 
    say.textContent = ["좋아! 다음 선.", "깔끔해!", "네로도 감탄할 솜씨!", "그대로 계속!"][st.count % 4];
    st.flash = performance.now();
    st.flashOk = true; next()
  } else {
    say.textContent = r.cover < PASS_COVER ? "선을 끝까지 따라가 보자. (" + Math.round(r.cover * 100) + "%)" : "조금 더 선 가까이! (" + Math.round(r.acc * 100) + "%)"; st.flash = performance.now(); st.flashOk = false; st.drawn = [] }
  };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);

  const draw = now => {
   if (!st || st.token !== token || st.dead) return;
   if (!here(token)) { stop(); return }   // 다른 화면으로 나감 → 판 버림, 통신 없음
   const sec = (now - st.t0) / 1000, left = Math.max(0, MG_SEC - sec);
   tm.textContent = Math.ceil(left) + "초"; fill.style.width = (left / MG_SEC * 100) + "%";
   tm.classList.toggle("warn", left <= 10);

   ctx.clearRect(0, 0, MG_W, MG_W);
   const g = st.guide, lvCfg = MG_LV[st.L];
   if (g && g.length) {
    /* 안내선: 허용 폭만큼 옅은 띠 + 가운데 점선 */
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.globalAlpha = lvCfg.alpha * .45; ctx.strokeStyle = hi; ctx.lineWidth = lvCfg.tol * 1.2;
    ctx.beginPath(); g.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
    ctx.globalAlpha = lvCfg.alpha; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
    ctx.beginPath(); g.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
    ctx.setLineDash([]);
    /* 시작점·끝점 */
    ctx.globalAlpha = Math.min(1, lvCfg.alpha + .35);
    ctx.fillStyle = hi; ctx.beginPath(); ctx.arc(g[0].x, g[0].y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = hi; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(g[g.length - 1].x, g[g.length - 1].y, 9, 0, Math.PI * 2); ctx.stroke();
   }
   if (st.drawn.length > 1) {
    ctx.globalAlpha = 1; ctx.strokeStyle = ink; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); st.drawn.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
   }
   const fa = 1 - (now - st.flash) / 350;
   if (st.flash && fa > 0) { ctx.globalAlpha = fa * .18; ctx.fillStyle = st.flashOk ? "#5fd08a" : "#e05a5a"; ctx.fillRect(0, 0, MG_W, MG_W) }
   ctx.globalAlpha = 1;

   if (left <= 0) { finish(root, token); return }
   st.raf = requestAnimationFrame(draw)
  };
  st.raf = requestAnimationFrame(draw)
 }

 /* 1분 끝: 결과·장수는 바로, 「한 번 더」는 저장 확정까지 잠금. */
 function finish(root, token) {
  if (!st || st.token !== token || st.ended) return;
  st.ended = true;
  const n = st.count;
  root.innerHTML = "";
  const res = el("div", "mg-result");
  res.append(el("p", "mg-res-k", "시간 종료!"), el("p", "mg-res-n", n + "장"), el("p", "hint mg-res-tx", n ? "밑그림 " + n + "장을 완성했다." : "이번에는 한 장도 완성하지 못했다."));
  const msg = el("p", "hint mg-send", n ? "저장 중…" : "");
  res.appendChild(msg);
  const btns = el("div", "mg-btns");
  const again = el("button", "btn mg-go", "한 번 더"); again.type = "button"; again.onclick = () => start(root);
  const rk = el("button", "btn g mg-rk-btn", "랭킹 보기"); rk.type = "button"; rk.onclick = () => showRank(root, null);
  btns.append(again, rk); res.appendChild(btns);
  root.append(res, el("div", "mg-rank-box"));
  st = null;

  /* 한 판 플레이(완성 0이어도) → stats.mgFlanders 횟수.
     1회: 칭호「플랜더스의」+ dialog 닫으면 flanders-side → 허브. 100회: 「그림쟁이」. */
  try {
   if (typeof C !== "undefined" && C) {
    C.stats = C.stats || {};
    C.stats.mgFlanders = Math.min(1e6, (Number(C.stats.mgFlanders) || 0) + 1);
    let fresh = [];
    try { if (typeof checkTitles === "function") fresh = checkTitles() || [] } catch (e) {}
    const gotFirst = fresh.some(t => t && t[0] === "flanders_mg");
    /* 칭호가 있으면 세계관 탭에 flanders-side 가 열린 것처럼 story_flag 를 켠다. */
    try { if (typeof flandersSideUnlock === "function") flandersSideUnlock(false) } catch (e) {}
    if (gotFirst && typeof alertBox === "function") {
     setTimeout(() => {
      alertBox("✦ 새 칭호", "「플랜더스의」\n특별 의뢰 '플랜더스의 밑그림'을 그려 보았다.\n\n칭호 보관함에서 장착할 수 있다.", () => {
       const goHub = () => { try { if (typeof hub === "function") hub() } catch (e) {} };
       if (typeof storyLoad !== "function" || typeof vnOpen !== "function") { goHub(); return }
       storyLoad().then(book => {
        const list = Array.isArray(book && book.shards) ? book.shards : [];
        const story = list.find(s => s && s.id === "flanders-side");
        if (!story || !story.start) { goHub(); return }
        vnOpen(story, { onClose: goHub })
       }).catch(goHub)
      });
      try { ding() } catch (e) {}
     }, 300)
    }
    if (typeof save === "function") save()
   }
  } catch (e) {}

  if (!n) return;
  if (typeof DB === "undefined" || !DB || typeof LOCAL !== "undefined" && LOCAL || !UID || typeof C === "undefined" || !C) { msg.textContent = "서버에 연결되어 있지 않아 기록을 남기지 못했다."; return }
  /* rank·total_amount 는 클라가 쓰지 않는다. go 확정 전엔 재시작 잠금(play 덮어쓰기 방지). */
  again.disabled = true;
  const nm = typeof nmOf === "function" ? nmOf() : String(C.n || "").slice(0, 20);
  const c = Math.max(0, Math.min(40, Math.floor(Number(n) || 0)));
  const reqId = Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  const goPath = MG_PATH + "/go/" + UID + "/" + reqId;
  const stillHere = () => !!(msg.isConnected && root.isConnected);
  (async () => {
   const fail = (head, detail) => {
    const d = String(detail || "").replace(/\s+/g, " ").trim();
    msg.textContent = d ? head + " [" + d + "]" : head
   };
   try {
    await DB.doc(goPath).set({c, n: String(nm || "?").slice(0, 20), ts: Date.now()});
    const out = await mgWait(goPath, 25000);
    if (!stillHere()) return;
    if (!out) { fail("확정이 늦다. 잠시 뒤 랭킹에서 확인해 보자.", "timeout 25s · " + goPath); return }
    if (!out.ok) {
     const why = String(out.why || "");
     const err = String(out.err || "");
     const head = why === "early" ? "너무 빨리 제출되어 기록을 받지 않았다."
      : why === "late" ? "세션이 만료되어 기록을 받지 않았다."
      : why === "nosession" ? "시작 세션이 없어 기록을 받지 않았다."
      : why === "dup" ? "이미 처리된 판이라 기록을 받지 않았다."
      : why === "busy" ? "세션 잠금에 실패했다."
      : why === "bad" ? "제출 값이 올바르지 않다."
      : why === "err" ? "서버 처리 중 오류가 났다."
      : "기록을 남기지 못했다.";
     fail(head, "why=" + (why || "?") + (err ? " · " + err : "") + " · c=" + c + " · req=" + reqId);
     return
    }
    const got = Math.max(0, Math.floor(Number(out.c) || c));
    const run = Math.max(0, Math.floor(Number(out.run) || c));
    msg.textContent = out.best ? ("신기록! 최고 " + got + "장.") : ("이번 " + run + "장. 최고 기록은 " + got + "장.");
    showRank(root, got)
   } catch (e) {
    if (stillHere()) fail("기록을 남기지 못했다.", (e && e.message || "오류") + " · " + goPath)
   } finally {
    if (stillHere()) again.disabled = false
   }
  })()
 }

 /* 랭킹: 버튼을 누르거나 기록을 남긴 뒤에만 한 번 읽는다. */
 async function showRank(root, justAdded) {
  const box = root.querySelector(".mg-rank-box"); if (!box) return;
  if (typeof DB === "undefined" || !DB || typeof LOCAL !== "undefined" && LOCAL) { box.innerHTML = ""; box.appendChild(el("p", "hint", "서버에 연결되어 있지 않아 랭킹을 볼 수 없다.")); return }
  box.innerHTML = ""; box.appendChild(el("p", "hint", "랭킹을 불러오는 중…"));
  try {
   const [snap, tot] = await Promise.all([
    DB.collection(MG_PATH + "/rank").by("c").limit(MG_TOP).grab(),
    DB.doc(MG_PATH + "/total_amount").get().then(s => s.exists ? Number(s.data()) || 0 : 0).catch(() => 0)
   ]);
   if (!root.isConnected) return;
   const rows = (snap.docs || []).map(d => { const v = d.data() || {}; return { u: d.id, n: String(v.n || "?"), c: Math.max(0, Number(v.c) || 0) } }).sort((a, b) => b.c - a.c);
   box.innerHTML = "";
   const card = el("div", "mg-rank");
   const h = el("div", "mg-rank-h"); h.append(el("b", "", "🎨 한 판 최고 랭킹"), el("span", "mg-total", "모두 합쳐 " + tot.toLocaleString() + "장"));
   card.appendChild(h);
   if (!rows.length) card.appendChild(el("p", "hint", "아직 기록이 없다. 첫 번째 화가가 되어 보자!"));
   else {
    const ol = el("ol", "mg-rank-list");
    rows.forEach((r, i) => {
     const li = el("li", "mg-rank-row" + (r.u === UID ? " me" : ""));
     li.append(el("span", "mg-rank-no", ["🥇", "🥈", "🥉"][i] || String(i + 1)), el("span", "mg-rank-nm", typeof cn === "function" ? cn(r.u, r.n) : r.n), el("b", "mg-rank-c", r.c.toLocaleString() + "장"));
     ol.appendChild(li)
    });
    card.appendChild(ol);
    if (!rows.some(r => r.u === UID)) card.appendChild(el("p", "hint mg-rank-me", "내 기록은 아직 " + MG_TOP + "위 안에 없다."));
   }
   box.appendChild(card)
  } catch (e) { if (root.isConnected) { box.innerHTML = ""; box.appendChild(el("p", "hint", "랭킹을 불러오지 못했다.")) } }
 }

 SP_MINI.flanders = { mount, stop };
})();
