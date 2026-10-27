/* 마을 시설과 희망의 등대. main.js 다음에 불러야 한다. 기부, 단계, 이용.
   시설 합계와 단계는 vfac/{마을} 만 읽는다. 등대 합계와 재해 진압 합계는 tally 한 칸이다.
   score 전체는 그 합계가 아직 없을 때 한 클라이언트만 한 번 옮겨 적는다. 상위 5명은 시설 탭에서만 받는다. */
const facUsed=k=>!!(C.fu&&C.fu.d===today()&&C.fu.u&&C.fu.u[k]);
const facQuake=()=>typeof disMine==="function"&&disMine()==="quake";
let facUseBusy=false;
async function facUse(k){if(facUseBusy)return;facUseBusy=true;try{
 if(facQuake()){if(typeof disPullNow==="function")await disPullNow(true);if(typeof disPaint==="function")disPaint();if(facQuake()){toast("지진은 진압되면 바로 풀린다. 진압되지 않아도 최대 여섯 시간이 지나면 시설을 다시 쓸 수 있다.");if(!$("#v-fac").hidden)facView(true);if(!$("#v-hub").hidden)hubFac();return}}
 const lv=facLv(k);if(lv<1||facUsed(k)||!FAC_USE[k])return;if(!C.fu||C.fu.d!==today())C.fu={d:today(),u:{}};C.fu.u[k]=1;const t=FAC_USE[k][1](lv);titleState();C.stats.facUses=(C.stats.facUses||0)+1;save();checkTitles();const m=$("#fm2");if(m){m.style.color="var(--mu)";m.textContent=t}toast("🏛 "+t);if(!$("#v-fac").hidden)facView(true);if(!$("#v-hub").hidden)hubFac()}
 finally{facUseBusy=false}}
const facReady=()=>C?FAC.filter(([k])=>facLv(k)>=1&&!facUsed(k)).length:0;
let FACD={},facAt=0,facBusy=false,facAgain=false;
const facPts=(v,k)=>((FACD[v]||{})[k]||{}).sum||0;
const facLvOf=pts=>FAC_LV.filter(n=>pts>=n).length;
const facLv=k=>C&&!(typeof disMine==="function"&&disMine()==="quake")?facLvOf(facPts(C.v,k)):0;
const myFac=()=>Object.values((C&&C.fc)||{}).reduce((a,b)=>a+(Number(b)||0),0);
/* 시설·등대·재해에 필요한 칸만. 등록자 카드(사진 포함)는 읽지 않는다. */
function scoreBody(){const fc={},dr=C&&C.dr&&typeof C.dr.id==="string"?{id:String(C.dr.id).slice(0,40),pts:Math.max(0,Math.min(40,Number(C.dr.pts)||0))}:null;
 FAC.forEach(([k])=>{const n=Math.max(0,Math.min(1e6,Number((C.fc||{})[k])||0));if(n)fc[k]=n});
 return{n:typeof nmOf==="function"?nmOf():String(C.n||"").slice(0,20),v:C.v&&VL[C.v]?C.v:"",fc,wf:Math.max(0,Math.min(1e7,Number(C.wf)||0)),dr}}
let scoreSig="";
function pubScore(){if(!C||!XON())return Promise.resolve();const body=scoreBody(),sig=JSON.stringify(body);if(sig===scoreSig)return Promise.resolve();scoreSig=sig;return DB.doc("score/"+UID).set(body).catch(()=>{scoreSig=""})}
/* 알림은 마을 단계(vfac)를 반영한 뒤에만. 기여가 다음 단계를 넘긴 때만 올리고, 기억한 단계는 내리지 않는다. */
function facNotice(){if(!C)return;const before=C.facl||{};C.facl=C.facl||{};let ch=false;
 FAC.forEach(([k,nm])=>{const known=facSrv[C.v+"/"+k],lv=facLvOf(known!=null?known:facPts(C.v,k)),prev=before[k];if(prev!=null&&lv>prev){note("fac",VL[C.v].n+"의 "+nm+"이(가) "+lv+"단계가 되었다!");toast("🏛 "+nm+" "+lv+"단계 완성!")}if(prev==null||lv>prev){C.facl[k]=lv;ch=true}});if(ch)save()}
