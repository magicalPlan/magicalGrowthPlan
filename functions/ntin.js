/* 알림 전용 벨 ntin/{uid}/{id} = { k, t, u, ts }.
   Admin SDK 로만 쓴다. 클라는 live 1개로 받아 note 한 뒤 칸을 지운다.
   게시판·공명·선물 등이 여기를 공유한다. */
"use strict";

const TEXT_MAX = 160;

async function accountExists(db, uid) {
  const root = db.ref("accounts/" + uid);
  if ((await root.child("c/n").get()).exists()) return true;
  return (await root.child("c/ex").get()).exists();
}

async function pushNtin(db, uid, id, entry) {
  if (!uid || !id || !(await accountExists(db, uid))) return false;
  const body = {
    k: String(entry.k || "").slice(0, 20),
    t: String(entry.t || "").slice(0, TEXT_MAX),
    u: String(entry.u || "").slice(0, 80),
    ts: Number(entry.ts) || Date.now()
  };
  if (!body.k || !body.t) return false;
  await db.ref("ntin/" + uid + "/" + String(id).replace(/[\/.#$\[\]]/g, "").slice(0, 80)).set(body);
  return true;
}

module.exports = {pushNtin, accountExists, TEXT_MAX};
