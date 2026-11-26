# 특성(TR/TD) 적용 정리

캐릭터 특성 목록·설명·적용 수식·코드 위치를 한곳에 모은 문서다.  
정의는 `data/game.js`의 `TR` / `TD`가 기준이다.

---

## 공통 구조

| 구분 | 파일 | 역할 |
|------|------|------|
| 목록·설명 | `data/game.js` (`TR`, `TD`) | 특성 이름·설명 원본 |
| 최초 뽑기 | `js/create.js` | `TR[R(TR.length)]`로 등급과 함께 최대 3회 뽑고 하나 선택 |
| 재뽑기 | `js/growth/growth.js` `retrait()` | 현재와 다른 특성으로 변경 (비용·쿨다운은 성장 쪽 상수) |
| 전투력 | `js/common/formula.js` `tpw()` / `pw()` | 허브·참가 시 `p` 값 |
| 전투력 미러 | `functions/roster-mirror.js` `mirrorPw()` | 서버 로스터용 (펫 % 일부 제외) |
| 경험·절망 | `js/common/formula.js` `gain()` | 클라 공통 보정 |
| 경험·절망(서버) | `functions/account/boost.js` `gainDzMod` / `gainExMod` / `marchMuls` / `marchSide` | 온라인 출정 정산 |
| 출정 시뮬 | `js/room.js` · `functions/sim/engine.js` | `startSim` / `simStep` / `applyEv` (클라·서버 대칭) |
| 출정 지급 | `functions/sim/xpay.js` | 온라인 골드·경험 등 `corePay` |
| 보스 피해 | `js/common/formula-battle.js` `calcBossDamage` | 보스 레이드만 (타락 레이드 제외) |
| 장기 토벌 시간 | `js/common/formula.js` `tripMsMul` / `tripDurMs` | 집중 |

- 캐릭터 필드는 `C.t`.
- 파티 체크는 `has(t)` / `evCtx(r).tr(t)` = 파티원 중 `p.t === t`인 사람이 있으면 발동.
- **고독한 출정**(혼자 모드 `SOLO_DF` / `SOLO_DZ`)과 특성 **고독**은 별개다.

---

## 특성별 수식 · 적용 위치

### 불굴
- **TD:** 출정에서 파티가 처음 지는 전투를 한 번 다시 싸운다.
- **수식:** 출정 중 첫 대실패(`j===0`)이고 `!S.rev`이며 파티에 불굴이 있으면 → `S.rev=true` 후 전투 재판정 1회.
- **범위:** 파티 공용, 출정당 1회.
- **파일:** `js/room.js` `simStep` · `functions/sim/engine.js` `simStep`

### 예민함
- **TD:** 출정 중 함정을 미리 알아채 피한다.
- **수식:** 이벤트에 `trap:1`이고 파티에 예민함 → 이벤트 스킵(절망·경험 없음).
- **파일:** `js/room.js` `applyEv` · `functions/sim/engine.js` `applyEv`
- **참고:** 선택지 `ok` 힌트 코드는 남아 있으나, 현재 활성 이벤트에 살아있는 `ok:` 선택지는 없음(주석 처리된 옛 이벤트만).

### 냉정
- **TD:** 오르는 절망도가 20% 줄어든다.
- **수식:** `dz > 0`일 때 `dz *= 0.8` (본인만). `gain`으로 들어오는 **모든** 상승 절망에 적용.
- **파일:** `js/common/formula.js` `gain` · `functions/account/boost.js` `gainDzMod`

### 낙천
- **TD:** 절망도가 내려갈 때 15% 더 내려간다.
- **수식:** `dz < 0`일 때 `dz *= 1.15` (감소량 15% 증가).
- **파일:** `js/common/formula.js` `gain` · `functions/account/boost.js` `gainDzMod`
- **참고:** 자연회복(`natHeal`)과는 무관. `gain` 경로만.

### 끈기
- **TD:** 얻는 경험치가 15% 늘어난다.
- **수식:** `ex > 0`일 때 `ex *= 1.15`.
- **파일:**
  - 클라: `js/common/formula.js` `gain`
  - 서버: `boost.js` `gainExMod`, `marchMuls` → `exMul *= 1.15` (`xpay.corePay`)
- **참고:** 온라인 출정은 `exMul` 한 번만(클라 `gain`과 이중 적용 없음).

### 천재
- **TD:** 전투력 +5%.
- **수식:** `pw()`에서 `pct += 0.05` → `round(base * (1+pct))`. 폭주·펫 `pwp`와 **가산** 후 한 번 곱함.
- **파일:** `js/common/formula.js` `pw` · `functions/roster-mirror.js` `mirrorPw`

### 대기만성
- **TD:** 레벨 50 전 −5. 레벨 100부터 `floor(lv/5)` 끝없이.
- **수식 (`tpw`):**
  - `lv < 50` → `−5`
  - `50 ≤ lv < 100` → `0`
  - `lv ≥ 100` → `floor(lv/5)` (100→+20, 1000→+200)
