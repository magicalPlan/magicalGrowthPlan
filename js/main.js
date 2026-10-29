
// 이벤트 조건 판단용: 파티의 속성, 특성, 인원, 절망도
const evCtx=r=>{const ps=Object.values(r.pl||{});return{ps,n:ps.length,at:a=>ps.some(p=>String(p.a||"").includes(a)),tr:t=>ps.some(p=>p.t===t),hiDz:ps.some(p=>(Number(p.dz)||0)>=70)}};
// 메아리 이벤트: 파티에 없는 내 친구 이름 하나
const echoName=r=>{const ids=Object.keys((C&&C.fr)||{}).filter(u=>!r.pl[u]&&C.fr[u]);return ids.length?esc(String(C.fr[ids[R(ids.length)]]).slice(0,20)):"이름 모를 마법소녀"};
const EVM={};EV.concat(SOLO_EV,...Object.values(VEV)).forEach(x=>EVM[x.id]=x);
let C=null,DB=null,UID="나",LOCAL=false;
try{C=JSON.parse(localStorage.getItem("mgr"))}catch(e){}
// 로그인 중이면 서버에 바뀐 칸만 올린다. 캐릭터 전체를 이 브라우저에 다시 쓰지 않는다.
// 혼자 하기만 이 브라우저의 mgr 에 캐릭터를 남긴다.
const save=()=>{try{updNav()}catch(e){}if(AUTH.uid){savePending=true;try{pubSync()}catch(e){}try{if(C&&accBase){const body=accDiff(C);if(body&&Object.keys(body).length)localStorage.setItem("mgr_pend_"+AUTH.uid,JSON.stringify(body))}}catch(e){}saveCloud();return}try{localStorage.setItem("mgr",JSON.stringify(C))}catch(e){}};
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
let ADM=admFix({}),signup=false,sct=null;
// 운영자는 서버의 admins 목록(콘솔에서만 수정 가능)에 있는 계정이다. 이름으로는 판단하지 않는다.
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
/* 저장은 계정 문서를 통째로 바꾸지 않는다. 마지막으로 서버에 반영된 캐릭터(accBase)와 지금 캐릭터를 견주어, 바뀐 칸만 PATCH 한다.
   레벨·경험치는 accounts/{계정}/prog 에도 같이 적어, 마을을 열 때와 출정에서 돌아올 때 읽는다. 본문과 prog 중 큰 경험치를 남긴다.
   보내기 전에 막히면 바뀐 칸만 mgr_pend_{계정} 에 남긴다. 캐릭터 전체 백업은 쓰지 않는다. */
const MY_SID=Math.random().toString(36).slice(2,10)+Date.now().toString(36);let saveDiag="",saveFix=false;let accSeen=null,lastPut=0;
let accBase=null,accReady=false,savePending=false;
const savePayload=jc=>{const p={c:C,ts:Date.now(),sid:MY_SID,prog:{lv:C.lv||1,ex:C.ex||0,xv:C.xv||2}};if(jc)p.jc=AUTH.jc;lastPut=p.ts;return p};
function accMark(sent){try{accBase=JSON.parse(JSON.stringify(sent||C))}catch(e){accBase=null}}
function diffFlat(a,b,path,out){if(a===b)return;const ao=a&&typeof a==="object",bo=b&&typeof b==="object";
 if(!ao||!bo||Array.isArray(a)||Array.isArray(b)){if(JSON.stringify(a)!==JSON.stringify(b))out[path]=b===undefined?null:b;return}
 const keys={};Object.keys(a).forEach(k=>{keys[k]=1});Object.keys(b).forEach(k=>{keys[k]=1});
 Object.keys(keys).forEach(k=>{const np=path+"/"+k;if(!Object.prototype.hasOwnProperty.call(b,k))out[np]=null;else diffFlat(a[k],b[k],np,out)})}
function accDiff(sent){const out={},b=accBase||{};diffFlat(b,sent,"c",out);
 if((Number(b.lv)||0)!==(Number(sent.lv)||0)||(Number(b.ex)||0)!==(Number(sent.ex)||0)||(Number(b.xv)||0)!==(Number(sent.xv)||0)){out["prog/lv"]=sent.lv||1;out["prog/ex"]=sent.ex||0;out["prog/xv"]=sent.xv||2}
 return out}
function clearPend(){if(!AUTH.uid)return;try{localStorage.removeItem("mgr_pend_"+AUTH.uid)}catch(e){}}
function applyPend(obj,fields){Object.keys(fields||{}).forEach(path=>{if(path.indexOf("c/")!==0)return;const parts=path.split("/").slice(1);let o=obj;for(let i=0;i<parts.length-1;i++){const k=parts[i];if(!o[k]||typeof o[k]!=="object")o[k]={};o=o[k]}const last=parts[parts.length-1];if(fields[path]==null)delete o[last];else o[last]=fields[path]})}
/* 기록을 합칠 때 잃어버리면 안 되는 것(사역마, 품고 있는 알, 칭호, 사역마 도감)은 양쪽을 합친다.
   예전에는 다른 창·기기의 기록이나 이 기기의 백업으로 바뀔 때, 그쪽에 없는 사역마가 통째로 사라졌다. 스스로 보낸 사역마(petGone)는 되살리지 않는다. */
function keepMerge(dst,src){if(!dst||!src||dst===src)return dst;try{
 const gone=Object.assign({},src.petGone||{},dst.petGone||{});dst.petGone=gone;
 const L=(Array.isArray(dst.pets)?dst.pets:[]).filter(q=>q&&!gone[q.id]);(Array.isArray(src.pets)?src.pets:[]).forEach(q=>{if(!q||gone[q.id])return;const i=L.findIndex(x=>x.id===q.id);if(i<0)L.push(q);else if((Number(q.xp)||0)>(Number(L[i].xp)||0))L[i]=Object.assign({},L[i],{xp:q.xp})});dst.pets=L;
 if(!dst.pet||!L.some(q=>q.id===dst.pet))dst.pet=(L.find(q=>q.id===src.pet)||L[0]||{}).id||null;
 if(!dst.egg&&src.egg&&!L.some(q=>(Number(q.born)||0)>=(Number(src.egg.t0)||0)))dst.egg=src.egg;
 dst.titles=Array.isArray(dst.titles)?dst.titles:[];(src.titles||[]).forEach(t=>{if(!dst.titles.includes(t))dst.titles.push(t)});
 dst.petSeen=Object.assign({},src.petSeen||{},dst.petSeen||{});
 dst.stats=dst.stats||{};const oc=Number(src.stats&&src.stats.chats)||0;if(oc>(Number(dst.stats.chats)||0))dst.stats.chats=oc;
 dst.dml=dst.dml||{};Object.keys(src.dml||{}).forEach(id=>{const t=Number(src.dml[id])||0;if(t>(Number(dst.dml[id])||0))dst.dml[id]=t})}catch(e){}return dst}
