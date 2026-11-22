/* 친구 소식(fmsg) → 계정 친구 칸 동기화 + ntin 벨.
   경로: fmsg/{받는이}/{보낸이} = { t, ts, n }
   · t 가 req|ok|del|cx 일 때 친구 칸 PATCH + ntin/{to}/fr:…
   · t 가 rok|rno 일 때 공명 수락·거절 ntin 벨(절망은 클라 syncFr·resHeard).
   · cx: 보낸 사람이 대기 중 신청 취소 → 받는이 fq·보낸이 fo 만 지움(fr 유지/미생성).
   · 배포: firebase deploy --only functions:fmsgFriend
   클라 syncFr 는 로컬 fr/fq/fo·공명 절망. 알림 note 는 ntin live. */
const {onValueWritten} = require("firebase-functions/v2/database");
const {pushNtin, TEXT_MAX} = require("../ntin");

const FRIEND_T = {req: 1, ok: 1, del: 1, cx: 1};
const NAME_MAX = 20;
const SID = "frsync";

function clipName(n) {
  return String(n || "").slice(0, NAME_MAX);
}

async function accountExists(db, uid) {
  const root = db.ref("accounts/" + uid);
  if ((await root.child("c/n").get()).exists()) return true;
  return (await root.child("c/ex").get()).exists();
}

async function readName(db, uid) {
  const sn = await db.ref("accounts/" + uid + "/c/n").get();
  return clipName(sn.val() || "");
}

/* 친구 칸만 update. 계정 통째 덮어쓰기 금지. */
async function patchFriend(db, uid, fields) {
  if (!uid || !(await accountExists(db, uid))) return;
  const bump = Object.assign({ts: Date.now(), sid: SID}, fields);
  await db.ref("accounts/" + uid).update(bump);
}

function clearPeer(uid) {
  return {
    ["c/fr/" + uid]: null,
    ["c/fq/" + uid]: null,
    ["c/fo/" + uid]: null
  };
}

async function pushFrNtin(db, to, from, t, fromName, at) {
  const texts = {
    req: fromName + "님이 친구 신청을 보냈다.",
    ok: fromName + "님이 친구 신청을 수락했다.",
    cx: fromName + "님이 친구 신청을 취소했다.",
    del: fromName + "님과 친구가 끊어졌다."
  };
  const text = texts[t];
  if (!text) return;
  await pushNtin(db, to, "fr:" + t + ":" + from + ":" + at, {
    k: "fr",
    t: text.slice(0, TEXT_MAX),
    u: from,
    ts: at
  });
}

async function applyFmsg(db, to, from, v) {
  const t = String(v && v.t || "");
  if (!FRIEND_T[t]) return;
  if (!to || !from || to === from) return;

  const fromName = clipName(v && v.n) || (await readName(db, from)) || "누군가";
  const toName = (await readName(db, to)) || "누군가";
  const ts = Number(v && v.ts);
  const at = Number.isFinite(ts) && ts > 0 ? ts : Date.now();

  if (t === "req") {
    /* 받는이 fq · 보낸이 fo. 창을 안 열어도 DB 신청 칸이 맞는다. */
    await patchFriend(db, to, {["c/fq/" + from]: fromName});
    await patchFriend(db, from, {["c/fo/" + to]: {ts: at, n: toName}});
  } else if (t === "ok") {
    /* 수락: 양쪽 fr, 신청 칸 제거. */
    await patchFriend(db, to, {
      ["c/fr/" + from]: fromName,
      ["c/fq/" + from]: null,
      ["c/fo/" + from]: null
    });
    await patchFriend(db, from, {
      ["c/fr/" + to]: toName,
      ["c/fq/" + to]: null,
      ["c/fo/" + to]: null
    });
  } else if (t === "cx") {
    /* 신청 취소: 친구(fr)는 건드리지 않고 신청 칸만 비운다. */
    await patchFriend(db, to, {["c/fq/" + from]: null});
    await patchFriend(db, from, {["c/fo/" + to]: null});
  } else if (t === "del") {
    await patchFriend(db, to, clearPeer(from));
    await patchFriend(db, from, clearPeer(to));
  }
  try { await pushFrNtin(db, to, from, t, fromName, at); } catch (e) { /* 칸은 맞춤 */ }
}

async function pushResAnswerNtin(db, to, from, v) {
  const t = String(v && v.t || "");
  if (t !== "rok" && t !== "rno") return;
  if (!to || !from || to === from) return;
  const name = clipName(v && v.n) || (await readName(db, from)) || "누군가";
  const ts = Number(v && v.ts);
  const at = Number.isFinite(ts) && ts > 0 ? ts : Date.now();
  const text = t === "rok"
    ? name + "님이 공명을 받아들였다."
    : name + "님이 공명을 거절했다. 지금 바로 다시 청할 수 있다.";
  await pushNtin(db, to, "res:" + t + ":" + from + ":" + at, {
    k: "res",
    t: text.slice(0, TEXT_MAX),
    u: from,
    ts: at
  });
}

function createFmsgFriend(getDatabase) {
  return onValueWritten({
    ref: "/fmsg/{to}/{from}",
    instance: "magical-growth-default-rtdb",
    region: "asia-southeast1",
    timeoutSeconds: 30,
    memory: "256MiB"
  }, async event => {
    if (!event.data.after.exists()) return;
    const to = String(event.params.to || "");
    const from = String(event.params.from || "");
    const v = event.data.after.val() || {};
    const t = String(v.t || "");
    const db = getDatabase();
    if (t === "rok" || t === "rno") {
      try { await pushResAnswerNtin(db, to, from, v); } catch (e) { /* ignore */ }
      return;
    }
    if (!FRIEND_T[t]) return;
    await applyFmsg(db, to, from, v);
  });
}

module.exports = {createFmsgFriend, applyFmsg, FRIEND_T, SID};
