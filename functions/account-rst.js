/* 계정당 회귀 + 명부 반영 (한 흐름).
   POST /accountRst  Authorization: Bearer <idToken> (admins/{uid} 만)
   body(JSON): { id: number, uids?: string[] }
   · id = 회귀 시각(클라 Date.now). uids 없으면 accounts(+players·who) 전원.
   · 각 UID: accounts/c set(rstShape) → prog/ts → players/rr → 부수 삭제 → players/who 미러.
   · 명부만 맞추는 rosterMirrorSync 와 다름. 회귀는 이 함수만 쓴다.
   배포: firebase deploy --only functions:accountRst */
"use strict";

const {onRequest} = require("firebase-functions/v2/https");
const {getAuth} = require("firebase-admin/auth");
const {buildPlayers, buildWho, collectUids, okUid} = require("./roster-mirror");

const AT_NAMES = ["불", "물", "바람", "땅", "빛", "어둠"];
const RST_KEEP = [
  "n", "s", "v", "a", "t", "img", "pf", "rel", "picSig", "titles", "ti", "dex", "stats",
  "pets", "pet", "petSeen", "petGone", "petMax",
  "fr", "fq", "fo", "fs", "flags", "cmp", "founder", "origin", "rescued", "tut", "healOff",
  "ntcl", "doom", "rst", "born", "last",
  "rs", "gs", "nts", "ntcSeen", "vcSeen", "bdSeen", "rsn", "pn", "drn", "drw",
  "wvn1", "wvn2", "pc", "wvc", "wbc", "gwc"
];
const POOL = 6;

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

function rstAttrs(list) {
  const a = (Array.isArray(list) ? list : []).filter(x => AT_NAMES.indexOf(x) >= 0);
  return a.length ? [a[0]] : ["불"];
}

/* 클라 js/notice.js rstShape 와 맞춘다. eggFix/flagsEnsure 는 서버에서 최소만. */
function rstShape(src, id) {
  const base = clone(src || {});
  const keep = {};
  RST_KEEP.forEach(k => {
    if (base[k] !== undefined) keep[k] = base[k];
  });
  keep.a = rstAttrs(keep.a);
  delete keep.lh;
  delete keep.clue;
  delete keep.lhGot;
  delete keep.clueGot;
  delete keep.egg;
  delete keep.eggs;
  delete keep.eggsEv;
  delete keep.eggsEv2;
  const next = Object.assign({
    lv: 1, ex: 0, xv: 3, cl: 0, dz: 0, b: 0, gd: 100,
    inv: {}, wps: [], wp: -1, wl: {}, titles: [], ti: ""
  }, keep, {rsv: id, nt: [], g: "E"});
  next.lh = null;
  next.clue = null;
  next.lhGot = {};
  next.clueGot = {};
  next.egg = null;
  next.eggs = 0;
  next.eggsEv = 0;
  next.eggsEv2 = 0;
  next.wf = 0;
  next.wfl = 0;
  next.wfDone = null;
  next.wfu = null;
  next.fc = {};
  next.facl = {};
  next.fu = null;
  next.stats = Object.assign({}, next.stats || {});
  next.stats.maxGold = Math.max(Number(next.stats.maxGold) || 0, Number(next.gd) || 0, 100);
  next.stats.duW = 0;
  next.stats.duL = 0;
  next.stats.duD = 0;
  next.stats.wfGive = 0;
  next.stats.facGive = 0;
  next.stats.facUses = 0;
  const pm = Math.max(Number(next.petMax) || 0, Number(next.stats.petMax) || 0);
  if (pm > 0) {
    next.petMax = pm;
    next.stats.petMax = Math.max(Number(next.stats.petMax) || 0, pm);
  }
  if (!next.flags || typeof next.flags !== "object") {
    next.flags = {flag: {}, story_flag: {}};
  } else {
    if (!next.flags.flag || typeof next.flags.flag !== "object") next.flags.flag = {};
    if (!next.flags.story_flag || typeof next.flags.story_flag !== "object") next.flags.story_flag = {};
  }
  return next;
}

function shapedOf(src, id) {
  if (Number(src.born) > id) return Object.assign(clone(src), {rsv: id});
  return rstShape(src, id);
}

