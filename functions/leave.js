/* 회원 탈퇴 일괄 정리.
   POST /accountLeave  Authorization: Bearer <idToken>
   body(JSON, 선택): { id: "로그인아이디" }  — mail/{id}·elogin 정리용
   · Admin SDK 로 RTDB 관련 칸을 지운 뒤 Auth deleteUser.
   · 필수: 친구(상대 fr·fq·fo·fmsg·res), 이메일(mail·elogin).
   · 남김: 게시판/chat 본문, 진행 중 대련 xb, 마을 기여(vfac·vfactop·guard) — 탈퇴 비용 대비 영향 작아 생략.
   배포: firebase deploy --only functions:accountLeave */
"use strict";

const {onRequest} = require("firebase-functions/v2/https");
const {getAuth} = require("firebase-admin/auth");

const CHUNK = 80;
const DUMMY_SUF = "@magic-growth.local";

const mailDummy = e => typeof e === "string" && e.toLowerCase().endsWith(DUMMY_SUF);
const mailKey = em => String(em || "").toLowerCase().replace(/\./g, ",");
const okId = s => /^[A-Za-z0-9_]{3,20}$/.test(String(s || "")) ? String(s).toLowerCase() : "";

async function flushPatch(db, patch) {
  const keys = Object.keys(patch);
  for (let i = 0; i < keys.length; i += CHUNK) {
    const part = {};
    keys.slice(i, i + CHUNK).forEach(k => { part[k] = patch[k]; });
    await db.ref().update(part);
  }
}

async function delPath(db, path) {
  try { await db.ref(path).set(null); return true; } catch (e) { return false; }
}

function takePeers(bag, o) {
  Object.keys(o || {}).forEach(u => { if (u) bag[u] = 1; });
}

/* 상대 친구·신청·공명 칸과 내게 온/보낸 fmsg 한 줄 제거. */
async function clearFriends(db, uid, c) {
  const peers = {};
  takePeers(peers, c && c.fr);
  takePeers(peers, c && c.fq);
  takePeers(peers, c && c.fo);
  const patch = {};
  Object.keys(peers).forEach(peer => {
    if (!peer || peer === uid) return;
    patch["accounts/" + peer + "/c/fr/" + uid] = null;
    patch["accounts/" + peer + "/c/fq/" + uid] = null;
    patch["accounts/" + peer + "/c/fo/" + uid] = null;
    patch["fmsg/" + peer + "/" + uid] = null;
    patch["res/" + peer + "/" + uid] = null;
  });
  if (Object.keys(patch).length) await flushPatch(db, patch);
  /* 내 쪽 우편함은 wipe 본문에서 fmsg/{uid}·res/{uid} 통째 삭제 */
}

/* xa·구인·1:1 목록만. 진행 중 xb·게시글(chat)·마을 기여는 건드리지 않는다. */
async function clearRooms(db, uid) {
  await delPath(db, "rooms/xa" + uid);
  await delPath(db, "rooms/xr/" + uid);
  await delPath(db, "rooms/xd" + uid);
}

async function clearMail(db, idHint, authEmail) {
  let id = okId(idHint);
  const email = String(authEmail || "").toLowerCase();
  if (!id && email && mailDummy(email)) id = okId(email.slice(0, -DUMMY_SUF.length));
  if (!id && email && !mailDummy(email)) {
    try {
      const sn = await db.ref("elogin/" + mailKey(email)).get();
      id = okId(sn.val());
    } catch (e) { /* ignore */ }
  }
  let linked = "";
  if (id) {
    try {
      const sn = await db.ref("mail/" + id).get();
      const v = sn.val();
      if (typeof v === "string") linked = v;
    } catch (e) { /* ignore */ }
    await delPath(db, "mail/" + id);
  }
  const emails = [];
  if (linked && !mailDummy(linked)) emails.push(linked.toLowerCase());
  if (email && !mailDummy(email) && emails.indexOf(email) < 0) emails.push(email);
  for (const em of emails) await delPath(db, "elogin/" + mailKey(em));
}

/**
 * @param {import("firebase-admin/database").Database} db
 * @param {string} uid
 * @param {{id?: string, email?: string}} opt
 */