// 예전에는 다른 창의 계정 문서를 통째로 가져와 이 창의 레벨까지 덮어썼다. 이제는 바뀐 칸만 저장하고, 마을·귀환 때 본문과 prog 중 큰 경험치를 남긴다.
async function syncAdopt(){return false}
async function syncPeek(){return "same"}
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
function saveCloud(now){clearTimeout(sct);const go=async()=>{if(!AUTH.uid||!C||!DB){savePending=false;return}
 const sent=JSON.parse(JSON.stringify(C)),stamp=JSON.stringify(sent);
 const done=()=>{accBase=JSON.parse(stamp);accReady=true;if(JSON.stringify(C)!==stamp){savePending=true;saveCloud()}else{savePending=false;clearPend()}};
 if(!accReady||!accBase)return DB.doc("accounts/"+AUTH.uid).set(savePayload(AUTH.jc&&!AUTH.nojc)).then(()=>{accSeen=lastPut;saveWarn("");done()}).catch(async e=>{const c=String(e&&e.message||e);
  if((c==="401"||c==="403")&&await saveRescue()){saveWarn("");done();return}saveWarn(c);clearTimeout(sct);sct=setTimeout(go,15000)});
 const body=accDiff(sent);if(!Object.keys(body).length){done();return}body.ts=Date.now();body.sid=MY_SID;lastPut=body.ts;
 try{const slim={};Object.keys(body).forEach(k=>{if(k!=="ts"&&k!=="sid")slim[k]=body[k]});localStorage.setItem("mgr_pend_"+AUTH.uid,JSON.stringify(slim))}catch(e){}
 return DB.doc("accounts/"+AUTH.uid).patch(body).then(()=>{accSeen=lastPut;saveWarn("");done()}).catch(async e=>{const c=String(e&&e.message||e);
  if((c==="401"||c==="403")&&await saveRescue()){saveWarn("");done();return}saveWarn(c);clearTimeout(sct);sct=setTimeout(go,15000)})};if(now)return go();return new Promise(res=>{sct=setTimeout(()=>res(go()),600)})}
// 자연 회복 켜고 끄기: 꺼 둔 동안에는 절망도가 저절로 내려가지 않는다. 다시 켜면 그때부터 10분을 새로 센다(꺼 둔 시간은 소급되지 않는다).
function healToggle(){if(!C)return;C.healOff=!C.healOff;C.dzT=Date.now();save();toast(C.healOff?"절망도 자연 회복을 껐다.":"절망도 자연 회복을 켰다. 10분마다 다시 내려간다.");if(!$("#v-hub").hidden)hub()}
function natHeal(){if(!C)return;const now=Date.now();if(!C.dzT||C.fall||C.healOff){C.dzT=now;return}
 const n=Math.floor((now-C.dzT)/HEAL_MS);if(n>0){C.dzT+=n*HEAL_MS;const b0=C.dz||0;if(b0>0){C.dz=Math.max(0,b0-healAmt()*n);titleState();if(C.dz===0)C.stats.reachedZero=true;save();checkTitles();
  if(!$("#v-hub").hidden){$("#hc .hc-dz .bar i").style.width=C.dz+"%";$("#hc .hc-dz b").textContent=C.dz;const fb=$("#fbar");if(fb&&C.dz<90)fb.innerHTML=""}
  if(n>1)note("quest","쉬는 동안 마음이 가라앉았다. 절망도가 "+(b0-C.dz)+" 내려갔다.")}else save()}
 const h=$("#hcnext");if(h)h.textContent=healTxt()}
setInterval(natHeal,15000);
function boot(){natHeal();if(C){titleState();const day=new Date().toISOString().slice(0,10);if(C.stats.lastDay!==day){C.stats.loginDays=(C.stats.loginDays||1)+1;C.stats.lastDay=day;save()}checkTitles()}try{if(XON()&&typeof loadDoom==="function")loadDoom();else if(typeof drawDoom==="function")drawDoom()}catch(e){}let rf=0;if(C&&C.inv){const n=Number(C.inv[0]||0);if(n>0){rf=n;C.gd=(C.gd||0)+30*n;C.inv={};save()}}
 C?hub():(show("create"),rc());if(rf){const h=$("#hm");h.style.color="var(--mu)";h.textContent="상점에서 회복약이 사라져서 가지고 있던 "+rf+"개를 "+30*rf+"골드로 돌려받았다."}}
/* 새 버전 알림: 10분마다 게임 파일의 '바뀐 시각' 표시만(내용 없이) 확인해서, 운영자가 새 파일을 올렸으면 새로고침하라고 알려 준다.
   예전 파일을 켜 둔 채로 있으면 고친 오류가 그 사람에게는 그대로 남기 때문이다. */
