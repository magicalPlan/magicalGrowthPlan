/* 단서 탐색. js/event-boss/boss.js 다음에 불러야 한다. 실전 > 장기 의뢰, 이벤트 보스 아래.
   화면은 html/act/ord.html 의 #clue. 시간과 보상은 data/clue/hunt.js, 조사 문장은 data/clue/script.js.
   떠나는 동안의 계산·철수·출정 금지는 장기 토벌(js/main.js 의 lhStart, lhClaim)과 같다.
   기록은 캐릭터의 C.clue 에만 남는다. */
const clueOf=id=>(CLUE||[]).find(x=>x.id===id);
const clueOn=()=>!!(C&&C.clue&&clueOf(C.clue.k));
const clueBonus=hr=>1+.1*Math.max(0,hr-1)/1.67;
function clueDraw(){const box=$("#clue");if(!box||!C)return;if(C.clue&&!clueOf(C.clue.k))C.clue=null;box.innerHTML="";const now=Date.now();
 if(clueOn()){const h=C.clue,L=clueOf(h.k),done=now>=h.t1,w=elT("div","dq clue-on"+(done?" got":"")),cp=elT("div","dq-copy"),bar=elT("div","bar"),f=elT("i");
  f.style.width=Math.min(100,(now-h.t0)/Math.max(1,h.t1-h.t0)*100)+"%";bar.appendChild(f);
  cp.append(elT("b","","🔍 "+L.nm+(done?" · 귀환!":" · 탐색 중")),elT("small","",done?"탐색을 마치고 돌아왔다. 보상을 받자.":"남은 시간 "+cdTxt(h.t1-now)+" · 성공 확률 약 "+Math.round(lhChance(h.pw,L.pw)*100)+"%"),bar);
  const b=elT("button","chip",done?"보상 받기":"돌아가기");b.type="button";b.onclick=()=>clueClaim(!done);w.append(cp,b);box.appendChild(w);
  if(!done)box.appendChild(elT("p","hint","떠나 있는 동안 게임을 꺼 두어도 된다. 장기 토벌과 정기 출정에는 참가할 수 없다."));return}
 if(typeof lhOn==="function"&&lhOn())box.appendChild(elT("p","hint","장기 토벌을 떠나 있는 동안에는 단서를 찾으러 떠날 수 없다."));
 else if(C.mj&&Date.now()<C.mj.T0)box.appendChild(elT("p","hint","정기 출정에 참가 신청한 동안에는 떠날 수 없다."));
 const pv=pw();CLUE.forEach(L=>{const w=elT("div","dq"),cp=elT("div","dq-copy"),c=lhChance(pv,L.pw),bonus=clueBonus(L.hr);
  cp.append(elT("b","",L.nm+" · "+L.hr+"시간"),elT("small","",L.ds+" 권장 전투력 "+L.pw+" · 성공 약 "+Math.round(c*100)+"% · 골드 약 "+Math.round(L.g*L.hr*bonus)+", 경험치 약 "+Math.round(L.ex*L.hr*bonus)+(L.m?", 마력석 "+L.m+"+":"")+" · 절망도 +"+L.dz*L.hr));
  const b=elT("button","chip","출발");b.type="button";b.disabled=!!C.fall||(typeof lhOn==="function"&&lhOn())||!!(C.mj&&Date.now()<C.mj.T0);b.onclick=()=>clueStart(L.id);w.append(cp,b);box.appendChild(w)})}
function clueStart(id){const L=clueOf(id);if(!L||clueOn())return;if(C.fall){toast("타락한 동안에는 탐색을 떠날 수 없다.");return}
 if(typeof lhOn==="function"&&lhOn()){toast("장기 토벌을 떠나 있는 동안에는 단서를 찾으러 떠날 수 없다.");return}
 if(C.mj&&Date.now()<C.mj.T0){toast("정기 출정에 참가 신청한 동안에는 떠날 수 없다.");return}
 if(!confirm(L.nm+"("+L.hr+"시간)을 떠날까? 떠나 있는 동안에는 장기 토벌과 정기 출정에 참가할 수 없다. 성공 확률 약 "+Math.round(lhChance(pw(),L.pw)*100)+"%"))return;
 const t0=Date.now();C.clue={k:id,t0,t1:t0+L.hr*3600000,pw:pw(),sd:Math.floor(Math.random()*1e9)};titleState();save();
 note("quest",L.nm+"을(를) 떠났다. "+L.hr+"시간 뒤에 돌아온다.");toast("🔍 "+L.nm+" 출발! "+L.hr+"시간 뒤에 돌아온다.");clueDraw()}
