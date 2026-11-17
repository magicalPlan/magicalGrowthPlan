/* 사역마 특성 요청.
   · pettr/{uid}/{petId} = { ts }
     → grantPetTraits (빈 슬롯 부여)
   · pettrr/{uid}/{petId} = { item, ts }
     → rerollPetTrait (변광석: 아이템 소모 + trAlt)
   · pettrp/{uid}/{petId} = { pick:"old"|"neu", ts }
     → pickPetTraitReroll (지금/새 특성 확정)
   클라는 특성 내용을 보내지 않는다. 처리 후 요청 칸을 지운다.
   배포: firebase deploy --only functions:petTraitGrant,functions:petTraitReroll,functions:petTraitPick
   RTDB: pettr·pettrr·pettrp 본인 쓰기 허용. */
const {onValueWritten} = require("firebase-functions/v2/database");
const {grantPetTraits, rerollPetTrait, pickPetTraitReroll} = require("./account/pet-traits");

const RTDB = {
  instance: "magical-growth-default-rtdb",
  region: "asia-southeast1",
  timeoutSeconds: 30,
  memory: "256MiB"
};

function createPetTraitGrant(getDatabase) {
  return onValueWritten({
    ref: "/pettr/{uid}/{petId}",
    ...RTDB
  }, async event => {
    if (!event.data.after.exists()) return;
    const uid = String(event.params.uid || "");
    const petId = String(event.params.petId || "");
    if (!uid || !petId) return;
    const db = getDatabase();
    try {
      await grantPetTraits(db, uid, petId);
    } catch (e) { /* 다음 요청에서 재시도 */ }
    try {
      await db.ref("pettr/" + uid + "/" + petId).set(null);
    } catch (e2) { /* ignore */ }
  });
}

function createPetTraitReroll(getDatabase) {
  return onValueWritten({
    ref: "/pettrr/{uid}/{petId}",
    ...RTDB
  }, async event => {
    if (!event.data.after.exists()) return;
    const uid = String(event.params.uid || "");
    const petId = String(event.params.petId || "");
    const body = event.data.after.val() || {};
    const item = String(body.item || "");
    if (!uid || !petId || !item) return;
    const db = getDatabase();
    try {
      await rerollPetTrait(db, uid, petId, item);
    } catch (e) { /* 다음 요청에서 재시도 */ }
    try {
      await db.ref("pettrr/" + uid + "/" + petId).set(null);
    } catch (e2) { /* ignore */ }
  });
}

function createPetTraitPick(getDatabase) {
  return onValueWritten({
    ref: "/pettrp/{uid}/{petId}",
    ...RTDB
  }, async event => {
    if (!event.data.after.exists()) return;
    const uid = String(event.params.uid || "");
    const petId = String(event.params.petId || "");
    const body = event.data.after.val() || {};
    const pick = String(body.pick || "");
    if (!uid || !petId || !pick) return;
    const db = getDatabase();
    try {
      await pickPetTraitReroll(db, uid, petId, pick);
    } catch (e) { /* 다음 요청에서 재시도 */ }
    try {
      await db.ref("pettrp/" + uid + "/" + petId).set(null);
    } catch (e2) { /* ignore */ }
  });
}

module.exports = {createPetTraitGrant, createPetTraitReroll, createPetTraitPick};
