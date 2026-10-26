/* 칭호: 시련. 재계약, 절망, 골드, 속성, 접속. 형태는 models/title.js. */
const TITLE_ORDEAL=[
["trial_1","시련을 넘어서","재계약 시험을 한 번 성공했다.",c=>(c.stats?.trialWins||0)>=1],
["trial_5","여왕이 인정한 자","재계약 시험을 다섯 번 성공했다.",c=>(c.stats?.trialWins||0)>=5],
["despair_50","흔들리는 마음","절망도가 50 이상에 도달했다.",c=>(c.stats?.maxDespair||c.dz||0)>=50],
["despair_100","절망의 끝자락","절망도가 100에 도달한 기록이 있다.",c=>(c.stats?.maxDespair||0)>=100],
["hope_return","다시 피어난 희망","절망도를 0으로 낮췄다.",c=>(c.stats?.reachedZero||false)],
["gold_100","작은 저금통","골드를 100 이상 보유했다.",c=>(c.stats?.maxGold||c.gd||0)>=100],
["gold_500","황금빛 지갑","골드를 500 이상 보유했다.",c=>(c.stats?.maxGold||c.gd||0)>=500],
["fire","불꽃의 계약","불 속성을 지녔다.",c=>(c.a||[]).includes("불")],
["water","고요한 물결","물 속성을 지녔다.",c=>(c.a||[]).includes("물")],
["wind","바람을 타고","바람 속성을 지녔다.",c=>(c.a||[]).includes("바람")],
["earth","흔들리지 않는 대지","땅 속성을 지녔다.",c=>(c.a||[]).includes("땅")],
["light","작은 등불","빛 속성을 지녔다.",c=>(c.a||[]).includes("빛")],
["dark","밤의 아이","어둠 속성을 지녔다.",c=>(c.a||[]).includes("어둠")],
["daily_3","매일의 약속","서로 다른 날에 3일 접속했다.",c=>(c.stats?.loginDays||0)>=3]
];
