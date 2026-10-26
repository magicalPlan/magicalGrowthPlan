/* 칭호: 교류. 선물, 공명, 친구. 형태는 models/title.js. */
const TITLE_SOCIAL=[
["gift_1","작은 마음","친구에게 선물을 처음 보냈다.",c=>(c.stats?.gifts||0)>=1],
["gift_10","마음 배달부","친구에게 선물을 10회 보냈다.",c=>(c.stats?.gifts||0)>=10],
["res_1","공명의 빛","다른 마법소녀에게 처음 공명했다.",c=>(c.stats?.resonances||0)>=1],
["res_10","마음의 연결","공명을 10회 했다.",c=>(c.stats?.resonances||0)>=10],
["friend_1","새로운 인연","친구가 한 명 이상 있다.",c=>Object.keys(c.fr||{}).length>=1],
["friend_5","인연의 중심","친구가 다섯 명 이상 있다.",c=>Object.keys(c.fr||{}).length>=5]
];
