/* 게시판 댓글 알림.
   · 경로: board/c/{id} = { bt:"c", p, r?, u, n, x, ts } (클라가 chat 이 아닌 여기에 씀)
   · 생성 시에만: 글 작성자(최상위 댓글) 또는 부모 댓글 작성자(답글)의 accounts/…/c/nt 에 board 한 줄.
   · 클라는 note("board") 금지. 알림함은 서버 권위(출정 march 와 같음).
   · chat/{id} 전체에 걸면 단체·마을 채팅마다 호출되므로 board/c 만 본다.
   배포: firebase deploy --only functions:boardCmtNotify,database */
"use strict";

const {onValueWritten} = require("firebase-functions/v2/database");

const RTDB = {
  instance: "magical-growth-default-rtdb",
  region: "asia-southeast1",
  timeoutSeconds: 30,
  memory: "256MiB"
};
const SID = "board";
const NT_MAX = 60;
const TEXT_MAX = 160;

function normalizeNt(cur) {
  if (Array.isArray(cur)) return cur.filter(n => n && typeof n === "object");
  if (cur && typeof cur === "object") {
    return Object.keys(cur).sort((a, b) => Number(a) - Number(b) || String(a).localeCompare(String(b)))
      .map(k => cur[k]).filter(n => n && typeof n === "object");
  }
  return [];
}

async function accountExists(db, uid) {
  const root = db.ref("accounts/" + uid);
  if ((await root.child("c/n").get()).exists()) return true;
  return (await root.child("c/ex").get()).exists();
}

async function readVal(db, path) {
  const sn = await db.ref(path).get();
  return sn.exists() ? sn.val() : null;
}

/* 글 목록 칸: bp_ · bx_b_… · 예전 b_ 본문 글. */
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

/* 부모 댓글: 새 칸 board/c, 예전 chat/bc_… */
async function readCmt(db, cmtId) {
  const id = String(cmtId || "");
  if (!id) return null;
  for (const p of ["board/c/" + id, "chat/" + id]) {
    const v = await readVal(db, p);
    if (v && typeof v === "object" && v.bt === "c" && v.u) return v;
  }
  return null;
}

async function pushBoardNote(db, uid, entry) {
  if (!uid || !(await accountExists(db, uid))) return;
  const root = db.ref("accounts/" + uid);
  const sid = String(entry.id || "");
  const tx = await root.child("c/nt").transaction(cur => {
    const list = normalizeNt(cur);
    if (sid && list.some(n => n && String(n.id || "") === sid)) return;
    return [entry].concat(list).slice(0, NT_MAX);
  });
  if (!tx.committed) return;
  await root.update({ts: Date.now(), sid: SID});
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
  await pushBoardNote(db, target, {
    k: "board",
    t: text.slice(0, TEXT_MAX),
    u: postId,
    ts: Number.isFinite(ts) && ts > 0 ? ts : Date.now(),
    r: false,
    id: String(id).slice(0, 80)
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
    } catch (e) { /* 다음 쓰기·재시도에 맡김 */ }
  });
}

module.exports = {createBoardCmtNotify, applyBoardCmt, SID};
