/* 타락. main.js 다음에 불러야 한다. 절망도 100의 타락, 절망의 마인, 레이드 화면. */
/* 타락과 레이드: 절망도가 90이면 '타락 직전' 경고, 100이면 타락해 그 캐릭터가 레이드보스가 된다.
   친구들이 공격해 HP를 0으로 만들면 원래 모습으로 돌아온다. 서버에는 raid/{타락한 사람}과 raidhit/{타락한 사람}/{레이드 번호}/{공격한 사람}에 기록한다.
   각자 자기 누적 피해만 기록하므로 여러 명이 동시에 공격해도 기록이 덮어써지지 않는다. */
/* 타락 레이드 난이도: HP = 300 + 타락한 사람의 전투력 × 12. 친구 한 명당 2분에 한 번 공격하고, 공격할 때마다 그림자의 절망이 스며들어 내 절망도가 RAID_DZ 오른다.
   절망도 90 이상이거나 타락한 사람은 맞설 수 없다. 숫자만 고치면 바뀐다. */
const raidHp=()=>300+pw()*12;
let WCH=[];// 지금 살아 있는 마인들 [{u,n,v,rid,hp,mx}]
const fallsRecent=()=>((C&&C.fallT)||[]).filter(t=>Date.now()-t<WITCH_WIN);
const witchCurse=()=>!!C&&WCH.some(w=>w.v===C.v&&w.u!==UID);
let unRd=null,rdU=null,rdR=null,rdLast=null,rdHp=0,rdReq=0,rdPaint="";
const sumHits=list=>list.reduce((a,v)=>a+(Number(v&&v.d)||0),0);
const raidKids=v=>v&&typeof v==="object"&&!Array.isArray(v)?Object.keys(v).map(k=>v[k]).filter(x=>x&&typeof x==="object"):[];
const scarLeft=()=>Math.max(0,((C&&C.scar)||0)-Date.now());
function fallLoss(w){const lv=C.lv||1,ex0=C.ex||0,ex1=xpAt(lv-1),g0=C.gd||0,gl=Math.floor(g0*FALL_GOLD*(w?2:1));C.ex=Math.min(ex0,ex1);C.lv=lvOf(C.ex);C.gd=g0-gl;return{lv0:lv,lv1:C.lv,exl:ex0-C.ex,gl}}
function fallen(){if(C.fall)return;C.fallT=fallsRecent().concat(Date.now()).slice(-10);const w=C.fallT.length>=WITCH_N;if(w)return witchBorn();const L=fallLoss();C.fall={rid:Date.now(),mx:raidHp(),sd:0,st:0};titleState();C.stats.falls=(C.stats.falls||0)+1;C.dz=100;note("fall","절망도가 100에 닿아 타락했다. 친구들이 맞서 주기를 기다리자.");save();putRaid();regPlayer();checkTitles();
 alertBox("타락","절망도가 100에 닿았다. "+C.n+"은(는) 절망에 삼켜져 마수가 되었다.\n\n타락의 대가\n· 경험치 "+L.exl+"을(를) 잃었다"+(L.lv1<L.lv0?" (레벨 "+L.lv0+" → "+L.lv1+")":"")+"\n· 골드 "+L.gl+"을(를) 잃었다\n· 타락한 동안에는 경험치를 얻을 수 없다\n· 되돌아온 뒤 1시간 동안 얻는 경험치가 절반이 된다\n\n친구들이 맞서 쓰러뜨려 주면 원래 모습으로 돌아온다. 그동안 출정과 재계약 시험은 할 수 없다."+(C.fallT.length===WITCH_N-1?"\n\n⚠ 경고: 최근 7일 동안 "+C.fallT.length+"번 타락했다. 한 번 더 타락하면 절망의 마인이 된다.":""));note("fall","타락의 대가로 경험치 "+L.exl+", 골드 "+L.gl+"을(를) 잃었다."+(L.lv1<L.lv0?" 레벨이 "+L.lv1+"(으)로 떨어졌다.":""))}
