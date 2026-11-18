# 장기 의뢰 · 이벤트 인수인계

이 문서는 **기간 한정 장기 의뢰**(단서 조각 · 이벤트 보스 · 단서 탐색)와 그에 묶인 **이벤트 알 · 스토리 잠금 · 칭호 · ord 화면 문구**를 넘길 때 쓴다.

- **시즌 일정(기간·id·알 inv·출정 drop):** [`seasons.js`](seasons.js) **한곳만**
- **테마 문구·보스·단서 문장:** [`pack.js`](pack.js)의 `EVENT_PACKS`
- **밸런스 숫자:** [`common.js`](common.js)

---

## 1. 한 줄 요약

| 하고 싶은 일 | 손대는 곳 |
|--------------|-----------|
| 시즌 시작/종료 시각, piece.id, 알 inv | **`seasons.js`만** → 클라·서버(배포 시) 함께 반영 |
| 새 시즌 테마 문구·보스·단서·알 이름 | `pack.js` → `EVENT_PACKS` (+ `seasons.js`에 일정 행) |
| 로컬에서 다음 시즌 UI만 미리 보기 | `pack.js` → `EVENT_FORCE = "키"` (배포 전 `null`) |
| HP·드롭 확률·단계 보상 수치 | `common.js` (`*_FORM`) |
| 세계관 탭에 에피소드 노출 | `data/story/lock.js` → `WORLD_STORY_OPEN` (별트랙) |

**하지 말 것**

- `EVENT_FORCE`를 서버에 두거나 배포 빌드에 남기기
- `functions/account/event-seasons.js`를 손으로 고치기 (자동 생성)
- `drops.js` / `boost.js`에 기간 숫자를 다시 적기

---

## 2. 일정 단일 출처 (`seasons.js`)

```
data/event/seasons.js          ← 사람이 고치는 유일한 일정 표
        │
        ├─ 클라: index.html 이 pack.js 전에 로드
        │        pack.eventBindSeasons() 가 from/to/id/egg.inv 주입
        │
        └─ 서버: firebase predeploy
                 scripts/pack-event-seasons.js
                   → functions/account/event-seasons.js
                 drops.js / boost.js 가 require
```

`pack-sim.js`가 출정 사건 표를 Functions에 넣는 것과 **같은 패턴**이다.  
테마 전체(`pack.js`)를 서버에 넣지 않으므로 **결합은 일정 슬라이스만**이다.

`EVENT_SEASONS` 한 행:

| 필드 | 의미 |
|------|------|
| `key` | `"snow"` / `"flanders"` — `EVENT_PACKS`·`EVENT_FORCE`와 동일 |
| `id` | 단서 `piece.id` · `tally/clue/{id}` · `C.clp.id` |
| `from` / `to` | 시즌 기간 (조각·알·표시 팩 공통) |
| `eggInv` | `"eggsEv"` \| `"eggsEv2"` |
| `drop` | `{ x_ok, x_fail }` — 출정 서버 단서 확률 (`CLP_FORM.drop`과 맞춤) |

---

## 3. 활성 규칙 (플래그 · 날짜)

```
EVENT_FORCE (클라 only)
    │  "snow" | "flanders" | null
    ▼
eventPick(now)     → 표시·조립용 팩 (FORCE > 날짜 live > upcoming > past)
eventLive(now)     → 드롭·획득 on/off (FORCE면 그 팩 live, 아니면 from≤now<to)
```

- **날짜:** `seasons`에서 주입된 `from` ≤ `now` < `to`
- **FORCE:** UI·클라 미리보기. 서버는 날짜만 (`event-seasons.js`)
- 클라 on/off: `eventLive()` → `clpOn` / `petEvOn` / `petEv2On`

---

## 4. 테마 번들 (`EVENT_PACKS[key]`)

일정(`from`/`to`/`piece.id`/`egg.inv`)은 `seasons`가 채운다. pack에는 테마만.

