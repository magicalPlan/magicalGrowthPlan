/* 매지컬 마치 방. main.js 다음에 불러야 한다. 방 만들기, 입장, 준비, 출발, 출정 진행과 결과 정산.
   마을 화면은 sweepRooms 를, 정기 출정은 me, startSim, simStep, resolveChoice, settle, vtx 를 그대로 부른다.
   문장은 출발 시각부터 2.2초마다 드러난다. 방장 화면이 꺼지거나 탭이 뒤로 가도 시각은 흐르고, 선택 마감과 결과 기록은 방에 있는 누구든 이어 쓴다. */
/* 매지컬 마치: 방 */
let room=null,code=null,unR=null,unL=null,tick=null;
/* 자리 기록(참가 때 rooms/xm…/{uid} 에 set). p 는 개인 전투력(js/common/formula.js pw).
   서버 startExpeditionFromSeats 가 이 칸을 그대로 r.pl 에 넣고, 권장·판정은 p 평균으로 계산한다. */

// 참가 자리 본문을 만드는 함수
const me = () => ({
   tw : facLv("tower"),
   tn : tiName(C.ti),
   n : C.n,
   a : (Array.isArray(C.a) ? C.a : C.a ? [C.a] : []).join(""),
   g : C.g,
   t : C.t,
   p : pw(),
   v : C.v,
   f : armed("flag") ? 1 : 0,
   m : armed("map") ? 1 : 0,
   w : C.wp,
   sk : ["water", "wind", "dark"].filter(armedSk),
   dz : C.dz || 0
});

const rref = c => DB.doc("rooms/" + c);
const rmsg = t => {
   $("#rm").textContent = t;
   if (!$("#v-hub").hidden) {
      $("#hm").style.color = "var(--bad)";
      $("#hm").textContent=t
   }
};

// 매지컬 마치(정기 출정) 화면. 마을 메뉴에서만 들어온다. 목록 칸이 펼쳐져 있을 때만 참가 자리를 지켜본다.
const openRooms = () => {
   if (C.fall) return($("#hm").style.color = "var(--bad)", $("#hm").textContent = "타락한 동안에는 출정할 수 없다.");
   if (C.dz >= 90) return($("#hm").style.color = "var(--bad)", $("#hm").textContent = "절망도가 너무 높아 출정할 수 없다. 공명으로 절망도를 낮춘 뒤에 다시 오자.");
   if (typeof clockSync === "function") clockSync();
   show("rooms");
   watchList()
};
$("#rb").onclick = () => {
   unL && unL();
   unL = null;
   if (typeof stopX === "function") stopX();
   hub()
};

function watchList () {
   rmsg("");
   if (!DB) {
      rmsg("이 화면에서는 출정 목록을 쓸 수 없다. 서버에 연결해 로그인해야 한다.");
      return
   }
   if (typeof xListOpen === "function" && !xListOpen()) {
      if (typeof stopX === "function") stopX();
      return
   }
   if (typeof xShowN === "number") xShowN = typeof X_PAGE === "number" ? X_PAGE : 5;
   if (typeof xWatchKey !== "undefined") xWatchKey = "";
   if (typeof watchX === "function") watchX();
   if (typeof drawXAll === "function") drawXAll()
}

/* 죽은 경로(화면에서 안 부름). html/march/rooms.html 에서 4글자 방 만들기·코드 입장 칸을 뺀 뒤로는
   mk·join 을 누르는 버튼이 없다. enter 이하는 예전에 만든 방이 아직 있을 때만 이어질 수 있다. */
async function mk (pub) {
   if (!DB) return rmsg("방 기능을 쓸 수 없다.");
   const c = Math.random().toString(36).slice(2,6).toUpperCase();
   const r = {
      code : c,
      pub,host : UID,
      st : "lobby",
      pl : {[UID] : me()},
      rd : {[UID]:true},
      seq : [],
      step : 0, 
      ok : true, 
      ev : 0, 
      total : 3 + R(3), 
      ts : Date.now()
   };
   try {
      await rref(c).set(r);
      enter(c)
   } catch (e) {
      rmsg("방을 만들지 못했다.")
   }
}

async function join(c){if(!DB)return rmsg("방 기능을 쓸 수 없다.");c=String(c||"").trim().toUpperCase();if(c.length!==4)return rmsg("코드는 4자다.");
 try{const s=await rref(c).get();if(!s.exists)return rmsg("그런 방이 없다.");const r=s.data()||{};r.seq=r.seq||[];r.rd=r.rd||{};r.pl=r.pl||{};
  if((r.st==="done"||r.st==="run")&&roomStale(r,Date.now())){await rref(c).delete().catch(()=>{});return rmsg("끝난 출정 방이라 정리했다. 다시 참가할 수 있다.")}
  if(r.pl[UID]){enter(c);return}
  if(r.st!=="lobby")return rmsg("이미 출발한 방이라 들어갈 수 없다.");
  if(Object.keys(r.pl).length>=3)return rmsg("정원이 찬 방이다.");
  r.pl[UID]=me();r.rd[UID]=false;r.ts=Date.now();await rref(c).set(r);enter(c)}catch(e){rmsg("입장하지 못했다.")}}
function enter(c){code=c;room=null;myV=null;holdN=0;choiceK="";roomBye=false;if(holdT){clearTimeout(holdT);holdT=null}clearInterval(cdT);cdT=setInterval(cdTick,500);$("#chv").hidden=true;unL&&unL();unL=null;show("room");$("#lg").hidden=true;$("#lg").dataset.m="";$("#rrm").textContent="";unR&&unR();unR=null;watchRoom()}
/* 방에 연결해 두고, 참가·준비·진행처럼 내용이 바뀔 때만 받는다. 연결이 거절되면 20초마다 방을 통째로 묻는다.
   잠깐 묻기가 실패해도 문구를 남기지 않는다(마을 쪽 감시와 같다). 방 화면이 열려 있을 때만 안내하고, 다시 받으면 지운다. */
