/* 매지컬 마치 방. main.js 다음에 불러야 한다. 방 만들기, 입장, 준비, 출발, 출정 진행과 결과 정산.
   마을 화면은 sweepRooms 를, 정기 출정은 me, startSim, simStep, resolveChoice, settle, vtx 를 그대로 부른다. */
/* 매지컬 마치: 방 */
let room=null,code=null,unR=null,unL=null,tick=null;
const me=()=>({tw:facLv("tower"),tn:tiName(C.ti),n:C.n,a:C.a.join(""),g:C.g,t:C.t,p:pw(),v:C.v,f:armed("flag")?1:0,m:armed("map")?1:0,w:C.wp,sk:["water","wind","dark"].filter(armedSk),dz:C.dz||0});
const rref=c=>DB.doc("rooms/"+c);
const rmsg=t=>{$("#rm").textContent=t;if(!$("#v-hub").hidden){$("#hm").style.color="var(--bad)";$("#hm").textContent=t}};
// 매지컬 마치 화면 열기(마을 화면의 정기 출정 목록에서 바로 참가할 수 있어 버튼은 없앴다)
const openRooms=()=>{if(C.fall)return($("#hm").style.color="var(--bad)",$("#hm").textContent="타락한 동안에는 출정할 수 없다.");if(C.dz>=90)return($("#hm").style.color="var(--bad)",$("#hm").textContent="절망도가 너무 높아 출정할 수 없다. 공명으로 절망도를 낮춘 뒤에 다시 오자.");show("rooms");watchList()};
$("#rb").onclick=()=>{unL&&unL();unL=null;hub()};
function watchList(){rmsg("");if(LOCAL)rmsg("혼자 하기에서는 정기 출정이 열리지 않는다. 서버에 연결해 로그인하면 출정할 수 있다.");if(!DB){rmsg("이 화면에서는 방 기능을 쓸 수 없다. 공유 기능이 켜진 상태로 열어야 한다.");return}
 watchX();drawXAll()}
async function mk(pub){if(!DB)return rmsg("방 기능을 쓸 수 없다.");const c=Math.random().toString(36).slice(2,6).toUpperCase();
 const r={code:c,pub,host:UID,st:"lobby",pl:{[UID]:me()},rd:{[UID]:true},seq:[],step:0,ok:true,ev:0,total:3+R(3),ts:Date.now()};
 try{await rref(c).set(r);enter(c)}catch(e){rmsg("방을 만들지 못했다.")}}
async function join(c){if(!DB)return rmsg("방 기능을 쓸 수 없다.");if(c.length!==4)return rmsg("코드는 4자다.");
 try{const s=await rref(c).get();if(!s.exists)return rmsg("그런 방이 없다.");const r=s.data();r.seq=r.seq||[];r.rd=r.rd||{};
 if(r.pl[UID]){enter(c);return}if(r.st!=="lobby"||Object.keys(r.pl).length>=3)return rmsg("들어갈 수 없는 방이다.");
 r.pl[UID]=me();r.rd[UID]=false;await rref(c).set(r);enter(c)}catch(e){rmsg("입장하지 못했다.")}}
function enter(c){code=c;room=null;myV=null;clearInterval(cdT);cdT=setInterval(cdTick,500);$("#chv").hidden=true;unL&&unL();unL=null;show("room");$("#lg").hidden=true;$("#rrm").textContent="";
 unR=rref(c).onSnapshot(s=>{if(!s.exists){const wd=room&&room.st==="done";leave();const h=$("#hm");h.style.color="var(--mu)";h.textContent=wd?"출정이 끝나 방이 정리되었다.":"출정 방이 사라졌다.";return}room=s.data();room.seq=room.seq||[];room.rd=room.rd||{};draw()},e=>$("#rrm").textContent="연결이 끊겼다.")}
function leave(){unR&&unR();unR=null;clearInterval(tick);tick=null;clearInterval(cdT);cdT=null;room=null;code=null;hub()}
$("#rx").onclick=async()=>{if(room&&DB&&room.st==="lobby"){try{if(room.host===UID||Object.keys(room.pl).length<=1)await rref(code).delete();else{delete room.pl[UID];delete room.rd[UID];await rref(code).set(room)}}catch(e){}}
 // 끝난 방: 방장이 나가면 파티원들이 결과를 받을 시간을 10초 준 뒤 지운다.
 else if(room&&DB&&room.st==="done"&&room.host===UID){const c=code,r=room;setTimeout(()=>delRoom(c,r),10000)}leave()};