let verTag=null,verShown=false;
async function verCheck(){if(verShown||location.protocol==="file:")return;try{const r=await fetch(location.pathname+location.search,{method:"HEAD",cache:"no-store"});const t=r.headers.get("etag")||r.headers.get("last-modified");if(!t)return;if(verTag==null){verTag=t;return}if(t!==verTag){verShown=true;verBanner()}}catch(e){}}
function verBanner(){const b=document.createElement("div");b.className="ver-bar";b.setAttribute("role","status");const t=document.createElement("span");t.textContent="게임이 새 버전으로 업데이트되었다. 새로고침해야 고친 내용이 적용된다.";const go=document.createElement("button");go.type="button";go.className="chip";go.textContent="새로고침";go.onclick=()=>{try{if(C)save()}catch(e){}setTimeout(()=>location.reload(),300)};b.append(t,go);document.body.appendChild(b)}
verCheck();setInterval(verCheck,600000);
setInterval(()=>{if(AUTH.uid&&C&&!document.hidden){guardPush();devClaim();giftPing();checkRaid()}},30000);
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
async function enterGame(){UID=AUTH.uid;AUTH.jc=AUTH.jc||lget("mgr_jc_"+UID)||AUTO_JC;
 /* 이 브라우저에 기억된 비밀 코드가 지금 코드와 다르면(예전 코드) 버린다. 틀린 코드를 계속 보내면 첫 저장이 영원히 막힌다. */
 if(AUTH.jc){let ok=false;try{ok=await codeOk(AUTH.jc)}catch(e){ok=true}if(!ok){AUTH.jc="";try{localStorage.removeItem("mgr_jc_"+UID)}catch(e){}}}DB=fbdb(FBU);LOCAL=false;let d=null;
 try{const s=await DB.doc("accounts/"+UID).get();d=s.exists?s.data():null;accSeen=d?Number(d.ts)||null:null}catch(e){const c=String(e.message||e);throw new Error("서버에서 계정 정보를 읽지 못했다. "+(c==="401"||c==="403"?"데이터베이스 규칙에서 읽기가 막혀 있다. 규칙을 게시했는지 확인해야 한다.":c==="404"?"데이터베이스를 찾지 못했다. 데이터베이스를 만들었는지, 주소가 맞는지 확인해야 한다.":"서버에 접속하지 못했다. 주소와 인터넷 연결을 확인해야 한다.")+" (오류: "+c+", 주소: "+FBU+")")}
 C=null;if(d&&d.c){C=d.c;accMark();accReady=true;
  // 서버 저장이 끝나기 전에 닫힌 바뀐 칸만 이어 붙인다. 캐릭터 전체를 백업으로 갈아끼우지 않는다.
  try{const raw=localStorage.getItem("mgr_pend_"+UID);if(raw){const f=JSON.parse(raw);if(f&&typeof f==="object"){applyPend(C,f);if(f["prog/ex"]!=null){C.ex=f["prog/ex"];C.lv=lvOf(C.ex);if(f["prog/xv"]!=null)C.xv=f["prog/xv"]}saveCloud(true)}}}catch(e){}}
 else{let bk=null;try{bk=JSON.parse(localStorage.getItem("mgr_bk_"+UID))}catch(e){}
  // 서버에 캐릭터가 없는데 이 브라우저에 이 계정의 백업이 있으면 그걸로 되살리고 서버에 다시 올린다.
  if(bk&&bk.n){C=bk;saveCloud(true)}else{let old=null;try{old=JSON.parse(localStorage.getItem("mgr"))}catch(e){}if(old&&old.n&&confirm("이 브라우저에 저장된 캐릭터 '"+old.n+"'을(를) 이 계정으로 가져올까?")){C=old;saveCloud(true)}}
  // 서버 기록도 백업도 없지만 예전에 캐릭터가 있었던 계정이면(players에 흔적이 남아 있으면) 바로 새로 만들지 않고 복구 방법을 고르게 한다.
  if(!C&&!RESTORE_FULL.some(r=>r[1]===UID)){let pp=null;try{pp=(await DB.doc("players/"+UID).get()).data()}catch(e){}if(pp&&pp.n){const r=await rescueAsk(pp);if(r==="out"){AUTH.uid=null;try{localStorage.removeItem("mgr_rt")}catch(e){}location.reload();return}if(r==="base"){C=rescueBuild(pp);saveCloud(true);setTimeout(()=>alertBox("기본 정보로 복구","이름·등급·레벨·속성·특성·마을·프로필·장착 무기·전투력을 되살렸다.\n골드·아이템·친구 목록·일부 칭호는 돌아오지 않았다.\n\n평소 쓰던 기기에 백업이 남아 있다면 운영자에게 알려 주자."),800)}}}}
 DB.collection("admins").onSnapshot(sn=>{const before=Object.keys(ADM).join();ADM=admFix({});sn.docs.forEach(d=>ADM[d.id]=true);admUI();if(before!==Object.keys(ADM).join()&&!$("#v-hub").hidden)hub()},e=>{},300000);
 try{await rstCheck(true)}catch(e){}
 const frx=fullRestore();
 if(frx)save();
 else pubRemember();
 mode(1);boot();checkFounder();setTimeout(checkComp,1500);
 if(frx){regPlayer(true);setTimeout(()=>alertBox("🎁 기록 복구","오류로 사라졌던 '"+C.n+"'의 기록을 백업으로 되돌렸습니다.\n레벨 "+C.lv+" · 칭호 "+C.titles.length+"개 · 무기와 마력 각인까지 모두 돌아왔어요.\n점검 보상과 복구 보상은 잠시 뒤 따로 도착합니다.\n불편을 드려 죄송합니다."),800)}}
async function codeOk(v){const t=String(v||"").trim().normalize("NFC");if(!t||!(window.crypto&&crypto.subtle))return false;const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")===SIGNUP_CODE_HASH}
/* 로그인 주소는 항상 아이디@magic-growth.local 이다. 연동한 이메일은 별도 기록이고, 계정 주소를 바꾸지 않는다.
   예전에 주소 자체가 바뀐 계정은 mail/{아이디} 에 적어 둔 이메일로 한 번 더 시도한 뒤, 들어오면 주소를 아이디용으로 되돌린다. */
const mailDummy=e=>typeof e==="string"&&e.toLowerCase().endsWith("@magic-growth.local");
const mailKey=em=>String(em||"").toLowerCase().replace(/\./g,",");
function mailOpt(v){const em=String(v||"").trim().toLowerCase();if(!em)return "";if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)||mailDummy(em))return null;return em}
function mailId(){const ok=s=>/^[A-Za-z0-9_]{3,20}$/.test(s)?String(s).toLowerCase():"";return ok(AUTH.name)||ok(lget("mgr_id"))}
async function signInName(id,pw){const dummy=EM(id);
 try{return await idt("signInWithPassword",{email:dummy,password:pw,returnSecureToken:true})}
 catch(e){const msg=String(e&&e.message||"");
  if(!/INVALID_LOGIN_CREDENTIALS|EMAIL_NOT_FOUND|INVALID_PASSWORD/.test(msg))throw e;
  let linked="";try{const base=String(FBU||"").replace(/\/+$/,"");if(base){const r=await fetch(base+"/mail/"+encodeURIComponent(id.toLowerCase())+".json");if(r.ok)linked=await r.json()}}catch(x){}
  if(typeof linked!=="string"||linked.indexOf("@")<0||linked===dummy)throw e;
  return idt("signInWithPassword",{email:linked,password:pw,returnSecureToken:true})}}
async function signInMail(em,pw){let id="";try{const base=String(FBU||"").replace(/\/+$/,"");if(base){const r=await fetch(base+"/elogin/"+encodeURIComponent(mailKey(em))+".json");if(r.ok)id=await r.json()}}catch(x){}
 if(typeof id==="string"&&/^[a-z0-9_]{3,20}$/.test(id)){try{return await idt("signInWithPassword",{email:EM(id),password:pw,returnSecureToken:true})}catch(e){const msg=String(e&&e.message||"");if(!/INVALID_LOGIN_CREDENTIALS|EMAIL_NOT_FOUND|INVALID_PASSWORD/.test(msg))throw e}}
 return idt("signInWithPassword",{email:em,password:pw,returnSecureToken:true})}