/* facSrv 는 서버가 확인해 준 합계, facFly 는 아직 그 합계에 안 들어간 내 기부. 화면은 둘을 더하고, 그보다 낮은 기록으로는 내리지 않는다. */
let facSrv={},facFly={};
function vfacApply(v,data){if(!v||!VL[v]||!data)return;Object.keys(FAC_KEY).forEach(k=>{const rec=data[k];if(!rec||typeof rec.sum!=="number")return;const id=v+"/"+k,sv=Math.max(0,Math.min(1e8,Number(rec.sum)||0)),prev=facSrv[id]||0,pend=facFly[id]||0;if(sv>prev)facSrv[id]=sv;
 const n=(pend&&sv>=prev+pend)?sv:(facSrv[id]||0)+pend,f=((FACD[v]=FACD[v]||{})[k]=FACD[v][k]||{sum:0,top:[]});f.sum=n})}
function facSeedSum(v,k){const raw=(((FACD[v]||{})[k]||{}).sum)||0;return Math.max(0,raw-(facFly[v+"/"+k]||0))}
async function vfacSync(v,scoreOk){if(!v||!VL[v]||!XON()||typeof apiVfacRead!=="function")return;let data=null;try{const s=await apiVfacRead(v);data=s&&s.exists?s.data()||{}:{}}catch(e){return}
 vfacApply(v,data);if(!scoreOk)return;const miss=Object.keys(FAC_KEY).filter(k=>!(data[k]&&typeof data[k].sum==="number")&&facSeedSum(v,k)>0);
 if(miss.length){await Promise.all(miss.map(k=>apiVfacSeed(v,k,facSeedSum(v,k)).catch(()=>{})));try{const s=await apiVfacRead(v);if(s&&s.exists)vfacApply(v,s.data()||{})}catch(e){}}}
async function vfacLoadTops(v){if(!v||!VL[v]||typeof apiVfacTop!=="function")return;await Promise.all(Object.keys(FAC_KEY).map(async k=>{try{const top=await apiVfacTop(v,k);if(!top.length)return;const f=((FACD[v]=FACD[v]||{})[k]=FACD[v][k]||{sum:0,top:[]});f.top=top}catch(e){}}))}
/* 등대 합계가 없으면 score 를 한 번만 읽어 tally 로 옮긴다. 자물쇠가 있으면 다른 클라이언트는 읽지 않는다. */
async function scoreSeedOnce(){let cur=null;try{const s=await DB.doc("tally/wf").get();cur=s.exists?s.data():null}catch(e){return null}if(cur&&typeof cur.sum==="number")return cur;
 const now=Date.now();let won=false;try{const res=await DB.doc("tally/seed").transact(c=>{if(c&&(c.done||now-(Number(c.at)||0)<120000))return;return {at:now,u:UID}});won=!!(res&&res.u===UID&&Number(res.at)===now&&!res.done)}catch(e){return null}if(!won)return null;
 try{const sn=await once(DB.collection("score")),rows=(sn.docs||[]).map(d=>({id:d.id,p:d.data()||{}})),wf={sum:0,A:0,B:0,C:0,D:0,top:[]},dr={},fac={};
  rows.forEach(({id,p})=>{if(!p||!VL[p.v])return;const w=Math.max(0,Math.min(1e7,Number(p.wf)||0));if(w){wf.sum+=w;wf[p.v]=(Number(wf[p.v])||0)+w;wf.top.push({u:id,n:String(p.n||"").replace(/👑/g,"").slice(0,20),v:p.v,pt:w})}
   if(p.dr&&typeof p.dr.id==="string"){const pt=Math.max(0,Math.min(40,Number(p.dr.pts)||0));if(pt){const k=String(p.dr.id).slice(0,40);dr[k]=(dr[k]||0)+pt}}
   if(p.fc)FAC.forEach(([k])=>{const pt=Math.max(0,Math.min(1e6,Number(p.fc[k])||0));if(pt)fac[p.v+"/"+k]=(fac[p.v+"/"+k]||0)+pt})});
  wf.sum=Math.min(1e8,wf.sum);"ABCD".split("").forEach(k=>{wf[k]=Math.min(1e8,Number(wf[k])||0)});wf.top=wf.top.sort((a,b)=>b.pt-a.pt).slice(0,5);
  await DB.doc("tally/wf").set(wf);
  await Promise.all(Object.keys(dr).slice(0,12).map(id=>DB.doc("tally/dr/"+id).transact(c=>({pts:Math.max(Number(c&&c.pts)||0,Math.min(100000,dr[id]))})).catch(()=>{})));
  if(typeof apiVfacSeed==="function")await Promise.all(Object.keys(fac).map(slot=>{const p=slot.split("/");return apiVfacSeed(p[0],p[1],fac[slot]).catch(()=>{})}));
  await DB.doc("tally/seed").set({at:now,u:UID,done:1});return wf}catch(e){try{await DB.doc("tally/seed").set({at:0,u:UID})}catch(e2){}return null}}
