/* 마을 시설. score·players 와 별개인 vfac, vfactop 만 다룬다.
   vfac/{마을}/{키} = { t:표시 이름, sum:마을 경험치(누적 기여), lv:완공 단계, by:{사람:이미 합계에 넣은 기여도} }
   sum 과 lv 는 항상 같이 저장한다. lv 는 data/game.js 의 FAC_LV 로 sum 에서 계산한다.
   vfactop/{마을}/{키}/{사람} = { n, pt }. 화면의 기여도 란이고, 상위 5명만 apiVfacTop 이 읽는다.
   by[사람] 이 그 사람의 기여도보다 작으면 차이만 sum 에 더한다. 같은 점수를 두 번 넣지 않기 위해서다.
   by 가 아직 없는 옛 기록은 기여도 전체를 또 더하지 않는다. apiVfacAlign 이 기여도 합과 sum 중 큰 쪽으로 맞춘 뒤에만 차이를 더한다. */
function vfacPathOk(v,k){return !!(VL[v]&&FAC_KEY[k])}
function vfacLv(sum){let lv=0;(FAC_LV||[]).forEach(n=>{if(sum>=n)lv++});return lv}
function vfacClamp(n,max){n=Number(n)||0;if(n<0)n=0;if(n>max)n=max;return n}
function vfacPack(k,sum,by){const s=vfacClamp(sum,1e8),b={};
 Object.keys(by||{}).forEach(u=>{const p=vfacClamp(by[u],1e6);if(p>0&&String(u).length&&String(u).length<=128)b[u]=p});
 return{t:FAC_KEY[k],sum:s,lv:vfacLv(s),by:b}}
function vfacSame(cur,pack){if(!cur||typeof cur.sum!=="number"||cur.sum!==pack.sum||cur.lv!==pack.lv||cur.t!==pack.t||!cur.by||typeof cur.by!=="object")return false;
 const ob=cur.by,nb=pack.by,keys={};
 Object.keys(ob).forEach(u=>{keys[u]=1});Object.keys(nb).forEach(u=>{keys[u]=1});
 return Object.keys(keys).every(u=>vfacClamp(ob[u],1e6)===vfacClamp(nb[u],1e6))}
/* tops 가 있으면 기여도 목록 전체로 맞춘다. 없으면 mine 한 사람의 기여도만 반영한다.
   반환값이 없으면 서버 칸을 고치지 않는다. sum 은 내려가지 않는다. */
function vfacMerge(k,cur,tops,mine,uid){const prev=cur&&typeof cur==="object"?cur:null,hadSum=!!(prev&&typeof prev.sum==="number"),hadBy=!!(prev&&prev.by&&typeof prev.by==="object");
 if(!hadBy&&hadSum&&!tops)return;
 const by={};if(hadBy)Object.keys(prev.by).forEach(u=>{const p=vfacClamp(prev.by[u],1e6);if(p)by[u]=p});
 let raised=0;const lift=(u,pt)=>{u=String(u||"");pt=vfacClamp(pt,1e6);if(!u||pt<=(by[u]||0))return;raised+=pt-(by[u]||0);by[u]=pt};
 if(tops&&typeof tops==="object")Object.keys(tops).forEach(u=>{const raw=tops[u];lift(u,raw&&typeof raw==="object"?raw.pt:raw)});
 if(uid)lift(uid,mine);
 let covered=0;Object.keys(by).forEach(u=>{covered+=by[u]});
 /* 넣을 기여가 없으면 칸을 만들지 않는다. 합계만 있는 옛 기록에 빈 by 를 적으면, 다음 기부가 그 사람 기여도 전체를 합계 위에 또 더한다. */
 if(!covered&&(!hadSum||!hadBy))return;
 const base=hadSum?vfacClamp(prev.sum,1e8):0,sum=!hadBy?Math.max(base,Math.min(1e8,covered)):Math.min(1e8,base+raised),pack=vfacPack(k,sum,by);
 if(vfacSame(prev,pack))return;return pack}
