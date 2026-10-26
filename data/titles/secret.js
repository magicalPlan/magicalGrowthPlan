/* 칭호: 히든. 얻기 전에는 이름 대신 힌트만 보인다. 형태는 models/title.js. */
const TITLE_SECRET=[
["s_99","아흔아홉","절망도가 정확히 99에서 멈춰 섰다.",c=>(c.dz||0)===99&&!c.fall,"secret","한 걸음만 더 가면 끝이었다."],
["s_edge","벼랑 끝의 희망","절망도 95 이상까지 무너졌다가 타락하지 않고 0까지 회복했다.",c=>!!c.stats?.edgeHope,"secret","가장 깊은 곳에서 가장 높은 곳으로."],
["s_midnight","자정의 마법","한국 시각 자정 직후(0시 0분~9분)에 마법을 펼쳤다.",c=>{const d=new Date(Date.now()+9*3600000);return d.getUTCHours()===0&&d.getUTCMinutes()<10},"secret","날짜가 바뀌는 순간에만 열리는 문."],
["s_dawn","새벽의 파수꾼","새벽 3시~4시(한국 시각)에 출정에 성공했다.",c=>!!c.stats?.dawnWin,"secret","모두가 잠든 시간에도 누군가는 싸운다."],
["s_clutch","기적의 역전","절망도 90 이상인 채로 출정에 성공했다.",c=>!!c.stats?.clutch,"secret","무너지기 직전에 거둔 승리."],
["s_broke","빈털터리 구세주","골드를 500 이상 가져 본 뒤 0골드가 되었다.",c=>(c.gd||0)===0&&(c.stats?.maxGold||0)>=500,"secret","주머니가 비어도 마음은 비지 않았다."],
["s_bare","맨손의 심연","무기 없이 심연 출정에 성공했다.",c=>!!c.stats?.abyssBare,"secret","가장 깊은 곳에, 아무것도 들지 않고."],
["s_hoard","마력석 수집광","마력석을 한 번에 30개 이상 모아 두었다.",c=>((c.inv||{}).mana||0)>=30,"secret","반짝이는 것은 쓰지 않고 모은다."],
["s_unlucky","불운한 대장장이","무기 강화에 10번 실패했다.",c=>(c.stats?.upgradeFails||0)>=10,"secret","망치 소리만 요란했다."],
["s_blade","명검의 주인","무기 하나를 최대 단계(+5)까지 강화했다.",c=>Object.values(c.wl||{}).some(v=>Number(v)>=5),"secret","하나만 끝까지 갈고닦았다."],
["s_phoenix","불사조","세 번 이상 타락하고도 S등급에 올랐다.",c=>(c.stats?.falls||0)>=3&&c.g==="S","secret","재 속에서 가장 높이 날아오른다."],
["s_7falls","칠전팔기","일곱 번 타락하고 일곱 번 돌아왔다.",c=>(c.stats?.recovered||0)>=7,"secret","넘어진 횟수보다 한 번 더 일어선다."]
];
