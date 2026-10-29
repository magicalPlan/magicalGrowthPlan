/* 몬스터 웨이브. main.js 다음에 불러야 한다. 하루 세 번, 30분 동안 함께 막는 전투.
   진행 중인지와 남은 시간은 시각으로 계산한다. 참가자 피해는 전장 화면을 연 뒤에만 받는다. */
const wvBaseNow = () => Math.max(WV_HP,Math.round(onlineTopPw()*WV_K));

const wvBase = () => {
   const L = (WVL||[]).filter(v => v && v.u);
   if (!L.length) return wvBaseNow();
   const f = L.slice().sort( (a,b) => (Number(a.t0||a.ts)||0) - (Number(b.t0||b.ts)||0)) [0];
   return Number(f.b0) > 0 ? Number(f.b0) : WV_HP
};

const wvHp = n => Math.round( wvBase() * Math.pow(WV_GROW, n - 1) );
const wvTotal = n => { 
   let t=0;
   for (let i=1; i<=n; i++) t+=wvHp(i);
   return t
};


// t 시각 기준 현재(또는 가장 최근) 웨이브와 다음 웨이브
function wvAt (t) {
   const k = new Date(t + 9 * 3600000), day = Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate() ) - 9 * 3600000, list=[];
   for ( const dd of [-1,0,1] ) WV_HOURS.forEach(h => {
      const T0 = day + dd * 864e5 + h * 3600000, d = new Date(T0 + 9 * 3600000);
      list.push({ id:"wave-" + d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2 , "0") + String(d.getUTCDate()).padStart(2 , "0") + "-" + h, T0, T1:T0+WV_LEN,h

      }
   )});
   list.sort( (a,b) => a.T0-b.T0);
   return{cur: list.filter(w => w.T0 <= t).pop(), next:list.find( w => w.T0 > t)
   }
}

// 피해 합으로 몇 웨이브를 막았는지, 지금 웨이브의 남은 HP
function wvState (sum) {
   let n = 0, acc = 0;
   while( n < WV_N && sum >= acc + wvHp(n+1) ) {
      acc += wvHp(n+1);
      n++
   }
   return{ cleared:n, cur:Math.min(WV_N,n+1), hp:n >= WV_N ? 0 : wvHp(n+1) - (sum-acc), mx:n >= WV_N ? wvHp(WV_N) : wvHp(n+1) }
}

let WVL=[],wvT=0,wvBusy=false;
async function loadWave(w,force){if(!w||!XON()||wvBusy)return;if(!force&&Date.now()-wvT<5000)return;wvBusy=true;wvT=Date.now();try{const s=await once(DB.collection("wboss/"+w.id));WVL=s.docs.map(d=>d.data()).filter(v=>v&&v.u)}catch(e){}finally{wvBusy=false}}
const wvSum=()=>WVL.reduce((a,v)=>a+(Number(v.d)||0),0);
async function wvAttack(){const {cur:w}=wvAt(Date.now()),m=$("#wvm"),now=Date.now();if(!w||now>=w.T1)return;
 if(C.fall||C.dz>=90){m.style.color="var(--bad)";m.textContent=C.fall?"타락한 동안에는 싸울 수 없다.":"절망도가 너무 높아 싸울 수 없다.";return}
 if(now-(C.wva||0)<WV_CD)return;await loadWave(w,true);const st=wvState(wvSum());if(st.cleared>=WV_N){m.style.color="var(--mu)";m.textContent="모든 웨이브를 막아 냈다!";return}
 const mine=WVL.find(v=>v.u===UID)||{},d=Math.max(1,Math.round(pw()*(1.5+Math.random())*(C.a.includes("불")?1.2:1)*((VL[C.v]||{}).bd||1)));
 const b0=Number(mine.b0)||wvBase(),t0=Number(mine.t0)||now;C.wva=now;try{await DB.doc("wboss/"+w.id+"/"+UID).set({u:UID,n:nmOf(),d:(Number(mine.d)||0)+d,p:pw(),c:(Number(mine.c)||0)+1,ts:now,t0,b0})}catch(e){m.style.color="var(--bad)";m.textContent="공격하지 못했다. 잠시 뒤에 다시 시도해 보자.";C.wva=0;return}
 C.wvj=keepIds(C.wvj,w.id);C.gd=(C.gd||0)+WV_HIT;titleState();C.stats.waveHits=(C.stats.waveHits||0)+1;save();
 const i=WVL.findIndex(v=>v.u===UID);const rec={u:UID,n:nmOf(),d:(Number(mine.d)||0)+d,p:pw(),c:(Number(mine.c)||0)+1,ts:now,t0,b0};if(i>=0)WVL[i]=rec;else WVL.push(rec);
 const st2=wvState(wvSum());m.style.color="var(--mu)";m.textContent=st2.cur+"웨이브 「"+WV_NAMES[st2.cur-1]+"」에 "+d+"의 피해! (골드 +"+WV_HIT+")"+(st2.cleared>st.cleared?" "+st2.cleared+"웨이브를 막아 냈다!":"");wvDraw()}