/* 연동 기록을 남기고, 계정 주소가 이메일로 바뀌어 있으면 아이디용 주소로 되돌린다. 기록부터 남긴다. */
async function mailSave(id,em){id=id.toLowerCase();em=em.toLowerCase();if(!DB&&FBU)DB=fbdb(FBU);if(!DB)throw new Error("서버에 연결되지 않아 이메일을 남기지 못했다.");
 let prev="";try{const s=await DB.doc("mail/"+id).get();if(s.exists&&typeof s.data()==="string")prev=s.data()}catch(x){}
 try{const j=await idt("update",{idToken:AUTH.tok,displayName:id,returnSecureToken:true});if(j.idToken){AUTH.tok=j.idToken;if(j.refreshToken){AUTH.rt=j.refreshToken;keep("mgr_rt",AUTH.rt)}}}catch(x){}
 await DB.doc("mail/"+id).set(em);await DB.doc("elogin/"+mailKey(em)).set(id);
 if(prev&&prev!==em){try{await DB.doc("elogin/"+mailKey(prev)).delete()}catch(x){}}
 const dummy=EM(id);if(AUTH.mail&&AUTH.mail!==dummy){try{const j=await idt("update",{idToken:AUTH.tok,email:dummy,returnSecureToken:true});if(j.idToken){AUTH.tok=j.idToken;if(j.refreshToken){AUTH.rt=j.refreshToken;keep("mgr_rt",AUTH.rt)}}AUTH.mail=dummy}catch(x){}}
 AUTH.name=id;keep("mgr_id",id)}
async function doLogin(){const id=$("#lid").value.trim(),pw=$("#lpw").value,m=$("#lm"),useMail=!signup&&lmailMode,emLogin=useMail?mailOpt($("#lmail").value):"",em=signup?mailOpt($("#lem-in")&&$("#lem-in").value):"";m.textContent="";
 if(useMail&&!emLogin)return m.textContent="연동한 이메일을 적어야 한다.";
 if(signup&&em===null)return m.textContent="받을 수 있는 이메일을 적거나, 비워 두자.";
 if(!useMail&&!/^[A-Za-z0-9_]{3,20}$/.test(id))return m.textContent="아이디는 영문, 숫자, 밑줄 3~20자로 적어야 한다.";
 if(pw.length<6)return m.textContent="비밀번호는 6자 이상이어야 한다.";
 const k=AUTH.key||$("#lkey").value.trim();if(!k)return m.textContent="Firebase 웹 API 키를 입력해야 한다.";AUTH.key=k;
 let jc=signup?AUTO_JC:"";// 가입 코드는 화면에서 묻지 않고 자동으로 보낸다(예전 서버 규칙이 첫 저장 때 확인). 비밀 코드 없이 누구나 계정을 만들 수 있다(예전 비밀 코드 확인은 뺐다).
 $("#lgo").disabled=true;
 try{const j=signup?await idt("signUp",{email:EM(id),password:pw,returnSecureToken:true}):useMail?await signInMail(emLogin,pw):await signInName(id,pw);
  const hinted=!useMail&&/^[A-Za-z0-9_]{3,20}$/.test(id)?id.toLowerCase():(/^[A-Za-z0-9_]{3,20}$/.test(j.displayName||"")?String(j.displayName).toLowerCase():mailId());
  AUTH.uid=j.localId;AUTH.tok=j.idToken;AUTH.rt=j.refreshToken;AUTH.mail=j.email||(useMail?emLogin:"");AUTH.name=hinted||(useMail?emLogin:id);if(jc){AUTH.jc=jc;keep("mgr_jc_"+j.localId,jc)}keep("mgr_key",k);keep("mgr_rt",AUTH.rt);if(hinted)keep("mgr_id",hinted);$("#lpw").value="";
  let noted="";if(signup&&hinted){try{await idt("update",{idToken:AUTH.tok,displayName:hinted,returnSecureToken:true})}catch(x){}}
  if(em&&hinted){try{await mailSave(hinted,em);noted=em+" 으로도 로그인할 수 있다. 아이디 로그인은 그대로다."}catch(err){noted="계정은 만들어졌다. 이메일 연동은 설정에서 다시 하자."}}
  else if(useMail&&hinted&&AUTH.mail&&!mailDummy(AUTH.mail)){try{await mailSave(hinted,emLogin);noted="아이디 로그인을 되돌려 두었다. 이제 아이디와 이메일 둘 다 쓸 수 있다."}catch(err){noted="이메일로는 들어왔다. 아이디 로그인 기록은 남기지 못했다. 설정에서 이메일 연동을 다시 하자."}}
  if($("#lem-in"))$("#lem-in").value="";
  await enterGame();if(noted)setTimeout(()=>alertBox("이메일 연동",noted),900)}catch(e){AUTH.uid=null;AUTH.tok=null;m.textContent=errMsg(e)}
 $("#lgo").disabled=false}
async function startAuth(){AUTH.key=lget("mgr_key")||FB_KEY;const rt=lget("mgr_rt");
 if(AUTH.key&&rt){AUTH.rt=rt;try{const j=await refresh();AUTH.uid=j.user_id;AUTH.name=lget("mgr_id");await enterGame();return}catch(e){AUTH.uid=null;AUTH.tok=null;showLogin();$("#lm").textContent=errMsg(e);return}}
 showLogin()}
let lmailMode=false;
function lmode(mail){if(!signup)lmailMode=!!mail;const a=$("#lmode-id"),b=$("#lmode-em");if(a)a.setAttribute("aria-pressed",!signup&&!lmailMode?"true":"false");if(b)b.setAttribute("aria-pressed",!signup&&lmailMode?"true":"false");
 $("#lmode").hidden=!!signup;$("#lid-box").hidden=!signup&&lmailMode;$("#lmail-box").hidden=!!signup||!lmailMode;$("#lem").hidden=!signup;
 $("#lhint").textContent=signup?"아이디로 계정을 만든다. 이메일은 선택이고, 적어도 아이디 로그인은 그대로다.":lmailMode?"연동해 둔 이메일과 비밀번호로 로그인한다. 아이디 로그인도 막히지 않는다.":"아이디와 비밀번호로 로그인하면 캐릭터가 계정에 저장되어 어느 기기에서든 이어서 할 수 있다."}
$("#lgo").onclick=doLogin;$("#lpw").onkeydown=e=>{if(e.key==="Enter"&&!e.isComposing)doLogin()};$("#lmail").onkeydown=e=>{if(e.key==="Enter"&&!e.isComposing)doLogin()};
$("#lmode-id").onclick=()=>lmode(false);$("#lmode-em").onclick=()=>lmode(true);
$("#lsw").onclick=()=>{signup=!signup;$("#lcd").hidden=true;$("#lcode").value="";$("#lt").textContent=signup?"계정 만들기":"로그인";$("#lgo").textContent=signup?"계정 만들기":"로그인";$("#lsw").textContent=signup?"이미 계정이 있다":"계정이 없다면 계정 만들기";$("#lm").textContent="";lmode(lmailMode)};
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
let curView="";
/* 같은 화면을 다시 그리는 동안 내용이 잠깐 비면(목록을 지우고 다시 채울 때) 휴대폰 브라우저가 화면을 위로 끌어올린다.
   잠깐 동안 화면 높이를 지금 높이로 붙잡아 두고, 위치가 바뀌었으면 원래대로 돌려놓는다. */
