/* 게시판 댓글 알림.
   · 경로: board/c/{id} = { bt:"c", p, r?, u, n, x, ts }
   · 생성 시에만: 글·부모 댓글 작성자 ntin/{uid}/{댓글id} 에 짧은 벨.
   · 클라는 ntin live 1개로 받아 note() 한다. 계정 c/nt·accSync 를 쓰지 않는다.
   배포: firebase deploy --only functions:boardCmtNotify,database */
"use strict";

const {onValueWritten} = require("firebase-functions/v2/database");
const {pushNtin, TEXT_MAX} = require("../ntin");

const RTDB = {
  instance: "magical-growth-default-rtdb",
  region: "asia-southeast1",
  timeoutSeconds: 30,
  memory: "256MiB"
};

async function readVal(db, path) {
  const sn = await db.ref(path).get();
  return sn.exists() ? sn.val() : null;
}

async function readPost(db, postId) {
  const id = String(postId || "");
  if (!id) return null;
  const paths = id.indexOf("bp_") === 0
    ? ["chat/" + id]
    : ["chat/bx_" + id, "chat/" + id];
  for (const p of paths) {
    const v = await readVal(db, p);
    if (v && typeof v === "object" && (v.bt === "p" || v.ti != null || v.u)) return v;
  }
  return null;
}

async function readCmt(db, cmtId) {
  const id = String(cmtId || "");
  if (!id) return null;
  for (const p of ["board/c/" + id, "chat/" + id]) {
    const v = await readVal(db, p);
    if (v && typeof v === "object" && v.bt === "c" && v.u) return v;
  }
  return null;
}

async function applyBoardCmt(db, id, after, isCreate) {
  if (!isCreate) return;
  if (!after || after.bt !== "c") return;
  const from = String(after.u || "");
  const postId = String(after.p || "");
  const parentId = String(after.r || "");
  if (!from || !postId || !id) return;

  let target = "";
  let reply = false;
  let post = null;
  if (parentId) {
    const par = await readCmt(db, parentId);
    if (par && String(par.u) && String(par.u) !== from) {
      target = String(par.u);
      reply = true;
    }
  } else {
    post = await readPost(db, postId);
    if (post && String(post.u) && String(post.u) !== from) target = String(post.u);
  }
  if (!target) return;

  const name = String(after.n || "누군가").slice(0, 20);
  const preview = String(after.x || "").slice(0, 40);
  const text = reply
    ? name + "님이 내 댓글에 답글을 달았다: " + preview
    : name + "님이 내 글 「" + String(post && post.ti || "").slice(0, 20) + "」에 댓글을 달았다: " + preview;

  const ts = Number(after.ts);
  await pushNtin(db, target, id, {
    k: "board",
    t: text.slice(0, TEXT_MAX),
    u: postId,
    ts: Number.isFinite(ts) && ts > 0 ? ts : Date.now()
  });
}

function createBoardCmtNotify(getDatabase) {
  return onValueWritten({
    ref: "/board/c/{id}",
    ...RTDB
  }, async event => {
    if (!event.data.after.exists()) return;
    const id = String(event.params.id || "");
    if (!id || id.indexOf("bc_") !== 0) return;
    const after = event.data.after.val() || {};
    const isCreate = !event.data.before.exists();
    try {
      await applyBoardCmt(getDatabase(), id, after, isCreate);
    } catch (e) { /* ignore */ }
  });
}

module.exports = {createBoardCmtNotify, applyBoardCmt};