function witchBorn(){const L=fallLoss(1);C.fall={rid:Date.now(),mx:raidHp()*WITCH_HP,sd:0,st:0,w:1};titleState();C.stats.falls=(C.stats.falls||0)+1;C.stats.witch=(C.stats.witch||0)+1;C.dz=100;
 note("fall","절망을 견디지 못하고 절망의 마인이 되었다. 모든 마법소녀가 나를 막으러 올 것이다.");save();putRaid();regPlayer();checkTitles();
 alertBox("🜏 절망의 마인","일주일 사이 "+C.fallT.length+"번째 타락. 되풀이된 절망이 마침내 "+C.n+"을(를) 삼켰다.\n이번에는 그저 마수가 아니다. 검은 왕관이 머리 위에 떠오르고, "+VL[C.v].n+" 하늘이 어둡게 물든다.\n\n절망의 마인\n· 경험치 "+L.exl+", 골드 "+L.gl+"을(를) 잃었다 (골드 손실 두 배)"+(L.lv1<L.lv0?"\n· 레벨 "+L.lv0+" → "+L.lv1:"")+"\n· 체력이 평소의 "+WITCH_HP+"배다\n· 친구가 아니어도 모든 마법소녀가 맞설 수 있다\n· 내가 살아 있는 동안 "+VL[C.v].n+"에 '마인의 저주'가 내려 주민들의 자연 회복이 절반이 된다\n· 돌아온 뒤 "+(WITCH_SCAR/3600000)+"시간 동안 얻는 경험치가 절반이 된다");document.body.classList.add("witch-flash");setTimeout(()=>document.body.classList.remove("witch-flash"),2500)}
/* 사진 축소가 늦으면, 해소된 뒤에 예전 피해로 raid 칸을 다시 만든다. 새 저장이 나오면 이전 저장은 버린다.
   쓰기가 끝난 뒤 이미 풀려 있으면 그 칸을 다시 지운다. */
let raidSeq=0,raidSweep=false,raidDropAt={};
const raidAlive=rid=>!!(C&&C.fall&&C.fall.rid===rid);
function raidClear(){const seq=++raidSeq;if(!DB||!UID)return;DB.doc("raid/"+UID).delete().then(()=>{if(seq===raidSeq&&C&&C.fall)putRaid()}).catch(()=>{})}
function putRaid(){if(!DB||!C||!C.fall)return;const seq=++raidSeq,rid=C.fall.rid;thumb(C.img,im=>{
 if(seq!==raidSeq||!raidAlive(rid))return;const f=C.fall;
 DB.doc("raid/"+UID).set({u:UID,rid:f.rid,mx:f.mx,sd:f.sd||0,w:f.w?1:0,v:C.v,n:nmOf(),g:C.g,a:(C.a||[]).join(" · "),im,ts:Date.now()}).then(()=>{if(raidAlive(rid))return;if(!C||!C.fall)raidClear();else putRaid()}).catch(()=>{})})}
// 체력이 0이면 그 칸을 지운다. 한 번이라도 공격한 사람은 남의 칸도 지울 수 있다. 주인은 언제나 자기 칸을 지운다.
// 프로필의 타락 표시(fl)가 0이어도 지우지 않는다. 본인은 아직 타락 중인데 표시만 늦은 사람이 있다.
function raidDrop(r){if(!r||!DB||!r.u||r.u===UID)return;const k=r.u+"_"+r.rid,now=Date.now();if(raidDropAt[k]&&now-raidDropAt[k]<15000)return;raidDropAt[k]=now;DB.doc("raid/"+r.u).delete().catch(()=>{})}
// 내가 타락한 상태라면 받은 피해를 합쳐서 쓰러졌는지 확인한다. 마을 밖에서도 확인하고, 이미 풀렸으면 남은 칸을 지운다.
async function checkRaid(){if(!C||!DB||!UID)return;
 if(!C.fall){if(!raidSweep){raidSweep=true;raidClear()}return}
 const f=C.fall;let got=0;
 try{const s=await DB.doc("raidhit/"+UID+"/"+f.rid).get();got=sumHits(raidKids(s.exists?s.data():null))}catch(e){}
 if(!C||C.fall!==f)return;
 if(got+(Number(f.sd)||0)>=(Number(f.mx)||0)){recover();return}
 try{const r=await DB.doc("raid/"+UID).get();if(!r.exists&&C.fall===f)putRaid()}catch(e){}}