function tallyWfAdd(pts,v){if(!DB||!UID||!pts||!VL[v])return;DB.doc("tally/wf").transact(cur=>{const b=cur&&typeof cur.sum==="number"?cur:{sum:0,A:0,B:0,C:0,D:0,top:[]};const o={sum:Math.min(1e8,(Number(b.sum)||0)+pts),A:Number(b.A)||0,B:Number(b.B)||0,C:Number(b.C)||0,D:Number(b.D)||0,top:Array.isArray(b.top)?b.top.filter(t=>t&&t.u!==UID):[]};
 o[v]=Math.min(1e8,(Number(b[v])||0)+pts);o.top.push({u:UID,n:String(typeof nmOf==="function"?nmOf():C.n||"").replace(/👑/g,"").slice(0,20),v,pt:Math.min(1e7,Number(C.wf)||0)});o.top=o.top.sort((a,b)=>b.pt-a.pt).slice(0,5);return o}).catch(()=>{})}
function tallyDr(id,add){if(!DB||!id||!add)return;DB.doc("tally/dr/"+String(id).slice(0,40)).transact(cur=>({pts:Math.min(100000,(Number(cur&&cur.pts)||0)+add)})).catch(()=>{})}
async function tallyLoad(){let wf=null;try{const s=await DB.doc("tally/wf").get();wf=s.exists?s.data():null}catch(e){}
 if(!wf||typeof wf.sum!=="number"){await scoreSeedOnce();try{const s=await DB.doc("tally/wf").get();wf=s.exists?s.data():null}catch(e){}}
 if(wf&&typeof wf.sum==="number")wfApply({sum:Number(wf.sum)||0,v:{A:Number(wf.A)||0,B:Number(wf.B)||0,C:Number(wf.C)||0,D:Number(wf.D)||0},top:Array.isArray(wf.top)?wf.top:[]});
 const x=typeof disInfo==="function"?disInfo(disSlot(Date.now())):null;if(!x)return;
 try{const s=await DB.doc("tally/dr/"+x.id).get(),p=s.exists?s.data():null;if(p&&p.pts)DRP[x.id]=Math.max(DRP[x.id]||0,Number(p.pts)||0)}catch(e){}}