- **파일:** `js/common/formula.js` `tpw` · `functions/roster-mirror.js` `mirrorPw`

### 행운
- **TD:** 출정 골드 10% 증가, 알·이벤트 알 획득 확률 +5%p.
- **수식:**
  - 성공 출정 기본 골드: `× 1.1` (다른 골드 배율과 곱)
  - 알: `p = min(1, PET_DROP_X|PET_DROP_LH + 0.05)`
- **파일:**
  - 골드: `js/room.js` `settle`(오프라인) · `functions/sim/xpay.js` `corePay`
  - 알: `js/pet/egg.js` `petDrop` · `boost.js` `marchSide`
- **참고:** 강화 성공률·장기 토벌 골드는 해당 없음(TD=출정).

### 수집가
- **TD:** 출정 성공 시 20% 확률로 무작위 재료 1개.
- **수식:** 성공 시 `random() < 0.2` → `collectorMatIds()` / `pickMat` 풀에서 1개(마력석 제외).
- **파일:** `js/room.js` `settle` · `js/create/craft.js` `collectorMatIds` · `boost.js` `marchSide`

### 다정함
- **TD:** 공명 시 내 절망 −5 추가, 받은 친구 선물 효과 ×1.5.
- **수식:**
  - 공명(내가 걸 때): `rqAmt`에 `+5`
  - 선물: `rgVal = round(GV[g] * 1.5 * (1+petEff("gift")))`
- **파일:** `js/friends/resonance.js` `rqAmt` · `js/main.js` `rgVal`
- **범위:** 클라만.

### 고독
- **TD:** 혼자 출정하면 출정 전투력 +10%.
- **수식:** `solo`이고 본인 `t==="고독"` → 파티 합산에 `round(p.p * 0.1)` 추가.
- **파일:** `js/room.js` `startSim` · `functions/sim/engine.js` `startSim`
- **참고:** 허브 `pw()`에는 미반영. 출정 시뮬 합산만.

### 협력자
- **TD:** 2명 이상 출정하면 파티 전투력 +10.
- **수식:** `ps.length >= 2 && has("협력자")` → `sim.avg += 10` (플랫, 인원 수만큼 중첩 안 함).
- **파일:** `js/room.js` `startSim` · `functions/sim/engine.js` `startSim`

### 집중
- **TD:** 장기 토벌·단서 탐색 시간이 5% 줄어든다.
- **수식:** `tripMsMul = 0.95` → `tripDurMs(hr) = round(hr * 3600000 * 0.95)`. 보상은 표기 시간 기준.
- **파일:** `js/common/formula.js` · 장기 토벌 `js/main.js` · 단서 `js/event-boss/clue.js`
- **범위:** 클라만.

### 폭주
- **TD:** 절망도 60 이상이면 전투력 +8%.
- **수식:** `(C.dz||0) >= 60`이면 `pct += 0.08`. 천재와 가산.
- **파일:** `js/common/formula.js` `pw` / `pwExtraTxt` · `functions/roster-mirror.js` `mirrorPw`

### 수호
- **TD:** 출정 종료 후 파티원 전원 오르는 절망도 −3.
- **수식:** 파티에 수호 있으면 상승 절망 원본에서 `−3` (중첩 없음). 이후 부적·상처·`gainDzMod` 등.
- **파일:** `js/room.js` `settle` · `boost.js` `marchSide`

### 치유의 손길
- **TD:** 내가 공명하면 내·상대 절망 −5 더.
- **수식:**
  - 공명 요청자: `rqAmt +5`
  - 상대 보너스 `a`: 요청자가 치유면 `+5` (빛 `+3`과 합산, 상한 있음)
  - **추가(TD 밖):** 희망의 샘/포탈 치유자 판정 → 1회 회복량 `6` (기본 `3`)
- **파일:** `js/friends/resonance.js` · `js/town/portal.js` `pHealer`
- **범위:** 클라만.

### 번뜩임
- **TD:** 출정 중 이벤트가 더 자주, 이벤트 경험치 ×2.
- **수식:**
  - 전투 사이 이벤트 확률: `0.85` (기본 `0.6`)
  - 이벤트 경험: `(x.ex||0) * 2` (파티에 번뜩임)
- **파일:** `js/room.js` `simStep` / `applyEv` · `functions/sim/engine.js`
- **참고:** 전투(`BJ`) 경험은 배율 없음. 파티 공용.

### 계약의 가호
- **TD:** 재계약 시험 성공 시 새 속성 확률 +10%p.
- **수식:** `attrP = TRIAL_ATTR_P(0.15)` 또는 펜듈럼 `TRIAL_ATTR_P_RCP(0.7)` 후 `min(1, attrP + 0.1)`.
- **파일:** `js/trial.js` 성공 분기 · 상수 `data/game.js`
- **범위:** 클라만.

