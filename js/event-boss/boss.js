/* 이벤트 보스. js/boss.js 다음에 불러야 한다. 실전 > 장기 의뢰.
   화면은 html/act/ord.html, 숫자와 이름표는 data/event-boss/boss.js, 탭 전환은 js/act/ord.js.
   공격 기록은 wboss/{오늘 번호}/{플레이어} 에 남는다. 오전·오후 보스와 같은 경로라서 규칙을 더 열지 않는다.
   패턴은 지금 나와 있는 오전·오후 보스의 번호로 고르므로, 20분마다 바뀌는 순서가 그 보스와 같다. */
let ebTimer=null,ebLast=[],ebBusy=false;
function ebOf(off=0){const d=new Date();d.setDate(d.getDate()-(off||0));const list=EBOSS.list,def=list[dayN(d)%list.length];
 return{id:"e-"+ymd(d),def,nm:EBOSS.nm,until:EBOSS.until}}
function ebDay(){const id=ebOf().id;if(!C.eb||C.eb.d!==today())C.eb={d:today(),id,n:0};else if(C.eb.id!==id){C.eb.id=id;C.eb.n=0}}
function ebHpEst(){if(!DB)return Math.max(BOSS_SCALE.d.min,Math.round(witchHpOf(pw())*D_HP_X))*EBOSS.hpX;return bossHpEst("d")*EBOSS.hpX}
function ebHp(list){const withHp=(list||[]).filter(v=>v&&v.u&&Number(v.hp0)>0);return withHp.length?Math.round(Number(bFirst(withHp).hp0)):ebHpEst()}
function ebDead(list){return list.length>0&&(list.some(v=>v&&v.x)||sumHits(list)>=ebHp(list))}
function ebMatName(id){const m=typeof MATM!=="undefined"&&MATM[id];return m?m[2]+" "+m[1]:id}
function ebDropTxt(){return (EBOSS.drop||[]).map(([id,n])=>ebMatName(id)+" "+n).join(", ")}
function ebGrant(){C.inv=C.inv||{};const bits=[];(EBOSS.drop||[]).forEach(([id,n])=>{const c=Math.max(0,Number(n)||0);if(!id||!c)return;C.inv[id]=(C.inv[id]||0)+c;bits.push(ebMatName(id)+" +"+c)});return bits.join(", ")}
function ebNext(now){const end=bpEnd(now),d=new Date(now),cut=new Date(d.getFullYear(),d.getMonth(),d.getDate(),d.getHours()>=12?24:12).getTime();return Math.min(end,cut)}
function eboss(){show("ord");const m=$("#ebm");if(m){m.textContent="";m.style.color=""} if(!C)return;ebDay();if(typeof clueDraw==="function")clueDraw();
 if(!DB){drawEboss([]);if(m){m.style.color="var(--mu)";m.textContent="이벤트 보스를 쓸 수 없다."}return}
 drawEboss(null);loadEboss();ebClaimOld()}
async function loadEboss(){if(!C||!DB||$("#v-ord").hidden||ebBusy)return;ebBusy=true;
 try{const b=ebOf();let list=[];try{list=await bossList(b)}catch(e){}if($("#v-ord").hidden||!C||ebOf().id!==b.id)return;drawEboss(list)}finally{ebBusy=false}}