function recover(){if(!C.fall)return;C.edge=0;const wt=!!C.fall.w;C.fall=null;C.dz=RECOVER_DZ;C.scar=Math.max(Number(C.scar)||0,Date.now()+(wt?WITCH_SCAR:SCAR_MS));/* 이미 남아 있는 더 긴 후유증(예: 마인의 3시간)을 짧게 덮어쓰지 않는다 */titleState();C.stats.recovered=(C.stats.recovered||0)+1;if(wt)C.fallT=[];note("fall",wt?"마인의 왕관이 부서지고 원래 모습으로 돌아왔다.":"타락에서 벗어나 원래 모습으로 돌아왔다.");save();checkTitles();raidClear();regPlayer();
 if(!$("#v-raid").hidden||!$("#v-hub").hidden)hub();if(wt){alertBox("마인의 끝","수많은 마법소녀의 빛이 검은 왕관을 부쉈다. 마인의 저주가 걷히고, "+C.n+"은(는) 원래 모습으로 돌아왔다.\n절망도는 "+RECOVER_DZ+"이(가) 되었다.\n\n마인이었던 흔적으로 "+(WITCH_SCAR/3600000)+"시간 동안 얻는 경험치가 절반이 된다.\n타락 횟수 기록은 초기화되었다. 다시는 혼자 무너지지 않기를.");return}alertBox("귀환","친구들의 마법이 닿았다. 타락에서 벗어나 원래 모습으로 돌아왔다.\n절망도는 "+RECOVER_DZ+"이(가) 되었다.\n\n다만 타락의 후유증으로 "+(Math.ceil((C.scar-Date.now())/600000)/6>1?"약 "+(Math.round((C.scar-Date.now())/360000)/10)+"시간":"1시간")+" 동안 얻는 경험치가 절반이 된다.")}
/* 마을에서는 타락한 사람의 이름만 본다. 명단은 raid 칸 하나라서, 사람마다 체력·공격 기록을 따로 읽지 않는다.
   마을에 들어올 때 그 칸을 한 번 읽고, 머무는 동안은 연결로 바뀐 것만 받는다. 마을을 벗어나거나 탭이 안 보이면 연결을 닫는다.
   연결이 거절되면 POLL_HUB 마다 다시 묻되, 같으면 본문은 받지 않는다. 찾는 조건(orderBy)은 붙이지 않는다. 그 조건과 바뀜 확인을 같이 쓰면 서버가 400을 낸다.
   레이드에 들어간 뒤에만 그 한 사람의 체력과 공격 기록을 POLL_MS 마다 읽는다.
   칸이 있으면 공격 합계를 기다리기 전에 목록과 알림을 만든다. 체력이 0인 칸은 그 레이드에 들어간 쪽에서 지운다. */
let unRaid=null,raidDocs=[],raidReady=false,raidGen=0;
function raidWatchStop(){raidGen++;if(unRaid){try{unRaid()}catch(e){}unRaid=null}}
function applyRaids(){if(!C)return;C.fr=C.fr||{};const rs=raidDocs.filter(r=>r&&r.u&&r.u!==UID&&(C.fr[r.u]||r.w));
 rs.forEach(r=>{const key=r.u+"_"+r.rid;if(!(C.rsn&&C.rsn[key])){C.rsn=keepIds(C.rsn,key);if(r.w){const t="🜏 절망의 마인 강림! "+r.n+"이(가) "+((VL[r.v]||{}).n||"어느 마을")+"에서 마인이 되었다. 누구든 맞설 수 있다.";note("raid",t,r.u);toast(t);ding()}else note("raid",r.n+"님이 타락했다. 맞서서 되돌려 주자.",r.u)}});
 WCH=rs.filter(r=>r.w).map(r=>({u:r.u,n:r.n,v:r.v,rid:r.rid,hp:Math.max(0,(Number(r.mx)||0)-(Number(r.sd)||0)),mx:r.mx}));if(C.fall&&C.fall.w&&!WCH.some(w=>w.u===UID))WCH.push({u:UID,n:C.n,v:C.v,rid:C.fall.rid,hp:C.fall.mx,mx:C.fall.mx});
 if(raidReady&&C.wj)Object.keys(C.wj).forEach(key=>{if(rs.some(r=>r.u+"_"+r.rid===key))return;if(Date.now()-Number(C.wj[key]||0)<60000)return;
  delete C.wj[key];giveRw(WITCH_ALL);titleState();C.stats.witchSaves=(C.stats.witchSaves||0)+1;note("raid","함께 맞섰던 절망의 마인이 쓰러졌다! 토벌 보상: "+rwTxt(WITCH_ALL));toast("🜏 마인 토벌 성공! "+rwTxt(WITCH_ALL));save();checkTitles()});
 if($("#v-hub").hidden)return;const l=$("#rdl");if(!l)return;l.innerHTML="";
 if(!rs.length){l.innerHTML="<p class='hint'>타락한 친구가 없다.</p>";return}
 rs.forEach(r=>{const b=document.createElement("button");b.type="button";b.className="chip raid-chip";b.style.textAlign="left";
  if(r.w)b.classList.add("witch-chip");b.textContent=(r.w?"🜏 절망의 마인 ":"타락한 ")+cn(r.u,r.n);b.onclick=()=>openRaid(r.u);l.appendChild(b)})}
