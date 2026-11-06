/* 서버 → accounts/{uid} 작은 경로 PATCH.
   통째 트랜잭션 금지. 토벌·지급으로 느는 칸만 ServerValue.increment / 소수 필드 update.
   마치 pay: 경제·재료·단서·절망·전 fx·부적/깃발/지도/스킬 소모·펫 XP·알. */
const {ServerValue} = require("firebase-admin/database");
const {lvOf} = require("./xp");
const {CLP} = require("./drops");
const {todayStr, PET_XP_CAP} = require("./boost");

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

/* pay 필드 → 계정. dz 상승분(음수 가능). grantKey 있으면 멱등. */
async function applyMarchPay(db, uid, pay, grantKey) {
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
    const idSnap = await root.child("c/clp/id").get();
    if (idSnap.val() !== CLP.id) {
      bump["c/clp"] = {id: CLP.id, n: pay.clp, got: {}};
    } else {
      bump["c/clp/n"] = ServerValue.increment(pay.clp);
    }
    any = true;
  }
  if (pay.egg > 0) { bump["c/eggs"] = ServerValue.increment(pay.egg); any = true; }
  if (pay.eggEv > 0) { bump["c/eggsEv"] = ServerValue.increment(pay.eggEv); any = true; }

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
  if (pay.wa && day) { bump["c/wtmp"] = {day, v: 1}; any = true; }

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
        const xp = Math.min(PET_XP_CAP, (Number(pets[i].xp) || 0) + petXp);
        bump["c/pets/" + i + "/xp"] = xp;
        any = true;
      }
    } else if (petId && pets && typeof pets === "object") {
      const keys = Object.keys(pets);
      for (let k = 0; k < keys.length; k++) {
        const q = pets[keys[k]];
        if (q && q.id === petId) {
          const xp = Math.min(PET_XP_CAP, (Number(q.xp) || 0) + petXp);
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

  if (pay.clp > 0) {
    try {
      const meN = Math.max(0, Number((await root.child("c/clp/n").get()).val()) || 0);
      const st = Math.max(0, Number((await root.child("c/stats/clpN").get()).val()) || 0);
      if (meN > st) await root.update({"c/stats/clpN": meN, ts: Date.now(), sid: "xpay"});
      await addClueTally(db, uid, pay.clp);
    } catch (e) { /* 계정 조각은 이미 반영 */ }
  }
  return true;
}

async function addClueTally(db, uid, n) {
  n = Math.max(0, Math.floor(Number(n) || 0));
  if (!n) return;
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
  const primary = db.ref("tally/clue/" + CLP.id);
  try {
    await primary.transaction(step);
  } catch (e) {
    await db.ref("tally/dr/" + CLP.id).transaction(cur => {
      const o = step(cur);
      o.pts = o.n;
      return o;
    });
  }
}

module.exports = {accountExists, applyMarchPay, addClueTally};