function drawEboss(list){const box=$("#ebl");if(!box||!C)return;ebDay();const b=ebOf(),def=b.def;box.innerHTML="";
 const c=elT("div","card boss-card e");box.appendChild(c);
 if(list==null){c.append(elT("p","boss-tag",b.nm+" · "+b.until),elT("h2","",def[0]),elT("p","hint","처치 여부와 공격 기록을 불러오는 중..."));return}
 ebLast=list;const dead=ebDead(list),mx=ebHp(list),hp=dead?0:Math.max(0,mx-sumHits(list));
 const rank=list.slice().sort((a,x)=>(x.d||0)-(a.d||0)),mine=list.find(v=>v.u===UID),weak=(C.a||[]).includes(def[2]);
 c.append(elT("p","boss-tag",b.nm+" · "+b.until),elT("h2","",def[0]),elT("p","hint",def[1]),elT("p","boss-weak"+(weak?" on":""),"약점: "+def[2]+" 속성"+(weak?" · 내 속성이라 피해 30% 증가!":"")));
 const bar=elT("div","bar"),fill=elT("i");fill.style.width=(mx?hp/mx*100:0)+"%";bar.appendChild(fill);c.append(bar,elT("p","hint","HP "+hp+" / "+mx+" · 참가자 "+list.length+"명"));
 c.appendChild(elT("p","","내 피해 "+(mine?Number(mine.d)||0:0)+(mine?" ("+(rank.indexOf(mine)+1)+"위)":" (아직 참가하지 않았다)")));
 if(rank.length){const ol=elT("ol","boss-rank");rank.slice(0,5).forEach(v=>{const li=elT("li",v.u===UID?"me":"",cn(v.u,v.n)+" · 피해 "+(Number(v.d)||0)+" ("+(Number(v.c)||0)+"회)");ol.appendChild(li)});c.appendChild(ol)}
 if(dead){c.appendChild(elT("p","boss-dead","처치 완료!"));const got=C.ebc&&C.ebc[b.id],joined=C.ebp&&C.ebp[b.id];
  if(joined){const bt=elT("button","btn",got?"토벌 보상을 받았다":"토벌 보상 받기");bt.type="button";bt.disabled=!!got;bt.onclick=async()=>{bt.disabled=true;const r=await ebClaim(b);const m=$("#ebm");m.style.color="var(--mu)";m.textContent=r?b.nm+" 토벌 보상: "+ebRwTxt(r):(got?"이미 받은 보상이다.":"보상을 받지 못했다.");drawEboss(ebLast)};c.appendChild(bt)}
  else c.appendChild(elT("p","hint","이번 보스에는 참가하지 않아 토벌 보상이 없다."));
  c.appendChild(elT("p","boss-info","토벌 보상: "+rwTxt(EBOSS.kill)+", "+ebDropTxt()+", 피해 1위는 마력석 +"+EBOSS.mvp+" 추가"));return}
 const now=Date.now(),seed=bossOf("d").id,pt=bpAt(seed,now),nx=bpAt(seed,ebNext(now)),pb=elT("div","bp-box");
 pb.append(elT("p","bp-now",pt.ic+" "+pt.nm),elT("p","bp-ds",pt.ds),elT("p","bp-next",hm(ebNext(now))+"까지 · 다음: "+nx.ic+" "+nx.nm));c.appendChild(pb);
 clearTimeout(ebTimer);ebTimer=setTimeout(()=>{if(!$("#v-ord").hidden)eboss()},ebNext(now)-now+800);
 const left=EBOSS.t-(C.eb.n||0),off=!!C.fall||C.dz>=90||left<=0;
 c.appendChild(elT("p","bp-left",C.fall?"타락 중에는 싸울 수 없다":C.dz>=90?"절망도가 너무 높아 싸울 수 없다":left<=0?"오늘 공격 횟수를 다 썼다":"대응을 골라 공격한다 · 오늘 "+left+"/"+EBOSS.t+"번 남음"+(armedSk("fire")?" · 홍련의 일격 준비됨":"")));
 const row=elT("div","bp-acts");Object.keys(BA).forEach(a=>{const x=BA[a],bt=elT("button","btn"+(a==="str"?"":" g"),x.ic+" "+x.nm);bt.type="button";bt.disabled=off||!DB;bt.onclick=()=>{row.querySelectorAll("button").forEach(z=>z.disabled=true);ebHit(bt,a)};row.appendChild(bt)});c.appendChild(row);
 const wait=!!DB&&bossTopN==null&&!list.length;c.appendChild(elT("p","boss-info","체력: 오전·오후 보스 체력의 "+EBOSS.hpX+"배. 첫 공격 때 정해져 내일 0시까지 같다"+(list.length?"":wait?" (전투력 1위를 확인하는 중)":" (지금 기준 약 "+ebHpEst().toLocaleString()+")")));
 c.appendChild(elT("p","boss-info","공격 1번: 골드 +"+EBOSS.hit+", 절망도 +"+EBOSS.dz+"(🛡 방어 태세면 0) · 토벌 보상: "+rwTxt(EBOSS.kill)+", "+ebDropTxt()))}