function watchRoom(){if(!code||!DB||unR)return;const c=code;unR=rref(c).live().onSnapshot(s=>{if(code!==c)return;const m=$("#rrm");if(m)m.textContent="";if(!s.exists){const wd=room&&room.st==="done";leave();const h=$("#hm");h.style.color="var(--mu)";h.textContent=wd?"출정이 끝나 방이 정리되었다.":"출정 방이 사라졌다.";return}room=s.data();room.seq=room.seq||[];room.rd=room.rd||{};draw()},e=>{const m=$("#rrm");if(m&&$("#v-room")&&!$("#v-room").hidden)m.textContent="연결이 끊겼다."},POLL_HUB)}
/* 진행 중에도 방 연결을 유지한다. 문장은 서버에 다시 쓰지 않고 시각으로 드러낸다. */
function armChoice(){if(code&&DB&&!unR)watchRoom()}
function stopRoom(){unR&&unR();unR=null;if(holdT){clearTimeout(holdT);holdT=null}holdN=0;clearInterval(tick);tick=null;clearInterval(cdT);cdT=null;room=null;code=null;const m=$("#rrm");if(m)m.textContent=""}
function leave(){stopRoom();hub()}
$("#rx").onclick=async()=>{if(room&&DB&&room.st==="lobby"){try{if(room.host===UID||Object.keys(room.pl).length<=1)await rref(code).delete();else{delete room.pl[UID];delete room.rd[UID];await rref(code).set(room)}}catch(e){}}
 // 끝난 방: 방장이 나가면 파티원들이 결과를 받을 시간을 10초 준 뒤 지운다.
 else if(room&&DB&&room.st==="done"&&room.host===UID){const c=code,r=room;setTimeout(()=>delRoom(c,r),10000)}leave()};
$("#rd").onclick=async()=>{if(!room||room.st!=="lobby")return;room.rd[UID]=!room.rd[UID];room.ts=Date.now();room.pl[UID]=me();try{await rref(code).set(room)}catch(e){}};
$("#bt").onclick=async()=>{const n=pw();["동료 하나","동료 둘"].forEach((x,i)=>{if(Object.keys(room.pl).length<3){const k="bot"+i;room.pl[k]={n:x,a:"-",g:C.g,t:"-",p:Math.max(10,n-2+i*2),v:C.v};room.rd[k]=true}});try{await rref(code).set(room)}catch(e){}};
/* 출발: 방 문서를 run 으로 올린 뒤 live/m due + calc 0→1 로 서버를 깨운다.
   calc 를 방 set 에 1 로만 넣으면, 이미 1 이거나 트리거가 한 번 놓치면 seq 가 비어 영구 대기한다. */
$("#st").onclick=async()=>{if(!room||room.host!==UID||!code)return;const c=code;
 room.st="run";room.step=0;room.seq=[];room.pend=null;room.fin=false;room.segFrom=0;room.phaseAt=Date.now();room.ch=null;room.calc=0;room.ts=Date.now();
 try{await rref(c).set(room);await Promise.all([DB.doc("live/m/"+c).set(Date.now()),DB.doc("rooms/"+c+"/calc").set(0).then(()=>DB.doc("rooms/"+c+"/calc").set(1)).catch(()=>DB.doc("rooms/"+c+"/calc").set(1))]);askCalc.key=""}catch(e){$("#rrm").textContent="출발하지 못했다."}};
// 출발 준비: 아이템·마법·특성 효과를 정리하고 전투를 시작한다. 정기 출정이 쓴다.
function startSim(room){const ps=Object.values(room.pl),has=t=>ps.some(p=>p.t===t),solo=ps.length===1,sum=ps.reduce((a,p)=>a+p.p+(solo&&p.t==="고독"?8:0),0),fl=ps.some(p=>p.f),mp=ps.some(p=>p.m),co=ps.length>=2&&has("협력자"),stf=ps.some(p=>p.w===6);room.seq=[];
 room.rt=room.rt||room.total;
 if(solo){room.solo=1;if(!room.sdf){room.sdf=1;room.df=(room.df||1)*SOLO_DF;room.dzm=(room.dzm||1)*SOLO_DZ}room.seq.push("⚔ 고독한 출정: 함께할 동료 없이 홀로 길을 나섰다. 마수들이 혼자인 마법소녀를 노린다. (권장 전투력 ×"+SOLO_DF+")")}
 if(mp){room.total=3;room.seq.push("마수 사냥 지도를 따라 전투 3번으로 끝나는 길을 골랐다.")}
 if(fl)room.seq.push("용기의 깃발이 펄럭였다. 파티 전원의 전투력이 5 올랐다.");if(solo&&has("고독"))room.seq.push("홀로 나선 길, 고독이 힘이 되었다. 전투력이 8 올랐다.");if(co)room.seq.push("협력자가 파티의 호흡을 맞췄다. 파티 전투력이 3 올랐다.");if(stf)room.seq.push("스태프가 큰 마력을 나눠 파티 전투력이 2 올랐다.");
 const psk=id=>ps.filter(p=>(p.sk||[]).includes(id)).length,wt=psk("water"),wd=psk("wind"),dk=psk("dark");
 if(wt)room.seq.push("정화의 물결이 파티를 감쌌다. 이번 출정의 절망도 상승이 줄어든다.");if(dk)room.seq.push("그림자 계약이 맺어졌다. 파티 전투력이 8 올랐다.");if(wd)room.seq.push("바람의 길잡이가 앞장섰다. 운명이 한 번 파티 편을 든다.");room.wsk=wt>0;
 const twb=Math.max(0,...ps.map(p=>Math.min(5,Number(p.tw)||0)));if(twb)room.seq.push("감시탑이 마수의 움직임을 미리 알려 주었다. 전투 판정 +"+twb+".");
 if(ps.some(p=>p.w===2))room.seq.push("낫의 날이 서늘하게 빛난다. 수확의 일격: 대성공이 더 잘 나온다.");
 room.sim={scy:ps.some(p=>p.w===2),i:1,ok:true,ev:0,ex:0,gx:0,ab:dk?8:0,tw:twb,lucky:wd,rev:false,avg:sum/ps.length+(fl?5:0)+(co?3:0)+(stf?2:0)};room.pend=null;room.ch=null;room.fin=false;simStep(room)}