let keepT=null;function keepY(){const m=document.querySelector("main"),y=window.scrollY;if(!m||y<1)return;m.style.minHeight=m.offsetHeight+"px";clearTimeout(keepT);
 requestAnimationFrame(()=>{if(Math.abs(window.scrollY-y)>2)window.scrollTo(0,y)});keepT=setTimeout(()=>{m.style.minHeight=""},700)}
/* 화면 전환: 다른 화면으로 넘어갈 때만 맨 위로 올린다. 같은 화면을 다시 그릴 때(버튼을 눌러 결과가 바뀔 때)는 보던 위치를 그대로 둔다. */
/* 상단 메뉴: 채팅·마을·게시판·실전·기록은 누르면 하위 항목이 나오고, 나머지는 바로 그 화면으로 간다. */
const navGroup=id=>({chat:"chat",hub:"town",shop:"town",bag:"town",craft:"town",boss:"town",portal:"town",guard:"town",fac:"town",wave:"town",arena:"act",ord:"act",ntc:"board",board:"board",inbox:"record",titles:"record",roster:"record"})[id]||"";
function navSync(id,moved){const g=navGroup(id);
 document.querySelectorAll("#nav .nav-bar>button").forEach(b=>b.setAttribute("aria-pressed",(b.dataset.v===id||(b.dataset.g&&b.dataset.g===g))?"true":"false"));
 document.querySelectorAll("#nav .nav-sub button").forEach(b=>b.setAttribute("aria-pressed",(b.dataset.ct?id==="chat"&&b.dataset.ct===(typeof ct==="string"?ct:""):b.dataset.v===id)?"true":"false"));
 if(moved)document.querySelectorAll("#nav .nav-sub").forEach(s=>{if(s.dataset.for!==g)s.hidden=true;else if(g==="town"){if(id!=="hub")s.hidden=false}else if(g)s.hidden=false});
 document.querySelectorAll("#nav .nav-bar>button[data-g]").forEach(b=>{const s=document.querySelector('#nav .nav-sub[data-for="'+b.dataset.g+'"]');b.setAttribute("aria-expanded",s&&!s.hidden?"true":"false")});
 if(typeof updNav==="function"&&C)updNav()}
function show(id){const moved=curView!==id;curView=id;["login","create","hub","rooms","room","xm","portal","guard","fac","board","wave","ntc","arena","ord","trial","shop","chat","friends","bag","craft","titles","raid","boss","inbox","roster","world","setting"].forEach(v=>$("#v-"+v).hidden=v!==id);if(id!=="raid"&&typeof unRd==="function"){unRd();unRd=null}if(id!=="hub"&&typeof raidWatchStop==="function")raidWatchStop();if(id!=="boss"&&typeof unB==="function"){unB();unB=null}document.querySelector("main").classList.toggle("wide",id==="roster"||id==="boss"||id==="titles"||id==="fac"||id==="board"||id==="ntc");document.querySelector("main").classList.toggle("hubw",id==="hub");document.querySelector("main").classList.toggle("xwide",id==="shop");if(id!=="hub"&&unH){unH();unH=null}if(id!=="chat"){if(typeof unC==="function"){unC();unC=null}if(typeof unP==="function"){unP();unP=null}}if(id!=="board"&&typeof bdStop==="function")bdStop();$("#nav").hidden=!(C&&(id==="hub"||id==="boss"||id==="portal"||id==="guard"||id==="fac"||id==="board"||id==="wave"||id==="ntc"||id==="arena"||id==="ord"||id==="inbox"||id==="roster"||id==="shop"||id==="chat"||id==="friends"||id==="bag"||id==="craft"||id==="titles"||id==="world"||id==="setting"));navSync(id,moved);if(moved)window.scrollTo(0,0);else keepY()}
const titleById=id=>TITLE_LIST.find(t=>t[0]===id);
// 칭호 이름: 칭호 번호(id)로 찾고, 없으면 서버에 같이 저장된 이름(tn)을 쓴다.
const tiName=(id,fb)=>{const t=id&&titleById(id);return t?t[1]:typeof fb==="string"?fb.slice(0,20):""};
function titleState(){if(!C)return;C.titles=Array.isArray(C.titles)?C.titles:[];C.stats=C.stats||{};C.stats.upgrades=C.stats.upgrades||0;C.stats.purchases=C.stats.purchases||0;C.stats.gifts=C.stats.gifts||0;C.stats.resonances=C.stats.resonances||0;C.stats.trialWins=C.stats.trialWins||0;C.stats.maxDespair=Math.max(C.stats.maxDespair||0,C.dz||0);C.stats.maxGold=Math.max(C.stats.maxGold||0,C.gd||0);C.stats.loginDays=C.stats.loginDays||1;C.stats.lastDay=C.stats.lastDay||new Date().toISOString().slice(0,10);C.stats.reachedZero=!!C.stats.reachedZero;C.ti=C.ti||"";}
function checkTitles(){if(!C)return[];titleState();const fresh=[];TITLE_LIST.forEach(t=>{if(!C.titles.includes(t[0])){let ok=false;try{ok=!!t[3](C)}catch(e){}if(ok){C.titles.push(t[0]);fresh.push(t[0])}}});if(fresh.length){note("title","새 칭호를 얻었다: "+fresh.map(id=>titleById(id)[1]).join(", "));const sx=fresh.map(titleById).filter(t=>t&&t[4]==="secret");if(sx.length&&typeof alertBox==="function")setTimeout(()=>{alertBox("✧ 히든 칭호 발견","숨겨져 있던 칭호를 찾아냈다!\n\n"+sx.map(t=>"「"+t[1]+"」\n"+t[2]).join("\n\n")+"\n\n칭호 보관함에서 장착할 수 있다.");try{ding()}catch(e){}},300);save()}return fresh.map(titleById).filter(Boolean)}
function titles(msg){show("titles");setRec("ttl");titleState();const fresh=checkTitles();const cur=titleById(C.ti);const cc=$("#title-current");cc.innerHTML="";const h=document.createElement("h2");h.textContent="현재 장착한 칭호";const p=document.createElement("p");p.className="hint";p.textContent=cur?"✦ "+cur[1]+" — "+cur[2]:"아직 장착한 칭호가 없다.";cc.append(h,p);const clear=document.createElement("button");clear.type="button";clear.className="btn g";clear.textContent="칭호 해제";clear.onclick=()=>{C.ti="";save();titles("칭호를 해제했다.")};cc.appendChild(clear);clear.disabled=!C.ti;
 const earned=$("#title-earned"),locked=$("#title-locked");earned.innerHTML="";locked.innerHTML="";TITLE_LIST.forEach((t,i)=>{const got=C.titles.includes(t[0]),w=document.createElement("div");w.className="chip title-card";const copy=document.createElement("div");copy.className="title-copy";const name=document.createElement("strong"),desc=document.createElement("small");const sc=t[4]==="secret";if(sc)w.classList.add("secret-ttl");name.textContent=got?(sc?"✧ ":"✦ ")+t[1]+(sc?" (히든)":""):sc?"🔒 ??? (히든 칭호)":"🔒 "+t[1];desc.textContent=got||!sc?t[2]:"힌트: "+t[5];copy.append(name,desc);w.appendChild(copy);if(got){const b=document.createElement("button");b.type="button";b.className="chip";b.textContent=C.ti===t[0]?"장착 중":"장착";b.disabled=C.ti===t[0];b.onclick=()=>{C.ti=t[0];save();titles("'"+t[1]+"' 칭호를 장착했다.")};w.appendChild(b);earned.appendChild(w)}else if(!t[4]||t[4]==="secret")locked.appendChild(w)});const secN=TITLE_LIST.filter(t=>t[4]==="secret"),secGot=secN.filter(t=>C.titles.includes(t[0])).length;$("#title-msg").textContent=msg||(fresh.length?"새 칭호 획득: "+fresh.map(t=>t[1]).join(", "):"획득한 칭호 "+C.titles.length+" / "+TITLE_LIST.length+" · 히든 칭호 "+secGot+" / "+secN.length);regPlayer()}