async function wipeAccount(db, uid, opt) {
  const done = [], fail = [];
  const mark = (label, ok) => { (ok ? done : fail).push(label); };

  let c = null;
  try {
    const sn = await db.ref("accounts/" + uid + "/c").get();
    c = sn.exists() ? sn.val() : null;
  } catch (e) { c = null; }

  /* 필수: 친구·이메일 — 실패하면 Auth 삭제 전에 호출측에서 막는다. */
  try { await clearFriends(db, uid, c || {}); mark("friends", true); }
  catch (e) { mark("friends", false); }

  try {
    await clearMail(db, opt && opt.id, opt && opt.email);
    mark("mail", true);
  } catch (e) { mark("mail", false); }

  const simple = [
    ["accounts/" + uid, "accounts"],
    ["players/" + uid, "players"],
    ["who/" + uid, "who"],
    ["duel/roster/" + uid, "duel/roster"],
    ["duel/q/" + uid, "duel/q"],
    ["duel/claim/" + uid, "duel/claim"],
    ["raid/" + uid, "raid"],
    ["raidhit/" + uid, "raidhit"],
    ["wboss/pic/" + uid, "wboss/pic"],
    ["wboss/picm/" + uid, "wboss/picm"],
    ["wboss/clk/" + uid, "wboss/clk"],
    ["dm/" + uid, "dm"],
    ["dmn/" + uid, "dmn"],
    ["fmsg/" + uid, "fmsg"],
    ["res/" + uid, "res"],
    /* TODO(선물 LEGACY 제거): gift·giftn 잔여 이관이 끝나면 두 칸만 목록에서 뺀다. ginbox 는 유지. */
    ["gift/" + uid, "gift"],
    ["giftn/" + uid, "giftn"],
    ["ginbox/" + uid, "ginbox"],
    ["pettr/" + uid, "pettr"],
    ["pex/go/" + uid, "pex/go"],
    ["pex/take/" + uid, "pex/take"],
    ["event_minigame/flanders/rank/" + uid, "flanders/rank"],
    ["event_minigame/flanders/play/" + uid, "flanders/play"],
    ["event_minigame/flanders/go/" + uid, "flanders/go"]
  ];
  for (const [path, label] of simple) mark(label, await delPath(db, path));

  try { await clearRooms(db, uid); mark("rooms", true); }
  catch (e) { mark("rooms", false); }

  await delPath(db, "leave/" + uid);

  return {done, fail};
}

function createAccountLeave(getDatabase) {
  return onRequest({
    region: "asia-southeast1",
    cors: true,
    timeoutSeconds: 120,
    memory: "512MiB"
  }, async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ok: 0, why: "method"});
      return;
    }
    const hdr = String(req.get("Authorization") || "");
    const m = hdr.match(/^Bearer\s+(.+)$/i);
    if (!m) {
      res.status(401).json({ok: 0, why: "auth"});
      return;
    }
    let decoded;
    try {
      decoded = await getAuth().verifyIdToken(m[1]);
    } catch (e) {
      res.status(401).json({ok: 0, why: "token"});
      return;
    }
    const uid = String(decoded.uid || "");
    if (!uid) {
      res.status(401).json({ok: 0, why: "uid"});
      return;
    }
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const id = okId(body.id) || okId(decoded.name);
    const email = String(decoded.email || body.email || "").toLowerCase();

    const db = getDatabase();
    let wipe;
    try {
      wipe = await wipeAccount(db, uid, {id, email});
    } catch (e) {
      res.status(500).json({ok: 0, why: "wipe", msg: String(e && e.message || e)});
      return;
    }

    const must = ["friends", "mail"];
    const mustFail = must.filter(k => wipe.fail.indexOf(k) >= 0);
    if (mustFail.length) {
      /* 필수 정리 실패 시 Auth 는 남겨 재시도 가능하게. */
      res.status(500).json({ok: 0, why: "must", fail: mustFail, done: wipe.done});
      return;
    }

    let authDel = true;
    try {
      await getAuth().deleteUser(uid);
    } catch (e) {
      authDel = false;
      if (e && e.code === "auth/user-not-found") authDel = true;
    }

    res.status(authDel ? 200 : 207).json({
      ok: authDel ? 1 : 0,
      auth: authDel ? 1 : 0,
      done: wipe.done,
      fail: wipe.fail
    });
  });
}

module.exports = {createAccountLeave, wipeAccount};