// 끝난 웨이브의 보상: 참가자 모두 막아 낸 웨이브 수만큼, 피해 1위는 마력석 2개 추가.
async function wvClaim(){if(!C||!XON())return;const {cur:w}=wvAt(Date.now());if(!w||Date.now()<w.T1||!(C.wvj&&C.wvj[w.id])||(C.wvc&&C.wvc[w.id]))return;
 await loadWave(w,true);const st=wvState(wvSum()),top=WVL.slice().sort((a,b)=>(b.d||0)-(a.d||0))[0],mvp=!!top&&top.u===UID;if(C.wvc&&C.wvc[w.id])return;C.wvc=keepIds(C.wvc,w.id);
 const r={g:WV_RW.g*st.cleared,m:Math.floor(st.cleared/WV_RW.mEvery)+(mvp?WV_RW.mvp:0)};giveRw(r);if(st.cleared)gain(WV_RW.ex*st.cleared,0);titleState();C.stats.waveBest=Math.max(C.stats.waveBest||0,st.cleared);if(st.cleared>=WV_N)C.stats.waveFull=(C.stats.waveFull||0)+1;
 note("wave","몬스터 웨이브 종료: "+st.cleared+" / "+WV_N+"웨이브를 막아 냈다. 보상 "+(rwTxt(r)||"없음")+(st.cleared?", 경험치 "+WV_RW.ex*st.cleared:"")+(mvp?" (피해 1위!)":""));toast("⚔ 몬스터 웨이브 종료 · "+st.cleared+"웨이브 방어 · "+(rwTxt(r)||"보상 없음"));save();checkTitles()}
// 알림: 시작 10분 전, 시작할 때
function wvAlert(){if(!C||!XON())return;const now=Date.now(),{cur,next}=wvAt(now);
 if(next&&next.T0-now<=600000&&C.wvn1!==next.id){C.wvn1=next.id;save();toast("⚔ 10분 뒤 몬스터 웨이브가 몰려온다! ("+String(next.h).padStart(2,"0")+":00)")}
 if(cur&&now<cur.T1&&C.wvn2!==cur.id){C.wvn2=cur.id;save();const t="⚔ 몬스터 웨이브가 시작되었다! 30분 동안 함께 막아 내자.";note("wave",t);toast(t,waveView);ding()}}
function wvTxt(ms){const t=Math.max(0,Math.ceil(ms/1000)),h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;return h?h+"시간 "+m+"분":m+":"+String(s).padStart(2,"0")}
function hubWave(){const box=$("#hwv");if(!box||!C)return;box.innerHTML="";if(!XON()){box.appendChild(elT("p","hint","서버에 연결되어야 참가할 수 있다."));return}
 const now=Date.now(),{cur,next}=wvAt(now),live=cur&&now<cur.T1,w=elT("div","dq wv"+(live?" done":"")),cp=elT("div","dq-copy");
 if(live)cp.append(elT("b","","⚔ 몬스터 웨이브 진행 중"),elT("small","","남은 시간 "+wvTxt(cur.T1-now)+" · 전장에서 참가자와 피해를 본다"));
 else cp.append(elT("b","","⚔ 다음 몬스터 웨이브"),elT("small","",(next?String(next.h).padStart(2,"0")+":00 시작 · "+wvTxt(next.T0-now)+" 남음":"")+" · 매일 "+WV_HOURS.map(h=>h+"시").join(", ")+", 30분 동안"));
 const b=elT("button","chip",live?"전장으로":"보기");b.type="button";b.onclick=waveView;w.append(cp,b);box.appendChild(w)}
