/* 보스 레이드. main.js 다음에 불러야 한다. 오전·오후 보스와 주간 보스, 패턴 대응, 처치 보상.
   마을에서는 이름과 남은 공격만 그린다. 처치 여부와 공격 기록은 보스 화면에 들어간 뒤 한 번, 공격할 때 그 보스만 다시 한 번 받는다.
   마을 화면은 hubBoss 를, 알림과 튜토리얼은 bossView 를 그대로 부른다. */
let unB=null;const bossLast={};
// off=1이면 어제(지난주) 보스
/* 오전·오후 보스: 하루를 0시~12시(오전), 12시~24시(오후)로 나눠 반나절마다 다른 보스가 나온다. off=1이면 바로 앞 반나절의 보스. */
function bossOf(k,off=0){const d=new Date();if(k==="d"){const h=dayN(d)*2+(d.getHours()>=12?1:0)-off,am=h%2===0,u=new Date(Math.floor(h/2)*864e5),ds=u.getUTCFullYear()+"-"+String(u.getUTCMonth()+1).padStart(2,"0")+"-"+String(u.getUTCDate()).padStart(2,"0");
  return{k,id:"d-"+ds+(am?"a":"p"),def:DBOSS[h%DBOSS.length],nm:am?"오전 보스":"오후 보스",until:am?"낮 12시까지":"밤 12시까지"}}
 d.setDate(d.getDate()-((d.getDay()+6)%7)-7*off);return{k,id:"w-"+ymd(d),def:WBOSS[Math.floor(dayN(d)/7)%WBOSS.length]}}
const bcfgOf=(k,id)=>id&&String(id)<BOSS_NEW_FROM[k]?BOSS_OLD[k]:BOSS[k];
const witchHpOf=p=>(300+Math.max(0,Number(p)||0)*12)*WITCH_HP;
const onlineTopPw=()=>Math.max(typeof pw==="function"&&C?pw():0,...(ONL||[]).filter(p=>p&&(p.u===UID||isOn(p))).map(p=>Number(p.pw)||0));
let bossTopN=null,bossTopLv=null,bossTopP=null;
function bossTopAsk(){if(!DB||bossTopP||typeof plTop!=="function")return;bossTopP=plTop().then(t=>{bossTopP=null;const n=Math.max(0,Number(t&&t.pw)||0),lv=Math.max(1,Number(t&&t.lv)||1);if(bossTopN===n&&bossTopLv===lv)return;bossTopN=n;bossTopLv=lv;if($("#v-boss").hidden)return;["d","w"].forEach(key=>{const b=bossOf(key);if((bossLast[key]||[]).length)return;drawBoss(key,b,bossLast[key]||[])})},()=>{bossTopP=null})}
function bossTopShown(){bossTopAsk();const mine=typeof pw==="function"&&C?pw():0;if(mine>(bossTopN||0))return{lv:Math.max(1,Number(C&&C.lv)||1),pw:mine};return{lv:Math.max(1,Number(bossTopLv)||Number(C&&C.lv)||1),pw:Math.max(mine,bossTopN||0)}}
async function bossTopPw(){let n=bossTopN;if(DB&&typeof plTop==="function"){try{const t=await plTop();n=Math.max(0,Number(t&&t.pw)||0);bossTopN=n;bossTopLv=Math.max(1,Number(t&&t.lv)||1)}catch(e){}}const mine=typeof pw==="function"&&C?pw():0;return Math.max(mine,n||0)}
const dHpNow=()=>Math.round(witchHpOf(bossTopShown().pw)*D_HP_X);
const bFirst=list=>list.slice().sort((a,b)=>(Number(a.t0||a.ts)||0)-(Number(b.t0||b.ts)||0))[0];
/* 새 보스 HP 공식. 오전·오후 = (최고 전투력자의 레벨 + 전투력 × (전투력 - 레벨)) ÷ (전투력 ÷ 레벨).
   주간 = (레벨 + 전투력 × (전투력 - 레벨)) × (전투력 ÷ 레벨). 정수 HP로 반올림한다.
   1위는 공개 카드를 전투력 순으로 한 명만 읽는다. 정해진 체력은 공격 기록(hp0)에 남아서 그 보스가 끝날 때까지 모두에게 똑같다.
   이미 hp0가 있는 보스는 그 숫자를 그대로 쓴다. */