const vtx=(t,v)=>String(t).replace(/\{v\}/g,VL[v]?VL[v].n:"마을");
const fxTxt=x=>{const a=[];if(x.ex)a.push("경험치 +"+x.ex);if(x.gd)a.push("골드 "+(x.gd>0?"+":"")+x.gd);if(x.mm)a.push("마력석 +"+x.mm);if(x.gi)a.push("작은 꽃다발 +"+x.gi);if(x.pw)a.push("이번 출정 전투력 "+(x.pw>0?"+":"")+x.pw);if(x.bt)a.push(x.bt>0?"전투 +"+x.bt:"전투 "+x.bt);if(x.tc)a.push("다음 재계약 시험 판정 +"+x.tc);if(x.rb)a.push("다음 공명 효과 증가");if(x.wa)a.push("오늘 하루 무기 +1");if(x.dh)a.push("절망도 70 이상인 사람만 절망도 "+(x.dh>0?"+":"")+x.dh);if(x.dz>0)a.push("절망도 +"+x.dz);if(x.dz<0)a.push("절망도 "+x.dz);return a.length?" ("+a.join(", ")+")":""};
/* 매지컬 마치 · 적정(권장) 전투력·성공 기준치.
   · 권장_i (2026-11 갱신, 반올림) =
       57×i×(df×(0.95−0.1×i)) + 15×df×(randbetween(7,17)×0.1)
     구식(주석): (BT_BASE + BT_STEP × i) × df
   · 기준치 T = clamp(15…85, round(50 + BT_K × (파티전투력 P ÷ 권장_i − 1)))  ← 유지
   · P 는 startSim 의 sim.avg(+ab). 자리 me().p 평균에 깃발·협력·스태프 등을 더한 값.
   클라 미리보기·옛 로컬 방용. 실제 정기 출정 판정은 functions/sim/engine.js 의 같은 식
   (BT_K·BJ_* 상수는 scripts/pack-sim.js → functions/sim/tables.js). 숫자를 바꾸면 양쪽에 맞춘다. */
let BT_BASE=300,BT_STEP=60,BT_K=60; // BT_BASE·BT_STEP 은 구 권장식용으로 남김. T 에는 BT_K 만 사용.
// 실패 여유는 T+BJ_SOFT. 그 위는 대실패인데, BJ_LOW 아래로는 내려가지 않아 대실패가 20%를 넘지 않는다. BJ_HARD 이상은 항상 대실패(5%).
const BJ_SOFT=40,BJ_HARD=96,BJ_LOW=80;
const recPw=(i,df)=>Math.round(57*i*(df*(.95-.1*i))+15*df*((7+Math.floor(Math.random()*11))*.1));
// 구 battleT: (P,i,df)=>Math.max(15,Math.min(85,Math.round(50+BT_K*(P/((BT_BASE+BT_STEP*i)*df)-1))))
const battleT=(P,i,df)=>Math.max(15,Math.min(85,Math.round(50+BT_K*(P/Math.max(1,recPw(i,df))-1))));
const battleJ=(n,T,cd)=>n>=BJ_HARD?0:n<=Math.max(1,Math.floor(T/(cd||5)))?3:n<=T?2:n<=Math.min(BJ_HARD-1,Math.max(BJ_LOW,T+BJ_SOFT))?1:0;
function simStep(r){const ps=Object.values(r.pl),has=t=>ps.some(p=>p.t===t),S=r.sim,fight=()=>(S.avg+S.ab)*3*(.75+Math.random()*.6);
 while(S.i<=r.total&&S.ok){const i=S.i,T=Math.min(90,battleT(S.avg+S.ab,i,r.df||1)+(S.tw||0)),J0=()=>battleJ(1+R(100),T,S.scy?SCY_CRIT:5);let j=J0();
  if(j===0&&!S.rev&&has("불굴")){S.rev=true;r.seq.push("전투 "+i+"/"+r.total+": 쓰러질 뻔했지만 불굴의 의지로 다시 일어섰다.");j=J0()}
  // 땅 속성: 파티에 땅 속성이 있으면 처음 나온 대실패 한 번을 EARTH_P 확률로 실패로 바꾼다(퇴각하지 않고 계속 나아간다).
  if(j===0&&!S.earth&&ps.some(p=>String(p.a||"").includes("땅"))){S.earth=true;if(Math.random()<EARTH_P){j=1;r.seq.push("전투 "+i+"/"+r.total+": 무너질 뻔한 순간, 대지가 솟아올라 파티를 받쳐 주었다.")}}
  const J=BJ[j],jdz=Math.round(J.dz*(J.dz>0?(r.dzm||1):1));S.jc=S.jc||[0,0,0,0];S.jc[j]++;S.ex+=J.ex;S.ev+=jdz;
  r.seq.push("전투 "+i+"/"+r.total+" · "+J.n+"! "+J.t[R(J.t.length)]+fxTxt({ex:J.ex,dz:J.dz}));S.i++;if(j===0){S.ok=false;break}
  if(i<r.total&&Math.random()<(has("번뜩임")?.85:.6)){const vs=[...new Set(ps.map(p=>p.v).concat(r.zv?[r.zv]:[]).filter(v=>VEV[v]))];const cx=evCtx(r),okE=e=>!e.cond||e.cond(cx),pk=list=>{const l=list.filter(okE);for(let t=0;t<10;t++){const e=l[R(l.length)];if(!e.rare||Math.random()<.3)return e}return l.find(e=>!e.rare)||l[0]};
   let x,v=vs[0]||"A";if(r.solo&&Math.random()<SOLO_EVP)x=pk(SOLO_EV);else if(vs.length&&Math.random()<.3){v=vs[R(vs.length)];x=pk(VEV[v])}else x=pk(EV);
   r.evs=r.evs||[];if(!r.evs.includes(x.id))r.evs.push(x.id);if(x.o){r.pend={id:x.id,v};return}applyEv(r,x,v)}}
 {const jc=S.jc||[0,0,0,0];r.seq.push("판정 결과: 대성공 "+jc[3]+" · 성공 "+jc[2]+" · 실패 "+jc[1]+" · 대실패 "+jc[0])}r.seq.push(S.ok?"토벌 완료! 파티가 무사히 돌아왔다.":"토벌 실패. 파티가 후퇴했다.");r.ok=S.ok;r.ev=S.ev;r.ex=S.ex;r.gx=S.gx;r.fx={mm:S.mm||0,gi:S.gi||0,tc:S.tc||0,rb:S.rb||0,wa:S.wa||0,wp:S.wp||0,dh:S.dh||0};r.fin=true}