### 불안정한 마력
- **TD:** 전투력 +6. 보스 공격 시 20% 확률로 피해 10~30% 감소.
- **수식:**
  - `tpw += 6`
  - `calcBossDamage`: `random() < 0.2`이면 `cut = 10 + floor(rand*21)` (10~30), `total *= (100-cut)/100`
- **파일:** `formula.js` `tpw` · `roster-mirror.js` · `formula-battle.js` `calcBossDamage` ← `js/boss.js`, `js/event-boss/boss.js`
- **참고:** 타락 레이드 `calcRaidDamage`에는 **미적용**.

### 상처 입은 마음
- **TD:** 혼자 출정 시 출정 전투력 +15%, 오르는 절망 +10%.
- **수식:**
  - 혼자: 합산에 `round(p.p * 0.15)`
  - 상승 절망 > 0이고 `r.solo`: `round(dzAmt * 1.1)`
- **파일:**
  - 전투력: `room.js` / `engine.js` `startSim`
  - 절망: `room.js` `settle` · `boost.js` `marchSide`
- **참고:** `tpw` 상시 보너스 없음. 혼자일 때만.

### 각성자
- **TD:** 사용할 수 있는 마법 횟수가 2회 늘어난다.
- **수식:** `mpMax = 2 + max(0, 속성수 - 1) + 2`
- **파일:** `js/main.js` `mpMax` → `mpLeft` / `drawSkills`
- **범위:** 클라만. (구: 재계약 성공 시 전투력 +3 — 제거됨)

### 도제
- **TD:** 제작할 때마다 5% 확률로 같은 아이템을 하나 더 얻는다.
- **수식:** 제작 `k`회마다 각각 `random() < 0.05` → `+1` (레시피 산출량 `r[2]`가 아님). 촛불·시즌 1회 제작은 추가 없음.
- **파일:** `js/create/craft.js` `doCraft`
- **참고:** C마을 `CRAFT_C_BONUS`(15%, `+r[2]`)와 독립 중첩.

---

## 클라 / 서버 적용 요약

| 특성 | 클라 | 서버(Functions) |
|------|------|-----------------|
| 불굴, 예민함, 고독, 협력자, 번뜩임, 상처(전투력) | `js/room.js` | `functions/sim/engine.js` |
| 냉정, 낙천, 끈기 | `formula.js` `gain` | `boost.js` |
| 천재, 대기만성, 폭주, 불안정(+6) | `formula.js` | `roster-mirror.js` |
| 행운(골드·알), 수집가, 수호, 상처(절망) | `room.js` / `pet/egg.js` | `xpay.js` + `boost.marchSide` |
| 다정함, 치유, 집중, 계약의 가호, 각성자, 도제, 불안정(보스 컷) | 클라만 | — |

---

## 파일별 역할 한눈표

| 파일 | 다루는 특성 |
|------|-------------|
| `data/game.js` | 전 특성 `TR`/`TD`, 관련 상수·주석 |
| `js/common/formula.js` | 천재, 폭주, 대기만성, 불안정(+6), 냉정, 낙천, 끈기, 집중 |
| `js/common/formula-battle.js` | 불안정(보스 피해 감소) |
| `js/room.js` | 불굴, 예민함, 번뜩임, 고독, 협력자, 상처, 수호, 행운(골드), 수집가 |
| `functions/sim/engine.js` | 위 출정 시뮬 대칭 |
| `functions/account/boost.js` | 냉정, 낙천, 끈기, 수호, 수집가, 행운(알), 상처(절망) |
| `functions/sim/xpay.js` | 행운(골드), 끈기(경험 배율) |
| `functions/roster-mirror.js` | 천재, 폭주, 대기만성, 불안정(+6) |
| `js/friends/resonance.js` | 다정함, 치유의 손길 |
| `js/main.js` | 다정함(선물), 각성자 |
| `js/town/portal.js` | 치유의 손길(샘 치유) |
| `js/trial.js` | 계약의 가호 |
| `js/pet/egg.js` | 행운(알) |
| `js/create/craft.js` | 도제, 수집가 재료 풀 |
| `js/create.js` / `js/growth/growth.js` | 뽑기·재뽑기 |

---

## 주석만 남은 옛 연동 (런타임 미사용)

선택지 `req: c => c.tr(...)` 형태는 이벤트 데이터에 **주석**으로만 남아 있다.

| 특성 | 주석 이벤트 id (대략) |
|------|----------------------|
| 다정함 | `singing_siren` |
| 예민함 | `mirror_maze`, `fake_road_sign`, `s_ambush_alone` |
| 번뜩임 | `ancient_book` |
| 수호 | `c_deserter` |

엔진의 `req`/`ok` 필터 코드는 살아 있으나, 현재 활성 테이블에는 해당 옵션이 없다.
