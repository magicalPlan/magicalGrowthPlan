/* 채팅이 서버와 주고받는 일. 화면(js/chat.js)은 여기만 부르고, 저장 경로는 이 파일이 안다. */
function apiWatchGlobal(onDocs,onErr){return apiCol("chat").orderBy("ts","desc").limit(40).onSnapshot(s=>onDocs((s.docs||[]).map(d=>d.data()).filter(m=>m&&!m.vc)),onErr,POLL_FAST)}
function apiWatchVillage(v,onDocs,onErr){return apiCol("chat").prefix("c_"+v+"_").limit(40).onSnapshot(s=>onDocs((s.docs||[]).map(d=>d.data()).filter(m=>m&&m.vc===v)),onErr,POLL_FAST)}
function apiWatchDm(k,onDocs,onErr){return apiCol("dm").where("k","==",k).onSnapshot(s=>onDocs((s.docs||[]).map(d=>d.data())),onErr,POLL_FAST)}
function apiWatchAdm(onSnap,onErr){return apiCol("dm").limit(500).onSnapshot(onSnap,onErr)}
function apiPostMessage(col,id,data){return apiPut(col+"/"+id,data)}
function apiDmBell(to,preview){const n=nmOf(),ts={".sv":"timestamp"};apiPut("rooms/xd"+to+"/"+UID,{n,ts}).catch(()=>{});apiPut("rooms/xd"+to+"/ts",ts).catch(()=>{});apiPut("dmn/"+to+"/"+UID,{n,x:String(preview||"").slice(0,40),ts}).catch(()=>{})}
function apiDmThread(k){return once(apiCol("dm").where("k","==",k))}
function apiDmBox(){return apiGet("rooms/xd"+UID)}
function apiDmnList(){return once(apiCol("dmn/"+UID))}
function apiVillageLatest(v){return once(apiCol("chat").prefix("c_"+v+"_").limit(1))}
async function apiClockSync(){if(skewOk||!XON()||!UID)return;skewOk=true;try{const a=Date.now();await apiPut("wboss/clk/"+UID,{t:{".sv":"timestamp"}});const b=Date.now();const v=Number(((await apiGet("wboss/clk/"+UID)).data()||{}).t);if(v>0&&b-a<5000)SKEW=Math.round(v-(a+b)/2)}catch(e){skewOk=false}}