const bScaled=(k,id)=>!!id&&String(id)>=BOSS_SCALE_FROM[k];
function bossHpEst(k){const{lv,pw}=bossTopShown();if(!(lv>0&&pw>0))return 0;const core=lv+pw*(pw-lv),ratio=pw/lv;return Math.round(k==="w"?core*ratio:core/(ratio/(k==="e"?EBOSS.hpX:1)))}
const bhpScaled=(k,list)=>{const real=list.filter(v=>v&&v.u),withHp=real.filter(v=>Number(v.hp0)>0);return withHp.length?Math.round(Number(bFirst(withHp).hp0)):bossHpEst(k)};
const bhp=(k,list,id)=>{if(bScaled(k,id))return bhpScaled(k,list);if(k==="d"&&!(id&&String(id)<BOSS_NEW_FROM.d)){const real=list.filter(v=>v&&v.u),f=real.length?bFirst(real):null;if(!f)return dHpNow();if(Number(f.hp0)>0)return Math.round(Number(f.hp0))}const c=bcfgOf(k,id);return Math.round(c.base+c.k*list.reduce((a,v)=>a+(Number(v.p)||0),0)+(c.m||0)*list.reduce((a,v)=>Math.max(a,Number(v.p)||0),0))};
/* 한 번 쓰러진 보스는 다시 살아나지 않는다: 마지막 일격을 넣은 사람의 기록에 x 표시를 남기고, 표시가 있거나 피해 합이 체력 이상이면 쓰러진 것으로 본다.
   (예전에는 보스가 쓰러진 뒤 새 사람이 공격하면 그 사람 몫만큼 체력이 늘어나 보스가 되살아났다.) */
