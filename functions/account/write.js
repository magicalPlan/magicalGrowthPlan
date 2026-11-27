/* 서버 → accounts/{uid} 작은 경로 PATCH.
   통째 트랜잭션 금지. 토벌·지급으로 느는 칸만 ServerValue.increment / 소수 필드 update.
   마치 pay: 경제·재료·단서·절망·전 fx·부적/깃발/지도/스킬 소모·펫 XP·알. */
const {ServerValue} = require("firebase-admin/database");
const {xpAt, lvOf} = require("./xp");
const {clpAt} = require("./drops");
const {todayStr, PET_XP_CAP, petXpCap} = require("./boost");

/* 타락 상수. data/game.js · js/corruption.js 와 맞춘다. */
const FALL_GOLD = 0.1;
const WITCH_N = 3;
const WITCH_WIN = 7 * 86400000;
const WITCH_HP = 3;

async function accountExists(db, uid) {
  const root = db.ref("accounts/" + uid);
  const ex = await root.child("c/ex").get();
  if (ex.exists()) return true;
  const n = await root.child("c/n").get();
  return n.exists();
}

function consumeGear(bump, id) {
  bump["c/inv/" + id] = ServerValue.increment(-1);
  bump["c/arm/" + id] = null;
}

/* grantKey: 출정 1회 고유 키(예 x{s}_{i}_{endAt}). 있으면 accounts/{uid}/xpay/{key}=1 을
   보상 increment 와 같은 update 에 넣어, apply 성공·pay.ok 실패 후 재시도해도 이중 지급되지 않는다. */
function xpayKey(grantKey) {
  const k = String(grantKey || "").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 64);
  return k || "";
}

/* 알림함 c/nt 앞에 한 줄. 매지컬 마치 보상 알림은 서버만 넣는다(클라 note("march") 금지).
   RTDB 배열이 객체로 굳은 경우도 맞춘다. 길이는 클라 NT_MAX(60)에 맞춤. */
function normalizeNt(cur) {
  if (Array.isArray(cur)) return cur.filter(n => n && typeof n === "object");
  if (cur && typeof cur === "object") {
    return Object.keys(cur).sort((a, b) => Number(a) - Number(b) || String(a).localeCompare(String(b)))
      .map(k => cur[k]).filter(n => n && typeof n === "object");
  }
  return [];
}
/* grantKey 가 있으면 id 로 한 번만 넣는다(병렬 grantMarchCore 이중 알림 방지). */
async function pushMarchNote(root, text, grantKey) {
  const t = String(text || "").slice(0, 160);
  if (!t) return;
  const id = grantKey ? ("march:" + String(grantKey).replace(/[^a-zA-Z0-9_]/g, "").slice(0, 64)) : "";
  const entry = {k: "march", t, u: "", ts: Date.now(), r: false};
  if (id) entry.id = id;
  await root.child("c/nt").transaction(cur => {
    const list = normalizeNt(cur);
    if (id && list.some(n => n && n.id === id)) return;
    return [entry].concat(list).slice(0, 60);
  });
}

/* 절망도 100·미타락이면 대가·c/fall·raid·players.fl 반영.
   마치 applyMarchPay 가 dz 만 100 으로 두고 fallen 을 안 부르던 구멍을 막는다.
   이미 c/fall 이 있으면 no-op(클라 fallCheck 와 이중 손실 방지). */