function applyEv(r,x,v){const ps=Object.values(r.pl),has=t=>ps.some(p=>p.t===t),S=r.sim,fl=has("번뜩임");
 if(x.trap&&has("예민함")){r.seq.push("예민한 감각으로 위험을 미리 알아채 피했다.");return}
 const ex=(x.ex||0)*(fl?2:1);let tx=vtx(x.t,v);if(tx.includes("{f}"))tx=tx.replace(/\{f\}/g,r.zv?"이름 모를 마법소녀":echoName(r));
 r.seq.push(tx+fxTxt({...x,ex})+(x.ex&&fl?" (번뜩임: 경험치 2배)":""));S.ev+=x.dz||0;S.ex+=ex;S.gx+=x.gd||0;S.ab+=x.pw||0;
 S.mm=(S.mm||0)+(x.mm||0);S.gi=(S.gi||0)+(x.gi||0);S.tc=Math.max(S.tc||0,x.tc||0);if(x.rb)S.rb=1;if(x.wa)S.wa=1;if(x.wpile)S.wp=1;S.dh=(S.dh||0)+(x.dh||0);
 if(x.bt)r.total=Math.max(S.i-1,r.total+x.bt)}
// 표를 세어 고른다. 표가 갈리면 무작위, 아무도 안 고르면 운명에 맡긴다.
function resolveChoice(r,picks){const x=EVM[r.ch.id],v=r.ch.v;if(!x){r.ch=null;r.pend=null;simStep(r);return}
 const ops=(r.ch.ops&&r.ch.ops.length)?r.ch.ops:x.o.map((_,i)=>i);picks=picks.filter(p=>ops.includes(p));
 const cnt=ops.map(i=>picks.filter(p=>p===i).length),mx=Math.max(...cnt),top=ops.filter((i,j)=>cnt[j]===mx),pick=top[R(top.length)],o=x.o[pick];
 r.seq.push(vtx(x.q,v));r.seq.push("선택: "+o.l+(picks.length?" ("+picks.filter(p=>p===pick).length+"표)":" (아무도 고르지 않아 운명에 맡겼다)"));
 let out=o.r;if(out.p!=null){if((r.sim.lucky||0)>0){r.sim.lucky--;r.seq.push("바람의 길잡이가 운명을 바꾸었다.");out=out.win}else out=Math.random()<out.p?out.win:out.lose}applyEv(r,out,v);r.ch=null;r.pend=null;simStep(r)}
const humansOf=r=>Object.keys(r.pl).filter(k=>!k.startsWith("bot"));
const vref=(c,u)=>DB.doc("rooms/"+c+"v_"+u);
let busyT=false,myV=null,cdT=null,holdT=null,holdN=0;
function delRoom(c,r){if(!DB||!c)return;rref(c).delete().catch(()=>{});if(r&&r.pl)humansOf(r).forEach(u=>vref(c,u).delete().catch(()=>{}))}
// 방장이 창을 닫아 남은 방, 오래된 투표 기록을 정리한다. rooms 전체를 받지 않는다.
// 10분에 한 번, 자물쇠를 얻은 클라이언트만 키 목록을 보고 파티 방만 지운다. 정기 출정 방은 서버 함수 expireMarch 가 지운다.
let lastSweep=0;
// 끝난 방(done)은 결과 시각으로부터 10분이 지나면 지운다. 진행이 멈춘 방(run)도 마지막 기록으로부터 10분이 지나면 지운다. 기다리는 방(lobby)은 1시간이 지나야 지운다.
function roomStale(v,now){if(!v||typeof v!=="object")return false;const ts=Number(v.ts)||0,doneAt=Number(v.doneAt)||0,age=now-(ts||now),doneAge=now-(doneAt||ts||now);
 if(v.st==null)return !v.ts||age>300000;if(v.st==="done")return doneAge>=X_AFTER||age>120000;if(v.st==="run")return age>=X_AFTER;return !v.ts||age>3600000}
async function sweepClaim(){const now=Date.now();try{const res=await DB.doc("tally/roomsweep").transact(c=>{if(c&&now-(Number(c.at)||0)<540000)return;return {at:now,u:UID}});return !!(res&&res.u===UID&&Number(res.at)===now)}catch(e){return false}}
async function sweepRooms(){if(!DB||!UID||Date.now()-lastSweep<600000)return;if(!(await sweepClaim()))return;lastSweep=Date.now();let keys=[];try{keys=Object.keys((await DB.doc("rooms").peek())||{})}catch(e){lastSweep=0;try{await DB.doc("tally/roomsweep").set({at:0,u:""})}catch(e2){}return}
 const now=Date.now(),party=keys.filter(id=>id!==code&&/^[A-Z0-9]{4}(v_.+)?$/.test(id));
 for(let i=0;i<party.length;i+=6){await Promise.all(party.slice(i,i+6).map(async id=>{let v=null;try{v=(await DB.doc("rooms/"+id).get()).data()}catch(e){return}if(v&&roomStale(v,now))DB.doc("rooms/"+id).delete().catch(()=>{})}))}}
