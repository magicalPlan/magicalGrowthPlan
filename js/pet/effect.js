/* 사역마가 전투와 보상에 보태는 값. main.js 다음에 불러야 한다.
   전투력, 경험치, 상점, 강화는 petEff 를 그대로 부른다. */
// 사역마 친밀도. 경험치가 PET_LV 칸의 기준을 넘은 개수가 단계다.
const petLv=q=>q?PET_LV.filter(n=>(q.xp||0)>=n).length:0;
// 지금 '함께하기'로 고른 사역마. 없으면 null.
const petCur=()=>C&&Array.isArray(C.pets)?C.pets.find(q=>q&&q.id===C.pet)||null:null;
/* 함께하는 사역마가 보태는 값. L 은 친밀도 단계.
   ex  토끼·희망: 경험치 +2% × L
   gd  참새·희망 +2% × L, 용 +3% × L
   dz  젤리·희망: 절망도 감소 +2% × L
   pw  여우·용 +3 × L, 희망 +2 × L
   heal 고양이: 3단계 1, 5단계 2, 그 전 0
   lh  거북·용: 장기 토벌 성공 확률 +2% × L
   gift 양: 선물 효과 +10% × L
   shop 쥐: 상점 가격 -2% × L
   trial 올빼미: 재계약 판정 +L
   mana 까마귀: 마력석 확률 +3% × L
   up  고슴도치: 강화 확률 +2% × L
   res 나비: 공명 절망도 감소 +2 × L, 얼음장미 +1 × L
   (기간 한정) lh 북극광 순록 +2% × L, lhmat 순록: 장기 토벌 시간마다 재료 1개 더 10% × L
   boss 거울파편 요정: 보스 레이드 피해 +4% × L / raid 얼음장미 정령: 타락 레이드 피해 +5% × L */
function petEff(k){const q=petCur();if(!q)return 0;const L=petLv(q),sp=q.sp;
 if(k==="ex")return sp==="rabbit"?.02*L:sp==="hope"?.02*L:0;if(k==="gd")return sp==="sparrow"?.02*L:sp==="hope"?.02*L:sp==="dragon"?.03*L:0;
 if(k==="dz")return sp==="jelly"?.02*L:sp==="hope"?.02*L:0;if(k==="pw")return sp==="fox"||sp==="dragon"?3*L:sp==="hope"?2*L:0;
 if(k==="heal")return sp==="cat"?(L>=5?2:L>=3?1:0):0;if(k==="lh")return sp==="turtle"||sp==="dragon"||sp==="reindeer"?.02*L:0;if(k==="lhmat")return sp==="reindeer"?.1*L:0;if(k==="boss")return sp==="mirror"?.04*L:0;if(k==="raid")return sp==="rose"?.05*L:0;
 if(k==="gift")return sp==="sheep"?.1*L:0;if(k==="shop")return sp==="mouse"?.02*L:0;if(k==="trial")return sp==="owl"?L:0;if(k==="mana")return sp==="crow"?.03*L:0;
 if(k==="up")return sp==="hedgehog"?2*L:0;if(k==="res")return sp==="butterfly"?2*L:sp==="rose"?L:0;return 0}