async function applyFallIfNeeded(db, uid) {
  const root = db.ref("accounts/" + uid);
  const dz = Math.max(0, Math.min(100, Number((await root.child("c/dz").get()).val()) || 0));
  if (dz < 100) return false;
  const fallCur = (await root.child("c/fall").get()).val();
  if (fallCur) return false;

  const now = Date.now();
  const fallTRaw = (await root.child("c/fallT").get()).val();
  const fallT0 = Array.isArray(fallTRaw)
    ? fallTRaw.map(t => Number(t) || 0).filter(t => t > 0)
    : (fallTRaw && typeof fallTRaw === "object"
      ? Object.keys(fallTRaw).map(k => Number(fallTRaw[k]) || 0).filter(t => t > 0)
      : []);
  const recent = fallT0.filter(t => now - t < WITCH_WIN);
  const fallT = recent.concat(now).slice(-10);
  const witch = fallT.length >= WITCH_N;

  const ex0 = Math.max(0, Number((await root.child("c/ex").get()).val()) || 0);
  const lv0 = lvOf(ex0);
  const ex1 = xpAt(Math.max(1, lv0 - 1));
  const ex = Math.min(ex0, ex1);
  const lv = lvOf(ex);
  const gd0 = Math.max(0, Number((await root.child("c/gd").get()).val()) || 0);
  const gl = Math.floor(gd0 * FALL_GOLD * (witch ? 2 : 1));
  const gd = Math.max(0, gd0 - gl);

  let p = 0;
  try { p = Math.max(0, Number((await db.ref("players/" + uid + "/pw").get()).val()) || 0); } catch (e) { /* 0 */ }
  const mx = (300 + p * 12) * (witch ? WITCH_HP : 1);
  const rid = now;
  const fall = {rid, mx, sd: 0, st: 0};
  if (witch) fall.w = 1;

  const bump = {
    "c/dz": 100,
    "c/ex": ex,
    "c/lv": lv,
    "c/gd": gd,
    "c/fall": fall,
    "c/fallT": fallT,
    "c/edge": null,
    "c/stats/falls": ServerValue.increment(1),
    "prog/ex": ex,
    "prog/lv": lv,
    ts: now,
    sid: "xpay"
  };
  if (witch) bump["c/stats/witch"] = ServerValue.increment(1);
  await root.update(bump);

  try {
    const n = String((await root.child("c/n").get()).val() || "").slice(0, 20);
    const v = Number((await root.child("c/v").get()).val());
    const g = String((await root.child("c/g").get()).val() || "");
    const aRaw = (await root.child("c/a").get()).val();
    const a = Array.isArray(aRaw) ? aRaw.join(" · ") : String(aRaw || "");
    await db.ref("raid/" + uid).set({
      u: uid, rid, mx, sd: 0, w: witch ? 1 : 0,
      v: Number.isFinite(v) ? v : 0, n, g, a, ts: now
    });
  } catch (e) { /* 계정 fall 은 이미 반영. raid 는 클라 putRaid 가 보완 */ }
  try { await db.ref("players/" + uid + "/fl").set(1); } catch (e) { /* 공개 fl 실패해도 타락은 유지 */ }

  try {
    const loss = "타락의 대가로 경험치 " + (ex0 - ex) + ", 골드 " + gl + "을(를) 잃었다."
      + (lv < lv0 ? " 레벨이 " + lv + "(으)로 떨어졌다." : "");
    const head = witch
      ? "절망을 견디지 못하고 절망의 마인이 되었다. 모든 마법소녀가 나를 막으러 올 것이다."
      : "절망도가 100에 닿아 타락했다. 친구들이 맞서 주기를 기다리자.";
    await root.child("c/nt").transaction(cur => {
      const list = normalizeNt(cur);
      const mk = (t) => ({k: "fall", t: String(t).slice(0, 160), u: "", ts: Date.now(), r: false});
      return [mk(loss), mk(head)].concat(list).slice(0, 60);
    });
    await root.update({ts: Date.now(), sid: "xpay"});
  } catch (e) { /* 알림만 실패 */ }
  return true;
}

/* pay 필드 → 계정(매지컬 마치 서버 지급의 최종 쓰기).
   · 절망: 지금 서버 c/dz 를 읽어 pay.dz 를 더한 절대값으로 쓴다(0~100). increment 금지·클라 gain 병행 금지.
   · 절망이 100이 되면 applyFallIfNeeded 로 타락(대가·raid). settle(serverPay) 는 gain 을 안 하므로 타락 판정은 서버만.
   · 클라: settle(serverPay) 는 절망을 올리지 않는다. 지급 후 accSyncIfNewer 가 서버본을 받되,
     이 탭에만 있던 자연 회복분(dDz)은 클라 sync 가 합쳐 지킨다(js/main.js accSyncIfNewer).
   · grantKey: accounts/{uid}/xpay/{key}=1 과 보상을 같은 update 에 넣어 재시도·이중 호출에도 한 번만.
   · sid:"xpay": 클라 accSync 가 '다른 기기' 토스트를 생략하고 서버본을 받게 한다.
   · noteText: 지급 성공 시에만 c/nt 에 march 알림(이미 xpay 된 재시도에서는 넣지 않음). */