function waveView(){show("wave");$("#wvm").textContent="";const {cur}=wvAt(Date.now());loadWave(cur,true).then(wvDraw);wvDraw()}
function wvDraw(){if($("#v-wave").hidden||!C)return;const box=$("#wvb");box.innerHTML="";const now=Date.now(),{cur,next}=wvAt(now),live=cur&&now<cur.T1;
 if(!live){const c=elT("div","card");c.append(elT("h2","","다음 웨이브까지 "+(next?wvTxt(next.T0-now):"-")),elT("p","hint","매일 "+WV_HOURS.map(h=>String(h).padStart(2,"0")+":00").join(", ")+"에 30분 동안 열린다. 시작 10분 전에 알림이 온다."));
  if(cur&&WVL.length){const st=wvState(wvSum());c.appendChild(elT("p","","지난 웨이브 결과: "+st.cleared+" / "+WV_N+"웨이브 방어 · 참가 "+WVL.length+"명"))}box.appendChild(c)}
 else{const st=wvState(wvSum()),c=elT("div","card boss-card w");c.append(elT("p","boss-tag","웨이브 "+st.cur+" / "+WV_N+" · 남은 시간 "+wvTxt(cur.T1-now)),elT("h2","",WV_NAMES[st.cur-1]));
  const bar=elT("div","bar"),f=elT("i");f.style.width=(st.mx?Math.max(0,st.hp)/st.mx*100:0)+"%";bar.appendChild(f);c.append(bar,elT("p","hint","HP "+Math.max(0,st.hp)+" / "+st.mx+" · 막아 낸 웨이브 "+st.cleared+" · 참가 "+WVL.length+"명"));
  const steps=elT("div","wv-steps");for(let i=1;i<=WV_N;i++)steps.appendChild(elT("span",i<=st.cleared?"on":i===st.cur?"cur":"",String(i)));c.appendChild(steps);
  const left=WV_CD-(now-(C.wva||0)),b=elT("button","btn",st.cleared>=WV_N?"모든 웨이브를 막아 냈다!":C.fall?"타락 중에는 싸울 수 없다":C.dz>=90?"절망도가 너무 높아 싸울 수 없다":left>0?"다시 공격까지 "+Math.ceil(left/1000)+"초":"공격한다 (예상 피해 "+Math.round(pw()*1.5)+"~"+Math.round(pw()*2.5)+")");
  b.type="button";b.disabled=st.cleared>=WV_N||!!C.fall||C.dz>=90||left>0;b.onclick=wvAttack;c.appendChild(b);box.appendChild(c)}
 const rank=WVL.slice().sort((a,b)=>(b.d||0)-(a.d||0));if(rank.length){const ol=elT("ol","boss-rank");rank.slice(0,10).forEach(v=>ol.appendChild(elT("li",v.u===UID?"me":"",cn(v.u,v.n)+" · 피해 "+(Number(v.d)||0)+" ("+(Number(v.c)||0)+"회)")));box.appendChild(ol)}
 box.appendChild(elT("p","boss-info","30초에 한 번 공격(골드 +"+WV_HIT+"). 1웨이브 HP는 가장 강한 마법소녀의 전투력 ×"+WV_K+"(웨이브마다 "+WV_GROW+"배). 끝나면 참가자 모두 막아 낸 웨이브 1개당 골드 "+WV_RW.g+"·경험치 "+WV_RW.ex+", "+WV_RW.mEvery+"웨이브마다 마력석 1개. 피해 1위는 마력석 "+WV_RW.mvp+"개 추가. 10웨이브를 모두 막으면 칭호 '파도를 가른 자'."))}
setInterval(()=>{if(!C||!XON())return;wvAlert();wvClaim();const {cur}=wvAt(Date.now()),live=cur&&Date.now()<cur.T1;
 if(!$("#v-wave").hidden){if(live)loadWave(cur).then(wvDraw);wvDraw()}else if(!$("#v-hub").hidden)hubWave()},1000);
$("#wvx").onclick=()=>hub();


/**
 * wvAttack() 함수 내에서 호출되는 pw(), onlineTopPw(), UID, nmOf() 등은 이 파일 외부에 정의된 전역 함수 및 변수입니다.
또한 C(유저 상태 객체)의 속성들(C.fall, C.dz, C.a, C.v, C.stats 등)을 직접 수정하고 있습니다. 만약 외부에서 해당 함수나 객체 구조가 변경된다면 이 파일의 로직이 소리 없이 깨질 수 있습니다. 의존성을 줄이거나 주석으로 외부 의존 함수를 명시해 두는 것이 좋습니다.
 */