function titleProgress(){if(!C)return;titleState();C.stats.maxDespair=Math.max(C.stats.maxDespair||0,C.dz||0);C.stats.maxGold=Math.max(C.stats.maxGold||0,C.gd||0);checkTitles()}

/* 사진 줄이기: 한 번에 확 줄이면 깨지고 뭉개지므로 절반씩 여러 번 부드럽게 줄인다. */
function sq(im,Z,q){const s0=Math.min(im.width,im.height);let c=document.createElement("canvas"),w=s0;c.width=c.height=w;let x=c.getContext("2d");x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";x.drawImage(im,(im.width-s0)/2,(im.height-s0)/2,s0,s0,0,0,w,w);
 while(w/2>=Z){const n=document.createElement("canvas"),h=Math.floor(w/2);n.width=n.height=h;const y=n.getContext("2d");y.imageSmoothingEnabled=true;y.imageSmoothingQuality="high";y.drawImage(c,0,0,w,w,0,0,h,h);c=n;w=h}
 if(w!==Z){const n=document.createElement("canvas");n.width=n.height=Z;const y=n.getContext("2d");y.imageSmoothingEnabled=true;y.imageSmoothingQuality="high";y.drawImage(c,0,0,w,w,0,0,Z,Z);c=n}return c.toDataURL("image/jpeg",q)}
const HIRES={};
function pick(f,cb){if(!f)return;const u=URL.createObjectURL(f),im=new Image();im.onload=()=>{const m=Math.min(im.width,im.height),Z=Math.min(AV_BIG,Math.max(160,m));const d=sq(im,Z,.9);
 if(m>AV_BIG)HIRES[d]=sq(im,Math.min(PIC_PX,m),.92);URL.revokeObjectURL(u);cb(d)};im.onerror=()=>URL.revokeObjectURL(u);im.src=u}
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
 alertBox("🗺 "+L[1]+" · "+(done?(ok?"성공":"실패"):"철수"),head+"\n\n"+evs.map(e=>"· "+e).join("\n")+"\n\n"+rw);hubLH();if(typeof readProg==="function")readProg()}
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

/* 프로필과 공명: 친구의 프로필에서 '공명하기'로 공명을 청하고, 친구가 받아들이면 둘 다 절망도가 내려간다. 같은 상대에게는 3시간에 한 번이다. */
let pfU=null;
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
/* 공개 카드는 사진과 통째로 다시 쓰지 않는다. 이번 접속에서 바뀐 칸만 고친다.
   절망도는 10분마다 실제로 내려갔을 때 dz 만, 출정·기여·타락처럼 값이 바뀔 때는 그 칸만 고친다.
   사진·이름·설정은 프로필을 저장할 때(regPlayer(true))만 올린다. */
let pubLast=null;
const pubCopy=o=>JSON.parse(JSON.stringify(o));
function pubCard(){const weapon=Number.isInteger(C.wp)&&C.wp>=0&&typeof WP!=="undefined"&&WP[C.wp]?WP[C.wp][0]+(wlv(C.wp)?" +"+wlv(C.wp):""):"없음";
 const q=typeof petCur==="function"?petCur():null;
 return{n:C.n,s:C.s||"",g:C.g,t:C.t||"",td:(typeof TD!=="undefined"&&TD[C.t])||"",a:(C.a||[]).join(" · "),v:C.v,lv:C.lv||1,cl:C.cl||0,ex:C.ex||0,dz:C.dz||0,wp:weapon,pw:typeof pw==="function"?pw():0,ti:C.ti||"",tn:tiName(C.ti),rv:Number(C.rsv)||0,fc:C.fc||{},wf:Number(C.wf)||0,pet:q?{s:q.sp,n:q.nm,l:petLv(q)}:null,hf:C.healOff?1:0,du:{w:(C.stats&&C.stats.duW)||0,l:(C.stats&&C.stats.duL)||0},ev:C.dev&&C.dev.id===DEV.id?{id:DEV.id,pt:C.dev.pt||0,w:C.dev.w||0,n:C.dev.n||0,t:C.dev.t||0}:null,db:(C.du&&!C.du.fin)?(C.du.t0||Date.now()):0,dr:C.dr||null,pf:C.pf||{},fl:C.fall?1:0}}
function pubRemember(){if(!C)return;pubLast=pubCopy(pubCard())}
function pubSync(){if(!DB||!C||!pubLast)return;const body=pubCard(),patch={};
 Object.keys(body).forEach(k=>{const a=JSON.stringify(body[k]);if(a!==JSON.stringify(pubLast[k]))patch[k]=JSON.parse(a)});
 if(!Object.keys(patch).length)return;
 if(patch.dz!=null||patch.hf!=null){patch.dz=body.dz;patch.ts=Date.now()}
 const prev=pubLast,next=pubCopy(Object.assign({},pubLast,patch));pubLast=next;
 DB.doc("players/"+UID).patch(patch).catch(()=>{if(pubLast===next)pubLast=prev});whoPut()}
/* 사진 없는 명부. 목록·접속·보스는 이 칸만 읽고, 프로필 사진은 players/{나}/im 만 따로 받는다. */
function whoBody(){const b=pubCard(),o={n:String(b.n||"").slice(0,20),g:String(b.g||"").slice(0,2),a:String(b.a||"").slice(0,40),v:VL[b.v]?b.v:"",lv:Math.max(1,Number(b.lv)||1),pw:Math.max(0,Number(b.pw)||0),on:onlineStamp(),ti:String(b.ti||"").slice(0,40),tn:String(b.tn||"").slice(0,40),du:b.du||{w:0,l:0},db:Math.max(0,Number(b.db)||0),fl:b.fl?1:0,rv:Math.max(0,Number(b.rv)||0),dz:Math.max(0,Number(b.dz)||0)};if(b.ev)o.ev=b.ev;return o}
function whoPut(){if(!DB||!C||!UID)return;const b=whoBody();if(!b.n)return;DB.doc("who/"+UID).set(b).catch(()=>{})}
function regPlayer(pic){if(!DB||!C)return;if(!pic){pubSync();return}try{pubPic()}catch(e){}thumb(C.img,im=>{try{const body=pubCard();body.im=im||"";body.ts=Date.now();const prev=pubLast,next=pubCopy(body);pubLast=next;DB.doc("players/"+UID).patch(body).catch(()=>{if(pubLast===next)pubLast=prev});whoPut()}catch(e){}})}
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
$("#pfc").onclick=()=>{$("#pfo").hidden=true;pfU=null};
$("#pfo").onclick=e=>{if(e.target===$("#pfo"))$("#pfc").click()};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#pfo").hidden)$("#pfc").click()});