function drawRaids(){if(!DB||!C||$("#v-hub").hidden)return;if(unRaid){applyRaids();return}
 const gen=++raidGen,take=sn=>{if(gen!==raidGen||$("#v-hub").hidden)return;raidDocs=raidKids(sn.exists?sn.data():null).filter(r=>r.u);raidReady=true;applyRaids()};
 DB.doc("raid").get().then(take).catch(()=>{});
 unRaid=DB.doc("raid").live().onSnapshot(take,()=>{},POLL_HUB)}
const raidHitKey=list=>(list||[]).map(v=>[v&&v.u,v&&v.d,v&&v.c].join(":")).join("|");
function raidLogFail(){if(rdLast)return;const box=$("#rdlg");if(box)box.innerHTML="<p class='hint' style='margin:0'>공격 기록을 불러오지 못했다.</p>"}
function pullRaidHits(u,r){const n=++rdReq;return DB.doc("raidhit/"+u+"/"+r.rid).get().then(s=>{const hits=raidKids(s.exists?s.data():null);if(n===rdReq&&rdU===u&&rdR===r)drawRaid(hits);if(rdU!==u||rdR!==r)return null;return hits})}
function openRaid(u){unRd&&unRd();unRd=null;show("raid");rdU=u;rdR=null;rdLast=null;rdPaint="";$("#rdm").textContent="";$("#rdlg").innerHTML="";$("#rdc").textContent="불러오는 중...";$("#rdgo").hidden=true;
 const start=r=>{rdR=r;drawRaid(null);if(!DB){drawRaid([]);return}const un=DB.doc("raidhit/"+u+"/"+r.rid).onSnapshot(s=>{if(rdU===u&&rdR===r)drawRaid(raidKids(s.exists?s.data():null))},()=>{if(rdU===u&&rdR===r)raidLogFail()},POLL_MS);const tk=setInterval(rdBtn,1000);unRd=()=>{rdReq++;try{un()}catch(e){}clearInterval(tk)}};
 if(u===UID){if(!C.fall){hub();return}start({u:UID,rid:C.fall.rid,mx:C.fall.mx,w:C.fall.w?1:0,v:C.v,n:C.n,g:C.g,a:C.a.join(" · ")});return}
 if(!DB)return;DB.doc("raid/"+u).get().then(s=>{if(rdU!==u)return;if(!s.exists){$("#rdc").textContent="이 친구는 이미 원래 모습으로 돌아왔다.";return}start(s.data())}).catch(()=>{$("#rdc").textContent="레이드 정보를 불러오지 못했다."})}
