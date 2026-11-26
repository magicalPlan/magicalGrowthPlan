/* 등록자 미러(players/who) 서버 맞춤.
   POST /rosterMirrorSync  Authorization: Bearer <idToken> (admins/{uid} 만)
   body(JSON): { mode?: "sync"|"rst", uids?: string[] }
   · accounts/{uid}/c 를 읽어 공개 칸을 Admin SDK multi-path update.
   · 계정/이름 없고 players·who 만 있으면 고아 삭제(duel/roster 포함).
   · on/la/dm/im 은 유지.
   배포: firebase deploy --only functions:rosterMirrorSync */
"use strict";

const {onRequest} = require("firebase-functions/v2/https");
const {getAuth} = require("firebase-admin/auth");

const CHUNK = 80;
const UID_RE = /^[A-Za-z0-9]{8,128}$/;
const GL = "EDCBAS";
/* WP[i][3] 기본 전투력만. data/game.js WP 와 맞춘다. */
const WP_BASE = [7, 6, 15, 4, 5, 6, 8];
/* PET_LV 문턱: data/pets.js 와 동일 (0,20,50,90,…). */
const PET_LV = (() => {
  const a = [0];
  for (let i = 0; i < 14; i++) a.push(a[i] + 10 * (i + 2));
  return a;
})();
const PET_LV_DEF = 5;
const PET_LV_HARD = 15;

async function flushPatch(db, patch) {
  const keys = Object.keys(patch);
  for (let i = 0; i < keys.length; i += CHUNK) {
    const part = {};
    keys.slice(i, i + CHUNK).forEach(k => { part[k] = patch[k]; });
    await db.ref().update(part);
  }
}

function okUid(u) {
  return UID_RE.test(String(u || "")) ? String(u) : "";
}

/* 목록용 슬림 전투력. 정밀값은 본인 접속 pubSync 가 보정. */
function mirrorPw(c) {
  if (!c || typeof c !== "object") return 0;
  const lv = Math.max(1, Number(c.lv) || 1);
  const gi = Math.max(0, GL.indexOf(String(c.g || "E")));
  const b = Math.max(0, Number(c.b) || 0);
  const t = String(c.t || "");
  const dz = Math.max(0, Number(c.dz) || 0);
  let tpw = 0;
  if (t === "천재") tpw = 4;
  else if (t === "대기만성") tpw = lv < 8 ? -2 : Math.max(Math.min(8, Math.floor(lv / 2)), Math.floor(lv / 4));
  else if (t === "폭주") tpw = dz >= 60 ? 6 : 0;
  else if (t === "불안정한 마력") tpw = 6;
  else if (t === "상처 입은 마음") tpw = 5;
  const wp = Number(c.wp);
  let wpn = 0;
  if (Number.isInteger(wp) && wp >= 0 && wp < WP_BASE.length) {
    const wl = (c.wl && Number(c.wl["w" + wp])) || 0;
    wpn = WP_BASE[wp] + Math.max(0, wl) * (wp === 0 ? 2 : 1);
  }
  const attrs = Array.isArray(c.a) ? c.a : [];
  const fire = attrs.indexOf("불") >= 0 ? 6 : 0;
  const dark = attrs.indexOf("어둠") >= 0 && dz >= 50 ? 6 : 0;
  const rnPow = c.rn ? Math.min(5, Math.max(0, Number(c.rn.pow) || 0)) : 0;
  /* 사역마 전투력(종만, 특성·비율 생략). */
  let petPw = 0;
  try {
    const q = petOf(c);
    if (q) {
      const L = petLvSlim(q);
      const sp = String(q.sp || "");
      if (sp === "fox" || sp === "dragon") petPw = 3 * L;
      else if (sp === "hope") petPw = 2 * L;
    }
  } catch (e) { /* ignore */ }
  return Math.max(0, tpw + 10 + gi * 8 + lv * 3 + b + wpn + fire + dark + rnPow * 4 + petPw);
}