async function applyMarchPay(db, uid, pay, grantKey, noteText) {
  if (!pay || !(await accountExists(db, uid))) return false;
  const root = db.ref("accounts/" + uid);
  const gk = xpayKey(grantKey);
  if (gk) {
    const had = await root.child("xpay/" + gk).get();
    if (had.exists() && had.val()) return true;
  }
  const bump = {ts: Date.now(), sid: "xpay"};
  let any = false;
  if (gk) bump["xpay/" + gk] = 1;
  if (pay.g > 0) { bump["c/gd"] = ServerValue.increment(pay.g); any = true; }
  if (pay.ex > 0) { bump["c/ex"] = ServerValue.increment(pay.ex); any = true; }
  if (pay.cl > 0) { bump["c/cl"] = ServerValue.increment(pay.cl); any = true; }
  const inv = pay.inv && typeof pay.inv === "object" ? pay.inv : {};
  let matN = 0;
  Object.keys(inv).forEach(id => {
    const n = Math.max(0, Math.floor(Number(inv[id]) || 0));
    if (!n || String(id).indexOf("/") >= 0) return;
    bump["c/inv/" + id] = ServerValue.increment(n);
    if (id !== "mana" && id !== "g1" && id !== "charm" && id !== "flag" && id !== "map") matN += n;
    any = true;
  });
  if (matN > 0) bump["c/stats/mats"] = ServerValue.increment(matN);
  if (pay.clp > 0) {
    const season = clpAt(Date.now());
    if (season) {
      const idSnap = await root.child("c/clp/id").get();
      if (idSnap.val() !== season.id) {
        bump["c/clp"] = {id: season.id, n: pay.clp, got: {}};
      } else {
        bump["c/clp/n"] = ServerValue.increment(pay.clp);
      }
      any = true;
    }
  }
  if (pay.egg > 0) { bump["c/eggs"] = ServerValue.increment(pay.egg); any = true; }
  if (pay.eggEv > 0) { bump["c/eggsEv"] = ServerValue.increment(pay.eggEv); any = true; }
  if (pay.eggEv2 > 0) { bump["c/eggsEv2"] = ServerValue.increment(pay.eggEv2); any = true; }

  /* 절망: 읽은 curDz+pay.dz → 절대값. 클라 gain 과 병행하면 이중 가산. 미저장 회복은 클라 dDz sync 가 보정. */
  const dzAdd = Math.round(Number(pay.dz) || 0);
  const tc = Math.max(0, Math.floor(Number(pay.tc) || 0));
  const day = String(pay.day || todayStr()).slice(0, 12);
  const sk = Array.isArray(pay.sk) ? pay.sk.filter(id => id && String(id).indexOf("/") < 0) : [];

  if (dzAdd) {
    const curDz = Math.max(0, Math.min(100, Number((await root.child("c/dz").get()).val()) || 0));
    const next = Math.max(0, Math.min(100, curDz + dzAdd));
    bump["c/dz"] = next;
    if (next > curDz) {
      const st = Math.max(0, Number((await root.child("c/stats/maxDespair").get()).val()) || 0);
      if (next > st) bump["c/stats/maxDespair"] = next;
    }
    any = true;
  }
  if (tc > 0) {
    const curTc = Math.max(0, Number((await root.child("c/tcb").get()).val()) || 0);
    if (tc > curTc) { bump["c/tcb"] = tc; any = true; }
  }
  if (pay.charm) { consumeGear(bump, "charm"); any = true; }
  if (pay.flag) { consumeGear(bump, "flag"); any = true; }
  if (pay.map) { consumeGear(bump, "map"); any = true; }
  if (pay.rb) { bump["c/rsb"] = 1; any = true; }
  /* 요새 무기고(wa): 대장간 등 기존 임시 강화를 덮지 않고, 같은 날이면 v+1. */
  if (pay.wa && day) {
    const cur = (await root.child("c/wtmp").get()).val();
    const base = cur && typeof cur === "object" && String(cur.day || "") === day
      ? Math.max(0, Number(cur.v) || 0) : 0;
    bump["c/wtmp"] = {day, v: base + 1};
    any = true;
  }

  if (sk.length) {
    const skDay = String((await root.child("c/sk/day").get()).val() || "");
    let used = 0;
    if (skDay === day) used = Math.max(0, Number((await root.child("c/sk/used").get()).val()) || 0);
    bump["c/sk/day"] = day;
    bump["c/sk/used"] = used + sk.length;
    sk.forEach(id => { bump["c/sk/arm/" + id] = null; });
    any = true;
  }

  const petXp = Math.max(0, Math.floor(Number(pay.petXp) || 0));
  if (petXp > 0) {
    const petId = (await root.child("c/pet").get()).val();
    const petsSnap = await root.child("c/pets").get();
    const pets = petsSnap.exists() ? petsSnap.val() : null;
    if (petId && Array.isArray(pets)) {
      const i = pets.findIndex(q => q && q.id === petId);
      if (i >= 0) {
        const cap = typeof petXpCap === "function" ? petXpCap(pets[i]) : PET_XP_CAP;
        const xp = Math.min(cap, (Number(pets[i].xp) || 0) + petXp);
        bump["c/pets/" + i + "/xp"] = xp;
        any = true;
      }
    } else if (petId && pets && typeof pets === "object") {
      const keys = Object.keys(pets);
      for (let k = 0; k < keys.length; k++) {
        const q = pets[keys[k]];
        if (q && q.id === petId) {
          const cap = typeof petXpCap === "function" ? petXpCap(q) : PET_XP_CAP;
          const xp = Math.min(cap, (Number(q.xp) || 0) + petXp);
          bump["c/pets/" + keys[k] + "/xp"] = xp;
          any = true;
          break;
        }
      }
    }
  }

  if (!any) return false;
  await root.update(bump);

  if (pay.ex > 0) {
    const exSnap = await root.child("c/ex").get();
    const ex = Math.max(0, Number(exSnap.val()) || 0);
    const lv = lvOf(ex);
    await root.update({"c/lv": lv, "prog/ex": ex, "prog/lv": lv, ts: Date.now(), sid: "xpay"});
  }

  /* dz 가 이번 pay 로 100에 닿았거나 이미 100인데 fall 이 없으면 타락. */
  if (dzAdd) {
    try {
      const nextDz = Math.max(0, Math.min(100, Number((await root.child("c/dz").get()).val()) || 0));
      if (nextDz >= 100) await applyFallIfNeeded(db, uid);
    } catch (e) { /* 보상은 유지. 클라도 fallCheck */ }
  }

  if (pay.clp > 0) {
    try {
      const meN = Math.max(0, Number((await root.child("c/clp/n").get()).val()) || 0);
      const st = Math.max(0, Number((await root.child("c/stats/clpN").get()).val()) || 0);
      if (meN > st) await root.update({"c/stats/clpN": meN, ts: Date.now(), sid: "xpay"});
      await addClueTally(db, uid, pay.clp);
    } catch (e) { /* 계정 조각은 이미 반영 */ }
  }

  if (noteText) {
    try {
      await pushMarchNote(root, noteText, gk);
      await root.update({ts: Date.now(), sid: "xpay"});
    } catch (e) { /* 보상은 이미 반영. 알림만 실패해도 지급은 유지 */ }
  }
  return true;
}