$("#rd").onclick=async()=>{if(!room||room.st!=="lobby")return;room.rd[UID]=!room.rd[UID];room.ts=Date.now();room.pl[UID]=me();try{await rref(code).set(room)}catch(e){}};
$("#bt").onclick=async()=>{const n=pw();["동료 하나","동료 둘"].forEach((x,i)=>{if(Object.keys(room.pl).length<3){const k="bot"+i;room.pl[k]={n:x,a:"-",g:C.g,t:"-",p:Math.max(10,n-2+i*2),v:C.v};room.rd[k]=true}});try{await rref(code).set(room)}catch(e){}};
$("#st").onclick=async()=>{if(room.host!==UID)return;startSim(room);room.st="run";room.step=0;
 try{await rref(code).set(room)}catch(e){$("#rrm").textContent="출발하지 못했다."}};
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
const fxTxt=x=>{const a=[];if(x.ex)a.push("경험치 +"+x.ex);if(x.gd)a.push("골드 "+(x.gd>0?"+":"")+x.gd);if(x.mm)a.push("마력석 +"+x.mm);if(x.gi)a.push("작은 꽃다발 +"+x.gi);if(x.pw)a.push("이번 출정 전투력 +"+x.pw);if(x.bt)a.push(x.bt>0?"전투 +"+x.bt:"전투 "+x.bt);if(x.tc)a.push("다음 재계약 시험 판정 +"+x.tc);if(x.rb)a.push("다음 공명 효과 증가");if(x.wa)a.push("오늘 하루 무기 +1");if(x.dh)a.push("절망도 70 이상인 사람만 절망도 "+(x.dh>0?"+":"")+x.dh);if(x.dz>0)a.push("절망도 +"+x.dz);if(x.dz<0)a.push("절망도 "+x.dz);return a.length?" ("+a.join(", ")+")":""};
// 권장 전투력 = (BT_BASE + BT_STEP × 몇 번째 전투) × 위험도. 기준치 = 50 + BT_K × (파티 전투력 ÷ 권장 전투력 − 1), 15~85 사이.
let BT_BASE=300,BT_STEP=60,BT_K=60;
const battleT=(P,i,df)=>Math.max(15,Math.min(85,Math.round(50+BT_K*(P/((BT_BASE+BT_STEP*i)*df)-1))));
const battleJ=(n,T,cd)=>n>=96?0:n<=Math.max(1,Math.floor(T/(cd||5)))?3:n<=T?2:n<=Math.min(95,T+30)?1:0;
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
let busyT=false,myV=null,cdT=null;
function delRoom(c,r){if(!DB||!c)return;rref(c).delete().catch(()=>{});if(r&&r.pl)humansOf(r).forEach(u=>vref(c,u).delete().catch(()=>{}))}
// 방장이 창을 닫아 남은 방, 오래된 투표 기록을 정리한다. rooms 전체를 받지 않는다.
// 10분에 한 번, 자물쇠를 얻은 클라이언트만 키 목록을 보고 파티 방과 오래된 정기 출정 자리만 지운다.
let lastSweep=0;
async function sweepClaim(){const now=Date.now();try{const res=await DB.doc("tally/roomsweep").transact(c=>{if(c&&now-(Number(c.at)||0)<540000)return;return {at:now,u:UID}});return !!(res&&res.u===UID&&Number(res.at)===now)}catch(e){return false}}
async function sweepRooms(){if(!DB||!UID||Date.now()-lastSweep<600000)return;lastSweep=Date.now();if(!(await sweepClaim()))return;let keys=[];try{keys=Object.keys((await DB.doc("rooms").peek())||{})}catch(e){return}
 const now=Date.now(),party=keys.filter(id=>id!==code&&/^[A-Z0-9]{4}(v_.+)?$/.test(id));
 for(let i=0;i<party.length;i+=6){await Promise.all(party.slice(i,i+6).map(async id=>{let v=null;try{v=(await DB.doc("rooms/"+id).get()).data()}catch(e){return}if(!v)return;const age=now-(Number(v.ts)||0);
  const stale=v.st==null?(!v.ts||age>300000):(!v.ts||(v.st==="done"&&age>120000)||(v.st==="run"&&age>1800000)||(v.st==="lobby"&&age>3600000));if(stale)DB.doc("rooms/"+id).delete().catch(()=>{})}))}
 if(typeof xSweep==="function")xSweep(keys)}
