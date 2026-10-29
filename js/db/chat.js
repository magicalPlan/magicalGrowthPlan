/* 채팅이 서버와 주고받는 일. 화면(js/chat.js)은 여기만 부르고, 저장 경로는 이 파일이 안다. */
function apiWatchGlobal(onDocs,onErr){return apiCol("chat").orderBy("ts","desc").limit(40).onSnapshot(s=>onDocs((s.docs||[]).map(d=>d.data()).filter(m=>m&&!m.vc)),onErr,POLL_FAST)}
function apiWatchVillage(v,onDocs,onErr){return apiCol("chat").prefix("c_"+v+"_").limit(40).onSnapshot(s=>onDocs((s.docs||[]).map(d=>d.data()).filter(m=>m&&m.vc===v)),onErr,POLL_FAST)}


/* 운영자 열람. 최근 500개를 한 번만 읽는다. 탭을 연 채로 반복해서 받지 않는다. */
function apiAdmOnce(){return once(apiCol("dm").limit(500))}
function apiPostMessage(col,id,data){return apiPut(col+"/"+id,data)}
function apiDmBell(to,preview){const n=nmOf(),ts={".sv":"timestamp"};apiPut("rooms/xd"+to+"/"+UID,{n,ts}).catch(()=>{});apiPut("rooms/xd"+to+"/ts",ts).catch(()=>{});apiPut("dmn/"+to+"/"+UID,{n,x:String(preview||"").slice(0,40),ts}).catch(()=>{})}
/* 채팅방 나가기. 상대 우편함에 퇴장만 남긴다. 대화 본문은 지우지 않아서, 남은 사람은 저장할 수 있고 새 메시지를 보내면 다시 이어진다. */
function apiDmLeave(to){return apiPut("dmn/"+to+"/"+UID,{n:nmOf(),ts:{".sv":"timestamp"},left:1})}
function apiDmDrop(id){return DB.doc("rooms/xd"+UID+"/"+id).delete()}

/* 1:1 본문. 그 대화 키만 한 번 읽는다. 목록을 보는 동안에는 부르지 않는다. */
function apiDmThread(k){return once(apiCol("dm").where("k","==",k))}
function apiDmBox(){return apiGet("rooms/xd"+UID)}
function apiDmnList(){return once(apiCol("dmn/"+UID))}

/* 1:1 목록. 상대 이름과 받은 시각만 있는 우편함이다. 메시지 본문은 들어 있지 않다. */
async function apiDmIndex(){const rows={},take=(id,v)=>{if(!id||id==="ts"||!v||typeof v!=="object")return;const ts=Number(v.ts)||0;if(!ts)return;const cur=rows[id],n=String(v.n||"").replace(/👑/g,"").slice(0,20);if(!cur||ts>=cur.ts)rows[id]={n:n||(cur&&cur.n)||"",ts}};
 let ok=false;try{const s=await apiDmnList();(s.docs||[]).forEach(d=>take(d.id,d.data()));ok=true}catch(e){}
 try{const d=(await apiDmBox()).data()||{};Object.keys(d).forEach(id=>take(id,d[id]));ok=true}catch(e){}
 if(!ok)throw new Error("dm-index");return rows}
function apiVillageLatest(v){return once(apiCol("chat").prefix("c_"+v+"_").limit(1))}
async function apiClockSync(){if(skewOk||!XON()||!UID)return;skewOk=true;try{const a=Date.now();await apiPut("wboss/clk/"+UID,{t:{".sv":"timestamp"}});const b=Date.now();const v=Number(((await apiGet("wboss/clk/"+UID)).data()||{}).t);if(v>0&&b-a<5000)SKEW=Math.round(v-(a+b)/2)}catch(e){skewOk=false}}