function updNav(){const cb=document.querySelector("#nav [data-g=chat]");if(cb&&C){const k=Object.keys(C.dmu||{}).length,chatOpen=document.querySelector('#nav .nav-sub[data-for="chat"]'),folded=!chatOpen||chatOpen.hidden;cb.textContent=k&&folded?"채팅 ("+k+")":"채팅";const dm=document.querySelector("#nav [data-ct=d]");if(dm)dm.textContent=k&&!folded?"1:1 채팅 ("+k+")":"1:1 채팅";document.title=(k?"("+k+") ":"")+"魔法 成長記錄"}
 const b=document.querySelector("#nav [data-v=friends]");if(b){const n=Object.keys((C&&C.fq)||{}).length+Object.keys((C&&C.rqIn)||{}).length;b.textContent=n?"친구 ("+n+")":"친구"}
 const dub=document.querySelector("#nav [data-v=arena]");if(dub&&C){const n=(typeof DUI!=="undefined"?DUI.length:0),on=C.du&&!C.du.fin;dub.textContent=on?"대련 ⚔":n?"대련 ("+n+")":"대련";const act=document.querySelector("#nav [data-g=act]"),actOpen=document.querySelector('#nav .nav-sub[data-for="act"]');if(act)act.textContent=(on||n)&&actOpen&&actOpen.hidden?(on?"실전 ⚔":"실전 ("+n+")"):"실전"}
 const bgb=document.querySelector("#nav [data-v=bag]");if(bgb&&C){const n=Array.isArray(C.rg)?C.rg.length:0;bgb.textContent=n?"마법·가방 ("+n+")":"마법·가방"}
 const h=document.querySelector("#nav [data-v=hub]");if(h&&C){let k=dqReady();try{k+=facReady()}catch(e){}h.textContent=k?"마을 ("+k+")":"마을"}
 {const nb2=document.querySelector("#nav [data-v=ntc]");if(nb2&&C){let k=0;try{k=NTC.filter(n=>Number(n.ts)>(C.ntcSeen||0)).length}catch(e){}nb2.textContent=k?"공지 ("+k+")":"공지"}}
 const ib=document.querySelector("#nav [data-v=inbox]");if(ib&&C){const k=(C.nt||[]).filter(n=>!n.r).length;ib.textContent=k?"알림 ("+(k>9?"9+":k)+")":"알림";
  const rp=document.querySelector("#nav [data-g=record]");const recOpen=document.querySelector('#nav .nav-sub[data-for="record"]');if(rp)rp.textContent=k&&recOpen&&recOpen.hidden?"기록 ("+(k>9?"9+":k)+")":"기록"}
 {const nbP=document.querySelector("#nav [data-g=board]");const bdOpen=document.querySelector('#nav .nav-sub[data-for="board"]');const nk=(()=>{try{return NTC.filter(n=>Number(n.ts)>(C.ntcSeen||0)).length}catch(e){return 0}})();if(nbP)nbP.textContent=nk&&bdOpen&&bdOpen.hidden?"게시판 ("+nk+")":"게시판"}
 {const townP=document.querySelector("#nav [data-g=town]"),townOpen=document.querySelector('#nav .nav-sub[data-for="town"]');if(townP&&h&&bgb){const folded=!townOpen||townOpen.hidden,hm=(h.textContent.match(/\((\d+)\)$/)||[])[1],bm=(bgb.textContent.match(/\((\d+)\)$/)||[])[1],sum=(Number(hm)||0)+(Number(bm)||0);townP.textContent=folded&&sum?"마을 ("+sum+")":"마을"}}
 // "이름 (3)" 꼴의 숫자는 작은 배지로 바꿔서, 숫자가 생겨도 탭 글자가 잘리지 않게 한다.
 document.querySelectorAll("#nav button").forEach(b=>{const m=b.textContent.match(/^(.*) \((\d+\+?)\)$/);if(m){b.textContent=m[1];b.appendChild(elT("span","nav-n",m[2]))}});if(typeof vcMark==="function")vcMark()}
const charmToday=()=>C.daily&&C.daily.d===today()?C.daily.charm||0:0;
const armed=id=>!!(C.arm&&C.arm[id]&&((C.inv||{})[id]||0)>0);
// 준비해 둔 소모품을 1개 쓴다. 실제로 썼으면 true.
const useItem=id=>{C.arm=C.arm||{};C.inv=C.inv||{};const ok=armed(id);if(ok)C.inv[id]--;delete C.arm[id];return ok};
function bag(msg){const fresh=$("#v-bag").hidden;C.inv=C.inv||{};C.wps=C.wps||[];C.wl=C.wl||{};show("bag");drawRunes();drawPets();drawRetrait();drawRG();drawSkills();const bm=$("#bgm");bm.style.color="var(--mu)";bm.textContent=msg||"";if(fresh)applyGift();
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
 bagWeapons(rowEl);
 if(!C.wps.length&&!own.length)bm.textContent=msg||""}
// 이 친구에게 쓸 수 있는 빈 칸 번호와, 다 찼다면 가장 빨리 비는 시각
function giftSlot(u){C.gsl=C.gsl||{};const a=C.gsl[u]||[],now=Date.now();let best=-1,soon=Infinity;
 for(let i=0;i<GIFT_DAY;i++){const t=a[i]||0;if(now-t>DAY_MS+60000){best=i;break}soon=Math.min(soon,t+DAY_MS+60000)}
 return{i:best,left:[...Array(GIFT_DAY).keys()].filter(i=>now-(a[i]||0)>DAY_MS+60000).length,soon}}
// 받은 선물함: 앉아 있는 동안에는 giftn/{나}의 마지막 시각만 본다. 칸 전체는 마을에 들어올 때, 가방을 열 때, 그 시각이 새로워졌을 때 한 번만 받는다.
let giftBell=0,giftBusy=false,giftAgain=false;
async function giftPing(){if(!AUTH.uid||!C||!DB)return;let ts=0;
 try{const s=await DB.doc("giftn/"+UID).get();const p=s.exists?s.data():null;ts=p&&typeof p.ts==="number"?p.ts:0}catch(e){return}
 if(!ts||ts<=giftBell)return;giftBell=ts;applyGift()}
