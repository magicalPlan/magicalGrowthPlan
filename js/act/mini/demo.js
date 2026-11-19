/* 특별 의뢰 › 플랜더스의 밑그림 (선 따라 그리기 미니게임).
   목록: data/act/special-list.js 의 {id:"demo", path:"minigame1", src:"js/act/mini/demo.js"}.
   이 파일은 미니게임 화면(#v-mini)에 들어온 뒤에만 js/act/special.js 의 spMiniLoad 가 불러온다.
   불러오면 SP_MINI.demo = {mount(root,g)} 를 등록하고, specialPlay 가 mount 를 부른다.

   ── 규칙 ───────────────────────────────────────────────
   · 1분 동안 흐릿한 안내선(밑그림)을 따라 그린다. 잘 따라 그리면 1장 완성, 다음 선이 나온다.
   · 시간이 지날수록 어려워진다: 선이 꺾이고 휘고, 안내선이 옅어지고, 허용 오차가 줄어든다.
   · 시간·난이도 단계·완성 기준·미리 그려 둔 밑그림(shapes)은 data/act/mini/flanders.js 의 MG_FLANDERS.
     그 파일이 없으면 아래 MG_DEF(무작위 선만)로 돈다.
   · 서버 통신은 두 번뿐이다.
     ① 1분이 끝났을 때 한 번만 PATCH(덮어쓰기 아님, increment):
        {path}/rank/{uid} = { n: 이름, c: +완성 개수 }   (path 기본 event_minigame/flanders)
        {path}/total_amount = +완성 개수
     ② 결과 화면·'랭킹 보기' 버튼을 눌렀을 때 랭킹 한 번 읽기(rank 를 c 순서로 상위 top 명).
   · 게임 중 다른 화면으로 나가면(curView 가 mini 가 아니거나 주소가 바뀌면) 그 판은 버리고,
     서버에 아무것도 보내지 않는다. 그림(이미지)은 저장하지 않는다.
   · DB 규칙: {path} 에 읽기·쓰기 규칙과 rank 의 .indexOn ["c"] 가 필요하다.
   ─────────────────────────────────────────────────────── */
