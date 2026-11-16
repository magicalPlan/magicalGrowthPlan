/* 휴면 계정 스윕 (하루 1회).
   · la (last active): 클라가 허브 진입 때 who/{uid}.la 에 남기는 "마지막 활동 ms".
     on(접속 스탬프, 세션당 고정·150초 표시용)과 달리, 휴면 판정의 기준 시각이다.
   · DM_MS(60일)보다 오래된 la(없으면 on) → dm=1.
   · 쓰는 칸만 경로 PATCH: who.dm / who.la=null / players.dm / accounts c/dm.
   · 공개 사진 하드 삭제(원본 accounts c/img 는 남김):
     players/{uid}/im, wboss/pic/{uid}, wboss/picm/{uid}.
   · 휴면 후 who.la 를 지워 la 인덱스에서 빠지게 함(같은 명단을 매일 다시 읽지 않음).
   · 재접속 시 클라가 dm 해제·la 갱신·C.img 로 공개 사진 재업로드.
   · accounts 전체 스캔 없음. who 만 배치. */
const {onSchedule} = require("firebase-functions/v2/scheduler");

const DM_MS = 60 * 24 * 60 * 60 * 1000;
const BATCH = 200;
const CHUNK = 80;

function markPatch(patch, uid, now) {
  patch["who/" + uid + "/dm"] = 1;
  patch["who/" + uid + "/la"] = null;
  patch["who/" + uid + "/dmAt"] = now;
  patch["players/" + uid + "/dm"] = 1;
  /* 공개본만 하드 삭제. 계정 원본 c/img 는 재접속 복구용으로 둔다. */
  patch["players/" + uid + "/im"] = null;
  patch["wboss/pic/" + uid] = null;
  patch["wboss/picm/" + uid] = null;
  patch["accounts/" + uid + "/c/dm"] = 1;
}

async function flushPatch(db, patch) {
  const keys = Object.keys(patch);
  for (let i = 0; i < keys.length; i += CHUNK) {
    const part = {};
    keys.slice(i, i + CHUNK).forEach(k => { part[k] = patch[k]; });
    await db.ref().update(part);
  }
}

async function sweepByLa(db, cutoff, now) {
  const snap = await db.ref("who").orderByChild("la").endAt(cutoff).limitToFirst(BATCH).get();
  const patch = {};
  let marked = 0, cleared = 0;
  snap.forEach(child => {
    const uid = child.key;
    const v = child.val() || {};
    if (v.dm === 1) {
      /* 이미 휴면인데 la 가 남아 인덱스에 걸린 경우 — la 만 지운다. */
      patch["who/" + uid + "/la"] = null;
      cleared++;
      return;
    }
    markPatch(patch, uid, now);
    marked++;
  });
  if (Object.keys(patch).length) await flushPatch(db, patch);
  return {marked, cleared};
}

/* la 가 아직 없는 옛 명부: 키 커서로 who 를 조금씩 훑어 on/la 로 판정. */
async function sweepLegacy(db, cutoff, now) {
  const cursorRef = db.ref("tally/dormant/cursor");
  const prev = String((await cursorRef.get()).val() || "");
  let q = db.ref("who").orderByKey().limitToFirst(BATCH);
  if (prev) q = db.ref("who").orderByKey().startAfter(prev).limitToFirst(BATCH);
  const snap = await q.get();
  const patch = {};
  let marked = 0, last = prev, n = 0;
  snap.forEach(child => {
    n++;
    last = child.key;
    const v = child.val() || {};
    if (v.dm === 1) return;
    const la = Number(v.la);
    const on = Number(v.on);
    const at = Number.isFinite(la) && la > 0 ? la : (Number.isFinite(on) && on > 0 ? on : 0);
    if (!at || at > cutoff) return;
    markPatch(patch, child.key, now);
    marked++;
  });
  if (Object.keys(patch).length) await flushPatch(db, patch);
  if (n < BATCH) await cursorRef.set(null);
  else if (last) await cursorRef.set(last);
  return {marked, scanned: n, done: n < BATCH};
}

function createDormantSweep(getDatabase) {
  return onSchedule({
    schedule: "every day 04:10",
    timeZone: "Asia/Seoul",
    region: "asia-southeast1",
    timeoutSeconds: 300,
    memory: "256MiB"
  }, async () => {
    const db = getDatabase();
    const now = Date.now();
    const cutoff = now - DM_MS;
    await sweepByLa(db, cutoff, now);
    await sweepLegacy(db, cutoff, now);
  });
}

module.exports = {createDormantSweep, DM_MS, BATCH};