/* 지금까지 공개할 문장 수. phaseAt 부터 한 줄에 XSTEP. 이미 지난 문장은 화면을 켜는 즉시 따라잡는다. */
function shownCount(r){const seq=r.seq||[];if(!r||r.st==="lobby")return 0;if(r.st==="done")return seq.length;if(typeof r.phaseAt!=="number")return Math.min(seq.length,r.step||0);
 const from=r.segFrom||0;return Math.min(seq.length,Math.max(from,from+Math.floor(Math.max(0,Date.now()-r.phaseAt)/XSTEP)))}
function choiceOf(r){if(r.ch&&typeof r.ch.until==="number")return r.ch;if(!r.pend||!EVM[r.pend.id])return null;
 const x=EVM[r.pend.id],cx=evCtx(r),ops=x.o.map((o,i)=>i).filter(i=>!x.o[i].req||x.o[i].req(cx)),h=(cx.tr("번뜩임")||cx.tr("예민함"))?x.o.findIndex(o=>o.ok):-1,seq=r.seq||[],from=r.segFrom||0,at=typeof r.phaseAt==="number"?r.phaseAt:Date.now();
 return {id:r.pend.id,v:r.pend.v,k:seq.length,until:at+(seq.length-from)*XSTEP+CHOICE_MS,ops,h}}
function roomView(r){const seq=r.seq||[],shown=shownCount(r);if(!r||r.st==="lobby")return {mode:"lobby",shown:0};if(r.st==="done")return {mode:"done",shown:seq.length};
 if(shown<seq.length)return {mode:"lines",shown};if(r.pend&&!r.fin){const ch=choiceOf(r),until=ch?ch.until:Date.now()+CHOICE_MS;return Date.now()<until?{mode:"choice",shown,until,ch}:{mode:"resolve",shown,until,ch}}
 if(r.fin){const at=typeof r.phaseAt==="number"?r.phaseAt:Date.now();return {mode:"finish",shown,until:at+(seq.length-(r.segFrom||0))*XSTEP}}return {mode:"lines",shown}}
/* 마감이 지난 선택과 끝난 토벌을 한 번에 따라잡는다. 표는 첫 선택에만 쓰고, 그 사이 놓친 선택은 운명에 맡긴다. */
function catchUp(cur,picks,k){let first=true,changed=false;for(let n=0;n<12;n++){const v=roomView(cur);if(v.mode==="lines"||v.mode==="choice"||v.mode==="done")break;
  if(v.mode==="finish"){cur.st="done";cur.doneAt=Date.now();changed=true;break}if(v.mode!=="resolve")break;if(first&&(cur.seq||[]).length!==k)return;
  const from=(cur.seq||[]).length,until=v.until;if(!cur.ch){const ch=choiceOf(cur);if(!ch){cur.pend=null;simStep(cur)}else cur.ch=ch}
  if(cur.ch)resolveChoice(cur,first?picks||[]:[]);cur.phaseAt=until;cur.segFrom=from;cur.ch=null;first=false;changed=true}
 if(!changed)return;cur.ts=Date.now();return cur}
async function readVotes(c,r,ch){const picks=[];for(const u of humansOf(r)){const s=await vref(c,u).get(),d=s.exists&&s.data();if(d&&d.k===ch.k&&(ch.ops||[]).includes(d.i))picks.push(d.i)}return picks}
function takeRoom(c,next){if(code!==c||!next||typeof next!=="object"||Array.isArray(next))return false;const prev=room;room=next;room.seq=room.seq||[];room.rd=room.rd||{};
 return !prev||prev.st!==room.st||(prev.seq||[]).length!==room.seq.length||prev.phaseAt!==room.phaseAt||(prev.segFrom||0)!==(room.segFrom||0)}
let roomBye=false;
/* 전투 계산은 서버가 한다. calc 는 항상 0→1 로 깨운다(같은 1 쓰기는 트리거가 안 온다).
   seq 가 비어 있으면(출발 직후) 파티원 누구나, 그 외에는 방장(또는 선두)만 부탁한다. */
function askCalc(mark){if(!code||!DB||!room)return;const key=code+"|"+mark;if(askCalc.key===key)return;
 const ids=Object.keys(room.pl||{}).filter(k=>!String(k).startsWith("bot")).sort(),lead=room.pl&&room.pl[room.host]?room.host:ids[0],boot=!(room.seq||[]).length;
 if(!boot&&lead&&lead!==UID)return;askCalc.key=key;const ref=DB.doc("rooms/"+code+"/calc");
 const go=()=>ref.set(1).catch(()=>{if(askCalc.key===key)askCalc.key=""});
 ref.set(0).then(go).catch(go);DB.doc("live/m/"+code).set(Date.now()).catch(()=>{})}
async function advanceRoom(){if(!room||!code||!DB)return;if(room.st==="done"){if(!roomBye&&Date.now()-(Number(room.doneAt)||0)>ROOM_KEEP){roomBye=true;delRoom(code,room)}return}
 if(room.st!=="run")return;const v=roomView(room),slot=Math.floor(Date.now()/5000);
 if(!(room.seq||[]).length)askCalc("start_"+slot);else if(v.mode==="resolve")askCalc("r"+(room.seq||[]).length+"_"+slot);else if(v.mode==="finish")askCalc("f"+(room.seq||[]).length+"_"+slot)}
