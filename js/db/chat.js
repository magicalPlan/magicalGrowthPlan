/* 채팅이 서버와 주고받는 일. 화면(js/chat.js)은 여기만 부르고, 저장 경로는 이 파일이 안다.
   단체 말은 키 g_…, 마을은 c_{마을}_…, 게시판은 bp_/bx_/bc_… 로 구간을 나눈다.
   chat 전체에 .by("ts") 인덱스를 걸면 게시글과 최근 40개가 섞이므로 쓰지 않는다. 접두어+$key 로 자른다. */
function apiWatchGlobal(onDocs,onErr){
 /* g_ 실시간. 예전(밑줄 없는 키) 단체 말은 g_ 가 40개 미만일 때만 한 번 읽어 합친다. */
 let on=true,legacy=null,live=[],legTried=false;
 const ok=m=>!!(m&&!m.vc&&!m.bt);
 const emit=()=>{if(!on)return;const bag={};const put=(id,m)=>{if(!ok(m))return;bag[id||((Number(m.ts)||0)+":"+(m.u||""))]=m};
  (legacy||[]).forEach(([id,m])=>put(id,m));live.forEach(([id,m])=>put(id,m));
  const ms=Object.keys(bag).map(k=>bag[k]).sort((a,b)=>(Number(a.ts)||0)-(Number(b.ts)||0));onDocs(ms.length>40?ms.slice(-40):ms)};
 const leg=()=>{if(!on||legTried||live.length>=40)return;legTried=true;
  once(apiCol("chat").limit(60)).then(s=>{if(!on)return;legacy=[];(s.docs||[]).forEach(d=>{const id=d.id,m=d.data();if(id&&id.indexOf("_")<0&&ok(m))legacy.push([id,m])});emit()}).catch(()=>{})};
 const un=apiCol("chat").prefix("g_").limit(40).onSnapshot(s=>{live=(s.docs||[]).map(d=>[d.id,d.data()]);emit();leg()},e=>{if(on&&onErr)onErr(e)},POLL_FAST);
 return()=>{on=false;if(typeof un==="function")un()}}
function apiWatchVillage(v,onDocs,onErr){return apiCol("chat").prefix("c_"+v+"_").limit(40).onSnapshot(s=>onDocs((s.docs||[]).map(d=>d.data()).filter(m=>m&&m.vc===v&&!m.bt)),onErr,POLL_FAST)}


/* 운영자 열람. 최근 500개를 한 번만 읽는다. 탭을 연 채로 반복해서 받지 않는다. */
function apiAdmOnce(){return once(apiCol("dm").limit(500))}
function apiPostMessage(col,id,data){return apiPut(col+"/"+id,data)}
function apiDmBell(to,preview){const n=nmOf(),ts={".sv":"timestamp"};apiPut("rooms/xd"+to+"/"+UID,{n,ts}).catch(()=>{});apiPut("rooms/xd"+to+"/ts",ts).catch(()=>{});apiPut("dmn/"+to+"/"+UID,{n,x:String(preview||"").slice(0,40),ts}).catch(()=>{})}
/* 채팅방 나가기. 상대 우편함에 퇴장만 남긴다. 대화 본문은 지우지 않아서, 남은 사람은 저장할 수 있고 새 메시지를 보내면 다시 이어진다. */
function apiDmLeave(to){return apiPut("dmn/"+to+"/"+UID,{n:nmOf(),ts:{".sv":"timestamp"},left:1})}
function apiDmDrop(id){return DB.doc("rooms/xd"+UID+"/"+id).delete()}

/* 1:1 본문. 그 대화 키의 최근 n개만 읽는다(기본 30). 목록을 보는 동안에는 부르지 않는다.
   예전 말을 더 볼 때는 n 을 키워 다시 받는다(limitToLast).
   PDF 저장만 전체(apiDmThreadAll)를 받는다. 화면 목록은 건드리지 않는다. */
function apiDmThread(k,n){n=Math.max(1,Math.min(500,Number(n)||30));return once(apiCol("dm").where("k","==",k).limit(n))}
function apiDmThreadAll(k){return once(apiCol("dm").where("k","==",k))}
function apiDmBox(){return apiGet("rooms/xd"+UID)}
function apiDmnList(){return once(apiCol("dmn/"+UID))}

/* 1:1 목록. 상대 이름과 받은 시각만 있는 우편함이다. 메시지 본문은 들어 있지 않다.
   skipDmn: dmn/{나} 실시간 연결이 이미 있으면 같은 칸을 다시 GET 하지 않는다. rooms 우편함만 받는다. */
async function apiDmIndex(skipDmn){const rows={},take=(id,v)=>{if(!id||id==="ts"||!v||typeof v!=="object")return;const ts=Number(v.ts)||0;if(!ts)return;const cur=rows[id],n=String(v.n||"").replace(/👑/g,"").slice(0,20);if(!cur||ts>=cur.ts)rows[id]={n:n||(cur&&cur.n)||"",ts}};
 let ok=!!skipDmn;if(!skipDmn){try{const s=await apiDmnList();(s.docs||[]).forEach(d=>take(d.id,d.data()));ok=true}catch(e){}}
 try{const d=(await apiDmBox()).data()||{};Object.keys(d).forEach(id=>take(id,d[id]));ok=true}catch(e){}
 if(!ok)throw new Error("dm-index");return rows}
function apiVillageLatest(v){return once(apiCol("chat").prefix("c_"+v+"_").limit(1))}
async function apiClockSync(force){if((skewOk&&!force)||!XON()||!UID)return;skewOk=true;try{const a=Date.now();await apiPut("wboss/clk/"+UID,{t:{".sv":"timestamp"}});const b=Date.now();const v=Number(((await apiGet("wboss/clk/"+UID)).data()||{}).t);if(v>0&&b-a<5000)SKEW=Math.round(v-(a+b)/2)}catch(e){skewOk=false}}