var SP_MINI = window.SP_MINI || (window.SP_MINI = {});
(() => {
 const MG_W = 600;                  // 캔버스 내부 좌표 크기(정사각형). 데이터의 tol 도 이 크기 기준.
 /* 데이터 파일이 없을 때 쓰는 기본값(무작위 선만). 실제 값은 data/act/mini/flanders.js */
 const MG_DEF = { sec: 60, path: "event_minigame/flanders", top: 10, pass: { cover: .82, acc: .72 },
  levels: [{ at: 0, tol: 30, alpha: .42, pick: ["line"] }, { at: 10, tol: 26, alpha: .36, pick: ["bend"] }, { at: 22, tol: 22, alpha: .30, pick: ["curve"] }, { at: 34, tol: 19, alpha: .24, pick: ["zig"] }, { at: 46, tol: 16, alpha: .18, pick: ["wave"] }],
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

 const rnd = (a, b) => a + Math.random() * (b - a);
 const lvAt = sec => { let L = 0; MG_LV.forEach((x, i) => { if (sec >= x.at) L = i }); return L };

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

 /* 지금 화면이 이 미니게임인지. 아니면 판을 버린다(서버 통신 없음). */
 function here(token) {
  return st && st.token === token && typeof curView !== "undefined" && curView === "mini" && typeof spCur !== "undefined" && spCur && spCur.id === "demo"
 }

 function el(tag, cls, tx) { return typeof elT === "function" ? elT(tag, cls, tx) : Object.assign(document.createElement(tag), { className: cls || "", textContent: tx == null ? "" : tx }) }

 /* ───────── 화면 ───────── */
 function mount(root) {
  stop();
  root.innerHTML = "";
  root.classList.add("mg-root");
  const intro = el("div", "mg-intro");
  intro.append(
   el("p", "mg-lead", "흐릿한 밑그림 선을 따라 그려 그림을 완성하자. 1분 동안 최대한 많이!"),
   (() => { const u = el("ul", "mg-rules");
    ["안내선을 따라 한 번에 쭉 그린다. 잘 따라 그리면 다음 선이 나온다.", "시간이 지날수록 선이 꺾이고 휘며, 안내선도 점점 옅어진다.", "1분이 끝나면 완성한 개수가 랭킹에 더해진다. 도중에 화면을 나가면 그 판은 기록되지 않는다."].forEach(t => u.appendChild(el("li", "", t)));
    return u })()
  );
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

 function start(root) {
  stop();
  root.innerHTML = "";
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

  st = { token, t0: performance.now(), count: 0, L: 0, guide: null, drawn: [], down: false, flash: 0, flashOk: false, raf: 0, dead: false, ended: false };
  const next = () => { st.guide = makeLine(pickKind(st.L)); st.drawn = [] };
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
   if (r.ok) { st.count++; cnt.textContent = "완성 " + st.count; say.textContent = ["좋아! 다음 선.", "깔끔해!", "네로도 감탄할 솜씨!", "그대로 계속!"][st.count % 4]; st.flash = performance.now(); st.flashOk = true; next() }
   else { say.textContent = r.cover < PASS_COVER ? "선을 끝까지 따라가 보자. (" + Math.round(r.cover * 100) + "%)" : "조금 더 선 가까이! (" + Math.round(r.acc * 100) + "%)"; st.flash = performance.now(); st.flashOk = false; st.drawn = [] }
  };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);

  const draw = now => {
   if (!st || st.token !== token || st.dead) return;
   if (!here(token)) { stop(); return }   // 다른 화면으로 나감 → 판 버림, 통신 없음
   const sec = (now - st.t0) / 1000, left = Math.max(0, MG_SEC - sec);
   const L = lvAt(sec);
   if (L !== st.L) { st.L = L; lv.textContent = (L + 1) + "단계"; if (!st.down) next() }
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

 /* 1분 끝: 한 번만 기록을 보낸다. */
 async function finish(root, token) {
  if (!st || st.token !== token || st.ended) return;
  st.ended = true;
  const n = st.count;
  root.innerHTML = "";
  const res = el("div", "mg-result");
  res.append(el("p", "mg-res-k", "시간 종료!"), el("p", "mg-res-n", n + "장"), el("p", "hint mg-res-tx", n ? "밑그림 " + n + "장을 완성했다." : "이번에는 한 장도 완성하지 못했다."));
  const msg = el("p", "hint mg-send", n ? "기록을 남기는 중…" : "");
  res.appendChild(msg);
  const btns = el("div", "mg-btns");
  const again = el("button", "btn mg-go", "한 번 더"); again.type = "button"; again.onclick = () => start(root);
  const rk = el("button", "btn g mg-rk-btn", "랭킹 보기"); rk.type = "button"; rk.onclick = () => showRank(root, null);
  btns.append(again, rk); res.appendChild(btns);
  root.append(res, el("div", "mg-rank-box"));
  st = null;

  if (!n) return;
  if (typeof DB === "undefined" || !DB || typeof LOCAL !== "undefined" && LOCAL || !UID || typeof C === "undefined" || !C) { msg.textContent = "서버에 연결되어 있지 않아 기록을 남기지 못했다."; return }
  /* 덮어쓰기 없이 한 번에: 이름은 칸 하나만 PATCH, 개수와 합계는 서버 increment. 다른 계정 정보는 넣지 않는다. */
  const nm = typeof nmOf === "function" ? nmOf() : String(C.n || "").slice(0, 20);
  const body = {};
  body["rank/" + UID + "/n"] = nm;
  body["rank/" + UID + "/c"] = { ".sv": { increment: n } };
  body["total_amount"] = { ".sv": { increment: n } };
  try {
   await DB.doc(MG_PATH).patch(body);
   msg.textContent = "기록을 남겼다! 랭킹에 " + n + "장이 더해졌다.";
   showRank(root, n)
  } catch (e) { msg.textContent = "기록을 남기지 못했다. (" + (e && e.message || "오류") + ")" }
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
   const h = el("div", "mg-rank-h"); h.append(el("b", "", "🎨 따라 그리기 랭킹"), el("span", "mg-total", "모두 합쳐 " + tot.toLocaleString() + "장"));
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

 SP_MINI.demo = { mount, stop };
})();