function drawChoice(r){const v=roomView(r),cv=$("#chv");if(v.mode!=="choice"||!v.ch||!EVM[v.ch.id]){cv.hidden=true;return}
 const ch=v.ch,x=EVM[ch.id];cv.hidden=false;cv.innerHTML="";cv.appendChild(elT("p","choice-q",vtx(x.q,ch.v)));const row=elT("div","row");
 const ops=(ch.ops&&ch.ops.length)?ch.ops:x.o.map((_,i)=>i);ops.forEach(i=>{const o=x.o[i],b=elT("button","chip",o.l+(o.rl?" ("+o.rl+")":"")+(ch.h===i?" ✦":""));b.type="button";b.disabled=!!(myV&&myV.k===ch.k);b.setAttribute("aria-pressed",myV&&myV.k===ch.k&&myV.i===i?"true":"false");
  b.onclick=async()=>{if(myV&&myV.k===ch.k)return;const pick=i;myV={k:ch.k,i:pick};drawChoice(r);try{const saved=await vref(code,UID).transact(c=>{if(c&&c.k===ch.k&&typeof c.i==="number")return;return {k:ch.k,i:pick,ts:Date.now()}});if(saved&&saved.k===ch.k&&typeof saved.i==="number")myV={k:ch.k,i:saved.i}}catch(e){if(myV&&myV.k===ch.k&&myV.i===pick)myV=null}drawChoice(r)};row.appendChild(b)});
 cv.appendChild(row);if(ch.h>=0)cv.appendChild(elT("p","hint","✦ 파티의 직감(번뜩임·예민함)이 답을 속삭인다."));cv.appendChild(elT("p","hint choice-t",""))}
let choiceK="";
function paintRun(){if(!room||$("#v-room").hidden||room.st==="lobby")return;const v=roomView(room),g=$("#lg"),seq=room.seq||[],fin=room.st==="done"||v.mode==="finish",mark=v.shown+"|"+seq.length+"|"+(fin?1:0);
 if(g.dataset.m!==mark){g.dataset.m=mark;g.hidden=false;g.innerHTML=seq.slice(0,v.shown).map(t=>"<p>"+t+"</p>").join("")||"<p>출발한다...</p>";if(fin&&C.last!==room.code+seq.length)g.innerHTML+=settle(room)}
 $("#rs").textContent=v.mode==="choice"?"선택의 순간":v.mode==="resolve"?"표를 세는 중":fin?"출정 종료":"출정 중";
 if(v.mode==="choice"&&v.ch&&EVM[v.ch.id]){const k=room.code+"_"+v.ch.k;if(choiceK!==k){choiceK=k;drawChoice(room)}}else if(choiceK){choiceK="";$("#chv").hidden=true}
 const t=document.querySelector("#chv .choice-t");if(t&&v.mode==="choice"&&v.ch){const left=Math.max(0,Math.ceil((v.until-Date.now())/1000));t.textContent=(myV&&myV.k===v.ch.k?"선택을 마쳤다. 다시 고를 수 없다. ":"")+"남은 시간 "+left+"초 · 파티원이 함께 고른다. 표가 갈리면 무작위로 정해진다."}
 /* seq 비어 있는 출발 직후도 반드시 깨운다. 예전에는 phaseAt 만 있어 lines 로 남고 askCalc 가 영영 안 불렸다. */
 if(room.st==="done"||v.mode==="resolve"||v.mode==="finish"||!(room.seq||[]).length||typeof room.phaseAt!=="number")advanceRoom()}
function cdTick(){paintRun()}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)paintRun()});

function draw(){const r=room,ids=Object.keys(r.pl),all=ids.length>=1&&ids.every(i=>r.rd[i]);
 $("#rt").textContent="출정 방 "+(r.pub?"(공개)":"(비공개 코드 "+r.code+")");
 const pm=ids.some(i=>r.pl[i].m),pf=ids.some(i=>r.pl[i].f);$("#rs").textContent=r.st==="lobby"?"파티 "+ids.length+"/3 · 전투 "+(pm?"3번 (사냥 지도)":r.total+"번 예정")+(pf?" · 용기의 깃발 +5":""):"출정 중";
 const l=$("#pl");l.innerHTML="";ids.forEach(i=>{const p=r.pl[i],d=document.createElement("div");d.className="chip";d.style.textAlign="left";
  if(i!==UID){d.tabIndex=0;d.setAttribute("role","button");d.style.cursor="pointer";d.onclick=()=>openProfile(i)}d.textContent=cn(i,p.n)+(i===UID?" (나)":"")+" · "+p.g+"등급 "+p.a+" · 전투력 "+p.p+(r.rd[i]?" · 준비 완료":"");l.appendChild(d)});
 $("#rd").hidden=r.st!=="lobby";$("#rd").textContent=r.rd[UID]?"준비 취소":"준비 완료";
 $("#st").hidden=!(r.st==="lobby"&&r.host===UID);$("#st").disabled=!all;$("#bt").hidden=!(LOCAL&&r.st==="lobby"&&ids.length<3);
 if(r.st!=="lobby"){$("#rx").textContent="마을로 돌아가기";paintRun()}else{choiceK="";$("#chv").hidden=true}armChoice()}
/* 출정 결과 반영. 같은 출정(code+seq.length)은 한 번만.
   호출 구분
   · 매지컬 마치(js/march.js xGrant): 반드시 {serverPay:true, pay}. 계정 수치 권한은 서버만.
   · 로비/로컬 방(paintRun 등): serverPay 없음. 예전처럼 클라가 gain·소모까지 한다.
   serverPay===true (방어)
   · 하지 않음: gain(경험·절망), 골드/토벌/재료/펫/알 가산, 부적·깃발·지도·스킬 소모.
     → Functions applyMarchPay 가 이미 accounts 에 썼다. 여기서 다시 돌리면 절망이 두 번 오른다.
   · 함: 통계·칭호·도감·결과 HTML. pay 가 있으면 서버 영수증 숫자를 문구에만 옮긴다(재계산 금지).
   · note("march"): serverPay 면 넣지 않음. 보상 알림은 Functions applyMarchPay → c/nt.
   opt.pay: rooms/xr…/pay/{uid}. 없으면 "서버에서 반영" 안내만. */
