
// 이벤트 조건 판단용: 파티의 속성, 특성, 인원, 절망도
const evCtx=r=>{const ps=Object.values(r.pl||{});return{ps,n:ps.length,at:a=>ps.some(p=>String(p.a||"").includes(a)),tr:t=>ps.some(p=>p.t===t),hiDz:ps.some(p=>(Number(p.dz)||0)>=70)}};
// 메아리 이벤트: 파티에 없는 내 친구 이름 하나
const echoName=r=>{const ids=Object.keys((C&&C.fr)||{}).filter(u=>!r.pl[u]&&C.fr[u]);return ids.length?esc(String(C.fr[ids[R(ids.length)]]).slice(0,20)):"이름 모를 마법소녀"};
const EVM={};EV.concat(SOLO_EV,...Object.values(VEV)).forEach(x=>EVM[x.id]=x);
const $=s=>document.querySelector(s),R=n=>Math.floor(Math.random()*n);
let C=null,DB=null,UID="나",LOCAL=false;
try{C=JSON.parse(localStorage.getItem("mgr"))}catch(e){}
// 로그인 중이면 서버에 저장하고, 만일을 위해 이 브라우저에도 계정별 백업을 남긴다.
const save=()=>{try{updNav()}catch(e){}if(AUTH.uid){if(C&&Date.now()-(window.__reg||0)>60000){window.__reg=Date.now();try{regPlayer()}catch(e){}}try{if(C){C._sv=Date.now();localStorage.setItem("mgr_bk_"+AUTH.uid,JSON.stringify(C))}}catch(e){}saveCloud();return}try{localStorage.setItem("mgr",JSON.stringify(C))}catch(e){}};
// 공유 기능이 없는 환경(일반 웹 호스팅)에서는 이 브라우저 안에서만 도는 임시 저장소를 쓴다.
function local(){const st={},ls={};const nt=p=>{const c=p.split("/")[0];(ls[p]||[]).forEach(f=>f());(ls[c]||[]).forEach(f=>f())};
const sn=p=>({id:p.split("/").slice(1).join("/"),exists:p in st,data:()=>st[p]&&JSON.parse(JSON.stringify(st[p]))});
const sub=(k,g)=>{(ls[k]=ls[k]||[]).push(g);setTimeout(g);return()=>{ls[k]=ls[k].filter(x=>x!==g)}};
const D=p=>({get:async()=>sn(p),set:async d=>{st[p]=JSON.parse(JSON.stringify(d));nt(p)},delete:async()=>{delete st[p];nt(p)},onSnapshot:f=>sub(p,()=>f(sn(p)))});
const Q=(c,fl)=>({where:(a,o,v)=>Q(c,fl.concat([[a,v]])),orderBy:()=>Q(c,fl),limit:()=>Q(c,fl),doc:id=>D(c+"/"+id),onSnapshot:f=>sub(c,()=>f({docs:Object.keys(st).filter(k=>k.startsWith(c+"/")).map(sn).filter(d=>fl.every(x=>d.data()[x[0]]===x[1]))}))});
return{doc:D,collection:c=>Q(c,[])}}
// 모든 플레이어 목록은 무겁다(프로필 사진 포함). 여러 기능이 따로 받지 않도록 한 번 받은 것을 PL_TTL 동안 함께 쓴다.
let PLC=null,PLT=0,PLP=null;
/* 서버비 절약: 전체 플레이어 목록(사진·설정 글 포함)은 가장 무거운 읽기다. 기본 5분(PL_TTL) 동안 다시 받지 않고 함께 쓴다. */
const PL_TTL=300000;
function plAll(maxAge){if(PLC&&Date.now()-PLT<(maxAge==null?PL_TTL:maxAge))return Promise.resolve(PLC);if(PLP)return PLP;
 PLP=once(DB.collection("players")).then(sn=>{PLC=sn;PLT=Date.now();PLP=null;return sn},e=>{PLP=null;throw e});return PLP}
const IDX_BAD={};let lastSaveErr=null;
function fbdb(base){base=base.replace(/\/+$/,"");
const U=(p,q)=>base+"/"+p+".json?"+(AUTH.tok?"auth="+encodeURIComponent(AUTH.tok)+(q?"&":""):"")+(q||"");
const sn=(id,v)=>({id,exists:v!=null,data:()=>v==null?undefined:JSON.parse(JSON.stringify(v))});
/* 서버 요청에 시간 제한(20초)을 둔다. 휴대폰 네트워크에서 요청이 응답 없이 멈추면, 그 요청을 기다리던 출정 진행이 새로고침 전까지 영영 멈췄다. */
const tf=(u,o)=>{if(typeof AbortController!=="function")return fetch(u,o);const ac=new AbortController(),t=setTimeout(()=>ac.abort(),20000);return fetch(u,Object.assign({},o,{signal:ac.signal})).finally(()=>clearTimeout(t))};
const fx=async(mk,o)=>{let r=await tf(mk(),o);if(r.status===401&&AUTH.rt&&AUTH.key){try{await refresh();r=await tf(mk(),o)}catch(e){}}return r};
const J=async mk=>{const r=await fx(mk);if(!r.ok)throw new Error(r.status);return r.json()};
/* 데이터 사용량 절약: 실시간 감시는 POLL_MS(4초)마다 서버에 묻는다(채팅·대련처럼 빨라야 하는 곳만 더 짧게).
   브라우저 탭이 화면에 보이지 않는 동안에는 묻지 않고 기다렸다가, 다시 보이면 이어서 묻는다. */
const poll=(get,emit,err,ms)=>{let on=true,last="",t=null,first=true;const run=async()=>{if(!on)return;if(!first&&document.hidden){t=setTimeout(run,1000);return}first=false;try{const j=await get(),k=JSON.stringify(j);if(k!==last){last=k;emit(j)}}catch(e){err&&err({code:"unavailable",message:String(e)})}if(on)t=setTimeout(run,ms||POLL_MS)};run();return()=>{on=false;clearTimeout(t)}};
/* 실시간 채팅: 채팅·1:1·대련 화면은 서버와 연결을 열어 두고(EventSource), 바뀐 부분만 바로 받는다.
   몇 초마다 전체 목록을 다시 받는 것보다 빠르고 데이터도 훨씬 덜 쓴다. 탭이 안 보이면 연결을 닫고, 다시 보이면 연다.
   연결이 안 되는 환경(동시 접속 한도 초과 등)이면 예전처럼 몇 초마다 묻는 방식으로 자동으로 돌아간다. */
const live=(mk,emit,err,fallback)=>{if(typeof EventSource!=="function")return fallback();
 let on=true,es=null,tree=null,fails=0,ok=false,stopPoll=null,last="",retryT=null;
 const put=(path,data,merge)=>{const ks=String(path||"/").split("/").filter(Boolean);
  if(!ks.length){if(merge){tree=tree&&typeof tree==="object"?tree:{};Object.keys(data||{}).forEach(k=>{if(data[k]==null)delete tree[k];else tree[k]=data[k]})}else tree=data;return}
  tree=tree&&typeof tree==="object"?tree:{};let o=tree;ks.slice(0,-1).forEach(k=>{if(!o[k]||typeof o[k]!=="object")o[k]={};o=o[k]});const lk=ks[ks.length-1];
  if(merge){o[lk]=o[lk]&&typeof o[lk]==="object"?o[lk]:{};Object.keys(data||{}).forEach(k=>{if(data[k]==null)delete o[lk][k];else o[lk][k]=data[k]})}else if(data==null)delete o[lk];else o[lk]=data};
 const out=()=>{const k=JSON.stringify(tree);if(k!==last){last=k;emit(tree==null?null:JSON.parse(k))}};
 const toPoll=()=>{close();if(on&&!stopPoll)stopPoll=fallback()};
 const close=()=>{if(es){try{es.close()}catch(e){}es=null}};
 const open=()=>{if(!on||es||stopPoll||document.hidden)return;let u;try{u=mk()}catch(e){return toPoll()}es=new EventSource(u);
  const h=(ev,mg)=>{try{const j=JSON.parse(ev.data);if(!j)return;put(j.path,j.data,mg);ok=true;fails=0;out()}catch(e){}};
  es.addEventListener("put",ev=>h(ev,false));es.addEventListener("patch",ev=>h(ev,true));
  es.addEventListener("cancel",()=>toPoll());
  es.addEventListener("auth_revoked",async()=>{close();try{if(AUTH.rt&&AUTH.key)await refresh()}catch(e){}retryT=setTimeout(open,500)});
  es.onerror=()=>{if(!es||es.readyState!==2)return;close();fails++;if(!ok||fails>=3){toPoll();return}retryT=setTimeout(open,3000)}};
 const vis=()=>{if(!on)return;if(document.hidden){if(!stopPoll)close()}else open()};
 document.addEventListener("visibilitychange",vis);open();
 return()=>{on=false;clearTimeout(retryT);document.removeEventListener("visibilitychange",vis);close();if(stopPoll)stopPoll()}};
const D=p=>{const id=p.split("/").pop();return{id,path:p,get:async()=>sn(id,await J(()=>U(p))),
 set:async d=>{const body=JSON.stringify(d),r=await fx(()=>U(p),{method:"PUT",body});if(!r.ok){/* 서버가 알려 준 거절 이유를 기억해 두었다가 오류 안내에 보여 준다(원인 찾기용). */if(p.startsWith("accounts/")){let t="";try{t=await r.text()}catch(e){}lastSaveErr={st:r.status,msg:String(t).replace(/\s+/g," ").slice(0,160),kb:Math.round(body.length/1024)}}throw new Error(r.status)}},
 peek:async()=>J(()=>U(p,"shallow=true")),
 delete:async()=>{const r=await fx(()=>U(p),{method:"DELETE"});if(!r.ok)throw new Error(r.status)},
 onSnapshot:(f,e,ms)=>{const pl=()=>poll(()=>J(()=>U(p)),j=>f(sn(id,j)),e,ms);return ms===POLL_FAST?live(()=>U(p),j=>f(sn(id,j)),e,pl):pl()}}};
const Q=(c,o)=>({where:(a,op,v)=>Q(c,{...o,w:[a,v]}),orderBy:()=>Q(c,o),limit:n=>Q(c,{...o,l:n}),prefix:p=>Q(c,{...o,pre:p}),after:k=>Q(c,{...o,af:k}),doc:id=>D(c+"/"+id),
 onSnapshot:(f,e,ms)=>{const q=[];if(o.w)q.push('orderBy="'+o.w[0]+'"','equalTo='+JSON.stringify(o.w[1]));else{q.push('orderBy="$key"');if(o.pre)q.push("startAt="+encodeURIComponent(JSON.stringify(o.af&&o.af>o.pre?o.af:o.pre)),"endAt="+encodeURIComponent(JSON.stringify(o.pre+"\uf8ff")))}if(o.l)q.push("limitToLast="+o.l);
 /* 서버 규칙에 찾기 목록(.indexOn)이 빠져 있으면 서버가 400 오류를 낸다. 그때는 최근 기록을 받아서 브라우저에서 골라낸다(조금 느리고 데이터를 더 쓰지만 동작은 한다). */
 const get=async()=>{if(o.w&&IDX_BAD[c]){const j=await J(()=>U(c,'orderBy="$key"&limitToLast=1500')),r={};Object.keys(j||{}).forEach(k=>{if(j[k]&&j[k][o.w[0]]===o.w[1])r[k]=j[k]});return r}
  try{return await J(()=>U(c,q.join("&")))}catch(x){if(o.w&&String(x.message)==="400"){IDX_BAD[c]=1;return get()}throw x}};
 const em=j=>f({docs:Object.keys(j||{}).map(k=>sn(k,j[k]))}),pl=()=>poll(get,em,e,ms);
 return ms===POLL_FAST&&!(o.w&&IDX_BAD[c])?live(()=>U(c,q.join("&")),em,e,pl):pl()}});
return{doc:D,collection:c=>Q(c,{})}}
function myUid(){let u=null;try{u=localStorage.getItem("mgr_uid")}catch(e){}if(!u){u="u"+Math.random().toString(36).slice(2,10)+Date.now().toString(36);try{localStorage.setItem("mgr_uid",u)}catch(e){}}return u}
function mode(st){const m=$("#mode");m.textContent=["서버에 연결되지 않았다. 지금은 이 브라우저 안에서만 동작한다. ","온라인 서버에 연결되었다."+(AUTH.name?" 로그인: "+AUTH.name:""),"서버에 연결하지 못했다. 주소나 데이터베이스 규칙을 확인해야 한다. ","서버 연결을 확인하는 중이다.","로그인이 필요하다."][st];
 if(st===0||st===2||st===4){const b=document.createElement("button");b.type="button";b.className="btn g";b.style.cssText="width:auto;margin:6px 0 0;padding:6px 12px;font-size:.85rem";b.textContent="서버 주소 설정";
  b.onclick=()=>{const u=prompt("Firebase Realtime Database 주소를 입력한다.\n예: https://프로젝트이름-default-rtdb.firebaseio.com");if(u&&/^https:\/\//.test(u.trim())){try{localStorage.setItem("mgr_fb",u.trim())}catch(e){}location.reload()}};m.appendChild(b)}}
// jc: 서버 규칙이 첫 저장 때 확인하는 비밀 코드(계정을 만들 때 입력한 값). 그 기기에 계정별로 기억한다.
const AUTH={uid:null,tok:null,rt:null,name:"",key:"",jc:""};
const EM=n=>n.toLowerCase()+"@magic-growth.local";
const errMsg=e=>{const k=Object.keys(ERR).find(x=>(e.message||"").startsWith(x));return k?ERR[k]:/API key/i.test(e.message||"")?"API 키가 올바르지 않다.":"로그인하지 못했다. ("+(e.message||e)+")"};
const keep=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const lget=k=>{try{return localStorage.getItem(k)||""}catch(e){return ""}};
async function checkFounder(){if(!C||(C.founder&&C.origin)||!AUTH.tok||!AUTH.key)return;try{
 const r=await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key="+encodeURIComponent(AUTH.key),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({idToken:AUTH.tok})});
 const j=await r.json(),at=Number(j&&j.users&&j.users[0]&&j.users[0].createdAt);if(!C||!at)return;if(at<FOUNDER_CUTOFF)C.founder=1;if(at<ORIGIN_CUTOFF)C.origin=1;if(!C.founder&&!C.origin)return;
 save();const f=checkTitles().map(t=>t[1]).filter(n=>n==="최초의 구세주"||n==="세계의 기원");if(f.length){alertBox(f.includes("세계의 기원")?"세계의 기원":"최초의 구세주",(f.includes("세계의 기원")?"세계가 막 태어나던 베타 테스트를 함께해 주어 고맙다.\n":"마법 성장기록의 첫 시절을 함께해 주어 고맙다.\n")+"특별한 칭호 "+f.map(n=>"'"+n+"'").join(", ")+"을(를) 받았다.\n기록 화면의 칭호 탭에서 장착할 수 있다.");if(!$("#v-hub").hidden)hub()}}catch(e){}}
function fullRestore(){if(!UID)return null;const x=RESTORE_FULL.find(r=>r[1]===UID);if(!x)return null;if(C&&C.cmp&&C.cmp[x[0]])return null;
 const cur=C&&C.n?C:null,b=JSON.parse(JSON.stringify(x[2]));delete b.lh;
 if(cur){
  if((Number(cur.ex)||0)>(Number(b.ex)||0)){b.ex=cur.ex;b.lv=cur.lv}
  b.titles=Array.isArray(b.titles)?b.titles:[];(cur.titles||[]).forEach(t=>{if(!b.titles.includes(t))b.titles.push(t)});
  let paid=0;COMP.forEach(c=>{if(cur.cmp&&cur.cmp[c[0]]>0&&RS_REPAY.includes(c[0]))paid+=c[1]});
  b.gd=Math.max(Number(b.gd)||0,(Number(cur.gd)||0)-paid);
  b.inv=b.inv||{};Object.entries(cur.inv||{}).forEach(([k,n])=>{if((Number(n)||0)>(Number(b.inv[k])||0))b.inv[k]=n});
  if(RS_REPAY.some(id=>cur.cmp&&cur.cmp[id]>0)){const e={};COMP.forEach(c=>{if(RS_REPAY.includes(c[0])&&cur.cmp[c[0]]>0){Object.entries((c[6]||{}).inv||{}).forEach(([k,n])=>e[k]=(e[k]||0)+n)}});Object.entries(e).forEach(([k,n])=>{if(b.inv[k]>0)b.inv[k]=Math.max(Number(x[2].inv&&x[2].inv[k])||0,b.inv[k]-n)})}
  if(Array.isArray(cur.pets)&&cur.pets.length){b.pets=cur.pets;b.pet=cur.pet}
  let ce=Number(cur.eggs)||0;COMP.forEach(c=>{if(RS_REPAY.includes(c[0])&&cur.cmp&&cur.cmp[c[0]]>0)ce-=((c[6]||{}).eggs||0)});if(ce>(Number(b.eggs)||0))b.eggs=ce;
  if(cur.pf&&!b.pf)b.pf=cur.pf}
 b.cmp=Object.assign({},b.cmp||{});const now=Date.now();
 GRANT.forEach(g=>{if(g[1]===UID&&!b.cmp[g[0]])b.cmp[g[0]]=now});
 COMP.forEach(c=>{if(!RS_REPAY.includes(c[0])&&!b.cmp[c[0]])b.cmp[c[0]]=now});
 RS_REPAY.forEach(id=>delete b.cmp[id]);
 b.cmp[x[0]]=now;C=b;return x}
function checkGrant(){if(!C||!UID)return;C.cmp=C.cmp||{};const got=GRANT.filter(x=>x[1]===UID&&!C.cmp[x[0]]);if(!got.length)return;titleState();
 got.forEach(x=>{C.cmp[x[0]]=Date.now();const ts=(x[2]||[]).filter(id=>titleById(id)&&!C.titles.includes(id));ts.forEach(id=>C.titles.push(id));C.gd=(C.gd||0)+(x[3]||0);if(x[4]){C.inv=C.inv||{};C.inv.mana=(C.inv.mana||0)+x[4]}
  const wg=[];C.wps=Array.isArray(C.wps)?C.wps:[];C.wl=C.wl||{};(x[7]||[]).forEach(([wi,lv])=>{if(!WP[wi])return;if(!C.wps.includes(wi))C.wps.push(wi);lv=Math.min(5,Math.max(0,lv|0));if((C.wl["w"+wi]||0)<lv)C.wl["w"+wi]=lv;dexAdd("wp","w"+wi);wg.push(WP[wi][0]+(lv?" +"+lv:""))});
  const o8=x[8]||{},ex8=[];
  if(o8.lv>0&&(C.lv||1)<o8.lv){C.ex=Math.max(C.ex||0,xpAt(o8.lv));C.lv=lvOf(C.ex);ex8.push("레벨 "+C.lv)}
  if(o8.g&&GL.indexOf(o8.g)>GL.indexOf(C.g)){C.g=o8.g;ex8.push(o8.g+"등급")}
  if(Array.isArray(o8.a)&&o8.a.length&&o8.a.every(z=>AT.some(t=>t[0]===z))&&o8.a.join()!==(C.a||[]).join()){C.a=o8.a.slice();ex8.push("속성 "+C.a.join("·"))}
  if(o8.rn>0){C.rn=C.rn||{};let ch=false;["pow","calm","wis","luck"].forEach(k=>{if((C.rn[k]||0)<o8.rn){C.rn[k]=Math.min(RN_MAX,o8.rn);ch=true}});if(ch)ex8.push("마력 각인 전부 "+Math.min(RN_MAX,o8.rn)+"단계")}
  if(o8.eggs>0){C.eggs=(Number(C.eggs)||0)+(o8.eggs|0);ex8.push("사역마의 알 +"+(o8.eggs|0))}
  if(o8.pet&&PETS[o8.pet]){C.pets=Array.isArray(C.pets)?C.pets:[];if(!C.pets.some(q=>q&&q.sp===o8.pet)){const q={id:"p"+Date.now().toString(36)+"g",sp:o8.pet,nm:PETS[o8.pet][1],xp:0,born:Date.now()};C.pets.push(q);if(!C.pet)C.pet=q.id;C.petSeen=C.petSeen||{};C.petSeen[o8.pet]=1;if(PETS[o8.pet][3]===3)C.stats.petLeg=1}ex8.push("사역마 "+PETS[o8.pet][2]+" "+PETS[o8.pet][1])}
  let pg=0;if(x[8]&&x[8].pwAdd>0){pg=x[8].pwAdd|0;C.b=(C.b||0)+pg}else if(x[8]&&x[8].pw){const tmp=C.wtmp&&C.wtmp.day===today()?(Number(C.wtmp.v)||1):0,cur=pw()-tmp;if(cur<x[8].pw){pg=x[8].pw-cur;C.b=(C.b||0)+pg}}
  const rw=[ex8.join(", "),pg?"전투력 +"+pg+(x[8].pw&&!x[8].pwAdd?" (→ "+x[8].pw+")":""):"",wg.length?"무기 "+wg.join(", "):"",ts.length?"칭호 "+ts.map(id=>"「"+titleById(id)[1]+"」").join(", "):"",x[3]?"골드 +"+x[3]:"",x[4]?"마력석 +"+x[4]:""].filter(Boolean).join(" · ");
  note("title",x[5]+": "+(rw||"이미 모두 가지고 있다"));setTimeout(()=>alertBox("🎁 "+x[5],x[6]+(rw?"\n\n받은 것: "+rw:"")),600)});save();regPlayer();if(!$("#v-hub").hidden)hub()}
let compBusy=false,compT=0;
async function checkComp(){if(!C||!AUTH.tok||!AUTH.key||compBusy||Date.now()-compT<60000)return;C.cmp=C.cmp||{};const todo=COMP.filter(x=>!C.cmp[x[0]]);if(!todo.length)return;compBusy=true;compT=Date.now();try{
 let at=0;try{const r=await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key="+encodeURIComponent(AUTH.key),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({idToken:AUTH.tok})});const j=await r.json();at=Number(j&&j.users&&j.users[0]&&j.users[0].createdAt)}catch(e){return}
 if(!C||!at)return;C.cmp=C.cmp||{};const got=todo.filter(x=>at<x[3]&&!C.cmp[x[0]]);
 // 기준 뒤에 가입한 계정은 받을 수 없으니, 다시 확인하지 않도록 표시만 해 둔다.
 todo.filter(x=>at>=x[3]).forEach(x=>C.cmp[x[0]]=-1);
 const cxTxt=x=>{const e=x[6]||{},a=["골드 +"+x[1]];if(x[2])a.push("마력석 +"+x[2]);Object.entries(e.inv||{}).forEach(([id,n])=>{const it=ITM.find(t=>t[0]===id);if(it&&n>0)a.push(it[1]+" +"+n)});if(e.eggs>0)a.push("사역마의 알 +"+e.eggs);return a.join(", ")};
 got.forEach(x=>{C.cmp[x[0]]=Date.now();C.gd=(C.gd||0)+x[1];C.inv=C.inv||{};if(x[2])C.inv.mana=(C.inv.mana||0)+x[2];const e=x[6]||{};Object.entries(e.inv||{}).forEach(([id,n])=>{if(ITM.some(t=>t[0]===id)&&n>0){C.inv[id]=(C.inv[id]||0)+n;try{dexAdd("it",id)}catch(_){}}});if(e.eggs>0)C.eggs=(C.eggs||0)+e.eggs;note("gift",x[4]+": "+cxTxt(x)+"을(를) 받았다.")});
 titleState();C.stats.maxGold=Math.max(C.stats.maxGold||0,C.gd||0);save();checkTitles();if(!got.length)return;
 got.forEach((x,i)=>setTimeout(()=>alertBox("🎁 "+x[4],x[5]+"\n\n받은 보상: "+cxTxt(x)),i*400));if(!$("#v-hub").hidden)hub()}finally{compBusy=false}}
async function idt(path,body){const r=await fetch("https://identitytoolkit.googleapis.com/v1/accounts:"+path+"?key="+encodeURIComponent(AUTH.key),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw new Error((j.error&&j.error.message)||"ERR");return j}
async function refresh(){const r=await fetch("https://securetoken.googleapis.com/v1/token?key="+encodeURIComponent(AUTH.key),{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=refresh_token&refresh_token="+encodeURIComponent(AUTH.rt)});const j=await r.json();if(!r.ok)throw new Error("REFRESH");AUTH.tok=j.id_token;AUTH.rt=j.refresh_token;keep("mgr_rt",AUTH.rt);return j}
const admFix=o=>{ADMIN_FIXED.forEach(u=>o[u]=true);return o};
let ADM=admFix({}),admT={},admK=null,signup=false,sct=null;
// 운영자는 서버의 admins 목록(콘솔에서만 수정 가능)에 있는 계정이다. 이름으로는 판단하지 않는다.
const cn=(u,n)=>(ADM[u]?"👑 ":"")+String(n==null?"":n).replace(/👑/g,"");
const esc=t=>t.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
function admUI(){const b=document.querySelector("#ct [data-t=a]");if(b)b.hidden=!ADM[UID];try{drawNotice()}catch(e){}try{drawDoom()}catch(e){}}
function watchAdm(){if(!ADM[UID])return;unC=DB.collection("dm").limit(500).onSnapshot(s=>{const th={};s.docs.forEach(d=>{const m=d.data();if(m&&m.k)(th[m.k]=th[m.k]||[]).push(m)});Object.values(th).forEach(a=>a.sort((x,y)=>x.ts-y.ts));admT=th;drawAdm()},e=>cmsg("대화 목록을 불러오지 못했다. 운영자 등록과 데이터베이스 규칙을 확인해야 한다."))}
function admLabel(k){const nm={};(admT[k]||[]).forEach(m=>nm[m.u]=m.n);return Object.keys(nm).map(u=>cn(u,nm[u])).join(" ↔ ")}
function drawAdm(){const l=$("#al");l.innerHTML="";const ks=Object.keys(admT).sort((a,b)=>{const x=admT[a],y=admT[b];return y[y.length-1].ts-x[x.length-1].ts});
 if(!ks.length){l.innerHTML="<p class='hint'>아직 1:1 대화가 없다.</p>"}
 ks.forEach(k=>{const b=document.createElement("button");b.type="button";b.className="chip";b.style.cssText="display:flex;justify-content:space-between;text-align:left";b.setAttribute("aria-pressed",admK===k?"true":"false");
  b.innerHTML="<span></span><strong></strong>";b.firstChild.textContent=admLabel(k);b.lastChild.textContent=admT[k].length+"개";b.onclick=()=>{admK=k;drawAdm()};l.appendChild(b)});
 $("#at2").hidden=!admK||!admT[admK];if(admK&&admT[admK]){$("#ah").textContent=admLabel(admK)+" (열람 전용)";paint($("#alg"),admT[admK].slice(),admK)}}
/* 서버 저장. 실패하면 조용히 넘어가지 않고 화면 위에 경고를 띄운다(저장이 다시 되면 사라진다). */
let saveErr="";
function saveWarn(c){const m=$("#mode");if(!m)return;let w=$("#savewarn");
 if(!c){if(w)w.remove();saveErr="";return}if(saveErr===c&&w)return;saveErr=c;if(!w){w=elT("p","fallbar");w.id="savewarn";w.style.cssText="margin:6px 0 0;text-align:left";m.after(w)}
 const tp=tokProj(),dp=(FBU.match(/^https:\/\/([^.]+?)(-default-rtdb)?\./)||[])[1]||"",bad=tp&&dp&&tp!==dp;
 if((c==="401"||c==="403")&&!bad&&!AUTH.jc){w.innerHTML="";w.append(elT("b","","⚠ 캐릭터를 서버에 처음 저장하려면 비밀 코드가 필요하다"),elT("span","","계정을 만들 때 입력한 비밀 코드를 넣으면 바로 저장된다. 그전까지는 이 브라우저에만 백업된다."));
  const f=elT("form","row");f.style.cssText="margin-top:8px;flex-wrap:nowrap";const i=elT("input");i.type="password";i.placeholder="비밀 코드";i.setAttribute("aria-label","비밀 코드");i.style.flex="1";const b=elT("button","btn","저장하기");b.type="submit";b.style.cssText="width:auto;margin:0;padding:9px 14px";f.append(i,b);
  f.onsubmit=async e=>{e.preventDefault();const v=i.value.trim().normalize("NFC");let ok=false;try{ok=await codeOk(v)}catch(x){}if(!ok){i.value="";i.placeholder="코드가 맞지 않다";return}AUTH.jc=v;keep("mgr_jc_"+AUTH.uid,v);saveErr="";saveCloud(true)};w.appendChild(f);return}
 w.textContent="⚠ 캐릭터가 서버에 저장되지 않고 있다 (오류 "+c+(lastSaveErr&&lastSaveErr.msg?" · 서버 응답: "+lastSaveErr.msg+" · "+lastSaveErr.kb+"KB":"")+"). "+(bad?"로그인 키는 '"+tp+"' 프로젝트 것인데 데이터베이스는 '"+dp+"' 프로젝트다. 웹 API 키와 데이터베이스 주소가 같은 프로젝트 것인지 확인해야 한다.":c==="401"||c==="403"?"다시 로그인하면 대부분 해결된다. 계속되면 운영자에게 이 화면을 보여 주자. 이 브라우저에는 백업이 남아 있다."+saveDiag:"인터넷 연결을 확인하자. 연결되면 자동으로 다시 저장한다.");
 if(c==="401"||c==="403"){const row=elT("div","row");row.style.marginTop="8px";const rb=elT("button","chip","다시 저장해 보기");rb.type="button";rb.onclick=()=>{saveErr="";saveCloud(true)};const lb=elT("button","chip","다시 로그인");lb.type="button";lb.onclick=()=>{const o=$("#b-out");if(o)o.click();else location.reload()};row.append(rb,lb);w.appendChild(row)}}
// 로그인 토큰이 어느 Firebase 프로젝트 것인지 읽는다(점검용).
function tokProj(){try{const p=JSON.parse(atob(String(AUTH.tok||"").split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));return p.aud||""}catch(e){return ""}}
/* 저장이 401/403(권한 없음)으로 막히면 바로 포기하지 않고 차례로 다시 시도한다.
   ① 로그인 토큰이 만료됐을 수 있으니 새 토큰을 받아 다시 저장 ② 비밀 코드(jc)를 빼고 저장(이미 있는 계정) ③ 비밀 코드를 넣고 저장(처음 만드는 계정).
   그래도 안 되면 작은 값 하나만 저장해 보고, 결과를 경고에 함께 적어 원인(토큰·규칙·내용)을 짐작할 수 있게 한다. */
/* 여러 창·기기 동시 접속 보호: 저장할 때 이 창의 표시(sid)를 함께 남긴다.
   다른 창이 그 뒤에 저장했는데 이 창이 한동안 쓰이지 않았다면(오래된 기록), 덮어쓰지 않고 서버의 최신 기록을 불러온다.
   예전에는 켜 둔 채 잊어버린 창이 오래된 절망도로 새 기록을 덮어써서, 공명·선물로 내린 절망도가 되돌아가는 일이 있었다. */
const MY_SID=Math.random().toString(36).slice(2,10)+Date.now().toString(36);let saveDiag="",saveFix=false;let accSeen=null,lastPut=0,lastAct=Date.now();
["pointerdown","keydown","touchstart"].forEach(t=>addEventListener(t,()=>{lastAct=Date.now()},{passive:true,capture:true}));
const actNow=()=>!document.hidden&&Date.now()-lastAct<120000;
const savePayload=jc=>{const p={c:C,ts:Date.now(),sid:MY_SID};if(jc)p.jc=AUTH.jc;lastPut=p.ts;return p};
/* 기록을 합칠 때 잃어버리면 안 되는 것(사역마, 품고 있는 알, 칭호, 사역마 도감)은 양쪽을 합친다.
   예전에는 다른 창·기기의 기록이나 이 기기의 백업으로 바뀔 때, 그쪽에 없는 사역마가 통째로 사라졌다. 스스로 보낸 사역마(petGone)는 되살리지 않는다. */
function keepMerge(dst,src){if(!dst||!src||dst===src)return dst;try{
 const gone=Object.assign({},src.petGone||{},dst.petGone||{});dst.petGone=gone;
 const L=(Array.isArray(dst.pets)?dst.pets:[]).filter(q=>q&&!gone[q.id]);(Array.isArray(src.pets)?src.pets:[]).forEach(q=>{if(!q||gone[q.id])return;const i=L.findIndex(x=>x.id===q.id);if(i<0)L.push(q);else if((Number(q.xp)||0)>(Number(L[i].xp)||0))L[i]=Object.assign({},L[i],{xp:q.xp})});dst.pets=L;
 if(!dst.pet||!L.some(q=>q.id===dst.pet))dst.pet=(L.find(q=>q.id===src.pet)||L[0]||{}).id||null;
 if(!dst.egg&&src.egg&&!L.some(q=>(Number(q.born)||0)>=(Number(src.egg.t0)||0)))dst.egg=src.egg;
 dst.titles=Array.isArray(dst.titles)?dst.titles:[];(src.titles||[]).forEach(t=>{if(!dst.titles.includes(t))dst.titles.push(t)});
 dst.petSeen=Object.assign({},src.petSeen||{},dst.petSeen||{})}catch(e){}return dst}
// 최신 기록은 조용히 불러온다(알림 없음). 다른 창을 오가며 플레이할 때마다 알림이 뜨면 거슬리기 때문이다.
async function syncAdopt(why){try{const d=(await DB.doc("accounts/"+AUTH.uid).get()).data();if(!d||!d.c||!d.c.n||!C)return false;C=keepMerge(d.c,C);accSeen=Number(d.ts)||null;
 try{localStorage.setItem("mgr_bk_"+UID,JSON.stringify(Object.assign({},C,{_sv:Date.now()})))}catch(e){}
 try{const v=curView;if(v==="hub")hub();else if(v==="bag")bag();else if(v==="shop")shop();else if(v==="friends")friends();else if(v==="titles")titles();updNav()}catch(e){}
 if(why)toast(why);return true}catch(e){return false}}
// 다른 창이 저장한 기록이 있는지 작게(몇 바이트) 확인한다. force면 이 창을 쓰고 있어도 불러온다(탭으로 막 돌아왔을 때).
async function syncPeek(force){if(LOCAL||!AUTH.uid||!C||!DB||!DB.doc("x").peek)return "same";try{const pk=await DB.doc("accounts/"+AUTH.uid).peek();if(!pk||!pk.sid||pk.sid===MY_SID||Number(pk.ts)===accSeen)return "same";
 if(force||!actNow()){await syncAdopt();return "adopted"}return "other"}catch(e){return "same"}}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)syncPeek(true)});
async function saveRescue(){if(saveFix)return false;saveFix=true;try{
 let tok=true;try{if(AUTH.rt&&AUTH.key)await refresh()}catch(e){tok=false}
 const order=AUTH.jc?(AUTH.nojc?[false,true]:[true,false]):[false];
 for(const jc of order){try{await DB.doc("accounts/"+AUTH.uid).set(savePayload(jc));accSeen=lastPut;if(AUTH.jc&&!jc)AUTH.nojc=1;if(jc)AUTH.nojc=0;saveDiag="";return true}catch(e){}}
 /* 코드를 넣어도, 빼도 저장이 안 되면 기억된 코드가 틀린 것일 수 있다. 코드를 비워 화면에 코드 입력칸이 나오게 한다. */
 let accEx=true;try{accEx=!!(await DB.doc("accounts/"+AUTH.uid).peek())}catch(e){}
 if(AUTH.jc&&!accEx){AUTH.jc="";AUTH.nojc=0;try{localStorage.removeItem("mgr_jc_"+AUTH.uid)}catch(e){}}
 let small=false;try{await DB.doc("accounts/"+AUTH.uid+"/ts").set(Date.now());small=true}catch(e){}
 const kb=Math.round(JSON.stringify(savePayload(false)).length/1024);
 saveDiag=" [진단: 토큰 "+(tok?"정상":"갱신 실패")+" · 작은 저장 "+(small?"성공 → 저장 내용("+kb+"KB)이 규칙에 걸림":"실패 → 계정 쓰기 권한 자체가 막힘")+"]";return false}finally{saveFix=false}}
function saveCloud(now){clearTimeout(sct);const go=async()=>{const sp=await syncPeek();if(sp==="adopted")return;if(sp==="other"){try{const d=(await DB.doc("accounts/"+AUTH.uid).get()).data();if(d&&d.c&&d.c.n&&C)keepMerge(C,d.c)}catch(e){}}return DB.doc("accounts/"+AUTH.uid).set(savePayload(AUTH.jc&&!AUTH.nojc)).then(()=>{accSeen=lastPut;saveWarn("")}).catch(async e=>{const c=String(e&&e.message||e);
  if((c==="401"||c==="403")&&await saveRescue()){saveWarn("");return}saveWarn(c);clearTimeout(sct);sct=setTimeout(go,15000)})};if(now)go();else sct=setTimeout(go,600)}
const healTxt=()=>{if(!C)return "";if(C.fall)return "타락 중에는 절망도가 자연히 회복되지 않는다.";if(C.healOff)return "자연 회복을 꺼 두었다. 절망도가 저절로 내려가지 않는다.";if(!(C.dz>0))return "";const left=HEAL_MS-(Date.now()-(C.dzT||Date.now()))%HEAL_MS;return "다음 자연 회복(-"+healAmt()+")까지 "+Math.max(1,Math.ceil(left/60000))+"분"};
// 자연 회복 켜고 끄기: 꺼 둔 동안에는 절망도가 저절로 내려가지 않는다. 다시 켜면 그때부터 10분을 새로 센다(꺼 둔 시간은 소급되지 않는다).
function healToggle(){if(!C)return;C.healOff=!C.healOff;C.dzT=Date.now();save();regPlayer();toast(C.healOff?"절망도 자연 회복을 껐다.":"절망도 자연 회복을 켰다. 10분마다 다시 내려간다.");if(!$("#v-hub").hidden)hub()}
function natHeal(){if(!C)return;const now=Date.now();if(!C.dzT||C.fall||C.healOff){C.dzT=now;return}
 const n=Math.floor((now-C.dzT)/HEAL_MS);if(n>0){C.dzT+=n*HEAL_MS;const b0=C.dz||0;if(b0>0){C.dz=Math.max(0,b0-healAmt()*n);titleState();if(C.dz===0)C.stats.reachedZero=true;save();checkTitles();regPlayer();
  if(!$("#v-hub").hidden){$("#hc .hc-dz .bar i").style.width=C.dz+"%";$("#hc .hc-dz b").textContent=C.dz;const fb=$("#fbar");if(fb&&C.dz<90)fb.innerHTML=""}
  if(n>1)note("quest","쉬는 동안 마음이 가라앉았다. 절망도가 "+(b0-C.dz)+" 내려갔다.")}else save()}
 const h=$("#hcnext");if(h)h.textContent=healTxt()}
setInterval(natHeal,15000);
function boot(){natHeal();if(C){titleState();const day=new Date().toISOString().slice(0,10);if(C.stats.lastDay!==day){C.stats.loginDays=(C.stats.loginDays||1)+1;C.stats.lastDay=day;save()}checkTitles()}let rf=0;if(C&&C.inv){const n=Number(C.inv[0]||0);if(n>0){rf=n;C.gd=(C.gd||0)+30*n;C.inv={};save()}}
 C?hub():(show("create"),rc());if(rf){const h=$("#hm");h.style.color="var(--mu)";h.textContent="상점에서 회복약이 사라져서 가지고 있던 "+rf+"개를 "+30*rf+"골드로 돌려받았다."}}
/* 새 버전 알림: 10분마다 게임 파일의 '바뀐 시각' 표시만(내용 없이) 확인해서, 운영자가 새 파일을 올렸으면 새로고침하라고 알려 준다.
   예전 파일을 켜 둔 채로 있으면 고친 오류가 그 사람에게는 그대로 남기 때문이다. */
let verTag=null,verShown=false;
async function verCheck(){if(verShown||location.protocol==="file:")return;try{const r=await fetch(location.pathname+location.search,{method:"HEAD",cache:"no-store"});const t=r.headers.get("etag")||r.headers.get("last-modified");if(!t)return;if(verTag==null){verTag=t;return}if(t!==verTag){verShown=true;verBanner()}}catch(e){}}
function verBanner(){const b=document.createElement("div");b.className="ver-bar";b.setAttribute("role","status");const t=document.createElement("span");t.textContent="게임이 새 버전으로 업데이트되었다. 새로고침해야 고친 내용이 적용된다.";const go=document.createElement("button");go.type="button";go.className="chip";go.textContent="새로고침";go.onclick=()=>{try{if(C)save()}catch(e){}setTimeout(()=>location.reload(),300)};b.append(t,go);document.body.appendChild(b)}
verCheck();setInterval(verCheck,600000);
setInterval(()=>{if(AUTH.uid&&C&&!document.hidden){syncPeek();guardPush();devClaim();applyRes();syncFr();applyGift();checkRaid();if(!$("#v-hub").hidden)drawRaids()}},30000);
function showLogin(){show("login");mode(4);$("#lk").hidden=!!AUTH.key;$("#lm").textContent=""}
/* 긴급 복구: 서버에서 캐릭터가 사라졌을 때 쓰는 화면과, players에 남은 정보로 캐릭터를 다시 만드는 기능. */
function rescueAsk(p){return new Promise(res=>{const o=elT("div","imgo");o.style.cursor="default";const c=elT("div","card");c.style.cssText="max-width:440px;width:100%;text-align:left";
 c.append(elT("h2","","⚠ 서버에서 '"+String(p.n).slice(0,20)+"' 캐릭터 기록을 찾지 못했다"),elT("p","hint","서버 점검 중 문제로 캐릭터 기록이 사라졌을 수 있다. 이 기기에는 백업이 없다."),
  elT("p","","① 평소에 쓰던 기기·브라우저로 접속하면 캐릭터가 그대로 복구된다. (가장 좋다)"),elT("p","","② 지금 여기서 기본 정보(이름·등급·레벨·속성·특성·마을·프로필·무기·전투력)만 복구할 수도 있다. 골드·아이템·친구 목록·일부 칭호는 돌아오지 않는다."));
 const b1=elT("button","btn","① 로그아웃하고 평소 쓰던 기기에서 접속하기");b1.type="button";b1.onclick=()=>{o.remove();res("out")};
 const b2=elT("button","btn g","② 여기서 기본 정보로 복구하기");b2.type="button";b2.onclick=()=>{if(!confirm("기본 정보로 복구하면, 평소 기기의 백업으로는 자동 복구되지 않을 수 있다. 정말 여기서 복구할까?"))return;o.remove();res("base")};
 c.append(b1,b2);o.appendChild(c);document.body.appendChild(o)})}
function rescueBuild(p){const a=String(p.a||"").split(" · ").filter(x=>AT.some(t=>t[0]===x)),lv=Math.max(1,Number(p.lv)||1),ex=Math.max(xpAt(lv),Number(p.ex)||0);
 const c={n:String(p.n).slice(0,20),s:p.s||"소녀",g:GL.includes(p.g)?p.g:"E",t:TR.includes(p.t)?p.t:TR[0],a:a.length?a:["불"],v:VL[p.v]?p.v:"A",lv:lvOf(ex),ex,xv:2,cl:Number(p.cl)||0,dz:Math.min(60,Number(p.dz)||0),b:0,gd:0,inv:{},wps:[],wp:-1,wl:{},titles:[],ti:"",stats:{huntsWon:Number(p.cl)||0},
  pf:p.pf&&typeof p.pf==="object"?p.pf:{},fc:p.fc&&typeof p.fc==="object"?p.fc:{},wf:Number(p.wf)||0,rescued:Date.now(),
  // 예전 보상·개인 지급은 이미 받은 것으로 친다(기본 정보 복구로 두 번 받지 않게). 이번 복구 보상만 새로 받는다.
  cmp:Object.fromEntries(COMP.map(x=>x[0]).concat(GRANT.map(x=>x[0])).filter(id=>id!=="restore-apology-20261016"&&id!=="maint-20261018").map(id=>[id,1]))};
 const m=String(p.wp||"").match(/^(.+?)(?: \+(\d))?$/),wi=m?WP.findIndex(w=>w[0]===m[1]):-1;if(wi>=0){c.wps=[wi];c.wp=wi;c.wl["w"+wi]=Math.min(5,Number(m[2])||0)}
 const C0=C;C=c;try{const need=(Number(p.pw)||0)-pw();if(need>0)c.b=need}catch(e){}C=C0;return c}
async function enterGame(){UID=AUTH.uid;AUTH.jc=AUTH.jc||lget("mgr_jc_"+UID);
 /* 이 브라우저에 기억된 비밀 코드가 지금 코드와 다르면(예전 코드) 버린다. 틀린 코드를 계속 보내면 첫 저장이 영원히 막힌다. */
 if(AUTH.jc){let ok=false;try{ok=await codeOk(AUTH.jc)}catch(e){ok=true}if(!ok){AUTH.jc="";try{localStorage.removeItem("mgr_jc_"+UID)}catch(e){}}}DB=fbdb(FBU);LOCAL=false;let d=null;
 try{const s=await DB.doc("accounts/"+UID).get();d=s.exists?s.data():null;accSeen=d?Number(d.ts)||null:null}catch(e){const c=String(e.message||e);throw new Error("서버에서 계정 정보를 읽지 못했다. "+(c==="401"||c==="403"?"데이터베이스 규칙에서 읽기가 막혀 있다. 규칙을 게시했는지 확인해야 한다.":c==="404"?"데이터베이스를 찾지 못했다. 데이터베이스를 만들었는지, 주소가 맞는지 확인해야 한다.":"서버에 접속하지 못했다. 주소와 인터넷 연결을 확인해야 한다.")+" (오류: "+c+", 주소: "+FBU+")")}
 C=null;if(d&&d.c){C=d.c;
  // 이 기기의 백업이 서버 기록보다 새로우면(서버 저장이 막혀 있던 동안의 진행) 백업을 불러와 서버에 다시 올린다.
  try{const bk=JSON.parse(localStorage.getItem("mgr_bk_"+UID));if(bk&&bk.n&&Number(bk._sv)>(Number(d.ts)||0)+5000){C=keepMerge(bk,d.c);saveCloud(true);setTimeout(()=>toast("💾 이 기기에 남아 있던 더 최신 기록을 불러왔다."),1500)}else if(bk&&bk.n){const n0=(C.pets||[]).length,e0=!!C.egg;keepMerge(C,bk);if((C.pets||[]).length>n0||(!e0&&C.egg))saveCloud(true)}}catch(e){}}
 else{let bk=null;try{bk=JSON.parse(localStorage.getItem("mgr_bk_"+UID))}catch(e){}
  // 서버에 캐릭터가 없는데 이 브라우저에 이 계정의 백업이 있으면 그걸로 되살리고 서버에 다시 올린다.
  if(bk&&bk.n){C=bk;saveCloud(true)}else{let old=null;try{old=JSON.parse(localStorage.getItem("mgr"))}catch(e){}if(old&&old.n&&confirm("이 브라우저에 저장된 캐릭터 '"+old.n+"'을(를) 이 계정으로 가져올까?")){C=old;saveCloud(true)}}
  // 서버 기록도 백업도 없지만 예전에 캐릭터가 있었던 계정이면(players에 흔적이 남아 있으면) 바로 새로 만들지 않고 복구 방법을 고르게 한다.
  if(!C&&!RESTORE_FULL.some(r=>r[1]===UID)){let pp=null;try{pp=(await DB.doc("players/"+UID).get()).data()}catch(e){}if(pp&&pp.n){const r=await rescueAsk(pp);if(r==="out"){AUTH.uid=null;try{localStorage.removeItem("mgr_rt")}catch(e){}location.reload();return}if(r==="base"){C=rescueBuild(pp);saveCloud(true);setTimeout(()=>alertBox("기본 정보로 복구","이름·등급·레벨·속성·특성·마을·프로필·장착 무기·전투력을 되살렸다.\n골드·아이템·친구 목록·일부 칭호는 돌아오지 않았다.\n\n평소 쓰던 기기에 백업이 남아 있다면 운영자에게 알려 주자."),800)}}}}
 DB.collection("admins").onSnapshot(sn=>{const before=Object.keys(ADM).join();ADM=admFix({});sn.docs.forEach(d=>ADM[d.id]=true);admUI();if(before!==Object.keys(ADM).join()){loadNotice(true);if(!$("#v-hub").hidden)hub()}},e=>{},300000);
 try{await rstCheck(true)}catch(e){}
 const frx=fullRestore();
 mode(1);boot();checkFounder();setTimeout(checkComp,1500);
 if(frx){save();regPlayer();setTimeout(()=>alertBox("🎁 기록 복구","오류로 사라졌던 '"+C.n+"'의 기록을 백업으로 되돌렸습니다.\n레벨 "+C.lv+" · 칭호 "+C.titles.length+"개 · 무기와 마력 각인까지 모두 돌아왔어요.\n점검 보상과 복구 보상은 잠시 뒤 따로 도착합니다.\n불편을 드려 죄송합니다."),800)}}
async function codeOk(v){const t=String(v||"").trim().normalize("NFC");if(!t||!(window.crypto&&crypto.subtle))return false;const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")===SIGNUP_CODE_HASH}
async function doLogin(){const id=$("#lid").value.trim(),pw=$("#lpw").value,m=$("#lm");m.textContent="";
 if(!/^[A-Za-z0-9_]{3,20}$/.test(id))return m.textContent="아이디는 영문, 숫자, 밑줄 3~20자로 적어야 한다.";
 if(pw.length<6)return m.textContent="비밀번호는 6자 이상이어야 한다.";
 const k=AUTH.key||$("#lkey").value.trim();if(!k)return m.textContent="Firebase 웹 API 키를 입력해야 한다.";AUTH.key=k;
 let jc="";// 비밀 코드 없이 누구나 계정을 만들 수 있다(예전 비밀 코드 확인은 뺐다).
 $("#lgo").disabled=true;
 try{const j=await idt(signup?"signUp":"signInWithPassword",{email:EM(id),password:pw,returnSecureToken:true});
  AUTH.uid=j.localId;AUTH.tok=j.idToken;AUTH.rt=j.refreshToken;AUTH.name=id;if(jc){AUTH.jc=jc;keep("mgr_jc_"+j.localId,jc)}keep("mgr_key",k);keep("mgr_rt",AUTH.rt);keep("mgr_id",id);$("#lpw").value="";
  await enterGame()}catch(e){AUTH.uid=null;AUTH.tok=null;m.textContent=errMsg(e)}
 $("#lgo").disabled=false}
async function startAuth(){AUTH.key=lget("mgr_key")||FB_KEY;const rt=lget("mgr_rt");
 if(AUTH.key&&rt){AUTH.rt=rt;try{const j=await refresh();AUTH.uid=j.user_id;AUTH.name=lget("mgr_id");await enterGame();return}catch(e){AUTH.uid=null;AUTH.tok=null;showLogin();$("#lm").textContent=errMsg(e);return}}
 showLogin()}
$("#lgo").onclick=doLogin;$("#lpw").onkeydown=e=>{if(e.key==="Enter"&&!e.isComposing)doLogin()};
$("#lsw").onclick=()=>{signup=!signup;$("#lcd").hidden=true;$("#lcode").value="";$("#lt").textContent=signup?"계정 만들기":"로그인";$("#lgo").textContent=signup?"계정 만들기":"로그인";$("#lsw").textContent=signup?"이미 계정이 있다":"계정이 없다면 계정 만들기";$("#lm").textContent=""};
$("#lloc").onclick=()=>{DB=local();LOCAL=true;UID="나";FBU="";mode(0);boot()};
$("#b-out").onclick=()=>{keep("mgr_rt","");location.reload()};
let FBU="";
(async()=>{await null;try{DB=await claude.use("db");const u=await claude.use("user");UID=String(await u.id())}catch(e){DB=null}
 if(DB){mode(1);boot();return}
 // 서버를 옮겼을 때: 이 브라우저에 남은 예전 서버의 주소, 키, 로그인 정보, 캐릭터를 지우고 새 서버로 새로 시작한다.
 if(lget("mgr_proj")!==FB_URL){["mgr_fb","mgr_key","mgr_rt","mgr"].forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});C=null;keep("mgr_proj",FB_URL)}
 let url=lget("mgr_fb")||FB_URL;
 if(url){FBU=url;await startAuth();return}
 DB=local();LOCAL=true;UID="나";mode(0);boot()})();
// 특성에 따른 전투력 보너스
const tpw=()=>{const t=C.t,lv=C.lv||1,dz=C.dz||0;return t==="천재"?4:t==="대기만성"?(lv<8?-2:Math.max(Math.min(8,Math.floor(lv/2)),Math.floor(lv/4))):t==="폭주"?(dz>=60?6:0):t==="불안정한 마력"?6:t==="상처 입은 마음"?5:0};
const gi=()=>GL.indexOf(C.g),pw=()=>tpw()+10+gi()*8+C.lv*3+(C.b||0)+(C.wp>=0?WP[C.wp][3]+wup(C.wp)+(C.wtmp&&C.wtmp.day===today()?(Number(C.wtmp.v)||1):0):0)+(C.a.includes("불")?6:0)+(C.a.includes("어둠")&&C.dz>=50?6:0)+4*rnLv("pow")+(wfLv()>=5?WF_PW:0)+petEff("pw");
// 재계약 시험은 도전한 순간부터 24시간이 지나야 다시 볼 수 있다(성공, 실패 상관없이).
const trLeft=()=>Math.max(0,TRIAL_CD-(Date.now()-(C.trT||0)));
const trLeftTxt=()=>{const h=Math.ceil(trLeft()/3600000);return h>=24?Math.floor(h/24)+"일"+(h%24?" "+h%24+"시간":""):h+"시간"};
// 재계약 시험 도전 조건: 등급이 오를수록 필요한 레벨과 토벌 횟수가 늘어난다. 숫자만 고치면 바뀐다.
const need=()=>{const k=C.t==="계약의 가호"?1:0;return{lv:Math.max(1,6+4*gi()-k),cl:Math.max(1,3+2*gi()-k)}};
let curView="";
/* 같은 화면을 다시 그리는 동안 내용이 잠깐 비면(목록을 지우고 다시 채울 때) 휴대폰 브라우저가 화면을 위로 끌어올린다.
   잠깐 동안 화면 높이를 지금 높이로 붙잡아 두고, 위치가 바뀌었으면 원래대로 돌려놓는다. */
let keepT=null;function keepY(){const m=document.querySelector("main"),y=window.scrollY;if(!m||y<1)return;m.style.minHeight=m.offsetHeight+"px";clearTimeout(keepT);
 requestAnimationFrame(()=>{if(Math.abs(window.scrollY-y)>2)window.scrollTo(0,y)});keepT=setTimeout(()=>{m.style.minHeight=""},700)}
/* 화면 전환: 다른 화면으로 넘어갈 때만 맨 위로 올린다. 같은 화면을 다시 그릴 때(버튼을 눌러 결과가 바뀔 때)는 보던 위치를 그대로 둔다. */
function show(id){const moved=curView!==id;curView=id;["login","create","hub","rooms","room","xm","portal","guard","fac","board","wave","ntc","arena","trial","shop","chat","friends","bag","titles","raid","boss","inbox","roster"].forEach(v=>$("#v-"+v).hidden=v!==id);if(id!=="raid"&&unRd){unRd();unRd=null}if(id!=="boss"&&unB){unB();unB=null}document.querySelector("main").classList.toggle("wide",id==="roster"||id==="boss"||id==="titles"||id==="fac"||id==="board"||id==="ntc");document.querySelector("main").classList.toggle("hubw",id==="hub");document.querySelector("main").classList.toggle("xwide",id==="shop");if(id!=="hub"&&unH){unH();unH=null}if(id!=="chat"){unC&&unC();unC=null;unP&&unP();unP=null}$("#nav").hidden=!(C&&(id==="hub"||id==="boss"||id==="portal"||id==="guard"||id==="fac"||id==="board"||id==="wave"||id==="ntc"||id==="arena"||id==="inbox"||id==="roster"||id==="shop"||id==="chat"||id==="friends"||id==="bag"||id==="titles"));document.querySelectorAll("#nav button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.v===id?"true":"false"));if(moved)window.scrollTo(0,0);else keepY()}
const titleById=id=>TITLE_LIST.find(t=>t[0]===id);
// 칭호 이름: 칭호 번호(id)로 찾고, 없으면 서버에 같이 저장된 이름(tn)을 쓴다.
const tiName=(id,fb)=>{const t=id&&titleById(id);return t?t[1]:typeof fb==="string"?fb.slice(0,20):""};
function titleState(){if(!C)return;C.titles=Array.isArray(C.titles)?C.titles:[];C.stats=C.stats||{};C.stats.upgrades=C.stats.upgrades||0;C.stats.purchases=C.stats.purchases||0;C.stats.gifts=C.stats.gifts||0;C.stats.resonances=C.stats.resonances||0;C.stats.trialWins=C.stats.trialWins||0;C.stats.maxDespair=Math.max(C.stats.maxDespair||0,C.dz||0);C.stats.maxGold=Math.max(C.stats.maxGold||0,C.gd||0);C.stats.loginDays=C.stats.loginDays||1;C.stats.lastDay=C.stats.lastDay||new Date().toISOString().slice(0,10);C.stats.reachedZero=!!C.stats.reachedZero;C.ti=C.ti||"";}
function checkTitles(){if(!C)return[];titleState();const fresh=[];TITLE_LIST.forEach(t=>{if(!C.titles.includes(t[0])){let ok=false;try{ok=!!t[3](C)}catch(e){}if(ok){C.titles.push(t[0]);fresh.push(t[0])}}});if(fresh.length){note("title","새 칭호를 얻었다: "+fresh.map(id=>titleById(id)[1]).join(", "));const sx=fresh.map(titleById).filter(t=>t&&t[4]==="secret");if(sx.length&&typeof alertBox==="function")setTimeout(()=>{alertBox("✧ 히든 칭호 발견","숨겨져 있던 칭호를 찾아냈다!\n\n"+sx.map(t=>"「"+t[1]+"」\n"+t[2]).join("\n\n")+"\n\n칭호 보관함에서 장착할 수 있다.");try{ding()}catch(e){}},300);save()}return fresh.map(titleById).filter(Boolean)}
function titles(msg){show("titles");setRec("ttl");titleState();const fresh=checkTitles();const cur=titleById(C.ti);const cc=$("#title-current");cc.innerHTML="";const h=document.createElement("h2");h.textContent="현재 장착한 칭호";const p=document.createElement("p");p.className="hint";p.textContent=cur?"✦ "+cur[1]+" — "+cur[2]:"아직 장착한 칭호가 없다.";cc.append(h,p);const clear=document.createElement("button");clear.type="button";clear.className="btn g";clear.textContent="칭호 해제";clear.onclick=()=>{C.ti="";save();titles("칭호를 해제했다.")};cc.appendChild(clear);clear.disabled=!C.ti;
 const earned=$("#title-earned"),locked=$("#title-locked");earned.innerHTML="";locked.innerHTML="";TITLE_LIST.forEach((t,i)=>{const got=C.titles.includes(t[0]),w=document.createElement("div");w.className="chip title-card";const copy=document.createElement("div");copy.className="title-copy";const name=document.createElement("strong"),desc=document.createElement("small");const sc=t[4]==="secret";if(sc)w.classList.add("secret-ttl");name.textContent=got?(sc?"✧ ":"✦ ")+t[1]+(sc?" (히든)":""):sc?"🔒 ??? (히든 칭호)":"🔒 "+t[1];desc.textContent=got||!sc?t[2]:"힌트: "+t[5];copy.append(name,desc);w.appendChild(copy);if(got){const b=document.createElement("button");b.type="button";b.className="chip";b.textContent=C.ti===t[0]?"장착 중":"장착";b.disabled=C.ti===t[0];b.onclick=()=>{C.ti=t[0];save();titles("'"+t[1]+"' 칭호를 장착했다.")};w.appendChild(b);earned.appendChild(w)}else if(!t[4]||t[4]==="secret")locked.appendChild(w)});const secN=TITLE_LIST.filter(t=>t[4]==="secret"),secGot=secN.filter(t=>C.titles.includes(t[0])).length;$("#title-msg").textContent=msg||(fresh.length?"새 칭호 획득: "+fresh.map(t=>t[1]).join(", "):"획득한 칭호 "+C.titles.length+" / "+TITLE_LIST.length+" · 히든 칭호 "+secGot+" / "+secN.length);regPlayer()}
function titleProgress(){if(!C)return;titleState();C.stats.maxDespair=Math.max(C.stats.maxDespair||0,C.dz||0);C.stats.maxGold=Math.max(C.stats.maxGold||0,C.gd||0);checkTitles()}

/* 레벨과 경험치: 레벨이 오를수록 다음 레벨까지 필요한 경험치가 늘어난다(수치는 data/game.js의 XP_BASE·XP_STEP).
   xpNeed(L) = L에서 L+1로 가는 데 필요한 경험치, xpAt(L) = 레벨 L이 시작되는 누적 경험치, lvOf(ex) = 누적 경험치로 본 레벨. */
function xpNeed(lv){return XP_BASE+XP_STEP*(Math.max(1,Number(lv)||1)-1)}
function xpAt(lv){const n=Math.max(1,Number(lv)||1)-1;return XP_BASE*n+XP_STEP*n*(n-1)/2}
function lvOf(ex){ex=Math.max(0,Number(ex)||0);let L=1;while(L<9999&&xpAt(L+1)<=ex)L++;return L}
// 예전 방식(40마다 1레벨)으로 쌓인 경험치를 새 방식으로 옮긴다. 레벨은 그대로 두고, 그 레벨 안에서 채운 비율도 그대로 옮긴다(한 번만).
function xpMigrate(){if(!C||C.xv>=2)return;const ex=Math.max(0,Number(C.ex)||0),L=1+Math.floor(ex/40),r=(ex-(L-1)*40)/40;C.ex=xpAt(L)+Math.floor(r*xpNeed(L));C.lv=L;C.xv=2}
function gain(ex,dz){const oldDz=C.dz||0,t=C.t;if(C.fall&&dz<0)dz=0;if(dz>0){if(t==="냉정")dz*=.8;if(t==="상처 입은 마음")dz*=1.2}if(dz<0&&t==="낙천")dz*=1.3;if(dz>0)dz*=(1-.04*rnLv("calm"))*(wfLv()>=3?1-WF_CALM:1)*(1-petEff("dz"));if(ex>0)ex*=1+.04*rnLv("wis");if(ex>0&&t==="끈기")ex*=1.2;if(ex>0&&C.fall)ex=0;if(ex>0&&scarLeft()>0)ex*=.5;if(dz>0&&C.a.includes("물"))dz=Math.max(1,Math.round(dz*.75));if(ex>0&&C.a.includes("바람"))ex=Math.round(ex*1.15);xpMigrate();C.ex+=Math.round(ex);C.lv=lvOf(C.ex);C.dz=Math.max(0,Math.min(100,C.dz+Math.round(dz)));titleState();C.stats.maxDespair=Math.max(C.stats.maxDespair||0,C.dz);if(oldDz>0&&C.dz===0)C.stats.reachedZero=true;if(C.dz>=95&&!C.fall)C.edge=1;if(C.fall)C.edge=0;if(C.edge&&C.dz===0){C.edge=0;C.stats.edgeHope=1}save();checkTitles();
 if(!C.fall){if(C.dz>=100)fallen();else if(oldDz<90&&C.dz>=90)note("warn","절망도가 "+C.dz+"에 이르렀다. 타락 직전이다."),alertBox("타락 직전","절망도가 "+C.dz+"에 이르렀다. 마음이 무너지기 직전이다.\n절망도가 100이 되면 타락해 마수가 된다. 공명이나 선물로 친구들의 도움을 받자.")}}
/* 사진 줄이기: 한 번에 확 줄이면 깨지고 뭉개지므로 절반씩 여러 번 부드럽게 줄인다. */
function sq(im,Z,q){const s0=Math.min(im.width,im.height);let c=document.createElement("canvas"),w=s0;c.width=c.height=w;let x=c.getContext("2d");x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";x.drawImage(im,(im.width-s0)/2,(im.height-s0)/2,s0,s0,0,0,w,w);
 while(w/2>=Z){const n=document.createElement("canvas"),h=Math.floor(w/2);n.width=n.height=h;const y=n.getContext("2d");y.imageSmoothingEnabled=true;y.imageSmoothingQuality="high";y.drawImage(c,0,0,w,w,0,0,h,h);c=n;w=h}
 if(w!==Z){const n=document.createElement("canvas");n.width=n.height=Z;const y=n.getContext("2d");y.imageSmoothingEnabled=true;y.imageSmoothingQuality="high";y.drawImage(c,0,0,w,w,0,0,Z,Z);c=n}return c.toDataURL("image/jpeg",q)}
const HIRES={};
function pick(f,cb){if(!f)return;const u=URL.createObjectURL(f),im=new Image();im.onload=()=>{const m=Math.min(im.width,im.height),Z=Math.min(AV_BIG,Math.max(160,m));const d=sq(im,Z,.9);
 if(m>AV_BIG)HIRES[d]=sq(im,Math.min(PIC_PX,m),.92);URL.revokeObjectURL(u);cb(d)};im.onerror=()=>URL.revokeObjectURL(u);im.src=u}
let pimg=null;
$("#im").onchange=e=>{const f=e.target.files[0];e.target.value="";pick(f,d=>{pimg=d;const p=$("#pv");p.src=d;p.hidden=false})};
/* 캐릭터 제작 */
let sg=null,sv=null,sa=null,hs=[],pk=null,busy=false;
function chips(el,list,f){list.forEach(it=>{const b=document.createElement("button");b.type="button";b.className="chip"+(it[2]?" vil":"");b.setAttribute("aria-pressed","false");
 if(it[1]&&it[1][0]==="#"){b.style.setProperty("--c",it[1]);b.innerHTML='<span class="dot"></span>'+it[0]+(it[2]?"<small>"+it[2]+"</small>":"")}else b.innerHTML=it[0]+(it[2]?"<small>"+it[2]+"</small>":"");
 b.onclick=()=>{f(it);[...el.children].forEach(x=>x.setAttribute("aria-pressed",x===b?"true":"false"))};el.appendChild(b)})}
chips($("#gd"),[["소년"],["소녀"]],i=>sg=i[0]);
chips($("#vl"),Object.keys(VL).map(k=>[VL[k].n,"",VL[k].d]),i=>sv=i[0][0]);
chips($("#at"),AT,i=>{sa=i[0];$("#v-create").style.setProperty("--glow",i[1])});
function roll(){let r=Math.random()*100,a=0;for(const[g,w]of GR){a+=w;if(r<a)return g}return"E"}
function rc(){const l=3-hs.length,o=$("#orb");$("#left").textContent=l>0?"남은 기회 "+l+"번":"기회를 모두 썼다. 하나를 골라라.";o.disabled=l<=0;
 o.innerHTML=hs.length?hs[hs.length-1].g:"<small>손을 얹는다</small>";const h=$("#hist");h.innerHTML="";
 hs.forEach((r,i)=>{const b=document.createElement("button");b.type="button";b.className="chip";b.setAttribute("aria-pressed",pk===i?"true":"false");
  b.innerHTML="<span>"+(i+1)+"번째 뽑기 <b>"+r.t+"</b><small style='display:block;color:var(--mu);font-weight:400'>"+TD[r.t]+"</small></span><strong>"+r.g+"등급</strong>";b.onclick=()=>{pk=i;rc()};h.appendChild(b)});
 $("#tdesc").textContent=pk!==null?"특성: "+hs[pk].t:""}
$("#orb").onclick=()=>{if(busy||hs.length>=3)return;busy=true;const o=$("#orb");o.classList.add("ch");
 setTimeout(()=>{o.classList.remove("ch");hs.push({g:roll(),t:TR[R(TR.length)]});if(pk===null)pk=0;busy=false;rc()},900)};
$("#ok").onclick=()=>{const n=$("#nm").value.trim(),m=$("#cm");
 if(!n)return m.textContent="이름을 입력해야 한다.";if(!sg)return m.textContent="소년 또는 소녀를 골라야 한다.";
 if(!sv)return m.textContent="시작 마을을 골라야 한다.";if(!sa)return m.textContent="속성을 골라야 한다.";
 if(pk===null)return m.textContent="수정구로 등급을 한 번 이상 뽑아야 한다.";
 C={n,s:sg,v:sv,a:[sa],g:hs[pk].g,t:hs[pk].t,born:Date.now(),xv:2,rsv:RST?RST.id:0,lv:1,ex:0,cl:0,dz:0,b:0,img:pimg,gd:100,inv:{},wps:[],wp:-1,wl:{},titles:[],ti:"",stats:{maxDespair:0,maxGold:100,loginDays:1,lastDay:new Date().toISOString().slice(0,10),reachedZero:false}};save();checkTitles();hub()};


// 프로필 사진을 누르면 크게 볼 수 있다. 바깥이나 ✕, Esc 키로 닫는다. (사진 고르기 화면의 미리보기는 제외)
function imgOpen(src,cap){const o=$("#imgo");if(!o||!src)return;$("#imgoi").src=src;$("#imgoi").alt=cap||"프로필 사진";$("#imgoc").textContent=cap||"";o.hidden=false;$("#imgox").focus({preventScroll:true})}
function imgClose(){const o=$("#imgo");if(o&&!o.hidden){o.hidden=true;$("#imgoi").removeAttribute("src");$("#imgoi").classList.remove("free")}}
// 게시글 사진처럼 정사각형이 아닌 사진은 원래 비율대로 크게 보여 준다.
function imgFull(src,cap){imgOpen(src,cap);$("#imgoi").classList.add("free")}
document.addEventListener("click",e=>{const t=e.target;if(!(t instanceof HTMLImageElement)||!t.classList.contains("av")||t.id==="pv"||t.id==="ev")return;e.stopPropagation();
 let cap="";const card=t.closest("#hc,#pfb,#rdc");if(card){const h=card.querySelector("h2");if(h)cap=h.textContent}const who=t.dataset.u||(t.closest("#hc")?UID:t.closest("#pfb")?pfU:null);if(who)picOpen(who,t.src,cap);else imgOpen(t.src,cap)},true);
$("#imgo").addEventListener("click",e=>{if(e.target.id!=="imgoi")imgClose()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")imgClose()});
const lhOf=k=>LH.find(x=>x[0]===k),lhOn=()=>!!(C&&C.lh&&lhOf(C.lh.k));
const lhChance=(pwv,req)=>Math.max(.3,Math.min(.95,pwv/req*.85+(typeof petEff==="function"?petEff("lh"):0)));
function lhStart(k){const L=lhOf(k);if(!L||lhOn())return;if(C.fall){toast("타락한 동안에는 토벌을 떠날 수 없다.");return}if(C.mj&&Date.now()<C.mj.T0){toast("정기 출정에 참가 신청한 동안에는 떠날 수 없다.");return}
 if(!confirm(L[1]+"("+L[2]+"시간)을 떠날까? 떠나 있는 동안에는 정기 출정에 참가할 수 없다. 성공 확률 약 "+Math.round(lhChance(pw(),L[3])*100)+"%"))return;
 const t0=Date.now();C.lh={k,t0,t1:t0+L[2]*3600000,pw:pw(),sd:Math.floor(Math.random()*1e9)};titleState();save();note("quest",L[1]+"을(를) 떠났다. "+L[2]+"시간 뒤에 돌아온다.");toast("🗺 "+L[1]+" 출발! "+L[2]+"시간 뒤에 돌아온다.");hubLH()}
function lhClaim(early){const h=C.lh,L=h&&lhOf(h.k);if(!L)return;const now=Date.now(),done=now>=h.t1;if(!done&&!early)return;
 if(early&&!confirm("지금 철수할까? 지난 시간만큼의 절반만 받고, 마력석은 받지 못한다."))return;
 const g=rng(hs32("lh"+h.sd)),hrs=done?L[2]:Math.max(0,(now-h.t0)/3600000),ok=done&&g()<lhChance(h.pw,L[3]),bonus=1+.1*Math.max(0,L[2]-1)/1.67,mul=done?(ok?1:.5)*bonus:LH_EARLY;
 const gd=Math.round(L[4]*hrs*mul),ex=Math.round(L[5]*hrs*mul),dz=Math.round(L[6]*hrs+(done&&!ok?LH_FAILDZ:0)),mm=done&&ok?L[7]+(g()<.3?1:0):0;
 const evs=[],n=done?2+Math.min(4,L[2]):1;for(let i=0;i<n;i++){const e=LH_EV[Math.floor(g()*LH_EV.length)];if(!evs.includes(e))evs.push(e)}
 C.lh=null;C.gd=(C.gd||0)+gd;if(mm){C.inv=C.inv||{};C.inv.mana=(C.inv.mana||0)+mm}titleState();if(done){C.stats.lhDone=(C.stats.lhDone||0)+1;if(ok&&L[0]==="abyss")C.stats.lhAbyss=1}
 C.stats.maxGold=Math.max(C.stats.maxGold||0,C.gd);gain(ex,dz);guardAdd(Math.round(hrs*3));if(done&&ok){const pe=petDrop("lh");if(pe)evs.push(pe)}
 const head=!done?"중간에 철수했다.":ok?"토벌 성공!":"토벌은 실패했지만 무사히 돌아왔다.",rw="골드 +"+gd+", 경험치 +"+ex+(mm?", 마력석 +"+mm:"")+", 절망도 +"+dz;
 note("quest",L[1]+": "+head+" ("+rw+")");save();checkTitles();
 alertBox("🗺 "+L[1]+" · "+(done?(ok?"성공":"실패"):"철수"),head+"\n\n"+evs.map(e=>"· "+e).join("\n")+"\n\n"+rw);hubLH()}
function hubLH(){const box=$("#hlh");if(!box||!C)return;box.innerHTML="";const now=Date.now(),sm=$("#lhsum");if(sm)sm.textContent=lhOn()?(now>=C.lh.t1?"· 귀환! 보상 받기":"· "+lhOf(C.lh.k)[1]+" "+cdTxt(C.lh.t1-now)+" 남음"):"";
 if(lhOn()){const h=C.lh,L=lhOf(h.k),done=now>=h.t1,w=elT("div","dq lh-on"+(done?" got":"")),cp=elT("div","dq-copy"),bar=elT("div","bar"),f=elT("i");
  f.style.width=Math.min(100,(now-h.t0)/(h.t1-h.t0)*100)+"%";bar.appendChild(f);
  cp.append(elT("b","","🗺 "+L[1]+(done?" · 귀환!":" · 토벌 중")),elT("small","",done?"토벌을 마치고 돌아왔다. 보상을 받자.":"남은 시간 "+cdTxt(h.t1-now)+" · 성공 확률 약 "+Math.round(lhChance(h.pw,L[3])*100)+"%"),bar);
  const b=elT("button","chip",done?"보상 받기":"철수");b.type="button";b.onclick=()=>lhClaim(!done);w.append(cp,b);box.appendChild(w);
  if(!done)box.appendChild(elT("p","hint","떠나 있는 동안 게임을 꺼 두어도 된다. 정기 출정에는 참가할 수 없다."));return}
 const pv=pw();LH.forEach(L=>{const w=elT("div","dq"),cp=elT("div","dq-copy"),c=lhChance(pv,L[3]);
  cp.append(elT("b","",L[1]+" · "+L[2]+"시간"),elT("small","",L[8]+" 권장 전투력 "+L[3]+" · 성공 약 "+Math.round(c*100)+"% · 골드 약 "+Math.round(L[4]*L[2]*(1+.1*(L[2]-1)/1.67))+", 경험치 약 "+Math.round(L[5]*L[2]*(1+.1*(L[2]-1)/1.67))+(L[7]?", 마력석 "+L[7]+"+":"")+" · 절망도 +"+L[6]*L[2]));
  const b=elT("button","chip","출발");b.type="button";b.disabled=!!C.fall;b.onclick=()=>lhStart(L[0]);w.append(cp,b);box.appendChild(w)})}
// 돌아올 시각이 되면 한 번 알린다.
setInterval(()=>{if(!C||!lhOn())return;const h=C.lh;if(Date.now()>=h.t1&&!h.nt){h.nt=1;save();const L=lhOf(h.k);note("quest",L[1]+"에서 돌아왔다! 마을에서 보상을 받자.");toast("🗺 "+L[1]+"에서 돌아왔다! 보상을 받자.");try{ding()}catch(e){}}if(!$("#v-hub").hidden)hubLH()},30000);
/* 마을 */
// (승급 시스템 삭제) 예전에 '응축된 경험치'로 모아 둔 경험치가 있으면 돌려주고, 승급 기록을 지운다.
function pmCleanup(){xpMigrate();if(!C||C.pl==null&&!C.pmx)return;if(C.pmx>0){C.ex=(C.ex||0)+C.pmx;C.lv=lvOf(C.ex)}["pl","plt","pmk","pmc","pmx"].forEach(k=>delete C[k]);save()}
function hub(){show("hub");pmCleanup();setTimeout(checkComp,800);setTimeout(checkGrant,900);titleProgress();const v=VL[C.v],ac=AT.find(a=>a[0]===C.a[0])[1];$("#hc").style.setProperty("--c",ac);
 const tt=titleById(C.ti),wn=C.wp>=0?WP[C.wp][0]+(wlv(C.wp)?" +"+wlv(C.wp):""):"없음",cell=(k,x)=>"<div><small>"+k+"</small><b>"+x+"</b></div>";
 $("#hc").innerHTML="<div class='hc-top'>"+(C.img?"<img class='av' alt='프로필 이미지' src='"+C.img+"'>":"<div class='av hc-noimg' aria-hidden='true'>"+esc(String(C.n).slice(0,1))+"</div>")+"<div class='hc-id'><h2>"+esc(cn(UID,C.n))+"</h2><p>"+v.n+" · "+C.s+" · "+C.a.join("·")+"</p>"+(tt?"<p class='hc-ti'>✦ "+tt[1]+"</p>":"")+"</div><span class='hc-grade'>"+C.g+"</span></div>"
  +"<div class='hc-grid'>"+cell("레벨",C.lv)+cell("토벌",C.cl+"회")+cell("전투력",pw())+cell("골드",C.gd||0)+cell("무기",wn)+cell("특성",C.t)+"</div>"+(petCur()?"<p class='hc-pet'>"+PETS[petCur().sp][2]+" "+PETS[petCur().sp][1]+" "+esc(petCur().nm)+" · 친밀도 "+petLv(petCur())+"단계</p>":"")
  +"<div class='hc-xp"+(C.fall||scarLeft()>0?" scar":"")+"'><small>경험치</small><div class='bar'><i style='width:"+Math.min(100,((C.ex||0)-xpAt(C.lv))/xpNeed(C.lv)*100)+"%'></i></div><b>"+((C.ex||0)-xpAt(C.lv))+" / "+xpNeed(C.lv)+"</b></div>"+(C.fall?"<p class='hc-next' style='color:#ff8da0'>타락 중에는 경험치를 얻을 수 없다.</p>":scarLeft()>0?"<p class='hc-next' style='color:#ff8da0'>타락의 후유증: 얻는 경험치 절반 (약 "+Math.ceil(scarLeft()/60000)+"분 남음)</p>":"")+"<div class='hc-dz'><small>절망도</small><div class='bar'><i style='width:"+C.dz+"%'></i></div><b>"+C.dz+"</b></div><div class='hc-heal'><p class='hc-next' id='hcnext'>"+healTxt()+"</p><button type='button' class='chip hc-htog' id='hctog' aria-pressed='"+(C.healOff?"false":"true")+"'>자연 회복 "+(C.healOff?"꺼짐":"켜짐")+"</button></div>"
  +((()=>{const a=ITM.filter(x=>USE[x[0]]&&armed(x[0])).map(x=>x[1]).concat(Object.keys(SKID).filter(armedSk).map(id=>SKID[id].nm));return a.length?"<p class='hc-arm'>준비: "+a.join(", ")+"</p>":""})())+"<details class='hc-more'><summary>속성 · 특성 · 캐릭터 설정 자세히</summary><dl class='kv'><dt>속성</dt><dd>"+C.a.map(a=>{const x=AT.find(t=>t[0]===a);return a+"<small style='display:block;color:var(--mu)'>"+(x?x[2]:"")+"</small>"}).join("")+"</dd><dt>특성</dt><dd>"+C.t+"<small style='display:block;color:var(--mu)'>"+(TD[C.t]||"")+"</small></dd><dt>마을</dt><dd>"+v.d+"</dd></dl></details>";
 {const ht=$("#hctog");if(ht)ht.onclick=healToggle}const pr2=pfRows(C.pf);if(pr2){pr2.style.marginTop="10px";$("#hc .hc-more").appendChild(pr2)}
 const fb=$("#fbar");fb.innerHTML="";if(C.fall||C.dz>=90){const d=document.createElement("div"),b=document.createElement("b"),p=document.createElement("span");d.className="fallbar"+(C.fall?"":" warn");
  b.textContent=C.fall?"타락":"타락 직전";p.textContent=C.fall?"절망에 삼켜져 마수가 되었다. 친구들이 맞서 쓰러뜨려 주면 원래 모습으로 돌아온다.":"절망도가 "+C.dz+"이다. 100이 되면 타락한다. 공명이나 선물로 절망도를 낮추자.";d.append(b,p);
  if(C.fall){const g=document.createElement("button");g.type="button";g.className="btn";g.textContent="나의 그림자 보기";g.onclick=()=>openRaid(UID);d.appendChild(g)}fb.appendChild(d)}
 if(C.du&&!C.du.fin&&!unDu)duWatch();
 const n=need(),ok=C.lv>=n.lv&&C.cl>=n.cl,cd=trLeft()>0,can=!C.fall&&gi()<5&&ok&&!cd;$("#b-trial").disabled=!can;
 $("#b-trial").textContent=C.fall?"재계약 시험 (타락 중에는 할 수 없다)":gi()>=5?"재계약 시험 (최고 등급)":!ok?"재계약 시험 (레벨 "+n.lv+", 토벌 "+n.cl+"회 필요)":cd?"재계약 시험 (약 "+trLeftTxt()+" 뒤에 다시 볼 수 있다)":"재계약 시험 도전";$("#hm").textContent="";watchHub();regPlayer();$("#b-out").hidden=!AUTH.uid;applyRes();syncFr();applyGift();drawDQ();drawTut();updNav();drawRaids();checkRaid();autoClaimOld();sweepRooms();hubPortal();pTick().then(hubPortal);hubGuard();hubBoss();loadNotice();hubFac();loadFac().then(()=>{hubFac();disCheck();hubDis()});beat();loadOnline();hubDis();disAlert();hubLH()}

/* 프로필과 공명: 친구의 프로필에서 '공명하기'로 공명을 청하고, 친구가 받아들이면 둘 다 절망도가 내려간다. 같은 상대에게는 3시간에 한 번이다. */
let pfU=null;
const once=q=>new Promise((ok,no)=>{let un=null,done=false;un=q.onSnapshot(s=>{if(done)return;done=true;un&&un();ok(s)},e=>{if(done)return;done=true;un&&un();no(e)})});
/* 크게 보기용 사진: 내 사진을 320픽셀로 줄여 wboss/pic/{나}에 따로 올려 둔다. 목록(players)에는 작은 사진만 있어서 데이터를 아끼고,
   누군가 사진을 눌러 크게 볼 때만 이 큰 사진 한 장을 받아 온다(사람마다 한 번만 받고 기억한다). */
const PICC={},PICM={};
function pubPic(){if(!C||!C.img||!XON()||!UID)return;const sig=String(C.img.length)+":"+C.img.slice(-32);if(C.picSig===sig)return;
 const hi=HIRES[C.img]||C.img,im=new Image();im.onload=()=>{try{const md=sq(im,Math.min(PIC_MD,im.width,im.height),.9),ts=Date.now();
  Promise.all([DB.doc("wboss/pic/"+UID).set({im:hi,ts}),DB.doc("wboss/picm/"+UID).set({im:md,ts})]).then(()=>{C.picSig=sig;PICC[UID]=hi;PICM[UID]=md;save()}).catch(()=>{})}catch(e){}};im.src=hi}
// 카드용 중간 크기 사진(200픽셀): 화면에 보이는 사진만 받아 와서 작은 사진을 바꿔 끼운다.
async function midPic(uid){if(!uid)return "";if(PICM[uid]!=null)return PICM[uid];if(uid===UID&&C&&C.img)return C.img;try{const d=(await DB.doc("wboss/picm/"+uid).get()).data();PICM[uid]=d&&typeof d.im==="string"&&d.im.startsWith("data:image")?d.im:""}catch(e){return ""}return PICM[uid]}
const PIO=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(es=>{es.forEach(e=>{if(!e.isIntersecting)return;const t=e.target;PIO.unobserve(t);midPic(t.dataset.u).then(m=>{if(m&&t.isConnected)t.src=m})})},{rootMargin:"200px"}):null;
function hiAv(img,uid){if(!img||!uid)return;img.dataset.u=uid;if(PICM[uid]){img.src=PICM[uid];return}if(PIO)PIO.observe(img);else midPic(uid).then(m=>{if(m)img.src=m})}
async function bigPic(uid){if(!uid)return "";if(uid===UID&&C&&C.img)return HIRES[C.img]||PICC[UID]||C.img;if(PICC[uid])return PICC[uid];if(PICC[uid]!=null)return PICC[uid];try{const d=(await DB.doc("wboss/pic/"+uid).get()).data();PICC[uid]=d&&typeof d.im==="string"&&d.im.startsWith("data:image")?d.im:""}catch(e){return ""}return PICC[uid]}
// 작은 사진으로 먼저 열고, 큰 사진을 받아 오면 바꿔 끼운다.
async function picOpen(uid,small,cap){imgOpen(small,cap);const big=await bigPic(uid);if(big&&!$("#imgo").hidden&&$("#imgoi").src===small)$("#imgoi").src=big}
function thumb(src,cb){if(!src)return cb("");const im=new Image();im.onload=()=>{try{const c=document.createElement("canvas");cb(sq(im,AV_SMALL,.8))}catch(e){cb("")}};im.onerror=()=>cb("");im.src=src}
function regPlayer(){if(!DB||!C)return;try{clockSync()}catch(e){}try{pubPic()}catch(e){}thumb(C.img,im=>{try{const weapon=Number.isInteger(C.wp)&&C.wp>=0&&typeof WP!=="undefined"&&WP[C.wp]?WP[C.wp][0]+(wlv(C.wp)?" +"+wlv(C.wp):""):"없음";
 DB.doc("players/"+UID).set({n:C.n,s:C.s||"",g:C.g,t:C.t||"",td:TD[C.t]||"",a:(C.a||[]).join(" · "),v:C.v,lv:C.lv||1,cl:C.cl||0,ex:C.ex||0,dz:C.dz||0,wp:weapon,pw:typeof pw==="function"?pw():0,ti:C.ti||"",tn:tiName(C.ti),ntc:ADM[UID]?(C.ntcl||[]):[],dd:ADM[UID]&&C.doom?C.doom:null,rst:ADM[UID]&&C.rst?C.rst:null,rv:Number(C.rsv)||0,fc:C.fc||{},wf:Number(C.wf)||0,pet:(()=>{const q=petCur();return q?{s:q.sp,n:q.nm,l:petLv(q)}:null})(),hf:C.healOff?1:0,du:{w:(C.stats&&C.stats.duW)||0,l:(C.stats&&C.stats.duL)||0},ev:C.dev&&C.dev.id===DEV.id?{id:DEV.id,pt:C.dev.pt||0,w:C.dev.w||0,n:C.dev.n||0,t:C.dev.t||0}:null,db:(C.du&&!C.du.fin)?(C.du.t0||Date.now()):0,dr:C.dr||null,on:Date.now(),im:im,pf:C.pf||{},fl:C.fall?1:0,ts:Date.now()}).catch(()=>{})}catch(e){}})}
function openProfile(uid){if(!DB||!uid)return;pfU=uid;$("#pfo").hidden=false;$("#pfm").textContent="";$("#pfr").hidden=uid===UID;$("#pfr").disabled=true;$("#pff").hidden=true;$("#pfg").hidden=true;$("#pfdm").hidden=true;$("#pfdu").hidden=uid===UID;$("#gbox").hidden=true;$("#pfb").textContent="프로필을 불러오는 중...";
 DB.doc("players/"+uid).get().then(s=>{if(pfU!==uid)return;const p=s.exists?s.data():null,b=$("#pfb");b.innerHTML="";
  if(!p){b.textContent="프로필을 찾지 못했다.";$("#pfr").hidden=true;return}
  const hero=document.createElement("div");hero.className="profile-hero";
  if(typeof p.im==="string"&&p.im.length<20000&&/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(p.im)){const i=document.createElement("img");i.className="av";i.alt="프로필 이미지";i.src=p.im;hero.appendChild(i);hiAv(i,uid)}
  const intro=document.createElement("div"),h=document.createElement("h2");h.className="profile-name";h.textContent=cn(uid,p.n||"이름 없는 캐릭터");intro.appendChild(h);
  const sub=document.createElement("p");sub.className="profile-sub";sub.textContent=(VL[p.v]?VL[p.v].n:"소속 미상")+" · "+(p.s||"성별 미설정");intro.appendChild(sub);if(tiName(p.ti,p.tn)){const ti=document.createElement("p");ti.className="ttl-tag";ti.style.margin="6px 0 0";ti.textContent="✦ "+tiName(p.ti,p.tn);intro.appendChild(ti)}hero.appendChild(intro);b.appendChild(hero);
  if(p.fl){const w=document.createElement("p");w.className="fallbar";w.textContent="이 마법소녀는 타락했다. 친구라면 마을의 '타락한 친구' 목록에서 맞서 되돌릴 수 있다.";b.appendChild(w)}
  const stat=document.createElement("div");stat.className="profile-statgrid";
  const stats=[...(p.pet&&PETS[p.pet.s]?[["사역마",PETS[p.pet.s][1]+" "+String(p.pet.n||"").slice(0,10)+" ("+(Number(p.pet.l)||1)+"단계)"]]:[]),["계약 등급",(p.g||"-")+"등급"],["속성",p.a||"미설정"],["레벨",p.lv||1],["토벌 횟수",(p.cl==null?0:p.cl)+"회"],["장착 무기",p.wp||"없음"],["전투력",p.pw==null?"-":p.pw],["절망도",(p.dz==null?"-":p.dz+"/100")],["경험치",p.ex==null?"-":p.ex]];
  stats.forEach(([label,value])=>{const box=document.createElement("div");box.className="profile-stat";const sm=document.createElement("small"),strong=document.createElement("strong");sm.textContent=label;strong.textContent=String(value);box.append(sm,strong);stat.appendChild(box)});b.appendChild(stat);
  const section=(title,value)=>{if(typeof value!=="string"||!value.trim())return;const sec=document.createElement("section");sec.className="profile-section";const sh=document.createElement("h3"),para=document.createElement("p");sh.textContent=title;para.textContent=value.slice(0,300);sec.append(sh,para);b.appendChild(sec)};
  section("마을 소개",VL[p.v]?VL[p.v].d:"");
  section("계약 특성",p.t? p.t+(p.td?" — "+p.td:""):"");
  const attrs=String(p.a||"").split(" · ").filter(Boolean).map(a=>{const x=AT.find(t=>t[0]===a);return x?a+" — "+x[2]:a});
  section("속성 효과",attrs.join("\n"));
  const pf=p.pf&&typeof p.pf==="object"?p.pf:{};
  section("외관",pf.ap);section("성격",pf.pe);section("마법",pf.mg);section("기타 / 과거",pf.et);
  if(!["ap","pe","mg","et"].some(k=>typeof pf[k]==="string"&&pf[k].trim())){const note=document.createElement("p");note.className="hint";note.style.marginTop="14px";note.textContent="아직 캐릭터의 상세 설정이 등록되지 않았다.";b.appendChild(note)}
  // 운영자에게만: 이 사람의 계정 아이디(uid)를 보여 주고 복사할 수 있게 한다(복구·지급 작업용).
  if(ADM[UID]){const ub=elT("div","pf-uid"),code=elT("code","",uid),cp=elT("button","chip","UID 복사");cp.type="button";cp.onclick=()=>{try{navigator.clipboard.writeText(uid);cp.textContent="복사했다"}catch(e){prompt("UID",uid)}};ub.append(elT("small","","운영자 전용 · 계정 UID "),code,cp);b.appendChild(ub)}
  frBtn(uid,p.n);const dmb=$("#pfdm");dmb.hidden=uid===UID||!AUTH.uid;dmb.onclick=()=>{$("#pfo").hidden=true;pfU=null;goDM(uid,p.n)}},
  e=>{$("#pfb").textContent="프로필을 불러오지 못했다."})}
$("#pfr").onclick=async()=>{const m=$("#pfm"),u=pfU;if(!u||u===UID)return;if(!(C.fr&&C.fr[u])){m.style.color="var(--bad)";m.textContent="친구에게만 공명할 수 있다. 먼저 친구 추가를 해 보자.";return}const last=(C.rl&&C.rl[u])||0,left=RES_CD-(Date.now()-last);
 if(left>0){m.style.color="var(--bad)";m.textContent="같은 상대에게는 3시간에 한 번만 공명할 수 있다. 약 "+Math.ceil(left/3600000)+"시간 뒤에 다시 할 수 있다.";return}
 $("#pfr").disabled=true;
 try{await DB.doc("res/"+u+"/"+UID).set({ts:{".sv":"timestamp"},n:String(C.n).replace(/👑/g,"").slice(0,20),a:(C.a.includes("빛")?3:0)+(C.t==="치유의 손길"?3:0)});
  // 공명은 '청하기'다. 상대가 받아들이면 그때 나와 상대 모두 절망도가 내려간다. 내 몫은 지금 계산해 두었다가 수락 소식이 오면 적용한다.
  C.rl=C.rl||{};C.rl[u]=Date.now();titleState();C.stats.resonances=(C.stats.resonances||0)+1;const rb=C.rsb?5:0;C.rsb=0;
  C.rq=C.rq||{};C.rq[u]={ts:Date.now(),amt:rqAmt(rb)};save();checkTitles();
  m.style.color="var(--mu)";m.textContent="공명을 청했다. 상대가 받아들이면 둘 다 절망도가 내려간다. (거절하면 3시간 대기도 풀린다)"}
 catch(e){m.style.color="var(--bad)";m.textContent="지금은 공명할 수 없다. 같은 상대에게는 3시간에 한 번만 가능하다."}
 resBtn(u)};
/* 공명을 청한 쪽이 받을 절망도 감소량. 청할 때 계산해 두지만, 기록이 사라졌으면(복구·다른 기기) 수락 소식이 올 때 다시 계산한다. */
const rqAmt=(rb=0)=>Math.round((disMine()==="frost"?.5:1)*(VL[C.v].rz+(C.t==="다정함"?5:0)+(eq(4)?2:0)+(rb||0)+facLv("chapel")));
/* 수락·거절 소식을 상대에게 보내지 못했으면 기억해 두었다가 다시 보낸다. 이 소식이 가야 청한 쪽의 절망도가 내려간다. */
function rqSend(f,t){C.rqOut=C.rqOut||{};C.rqOut[f]=t;save();return sendF(f,t).then(()=>{if(C&&C.rqOut&&C.rqOut[f]===t){delete C.rqOut[f];save()}}).catch(()=>{})}
function rqRetry(){if(!C||!C.rqOut)return;Object.keys(C.rqOut).forEach(f=>rqSend(f,C.rqOut[f]))}
const resLeft=u=>Math.max(0,RES_CD-(Date.now()-((C&&C.rl&&C.rl[u])||0)));
const cdTxt=ms=>{const t=Math.ceil(ms/1000),h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;return h?h+"시간 "+m+"분":m?m+"분 "+s+"초":s+"초"};
function resBtn(u){const b=$("#pfr");if(!u||!C)return;const isF=!!(C.fr&&C.fr[u]),left=resLeft(u);
 b.disabled=!isF||left>0;b.textContent=!isF?"공명하기 (친구만 가능)":left>0?"공명하기 ("+cdTxt(left)+" 뒤에 가능)":"공명하기"}
setInterval(()=>{if(pfU&&!$("#pfo").hidden&&pfU!==UID)resBtn(pfU)},1000);
$("#pfc").onclick=()=>{$("#pfo").hidden=true;pfU=null};
$("#pfo").onclick=e=>{if(e.target===$("#pfo"))$("#pfc").click()};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#pfo").hidden)$("#pfc").click()});
async function applyRes(){if(!AUTH.uid||!C||!DB)return;try{const s=await once(DB.collection("res/"+UID)),rs=C.rs||0,nm=[];let mx=rs;C.rqIn=C.rqIn||{};
 s.docs.forEach(d=>{const v=d.data();if(v&&v.ts>rs){const n=String(v.n||"누군가");nm.push(n);C.rqIn[d.id]={n,a:Math.min(6,Math.max(0,Number(v.a)||0)),ts:v.ts};note("res",n+"님이 공명을 청했다. 친구 화면에서 받아들이거나 거절할 수 있다.",d.id);mx=Math.max(mx,v.ts)}});
 rqExpire();if(!nm.length)return;C.rs=mx;save();updNav();toast("♡ "+nm.slice(0,2).join(", ")+(nm.length>2?" 외 "+(nm.length-2)+"명":"")+"이(가) 공명을 청했다");if(!$("#v-friends").hidden)rqDraw()}catch(e){}}
function rqExpire(){const now=Date.now();let ch=false;Object.keys(C.rqIn||{}).forEach(f=>{if(now-(C.rqIn[f].ts||0)>RQ_TTL){delete C.rqIn[f];ch=true}});Object.keys(C.rq||{}).forEach(f=>{if(now-(C.rq[f].ts||0)>RQ_TTL+3600000){delete C.rq[f];ch=true}});if(ch)save()}
function rqAnswer(f,ok){const q=(C.rqIn||{})[f];if(!q)return;delete C.rqIn[f];rqSend(f,ok?"rok":"rno");
 if(ok){const b0=C.dz,dn=5+q.a+(eq(4)?2:0)+petEff("res");gain(0,-dn);note("res",q.n+"님의 공명을 받아들였다."+(C.fall?" (타락 중이라 절망도는 그대로다)":" 절망도가 "+(b0-C.dz)+" 내려갔다."),f);$("#fm").style.color="var(--mu)";$("#fm").textContent=q.n+"님의 공명을 받아들였다. 마음이 맞닿는다."+(C.fall?"":" 절망도 -"+(b0-C.dz))}
 else{note("res",q.n+"님의 공명을 거절했다.",f);$("#fm").style.color="var(--mu)";$("#fm").textContent=q.n+"님의 공명을 거절했다."}save();updNav();rqDraw()}
function rqDraw(){const l=$("#rql");if(!l||!C)return;rqExpire();l.innerHTML="";const qs=Object.entries(C.rqIn||{}).sort((a,b)=>b[1].ts-a[1].ts);
 if(!qs.length){l.innerHTML="<p class='hint'>받은 공명이 없다.</p>";return}
 qs.forEach(([f,q])=>{const w=elT("div","dq"),cp=elT("div","dq-copy");cp.append(elT("b","","♡ "+cn(f,q.n)),elT("small","",agoTxt(q.ts)+" · 받아들이면 절망도 -"+(5+q.a+(eq(4)?2:0)+petEff("res"))));
  const y=elT("button","chip","수락");y.type="button";y.onclick=()=>rqAnswer(f,true);const n=elT("button","chip","거절");n.type="button";n.onclick=()=>rqAnswer(f,false);w.append(cp,y,n);l.appendChild(w)})}

/* 친구: 신청 -> 수락의 양방향 구조. 친구 목록은 내 계정에 저장하고, 신청/수락/삭제 알림은 서버의 fmsg(받는 사람만 읽을 수 있음)로 주고받는다. */
const nmOf=()=>String(C.n).replace(/👑/g,"").slice(0,20);
const sendF=(to,t)=>DB.doc("fmsg/"+to+"/"+UID).set({t,ts:{".sv":"timestamp"},n:nmOf()});
/* 등록자 탭: 게임에 등록된 모든 캐릭터를 카드로 보여 준다(플레이어 기록 players를 읽는다. 다른 탭과 같은 캐시를 써서 데이터를 거의 더 쓰지 않는다).
   카드를 누르면 그 사람의 프로필이 열린다. */
let RS=[],rsQ="",rsS="g";
async function roster(){show("roster");const box=$("#rsl");$("#rsh").textContent="";
 if(!XON()){box.innerHTML="<p class='hint'>서버에 연결되어야 등록자 목록을 볼 수 있다.</p>";return}
 if(!RS.length)box.innerHTML="<p class='hint'>목록을 불러오는 중...</p>";let docs=[];try{docs=(await plAll(120000)).docs}catch(e){}
 if($("#v-roster").hidden)return;RS=docs.map(d=>Object.assign({u:d.id},d.data()||{})).filter(p=>p&&p.n&&p.g);$("#rsq").value=rsQ;$("#rss").value=rsS;rsDraw()}
function rsDraw(){const box=$("#rsl");if(!box)return;const q=rsQ.trim().toLowerCase(),gi=g=>GL.indexOf(g);
 let L=RS.filter(p=>!q||String(p.n).toLowerCase().includes(q));
 const by={g:(a,b)=>gi(b.g)-gi(a.g)||(b.lv||0)-(a.lv||0),lv:(a,b)=>(b.lv||0)-(a.lv||0),pw:(a,b)=>(b.pw||0)-(a.pw||0),on:(a,b)=>(isOn(b)?1:0)-(isOn(a)?1:0)||gi(b.g)-gi(a.g),n:(a,b)=>String(a.n).localeCompare(String(b.n),"ko")}[rsS]||(()=>0);
 L.sort((a,b)=>by(a,b)||String(a.n).localeCompare(String(b.n),"ko"));
 $("#rsh").textContent="등록된 마법사 "+RS.length+"명 · 지금 접속 중 "+RS.filter(isOn).length+"명"+(q?" · 찾은 결과 "+L.length+"명":"");
 box.innerHTML="";if(!L.length){box.innerHTML="";box.appendChild(elT("p","hint",q?"이름에 '"+rsQ+"'이(가) 들어간 마법사가 없다.":"아직 등록된 마법사가 없다."));return}
 L.forEach(p=>{const c=document.createElement("button");c.type="button";c.className="ros-card"+(p.u===UID?" me":"");c.onclick=()=>openProfile(p.u);
  const top=elT("div","ros-top"),av=elT("div","ros-av");if(typeof p.im==="string"&&/^(data:image|https:)/.test(p.im)){const im=document.createElement("img");im.src=p.im;im.alt=String(p.n)+" 프로필 사진";im.loading="lazy";av.appendChild(im);hiAv(im,p.u);av.classList.add("has");av.title="사진 크게 보기";av.onclick=e=>{e.stopPropagation();picOpen(p.u,p.im,String(p.n))}}else av.textContent=String(p.n).slice(0,1);
  if(isOn(p)){const o=elT("i","ros-on","");o.title="접속 중";av.appendChild(o)}
  top.append(av,elT("b","ros-g g"+p.g,p.g+"등급"));
  c.append(top,elT("p","ros-n",cn(p.u,p.n)+(p.u===UID?" (나)":"")));const ti=tiName(p.ti,p.tn);if(ti)c.appendChild(elT("p","ros-ti","「"+ti+"」"));
  const at=elT("p","ros-at");String(p.a||"").split(" · ").filter(Boolean).forEach(a=>{const t=AT.find(x=>x[0]===a),sp=elT("span","ros-chip",a);if(t)sp.style.setProperty("--c",t[1]);at.appendChild(sp)});c.appendChild(at);
  c.appendChild(elT("p","ros-meta",[p.t?"특성 "+p.t:"",VL[p.v]?VL[p.v].n:""].filter(Boolean).join(" · ")));
  c.appendChild(elT("p","ros-meta","Lv "+(p.lv||1)+(p.pw?" · 전투력 "+p.pw:"")+(p.pet&&p.pet.s&&PETS[p.pet.s]?" · "+PETS[p.pet.s][2]+" "+(p.pet.n||PETS[p.pet.s][1]):"")));
  box.appendChild(c)})}
$("#rsq").oninput=e=>{rsQ=e.target.value;rsDraw()};$("#rss").onchange=e=>{rsS=e.target.value;rsDraw()};
function updNav(){const cb=document.querySelector("#nav [data-v=chat]");if(cb&&C){const k=Object.keys(C.dmu||{}).length;cb.textContent=k?"채팅 ("+k+")":"채팅";document.title=(k?"("+k+") ":"")+"魔法 成長記錄"}
 const b=document.querySelector("#nav [data-v=friends]");if(b){const n=Object.keys((C&&C.fq)||{}).length+Object.keys((C&&C.rqIn)||{}).length;b.textContent=n?"친구 ("+n+")":"친구"}
 const dub=document.querySelector("#nav [data-v=arena]");if(dub&&C){const n=(typeof DUI!=="undefined"?DUI.length:0),on=C.du&&!C.du.fin;dub.textContent=on?"대련 ⚔":n?"대련 ("+n+")":"대련"}
 const bgb=document.querySelector("#nav [data-v=bag]");if(bgb&&C){const n=Array.isArray(C.rg)?C.rg.length:0;bgb.textContent=n?"마법·가방 ("+n+")":"마법·가방"}
 const h=document.querySelector("#nav [data-v=hub]");if(h&&C){let k=dqReady();try{k+=facReady()}catch(e){}h.textContent=k?"마을 ("+k+")":"마을"}
 {const nb2=document.querySelector("#nav [data-v=ntc]");if(nb2&&C){let k=0;try{k=NTC.filter(n=>Number(n.ts)>(C.ntcSeen||0)).length}catch(e){}nb2.textContent=k?"공지 ("+k+")":"공지"}}
 const ib=document.querySelector("#nav [data-v=inbox]");if(ib&&C){const k=(C.nt||[]).filter(n=>!n.r).length;ib.textContent=k?"알림 ("+(k>9?"9+":k)+")":"알림"}
 // "이름 (3)" 꼴의 숫자는 작은 배지로 바꿔서, 숫자가 생겨도 탭 글자가 잘리지 않게 한다.
 document.querySelectorAll("#nav button").forEach(b=>{const m=b.textContent.match(/^(.*) \((\d+\+?)\)$/);if(m){b.textContent=m[1];b.appendChild(elT("span","nav-n",m[2]))}})}
async function frDo(a,u,nm){C.fr=C.fr||{};C.fq=C.fq||{};C.fo=C.fo||{};
 if(a==="req"){await sendF(u,"req");C.fo[u]=Date.now()}
 else if(a==="ok"){await sendF(u,"ok");C.fr[u]=C.fq[u]||nm||"";delete C.fq[u]}
 else if(a==="del"){await sendF(u,"del");delete C.fr[u]}
 save();updNav();checkTitles()}
function frBtn(uid,name){const b=$("#pff");C.fr=C.fr||{};C.fq=C.fq||{};C.fo=C.fo||{};
 // 공명은 친구에게만 할 수 있다.
 $("#pfr").hidden=uid===UID;resBtn(uid);b.hidden=uid===UID||!AUTH.uid;b.disabled=false;b.dataset.n=name||"";$("#pfg").hidden=!(C.fr[uid]&&uid!==UID&&AUTH.uid);
 if(C.fr[uid]){b.textContent="친구 삭제";b.dataset.a="del"}else if(C.fq[uid]){b.textContent="친구 신청 수락";b.dataset.a="ok"}else if(C.fo[uid]){b.textContent="친구 신청을 보냈다";b.disabled=true;b.dataset.a=""}else{b.textContent="친구 추가";b.dataset.a="req"}}
$("#pff").onclick=async()=>{const u=pfU,b=$("#pff"),a=b.dataset.a,nm=b.dataset.n,m=$("#pfm");if(!u||!a)return;
 if(a==="del"&&!confirm("친구를 삭제할까? 상대의 친구 목록에서도 사라진다."))return;
 b.disabled=true;
 try{await frDo(a,u,nm);m.style.color="var(--mu)";m.textContent=a==="req"?"친구 신청을 보냈다.":a==="ok"?"친구가 되었다.":"친구를 삭제했다."}
 catch(e){m.style.color="var(--bad)";m.textContent="지금은 할 수 없다. 잠시 뒤에 다시 시도해야 한다."}
 frBtn(u,nm)};
// 나에게 온 친구 신청, 수락, 삭제를 확인해서 목록에 반영한다.
async function syncFr(){if(!AUTH.uid||!C||!DB)return;try{rqRetry();const s=await once(DB.collection("fmsg/"+UID));if(!C)return;C.fr=C.fr||{};C.fq=C.fq||{};C.fo=C.fo||{};C.fs=C.fs||{};const notes=[];let ch=false;
 s.docs.map(d=>[d.id,d.data()]).filter(([f,v])=>v&&v.ts>(C.fs[f]||0)).sort((a,b)=>a[1].ts-b[1].ts).forEach(([f,v])=>{C.fs[f]=v.ts;ch=true;const n=String(v.n||"누군가");
  if(v.t==="req"){if(C.fr[f])sendF(f,"ok").catch(()=>{});else if(C.fo[f]){C.fr[f]=n;delete C.fo[f];sendF(f,"ok").catch(()=>{});(notes.push(n+"님과 친구가 되었다"),note("fr",n+"님과 친구가 되었다"+".",f))}else{C.fq[f]=n;(notes.push(n+"님이 친구 신청을 보냈다"),note("fr",n+"님이 친구 신청을 보냈다"+".",f))}}
  else if(v.t==="ok"){C.fr[f]=n;delete C.fo[f];delete C.fq[f];(notes.push(n+"님이 친구 신청을 수락했다"),note("fr",n+"님이 친구 신청을 수락했다"+".",f))}
  else if(v.t==="del"){delete C.fr[f];delete C.fq[f];delete C.fo[f];(notes.push(n+"님과 친구가 끊어졌다"),note("fr",n+"님과 친구가 끊어졌다"+".",f))}
  else if(v.t==="rok"){const q=(C.rq||{})[f];delete (C.rq||{})[f];C.rkT=C.rkT||{};const fresh=q||!(C.rkT[f]&&Date.now()-C.rkT[f]<RES_CD);const b0=C.dz;if(fresh){C.rkT[f]=Date.now();gain(0,-((q&&q.amt>0?q.amt:rqAmt())+petEff("res")))}notes.push(n+"님이 공명을 받아들였다");note("res",n+"님이 공명을 받아들였다."+(fresh&&!C.fall?" 절망도가 "+(b0-C.dz)+" 내려갔다.":""),f);toast("♡ "+n+"님이 공명을 받아들였다"+(fresh&&!C.fall?" · 절망도 -"+(b0-C.dz):""))}
  else if(v.t==="rno"){delete (C.rq||{})[f];if(C.rl)delete C.rl[f];notes.push(n+"님이 공명을 거절했다");note("res",n+"님이 공명을 거절했다. 지금 바로 다시 청할 수 있다.",f)}});
 if(!ch)return;save();updNav();checkTitles();
 if(!$("#v-friends").hidden)friends();else if(!$("#v-hub").hidden&&notes.length){const h=$("#hm");h.style.color="var(--mu)";h.textContent=notes.join(", ")+"."}}catch(e){}}
async function friends(msg){show("friends");updNav();rqDraw();const fm=$("#fm");fm.style.color="var(--mu)";fm.textContent=msg||"";
 const q=$("#fql"),l=$("#ffl"),o=$("#fol");
 if(!AUTH.uid){q.innerHTML=l.innerHTML=o.innerHTML="";fm.textContent="로그인해야 친구를 만들 수 있다.";return}
 C.fr=C.fr||{};C.fq=C.fq||{};C.fo=C.fo||{};let pl={};try{const s=await plAll();s.docs.forEach(d=>pl[d.id]=d.data())}catch(e){}
 if($("#v-friends").hidden)return;
 const row=(uid,fb,btns)=>{const w=document.createElement("div");w.style.cssText="display:flex;gap:8px";const p=pl[uid],nb=document.createElement("button");nb.type="button";nb.className="chip";nb.style.cssText="flex:1;text-align:left";
  nb.textContent=(p&&isOn(p)?"🟢 ":"")+cn(uid,(p&&p.n)||fb)+(p&&tiName(p.ti,p.tn)?" 「"+tiName(p.ti,p.tn)+"」":"")+(p?" ("+p.g+"등급 "+p.a+")":"");nb.onclick=()=>openProfile(uid);if(p&&C.fr&&C.fr[uid])nb.appendChild(frDz(p));w.appendChild(nb);w.className="fr-row";w.dataset.nm=String((p&&p.n)||fb||"").toLowerCase();
  btns.forEach(([t,fn])=>{const b=document.createElement("button");b.type="button";b.className="chip";b.style.cssText="flex:0 0 auto;min-width:0;padding:10px 14px";b.textContent=t;b.onclick=fn;w.appendChild(b)});return w};
 const act=(a,u,nm)=>async()=>{try{await frDo(a,u,nm);friends()}catch(e){friends("지금은 할 수 없다. 잠시 뒤에 다시 시도해야 한다.");$("#fm").style.color="var(--bad)"}};
 const fill=(el,items,empty)=>{el.innerHTML="";if(!items.length){el.innerHTML="<p class='hint'>"+empty+"</p>";return}items.forEach(x=>el.appendChild(x))};
 fill(q,Object.keys(C.fq).map(u=>row(u,C.fq[u],[["수락",act("ok",u,C.fq[u])],["거절",()=>{delete C.fq[u];save();updNav();friends()}]])),"받은 신청이 없다.");
 fill(l,Object.keys(C.fr).map(u=>row(u,C.fr[u],[["1:1 대화",()=>{chat();setT("d");openDM(u,(pl[u]&&pl[u].n)||C.fr[u])}]])),"아직 친구가 없다. 다른 사람의 프로필에서 친구 추가를 눌러보자.");
 fill(o,Object.keys(C.fo).map(u=>row(u,"",[])),"보낸 신청이 없다.");
 fPl=pl;fRow=row;fFilter()}
/* 친구 검색: 이름에 검색어가 들어간 사람만 보여 준다. 친구가 아닌 플레이어도 함께 찾아 준다. */
let fPl={},fRow=null;
function fFilter(){const q=$("#fsq").value.trim().toLowerCase();
 ["#fql","#ffl","#fol"].forEach(s=>{const el=$(s),rows=[...el.querySelectorAll(".fr-row")];let n=0;rows.forEach(w=>{const ok=!q||w.dataset.nm.includes(q);w.hidden=!ok;if(ok)n++});
  let e=el.querySelector(".fr-none");if(rows.length&&!n){if(!e){e=elT("p","hint fr-none","검색 결과가 없다.");el.appendChild(e)}}else if(e)e.remove()});
 const box=$("#fsb"),r=$("#fsr");box.hidden=!q;r.innerHTML="";if(!q||!fRow)return;
 const known=u=>u===UID||C.fr[u]||C.fq[u]||C.fo[u],hits=Object.keys(fPl).filter(u=>fPl[u]&&!known(u)&&String(fPl[u].n||"").toLowerCase().includes(q)).sort((a,b)=>(fPl[b].ts||0)-(fPl[a].ts||0)).slice(0,10);
 if(!hits.length){r.innerHTML="<p class='hint'>이름이 맞는 다른 플레이어가 없다.</p>";return}
 hits.forEach(u=>r.appendChild(fRow(u,"",[["친구 추가",async()=>{try{await frDo("req",u,fPl[u].n);friends(fPl[u].n+"님에게 친구 신청을 보냈다.")}catch(e){friends("지금은 할 수 없다. 잠시 뒤에 다시 시도해야 한다.");$("#fm").style.color="var(--bad)"}}]])))}
$("#fsq").oninput=fFilter;
const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const charmToday=()=>C.daily&&C.daily.d===today()?C.daily.charm||0:0;
const armed=id=>!!(C.arm&&C.arm[id]&&((C.inv||{})[id]||0)>0);
// 준비해 둔 소모품을 1개 쓴다. 실제로 썼으면 true.
const useItem=id=>{C.arm=C.arm||{};C.inv=C.inv||{};const ok=armed(id);if(ok)C.inv[id]--;delete C.arm[id];return ok};
const upr=L=>Math.min(100,UPR[L]+(C.t==="행운"?5:0)+2*facLv("forge")+((VL[C.v]||{}).up||0)+(typeof petEff==="function"?petEff("up"):0));
const wlv=i=>(C.wl&&C.wl["w"+i])||0;
function bag(msg){C.inv=C.inv||{};C.wps=C.wps||[];C.wl=C.wl||{};show("bag");drawRunes();drawPets();drawRetrait();drawRG();drawSkills();const bm=$("#bgm");bm.style.color="var(--mu)";bm.textContent=msg||"";
 const rowEl=(label,sub,btns)=>{const w=document.createElement("div");w.style.cssText="display:flex;gap:8px";const i=document.createElement("div");i.className="chip";i.style.cssText="flex:1;text-align:left;cursor:default";
  i.innerHTML="<b></b><small style='display:block;color:var(--mu);font-weight:400'></small>";i.querySelector("b").textContent=label;i.querySelector("small").textContent=sub;w.appendChild(i);
  btns.forEach(([t,fn,dis])=>{const b=document.createElement("button");b.type="button";b.className="chip";b.style.cssText="flex:0 0 auto;min-width:0;padding:10px 14px";b.textContent=t;b.disabled=!!dis;b.onclick=fn;w.appendChild(b)});return w};
 const it=$("#bgi");it.innerHTML="";const own=ITM.filter(x=>(C.inv[x[0]]||0)>0);
 if(!own.length)it.innerHTML="<p class='hint'>가진 아이템이 없다. 상점에서 살 수 있다.</p>";
 C.arm=C.arm||{};own.forEach(x=>{const id=x[0],on=armed(id);
  // 희망의 결정: 준비 없이 바로 쓰는 아이템. 절망도 하락량은 HOPE_DZ만 고치면 바뀐다.
  if(id==="hope"){it.appendChild(rowEl(x[1]+" x"+C.inv[id],x[2],[["사용",()=>{if(C.fall)return(bag("타락한 동안에는 희망의 결정이 빛나지 않는다."),$("#bgm").style.color="var(--bad)");if((C.dz||0)<=0)return bag("절망도가 이미 0이다. 아껴 두자.");
   if((C.inv.hope||0)<1)return;C.inv.hope--;const b0=C.dz;gain(0,-HOPE_DZ);note("quest","희망의 결정을 사용해 절망도가 "+(b0-C.dz)+" 내려갔다.");bag("희망의 결정이 부서지며 따뜻한 빛이 퍼졌다. 절망도가 "+(b0-C.dz)+" 내려갔다.")}]]));return}
  it.appendChild(rowEl(x[1]+" x"+C.inv[id]+(on?" · 준비됨":""),x[2]+(USE[id]?" ("+USE[id]+"에서 사용)":""),USE[id]?[[on?"준비 해제":"사용 준비",()=>{if(on)delete C.arm[id];else C.arm[id]=true;save();bag(x[1]+(on?" 준비를 해제했다.":"을(를) 준비했다. 다음 "+USE[id]+"에서 쓰인다."))}]]:[]))});
 const wp=$("#bgw");wp.innerHTML="";
 if(!C.wps.length)wp.innerHTML="<p class='hint'>가진 무기가 없다. 상점에서 살 수 있다.</p>";
 C.wps.forEach(i=>{const L=wlv(i),cost=L+1,mx=L>=5,have=C.inv.mana||0,on=C.wp===i;
  wp.appendChild(rowEl(WP[i][0]+(L?" +"+L:""),"전투력 +"+(WP[i][3]+wup(i))+(mx?" (최대 강화)":" · 다음 강화 성공 확률 "+upr(L)+"%"+(armed("whet")?", 실패해도 숫돌이 마력석을 지켜 준다":"")),[
   [on?"장착 중":"장착",()=>{C.wp=on?-1:i;save();bag(on?WP[i][0]+"을(를) 해제했다.":WP[i][0]+"을(를) 장착했다.")}],
   [mx?"최대":"강화 "+upr(L)+"% (마력석 "+cost+"개)",()=>{if(mx||(C.inv.mana||0)<cost)return;C.inv.mana-=cost;titleState();
    if(Math.random()*100<upr(L)){C.wl["w"+i]=L+1;C.stats.upgrades=(C.stats.upgrades||0)+1;save();checkTitles();bag("강화 성공! "+WP[i][0]+"이(가) +"+(L+1)+"이 되었다.")}
    // 실패해도 단계는 떨어지지 않는다. 보호의 숫돌을 준비해 두면 숫돌이 대신 깨지고 마력석은 돌려받는다.
    else{C.stats.upgradeFails=(C.stats.upgradeFails||0)+1;let t;
     if(useItem("whet")){C.inv.mana=(C.inv.mana||0)+cost;t="보호의 숫돌이 대신 깨지면서 마력석 "+cost+"개를 지켜 냈다.";
      // 남은 숫돌이 있으면 다음 강화를 위해 자동으로 다시 준비한다.
      const rest=C.inv.whet||0;if(rest>0){C.arm.whet=true;t+=" 남은 숫돌 "+rest+"개 중 하나를 다시 준비했다."}}
     else t="마력석 "+cost+"개가 사라졌다.";
     save();bag("강화 실패. "+WP[i][0]+"은(는) +"+L+" 그대로다. "+t);$("#bgm").style.color="var(--bad)"}},mx||have<cost]]))});
 if(!C.wps.length&&!own.length)bm.textContent=msg||""}
// 이 친구에게 쓸 수 있는 빈 칸 번호와, 다 찼다면 가장 빨리 비는 시각
function giftSlot(u){C.gsl=C.gsl||{};const a=C.gsl[u]||[],now=Date.now();let best=-1,soon=Infinity;
 for(let i=0;i<GIFT_DAY;i++){const t=a[i]||0;if(now-t>DAY_MS+60000){best=i;break}soon=Math.min(soon,t+DAY_MS+60000)}
 return{i:best,left:[...Array(GIFT_DAY).keys()].filter(i=>now-(a[i]||0)>DAY_MS+60000).length,soon}}
async function applyGift(){if(!AUTH.uid||!C||!DB)return;try{const s=await once(DB.collection("gift/"+UID));if(!C)return;C.gs=C.gs||{};const rs=[],items=[];let tot=0;
 s.docs.forEach(d=>{const f=d.id,v=d.data();if(!v||typeof v!=="object")return;
  if(v.g!=null&&v.ts!=null)items.push([f,f,v]);// 예전 방식(친구마다 한 칸)
  Object.keys(v).filter(k=>/^[0-3]$/.test(k)).forEach(k=>{if(v[k]&&typeof v[k]==="object")items.push([f,f+"_"+k,v[k]])})});
 items.filter(([f,key,v])=>GV[v.g]!=null&&typeof v.ts==="number"&&v.ts>(C.gs[key]||0)).sort((a,b)=>a[2].ts-b[2].ts).forEach(([f,key,v])=>{C.gs[key]=v.ts;
  // 받은 선물은 바로 쓰이지 않고 '받은 선물함'에 보관된다. 가방에서 원할 때 꺼내 쓴다.
  C.rg=Array.isArray(C.rg)?C.rg:[];C.rg.push({g:v.g,n:String(v.n||"누군가").slice(0,20),u:f,ts:v.ts});if(C.rg.length>RG_MAX)C.rg=C.rg.slice(-RG_MAX);
  rs.push(String(v.n||"누군가")+"님이 "+ITM.find(x=>x[0]===v.g)[1]+"을(를) 보냈다");note("gift",String(v.n||"누군가")+"님이 "+ITM.find(x=>x[0]===v.g)[1]+"을(를) 선물했다. 가방의 받은 선물함에 넣어 두었다.",f)});
 if(!rs.length)return;save();updNav();toast("🎁 "+rs.join(" / ")+" · 가방에 보관했다");
 if(!$("#v-bag").hidden)bag();if(!$("#v-hub").hidden){hub();const h=$("#hm");h.style.color="var(--mu)";h.textContent=rs.join(" / ")+" (가방의 받은 선물함에 보관)"}}catch(e){}}
const rgVal=g=>Math.round(GV[g]*(C.t==="다정함"?1.5:1)*(1+petEff("gift")));
function rgUse(idx){C.rg=Array.isArray(C.rg)?C.rg:[];const m=$("#bgm");if(C.fall){bag("타락한 동안에는 선물의 온기가 닿지 않는다.");m.style.color="var(--bad)";return}
 const list=idx==="all"?C.rg.slice():[C.rg[idx]].filter(Boolean);if(!list.length)return;if((C.dz||0)<=0)return bag("절망도가 이미 0이다. 선물은 아껴 두자.");
 const b0=C.dz;let sum=0;list.forEach(x=>sum+=rgVal(x.g));C.rg=idx==="all"?[]:C.rg.filter((x,i)=>i!==idx);titleState();C.stats.giftsUsed=(C.stats.giftsUsed||0)+list.length;gain(0,-sum);updNav();
 const who=[...new Set(list.map(x=>x.n))].join(", ");note("gift",who+"님의 선물을 열었다. 절망도가 "+(b0-C.dz)+" 내려갔다.");bag((list.length>1?"선물 "+list.length+"개를 열었다. ":who+"님의 "+ITM.find(x=>x[0]===list[0].g)[1]+"을(를) 열었다. ")+"마음이 따뜻해진다. 절망도가 "+(b0-C.dz)+" 내려갔다.")}
function drawRG(){const box=$("#bgrg");if(!box||!C)return;box.innerHTML="";const rg=Array.isArray(C.rg)?C.rg:[];
 $("#rgh").textContent="친구에게 받은 선물은 여기에 보관된다. 필요할 때 열어 절망도를 낮추자. (보관 "+rg.length+" / "+RG_MAX+")";
 if(!rg.length){box.appendChild(elT("p","hint","받은 선물이 없다."));return}
 rg.map((x,i)=>[x,i]).reverse().forEach(([x,i])=>{const it=ITM.find(t=>t[0]===x.g);if(!it)return;const w=document.createElement("div");w.style.cssText="display:flex;gap:8px";const c=elT("div","chip");c.style.cssText="flex:1;text-align:left;cursor:default";
  c.append(elT("b","","🎁 "+it[1]),elT("small","",x.n+"님이 보냄 · "+bdAgo(x.ts)+" · 절망도 -"+rgVal(x.g)));c.querySelector("small").style.cssText="display:block;color:var(--mu);font-weight:400";
  const b=elT("button","chip","열기");b.type="button";b.style.cssText="flex:0 0 auto;min-width:0;padding:10px 14px";b.disabled=!!C.fall;b.onclick=()=>rgUse(i);w.append(c,b);box.appendChild(w)});
 if(rg.length>1){const a=elT("button","btn g","모두 열기 (절망도 -"+rg.reduce((s,x)=>s+rgVal(x.g),0)+")");a.type="button";a.disabled=!!C.fall;a.onclick=()=>rgUse("all");box.appendChild(a)}}
$("#pfg").onclick=()=>{const gb=$("#gbox"),u=pfU;if(!gb.hidden){gb.hidden=true;return}C.inv=C.inv||{};gb.hidden=false;gb.innerHTML="";
 const sl=giftSlot(u);gb.appendChild(elT("p","hint","이 친구에게 오늘 보낼 수 있는 선물 "+sl.left+" / "+GIFT_DAY+"개"+(sl.i<0?" · 약 "+cdTxt(sl.soon-Date.now())+" 뒤에 다시 보낼 수 있다":"")));
 const own=ITM.filter(x=>x[0][0]==="g"&&(C.inv[x[0]]||0)>0);if(!own.length){gb.appendChild(elT("p","hint","가방에 선물이 없다. 상점에서 살 수 있다."));return}
 let sel=null;const row=document.createElement("div");row.className="row";row.style.margin="10px 0";
 own.forEach(x=>{const b=document.createElement("button");b.type="button";b.className="chip";b.textContent=x[1]+" x"+C.inv[x[0]];b.setAttribute("aria-pressed","false");
  b.onclick=()=>{sel=x[0];row.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",c===b?"true":"false"))};row.appendChild(b)});
 const go=document.createElement("button");go.type="button";go.className="btn";go.textContent="보내기";go.disabled=sl.i<0;
 go.onclick=async()=>{const m=$("#pfm");if(!sel){m.style.color="var(--bad)";m.textContent="보낼 선물을 골라야 한다.";return}
  const g=giftSlot(u);if(g.i<0){m.style.color="var(--bad)";m.textContent="이 친구에게는 오늘 선물을 "+GIFT_DAY+"개 모두 보냈다.";return}
  go.disabled=true;
  try{await DB.doc("gift/"+u+"/"+UID+"/"+g.i).set({g:sel,ts:{".sv":"timestamp"},n:nmOf()});C.gsl=C.gsl||{};(C.gsl[u]=C.gsl[u]||[])[g.i]=Date.now();
   C.inv[sel]--;titleState();C.stats.gifts=(C.stats.gifts||0)+1;save();checkTitles();m.style.color="var(--mu)";m.textContent="선물을 보냈다. (오늘 남은 선물 "+giftSlot(u).left+" / "+GIFT_DAY+"개)";gb.hidden=true}
  catch(e){const c=String(e&&e.message||e);if(c==="401"||c==="403"){C.gsl=C.gsl||{};(C.gsl[u]=C.gsl[u]||[])[g.i]=Date.now();save()}m.style.color="var(--bad)";m.textContent="지금은 보낼 수 없다. 같은 친구에게는 하루에 "+GIFT_DAY+"개까지 선물할 수 있다. 서버 규칙이 새 방식(네 칸)으로 바뀌었는지도 확인해야 한다."}
  go.disabled=false};
 gb.append(row,go)};
function pfRows(pf){const dl=document.createElement("dl");dl.className="kv";PF.forEach(([k,n])=>{const v=pf&&typeof pf[k]==="string"?pf[k].trim():"";if(!v)return;const dt=document.createElement("dt"),dd=document.createElement("dd");dt.textContent=n;dd.textContent=v.slice(0,300);dd.style.whiteSpace="pre-wrap";dd.style.overflowWrap="anywhere";dl.append(dt,dd)});return dl.children.length?dl:null}
let pend=null;
function pfOpen(){pend=null;$("#pfe").textContent="";$("#en").value=C.n;PF.forEach(([k])=>$("#pf-"+k).value=(C.pf&&C.pf[k])||"");const v=$("#ev");if(C.img){v.src=C.img;v.hidden=false}else v.hidden=true;$("#pfedit").hidden=false;$("#en").focus({preventScroll:true})}
$("#b-edit").onclick=()=>{if($("#pfedit").hidden)pfOpen();else{$("#pfedit").hidden=true;pend=null}};
$("#pf-cancel").onclick=()=>{$("#pfedit").hidden=true;pend=null};
$("#im2").onchange=e=>{const f=e.target.files[0];e.target.value="";pick(f,d=>{pend=d;const v=$("#ev");v.src=d;v.hidden=false})};
$("#en").onkeydown=e=>{if(e.key==="Enter"&&!e.isComposing)$("#pf-save").click()};
// 이미지, 이름, 설정을 한 번에 저장한다.
$("#pf-save").onclick=()=>{const n=$("#en").value.trim();if(!n){$("#pfe").textContent="이름을 입력해야 한다.";return}
 C.n=n;if(pend)C.img=pend;C.pf={};PF.forEach(([k])=>C.pf[k]=$("#pf-"+k).value.trim().slice(0,300));pend=null;save();regPlayer();$("#pfedit").hidden=true;hub();const h=$("#hm");h.style.color="var(--mu)";h.textContent="프로필을 저장했다."};

/* 매지컬 마치: 방 */
let room=null,code=null,unR=null,unL=null,tick=null;
const me=()=>({tw:facLv("tower"),tn:tiName(C.ti),n:C.n,a:C.a.join(""),g:C.g,t:C.t,p:pw(),v:C.v,f:armed("flag")?1:0,m:armed("map")?1:0,w:C.wp,sk:["water","wind","dark"].filter(armedSk),dz:C.dz||0});
const rref=c=>DB.doc("rooms/"+c);
const rmsg=t=>{$("#rm").textContent=t;if(!$("#v-hub").hidden){$("#hm").style.color="var(--bad)";$("#hm").textContent=t}};
// 매지컬 마치 화면 열기(마을 화면의 정기 출정 목록에서 바로 참가할 수 있어 버튼은 없앴다)
const openRooms=()=>{if(C.fall)return($("#hm").style.color="var(--bad)",$("#hm").textContent="타락한 동안에는 출정할 수 없다.");if(C.dz>=90)return($("#hm").style.color="var(--bad)",$("#hm").textContent="절망도가 너무 높아 출정할 수 없다. 공명으로 절망도를 낮춘 뒤에 다시 오자.");show("rooms");watchList()};
$("#rb").onclick=()=>{unL&&unL();unL=null;hub()};
function watchList(){rmsg("");if(LOCAL)rmsg("혼자 하기에서는 정기 출정이 열리지 않는다. 서버에 연결해 로그인하면 출정할 수 있다.");if(!DB){rmsg("이 화면에서는 방 기능을 쓸 수 없다. 공유 기능이 켜진 상태로 열어야 한다.");return}
 watchX();drawXAll()}
async function mk(pub){if(!DB)return rmsg("방 기능을 쓸 수 없다.");const c=Math.random().toString(36).slice(2,6).toUpperCase();
 const r={code:c,pub,host:UID,st:"lobby",pl:{[UID]:me()},rd:{[UID]:true},seq:[],step:0,ok:true,ev:0,total:3+R(3),ts:Date.now()};
 try{await rref(c).set(r);enter(c)}catch(e){rmsg("방을 만들지 못했다.")}}
async function join(c){if(!DB)return rmsg("방 기능을 쓸 수 없다.");if(c.length!==4)return rmsg("코드는 4자다.");
 try{const s=await rref(c).get();if(!s.exists)return rmsg("그런 방이 없다.");const r=s.data();r.seq=r.seq||[];r.rd=r.rd||{};
 if(r.pl[UID]){enter(c);return}if(r.st!=="lobby"||Object.keys(r.pl).length>=3)return rmsg("들어갈 수 없는 방이다.");
 r.pl[UID]=me();r.rd[UID]=false;await rref(c).set(r);enter(c)}catch(e){rmsg("입장하지 못했다.")}}
function enter(c){code=c;room=null;myV=null;clearInterval(cdT);cdT=setInterval(cdTick,500);$("#chv").hidden=true;unL&&unL();unL=null;show("room");$("#lg").hidden=true;$("#rrm").textContent="";
 unR=rref(c).onSnapshot(s=>{if(!s.exists){const wd=room&&room.st==="done";leave();const h=$("#hm");h.style.color="var(--mu)";h.textContent=wd?"출정이 끝나 방이 정리되었다.":"출정 방이 사라졌다.";return}room=s.data();room.seq=room.seq||[];room.rd=room.rd||{};draw()},e=>$("#rrm").textContent="연결이 끊겼다.")}
function leave(){unR&&unR();unR=null;clearInterval(tick);tick=null;clearInterval(cdT);cdT=null;room=null;code=null;hub()}
$("#rx").onclick=async()=>{if(room&&DB&&room.st==="lobby"){try{if(room.host===UID||Object.keys(room.pl).length<=1)await rref(code).delete();else{delete room.pl[UID];delete room.rd[UID];await rref(code).set(room)}}catch(e){}}
 // 끝난 방: 방장이 나가면 파티원들이 결과를 받을 시간을 10초 준 뒤 지운다.
 else if(room&&DB&&room.st==="done"&&room.host===UID){const c=code,r=room;setTimeout(()=>delRoom(c,r),10000)}leave()};
$("#rd").onclick=async()=>{if(!room||room.st!=="lobby")return;room.rd[UID]=!room.rd[UID];room.ts=Date.now();room.pl[UID]=me();try{await rref(code).set(room)}catch(e){}};
$("#bt").onclick=async()=>{const n=pw();["동료 하나","동료 둘"].forEach((x,i)=>{if(Object.keys(room.pl).length<3){const k="bot"+i;room.pl[k]={n:x,a:"-",g:C.g,t:"-",p:Math.max(10,n-2+i*2),v:C.v};room.rd[k]=true}});try{await rref(code).set(room)}catch(e){}};
$("#st").onclick=async()=>{if(room.host!==UID)return;startSim(room);room.st="run";room.step=0;
 try{await rref(code).set(room)}catch(e){$("#rrm").textContent="출발하지 못했다."}};
// 출발 준비: 아이템·마법·특성 효과를 정리하고 전투를 시작한다. 정기 출정이 쓴다.
function startSim(room){const ps=Object.values(room.pl),has=t=>ps.some(p=>p.t===t),solo=ps.length===1,sum=ps.reduce((a,p)=>a+p.p+(solo&&p.t==="고독"?8:0),0),fl=ps.some(p=>p.f),mp=ps.some(p=>p.m),co=ps.length>=2&&has("협력자"),stf=ps.some(p=>p.w===6);room.seq=[];
 room.rt=room.rt||room.total;
 if(solo){room.solo=1;if(!room.sdf){room.sdf=1;room.df=(room.df||1)*SOLO_DF;room.dzm=(room.dzm||1)*SOLO_DZ}room.seq.push("⚔ 고독한 출정: 함께할 동료 없이 홀로 길을 나섰다. 마수들이 혼자인 마법소녀를 노린다. (권장 전투력 ×"+SOLO_DF+")")}
 if(mp){room.total=3;room.seq.push("마수 사냥 지도를 따라 전투 3번으로 끝나는 길을 골랐다.")}
 if(fl)room.seq.push("용기의 깃발이 펄럭였다. 파티 전원의 전투력이 5 올랐다.");if(solo&&has("고독"))room.seq.push("홀로 나선 길, 고독이 힘이 되었다. 전투력이 8 올랐다.");if(co)room.seq.push("협력자가 파티의 호흡을 맞췄다. 파티 전투력이 3 올랐다.");if(stf)room.seq.push("스태프가 큰 마력을 나눠 파티 전투력이 2 올랐다.");
 const psk=id=>ps.filter(p=>(p.sk||[]).includes(id)).length,wt=psk("water"),wd=psk("wind"),dk=psk("dark");
 if(wt)room.seq.push("정화의 물결이 파티를 감쌌다. 이번 출정의 절망도 상승이 줄어든다.");if(dk)room.seq.push("그림자 계약이 맺어졌다. 파티 전투력이 8 올랐다.");if(wd)room.seq.push("바람의 길잡이가 앞장섰다. 운명이 한 번 파티 편을 든다.");room.wsk=wt>0;
 const twb=Math.max(0,...ps.map(p=>Math.min(5,Number(p.tw)||0)));if(twb)room.seq.push("감시탑이 마수의 움직임을 미리 알려 주었다. 전투 판정 +"+twb+".");
 if(ps.some(p=>p.w===2))room.seq.push("낫의 날이 서늘하게 빛난다. 수확의 일격: 대성공이 더 잘 나온다.");
 room.sim={scy:ps.some(p=>p.w===2),i:1,ok:true,ev:0,ex:0,gx:0,ab:dk?8:0,tw:twb,lucky:wd,rev:false,avg:sum/ps.length+(fl?5:0)+(co?3:0)+(stf?2:0)};room.pend=null;room.ch=null;room.fin=false;simStep(room)}
const vtx=(t,v)=>String(t).replace(/\{v\}/g,VL[v]?VL[v].n:"마을");
const fxTxt=x=>{const a=[];if(x.ex)a.push("경험치 +"+x.ex);if(x.gd)a.push("골드 "+(x.gd>0?"+":"")+x.gd);if(x.mm)a.push("마력석 +"+x.mm);if(x.gi)a.push("작은 꽃다발 +"+x.gi);if(x.pw)a.push("이번 출정 전투력 +"+x.pw);if(x.bt)a.push(x.bt>0?"전투 +"+x.bt:"전투 "+x.bt);if(x.tc)a.push("다음 재계약 시험 판정 +"+x.tc);if(x.rb)a.push("다음 공명 효과 증가");if(x.wa)a.push("오늘 하루 무기 +1");if(x.dh)a.push("절망도 70 이상인 사람만 절망도 "+(x.dh>0?"+":"")+x.dh);if(x.dz>0)a.push("절망도 +"+x.dz);if(x.dz<0)a.push("절망도 "+x.dz);return a.length?" ("+a.join(", ")+")":""};
// 권장 전투력 = (BT_BASE + BT_STEP × 몇 번째 전투) × 위험도. 기준치 = 50 + BT_K × (파티 전투력 ÷ 권장 전투력 − 1), 15~85 사이.
let BT_BASE=300,BT_STEP=60,BT_K=60;
const battleT=(P,i,df)=>Math.max(15,Math.min(85,Math.round(50+BT_K*(P/((BT_BASE+BT_STEP*i)*df)-1))));
const battleJ=(n,T,cd)=>n>=96?0:n<=Math.max(1,Math.floor(T/(cd||5)))?3:n<=T?2:n<=Math.min(95,T+30)?1:0;
function simStep(r){const ps=Object.values(r.pl),has=t=>ps.some(p=>p.t===t),S=r.sim,fight=()=>(S.avg+S.ab)*3*(.75+Math.random()*.6);
 while(S.i<=r.total&&S.ok){const i=S.i,T=Math.min(90,battleT(S.avg+S.ab,i,r.df||1)+(S.tw||0)),J0=()=>battleJ(1+R(100),T,S.scy?SCY_CRIT:5);let j=J0();
  if(j===0&&!S.rev&&has("불굴")){S.rev=true;r.seq.push("전투 "+i+"/"+r.total+": 쓰러질 뻔했지만 불굴의 의지로 다시 일어섰다.");j=J0()}
  // 땅 속성: 파티에 땅 속성이 있으면 처음 나온 대실패 한 번을 EARTH_P 확률로 실패로 바꾼다(퇴각하지 않고 계속 나아간다).
  if(j===0&&!S.earth&&ps.some(p=>String(p.a||"").includes("땅"))){S.earth=true;if(Math.random()<EARTH_P){j=1;r.seq.push("전투 "+i+"/"+r.total+": 무너질 뻔한 순간, 대지가 솟아올라 파티를 받쳐 주었다.")}}
  const J=BJ[j],jdz=Math.round(J.dz*(J.dz>0?(r.dzm||1):1));S.jc=S.jc||[0,0,0,0];S.jc[j]++;S.ex+=J.ex;S.ev+=jdz;
  r.seq.push("전투 "+i+"/"+r.total+" · "+J.n+"! "+J.t[R(J.t.length)]+fxTxt({ex:J.ex,dz:J.dz}));S.i++;if(j===0){S.ok=false;break}
  if(i<r.total&&Math.random()<(has("번뜩임")?.85:.6)){const vs=[...new Set(ps.map(p=>p.v).concat(r.zv?[r.zv]:[]).filter(v=>VEV[v]))];const cx=evCtx(r),okE=e=>!e.cond||e.cond(cx),pk=list=>{const l=list.filter(okE);for(let t=0;t<10;t++){const e=l[R(l.length)];if(!e.rare||Math.random()<.3)return e}return l.find(e=>!e.rare)||l[0]};
   let x,v=vs[0]||"A";if(r.solo&&Math.random()<SOLO_EVP)x=pk(SOLO_EV);else if(vs.length&&Math.random()<.3){v=vs[R(vs.length)];x=pk(VEV[v])}else x=pk(EV);
   r.evs=r.evs||[];if(!r.evs.includes(x.id))r.evs.push(x.id);if(x.o){r.pend={id:x.id,v};return}applyEv(r,x,v)}}
 {const jc=S.jc||[0,0,0,0];r.seq.push("판정 결과: 대성공 "+jc[3]+" · 성공 "+jc[2]+" · 실패 "+jc[1]+" · 대실패 "+jc[0])}r.seq.push(S.ok?"토벌 완료! 파티가 무사히 돌아왔다.":"토벌 실패. 파티가 후퇴했다.");r.ok=S.ok;r.ev=S.ev;r.ex=S.ex;r.gx=S.gx;r.fx={mm:S.mm||0,gi:S.gi||0,tc:S.tc||0,rb:S.rb||0,wa:S.wa||0,wp:S.wp||0,dh:S.dh||0};r.fin=true}
function applyEv(r,x,v){const ps=Object.values(r.pl),has=t=>ps.some(p=>p.t===t),S=r.sim,fl=has("번뜩임");
 if(x.trap&&has("예민함")){r.seq.push("예민한 감각으로 위험을 미리 알아채 피했다.");return}
 const ex=(x.ex||0)*(fl?2:1);let tx=vtx(x.t,v);if(tx.includes("{f}"))tx=tx.replace(/\{f\}/g,r.zv?"이름 모를 마법소녀":echoName(r));
 r.seq.push(tx+fxTxt({...x,ex})+(x.ex&&fl?" (번뜩임: 경험치 2배)":""));S.ev+=x.dz||0;S.ex+=ex;S.gx+=x.gd||0;S.ab+=x.pw||0;
 S.mm=(S.mm||0)+(x.mm||0);S.gi=(S.gi||0)+(x.gi||0);S.tc=Math.max(S.tc||0,x.tc||0);if(x.rb)S.rb=1;if(x.wa)S.wa=1;if(x.wpile)S.wp=1;S.dh=(S.dh||0)+(x.dh||0);
 if(x.bt)r.total=Math.max(S.i-1,r.total+x.bt)}
// 표를 세어 고른다. 표가 갈리면 무작위, 아무도 안 고르면 운명에 맡긴다.
function resolveChoice(r,picks){const x=EVM[r.ch.id],v=r.ch.v;if(!x){r.ch=null;r.pend=null;simStep(r);return}
 const ops=(r.ch.ops&&r.ch.ops.length)?r.ch.ops:x.o.map((_,i)=>i);picks=picks.filter(p=>ops.includes(p));
 const cnt=ops.map(i=>picks.filter(p=>p===i).length),mx=Math.max(...cnt),top=ops.filter((i,j)=>cnt[j]===mx),pick=top[R(top.length)],o=x.o[pick];
 r.seq.push(vtx(x.q,v));r.seq.push("선택: "+o.l+(picks.length?" ("+picks.filter(p=>p===pick).length+"표)":" (아무도 고르지 않아 운명에 맡겼다)"));
 let out=o.r;if(out.p!=null){if((r.sim.lucky||0)>0){r.sim.lucky--;r.seq.push("바람의 길잡이가 운명을 바꾸었다.");out=out.win}else out=Math.random()<out.p?out.win:out.lose}applyEv(r,out,v);r.ch=null;r.pend=null;simStep(r)}
const humansOf=r=>Object.keys(r.pl).filter(k=>!k.startsWith("bot"));
const vref=(c,u)=>DB.doc("rooms/"+c+"v_"+u);
let busyT=false,myV=null,cdT=null;
function delRoom(c,r){if(!DB||!c)return;rref(c).delete().catch(()=>{});if(r&&r.pl)humansOf(r).forEach(u=>vref(c,u).delete().catch(()=>{}))}
// 방장이 창을 닫아 남은 방, 오래된 투표 기록을 마을에 들어올 때 정리한다(30분에 한 번, 4명 중 1명꼴).
let lastSweep=0;
async function sweepRooms(){if(!DB||Date.now()-lastSweep<1800000)return;lastSweep=Date.now();if(Math.random()>.25)return;// 서버비 절약: 모두가 방 목록 전체를 받지 않도록 30분에 한 번, 4명 중 1명꼴로만 정리한다
 let s;try{s=await once(DB.collection("rooms"))}catch(e){return}const now=Date.now();
 s.docs.forEach(d=>{const v=d.data(),id=d.id;if(!v||id===code||/^x[mvdabr]/.test(id))return;const age=now-(Number(v.ts)||0);
  const stale=v.st==null?(!v.ts||age>300000):(!v.ts||(v.st==="done"&&age>120000)||(v.st==="run"&&age>1800000)||(v.st==="lobby"&&age>3600000));
  if(stale)DB.doc("rooms/"+id).delete().catch(()=>{})});xSweep()}
async function hostTick(){if(room&&room.host===UID&&room.st==="done"&&Date.now()-(room.doneAt||0)>ROOM_KEEP){const c=code,r=room;delRoom(c,r);return}
 if(!room||room.host!==UID||room.st!=="run"||busyT)return;busyT=true;const c=code;try{let ch=false;
 if(room.step<room.seq.length){room.step++;ch=true}
 else if(room.pend&&!room.ch){const x=EVM[room.pend.id],cx=evCtx(room),ops=x.o.map((o,i)=>i).filter(i=>!x.o[i].req||x.o[i].req(cx)),h=(cx.tr("번뜩임")||cx.tr("예민함"))?x.o.findIndex(o=>o.ok):-1;
  room.ch={id:room.pend.id,v:room.pend.v,k:room.seq.length,until:Date.now()+CHOICE_MS,ops,h};ch=true}
 else if(room.ch){const hs=humansOf(room),picks=[];for(const u of hs){try{const s=await vref(c,u).get(),d=s.exists&&s.data();if(d&&d.k===room.ch.k&&(room.ch.ops||[]).includes(d.i))picks.push(d.i)}catch(e){}}
  if(picks.length>=hs.length||Date.now()>=room.ch.until){resolveChoice(room,picks);hs.forEach(u=>vref(c,u).delete().catch(()=>{}));ch=true}}
 else if(room.fin){room.st="done";room.doneAt=Date.now();ch=true}
 if(ch&&room&&code===c){room.ts=Date.now();await rref(c).set(room)}}catch(e){}busyT=false}
function drawChoice(r){const cv=$("#chv");if(!(r.st==="run"&&r.ch&&r.step>=r.seq.length&&EVM[r.ch.id])){cv.hidden=true;return}
 const x=EVM[r.ch.id];cv.hidden=false;cv.innerHTML="";cv.appendChild(elT("p","choice-q",vtx(x.q,r.ch.v)));const row=elT("div","row");
 const ops=(r.ch.ops&&r.ch.ops.length)?r.ch.ops:x.o.map((_,i)=>i);ops.forEach(i=>{const o=x.o[i],b=elT("button","chip",o.l+(o.rl?" ("+o.rl+")":"")+(r.ch.h===i?" ✦":""));b.type="button";b.setAttribute("aria-pressed",myV&&myV.k===r.ch.k&&myV.i===i?"true":"false");
  b.onclick=async()=>{myV={k:r.ch.k,i};drawChoice(r);try{await vref(code,UID).set({k:r.ch.k,i,ts:Date.now()})}catch(e){}};row.appendChild(b)});
 cv.appendChild(row);if(r.ch.h>=0)cv.appendChild(elT("p","hint","✦ 파티의 직감(번뜩임·예민함)이 답을 속삭인다."));cv.appendChild(elT("p","hint choice-t",""));cdTick()}
function cdTick(){const t=document.querySelector("#chv .choice-t");if(!t||!room||!room.ch)return;const left=Math.max(0,Math.ceil((room.ch.until-Date.now())/1000));
 t.textContent=(myV&&myV.k===room.ch.k?"골랐다. ":"")+"남은 시간 "+left+"초 · 파티원이 함께 고른다. 표가 갈리면 무작위로 정해진다."}

function draw(){const r=room,ids=Object.keys(r.pl),all=ids.length>=1&&ids.every(i=>r.rd[i]);
 $("#rt").textContent="출정 방 "+(r.pub?"(공개)":"(비공개 코드 "+r.code+")");
 const pm=ids.some(i=>r.pl[i].m),pf=ids.some(i=>r.pl[i].f);drawChoice(r);$("#rs").textContent=r.st!=="lobby"&&r.ch&&r.step>=r.seq.length?"선택의 순간":r.st==="lobby"?"파티 "+ids.length+"/3 · 전투 "+(pm?"3번 (사냥 지도)":r.total+"번 예정")+(pf?" · 용기의 깃발 +5":""):"출정 중";
 const l=$("#pl");l.innerHTML="";ids.forEach(i=>{const p=r.pl[i],d=document.createElement("div");d.className="chip";d.style.textAlign="left";
  if(i!==UID){d.tabIndex=0;d.setAttribute("role","button");d.style.cursor="pointer";d.onclick=()=>openProfile(i)}d.textContent=cn(i,p.n)+(i===UID?" (나)":"")+" · "+p.g+"등급 "+p.a+" · 전투력 "+p.p+(r.rd[i]?" · 준비 완료":"");l.appendChild(d)});
 $("#rd").hidden=r.st!=="lobby";$("#rd").textContent=r.rd[UID]?"준비 취소":"준비 완료";
 $("#st").hidden=!(r.st==="lobby"&&r.host===UID);$("#st").disabled=!all;$("#bt").hidden=!(LOCAL&&r.st==="lobby"&&ids.length<3);
 if(r.st!=="lobby"){const g=$("#lg");g.hidden=false;g.innerHTML=r.seq.slice(0,r.step).map(t=>"<p>"+t+"</p>").join("")||"<p>출발한다...</p>";
  $("#rx").textContent="마을로 돌아가기";
  if(r.st==="run"&&r.host===UID&&!tick)tick=setInterval(hostTick,2200);
  if(r.st==="done"&&C.last!==r.code+r.seq.length)g.innerHTML+=settle(r)}}
// 출정 결과를 내 캐릭터에 반영하고, 기록 창에 붙일 HTML을 돌려준다. 같은 출정은 한 번만 반영된다.
function settle(r){if(C.last===r.code+r.seq.length)return "";C.last=r.code+r.seq.length;let out="";const v=VL[C.v],m=(Object.keys(r.pl).length===1&&r.solo?SOLO_M:([0,.6,.7,.8,.87,.93,.97,1][Object.keys(r.pl).length]||1))*(r.rw||1);
   const mine=r.pl[UID]||{},used=[],msk=mine.sk||[],dkz=msk.includes("dark")?6:0,wtz=r.wsk?5:0;msk.forEach(id=>{if(useSk(id))used.push(SKID[id].nm)});if(mine.f&&useItem("flag"))used.push("용기의 깃발");if(mine.m&&useItem("map"))used.push("마수 사냥 지도");const ch=useItem("charm");if(ch)used.push("결계 부적");
   // 결계 부적: 오르는 절망도를 절반으로. 물 속성과 겹쳐도 합쳐서 절반까지만 줄어든다.
   const cut=d=>ch&&d>0?d*(C.a.includes("물")?2/3:.5):d,base=r.rt||r.total;
   if(r.gx){C.gd=Math.max(0,(C.gd||0)+r.gx)}const tn=r.gx?["이벤트 골드 "+(r.gx>0?"+":"")+r.gx]:[],gd=C.t==="수호"?4:0,sc=eq(2)?SCY_DZ:0,wx=(eq(5)?1+WAND_EX:1)*(1+.03*facLv("drill"))*(wfLv()>=1?1+WF_EXP:1)*(1+petEff("ex"))*(disMine()==="storm"?.8:1);if(gd)tn.push("수호: 절망도 상승 4 감소");if(sc)tn.push("낫: 절망도 "+SCY_DZ+" 추가");if(eq(5))tn.push("완드: 경험치 "+Math.round(WAND_EX*100)+"% 증가");if(eq(3)&&!r.ok)tn.push("방패: 실패로 오르는 절망도가 줄었다");
   const fx=r.fx||{};let xe=0,xz=0;C.inv=C.inv||{};
   if(fx.mm){C.inv.mana=(C.inv.mana||0)+fx.mm;tn.push("마력석 +"+fx.mm)}
   if(fx.gi){C.inv.g1=(C.inv.g1||0)+fx.gi;dexAdd("it","g1");tn.push("작은 꽃다발 +"+fx.gi)}
   if(fx.tc){C.tcb=Math.max(C.tcb||0,fx.tc);tn.push("여왕의 표식: 다음 재계약 시험 판정 +"+fx.tc)}
   if(fx.rb){C.rsb=1;tn.push("요정의 축복: 다음 공명 효과 증가")}
   if(fx.wa){C.wtmp={day:today(),v:1};tn.push("요새 무기고: 오늘 하루 무기 +1")}
   if(fx.wp){const wr=[["칼",{ex:10}],["총",{gd:20}],["낫",{ex:15}],["방패",{dz:-8}],["오브",{dz:-5}],["완드",{ex:12}],["스태프",{mm:1}]][C.wp]||["맨손",{gd:10}],e=wr[1];xe+=e.ex||0;xz+=e.dz||0;if(e.gd)C.gd=(C.gd||0)+e.gd;if(e.mm)C.inv.mana=(C.inv.mana||0)+e.mm;tn.push("무기 더미("+wr[0]+")"+fxTxt(e))}
   if(fx.dh&&(Number(mine.dz)||0)>=70){xz+=fx.dh;tn.push("절망의 거울: 절망도 "+(fx.dh>0?"+":"")+fx.dh)}
   if(r.ok){C.cl++;titleState();C.stats.huntsWon=(C.stats.huntsWon||0)+1;{const pe=petDrop("x");if(pe)tn.push(pe)}petXp(PET_XP_RUN);if((C.dz||0)>=90)C.stats.clutch=1;if(new Date(Date.now()+9*3600000).getUTCHours()===3)C.stats.dawnWin=1;if(r.solo){const sg=SOLO_RW.g,sm=Math.random()<SOLO_RW.mp?1:0;C.gd=(C.gd||0)+sg;if(sm){C.inv=C.inv||{};C.inv.mana=(C.inv.mana||0)+sm}C.stats.soloWins=(C.stats.soloWins||0)+1;if(r.ab)C.stats.soloAbyss=1;tn.push("고독의 보상: 골드 +"+sg+(sm?", 마력석 +1":""))}
   if(r.ab){C.stats.abyssWins=(C.stats.abyssWins||0)+1;if(!(C.wp>=0))C.stats.abyssBare=1;tn.push("심연을 끝까지 걸어 나왔다")}C.gd=(C.gd||0)+Math.round((30+10*base)*m*(C.t==="행운"?1.1:1)*(1+.05*facLv("workshop"))*(disMine()==="eclipse"?.7:1)*(1+.05*rnLv("luck"))*(wfLv()>=2?1+WF_GOLD:1)*(1+petEff("gd")));if(C.t==="행운")tn.push("행운: 골드 10% 증가");
    if(C.t==="수집가"&&Math.random()<.3){C.inv=C.inv||{};C.inv.mana=(C.inv.mana||0)+1;tn.push("수집가: 마력석 1개를 주웠다")}
    if(petEff("mana")&&Math.random()<petEff("mana")){C.inv=C.inv||{};C.inv.mana=(C.inv.mana||0)+1;tn.push("밤까마귀가 마력석 1개를 물어 왔다")}
    gain(((30+10*base)*v.x*m+(r.ex||0))*wx,cut(Math.max(0,r.ev+v.dz+r.total*3-gd+sc-wtz+dkz)))}else{titleState();C.stats.huntsLost=(C.stats.huntsLost||0)+1;C.gd=(C.gd||0)+5;gain((8+(r.ex||0))*wx,cut(Math.max(0,(eq(3)?12:25)-gd+sc-wtz+dkz)))}if(xe||xz)gain(xe,xz);checkTitles();if(tn.length)out+="<p>"+tn.join(" · ")+"</p>";{const nd=(r.evs||[]).filter(id=>EVM[id]&&dexAdd("ev",id)).map(id=>evName(EVM[id],evVil(id)||"A")[0]);if(nd.length)note("dex","도감에 새 출정 이벤트가 기록되었다: "+nd.join(", "))}note("march",(r.ok?"토벌 성공":"토벌 실패")+" · 전투 "+r.total+"번 · 파티 "+Object.keys(r.pl).length+"명"+(r.gx?" · 이벤트 골드 +"+r.gx:""));
   guardAdd(r.ok?Math.round(10*(r.rw||1)):2);out+="<p><strong>"+(r.ok?"토벌 횟수가 늘었다.":"절망도가 올랐다.")+"</strong></p>"+(used.length?"<p>사용한 아이템·마법: "+used.join(", ")+(ch?" (절망도 상승이 절반으로 줄었다)":"")+"</p>":"");return out}

let unH=null;
function watchHub(){watchX();drawXAll()}
const isAbyss=(s,i)=>i===((s%XN)+XN)%XN||(s%2===0&&i===((s+5)%XN+XN)%XN);
const XON=()=>!!DB&&!LOCAL&&!!FBU;
// 정기 출정 기록 위치: 서버 규칙에 이미 열려 있는 rooms 아래에 둔다(별도 규칙 추가가 필요 없다).
// 자리: rooms/xm{묶음}_e{번호}/{나}, 투표: rooms/xv{출정}_c{번호}/{나}. 예전 파일의 방 정리 기능이 지우지 않도록 ts도 함께 남긴다.
const xSeat=(s,i)=>"rooms/xm"+s+"_e"+i,xVote=(id,c)=>"rooms/xv"+id+"_c"+c;
const hs32=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const rng=seed=>{let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
const seeded=(seed,f)=>{const o=Math.random;Math.random=rng(seed);try{return f()}finally{Math.random=o}};
function xInfo(s,i){const id="x"+s+"_"+i,g=rng(hs32(id)),p=n=>Math.floor(g()*n),v="ABCD"[p(4)],ab=isAbyss(s,i),d=ab?4:1+p(3);const pl=XPL[p(XPL.length)],t=3+p(3);return{id,s,i,v,d,nm:ab?ABYSS_PL[((s+(i===((s%XN)+XN)%XN?0:2))%ABYSS_PL.length+ABYSS_PL.length)%ABYSS_PL.length]:VL[v].n+" "+pl,total:ab?5:t,T0:(s+1)*XS,close:(s+1)*XS-XCLOSE}}
const xSlot=()=>Math.floor(Date.now()/XS);
// 지금 참가할 수 있는 출정 묶음(마감이 지나면 다음 묶음)
const xLs=()=>{const s=xSlot();return Date.now()>=(s+1)*XS-XCLOSE?s+1:s};
const jtOf=v=>typeof(v&&v.jt)==="number"?v.jt:0;
const xParty=(x,m)=>Object.keys(m||{}).filter(u=>m[u]&&typeof m[u]==="object"&&jtOf(m[u])<=x.close).sort((a,b)=>jtOf(m[a])-jtOf(m[b])||(a<b?-1:1)).slice(0,XMAX);
const xFmt=ms=>{const t=Math.max(0,Math.ceil(ms/1000));return Math.floor(t/60)+":"+String(t%60).padStart(2,"0")};
const xHM=d=>{const t=new Date(d);return String(t.getHours()).padStart(2,"0")+":"+String(t.getMinutes()).padStart(2,"0")};
const xCdTxt=()=>{const x=xInfo(xLs(),0);return "다음 출발 "+xHM(x.T0)+" · 참가 마감까지 "+xFmt(x.close-Date.now())};
let xSnap={},xS=-1,unX=null,XR=null,xBusy=false,xAuto="",xPh="",xChK="",xMyV=null;
function watchX(s){if(s==null)s=xLs();if(unX&&xS===s)return;unX&&unX();unX=null;xS=s;xSnap={};if(!XON())return;
 unX=DB.collection("rooms").prefix("xm"+s+"_").onSnapshot(sn=>{if(xS!==s)return;const o={};sn.docs.forEach(d=>{const m=String(d.id).match(/_e(\d+)$/);if(m)o["e"+m[1]]=d.data()||{}});xSnap=o;drawXAll()},e=>{})}
function drawXAll(){["#hl","#rl"].forEach(q=>{const el=$(q);if(el&&!el.closest("[hidden]"))drawX(el)})}
function xSay(t,bad){[$("#hm"),$("#rm")].forEach(e=>{if(e){e.style.color=bad?"var(--bad)":"var(--mu)";e.textContent=t}})}
function drawX(el){el.innerHTML="";if(!C)return;
 if(!XON()){el.innerHTML="<p class='hint'>"+(LOCAL?"혼자 하기에서는 정기 출정이 열리지 않는다. 서버에 연결해 로그인하면 출정할 수 있다.":"서버에 연결되어야 정기 출정에 참가할 수 있다.")+"</p>";return}
 const now=Date.now(),ls=xLs(),mj=C.mj;el.appendChild(elT("p","x-cd",xCdTxt()));
 if(mj){const x=xInfo(mj.s,mj.i),w=elT("div","xm on"),cp=elT("div","xm-copy"),b=elT("button","chip","보기");cp.append(elT("b","","참가한 출정: "+x.nm),elT("small","",now<x.T0?"출발 "+xHM(x.T0)+" · 출발 시각에 자동으로 출발한다.":"출정 중이다."));b.type="button";b.onclick=xView;w.append(cp,b);el.appendChild(w)}
 for(let i=0;i<XN;i++){const x=xInfo(ls,i),m=(ls===xS?xSnap["e"+i]:null)||{},ids=xParty(x,m),inI=!!(mj&&mj.id===x.id),full=ids.length>=XMAX&&!inI,lock=!!mj&&!inI&&mj.s!==ls;
  const ab=x.d===4,weak=ab&&pw()<ABYSS_MIN&&!inI,w=elT("div","xm"+(inI?" on":"")+(ab?" abyss":"")),cp=elT("div","xm-copy");
  cp.append(elT("b","",(ab?"🜏 ":"")+x.nm),elT("small","",XDF[x.d].n+(ab?" · 보상 2배 · 전투력 "+ABYSS_MIN+" 이상":"")+" · 전투 "+x.total+"번 · 파티 "+ids.length+"/"+XMAX+(ids.length?" · "+ids.map(u=>cn(u,m[u].n)).join(", "):"")));
  const b=elT("button","chip",inI?"참가 취소":full?"정원 마감":lock?"참가 불가":weak?"전투력 부족":mj?"이쪽으로 변경":"참가");b.type="button";b.disabled=full||lock||weak;b.onclick=()=>inI?xLeave():xJoin(ls,i);w.append(cp,b);el.appendChild(w)}}
async function xJoin(s,i){const x=xInfo(s,i);if(!XON())return;if(lhOn()){toast("장기 토벌을 떠나 있는 동안에는 정기 출정에 참가할 수 없다.");return}
 if(C.fall)return xSay("타락한 동안에는 출정할 수 없다.",1);if(C.dz>=90)return xSay("절망도가 너무 높아 출정할 수 없다. 공명으로 절망도를 낮춘 뒤에 다시 오자.",1);
 if(Date.now()>=x.close)return xSay("이 출정은 참가가 마감되었다.",1);if(x.d===4&&pw()<ABYSS_MIN)return xSay("심연에는 전투력 "+ABYSS_MIN+" 이상만 들어갈 수 있다. (지금 "+pw()+")",1);
 const mj=C.mj;if(mj&&mj.s!==s)return xSay("이미 참가한 출정이 있다. 그 출정이 끝난 뒤에 참가할 수 있다.",1);
 if(xParty(x,(xS===s?xSnap["e"+i]:null)||{}).length>=XMAX)return xSay("정원이 찼다.",1);
 try{if(mj)await DB.doc(xSeat(mj.s,mj.i)+"/"+UID).delete();
  const me0=me();await DB.doc(xSeat(s,i)+"/"+UID).set({...me0,jt:{".sv":"timestamp"}});DB.doc(xSeat(s,i)+"/ts").set(Date.now()).catch(()=>{});C.mj={id:x.id,s,i,T0:x.T0};save();
  if(xS===s){if(mj&&xSnap["e"+mj.i])delete xSnap["e"+mj.i][UID];(xSnap["e"+i]=xSnap["e"+i]||{})[UID]={...me0,jt:Date.now()}}drawXAll();
  xSay(x.nm+" 출정에 참가했다. "+xHM(x.T0)+"에 자동으로 출발한다. 준비한 아이템과 마법은 참가한 순간을 기준으로 쓰인다.")}
 catch(e){xSay("참가하지 못했다. 잠시 뒤에 다시 시도해 보자. 계속 안 되면 캐릭터가 서버에 저장돼 있는지(위쪽 경고)를 확인해야 한다.",1)}}
async function xLeave(){const mj=C.mj;if(!mj||Date.now()>=xInfo(mj.s,mj.i).close)return;try{await DB.doc(xSeat(mj.s,mj.i)+"/"+UID).delete()}catch(e){}
 C.mj=null;save();if(xS===mj.s&&xSnap["e"+mj.i])delete xSnap["e"+mj.i][UID];drawXAll();xSay("출정 참가를 취소했다.");if(!$("#v-xm").hidden)hub()}
// 처음부터 다시 계산한다. 같은 씨앗, 같은 파티, 같은 표라면 누구의 화면에서든 결과가 같다.
function xReplay(X){const x=X.x,r={code:x.id,pl:{},total:x.total,seq:[],evs:[],df:XDF[x.d].df,rw:XDF[x.d].rw,dzm:XDF[x.d].dz||1,ab:x.d===4?1:0,zv:x.v},L=[];let wait=null;
 Object.keys(X.pl).forEach(u=>r.pl[u]=X.pl[u]);
 seeded(hs32(x.id+"#sim"),()=>{startSim(r);let c=0;
  while(r.pend&&!r.fin){const xe=EVM[r.pend.id];if(!xe){r.pend=null;simStep(r);continue}
   const cx=evCtx(r),ops=xe.o.map((o,i)=>i).filter(i=>!xe.o[i].req||xe.o[i].req(cx)),h=(cx.tr("번뜩임")||cx.tr("예민함"))?xe.o.findIndex(o=>o.ok):-1,Ws=x.T0+r.seq.length*XSTEP+c*CHOICE_MS;
   L.push(r.seq.length);r.ch={id:r.pend.id,v:r.pend.v,k:c,until:Ws+CHOICE_MS,ops,h};
   if(X.picks[c]==null){wait={c,Ws,Wd:Ws+CHOICE_MS};break}resolveChoice(r,X.picks[c]);c++}});
 const lineAt=j=>x.T0+(j+1)*XSTEP+CHOICE_MS*L.filter(l=>l<=j).length;
 return{r,wait,lineAt,done:!!r.fin&&!wait,endAt:lineAt(r.seq.length-1)+800}}
function xAbandon(why){if(!C)return;const j=C.mj;C.mj=null;if(XR)XR.gone=1;save();note("march",why);drawXAll();if(j)xAuto=j.id}
/* 진행 중 표시(xBusy)가 40초 넘게 풀리지 않으면 멈춘 것으로 보고 풀어 준다(새로고침 없이 출정이 다시 진행된다). */
let xBusyT=0;
async function xTick(){const j=C&&C.mj;if(xBusy&&Date.now()-xBusyT>40000)xBusy=false;if(!j||!XON()||xBusy||Date.now()<j.T0)return;xBusy=true;xBusyT=Date.now();
 try{const x=xInfo(j.s,j.i),late=Date.now()-x.T0;if(!XR||XR.id!==x.id)XR={id:x.id,x,pl:null,picks:[],fin:"",drawn:-1};
  if(late>X_HARD_LIMIT&&!XR.fin){xAbandon(x.nm+" 출정이 너무 오래 끝나지 않아 정리했다. 다시 참가할 수 있다.");return}
  if(!XR.pl){let d=null;try{d=(await DB.doc(xSeat(x.s,x.i)).get()).data()||{}}catch(e){if(late>X_FETCH_GIVEUP)xAbandon(x.nm+" 출정 정보를 서버에서 불러오지 못해 정리했다. 잠시 뒤에 다시 참가해 보자.");return}
   const ids=xParty(x,d);
   if(!ids.includes(UID)){xAbandon(ids.length?"정원이 차서 "+x.nm+" 출정에 참가하지 못했다.":x.nm+" 출정 기록을 찾지 못해 출발하지 못했다.");return}
   XR.pl={};ids.forEach(u=>XR.pl[u]=d[u]);
   // 파티가 확정되어 실제로 출발하는 순간 한 번만 알린다(새로고침해도 다시 울리지 않는다).
   if(!j.st){j.st=1;save();xSound("start");toast("⚑ "+x.nm+" 출정 출발! 파티와 함께 마수를 향해 나아간다.")}}
  let R0=xReplay(XR);
  if(R0.wait&&Date.now()>=R0.wait.Wd+3000){let p=[];
   try{const vs=await once(DB.collection(xVote(x.id,R0.wait.c)));vs.docs.forEach(d=>{const v=d.data();if(v&&XR.pl[d.id]&&(typeof v.ts!=="number"||v.ts<=R0.wait.Wd+1000))p.push(Number(v.i))})}
   catch(e){if(Date.now()<R0.wait.Wd+X_VOTE_GIVEUP)return;p=[]}// 표를 끝내 못 읽으면 운명에 맡기고 계속 진행한다.
   XR.picks[R0.wait.c]=p;R0=xReplay(XR)}
  XR.res=R0;
  if(R0.done&&Date.now()>=R0.endAt&&!XR.fin){let h="";try{h=settle(R0.r)}catch(e){h="<p>결과를 정리하는 중에 문제가 생겼다.</p>"}XR.fin=h||"<p>이미 결과를 받은 출정이다.</p>";C.mj=null;save();drawXAll();if(h)xSound(R0.r&&R0.r.ok?"win":"lose")}}
 catch(e){}finally{xBusy=false}}
function xView(){show("xm");xChK="";$("#xpl").dataset.k="";if(XR)XR.drawn=-1;xRender()}
function xRender(){if($("#v-xm").hidden)return;const now=Date.now(),mj=C.mj,X=XR&&(!mj||XR.id===mj.id)?XR:null,x=X?X.x:mj?xInfo(mj.s,mj.i):null;if(!x){hub();return}
 const stuck=!!mj&&!(X&&X.fin)&&now>=x.T0&&(X&&X.res?now>X.res.endAt+60000:now>x.T0+180000);$("#xq").hidden=!stuck;
 $("#xt").textContent=x.nm+" · "+XDF[x.d].n;
 const pl=X&&X.pl?X.pl:((xS===x.s&&xSnap["e"+x.i])||{}),ids=X&&X.pl?Object.keys(pl):xParty(x,pl),l=$("#xpl"),key=ids.join(",");
 if(l.dataset.k!==key){l.dataset.k=key;l.innerHTML="";ids.forEach(u=>{const p=pl[u]||{},d=elT("div","chip",(p.tn?"「"+String(p.tn).slice(0,20)+"」 ":"")+cn(u,p.n)+(u===UID?" (나)":"")+" · "+(p.g||"-")+"등급 "+(p.a||"")+" · 전투력 "+(p.p||0));d.style.textAlign="left";if(u!==UID){d.style.cursor="pointer";d.onclick=()=>openProfile(u)}l.appendChild(d)})}
 const g=$("#xlg"),cv=$("#xch");
 if(!X||!X.res){$("#xs").textContent=X&&X.gone?"이번 출정에는 참가하지 못했다.":now<x.T0?"전투 "+x.total+"번 예정 · "+(now<x.close?"마감까지 "+xFmt(x.close-now)+" · ":"참가 마감 · ")+"출발까지 "+xFmt(x.T0-now):"출발 준비 중...";
  if(g.dataset.w!=="1"){g.dataset.w="1";g.innerHTML="<p>출발을 기다리고 있다.</p>"}cv.hidden=true;return}
 g.dataset.w="";const R0=X.res,r=R0.r,w=R0.wait;let n=0;while(n<r.seq.length&&R0.lineAt(n)<=now)n++;
 if(X.drawn!==n||X.fd!==!!X.fin){X.drawn=n;X.fd=!!X.fin;g.innerHTML=r.seq.slice(0,n).map(t=>"<p>"+t+"</p>").join("")||"<p>출발한다...</p>";if(X.fin&&n>=r.seq.length)g.innerHTML+=X.fin}
 $("#xs").textContent=X.fin?"출정 종료":w&&n>=r.seq.length?(now<w.Wd?"선택의 순간":"표를 세는 중"):"출정 중";
 if(w&&n>=r.seq.length&&now<w.Wd&&X.pl[UID]&&EVM[r.ch.id]){const k=x.id+"_"+w.c;
  if(xChK!==k){xChK=k;xMyV=null;cv.hidden=false;cv.innerHTML="";const xe=EVM[r.ch.id];cv.appendChild(elT("p","choice-q",vtx(xe.q,r.ch.v)));const row=elT("div","row");
   r.ch.ops.forEach(i=>{const o=xe.o[i],b=elT("button","chip",o.l+(o.rl?" ("+o.rl+")":"")+(r.ch.h===i?" ✦":""));b.type="button";b.setAttribute("aria-pressed","false");
    b.onclick=async()=>{if(Date.now()>=w.Wd)return;xMyV=i;row.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",c===b?"true":"false"));try{await DB.doc(xVote(x.id,w.c)+"/"+UID).set({i,ts:{".sv":"timestamp"}});DB.doc(xVote(x.id,w.c)+"/ts").set(Date.now()).catch(()=>{})}catch(e){}};row.appendChild(b)});
   cv.appendChild(row);if(r.ch.h>=0)cv.appendChild(elT("p","hint","✦ 파티의 직감(번뜩임·예민함)이 답을 속삭인다."));cv.appendChild(elT("p","hint x-ct",""))}
  const t=cv.querySelector(".x-ct");if(t)t.textContent=(xMyV!=null?"골랐다. ":"")+"남은 시간 "+Math.max(0,Math.ceil((w.Wd-now)/1000))+"초 · 파티원이 함께 고른다. 표가 갈리면 무작위로 정해진다."}
 else{cv.hidden=true;xChK=""}}
$("#xb").onclick=()=>hub();
// 출정이 멈춘 것처럼 보이면(예정보다 1분 넘게 안 끝나거나, 출발 후 3분째 준비 중) 직접 정리할 수 있다.
$("#xq").onclick=()=>{if(!confirm("이 출정을 정리하고 빠져나올까? 이번 출정의 보상은 받지 못한다."))return;xAbandon("출정을 직접 정리하고 빠져나왔다.");hub()};
// 마을 화면의 정기 출정 칸 열고 닫기. 이 기기에서 마지막 상태를 기억한다.
function xFold(open){const b=$("#xtog"),box=$("#xbox");if(!b||!box)return;box.hidden=!open;b.textContent=open?"접기 ▲":"펼치기 ▼";b.setAttribute("aria-expanded",open?"true":"false");try{localStorage.setItem("mgr_xopen",open?"1":"0")}catch(e){}if(open)drawXAll()}
$("#xtog").onclick=()=>xFold($("#xbox").hidden);
// 오늘의 의뢰 칸 열고 닫기. 닫아도 제목 옆에 진행 상황이 보인다. 이 기기에서 마지막 상태를 기억한다.
function dqFold(open){const b=$("#dqtog"),box=$("#dqbox");if(!b||!box)return;box.hidden=!open;b.textContent=open?"접기 ▲":"펼치기 ▼";b.setAttribute("aria-expanded",open?"true":"false");try{localStorage.setItem("mgr_dqopen",open?"1":"0")}catch(e){}}
$("#dqtog").onclick=()=>dqFold($("#dqbox").hidden);
// 장기 토벌 칸 열고 닫기. 닫아도 제목 옆에 진행 상황(토벌 중·귀환)이 보인다. 이 기기에서 마지막 상태를 기억한다.
function lhFold(open){const b=$("#lhtog"),box=$("#hlh");if(!b||!box)return;box.hidden=!open;b.textContent=open?"접기 ▲":"펼치기 ▼";b.setAttribute("aria-expanded",open?"true":"false");try{localStorage.setItem("mgr_lhopen",open?"1":"0")}catch(e){}}
$("#lhtog").onclick=()=>lhFold($("#hlh").hidden);
(()=>{let v="1";try{v=localStorage.getItem("mgr_lhopen")||"1"}catch(e){}if(v==="0")lhFold(false)})();
(()=>{let v="1";try{v=localStorage.getItem("mgr_dqopen")||"1"}catch(e){}if(v==="0")dqFold(false)})();
(()=>{let v="1";try{v=localStorage.getItem("mgr_xopen")||"1"}catch(e){}if(v==="0")xFold(false)})();
// 오래된 출정 기록(2시간 전)을 지운다.
async function xSweep(){if(!XON())return;const cur=xSlot();
 try{const s=await once(DB.collection("rooms"));s.docs.forEach(d=>{const m=String(d.id).match(/^x[mv]x?(\d+)_/);if(m&&Number(m[1])<cur-XKEEP)DB.doc("rooms/"+d.id).delete().catch(()=>{})})}catch(e){}}
setInterval(()=>{if(!C||!DB)return;const now=Date.now(),hubOn=!$("#v-hub").hidden,rmOn=!$("#v-rooms").hidden,xOn=!$("#v-xm").hidden;
 if(XON()&&(hubOn||rmOn||xOn)){watchX(xOn&&C.mj&&now<C.mj.T0?C.mj.s:xLs());const ph=xLs()+"_"+(C.mj?C.mj.id+(now>=C.mj.T0):"");if(ph!==xPh){xPh=ph;drawXAll()}document.querySelectorAll(".x-cd").forEach(e=>e.textContent=xCdTxt())}
 else if(unX){unX();unX=null;xS=-1}
 if(C.mj&&now>=C.mj.T0&&xAuto!==C.mj.id&&(hubOn||rmOn)){xAuto=C.mj.id;xView()}
 xTick().then(xRender)},1000);
// 무기 번호: 0 칼, 1 총, 2 낫, 3 방패, 4 오브, 5 완드, 6 스태프. 장착 중인 무기만 효과가 있다.
const eq=i=>C.wp===i,wup=i=>wlv(i)*(i===0?2:1);
const pr=p=>Math.ceil(p*(C.v==="A"?.9:1)*(1-.02*facLv("market"))*(1-petEff("shop"))*(disMine()==="fire"?1.2:1));
/* 상점. 물건을 사거나 장착해도 보던 위치를 그대로 지키고, 결과는 화면 위 알림으로도 보여 준다.
   아이템은 수량(shopQ)을 골라 한 번에 여러 개 살 수 있다. 하루 제한·보유 제한이 있는 아이템은 남은 만큼만 산다. */
let shopQ=1;
function itemMax(id){C.inv=C.inv||{};if(id==="charm")return Math.max(0,CHARM_MAX-charmToday());if(id==="candle")return (C.inv.candle||0)>=1?0:1;return 99}
function shop(msg){C.wps=C.wps||[];const again=!$("#v-shop").hidden,y=window.scrollY;show("shop");if(again)window.scrollTo(0,y);
 $("#sg").textContent="보유 골드 "+(C.gd||0)+". 골드는 토벌과 시련에서 얻는다."+(C.v==="A"?" A마을 주민은 10% 할인을 받는다.":"");
 const sm=$("#sm");sm.style.color="var(--mu)";sm.textContent=msg||"";if(msg&&again)toast(msg);
 const w=$("#wl");w.innerHTML="";C.wps=C.wps||[];WP.forEach((it,i)=>{const own=C.wps.includes(i),on=C.wp===i,pc=pr(it[2]),st=on?"장착 중":own?"장착하기":pc+"골드";const b=document.createElement("button");b.type="button";b.className="chip sq";
  b.innerHTML="<b></b><small class='item-feature'></small><small></small>";b.querySelector("b").textContent=it[0]+(wlv(i)?" +"+wlv(i):"");b.querySelector(".item-feature").textContent=it[1]+" 전투력 +"+it[3]+".";b.querySelectorAll("small")[1].textContent=st;
  b.title=it[1]+" 전투력 +"+it[3];b.setAttribute("aria-label",it[0]+", "+st+". 전투력 +"+it[3]);
  b.disabled=!own&&(C.gd||0)<pc;b.setAttribute("aria-pressed",on?"true":"false");
  b.onclick=()=>{if(on){C.wp=-1;save();shop(it[0]+"을(를) 해제했다.");return}if(!own){if((C.gd||0)<pc)return;C.gd-=pc;C.wps.push(i);titleState();C.stats.purchases=(C.stats.purchases||0)+1}C.wp=i;save();checkTitles();shop(it[0]+"을(를) 장착했다.")};w.appendChild(b)});
 // 구매 수량 고르기
 const qb=$("#shopq");qb.innerHTML="";const qlab=elT("span","shopq-l","구매 수량");qb.appendChild(qlab);
 const set=n=>{shopQ=Math.max(1,Math.min(99,n|0||1));shop()};
 const mkB=(t,f,lab)=>{const b=elT("button","chip",t);b.type="button";if(lab)b.setAttribute("aria-label",lab);b.onclick=f;return b};
 const inp=elT("input");inp.type="number";inp.min="1";inp.max="99";inp.value=shopQ;inp.id="shopqn";inp.setAttribute("aria-label","구매 수량");inp.onchange=()=>set(Number(inp.value));
 qb.append(mkB("−",()=>set(shopQ-1),"하나 줄이기"),inp,mkB("+",()=>set(shopQ+1),"하나 늘리기"));[1,5,10].forEach(n=>{const b=mkB(n+"개",()=>set(n));b.setAttribute("aria-pressed",shopQ===n?"true":"false");qb.appendChild(b)});
 const il=$("#il");il.innerHTML="";C.inv=C.inv||{};ITM.forEach(x=>{const id=x[0],pc=pr(x[3]),b=document.createElement("button");b.type="button";b.className="chip sq";
  const mx=itemMax(id),n=Math.min(shopQ,mx),cost=pc*n,lim=id==="charm",ct2=lim?charmToday():0;
  const cnt="보유 "+(C.inv[id]||0)+(lim?" · 오늘 "+ct2+"/"+CHARM_MAX:"")+(id==="candle"?" · 최대 1개":"");
  const st=mx<=0?(id==="candle"?"이미 가지고 있다":"오늘은 품절"):n>1?pc+"골드 × "+n+" = "+cost+"골드":pc+"골드"+(shopQ>1&&n<shopQ?" (1개만 살 수 있다)":"");
  b.innerHTML="<b></b><small class='item-feature'></small><small></small><small></small>";const bs=b.querySelectorAll("small");b.querySelector("b").textContent=x[1];bs[0].textContent=x[2];bs[1].textContent=st;bs[2].textContent=cnt;
  b.title=x[2];b.setAttribute("aria-label",x[1]+", "+st+", "+cnt+". "+x[2]);b.disabled=mx<=0||(C.gd||0)<cost;
  b.onclick=()=>{const k=Math.min(shopQ,itemMax(id)),c=pc*k;if(k<=0||(C.gd||0)<c)return;if(lim)C.daily={d:today(),charm:charmToday()+k};
   C.gd-=c;C.inv[id]=(C.inv[id]||0)+k;dexAdd("it",id);titleState();C.stats.purchases=(C.stats.purchases||0)+k;C.stats.maxGold=Math.max(C.stats.maxGold||0,C.gd||0);save();checkTitles();
   shop(x[1]+(k>1?" "+k+"개를":"을(를)")+" 샀다. ("+c+"골드)")};il.appendChild(b)})}
$("#nav").onclick=e=>{const v=e.target.dataset&&e.target.dataset.v;if(v==="hub")hub();if(v==="shop")shop();if(v==="chat")chat();if(v==="friends")friends();if(v==="board")board(null);if(v==="ntc")ntcView();if(v==="arena")arena();if(v==="bag")bag();if(v==="titles")(recTab==="ttl"?titles():dex());if(v==="inbox")inbox();if(v==="roster")roster()};

/* 채팅: 단체 채팅은 모두가 보는 공용방이고, 1:1은 두 사람이 같은 대화 키를 쓴다 */
let ct="g",peer=null,unC=null,unP=null,lastSend=0;
const cmsg=t=>{$("#cm2").style.color="var(--bad)";$("#cm2").textContent=t};
function chat(){show("chat");admUI();$("#cm2").textContent="";if(!DB){cmsg("채팅 기능을 쓸 수 없다.");return}regPlayer();setT(ct)}
function sync(){$("#cin").hidden=ct==="a"||(ct==="d"&&!peer)}
/* 대화 그리기: 맨 아래를 보고 있을 때만 새 메시지를 따라 내려간다.
   위로 올려서 지난 대화를 읽는 중이면 그 자리를 지키고, 대신 '새 메시지 ↓' 버튼을 띄운다. th는 대화방 구분용이다. */
function newBtn(el,on){let b=document.getElementById(el.id+"-nb");
 if(!b){b=elT("button","newmsg","새 메시지 ↓");b.type="button";b.id=el.id+"-nb";b.hidden=true;b.onclick=()=>{el.scrollTop=el.scrollHeight;b.hidden=true};el.after(b);
  el.addEventListener("scroll",()=>{if(el.scrollHeight-el.scrollTop-el.clientHeight<40)b.hidden=true})}
 b.hidden=!on}
async function dmPng(el,title){const ms=(el&&el._ms||[]).slice();if(!ms.length)return toast("저장할 대화가 없다.");
 try{if(document.fonts&&document.fonts.ready)await document.fonts.ready}catch(e){}
 const light=document.documentElement.dataset.theme==="light",K=light?{bg:"#fbf7ee",card:"#ffffff",ink:"#2a2233",mu:"#7a6f80",me:"#8a6510",you:"#b0304a",ln:"#d9cba5",gold:"#8a6510"}:{bg:"#0f0b18",card:"#1a1428",ink:"#ece6f5",mu:"#9a90ab",me:"#d8c79a",you:"#e49aa9",ln:"#3a2f52",gold:"#e6c56a"};
 const FF=getComputedStyle(document.body).fontFamily||"sans-serif",W=DM_PNG_W,P=28,TW=W-P*2-24,LH=24;
 const mc=document.createElement("canvas").getContext("2d");
 const wrap=(t,f,max)=>{mc.font=f;const out=[];String(t).split("\n").forEach(par=>{let line="";for(const ch of Array.from(par)){if(mc.measureText(line+ch).width>max&&line){out.push(line);line=ch}else line+=ch}out.push(line)});return out};
 const two=n=>String(n).padStart(2,"0"),dt=t=>{const d=new Date(Number(t)||0);return d.getFullYear()+"."+two(d.getMonth()+1)+"."+two(d.getDate())+" "+two(d.getHours())+":"+two(d.getMinutes())};
 const fN="bold 15px "+FF,fT="16px "+FF,fS="12px "+FF;
 // 메시지마다 높이를 미리 잰다.
 const items=ms.map(m=>{const nm=cn(m.u,m.n)+(m.u===UID?" (나)":""),lines=wrap(m.x||"",fT,TW);return{m,nm,lines,h:16+20+lines.length*LH+12}});
 const HEAD=96,FOOT=44,PH=Math.round(W*297/210),pages=[];let cur=[],hh=HEAD;items.forEach(it=>{if(cur.length&&hh+it.h+8+FOOT>PH){pages.push(cur);cur=[];hh=HEAD}cur.push(it);hh+=it.h+8});if(cur.length)pages.push(cur);
 const stamp=(()=>{const d=new Date();return d.getFullYear()+two(d.getMonth()+1)+two(d.getDate())+"_"+two(d.getHours())+two(d.getMinutes())})(),safe=String(title||"대화").replace(/와의 1:1 대화| \(열람 전용\)/g,"").replace(/[\\/:*?"<>|\s]+/g,"_").slice(0,40);
 const jp=[];for(let pi=0;pi<pages.length;pi++){const its=pages[pi],H=HEAD+its.reduce((a,it)=>a+it.h+8,0)+FOOT,cv=document.createElement("canvas");cv.width=W*DM_PNG_X;cv.height=H*DM_PNG_X;const x=cv.getContext("2d");x.scale(DM_PNG_X,DM_PNG_X);x.textBaseline="top";
  x.fillStyle=K.bg;x.fillRect(0,0,W,H);
  x.fillStyle=K.gold;x.font="bold 13px "+FF;x.fillText("魔法 成長記錄 · 1:1 대화",P,22);
  x.fillStyle=K.ink;x.font="bold 20px "+FF;x.fillText(wrap(title||"",x.font=("bold 20px "+FF),W-P*2)[0]||"",P,42);
  x.fillStyle=K.mu;x.font=fS;x.fillText(dt(its[0].m.ts)+" ~ "+dt(its[its.length-1].m.ts)+(pages.length>1?"   ("+(pi+1)+"/"+pages.length+")":""),P,70);
  let y=HEAD;its.forEach(it=>{const mine=it.m.u===UID;x.fillStyle=K.card;x.strokeStyle=K.ln;x.lineWidth=1;const r=12,bx=P,bw=W-P*2;
   x.beginPath();if(x.roundRect)x.roundRect(bx,y,bw,it.h,r);else x.rect(bx,y,bw,it.h);x.fill();x.stroke();
   x.fillStyle=mine?K.me:K.you;x.fillRect(bx,y+10,3,it.h-20);
   x.font=fN;x.fillStyle=mine?K.me:K.you;x.fillText(it.nm,bx+14,y+12);let nx=bx+14+x.measureText(it.nm).width+8;
   if(typeof it.m.t==="string"&&it.m.t){x.font=fS;const tt="「"+it.m.t.slice(0,20)+"」";x.fillStyle=K.gold;x.fillText(tt,nx,y+14);nx+=x.measureText(tt).width+8}
   x.font=fS;x.fillStyle=K.mu;const tm=dt(it.m.ts);x.fillText(tm,bx+bw-14-x.measureText(tm).width,y+14);
   x.font=fT;x.fillStyle=K.ink;it.lines.forEach((ln,i)=>x.fillText(ln,bx+14,y+38+i*LH));y+=it.h+8});
  x.fillStyle=K.mu;x.font=fS;x.fillText("저장한 시각 "+dt(Date.now()),P,H-28);
  const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.92));if(!blob){toast("PDF를 만들지 못했다.");return}
  jp.push({b:new Uint8Array(await blob.arrayBuffer()),w:cv.width,h:cv.height,pw:595.28,ph:595.28*H/W})}
 const pdf=pdfJpeg(jp),a=document.createElement("a"),u=URL.createObjectURL(pdf);a.href=u;a.download="1대1_"+safe+"_"+stamp+".pdf";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);
 toast("대화를 PDF로 저장했다"+(pages.length>1?" ("+pages.length+"쪽).":"."))}
/* JPEG 그림들을 한 쪽씩 담은 PDF를 만든다(외부 라이브러리 없이). 쪽 크기는 A4 너비(595pt)에 그림 비율을 맞춘다. */
function pdfJpeg(pgs){const enc=new TextEncoder(),parts=[],offs=[];let len=0;const put=x=>{const b=typeof x==="string"?enc.encode(x):x;parts.push(b);len+=b.length};
 const n=2+pgs.length*3,obj=(i,body)=>{offs[i]=len;put(i+" 0 obj\n");body();put("\nendobj\n")};
 put("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
 obj(1,()=>put("<< /Type /Catalog /Pages 2 0 R >>"));
 obj(2,()=>put("<< /Type /Pages /Count "+pgs.length+" /Kids ["+pgs.map((_,i)=>(3+i*3)+" 0 R").join(" ")+"] >>"));
 pgs.forEach((g,i)=>{const P=3+i*3,I=P+1,S=P+2,pw=g.pw.toFixed(2),ph=g.ph.toFixed(2),cs="q "+pw+" 0 0 "+ph+" 0 0 cm /Im0 Do Q";
  obj(P,()=>put("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 "+pw+" "+ph+"] /Resources << /XObject << /Im0 "+I+" 0 R >> >> /Contents "+S+" 0 R >>"));
  obj(I,()=>{put("<< /Type /XObject /Subtype /Image /Width "+g.w+" /Height "+g.h+" /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length "+g.b.length+" >>\nstream\n");put(g.b);put("\nendstream")});
  obj(S,()=>put("<< /Length "+cs.length+" >>\nstream\n"+cs+"\nendstream"))});
 const xr=len;put("xref\n0 "+(n+1)+"\n0000000000 65535 f \n");for(let i=1;i<=n;i++)put(String(offs[i]).padStart(10,"0")+" 00000 n \n");
 put("trailer\n<< /Size "+(n+1)+" /Root 1 0 R >>\nstartxref\n"+xr+"\n%%EOF");
 return new Blob(parts,{type:"application/pdf"})}
function paint(el,ms,th){th=th==null?"":String(th);ms=ms.filter(m=>m&&!m.bt);const same=el.dataset.th===th,nearB=el.scrollHeight-el.scrollTop-el.clientHeight<40,top=el.scrollTop,prevLast=Number(el.dataset.last||0);
 ms.sort((a,b)=>a.ts-b.ts);el._ms=ms;const last=ms.length?Number(ms[ms.length-1].ts)||0:0;el.dataset.th=th;el.dataset.last=last;
 const keep=()=>{if(!same||nearB){el.scrollTop=el.scrollHeight;newBtn(el,false)}else{el.scrollTop=top;if(last>prevLast)newBtn(el,true)}};
 el.innerHTML="";if(!ms.length){el.innerHTML="<div class='cm-empty'><span>✦</span><p>아직 대화가 없다.</p><small>먼저 인사를 건네 보자.</small></div>";newBtn(el,false);return}
 /* 말풍선: 내 말은 오른쪽, 다른 사람 말은 왼쪽. 같은 사람이 3분 안에 이어 말하면 이름과 얼굴을 한 번만 보인다. 날짜가 바뀌면 구분선을 넣는다. */
 let pu=null,pt=0,pd="",need=false;
 ms.forEach(m=>{const me=m.u===UID,ts=Number(m.ts)||0,d=ts?new Date(ts):null,dk=d?d.getFullYear()+"."+(d.getMonth()+1)+"."+d.getDate():"";
  if(dk&&dk!==pd){const sep=elT("div","cm-day",(d.getMonth()+1)+"월 "+d.getDate()+"일");el.appendChild(sep);pu=null}pd=dk||pd;
  const cont=pu===m.u&&ts-pt<180000;pu=m.u;pt=ts;
  const p=elT("div","cm"+(me?" me":"")+(cont?" cont":""));
  const nm=cn(m.u,m.n),av=elT("span","cm-av",(nm||"?").slice(0,1));if(!me&&m.u){av.dataset.u=m.u;if(!avSet(av,m.u))need=true}
  const body=elT("div","cm-body"),head=elT("div","cm-head"),b=elT("b","cm-n",nm+(me?" (나)":""));
  if(m.u&&!me){b.tabIndex=0;b.setAttribute("role","button");b.classList.add("link");b.onclick=()=>openProfile(m.u);b.onkeydown=e=>{if(e.key==="Enter")openProfile(m.u)};av.onclick=()=>openProfile(m.u);av.classList.add("link")}
  head.appendChild(b);if(typeof m.t==="string"&&m.t)head.appendChild(elT("span","ttl-chip",m.t.slice(0,20)));
  const row=elT("div","cm-row"),bub=elT("span","cm-x",String(m.x==null?"":m.x)),tm=elT("small","cm-t",d?String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"):"");
  row.append(bub,tm);body.append(head,row);p.append(av,body);el.appendChild(p)});if(need)avLoad();keep()}
/* 채팅 프로필 사진: 등록자 목록(players)에 이미 들어 있는 작은 사진을 쓴다. 목록은 plAll이 모아 두므로 따로 많이 받지 않는다.
   사진이 없는 사람은 이름 첫 글자를 그대로 보인다. 목록에 없는 새 사람이 보이면 5분에 한 번까지만 목록을 다시 받는다. */
let AVM=null,AVK=null,AVT=-1,avBusy=false,avLast=0;
function avMap(){if(PLC&&AVT!==PLT){AVM={};AVK=new Set();PLC.docs.forEach(d=>{AVK.add(d.id);const q=d.data();if(q&&typeof q.im==="string"&&/^(data:image\/|https:)/.test(q.im))AVM[d.id]=q.im});AVT=PLT}return AVM}
function avSet(av,u){const mp=avMap();if(!mp)return false;const im=mp[u];if(im&&!av.querySelector("img")){const i=document.createElement("img");i.src=im;i.alt="";i.loading="lazy";av.textContent="";av.appendChild(i);av.classList.add("has")}return AVK.has(u)||Date.now()-avLast<300000}
function avLoad(){if(!DB||avBusy)return;if(AVK&&Date.now()-avLast<300000)return;avBusy=true;avLast=Date.now();
 plAll(AVK?0:undefined).then(()=>{avBusy=false;document.querySelectorAll(".cm-av[data-u]").forEach(a=>avSet(a,a.dataset.u))},()=>{avBusy=false})}
function setT(t){ct=t;unC&&unC();unC=null;unP&&unP();unP=null;
 document.querySelectorAll("#ct button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.t===t?"true":"false"));
 $("#cg").hidden=t!=="g";$("#cvl").hidden=t!=="v";$("#cd").hidden=t!=="d";$("#ca").hidden=t!=="a";
 if(t==="g")unC=DB.collection("chat").orderBy("ts","desc").limit(40).onSnapshot(s=>paint($("#gl"),s.docs.map(d=>d.data()).filter(m=>m&&!m.vc),"g"),e=>cmsg("채팅을 불러오지 못했다."),POLL_FAST);
 // 마을 채팅: 단체 채팅과 같은 저장 공간을 쓰되 이름이 "c_{마을}_"로 시작한다. 내 마을의 대화만 불러온다.
 else if(t==="v"){vcNew=false;vcMark();$("#cvh").textContent=VL[C.v].n+" 주민끼리 나누는 채팅이다. 다른 마을 주민에게는 보이지 않는다.";C.vcSeen=srvNow();save();updNav();
  unC=DB.collection("chat").prefix("c_"+C.v+"_").limit(40).onSnapshot(s=>{const ms=s.docs.map(d=>d.data()).filter(m=>m&&m.vc===C.v);paint($("#vcl"),ms,"v"+C.v);C.vcSeen=srvNow()},e=>cmsg("마을 채팅을 불러오지 못했다."),POLL_FAST)}
 else if(t==="a")watchAdm();else{peer=null;$("#dt").hidden=true;$("#cpick").hidden=false;$("#pl2").dataset.sig="";
  // 목록은 친구 먼저, 그다음 이름순으로 고정한다. 이름·등급·안 읽음 표시가 바뀔 때만 다시 그려서 화면이 흔들리지 않는다.
  dmBackfill();{let alive=true;const go=()=>plAll(PL_TTL).then(s=>{if(!alive)return;peerDocs=s.docs.map(d=>[d.id,d.data()]);drawPeers()},()=>cmsg("플레이어 목록을 불러오지 못했다."));go();const iv=setInterval(go,60000);unP=()=>{alive=false;clearInterval(iv)}}}
 sync()}
/* 1:1 대화 상대 목록: 최근에 대화를 주고받은 사람이 맨 위. 대화한 적 없는 사람은 그 아래에 친구 먼저, 이름순.
   C.dml = 상대별 마지막으로 메시지를 주고받은 시각(내가 보낸 것, 받은 것 모두). 순서가 바뀔 때만 다시 그린다. */
let peerDocs=[],dmBackfilled=false;
// 이 기능 전에 주고받은 대화도 목록에 나오도록, 기록이 없는 친구와의 대화를 한 번 찾아본다.
async function dmBackfill(){if(dmBackfilled||!C||!DB||!AUTH.uid)return;dmBackfilled=true;C.dml=C.dml||{};const ids=Object.keys(C.fr||{}).filter(u=>!C.dml[u]).slice(0,30);let ch=false;
 await Promise.all(ids.map(async u=>{try{const k=[UID,u].sort().join("_"),sn=await once(DB.collection("dm").where("k","==",k));const t=Math.max(0,...sn.docs.map(d=>Number((d.data()||{}).ts)||0));if(t>0){C.dml[u]=Math.max(C.dml[u]||0,t);ch=true}}catch(e){}}));
 if(ch){save();if(!$("#v-chat").hidden&&ct==="d")drawPeers()}}
const agoTxt=t=>{const m=Math.floor((Date.now()-t)/60000);return m<1?"방금":m<60?m+"분 전":m<1440?Math.floor(m/60)+"시간 전":Math.floor(m/1440)+"일 전"};
function dmTouch(id,t){if(!C||!id)return;C.dml=C.dml||{};if((C.dml[id]||0)>=t)return;C.dml[id]=t;const ks=Object.keys(C.dml);if(ks.length>80)ks.sort((a,b)=>C.dml[a]-C.dml[b]).slice(0,ks.length-80).forEach(k=>delete C.dml[k]);if(!$("#v-chat").hidden&&ct==="d")drawPeers()}
function drawPeers(){const l=$("#pl2");if(!l||!C)return;const fr=C.fr||{},dl=C.dml||{},nm=p=>String((p&&p.n)||"");
 const ps=peerDocs.filter(x=>x[0]!==UID&&x[1]&&(dl[x[0]]||(C.dmu&&C.dmu[x[0]])||peer===x[0])).sort((a,b)=>(dl[b[0]]||0)-(dl[a[0]]||0)||(fr[b[0]]?1:0)-(fr[a[0]]?1:0)||nm(a[1]).localeCompare(nm(b[1]),"ko")).slice(0,60);
 const sig=ps.map(([id,p])=>id+"|"+nm(p)+"|"+tiName(p.ti,p.tn)+"|"+p.g+"|"+p.a+"|"+(C.dmu&&C.dmu[id]?1:0)+"|"+(ADM[id]?1:0)+"|"+(dl[id]?agoTxt(dl[id]):"")).join(",");if(l.dataset.sig===sig)return;l.dataset.sig=sig;l.innerHTML="";
 if(!ps.length){l.innerHTML="<p class='hint'>아직 대화를 나눈 상대가 없다.</p>";const b=elT("button","btn g","친구 목록에서 대화 시작하기");b.type="button";b.onclick=()=>friends();l.appendChild(b)}
 ps.forEach(([id,p])=>{const b=document.createElement("button");b.type="button";b.className="chip";b.style.textAlign="left";b.dataset.id=id;b.textContent=(C.dmu&&C.dmu[id]?"● ":"")+(fr[id]?"☍ ":"")+cn(id,p.n)+(tiName(p.ti,p.tn)?" 「"+tiName(p.ti,p.tn)+"」":"")+" ("+p.g+"등급 "+p.a+")"+(dl[id]?" · "+agoTxt(dl[id]):"");b.setAttribute("aria-pressed",peer===id?"true":"false");b.onclick=()=>openDM(id,p.n);b.style.flex="1";
  const w=document.createElement("div");w.style.cssText="display:flex;gap:8px";const pb=document.createElement("button");pb.type="button";pb.className="chip";pb.style.cssText="flex:0 0 auto;min-width:0;padding:10px 14px";pb.textContent="프로필";pb.onclick=()=>openProfile(id);w.append(b,pb);l.appendChild(w)})}
setInterval(()=>{if(C&&!$("#v-chat").hidden&&ct==="d"&&!$("#cpick").hidden)drawPeers()},60000);
function openDM(id,n){peer=id;unC&&unC();$("#cpick").hidden=true;if(C.dmu&&C.dmu[id]){delete C.dmu[id];save();document.querySelectorAll("#pl2 .chip").forEach(c=>{if(c.dataset.id===id)c.textContent=c.textContent.replace(/^● /,"")})}const k=[UID,id].sort().join("_");$("#dh").textContent=n+"와의 1:1 대화";$("#dt").hidden=false;
 document.querySelectorAll("#pl2 .chip").forEach(c=>c.setAttribute("aria-pressed",c.dataset.id===id?"true":"false"));
 unC=DB.collection("dm").where("k","==",k).onSnapshot(s=>paint($("#dl"),s.docs.map(d=>d.data()),k),(e)=>cmsg("대화를 불러오지 못했다. (오류 "+String(e&&e.message||e).replace(/\D/g,"").slice(0,3)+")"),POLL_FAST);sync()}
$("#dpng").onclick=()=>dmPng($("#dl"),$("#dh").textContent);$("#apng").onclick=()=>dmPng($("#alg"),$("#ah").textContent);
/* 채팅 순서: 예전에는 보내는 사람 기기의 시계로 시각(ts)을 적었다. 기기 시계가 30~40초 빠르거나 느린 사람이 있으면
   그 사람 메시지가 맨 아래에 붙어 있다가 다른 메시지들 사이로 끼어 올라가는 일이 생겼다.
   이제 시각은 서버가 직접 적고({".sv":"timestamp"}), 메시지 이름(순서용)도 서버 시계에 맞춘 시각으로 만든다. */
let SKEW=0,skewOk=false;const srvNow=()=>Date.now()+SKEW;
async function clockSync(){if(skewOk||!XON()||!UID)return;skewOk=true;try{const a=Date.now();await DB.doc("wboss/clk/"+UID).set({t:{".sv":"timestamp"}});const b=Date.now();const v=Number(((await DB.doc("wboss/clk/"+UID).get()).data()||{}).t);if(v>0&&b-a<5000)SKEW=Math.round(v-(a+b)/2)}catch(e){skewOk=false}}
// 너무 빨리 연달아 보내면 버리지 않고 잠깐 기다렸다가 보낸다.
let sendT=null;
function send(){const x=$("#ci").value.trim();if(!x)return;const wait=800-(Date.now()-lastSend);if(wait>0){clearTimeout(sendT);sendT=setTimeout(send,wait);return}if(ct==="d"&&!peer)return cmsg("대화 상대를 먼저 골라야 한다.");
 lastSend=Date.now();clockSync();const id=(ct==="v"?"c_"+C.v+"_":"")+srvNow().toString(36)+Math.random().toString(36).slice(2,6),d={u:UID,n:C.n,x:x,ts:{".sv":"timestamp"}};if(ct==="v")d.vc=C.v;if(tiName(C.ti))d.t=tiName(C.ti);const to=ct==="d"?peer:null;if(to)d.k=[UID,to].sort().join("_");
 DB.collection(ct==="d"?"dm":"chat").doc(id).set(d).then(()=>{if(to){dmTouch(to,Date.now());save();dmBell(to,x)}$("#ci").value="";$("#cm2").textContent="";titleState();C.stats.chats=(C.stats.chats||0)+1;save()}).catch(e=>{const c=String(e&&e.message||e);cmsg(c==="401"||c==="403"?"메시지를 보내지 못했다. 서버 규칙에서 쓰기가 막혀 있다. (오류 "+c+")":"메시지를 보내지 못했다. 인터넷 연결을 확인하고 다시 보내 보자. (오류 "+c+")")})}
// 대화 중에는 상대 목록을 접어 두고, 버튼으로 다시 펼친다.
$("#pchg").onclick=()=>{unC&&unC();unC=null;peer=null;$("#dt").hidden=true;$("#cpick").hidden=false;document.querySelectorAll("#pl2 .chip").forEach(c=>c.setAttribute("aria-pressed","false"));sync()};
// 엔터와 보내기 버튼 모두 폼 제출로 처리한다. 휴대폰 한글 키보드에서도 엔터가 확실히 먹는다.
$("#cin").onsubmit=e=>{e.preventDefault();send()};

/* 1:1 새 메시지 알림: 보낼 때 받는 사람의 dmn/{받는 사람}/{보낸 사람}에 '새 메시지 왔음' 표시를 남기고,
   받는 사람은 5초마다 확인해서 화면 위 알림, 짧은 알림음, 채팅 탭 숫자, 알림함으로 알려 준다.
   C.dms = 보낸 사람별로 마지막으로 확인한 시각, C.dmu = 아직 안 읽은 사람, C.dmn = 보낸 사람 이름. */
function toast(t,go){let w=$("#toasts");if(!w){w=elT("div");w.id="toasts";w.setAttribute("aria-live","polite");document.body.appendChild(w)}
 const b=elT("button","toast",t);b.type="button";b.onclick=()=>{b.remove();go&&go()};w.appendChild(b);setTimeout(()=>b.remove(),7000);while(w.children.length>3)w.firstChild.remove()}
function xSound(k){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const a=ding.c||(ding.c=new A());if(a.state==="suspended")a.resume();const t0=a.currentTime+.02;
 (XSND[k]||[]).forEach(([f,st,du])=>{const o=a.createOscillator(),g=a.createGain();o.type="triangle";o.frequency.setValueAtTime(f,t0+st);g.gain.setValueAtTime(.0001,t0+st);g.gain.exponentialRampToValueAtTime(.16,t0+st+.02);g.gain.exponentialRampToValueAtTime(.0001,t0+st+du);o.connect(g);g.connect(a.destination);o.start(t0+st);o.stop(t0+st+du+.05)})}catch(e){}}
function ding(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const a=ding.c||(ding.c=new A()),o=a.createOscillator(),g=a.createGain();o.type="sine";o.frequency.setValueAtTime(880,a.currentTime);o.frequency.setValueAtTime(1175,a.currentTime+.09);g.gain.setValueAtTime(.0001,a.currentTime);g.gain.exponentialRampToValueAtTime(.12,a.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+.35);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.36)}catch(e){}}
const goDM=(u,n)=>{chat();setT("d");openDM(u,n||(C.dmn&&C.dmn[u])||(C.fr&&C.fr[u])||"상대")};
let dmBusy=false;
/* 1:1 알림 신호: 서버 규칙에 dmn 항목이 없어도 동작하도록, 이미 열려 있는 rooms 아래 rooms/xd{받는 사람}/{보낸 사람}에 '보냈다'는 표시만 남긴다.
   메시지 내용은 넣지 않는다(내용은 받는 사람만 읽을 수 있는 dm에서 따로 가져온다). dmn 규칙이 있으면 그쪽도 함께 쓴다. */
function dmBell(to,x){DB.doc("rooms/xd"+to+"/"+UID).set({n:nmOf(),ts:{".sv":"timestamp"}}).catch(()=>{});DB.doc("rooms/xd"+to+"/ts").set({".sv":"timestamp"}).catch(()=>{});
 DB.doc("dmn/"+to+"/"+UID).set({n:nmOf(),x:String(x).slice(0,40),ts:{".sv":"timestamp"}}).catch(()=>{})}
// 그 사람과의 마지막 메시지 내용(알림 미리보기용)
async function dmLast(f){try{const k=[UID,f].sort().join("_"),sn=await once(DB.collection("dm").where("k","==",k)),ms=sn.docs.map(d=>d.data()).filter(m=>m&&m.u===f).sort((a,b)=>(a.ts||0)-(b.ts||0));return ms.length?String(ms[ms.length-1].x||""):""}catch(e){return ""}}
async function checkDM(){if(!AUTH.uid||!C||!DB||dmBusy)return;dmBusy=true;try{const got={};
 const take=(f,v)=>{if(!v||typeof v!=="object"||typeof v.ts!=="number")return;if(!got[f]||v.ts>got[f].ts)got[f]=v};
 try{const d=(await DB.doc("rooms/xd"+UID).get()).data()||{};Object.keys(d).forEach(f=>{if(f!=="ts")take(f,d[f])})}catch(e){}
 try{const s=await once(DB.collection("dmn/"+UID));s.docs.forEach(d=>take(d.id,d.data()))}catch(e){}
 if(!C)return;const first=!C.dms;C.dms=C.dms||{};C.dmu=C.dmu||{};C.dmn=C.dmn||{};let ch=false;
 for(const f of Object.keys(got)){const v=got[f];if(v.ts<=(C.dms[f]||0))continue;C.dms[f]=v.ts;ch=true;const n=String(v.n||"누군가").slice(0,20);C.dmn[f]=n;dmTouch(f,v.ts);
  if(first)continue;// 이 기능이 처음 켜질 때는 예전 메시지로 알림을 쏟아 내지 않는다.
  if(!$("#v-chat").hidden&&ct==="d"&&peer===f)continue;// 지금 그 대화를 보고 있으면 알림 없이 넘어간다.
  C.dmu[f]=1;const x=String(v.x||"")||await dmLast(f);note("dm",n+"님에게서 1:1 메시지가 왔다"+(x?": "+x:"."),f);toast("✉ "+n+(x?": "+x:"님에게서 1:1 메시지가 왔다"),()=>goDM(f,n));ding()}
 if(ch){save();updNav();if(!$("#v-chat").hidden&&ct==="d")document.querySelectorAll("#pl2 .chip").forEach(c=>{if(c.dataset.id&&C.dmu[c.dataset.id]&&!/^● /.test(c.textContent))c.textContent="● "+c.textContent})}}
 catch(e){}finally{dmBusy=false}}
setInterval(()=>{if(!document.hidden)checkDM()},10000);
$("#ct").onclick=e=>{const t=e.target.dataset&&e.target.dataset.t;if(t&&DB)setT(t)};
// 마을 채팅에 새 메시지가 오면(내가 보지 않는 동안) 탭에 ● 표시를 한다. 30초마다 가장 최근 메시지 한 개만 확인한다.
let vcNew=false;function vcMark(){const b=document.querySelector("#ct [data-t=v]");if(b)b.textContent="마을 채팅"+(vcNew?" ●":"")}
setInterval(async()=>{if(!C||!DB||!XON()||!AUTH.uid||document.hidden)return;if(!$("#v-chat").hidden&&ct==="v"){vcNew=false;vcMark();return}
 try{const sn=await once(DB.collection("chat").prefix("c_"+C.v+"_").limit(1)),m=sn.docs.map(d=>d.data())[0];vcNew=!!(m&&m.vc===C.v&&m.u!==UID&&Number(m.ts)>(C.vcSeen||0));vcMark()}catch(e){}},60000);
const dqDef=id=>DQ.find(q=>q[0]===id);
const rwTxt=r=>[r.g?"골드 "+r.g:"",r.m?"마력석 "+r.m:""].filter(Boolean).join(", ");
function ensureDQ(){if(!C)return;titleState();if(C.dq&&C.dq.d===today()&&Array.isArray(C.dq.l)){
  // 목록에서 없어진 의뢰(예: 무기 강화)가 오늘 의뢰에 남아 있으면 다른 의뢰로 바꿔 준다.
  const bad=C.dq.l.filter(q=>!dqDef(q.id));if(bad.length){const have=C.dq.l.map(q=>q.id),pool=DQ.filter(q=>(q[5]||!LOCAL)&&!have.includes(q[0]));
   C.dq.l=C.dq.l.map(q=>{if(dqDef(q.id))return q;const n=pool.length?pool.splice(R(pool.length),1)[0]:null;return n?{id:n[0],b:n[3](C.stats),c:false}:null}).filter(Boolean);save()}return}
 const pool=DQ.filter(q=>q[5]||!LOCAL).slice();const l=[];while(l.length<DQ_N&&pool.length){const q=pool.splice(R(pool.length),1)[0];l.push({id:q[0],b:q[3](C.stats),c:false})}
 C.dq={d:today(),l,bc:false};save()}
const dqProg=q=>{const d=dqDef(q.id);return d?Math.min(d[2],Math.max(0,d[3](C.stats||{})-q.b)):0};
function dqReady(){if(!C||!C.dq||C.dq.d!==today())return 0;let n=C.dq.l.filter(q=>!q.c&&dqDef(q.id)&&dqProg(q)>=dqDef(q.id)[2]).length;if(!C.dq.bc&&C.dq.l.length&&C.dq.l.every(q=>q.c))n++;return n}
function giveRw(r){C.gd=(C.gd||0)+(r.g||0);if(r.m){C.inv=C.inv||{};C.inv.mana=(C.inv.mana||0)+r.m}titleState();C.stats.maxGold=Math.max(C.stats.maxGold||0,C.gd)}
function drawDQ(){const l=$("#dql");if(!l||!C)return;ensureDQ();l.innerHTML="";
 {const sm=$("#dqsum");if(sm){const done=C.dq.l.filter(q=>q.c).length,rd=dqReady();sm.textContent="받음 "+done+" / "+C.dq.l.length+(rd?" · 받을 보상 "+rd+"개":"")}}
 const row=(cls,title,sub,pct,label,dis,fn)=>{const w=document.createElement("div");w.className="dq "+cls;const cp=document.createElement("div");cp.className="dq-copy";const b=document.createElement("b"),sm=document.createElement("small");b.textContent=title;sm.textContent=sub;cp.append(b,sm);
  if(pct!=null){const bar=document.createElement("div"),i=document.createElement("i");bar.className="bar";i.style.width=pct+"%";bar.appendChild(i);cp.appendChild(bar)}
  const bt=document.createElement("button");bt.type="button";bt.className="chip";bt.textContent=label;bt.disabled=dis;bt.onclick=fn;w.append(cp,bt);l.appendChild(w)};
 C.dq.l.forEach(q=>{const d=dqDef(q.id);if(!d)return;const p=dqProg(q),ok=p>=d[2];
  row(q.c?"got":ok?"done":"",d[1],p+" / "+d[2]+" · 보상: "+rwTxt(d[4]),p/d[2]*100,q.c?"받음":ok?"받기":"진행 중",q.c||!ok,()=>{if(q.c||dqProg(q)<d[2])return;q.c=true;giveRw(d[4]);save();checkTitles();hub();const h=$("#hm");h.style.color="var(--mu)";h.textContent="의뢰 완료! "+rwTxt(d[4])+"을(를) 받았다."})});
 const all=C.dq.l.length&&C.dq.l.every(q=>q.c);
 row("bonus"+(C.dq.bc?" got":all?" done":""),"모두 완료 보너스",(all?"오늘 의뢰를 모두 끝냈다.":"의뢰 3개를 모두 받으면 열린다.")+" · 보상: "+rwTxt(DQ_BONUS),null,C.dq.bc?"받음":"받기",C.dq.bc||!all,()=>{if(C.dq.bc||!C.dq.l.every(q=>q.c))return;C.dq.bc=true;giveRw(DQ_BONUS);note("quest","오늘의 의뢰를 모두 끝냈다. "+rwTxt(DQ_BONUS)+"을(를) 받았다.");C.stats.dqAll=(C.stats.dqAll||0)+1;guardAdd(15);save();checkTitles();hub();const h=$("#hm");h.style.color="var(--mu)";h.textContent="오늘의 의뢰를 모두 끝냈다! "+rwTxt(DQ_BONUS)+"을(를) 받았다."})}
const SKID={};Object.keys(SK).forEach(a=>SKID[SK[a].id]={...SK[a],a});
// Firebase는 빈 객체를 저장하지 않으므로, 불러온 뒤 arm이 사라져 있으면 다시 만든다.
function skDay(){if(!C.sk||C.sk.day!==today())C.sk={day:today(),used:0,arm:{}};C.sk.arm=C.sk.arm||{};C.sk.used=C.sk.used||0}
const mpMax=()=>2+Math.max(0,(C.a||[]).length-1);
const mpLeft=()=>{skDay();return mpMax()-C.sk.used-Object.keys(C.sk.arm).length};
const armedSk=id=>{if(!C)return false;skDay();return !!C.sk.arm[id]&&!!SKID[id]&&(C.a||[]).includes(SKID[id].a)};
// 준비해 둔 마법을 실제로 쓴다. 썼으면 true.
const useSk=id=>{if(!armedSk(id))return false;delete C.sk.arm[id];C.sk.used++;dexAdd("sk",id);return true};
function drawSkills(){skDay();const l=$("#bgs");l.innerHTML="";const mx=mpMax(),left=mpLeft();
 const h=$("#skh");h.textContent="오늘 남은 마력 "+left+" / "+mx+" (준비한 마법 몫 제외). 매일 밤 12시에 회복된다.";const dots=elT("span","mp");for(let i=0;i<mx;i++)dots.appendChild(elT("i",i<left?"":"off"));h.appendChild(dots);
 (C.a||[]).forEach(a=>{const k=SK[a];if(!k)return;const on=!!C.sk.arm[k.id],col=(AT.find(t=>t[0]===a)||[])[1]||"#8a6fd1",w=elT("div","sk"+(on?" on":""));w.style.setProperty("--c",col);
  const tx=elT("div","sk-tx");tx.append(elT("b","",k.nm+" · "+a+" 속성"),elT("small","",k.d+" ("+k.w+"에서 쓰인다)"));
  const b=elT("button","chip",on?"준비 해제":"준비");b.type="button";b.disabled=!on&&left<=0;
  b.onclick=()=>{skDay();if(C.sk.arm[k.id])delete C.sk.arm[k.id];else{if(mpLeft()<=0)return;C.sk.arm[k.id]=true}save();bag(on?k.nm+" 준비를 풀었다.":k.nm+"을(를) 준비했다. 다음 "+k.w+"에서 쓰인다.")};
  w.append(elT("span","sk-ic"),tx,b);l.appendChild(w)})}

/* 도감: 출정 이벤트, 보스, 무기, 아이템, 마법. 분류마다 절반과 전부를 모으면 보상을 받는다.
   C.dex = {ev:{id:1}, bs:{이름:1 만남 / 2 처치}, it:{id:1}, sk:{id:1}, rw:{분류+h/f:받음}}. 무기는 가진 무기 목록으로 센다. */
const evVil=id=>Object.keys(VEV).find(v=>VEV[v].some(x=>x.id===id));
const evName=(x,v)=>{const t=String(x.t||x.q).replace(/\{v\}/g,VL[v]?VL[v].n:"마을").replace(/\{f\}/g,"누군가"),i=t.indexOf(":");return i>0?[t.slice(0,i),t.slice(i+1).trim()]:[t,""]};
function dexAdd(k,id,val){if(!C)return false;val=val||1;C.dex=C.dex||{};C.dex[k]=C.dex[k]||{};if((C.dex[k][id]||0)>=val)return false;C.dex[k][id]=val;return true}
const dexHas=(c,k,id)=>k==="wp"?(c.wps||[]).includes(Number(String(id).slice(1))):!!(c.dex&&c.dex[k]&&c.dex[k][id]);
const dexN=(c,k)=>{const d=DEX.find(x=>x.k===k);return d?d.items().filter(it=>dexHas(c,k,it.id)).length:0};
const dexTot=k=>DEX.find(x=>x.k===k).items().length;
const dexClaimable=d=>{const n=dexN(C,d.k),t=dexTot(d.k),r=(C.dex&&C.dex.rw)||{};return[["h",Math.ceil(t/2)],["f",t]].filter(([k,need])=>!r[d.k+k]&&n>=need)};
let recTab="dex",dexCat="ev";
function setRec(t){recTab=t;$("#dex-box").hidden=t!=="dex";$("#ttl-box").hidden=t!=="ttl";document.querySelectorAll("#rec-t button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.r===t?"true":"false"))}
function dex(msg){show("titles");setRec("dex");titleState();C.dex=C.dex||{};C.dex.rw=C.dex.rw||{};ITM.forEach(x=>{if(((C.inv||{})[x[0]]||0)>0)dexAdd("it",x[0])});
 let got=0,all=0;DEX.forEach(d=>{got+=dexN(C,d.k);all+=dexTot(d.k)});
 const sm=$("#dex-sum");sm.innerHTML="";const bar=elT("div","bar"),fi=elT("i");fi.style.width=(got/all*100)+"%";bar.appendChild(fi);
 sm.append(elT("h2","","마법소녀 도감"),elT("p","hint","출정, 보스, 상점, 마법에서 만난 것들이 기록된다. 분류마다 절반과 전부를 모으면 보상을 받는다."),bar,elT("p","hint","전체 수집률 "+Math.floor(got/all*100)+"% ("+got+" / "+all+")"));
 const cs=$("#dex-cats");cs.innerHTML="";DEX.forEach(d=>{const b=elT("button","chip",d.nm+" "+dexN(C,d.k)+"/"+dexTot(d.k)+(dexClaimable(d).length?" ●":""));b.type="button";b.setAttribute("aria-pressed",dexCat===d.k?"true":"false");b.onclick=()=>{dexCat=d.k;dex()};cs.appendChild(b)});
 const d=DEX.find(x=>x.k===dexCat),n=dexN(C,d.k),t=dexTot(d.k),hd=$("#dex-cat");hd.innerHTML="";
 const rw=(lab,need,key,r)=>{const done=C.dex.rw[d.k+key],ok=n>=need,b=elT("button",done?"chip":"btn"+(ok?"":" g"),done?lab+" 받음":lab+" ("+need+"개) · "+rwTxt(r));b.type="button";b.disabled=!!done||!ok;b.style.cssText="width:auto;margin:0;padding:9px 12px;font-size:.88rem";
  b.onclick=()=>{if(C.dex.rw[d.k+key]||dexN(C,d.k)<need)return;C.dex.rw[d.k+key]=1;giveRw(r);note("dex","도감 "+d.nm+" "+lab+": "+rwTxt(r));save();checkTitles();dex(d.nm+" "+lab+"을 받았다: "+rwTxt(r))};return b};
 const row=elT("div","row");row.style.marginBottom="10px";row.append(rw("절반 보상",Math.ceil(t/2),"h",d.half),rw("완성 보상",t,"f",d.full));hd.appendChild(row);
 const l=$("#dex-list");l.innerHTML="";d.items().forEach(it=>{const has=dexHas(C,d.k,it.id),c=elT("div","chip sq dex-it"+(has?"":" lock"));
  const star=(d.k==="bs"&&C.dex.bs&&C.dex.bs[it.id]>=2)||(d.k==="wp"&&has&&wlv(Number(it.id.slice(1)))>=5)?" ★":"";
  c.append(elT("small","dex-tag",it.tag),elT("b","",has?it.nm+star:"???"),elT("small","",has?it.ds:it.hint));l.appendChild(c)});
 const m=$("#dex-msg");m.style.color="var(--mu)";m.textContent=msg||(d.k==="bs"?"★는 처치까지 함께한 보스다.":d.k==="wp"?"★는 +5까지 강화한 무기다.":d.k==="ev"?"마을 전용 이벤트는 그 마을 출신과 함께 출정해야 만날 수 있다.":"")}
$("#tut-re").onclick=()=>{C.tut=C.tut||{got:{}};C.tut.hide=0;C.tut.fold=0;save();hub()};
$("#rec-t").onclick=e=>{const t=e.target.dataset&&e.target.dataset.r;if(t==="dex")dex();else if(t==="ttl")titles()};
function note(k,t,u){if(!C)return;C.nt=Array.isArray(C.nt)?C.nt:[];C.nt.unshift({k,t:String(t).slice(0,160),u:u||"",ts:Date.now(),r:false});if(C.nt.length>80)C.nt.length=80;save();if(!$("#v-inbox").hidden)inbox(true)}
function ntGo(n){const u=n.u;if(n.k==="notice"){keep("mgr_ntc_x","");drawNotice();hub();return}if(n.k==="dm"&&u)goDM(u);else if(n.k==="fr")friends();else if(n.k==="res")friends();else if(n.k==="gift"&&u)openProfile(u);else if(n.k==="title")titles();else if(n.k==="boss")bossView();
 else if(n.k==="raid"&&u)openRaid(u);else if(n.k==="fall"&&C.fall)openRaid(UID);else if(n.k==="dex")dex();else if(n.k==="portal")portalView();else if(n.k==="guard")guardView();else if(n.k==="fac")facView();else if(n.k==="disaster")hub();else if(n.k==="wave")waveView();else if(n.k==="board")board(n.u||null);else if(n.k==="quest"||n.k==="warn"||n.k==="fall")hub()}
let ntCat="all",ntNew=new Set();
const ntCatOf=k=>{const c=NT_CAT.find(x=>x[2]&&x[2].includes(k));return c?c[0]:"etc"};
const ntIn=(n,cat)=>cat==="all"||ntCatOf(n.k)===cat;
function inbox(keep){show("inbox");C.nt=Array.isArray(C.nt)?C.nt:[];const l=$("#ntl");l.innerHTML="";
 // 화면을 처음 열 때 안 읽은 알림을 기억해 두고(종류를 바꿔도 '새 알림' 표시가 남게), 바로 읽음으로 바꾼다.
 if(!keep)ntNew=new Set(C.nt.filter(n=>!n.r).map(n=>n.ts+"|"+n.t));
 const cb=$("#ntcat");cb.innerHTML="";NT_CAT.forEach(([k,nm])=>{const all=C.nt.filter(n=>ntIn(n,k)),nw=all.filter(n=>ntNew.has(n.ts+"|"+n.t)).length;if(k==="etc"&&!all.length)return;
  const b=elT("button","chip nt-cat",nm+(k==="all"?"":" "+all.length));b.type="button";b.setAttribute("role","tab");b.setAttribute("aria-selected",ntCat===k?"true":"false");if(nw)b.appendChild(elT("span","nav-n",String(nw)));b.onclick=()=>{ntCat=k;inbox(true)};cb.appendChild(b)});
 if(!NT_CAT.some(c=>c[0]===ntCat)||(ntCat==="etc"&&!C.nt.some(n=>ntIn(n,"etc"))))ntCat="all";
 $("#nt-clr").textContent=ntCat==="all"?"모두 지우기":"'"+NT_CAT.find(c=>c[0]===ntCat)[1]+"' 알림 지우기";
 const list=C.nt.filter(n=>ntIn(n,ntCat));
 if(!list.length){l.innerHTML=C.nt.length?"<p class='hint'>이 종류의 알림이 없다.</p>":"<p class='hint'>아직 알림이 없다.</p>"}
 const t0=today(),y=new Date();y.setDate(y.getDate()-1);const t1=ymd(y);let last="";
 list.forEach(n=>{const d=new Date(n.ts),day=ymd(d);if(day!==last){last=day;l.appendChild(elT("p","nt-day",day===t0?"오늘":day===t1?"어제":day.replace(/-/g,".")))}
  const b=elT("button","nt"+(ntNew.has(n.ts+"|"+n.t)?" new":""));b.type="button";const ic=NTI[n.k]||["·",""];
  b.append(elT("span","nt-ic "+ic[1],ic[0]),elT("span","nt-tx",n.t),elT("span","nt-tm",String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")));b.onclick=()=>ntGo(n);l.appendChild(b)});
 // 화면을 연 순간 모두 읽음으로 바꾼다(이번 화면에서는 새 알림 표시가 남아 있다).
 if(C.nt.some(n=>!n.r)){C.nt.forEach(n=>n.r=true);save()}updNav()}
$("#nt-clr").onclick=()=>{if(!C.nt||!C.nt.length)return;const c=NT_CAT.find(x=>x[0]===ntCat);if(ntCat==="all"){if(!confirm("알림을 모두 지울까?"))return;C.nt=[]}else{if(!C.nt.some(n=>ntIn(n,ntCat)))return;if(!confirm("'"+c[1]+"' 알림만 지울까?"))return;C.nt=C.nt.filter(n=>!ntIn(n,ntCat))}save();inbox(true)};
let unB=null;const bossLast={};
const ymd=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const dayN=d=>Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5);
// off=1이면 어제(지난주) 보스
/* 오전·오후 보스: 하루를 0시~12시(오전), 12시~24시(오후)로 나눠 반나절마다 다른 보스가 나온다. off=1이면 바로 앞 반나절의 보스. */
function bossOf(k,off=0){const d=new Date();if(k==="d"){const h=dayN(d)*2+(d.getHours()>=12?1:0)-off,am=h%2===0,u=new Date(Math.floor(h/2)*864e5),ds=u.getUTCFullYear()+"-"+String(u.getUTCMonth()+1).padStart(2,"0")+"-"+String(u.getUTCDate()).padStart(2,"0");
  return{k,id:"d-"+ds+(am?"a":"p"),def:DBOSS[h%DBOSS.length],nm:am?"오전 보스":"오후 보스",until:am?"낮 12시까지":"밤 12시까지"}}
 d.setDate(d.getDate()-((d.getDay()+6)%7)-7*off);return{k,id:"w-"+ymd(d),def:WBOSS[Math.floor(dayN(d)/7)%WBOSS.length]}}
const bcfgOf=(k,id)=>id&&String(id)<BOSS_NEW_FROM[k]?BOSS_OLD[k]:BOSS[k];
const witchHpOf=p=>(300+Math.max(0,Number(p)||0)*12)*WITCH_HP;
const onlineTopPw=()=>Math.max(typeof pw==="function"&&C?pw():0,...(ONL||[]).filter(p=>p&&(p.u===UID||isOn(p))).map(p=>Number(p.pw)||0));
const dHpNow=()=>Math.round(witchHpOf(onlineTopPw())*D_HP_X);
const bFirst=list=>list.slice().sort((a,b)=>(Number(a.t0||a.ts)||0)-(Number(b.t0||b.ts)||0))[0];
/* 보스 체력(4차): 보스가 처음 공격받는 순간, 최근에 접속한 캐릭터들의 전투력 합 × BOSS_SCALE[k].x 로 정해진다(최소 BOSS_SCALE[k].min).
   오전·오후 보스는 최근 하루, 주간 보스는 최근 일주일 동안 접속한 캐릭터를 센다. 정해진 체력은 공격 기록(hp0)에 남아서 그 보스가 끝날 때까지 모두에게 똑같다.
   캐릭터들이 강해지고 사람이 늘수록 보스도 강해지고, 서버 초반처럼 다들 약할 때는 보스도 약하다. 숫자는 data/game.js의 BOSS_SCALE에서 고친다. */
const bScaled=(k,id)=>!!id&&String(id)>=BOSS_SCALE_FROM[k];
function bossHpEst(k){const c=BOSS_SCALE[k],now=Date.now();let sum=0;const seen={};
 ((PLC&&PLC.docs)||[]).forEach(d=>{if(d.id===UID)return;const p=d.data()||{};if(Number(p.on)>now-c.win&&!rstOld(p)){sum+=Math.max(0,Number(p.pw)||0);seen[d.id]=1}});
 sum+=C?pw():0;return Math.max(c.min,Math.round(c.x*sum))}
const bhpScaled=(k,list)=>{const real=list.filter(v=>v&&v.u),withHp=real.filter(v=>Number(v.hp0)>0);return withHp.length?Math.round(Number(bFirst(withHp).hp0)):bossHpEst(k)};
const bhp=(k,list,id)=>{if(bScaled(k,id))return bhpScaled(k,list);if(k==="d"&&!(id&&String(id)<BOSS_NEW_FROM.d)){const real=list.filter(v=>v&&v.u),f=real.length?bFirst(real):null;if(!f)return dHpNow();if(Number(f.hp0)>0)return Math.round(Number(f.hp0))}const c=bcfgOf(k,id);return Math.round(c.base+c.k*list.reduce((a,v)=>a+(Number(v.p)||0),0)+(c.m||0)*list.reduce((a,v)=>Math.max(a,Number(v.p)||0),0))};
/* 한 번 쓰러진 보스는 다시 살아나지 않는다: 마지막 일격을 넣은 사람의 기록에 x 표시를 남기고, 표시가 있거나 피해 합이 체력 이상이면 쓰러진 것으로 본다.
   (예전에는 보스가 쓰러진 뒤 새 사람이 공격하면 그 사람 몫만큼 체력이 늘어나 보스가 되살아났다.) */
const bossDead=(k,list,id)=>list.length>0&&(list.some(v=>v&&v.x)||sumHits(list)>=bhp(k,list,id));
// [피해 배율, 추가 절망도, 절망도 막음(1이면 이번 공격으로 절망도가 오르지 않음)]
const bpEff=(p,a)=>a==="str"?(p.id==="rest"?[1.3,0,0]:p.id==="charge"?[1,3,0]:[1,0,0]):a==="def"?(p.id==="charge"?[1,0,1]:[.7,0,1]):(p.id==="focus"?[1.8,0,0]:[.5,0,0]);
function bpAt(id,t){const sl=Math.floor(t/BP_MS),g=rng(hs32(id+"#"+sl))();let a=0;for(const p of BP){a+=p.w/100;if(g<a)return p}return BP[0]}
const bpEnd=t=>(Math.floor(t/BP_MS)+1)*BP_MS;
const hm=t=>{const d=new Date(t);return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")};
const bossList=async b=>{const s=await once(DB.collection("wboss/"+b.id));return s.docs.map(d=>d.data()).filter(Boolean)};
// 공격 횟수: 오전·오후 보스는 반나절마다, 주간 보스는 하루마다 다시 채워진다.
function bossDay(){const hk=bossOf("d").id;if(!C.wb||C.wb.day!==today())C.wb={day:today(),h:hk,d:0,w:0};else if(C.wb.h!==hk){C.wb.h=hk;C.wb.d=0}}
const keepIds=(o,id)=>{o=o||{};o[id]=true;const ks=Object.keys(o);ks.slice(0,Math.max(0,ks.length-6)).forEach(x=>delete o[x]);return o};
const elT=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e};
function bossView(){show("boss");$("#bsm").textContent="";bossDay();unB&&unB();unB=null;const box=$("#bsl");box.innerHTML="";
 ["d","w"].forEach(k=>{const c=elT("div","card boss-card "+k);c.id="bs-"+k;box.appendChild(c)});
 if(!DB){$("#bsm").textContent="보스 레이드를 쓸 수 없다.";return}
 const uns=["d","w"].map(k=>{const b=bossOf(k);drawBoss(k,b,[]);return DB.collection("wboss/"+b.id).onSnapshot(s=>drawBoss(k,b,s.docs.map(d=>d.data()).filter(Boolean)),e=>{})});
 unB=()=>uns.forEach(f=>f&&f());autoClaimOld(true)}
function drawBoss(k,b,list){const c=$("#bs-"+k);if(!c||!C)return;bossLast[k]=list;bossDay();const cfg=BOSS[k],def=b.def,dead=bossDead(k,list,b.id),mx=bhp(k,list,b.id),hp=dead?0:Math.max(0,mx-sumHits(list));
 const rank=list.slice().sort((a,x)=>(x.d||0)-(a.d||0)),mine=list.find(v=>v.u===UID),weak=(C.a||[]).includes(def[2]);c.innerHTML="";
 c.append(elT("p","boss-tag",(b.nm||cfg.nm)+" · "+(b.until||cfg.until)),elT("h2","",def[0]),elT("p","hint",def[1]),elT("p","boss-weak"+(weak?" on":""),"약점: "+def[2]+" 속성"+(weak?" · 내 속성이라 피해 30% 증가!":"")));
 const bar=elT("div","bar"),fill=elT("i");fill.style.width=(hp/mx*100)+"%";bar.appendChild(fill);c.append(bar,elT("p","hint","HP "+hp+" / "+mx+" · 참가자 "+list.length+"명"));
 c.appendChild(elT("p","","내 피해 "+(mine?Number(mine.d)||0:0)+(mine?" ("+(rank.indexOf(mine)+1)+"위)":" (아직 참가하지 않았다)")));
 if(rank.length){const ol=elT("ol","boss-rank");rank.slice(0,5).forEach(v=>{const li=elT("li",v.u===UID?"me":"",cn(v.u,v.n)+" · 피해 "+(Number(v.d)||0)+" ("+(Number(v.c)||0)+"회)");ol.appendChild(li)});c.appendChild(ol)}
 if(dead){c.appendChild(elT("p","boss-dead","처치 완료!"));const got=C.wbc&&C.wbc[b.id],joined=C.wbp&&C.wbp[b.id];
  if(joined){const bt=elT("button","btn",got?"처치 보상을 받았다":"처치 보상 받기");bt.type="button";bt.disabled=!!got;bt.onclick=async()=>{bt.disabled=true;const r=await claimBoss(b);const m=$("#bsm");m.style.color="var(--mu)";m.textContent=r?(b.nm||cfg.nm)+" 처치 보상: "+rwTxt(r.r)+(r.mvp?" (피해 1위 보너스 포함!)":""):"보상을 받지 못했다.";drawBoss(k,b,bossLast[k]||[])};c.appendChild(bt)}
  else c.appendChild(elT("p","hint","이번 보스에는 참가하지 않아 처치 보상이 없다."));return}
 const now=Date.now(),pt=bpAt(b.id,now),nx=bpAt(b.id,bpEnd(now)),pb=elT("div","bp-box");
 pb.append(elT("p","bp-now",pt.ic+" "+pt.nm),elT("p","bp-ds",pt.ds),elT("p","bp-next",hm(bpEnd(now))+"까지 · 다음: "+nx.ic+" "+nx.nm));c.appendChild(pb);
 clearTimeout(bpT[k]);bpT[k]=setTimeout(()=>{if(!$("#v-boss").hidden)drawBoss(k,b,bossLast[k]||list)},bpEnd(now)-now+800);
 const left=cfg.t-C.wb[k],off=!!C.fall||C.dz>=90||left<=0;
 c.appendChild(elT("p","bp-left",C.fall?"타락 중에는 싸울 수 없다":C.dz>=90?"절망도가 너무 높아 싸울 수 없다":left<=0?(k==="d"?"이번 보스 공격 횟수를 다 썼다":"오늘 공격 횟수를 다 썼다"):"대응을 골라 공격한다 · "+(k==="d"?"":"오늘 ")+left+"/"+cfg.t+"번 남음"+(armedSk("fire")?" · 홍련의 일격 준비됨":"")));
 const row=elT("div","bp-acts");Object.keys(BA).forEach(a=>{const x=BA[a],bt=elT("button","btn"+(a==="str"?"":" g"),x.ic+" "+x.nm);bt.type="button";bt.disabled=off;bt.onclick=()=>{row.querySelectorAll("button").forEach(z=>z.disabled=true);hitBoss(k,bt,a)};row.appendChild(bt)});c.appendChild(row);
 if(bScaled(k,b.id))c.appendChild(elT("p","boss-info","체력: 첫 공격 때 "+(k==="d"?"최근 하루":"최근 일주일")+" 동안 접속한 마법소녀들의 전투력 합 × "+BOSS_SCALE[k].x+(list.length?"":" (지금 기준 약 "+bossHpEst(k).toLocaleString()+")")));
 else if(k==="d")c.appendChild(elT("p","boss-info","체력: 첫 공격 때 접속 중인 가장 강한 마법소녀가 절망의 마인이 되었을 때 체력의 "+D_HP_X+"배"+(list.length?"":" (지금 기준 약 "+dHpNow().toLocaleString()+")")));
 c.appendChild(elT("p","boss-info","공격 1번: 피해 전투력×2~3(대응에 따라 ×0.5~1.8), 골드 +"+cfg.hit+", 절망도 +"+cfg.dz+"(🛡 방어 태세면 0) · 처치 보상: "+rwTxt(cfg.kill)+", 피해 1위는 마력석 +"+cfg.mvp+" 추가"))}
async function hitBoss(k,bt,act){act=BA[act]?act:"str";const b=bossOf(k),cfg=BOSS[k],m=$("#bsm");bossDay();if(C.fall||C.dz>=90||C.wb[k]>=cfg.t)return;bt.disabled=true;const pt=bpAt(b.id,Date.now()),ef=bpEff(pt,act),good=pt.best===act;
 try{if(bScaled(k,b.id)&&!(await bossList(b)).some(v=>Number(v&&v.hp0)>0)){try{await plAll()}catch(e){}}
  const list=await bossList(b),mine=list.find(v=>v.u===UID)||{},p=Number(mine.p)||pw(),hp=bossDead(k,list,b.id)?0:bhp(k,mine.u?list:list.concat([{p}]),b.id)-sumHits(list);
  if(hp<=0){m.style.color="var(--mu)";m.textContent="이미 쓰러진 보스다.";drawBoss(k,b,list);return}
  const weak=(C.a||[]).includes(b.def[2]),fire=armedSk("fire"),d=Math.max(1,Math.round(pw()*(2+Math.random())*ef[0]*(weak?1.3:1)*(fire?2:1)*(C.a.includes("불")?1.2:1)*((VL[C.v]||{}).bd||1)));
  const rec={u:UID,n:nmOf(),d:(Number(mine.d)||0)+d,p,c:(Number(mine.c)||0)+1,ts:Date.now(),t0:Number(mine.t0)||Date.now()};if(bScaled(k,b.id))rec.hp0=bhpScaled(k,list);else if(k==="d")rec.hp0=Number(mine.hp0)||(list.length?(Number((bFirst(list)||{}).hp0)||0):0)||dHpNow();if(mine.x||hp-d<=0)rec.x=1;await DB.doc("wboss/"+b.id+"/"+UID).set(rec);
  if(fire)useSk("fire");if(dexAdd("bs",b.def[0]))note("dex","도감에 새 보스가 기록되었다: "+b.def[0]);C.wb[k]++;C.wbp=keepIds(C.wbp,b.id);C.gd=(C.gd||0)+cfg.hit;titleState();C.stats.bossHits=(C.stats.bossHits||0)+1;if(good)C.stats.bossRead=(C.stats.bossRead||0)+1;guardAdd(3);const dz=ef[2]?0:cfg.dz+ef[1];if(dz)gain(0,dz);else save();checkTitles();
  const say=good?(act==="def"?" 반격을 막고 되받아쳤다!":act==="weak"?" 모인 마력을 꿰뚫었다! 약점 적중!":" 빈틈에 강타가 꽂혔다!"):act==="str"&&pt.id==="charge"?" 돌진에 반격당했다!":act==="weak"?" 약점을 찾지 못했다.":act==="def"?" 조심스럽게 싸웠다.":"";
  m.style.color="var(--mu)";m.textContent=BA[act].ic+" "+BA[act].nm+" → "+pt.ic+" "+pt.nm+":"+say+" "+b.def[0]+"에게 "+d+"의 피해"+(weak?" (약점 속성!)":"")+(fire?" (홍련의 일격!)":"")+". 골드 +"+cfg.hit+", 절망도 +"+dz+"."+(hp-d<=0?" 보스를 쓰러뜨렸다! 처치 보상을 받자.":"");
  drawBoss(k,b,await bossList(b))}
 catch(e){m.style.color="var(--bad)";m.textContent="공격하지 못했다. 데이터베이스 규칙에서 wboss 경로가 열려 있는지 확인해야 한다.";bt.disabled=false}}
// 처치 보상: 참가했고, 보스가 쓰러졌고, 아직 안 받았을 때만
async function claimBoss(b){if(!C.wbp||!C.wbp[b.id]||(C.wbc&&C.wbc[b.id]))return null;let list=[];try{list=await bossList(b)}catch(e){return null}
 if(!bossDead(b.k,list,b.id))return null;const cfg=BOSS[b.k],top=list.slice().sort((a,x)=>(x.d||0)-(a.d||0))[0],mvp=!!top&&top.u===UID,r={g:cfg.kill.g,m:cfg.kill.m+(mvp?cfg.mvp:0)};
 if(C.wbc&&C.wbc[b.id])return null;C.wbc=keepIds(C.wbc,b.id);giveRw(r);dexAdd("bs",b.def[0],2);note("boss",(b.nm||cfg.nm)+" "+b.def[0]+" 처치 보상: "+rwTxt(r)+(mvp?" (피해 1위)":""));titleState();if(b.k==="d")C.stats.bossKillsD=(C.stats.bossKillsD||0)+1;else C.stats.bossKillsW=(C.stats.bossKillsW||0)+1;if(mvp)C.stats.bossMvp=(C.stats.bossMvp||0)+1;
 save();checkTitles();return{r,mvp}}
// 날짜가 넘어가기 직전에 쓰러뜨린 지난 보스의 보상을 자동으로 챙긴다.
async function autoClaimOld(inView){if(!C||!DB)return;const got=[];for(const b of [bossOf("d",1),bossOf("w",1)]){if(C.wbp&&C.wbp[b.id]&&!(C.wbc&&C.wbc[b.id])){const r=await claimBoss(b);if(r)got.push("지난 "+(b.nm||BOSS[b.k].nm)+" "+b.def[0]+" 처치 보상: "+rwTxt(r.r))}}
 if(!got.length)return;const m=inView?$("#bsm"):$("#hm");m.style.color="var(--mu)";m.textContent=got.join(" / ");if(!inView&&!$("#v-hub").hidden){$("#hc").querySelectorAll(".hc-grid b")[3].textContent=C.gd||0}}
$("#bsb").onclick=()=>hub();

/* 타락과 레이드: 절망도가 90이면 '타락 직전' 경고, 100이면 타락해 그 캐릭터가 레이드보스가 된다.
   친구들이 공격해 HP를 0으로 만들면 원래 모습으로 돌아온다. 서버에는 raid/{타락한 사람}과 raidhit/{타락한 사람}/{레이드 번호}/{공격한 사람}에 기록한다.
   각자 자기 누적 피해만 기록하므로 여러 명이 동시에 공격해도 기록이 덮어써지지 않는다. */
/* 타락 레이드 난이도: HP = 300 + 타락한 사람의 전투력 × 12. 친구 한 명당 2분에 한 번 공격하고, 공격할 때마다 그림자의 절망이 스며들어 내 절망도가 RAID_DZ 오른다.
   절망도 90 이상이거나 타락한 사람은 맞설 수 없다. 숫자만 고치면 바뀐다. */
const raidHp=()=>300+pw()*12;
let WCH=[];// 지금 살아 있는 마인들 [{u,n,v,rid,hp,mx}]
const fallsRecent=()=>((C&&C.fallT)||[]).filter(t=>Date.now()-t<WITCH_WIN);
const witchCurse=()=>!!C&&WCH.some(w=>w.v===C.v&&w.u!==UID);
let unRd=null,rdU=null,rdR=null,rdLast=null,rdHp=0;
function alertBox(t,x){$("#alt").textContent=t;$("#alx").textContent=x;$("#alo").hidden=false;$("#alc").focus({preventScroll:true})}
$("#alc").onclick=()=>{$("#alo").hidden=true};
const rhits=(u,rid)=>DB.collection("raidhit/"+u+"/"+rid);
const sumHits=list=>list.reduce((a,v)=>a+(Number(v&&v.d)||0),0);
const scarLeft=()=>Math.max(0,((C&&C.scar)||0)-Date.now());
function fallLoss(w){const lv=C.lv||1,ex0=C.ex||0,ex1=xpAt(lv-1),g0=C.gd||0,gl=Math.floor(g0*FALL_GOLD*(w?2:1));C.ex=Math.min(ex0,ex1);C.lv=lvOf(C.ex);C.gd=g0-gl;return{lv0:lv,lv1:C.lv,exl:ex0-C.ex,gl}}
function fallen(){if(C.fall)return;C.fallT=fallsRecent().concat(Date.now()).slice(-10);const w=C.fallT.length>=WITCH_N;if(w)return witchBorn();const L=fallLoss();C.fall={rid:Date.now(),mx:raidHp(),sd:0,st:0};titleState();C.stats.falls=(C.stats.falls||0)+1;C.dz=100;note("fall","절망도가 100에 닿아 타락했다. 친구들이 맞서 주기를 기다리자.");save();putRaid();regPlayer();checkTitles();
 alertBox("타락","절망도가 100에 닿았다. "+C.n+"은(는) 절망에 삼켜져 마수가 되었다.\n\n타락의 대가\n· 경험치 "+L.exl+"을(를) 잃었다"+(L.lv1<L.lv0?" (레벨 "+L.lv0+" → "+L.lv1+")":"")+"\n· 골드 "+L.gl+"을(를) 잃었다\n· 타락한 동안에는 경험치를 얻을 수 없다\n· 되돌아온 뒤 1시간 동안 얻는 경험치가 절반이 된다\n\n친구들이 맞서 쓰러뜨려 주면 원래 모습으로 돌아온다. 그동안 출정과 재계약 시험은 할 수 없다."+(C.fallT.length===WITCH_N-1?"\n\n⚠ 경고: 최근 7일 동안 "+C.fallT.length+"번 타락했다. 한 번 더 타락하면 절망의 마인이 된다.":""));note("fall","타락의 대가로 경험치 "+L.exl+", 골드 "+L.gl+"을(를) 잃었다."+(L.lv1<L.lv0?" 레벨이 "+L.lv1+"(으)로 떨어졌다.":""))}
function witchBorn(){const L=fallLoss(1);C.fall={rid:Date.now(),mx:raidHp()*WITCH_HP,sd:0,st:0,w:1};titleState();C.stats.falls=(C.stats.falls||0)+1;C.stats.witch=(C.stats.witch||0)+1;C.dz=100;
 note("fall","절망을 견디지 못하고 절망의 마인이 되었다. 모든 마법소녀가 나를 막으러 올 것이다.");save();putRaid();regPlayer();checkTitles();
 alertBox("🜏 절망의 마인","일주일 사이 "+C.fallT.length+"번째 타락. 되풀이된 절망이 마침내 "+C.n+"을(를) 삼켰다.\n이번에는 그저 마수가 아니다. 검은 왕관이 머리 위에 떠오르고, "+VL[C.v].n+" 하늘이 어둡게 물든다.\n\n절망의 마인\n· 경험치 "+L.exl+", 골드 "+L.gl+"을(를) 잃었다 (골드 손실 두 배)"+(L.lv1<L.lv0?"\n· 레벨 "+L.lv0+" → "+L.lv1:"")+"\n· 체력이 평소의 "+WITCH_HP+"배다\n· 친구가 아니어도 모든 마법소녀가 맞설 수 있다\n· 내가 살아 있는 동안 "+VL[C.v].n+"에 '마인의 저주'가 내려 주민들의 자연 회복이 절반이 된다\n· 돌아온 뒤 "+(WITCH_SCAR/3600000)+"시간 동안 얻는 경험치가 절반이 된다");document.body.classList.add("witch-flash");setTimeout(()=>document.body.classList.remove("witch-flash"),2500)}
function putRaid(){if(!DB||!C||!C.fall)return;const f=C.fall;thumb(C.img,im=>{DB.doc("raid/"+UID).set({u:UID,rid:f.rid,mx:f.mx,sd:f.sd||0,w:f.w?1:0,v:C.v,n:nmOf(),g:C.g,a:(C.a||[]).join(" · "),im,ts:Date.now()}).catch(()=>{})})}
// 내가 타락한 상태라면 받은 피해를 합쳐서 쓰러졌는지 확인한다.
async function checkRaid(){if(!C||!C.fall||!DB)return;const f=C.fall;let got=0;
 try{const r=await DB.doc("raid/"+UID).get();if(!r.exists)putRaid()}catch(e){}
 try{const s=await once(rhits(UID,f.rid));got=sumHits(s.docs.map(d=>d.data()))}catch(e){}
 if(C.fall===f&&got+(f.sd||0)>=f.mx)recover()}
function recover(){if(!C.fall)return;C.edge=0;const wt=!!C.fall.w;C.fall=null;C.dz=RECOVER_DZ;C.scar=Math.max(Number(C.scar)||0,Date.now()+(wt?WITCH_SCAR:SCAR_MS));/* 이미 남아 있는 더 긴 후유증(예: 마인의 3시간)을 짧게 덮어쓰지 않는다 */titleState();C.stats.recovered=(C.stats.recovered||0)+1;if(wt)C.fallT=[];note("fall",wt?"마인의 왕관이 부서지고 원래 모습으로 돌아왔다.":"타락에서 벗어나 원래 모습으로 돌아왔다.");save();checkTitles();if(DB)DB.doc("raid/"+UID).delete().catch(()=>{});regPlayer();
 if(!$("#v-raid").hidden||!$("#v-hub").hidden)hub();if(wt){alertBox("마인의 끝","수많은 마법소녀의 빛이 검은 왕관을 부쉈다. 마인의 저주가 걷히고, "+C.n+"은(는) 원래 모습으로 돌아왔다.\n절망도는 "+RECOVER_DZ+"이(가) 되었다.\n\n마인이었던 흔적으로 "+(WITCH_SCAR/3600000)+"시간 동안 얻는 경험치가 절반이 된다.\n타락 횟수 기록은 초기화되었다. 다시는 혼자 무너지지 않기를.");return}alertBox("귀환","친구들의 마법이 닿았다. 타락에서 벗어나 원래 모습으로 돌아왔다.\n절망도는 "+RECOVER_DZ+"이(가) 되었다.\n\n다만 타락의 후유증으로 "+(Math.ceil((C.scar-Date.now())/600000)/6>1?"약 "+(Math.round((C.scar-Date.now())/360000)/10)+"시간":"1시간")+" 동안 얻는 경험치가 절반이 된다.")}
// 마을 화면 옆 '타락한 친구' 목록
async function drawRaids(){if(!DB||!C)return;C.fr=C.fr||{};let rs=[],okR=false;
 try{const s=await once(DB.collection("raid"));rs=s.docs.map(d=>d.data()).filter(r=>r&&r.u&&r.u!==UID&&(C.fr[r.u]||r.w));okR=true}catch(e){}
 const items=await Promise.all(rs.map(async r=>{let h=0;try{h=sumHits((await once(rhits(r.u,r.rid))).docs.map(d=>d.data()))}catch(e){}return[r,Math.max(0,r.mx-(r.sd||0)-h)]}));
 const live=items.filter(x=>x[1]>0);live.forEach(([r])=>{const key=r.u+"_"+r.rid;if(!(C.rsn&&C.rsn[key])){C.rsn=keepIds(C.rsn,key);if(r.w){const t="🜏 절망의 마인 강림! "+r.n+"이(가) "+((VL[r.v]||{}).n||"어느 마을")+"에서 마인이 되었다. 누구든 맞설 수 있다.";note("raid",t,r.u);toast(t);ding()}else note("raid",r.n+"님이 타락했다. 맞서서 되돌려 주자.",r.u)}});
 WCH=live.filter(([r])=>r.w).map(([r,hp])=>({u:r.u,n:r.n,v:r.v,rid:r.rid,hp,mx:r.mx}));if(C.fall&&C.fall.w&&!WCH.some(w=>w.u===UID))WCH.push({u:UID,n:C.n,v:C.v,rid:C.fall.rid});
 // 내가 맞섰던 마인이 쓰러졌으면 토벌 보상을 한 번 준다.
 if(okR&&C.wj)Object.keys(C.wj).forEach(key=>{if(live.some(([r])=>r.u+"_"+r.rid===key))return;const it=items.find(([r])=>r.u+"_"+r.rid===key);if(!it&&Date.now()-C.wj[key]<60000)return;
  delete C.wj[key];giveRw(WITCH_ALL);titleState();C.stats.witchSaves=(C.stats.witchSaves||0)+1;note("raid","함께 맞섰던 절망의 마인이 쓰러졌다! 토벌 보상: "+rwTxt(WITCH_ALL));toast("🜏 마인 토벌 성공! "+rwTxt(WITCH_ALL));save();checkTitles()});
 if($("#v-hub").hidden)return;const l=$("#rdl");l.innerHTML="";
 if(!live.length){l.innerHTML="<p class='hint'>타락한 친구가 없다.</p>";return}
 live.forEach(([r,hp])=>{const b=document.createElement("button");b.type="button";b.className="chip raid-chip";b.style.cssText="display:flex;justify-content:space-between;text-align:left";
  b.innerHTML="<span></span><strong></strong>";if(r.w)b.classList.add("witch-chip");b.firstChild.textContent=(r.w?"🜏 절망의 마인 ":"타락한 ")+cn(r.u,r.n);b.lastChild.textContent="HP "+hp+"/"+r.mx;b.onclick=()=>openRaid(r.u);l.appendChild(b)})}
setInterval(()=>{if(C&&AUTH.uid&&DB&&!document.hidden)drawRaids()},120000);
function openRaid(u){unRd&&unRd();unRd=null;show("raid");rdU=u;rdR=null;rdLast=null;$("#rdm").textContent="";$("#rdlg").innerHTML="";$("#rdc").textContent="불러오는 중...";$("#rdgo").hidden=true;
 const start=r=>{rdR=r;drawRaid([]);if(!DB)return;const un=rhits(u,r.rid).onSnapshot(s=>{if(rdU===u)drawRaid(s.docs.map(d=>d.data()).filter(Boolean))},e=>{});const tk=setInterval(rdBtn,1000);unRd=()=>{un();clearInterval(tk)}};
 if(u===UID){if(!C.fall){hub();return}start({u:UID,rid:C.fall.rid,mx:C.fall.mx,w:C.fall.w?1:0,v:C.v,n:C.n,g:C.g,a:C.a.join(" · ")});return}
 if(!DB)return;DB.doc("raid/"+u).get().then(s=>{if(rdU!==u)return;if(!s.exists){$("#rdc").textContent="이 친구는 이미 원래 모습으로 돌아왔다.";return}start(s.data())}).catch(()=>{$("#rdc").textContent="레이드 정보를 불러오지 못했다."})}
function drawRaid(hits){rdLast=hits;const u=rdU,own=u===UID,r=rdR;if(!r)return;const sd=own?(C.fall?C.fall.sd||0:0):(r.sd||0);rdHp=Math.max(0,r.mx-sumHits(hits)-sd);
 const c=$("#rdc");c.innerHTML="";const im=own?C.img:r.im;if(typeof im==="string"&&/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(im)){const i=document.createElement("img");i.className="av fallen-img";i.alt="타락한 모습";i.src=im;c.appendChild(i);if(!own)hiAv(i,u)}
 const h=document.createElement("h2"),sub=document.createElement("p"),bar=document.createElement("div"),fill=document.createElement("i"),hpt=document.createElement("p");
 h.textContent=(r.w?"🜏 절망의 마인 ":"타락한 ")+cn(u,r.n);c.classList.toggle("witch-card",!!r.w);sub.className="profile-sub";sub.textContent=(r.g||"-")+"등급 · "+(r.a||"");bar.className="bar raid-hp";fill.style.width=(rdHp/r.mx*100)+"%";bar.appendChild(fill);
 hpt.className="hint";hpt.style.margin="0";hpt.textContent="HP "+rdHp+" / "+r.mx;c.append(h,sub,bar,hpt);
 if(own){const t=document.createElement("p");t.className="hint";t.style.margin="8px 0 0";t.textContent="친구들이 맞서 줄 때까지 기다리거나, 5분에 한 번 스스로 그림자와 맞설 수 있다(피해 절반).";c.appendChild(t)}
 else{const t=document.createElement("p");t.className="hint";t.style.margin="8px 0 0";t.textContent=r.w?"절망의 마인은 친구가 아니어도 누구나 맞설 수 있다. 2분에 한 번 맞설 수 있고, 맞설 때마다 마인의 절망이 스며들어 내 절망도가 "+WITCH_DZ+" 오른다. 쓰러뜨리면 맞선 모두가 "+rwTxt(WITCH_ALL)+"을(를) 받는다.":"타락한 그림자는 단단하다. 2분에 한 번 맞설 수 있고, 맞설 때마다 그림자의 절망이 스며들어 내 절망도가 "+RAID_DZ+" 오른다. 친구들과 함께 맞서자.";c.appendChild(t)}
 const lg=$("#rdlg");lg.innerHTML="";const list=hits.slice().sort((a,b)=>(b.d||0)-(a.d||0));if(sd)list.push({n:(own?"나":r.n)+"의 저항",d:sd,self:1});
 if(!list.length)lg.innerHTML="<p class='hint' style='margin:0'>아직 아무도 맞서지 않았다.</p>";
 list.forEach(v=>{const p=document.createElement("p");p.textContent=(v.self?v.n:cn(v.u,v.n))+": 피해 "+(Number(v.d)||0)+(v.c?" ("+v.c+"회)":"");lg.appendChild(p)});
 rdBtn();if(rdHp<=0&&own)checkRaid()}
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
 try{const ref=DB.doc("raidhit/"+u+"/"+r.rid+"/"+UID),old=await ref.get(),o=(old.exists&&old.data())||{},lt=armedSk("light"),d=Math.round((pw()+R(10))*(lt?3:1)*(C.a.includes("불")?1.2:1));
  await ref.set({u:UID,n:nmOf(),d:(Number(o.d)||0)+d,c:(Number(o.c)||0)+1,ts:Date.now()});if(lt)useSk("light");C.rc[u]=Date.now();const hg=r.w?WITCH_HIT:8,hz=r.w?WITCH_DZ:RAID_DZ;C.gd=(C.gd||0)+hg;titleState();C.stats.raidHits=(C.stats.raidHits||0)+1;if(r.w){C.wj=C.wj||{};C.wj[u+"_"+r.rid]=C.wj[u+"_"+r.rid]||Date.now()}gain(0,hz);
  const s=await once(rhits(u,r.rid)),hp=r.mx-(r.sd||0)-sumHits(s.docs.map(x=>x.data()));let t=(lt?"구원의 빛! ":"")+(r.w?"절망의 마인 ":"타락한 ")+r.n+"에게 "+d+"의 피해를 주었다. (골드 +"+hg+", "+(r.w?"마인의":"그림자의")+" 절망이 스며들어 절망도 +"+hz+")";
  if(hp<=0&&r.w){giveRw(WITCH_LAST);C.stats.raidKills=(C.stats.raidKills||0)+1;C.stats.witchKills=(C.stats.witchKills||0)+1;guardAdd(50);note("raid","절망의 마인 "+r.n+"에게 마지막 일격을 넣었다!",u);t="마지막 일격! 절망의 마인 "+r.n+"의 왕관이 부서졌다. (골드 +"+(hg+WITCH_LAST.g)+", 마력석 +"+WITCH_LAST.m+") 토벌 보상은 잠시 뒤 따로 받는다."}
  else if(hp<=0){C.gd+=40;C.inv=C.inv||{};C.inv.mana=(C.inv.mana||0)+1;C.stats.raidKills=(C.stats.raidKills||0)+1;guardAdd(20);note("raid","타락한 "+r.n+"에게 마지막 일격을 넣어 되돌렸다.",u);t="마지막 일격! "+r.n+"을(를) 쓰러뜨렸다. 곧 원래 모습으로 돌아온다. (골드 +48, 마력석 +1)"}
  save();checkTitles();m.style.color="var(--mu)";m.textContent=t}
 catch(e){m.style.color="var(--bad)";m.textContent="공격하지 못했다. 데이터베이스 규칙에서 raid와 raidhit 경로가 열려 있는지 확인해야 한다."}
 b.disabled=false;rdBtn()};
$("#rdb").onclick=()=>hub();
const pDawn=t=>{const hr=Math.floor((t/3600000+9)%24);return hr<6};
function pInfo(h){const id="p"+h,g=rng(hs32(id)),p=n=>Math.floor(g()*n),m=p(50),v="ABCD"[p(4)],r=p(1000),T0=h*PS+m*60000,rg=pDawn(T0)?P_DAWN:P_DAY,need=rg[0]+r%(rg[1]-rg[0]+1);
 return{id,h,v,need,nm:VL[v].n+" "+PNAMES[p(PNAMES.length)],T0,G:T0+PGATHER,E:T0+PGATHER+PHEAL}}
const pHour=()=>Math.floor(Date.now()/PS);
// 지금 진행 중인 포탈(집결 중이거나 치유 단계)
const pCur=()=>{const h=pHour(),now=Date.now();return [pInfo(h),pInfo(h-1),pInfo(h-2)].filter(x=>now>=x.T0&&now<x.E)};
const pHealer=()=>(C.a||[]).some(a=>a==="빛"||a==="물")||C.t==="치유의 손길";
const pData={};
function pState(x,d){d=d||{};const j=d.j||{},hh=d.h||{},now=Date.now();
 const joined=Object.keys(j).filter(u=>j[u]&&typeof j[u]==="object"&&(typeof j[u].ts!=="number"||j[u].ts<=x.G)).sort((a,b)=>(j[a].ts||0)-(j[b].ts||0));
 const win=joined.length>=x.need,W=win?0:Math.ceil((x.need-joined.length)/x.need*P_HURT),healed=Object.values(hh).reduce((a,v)=>a+(Number(v&&v.amt)||0),0);
 return{j,hh,joined,win,gather:now<x.G,W,healed,left:Math.max(0,W-healed)}}
async function pFetch(x){try{const s=await DB.doc("portal/"+x.id).get();pData[x.id]=(s.exists&&s.data())||{};return pData[x.id]}catch(e){return pData[x.id]||{}}}
// 참가한 포탈의 결과 보상(한 번만)
function pClaim(x,st){if(!C||!C.pj||!C.pj[x.id]||(C.pc&&C.pc[x.id])||Date.now()<x.G)return;C.pc=keepIds(C.pc,x.id);titleState();
 if(st.win){C.gd=(C.gd||0)+50;C.stats.portalWins=(C.stats.portalWins||0)+1;gain(30,5);guardAdd(30);note("portal",x.nm+" 토벌 성공! "+st.joined.length+"명이 함께했다. 골드 50, 마을 점수 30")}
 else{C.gd=(C.gd||0)+10;gain(10,8);guardAdd(5);note("portal",x.nm+"에 정원이 모이지 않아 주민 "+st.W+"명이 다쳤다. 치유를 도와주자. (골드 10, 마을 점수 5)")}
 save();checkTitles()}
let pBusy=false;
async function pTick(){if(!C||!XON()||pBusy)return;pBusy=true;try{const now=Date.now(),list=pCur();
 // 새 포탈이 열리면 한 번 알린다
 list.forEach(x=>{if(now<x.G&&!(C.pn&&C.pn[x.id])){C.pn=keepIds(C.pn,x.id);save();const t="☄ "+x.nm+"이(가) 열렸다! "+xHM(x.G)+"까지 "+x.need+"명이 모여야 한다.";note("portal",t);toast(t,portalView);ding()}});
 const ids=new Set(list.map(x=>x.id));Object.keys(C.pj||{}).forEach(id=>{if(!(C.pc&&C.pc[id]))ids.add(id)});
 for(const id of ids){const x=pInfo(Number(id.slice(1)));if(now<x.T0)continue;const d=await pFetch(x);pClaim(x,pState(x,d))}
 const b=$("#b-portal");if(b){const g=list.find(x=>now<x.G),hl=list.find(x=>{const st=pState(x,pData[x.id]);return !st.gather&&st.left>0});b.textContent=g?"마수 포탈 (열림! "+xFmt(g.G-now)+")":hl?"마수 포탈 (치유 필요)":"마수 포탈"}}
 catch(e){}finally{pBusy=false}}
setInterval(()=>{if(document.hidden)return;pTick().then(()=>{if(!$("#v-portal").hidden)pRender();if(!$("#v-hub").hidden)hubPortal()})},10000);
/* 마을 탭 요약: 진행 중인 마수 포탈과 이번 주 마을 순위를 짧게 보여 준다. 누르면 자세한 화면으로 간다. */
function hubPortal(){const box=$("#hpo");if(!box||!C)return;box.innerHTML="";if(!XON()){box.appendChild(elT("p","hint","서버에 연결되어야 마수 포탈이 열린다."));return}
 const now=Date.now(),list=pCur().sort((a,b)=>a.T0-b.T0).reverse();
 if(!list.length){box.appendChild(elT("p","hint","지금 열린 포탈이 없다. 한 시간에 한 번, 예고 없이 열린다."));return}
 list.forEach(x=>{const st=pState(x,pData[x.id]),w=elT("div","dq"+(st.gather?" done":"")),cp=elT("div","dq-copy");let sub,lab;
  if(st.gather){const sp=elT("small","",x.need+"명 필요 · "+st.joined.length+"명 출동 · 마감까지 ");const t=elT("b","",xFmt(x.G-now));t.style.display="inline";t.dataset.pt=x.G;sp.appendChild(t);cp.append(elT("b","","☄ "+x.nm),sp);lab=st.j[UID]?"출동함":"출동"}
  else if(st.win){cp.append(elT("b","",x.nm),elT("small","","토벌 성공 · "+st.joined.length+"명이 함께했다"));lab="보기"}
  else{cp.append(elT("b","",x.nm),elT("small","",st.left>0?"부상자 "+st.left+"명 남음 · 치유가 필요하다":"부상자를 모두 치유했다"));lab=st.left>0?"치유":"보기"}
  const b=elT("button","chip",lab);b.type="button";b.onclick=portalView;w.append(cp,b);box.appendChild(w)})}
let hgT=0,hgC=null;
async function hubGuard(force){const box=$("#hgu");if(!box||!C)return;if(!XON()){box.innerHTML="<p class='hint'>서버에 연결되어야 마을 경쟁에 참여할 수 있다.</p>";return}
 if(force||!hgC||Date.now()-hgT>30000){hgT=Date.now();try{hgC=await guardWeek(wkKey())}catch(e){}}if(!hgC||$("#v-hub").hidden)return;
 const rank=Object.values(hgC).sort((a,b)=>b.tot-a.tot),top=rank[0].tot||0,my=Math.max(((hgC[C.v]||{ps:[]}).ps.find(p=>p.u===UID)||{}).pt||0,C.gp&&C.gp.wk===wkKey()?C.gp.pt:0);box.innerHTML="";
 rank.forEach((r,i)=>{const w=elT("div","dq"+(r.v===C.v?" done":"")),cp=elT("div","dq-copy"),bar=elT("div","bar"),f=elT("i");f.style.width=(top?r.tot/top*100:0)+"%";bar.appendChild(f);
  cp.append(elT("b","",(i+1)+"위 "+VL[r.v].n+(r.v===C.v?" (우리 마을)":"")),elT("small","",r.tot+"점 · 참여 "+r.ps.length+"명"),bar);w.appendChild(cp);w.onclick=guardView;w.style.cursor="pointer";box.appendChild(w)});
 const m=elT("p","hint","내 이번 주 점수 "+my+" / 1000 · 누르면 자세히 볼 수 있다.");m.style.margin="4px 0 0";box.appendChild(m)}
setInterval(()=>{if(C&&!$("#v-hub").hidden){hubGuard();hubBoss()}},30000);
// 마을 탭 요약: 오늘의 지금의 오전·오후 보스와 이번 주 주간 보스. 누르면 보스 레이드 화면으로 간다.
async function hubBoss(){const box=$("#hbo");if(!box||!C)return;if(!DB){box.innerHTML="<p class='hint'>보스 레이드를 쓸 수 없다.</p>";return}bossDay();
 const rows=await Promise.all(["d","w"].map(async k=>{const b=bossOf(k);let list=[];try{list=await bossList(b)}catch(e){}return{k,b,list}}));if($("#v-hub").hidden)return;box.innerHTML="";
 rows.forEach(({k,b,list})=>{const cfg=BOSS[k],dead=bossDead(k,list,b.id),mx=bhp(k,list,b.id),hp=dead?0:Math.max(0,mx-sumHits(list)),left=cfg.t-(C.wb[k]||0),weak=(C.a||[]).includes(b.def[2]);
  const w=elT("div","dq"+(dead?" got":"")),cp=elT("div","dq-copy"),bar=elT("div","bar"),f=elT("i");f.style.width=(mx?hp/mx*100:100)+"%";f.style.background="linear-gradient(90deg,#4a1a6b,#c0406a)";bar.appendChild(f);
  cp.append(elT("b","",(b.nm||cfg.nm)+" · "+b.def[0]),elT("small","",dead?"처치 완료":"HP "+hp+" / "+mx+" · "+(k==="d"?"남은 공격 ":"오늘 공격 ")+Math.max(0,left)+" / "+cfg.t+"번 남음"+(weak?" · 약점 속성!":"")),bar);
  const bt=elT("button","chip",dead?"보기":"도전");bt.type="button";bt.onclick=bossView;w.append(cp,bt);box.appendChild(w)})}
setInterval(()=>{if(!$("#v-portal").hidden)pRender(true);if(!$("#v-hub").hidden){const now=Date.now();document.querySelectorAll("#hpo [data-pt]").forEach(e=>e.textContent=xFmt(Number(e.dataset.pt)-now))}},1000);
function portalView(){show("portal");$("#pm").textContent="";pTick().then(()=>pRender())}
function pSay(t,bad){const m=$("#pm");m.style.color=bad?"var(--bad)":"var(--mu)";m.textContent=t}
async function pJoin(x){if(C.fall)return pSay("타락한 동안에는 포탈에 갈 수 없다.",1);if(C.dz>=90)return pSay("절망도가 너무 높아 싸울 수 없다.",1);if(Date.now()>=x.G)return pSay("이미 집결 시간이 끝났다.",1);
 try{await DB.doc("portal/"+x.id+"/j/"+UID).set({u:UID,n:nmOf(),p:pw(),ts:{".sv":"timestamp"}});C.pj=keepIds(C.pj,x.id);save();const d=pData[x.id]=pData[x.id]||{};(d.j=d.j||{})[UID]={u:UID,n:nmOf(),p:pw(),ts:Date.now()};pSay(x.nm+"에 출동했다. 집결이 끝나면 결과가 나온다.");pRender()}
 catch(e){pSay("출동하지 못했다. 이미 출동했거나 서버 규칙에서 portal 경로가 막혀 있다.",1)}}
async function pHeal(x,fin){const d=pData[x.id]||{},mine=(d.h||{})[UID]||{},k=Number(mine.k)||0,amt=Number(mine.amt)||0,per=Number(mine.per)||(pHealer()?6:3),st=pState(x,d);
 if(Date.now()>=x.E)return pSay("치유할 수 있는 시간이 끝났다.",1);if(st.left<=0)return pSay("다친 주민이 모두 치유되었다.");if(k>=PHEAL_MAX)return pSay("이 포탈에서는 이미 3번 치유했다.",1);
 try{if(!fin){await DB.doc("portal/"+x.id+"/h/"+UID).set({u:UID,n:nmOf(),k,amt,per,s:{".sv":"timestamp"}});pSay("치유를 시작했다. 1분 뒤에 '치유 완료'를 누르자.")}
  else{if(typeof mine.s!=="number"||Date.now()-mine.s<PHEAL_WAIT)return;const add=Math.min(per,st.left);await DB.doc("portal/"+x.id+"/h/"+UID).set({u:UID,n:nmOf(),k:k+1,amt:amt+per,per});
   C.gd=(C.gd||0)+15;titleState();C.stats.heals=(C.stats.heals||0)+1;gain(5,-3);guardAdd(10);save();checkTitles();pSay("주민 "+add+"명을 치유했다. 골드 15, 마을 점수 10. 마음이 조금 가벼워졌다.")}
  await pFetch(x);pRender()}
 catch(e){pSay("치유하지 못했다. 서버 규칙에서 portal 경로가 막혀 있다.",1)}}
function pRender(timeOnly){const box=$("#pl3");if(!box||!C)return;const now=Date.now(),list=pCur().sort((a,b)=>b.T0-a.T0);
 if(timeOnly){box.querySelectorAll("[data-pt]").forEach(e=>{const t=Number(e.dataset.pt);e.textContent=xFmt(t-now)});return}
 box.innerHTML="";if(!XON()){box.appendChild(elT("p","hint","서버에 연결되어야 마수 포탈에 갈 수 있다."));return}
 if(!list.length){box.appendChild(elT("p","hint","지금 열린 마수 포탈이 없다. 포탈은 예고 없이, 한 시간에 한 번 어딘가에 열린다. 열리면 화면 위에 알림이 뜬다."));return}
 list.forEach(x=>{const d=pData[x.id]||{},st=pState(x,d),c=elT("div","card boss-card w");c.style.marginBottom="12px";
  const cd=(lab,t)=>{const p=elT("p","hint",lab+" ");const s=elT("b","",xFmt(t-now));s.dataset.pt=t;p.appendChild(s);return p};
  c.append(elT("p","boss-tag",VL[x.v].n+"에 열린 포탈"),elT("h2","",x.nm));
  if(st.gather){c.append(elT("p","","필요 인원 "+x.need+"명 · 모인 인원 "+st.joined.length+"명"),cd("집결 마감까지",x.G));
   const bar=elT("div","bar"),f=elT("i");f.style.width=Math.min(100,st.joined.length/x.need*100)+"%";bar.appendChild(f);c.appendChild(bar);
   if(st.joined.length)c.appendChild(elT("p","boss-info","출동: "+st.joined.map(u=>cn(u,st.j[u].n)).join(", ")));
   const inI=!!st.j[UID],b=elT("button","btn",inI?"출동했다":"포탈로 출동한다");b.type="button";b.disabled=inI||!!C.fall||C.dz>=90;b.onclick=()=>pJoin(x);c.appendChild(b);
   c.appendChild(elT("p","boss-info","성공하면 골드 50과 마을 점수 30. 정원이 모자라면 모자란 비율만큼 주민이 다친다(최대 30명)."))}
  else if(st.win){c.append(elT("p","boss-dead","토벌 성공!"),elT("p","hint",st.joined.length+"명이 함께 포탈을 닫았다: "+st.joined.map(u=>cn(u,st.j[u].n)).join(", ")))}
  else{c.append(elT("p","fallbar","정원이 모이지 않아 마수가 쏟아졌다. 주민 "+st.W+"명이 다쳤다."),elT("p","","치유됨 "+Math.min(st.healed,st.W)+" / "+st.W+" · 남은 부상자 "+st.left+"명"));
   const bar=elT("div","bar"),f=elT("i");f.style.width=(st.W?Math.min(100,st.healed/st.W*100):100)+"%";f.style.background="linear-gradient(90deg,#2e6b5a,#6fd1a8)";bar.appendChild(f);c.appendChild(bar);
   if(st.left>0){c.appendChild(cd("치유 마감까지",x.E));const mine=st.hh[UID]||{},k=Number(mine.k)||0,per=Number(mine.per)||(pHealer()?6:3),pending=typeof mine.s==="number";
    const ready=pending&&now-mine.s>=PHEAL_WAIT,b=elT("button","btn",k>=PHEAL_MAX?"이번 포탈에서는 3번 모두 치유했다":pending?(ready?"치유 완료 (+"+per+"명)":"치유하는 중..."):"치유 시작 (한 번에 "+per+"명)");b.type="button";
    b.disabled=k>=PHEAL_MAX||(pending&&!ready);b.onclick=()=>pHeal(x,pending);c.appendChild(b);
    if(pending&&!ready)c.appendChild(cd("치유 완료까지",mine.s+PHEAL_WAIT));
    c.appendChild(elT("p","boss-info","내 치유 "+k+" / "+PHEAL_MAX+"번 · 치유할 때마다 골드 15, 마을 점수 10, 절망도 -3"+(pHealer()?" · 치유계라서 한 번에 6명을 치유한다.":" · 빛·물 속성이나 '치유의 손길' 특성이면 한 번에 6명을 치유한다.")))}
   else c.appendChild(elT("p","boss-dead","다친 주민이 모두 치유되었다."));
   const hs=Object.keys(st.hh).filter(u=>Number(st.hh[u].amt)>0);if(hs.length)c.appendChild(elT("p","boss-info","치유한 사람: "+hs.map(u=>cn(u,st.hh[u].n)+" "+st.hh[u].amt+"명").join(", ")))}
  box.appendChild(c)})}
$("#pb").onclick=()=>hub();
const wkKey=(off=0)=>{const d=new Date();d.setDate(d.getDate()-((d.getDay()+6)%7)-7*off);return ymd(d)};
/* 점수를 더하기 전에 이번 주 서버에 올라가 있는 내 점수를 한 번 확인해서, 더 큰 쪽에서 이어 센다.
   (예전에는 기록 복구·다른 창 때문에 이 기기의 점수가 서버보다 작으면, 작은 값으로 덮어써서 마을 점수가 오히려 줄거나 한동안 오르지 않았다.)
   서버에 쓰지 못한 점수는 표시해 두었다가 30초마다 다시 올린다. */
const gSync={};
async function guardAdd(n){if(!C||!XON()||!n)return;const wk=wkKey();if(!C.gp||C.gp.wk!==wk)C.gp={wk,pt:0};
 if(!gSync[wk+C.v]){try{const sv=Number(((await DB.doc("guard/"+wk+"/"+C.v+"/"+UID).get()).data()||{}).pt)||0;gSync[wk+C.v]=1;if(C.gp.wk===wk&&sv>C.gp.pt)C.gp.pt=Math.min(1000,sv)}catch(e){}}
 if(!C.gp||C.gp.wk!==wk)return;const b=C.gp.pt;C.gp.pt=Math.min(1000,b+n);if(C.gp.pt===b)return;/* 최대(1000점)에 닿으면 조용히 넘어간다. 내 점수는 마을 경쟁 칸에서 볼 수 있다. */C.gp.dirty=1;save();guardPush()}
function guardPush(){if(!C||!C.gp||!C.gp.dirty||!XON()||C.gp.wk!==wkKey())return;const pt=C.gp.pt;
 DB.doc("guard/"+C.gp.wk+"/"+C.v+"/"+UID).set({u:UID,n:nmOf(),pt}).then(()=>{if(C&&C.gp&&C.gp.pt===pt){delete C.gp.dirty;save()}}).catch(()=>{})}
async function guardWeek(wk){const out={};await Promise.all("ABCD".split("").map(async v=>{let d={};try{const s=await DB.doc("guard/"+wk+"/"+v).get();d=(s.exists&&s.data())||{}}catch(e){}
 const ps=Object.keys(d).filter(u=>d[u]&&typeof d[u]==="object").map(u=>({u,n:d[u].n,pt:Math.max(0,Math.min(1000,Number(d[u].pt)||0))})).sort((a,b)=>b.pt-a.pt);out[v]={v,ps,tot:ps.reduce((a,p)=>a+p.pt,0)}}));return out}
async function guardView(){show("guard");const box=$("#gl3"),m=$("#gm");m.textContent="";box.innerHTML="<p class='hint'>순위를 불러오는 중...</p>";if(!XON()){box.innerHTML="<p class='hint'>서버에 연결되어야 마을 경쟁에 참여할 수 있다.</p>";return}
 const [cur,last]=await Promise.all([guardWeek(wkKey()),guardWeek(wkKey(1))]);if($("#v-guard").hidden)return;box.innerHTML="";
 const rank=Object.values(cur).sort((a,b)=>b.tot-a.tot),mine=cur[C.v],myPt=(mine.ps.find(p=>p.u===UID)||{}).pt||0,end=new Date();end.setDate(end.getDate()+(7-((end.getDay()+6)%7)));end.setHours(0,0,0,0);
 box.appendChild(elT("p","x-cd","이번 주 집계 · "+(end.getMonth()+1)+"월 "+end.getDate()+"일 0시에 마감 · 내 점수 "+myPt+" / 1000"));
 rank.forEach((r,i)=>{const w=elT("div","card");w.style.cssText="margin-top:8px;padding:12px 14px"+(r.v===C.v?";border-color:#b89b5e":"");
  const top=elT("div","");top.style.cssText="display:flex;justify-content:space-between;align-items:baseline;gap:8px";top.append(elT("h2","",(i+1)+"위 · "+VL[r.v].n+(r.v===C.v?" (우리 마을)":"")),elT("b","",r.tot+"점"));w.appendChild(top);
  const bar=elT("div","bar"),f=elT("i");f.style.width=(rank[0].tot?r.tot/rank[0].tot*100:0)+"%";f.style.background="linear-gradient(90deg,#8a6a2e,#e6c56a)";bar.appendChild(f);w.appendChild(bar);
  w.appendChild(elT("p","boss-info","참여 "+r.ps.length+"명"+(r.ps.length?" · 1위 "+cn(r.ps[0].u,r.ps[0].n)+" "+r.ps[0].pt+"점":"")));
  if(r.v===C.v&&r.ps.length){const ol=elT("ol","boss-rank");r.ps.slice(0,5).forEach(p=>ol.appendChild(elT("li",p.u===UID?"me":"",cn(p.u,p.n)+" · "+p.pt+"점")));w.appendChild(ol)}box.appendChild(w)});
 // 지난주 우승
 const lr=Object.values(last).sort((a,b)=>b.tot-a.tot),lw=lr[0],lwk=wkKey(1);
 if(lw&&lw.tot>0){const c=elT("div","card");c.style.marginTop="16px";c.append(elT("p","boss-tag","지난주 결과"),elT("h2","","우승: "+VL[lw.v].n+" ("+lw.tot+"점)"));
  const joined=lw.v===C.v&&lw.ps.some(p=>p.u===UID&&p.pt>0),got=C.gwc===lwk;
  if(joined){const b=elT("button","btn",got?"우승 보상을 받았다":"우승 보상 받기 ("+rwTxt(GUARD_WIN)+")");b.type="button";b.disabled=got;b.onclick=()=>{if(C.gwc===lwk)return;C.gwc=lwk;giveRw(GUARD_WIN);note("guard",VL[lw.v].n+" 우승 보상: "+rwTxt(GUARD_WIN));save();checkTitles();guardView();m.style.color="var(--mu)";m.textContent="우승 보상을 받았다: "+rwTxt(GUARD_WIN)};c.appendChild(b)}
  else c.appendChild(elT("p","hint",lw.v===C.v?"지난주에 점수를 내지 않아 우승 보상이 없다.":"우승 마을에서 점수를 낸 사람만 보상을 받는다."));box.appendChild(c)}
 box.appendChild(elT("p","boss-info","점수 얻는 법: 정기 출정 성공 8~14(위험도) · 실패 2 · 보스 공격 3 · 마수 포탈 성공 30 · 실패 5 · 치유 10 · 일일 의뢰 모두 완료 15 · 타락한 친구 되돌리기 20. 한 사람의 주간 점수는 최대 1000."))}
$("#gb").onclick=()=>hub();

/* 공지: 운영자(admins 목록에 있는 계정)만 쓸 수 있고, 모든 플레이어의 화면 위쪽에 보인다. 서버 기록: notice/{번호}
   새 공지가 올라오면 한 번 알림(화면 위 알림·알림함)을 띄운다. 각자 ✕로 닫을 수 있고, 더 새 공지가 오면 다시 보인다. 최근 5개까지만 남긴다. */
let NTC=[],ntcT=0;// 운영자 한 명당 최근 30개까지 보관
// 공지 탭: 모든 공지를 최근 순으로. 연 순간 읽은 것으로 표시한다.
function ntcView(keep){if(!keep){show("ntc");loadNotice(true)}try{drawRst()}catch(e){}const l=$("#ntcl");if(!l||!C)return;l.innerHTML="";const seen=C.ntcSeen||0;
 if(ADM[UID]){const w=elT("p","hint","공지 쓰기와 내리기는 화면 위쪽 공지 칸의 '📢 공지 쓰기'에서 할 수 있다.");l.appendChild(w)}
 if(!NTC.length){l.appendChild(elT("p","hint","아직 공지가 없다."));}
 NTC.forEach(n=>{const d=new Date(Number(n.ts)),c=elT("div","ntc-card ntc-item"+(n.u?" urgent":"")+(Number(n.ts)>seen?" new":""));
  c.append(elT("p","ntc-tag",(n.u?"📢 중요 공지":"📢 공지")+" · "+d.getFullYear()+"."+(d.getMonth()+1)+"."+d.getDate()+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")+(n.n?" · "+String(n.n).slice(0,20):"")+(Number(n.ts)>seen?" · 새 공지":"")),elT("p","ntc-t",String(n.t).slice(0,300)));
  if(ADM[UID]&&n.src==="p"&&n.by===UID){const x=elT("button","chip","이 공지 내리기");x.type="button";x.style.cssText="margin-top:8px;padding:5px 12px;font-size:.8rem";x.onclick=async()=>{if(!confirm("이 공지를 내릴까?"))return;C.ntcl=(C.ntcl||[]).filter(o=>o.id!==n.id);save();try{await DB.doc("players/"+UID+"/ntc").set(C.ntcl)}catch(e){}NTC=NTC.filter(o=>o!==n);drawNotice();ntcView(true)};c.appendChild(x)}
  l.appendChild(c)});
 if(NTC.length&&Number(NTC[0].ts)>seen){C.ntcSeen=Number(NTC[0].ts);save()}updNav()}
async function loadNotice(force){if(!C||!XON())return;if(!force&&Date.now()-ntcT<20000)return;ntcT=Date.now();loadDoom();rstCheck();let list=null;
 // 공지는 운영자 본인의 플레이어 기록(players/{운영자}/ntc)에 저장한다. 그 칸은 운영자 본인만 쓸 수 있고, 운영자 목록(admins)은 콘솔에서만 바뀌므로
 // 서버 규칙을 따로 추가하지 않아도 운영자만 공지를 올릴 수 있다. notice 규칙이 있으면 그쪽 공지도 함께 읽는다.
 const all=[];let okAny=false;
 try{const sn=await once(DB.collection("notice").limit(5));okAny=true;sn.docs.forEach(d=>all.push(Object.assign({id:d.id,src:"n"},d.data()||{})))}catch(e){}
 for(const u of Object.keys(ADM)){try{const d=(await DB.doc("players/"+u+"/ntc").get()).data();okAny=true;Object.values(d||{}).forEach(n=>{if(n&&typeof n==="object")all.push(Object.assign({},n,{src:"p",by:u}))})}catch(e){}}
 if(okAny)list=all.filter(n=>typeof n.t==="string"&&n.t.trim()&&Number(n.ts)).sort((a,b)=>Number(b.ts)-Number(a.ts)).slice(0,NTC_KEEP);
 if(!list)return;NTC=list;const top=NTC[0];try{updNav();if(!$("#v-ntc").hidden)ntcView(true)}catch(e){}
 // 처음 확인할 때는 이미 있던 공지로 알림을 띄우지 않고, 그 뒤에 올라온 공지부터 알린다.
 if(C.nts==null){C.nts=top?Number(top.ts)||1:1;save()}
 else if(top&&(Number(top.ts)||0)>C.nts){const first=false;C.nts=Number(top.ts)||Date.now();save();if(!first){note("notice","공지: "+top.t.slice(0,120));toast("📢 공지: "+top.t.slice(0,60),()=>{keep("mgr_ntc_x","");drawNotice()});ding()}}
 drawNotice()}
setInterval(()=>{if(!document.hidden)loadNotice()},60000);
function drawNotice(){try{drawDoom()}catch(e){}const b=$("#ntc");if(!b)return;const isA=!!(C&&ADM[UID]),top=NTC[0],hid=!!top&&lget("mgr_ntc_x")===String(top.ts),openForm=!!b.querySelector(".ntc-adm:not([hidden]) textarea");
 if(openForm)return;// 운영자가 공지를 쓰는 중이면 다시 그리지 않는다
 b.innerHTML="";const show=!!C&&((top&&!hid)||isA);b.hidden=!show;if(!show)return;
 if(top&&!hid){const c=elT("div","ntc-card"+(top.u?" urgent":"")),d=new Date(Number(top.ts)||Date.now());
  c.append(elT("p","ntc-tag",(top.u?"📢 중요 공지":"📢 공지")+" · "+(d.getMonth()+1)+"/"+d.getDate()+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")+(top.n?" · "+String(top.n).slice(0,20):"")),elT("p","ntc-t",top.t.slice(0,300)));
  const x=elT("button","ntc-x","✕");x.type="button";x.setAttribute("aria-label","공지 닫기");x.onclick=()=>{keep("mgr_ntc_x",String(top.ts));drawNotice()};c.appendChild(x);b.appendChild(c)}
 if(isA){const row=elT("div","row");row.style.marginTop="8px";const w=elT("button","chip","📢 공지 쓰기");w.type="button";w.style.cssText="flex:0 0 auto;padding:6px 12px;font-size:.85rem";row.appendChild(w);
  if(top){const del=elT("button","chip","현재 공지 내리기");del.type="button";del.style.cssText="flex:0 0 auto;padding:6px 12px;font-size:.85rem";del.onclick=async()=>{if(!confirm("지금 공지를 내릴까?"))return;try{if(top.src==="p"&&top.by===UID){C.ntcl=(C.ntcl||[]).filter(o=>o.id!==top.id);save();await DB.doc("players/"+UID+"/ntc").set(C.ntcl)}else if(top.src==="n")await DB.doc("notice/"+top.id).delete();else{alert("다른 운영자가 올린 공지는 그 운영자만 내릴 수 있다.");return}NTC.shift();drawNotice()}catch(e){alert("공지를 내리지 못했다.")}};row.appendChild(del)}
  const f=elT("form","ntc-adm");f.hidden=true;const ta=elT("textarea");ta.rows=3;ta.maxLength=300;ta.placeholder="모두에게 보일 공지 (최대 300자)";ta.setAttribute("aria-label","공지 내용");
  const lb=elT("label","");lb.style.cssText="display:flex;align-items:center;gap:6px;margin-top:6px;font-size:.88rem;color:var(--mu)";const ck=elT("input");ck.type="checkbox";lb.append(ck,document.createTextNode("중요 공지 (붉게 강조)"));
  const go=elT("button","btn","게시하기");go.type="submit";const cancel=elT("button","btn g","취소");cancel.type="button";cancel.onclick=()=>{f.hidden=true;drawNotice()};const msg=elT("p","msg","");
  f.append(ta,lb,go,cancel,msg);w.onclick=()=>{f.hidden=!f.hidden;if(!f.hidden)ta.focus()};
  f.onsubmit=async e=>{e.preventDefault();const t=ta.value.trim().slice(0,300);if(!t){msg.textContent="내용을 적어야 한다.";return}go.disabled=true;
   try{const id=Date.now().toString(36),nt={id,t,n:nmOf(),u:ck.checked?1:0,ts:Date.now()};C.ntcl=[nt].concat(C.ntcl||[]).slice(0,NTC_KEEP);save();await DB.doc("players/"+UID+"/ntc").set(C.ntcl);
    keep("mgr_ntc_x","");f.hidden=true;ta.value="";await loadNotice(true);toast("공지를 게시했다.")}
   catch(err){msg.textContent="게시하지 못했다. 인터넷 연결을 확인하고 다시 시도해 보자."}go.disabled=false};
  b.append(row,f)}}
/* ── '멸망까지' 카운트다운 (D-14) ──
   운영자가 시작일을 고르면 그날이 D-14, 14일 뒤가 D-DAY다. 모든 화면 위쪽에 보인다.
   저장 위치는 공지와 같은 방식: 운영자 본인의 플레이어 기록(players/{운영자}/dd). 그 칸은 운영자 본인만 쓸 수 있어서
   서버 규칙을 따로 추가하지 않아도 운영자만 날짜를 바꿀 수 있다. 값: {d:"2026-10-27"(시작일), ts:저장 시각} 또는 비어 있음(꺼짐). */
const DOOM_DAYS=14;let DOOM=null,doomT=0;
const doomOk=o=>!!o&&typeof o==="object"&&/^\d{4}-\d{2}-\d{2}$/.test(String(o.d||""));
const doomYmd=t=>{const d=new Date(t);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const doomDay=s=>{const [y,m,d]=String(s).split("-").map(Number);return Math.round(Date.UTC(y,m-1,d)/86400000)};
function doomState(o){if(!doomOk(o))return null;const st=doomDay(o.d),end=st+DOOM_DAYS,today=doomDay(doomYmd(srvNow())),left=end-today;
 const e=new Date(Date.UTC(1970,0,1)+end*86400000),endTx=(e.getUTCMonth()+1)+"월 "+e.getUTCDate()+"일";
 const [,sm,sd]=o.d.split("-").map(Number);
 return {left,before:today<st,after:today>end,endTx,startTx:sm+"월 "+sd+"일",pct:Math.max(0,Math.min(100,(today-st)/DOOM_DAYS*100))}}
async function loadDoom(){if(!XON())return;let best=null,ok=false;
 for(const u of Object.keys(ADM)){try{const d=(await DB.doc("players/"+u+"/dd").get()).data();ok=true;if(d&&typeof d==="object"&&(!best||Number(d.ts||0)>Number(best.ts||0)))best=d}catch(e){}}
 if(ok){DOOM=best&&best.d?best:null;doomT=Date.now();drawDoom()}}
function drawDoom(){const b=$("#doom");if(!b)return;const isA=!!(C&&ADM[UID]),src=XON()?DOOM:(C&&C.doom)||null,st=doomState(src);
 if(b.querySelector(".doom-form:not([hidden]) input:focus"))return;// 운영자가 날짜를 고르는 중이면 다시 그리지 않는다
 b.innerHTML="";const live=!!st&&!st.before&&!st.after,show=!!C&&(live||isA);b.hidden=!show;if(!show)return;
 const c=elT("div","doom-card"+(live&&st.left<=3?" near":"")+(live&&st.left<=0?" dday":"")+(live?"":" off"));
 const l=elT("div","doom-l");l.append(elT("p","doom-t","멸망까지"));
 if(live)l.append(elT("p","doom-s",st.left<=0?"오늘, 세계가 끝난다.":st.endTx+" 멸망 · "+st.startTx+" 시작"));
 else l.append(elT("p","doom-s",!st?"카운트다운이 꺼져 있다. 운영자만 보인다.":st.before?st.startTx+"에 시작한다 (D-14). 운영자만 보인다.":"멸망의 날("+st.endTx+")이 지났다. 운영자만 보인다."));
 c.append(l,elT("p","doom-n",live?(st.left<=0?"D-DAY":"D-"+st.left):"—"));
 if(live){const bar=elT("div","bar doom-bar"),i=elT("i");i.style.width=st.pct+"%";bar.appendChild(i);c.appendChild(bar)}
 b.appendChild(c);
 if(isA){const set=elT("button","chip doom-set","⏳ 시작일 설정");set.type="button";
  const f=elT("form","doom-form");f.hidden=true;const inp=elT("input");inp.type="date";inp.value=doomOk(src)?src.d:doomYmd(srvNow());inp.setAttribute("aria-label","카운트다운 시작일");
  const hint=elT("p","hint","고른 날이 D-14, 14일 뒤가 D-DAY가 된다.");
  const go=elT("button","btn","저장");go.type="submit";const off=elT("button","btn g","카운트다운 끄기");off.type="button";off.hidden=!doomOk(src);const cancel=elT("button","btn g","취소");cancel.type="button";const msg=elT("p","msg","");
  const upd=()=>{const v=doomState({d:inp.value});hint.textContent=v?"시작 "+v.startTx+" (D-14) → 멸망 "+v.endTx+" (D-DAY)":"날짜를 골라야 한다."};inp.oninput=upd;upd();
  f.append(inp,hint,go,off,cancel,msg);set.onclick=()=>{f.hidden=!f.hidden;if(!f.hidden)inp.focus()};cancel.onclick=()=>{f.hidden=true;drawDoom()};
  const put=async v=>{go.disabled=off.disabled=true;try{C.doom=v;save();if(XON()){await DB.doc("players/"+UID+"/dd").set(v);DOOM=v}f.hidden=true;drawDoom();toast(v?"'멸망까지' 시작일을 "+doomState(v).startTx+"로 정했다.":"'멸망까지' 카운트다운을 껐다.")}
   catch(e){msg.textContent="저장하지 못했다. 인터넷 연결을 확인하고 다시 시도해 보자."}go.disabled=off.disabled=false};
  f.onsubmit=e=>{e.preventDefault();if(!/^\d{4}-\d{2}-\d{2}$/.test(inp.value)){msg.textContent="날짜를 골라야 한다.";return}put({d:inp.value,ts:Date.now()})};
  off.onclick=()=>{if(confirm("카운트다운을 끌까? 모두의 화면에서 사라진다."))put(null)};
  b.append(set,f)}}
setInterval(()=>{if(document.hidden)return;if(XON()&&Date.now()-doomT>60000)loadDoom();else drawDoom()},30000);
/* ── 시즌 초기화 ──
   운영자가 '시즌 초기화'를 실행하면 운영자 본인의 플레이어 기록(players/{운영자}/rst)에 {id:실행 시각}을 남긴다(공지·카운트다운과 같은 방식).
   모든 플레이어는 접속할 때와 1분마다 이 표시를 확인하고, 내 캐릭터가 그보다 오래된 시즌이면(C.rsv < id) 한 번 초기화한다.
   남기는 것: 이름·성별·마을·등급·속성·특성, 프로필(사진·설정), 기록(칭호·도감·통계), 사역마(+품고 있는 알).
   이미 받은 보상·이미 본 알림 표시도 남긴다(초기화 뒤 같은 보상을 다시 받거나 옛 알림이 다시 뜨지 않게).
   그 밖의 진행(레벨·경험치·골드·아이템·무기·각인·절망도·친구·선물·의뢰·시설 기여 등)은 캐릭터를 처음 만든 상태로 돌린다.
   공용 데이터(채팅·1:1·게시판, 친구 소식·공명·선물, 마을 경쟁, 보스·웨이브·타락 레이드)는 운영자가 실행할 때 서버에서 지운다. */
let RST=null,rstT=0;
const RST_KEEP=["n","s","v","a","g","t","img","pf","picSig","titles","ti","dex","stats","pets","pet","petSeen","petGone","egg",
 "cmp","founder","origin","rescued","tut","healOff","ntcl","doom","rst","born","last",
 "fs","rs","gs","nts","ntcSeen","vcSeen","bdSeen","duSeen","rsn","pn","duNt","drn","drw","wvn1","wvn2","pc","wvc","wbc","gwc"];
const rstOld=p=>!!RST&&!!p&&typeof p==="object"&&(Number(p.rv)||0)<RST.id;
async function rstLoad(){if(!XON())return RST;let best=null,ok=false;const us=new Set(Object.keys(ADM).concat(typeof ADMIN_FIXED!=="undefined"?ADMIN_FIXED:[]));
 for(const u of us){try{const d=(await DB.doc("players/"+u+"/rst").get()).data();ok=true;if(d&&Number(d.id)>0&&(!best||Number(d.id)>Number(best.id)))best={id:Number(d.id),by:u}}catch(e){}}
 if(ok){RST=best;rstT=Date.now()}return RST}
async function rstCheck(boot){if(!C||!XON())return;if(!boot&&Date.now()-rstT<55000)return;const R=await rstLoad();if(!R||!C)return;
 if((Number(C.rsv)||0)>=R.id)return;
 if(Number(C.born)>R.id){C.rsv=R.id;save();return}// 초기화 뒤에 새로 만든 캐릭터
 rstApply(R,boot)}
function rstApply(R,boot){const keep={};RST_KEEP.forEach(k=>{if(C[k]!==undefined)keep[k]=C[k]});
 C=Object.assign({lv:1,ex:0,xv:2,cl:0,dz:0,b:0,gd:100,inv:{},wps:[],wp:-1,wl:{},titles:[],ti:""},keep,{rsv:R.id,nt:[]});
 C.stats=C.stats||{};C.stats.maxGold=Math.max(Number(C.stats.maxGold)||0,100);
 note("notice","🌑 새 시즌이 시작되었다. 이름·속성·특성·사역마와 프로필·기록은 그대로 남고, 나머지는 처음부터 다시 시작한다.");
 save();try{saveCloud(true)}catch(e){}try{regPlayer()}catch(e){}
 const msg="운영자가 시즌을 초기화했다.\n\n남은 것: 이름·성별·마을·등급·속성·특성, 프로필, 칭호·도감·기록, 사역마\n처음으로 돌아간 것: 레벨·골드·아이템·무기·각인·절망도·친구 목록 등\n\n새로운 이야기를 시작하자.";
 if(boot)setTimeout(()=>alertBox("🌑 새 시즌",msg),900);else{alertBox("🌑 새 시즌",msg);try{hub()}catch(e){}}}
// 서버의 공용 데이터 지우기. 프로필 사진(wboss/pic·picm)과 시계 맞추기(wboss/clk)는 남긴다.
async function rstWipe(){const done=[],fail=[];
 const del=async(p,label)=>{try{await DB.doc(p).delete();done.push(label)}catch(e){fail.push(label+" ("+String(e&&e.message||e)+")")}};
 for(const [p,l] of [["chat","단체·마을 채팅과 게시판"],["dm","1:1 채팅"],["dmn","1:1 새 메시지 표시"],["fmsg","친구 신청·소식"],["res","공명 요청"],["gift","선물"],["guard","마을 경쟁"],["raid","타락 레이드"],["raidhit","타락 레이드 기록"]])await del(p,l);
 try{const r=await fetch(FBU.replace(/\/+$/,"")+"/wboss.json?shallow=true"+(AUTH.tok?"&auth="+encodeURIComponent(AUTH.tok):""));if(!r.ok)throw new Error(r.status);const ks=Object.keys((await r.json())||{}).filter(k=>!["pic","picm","clk"].includes(k));
  let bad=0;for(const k of ks){try{await DB.doc("wboss/"+k).delete()}catch(e){bad++}}if(bad)fail.push("보스·웨이브 기록 "+bad+"/"+ks.length+"개");else done.push("보스·웨이브 기록 "+ks.length+"개")}catch(e){fail.push("보스·웨이브 기록 ("+String(e&&e.message||e)+")")}
 return {done,fail}}
async function rstRun(btn,msg){if(!ADM[UID]||!XON())return;
 const t=prompt("모든 플레이어의 캐릭터와 채팅·게시판·친구·마을 경쟁·보스 기록이 초기화된다. 되돌릴 수 없다.\n\n계속하려면 '초기화'라고 입력해 줘.");
 if((t||"").trim()!=="초기화"){msg.textContent="취소했다.";return}
 btn.disabled=true;msg.style.color="var(--mu)";msg.textContent="초기화하는 중이다. 창을 닫지 말자...";
 try{const R={id:Date.now(),ts:Date.now()};C.rst=R;save();await DB.doc("players/"+UID+"/rst").set(R);RST={id:R.id,by:UID};rstT=Date.now();
  const w=await rstWipe();try{PLC=null}catch(e){}
  rstApply(RST,false);
  alertBox("🌑 시즌 초기화 완료","플레이어들은 다음 접속(또는 1분 안)에 각자 초기화된다.\n\n지운 것: "+(w.done.join(", ")||"없음")+(w.fail.length?"\n\n지우지 못한 것: "+w.fail.join(", ")+"\n(서버 규칙에서 운영자 쓰기가 막혀 있을 수 있다. Firebase 콘솔에서 직접 지워야 한다.)":""));
  msg.textContent=""}
 catch(e){msg.style.color="var(--bad)";msg.textContent="초기화 표시를 저장하지 못했다. 인터넷 연결을 확인하고 다시 시도해 보자. (아무것도 바뀌지 않았다)"}btn.disabled=false}
function drawRst(){const box=$("#rstbox");if(!box)return;box.innerHTML="";box.hidden=!(C&&ADM[UID]&&XON());if(box.hidden)return;
 const c=elT("div","card rst-card");c.append(elT("h2","","🌑 시즌 초기화 (운영자 전용)"),
  elT("p","hint","모든 플레이어의 캐릭터를 처음 상태로 돌린다. 이름·성별·마을·등급·속성·특성, 프로필, 칭호·도감·기록, 사역마는 남는다."),
  elT("p","hint","함께 지우는 것: 단체·마을·1:1 채팅, 게시판, 친구 목록과 신청·공명·선물, 마을 경쟁, 마을 시설 기여, 보스·웨이브·타락 레이드 기록. 공지와 '멸망까지'는 남는다."),
  elT("p","hint",RST?"마지막 초기화: "+new Date(RST.id).toLocaleString("ko-KR"):"아직 초기화한 적이 없다."));
 const b=elT("button","btn rst-go","시즌 초기화 실행"),m=elT("p","msg","");b.type="button";b.onclick=()=>rstRun(b,m);c.append(b,m);box.appendChild(c)}
function drawTut(){const box=$("#tutbox");if(!box||!C)return;C.tut=C.tut||{got:{}};const t=C.tut;box.innerHTML="";if(t.hide)return;
 const ok=TUT.map(x=>{let v=false;try{v=!!x[3](C)}catch(e){}return v}),got=TUT.filter(x=>t.got[x[0]]).length,all=got===TUT.length;
 const w=elT("div","tut"),hd=elT("div","");hd.style.cssText="display:flex;justify-content:space-between;align-items:center;gap:8px";hd.append(elT("h2","","튜토리얼 · "+got+" / "+TUT.length));
 const fold=elT("button","chip",t.fold?"펼치기 ▼":"접기 ▲");fold.type="button";fold.style.cssText="flex:0 0 auto;min-width:0;padding:5px 12px;font-size:.8rem";fold.onclick=()=>{t.fold=!t.fold;save();drawTut()};hd.appendChild(fold);w.appendChild(hd);
 if(!t.fold){w.appendChild(elT("p","tut-intro","마법소녀로 계약한 것을 환영한다. 출정과 보스로 강해지고, 친구와 함께 절망을 견디자. 절망도가 100이 되면 타락해 마수가 되고, 친구들이 되돌려 줘야 한다. 절망도는 10분마다 10씩 저절로 내려가고, 공명·선물·희망의 결정으로도 낮출 수 있다. 아래 단계를 하나씩 따라 하면 보상을 받는다."));
  TUT.forEach((x,i)=>{const done=ok[i],claimed=!!t.got[x[0]],r=elT("div","dq"+(claimed?" got":done?" done":"")),cp=elT("div","dq-copy");cp.append(elT("b","",(i+1)+". "+x[1]),elT("small","",x[2]+" · 보상: "+rwTxt(x[4])));
   const acts=elT("div","tut-acts");if(!claimed&&done){const b=elT("button","chip","받기");b.type="button";b.onclick=()=>{if(t.got[x[0]])return;t.got[x[0]]=1;giveRw(x[4]);save();checkTitles();drawTut();toast("튜토리얼 '"+x[1]+"' 보상: "+rwTxt(x[4]))};acts.appendChild(b)}
   else if(!claimed){const b=elT("button","chip","가기");b.type="button";b.onclick=x[5];acts.appendChild(b)}else acts.appendChild(elT("small","","받음"));
   r.append(cp,acts);w.appendChild(r)});
  if(all){const c=elT("div","dq bonus"+(t.done?" got":" done")),cp=elT("div","dq-copy");cp.append(elT("b","","튜토리얼 완료!"),elT("small","",t.done?"모든 단계를 마쳤다. 이제 이 칸은 숨겨도 된다.":"완료 보상: "+rwTxt(TUT_DONE)+", 칭호 '새내기 졸업'"));const b=elT("button","chip",t.done?"숨기기":"받기");b.type="button";
   b.onclick=()=>{if(!t.done){t.done=1;giveRw(TUT_DONE);note("quest","튜토리얼을 모두 마쳤다. "+rwTxt(TUT_DONE)+"과 칭호 '새내기 졸업'을 받았다.");save();checkTitles();drawTut();toast("튜토리얼 완료! "+rwTxt(TUT_DONE))}else{t.hide=1;save();drawTut()}};c.append(cp,b);w.appendChild(c)}
  else{const h=elT("button","chip","튜토리얼 숨기기");h.type="button";h.style.cssText="margin-top:8px;padding:6px 12px;font-size:.8rem";h.onclick=()=>{if(confirm("튜토리얼을 숨길까? 기록 화면의 칭호 탭 아래 '튜토리얼 다시 보기'로 다시 열 수 있다.")){t.hide=1;save();drawTut()}};w.appendChild(h)}}
 box.appendChild(w)}
const facUsed=k=>!!(C.fu&&C.fu.d===today()&&C.fu.u&&C.fu.u[k]);
function facUse(k){const lv=facLv(k);if(lv<1||facUsed(k)||!FAC_USE[k])return;if(!C.fu||C.fu.d!==today())C.fu={d:today(),u:{}};C.fu.u[k]=1;const t=FAC_USE[k][1](lv);titleState();C.stats.facUses=(C.stats.facUses||0)+1;save();checkTitles();const m=$("#fm2");if(m){m.style.color="var(--mu)";m.textContent=t}toast("🏛 "+t);if(!$("#v-fac").hidden)facView(true);if(!$("#v-hub").hidden)hubFac()}
const facReady=()=>C?FAC.filter(([k])=>facLv(k)>=1&&!facUsed(k)).length:0;
let FACD={},facT=0;
const facPts=(v,k)=>((FACD[v]||{})[k]||{}).sum||0;
const facLvOf=pts=>FAC_LV.filter(n=>pts>=n).length;
const facLv=k=>C&&!(typeof disMine==="function"&&disMine()==="quake")?facLvOf(facPts(C.v,k)):0;
const myFac=()=>Object.values((C&&C.fc)||{}).reduce((a,b)=>a+(Number(b)||0),0);
async function loadFac(force){if(!C||!XON())return;if(!force&&Date.now()-facT<60000)return;facT=Date.now();
 try{const sn0=await plAll(force?0:PL_TTL),sn={docs:sn0.docs.filter(d=>!rstOld(d.data()))};const o={},dp={};sn.docs.forEach(d=>{const p=d.data();if(p&&p.dr&&typeof p.dr==="object"&&typeof p.dr.id==="string")dp[p.dr.id]=(dp[p.dr.id]||0)+Math.max(0,Math.min(40,Number(p.dr.pts)||0))});DRP=dp;wfLoad(sn.docs);sn.docs.forEach(d=>{const p=d.data();if(!p||!VL[p.v]||!p.fc||typeof p.fc!=="object")return;
   FAC.forEach(([k])=>{const n=Math.max(0,Math.min(1e6,Number(p.fc[k])||0));if(!n)return;const f=((o[p.v]=o[p.v]||{})[k]=o[p.v][k]||{sum:0,top:[]});f.sum+=n;f.top.push({u:d.id,n:p.n,pt:n})})});
  // 내 기여는 서버 반영 전이라도 바로 보이게 맞춘다.
  if(C.fc)FAC.forEach(([k])=>{const mine=Number(C.fc[k])||0,f=((o[C.v]=o[C.v]||{})[k]=o[C.v][k]||{sum:0,top:[]}),me0=f.top.find(t=>t.u===UID);if(me0){f.sum+=mine-me0.pt;me0.pt=mine}else if(mine){f.sum+=mine;f.top.push({u:UID,n:C.n,pt:mine})}});
  const before=C.facl||{};FACD=o;const now={};FAC.forEach(([k,nm])=>{now[k]=facLv(k);if(before[k]!=null&&now[k]>before[k]){note("fac",VL[C.v].n+"의 "+nm+"이(가) "+now[k]+"단계가 되었다!");toast("🏛 "+nm+" "+now[k]+"단계 완성!")}});C.facl=now}catch(e){}}
setInterval(()=>{if(C&&!document.hidden&&(!$("#v-hub").hidden||!$("#v-fac").hidden))loadFac().then(()=>{try{disCheck()}catch(e){}if(!$("#v-hub").hidden){hubFac();hubDis()}if(!$("#v-fac").hidden)facView(true)})},60000);
function hubFac(){const box=$("#hfa");if(!box||!C)return;box.innerHTML="";if(!XON()){box.appendChild(elT("p","hint","서버에 연결되어야 마을 시설을 지을 수 있다."));return}box.appendChild(wfTile());
 const g=elT("div","fac-grid");FAC.forEach(([k,nm])=>{const pts=facPts(C.v,k),lv=facLvOf(pts),nx=FAC_LV[lv],pv=lv?FAC_LV[lv-1]:0,w=elT("button","fac-tile"+(lv&&!facUsed(k)&&FAC_USE[k]?" ready":""));w.type="button";
  const bar=elT("div","bar"),f=elT("i");f.style.width=(nx?Math.min(100,(pts-pv)/(nx-pv)*100):100)+"%";bar.appendChild(f);w.append(elT("b","",nm),elT("small","",lv+"단계"+(lv&&!facUsed(k)&&FAC_USE[k]?" · 이용 가능":"")),bar);w.onclick=()=>facView();g.appendChild(w)});box.appendChild(g);
 const r=facReady();box.appendChild(elT("p","hint",(r?"오늘 이용할 수 있는 시설 "+r+"곳 · ":"")+"누르면 기부하고 이용할 수 있다."));updNav()}
function facView(keep){if(!keep){show("fac");$("#fm2").textContent=""}const box=$("#fl3");box.innerHTML="";const v=C.v;
 box.appendChild(elT("p","x-cd",VL[v].n+" 주민 시설 · 내 기여 "+myFac()+"점 · 보유 골드 "+(C.gd||0)+" · 마력석 "+((C.inv||{}).mana||0)));box.appendChild(wfCard());box.appendChild(elT("h2","",VL[v].n+" 시설"));
 FAC.forEach(([k,nm,ds,ef])=>{const pts=facPts(v,k),lv=facLvOf(pts),nx=FAC_LV[lv],pv=lv?FAC_LV[lv-1]:0,c=elT("div","card");c.style.marginTop="10px";
  const top=elT("div","");top.style.cssText="display:flex;justify-content:space-between;align-items:baseline;gap:8px";top.append(elT("h2","",nm),elT("b","",lv+" / "+FAC_LV.length+"단계"));c.append(top,elT("p","hint",ds));
  c.appendChild(elT("p","","지금 효과: "+(lv?ef(lv):"아직 없음")+(nx?" → 다음 단계: "+ef(lv+1):"")));
  const bar=elT("div","bar"),f=elT("i");f.style.width=(nx?Math.min(100,(pts-pv)/(nx-pv)*100):100)+"%";f.style.background="linear-gradient(90deg,#2e5a6b,#6fc1d1)";bar.appendChild(f);c.append(bar,elT("p","hint",nx?"마을 기여 "+pts+" / "+nx+" (다음 단계까지 "+(nx-pts)+")":"최고 단계에 도달했다. (마을 기여 "+pts+")"));
  const row=elT("div","row");row.style.marginTop="6px";
  [[50,"골드 50"],[200,"골드 200"],[500,"골드 500"]].forEach(([g,lab])=>{const b=elT("button","chip",lab);b.type="button";b.disabled=(C.gd||0)<g;b.onclick=()=>facGive(k,g,0);row.appendChild(b)});
  const sb=elT("button","chip","마력석 1 (+"+FAC_STONE+")");sb.type="button";sb.disabled=((C.inv||{}).mana||0)<1;sb.onclick=()=>facGive(k,0,1);row.appendChild(sb);c.appendChild(row);
  const tp=((FACD[v]||{})[k]||{}).top||[];if(tp.length){const ol=elT("ol","boss-rank");tp.slice().sort((a,b)=>b.pt-a.pt).slice(0,3).forEach(t=>ol.appendChild(elT("li",t.u===UID?"me":"",cn(t.u,t.n)+" · "+t.pt)));c.appendChild(ol)}
  if(v===C.v&&FAC_USE[k]){const used=facUsed(k),u=elT("button","btn"+(lv&&!used?"":" g"),lv?(used?"오늘 이용 완료 · ":"시설 이용 · ")+FAC_USE[k][0](lv):"1단계가 되면 이용할 수 있다");u.type="button";u.disabled=!lv||used;u.style.marginTop="8px";u.onclick=()=>facUse(k);c.appendChild(u)}
  c.appendChild(elT("p","boss-info","내 기여 "+((C.fc||{})[k]||0)+"점"));box.appendChild(c)});
 box.appendChild(elT("p","boss-info","골드 1 = 1점, 마력석 1개 = "+FAC_STONE+"점. 기부 10점마다 마을 경쟁 점수 1점도 함께 오른다. 시설 효과는 그 마을 주민에게만 적용된다."))}
function facGive(k,g,st){const pts=g+st*FAC_STONE,m=$("#fm2");if(g&&(C.gd||0)<g)return;if(st&&((C.inv||{}).mana||0)<st)return;
 C.gd-=g;if(st)C.inv.mana-=st;C.fc=C.fc||{};C.fc[k]=(Number(C.fc[k])||0)+pts;titleState();C.stats.facGive=(C.stats.facGive||0)+pts;guardAdd(Math.floor(pts/10));save();regPlayer();checkTitles();
 const f=((FACD[C.v]=FACD[C.v]||{})[k]=FACD[C.v][k]||{sum:0,top:[]});const b0=facLvOf(f.sum);f.sum+=pts;const me0=f.top.find(t=>t.u===UID);if(me0)me0.pt+=pts;else f.top.push({u:UID,n:C.n,pt:pts});
 const nm=FAC.find(x=>x[0]===k)[1],a0=facLvOf(f.sum);m.style.color="var(--mu)";m.textContent=nm+"에 "+pts+"점을 기여했다."+(a0>b0?" "+nm+"이(가) "+a0+"단계가 되었다!":"");if(a0>b0){C.facl=C.facl||{};C.facl[k]=a0;note("fac",VL[C.v].n+"의 "+nm+"이(가) "+a0+"단계가 되었다!");toast("🏛 "+nm+" "+a0+"단계 완성!");save()}facView(true)}
var WFD={sum:0,v:{},top:[]};
function wfLvOf(d){let l=0;for(const T of WF_LV){if(d.sum<T||!Object.keys(VL).every(k=>(d.v[k]||0)>=T*WF_SHARE))break;l++}return l}
const wfLv=()=>wfLvOf(WFD);
function wfLoad(docs){const d={sum:0,v:{},top:[]};docs.forEach(x=>{const p=x.data();if(!p||!VL[p.v]||x.id===UID)return;const n=Math.max(0,Math.min(1e7,Number(p.wf)||0));if(!n)return;d.sum+=n;d.v[p.v]=(d.v[p.v]||0)+n;d.top.push({u:x.id,n:p.n,v:p.v,pt:n})});
 const mine=Number(C&&C.wf)||0;if(C&&mine){d.sum+=mine;d.v[C.v]=(d.v[C.v]||0)+mine;d.top.push({u:UID,n:C.n,v:C.v,pt:mine})}
 const b=C.wfl,l=wfLvOf(d);WFD=d;if(b!=null&&l>b)wfUp(l);C.wfl=l}
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
 const a0=wfLv();C.wfl=a0;if(a0>b0)wfUp(a0);save();regPlayer();checkTitles();m.style.color="var(--mu)";m.textContent="희망의 등대에 "+pts+"점을 보탰다."+(a0>b0?" 등대가 "+a0+"단계가 되었다!":"");facView(true)}
function wfLight(){if(!wfReady()||C.fall)return;C.wfu=today();gain(0,-WF_LIGHT.dz);giveRw({m:WF_LIGHT.m});save();$("#fm2").style.color="var(--mu)";$("#fm2").textContent="등대의 따뜻한 빛을 받았다. 절망도 -"+WF_LIGHT.dz+", 마력석 +"+WF_LIGHT.m+".";facView(true)}
let unDu=null,DUI=[],duVer={},duBusy=false;
// 대련 중 표시: 대련을 시작하면 내 플레이어 기록에 시작 시각(db)을 남기고, 끝나면 0으로 지운다.
// 표시가 DU_BUSY(30분)보다 오래되면(창을 그냥 닫은 경우 등) 대련 중이 아닌 것으로 본다.
const duOn=()=>!!(C&&C.du&&!C.du.fin),duBusyOf=p=>!!p&&Number(p.db)>0&&Date.now()-Number(p.db)<DU_BUSY;
function duMark(){if(!DB||!AUTH.uid)return;DB.doc("players/"+UID+"/db").set(duOn()?(C.du.t0||Date.now()):0).catch(()=>{})}
const duEl=()=>DU_SPS[(C&&C.a&&C.a[0])]?C.a[0]:"불";
async function duHash(t){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
const duArr=v=>Array.isArray(v)?v:v&&typeof v==="object"?Object.keys(v).sort((a,b)=>a-b).map(k=>v[k]):[];
// 두 사람의 공개된 수를 처음부터 다시 따라가며 지금 상태를 계산한다(새로고침해도 똑같이 나온다).
function duReplay(me,op){const S=[{hp:DU_HP,mp:DU_MP0,sp:0,e:DU_SPS[me.e]?me.e:"불"},{hp:DU_HP,mp:DU_MP0,sp:0,e:DU_SPS[op.e]?op.e:"불"}],La=duArr(me.L),Lb=duArr(op.L),n=Math.min(La.length,Lb.length,DU_ROUNDS),log=[];
 for(let i=0;i<n;i++){const act=[La[i],Lb[i]].map((a,k)=>{const s=S[k];if(!DU_ACT[a])return"foc";if(a==="mag"&&s.mp<DU_MAG)return"foc";if(a==="sp"&&(s.sp||s.mp<DU_SP))return"foc";return a});
  // 비기를 쓰는 쪽은 무방비(집중과 같은 처지)로 보고 기본 피해를 계산한다.
  const ef=act.map(a=>a==="sp"?"foc":a),dm=[0,1].map(k=>DU_TAKE[ef[k]][ef[1-k]]);
  const txt=[];[0,1].forEach(k=>{if(act[k]!=="sp")return;const sp=DU_SPS[S[k].e][1];if(sp.ev||sp.gd)dm[k]=0});
  [0,1].forEach(k=>{if(act[k]!=="sp")return;const s=DU_SPS[S[k].e],sp=s[1];if(!(act[1-k]==="sp"&&DU_SPS[S[1-k].e][1].gd))dm[1-k]+=sp.d||0;if(sp.h)S[k].hp=Math.min(DU_HP,S[k].hp+sp.h);txt.push((k?"상대":"나")+"의 비기 「"+s[0]+"」!")});
  [0,1].forEach(k=>{const s=S[k],a=act[k];if(a==="foc")s.mp=Math.min(DU_MPMAX,s.mp+DU_FOC);if(a==="mag")s.mp-=DU_MAG;if(a==="sp"){s.mp-=DU_SP;s.sp=1}s.hp-=dm[k]});
  [0,1].forEach(k=>{if(act[k]==="sp"&&DU_SPS[S[k].e][1].dr)S[1-k].mp=0});
  log.push({r:i+1,a:act,d:dm,t:txt.join(" ")});if(S[0].hp<=0||S[1].hp<=0)break}
 const r=log.length,over=S[0].hp<=0||S[1].hp<=0||r>=DU_ROUNDS;let win=0;if(over)win=S[0].hp>S[1].hp?1:S[0].hp<S[1].hp?-1:0;return{S,log,r,over,win}}
function duAvail(){return ONL.filter(p=>p.u!==UID)}
async function duChallenge(u,n){if(!C||!XON()||!u||u===UID)return;if(C.fall){toast("타락한 동안에는 대련할 수 없다.");return}if(C.du&&!C.du.fin){toast("이미 대련 중이다.");arena();return}
 try{const ps=await DB.doc("players/"+u).get(),pp=ps.data();if(duBusyOf(pp)){toast(String(n||"상대")+"님은 지금 다른 대련 중이다. 끝난 뒤에 다시 신청하자.");return}}catch(e){}
 const mid=UID+"_"+u+"_"+Date.now().toString(36);C.du={mid,o:u,on:String(n||"상대").slice(0,20),t0:Date.now(),ch:1};save();
 try{await DB.doc("rooms/xb"+mid+"/"+UID).set({n:nmOf(),e:duEl(),ts:Date.now()});await DB.doc("rooms/xa"+u+"/"+UID).set({n:nmOf(),mid,e:duEl(),ts:Date.now()})}
 catch(e){C.du=null;save();toast("대련을 신청하지 못했다. 인터넷 연결을 확인하자.");return}
 duMark();note("duel",C.du.on+"님에게 대련을 신청했다.");arena()}
async function duAccept(inv){if(!C||C.fall)return toast("타락한 동안에는 대련할 수 없다.");if(C.du&&!C.du.fin)return toast("이미 대련 중이다.");
 C.du={mid:inv.mid,o:inv.u,on:String(inv.n||"상대").slice(0,20),t0:Date.now()};C.duSeen=keepIds(C.duSeen,inv.mid);save();DUI=DUI.filter(x=>x.mid!==inv.mid);
 try{await DB.doc("rooms/xb"+inv.mid+"/"+UID).set({n:nmOf(),e:duEl(),ts:Date.now()})}catch(e){C.du=null;save();toast("대련에 들어가지 못했다.");return}duMark();arena()}
/* 내가 보낸 대련 신청 지우기: 그 사이 같은 상대에게 새로 신청했으면(재대결) 새 신청은 지우지 않는다.
   예전에는 대련이 끝나고 15초 뒤에 '보낸 신청'을 무조건 지워서, 곧바로 다시 신청한 재대결 신청이 상대에게서 사라졌다. */
async function duDelInv(o,mid){try{const v=(await DB.doc("rooms/xa"+o+"/"+UID).get()).data();if(v&&v.mid===mid)await DB.doc("rooms/xa"+o+"/"+UID).delete()}catch(e){}}
function duLeave(){const d=C.du;if(!d)return;if(unDu){unDu();unDu=null}DB.doc("rooms/xb"+d.mid+"/"+UID).delete().catch(()=>{});if(d.ch)duDelInv(d.o,d.mid);C.du=null;save();duMark();arena()}
async function duWrite(me){me.ts=Date.now();await DB.doc("rooms/xb"+C.du.mid+"/"+UID).set(me)}
async function duPick(a){const d=C.du;if(!d||duBusy)return;const me=Object.assign({},d.me||{}),r=duArr(me.L).length;if(duArr(me.H).length>r)return;duBusy=true;
 try{const s=Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2),h=await duHash(a+"|"+s+"|"+r+"|"+d.mid);d.p={r,a,s};save();
  me.H=duArr(me.H).concat(h);me.L=duArr(me.L);me.S=duArr(me.S);me.n=nmOf();me.e=duEl();await duWrite(me);d.me=me;$("#dum").textContent=""}catch(e){$("#dum").style.color="var(--bad)";$("#dum").textContent="수를 올리지 못했다. 다시 눌러 보자."}finally{duBusy=false}duDraw()}
// 상대가 공개한 수가 봉인과 맞는지 확인한다. 맞지 않으면 속임수로 보고 내가 이긴다.
async function duVerify(op){const L=duArr(op.L),S=duArr(op.S),H=duArr(op.H),k=C.du.mid;duVer[k]=duVer[k]||0;
 for(let i=duVer[k];i<L.length;i++){if((await duHash(L[i]+"|"+S[i]+"|"+i+"|"+C.du.mid))!==H[i])return false;duVer[k]=i+1}return true}
async function duTick(data){const d=C&&C.du;if(!d||d.fin)return duDraw();const me=(data||{})[UID],op=(data||{})[d.o];d.me=me||d.me;d.op=op||null;
 if(op&&!(await duVerify(op)))return duFinish(1,"상대의 수가 봉인과 맞지 않는다. 속임수로 판정되어 이겼다.");
 if(op&&op.busy&&!duArr(op.H).length){toast(d.on+"님은 지금 다른 대련 중이라 신청이 취소되었다.");note("duel",d.on+"님은 다른 대련 중이라 신청이 취소되었다.");duLeave();return}
 if(op&&op.gv)return duFinish(1,d.on+"님이 기권했다.");
 if(me&&op){const r=duArr(me.L).length;if(duArr(me.H).length===r+1&&duArr(op.H).length>=r+1&&d.p&&d.p.r===r){const m2=Object.assign({},me,{L:duArr(me.L).concat(d.p.a),S:duArr(me.S).concat(d.p.s)});try{await duWrite(m2);d.me=m2}catch(e){}}
  const R=duReplay(d.me,op);if(R.over)return duFinish(R.win,R.win>0?"승리!":R.win<0?"패배.":"무승부.")}
 duDraw()}
const devOn=()=>Date.now()>=DEV.t0&&Date.now()<DEV.t1;
function devAdd(win,o){if(!devOn()||!C||!o)return 0;if(!C.dev||C.dev.id!==DEV.id)C.dev={id:DEV.id,pt:0,w:0,n:0,t:0,pp:{}};const day=today();if(!C.dev.pp||C.dev.pp.d!==day)C.dev.pp={d:day};
 const used=C.dev.pp[o]||0;if(used>=DEV.PAIR)return 0;C.dev.pp[o]=used+1;const p=win>0?DEV.PT.w:win<0?DEV.PT.l:DEV.PT.d;C.dev.pt+=p;C.dev.n++;if(win>0)C.dev.w++;C.dev.t=Date.now();return p}
// 순위: 점수 → 승리 수 → 먼저 그 점수에 도달한 사람 순.
async function devRank(maxAge){let docs=[];try{docs=(await plAll(maxAge)).docs}catch(e){}const L=[];docs.forEach(x=>{const p=x.data();if(p&&p.ev&&p.ev.id===DEV.id&&Number(p.ev.pt)>0)L.push({u:x.id,n:p.n,pt:Number(p.ev.pt)||0,w:Number(p.ev.w)||0,c:Number(p.ev.n)||0,t:Number(p.ev.t)||0})});
 if(C&&C.dev&&C.dev.id===DEV.id&&C.dev.pt>0){const me=L.find(x=>x.u===UID),mine={u:UID,n:C.n,pt:C.dev.pt,w:C.dev.w,c:C.dev.n,t:C.dev.t};if(me)Object.assign(me,mine);else L.push(mine)}
 return L.sort((a,b)=>b.pt-a.pt||b.w-a.w||a.t-b.t)}
const devRwTxt=r=>"골드 "+r.g+(r.m?", 마력석 "+r.m:"");
let devBusy=false;
async function devClaim(){if(!C||!AUTH.uid||devBusy||Date.now()<DEV.t1+DEV.GRACE)return;C.cmp=C.cmp||{};const k=DEV.id+"-rw";if(C.cmp[k])return;devBusy=true;try{
 const mine=C.dev&&C.dev.id===DEV.id?C.dev:null;if(!mine||!mine.n){C.cmp[k]=-1;save();return}
 const L=await devRank(0);if(!L.length)return;const i=L.findIndex(x=>x.u===UID),rk=i+1;C.cmp[k]=Date.now();const got=[];
 if(rk>=1&&rk<=DEV.RW.length){const r=DEV.RW[rk-1];giveRw(r);C.devR=rk;got.push(rk+"위 보상: "+devRwTxt(r))}
 if(mine.n>=DEV.JOIN.n){giveRw({g:DEV.JOIN.g});got.push("참가 보상: 골드 "+DEV.JOIN.g)}
 save();regPlayer();checkTitles();if(got.length){note("duel",DEV.nm+" 결과 "+(rk?rk+"위":"")+" · "+got.join(" · "));setTimeout(()=>alertBox("⚔ "+DEV.nm+" 결과","최종 순위: "+(rk>0?rk+"위":"순위 밖")+" (점수 "+mine.pt+")\n\n"+got.join("\n")),700)}}finally{devBusy=false}}
function devLeft(){const ms=DEV.t1-Date.now(),h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000);return h>=24?Math.floor(h/24)+"일 "+(h%24)+"시간":h>0?h+"시간 "+m+"분":m+"분"}
async function devDraw(){const box=$("#dev");if(!box||!C)return;const now=Date.now();if(now<DEV.t0||now>DEV.t1+7*86400000){box.innerHTML="";return}
 const L=await devRank(30000);if($("#v-arena").hidden)return;box.innerHTML="";const c=elT("div","card");c.style.marginBottom="14px";const end=new Date(DEV.t1-1);
 c.append(elT("h2","","⚔ "+DEV.nm+(devOn()?" 진행 중":" 종료")),elT("p","hint",(devOn()?"남은 시간 "+devLeft()+" · ":"")+(end.getMonth()+1)+"월 "+end.getDate()+"일 밤 12시까지. 승리 "+DEV.PT.w+"점 · 무승부 "+DEV.PT.d+"점 · 패배 "+DEV.PT.l+"점. 같은 상대와는 하루 "+DEV.PAIR+"번까지만 점수가 된다."));
 const rw=elT("p","boss-info",DEV.RW.map((r,i)=>(i+1)+"위 "+devRwTxt(r)).join(" · ")+" · "+DEV.JOIN.n+"판 이상 참가 시 골드 "+DEV.JOIN.g+" · 1위는 칭호 「대련장의 별」, 5위 안은 「대련 이벤트 입상」");c.appendChild(rw);
 const top=L.slice(0,5);if(!top.length)c.appendChild(elT("p","hint","아직 점수를 낸 사람이 없다. 첫 대련의 주인공이 되자!"));
 top.forEach((x,i)=>{const r=elT("div","dq"+(x.u===UID?" done":"")),cp=elT("div","dq-copy");cp.append(elT("b","",["🥇","🥈","🥉","4위","5위"][i]+" "+cn(x.u,x.n)),elT("small","",x.pt+"점 · "+x.w+"승 / "+x.c+"판"));r.appendChild(cp);r.style.cursor="pointer";r.onclick=()=>openProfile(x.u);c.appendChild(r)});
 const mi=L.findIndex(x=>x.u===UID);c.appendChild(elT("p","boss-info","내 기록: "+(mi>=0?(mi+1)+"위 · "+L[mi].pt+"점 · "+L[mi].w+"승 / "+L[mi].c+"판":"아직 점수가 없다")+(Date.now()>=DEV.t1&&Date.now()<DEV.t1+DEV.GRACE?" · 순위 확정까지 잠시 기다리는 중":"")));
 box.appendChild(c)}
function duFinish(win,why){const d=C.du;if(!d||d.fin)return duDraw();d.fin=1;d.res={win,why};const day=today();if(!C.duD||C.duD.d!==day)C.duD={d:day,n:0};let rw=0;
 if(C.duD.n<DU_DAY){C.duD.n++;rw=win>0?DU_RW.w:DU_RW.l;C.gd=(C.gd||0)+rw}d.rw=rw;titleState();if(win>0)C.stats.duW=(C.stats.duW||0)+1;else if(win<0)C.stats.duL=(C.stats.duL||0)+1;else C.stats.duD=(C.stats.duD||0)+1;
 const ep=devAdd(win,d.o);note("duel",d.on+"님과의 대련: "+why+(rw?" (골드 +"+rw+")":"")+(ep?" · 이벤트 점수 +"+ep:""));save();duMark();regPlayer();checkTitles();if(unDu){unDu();unDu=null}
 setTimeout(()=>{DB.doc("rooms/xb"+d.mid+"/"+UID).delete().catch(()=>{});if(d.ch)duDelInv(d.o,d.mid)},15000);duDraw()}
function duGiveUp(){const d=C.du;if(!d||d.fin||!confirm("기권할까? 패배로 기록된다."))return;const me=Object.assign({},d.me||{},{gv:1});duWrite(me).catch(()=>{});duFinish(-1,"기권했다.")}
function duWatch(){if(unDu){unDu();unDu=null}const d=C&&C.du;if(!d||d.fin||!DB)return;const mid=d.mid;unDu=DB.doc("rooms/xb"+mid).onSnapshot(s=>{if(C.du&&C.du.mid===mid)duTick(s.data()||{})},()=>{},POLL_FAST)}
// 받은 대련 신청 확인(6초마다)
async function duPoll(){if(!C||!XON()||!AUTH.uid)return;try{const s=await DB.doc("rooms/xa"+UID).get(),v=s.data()||{},now=Date.now();
 DUI=Object.keys(v).filter(k=>k!=="ts"&&v[k]&&typeof v[k]==="object"&&v[k].mid&&now-(Number(v[k].ts)||0)<DU_INV&&!(C.duSeen&&C.duSeen[v[k].mid])).map(k=>Object.assign({u:k},v[k]));
 // 대련 중에는 새 신청을 받지 않는다. 보낸 사람에게 '대련 중'이라고 답해 두면 그쪽 신청이 바로 취소된다.
 if(duOn()){DUI.filter(x=>x.mid!==C.du.mid).forEach(x=>{C.duSeen=keepIds(C.duSeen,x.mid);DB.doc("rooms/xb"+x.mid+"/"+UID).set({busy:1,n:nmOf(),ts:Date.now()}).then(()=>setTimeout(()=>DB.doc("rooms/xb"+x.mid+"/"+UID).delete().catch(()=>{}),180000)).catch(()=>{})});if(DUI.length)save();DUI=[]}
 DUI.forEach(x=>{const key="i_"+x.mid;if(!(C.duNt&&C.duNt[key])){C.duNt=keepIds(C.duNt,key);note("duel",String(x.n||"누군가")+"님이 대련을 신청했다! 대련장에서 받을 수 있다.");toast("⚔ "+String(x.n||"누군가")+"님의 대련 신청! (2분 안에 수락)");ding();save()}});
 updNav();const sig=DUI.map(x=>x.mid).join(",");if(sig!==duSig){duSig=sig;if(!$("#v-arena").hidden&&!(C.du&&!C.du.fin)&&!duFoc)duDraw()}}catch(e){}}
setInterval(()=>{if(!document.hidden||duOn())duPoll()},10000);
function arena(){show("arena");$("#dum").textContent="";devDraw();duDraw();duPoll();if(C.du&&!C.du.fin)duWatch();dubT=0;duBoard();duRecLoad(true)}
let duQ="",duFoc=false,duRulesOpen=false,duSig="";
// 검색 결과만 다시 그린다(입력칸은 그대로 두어 글자를 치는 중에 끊기지 않게).
function duFind(){const gl=$("#dusr");if(!gl||!C)return;gl.innerHTML="";const q=duQ.trim().toLowerCase();
 if(!q){gl.appendChild(elT("p","hint","찾고 싶은 마법소녀의 이름을 입력하자. 프로필 창의 '대련 신청'으로도 신청할 수 있다."));return}
 if(!DUP.length){gl.appendChild(elT("p","hint","플레이어 목록을 불러오는 중…"));return}
 const hit=DUP.filter(p=>p.u!==UID&&String(p.n||"").toLowerCase().includes(q)).sort((a,b)=>(isOn(b)-isOn(a))||String(a.n||"").localeCompare(String(b.n||""),"ko")).slice(0,20);
 if(!hit.length){gl.appendChild(elT("p","hint","'"+duQ.trim()+"'(이)라는 이름을 찾지 못했다."));return}
 hit.forEach(p=>{const on=isOn(p),bz=duBusyOf(p),b=elT("button","chip du-cand"+(on?" on":""));b.type="button";b.append(elT("b","",(on?"● ":"○ ")+cn(p.u,p.n)),elT("small","",(p.g||"?")+"등급 · "+String(p.a||"").split(" · ")[0]+" 속성 · "+(bz?"⚔ 대련 중":on?"접속 중":"접속 안 함")));
  b.disabled=!!C.fall||bz||duOn();b.onclick=()=>{if(!on&&!confirm(String(p.n||"상대")+"님은 지금 접속 중이 아니다. 신청은 2분 안에 수락하지 않으면 사라진다. 그래도 신청할까?"))return;duChallenge(p.u,p.n)};gl.appendChild(b)})}
document.addEventListener("focusin",e=>{if(e.target&&(e.target.id==="dusq"||e.target.id==="durm"))duFoc=true});document.addEventListener("focusout",e=>{if(e.target&&(e.target.id==="dusq"||e.target.id==="durm"))setTimeout(()=>{const a=document.activeElement;duFoc=!!a&&(a.id==="dusq"||a.id==="durm")},0)});let DUR=[],durT=0,duRM="",durBusy=false;
async function duRecLoad(force){if(!C||!XON()||durBusy)return;if(!force&&Date.now()-durT<15000)return;durBusy=true;durT=Date.now();
 try{const v=(await DB.doc("rooms/xr").get()).data()||{},now=Date.now();DUR=Object.keys(v).filter(k=>k!=="ts"&&v[k]&&typeof v[k]==="object"&&now-(Number(v[k].ts)||0)<DUR_TTL).map(k=>Object.assign({u:k},v[k])).sort((a,b)=>b.ts-a.ts)}catch(e){}finally{durBusy=false}duRecDraw()}
const duRecMine=()=>DUR.find(x=>x.u===UID);
async function duRecPost(){if(!C||!XON())return;if(C.fall){toast("타락한 동안에는 대련할 수 없다.");return}const m=String(duRM||"").trim().slice(0,DUR_MSG),d={n:nmOf(),e:duEl(),g:C.g,m,ts:Date.now()};
 try{await DB.doc("rooms/xr/"+UID).set(d);DUR=DUR.filter(x=>x.u!==UID);DUR.unshift(Object.assign({u:UID},d));duRM="";toast("⚔ 대련 구인 게시판에 이름을 올렸다. (2시간 동안 보인다)")}catch(e){toast("이름을 올리지 못했다. 인터넷 연결을 확인하자.")}duRecDraw()}
async function duRecDown(){try{await DB.doc("rooms/xr/"+UID).delete();DUR=DUR.filter(x=>x.u!==UID);toast("대련 구인 게시판에서 이름을 내렸다.")}catch(e){toast("이름을 내리지 못했다.")}duRecDraw()}
function duRecDraw(){const rb=$("#durb");if(!rb||!C)return;const keepF=document.activeElement&&document.activeElement.id==="durm";rb.innerHTML="";const mine=duRecMine(),now=Date.now();
 const me=elT("div","du-rec-me");
 if(mine){me.append(elT("p","hint","✓ 내 이름이 올라가 있다 · "+agoTxt(mine.ts)+(mine.m?" · 「"+mine.m+"」":"")+" · 약 "+Math.max(1,Math.ceil((DUR_TTL-(now-mine.ts))/60000))+"분 뒤 자동으로 내려간다"));const row=elT("div","row");
  const up=elT("button","chip","다시 올리기 (시간 연장)");up.type="button";up.onclick=()=>{duRM=mine.m||"";duRecPost()};const dn=elT("button","chip","내리기");dn.type="button";dn.onclick=duRecDown;row.append(up,dn);me.appendChild(row)}
 else{const f=elT("form","row");f.style.flexWrap="nowrap";const i=elT("input");i.type="text";i.id="durm";i.maxLength=DUR_MSG;i.placeholder="한마디 (선택, 예: 빛 속성 환영!)";i.setAttribute("aria-label","대련 구인 한마디");i.value=duRM;i.style.flex="1";i.oninput=()=>{duRM=i.value};
  const b=elT("button","btn","이름 올리기");b.type="submit";b.style.cssText="width:auto;margin:0;padding:9px 14px";b.disabled=!!C.fall;f.append(i,b);f.onsubmit=e=>{e.preventDefault();duRecPost()};me.appendChild(f);if(keepF)setTimeout(()=>{i.focus();i.setSelectionRange(i.value.length,i.value.length)})}
 rb.appendChild(me);const others=DUR.filter(x=>x.u!==UID);
 if(!others.length){rb.appendChild(elT("p","hint","지금 대련 상대를 찾는 사람이 없다. 이름을 올려 두면 다른 사람이 신청할 수 있다."));return}
 const pmap={};(typeof DUP!=="undefined"?DUP:[]).forEach(p=>pmap[p.u]=p);
 others.slice(0,20).forEach(x=>{const p=pmap[x.u]||{},on=isOn(p),bz=duBusyOf(p),w=elT("div","dq"),cp=elT("div","dq-copy");
  cp.append(elT("b","",(on?"● ":"○ ")+cn(x.u,x.n)+" · "+(x.g||"?")+"등급 · "+(x.e||"?")+" 속성"),elT("small","",(x.m?"「"+x.m+"」 · ":"")+agoTxt(x.ts)+" 올림"+(bz?" · ⚔ 대련 중":on?"":" · 접속 안 함")));
  const b=elT("button","chip","대련 신청");b.type="button";b.disabled=!!C.fall||bz||duOn();b.onclick=()=>duChallenge(x.u,x.n);w.append(cp,b);rb.appendChild(w)})}
setInterval(()=>{if(C&&!$("#v-arena").hidden&&!duOn())duRecLoad()},15000);
let DUP=[];
let DUB=[],dubT=0;async function duBoard(){if(!XON()||Date.now()-dubT<60000)return;dubT=Date.now();try{const sn=await plAll();DUP=sn.docs.map(x=>Object.assign({u:x.id},x.data()||{})).filter(p=>p&&p.n);DUB=DUP.filter(p=>p.du&&Number(p.du.w)>0).sort((a,b)=>b.du.w-a.du.w).slice(0,5);if(!$("#v-arena").hidden&&!(C.du&&!C.du.fin)){if(duFoc)duFind();else duDraw()}}catch(e){}}
function duDraw(){const box=$("#dua");if(!box||!C)return;box.innerHTML="";const d=C.du;
 if(d){const c=elT("div","card du-card");box.appendChild(c);
  if(d.fin){const R=d.res||{};c.append(elT("h2","du-res "+(R.win>0?"w":R.win<0?"l":"d"),R.win>0?"🏆 승리":R.win<0?"패배":"무승부"),elT("p","hint",(R.why||"")+(d.rw?" · 골드 +"+d.rw:" · 오늘 보상 횟수("+DU_DAY+"번)를 다 써서 보상은 없다")));
   if(d.me&&d.op){const R2=duReplay(d.me,d.op);c.appendChild(duLog(R2))}const b=elT("button","btn","대련장으로 돌아가기");b.type="button";b.onclick=duLeave;c.appendChild(b);if(DUI.length)c.appendChild(elT("p","hint","⚔ 새 대련 신청이 "+DUI.length+"건 와 있다. '대련장으로 돌아가기'를 누르면 받을 수 있다."));return}
  const me=d.me,op=d.op;c.appendChild(elT("h2","","⚔ "+d.on+"님과의 대련"));
  if(!op){c.appendChild(elT("p","hint",d.ch?"상대가 수락하기를 기다리는 중이다… (2분이 지나면 신청이 사라진다)":"대련장에 들어가는 중…"));if(d.ch&&Date.now()-d.t0>DU_INV+10000)c.appendChild(elT("p","hint","응답이 없다. 취소하고 다른 상대를 찾아보자."));
   const b=elT("button","btn g","신청 취소");b.type="button";b.onclick=duLeave;c.appendChild(b);return}
  const R=duReplay(me||{},op),A=R.S[0],B=R.S[1],r=duArr((me||{}).L).length,mc=duArr((me||{}).H).length>r,oc=duArr(op.H).length>r;
  const hpRow=(nm,s,mine)=>{const w=elT("div","du-side"+(mine?" me":""));const bar=elT("div","bar du-hp"),f=elT("i");f.style.width=Math.max(0,s.hp)/DU_HP*100+"%";bar.appendChild(f);
   w.append(elT("b","",nm+" · "+s.e+" 속성"),bar,elT("small","","체력 "+Math.max(0,s.hp)+" / "+DU_HP+" · 마력 "+"●".repeat(s.mp)+"○".repeat(Math.max(0,DU_MPMAX-s.mp))+(s.sp?" · 비기 사용함":"")));return w};
  c.append(hpRow(cn(d.o,d.on),B,0),hpRow("나 ("+C.n+")",A,1));
  c.appendChild(elT("p","du-round","제 "+(R.r+1)+" 판 / "+DU_ROUNDS));
  if(!mc){const row=elT("div","du-acts");Object.keys(DU_ACT).forEach(k=>{const [nm,ic]=DU_ACT[k],b=elT("button","chip du-act");b.type="button";
    const sub=k==="mag"?"마력 "+DU_MAG:k==="sp"?DU_SPS[A.e][0]+" · 마력 "+DU_SP:k==="foc"?"마력 +"+DU_FOC:k==="atk"?"마법을 끊는다":"공격을 막는다";b.append(elT("b","",ic+" "+nm),elT("small","",sub));
    b.disabled=duBusy||(k==="mag"&&A.mp<DU_MAG)||(k==="sp"&&(A.sp||A.mp<DU_SP));b.onclick=()=>duPick(k);row.appendChild(b)});c.appendChild(row);
   c.appendChild(elT("p","hint","★ "+DU_SPS[A.e][0]+": "+DU_SPS[A.e][2]+" · 상대("+B.e+")의 비기 「"+DU_SPS[B.e][0]+"」: "+DU_SPS[B.e][2]))}
  else c.appendChild(elT("p","du-wait",oc?"서로의 수가 열리는 중…":"수를 정했다: "+DU_ACT[(d.p||{}).a||"foc"][1]+" "+DU_ACT[(d.p||{}).a||"foc"][0]+" · 상대가 고르기를 기다리는 중…"));
  if(R.log.length)c.appendChild(duLog(R));
  const idle=Date.now()-(Number(op.ts)||Date.now());const bt=elT("div","row");bt.style.marginTop="8px";
  if(mc&&idle>DU_IDLE){const b=elT("button","btn","상대가 응답하지 않는다 · 승리로 끝내기");b.type="button";b.onclick=()=>duFinish(1,d.on+"님이 오래 응답하지 않아 이겼다.");bt.appendChild(b)}
  const g=elT("button","btn g","기권");g.type="button";g.onclick=duGiveUp;bt.appendChild(g);c.appendChild(bt);return}
 // 대련 중이 아닐 때: 받은 신청, 접속 중인 상대, 순위, 규칙
 if(C.fall)box.appendChild(elT("p","hint","타락한 동안에는 대련할 수 없다."));
 if(DUI.length){box.appendChild(elT("h2","","받은 대련 신청"));DUI.forEach(x=>{const w=elT("div","dq"),cp=elT("div","dq-copy");cp.append(elT("b","",cn(x.u,x.n)+" · "+(x.e||"?")+" 속성"),elT("small","",Math.max(0,Math.ceil((DU_INV-(Date.now()-x.ts))/1000))+"초 안에 수락할 수 있다"));
  const b=elT("button","chip","수락");b.type="button";b.disabled=!!C.fall;b.onclick=()=>duAccept(x);const n=elT("button","chip","거절");n.type="button";n.onclick=()=>{C.duSeen=keepIds(C.duSeen,x.mid);save();DUI=DUI.filter(y=>y!==x);duDraw()};w.append(cp,b,n);box.appendChild(w)})}
 // 대련 구인 게시판: 내 이름을 올려 두면 다른 사람이 보고 바로 대련을 신청할 수 있다.
 box.appendChild(elT("h2","","대련 구인 게시판"));const rb=elT("div","du-rec");rb.id="durb";box.appendChild(rb);duRecDraw();
 // 상대 찾기: 이름으로 검색한다. 접속 중인 사람은 ● 표시가 붙는다(신청은 2분 안에 수락해야 하므로 접속 중인 상대가 좋다).
 box.appendChild(elT("h2","","대련 상대 찾기"));const sf=elT("input");sf.type="search";sf.id="dusq";sf.placeholder="이름으로 검색 (한 글자 이상)";sf.setAttribute("aria-label","대련 상대 이름 검색");sf.value=duQ;sf.maxLength=20;
 const gl=elT("div","du-list");gl.id="dusr";sf.oninput=()=>{duQ=sf.value;duFind()};box.append(sf,gl);duFind();if(duFoc){sf.focus();sf.setSelectionRange(sf.value.length,sf.value.length)}
 const st=C.stats||{};box.appendChild(elT("p","boss-info","내 전적 "+(st.duW||0)+"승 "+(st.duL||0)+"패 "+(st.duD||0)+"무 · 오늘 보상 "+((C.duD&&C.duD.d===today())?C.duD.n:0)+" / "+DU_DAY+"번 (승리 골드 "+DU_RW.w+", 그 밖 "+DU_RW.l+")"));
 if(DUB.length){box.appendChild(elT("h2","","대련 순위"));const ol=elT("ol","boss-rank");DUB.forEach(p=>ol.appendChild(elT("li",p.u===UID?"me":"",cn(p.u,p.n)+" · "+p.du.w+"승 "+(p.du.l||0)+"패")));box.appendChild(ol)}
 const rl=elT("details","du-rules");rl.open=duRulesOpen;rl.addEventListener("toggle",()=>{duRulesOpen=rl.open});rl.append(elT("summary","","대련 규칙"),elT("p","hint","무기·레벨·등급·특성·각인은 모두 무시한다. 두 사람 모두 체력 "+DU_HP+", 마력 "+DU_MP0+"로 시작하고, 매 판 동시에 행동을 고른다. "+DU_ROUNDS+"판이 지나면 체력이 많은 쪽이 이긴다."),
  elT("p","hint","⚔ 공격은 ✦ 마법을 끊고(-22), 🛡 방어는 ⚔ 공격을 막고 반격하며(-8), ✦ 마법(마력 "+DU_MAG+")은 🛡 방어를 뚫는다(-25). 공격끼리 -15씩, 마법끼리 -25씩. ◎ 집중은 마력 +"+DU_FOC+"(최대 "+DU_MPMAX+")지만 공격에 -15, 마법에 -25를 맞는다."),
  elT("p","hint","★ 비기(마력 "+DU_SP+", 한 번): 첫 번째 속성의 필살기. "+Object.keys(DU_SPS).map(k=>k+" 「"+DU_SPS[k][0]+"」 "+DU_SPS[k][2]).join(" · ")+". 쓰는 판에는 무방비다."));box.appendChild(rl)}
function duLog(R){const lg=elT("div","log du-log");R.log.slice().reverse().forEach(x=>{const a=x.a.map(k=>DU_ACT[k][1]+" "+DU_ACT[k][0]);lg.appendChild(elT("p","","제"+x.r+"판 · 나 "+a[0]+" vs 상대 "+a[1]+" → 나 "+(x.d[0]?"-"+x.d[0]:"피해 없음")+", 상대 "+(x.d[1]?"-"+x.d[1]:"피해 없음")+(x.t?" · "+x.t:"")))});return lg}
setInterval(()=>{if(C&&C.du&&!C.du.fin&&!$("#v-arena").hidden&&!duBusy)duDraw()},15000);
$("#fb3").onclick=()=>hub();
$("#dub").onclick=()=>hub();
$("#pfdu").onclick=()=>{const u=pfU,h=$("#pfb h2"),p=(ONL.find(x=>x.u===u)||{});$("#pfo").hidden=true;duChallenge(u,p.n||(h?h.textContent:"상대"))};
let BD=[],bdT=0,bdOpen=null,bdLast=0,bdReply=null,bdBusy=false;
// 작성 중인 글과 댓글을 보관한다. 화면이 새로 그려지거나 다른 탭에 다녀와도, 새로고침해도 이어서 쓸 수 있다(올리면 지워진다).
let bdDraft={};try{bdDraft=JSON.parse(localStorage.getItem("mgr_bd_draft")||"{}")||{}}catch(e){}
const bdSave=()=>{try{localStorage.setItem("mgr_bd_draft",JSON.stringify(bdDraft))}catch(e){}};
// 입력칸에 커서가 있거나 쓰다 만 내용이 있으면 자동 새로고침으로 화면을 다시 그리지 않는다.
const bdTyping=()=>{const a=document.activeElement;return !!(a&&$("#bdl")&&$("#bdl").contains(a)&&/^(INPUT|TEXTAREA)$/.test(a.tagName))};
const bdId=()=>"b_"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const bdAgo=t=>{const m=Math.floor((Date.now()-t)/60000);return m<1?"방금":m<60?m+"분 전":m<1440?Math.floor(m/60)+"시간 전":Math.floor(m/1440)+"일 전"};
/* 서버비 절약: 게시판은 처음 한 번(또는 게시판을 열 때)만 전체(최대 BD_MAX개)를 받고, 그 뒤로는 가지고 있는 것보다 새 글·댓글만 받아 합친다.
   글 이름(b_+시각)이 시간순이라 '마지막으로 받은 이름 - 10분'부터 받으면 된다(기기 시계가 조금 틀려도 빠지지 않게 10분 여유). */
let bdFull=false;
async function loadBoard(force){if(!DB||!XON()||bdBusy)return;if(!force&&Date.now()-bdT<10000)return;bdBusy=true;bdT=Date.now();
 try{const ok=m=>m&&m.bt&&m.u&&typeof m.ts==="number",inc=!force&&bdFull&&BD.length;
  if(inc){const mk=BD.reduce((a,m)=>m.id>a?m.id:a,""),t=parseInt(mk.slice(2,10),36);
   const from=t>0?"b_"+Math.max(0,t-600000).toString(36):"b_";
   const sn=await once(DB.collection("chat").prefix("b_").after(from).limit(BD_MAX));const by={};BD.forEach(m=>by[m.id]=m);
   sn.docs.forEach(d=>{const m=Object.assign({id:d.id},d.data()||{});if(ok(m))by[m.id]=m});BD=Object.values(by).sort((a,b)=>a.id<b.id?-1:1).slice(-BD_MAX)}
  else{const sn=await once(DB.collection("chat").prefix("b_").limit(BD_MAX));BD=sn.docs.map(d=>Object.assign({id:d.id},d.data()||{})).filter(ok);bdFull=true}
  bdNotify()}catch(e){}finally{bdBusy=false}}
// 지워진 것: 글쓴이 본인이나 운영자가 남긴 지움 표시가 있는 글·댓글
// 고정: 운영자가 남긴 고정·해제 표시 중 가장 최근 것을 따른다. 고정된 글은 고정한 시각 순으로 맨 위에 온다.
function bdPins(){const last={};BD.filter(m=>(m.bt==="pin"||m.bt==="unpin")&&ADM[m.u]&&m.ref).sort((a,b)=>a.ts-b.ts).forEach(m=>{last[m.ref]=m.bt==="pin"?m.ts:0});Object.keys(last).forEach(k=>{if(!last[k])delete last[k]});return last}
// 수정: 저장 공간이 '새로 쓰기'만 허락하므로, 수정은 {bt:"e", ref:대상, x:새 내용} 기록을 새로 남기는 방식이다.
// 원래 글쓴이 본인이 남긴 수정 기록만 인정하고, 그중 가장 최근 것을 보여 준다.
let bdEdit=null;
function bdEdits(){const by={};BD.forEach(m=>{by[m.id]=m});const ed={};BD.filter(m=>m.bt==="e"&&by[m.ref]&&by[m.ref].u===m.u&&typeof m.x==="string").sort((a,b)=>a.ts-b.ts).forEach(m=>{ed[m.ref]={x:m.x,ts:m.ts}});return ed}
function bdDead(){const by={};BD.forEach(m=>{by[m.id]=m});const dead={};BD.filter(m=>m.bt==="d"&&by[m.ref]&&(by[m.ref].u===m.u||ADM[m.u])).forEach(m=>dead[m.ref]=1);return dead}
// 내 글에 달린 댓글, 내 댓글에 달린 답글을 알려 준다.
function bdNotify(){if(!C)return;const first=C.bdSeen==null,seen=C.bdSeen||0,dead=bdDead(),by={};BD.forEach(m=>by[m.id]=m);let mx=seen,n=0;
 BD.filter(m=>m.bt==="c"&&m.u!==UID&&m.ts>seen&&!dead[m.id]).forEach(m=>{mx=Math.max(mx,m.ts);const post=by[m.p],par=m.r?by[m.r]:null;if(!post||dead[m.p])return;
  if(!first&&((par&&par.u===UID)||(!par&&post.u===UID))){n++;note("board",String(m.n||"누군가")+"님이 "+(par?"내 댓글에 답글을":"내 글 「"+String(post.ti||"").slice(0,20)+"」에 댓글을")+" 달았다: "+String(m.x||"").slice(0,40),m.p)}});
 if(first||mx>seen){C.bdSeen=Math.max(mx,first?Date.now():0);save()}if(n){toast("📝 게시판에 새 댓글 "+n+"개");ding()}}
// 게시판은 보고 있을 때 1분마다, 다른 화면에서는 새 댓글 알림용으로 5분마다만 새로 받는다.
let bdBgT=0;setInterval(()=>{if(!C||!AUTH.uid||document.hidden)return;const on=!$("#v-board").hidden;if(!on&&Date.now()-bdBgT<300000)return;bdBgT=Date.now();loadBoard().then(()=>{if(on&&!bdTyping())drawBoard()})},60000);
function board(post){show("board");if(post!==undefined)bdOpen=post;$("#bdm").textContent="";drawBoard();loadBoard(true).then(()=>{if(!bdTyping())drawBoard()})}
const bdName=m=>{const s=elT("span","bd-who");const b=elT("b","",cn(m.u,m.n));if(m.u!==UID){b.style.cursor="pointer";b.onclick=e=>{e.stopPropagation();openProfile(m.u)}}s.appendChild(b);if(m.tn)s.appendChild(elT("span","ttl-chip",String(m.tn).slice(0,20)));s.appendChild(elT("small",""," · "+bdAgo(m.ts)));return s};let bdImg=null;const BDIC={};
function bdShrink(file,cb){if(!file||!/^image\//.test(file.type))return cb(null,"사진 파일만 올릴 수 있다.");const u=URL.createObjectURL(file),im=new Image();
 im.onload=()=>{URL.revokeObjectURL(u);let w=im.width,h=im.height;const k=Math.min(1,BDI_MAX/Math.max(w,h));w=Math.max(1,Math.round(w*k));h=Math.max(1,Math.round(h*k));
  const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(im,0,0,w,h);let q=.75,d=c.toDataURL("image/jpeg",q);
  while(d.length>BDI_KB*1370&&q>.35){q-=.1;d=c.toDataURL("image/jpeg",q)}if(d.length>BDI_KB*1370)return cb(null,"사진이 너무 크다. 다른 사진을 골라 보자.");cb(d)};
 im.onerror=()=>{URL.revokeObjectURL(u);cb(null,"사진을 읽지 못했다.")};im.src=u}
async function bdImgLoad(id){if(BDIC[id]!==undefined)return BDIC[id];try{const v=(await DB.doc("chat/bimg_"+id).get()).data();BDIC[id]=v&&typeof v.im==="string"&&/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(v.im)?v.im:null}catch(e){return null}return BDIC[id]}
async function bdWrite(doc,okMsg,fixedId){const m=$("#bdm");if(Date.now()-bdLast<BD_GAP){m.style.color="var(--bad)";m.textContent="너무 빨리 쓰고 있다. 잠시 뒤에 다시 쓰자.";return false}
 const id=fixedId||bdId(),d=Object.assign({u:UID,n:nmOf(),ts:Date.now()},tiName(C.ti)?{tn:tiName(C.ti)}:{},doc);
 try{await DB.doc("chat/"+id).set(d);bdLast=Date.now();BD.push(Object.assign({id},d));if(okMsg){m.style.color="var(--mu)";m.textContent=okMsg}return id}
 catch(e){m.style.color="var(--bad)";m.textContent="올리지 못했다. 캐릭터가 서버에 저장돼 있는지(위쪽 경고)와 인터넷 연결을 확인해야 한다.";return false}}
function drawBoard(){const box=$("#bdl");if(!box||!C)return;box.innerHTML="";if(!XON()){box.appendChild(elT("p","hint","서버에 연결되어야 게시판을 쓸 수 있다."));return}
 const dead=bdDead(),eds=bdEdits(),pins=bdPins(),posts=BD.filter(m=>m.bt==="p"&&!dead[m.id]).sort((a,b)=>(pins[b.id]||0)-(pins[a.id]||0)||b.ts-a.ts),cmts=BD.filter(m=>m.bt==="c"&&!dead[m.id]).map(m=>eds[m.id]?Object.assign({},m,{x:eds[m.id].x,ed:eds[m.id].ts}):m);
 if(bdOpen){const p=posts.find(x=>x.id===bdOpen);const back=elT("button","btn g","← 글 목록");back.type="button";back.style.cssText="width:auto;padding:8px 14px;margin:0 0 10px";back.onclick=()=>{bdOpen=null;bdReply=null;bdEdit=null;drawBoard()};box.appendChild(back);
  if(!p){box.appendChild(elT("p","hint","지워졌거나 찾을 수 없는 글이다."));return}
  const c=elT("div","card bd-post");if(pins[p.id])c.classList.add("pinned");c.append(elT("h2","",(pins[p.id]?"📌 ":"")+(p.ti||"(제목 없음)")),bdName(p),elT("p","bd-body",String(p.x||"")));
  if(p.img){const fig=elT("div","bd-img");fig.appendChild(elT("p","hint","사진을 불러오는 중…"));c.appendChild(fig);bdImgLoad(p.id).then(src=>{fig.innerHTML="";if(!src){fig.appendChild(elT("p","hint","사진을 불러오지 못했다."));return}const i=document.createElement("img");i.src=src;i.alt=(p.ti||"게시글")+" 사진";i.loading="lazy";i.onclick=()=>imgFull(src,p.ti||"");fig.appendChild(i)})}
  if(ADM[UID]){const pb=elT("button","chip",pins[p.id]?"고정 해제":"📌 맨 위에 고정");pb.type="button";pb.style.cssText="margin:8px 6px 0 0;padding:6px 12px;font-size:.82rem";pb.onclick=async()=>{bdLast=0;if(await bdWrite({bt:pins[p.id]?"unpin":"pin",ref:p.id},pins[p.id]?"고정을 풀었다.":"글을 맨 위에 고정했다."))drawBoard()};c.appendChild(pb)}
  if(p.u===UID||ADM[UID]){const del=elT("button","chip","글 지우기");del.type="button";del.style.cssText="margin-top:8px;padding:6px 12px;font-size:.82rem";del.onclick=async()=>{if(!confirm("이 글을 지울까? 댓글도 함께 보이지 않게 된다."))return;bdLast=0;if(await bdWrite({bt:"d",ref:p.id},"글을 지웠다.")){bdOpen=null;drawBoard()}};c.appendChild(del)}
  box.appendChild(c);
  // 답글에도 계속 답글을 달 수 있다. 들여쓰기는 4단계까지만 깊어지고, 그보다 깊으면 누구에게 단 답글인지 @이름으로 보여 준다.
  const mine=cmts.filter(x=>x.p===p.id),byId={};mine.forEach(x=>byId[x.id]=x);const tops=mine.filter(x=>!x.r||!byId[x.r]).sort((a,b)=>a.ts-b.ts);box.appendChild(elT("h2","","댓글 "+mine.length));
  const cmtEl=(m,lvl)=>{const w=elT("div","bd-cmt"+(lvl?" re":""));if(lvl)w.style.marginLeft=(Math.min(lvl,4)*20)+"px";const par=m.r&&byId[m.r];
   const body=elT("p","bd-body","");if(lvl>=2&&par){body.appendChild(elT("span","bd-at","@"+cn(par.u,par.n)+" "))}else if(m.r&&!par){body.appendChild(elT("span","bd-at","(지워진 댓글에 단 답글) "))}body.appendChild(document.createTextNode(String(m.x||"")));const nm=bdName(m);if(m.ed)nm.appendChild(elT("small","bd-ed"," · 수정됨"));w.append(nm);
   if(bdEdit===m.id&&m.u===UID){const ef=elT("form","row bd-cf");ef.style.flexWrap="nowrap";const ei=elT("input");ei.type="text";ei.maxLength=BD_CMT;ei.value=String(m.x||"");ei.setAttribute("aria-label","댓글 수정");ei.style.flex="1";
    const es=elT("button","btn","저장");es.type="submit";es.style.cssText="width:auto;margin:0;padding:9px 14px";const ec=elT("button","btn g","취소");ec.type="button";ec.style.cssText="width:auto;margin:0;padding:9px 14px";ec.onclick=()=>{bdEdit=null;drawBoard()};ef.append(ei,es,ec);
    ef.onsubmit=async e=>{e.preventDefault();const x=ei.value.trim().slice(0,BD_CMT);if(!x){$("#bdm").style.color="var(--bad)";$("#bdm").textContent="내용을 비울 수는 없다. 지우려면 '지우기'를 누르자.";return}if(x===String(m.x||"")){bdEdit=null;drawBoard();return}
     es.disabled=true;bdLast=0;const ok=await bdWrite({bt:"e",ref:m.id,x},"댓글을 고쳤다.");es.disabled=false;if(ok){bdEdit=null;drawBoard()}};
    w.appendChild(ef);setTimeout(()=>{ei.focus();ei.setSelectionRange(ei.value.length,ei.value.length)});return w}
   w.appendChild(body);const act=elT("div","bd-act");
   {const r=elT("button","chip","답글");r.type="button";r.onclick=()=>{bdReply=bdReply===m.id?null:m.id;drawBoard()};act.appendChild(r)}
   if(m.u===UID){const e2=elT("button","chip","수정");e2.type="button";e2.onclick=()=>{bdEdit=m.id;bdReply=null;drawBoard()};act.appendChild(e2)}
   if(m.u===UID||ADM[UID]){const d=elT("button","chip","지우기");d.type="button";d.onclick=async()=>{if(!confirm("이 댓글을 지울까?"))return;bdLast=0;if(await bdWrite({bt:"d",ref:m.id},"댓글을 지웠다."))drawBoard()};act.appendChild(d)}
   w.appendChild(act);if(bdReply===m.id)w.appendChild(bdForm(p.id,m.id,"@"+String(m.n||"")+"에게 답글 (최대 "+BD_CMT+"자)"));return w};
  const tree=(m,lvl,seen)=>{if(seen[m.id])return;seen[m.id]=1;box.appendChild(cmtEl(m,lvl));mine.filter(x=>x.r===m.id).sort((a,b)=>a.ts-b.ts).forEach(c=>tree(c,lvl+1,seen))};
  if(!tops.length)box.appendChild(elT("p","hint","아직 댓글이 없다. 첫 댓글을 남겨 보자."));
  {const seen={};tops.forEach(t=>tree(t,0,seen))}
  box.appendChild(bdForm(p.id,"","댓글을 입력 (최대 "+BD_CMT+"자)"));return}
 const top=elT("div","row");top.style.cssText="justify-content:space-between;align-items:center;margin-bottom:10px";top.appendChild(elT("p","hint","글 "+posts.length+"개 · 최근 글이 위에 온다."));
 const wb=elT("button","btn","✎ 글쓰기");wb.type="button";wb.style.cssText="width:auto;margin:0;padding:9px 16px";top.appendChild(wb);box.appendChild(top);
 const f=elT("form","card bd-new");f.hidden=!bdDraft.open;const ti=elT("input");ti.type="text";ti.maxLength=BD_TITLE;ti.placeholder="제목 (최대 "+BD_TITLE+"자)";ti.setAttribute("aria-label","제목");
 const tx=elT("textarea");tx.rows=6;tx.maxLength=BD_BODY;tx.placeholder="내용 (최대 "+BD_BODY+"자)";tx.setAttribute("aria-label","내용");tx.style.marginTop="8px";
 const go=elT("button","btn","올리기");go.type="submit";const cc=elT("button","btn g","취소");cc.type="button";
 const pr=elT("div","bd-pick"),fi=elT("input");fi.type="file";fi.accept="image/*";fi.hidden=true;const pb=elT("button","chip","📷 사진 첨부");pb.type="button";pb.onclick=()=>fi.click();const pv=elT("div","bd-pv");
 const drawPv=()=>{pv.innerHTML="";if(!bdImg)return;const i=document.createElement("img");i.src=bdImg;i.alt="첨부한 사진 미리보기";const x=elT("button","chip","사진 빼기");x.type="button";x.onclick=()=>{bdImg=null;drawPv()};pv.append(i,x)};
 fi.onchange=()=>{const file=fi.files&&fi.files[0];fi.value="";if(!file)return;pb.disabled=true;bdShrink(file,(d,err)=>{pb.disabled=false;if(!d){$("#bdm").style.color="var(--bad)";$("#bdm").textContent=err;return}bdImg=d;$("#bdm").textContent="";drawPv()})};
 pr.append(pb,fi,elT("small","","사진 1장 · 자동으로 작게 줄여서 올린다"));drawPv();
 f.append(ti,tx,pr,pv,go,cc);ti.value=bdDraft.nt||"";tx.value=bdDraft.nx||"";
 ti.oninput=()=>{bdDraft.nt=ti.value;bdSave()};tx.oninput=()=>{bdDraft.nx=tx.value;bdSave()};
 if(f.hidden===false&&(bdDraft.nt||bdDraft.nx))f.appendChild(elT("p","hint","작성 중이던 글을 불러왔다."));
 cc.onclick=()=>{f.hidden=true;bdDraft.open=0;bdImg=null;bdSave()};
 wb.onclick=()=>{f.hidden=!f.hidden;bdDraft.open=f.hidden?0:1;bdSave();if(!f.hidden)ti.focus()};
 f.onsubmit=async e=>{e.preventDefault();const t=ti.value.trim().slice(0,BD_TITLE),x=tx.value.trim().slice(0,BD_BODY);if(!t||!x){$("#bdm").style.color="var(--bad)";$("#bdm").textContent="제목과 내용을 모두 적어야 한다.";return}
  go.disabled=true;let id;if(bdImg){const nid=bdId();try{await DB.doc("chat/bimg_"+nid).set({bt:"img",u:UID,ts:Date.now(),im:bdImg})}catch(e){go.disabled=false;$("#bdm").style.color="var(--bad)";$("#bdm").textContent="사진을 올리지 못했다. 사진을 빼고 다시 올려 보자.";return}
   BDIC[nid]=bdImg;id=await bdWrite({bt:"p",ti:t,x,img:1},"글을 올렸다.",nid);if(id)bdImg=null}else id=await bdWrite({bt:"p",ti:t,x},"글을 올렸다.");go.disabled=false;if(id){delete bdDraft.nt;delete bdDraft.nx;bdDraft.open=0;bdSave();titleState();C.stats.posts=(C.stats.posts||0)+1;save();checkTitles();bdOpen=id;drawBoard()}};
 box.appendChild(f);
 if(!posts.length){box.appendChild(elT("p","hint","아직 글이 없다. 첫 글을 남겨 보자."));return}
 posts.forEach(p=>{const n=cmts.filter(x=>x.p===p.id).length,r=elT("button","bd-item"+(pins[p.id]?" pinned":""));r.type="button";const h=elT("div","bd-ti");if(pins[p.id])h.appendChild(elT("span","bd-pin","📌 고정"));h.append(elT("b","",p.ti||"(제목 없음)"));if(p.img)h.appendChild(elT("span","bd-n","📷"));if(n)h.appendChild(elT("span","bd-n","["+n+"]"));
  r.append(h,bdName(p),elT("p","bd-prev",String(p.x||"").replace(/\s+/g," ").slice(0,80)));r.onclick=()=>{bdOpen=p.id;bdReply=null;drawBoard();window.scrollTo(0,0)};box.appendChild(r)})}
function bdForm(pid,rid,ph){const key="c:"+pid+":"+(rid||""),f=elT("form","row bd-cf");f.style.flexWrap="nowrap";const i=elT("input");i.type="text";i.maxLength=BD_CMT;i.placeholder=ph;i.setAttribute("aria-label",ph);i.style.flex="1";
 i.value=bdDraft[key]||"";i.oninput=()=>{if(i.value)bdDraft[key]=i.value;else delete bdDraft[key];bdSave()};
 const b=elT("button","btn",rid?"답글":"댓글");b.type="submit";b.style.cssText="width:auto;margin:0;padding:9px 14px";f.append(i,b);
 f.onsubmit=async e=>{e.preventDefault();const x=i.value.trim().slice(0,BD_CMT);if(!x)return;b.disabled=true;const ok=await bdWrite({bt:"c",p:pid,r:rid||"",x});b.disabled=false;if(ok){delete bdDraft[key];bdSave();titleState();C.stats.comments=(C.stats.comments||0)+1;save();checkTitles();bdReply=null;drawBoard()}};
 if(rid)setTimeout(()=>i.focus());return f}let ONL=[],onT=0;
const isOn=p=>!!p&&Number(p.on)>Math.min(Date.now(),PLT||Date.now())-ON_WIN;
function beat(){if(!AUTH.uid||!C||!DB||LOCAL||document.visibilityState==="hidden")return;DB.doc("players/"+UID+"/on").set(Date.now()).catch(()=>{})}
async function loadOnline(force){if(!AUTH.uid||!C||!XON())return;if(!force&&Date.now()-onT<PL_TTL)return;onT=Date.now();
 try{const sn=await plAll(force?0:PL_TTL);ONL=sn.docs.map(d=>Object.assign({u:d.id},d.data()||{})).filter(p=>p.u===UID||isOn(p)).sort((a,b)=>String(a.n||"").localeCompare(String(b.n||""),"ko"));if(!ONL.some(p=>p.u===UID))ONL.push({u:UID,n:C.n});drawOnline()}catch(e){}}
function drawOnline(){const w=$("#onlw"),b=$("#onl");if(!w||!C)return;w.hidden=!XON();if(w.hidden)return;b.textContent="지금 접속 중 "+ONL.length+"명"}
setInterval(()=>{if(document.hidden)return;beat();loadOnline()},ON_MS);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"){beat();loadOnline()}});

/* 친구 목록의 절망도: 친구가 마지막으로 접속했을 때의 절망도에서, 그 뒤 흐른 시간만큼 자연 회복을 반영한 추정값을 보여 준다. */
function frDz(p){const fall=!!p.fl,base=Math.max(0,Math.min(100,Number(p.dz)||0)),ts=Number(p.ts)||Date.now(),est=fall?100:p.hf?base:Math.max(0,base-HEAL_DZ*Math.floor(Math.max(0,Date.now()-ts)/HEAL_MS));
 const w=elT("span","fr-dz"+(fall?" fall":est>=90?" warn":""));w.style.display="flex";const bar=elT("span","bar"),f=elT("i");bar.style.display="block";f.style.width=est+"%";bar.appendChild(f);
 w.append(elT("span","",fall?"타락":"절망도"),bar,elT("b","",String(est)));w.title=fall?"타락한 상태다. 마을의 '타락한 친구'에서 함께 되돌려 주자.":"마지막 접속 기준으로 자연 회복을 반영한 값이다.";return w}
let DRP={};// 재해 id → 진압 점수 합(서버 기록에서 계산)
const disSlot=t=>Math.floor((t/3600000+9)/6);
function disInfo(sl){const id="d"+sl,g=rng(hs32(id)),r=g(),v="ABCD"[Math.floor(g()*4)],d=DIS[Math.floor(g()*DIS.length)],T0=(sl*6-9)*3600000;
 return r<DIS_P?{id,sl,v,k:d[0],nm:d[1],ic:d[2],el:d[3],ef:d[4],T0,T1:T0+DIS_MS}:null}
const disPts=x=>Math.max(DRP[x.id]||0,(C&&C.dr&&C.dr.id===x.id)?Number(C.dr.pts)||0:0);
const disDone=x=>!!x&&disPts(x)>=DIS_GOAL;
// 지금 내 마을을 덮친, 아직 진압되지 않은 재해의 종류(없으면 "")
const disMine=()=>{if(!C)return "";const x=disInfo(disSlot(Date.now()));return x&&x.v===C.v&&!disDone(x)?x.k:""};
async function disAct(){const x=disInfo(disSlot(Date.now())),m=$("#hm");if(!x||!C)return;if(disDone(x))return;
 const left=DIS_CD-(Date.now()-((C.dr&&C.dr.at)||0));if(left>0){toast("재해 대응은 "+cdTxt(left)+" 뒤에 다시 할 수 있다.");return}
 if(C.fall){toast("타락한 동안에는 재해에 대응할 수 없다.");return}
 const add=(C.a||[]).includes(x.el)?2:1;if(!C.dr||C.dr.id!==x.id)C.dr={id:x.id,pts:0};C.dr.pts+=add;C.dr.at=Date.now();
 giveRw(DIS_HIT);titleState();C.stats.disActs=(C.stats.disActs||0)+1;guardAdd(5);save();checkTitles();
 try{await DB.doc("players/"+UID+"/dr").set(C.dr)}catch(e){}
 DRP[x.id]=Math.max(DRP[x.id]||0,0)+add;toast(x.ic+" "+VL[x.v].n+" "+x.nm+" 대응! 진압 +"+add+(add>1?" ("+x.el+" 속성 보너스)":"")+" · 골드 +"+DIS_HIT.g);disCheck();hubDis()}
// 진압되면 기여한 사람에게 보상을 주고 알린다(한 번만).
function disCheck(){const x=disInfo(disSlot(Date.now()));if(!x||!C||!disDone(x))return;if(C.drw===x.id)return;C.drw=x.id;
 if(C.dr&&C.dr.id===x.id&&C.dr.pts>0){giveRw(DIS_WIN);note("disaster",VL[x.v].n+"의 "+x.nm+"이(가) 진압되었다! 함께 막아 낸 보상: "+rwTxt(DIS_WIN));toast(x.ic+" "+x.nm+" 진압! 보상 "+rwTxt(DIS_WIN))}
 else if(x.v===C.v)note("disaster",VL[x.v].n+"의 "+x.nm+"이(가) 진압되었다. 마을이 다시 평온해졌다.");save()}
// 새 재해가 닥치면 한 번 알린다.
function disAlert(){const x=disInfo(disSlot(Date.now()));if(!x||!C||C.drn===x.id||disDone(x))return;C.drn=x.id;save();
 const t=x.ic+" "+VL[x.v].n+"에 "+x.nm+"이(가) 닥쳤다! "+(x.v===C.v?"우리 마을이다. ":"")+"효과: "+x.ef;note("disaster",t);toast(t);if(x.v===C.v)ding()}
function hubDis(){const box=$("#hdi");if(!box||!C)return;box.innerHTML="";const now=Date.now(),x=disInfo(disSlot(now));
 if(!x){const nx=(disSlot(now)+1)*6-9,d=new Date(nx*3600000);box.appendChild(elT("p","hint","지금은 평온하다. 다음 날씨는 "+String((d.getUTCHours()+9)%24).padStart(2,"0")+"시에 바뀐다."));return}
 const done=disDone(x),pts=Math.min(DIS_GOAL,disPts(x)),w=elT("div","dq dis"+(done?" got":x.v===C.v?" mine":"")),cp=elT("div","dq-copy"),bar=elT("div","bar"),f=elT("i");
 f.style.width=(pts/DIS_GOAL*100)+"%";bar.appendChild(f);
 cp.append(elT("b","",x.ic+" "+VL[x.v].n+" · "+x.nm+(x.v===C.v?" (우리 마을)":"")),elT("small","",done?"진압 완료! 마을이 평온을 되찾았다.":"효과: "+x.ef+" · 진압 "+pts+" / "+DIS_GOAL+" · "+x.el+" 속성은 대응 점수 2배 · "+(()=>{const mm=Math.max(1,Math.ceil((x.T1-now)/60000));return (mm>=60?Math.floor(mm/60)+"시간 ":"")+(mm%60)+"분 남음"})()),bar);
 const left=DIS_CD-(now-((C.dr&&C.dr.at)||0)),b=elT("button","chip",done?"완료":left>0?Math.ceil(left/60000)+"분 뒤":"대응");b.type="button";b.disabled=done||left>0||!!C.fall;b.onclick=disAct;w.append(cp,b);box.appendChild(w);
 if(!done)box.appendChild(elT("p","hint","대응할 때마다 골드 "+DIS_HIT.g+", 마을 경쟁 점수 5. 진압되면 대응한 모두에게 "+rwTxt(DIS_WIN)+"."))}
setInterval(()=>{if(!C||!XON())return;disAlert();disCheck();if(!$("#v-hub").hidden)hubDis()},30000);
const rnCost=L=>L+2;
function rnLv(k){return C&&C.rn?Math.min(RN_MAX,Math.max(0,Number(C.rn[k])||0)):0}
function drawRunes(){const box=$("#bgr");if(!box||!C)return;box.innerHTML="";const have=(C.inv||{}).mana||0;
 $("#rnh").textContent="마력석을 바쳐 몸에 각인을 새긴다. 실패하지 않고, 한 번 새긴 각인은 영원히 남는다. 가진 마력석 "+have+"개.";
 RN.forEach(([k,nm,ic,ef])=>{const L=rnLv(k),mx=L>=RN_MAX,cost=rnCost(L),w=document.createElement("div");w.style.cssText="display:flex;gap:8px";
  const i=elT("div","chip");i.style.cssText="flex:1;text-align:left;cursor:default";i.append(elT("b","",ic+" "+nm+" "+L+" / "+RN_MAX),elT("small","",(L?"지금: "+ef(L):"아직 새기지 않았다")+(mx?" (최고 단계)":" → 다음: "+ef(L+1))));
  i.querySelector("small").style.cssText="display:block;color:var(--mu);font-weight:400";
  const b=elT("button","chip",mx?"완성":"새기기 (마력석 "+cost+"개)");b.type="button";b.style.cssText="flex:0 0 auto;min-width:0;padding:10px 14px";b.disabled=mx||have<cost;b.onclick=()=>rnUp(k);w.append(i,b);box.appendChild(w)})}
function rnUp(k){const r=RN.find(x=>x[0]===k),L=rnLv(k),cost=rnCost(L);if(!r||L>=RN_MAX||((C.inv||{}).mana||0)<cost)return;
 C.inv.mana-=cost;C.rn=C.rn||{};C.rn[k]=L+1;titleState();C.stats.runes=(C.stats.runes||0)+1;save();regPlayer();checkTitles();
 note("quest",r[1]+"을 "+(L+1)+"단계로 새겼다. ("+r[3](L+1)+")");bag("마력석 "+cost+"개가 녹아들며 "+r[2]+" "+r[1]+"이 "+(L+1)+"단계가 되었다. "+r[3](L+1)+".")}
function rtReq(){const cdl=Math.max(0,RT_CD-(Date.now()-(C.rtT||0))),mana=(C.inv||{}).mana||0;
 const sw=(C.stats&&C.stats.soloWins)||0,L=[[sw>=RT_SOLO,"고독한 출정 성공 "+RT_SOLO+"회 이상 (지금 "+sw+"회) · 혼자 나선 길에서 자신과 마주해야 한다"],[(C.cl||0)>=RT_CL,"토벌 성공 "+RT_CL+"회 이상 (지금 "+(C.cl||0)+"회)"],[mana>=RT_MANA,"마력석 "+RT_MANA+"개 (가진 것 "+mana+")"],[(C.gd||0)>=RT_GOLD,"골드 "+RT_GOLD+" (가진 것 "+(C.gd||0)+")"],
  [(C.dz||0)<=RT_DZMAX&&!C.fall,"절망도 "+RT_DZMAX+" 이하 (지금 "+(C.dz||0)+")"+(C.fall?" · 타락 중에는 불가":"")],[cdl<=0,cdl>0?"다음 재계약까지 "+(cdl>=86400000?Math.floor(cdl/86400000)+"일 "+Math.floor(cdl%86400000/3600000)+"시간":cdTxt(cdl)):"지난 재계약에서 7일 경과"]];return{L,ok:L.every(x=>x[0])}}
function drawRetrait(){const box=$("#bgrt");if(!box||!C)return;box.innerHTML="";const r=rtReq(),c=elT("div","card rt-card");
 c.append(elT("p","hint","계약의 원천 앞에서 계약을 처음부터 다시 맺는다. 지금 특성 「"+C.t+"」은(는) 사라지고, 다른 특성 하나가 무작위로 새겨진다. 좋은 특성이 나온다는 보장은 없고, 되돌릴 수 없다. 의식이 끝나면 절망도가 "+RT_DZ+" 오른다."));
 const ul=elT("ul","pm-req");r.L.forEach(([ok,t])=>ul.appendChild(elT("li",ok?"ok":"",(ok?"✓ ":"· ")+t)));c.appendChild(ul);
 const b=elT("button","btn"+(r.ok?"":" g"),r.ok?"운명의 재계약을 맺는다":"조건을 모두 채워야 한다");b.type="button";b.disabled=!r.ok;b.onclick=retrait;c.appendChild(b);box.appendChild(c)}
function retrait(){const r=rtReq();if(!r.ok)return;
 if(!confirm("정말 운명의 재계약을 맺을까?\n\n· 지금 특성 「"+C.t+"」은(는) 사라진다\n· 새 특성은 무작위다 (좋지 않은 특성이 나올 수도 있다)\n· 되돌릴 수 없다\n· 마력석 "+RT_MANA+"개, 골드 "+RT_GOLD+"를 쓰고 절망도가 "+RT_DZ+" 오른다"))return;
 const old=C.t,pool=TR.filter(t=>t!==old),nt=pool[Math.floor(Math.random()*pool.length)];
 C.inv.mana-=RT_MANA;C.gd-=RT_GOLD;C.t=nt;C.rtT=Date.now();titleState();C.stats.traitChanges=(C.stats.traitChanges||0)+1;
 note("quest","운명의 재계약: 특성이 「"+old+"」에서 「"+nt+"」(으)로 바뀌었다.");gain(0,RT_DZ);save();regPlayer();checkTitles();
 alertBox("✦ 운명의 재계약","계약의 원천이 빛을 삼키고, 오래된 계약의 문양이 부서졌다.\n그리고 새로운 문양이 살갗 위로 떠올랐다.\n\n「"+old+"」 → 「"+nt+"」\n"+(TD[nt]||"")+"\n\n대가로 절망도가 "+RT_DZ+" 올랐다.");bag()}
const petLv=q=>q?PET_LV.filter(n=>(q.xp||0)>=n).length:0;
const petCur=()=>C&&Array.isArray(C.pets)?C.pets.find(q=>q&&q.id===C.pet)||null:null;
// 함께하는 사역마의 효과. k: ex 경험치, gd 골드, dz 절망도 감소, pw 전투력, heal 자연 회복, lh 장기 토벌 확률
function petEff(k){const q=petCur();if(!q)return 0;const L=petLv(q),sp=q.sp;
 if(k==="ex")return sp==="rabbit"?.02*L:sp==="hope"?.02*L:0;if(k==="gd")return sp==="sparrow"?.02*L:sp==="hope"?.02*L:sp==="dragon"?.03*L:0;
 if(k==="dz")return sp==="jelly"?.02*L:sp==="hope"?.02*L:0;if(k==="pw")return sp==="fox"||sp==="dragon"?3*L:sp==="hope"?2*L:0;
 if(k==="heal")return sp==="cat"?(L>=5?2:L>=3?1:0):0;if(k==="lh")return sp==="turtle"||sp==="dragon"?.02*L:0;
 if(k==="gift")return sp==="sheep"?.1*L:0;if(k==="shop")return sp==="mouse"?.02*L:0;if(k==="trial")return sp==="owl"?L:0;if(k==="mana")return sp==="crow"?.03*L:0;
 if(k==="up")return sp==="hedgehog"?2*L:0;if(k==="res")return sp==="butterfly"?2*L:0;return 0}
function petXp(n){const q=petCur();if(!q||!n)return;const b=petLv(q);q.xp=Math.min(PET_LV[PET_LV.length-1],(q.xp||0)+n);const a=petLv(q);if(a>b){note("quest",PETS[q.sp][1]+" "+q.nm+"와(과)의 친밀도가 "+a+"단계가 되었다!");toast(PETS[q.sp][2]+" "+q.nm+" 친밀도 "+a+"단계!")}}
// 알 떨어뜨리기(출정·장기 토벌). 받았으면 안내 문구를 돌려준다.
function petDrop(src){if(Math.random()>=(src==="lh"?PET_DROP_LH:PET_DROP_X))return "";C.eggs=(C.eggs||0)+1;note("quest","사역마의 알을 주웠다! 가방에서 품을 수 있다.");return "🥚 사역마의 알을 주웠다!"}
function petRoll(){let r=Math.random(),rar=1;for(const [k,p] of PET_RATE){if(r<p){rar=k;break}r-=p}const l=Object.values(PETS).filter(x=>x[3]===rar);return l[Math.floor(Math.random()*l.length)][0]}
function petMsg(t,bad){const m=$("#bgm");if(m){m.style.color=bad?"var(--bad)":"var(--mu)";m.textContent=t}}
function petBuyEgg(){if((C.gd||0)<PET_EGG_G)return;if(C.eggBuy===today()){petMsg("알은 하루에 한 개만 살 수 있다.",1);return}C.gd-=PET_EGG_G;C.eggBuy=today();C.eggs=(C.eggs||0)+1;save();bag("사역마의 알을 샀다. 따뜻하게 품어 주자.")}
function petIncubate(){if(!(C.eggs>0)||C.egg)return;if((C.pets||[]).length>=PET_MAX){petMsg("사역마는 "+PET_MAX+"마리까지 데리고 있을 수 있다. 한 마리를 보내 주어야 새로 품을 수 있다.",1);return}
 C.eggs--;C.egg={t0:Date.now(),t1:Date.now()+PET_HATCH};save();bag("알을 품기 시작했다. 1시간 뒤에 깨어난다.")}
function petHatch(){const e=C.egg;if(!e||Date.now()<e.t1)return;const sp=petRoll(),P=PETS[sp],nm=(prompt(P[2]+" "+P[1]+"이(가) 깨어났다!\n이름을 지어 주자. (최대 10자)",P[1])||P[1]).trim().slice(0,10)||P[1];
 const q={id:"p"+Date.now().toString(36),sp,nm,xp:0,born:Date.now()};C.pets=Array.isArray(C.pets)?C.pets:[];C.pets.push(q);C.egg=null;if(!C.pet)C.pet=q.id;titleState();C.stats.hatched=(C.stats.hatched||0)+1;if(PETS[sp][3]===3)C.stats.petLeg=1;C.petSeen=C.petSeen||{};C.petSeen[sp]=1;
 note("quest","알에서 "+P[1]+" '"+nm+"'이(가) 깨어났다!");save();regPlayer();checkTitles();
 alertBox(P[2]+" 부화!",(P[3]===3?"★ 전설의 사역마 ★\n":P[3]===2?"희귀한 사역마!\n":"")+"알에서 "+P[1]+" '"+nm+"'이(가) 깨어났다.\n\n"+P[4]+"\n\n함께하면: "+P[5](1)+" (친밀도 1단계)\n친밀도가 오를수록 효과가 커진다.");bag()}
function petPat(q){if(q.pd===today())return;q.pd=today();petXp0(q,PET_PAT);save();bag(PETS[q.sp][2]+" "+q.nm+"을(를) 쓰다듬었다. 기분이 좋아 보인다. (친밀도 +"+PET_PAT+")")}
function petFeed(q){if((C.gd||0)<PET_SNACK_G)return;if(!q.fd||q.fd.d!==today())q.fd={d:today(),n:0};if(q.fd.n>=PET_SNACK_N){petMsg("오늘은 간식을 충분히 먹었다.",1);return}q.fd.n++;C.gd-=PET_SNACK_G;petXp0(q,PET_FEED);save();bag(PETS[q.sp][2]+" "+q.nm+"이(가) 간식을 맛있게 먹었다. (친밀도 +"+PET_FEED+")")}
function petXp0(q,n){const cur=C.pet;C.pet=q.id;petXp(n);C.pet=cur;regPlayer()}
function petRename(q){const nm=(prompt("새 이름 (최대 10자)",q.nm)||"").trim().slice(0,10);if(!nm)return;q.nm=nm;save();regPlayer();bag("이름을 '"+nm+"'(으)로 바꿨다.")}
function petBye(q){if(!confirm(q.nm+"을(를) 보내 줄까? 다시 돌아오지 않는다."))return;C.pets=C.pets.filter(x=>x!==q);C.petGone=C.petGone||{};C.petGone[q.id]=1;if(C.pet===q.id)C.pet=(C.pets[0]||{}).id||null;save();regPlayer();bag(q.nm+"이(가) 몇 번이나 뒤를 돌아보다가 숲으로 돌아갔다.")}
function drawPets(){const box=$("#bgpt");if(!box||!C)return;box.innerHTML="";C.pets=Array.isArray(C.pets)?C.pets:[];const now=Date.now();C.petSeen=C.petSeen||{};C.pets.forEach(q=>{if(q&&PETS[q.sp])C.petSeen[q.sp]=1});
 box.appendChild(elT("p","hint","곁을 지키는 작은 마수. '함께하기'로 정한 한 마리의 효과를 받는다. 쓰다듬고, 간식을 주고, 함께 출정할수록 친밀도가 올라 효과가 커진다."));
 // 알
 const ec=elT("div","card pet-card"),eb=elT("div","pet-body");ec.append(elT("span","pet-ic","🥚"),eb);
 if(C.egg){const done=now>=C.egg.t1;eb.append(elT("b","",done?"알이 흔들린다!":"알을 품는 중"),elT("small","",done?"곧 무언가 깨어날 것 같다.":"부화까지 "+cdTxt(C.egg.t1-now)));const a=elT("div","pet-act"),b=elT("button","chip",done?"부화시키기":"기다리는 중");b.type="button";b.disabled=!done;b.onclick=petHatch;a.appendChild(b);eb.appendChild(a)}
 else{eb.append(elT("b","","사역마의 알 "+(C.eggs||0)+"개"),elT("small","","상점가 "+PET_EGG_G+"골드(하루 1개) · 출정에서 가끔, 장기 토벌 성공 시 종종 줍는다. 품으면 1시간 뒤 깨어난다. (일반 70% · 희귀 27% · 전설 3%)"));
  const a=elT("div","pet-act"),b1=elT("button","chip","알 품기");b1.type="button";b1.disabled=!(C.eggs>0);b1.onclick=petIncubate;const b2=elT("button","chip","알 사기 ("+PET_EGG_G+"골드)");b2.type="button";b2.disabled=(C.gd||0)<PET_EGG_G||C.eggBuy===today();b2.onclick=petBuyEgg;a.append(b1,b2);eb.appendChild(a)}
 box.appendChild(ec);
 {const all=Object.values(PETS),seen=all.filter(x=>C.petSeen[x[0]]);box.appendChild(elT("p","hint","만난 사역마 "+seen.length+" / "+all.length+"종: "+all.map(x=>C.petSeen[x[0]]?x[2]:"❔").join(" ")))}
 if(!C.pets.length){box.appendChild(elT("p","hint","아직 사역마가 없다. 알을 품어 보자."));return}
 C.pets.forEach(q=>{const P=PETS[q.sp];if(!P)return;const L=petLv(q),on=C.pet===q.id,nx=PET_LV[L],c=elT("div","card pet-card"+(on?" on":"")),bd=elT("div","pet-body");c.append(elT("span","pet-ic",P[2]),bd);
  bd.append(elT("b","pet-r"+P[3],P[1]+" '"+q.nm+"'"+(on?" · 함께하는 중":"")+(P[3]===3?" ★전설":P[3]===2?" ◆희귀":"")),elT("small","",P[4]),elT("small","","효과: "+P[5](L)+" · 친밀도 "+L+"단계"+(nx!=null?" ("+(q.xp||0)+" / "+nx+")":" (최고)")));
  const bar=elT("div","bar"),f=elT("i");const pv=PET_LV[L-1]||0;f.style.width=(nx!=null?Math.min(100,((q.xp||0)-pv)/(nx-pv)*100):100)+"%";bar.appendChild(f);bd.appendChild(bar);
  const a=elT("div","pet-act"),mk=(t,fn,dis)=>{const b=elT("button","chip",t);b.type="button";b.disabled=!!dis;b.onclick=fn;a.appendChild(b)};
  if(!on)mk("함께하기",()=>{C.pet=q.id;save();regPlayer();bag(q.nm+"와(과) 함께하기로 했다.")});
  mk(q.pd===today()?"쓰다듬기 (내일 다시)":"쓰다듬기 (+"+PET_PAT+")",()=>petPat(q),q.pd===today());
  const fn=(q.fd&&q.fd.d===today())?q.fd.n:0;mk("간식 "+PET_SNACK_G+"골드 ("+fn+"/"+PET_SNACK_N+")",()=>petFeed(q),fn>=PET_SNACK_N||(C.gd||0)<PET_SNACK_G);
  mk("이름 바꾸기",()=>petRename(q));mk("보내 주기",()=>petBye(q));bd.appendChild(a);box.appendChild(c)})}
setInterval(()=>{if(C&&C.egg&&!C.egg.nt&&Date.now()>=C.egg.t1){C.egg.nt=1;save();note("quest","사역마의 알이 흔들린다! 가방에서 부화시키자.");toast("🥚 알이 흔들린다! 가방에서 부화시키자.");try{ding()}catch(e){}}if(C&&C.egg&&!$("#v-bag").hidden)drawPets()},30000);
// 홍수와 마인의 저주는 자연 회복을 각각 절반으로 줄인다.
const healAmt=()=>{const h=HEAL_DZ+facLv("spring")+petEff("heal"),f=(disMine()==="flood"?.5:1)*(witchCurse()?.5:1);return f<1?Math.ceil(h*f):h};
const wvBaseNow=()=>Math.max(WV_HP,Math.round(onlineTopPw()*WV_K));
const wvBase=()=>{const L=(WVL||[]).filter(v=>v&&v.u);if(!L.length)return wvBaseNow();const f=L.slice().sort((a,b)=>(Number(a.t0||a.ts)||0)-(Number(b.t0||b.ts)||0))[0];return Number(f.b0)>0?Number(f.b0):WV_HP};
const wvHp=n=>Math.round(wvBase()*Math.pow(WV_GROW,n-1));
const wvTotal=n=>{let t=0;for(let i=1;i<=n;i++)t+=wvHp(i);return t};
// t 시각 기준 현재(또는 가장 최근) 웨이브와 다음 웨이브
function wvAt(t){const k=new Date(t+9*3600000),day=Date.UTC(k.getUTCFullYear(),k.getUTCMonth(),k.getUTCDate())-9*3600000,list=[];
 for(const dd of [-1,0,1])WV_HOURS.forEach(h=>{const T0=day+dd*864e5+h*3600000,d=new Date(T0+9*3600000);list.push({id:"wave-"+d.getUTCFullYear()+String(d.getUTCMonth()+1).padStart(2,"0")+String(d.getUTCDate()).padStart(2,"0")+"-"+h,T0,T1:T0+WV_LEN,h})});
 list.sort((a,b)=>a.T0-b.T0);return{cur:list.filter(w=>w.T0<=t).pop(),next:list.find(w=>w.T0>t)}}
// 피해 합으로 몇 웨이브를 막았는지, 지금 웨이브의 남은 HP
function wvState(sum){let n=0,acc=0;while(n<WV_N&&sum>=acc+wvHp(n+1)){acc+=wvHp(n+1);n++}return{cleared:n,cur:Math.min(WV_N,n+1),hp:n>=WV_N?0:wvHp(n+1)-(sum-acc),mx:n>=WV_N?wvHp(WV_N):wvHp(n+1)}}
let WVL=[],wvT=0,wvBusy=false;
async function loadWave(w,force){if(!w||!XON()||wvBusy)return;if(!force&&Date.now()-wvT<5000)return;wvBusy=true;wvT=Date.now();try{const s=await once(DB.collection("wboss/"+w.id));WVL=s.docs.map(d=>d.data()).filter(v=>v&&v.u)}catch(e){}finally{wvBusy=false}}
const wvSum=()=>WVL.reduce((a,v)=>a+(Number(v.d)||0),0);
async function wvAttack(){const {cur:w}=wvAt(Date.now()),m=$("#wvm"),now=Date.now();if(!w||now>=w.T1)return;
 if(C.fall||C.dz>=90){m.style.color="var(--bad)";m.textContent=C.fall?"타락한 동안에는 싸울 수 없다.":"절망도가 너무 높아 싸울 수 없다.";return}
 if(now-(C.wva||0)<WV_CD)return;await loadWave(w,true);const st=wvState(wvSum());if(st.cleared>=WV_N){m.style.color="var(--mu)";m.textContent="모든 웨이브를 막아 냈다!";return}
 const mine=WVL.find(v=>v.u===UID)||{},d=Math.max(1,Math.round(pw()*(1.5+Math.random())*(C.a.includes("불")?1.2:1)*((VL[C.v]||{}).bd||1)));
 const b0=Number(mine.b0)||wvBase(),t0=Number(mine.t0)||now;C.wva=now;try{await DB.doc("wboss/"+w.id+"/"+UID).set({u:UID,n:nmOf(),d:(Number(mine.d)||0)+d,p:pw(),c:(Number(mine.c)||0)+1,ts:now,t0,b0})}catch(e){m.style.color="var(--bad)";m.textContent="공격하지 못했다. 잠시 뒤에 다시 시도해 보자.";C.wva=0;return}
 C.wvj=keepIds(C.wvj,w.id);C.gd=(C.gd||0)+WV_HIT;titleState();C.stats.waveHits=(C.stats.waveHits||0)+1;save();
 const i=WVL.findIndex(v=>v.u===UID);const rec={u:UID,n:nmOf(),d:(Number(mine.d)||0)+d,p:pw(),c:(Number(mine.c)||0)+1,ts:now,t0,b0};if(i>=0)WVL[i]=rec;else WVL.push(rec);
 const st2=wvState(wvSum());m.style.color="var(--mu)";m.textContent=st2.cur+"웨이브 「"+WV_NAMES[st2.cur-1]+"」에 "+d+"의 피해! (골드 +"+WV_HIT+")"+(st2.cleared>st.cleared?" "+st2.cleared+"웨이브를 막아 냈다!":"");wvDraw()}
// 끝난 웨이브의 보상: 참가자 모두 막아 낸 웨이브 수만큼, 피해 1위는 마력석 2개 추가.
async function wvClaim(){if(!C||!XON())return;const {cur:w}=wvAt(Date.now());if(!w||Date.now()<w.T1||!(C.wvj&&C.wvj[w.id])||(C.wvc&&C.wvc[w.id]))return;
 await loadWave(w,true);const st=wvState(wvSum()),top=WVL.slice().sort((a,b)=>(b.d||0)-(a.d||0))[0],mvp=!!top&&top.u===UID;if(C.wvc&&C.wvc[w.id])return;C.wvc=keepIds(C.wvc,w.id);
 const r={g:WV_RW.g*st.cleared,m:Math.floor(st.cleared/WV_RW.mEvery)+(mvp?WV_RW.mvp:0)};giveRw(r);if(st.cleared)gain(WV_RW.ex*st.cleared,0);titleState();C.stats.waveBest=Math.max(C.stats.waveBest||0,st.cleared);if(st.cleared>=WV_N)C.stats.waveFull=(C.stats.waveFull||0)+1;
 note("wave","몬스터 웨이브 종료: "+st.cleared+" / "+WV_N+"웨이브를 막아 냈다. 보상 "+(rwTxt(r)||"없음")+(st.cleared?", 경험치 "+WV_RW.ex*st.cleared:"")+(mvp?" (피해 1위!)":""));toast("⚔ 몬스터 웨이브 종료 · "+st.cleared+"웨이브 방어 · "+(rwTxt(r)||"보상 없음"));save();checkTitles()}
// 알림: 시작 10분 전, 시작할 때
function wvAlert(){if(!C||!XON())return;const now=Date.now(),{cur,next}=wvAt(now);
 if(next&&next.T0-now<=600000&&C.wvn1!==next.id){C.wvn1=next.id;save();toast("⚔ 10분 뒤 몬스터 웨이브가 몰려온다! ("+String(next.h).padStart(2,"0")+":00)")}
 if(cur&&now<cur.T1&&C.wvn2!==cur.id){C.wvn2=cur.id;save();const t="⚔ 몬스터 웨이브가 시작되었다! 30분 동안 함께 막아 내자.";note("wave",t);toast(t,waveView);ding()}}
function wvTxt(ms){const t=Math.max(0,Math.ceil(ms/1000)),h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;return h?h+"시간 "+m+"분":m+":"+String(s).padStart(2,"0")}
function hubWave(){const box=$("#hwv");if(!box||!C)return;box.innerHTML="";if(!XON()){box.appendChild(elT("p","hint","서버에 연결되어야 참가할 수 있다."));return}
 const now=Date.now(),{cur,next}=wvAt(now),live=cur&&now<cur.T1,w=elT("div","dq wv"+(live?" done":"")),cp=elT("div","dq-copy");
 if(live){const st=wvState(wvSum()),bar=elT("div","bar"),f=elT("i");f.style.width=(st.mx?Math.max(0,st.hp)/st.mx*100:0)+"%";bar.appendChild(f);
  cp.append(elT("b","","⚔ 몬스터 웨이브 진행 중"),elT("small","",st.cur+" / "+WV_N+"웨이브 「"+WV_NAMES[st.cur-1]+"」 · 참가 "+WVL.length+"명 · 남은 시간 "+wvTxt(cur.T1-now)),bar)}
 else cp.append(elT("b","","⚔ 다음 몬스터 웨이브"),elT("small","",(next?String(next.h).padStart(2,"0")+":00 시작 · "+wvTxt(next.T0-now)+" 남음":"")+" · 매일 "+WV_HOURS.map(h=>h+"시").join(", ")+", 30분 동안"));
 const b=elT("button","chip",live?"전장으로":"보기");b.type="button";b.onclick=waveView;w.append(cp,b);box.appendChild(w)}
function waveView(){show("wave");$("#wvm").textContent="";const {cur}=wvAt(Date.now());loadWave(cur,true).then(wvDraw);wvDraw()}
function wvDraw(){if($("#v-wave").hidden||!C)return;const box=$("#wvb");box.innerHTML="";const now=Date.now(),{cur,next}=wvAt(now),live=cur&&now<cur.T1;
 if(!live){const c=elT("div","card");c.append(elT("h2","","다음 웨이브까지 "+(next?wvTxt(next.T0-now):"-")),elT("p","hint","매일 "+WV_HOURS.map(h=>String(h).padStart(2,"0")+":00").join(", ")+"에 30분 동안 열린다. 시작 10분 전에 알림이 온다."));
  if(cur&&WVL.length){const st=wvState(wvSum());c.appendChild(elT("p","","지난 웨이브 결과: "+st.cleared+" / "+WV_N+"웨이브 방어 · 참가 "+WVL.length+"명"))}box.appendChild(c)}
 else{const st=wvState(wvSum()),c=elT("div","card boss-card w");c.append(elT("p","boss-tag","웨이브 "+st.cur+" / "+WV_N+" · 남은 시간 "+wvTxt(cur.T1-now)),elT("h2","",WV_NAMES[st.cur-1]));
  const bar=elT("div","bar"),f=elT("i");f.style.width=(st.mx?Math.max(0,st.hp)/st.mx*100:0)+"%";bar.appendChild(f);c.append(bar,elT("p","hint","HP "+Math.max(0,st.hp)+" / "+st.mx+" · 막아 낸 웨이브 "+st.cleared+" · 참가 "+WVL.length+"명"));
  const steps=elT("div","wv-steps");for(let i=1;i<=WV_N;i++)steps.appendChild(elT("span",i<=st.cleared?"on":i===st.cur?"cur":"",String(i)));c.appendChild(steps);
  const left=WV_CD-(now-(C.wva||0)),b=elT("button","btn",st.cleared>=WV_N?"모든 웨이브를 막아 냈다!":C.fall?"타락 중에는 싸울 수 없다":C.dz>=90?"절망도가 너무 높아 싸울 수 없다":left>0?"다시 공격까지 "+Math.ceil(left/1000)+"초":"공격한다 (예상 피해 "+Math.round(pw()*1.5)+"~"+Math.round(pw()*2.5)+")");
  b.type="button";b.disabled=st.cleared>=WV_N||!!C.fall||C.dz>=90||left>0;b.onclick=wvAttack;c.appendChild(b);box.appendChild(c)}
 const rank=WVL.slice().sort((a,b)=>(b.d||0)-(a.d||0));if(rank.length){const ol=elT("ol","boss-rank");rank.slice(0,10).forEach(v=>ol.appendChild(elT("li",v.u===UID?"me":"",cn(v.u,v.n)+" · 피해 "+(Number(v.d)||0)+" ("+(Number(v.c)||0)+"회)")));box.appendChild(ol)}
 box.appendChild(elT("p","boss-info","30초에 한 번 공격(골드 +"+WV_HIT+"). 1웨이브 HP는 첫 공격 때 접속 중인 가장 강한 마법소녀의 전투력 ×"+WV_K+"(웨이브마다 "+WV_GROW+"배). 끝나면 참가자 모두 막아 낸 웨이브 1개당 골드 "+WV_RW.g+"·경험치 "+WV_RW.ex+", "+WV_RW.mEvery+"웨이브마다 마력석 1개. 피해 1위는 마력석 "+WV_RW.mvp+"개 추가. 10웨이브를 모두 막으면 칭호 '파도를 가른 자'."))}
setInterval(()=>{if(!C||!XON())return;wvAlert();wvClaim();const {cur}=wvAt(Date.now()),live=cur&&Date.now()<cur.T1;
 if(!$("#v-wave").hidden){loadWave(cur).then(wvDraw);wvDraw()}else if(!$("#v-hub").hidden){if(live)loadWave(cur).then(hubWave);else hubWave()}},1000);
$("#wvx").onclick=()=>hub();

/* 재계약 시험 */
let T=null;
const trGoal=()=>31+gi()*22+T.f*4+(T.f+1===T.n?12:0);
$("#b-trial").onclick=()=>{if(trLeft()>0)return;T={f:0,n:3+gi(),l:[],cd:0,started:false};show("trial");tr()};
function trStart(){if(T.started)return;T.started=true;C.trT=Date.now();
 if(useItem("candle")){T.cd+=5;T.l.push("계약의 촛불에 불을 붙였다. 이번 시험의 판정에 +5가 더해진다.")}
 if(C.tcb){T.cd+=C.tcb;T.l.push("여왕의 표식이 빛난다. 이번 시험의 판정에 +"+C.tcb+"이(가) 더해진다.");C.tcb=0}{const ob=petEff("trial");if(ob){T.cd+=ob;T.l.push("지혜부엉이가 어깨 위에서 조용히 속삭인다. 판정 +"+ob+".")}}save()}
$("#tb").onclick=()=>{if(T&&T.started&&!T.end&&!confirm("지금 나가면 이번 시험은 끝나고, 24시간 뒤에야 다시 볼 수 있다. 나갈까?"))return;hub()};
function tr(msg){const done=T.end;$("#tc").innerHTML="<h2>"+(T.f+1>T.n?"":(T.f+1===T.n?"마지막 층: 여왕님":(T.f+1)+"층"))+"</h2><dl class='kv'><dt>판정</dt><dd>"+(pw()+VL[C.v].tb+(C.a.includes("땅")?4:0)+(T.cd||0)+(C.t==="집중"?3:0)+facLv("library"))+" + 운(0~19)</dd>"+(T.f<T.n?"<dt>이번 층 목표</dt><dd>"+trGoal()+" 이상</dd>":"")+"<dt>실패 허용</dt><dd>"+Math.max(0,TRIAL_LIVES-(T.fails||0))+"번 남음</dd>"+((()=>{const a=[armed("seal")?"여왕의 인장":"",!T.started&&armed("candle")?"계약의 촛불":"",!T.started&&C.tcb?"여왕의 표식 +"+C.tcb:""].filter(Boolean);return a.length?"<dt>준비</dt><dd>"+a.join(", ")+"</dd>":""})())+"<dt>절망도</dt><dd>"+C.dz+"/100</dd></dl>";
 $("#tl").innerHTML=T.l.map(t=>"<p>"+t+"</p>").join("")||"<p>여왕님이 시련의 문을 열었다. 총 "+T.n+"층을 통과해야 한다.</p>"+(T.started?"":"<p class='hint'>아직 시험을 시작하지 않았다. '나아간다'를 누르는 순간 시작되고, 그때부터 24시간 뒤에 다시 볼 수 있다. 지금 돌아가면 아무것도 잃지 않는다.</p>");
 $("#tg").hidden=!!done;$("#tb").hidden=!done&&false}
$("#tg").onclick=()=>{if(T.end)return;trStart();const v=VL[C.v],last=T.f+1===T.n,e=trGoal(),s0=pw()+v.tb+(C.a.includes("땅")?4:0)+(T.cd||0)+(C.t==="집중"?3:0)+facLv("library")+(eq(1)?Math.max(8,R(20)):R(20)),miss=C.t==="불안정한 마력"&&Math.random()<.2,s=s0-(miss?10:0);if(miss)T.l.push("마력이 흔들려 마법이 빗나갔다. (판정 -10)");
 let pass=s>=e;if(!pass&&useSk("earth")){const s2=pw()+v.tb+(C.a.includes("땅")?4:0)+(T.cd||0)+(C.t==="집중"?3:0)+facLv("library")+(eq(1)?Math.max(8,R(20)):R(20));pass=s2>=e;T.l.push("대지의 가호로 다시 맞섰다. "+(pass?"이번에는 버텨 냈다.":"그래도 밀려났다."));save()}
 if(pass){T.l.push((last?"여왕님의 시련을 넘었다.":(T.f+1)+"층을 통과했다."));T.f++;C.gd=(C.gd||0)+15;gain(0,8+v.dz)}
 else{titleState();C.stats.trialFails=(C.stats.trialFails||0)+1;T.fails=(T.fails||0)+1;if(useItem("seal")){T.l.push("시련에 밀려났지만 여왕의 인장이 마음을 지켜 주었다. 절망도가 오르지 않았다.");save()}else{T.l.push("시련에 밀려났다. 절망도가 오른다."+(eq(3)?" (방패가 충격을 줄였다)":""));gain(0,eq(3)?12:20)}
  if(T.fails>TRIAL_LIVES&&!C.fall){T.l.push("시련에 "+T.fails+"번 밀려났다. 여왕님이 조용히 고개를 저으며 시험을 끝냈다. 24시간 뒤에 다시 도전할 수 있다.");note("quest","재계약 시험에서 탈락했다. 24시간 뒤에 다시 도전할 수 있다.");T.end=1}}
 if(C.fall){T.l.push("절망이 한계를 넘었다. 시련의 문 앞에서 타락이 시작되었다.");T.end=1}
 else if(T.f>=T.n){titleState();C.stats.trialWins=(C.stats.trialWins||0)+1;const old=C.g;C.g=GL[gi()+1];C.cl=0;let r;const miss=AT.filter(a=>!C.a.includes(a[0]));
  if(miss.length&&Math.random()<.15){const mx=miss[R(miss.length)],a=mx[0];C.a.push(a);r="새로운 속성 '"+a+"'을 손에 넣었다! ("+mx[2]+")"}else{C.b=(C.b||0)+5;r="능력이 개화했다. 전투력이 올랐다."}
  if(C.t==="각성자"){C.b=(C.b||0)+3;r+=" 한계를 넘어 각성했다. 전투력이 3 더 올랐다."}
  save();checkTitles();T.l.push("재계약 성공! "+old+"등급에서 "+C.g+"등급이 되었다. "+r);T.end=1}
 tr()};


/* 화면 모드: 블랙(기본)과 화이트 중에서 고른다. 고른 값은 이 기기에 기억한다. */
function thmSet(t){const r=document.documentElement;if(t==="light")r.dataset.theme="light";else delete r.dataset.theme;try{localStorage.setItem("mgr_theme",t)}catch(e){}thmDraw()}
function thmDraw(){const b=document.getElementById("thm");if(!b)return;const lt=document.documentElement.dataset.theme==="light";b.textContent=lt?"☾ 블랙":"☀ 화이트";b.title=lt?"블랙 모드로 바꾸기":"화이트 모드로 바꾸기";const m=document.querySelector('meta[name="theme-color"]');if(m)m.content=lt?"#f4efe6":"#0c0a14"}
document.getElementById("thm").onclick=()=>thmSet(document.documentElement.dataset.theme==="light"?"dark":"light");thmDraw();
