/**
 * 전투 및 공격력 산출 변수 정리
 */

const DMG_WEAK_MUL = 1.3;        // 약점 속성 타격 시 배율
const DMG_FIRE_SKILK_MUL = 2.0;  // 홍련의 일격 사용 시 배율
const DMG_LIGHT_SKILL_MUL = 3.0; // 구원의 빛 사용 시 배율 (레이드용)
const DMG_FIRE_ATTR_MUL = 1.2;   // 불 속성 패시브 보유 시 배율

/**
 * 보스 레이드 (오전/오후/주간/이벤트) 피해량 산출
 * @param {number}  basePw   = 기본 전투력 ( pw() )
 * @param {number}  efMul    = 패턴 대응 배율 ( ef[0] )
 * @param {boolean} isWeak   = 약점 속성 일치 여부
 * @param {boolean} isFireSk = '홍련의 일격' 활성화 여부
 * @param {boolean} hasFireAttr = '불' 속성 보유 여부
 * @param {number}  vBonus   = 마을 보너스 ( (VL[C.v] || {}).bd || 1 )
 * @param {number}  [petBonus = 0] = 사역마 보스 보너스 ( petEff("boss") )
 */

function calcBossDamage(basePw, efMul, isWeak, isFireSk, hasFireAttr, vBonus, petBonus = 0) {
    const base = basePw * (2 + Math.random()); // 전투력의 2 ~ 3배
    const weakMul = isWeak ? DMG_WEAK_MUL : 1;
    const fireSkMul = isFireSk ? DMG_FIRE_SKILL_MUL : 1;
    const fireAttrMul = hasFireAttr ? DMG_FIRE_ATTR_MUL : 1;

    const total = base * efMul * weakMul * fireSkMul * fireAttrMul * vBonus * (1 + petBonus);
    return Math.max(1, Math.round(total));
}

/**
 * 타락 레이드 (동료 마인) 피해량 산출
 */

function calcRaidDamage(basePw, randExtra, isLightSk, hasFireAttr, petBonus = 0) {
    const lightSkMul = isLightSk ? DMG_LIGHT_SKILL_MUL : 1;
    const fireAttrMul = hasFireAttr ? DMG_FIRE_ATTR_MUL : 1;
    
    const total = (basePw + randExtra) * lightSkMul * fireAttrMul * (1 + petBonus);
    return Math.max(1, Math.round(total));
}