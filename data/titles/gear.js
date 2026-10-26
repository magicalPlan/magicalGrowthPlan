/* 칭호: 장비. 무기, 강화, 각인, 상점. 형태는 models/title.js. */
const TITLE_GEAR=[
["all_weapons","무기 수집가","일곱 종류의 무기를 모두 모았다.",c=>(c.wps||[]).length>=7],
["first_weapon","첫 무장","무기를 하나 이상 구입했다.",c=>(c.wps||[]).length>=1],
["weapon_master","무기 애호가","무기를 세 종류 이상 모았다.",c=>(c.wps||[]).length>=3],
["upgrade_1","연마의 시작","무기를 한 번 강화했다.",c=>(c.stats?.upgrades||0)>=1],
["upgrade_5","대장장이의 친구","무기 강화를 5회 했다.",c=>(c.stats?.upgrades||0)>=5],
["rune_1","첫 각인","마력 각인을 처음 새겼다.",c=>Object.values(c.rn||{}).some(v=>v>0)],
["rune_all","각인의 대가","네 가지 마력 각인을 모두 최고 단계까지 새겼다.",c=>["pow","calm","wis","luck"].every(k=>((c.rn||{})[k]||0)>=5)],
["shop_1","첫 손님","상점에서 물건을 처음 구입했다.",c=>(c.stats?.purchases||0)>=1],
["shop_10","단골손님","상점에서 물건을 10회 구입했다.",c=>(c.stats?.purchases||0)>=10]
];