function petOf(c) {
  if (!c || !c.pet || !Array.isArray(c.pets)) return null;
  return c.pets.find(q => q && q.id === c.pet) || null;
}

function petLvSlim(q) {
  if (!q) return 0;
  const lm = Math.floor(Number(q.lm));
  const cap = Math.min(PET_LV_HARD, Math.max(PET_LV_DEF, Number.isFinite(lm) ? lm : PET_LV_DEF));
  const xp = Math.max(0, Number(q.xp) || 0);
  let n = 0;
  for (let i = 0; i < PET_LV.length; i++) if (xp >= PET_LV[i]) n = i + 1;
  return Math.min(cap, n);
}

function petMirror(c) {
  const q = petOf(c);
  if (!q) return null;
  return {
    s: String(q.sp || "").slice(0, 24),
    n: String(q.nm || "").slice(0, 10),
    l: Math.max(1, petLvSlim(q) || 1)
  };
}

function attrsTxt(c) {
  return Array.isArray(c.a) ? c.a.filter(Boolean).join(" · ") : "";
}

function buildPlayers(c, mode, ts) {
  const n = String(c.n || "").slice(0, 20);
  const body = {
    n,
    s: null,
    g: String(c.g || "").slice(0, 2),
    t: String(c.t || "").slice(0, 40),
    a: attrsTxt(c).slice(0, 80),
    v: String(c.v || "").slice(0, 24),
    lv: Math.max(1, Number(c.lv) || 1),
    cl: Math.max(0, Number(c.cl) || 0),
    pw: mirrorPw(c),
    ti: String(c.ti || "").slice(0, 40),
    tn: "",
    pet: petMirror(c),
    rv: Math.max(0, Number(c.rsv) || 0),
    ts
  };
  if (mode === "rst") {
    body.cl = 0;
    body.dz = 0;
    body.wp = "없음";
    body.du = {w: 0, l: 0};
    body.fl = null;
    body.db = null;
    body.dr = null;
    body.ev = null;
    body.fc = null;
    body.wf = null;
    body.ex = Math.max(0, Number(c.ex) || 0);
    body.hf = c.healOff ? 1 : 0;
  }
  return body;
}

function buildWho(c, mode, playersBody) {
  const body = {
    n: playersBody.n,
    g: String(c.g || "").slice(0, 2),
    a: String(playersBody.a || "").slice(0, 40),
    v: String(c.v || "").slice(0, 24),
    lv: playersBody.lv,
    pw: playersBody.pw,
    ti: playersBody.ti,
    tn: playersBody.tn,
    rv: playersBody.rv
  };
  if (mode === "rst") {
    body.dz = 0;
    body.fl = null;
    body.db = null;
    body.du = {w: 0, l: 0};
  }
  return body;
}

async function accessToken() {
  try {
    const admin = require("firebase-admin");
    const cred = admin.app().options.credential;
    if (cred && typeof cred.getAccessToken === "function") {
      const t = await cred.getAccessToken();
      return t && t.access_token ? t.access_token : "";
    }
  } catch (e) { /* ignore */ }
  return "";
}

/* REST shallow 로 키만 모은다(계정 본문 다운로드 방지). */
async function shallowKeys(dbUrl, path, token) {
  const base = String(dbUrl || "").replace(/\/+$/, "");
  if (!base) return [];
  const url = base + "/" + path + ".json?shallow=true" +
    (token ? "&access_token=" + encodeURIComponent(token) : "");
  const r = await fetch(url);
  if (!r.ok) throw new Error("shallow_" + path + "_" + r.status);
  const j = await r.json();
  return Object.keys(j || {}).filter(okUid);
}

async function collectUids(db, hint) {
  const bag = {};
  if (Array.isArray(hint) && hint.length) {
    hint.forEach(u => { const id = okUid(u); if (id) bag[id] = 1; });
    return Object.keys(bag);
  }
  const dbUrl = (db && db.app && db.app.options && db.app.options.databaseURL) ||
    "https://magical-growth-default-rtdb.asia-southeast1.firebasedatabase.app";
  const token = await accessToken();
  for (const path of ["accounts", "players", "who"]) {
    try {
      (await shallowKeys(dbUrl, path, token)).forEach(u => { bag[u] = 1; });
    } catch (e) { /* 한 경로 실패해도 나머지 진행 */ }
  }
  return Object.keys(bag);
}

