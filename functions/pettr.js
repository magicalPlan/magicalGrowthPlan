/* 사역마 특성 부여 요청.
   경로: pettr/{uid}/{petId} = { ts } (클라는 요청만, 특성 내용 없음)
   · 서버가 accounts/{uid}/c/pets 에서 레벨·빈 슬롯을 보고 굴린 뒤 tr/{lv} 만 PATCH.
   · 처리 후 요청 칸을 지워 같은 쓰기로 재진입하지 않게 한다.
   · 배포: firebase deploy --only functions:petTraitGrant
   RTDB 규칙: pettr/{uid}/{petId} 는 auth.uid==uid 쓰기 허용 필요. */
const {onValueWritten} = require("firebase-functions/v2/database");
const {grantPetTraits} = require("./account/pet-traits");

function createPetTraitGrant(getDatabase) {
  return onValueWritten({
    ref: "/pettr/{uid}/{petId}",
    instance: "magical-growth-default-rtdb",
    region: "asia-southeast1",
    timeoutSeconds: 30,
    memory: "256MiB"
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

module.exports = {createPetTraitGrant};