async function hostTick(){if(room&&room.host===UID&&room.st==="done"&&Date.now()-(room.doneAt||0)>ROOM_KEEP){const c=code,r=room;delRoom(c,r);return}
 if(!room||room.host!==UID||room.st!=="run"||busyT)return;busyT=true;const c=code;try{let ch=false;
 if(room.step<room.seq.length){room.step++;ch=true}
 else if(room.pend&&!room.ch){const x=EVM[room.pend.id],cx=evCtx(room),ops=x.o.map((o,i)=>i).filter(i=>!x.o[i].req||x.o[i].req(cx)),h=(cx.tr("번뜩임")||cx.tr("예민함"))?x.o.findIndex(o=>o.ok):-1;
  room.ch={id:room.pend.id,v:room.pend.v,k:room.seq.length,until:Date.now()+CHOICE_MS,ops,h};ch=true}
 else if(room.ch){const hs=humansOf(room),picks=[];for(const u of hs){try{const s=await vref(c,u).get(),d=s.exists&&s.data();if(d&&d.k===room.ch.k&&(room.ch.ops||[]).includes(d.i))picks.push(d.i)}catch(e){}}
  if(picks.length>=hs.length||Date.now()>=room.ch.until){resolveChoice(room,picks);hs.forEach(u=>vref(c,u).delete().catch(()=>{}));ch=true}}
 else if(room.fin){room.st="done";room.doneAt=Date.now();ch=true}
 if(ch&&room&&code===c){room.ts=Date.now();await rref(c).set(room)}}catch(e){}busyT=false}
function drawChoice(r){const cv=$("#chv");if(!(r.st==="run"&&r.ch&&r.step>=r.seq.length&&EVM[r.ch.id])){cv.hidden=true;return}
 const x=EVM[r.ch.id];cv.hidden=false;cv.innerHTML="";cv.appendChild(elT("p","choice-q",vtx(x.q,r.ch.v)));const row=elT("div","row");
 const ops=(r.ch.ops&&r.ch.ops.length)?r.ch.ops:x.o.map((_,i)=>i);ops.forEach(i=>{const o=x.o[i],b=elT("button","chip",o.l+(o.rl?" ("+o.rl+")":"")+(r.ch.h===i?" ✦":""));b.type="button";b.setAttribute("aria-pressed",myV&&myV.k===r.ch.k&&myV.i===i?"true":"false");
  b.onclick=async()=>{myV={k:r.ch.k,i};drawChoice(r);try{await vref(code,UID).set({k:r.ch.k,i,ts:Date.now()})}catch(e){}};row.appendChild(b)});
 cv.appendChild(row);if(r.ch.h>=0)cv.appendChild(elT("p","hint","✦ 파티의 직감(번뜩임·예민함)이 답을 속삭인다."));cv.appendChild(elT("p","hint choice-t",""));cdTick()}
function cdTick(){const t=document.querySelector("#chv .choice-t");if(!t||!room||!room.ch)return;const left=Math.max(0,Math.ceil((room.ch.until-Date.now())/1000));
 t.textContent=(myV&&myV.k===room.ch.k?"골랐다. ":"")+"남은 시간 "+left+"초 · 파티원이 함께 고른다. 표가 갈리면 무작위로 정해진다."}

