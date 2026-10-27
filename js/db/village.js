/* 마을 시설 단계. score·players 와 별개인 vfac, vfactop 만 다룬다.
   vfac/{마을}/{키} = { t:표시 이름, sum:전체 기여, lv:단계 }
   vfactop/{마을}/{키}/{사람} = { n, pt }. 상위 5명은 apiVfacTop 이 그 다섯 명만 읽는다. */
function vfacPathOk(v,k){return !!(VL[v]&&FAC_KEY[k])}
function vfacLv(sum){let lv=0;(FAC_LV||[]).forEach(n=>{if(sum>=n)lv++});return lv}
function apiVfacRead(v){if(!vfacPathOk(v,"spring"))return Promise.reject(new Error("vfac"));return apiGet("vfac/"+v)}
/* 그 시설의 기여가 높은 다섯 명만 받는다. */
async function apiVfacTop(v,k){if(!DB||!vfacPathOk(v,k))return [];const s=await once(DB.collection("vfactop/"+v+"/"+k).by("pt").limit(5));
 return (s.docs||[]).map(d=>{const x=d.data()||{};return{u:d.id,n:String(x.n||"").replace(/👑/g,"").slice(0,20),pt:Math.max(0,Number(x.pt)||0)}}).filter(x=>x.pt>0).sort((a,b)=>b.pt-a.pt)}
function apiVfacMine(v,k,pt,name){if(!DB||!UID||!vfacPathOk(v,k))return Promise.resolve();const n=Math.max(0,Math.min(1e6,Number(pt)||0));if(!n)return Promise.resolve();
 return apiPut("vfactop/"+v+"/"+k+"/"+UID,{n:String(name||"").replace(/👑/g,"").slice(0,20),pt:n})}
/* 기록이 없을 때만 지금 합계로 단계를 만든다. 이미 있으면 그대로 둔다. */
function apiVfacSeed(v,k,sum){if(!DB||!vfacPathOk(v,k))return Promise.resolve();const n=Math.max(0,Math.min(1e8,Number(sum)||0));if(!n)return Promise.resolve();
 return DB.doc("vfac/"+v+"/"+k).transact(cur=>{if(cur&&typeof cur.sum==="number")return;return{t:FAC_KEY[k],sum:n,lv:vfacLv(n)}})}
/* 내 기부만큼 전체 기여와 단계를 올린다. 두 사람이 겹치면 한쪽이 사라지지 않게 다시 시도한다. */
function apiVfacBump(v,k,delta,seed){if(!DB||!vfacPathOk(v,k))return Promise.resolve();const add=Math.max(0,Math.min(1e6,Number(delta)||0));if(!add)return Promise.resolve();
 const base=Math.max(0,Math.min(1e8,Number(seed)||0));
 return DB.doc("vfac/"+v+"/"+k).transact(cur=>{const had=!!(cur&&typeof cur.sum==="number"),sum=Math.max(0,Math.min(1e8,(had?Number(cur.sum)||0:base)+add));return{t:FAC_KEY[k],sum,lv:vfacLv(sum)}})}
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
 const want={},sums={},rows=[];let skipped=0,used=0;
 Object.keys(people).forEach(uid=>{const p=people[uid];if(!VL[p.v]){skipped++;return}let any=false;Object.keys(FAC_KEY).forEach(k=>{const pt=p.fc[k]||0;if(!pt)return;any=true;const slot=p.v+"/"+k;(sums[slot]=(sums[slot]||0)+pt);want[slot+"/"+uid]=1;rows.push({path:"vfactop/"+slot+"/"+uid,body:{n:p.n||"주민",pt}})});if(any)used++});
 Object.keys(VL).forEach(v=>Object.keys(FAC_KEY).forEach(k=>{const slot=v+"/"+k,sum=Math.max(0,Math.min(1e8,sums[slot]||0));rows.push(sum?{path:"vfac/"+slot,body:{t:FAC_KEY[k],sum,lv:vfacLv(sum)}}:{path:"vfac/"+slot,del:1})}));
 step("마을 단계와 순위를 맞추는 중...");
 let wi=0,failWrite=0,removed=0;async function writer(){for(;;){const i=wi++;if(i>=rows.length)return;const job=rows[i];if(i%10===0)step("기록하는 중... "+i+" / "+rows.length);try{if(job.del)await DB.doc(job.path).delete();else await apiPut(job.path,job.body)}catch(e){failWrite++}}}
 await Promise.all(Array.from({length:Math.min(6,rows.length||1)},writer));
 for(const v of Object.keys(VL))for(const k of Object.keys(FAC_KEY)){let cur=null;try{const s=await DB.doc("vfactop/"+v+"/"+k).get();cur=s.exists?s.data():null}catch(e){continue}if(!cur||typeof cur!=="object")continue;for(const uid of Object.keys(cur)){if(want[v+"/"+k+"/"+uid])continue;try{await DB.doc("vfactop/"+v+"/"+k+"/"+uid).delete();removed++}catch(e){failWrite++}}}
 const lines=[];Object.keys(VL).forEach(v=>Object.keys(FAC_KEY).forEach(k=>{const sum=sums[v+"/"+k]||0;if(sum)lines.push(VL[v].n+" "+FAC_KEY[k]+" "+sum+"점 "+vfacLv(sum)+"단계")}));
 return{players:ids.length,used,skipped,failRead,failWrite,removed,lines}}