const bossDead=(k,list,id)=>list.length>0&&(list.some(v=>v&&v.x)||sumHits(list)>=bhp(k,list,id));
// [피해 배율, 추가 절망도, 절망도 막음(1이면 이번 공격으로 절망도가 오르지 않음)]
const bpEff=(p,a)=>a==="str"?(p.id==="rest"?[1.3,0,0]:p.id==="charge"?[1,3,0]:[1,0,0]):a==="def"?(p.id==="charge"?[1,0,1]:[.7,0,1]):(p.id==="focus"?[1.8,0,0]:[.5,0,0]);
function bpAt(id,t){const sl=Math.floor(t/BP_MS),g=rng(hs32(id+"#"+sl))();let a=0;for(const p of BP){a+=p.w/100;if(g<a)return p}return BP[0]}
const bpEnd=t=>(Math.floor(t/BP_MS)+1)*BP_MS;
const hm=t=>{
   const d = new Date(t);return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")};
/* 참가자 전원은 보스 화면에 들어올 때 한 번만 받는다. 공격할 때는 내 기록과 합계(meta)만 읽고 쓴다.
   meta 는 같은 wboss 칸 안에 두므로 규칙을 더 열지 않는다. 화면의 순위는 u 가 있는 기록만 쓴다. */
const bossListP={};
const bossList=b=>{const id=b&&b.id;if(!id||!DB)return Promise.resolve([]);if(bossListP[id])return bossListP[id];
 const p=DB.collection("wboss/"+id).grab(40000).then(s=>(s.docs||[]).map(d=>d.data()).filter(v=>v&&v.u)).finally(()=>{if(bossListP[id]===p)delete bossListP[id]});bossListP[id]=p;return p};
let bossSnap={};
function bossWhy(e){const name=e&&e.name,m=String(e&&e.message||e);if(m==="403")return "공격하지 못했다. 데이터베이스 규칙에서 wboss 경로가 열려 있는지 확인해야 한다.";if(m==="401")return "공격하지 못했다. 로그인이 만료되었다. 새로고침한 뒤 다시 로그인해 보자.";if(name==="AbortError"||m==="timeout"||/abort/i.test(m))return "공격하지 못했다. 서버 응답이 시간 안에 오지 않았다. 잠시 뒤에 다시 눌러 보자.";if(m==="offline"||/failed to fetch|network|offline/i.test(m))return "공격하지 못했다. 네트워크에 연결되지 않았다.";return "공격하지 못했다. 잠시 뒤에 다시 눌러 보자."}
function bossBar(id,list,hpOf){const snap=bossSnap[id],mx=snap&&Number(snap.hp0)>0?Number(snap.hp0):hpOf();const dealt=snap&&snap.sum!=null?Number(snap.sum):sumHits(list||[]);const dead=!!(list||[]).some(v=>v&&v.x)||!!(snap&&snap.x)||(mx>0&&dealt>=mx);return{mx,dead,hp:dead?0:Math.max(0,mx-dealt),n:Math.max((list||[]).filter(v=>v&&v.u).length,snap&&snap.n||0)}}
function bossMinePatch(list,rec){const next=(list||[]).filter(v=>v&&v.u&&v.u!==rec.u);next.push(rec);return next}
function bossMetaNote(id,list,hp0){if(!id||!(hp0>0))return;const sum=sumHits(list),n=(list||[]).filter(v=>v&&v.u).length,x=(list||[]).some(v=>v&&v.x)||sum>=hp0?1:null,prev=bossSnap[id];
 bossSnap[id]={hp0:prev&&Number(prev.hp0)>0?Number(prev.hp0):hp0,sum:Math.max(sum,prev&&prev.sum||0),n:Math.max(n,prev&&prev.n||0),x:x||(prev&&prev.x)||null};
 DB.doc("wboss/"+id+"/meta").transact(cur=>{const p=cur&&typeof cur==="object"?cur:null,hp=Number(p&&p.hp0)||hp0,sm=Math.max(Number(p&&p.sum)||0,sum),dead=(p&&p.x)||x||sm>=hp;if(p&&Number(p.hp0)===hp&&Number(p.sum)>=sm&&(!dead||p.x))return undefined;return{hp0:hp,sum:sm,n:Math.max(Number(p&&p.n)||0,n),x:dead?1:null}}).then(m=>{if(!m||!(Number(m.hp0)>0))return;const loc=bossSnap[id];if(loc&&Number(loc.sum)>Number(m.sum))return;bossSnap[id]=m}).catch(()=>{})}
async function bossHitRead(id){const [ms,mineS]=await Promise.all([DB.doc("wboss/"+id+"/meta").get(),DB.doc("wboss/"+id+"/"+UID).get()]);let meta=ms.exists&&ms.data()&&Number(ms.data().hp0)>0?ms.data():null;const loc=bossSnap[id];if(meta&&(!loc||Number(meta.sum)>=Number(loc.sum||0)))bossSnap[id]=meta;else if(loc&&Number(loc.hp0)>0)meta=loc;const mine=mineS.exists&&mineS.data()&&mineS.data().u?mineS.data():null;return{meta,mine}}
async function bossMetaAdd(id,hp0,add,first){let applied=false;const after=await DB.doc("wboss/"+id+"/meta").transact(cur=>{applied=false;const p=cur&&typeof cur==="object"?cur:null,hp=Number(p&&p.hp0)||hp0,sum0=Number(p&&p.sum)||0;if(p&&(p.x||(hp>0&&sum0>=hp)))return undefined;applied=true;const sum=sum0+add;return{hp0:hp,sum,n:(Number(p&&p.n)||0)+(first?1:0),x:sum>=hp?1:null}});if(applied&&after&&after.hp0)bossSnap[id]=after;else if(!applied&&after&&Number(after.hp0)>0)bossSnap[id]=after;return applied?after:null}
// 공격 횟수: 오전·오후 보스는 반나절마다, 주간 보스는 하루마다 다시 채워진다.
function bossDay(){const hk=bossOf("d").id;if(!C.wb||C.wb.day!==today())C.wb={day:today(),h:hk,d:0,w:0};else if(C.wb.h!==hk){C.wb.h=hk;C.wb.d=0}}
function bossView(){show("boss");$("#bsm").textContent="";bossDay();unB&&unB();unB=null;const box=$("#bsl");box.innerHTML="";
 ["d","w"].forEach(k=>{const c=elT("div","card boss-card "+k);c.id="bs-"+k;box.appendChild(c);drawBoss(k,bossOf(k),null)});
 if(!DB){$("#bsm").textContent="보스 레이드를 쓸 수 없다.";return}
 loadBoss();autoClaimOld(true)}
let bossBusy=false;
async function loadBoss(){if(!C||!DB||$("#v-boss").hidden||bossBusy)return;bossBusy=true;
 try{const rows=await Promise.all(["d","w"].map(async k=>{const b=bossOf(k);let list=[];try{list=await bossList(b)}catch(e){}return{k,b,list}}));
  if($("#v-boss").hidden||!C)return;rows.forEach(({k,b,list})=>{const hp=bhp(k,list,b.id);if(hp>0)bossMetaNote(b.id,list,hp);drawBoss(k,b,list)})}finally{bossBusy=false}}
function drawBoss(k,b,list){const c=$("#bs-"+k);if(!c||!C)return;bossDay();const cfg=BOSS[k],def=b.def;
 if(list==null){c.innerHTML="";c.append(elT("p","boss-tag",(b.nm||cfg.nm)+" · "+(b.until||cfg.until)),elT("h2","",def[0]),elT("p","hint","처치 여부와 공격 기록을 불러오는 중..."));return}
 bossLast[k]=list;const info=bossBar(b.id,list,()=>bhp(k,list,b.id)),dead=info.dead,mx=info.mx,hp=info.hp;
 const rank=list.slice().sort((a,x)=>(x.d||0)-(a.d||0)),mine=list.find(v=>v.u===UID),weak=(C.a||[]).includes(def[2]);c.innerHTML="";
 c.append(elT("p","boss-tag",(b.nm||cfg.nm)+" · "+(b.until||cfg.until)),elT("h2","",def[0]),elT("p","hint",def[1]),elT("p","boss-weak"+(weak?" on":""),"약점: "+def[2]+" 속성"+(weak?" · 내 속성이라 피해 30% 증가!":"")));
 const bar=elT("div","bar"),fill=elT("i");fill.style.width=(hp/mx*100)+"%";bar.appendChild(fill);c.append(bar,elT("p","hint","HP "+hp+" / "+mx+" · 참가자 "+info.n+"명"));
 c.appendChild(elT("p","","내 피해 "+(mine?Number(mine.d)||0:0)+(mine?" ("+(rank.indexOf(mine)+1)+"위)":" (아직 참가하지 않았다)")));
 if(rank.length){const ol=elT("ol","boss-rank");rank.slice(0,5).forEach(v=>{const li=elT("li",v.u===UID?"me":"",cn(v.u,v.n)+" · 피해 "+(Number(v.d)||0)+" ("+(Number(v.c)||0)+"회)");ol.appendChild(li)});c.appendChild(ol)}
 if(dead){c.appendChild(elT("p","boss-dead","처치 완료!"));const got=C.wbc&&C.wbc[b.id],joined=C.wbp&&C.wbp[b.id];
  if(joined){const bt=elT("button","btn",got?"처치 보상을 받았다":"처치 보상 받기");bt.type="button";bt.disabled=!!got;bt.onclick=async()=>{bt.disabled=true;const r=await claimBoss(b);const m=$("#bsm");m.style.color="var(--mu)";m.textContent=r?(b.nm||cfg.nm)+" 처치 보상: "+rwTxt(r.r)+(r.mvp?" (피해 1위 보너스 포함!)":""):"보상을 받지 못했다.";drawBoss(k,b,bossLast[k]||[])};c.appendChild(bt)}
  else c.appendChild(elT("p","hint","이번 보스에는 참가하지 않아 처치 보상이 없다."));return}
 const now=Date.now(),pt=bpAt(b.id,now),nx=bpAt(b.id,bpEnd(now)),pb=elT("div","bp-box");
 pb.append(elT("p","bp-now",pt.ic+" "+pt.nm),elT("p","bp-ds",pt.ds),elT("p","bp-next",hm(bpEnd(now))+"까지 · 다음: "+nx.ic+" "+nx.nm));c.appendChild(pb);
 clearTimeout(bpT[k]);bpT[k]=setTimeout(()=>{if(!$("#v-boss").hidden)drawBoss(k,b,bossLast[k]||list)},bpEnd(now)-now+800);
 const left=cfg.t-C.wb[k],off=!!C.fall||C.dz>=90||left<=0||!!hitBusy;
 c.appendChild(elT("p","bp-left",C.fall?"타락 중에는 싸울 수 없다":C.dz>=90?"절망도가 너무 높아 싸울 수 없다":left<=0?(k==="d"?"이번 보스 공격 횟수를 다 썼다":"오늘 공격 횟수를 다 썼다"):hitBusy?"공격하는 중...":"대응을 골라 공격한다 · "+(k==="d"?"":"오늘 ")+left+"/"+cfg.t+"번 남음"+(armedSk("fire")?" · 홍련의 일격 준비됨":"")));
 const row=elT("div","bp-acts");Object.keys(BA).forEach(a=>{const x=BA[a],bt=elT("button","btn"+(a==="str"?"":" g"),x.ic+" "+x.nm);bt.type="button";bt.disabled=off;bt.onclick=()=>{row.querySelectorAll("button").forEach(z=>z.disabled=true);hitBoss(k,bt,a)};row.appendChild(bt)});c.appendChild(row);
 if(bScaled(k,b.id)||k==="d"){const wait=bossTopN==null&&!list.length,est=bScaled(k,b.id)?bossHpEst(k):dHpNow();c.appendChild(elT("p","boss-info","체력: 첫 공격 때 전투력 1위가 절망의 마인이 되었을 때 체력의 "+D_HP_X+"배"+(list.length?"":wait?" (전투력 1위를 확인하는 중)":" (지금 기준 약 "+est.toLocaleString()+")")))}
 c.appendChild(elT("p","boss-info","공격 1번: 피해 전투력×2~3(대응에 따라 ×0.5~1.8), 골드 +"+cfg.hit+", 절망도 +"+cfg.dz+"(🛡 방어 태세면 0) · 처치 보상: "+rwTxt(cfg.kill)+", 피해 1위는 마력석 +"+cfg.mvp+" 추가"))}
/* 공격 중 hitBusy. await 동안 drawBoss 가 버튼을 다시 그려도 잠가 둔다. 연타 시 기록·meta 가 두 번 쓰이는 일을 막는다.
   (쓰기 자체는 내 칸 set + meta 합계 두 통신이 정상이다. 문제는 공격 동작이 두 번 들어가는 쪽이다.) */
let hitBusy=false;

async function hitBoss (k, bt, act) {
   act = BA[act] ? act : "str";
   const b = bossOf(k), cfg = BOSS[k], m = $("#bsm");
   bossDay();
   
   if (hitBusy || C.fall || C.dz >= 90 || C.wb[k] >= cfg.t) return;
   
   hitBusy = true;
   
   if (bt) bt.disabled = true;
   
   const pt = bpAt(b.id, Date.now()), ef = bpEff(pt, act), good = pt.best === act;
   
   try {
      if (bScaled(k, b.id)) {
         await hitBossFast(k,b,cfg,m,pt,ef,good,act);
         return
      }
      await bossTopPw();
      const list = await bossList(b), mine = list.find(v => v.u === UID) || {}, p = Number(mine.p) || pw(), hp = bossDead(k, list, b.id) ? 0 : bhp(k, mine.u ? list : list.concat([{p}]), b.id) - sumHits(list);
      if (hp <= 0) {
         m.style.color = "var(--mu)";
         m.textContent = "이미 쓰러진 보스다.";
         drawBoss(k, b, list);
         return
      }
      
      const weak = (C.a || []).includes(b.def[2]);
      const fire = armedSk("fire");
      // 대미지 공식
      const d = calcBossDamage(pw(), ef[0], weak, fire, _attrs().includes("불"), ((VL[C.v]||{}).bd || 1), petEff("boss"));
      const rec = {u : UID, n : nmOf(), d : (Number(mine.d) || 0) + d, p, c : (Number(mine.c) || 0) + 1, ts: Date.now(), t0:Number(mine.t0) || Date.now()};
      
      if (bScaled(k, b.id)) rec.hp0 = bhpScaled(k, list);
      else if (k === "d") rec.hp0 = Number(mine.hp0) || (list.length ? (Number((bFirst(list) || {}).hp0) || 0) : 0) || dHpNow();
      if (mine.x || hp - d <= 0) rec.x = 1;
      await DB.doc("wboss/"+b.id+"/"+UID).set(rec);
      
      if (fire) useSk("fire");
      if (dexAdd("bs", b.def[0])) note("dex","도감에 새 보스가 기록되었다: "+b.def[0]);C.wb[k]++;C.wbp=keepIds(C.wbp,b.id);C.gd=(C.gd||0)+cfg.hit;titleState();C.stats.bossHits=(C.stats.bossHits||0)+1;if(good)C.stats.bossRead=(C.stats.bossRead||0)+1;guardAdd(3);const mt=matGain(["boss"]);const dz=ef[2]?0:cfg.dz+ef[1];if(dz)gain(0,dz);else save();checkTitles();
      
      const say=good?(act==="def"?" 반격을 막고 되받아쳤다!":act==="weak"?" 모인 마력을 꿰뚫었다! 약점 적중!":" 빈틈에 강타가 꽂혔다!"):act==="str"&&pt.id==="charge"?" 돌진에 반격당했다!":act==="weak"?" 약점을 찾지 못했다.":act==="def"?" 조심스럽게 싸웠다.":"";
      
      m.style.color = "var(--mu)";
      m.textContent = BA[act].ic+" "+BA[act].nm+" → "+pt.ic+" "+pt.nm+":"+say+" "+b.def[0]+"에게 "+d+"의 피해"+(weak?" (약점 속성!)":"")+(fire?" (홍련의 일격!)":"")+". 골드 +"+cfg.hit+", 절망도 +"+dz+"."+(mt?" "+mt+".":"")+(hp-d<=0?" 보스를 쓰러뜨렸다! 처치 보상을 받자.":"");
      
      drawBoss(k, b, await bossList(b))
   } catch (e) {
      m.style.color = "var(--bad)";
      m.textContent = bossWhy(e);
      drawBoss(k, b, bossLast[k] || [])
   } finally {
      hitBusy = false;
      if (!$("#v-boss").hidden) drawBoss(k, b, bossLast[k] || [])
   }
}

async function hitBossFast(k, b, cfg, m, pt, ef, good, act) {
   const id = b.id, read = await bossHitRead(id);
   let meta = read.meta, mine = read.mine;
   
   if (!meta) {
      let list = null, failed = false;
      try { 
         list = await bossList(b)
      } catch (e) {
         failed = true;
         list = (bossLast[k] || []).slice()
      }
      
      if (failed && !list.length) throw new Error("timeout");
      if (!list.some(v => Number(v&&v.hp0) > 0)) await bossTopPw();
      
      const hpSeed = bhp(k, list, id);
      
      if (!(hpSeed > 0))throw new Error("timeout");
      
      bossMetaNote(id, list, hpSeed);
      meta = bossSnap[id]; 
      if (!mine) mine = list.find(v=> v && v.u === UID) || null
   }
   
   const hp0 = Number(meta && meta.hp0) || 0, sum = Number(meta && meta.sum) || 0;
   
   if(!hp0)throw new Error("timeout");
   
   if ((meta&&meta.x) || sum >= hp0) {
      m.style.color = "var(--mu)";
      m.textContent = "이미 쓰러진 보스다.";
      
      drawBoss(k, b, bossLast[k] || []);
      return
   }
   
   const mineRec = mine || {}, weak = (C.a || []).includes(b.def[2]), fire=armedSk("fire"),d=Math.max(1,Math.round(pw()*(2+Math.random())*ef[0]*(weak?1.3:1)*(fire?2:1)*(C.a.includes("불")?1.2:1)*((VL[C.v]||{}).bd||1)*(1+petEff("boss"))));
 const rec={u:UID,n:nmOf(),d:(Number(mineRec.d)||0)+d,p:Number(mineRec.p)||pw(),c:(Number(mineRec.c)||0)+1,ts:Date.now(),t0:Number(mineRec.t0)||Date.now(),hp0};if(mineRec.x||sum+d>=hp0)rec.x=1;
 await DB.doc("wboss/"+id+"/"+UID).set(rec);
 try{await bossMetaAdd(id,hp0,d,!mineRec.u)}catch(e){const prev=bossSnap[id]||{hp0,sum,n:0};bossSnap[id]={hp0,sum:(Number(prev.sum)||0)+d,n:(Number(prev.n)||0)+(!mineRec.u?1:0),x:prev.x||rec.x||null}}
 if(fire)useSk("fire");if(dexAdd("bs",b.def[0]))note("dex","도감에 새 보스가 기록되었다: "+b.def[0]);C.wb[k]++;C.wbp=keepIds(C.wbp,b.id);C.gd=(C.gd||0)+cfg.hit;titleState();C.stats.bossHits=(C.stats.bossHits||0)+1;if(good)C.stats.bossRead=(C.stats.bossRead||0)+1;guardAdd(3);const mt=matGain(["boss"]);const dz=ef[2]?0:cfg.dz+ef[1];try{if(dz)gain(0,dz);else save()}catch(e){}checkTitles();
 const say=good?(act==="def"?" 반격을 막고 되받아쳤다!":act==="weak"?" 모인 마력을 꿰뚫었다! 약점 적중!":" 빈틈에 강타가 꽂혔다!"):act==="str"&&pt.id==="charge"?" 돌진에 반격당했다!":act==="weak"?" 약점을 찾지 못했다.":act==="def"?" 조심스럽게 싸웠다.":"";
 m.style.color="var(--mu)";m.textContent=BA[act].ic+" "+BA[act].nm+" → "+pt.ic+" "+pt.nm+":"+say+" "+b.def[0]+"에게 "+d+"의 피해"+(weak?" (약점 속성!)":"")+(fire?" (홍련의 일격!)":"")+". 골드 +"+cfg.hit+", 절망도 +"+dz+"."+(mt?" "+mt+".":"")+(sum+d>=hp0?" 보스를 쓰러뜨렸다! 처치 보상을 받자.":"");
 drawBoss(k,b,bossMinePatch(bossLast[k]||[],rec))}

// 처치 보상: 참가했고, 보스가 쓰러졌고, 아직 안 받았을 때만
async function claimBoss(b){if(!C.wbp||!C.wbp[b.id]||(C.wbc&&C.wbc[b.id]))return null;let list=[];try{list=await bossList(b)}catch(e){return null}
 if(!bossDead(b.k,list,b.id))return null;const cfg=BOSS[b.k],top=list.slice().sort((a,x)=>(x.d||0)-(a.d||0))[0],mvp=!!top&&top.u===UID,r={g:cfg.kill.g,m:cfg.kill.m+(mvp?cfg.mvp:0)};
 if(C.wbc&&C.wbc[b.id])return null;C.wbc=keepIds(C.wbc,b.id);giveRw(r);dexAdd("bs",b.def[0],2);note("boss",(b.nm||cfg.nm)+" "+b.def[0]+" 처치 보상: "+rwTxt(r)+(mvp?" (피해 1위)":""));titleState();if(b.k==="d")C.stats.bossKillsD=(C.stats.bossKillsD||0)+1;else C.stats.bossKillsW=(C.stats.bossKillsW||0)+1;if(mvp)C.stats.bossMvp=(C.stats.bossMvp||0)+1;
 save();checkTitles();return{r,mvp}}
// 날짜가 넘어가기 직전에 쓰러뜨린 지난 보스의 보상을 자동으로 챙긴다.
async function autoClaimOld(inView){if(!C||!DB)return;const got=[];for(const b of [bossOf("d",1),bossOf("w",1)]){if(C.wbp&&C.wbp[b.id]&&!(C.wbc&&C.wbc[b.id])){const r=await claimBoss(b);if(r)got.push("지난 "+(b.nm||BOSS[b.k].nm)+" "+b.def[0]+" 처치 보상: "+rwTxt(r.r))}}
 if(!got.length)return;const m=inView?$("#bsm"):$("#hm");m.style.color="var(--mu)";m.textContent=got.join(" / ");if(!inView&&!$("#v-hub").hidden){$("#hc").querySelectorAll(".hc-grid b")[3].textContent=C.gd||0}}
$("#bsb").onclick=()=>hub();

// 마을 탭 요약: 오늘의 지금의 오전·오후 보스와 이번 주 주간 보스. 누르면 보스 레이드 화면으로 간다.
function hubBoss () {
   const box = $("#hbo");
   if (!box || !C) return;
   if (!DB) {
      box.innerHTML = "<p class='hint'>보스 레이드를 쓸 수 없다.</p>";
      return
   }
   bossDay();
   box.innerHTML="";
   
   ["d","w"].forEach(k => {
      const b = bossOf(k), cfg = BOSS[k], left = cfg.t - (C.wb[k] || 0), weak = (C.a || []).includes(b.def[2]),w=elT("div","dq"),cp=elT("div","dq-copy");
  cp.append(elT("b","",(b.nm||cfg.nm)+" · "+b.def[0]),elT("small","",(b.until||cfg.until)+" · "+(k==="d"?"남은 공격 ":"오늘 공격 ")+Math.max(0,left)+" / "+cfg.t+"번"+(weak?" · 약점 속성!":"")+" · 들어가면 처치와 공격 기록을 본다"));
  const bt=elT("button","chip","도전");bt.type="button";bt.onclick=bossView;w.append(cp,bt);box.appendChild(w)})}