async function addClueTally(db, uid, n) {
  n = Math.max(0, Math.floor(Number(n) || 0));
  if (!n) return;
  const season = clpAt(Date.now());
  if (!season) return;
  const nameSnap = await db.ref("accounts/" + uid + "/c/n").get();
  const nm = String(nameSnap.val() || "").slice(0, 20);
  const meSnap = await db.ref("accounts/" + uid + "/c/clp/n").get();
  const meN = Math.max(0, Number(meSnap.val()) || 0);
  const step = cur => {
    const b = cur && typeof cur.n === "number" ? cur : {n: 0, top: []};
    const o = {
      n: Math.min(1e8, (Number(b.n) || 0) + n),
      top: (Array.isArray(b.top) ? b.top : []).filter(t => t && t.u !== uid)
    };
    if (typeof b.pts === "number") o.pts = o.n;
    o.top.push({u: uid, n: nm, pt: meN});
    o.top = o.top.sort((a, x) => x.pt - a.pt).slice(0, 5);
    return o;
  };
  const primary = db.ref("tally/clue/" + season.id);
  try {
    await primary.transaction(step);
  } catch (e) {
    await db.ref("tally/dr/" + season.id).transaction(cur => {
      const o = step(cur);
      o.pts = o.n;
      return o;
    });
  }
}

module.exports = {accountExists, applyMarchPay, applyFallIfNeeded, addClueTally};