function drawRaid(hits){const wait=hits==null;const u=rdU,own=u===UID,r=rdR;if(!r)return;const shown=wait?(rdLast||[]):(hits||[]);if(!wait&&rdLast&&sumHits(shown)<sumHits(rdLast)){rdBtn();return}if(!wait)rdLast=shown;const sd=own?(C.fall?C.fall.sd||0:0):(Number(r.sd)||0);rdHp=Math.max(0,(Number(r.mx)||0)-sumHits(shown)-sd);const paint=raidHitKey(shown)+"/"+sd+"/"+rdHp;if(!wait&&paint===rdPaint){rdBtn();return}if(!wait)rdPaint=paint;
 const c=$("#rdc");c.innerHTML="";const im=own?C.img:r.im;if(typeof im==="string"&&/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(im)){const i=document.createElement("img");i.className="av fallen-img";i.alt="타락한 모습";i.src=im;c.appendChild(i);if(!own)hiAv(i,u)}
 const h=document.createElement("h2"),sub=document.createElement("p"),bar=document.createElement("div"),fill=document.createElement("i"),hpt=document.createElement("p");
 h.textContent=(r.w?"🜏 절망의 마인 ":"타락한 ")+cn(u,r.n);c.classList.toggle("witch-card",!!r.w);sub.className="profile-sub";sub.textContent=(r.g||"-")+"등급 · "+(r.a||"");bar.className="bar raid-hp";fill.style.width=(rdHp/r.mx*100)+"%";bar.appendChild(fill);
 hpt.className="hint";hpt.style.margin="0";hpt.textContent="HP "+rdHp+" / "+r.mx;c.append(h,sub,bar,hpt);
 if(own){const t=document.createElement("p");t.className="hint";t.style.margin="8px 0 0";t.textContent="친구들이 맞서 줄 때까지 기다리거나, 5분에 한 번 스스로 그림자와 맞설 수 있다(피해 절반).";c.appendChild(t)}
 else{const t=document.createElement("p");t.className="hint";t.style.margin="8px 0 0";t.textContent=r.w?"절망의 마인은 친구가 아니어도 누구나 맞설 수 있다. 2분에 한 번 맞설 수 있고, 맞설 때마다 마인의 절망이 스며들어 내 절망도가 "+WITCH_DZ+" 오른다. 쓰러뜨리면 맞선 모두가 "+rwTxt(WITCH_ALL)+"을(를) 받는다.":"타락한 그림자는 단단하다. 2분에 한 번 맞설 수 있고, 맞설 때마다 그림자의 절망이 스며들어 내 절망도가 "+RAID_DZ+" 오른다. 친구들과 함께 맞서자.";c.appendChild(t)}
 const lg=$("#rdlg");if(!lg){rdBtn();return}
 if(wait&&!rdLast){lg.innerHTML="<p class='hint' style='margin:0'>공격 기록을 불러오는 중...</p>";rdBtn();return}
 if(wait){rdBtn();return}
 lg.innerHTML="";const cap=document.createElement("p");cap.className="hint";cap.style.margin="0 0 8px";cap.textContent="공격 기록";lg.appendChild(cap);
 const list=shown.slice().sort((a,b)=>(Number(b.d)||0)-(Number(a.d)||0));if(sd)list.push({n:(own?"나":r.n)+"의 저항",d:sd,self:1});
 if(!list.length){const p=document.createElement("p");p.className="hint";p.style.margin="0";p.textContent="아직 아무도 맞서지 않았다.";lg.appendChild(p)}
 list.forEach(v=>{const p=document.createElement("p"),mine=!v.self&&v.u===UID;p.textContent=(v.self?v.n:cn(v.u,v.n))+(mine?" (나)":"")+": 피해 "+(Number(v.d)||0)+(v.c?" ("+v.c+"회)":"");lg.appendChild(p)});
 rdBtn();if(rdHp<=0&&own)checkRaid();else if(rdHp<=0)raidDrop(r)}
function rdBtn(){const u=rdU,own=u===UID,b=$("#rdgo"),m=$("#rdm");if(!rdR)return;b.hidden=false;
 if(rdHp<=0){b.hidden=true;if(!m.textContent){m.style.color="var(--mu)";m.textContent=own?"그림자가 쓰러졌다. 원래 모습으로 돌아가는 중이다.":"쓰러뜨렸다! 곧 원래 모습으로 돌아온다."}return}
 if(own){const left=SELF_CD-(Date.now()-((C.fall&&C.fall.st)||0));b.disabled=left>0;b.textContent=left>0?"스스로 맞서기 ("+Math.ceil(left/1000)+"초 뒤)":"스스로 그림자와 맞선다 (피해 절반)"}
 else if(!(C.fr&&C.fr[u])&&!rdR.w){b.disabled=true;b.textContent="친구만 맞설 수 있다"}
 else if(C.fall||C.dz>=90){b.disabled=true;b.textContent=C.fall?"타락한 동안에는 맞설 수 없다":"절망도가 너무 높아 맞설 수 없다"}
 else{const left=HIT_CD-(Date.now()-((C.rc&&C.rc[u])||0));b.disabled=left>0;b.textContent=left>0?"다시 공격까지 "+Math.ceil(left/1000)+"초":(armedSk("light")?"구원의 빛으로 공격한다 (피해 3배)":"공격한다 (예상 피해 "+Math.round(pw()*(C.a.includes("불")?1.2:1))+"~"+Math.round((pw()+9)*(C.a.includes("불")?1.2:1))+")")}}