function draw(){const r=room,ids=Object.keys(r.pl),all=ids.length>=1&&ids.every(i=>r.rd[i]);
 $("#rt").textContent="출정 방 "+(r.pub?"(공개)":"(비공개 코드 "+r.code+")");
 const pm=ids.some(i=>r.pl[i].m),pf=ids.some(i=>r.pl[i].f);drawChoice(r);$("#rs").textContent=r.st!=="lobby"&&r.ch&&r.step>=r.seq.length?"선택의 순간":r.st==="lobby"?"파티 "+ids.length+"/3 · 전투 "+(pm?"3번 (사냥 지도)":r.total+"번 예정")+(pf?" · 용기의 깃발 +5":""):"출정 중";
 const l=$("#pl");l.innerHTML="";ids.forEach(i=>{const p=r.pl[i],d=document.createElement("div");d.className="chip";d.style.textAlign="left";
  if(i!==UID){d.tabIndex=0;d.setAttribute("role","button");d.style.cursor="pointer";d.onclick=()=>openProfile(i)}d.textContent=cn(i,p.n)+(i===UID?" (나)":"")+" · "+p.g+"등급 "+p.a+" · 전투력 "+p.p+(r.rd[i]?" · 준비 완료":"");l.appendChild(d)});
 $("#rd").hidden=r.st!=="lobby";$("#rd").textContent=r.rd[UID]?"준비 취소":"준비 완료";
 $("#st").hidden=!(r.st==="lobby"&&r.host===UID);$("#st").disabled=!all;$("#bt").hidden=!(LOCAL&&r.st==="lobby"&&ids.length<3);
 if(r.st!=="lobby"){const g=$("#lg");g.hidden=false;g.innerHTML=r.seq.slice(0,r.step).map(t=>"<p>"+t+"</p>").join("")||"<p>출발한다...</p>";
  $("#rx").textContent="마을로 돌아가기";
  if(r.st==="run"&&r.host===UID&&!tick)tick=setInterval(hostTick,2200);
  if(r.st==="done"&&C.last!==r.code+r.seq.length)g.innerHTML+=settle(r)}}