async function loadFac(){if(!C||!XON())return;if(facBusy){facAgain=true;return}facBusy=true;try{do{facAgain=false;await pubScore();await vfacSync(C.v,false);await tallyLoad();facNotice();facAt=Date.now()}while(facAgain)}finally{facBusy=false}}
function hubFac(){const box=$("#hfa");if(!box||!C)return;box.innerHTML="";if(!XON()){box.appendChild(elT("p","hint","서버에 연결되어야 마을 시설을 지을 수 있다."));return}box.appendChild(wfTile());
 const stopped=facQuake(),g=elT("div","fac-grid");FAC.forEach(([k,nm])=>{const pts=facPts(C.v,k),lv=facLvOf(pts),nx=FAC_LV[lv],pv=lv?FAC_LV[lv-1]:0,can=lv&&!facUsed(k)&&FAC_USE[k]&&!stopped,w=elT("button","fac-tile"+(can?" ready":""));w.type="button";
  const bar=elT("div","bar"),f=elT("i");f.style.width=(nx?Math.min(100,(pts-pv)/(nx-pv)*100):100)+"%";bar.appendChild(f);w.append(elT("b","",nm),elT("small","",lv+"단계"+(stopped&&lv?" · 지진으로 멈춤":can?" · 이용 가능":"")),bar);w.onclick=()=>facView();g.appendChild(w)});box.appendChild(g);
 const r=facReady();box.appendChild(elT("p","hint",(stopped?"지진이 마을을 흔드는 동안 시설 이용이 멈춘다. 진압되면 바로 다시 쓸 수 있다. ":"")+(r?"오늘 이용할 수 있는 시설 "+r+"곳 · ":"")+"누르면 기부하고 이용할 수 있다."));updNav()}
function facView(keep){if(!keep){show("fac");$("#fm2").textContent="";loadFac().then(()=>vfacLoadTops(C.v)).then(()=>{if(!$("#v-fac").hidden)facView(true)})}const box=$("#fl3");box.innerHTML="";const v=C.v;
 box.appendChild(elT("p","x-cd",VL[v].n+" 주민 시설 · 내 기여 "+myFac()+"점 · 보유 골드 "+(C.gd||0)+" · 마력석 "+((C.inv||{}).mana||0)));if(facQuake())box.appendChild(elT("p","hint","지진이 마을을 흔들고 있다. 진압되면 바로, 진압되지 않아도 이 구간이 끝나면(최대 여섯 시간) 시설을 다시 쓸 수 있다."));box.appendChild(wfCard());box.appendChild(elT("h2","",VL[v].n+" 시설"));
 FAC.forEach(([k,nm,ds,ef])=>{const pts=facPts(v,k),lv=facLvOf(pts),nx=FAC_LV[lv],pv=lv?FAC_LV[lv-1]:0,c=elT("div","card");c.style.marginTop="10px";
  const top=elT("div","");top.style.cssText="display:flex;justify-content:space-between;align-items:baseline;gap:8px";top.append(elT("h2","",nm),elT("b","",lv+" / "+FAC_LV.length+"단계"));c.append(top,elT("p","hint",ds));
  c.appendChild(elT("p","","지금 효과: "+(lv?ef(lv):"아직 없음")+(nx?" → 다음 단계: "+ef(lv+1):"")));
  const bar=elT("div","bar"),f=elT("i");f.style.width=(nx?Math.min(100,(pts-pv)/(nx-pv)*100):100)+"%";f.style.background="linear-gradient(90deg,#2e5a6b,#6fc1d1)";bar.appendChild(f);c.append(bar,elT("p","hint",nx?"마을 기여 "+pts+" / "+nx+" (다음 단계까지 "+(nx-pts)+")":"최고 단계에 도달했다. (마을 기여 "+pts+")"));
  const row=elT("div","row");row.style.marginTop="6px";
  [[50,"골드 50"],[200,"골드 200"],[500,"골드 500"]].forEach(([g,lab])=>{const b=elT("button","chip",lab);b.type="button";b.disabled=(C.gd||0)<g;b.onclick=()=>facGive(k,g,0);row.appendChild(b)});
  const sb=elT("button","chip","마력석 1 (+"+FAC_STONE+")");sb.type="button";sb.disabled=((C.inv||{}).mana||0)<1;sb.onclick=()=>facGive(k,0,1);row.appendChild(sb);c.appendChild(row);
  const tp=((FACD[v]||{})[k]||{}).top||[];if(tp.length){const ol=elT("ol","boss-rank");tp.slice().sort((a,b)=>b.pt-a.pt).slice(0,5).forEach(t=>ol.appendChild(elT("li",t.u===UID?"me":"",cn(t.u,t.n)+" · "+t.pt)));c.appendChild(ol)}
  if(v===C.v&&FAC_USE[k]){const used=facUsed(k),stopped=facQuake()&&lv>0,u=elT("button","btn"+(lv&&!used&&!stopped?"":" g"),!lv?"1단계가 되면 이용할 수 있다":stopped?"지진 중 · 진압되거나 구간이 끝나면 이용할 수 있다":(used?"오늘 이용 완료 · ":"시설 이용 · ")+FAC_USE[k][0](lv));u.type="button";u.disabled=!lv||used||stopped;u.style.marginTop="8px";u.onclick=()=>facUse(k);c.appendChild(u)}
  c.appendChild(elT("p","boss-info","내 기여 "+((C.fc||{})[k]||0)+"점"));box.appendChild(c)});
 box.appendChild(elT("p","boss-info","골드 1 = 1점, 마력석 1개 = "+FAC_STONE+"점. 기부 10점마다 마을 경쟁 점수 1점도 함께 오른다. 시설 효과는 그 마을 주민에게만 적용된다."))}
