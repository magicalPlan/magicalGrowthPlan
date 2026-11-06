/* 매지컬 마치 1차 서버 지급: 골드·경험·cl·prog 만 accounts 에 증분한다.
   원장: rooms/xr{s}_{i}/pay/{uid}. 펫·시설·재해·각인 배율은 넣지 않는다(클라 settle 잔여와 어긋날 수 있음).
   배포: 신클라(pay 있으면 경제 skip) 먼저 → 이 Functions. 구클라는 pay 를 무시해 이중 지급될 수 있다. */
const XP_BASE = 40, XP_STEP = 10, XP_BEND = 20, XP_BEND_DIV = 4;
const SOLO_M = 1, SOLO_RW_G = 40;
const PARTY_M = [0, .6, .7, .8, .87, .93, .97, 1];
const VL_X = {A: 1.15, B: 1, C: 1, D: 1.3};

function xpSqSum(m) {
  m = Math.floor(Number(m) || 0);
  if (m <= 0) return 0;
  return Math.round((m * (m + 1) * (2 * m + 1) / 6 - ((m + 1) >> 1)) / 4);
}
function xpAt(lv) {
  const n = Math.max(1, Number(lv) || 1) - 1;
  const lin = XP_BASE * n + XP_STEP * n * (n - 1) / 2;
  const bend = XP_BEND, div = XP_BEND_DIV, m = n - bend;
  if (!(m > 0)) return lin;
  if (div === 4) return lin + xpSqSum(m);
  let s = 0;
  for (let i = 1; i <= m; i++) s += Math.floor(i * i / div);
  return lin + s;
}
function lvOf(ex) {
  ex = Math.max(0, Number(ex) || 0);
  let L = 1;
  while (L < 9999 && xpAt(L + 1) <= ex) L++;
  return L;
}

/* xr 결과 + 좌석 스냅샷만으로 코어 보상. */
function corePay(r, uid) {
  if (!r || !r.pl || !r.pl[uid]) return null;
  const pl = r.pl;
  const n = Object.keys(pl).length;
  const m = (n === 1 && r.solo ? SOLO_M : (PARTY_M[n] || 1)) * (Number(r.rw) || 1);
  const base = Number(r.rt) || Number(r.total) || 0;
  const seat = pl[uid] || {};
  const vx = VL_X[seat.v] != null ? VL_X[seat.v] : 1;
  const gx = Number(r.gx) || 0;
  let g = 0, ex = 0, cl = 0;
  if (r.ok) {
    g = Math.round((30 + 10 * base) * m);
    if (seat.t === "행운") g = Math.round(g * 1.1);
    g += gx;
    if (r.solo) g += SOLO_RW_G;
    ex = Math.round((30 + 10 * base) * vx * m + (Number(r.ex) || 0));
    cl = 1;
  } else {
    g = 5 + gx;
    ex = Math.round(8 + (Number(r.ex) || 0));
  }
  return {g: Math.max(0, g), ex: Math.max(0, ex), cl};
}

async function applyAccountCore(db, uid, pay) {
  const ref = db.ref("accounts/" + uid);
  const res = await ref.transaction(acc => {
    if (!acc || typeof acc !== "object" || !acc.c || typeof acc.c !== "object") return;
    const c = acc.c;
    c.gd = Math.max(0, (Number(c.gd) || 0) + pay.g);
    c.ex = Math.max(0, (Number(c.ex) || 0) + pay.ex);
    c.lv = lvOf(c.ex);
    if (pay.cl) c.cl = Math.max(0, (Number(c.cl) || 0) + pay.cl);
    acc.prog = acc.prog && typeof acc.prog === "object" ? acc.prog : {};
    acc.prog.ex = c.ex;
    acc.prog.lv = c.lv;
    acc.prog.xv = Number(acc.prog.xv) || Number(c.xv) || 3;
    acc.ts = Date.now();
    acc.sid = "xpay";
    return acc;
  });
  return !!(res && res.committed);
}

/* done 인 xr 파티원에게 1회 지급. pay/{uid}.ok===1 이면 스킵. 실패 시 원장 비워 재시도. */
async function grantMarchCore(db, s, i, doc) {
  if (!doc || !doc.done || doc.empty || !doc.r || !doc.r.pl) return;
  const ids = Object.keys(doc.r.pl).filter(u => u && !String(u).startsWith("bot"));
  for (const uid of ids) {
    const amt = corePay(doc.r, uid);
    if (!amt || (!(amt.g > 0) && !(amt.ex > 0) && !amt.cl)) continue;
    const payRef = db.ref("rooms/xr" + s + "_" + i + "/pay/" + uid);
    const now = Date.now();
    let claimed = false;
    try {
      const tx = await payRef.transaction(cur => {
        if (cur && (cur.ok === 1 || cur.ok === true)) return;
        if (cur && cur.ok === 0 && now - (Number(cur.at) || 0) < 60000) return;
        return {g: amt.g, ex: amt.ex, cl: amt.cl, at: now, ok: 0};
      });
      claimed = !!(tx && tx.committed);
    } catch (e) { continue; }
    if (!claimed) continue;
    try {
      const ok = await applyAccountCore(db, uid, amt);
      if (!ok) { await payRef.set(null); continue; }
      await payRef.update({ok: 1});
    } catch (e) {
      try { await payRef.set(null); } catch (e2) { /* ignore */ }
    }
  }
}

module.exports = {grantMarchCore, corePay, lvOf};