// 출정 결과를 내 캐릭터에 반영하고, 기록 창에 붙일 HTML을 돌려준다. 같은 출정은 한 번만 반영된다.
function settle(r){if(C.last===r.code+r.seq.length)return "";C.last=r.code+r.seq.length;let out="";const v=VL[C.v],m=(Object.keys(r.pl).length===1&&r.solo?SOLO_M:([0,.6,.7,.8,.87,.93,.97,1][Object.keys(r.pl).length]||1))*(r.rw||1);
   const mine=r.pl[UID]||{},used=[],msk=mine.sk||[],dkz=msk.includes("dark")?6:0,wtz=r.wsk?5:0;msk.forEach(id=>{if(useSk(id))used.push(SKID[id].nm)});if(mine.f&&useItem("flag"))used.push("용기의 깃발");if(mine.m&&useItem("map"))used.push("마수 사냥 지도");const ch=useItem("charm");if(ch)used.push("결계 부적");
   // 결계 부적: 오르는 절망도를 절반으로. 물 속성과 겹쳐도 합쳐서 절반까지만 줄어든다.
   const cut=d=>ch&&d>0?d*(C.a.includes("물")?2/3:.5):d,base=r.rt||r.total;
   if(r.gx){C.gd=Math.max(0,(C.gd||0)+r.gx)}const tn=r.gx?["이벤트 골드 "+(r.gx>0?"+":"")+r.gx]:[],gd=C.t==="수호"?4:0,sc=eq(2)?SCY_DZ:0,wx=(eq(5)?1+WAND_EX:1)*(1+.03*facLv("drill"))*(wfLv()>=1?1+WF_EXP:1)*(1+petEff("ex"))*(disMine()==="storm"?.8:1);if(gd)tn.push("수호: 절망도 상승 4 감소");if(sc)tn.push("낫: 절망도 "+SCY_DZ+" 추가");if(eq(5))tn.push("완드: 경험치 "+Math.round(WAND_EX*100)+"% 증가");if(eq(3)&&!r.ok)tn.push("방패: 실패로 오르는 절망도가 줄었다");
   const fx=r.fx||{};let xe=0,xz=0;C.inv=C.inv||{};
   if(fx.mm){C.inv.mana=(C.inv.mana||0)+fx.mm;tn.push("마력석 +"+fx.mm)}
   if(fx.gi){C.inv.g1=(C.inv.g1||0)+fx.gi;dexAdd("it","g1");tn.push("작은 꽃다발 +"+fx.gi)}
   if(fx.tc){C.tcb=Math.max(C.tcb||0,fx.tc);tn.push("여왕의 표식: 다음 재계약 시험 판정 +"+fx.tc)}
   if(fx.rb){C.rsb=1;tn.push("요정의 축복: 다음 공명 효과 증가")}
   if(fx.wa){C.wtmp={day:today(),v:1};tn.push("요새 무기고: 오늘 하루 무기 +1")}
   if(fx.wp){const wr=[["칼",{ex:10}],["총",{gd:20}],["낫",{ex:15}],["방패",{dz:-8}],["오브",{dz:-5}],["완드",{ex:12}],["스태프",{mm:1}]][C.wp]||["맨손",{gd:10}],e=wr[1];xe+=e.ex||0;xz+=e.dz||0;if(e.gd)C.gd=(C.gd||0)+e.gd;if(e.mm)C.inv.mana=(C.inv.mana||0)+e.mm;tn.push("무기 더미("+wr[0]+")"+fxTxt(e))}
   if(fx.dh&&(Number(mine.dz)||0)>=70){xz+=fx.dh;tn.push("절망의 거울: 절망도 "+(fx.dh>0?"+":"")+fx.dh)}
   if(r.ok){C.cl++;titleState();C.stats.huntsWon=(C.stats.huntsWon||0)+1;{const pe=petDrop("x");if(pe)tn.push(pe)}petXp(PET_XP_RUN);if((C.dz||0)>=90)C.stats.clutch=1;if(new Date(Date.now()+9*3600000).getUTCHours()===3)C.stats.dawnWin=1;if(r.solo){const sg=SOLO_RW.g,sm=Math.random()<SOLO_RW.mp?1:0;C.gd=(C.gd||0)+sg;if(sm){C.inv=C.inv||{};C.inv.mana=(C.inv.mana||0)+sm}C.stats.soloWins=(C.stats.soloWins||0)+1;if(r.ab)C.stats.soloAbyss=1;tn.push("고독의 보상: 골드 +"+sg+(sm?", 마력석 +1":""))}
   if(r.ab){C.stats.abyssWins=(C.stats.abyssWins||0)+1;if(!(C.wp>=0))C.stats.abyssBare=1;tn.push("심연을 끝까지 걸어 나왔다")}C.gd=(C.gd||0)+Math.round((30+10*base)*m*(C.t==="행운"?1.1:1)*(1+.05*facLv("workshop"))*(disMine()==="eclipse"?.7:1)*(1+.05*rnLv("luck"))*(wfLv()>=2?1+WF_GOLD:1)*(1+petEff("gd")));if(C.t==="행운")tn.push("행운: 골드 10% 증가");
    if(C.t==="수집가"&&Math.random()<.3){C.inv=C.inv||{};C.inv.mana=(C.inv.mana||0)+1;tn.push("수집가: 마력석 1개를 주웠다")}
    if(petEff("mana")&&Math.random()<petEff("mana")){C.inv=C.inv||{};C.inv.mana=(C.inv.mana||0)+1;tn.push("밤까마귀가 마력석 1개를 물어 왔다")}
    gain(((30+10*base)*v.x*m+(r.ex||0))*wx,cut(Math.max(0,r.ev+v.dz+r.total*3-gd+sc-wtz+dkz)))}else{titleState();C.stats.huntsLost=(C.stats.huntsLost||0)+1;C.gd=(C.gd||0)+5;gain((8+(r.ex||0))*wx,cut(Math.max(0,(eq(3)?12:25)-gd+sc-wtz+dkz)))}if(xe||xz)gain(xe,xz);checkTitles();if(tn.length)out+="<p>"+tn.join(" · ")+"</p>";{const nd=(r.evs||[]).filter(id=>EVM[id]&&dexAdd("ev",id)).map(id=>evName(EVM[id],evVil(id)||"A")[0]);if(nd.length)note("dex","도감에 새 출정 이벤트가 기록되었다: "+nd.join(", "))}note("march",(r.ok?"토벌 성공":"토벌 실패")+" · 전투 "+r.total+"번 · 파티 "+Object.keys(r.pl).length+"명"+(r.gx?" · 이벤트 골드 +"+r.gx:""));
   guardAdd(r.ok?Math.round(10*(r.rw||1)):2);out+="<p><strong>"+(r.ok?"토벌 횟수가 늘었다.":"절망도가 올랐다.")+"</strong></p>"+(used.length?"<p>사용한 아이템·마법: "+used.join(", ")+(ch?" (절망도 상승이 절반으로 줄었다)":"")+"</p>":"");return out}