| 필드 | 역할 |
|------|------|
| `key` | seasons.key 와 동일 |
| `ord` | `{ kicker, title, lead, clueHelp }` → `ordPaint` |
| `piece` | `{ nm, ic, ds, msNames }` (+ 로드 후 `id`) |
| `boss.list` | `[타이틀, 설명, 약점] × 6` |
| `clue` | `rows×4`, `log`, `extra` |
| `egg` | `{ nm, ic, ds, leg, lim, rare, ids? }` (+ 로드 후 `inv`) |
| `storyLock` | 장기 의뢰 단서 칸 |
| `titles` | 시즌 칭호 (모든 팩 titles → `TITLE_LIST`) |

조립 전역: `EVENT`, `EVENT_ORD`, `EBOSS`, `CLP`, `CLUE`, `PET_EV`/`PET_EV2`, `STORY_LOCK`, …

---

## 5. 파일 지도

| 경로 | 역할 |
|------|------|
| [`seasons.js`](seasons.js) | **일정 단일 출처** |
| [`pack.js`](pack.js) | 테마 + `EVENT_FORCE` + 조립 |
| [`common.js`](common.js) | 밸런스 `*_FORM` |
| [`scripts/pack-event-seasons.js`](../../scripts/pack-event-seasons.js) | predeploy 복사 |
| [`functions/account/event-seasons.js`](../../functions/account/event-seasons.js) | 자동 생성 (직접 수정 금지) |
| `functions/account/drops.js` | `require("./event-seasons")` · `rollClp` |
| `functions/account/boost.js` | `PET_EV` / `PET_EV2` from event-seasons |
| `js/act/ord.js` · `js/event-boss/*` · `js/pet/egg.js` | 클라 로직 |
| `data/story/lock.js` | `storyFlag` · `WORLD_STORY_OPEN` |

---

## 6. 새 시즌 / 기간 변경 체크리스트

**기간만 바꿀 때**

1. [`seasons.js`](seasons.js)의 `from` / `to` 수정
2. `node scripts/pack-event-seasons.js` (또는 `firebase deploy` predeploy)
3. Functions 배포 (서버 드롭 반영)
4. `index.html`의 `seasons.js?v=` 올리기

**새 시즌 추가**

1. `seasons.js`에 행 추가 (`key`, **새** `id`, 기간, `eggInv`, `drop`)
2. `pack.js`에 같은 `key`의 테마 번들 추가
3. 스토리·`WORLD_STORY_OPEN` 필요 시
4. predeploy + Functions 배포 + `?v=` 갱신
5. (선택) `EVENT_FORCE = "키"`로 UI 확인 후 `null`

---

## 7. 미리보기 · 테스트

| 목적 | 방법 |
|------|------|
| UI만 | `EVENT_FORCE = "flanders"` 후 새로고침 |
| 출정 서버 드롭까지 | `seasons.js` 날짜를 지금으로 + predeploy + Functions 배포 |
| 배포 직전 | `EVENT_FORCE === null` |

---

## 8. UTC / KST

- `Date.UTC(year, month0, day, hourUtc)` — 월은 0부터. KST = UTC+9  
  - 11/22 19:00 KST → `Date.UTC(2026,10,22,10)`
- UI: `eventRangeTxt` / `clpWhen`

---

## 9. 알 · 스토리

- `eggInv` → `eggsEv`/`PET_EV` 또는 `eggsEv2`/`PET_EV2`. 기간 = 시즌 `from`/`to`
- `petEvOn` / `petEv2On` ← `eventLive().egg.inv`
- **장기 의뢰** `storyLock` vs **세계관** `WORLD_STORY_OPEN` — 별트랙 (HANDOFF 이전 §9와 동일)

---

## 10. 현재 시즌 (seasons.js 기준)

| key | 기간 (KST) | piece.id | eggInv |
|-----|------------|----------|--------|
| `snow` | 2026-11-01 0:00 ~ 11-22 18:00 | `clue-2026-11` | `eggsEv` |
| `flanders` | 2026-11-22 19:00 ~ 12-20 18:00 | `clue-2026-flanders` | `eggsEv2` |
