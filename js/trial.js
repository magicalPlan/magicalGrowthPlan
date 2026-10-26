/* 재계약 시험. 마을 화면의 도전 버튼과 여왕의 시련 화면.
   main.js 다음에 불러야 한다. 마을 화면이 trLeft, trLeftTxt, need 를 그대로 부른다. */
// 재계약 시험은 도전한 순간부터 24시간이 지나야 다시 볼 수 있다(성공, 실패 상관없이).
const trLeft=()=>Math.max(0,TRIAL_CD-(Date.now()-(C.trT||0)));
const trLeftTxt=()=>{const h=Math.ceil(trLeft()/3600000);return h>=24?Math.floor(h/24)+"일"+(h%24?" "+h%24+"시간":""):h+"시간"};
// 재계약 시험 도전 조건: 등급이 오를수록 필요한 레벨과 토벌 횟수가 늘어난다. 숫자만 고치면 바뀐다.
const need=()=>{const k=C.t==="계약의 가호"?1:0;return{lv:Math.max(1,6+4*gi()-k),cl:Math.max(1,3+2*gi()-k)}};

let T=null;
const trGoal=()=>31+gi()*22+T.f*4+(T.f+1===T.n?12:0);
$("#b-trial").onclick=()=>{if(trLeft()>0)return;T={f:0,n:3+gi(),l:[],cd:0,started:false};show("trial");tr()};
function trStart(){if(T.started)return;T.started=true;C.trT=Date.now();
 if(useItem("candle")){T.cd+=5;T.l.push("계약의 촛불에 불을 붙였다. 이번 시험의 판정에 +5가 더해진다.")}
 if(C.tcb){T.cd+=C.tcb;T.l.push("여왕의 표식이 빛난다. 이번 시험의 판정에 +"+C.tcb+"이(가) 더해진다.");C.tcb=0}{const ob=petEff("trial");if(ob){T.cd+=ob;T.l.push("지혜부엉이가 어깨 위에서 조용히 속삭인다. 판정 +"+ob+".")}}save()}
$("#tb").onclick=()=>{if(T&&T.started&&!T.end&&!confirm("지금 나가면 이번 시험은 끝나고, 24시간 뒤에야 다시 볼 수 있다. 나갈까?"))return;hub()};
function tr(msg){const done=T.end;$("#tc").innerHTML="<h2>"+(T.f+1>T.n?"":(T.f+1===T.n?"마지막 층: 여왕님":(T.f+1)+"층"))+"</h2><dl class='kv'><dt>판정</dt><dd>"+(pw()+VL[C.v].tb+(C.a.includes("땅")?4:0)+(T.cd||0)+(C.t==="집중"?3:0)+facLv("library"))+" + 운(0~19)</dd>"+(T.f<T.n?"<dt>이번 층 목표</dt><dd>"+trGoal()+" 이상</dd>":"")+"<dt>실패 허용</dt><dd>"+Math.max(0,TRIAL_LIVES-(T.fails||0))+"번 남음</dd>"+((()=>{const a=[armed("seal")?"여왕의 인장":"",!T.started&&armed("candle")?"계약의 촛불":"",!T.started&&C.tcb?"여왕의 표식 +"+C.tcb:""].filter(Boolean);return a.length?"<dt>준비</dt><dd>"+a.join(", ")+"</dd>":""})())+"<dt>절망도</dt><dd>"+C.dz+"/100</dd></dl>";
 $("#tl").innerHTML=T.l.map(t=>"<p>"+t+"</p>").join("")||"<p>여왕님이 시련의 문을 열었다. 총 "+T.n+"층을 통과해야 한다.</p>"+(T.started?"":"<p class='hint'>아직 시험을 시작하지 않았다. '나아간다'를 누르는 순간 시작되고, 그때부터 24시간 뒤에 다시 볼 수 있다. 지금 돌아가면 아무것도 잃지 않는다.</p>");
 $("#tg").hidden=!!done;$("#tb").hidden=!done&&false}
$("#tg").onclick=()=>{if(T.end)return;trStart();const v=VL[C.v],last=T.f+1===T.n,e=trGoal(),s0=pw()+v.tb+(C.a.includes("땅")?4:0)+(T.cd||0)+(C.t==="집중"?3:0)+facLv("library")+(eq(1)?Math.max(8,R(20)):R(20)),miss=C.t==="불안정한 마력"&&Math.random()<.2,s=s0-(miss?10:0);if(miss)T.l.push("마력이 흔들려 마법이 빗나갔다. (판정 -10)");
 let pass=s>=e;if(!pass&&useSk("earth")){const s2=pw()+v.tb+(C.a.includes("땅")?4:0)+(T.cd||0)+(C.t==="집중"?3:0)+facLv("library")+(eq(1)?Math.max(8,R(20)):R(20));pass=s2>=e;T.l.push("대지의 가호로 다시 맞섰다. "+(pass?"이번에는 버텨 냈다.":"그래도 밀려났다."));save()}
 if(pass){T.l.push((last?"여왕님의 시련을 넘었다.":(T.f+1)+"층을 통과했다."));T.f++;C.gd=(C.gd||0)+15;gain(0,8+v.dz)}
 else{titleState();C.stats.trialFails=(C.stats.trialFails||0)+1;T.fails=(T.fails||0)+1;if(useItem("seal")){T.l.push("시련에 밀려났지만 여왕의 인장이 마음을 지켜 주었다. 절망도가 오르지 않았다.");save()}else{T.l.push("시련에 밀려났다. 절망도가 오른다."+(eq(3)?" (방패가 충격을 줄였다)":""));gain(0,eq(3)?12:20)}
  if(T.fails>TRIAL_LIVES&&!C.fall){T.l.push("시련에 "+T.fails+"번 밀려났다. 여왕님이 조용히 고개를 저으며 시험을 끝냈다. 24시간 뒤에 다시 도전할 수 있다.");note("quest","재계약 시험에서 탈락했다. 24시간 뒤에 다시 도전할 수 있다.");T.end=1}}
 if(C.fall){T.l.push("절망이 한계를 넘었다. 시련의 문 앞에서 타락이 시작되었다.");T.end=1}
 else if(T.f>=T.n){titleState();C.stats.trialWins=(C.stats.trialWins||0)+1;const old=C.g;C.g=GL[gi()+1];C.cl=0;let r;const miss=AT.filter(a=>!C.a.includes(a[0]));
  if(miss.length&&Math.random()<.15){const mx=miss[R(miss.length)],a=mx[0];C.a.push(a);r="새로운 속성 '"+a+"'을 손에 넣었다! ("+mx[2]+")"}else{C.b=(C.b||0)+5;r="능력이 개화했다. 전투력이 올랐다."}
  if(C.t==="각성자"){C.b=(C.b||0)+3;r+=" 한계를 넘어 각성했다. 전투력이 3 더 올랐다."}
  save();checkTitles();T.l.push("재계약 성공! "+old+"등급에서 "+C.g+"등급이 되었다. "+r);T.end=1}
 tr()};
