/* 공지 벨: 운영자 공지 게시 → who 전원 ntin.
   · players/{admin}/ntc 통째 set (현재 클라 게시 경로)
   · notice/{id} 생성 (예전 경로)
   admins/{uid} 있는 게시만 팬아웃. 클라는 ntin live→note, loadNotice 로 배너만 갱신.
   배포: firebase deploy --only functions:noticeNtin,functions:noticeDocNtin */
"use strict";

const {onValueWritten} = require("firebase-functions/v2/database");
const {pushNtin, TEXT_MAX} = require("./ntin");

const RTDB = {
  instance: "magical-growth-default-rtdb",
  region: "asia-southeast1",
  timeoutSeconds: 120,
  memory: "512MiB"
};
const CHUNK = 40;

function asList(val) {
  if (Array.isArray(val)) return val.filter(n => n && typeof n === "object");
  if (val && typeof val === "object") {
    return Object.keys(val).map(k => val[k]).filter(n => n && typeof n === "object");
  }
  return [];
}

function newest(val) {
  const list = asList(val).filter(n => typeof n.t === "string" && String(n.t).trim() && Number(n.ts));
  list.sort((a, b) => Number(b.ts) - Number(a.ts));
  return list[0] || null;
}

async function isAdmin(db, uid) {
  if (!uid) return false;
  return (await db.ref("admins/" + uid).get()).exists();
}

async function fanNotice(db, entry, skipUid) {
  if (!entry || !entry.t) return;
  const ts = Number(entry.ts) || Date.now();
  const nid = String(entry.id || ts).replace(/[\/.#$\[\]]/g, "").slice(0, 40);
  const id = "notice:" + nid + ":" + ts;
  const body = {
    k: "notice",
    t: ("공지: " + String(entry.t)).slice(0, TEXT_MAX),
    u: "",
    ts
  };
  const sn = await db.ref("who").get();
  const uids = Object.keys(sn.val() || {}).filter(u => u && u !== skipUid);
  for (let i = 0; i < uids.length; i += CHUNK) {
    const slice = uids.slice(i, i + CHUNK);
    await Promise.all(slice.map(uid => pushNtin(db, uid, id, body).catch(() => {})));
  }
}

function createNoticeNtin(getDatabase) {
  return onValueWritten({
    ref: "/players/{uid}/ntc",
    ...RTDB
  }, async event => {
    if (!event.data.after.exists()) return;
    const uid = String(event.params.uid || "");
    const db = getDatabase();
    if (!(await isAdmin(db, uid))) return;
    const afterTop = newest(event.data.after.val());
    if (!afterTop) return;
    const beforeTop = event.data.before.exists() ? newest(event.data.before.val()) : null;
    if (beforeTop && Number(beforeTop.ts) >= Number(afterTop.ts)
      && String(beforeTop.id || "") === String(afterTop.id || "")) return;
    try {
      await fanNotice(db, afterTop, uid);
    } catch (e) { /* ignore */ }
  });
}

function createNoticeDocNtin(getDatabase) {
  return onValueWritten({
    ref: "/notice/{id}",
    ...RTDB
  }, async event => {
    if (!event.data.after.exists() || event.data.before.exists()) return;
    const after = event.data.after.val() || {};
    if (typeof after.t !== "string" || !after.t.trim()) return;
    const db = getDatabase();
    const entry = Object.assign({}, after, {id: String(event.params.id || after.id || "")});
    try {
      await fanNotice(db, entry, null);
    } catch (e) { /* ignore */ }
  });
}

module.exports = {createNoticeNtin, createNoticeDocNtin, fanNotice};