function settle(r,opt){opt=opt||{};const serverPay=!!opt.serverPay,pay=opt.pay||null;if(C.last===r.code+r.seq.length)return "";C.last=r.code+r.seq.length;let out="";const v=VL[C.v],m=(Object.keys(r.pl).length===1&&r.solo?SOLO_M:([0,.6,.7,.8,.87,.93,.97,1][Object.keys(r.pl).length]||1))*(r.rw||1);
   const mine=r.pl[UID]||{},used=[],msk=mine.sk||[],dkz=msk.includes("dark")?6:0,wtz=r.wsk?5:0;
   /* 소모 표시: 서버 지급이면 영수증 이름만. 클라가 useSk/useItem 으로 인벤을 깎지 않는다. */
   if(serverPay){(pay&&pay.skNm||[]).forEach(nm=>{if(nm)used.push(nm)});if(pay&&pay.flag)used.push("용기의 깃발");if(pay&&pay.map)used.push("마수 사냥 지도")}
   else{msk.forEach(id=>{if(useSk(id))used.push(SKID[id].nm)});if(mine.f&&useItem("flag"))used.push("용기의 깃발");if(mine.m&&useItem("map"))used.push("마수 사냥 지도")}
   /* 결계 부적: serverPay 면 서버가 이미 소모. 클라 useItem 금지(이중 소모). */
   const ch=serverPay?(pay&&pay.charm?1:0):useItem("charm");if(ch)used.push("결계 부적");
   const cut=d=>ch&&d>0?d*(C.a.includes("물")?2/3:.5):d,base=r.rt||r.total;
   /* 이벤트 골드(r.gx): 서버 pay.g 에 포함됨. serverPay 때 C.gd 에 다시 더하지 않는다. */
   if(r.gx){if(!serverPay)C.gd=Math.max(0,(C.gd||0)+r.gx)}const tn=(!serverPay&&r.gx)?["이벤트 골드 "+(r.gx>0?"+":"")+r.gx]:[],gd=C.t==="수호"?4:0,sc=eq(2)?SCY_DZ:0,wx=(eq(5)?1+WAND_EX:1)*(1+.03*facLv("drill"))*(wfLv()>=1?1+WF_EXP:1)*(1+petEff("ex"))*(disMine()==="storm"?.8:1);if(gd)tn.push("수호: 절망도 상승 4 감소");if(sc)tn.push("낫: 절망도 "+SCY_DZ+" 추가");if(eq(5))tn.push("완드: 경험치 "+Math.round(WAND_EX*100)+"% 증가");if(eq(3)&&!r.ok)tn.push("방패: 실패로 오르는 절망도가 줄었다");
   /* 서버 영수증 → 안내 문구만. C.dz/C.gd/C.ex 는 건드리지 않는다. */
   if(serverPay&&pay){const pg=Math.max(0,Math.floor(Number(pay.g)||0)),pex=Math.max(0,Math.floor(Number(pay.ex)||0)),pcl=Math.max(0,Math.floor(Number(pay.cl)||0)),pdz=Math.round(Number(pay.dz)||0);
    if(pg)tn.push("골드 +"+pg);if(pex)tn.push("경험치 +"+pex);if(pcl)tn.push("토벌 횟수 +"+pcl);
    if(pdz)tn.push("절망도 "+(pdz>0?"+":"")+pdz);
    if(pay.inv&&typeof pay.inv==="object"){const ks=Object.keys(pay.inv).filter(id=>(Number(pay.inv[id])||0)>0);if(ks.length){if(pay.inv.g1)dexAdd("it","g1");tn.push(ks.map(id=>{const n=Number(pay.inv[id])||0;if(id==="mana")return"마력석 +"+n;if(id==="g1")return"작은 꽃다발 +"+n;return(typeof cfName==="function"?cfName(id):id)+" +"+n}).join(", "))}}
    if((Number(pay.clp)||0)>0&&typeof CLP!=="undefined")tn.push(CLP.ic+" "+CLP.nm+" +"+pay.clp);
    if((Number(pay.tc)||0)>0)tn.push("여왕의 표식: 다음 재계약 시험 판정 +"+pay.tc);
    if(pay.rb)tn.push("요정의 축복: 다음 공명 효과 증가");
    if(pay.wa)tn.push("요새 무기고: 오늘 하루 무기 +1");
    if(pay.wp&&pay.wpn){const wr=[["칼",{ex:10}],["총",{gd:20}],["낫",{ex:15}],["방패",{dz:-8}],["오브",{dz:-5}],["완드",{ex:12}],["스태프",{mm:1}]].find(x=>x[0]===pay.wpn)||[pay.wpn,{}];tn.push("무기 더미("+pay.wpn+")"+fxTxt(wr[1]||{}))}
    if(pay.dh)tn.push("절망의 거울: 절망도 "+(Number(pay.dh)>0?"+":"")+pay.dh);
    if(pay.collector)tn.push("수집가: 마력석 1개를 주웠다");
    if(pay.crow)tn.push("밤까마귀가 마력석 1개를 물어 왔다");
    if(pay.egg)tn.push("🥚 사역마의 알을 주웠다!");
    if(pay.eggEv&&typeof PET_EV!=="undefined")tn.push(PET_EV.ic+" "+PET_EV.nm+"을(를) 주웠다!");
    if(pay.petXp)tn.push("사역마 친밀도 +"+pay.petXp)}
   else if(serverPay)tn.push("출정 보상·소모·펫은 서버에서 반영");
   /* 아래 !serverPay 블록·gain 호출: 로컬/옛 방 전용. 마치(serverPay)는 전부 건너뛴다. */
   const fx=r.fx||{};let xe=0,xz=0;C.inv=C.inv||{};
   if(!serverPay&&fx.mm){C.inv.mana=(C.inv.mana||0)+fx.mm;tn.push("마력석 +"+fx.mm)}
   if(!serverPay&&fx.gi){C.inv.g1=(C.inv.g1||0)+fx.gi;dexAdd("it","g1");tn.push("작은 꽃다발 +"+fx.gi)}
   if(!serverPay&&fx.tc){C.tcb=Math.max(C.tcb||0,fx.tc);tn.push("여왕의 표식: 다음 재계약 시험 판정 +"+fx.tc)}
   if(!serverPay&&fx.rb){C.rsb=1;tn.push("요정의 축복: 다음 공명 효과 증가")}
   if(!serverPay&&fx.wa){C.wtmp={day:today(),v:1};tn.push("요새 무기고: 오늘 하루 무기 +1")}
   if(!serverPay&&fx.wp){const wr=[["칼",{ex:10}],["총",{gd:20}],["낫",{ex:15}],["방패",{dz:-8}],["오브",{dz:-5}],["완드",{ex:12}],["스태프",{mm:1}]][C.wp]||["맨손",{gd:10}],e=wr[1];xe+=e.ex||0;xz+=e.dz||0;if(e.gd)C.gd=(C.gd||0)+e.gd;if(e.mm)C.inv.mana=(C.inv.mana||0)+e.mm;tn.push("무기 더미("+wr[0]+")"+fxTxt(e))}
   if(!serverPay&&fx.dh&&(Number(mine.dz)||0)>=70){xz+=fx.dh;tn.push("절망의 거울: 절망도 "+(fx.dh>0?"+":"")+fx.dh)}
   if(r.ok){if(!serverPay)C.cl++;titleState();C.stats.huntsWon=(C.stats.huntsWon||0)+1;
    if(!serverPay){const pe=petDrop("x");if(pe)tn.push(pe);const mt=matGain(["x_ok",(r.rw||1)>=1.4?"x_hi":null,r.ab?"x_ab":null]);if(mt)tn.push(mt);if(typeof clpGain==="function"){const cp=clpGain("x",{ok:1});if(cp)tn.push(cp)};petXp(PET_XP_RUN)}
    if((C.dz||0)>=90)C.stats.clutch=1;if(new Date(Date.now()+9*3600000).getUTCHours()===3)C.stats.dawnWin=1;if(r.solo){const sg=SOLO_RW.g;if(!serverPay){const sm=Math.random()<SOLO_RW.mp?1:0;C.gd=(C.gd||0)+sg;if(sm){C.inv=C.inv||{};C.inv.mana=(C.inv.mana||0)+sm}tn.push("고독의 보상: 골드 +"+sg+(sm?", 마력석 +1":""))}else tn.push("고독의 보상"+(pay&&pay.soloM?", 마력석 +1":""));C.stats.soloWins=(C.stats.soloWins||0)+1;if(r.ab)C.stats.soloAbyss=1}
   if(r.ab){C.stats.abyssWins=(C.stats.abyssWins||0)+1;if(!(C.wp>=0))C.stats.abyssBare=1;tn.push("심연을 끝까지 걸어 나왔다")}
    if(!serverPay){C.gd=(C.gd||0)+Math.round((30+10*base)*m*(C.t==="행운"?1.1:1)*(1+.05*facLv("workshop"))*(disMine()==="eclipse"?.7:1)*(1+.05*rnLv("luck"))*(wfLv()>=2?1+WF_GOLD:1)*(1+petEff("gd")));if(C.t==="행운")tn.push("행운: 골드 10% 증가");if(C.t==="수집가"&&Math.random()<.3){C.inv=C.inv||{};C.inv.mana=(C.inv.mana||0)+1;tn.push("수집가: 마력석 1개를 주웠다")}if(petEff("mana")&&Math.random()<petEff("mana")){C.inv=C.inv||{};C.inv.mana=(C.inv.mana||0)+1;tn.push("밤까마귀가 마력석 1개를 물어 왔다")}}
    /* 절망·경험: serverPay 이면 인자 0. 산식은 서버 marchSide/corePay 와 같되 클라에서 돌리면 이중 반영. */
    {const dzAmt=serverPay?0:cut(Math.max(0,r.ev+v.dz+r.total*3-gd+sc-wtz+dkz));gain(serverPay?0:((30+10*base)*v.x*m+(r.ex||0))*wx,dzAmt)}}
   else{titleState();C.stats.huntsLost=(C.stats.huntsLost||0)+1;
    if(!serverPay){const mt=matGain(["x_fail"]);if(mt)tn.push(mt);if(typeof clpGain==="function"){const cp=clpGain("x",{ok:0});if(cp)tn.push(cp)}}
    if(!serverPay)C.gd=(C.gd||0)+5;{const dzAmt=serverPay?0:cut(Math.max(0,(eq(3)?12:25)-gd+sc-wtz+dkz));gain(serverPay?0:(8+(r.ex||0))*wx,dzAmt)}}
   /* xe/xz 는 !serverPay 의 fx.wp·dh 에서만 채워진다. serverPay 면 여기 gain 도 no-op. */
   if(xe||xz)gain(xe,xz);checkTitles();if(tn.length)out+="<p>"+tn.join(" · ").split(typeof CLP_MARK==="string"?CLP_MARK:"\u0001").join(typeof clpImgHtml==="function"?clpImgHtml():"")+"</p>";{const nd=(r.evs||[]).filter(id=>EVM[id]&&dexAdd("ev",id)).map(id=>evName(EVM[id],evVil(id)||"A")[0]);if(nd.length)note("dex","도감에 새 출정 이벤트가 기록되었다: "+nd.join(", "))}
   /* 로비/로컬 방만 클라가 march 알림. 매지컬 마치(serverPay)는 서버 c/nt. */
   if(!serverPay){const payBits=r.gx?" · 이벤트 골드 +"+r.gx:"";note("march",(r.ok?"토벌 성공":"토벌 실패")+" · 전투 "+r.total+"번 · 파티 "+Object.keys(r.pl).length+"명"+payBits)}
   guardAdd(r.ok?Math.round(10*(r.rw||1)):2);out+="<p><strong>"+(r.ok?"토벌 횟수가 늘었다.":"절망도가 올랐다.")+"</strong></p>"+(used.length?"<p>사용한 아이템·마법: "+used.join(", ")+(ch?" (절망도 상승이 절반으로 줄었다)":"")+"</p>":"");return out}