function facGive(k,g,st){const pts=g+st*FAC_STONE,m=$("#fm2");if(g&&(C.gd||0)<g)return;if(st&&((C.inv||{}).mana||0)<st)return;
 C.gd-=g;if(st)C.inv.mana-=st;C.fc=C.fc||{};C.fc[k]=(Number(C.fc[k])||0)+pts;titleState();C.stats.facGive=(C.stats.facGive||0)+pts;guardAdd(Math.floor(pts/10));save();checkTitles();
 const id=C.v+"/"+k,f=((FACD[C.v]=FACD[C.v]||{})[k]=FACD[C.v][k]||{sum:0,top:[]});const b0=facLvOf(f.sum),had=facFly[id]||0;facFly[id]=had+pts;const base=facSrv[id]!=null?facSrv[id]:Math.max(0,(f.sum||0)-had);f.sum=base+facFly[id];const me0=f.top.find(t=>t.u===UID);if(me0)me0.pt+=pts;else f.top.push({u:UID,n:C.n,pt:pts});
 const nm=FAC.find(x=>x[0]===k)[1],a0=facLvOf(f.sum);if(m){m.style.color="var(--mu)";m.textContent=nm+"에 "+pts+"점을 기여했다."+(a0>b0?" "+nm+"이(가) "+a0+"단계가 되었다!":"")}if(a0>b0){C.facl=C.facl||{};C.facl[k]=a0;note("fac",VL[C.v].n+"의 "+nm+"이(가) "+a0+"단계가 되었다!");toast("🏛 "+nm+" "+a0+"단계 완성!");save()}pubScore();const mine=Number((C.fc||{})[k])||0,seed=facSrv[id]!=null?facSrv[id]:Math.max(0,f.sum-facFly[id]);
 const done=left=>{facFly[id]=Math.max(0,(facFly[id]||0)-pts);if(!(left&&typeof left.sum==="number"))return;facSrv[id]=Math.max(facSrv[id]||0,left.sum);const cur=((FACD[C.v]=FACD[C.v]||{})[k]=FACD[C.v][k]||{sum:0,top:[]}),n=facSrv[id]+(facFly[id]||0);if(cur.sum===n)return;cur.sum=n;if(!$("#v-fac").hidden)facView(true);if(!$("#v-hub").hidden)hubFac()};
 apiVfacMine(C.v,k,mine,typeof nmOf==="function"?nmOf():C.n).catch(()=>{});apiVfacBump(C.v,k,pts,seed).then(done).catch(()=>done());facView(true);if(!$("#v-hub").hidden)hubFac()}