function cluePick(g,L,done){const evs=[],log=CLUE_LOG||[],n=done?2+Math.min(4,L.hr):1;
 for(let i=0;i<n&&log.length;i++){const e=log[Math.floor(g()*log.length)];if(!evs.includes(e))evs.push(e)}
 const found=[];if(done)(CLUE_EXTRA||[]).forEach(x=>{if(L.hr>=x[4]&&g()<x[3])found.push(x)});return{evs,found}}
function clueClaim(early){const h=C.clue,L=h&&clueOf(h.k);if(!L)return;const now=Date.now(),done=now>=h.t1;if(!done&&!early)return;
 if(early&&!confirm("지금 돌아갈까? 지난 시간만큼의 절반만 받고, 마력석은 받지 못한다."))return;
 const g=rng(hs32("clue"+h.sd)),hrs=done?L.hr:Math.max(0,(now-h.t0)/3600000),ok=done&&g()<lhChance(h.pw,L.pw),mul=done?(ok?1:.5)*clueBonus(L.hr):CLUE_EARLY;
 const gd=Math.round(L.g*hrs*mul),ex=Math.round(L.ex*hrs*mul),dz=Math.round(L.dz*hrs+(done&&!ok?CLUE_FAIL_DZ:0)),mm=done&&ok?L.m+(g()<.3?1:0):0,pick=cluePick(g,L,done);
 C.clue=null;C.gd=(C.gd||0)+gd;if(mm){C.inv=C.inv||{};C.inv.mana=(C.inv.mana||0)+mm}titleState();if(done)C.stats.clueDone=(C.stats.clueDone||0)+1;
 if(pick.found.length)C.stats.clueFound=(C.stats.clueFound||0)+pick.found.length;
 C.stats.maxGold=Math.max(C.stats.maxGold||0,C.gd);gain(ex,dz);guardAdd(Math.round(hrs*3));
 if(done&&ok){const pe=petDrop("lh");if(pe)pick.evs.push(pe)}
 if(done){const mt=ok?matGain([CLUE_DROP.ok],L.hr):matGain([CLUE_DROP.fail]);if(mt)pick.evs.push(mt)}
 if(typeof clpGain==="function"){const cp=clpGain("clue",{ok,done,hr:hrs});if(cp)pick.evs.push(cp)}
 const head=!done?"중간에 돌아왔다.":ok?"탐색 성공!":"단서는 놓쳤지만 무사히 돌아왔다.",rw="골드 +"+gd+", 경험치 +"+ex+(mm?", 마력석 +"+mm:"")+", 절망도 +"+dz;
 const lines=pick.evs.map(e=>"· "+e).concat(pick.found.map(x=>"· 추가 조사 — "+x[1]+"\n  "+x[2]));
 note("quest",L.nm+": "+head+" ("+rw+")");save();checkTitles();
 alertBox("🔍 "+L.nm+" · "+(done?(ok?"성공":"실패"):"귀환"),head+"\n\n"+lines.join("\n")+"\n\n"+rw);clueDraw()}
setInterval(()=>{if(!C||!clueOn())return;const h=C.clue;if(Date.now()>=h.t1&&!h.nt){h.nt=1;save();const L=clueOf(h.k);note("quest",L.nm+"에서 돌아왔다! 장기 의뢰에서 보상을 받자.");toast("🔍 "+L.nm+"에서 돌아왔다! 보상을 받자.");try{ding()}catch(e){}}if($("#v-ord")&&!$("#v-ord").hidden)clueDraw()},30000);
