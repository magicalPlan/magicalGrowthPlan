/* 친구 소식(fmsg) → 계정 친구 칸 동기화.
   경로: fmsg/{받는이}/{보낸이} = { t, ts, n }
   · t 가 req|ok|del 일 때만 처리한다. 공명 rok/rno 는 여기서 건드리지 않는다.
   · accounts/{uid} 에 친구 관련 칸만 PATCH 한다(c/fr · c/fq · c/fo + ts · sid).
   · Admin SDK 로 쓰므로 RTDB 규칙의 accounts 본인 쓰기 제한을 우회한다.
   · 배포: firebase deploy --only functions:fmsgFriend
   클라 syncFr 는 알림·화면용으로 남을 수 있다. DB 친구 목록의 권위는 이 함수가 맞춘다. */
const {onValueWritten} = require("firebase-functions/v2/database");

const FRIEND_T = {req: 1, ok: 1, del: 1};
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
    return;
  }
  if (t === "ok") {
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
    return;
  }
  if (t === "del") {
    await patchFriend(db, to, clearPeer(from));
    await patchFriend(db, from, clearPeer(to));
  }
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
    if (!FRIEND_T[String(v.t || "")]) return;
    await applyFmsg(getDatabase(), to, from, v);
  });
}

module.exports = {createFmsgFriend, applyFmsg, FRIEND_T, SID};