var WFD={sum:0,v:{},top:[]};
function wfLvOf(d){let l=0;for(const T of WF_LV){if(d.sum<T||!Object.keys(VL).every(k=>(d.v[k]||0)>=T*WF_SHARE))break;l++}return l}
const wfLv=()=>wfLvOf(WFD);
function wfApply(d){const b=C.wfl,l=wfLvOf(d);WFD=d;if(b==null){C.wfl=l;save();return}if(l>b){wfUp(l);C.wfl=l}}
function wfUp(l){if(l>=WF_LV.length&&(Number(C.wf)||0)>0)C.wfDone=1;note("fac","🗼 희망의 등대가 "+l+"단계가 되었다! 모든 마을에 새 빛: "+WF_EFF[l-1]);toast("🗼 희망의 등대 "+l+"단계! "+WF_EFF[l-1]);ding();save();checkTitles()}
// 다음 단계까지 모자란 것: 전체 점수, 그리고 기준에 못 미친 마을
function wfNeed(){const l=wfLv(),T=WF_LV[l];if(!T)return null;return{T,left:Math.max(0,T-WFD.sum),low:Object.keys(VL).filter(k=>(WFD.v[k]||0)<T*WF_SHARE)}}
function wfTile(){const l=wfLv(),n=wfNeed(),pv=l?WF_LV[l-1]:0,w=elT("button","fac-tile wf-tile"+(wfReady()?" ready":""));w.type="button";const bar=elT("div","bar"),f=elT("i");
 f.style.width=(n?Math.min(100,(WFD.sum-pv)/(n.T-pv)*100):100)+"%";bar.appendChild(f);
 w.append(elT("b","","🗼 희망의 등대 · 네 마을 공동 "+l+"단계"),elT("small","",n?WFD.sum+" / "+n.T+(n.low.length?" · 힘이 모자란 마을: "+n.low.map(k=>VL[k].n).join(", "):""):"완공! 모든 마을을 비추고 있다"+(wfReady()?" · 등대의 빛 받기 가능":"")),bar);w.onclick=()=>facView();return w}