function apiVfacRead(v){if(!vfacPathOk(v,"spring"))return Promise.reject(new Error("vfac"));return apiGet("vfac/"+v)}
/* 그 시설의 기여가 높은 다섯 명만 받는다. */
async function apiVfacTop(v,k){if(!DB||!vfacPathOk(v,k))return [];const s=await once(DB.collection("vfactop/"+v+"/"+k).by("pt").limit(5));
 return (s.docs||[]).map(d=>{const x=d.data()||{};return{u:d.id,n:String(x.n||"").replace(/👑/g,"").slice(0,20),pt:Math.max(0,Number(x.pt)||0)}}).filter(x=>x.pt>0).sort((a,b)=>b.pt-a.pt)}
function apiVfacMine(v,k,pt,name){if(!DB||!UID||!vfacPathOk(v,k))return Promise.resolve();const n=Math.max(0,Math.min(1e6,Number(pt)||0));if(!n)return Promise.resolve();
 return apiPut("vfactop/"+v+"/"+k+"/"+UID,{n:String(name||"").replace(/👑/g,"").slice(0,20),pt:n})}
/* 기록이 없을 때만 합계와 완공 단계를 적는다. by 는 적지 않는다. 이미 합계가 있으면 그대로 둔다. */
function apiVfacSeed(v,k,sum){if(!DB||!vfacPathOk(v,k))return Promise.resolve();const n=Math.max(0,Math.min(1e8,Number(sum)||0));if(!n)return Promise.resolve();
 return DB.doc("vfac/"+v+"/"+k).transact(cur=>{if(cur&&typeof cur.sum==="number")return;return{t:FAC_KEY[k],sum:n,lv:vfacLv(n)}})}
/* 그 시설의 기여도 전부를 읽는다. 상위 5명만 보는 apiVfacTop 과 다르다. 합계를 맞출 때 한 번 쓴다. */
async function apiVfacAll(v,k){if(!DB||!vfacPathOk(v,k))return {};const s=await DB.doc("vfactop/"+v+"/"+k).get(),data=s.exists?s.data():null,tops={};
 if(data&&typeof data==="object")Object.keys(data).forEach(u=>{const pt=data[u]&&typeof data[u]==="object"?data[u].pt:0;if(pt)tops[u]=pt});return tops}
/* 기여도 목록으로 마을 합계와 완공 단계를 맞춘다. 합계가 기여도 합보다 작으면 올리고, 더 크면 그대로 둔다. */
function apiVfacAlign(v,k,tops){if(!DB||!vfacPathOk(v,k))return Promise.resolve(null);
 return DB.doc("vfac/"+v+"/"+k).transact(cur=>vfacMerge(k,cur,tops||{},0,""))}
/* 이 사람의 기여도 전체를 마을 합계에 반영한다. 이미 들어간 양은 by 에 있으므로 차이만 더하고, 단계도 다시 적는다.
   by 가 아직 없는 옛 합계에는 쓰지 않는다(mode "wait"). 그때는 apiVfacAlign 을 먼저 한다. */
function apiVfacApply(v,k,mine){if(!DB||!UID||!vfacPathOk(v,k))return Promise.resolve({mode:"same",rec:null});const me=vfacClamp(mine,1e6);if(!me)return Promise.resolve({mode:"same",rec:null});
 let mode="same";return DB.doc("vfac/"+v+"/"+k).transact(cur=>{const next=vfacMerge(k,cur,null,me,UID);if(next===undefined){const prev=cur&&typeof cur==="object"?cur:null;if(!(prev&&prev.by&&typeof prev.by==="object")&&prev&&typeof prev.sum==="number")mode="wait";return}mode="wrote";return next}).then(rec=>({mode,rec}))}
/* 예전 기여를 마을 단계 기록으로 다시 쓴다. 플레이어 카드의 시설 기여(fc)와 score 의 기여 중 큰 값을 쓰고, 사진은 받지 않는다.
   운영자만 다른 사람의 순위 칸을 고칠 수 있다. 여러 번 실행해도 합계를 더하지 않고 그 값으로 맞춘다. */