$("#rdgo").onclick=async()=>{const u=rdU,r=rdR,own=u===UID,m=$("#rdm"),b=$("#rdgo");if(!u||!r||rdHp<=0)return;C.rc=C.rc||{};
 if(own){if(!C.fall||SELF_CD-(Date.now()-(C.fall.st||0))>0)return;const d=Math.max(1,Math.round((pw()+R(10))/2));C.fall.sd=(C.fall.sd||0)+d;C.fall.st=Date.now();save();putRaid();
  m.style.color="var(--mu)";m.textContent="스스로의 그림자에 맞섰다. 피해 "+d+".";drawRaid(rdLast||[]);return}
 if(!((C.fr&&C.fr[u])||r.w)||C.fall||C.dz>=90||HIT_CD-(Date.now()-(C.rc[u]||0))>0)return;b.disabled=true;
 try{const ref=DB.doc("raidhit/"+u+"/"+r.rid+"/"+UID),old=await ref.get(),o=(old.exists&&old.data())||{},lt=armedSk("light"),d=Math.round((pw()+R(10))*(lt?3:1)*(C.a.includes("불")?1.2:1)*(1+petEff("raid")));
  await ref.set({u:UID,n:nmOf(),d:(Number(o.d)||0)+d,c:(Number(o.c)||0)+1,ts:Date.now()});if(lt)useSk("light");C.rc[u]=Date.now();const hg=r.w?WITCH_HIT:8,hz=r.w?WITCH_DZ:RAID_DZ;C.gd=(C.gd||0)+hg;titleState();C.stats.raidHits=(C.stats.raidHits||0)+1;if(r.w){C.wj=C.wj||{};C.wj[u+"_"+r.rid]=C.wj[u+"_"+r.rid]||Date.now()}gain(0,hz);
  const hits=await pullRaidHits(u,r);if(rdU!==u||rdR!==r)return;const hp=r.mx-(Number(r.sd)||0)-sumHits(hits||[]);let t=(lt?"구원의 빛! ":"")+(r.w?"절망의 마인 ":"타락한 ")+r.n+"에게 "+d+"의 피해를 주었다. (골드 +"+hg+", "+(r.w?"마인의":"그림자의")+" 절망이 스며들어 절망도 +"+hz+")";
  if(hp<=0&&r.w){giveRw(WITCH_LAST);C.stats.raidKills=(C.stats.raidKills||0)+1;C.stats.witchKills=(C.stats.witchKills||0)+1;guardAdd(50);note("raid","절망의 마인 "+r.n+"에게 마지막 일격을 넣었다!",u);t="마지막 일격! 절망의 마인 "+r.n+"의 왕관이 부서졌다. (골드 +"+(hg+WITCH_LAST.g)+", 마력석 +"+WITCH_LAST.m+") 토벌 보상은 잠시 뒤 따로 받는다."}
  else if(hp<=0){C.gd+=40;C.inv=C.inv||{};C.inv.mana=(C.inv.mana||0)+1;C.stats.raidKills=(C.stats.raidKills||0)+1;guardAdd(20);note("raid","타락한 "+r.n+"에게 마지막 일격을 넣어 되돌렸다.",u);t="마지막 일격! "+r.n+"을(를) 쓰러뜨렸다. 곧 원래 모습으로 돌아온다. (골드 +48, 마력석 +1)"}
  save();checkTitles();m.style.color="var(--mu)";m.textContent=t}
 catch(e){m.style.color="var(--bad)";m.textContent="공격하지 못했다. 데이터베이스 규칙에서 raid와 raidhit 경로가 열려 있는지 확인해야 한다."}
 b.disabled=false;rdBtn()};
$("#rdb").onclick=()=>hub();