/**
 * @param {() => import("firebase-admin/database").Database} getDatabase
 */
function createRosterMirrorSync(getDatabase) {
  return onRequest({
    region: "asia-southeast1",
    cors: true,
    timeoutSeconds: 300,
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

    const db = getDatabase();
    try {
      const adm = await db.ref("admins/" + uid).get();
      if (!adm.exists() || adm.val() == null) {
        res.status(403).json({ok: 0, why: "admin"});
        return;
      }
    } catch (e) {
      res.status(403).json({ok: 0, why: "admin"});
      return;
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const mode = body.mode === "rst" ? "rst" : "sync";
    const hint = Array.isArray(body.uids) ? body.uids : null;

    let ids;
    try {
      ids = await collectUids(db, hint);
    } catch (e) {
      res.status(500).json({ok: 0, why: "list", msg: String(e && e.message || e)});
      return;
    }

    const ts = Date.now();
    let synced = 0, gone = 0, readFail = 0, writeFail = 0;
    const patch = {};
    /* flush 전에 쌓인 인원. 쓰기 성공 후에만 synced/gone 에 반영한다. */
    let pendSync = 0, pendGone = 0;
    const flushNow = async () => {
      if (!Object.keys(patch).length) return;
      const snap = Object.assign({}, patch);
      Object.keys(patch).forEach(k => { delete patch[k]; });
      const ps = pendSync, pg = pendGone;
      pendSync = 0;
      pendGone = 0;
      try {
        await flushPatch(db, snap);
        synced += ps;
        gone += pg;
      } catch (e) {
        writeFail += ps + pg;
        const err = new Error(String(e && e.message || e));
        err.code = "write";
        err.pending = ps + pg;
        throw err;
      }
    };
    const flushIfBig = async () => {
      if (Object.keys(patch).length >= CHUNK) await flushNow();
    };

    for (const id of ids) {
      let c = null;
      try {
        const sn = await db.ref("accounts/" + id + "/c").get();
        c = sn.exists() ? sn.val() : null;
      } catch (e) {
        readFail++;
        continue;
      }
      try {
        if (!c || typeof c !== "object" || !c.n) {
          patch["players/" + id] = null;
          patch["who/" + id] = null;
          patch["duel/roster/" + id] = null;
          pendGone++;
          await flushIfBig();
          continue;
        }
        const pl = buildPlayers(c, mode, ts);
        const wh = buildWho(c, mode, pl);
        Object.keys(pl).forEach(k => { patch["players/" + id + "/" + k] = pl[k]; });
        Object.keys(wh).forEach(k => { patch["who/" + id + "/" + k] = wh[k]; });
        pendSync++;
        await flushIfBig();
      } catch (e) {
        if (e && e.code === "write") {
          res.status(500).json({
            ok: 0,
            why: "write",
            msg: String(e.message || e),
            mode,
            total: ids.length,
            synced,
            gone,
            readFail,
            writeFail,
            fail: readFail + writeFail
          });
          return;
        }
        writeFail++;
      }
    }

    try {
      await flushNow();
    } catch (e) {
      res.status(500).json({
        ok: 0,
        why: "write",
        msg: String(e && e.message || e),
        mode,
        total: ids.length,
        synced,
        gone,
        readFail,
        writeFail,
        fail: readFail + writeFail
      });
      return;
    }

    const fail = readFail + writeFail;
    res.status(fail ? 207 : 200).json({
      ok: fail ? 0 : 1,
      why: fail ? (writeFail ? "write" : "read") : undefined,
      mode,
      total: ids.length,
      synced,
      gone,
      readFail,
      writeFail,
      fail
    });
  });
}

module.exports = {createRosterMirrorSync, mirrorPw, buildPlayers, buildWho, collectUids, okUid};