const wfReady=()=>!!C&&wfLv()>=4&&C.wfu!==today();
function wfCard(){const c=elT("div","card wf-card"),l=wfLv(),n=wfNeed(),pv=l?WF_LV[l-1]:0;
 const top=elT("div","");top.style.cssText="display:flex;justify-content:space-between;align-items:baseline;gap:8px";top.append(elT("h2","","🗼 희망의 등대"),elT("b","",l+" / "+WF_LV.length+"단계"));
 c.append(top,elT("p","hint","A·B·C·D 네 마을이 함께 짓는 단 하나의 등대. 효과는 마을과 상관없이 모든 마법소녀에게 비친다. 단계가 오르려면 전체 점수와 함께 네 마을 각각이 기준의 "+WF_SHARE*100+"% 이상을 보태야 한다."));
 const bar=elT("div","bar"),f=elT("i");f.style.width=(n?Math.min(100,(WFD.sum-pv)/(n.T-pv)*100):100)+"%";bar.appendChild(f);c.append(bar,elT("p","hint",n?"전체 "+WFD.sum+" / "+n.T+" (다음 단계까지 "+n.left+")":"완공되었다. (전체 "+WFD.sum+")"));
 const vg=elT("div","wf-vil");Object.keys(VL).forEach(k=>{const have=WFD.v[k]||0,need=n?Math.ceil(n.T*WF_SHARE):0,ok=!n||have>=need,d=elT("div",(ok?"ok":"low")+(k===C.v?" me":""));
  const b2=elT("div","bar"),f2=elT("i");f2.style.width=(need?Math.min(100,have/need*100):100)+"%";b2.appendChild(f2);d.append(elT("b","",VL[k].n+(k===C.v?" (우리)":"")),elT("div","",String(have)),elT("small","",ok?"✓ 충분":"최소 "+need),b2);vg.appendChild(d)});c.appendChild(vg);
 const ul=elT("ol","wf-eff");WF_EFF.forEach((e,i)=>ul.appendChild(elT("li",i<l?"on":"",(i+1)+"단계: "+e+(i<l?" ✓":""))));c.appendChild(ul);
 const row=elT("div","row");row.style.marginTop="8px";[[100,"골드 100"],[500,"골드 500"],[1000,"골드 1000"]].forEach(([g,lab])=>{const b=elT("button","chip",lab);b.type="button";b.disabled=(C.gd||0)<g;b.onclick=()=>wfGive(g,0);row.appendChild(b)});
 const sb=elT("button","chip","마력석 1 (+"+WF_STONE+")");sb.type="button";sb.disabled=((C.inv||{}).mana||0)<1;sb.onclick=()=>wfGive(0,1);row.appendChild(sb);c.appendChild(row);
 if(l>=4){const u=elT("button","btn"+(wfReady()?"":" g"),wfReady()?"등대의 빛 받기 (절망도 -"+WF_LIGHT.dz+", 마력석 +"+WF_LIGHT.m+")":"오늘은 이미 등대의 빛을 받았다");u.type="button";u.disabled=!wfReady()||!!C.fall;u.onclick=wfLight;c.appendChild(u)}
 const tp=WFD.top.slice().sort((a,b)=>b.pt-a.pt).slice(0,5);if(tp.length){const ol=elT("ol","boss-rank");tp.forEach(t=>ol.appendChild(elT("li",t.u===UID?"me":"",cn(t.u,t.n)+" ("+((VL[t.v]||{}).n||"")+") · "+t.pt)));c.appendChild(ol)}
 c.appendChild(elT("p","boss-info","내 기여 "+(Number(C.wf)||0)+"점 · 골드 1 = 1점, 마력석 1개 = "+WF_STONE+"점. 기부 10점마다 마을 경쟁 점수 1점도 함께 오른다."));return c}
function wfGive(g,st){const pts=g+st*WF_STONE,m=$("#fm2");if(g&&(C.gd||0)<g)return;if(st&&((C.inv||{}).mana||0)<st)return;const b0=wfLv();
 C.gd-=g;if(st)C.inv.mana-=st;C.wf=(Number(C.wf)||0)+pts;titleState();C.stats.wfGive=(C.stats.wfGive||0)+pts;guardAdd(Math.floor(pts/10));
 WFD.sum+=pts;WFD.v[C.v]=(WFD.v[C.v]||0)+pts;const me0=WFD.top.find(t=>t.u===UID);if(me0)me0.pt+=pts;else WFD.top.push({u:UID,n:C.n,v:C.v,pt:pts});
 const a0=wfLv();C.wfl=a0;if(a0>b0)wfUp(a0);save();checkTitles();if(m){m.style.color="var(--mu)";m.textContent="희망의 등대에 "+pts+"점을 보탰다."+(a0>b0?" 등대가 "+a0+"단계가 되었다!":"")}pubScore();tallyWfAdd(pts,C.v);facView(true);if(!$("#v-hub").hidden)hubFac()}
function wfLight(){if(!wfReady()||C.fall)return;C.wfu=today();gain(0,-WF_LIGHT.dz);giveRw({m:WF_LIGHT.m});save();$("#fm2").style.color="var(--mu)";$("#fm2").textContent="등대의 따뜻한 빛을 받았다. 절망도 -"+WF_LIGHT.dz+", 마력석 +"+WF_LIGHT.m+".";facView(true)}