async function ebHit(bt,act){act=BA[act]?act:"str";const b=ebOf(),m=$("#ebm");ebDay();if(C.fall||C.dz>=90||C.eb.n>=EBOSS.t)return;bt.disabled=true;
 const seed=bossOf("d").id,pt=bpAt(seed,Date.now()),ef=bpEff(pt,act),good=pt.best===act;
 try{await bossTopPw();const list=await bossList(b);if(ebOf().id!==b.id){drawEboss([]);return}
  const mine=list.find(v=>v.u===UID)||{},hp=ebDead(list)?0:ebHp(list)-sumHits(list);
  if(hp<=0){m.style.color="var(--mu)";m.textContent="이미 쓰러진 보스다.";drawEboss(list);return}
  const weak=(C.a||[]).includes(b.def[2]),fire=armedSk("fire"),d=Math.max(1,Math.round(pw()*(2+Math.random())*ef[0]*(weak?1.3:1)*(fire?2:1)*(C.a.includes("불")?1.2:1)*((VL[C.v]||{}).bd||1)));
  const rec={u:UID,n:nmOf(),d:(Number(mine.d)||0)+d,p:Number(mine.p)||pw(),c:(Number(mine.c)||0)+1,ts:Date.now(),t0:Number(mine.t0)||Date.now(),hp0:ebHp(list)};if(mine.x||hp-d<=0)rec.x=1;
  await DB.doc("wboss/"+b.id+"/"+UID).set(rec);
  if(fire)useSk("fire");C.eb.n++;C.ebp=keepIds(C.ebp,b.id);C.gd=(C.gd||0)+EBOSS.hit;titleState();C.stats.ebHits=(C.stats.ebHits||0)+1;if(good)C.stats.ebRead=(C.stats.ebRead||0)+1;
  const dz=ef[2]?0:EBOSS.dz+ef[1];if(dz)gain(0,dz);else save();checkTitles();
  const say=good?(act==="def"?" 반격을 막고 되받아쳤다!":act==="weak"?" 모인 마력을 꿰뚫었다! 약점 적중!":" 빈틈에 강타가 꽂혔다!"):act==="str"&&pt.id==="charge"?" 돌진에 반격당했다!":act==="weak"?" 약점을 찾지 못했다.":act==="def"?" 조심스럽게 싸웠다.":"";
  m.style.color="var(--mu)";m.textContent=BA[act].ic+" "+BA[act].nm+" → "+pt.ic+" "+pt.nm+":"+say+" "+b.def[0]+"에게 "+d+"의 피해"+(weak?" (약점 속성!)":"")+(fire?" (홍련의 일격!)":"")+". 골드 +"+EBOSS.hit+", 절망도 +"+dz+"."+(hp-d<=0?" 보스를 쓰러뜨렸다! 토벌 보상을 받자.":"");
  drawEboss(await bossList(b))}
 catch(e){m.style.color="var(--bad)";m.textContent="공격하지 못했다. 데이터베이스 규칙에서 wboss 경로가 열려 있는지 확인해야 한다.";bt.disabled=false}}
function ebRwTxt(r){return [rwTxt(r.r),r.drop].filter(Boolean).join(", ")+(r.mvp?" (피해 1위 보너스 포함!)":"")}
async function ebClaim(b){if(!C.ebp||!C.ebp[b.id]||(C.ebc&&C.ebc[b.id]))return null;let list=[];try{list=await bossList(b)}catch(e){return null}
 if(!ebDead(list))return null;const top=list.slice().sort((a,x)=>(x.d||0)-(a.d||0))[0],mvp=!!top&&top.u===UID,r={g:EBOSS.kill.g,m:EBOSS.kill.m+(mvp?EBOSS.mvp:0)};
 if(C.ebc&&C.ebc[b.id])return null;C.ebc=keepIds(C.ebc,b.id);giveRw(r);const drop=ebGrant();
 note("boss",b.nm+" "+b.def[0]+" 토벌 보상: "+[rwTxt(r),drop].filter(Boolean).join(", ")+(mvp?" (피해 1위)":""));
 titleState();C.stats.ebKills=(C.stats.ebKills||0)+1;if(mvp)C.stats.ebMvp=(C.stats.ebMvp||0)+1;save();checkTitles();return{r,mvp,drop}}
async function ebClaimOld(){if(!C||!DB)return;const b=ebOf(1);if(!(C.ebp&&C.ebp[b.id])||(C.ebc&&C.ebc[b.id]))return;const r=await ebClaim(b);if(!r||$("#v-ord").hidden)return;const m=$("#ebm");m.style.color="var(--mu)";m.textContent="어제 "+b.def[0]+" 토벌 보상: "+ebRwTxt(r)}