async function applyGift(){if(!AUTH.uid||!C||!DB)return;if(giftBusy){giftAgain=true;return}giftBusy=true;
 try{do{giftAgain=false;try{const s=await once(DB.collection("gift/"+UID));if(!C)return;C.gs=C.gs||{};const rs=[],items=[];
  s.docs.forEach(d=>{const f=d.id,v=d.data();if(!v||typeof v!=="object")return;
   if(v.g!=null&&v.ts!=null)items.push([f,f,v]);// 예전 방식(친구마다 한 칸)
   Object.keys(v).filter(k=>/^[0-3]$/.test(k)).forEach(k=>{if(v[k]&&typeof v[k]==="object")items.push([f,f+"_"+k,v[k]])})});
  items.filter(([f,key,v])=>GV[v.g]!=null&&typeof v.ts==="number"&&v.ts>(C.gs[key]||0)).sort((a,b)=>a[2].ts-b[2].ts).forEach(([f,key,v])=>{C.gs[key]=v.ts;
   // 받은 선물은 바로 쓰이지 않고 '받은 선물함'에 보관된다. 가방에서 원할 때 꺼내 쓴다.
   C.rg=Array.isArray(C.rg)?C.rg:[];C.rg.push({g:v.g,n:String(v.n||"누군가").slice(0,20),u:f,ts:v.ts});if(C.rg.length>RG_MAX)C.rg=C.rg.slice(-RG_MAX);
   rs.push(String(v.n||"누군가")+"님이 "+ITM.find(x=>x[0]===v.g)[1]+"을(를) 보냈다");note("gift",String(v.n||"누군가")+"님이 "+ITM.find(x=>x[0]===v.g)[1]+"을(를) 선물했다. 가방의 받은 선물함에 넣어 두었다.",f)});
  if(!rs.length)continue;save();updNav();toast("🎁 "+rs.join(" / ")+" · 가방에 보관했다");
  if(!$("#v-bag").hidden)drawRG();if(!$("#v-hub").hidden){const h=$("#hm");if(h){h.style.color="var(--mu)";h.textContent=rs.join(" / ")+" (가방의 받은 선물함에 보관)"}}}catch(e){}}while(giftAgain)}finally{giftBusy=false}}
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
  try{await DB.doc("gift/"+u+"/"+UID+"/"+g.i).set({g:sel,ts:{".sv":"timestamp"},n:nmOf()});try{await DB.doc("giftn/"+u).set({u:UID,g:sel,n:nmOf(),ts:{".sv":"timestamp"}})}catch(e){}C.gsl=C.gsl||{};(C.gsl[u]=C.gsl[u]||[])[g.i]=Date.now();
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
 C.n=n;if(pend)C.img=pend;C.pf={};PF.forEach(([k])=>C.pf[k]=$("#pf-"+k).value.trim().slice(0,300));pend=null;save();regPlayer(true);$("#pfedit").hidden=true;hub();const h=$("#hm");h.style.color="var(--mu)";h.textContent="프로필을 저장했다."};

let unH=null;

$("#nav").onclick=e=>{
   const b=e.target.closest&&e.target.closest("button");
   if(!b||!b.closest("#nav"))return;
   const g=b.dataset.g,v=b.dataset.v;
   
 if(g&&b.parentElement.classList.contains("nav-bar")) {
   const sub=document.querySelector('#nav .nav-sub[data-for="'+g+'"]');
   const open=sub&&!sub.hidden;
   const here=navGroup(curView)===g;

  if(open&&here&&(!v||curView===v)){sub.hidden=true;b.setAttribute("aria-expanded","false");updNav();return}
  document.querySelectorAll("#nav .nav-sub").forEach(s=>{s.hidden=s!==sub});
  document.querySelectorAll("#nav .nav-bar>button[data-g]").forEach(p=>p.setAttribute("aria-expanded",p===b?"true":"false"));
  if(g==="town"){if(!here)hub();else updNav();return}
  if(g==="act"){if(!here)arena();else updNav();return}
  if(g==="board"){if(curView!=="board"&&curView!=="ntc")board(null);else updNav();return}
  if(g==="record"){if(curView!=="titles"&&curView!=="inbox"&&curView!=="roster")(recTab==="ttl"?titles():dex());else updNav();return}
  if(g==="chat"){if(curView!=="chat"){ct="g";chat()}else updNav();return}
  return}
 if(b.dataset.ct){const t=b.dataset.ct;if(curView==="chat"&&ct===t&&!(t==="d"&&peer))return;ct=t;chat();return}
 if(v==="hub")hub();
 if(v==="shop")shop();
 if(v==="friends")friends();
 if(v==="board")board(null);
 if(v==="ntc")ntcView();
 if(v==="arena")arena();
 if(v==="ord")ord();
 if(v==="bag")bag();
 if(v==="craft")craft();
 if(v==="titles")(recTab==="ttl"?titles():dex());
 if(v==="inbox")inbox();
 if(v==="roster")roster();
 if(v==="world"&&typeof worldView==="function")worldView();
 if(v==="setting"){show("setting");
   drawSetting()
}};

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

$("#tut-re").onclick=()=>{C.tut=C.tut||{got:{}};C.tut.hide=0;C.tut.fold=0;save();hub()};
function alertBox(t,x){$("#alt").textContent=t;$("#alx").textContent=x;$("#alo").hidden=false;$("#alc").focus({preventScroll:true})}
$("#alc").onclick=()=>{$("#alo").hidden=true};
setInterval(()=>{if(C&&!$("#v-hub").hidden){hubGuard();hubBoss()}},30000);
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
let ONL=[],onAt=0,onOnce=false;
const isOn=p=>!!p&&Number(p.on)>Date.now()-ON_WIN;
function onlineStamp(){if(!onAt)onAt=Date.now();return onAt}
/* 게임 화면이 처음 열릴 때 내 접속 시각만 한 번 남긴다. 접속 인원 목록은 받지 않는다. */
function onlineOnce(){if(onOnce||!AUTH.uid||!C||!DB||LOCAL||!XON())return;onOnce=true;DB.doc("players/"+UID+"/on").set(onlineStamp()).catch(()=>{});whoPut()}

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
/* 화면 모드: 블랙(기본)과 화이트 중에서 고른다. 고른 값은 이 기기에 기억한다. */
function thmSet(t){const r=document.documentElement;if(t==="light")r.dataset.theme="light";else delete r.dataset.theme;try{localStorage.setItem("mgr_theme",t)}catch(e){}thmDraw()}
function thmDraw(){const lt=document.documentElement.dataset.theme==="light";const m=document.querySelector('meta[name="theme-color"]');if(m)m.content=lt?"#f4efe6":"#0c0a14"}
thmDraw();