async function delQuiet(db, path) {
  try { await db.ref(path).set(null); } catch (e) { /* ignore */ }
}

/* 한 계정: 캐릭터 되돌림 + 그 UID 명부 반영까지 한 흐름. */
async function rstOneAccount(db, uid, rstId) {
  const sn = await db.ref("accounts/" + uid + "/c").get();
  const src = sn.exists() ? sn.val() : null;
  if (!src || typeof src !== "object") return "empty";

  const ch = shapedOf(src, rstId);
  const ts = Date.now();

  await db.ref("accounts/" + uid + "/c").set(ch);
  await db.ref("accounts/" + uid).update({
    prog: {lv: ch.lv || 1, ex: ch.ex || 0, xv: ch.xv || 3},
    ts,
    sid: "admin-rst"
  });
  await db.ref("players/" + uid + "/rr").set(rstId);

  await Promise.all([
    delQuiet(db, "raid/" + uid),
    delQuiet(db, "rooms/xa" + uid),
    delQuiet(db, "rooms/xr/" + uid),
    delQuiet(db, "event_minigame/flanders/rank/" + uid),
    delQuiet(db, "shady/go/" + uid),
    delQuiet(db, "accounts/" + uid + "/shadypay")
  ]);

  try {
    await db.ref("score/" + uid).set({
      n: String(ch.n || "").slice(0, 20),
      v: ch.v || "",
      fc: {},
      wf: 0,
      dr: null
    });
  } catch (e) {
    await delQuiet(db, "score/" + uid);
  }

  const pl = buildPlayers(ch, "rst", ts);
  const wh = buildWho(ch, "rst", pl);
  const patch = {};
  Object.keys(pl).forEach(k => { patch["players/" + uid + "/" + k] = pl[k]; });
  Object.keys(wh).forEach(k => { patch["who/" + uid + "/" + k] = wh[k]; });
  await db.ref().update(patch);

  return "ok";
}

async function runPool(ids, worker) {
  let at = 0;
  const n = Math.min(POOL, Math.max(1, ids.length));
  async function loop() {
    for (;;) {
      const i = at++;
      if (i >= ids.length) return;
      await worker(ids[i], i);
    }
  }
  await Promise.all(Array.from({length: n}, loop));
}

/**
 * @param {() => import("firebase-admin/database").Database} getDatabase
 */
function createAccountRst(getDatabase) {
  return onRequest({
    region: "asia-southeast1",
    cors: true,
    timeoutSeconds: 540,
    memory: "1GiB"
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
    const adminUid = String(decoded.uid || "");
    if (!adminUid) {
      res.status(401).json({ok: 0, why: "uid"});
      return;
    }

    const db = getDatabase();
    try {
      const adm = await db.ref("admins/" + adminUid).get();
      if (!adm.exists() || adm.val() == null) {
        res.status(403).json({ok: 0, why: "admin"});
        return;
      }
    } catch (e) {
      res.status(403).json({ok: 0, why: "admin"});
      return;
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const rstId = Math.floor(Number(body.id) || 0);
    if (!(rstId > 0)) {
      res.status(400).json({ok: 0, why: "id"});
      return;
    }
    const hint = Array.isArray(body.uids) ? body.uids.map(okUid).filter(Boolean) : null;

    let ids;
    try {
      ids = await collectUids(db, hint && hint.length ? hint : null);
    } catch (e) {
      res.status(500).json({ok: 0, why: "list", msg: String(e && e.message || e)});
      return;
    }
    if (hint && hint.length) {
      ids = hint.slice();
    }

    let ok = 0, empty = 0, fail = 0;
    await runPool(ids, async uid => {
      try {
        const r = await rstOneAccount(db, uid, rstId);
        if (r === "empty") empty++;
        else ok++;
      } catch (e) {
        fail++;
      }
    });

    const total = ids.length;
    const bad = fail > 0;
    res.status(bad ? 207 : 200).json({
      ok: bad ? 0 : 1,
      why: bad ? "partial" : undefined,
      id: rstId,
      total,
      synced: ok,
      empty,
      fail
    });
  });
}

module.exports = {createAccountRst, rstShape, shapedOf, rstOneAccount};
