/* 사역마 특성(trait) 정의.
   · 해금: 친밀도 5 / 10 / 15마다 슬롯 1개(PET_TR_LV). 실제 굴림·쓰기는 서버(functions/account/pet-traits.js).
   · 클라 역할: 표시·효과 합산(js/pet/trait.js)·빈 슬롯이면 pettr 요청만. 특성 id·등급을 클라가 정하지 않는다.
   · 등급: 일반 70% · 희귀 27% · 전설 3%(PET_TR_RATE). 15레벨 슬롯은 전설 고정.
   · 같은 사역마에 동일 코드(c) 중복 금지.
   · 저장: q.tr[lv] = { c, r }. 효과 숫자는 여기 표에서 파생(서버에도 동일 상수를 둔다).
   · 받기: 자동 요청 없음. 성장 기록 › 사역마의 '특성 받기' 버튼만 pettr 요청.
   · 변경: 변광석(trcyan·trblue·trcast)은 가방에서 굴림 때 inv 소모→confirm(적용). 취소 재확인 시 돌 미복구(첫 받기 pettr 과 별개).
   · 단위 pp: 값 N → 효과 N/100 (배율·확률 가산). 단위 n: 값 그대로(판정·강화%p·회복·전투력 등).
   숫자를 고치면 클라·Functions 양쪽을 맞춘 뒤 Functions 를 배포한다. */

/* 해금 친밀도. 순서 = 슬롯 순서. */
const PET_TR_LV = [5, 10, 15];
/* 등급 확률: [등급(1일반·2희귀·3전설), 확률]. 합=1. 15레벨은 이 표를 쓰지 않고 전설(3) 고정. */
const PET_TR_RATE = [[1, .7], [2, .27], [3, .03]];
/* 등급 표시 이름. PET_RARE(종 희귀도)와 숫자를 맞추되, 특성에는 기간 한정(4)이 없다. */
const PET_TR_RARE = {1: "일반", 2: "희귀", 3: "전설"};
/* 변광석 아이템 → 바꿀 슬롯(친밀도). 가방에서 클라가 즉시 굴림·PATCH. */
const PET_TR_STONE = {trcyan: 5, trblue: 10, trcast: 15};

/* 특성 한 줄: [코드, 효과키, 이름, 일반값, 희귀값, 전설값, 단위]
   단위 "pp" = %p(표시·효과 모두 /100), "n" = 정수 가산. */
const PET_TR = [
  [1, "ex", "출정 경험치", 1, 2, 3, "pp"],
  [2, "gd", "출정 골드", 1, 2, 3, "pp"],
  [3, "heal", "자연 회복", 1, 2, 3, "n"],
  [4, "dz", "절망도 감소", 1, 2, 3, "pp"],
  [5, "pw", "전투력", 5, 10, 15, "n"],
  [6, "lh", "장기 토벌 성공률", 2, 4, 6, "pp"],
  [7, "gift", "친구 선물 효과", 10, 20, 30, "pp"],
  [8, "shop", "상점 가격 할인", 2, 4, 6, "pp"],
  [9, "trial", "재계약 시험 판정", 1, 2, 3, "n"],
  [10, "mana", "마력석 획득률", 5, 10, 15, "pp"],
  [11, "up", "무기 강화 성공률", 10, 20, 30, "n"],
  [12, "res", "공명 시 절망도 감소", 5, 10, 15, "n"],
  [13, "mat", "공방 재료 획득률", 2, 4, 6, "pp"],
  [14, "boss", "보스 레이드 피해", 3, 6, 9, "pp"],
  [15, "raid", "타락 레이드 피해", 3, 6, 9, "pp"],
  [16, "wave", "몬스터 웨이브 피해", 3, 6, 9, "pp"]
];
const PET_TRM = Object.fromEntries(PET_TR.map(t => [t[0], t]));

/* 등급 r(1~3) → 표의 값(표시용 정수/%p 숫자). 없으면 0. */
function petTrRaw(code, r) {
  const t = PET_TRM[code];
  if (!t) return 0;
  const i = Math.min(3, Math.max(1, Math.floor(Number(r) || 1)));
  return Number(t[2 + i]) || 0;
}
/* 효과에 넣는 값. pp 는 /100, n 은 그대로. */
function petTrVal(code, r) {
  const t = PET_TRM[code];
  if (!t) return 0;
  const raw = petTrRaw(code, r);
  return t[6] === "pp" ? raw / 100 : raw;
}
/* 화면 한 줄. 예: "출정 경험치 +2%p". trial·up 은 정수 %p/% 표시. */
function petTrTxt(code, r) {
  const t = PET_TRM[code];
  if (!t) return "";
  const raw = petTrRaw(code, r);
  let unit = "";
  if (t[6] === "pp") unit = "%p";
  else if (t[1] === "trial") unit = "%p";
  else if (t[1] === "up") unit = "%";
  return t[2] + " +" + raw + unit;
}
