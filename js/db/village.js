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