async function apiVfacRecover(onStep){if(!DB||!ADM[UID])throw new Error("admin");
 const step=m=>{try{onStep&&onStep(m)}catch(e){}};
 const people={},take=(uid,src)=>{if(!uid||!src)return;const row=people[uid]||(people[uid]={n:"",v:"",fc:{}});
  const nm=String(src.n||"").replace(/👑/g,"").slice(0,20);if(nm)row.n=nm;if(VL[src.v])row.v=src.v;
  if(src.fc&&typeof src.fc==="object")Object.keys(FAC_KEY).forEach(k=>{const pt=Math.max(0,Math.min(1e6,Number(src.fc[k])||0));if(pt>(row.fc[k]||0))row.fc[k]=pt})};
 step("기여 기록을 모으는 중...");
 try{const sn=await once(DB.collection("score"));(sn.docs||[]).forEach(d=>{const p=d.data()||{};take(d.id,{n:p.n,v:p.v,fc:p.fc})})}catch(e){}
 let ids=[];try{ids=Object.keys((await DB.doc("players").peek())||{})}catch(e){throw new Error("players")}
 let at=0,failRead=0;const val=async path=>{try{const s=await DB.doc(path).get();return s.exists?s.data():null}catch(e){return undefined}};
 async function worker(){for(;;){const i=at++;if(i>=ids.length)return;const uid=ids[i];if(i%8===0)step("플레이어 기여를 확인하는 중... "+i+" / "+ids.length);const [n,v,fc]=await Promise.all([val("players/"+uid+"/n"),val("players/"+uid+"/v"),val("players/"+uid+"/fc")]);if(n===undefined&&v===undefined&&fc===undefined){failRead++;continue}take(uid,{n:typeof n==="string"?n:"",v:typeof v==="string"?v:"",fc:fc&&typeof fc==="object"?fc:null})}}
 await Promise.all(Array.from({length:Math.min(6,ids.length)},worker));
 if(C&&UID)take(UID,{n:typeof nmOf==="function"?nmOf():C.n,v:C.v,fc:C.fc});
 const want={},sums={},bys={},rows=[];let skipped=0,used=0;
 Object.keys(people).forEach(uid=>{const p=people[uid];if(!VL[p.v]){skipped++;return}let any=false;Object.keys(FAC_KEY).forEach(k=>{const pt=p.fc[k]||0;if(!pt)return;any=true;const slot=p.v+"/"+k;(sums[slot]=(sums[slot]||0)+pt);(bys[slot]=bys[slot]||{})[uid]=pt;want[slot+"/"+uid]=1;rows.push({path:"vfactop/"+slot+"/"+uid,body:{n:p.n||"주민",pt}})});if(any)used++});
 Object.keys(VL).forEach(v=>Object.keys(FAC_KEY).forEach(k=>{const slot=v+"/"+k,sum=Math.max(0,Math.min(1e8,sums[slot]||0));rows.push(sum?{path:"vfac/"+slot,body:vfacPack(k,sum,bys[slot]||{})}:{path:"vfac/"+slot,del:1})}));
 step("마을 단계와 순위를 맞추는 중...");
 let wi=0,failWrite=0,removed=0;async function writer(){for(;;){const i=wi++;if(i>=rows.length)return;const job=rows[i];if(i%10===0)step("기록하는 중... "+i+" / "+rows.length);try{if(job.del)await DB.doc(job.path).delete();else await apiPut(job.path,job.body)}catch(e){failWrite++}}}
 await Promise.all(Array.from({length:Math.min(6,rows.length||1)},writer));
 for(const v of Object.keys(VL))for(const k of Object.keys(FAC_KEY)){let cur=null;try{const s=await DB.doc("vfactop/"+v+"/"+k).get();cur=s.exists?s.data():null}catch(e){continue}if(!cur||typeof cur!=="object")continue;for(const uid of Object.keys(cur)){if(want[v+"/"+k+"/"+uid])continue;try{await DB.doc("vfactop/"+v+"/"+k+"/"+uid).delete();removed++}catch(e){failWrite++}}}
 const lines=[];Object.keys(VL).forEach(v=>Object.keys(FAC_KEY).forEach(k=>{const sum=sums[v+"/"+k]||0;if(sum)lines.push(VL[v].n+" "+FAC_KEY[k]+" "+sum+"점 "+vfacLv(sum)+"단계")}));
 return{players:ids.length,used,skipped,failRead,failWrite,removed,lines}}
if(typeof module!=="undefined"&&module.exports)module.exports={vfacMerge,vfacLv,vfacPack}
