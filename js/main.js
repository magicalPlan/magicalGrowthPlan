
// 이벤트 조건 판단용: 파티의 속성, 특성, 인원, 절망도
const evCtx=r=>{const ps=Object.values(r.pl||{});return{ps,n:ps.length,at:a=>ps.some(p=>String(p.a||"").includes(a)),tr:t=>ps.some(p=>p.t===t),hiDz:ps.some(p=>(Number(p.dz)||0)>=70)}};
// 메아리 이벤트: 파티에 없는 내 친구 이름 하나
const echoName=r=>{const ids=Object.keys((C&&C.fr)||{}).filter(u=>!r.pl[u]&&C.fr[u]);return ids.length?esc(String(C.fr[ids[R(ids.length)]]).slice(0,20)):"이름 모를 마법소녀"};
const EVM={};EV.concat(SOLO_EV,...Object.values(VEV)).forEach(x=>EVM[x.id]=x);
let C=null,DB=null,UID="나",LOCAL=false;
try{C=JSON.parse(localStorage.getItem("mgr"))}catch(e){}
// 로그인 중이면 서버에 바뀐 칸만 올린다. 캐릭터 전체를 이 브라우저에 다시 쓰지 않는다.
// 혼자 하기만 이 브라우저의 mgr 에 캐릭터를 남긴다.
const save=()=>{try{updNav()}catch(e){}if(AUTH.uid){savePending=true;try{pubSync()}catch(e){}try{if(C&&accBase){const body=accDiff(C);if(body&&Object.keys(body).length)pendWrite(body)}}catch(e){}saveCloud();return}try{localStorage.setItem("mgr",JSON.stringify(C))}catch(e){}};
/* 출발·정산처럼 덮어쓰기·유실이 아쉬운 변경은 600ms 대기 없이 바로 올린다. */
const saveNow=()=>{try{updNav()}catch(e){}if(AUTH.uid){savePending=true;try{pubSync()}catch(e){}try{if(C&&accBase){const body=accDiff(C);if(body&&Object.keys(body).length)pendWrite(body)}}catch(e){}return saveCloud(true)}try{localStorage.setItem("mgr",JSON.stringify(C))}catch(e){}return Promise.resolve(true)};
/* 서버 PATCH(또는 전체 set)가 끝날 때까지 기다린다. 성공 true, 실패·미로그인 로컬만이면 로컬은 true. */
async function saveNowOk(){if(!AUTH.uid||!DB){await saveNow();return true}const r=await saveNow();return r===true}
/* 잠깐 실패해도 몇 번 다시 올린다. 장기 토벌처럼 알림을 저장 성공 뒤에 두려면 이걸 쓴다. */
async function saveNowRetry(n,gap){n=n||4;gap=gap||2500;for(let i=0;i<n;i++){if(await saveNowOk())return true;if(i<n-1)await new Promise(r=>setTimeout(r,gap*(i+1)))}return false}
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
  if(cur.pf&&!b.pf)b.pf=cur.pf;if(Array.isArray(cur.rel)&&!Array.isArray(b.rel))b.rel=cur.rel}
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
  if(Array.isArray(o8.a)&&o8.a.length&&o8.a.every(z=>AT.some(t=>t[0]===z))&&o8.a.join()!==(C.a||[]).join()){C.a=o8.a.slice();try{if(typeof dexSkOwn==="function")dexSkOwn()}catch(e){}ex8.push("속성 "+C.a.join("·"))}
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
let ADM={},signup=false,sct=null;
// 운영자는 서버의 admins 칸에 있는 계정이다. 이름이나 코드에 적힌 계정으로는 판단하지 않는다.
// 로그인 때 한 번만 읽는다. 목록은 거의 안 바뀌고, 바뀌면 새로고침으로 충분해서 live 연결은 두지 않는다.
function admApply(data){const before=Object.keys(ADM).sort().join(),next={};
 if(data&&typeof data==="object")Object.keys(data).forEach(u=>{if(u&&data[u]!=null)next[u]=true});
 ADM=next;if(typeof admUI==="function")admUI();if(before!==Object.keys(ADM).sort().join()&&typeof $==="function"&&$("#v-hub")&&!$("#v-hub").hidden&&typeof hub==="function")hub()}
/* 서버 저장. 실패하면 조용히 넘어가지 않고 화면 위에 경고를 띄운다(저장이 다시 되면 사라진다). */
let saveErr="";
/* 저장이 거절된 이유. 상태 코드, 서버가 돌려준 문장, 다시 시도한 결과(saveDiag)를 나눠 안내 문구를 고른다. */
function saveCause(c){const raw=String(c||""),msg=String(lastSaveErr&&lastSaveErr.msg||"").replace(/\s+/g," ").trim(),kb=Number(lastSaveErr&&lastSaveErr.kb)||0,diag=String(saveDiag||"");
 const tp=tokProj(),dp=(String(FBU||"").match(/^https:\/\/([^.]+?)(-default-rtdb)?\./)||[])[1]||"";
 if(tp&&dp&&tp!==dp)return {id:"project",tp,dp};
 if(raw==="timeout"||/abort/i.test(raw))return {id:"timeout"};
 if(raw==="offline"||/failed to fetch|networkerror|load failed|offline/i.test(raw))return {id:"offline"};
 if(raw==="404")return {id:"gone"};
 if(raw==="400")return {id:"format",msg,kb};
 if(raw==="413")return {id:"size",kb};
 if(raw==="412")return {id:"clash"};
 if(raw==="401"||raw==="403"){
  if(/갱신 실패/.test(diag)||/expired|TOKEN_EXPIRED|credential is no longer valid/i.test(msg))return {id:"login"};
  if(/작은 저장 성공/.test(diag))return {id:"body",kb:kb||Number((diag.match(/(\d+)KB/)||[])[1])||0,msg};
  if(/쓰기 권한/.test(diag))return {id:"rule"};
  if(!AUTH.jc)return {id:"code"};
  return {id:"denied",code:raw,msg}}
 if(/^\d{3}$/.test(raw))return {id:"http",code:raw,msg};
 return {id:"unknown",code:raw,msg}}
function saveWarn(c){const m=$("#mode");if(!m)return;let w=$("#savewarn");
 if(!c){if(w)w.remove();saveErr="";lastSaveErr=null;return}
 const why=saveCause(c),key=why.id+"|"+(why.code||"")+"|"+(why.kb||"")+"|"+String(why.msg||"").slice(0,80);
 if(saveErr===key&&w)return;saveErr=key;if(!w){w=elT("div","fallbar");w.id="savewarn";w.style.cssText="margin:6px 0 0;text-align:left";m.after(w)}
 w.innerHTML="";
 const title=elT("b",""),body=elT("span","");
 const say=(h,t)=>{title.textContent="⚠ "+h;body.textContent=t};
 if(why.id==="project")say("로그인 키와 데이터베이스가 서로 다른 프로젝트다.","웹 API 키는 '"+why.tp+"' 프로젝트이고, 데이터베이스는 '"+why.dp+"' 프로젝트다. 둘을 같은 프로젝트로 맞춘 뒤 다시 저장해야 한다.");
 else if(why.id==="timeout")say("서버 응답이 늦어 캐릭터를 아직 저장하지 못했다.","잠시 뒤에 자동으로 다시 시도한다. 그때까지 바뀐 내용은 이 브라우저에 남아 있다.");
 else if(why.id==="offline")say("네트워크에 연결되지 않아 캐릭터를 저장하지 못했다.","연결되면 자동으로 다시 저장한다. 그때까지 바뀐 내용은 이 브라우저에 남아 있다.");
 else if(why.id==="gone")say("데이터베이스 주소를 찾지 못해 캐릭터를 저장하지 못했다.","서버 주소가 맞는지 확인해야 한다.");
 else if(why.id==="format")say("서버가 캐릭터 기록의 형식을 거절했다.",(why.msg?"서버가 알린 이유: "+why.msg.slice(0,140)+". ":"")+(why.kb?why.kb+"KB. ":"")+"이름이나 설정에 서버가 받지 않는 문자가 있을 수 있다.");
 else if(why.id==="size")say("캐릭터 기록이 너무 커서 서버가 거절했다.",(why.kb?why.kb+"KB. ":"")+"프로필 사진을 줄인 뒤 다시 저장해 보자.");
 else if(why.id==="clash")say("다른 저장과 겹쳐 이번 저장이 거절되었다.","잠시 뒤에 자동으로 다시 시도한다.");
 else if(why.id==="login")say("로그인이 만료되어 캐릭터를 저장하지 못했다.","다시 로그인해야 서버에 남는다. 바뀐 내용은 이 브라우저에 남아 있다.");
 else if(why.id==="body")say("서버 규칙이 이 캐릭터 기록을 거절했다.","로그인은 정상이다. 기록"+(why.kb?" "+why.kb+"KB":"")+"가 규칙에 맞지 않는다. 운영자에게 이 화면을 보여 주자."+(why.msg?" ("+why.msg.slice(0,120)+")":""));
 else if(why.id==="rule")say("이 계정은 캐릭터를 서버에 쓸 권한이 없다.","데이터베이스 규칙에서 계정 저장이 막혀 있다. 운영자에게 이 화면을 보여 주자.");
 else if(why.id==="code")say("캐릭터를 서버에 처음 저장하려면 비밀 코드가 필요하다.","계정을 만들 때 입력한 비밀 코드를 넣으면 바로 저장된다. 그전까지는 이 브라우저에만 남는다.");
 else if(why.id==="denied")say("서버가 저장을 거절했다 (오류 "+why.code+").",(why.msg?why.msg.slice(0,140)+". ":"")+"다시 로그인한 뒤 다시 저장해 보자. 바뀐 내용은 이 브라우저에 남아 있다.");
 else if(why.id==="http")say("서버가 오류 "+why.code+"로 응답해서 저장하지 못했다.",why.msg?why.msg.slice(0,140):"잠시 뒤에 자동으로 다시 시도한다.");
 else say("캐릭터를 저장하지 못했다.",(why.code?why.code+". ":"")+(why.msg?why.msg.slice(0,140):"잠시 뒤에 자동으로 다시 시도한다."));
 w.append(title,document.createTextNode(" "),body);
 if(why.id==="code"){const f=elT("form","row");f.style.cssText="margin-top:8px;flex-wrap:nowrap";const i=elT("input");i.type="text";i.lang="ko";i.spellcheck=false;i.autocomplete="off";i.placeholder="비밀 코드";i.setAttribute("aria-label","비밀 코드");i.style.flex="1";const b=elT("button","btn","저장하기");b.type="submit";b.style.cssText="width:auto;margin:0;padding:9px 14px";f.append(i,b);
  f.onsubmit=async e=>{e.preventDefault();const v=i.value.trim().normalize("NFC");let ok=false;try{ok=await codeOk(v)}catch(x){}if(!ok){i.value="";i.placeholder="코드가 맞지 않다";return}AUTH.jc=v;keep("mgr_jc_"+AUTH.uid,v);saveErr="";saveCloud(true)};w.appendChild(f);return}
 const row=elT("div","row");row.style.marginTop="8px";const rb=elT("button","chip","다시 저장해 보기");rb.type="button";rb.onclick=()=>{saveErr="";saveCloud(true)};row.appendChild(rb);
 if(why.id==="login"||why.id==="denied"||why.id==="rule"||why.id==="body"){const lb=elT("button","chip","다시 로그인");lb.type="button";lb.onclick=()=>logOut();row.appendChild(lb)}
 w.appendChild(row)}
// 로그인 토큰이 어느 Firebase 프로젝트 것인지 읽는다(점검용).
function tokProj(){try{const p=JSON.parse(atob(String(AUTH.tok||"").split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));return p.aud||""}catch(e){return ""}}
/* 저장이 401/403(권한 없음)으로 막히면 바로 포기하지 않고 차례로 다시 시도한다.
   ① 로그인 토큰이 만료됐을 수 있으니 새 토큰을 받아 다시 저장 ② 비밀 코드(jc)를 빼고 저장(이미 있는 계정) ③ 비밀 코드를 넣고 저장(처음 만드는 계정).
   그래도 안 되면 작은 값 하나만 저장해 보고, 결과를 경고에 함께 적어 원인(토큰·규칙·내용)을 짐작할 수 있게 한다. */
/* 저장은 계정 문서를 통째로 바꾸지 않는다. 마지막으로 서버에 반영된 캐릭터(accBase)와 지금 캐릭터를 견주어, 바뀐 칸만 PATCH 한다.
   레벨·경험치는 accounts/{계정}/prog 에도 같이 적어, 마을을 열 때와 출정에서 돌아올 때 읽는다. 계정 ts 가 더 새면 본문(경험·골드 포함)을 따르고 prog 를 맞춘다.
   보내기 전에 막히면 바뀐 칸만 mgr_pend_{계정} 에 남긴다. 캐릭터 전체 백업은 쓰지 않는다.
   전송은 한 번에 하나만(saveBusy). 겹치면 saveAgain 만 남기고, 끝난 뒤 최신 C 로 다시 diff 한다 → 같은 칸은 마지막 값만 나간다.
   PATCH 전에 accounts/.../ts 를 읽어, 내가 아는 accSeen 보다 크면 다른 기기·탭이 쓴 것으로 보고 서버본을 받은 뒤 합친다.
   경험·골드는 더 새 ts 본문에, 이 탭이 accBase 이후로 쌓은 미저장 증감(delta)만 더한다. 옛 절대값으로 덮지 않는다. */
const MY_SID=Math.random().toString(36).slice(2,10)+Date.now().toString(36);let saveDiag="",saveFix=false;let accSeen=null,lastPut=0;
let accBase=null,accReady=false,savePending=false,saveBusy=false,saveAgain=false,saveRetryT=null,saveWait=[],saveSoft=0;
/* 네트워크·타임아웃은 배너 전에 이 횟수만큼 조용히 다시 시도한다.
   탭을 오래 켜 둔 채 방치하면 한두 번 끊기는 일이 많아, 1회만 보면 ⚠ 이 너무 자주 떴다. */
const SAVE_SOFT_MAX=3;
const savePayload=jc=>{const p={c:C,ts:Date.now(),sid:MY_SID,prog:{lv:C.lv||1,ex:C.ex||0,xv:C.xv||2}};if(jc)p.jc=AUTH.jc;lastPut=p.ts;return p};
function wakeSave(ok){const w=saveWait;saveWait=[];w.forEach(r=>{try{r(!!ok)}catch(e){}})}
function accMark(sent){try{accBase=JSON.parse(JSON.stringify(sent||C))}catch(e){accBase=null}}
function diffFlat(a,b,path,out){if(a===b)return;const ao=a&&typeof a==="object",bo=b&&typeof b==="object";
 if(!ao||!bo||Array.isArray(a)||Array.isArray(b)){if(JSON.stringify(a)!==JSON.stringify(b))out[path]=b===undefined?null:b;return}
 const keys={};Object.keys(a).forEach(k=>{keys[k]=1});Object.keys(b).forEach(k=>{keys[k]=1});
 Object.keys(keys).forEach(k=>{const np=path+"/"+k;if(!Object.prototype.hasOwnProperty.call(b,k))out[np]=null;else diffFlat(a[k],b[k],np,out)})}
function accDiff(sent){const out={},b=accBase||{};diffFlat(b,sent,"c",out);
 if((Number(b.lv)||0)!==(Number(sent.lv)||0)||(Number(b.ex)||0)!==(Number(sent.ex)||0)||(Number(b.xv)||0)!==(Number(sent.xv)||0)){out["prog/lv"]=sent.lv||1;out["prog/ex"]=sent.ex||0;out["prog/xv"]=sent.xv||2}
 return out}
function clearPend(){if(!AUTH.uid)return;try{localStorage.removeItem("mgr_pend_"+AUTH.uid)}catch(e){}}
function pendWrite(slim){if(!AUTH.uid||!slim||!Object.keys(slim).length)return;try{localStorage.setItem("mgr_pend_"+AUTH.uid,JSON.stringify(Object.assign({_t:Date.now()},slim)))}catch(e){}}
function pendRead(){if(!AUTH.uid)return null;try{const raw=localStorage.getItem("mgr_pend_"+AUTH.uid);if(!raw)return null;const f=JSON.parse(raw);if(!f||typeof f!=="object")return null;const t=Number(f._t)||0;const fields={};Object.keys(f).forEach(k=>{if(k==="_t")return;if(k.indexOf("c/")===0||k.indexOf("prog/")===0)fields[k]=f[k]});
  /* 예전 형식(_t 없음·경로 접두 없음)도 칸만 모은다. */if(!Object.keys(fields).length)Object.keys(f).forEach(k=>{if(k!=="_t")fields[k]=f[k]});return{t,fields}}catch(e){return null}}
function applyPend(obj,fields){Object.keys(fields||{}).forEach(path=>{if(path.indexOf("c/")!==0)return;const parts=path.split("/").slice(1);let o=obj;for(let i=0;i<parts.length-1;i++){const k=parts[i];if(!o[k]||typeof o[k]!=="object")o[k]={};o=o[k]}const last=parts[parts.length-1];
  /* 재접속 때 pend 의 null(옛 정산 시도)로 서버에 남은 장기 토벌·단서 진행을 지우지 않는다. 중복 보상 가능성은 남긴다.
     반대로, 서버에 이미 정산(없음)인데 낡은 pend 가 옛 출정을 되살리는 것도 막는다. */
  if(last==="lh"||last==="clue"){if(fields[path]==null&&o[last]&&typeof o[last]==="object")return;if(fields[path]&&typeof fields[path]==="object"&&!o[last])return}
  if(fields[path]==null)delete o[last];else o[last]=fields[path]})}
/* 장기 토벌·단서(다기기 ts 합침): 이 탭이 정산(null) 중이면 null 유지. 둘 다 진행 중이면 더 늦은 t0.
   재접속 pend 로 진행을 지우는 문제는 applyPend 에서 막는다. */
function pickTrip(local,remote){if(local==null||local===undefined)return null;if(remote==null||remote===undefined)return null;return(Number(local.t0)||0)>=(Number(remote.t0)||0)?local:remote}
/* 서버 회귀 번호(c.rsv · players/rr)가 이 탭보다 크면, 회귀 전 캐릭터로 PATCH/set 하지 말고 서버본을 받는다.
   ts 레이스로 accSync 를 놓친 옛 탭이 레벨·골드·가방만 되돌리는 것을 막는다. */
async function rstDueRemote(){if(!AUTH.uid||!DB)return 0;let due=0;
 try{const sn=await DB.doc("accounts/"+AUTH.uid+"/c/rsv").get();if(sn.exists)due=Math.max(due,Number(sn.data())||0)}catch(e){}
 try{const sn=await DB.doc("players/"+AUTH.uid+"/rr").get();if(sn.exists)due=Math.max(due,Number(sn.data())||0)}catch(e){}
 return due}
async function rstAbortStaleSave(){if(!AUTH.uid||!C||!DB)return false;const due=await rstDueRemote();if(!(due>(Number(C.rsv)||0)))return false;
 try{clearPend()}catch(e){}
 try{const full=await DB.doc("accounts/"+AUTH.uid).get();if(!full.exists)return true;const d=full.data()||{},ch=d.c;
  if(ch&&typeof ch==="object"&&(Number(ch.rsv)||0)>=due){C=JSON.parse(JSON.stringify(ch));accSeen=Number(d.ts)||Date.now();accMark(ch);accReady=true;
   try{keep("mgr_rr_"+AUTH.uid,String(due))}catch(e){}}
 }catch(e){}
 return true}
/* 서버(Functions)가 계정에 쓴 sid. ts 만 올라가도 accSync 는 하되, '다른 기기' 토스트는 띄우지 않는다. */
const ACC_SID_SERVER={xpay:1,frsync:1,"admin-grant":1,"admin-rst":1};
/* 서버 ts 가 내가 본 것보다 크면 서버 캐릭터를 기준으로 삼고, 사역마·진행을 합친다.
   경험·골드: 더 새 서버본 + (이 탭 C − accBase) 미저장 증감. 옛 절대값 max 로 덮지 않는다.
   sid 가 ACC_SID_SERVER(예: 마치 xpay)이면 같은 기기에서 받은 서버 지급으로 보고 토스트만 생략. */
async function accSyncIfNewer(){if(!AUTH.uid||!C||!DB||accSeen==null)return false;
 let remoteTs=0;try{const sn=await DB.doc("accounts/"+AUTH.uid+"/ts").get();remoteTs=sn.exists?Number(sn.data())||0:0}catch(e){return false}
 if(!(remoteTs>Number(accSeen)))return false;
 const full=await DB.doc("accounts/"+AUTH.uid).get();if(!full.exists)return false;const d=full.data()||{},rem=d.c;if(!rem||typeof rem!=="object"){accSeen=remoteTs;return false}
 const mine=JSON.parse(JSON.stringify(C)),base=accBase;C=JSON.parse(JSON.stringify(rem));keepMerge(C,mine);
 C.lh=pickTrip(mine.lh,rem.lh);C.clue=pickTrip(mine.clue,rem.clue);
 /* 서버 rsv 가 더 크면 시즌·개인 회귀다. 옛 탭으로 회귀를 되돌리지 않는다. */
 const rstNewer=(Number(rem.rsv)||0)>(Number(mine.rsv)||0);
 if(rstNewer){try{clearPend()}catch(e){}}
 /* 이 탭에서 이미 정산(lh/clue 비움)했는데 서버만 아직 옛 진행이면, 보상(가방·알·조각·절망·통계·경험·골드)을 서버 옛값으로 되돌리지 않는다. */
 const claimed=!rstNewer&&((mine.lh==null&&rem.lh&&typeof rem.lh==="object")||(mine.clue==null&&rem.clue&&typeof rem.clue==="object"));
 if(claimed){
  if(mine.inv&&typeof mine.inv==="object")C.inv=JSON.parse(JSON.stringify(mine.inv));
  if(mine.stats&&typeof mine.stats==="object")C.stats=Object.assign({},mine.stats);
  if(mine.eggs!=null)C.eggs=mine.eggs;if(mine.eggsEv!=null)C.eggsEv=mine.eggsEv;if(mine.egg!==undefined)C.egg=mine.egg;
  if(mine.clp)C.clp=mine.clp;if(mine.dz!=null)C.dz=mine.dz;if(mine.lhGot)C.lhGot=mine.lhGot;if(mine.clueGot)C.clueGot=mine.clueGot;
  if(mine.gd!=null)C.gd=mine.gd;if(mine.ex!=null){C.ex=mine.ex;if(mine.lv!=null)C.lv=mine.lv;if(mine.xv!=null)C.xv=mine.xv}}
 else if(!rstNewer&&base){
  const dEx=(Number(mine.ex)||0)-(Number(base.ex)||0),dGd=(Number(mine.gd)||0)-(Number(base.gd)||0);
  if(dEx){C.ex=Math.max(0,(Number(C.ex)||0)+dEx);C.lv=typeof lvOf==="function"?lvOf(C.ex):(mine.lv||C.lv);if(mine.xv!=null)C.xv=mine.xv}
  if(dGd)C.gd=Math.max(0,(Number(C.gd)||0)+dGd)}
 /* 받은 선물함은 ginbox 서버 권위. 계정 rg/gs 는 옛 기기 합치기용으로만 정리한다. */
 try{giftBoxMerge(C,mine)}catch(e){}
 /* 회귀 직후면 서버본 기준. 그 외는 accBase=rem 으로 두어 미저장 delta 가 이어지는 PATCH 에 나가게 한다. */
 accSeen=Number(d.ts)||remoteTs;accMark(rstNewer?C:rem);accReady=true;
 const quiet=!!ACC_SID_SERVER[String(d.sid||"")];
 try{if(!quiet&&typeof toast==="function")toast("다른 기기·탭에서 기록이 바뀌어 맞추었다.")}catch(e){}
 try{if(typeof hubLH==="function"&&$("#v-hub")&&!$("#v-hub").hidden)hubLH()}catch(e){}
 try{if(typeof clueDraw==="function"&&$("#v-ord")&&!$("#v-ord").hidden)clueDraw()}catch(e){}
 return true}
/* 기록을 합칠 때 잃어버리면 안 되는 것(사역마, 품고 있는 알, 칭호, 사역마 도감)은 양쪽을 합친다.
   예전에는 다른 창·기기의 기록이나 이 기기의 백업으로 바뀔 때, 그쪽에 없는 사역마가 통째로 사라졌다. 스스로 보낸 사역마(petGone)는 되살리지 않는다. */
/* 옛 계정 rg/gs 정리. ginbox 이전 후에는 목록을 계정에 두지 않는다. */
function giftBoxMerge(dst,src){if(!dst||!src)return dst;
 const v=Math.max(Number(dst.ginboxV)||0,Number(src.ginboxV)||0);
 dst.gs=dst.gs&&typeof dst.gs==="object"?dst.gs:{};src.gs=src.gs&&typeof src.gs==="object"?src.gs:{};
 Object.keys(src.gs).forEach(k=>{dst.gs[k]=Math.max(Number(dst.gs[k])||0,Number(src.gs[k])||0)});
 if(v>=1){dst.ginboxV=1;dst.rg=[];return dst}
 const stamp=x=>String(x&&x.u||"")+"#"+Number(x&&x.ts||0)+"#"+String(x&&x.g||"");
 const opened=(gs,x)=>{if(!x)return false;const u=String(x.u||""),t=Number(x.ts)||0;if(!u||!t)return false;
  if((Number(gs[u])||0)>=t)return true;for(let i=0;i<4;i++)if((Number(gs[u+"_"+i])||0)>=t)return true;return false};
 const has=(list,x)=>(Array.isArray(list)?list:[]).some(y=>stamp(y)===stamp(x));
 const map=new Map(),add=(list,otherList,otherGs)=>{
  (Array.isArray(list)?list:[]).forEach(x=>{if(!x||typeof GV==="undefined"||GV[x.g]==null)return;
   if(opened(otherGs,x)&&!has(otherList,x))return;map.set(stamp(x),x)})};
 add(dst.rg,src.rg,src.gs);add(src.rg,dst.rg,dst.gs);
 dst.rg=[...map.values()].sort((a,b)=>(Number(a.ts)||0)-(Number(b.ts)||0));
 const cap=typeof RG_MAX==="number"?RG_MAX:30;if(dst.rg.length>cap)dst.rg=dst.rg.slice(-cap);
 if((Array.isArray(src.rg)?src.rg.length:0)<(Array.isArray(dst.rg)?dst.rg.length:0)&&(Number(src.dz)||0)<=(Number(dst.dz)||0))dst.dz=src.dz;
 return dst}
function keepMerge(dst,src){if(!dst||!src||dst===src)return dst;try{
 const gone=Object.assign({},src.petGone||{},dst.petGone||{});dst.petGone=gone;
 const L=(Array.isArray(dst.pets)?dst.pets:[]).filter(q=>q&&!gone[q.id]);(Array.isArray(src.pets)?src.pets:[]).forEach(q=>{if(!q||gone[q.id])return;const i=L.findIndex(x=>x.id===q.id);if(i<0)L.push(q);else if((Number(q.xp)||0)>(Number(L[i].xp)||0))L[i]=Object.assign({},L[i],{xp:q.xp})});dst.pets=L;
 if(!dst.pet||!L.some(q=>q.id===dst.pet))dst.pet=(L.find(q=>q.id===src.pet)||L[0]||{}).id||null;
 if(!dst.egg&&src.egg&&!L.some(q=>(Number(q.born)||0)>=(Number(src.egg.t0)||0)))dst.egg=src.egg;
 dst.titles=Array.isArray(dst.titles)?dst.titles:[];(src.titles||[]).forEach(t=>{if(!dst.titles.includes(t))dst.titles.push(t)});
 dst.petSeen=Object.assign({},src.petSeen||{},dst.petSeen||{});
 dst.petMax=Math.max(Number(dst.petMax)||0,Number(src.petMax)||0)||undefined;
 dst.stats=dst.stats||{};const oc=Number(src.stats&&src.stats.chats)||0;if(oc>(Number(dst.stats.chats)||0))dst.stats.chats=oc;
 dst.dml=dst.dml||{};Object.keys(src.dml||{}).forEach(id=>{const t=Number(src.dml[id])||0;if(t>(Number(dst.dml[id])||0))dst.dml[id]=t})}catch(e){}return dst}
// 예전에는 다른 창의 계정 문서를 통째로 가져와 이 창의 레벨까지 덮어썼다. 이제는 바뀐 칸만 저장하고, 계정 ts 가 더 새면 본문(경험·골드)을 따른다.
async function syncAdopt(){return false}
async function syncPeek(){return "same"}
async function saveRescue(){if(saveFix)return false;saveFix=true;try{
 /* 회귀 직후 옛 탭이 권한 오류 복구로 계정 통째 set 하지 않게 한다. */
 try{if(await rstAbortStaleSave()){saveDiag="";return true}}catch(e){}
 let tok=true;try{if(AUTH.rt&&AUTH.key)await refresh()}catch(e){tok=false}
 const order=AUTH.jc?(AUTH.nojc?[false,true]:[true,false]):[false];
 for(const jc of order){try{await DB.doc("accounts/"+AUTH.uid).set(savePayload(jc));accSeen=lastPut;if(AUTH.jc&&!jc)AUTH.nojc=1;if(jc)AUTH.nojc=0;saveDiag="";return true}catch(e){}}
 /* 코드를 넣어도, 빼도 저장이 안 되면 기억된 코드가 틀린 것일 수 있다. 코드를 비워 화면에 코드 입력칸이 나오게 한다. */
 let accEx=true;try{accEx=!!(await DB.doc("accounts/"+AUTH.uid).peek())}catch(e){}
 if(AUTH.jc&&!accEx){AUTH.jc="";AUTH.nojc=0;try{localStorage.removeItem("mgr_jc_"+AUTH.uid)}catch(e){}}
 let small=false;try{await DB.doc("accounts/"+AUTH.uid+"/ts").set(Date.now());small=true}catch(e){}
 const kb=Math.round(JSON.stringify(savePayload(false)).length/1024);
 saveDiag=" [진단: 토큰 "+(tok?"정상":"갱신 실패")+" · 작은 저장 "+(small?"성공 → 저장 내용("+kb+"KB)이 규칙에 걸림":"실패 → 계정 쓰기 권한 자체가 막힘")+"]";return false}finally{saveFix=false}}
function saveCloud(now){
 return new Promise(resolve=>{saveWait.push(resolve);
  if(saveBusy){saveAgain=true;savePending=true;return}
  clearTimeout(sct);if(now)clearTimeout(saveRetryT);
  /* 탭이 안 보이면 계정 저장 HTTP 를 시작하지 않는다.
     언제: PC에 켜 둔 채 방치·다른 창 포커스(document.hidden)일 때.
     왜: 백그라운드에서는 요청이 늦거나 끊겨 abort → ⚠ 저장 실패 배너가 출정과 무관하게 자주 떴다.
     바뀐 칸은 이미 pend(local)에 있고, 다시 보이면 visibility→accSoftSync / 아래 go 가 올린다.
     saveWait 는 풀지 않아, 보이는 뒤 저장이 끝날 때까지 saveNow 호출자가 기다린다. */
  if(document.hidden){savePending=true;return}
  const go=async()=>{if(!AUTH.uid||!C||!DB){savePending=false;saveBusy=false;wakeSave(false);return}
   if(document.hidden){savePending=true;saveBusy=false;return}
   saveBusy=true;saveAgain=false;
   try{await accSyncIfNewer()}catch(e){}
   if(document.hidden){savePending=true;saveBusy=false;return}
   const finishNoWrite=()=>{const st=JSON.stringify(C);accBase=JSON.parse(st);accReady=true;saveSoft=0;
    if(saveAgain||JSON.stringify(C)!==st){savePending=true;saveAgain=false;return go()}
    savePending=false;saveBusy=false;clearPend();wakeSave(true)};
   /* 회귀가 이 탭보다 새로우면 이번 저장(옛 PATCH/set)을 버리고 서버본만 맞춘다. */
   try{if(await rstAbortStaleSave())return finishNoWrite()}catch(e){}
   const sent=JSON.parse(JSON.stringify(C)),stamp=JSON.stringify(sent);
   const done=()=>{accBase=JSON.parse(stamp);accReady=true;saveSoft=0;
    if(saveAgain||JSON.stringify(C)!==stamp){savePending=true;saveAgain=false;return go()}
    savePending=false;saveBusy=false;clearPend();wakeSave(true)};
   const fail=async e=>{const c=String(e&&e.message||e);
    if((c==="401"||c==="403")&&await saveRescue()){saveWarn("");done();return}
    /* 네트워크·응답 지연은 배너 전에 SAVE_SOFT_MAX 번 조용히 재시도. soft 중에는 saveWait 를 풀지 않는다. */
    const soft=saveCause(c);if((soft.id==="timeout"||soft.id==="offline")&&saveSoft<SAVE_SOFT_MAX){saveSoft++;saveBusy=false;savePending=true;clearTimeout(saveRetryT);saveRetryT=setTimeout(()=>{saveAgain=true;saveCloud(true)},3000);return}
    saveWarn(c);saveBusy=false;wakeSave(false);clearTimeout(saveRetryT);saveRetryT=setTimeout(()=>{saveAgain=true;saveCloud(true)},15000)};
   if(!accReady||!accBase){
    try{if(await rstAbortStaleSave())return finishNoWrite()}catch(e){}
    return DB.doc("accounts/"+AUTH.uid).set(savePayload(AUTH.jc&&!AUTH.nojc)).then(()=>{accSeen=lastPut;saveWarn("");done()}).catch(fail)}
   /* 직렬화 후 여기 올 때의 sent 가 대기 중 변경의 마지막 상태 → 같은 칸은 마지막 값만 PATCH. */
   const body=accDiff(sent);if(!Object.keys(body).length){done();return}
   body.ts=Date.now();body.sid=MY_SID;lastPut=body.ts;
   try{const slim={};Object.keys(body).forEach(k=>{if(k!=="ts"&&k!=="sid")slim[k]=body[k]});pendWrite(slim)}catch(e){}
   /* PATCH 직전 한 번 더: sync~diff 사이에 회귀 set 이 들어오면 버린다. */
   try{if(await rstAbortStaleSave())return finishNoWrite()}catch(e){}
   return DB.doc("accounts/"+AUTH.uid).patch(body).then(()=>{accSeen=lastPut;saveWarn("");done()}).catch(fail)};
  if(now)go();else sct=setTimeout(()=>go(),600)})}
// 자연 회복 켜고 끄기: 꺼 둔 동안에는 절망도가 저절로 내려가지 않는다. 다시 켜면 그때부터 10분을 새로 센다(꺼 둔 시간은 소급되지 않는다).
function healToggle(){if(!C)return;C.healOff=!C.healOff;C.dzT=Date.now();save();toast(C.healOff?"절망도 자연 회복을 껐다.":"절망도 자연 회복을 켰다. 10분마다 다시 내려간다.");if(!$("#v-hub").hidden)hub()}
function natHeal(){if(!C)return;const now=Date.now();if(!C.dzT||C.fall||C.healOff){C.dzT=now;return}
 const n=Math.floor((now-C.dzT)/HEAL_MS);if(n>0){C.dzT+=n*HEAL_MS;const b0=C.dz||0;if(b0>0){C.dz=Math.max(0,b0-healAmt()*n);titleState();if(C.dz===0)C.stats.reachedZero=true;save();checkTitles();
  if(!$("#v-hub").hidden){$("#hc .hc-dz .bar i").style.width=C.dz+"%";$("#hc .hc-dz b").textContent=C.dz;const fb=$("#fbar");if(fb&&C.dz<90)fb.innerHTML=""}
  if(n>1)note("quest","쉬는 동안 마음이 가라앉았다. 절망도가 "+(b0-C.dz)+" 내려갔다.")}else save()}
 const h=$("#hcnext");if(h)h.textContent=healTxt()}
setInterval(natHeal,15000);
function boot(){natHeal();if(C){if(typeof ntTrim==="function"&&ntTrim())save();const moved=typeof xpMigrate==="function"&&xpMigrate();titleState();const day=new Date().toISOString().slice(0,10);if(C.stats.lastDay!==day){C.stats.loginDays=(C.stats.loginDays||1)+1;C.stats.lastDay=day;save()}else if(moved)save();checkTitles()}try{if(XON()&&typeof loadDoom==="function")loadDoom();else if(typeof drawDoom==="function")drawDoom()}catch(e){}let rf=0;if(C&&C.inv){const n=Number(C.inv[0]||0);if(n>0){rf=n;C.gd=(C.gd||0)+30*n;C.inv={};save()}}
 C?hub():(show("create"),rc());if(rf){const h=$("#hm");h.style.color="var(--mu)";h.textContent="상점에서 회복약이 사라져서 가지고 있던 "+rf+"개를 "+30*rf+"골드로 돌려받았다."}}
/* 새 버전 알림: 10분마다 게임 파일의 '바뀐 시각' 표시만(내용 없이) 확인해서, 운영자가 새 파일을 올렸으면 새로고침하라고 알려 준다.
   예전 파일을 켜 둔 채로 있으면 고친 오류가 그 사람에게는 그대로 남기 때문이다. */
let verTag=null,verShown=false;
async function verCheck(){if(verShown||location.protocol==="file:")return;try{const r=await fetch(location.pathname+location.search,{method:"HEAD",cache:"no-store"});const t=r.headers.get("etag")||r.headers.get("last-modified");if(!t)return;if(verTag==null){verTag=t;return}if(t!==verTag){verShown=true;verBanner()}}catch(e){}}
function verBanner(){const b=document.createElement("div");b.className="ver-bar";b.setAttribute("role","status");const t=document.createElement("span");t.textContent="게임이 새 버전으로 업데이트되었다. 새로고침해야 고친 내용이 적용된다.";const go=document.createElement("button");go.type="button";go.className="chip";go.textContent="새로고침";go.onclick=()=>{try{if(C)save()}catch(e){}setTimeout(()=>location.reload(),300)};b.append(t,go);document.body.appendChild(b)}
verCheck();setInterval(verCheck,600000);
setInterval(()=>{if(AUTH.uid&&C&&!document.hidden){guardPush();devClaim();checkRaid()}},30000);
function showLogin(){show("login");mode(4);lForgot=false;const lk=$("#lk");if(lk)lk.hidden=!!AUTH.key;const lm=$("#lm");if(lm)lm.textContent="";try{drawLogin()}catch(e){}}
/* 긴급 복구: 서버에서 캐릭터가 사라졌을 때 쓰는 화면과, players에 남은 정보로 캐릭터를 다시 만드는 기능. */
function rescueAsk(p){return new Promise(res=>{const o=elT("div","imgo");o.style.cursor="default";const c=elT("div","card");c.style.cssText="max-width:440px;width:100%;text-align:left";
 c.append(elT("h2","","⚠ 서버에서 '"+String(p.n).slice(0,20)+"' 캐릭터 기록을 찾지 못했다"),elT("p","hint","서버 점검 중 문제로 캐릭터 기록이 사라졌을 수 있다. 이 기기에는 백업이 없다."),
  elT("p","","① 평소에 쓰던 기기·브라우저로 접속하면 캐릭터가 그대로 복구된다. (가장 좋다)"),elT("p","","② 지금 여기서 기본 정보(이름·등급·레벨·속성·특성·마을·프로필·무기·전투력)만 복구할 수도 있다. 골드·아이템·친구 목록·일부 칭호는 돌아오지 않는다."));
 const b1=elT("button","btn","① 로그아웃하고 평소 쓰던 기기에서 접속하기");b1.type="button";b1.onclick=()=>{o.remove();res("out")};
 const b2=elT("button","btn g","② 여기서 기본 정보로 복구하기");b2.type="button";b2.onclick=()=>{if(!confirm("기본 정보로 복구하면, 평소 기기의 백업으로는 자동 복구되지 않을 수 있다. 정말 여기서 복구할까?"))return;o.remove();res("base")};
 c.append(b1,b2);o.appendChild(c);document.body.appendChild(o)})}
function rescueBuild(p){const a=String(p.a||"").split(" · ").filter(x=>AT.some(t=>t[0]===x)),lv0=Math.max(1,Number(p.lv)||1);let ex=Math.max(0,Number(p.ex)||0);
 if(ex>0&&ex<xpAt(lv0)&&typeof lvOfV2==="function"&&lvOfV2(ex)===lv0)ex=xpCurve(ex,2);ex=Math.max(ex,xpAt(lv0));
 const c={n:String(p.n).slice(0,20),s:p.s||"소녀",g:GL.includes(p.g)?p.g:"E",t:TR.includes(p.t)?p.t:TR[0],a:a.length?a:["불"],v:VL[p.v]?p.v:"A",lv:lvOf(ex),ex,xv:3,cl:Number(p.cl)||0,dz:Math.min(60,Number(p.dz)||0),b:0,gd:0,inv:{},wps:[],wp:-1,wl:{},titles:[],ti:"",stats:{huntsWon:Number(p.cl)||0},
  pf:p.pf&&typeof p.pf==="object"?p.pf:{},fc:p.fc&&typeof p.fc==="object"?p.fc:{},wf:Number(p.wf)||0,rescued:Date.now(),
  // 예전 보상·개인 지급은 이미 받은 것으로 친다(기본 정보 복구로 두 번 받지 않게). 이번 복구 보상만 새로 받는다.
  cmp:Object.fromEntries(COMP.map(x=>x[0]).concat(GRANT.map(x=>x[0])).filter(id=>id!=="restore-apology-20261016"&&id!=="maint-20261018").map(id=>[id,1]))};
 const m=String(p.wp||"").match(/^(.+?)(?: \+(\d))?$/),wi=m?WP.findIndex(w=>w[0]===m[1]):-1;if(wi>=0){c.wps=[wi];c.wp=wi;c.wl["w"+wi]=Math.min(5,Number(m[2])||0)}
 const C0=C;C=c;try{const need=(Number(p.pw)||0)-pw();if(need>0)c.b=need}catch(e){}C=C0;return c}
async function enterGame(){UID=AUTH.uid;AUTH.jc=AUTH.jc||lget("mgr_jc_"+UID)||"";
 /* 이 브라우저에 기억된 비밀 코드가 지금 코드와 다르면(예전 코드) 버린다. 틀린 코드를 계속 보내면 첫 저장이 영원히 막힌다. */
 if(AUTH.jc){let ok=false;try{ok=await codeOk(AUTH.jc)}catch(e){ok=true}if(!ok){AUTH.jc="";try{localStorage.removeItem("mgr_jc_"+UID)}catch(e){}}}DB=fbdb(FBU);LOCAL=false;let d=null;
 try{const s=await DB.doc("accounts/"+UID).get();d=s.exists?s.data():null;accSeen=d?Number(d.ts)||null:null}catch(e){const c=String(e.message||e);throw new Error("서버에서 계정 정보를 읽지 못했다. "+(c==="401"||c==="403"?"데이터베이스 규칙에서 읽기가 막혀 있다. 규칙을 게시했는지 확인해야 한다.":c==="404"?"데이터베이스를 찾지 못했다. 데이터베이스를 만들었는지, 주소가 맞는지 확인해야 한다.":"서버에 접속하지 못했다. 주소와 인터넷 연결을 확인해야 한다.")+" (오류: "+c+", 주소: "+FBU+")")}
 C=null;if(d&&d.c){C=d.c;accMark();accReady=true;
  // 개인 회귀가 이 브라우저보다 새로우면, 회귀 전에 남긴 바뀐 칸은 붙이지 않는다.
  try{if(typeof rstFresh==="function")await rstFresh()}catch(e){}
  /* 서버 저장이 끝나기 전에 닫힌 바뀐 칸만 이어 붙인다.
     서버 ts 가 pend 시각보다 더 새롭면(다른 기기·탭이 이미 저장) 낡은 pend 로 되돌리지 않는다.
     회귀(rr) 시각보다 오래된 pend 도 버린다. pend 가 더 새면 그 칸(경험·골드 포함)을 그대로 쓴다. */
  try{const pend=pendRead();if(pend&&pend.fields&&Object.keys(pend.fields).length){const srvTs=Number(accSeen)||0;
   let rr=0;try{rr=await rstDueRemote()}catch(e){}
   if((rr&&pend.t&&pend.t<rr)||(rr>(Number(C.rsv)||0))||(pend.t&&srvTs&&pend.t<srvTs))clearPend();
   else{applyPend(C,pend.fields);
    if(pend.fields["prog/ex"]!=null){C.ex=pend.fields["prog/ex"];if(pend.fields["prog/xv"]!=null)C.xv=pend.fields["prog/xv"];if(pend.fields["prog/lv"]!=null)C.lv=pend.fields["prog/lv"]}
    if(typeof xpMigrate==="function")xpMigrate();saveCloud(true)}}}catch(e){}}
 else{let bk=null;try{bk=JSON.parse(localStorage.getItem("mgr_bk_"+UID))}catch(e){}
  // 서버에 캐릭터가 없는데 이 브라우저에 이 계정의 백업이 있으면 그걸로 되살리고 서버에 다시 올린다.
  if(bk&&bk.n){C=bk;saveCloud(true)}else{let old=null;try{old=JSON.parse(localStorage.getItem("mgr"))}catch(e){}if(old&&old.n&&confirm("이 브라우저에 저장된 캐릭터 '"+old.n+"'을(를) 이 계정으로 가져올까?")){C=old;saveCloud(true)}}
  // 서버 기록도 백업도 없지만 예전에 캐릭터가 있었던 계정이면(players에 흔적이 남아 있으면) 바로 새로 만들지 않고 복구 방법을 고르게 한다.
  if(!C&&!RESTORE_FULL.some(r=>r[1]===UID)){let pp=null;try{pp=(await DB.doc("players/"+UID).get()).data()}catch(e){}if(pp&&pp.n){const r=await rescueAsk(pp);if(r==="out"){AUTH.uid=null;try{localStorage.removeItem("mgr_rt")}catch(e){}location.reload();return}if(r==="base"){C=rescueBuild(pp);saveCloud(true);setTimeout(()=>alertBox("기본 정보로 복구","이름·등급·레벨·속성·특성·마을·프로필·장착 무기·전투력을 되살렸다.\n골드·아이템·친구 목록·일부 칭호는 돌아오지 않았다.\n\n평소 쓰던 기기에 백업이 남아 있다면 운영자에게 알려 주자."),800)}}}}
 try{const s=await DB.doc("admins").get();admApply(s.exists?s.data():null)}catch(e){}
 try{await rstCheck(true)}catch(e){}
 const frx=fullRestore();
 if(frx)save();
 else pubRemember();
 if(C)pubFall();
 mode(1);boot();checkFounder();setTimeout(checkComp,1500);
 if(frx){regPlayer(true);setTimeout(()=>alertBox("🎁 기록 복구","오류로 사라졌던 '"+C.n+"'의 기록을 백업으로 되돌렸습니다.\n레벨 "+C.lv+" · 칭호 "+C.titles.length+"개 · 무기와 마력 각인까지 모두 돌아왔어요.\n점검 보상과 복구 보상은 잠시 뒤 따로 도착합니다.\n불편을 드려 죄송합니다."),800)}}
async function codeOk(v){const t=String(v||"").trim().normalize("NFC");if(!t||!(window.crypto&&crypto.subtle))return false;const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")===SIGNUP_CODE_HASH}


/* 가입 직후 Auth 주소는 아이디@magic-growth.local 이다. 이메일을 연동하면 Auth 주소도 그 이메일로 바뀐다.
   아이디 로그인은 먼저 아이디용 주소로 시도하고, 안 되면 mail/{아이디} 의 연동 이메일로 같은 계정에 들어간다. */
const mailDummy=e=>typeof e==="string"&&e.toLowerCase().endsWith("@magic-growth.local");
const mailKey=em=>String(em||"").toLowerCase().replace(/\./g,",");
function mailOpt(v){const em=String(v||"").trim().toLowerCase();if(!em)return "";if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)||mailDummy(em))return null;return em}
function mailId(){const ok=s=>/^[A-Za-z0-9_]{3,20}$/.test(s)?String(s).toLowerCase():"";return ok(AUTH.name)||ok(lget("mgr_id"))}
async function signInName(id,pw){const dummy=EM(id);
 try{return await idtWithPw("signInWithPassword",{email:dummy,returnSecureToken:true},pw)}
 catch(e){if(!pwBadCred(e))throw e;
  let linked="";try{const base=String(FBU||"").replace(/\/+$/,"");if(base){const r=await fetch(base+"/mail/"+encodeURIComponent(id.toLowerCase())+".json");if(r.ok)linked=await r.json()}}catch(x){}
  if(typeof linked!=="string"||linked.indexOf("@")<0||linked===dummy)throw e;
  return idtWithPw("signInWithPassword",{email:linked,returnSecureToken:true},pw)}}
async function signInMail(em,pw){let id="";try{const base=String(FBU||"").replace(/\/+$/,"");if(base){const r=await fetch(base+"/elogin/"+encodeURIComponent(mailKey(em))+".json");if(r.ok)id=await r.json()}}catch(x){}
 if(typeof id==="string"&&/^[a-z0-9_]{3,20}$/.test(id)){try{return await idtWithPw("signInWithPassword",{email:EM(id),returnSecureToken:true},pw)}catch(e){if(!pwBadCred(e))throw e}}
 return idtWithPw("signInWithPassword",{email:em,returnSecureToken:true},pw)}
/* 연동 기록을 남기고, Firebase 계정 주소도 그 이메일로 맞춘다. 비밀번호 찾기는 이 주소로 메일을 보낸다.
   아이디 로그인은 mail/{아이디} 로 연동 이메일을 찾아 같은 계정에 들어간다. */
async function mailSave(id,em){id=id.toLowerCase();em=em.toLowerCase();if(!DB&&FBU)DB=fbdb(FBU);if(!DB)throw new Error("서버에 연결되지 않아 이메일을 남기지 못했다.");
 let prev="";try{const s=await DB.doc("mail/"+id).get();if(s.exists&&typeof s.data()==="string")prev=s.data()}catch(x){}
 try{const j=await idt("update",{idToken:AUTH.tok,displayName:id,returnSecureToken:true});if(j.idToken){AUTH.tok=j.idToken;if(j.refreshToken){AUTH.rt=j.refreshToken;keep("mgr_rt",AUTH.rt)}}}catch(x){}
 if(String(AUTH.mail||"").toLowerCase()!==em){const j=await idt("update",{idToken:AUTH.tok,email:em,returnSecureToken:true});if(j.idToken){AUTH.tok=j.idToken;if(j.refreshToken){AUTH.rt=j.refreshToken;keep("mgr_rt",AUTH.rt)}}AUTH.mail=em}
 await DB.doc("mail/"+id).set(em);await DB.doc("elogin/"+mailKey(em)).set(id);
 if(prev&&prev!==em){try{await DB.doc("elogin/"+mailKey(prev)).delete()}catch(x){}}
 AUTH.name=id;keep("mgr_id",id)}
async function doLogin(){const id=$("#lid").value.trim(),pw=$("#lpw").value,pw2=$("#lpw2")?$("#lpw2").value:"",code=$("#lcode")?$("#lcode").value:"",m=$("#lm"),useMail=!signup&&lmailMode,emLogin=useMail?mailOpt($("#lmail").value):"",em=signup?mailOpt($("#lem-in")&&$("#lem-in").value):"";m.textContent="";
 if(useMail&&!emLogin)return m.textContent="연동한 이메일을 적어야 합니다.";
 if(signup&&em===null)return m.textContent="받을 수 있는 이메일을 적거나, 비워 두자.";
 if(!useMail&&!/^[A-Za-z0-9_]{3,20}$/.test(id))return m.textContent="아이디는 영문, 숫자, 밑줄 3~20자로 적어야 합니다.";
 if(signup){const bad=pwCheck(pw);if(bad)return m.textContent=bad;if(pw!==pw2)return m.textContent="비밀번호가 일치하지 않습니다.";
  const jcIn=String(code||"").trim().normalize("NFC");if(!jcIn)return m.textContent="가입을 위해서는 비밀 코드를 적어야 합니다.";
  let jcOk=false;try{jcOk=await codeOk(jcIn)}catch(x){return m.textContent=errMsg(x)}if(!jcOk)return m.textContent="비밀 코드가 맞지 않습니다."}
 else if(pw.length<6)return m.textContent="비밀번호는 6자 이상이어야 합니다.";
 const k=AUTH.key||($("#lkey")&&$("#lkey").value.trim())||"";if(!k)return m.textContent="Firebase 웹 API 키가 없다. 페이지를 새로고침하거나 서버 설정을 확인해야 한다.";AUTH.key=k;
 const jc=signup?String(code||"").trim().normalize("NFC"):"";
 $("#lgo").disabled=true;
 try{const j=signup?await idtWithPw("signUp",{email:EM(id),returnSecureToken:true},pw,{noLegacy:true}):useMail?await signInMail(emLogin,pw):await signInName(id,pw);
  const hinted=!useMail&&/^[A-Za-z0-9_]{3,20}$/.test(id)?id.toLowerCase():(/^[A-Za-z0-9_]{3,20}$/.test(j.displayName||"")?String(j.displayName).toLowerCase():mailId());
  AUTH.uid=j.localId;AUTH.tok=j.idToken;AUTH.rt=j.refreshToken;AUTH.mail=j.email||(useMail?emLogin:"");AUTH.name=hinted||(useMail?emLogin:id);if(jc){AUTH.jc=jc;keep("mgr_jc_"+j.localId,jc)}keep("mgr_key",k);keep("mgr_rt",AUTH.rt);if(hinted)keep("mgr_id",hinted);$("#lpw").value="";if($("#lpw2"))$("#lpw2").value="";if($("#lcode"))$("#lcode").value="";
  let noted="";if(signup&&hinted){try{await idt("update",{idToken:AUTH.tok,displayName:hinted,returnSecureToken:true})}catch(x){}}
  if(em&&hinted){try{await mailSave(hinted,em);noted=em+" 으로도 로그인할 수 있다. 아이디 로그인은 그대로다."}catch(err){noted="계정은 만들어졌다. 이메일 연동은 설정에서 다시 하자."}}
  else if(useMail&&hinted&&AUTH.mail&&!mailDummy(AUTH.mail)){try{await mailSave(hinted,emLogin)}catch(err){}}
  if($("#lem-in"))$("#lem-in").value="";
  /* 인증은 됐는데 마을 진입만 실패하면 유지 토큰(mgr_rt)은 남긴다. 지우면 새로고침마다 로그인 화면만 나온다.
     이메일로 로그인할 때는 연동 안내 창을 띄우지 않는다. 가입 때 이메일을 적은 경우만 한 번 알린다. */
  try{await enterGame();if(noted)setTimeout(()=>alertBox("이메일 연동",noted),900)}catch(e){m.textContent=errMsg(e)}}
 catch(e){AUTH.uid=null;AUTH.tok=null;AUTH.rt="";try{localStorage.removeItem("mgr_rt")}catch(x){}m.textContent=errMsg(e)}
 $("#lgo").disabled=false}
async function startAuth(){AUTH.key=lget("mgr_key")||FB_KEY;const rt=lget("mgr_rt");
 if(AUTH.key&&rt){AUTH.rt=rt;
  try{const j=await refresh();AUTH.uid=j.user_id;AUTH.name=lget("mgr_id")}
  catch(e){AUTH.uid=null;AUTH.tok=null;AUTH.rt="";try{localStorage.removeItem("mgr_rt")}catch(x){}showLogin();$("#lm").textContent=errMsg(e);return}
  try{await enterGame();return}
  catch(e){showLogin();$("#lm").textContent=errMsg(e);return}}
 showLogin()}
let lmailMode=true,lForgot=false;
function lmode(mail) {
   if (!signup) lmailMode =!!mail;
   if(lForgot){drawLogin();return}
   const a = $("#lmode-id"), b = $("#lmode-em");
   if (a) a.setAttribute("aria-pressed", !signup && !lmailMode ? "true" : "false");
   if (b) b.setAttribute("aria-pressed", !signup&&lmailMode ? "true" : "false");
   $("#lmode").hidden =!!signup;
   $("#lid-box").hidden =!signup && lmailMode;
   $("#lmail-box").hidden =!!signup || !lmailMode;
   $("#lem").hidden=!signup;
   const pw2 = $("#lpw2-box"), lcd = $("#lcd"),
   lpw = $("#lpw"),fp=$("#lfp");
   if (pw2) pw2.hidden =! signup;
   if (lcd) lcd.hidden =! signup;
   if (fp) fp.hidden =!!signup;
   if (lpw) {
      lpw.autocomplete = signup ? "new-password" : "current-password";
      lpw.placeholder = signup ? "8자 이상, 영문·숫자":"6자 이상"
   }
 $("#lhint").textContent=signup?"아이디와 비밀번호, 비밀 코드로 계정을 만든다. 이메일은 선택이다.":lmailMode?"연동해 둔 이메일과 비밀번호로 로그인한다.":"아이디와 비밀번호로 로그인하면 캐릭터가 계정에 저장되어 어느 기기에서든 이어서 할 수 있다."}
function drawLogin(){const form=$("#lform"),box=$("#lfp-box"),lt=$("#lt"),hint=$("#lhint"),m=$("#lm");
 if(box)box.hidden=!lForgot;if(form)form.hidden=!!lForgot;
 if(lForgot){if(lt)lt.textContent="비밀번호 초기화";if(hint)hint.textContent="이메일 연동을 한 계정만 쓸 수 있다.";if(m)m.textContent="";const em=$("#lfp-em");if(em){em.value=$("#lmail")&&!$("#lmail-box").hidden?$("#lmail").value:em.value;setTimeout(()=>em.focus(),0)}return}
 if(lt)lt.textContent=signup?"계정 만들기":"로그인";if($("#lgo"))$("#lgo").textContent=signup?"계정 만들기":"로그인";if($("#lsw"))$("#lsw").textContent=signup?"이미 계정이 있다":"계정이 없다면 계정 만들기";
 lmode(lmailMode)}
async function sendPwReset(){const m=$("#lm"),em=mailOpt($("#lfp-em")&&$("#lfp-em").value);if(m)m.textContent="";
 if(em===null||!em){if(m)m.textContent=em===null?"이메일 형식이 아니다.":"연동한 이메일을 적어야 한다.";return}
 const k=AUTH.key||($("#lkey")&&$("#lkey").value.trim())||"";if(!k){if(m)m.textContent="Firebase 웹 API 키가 없다. 페이지를 새로고침하거나 서버 설정을 확인해야 한다.";return}AUTH.key=k;
 const btn=$("#lfp-go");if(btn)btn.disabled=true;
 try{let id="";try{const base=String(FBU||"").replace(/\/+$/,"");if(base){const r=await fetch(base+"/elogin/"+encodeURIComponent(mailKey(em))+".json");if(r.ok)id=await r.json()}}catch(x){}
  if(typeof id!=="string"||!/^[a-z0-9_]{3,20}$/.test(id)){if(m)m.textContent="이메일 연동을 한 계정만 초기화할 수 있다.";return}
  let linked="";try{const base=String(FBU||"").replace(/\/+$/,"");if(base){const r=await fetch(base+"/mail/"+encodeURIComponent(id)+".json");if(r.ok)linked=await r.json()}}catch(x){}
  if(typeof linked!=="string"||linked.toLowerCase()!==em){if(m)m.textContent="이메일 연동을 한 계정만 초기화할 수 있다.";return}
  try{await idt("sendOobCode",{requestType:"PASSWORD_RESET",email:em})}
  catch(e){const c=String(e&&e.message||e);if(/EMAIL_NOT_FOUND|USER_NOT_FOUND|INVALID_EMAIL/.test(c)){if(m)m.textContent="연동 기록은 있으나 계정 주소가 아직 아이디용이라 메일을 보내지 못했다. 한 번 로그인한 뒤 설정에서 이메일을 다시 연동하거나, 운영자에게 문의해야 한다.";return}throw e}
  if(m){m.style.color="";m.textContent="재설정 메일을 보냈다. 메일함과 스팸함을 확인한 뒤, 새 비밀번호로 로그인하자."}}
 catch(e){if(m)m.textContent=errMsg(e)}
 finally{if(btn)btn.disabled=false}}
$("#lgo").onclick=doLogin;$("#lpw").onkeydown=e=>{if(e.key==="Enter"&&!e.isComposing)doLogin()};if($("#lpw2"))$("#lpw2").onkeydown=e=>{if(e.key==="Enter"&&!e.isComposing)doLogin()};if($("#lcode"))$("#lcode").onkeydown=e=>{if(e.key==="Enter"&&!e.isComposing)doLogin()};$("#lmail").onkeydown=e=>{if(e.key==="Enter"&&!e.isComposing)doLogin()};
$("#lmode-id").onclick=()=>lmode(false);$("#lmode-em").onclick=()=>lmode(true);
$("#lsw").onclick=()=>{lForgot=false;signup=!signup;if($("#lcode"))$("#lcode").value="";if($("#lpw2"))$("#lpw2").value="";if($("#lm"))$("#lm").textContent="";drawLogin()};
{const b=$("#lfp");if(b)b.onclick=()=>{signup=false;lForgot=true;drawLogin()}}
{const b=$("#lfp-back");if(b)b.onclick=()=>{lForgot=false;if($("#lm"))$("#lm").textContent="";drawLogin()}}
{const b=$("#lfp-go");if(b)b.onclick=()=>sendPwReset()}
{const i=$("#lfp-em");if(i)i.onkeydown=e=>{if(e.key==="Enter"&&!e.isComposing)sendPwReset()}}
function logOut(){keep("mgr_rt","");location.reload()}
let FBU="";
(async()=>{await null;try{DB=await claude.use("db");const u=await claude.use("user");UID=String(await u.id())}catch(e){DB=null}
 if(DB){mode(1);boot();return}
 // 서버를 옮겼을 때: 이 브라우저에 남은 예전 서버의 주소, 키, 로그인 정보, 캐릭터를 지우고 새 서버로 새로 시작한다.
 if(lget("mgr_proj")!==FB_URL){["mgr_fb","mgr_key","mgr_rt","mgr"].forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});C=null;keep("mgr_proj",FB_URL)}
 let url=lget("mgr_fb")||FB_URL;
 if(url){FBU=url;await startAuth();return}
 showLogin();const lm=$("#lm");if(lm)lm.textContent="서버 주소가 없어 입장할 수 없다."})();
let curView="";
/* 같은 화면을 다시 그리는 동안 내용이 잠깐 비면(목록을 지우고 다시 채울 때) 휴대폰 브라우저가 화면을 위로 끌어올린다.
   잠깐 동안 화면 높이를 지금 높이로 붙잡아 두고, 위치가 바뀌었으면 원래대로 돌려놓는다. */
let keepT=null;function keepY(){const m=document.querySelector("main"),y=window.scrollY;if(!m||y<1)return;m.style.minHeight=m.offsetHeight+"px";clearTimeout(keepT);
 requestAnimationFrame(()=>{if(Math.abs(window.scrollY-y)>2)window.scrollTo(0,y)});keepT=setTimeout(()=>{m.style.minHeight=""},700)}
/* 화면 전환: 다른 화면으로 넘어갈 때만 맨 위로 올린다. 같은 화면을 다시 그릴 때(버튼을 눌러 결과가 바뀔 때)는 보던 위치를 그대로 둔다. */
/* 상단 메뉴: 마을·실전·채팅·게시판·기록·설정은 누르면 하위 항목이 나오고, 친구는 바로 그 화면으로 간다. */
const navGroup=id=>({chat:"chat",hub:"town",shop:"town",bag:"town",pact:"town",trial:"town",craft:"town",growth:"town",boss:"town",portal:"town",guard:"town",fac:"town",wave:"town",rooms:"act",room:"act",xm:"act",arena:"act",ord:"act",ntc:"board",board:"board",inbox:"record",titles:"record",roster:"record",world:"setting",wev:"setting",wqa:"setting",setting:"setting"})[id]||"";
function navSync(id,moved){const g=navGroup(id),actX=id==="rooms"||id==="room"||id==="xm";
 document.querySelectorAll("#nav .nav-bar>button").forEach(b=>b.setAttribute("aria-pressed",(b.dataset.v===id||(b.dataset.g&&b.dataset.g===g))?"true":"false"));
 document.querySelectorAll("#nav .nav-sub button").forEach(b=>b.setAttribute("aria-pressed",(b.dataset.ct?id==="chat"&&b.dataset.ct===(typeof ct==="string"?ct:""):b.dataset.v===id||(b.dataset.v==="rooms"&&actX)||(b.dataset.v==="pact"&&id==="trial"))?"true":"false"));
 if(moved)document.querySelectorAll("#nav .nav-sub").forEach(s=>{if(s.dataset.for!==g)s.hidden=true;else if(g==="town"){if(id!=="hub")s.hidden=false}else if(g)s.hidden=false});
 document.querySelectorAll("#nav .nav-bar>button[data-g]").forEach(b=>{const s=document.querySelector('#nav .nav-sub[data-for="'+b.dataset.g+'"]');b.setAttribute("aria-expanded",s&&!s.hidden?"true":"false")});
 if(typeof updNav==="function"&&C)updNav()}
function show(id){const moved=curView!==id;curView=id;["login","create","hub","rooms","room","xm","portal","guard","fac","board","wave","ntc","arena","ord","trial","shop","chat","friends","bag","pact","craft","growth","titles","raid","boss","inbox","roster","world","wev","wqa","setting"].forEach(v=>{const e=$("#v-"+v);if(e)e.hidden=v!==id;else if(typeof includeHeal==="function")includeHeal()});if(id!=="raid"&&typeof unRd==="function"){unRd();unRd=null}if(id!=="hub"&&typeof raidWatchStop==="function")raidWatchStop();if(id!=="hub"&&id!=="fac"&&typeof disWatchStop==="function")disWatchStop();if(id!=="wave"&&typeof wvWatchStop==="function")wvWatchStop();if(id!=="ord"&&typeof clpWatchStop==="function")clpWatchStop();if(id!=="boss"&&typeof unB==="function"){unB();unB=null}document.querySelector("main").classList.toggle("wide",id==="roster"||id==="boss"||id==="titles"||id==="fac"||id==="board"||id==="ntc");document.querySelector("main").classList.toggle("hubw",id==="hub");document.querySelector("main").classList.toggle("xwide",id==="shop"||id==="craft"||id==="ord");if(id!=="hub"&&unH){unH();unH=null}if(id!=="chat"){if(typeof chatLeave==="function")chatLeave();else{if(typeof unC==="function"){unC();unC=null}if(typeof unP==="function"){unP();unP=null}}}if(id!=="board"&&typeof bdStop==="function")bdStop();$("#nav").hidden=!(C&&(id==="hub"||id==="rooms"||id==="room"||id==="xm"||id==="boss"||id==="portal"||id==="guard"||id==="fac"||id==="board"||id==="wave"||id==="ntc"||id==="arena"||id==="ord"||id==="inbox"||id==="roster"||id==="shop"||id==="chat"||id==="friends"||id==="bag"||id==="pact"||id==="trial"||id==="craft"||id==="growth"||id==="titles"||id==="world"||id==="wev"||id==="wqa"||id==="setting"));navSync(id,moved);if(moved){if(typeof vnClose==="function")vnClose();window.scrollTo(0,0)}else keepY()}
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
let lhBusy=false,lhNtBusy=false,lhDefer=null,accSoftBusy=false;
function lhFlushDefer(){const d=lhDefer;if(!d)return;lhDefer=null;
 if(d.kind==="start"){note("quest",d.nm+"을(를) 떠났다. "+d.hr+"시간 뒤에 돌아온다.");toast("🗺 "+d.nm+" 출발! "+d.hr+"시간 뒤에 돌아온다.")}
 else if(d.kind==="claim"){note("quest",d.nm+": "+d.head+" ("+d.rw+")");checkTitles();alertBox("🗺 "+d.nm+" · "+d.tag,d.head+"\n\n"+(d.evs||[]).map(e=>"· "+e).join("\n")+"\n\n"+d.rw);if(typeof readProg==="function")readProg()}
 else if(d.kind==="nt"){note("quest",d.nm+"에서 돌아왔다! 마을에서 보상을 받자.");toast("🗺 "+d.nm+"에서 돌아왔다! 보상을 받자.");try{ding()}catch(e){}}
 try{if(!$("#v-hub").hidden)hubLH()}catch(e){}}
/* 탭이 다시 보이거나, 진행·미전송이 있을 때 ts 만 먼저 보고 필요하면 맞춘 뒤 저장을 다시 올린다. */
async function accSoftSync(){if(!AUTH.uid||!C||!DB||document.hidden||accSoftBusy)return;accSoftBusy=true;
 try{let changed=false;try{changed=!!(await accSyncIfNewer())}catch(e){}
  let hasPend=false;try{hasPend=!!localStorage.getItem("mgr_pend_"+AUTH.uid)}catch(e){}
  if(hasPend||savePending||lhDefer||lhOn()){const ok=await saveNowOk();if(ok&&lhDefer)lhFlushDefer()}
  if(changed&&!$("#v-hub").hidden)hubLH()}finally{accSoftBusy=false}}
async function lhStart(k){const L=lhOf(k);if(!L||lhOn()||lhBusy)return;if(typeof clueOn==="function"&&clueOn()){toast("단서 탐색을 떠나 있는 동안에는 장기 토벌을 떠날 수 없다.");return}if(C.fall){toast("타락한 동안에는 토벌을 떠날 수 없다.");return}if(C.mj&&Date.now()<C.mj.T0){toast("정기 출정에 참가 신청한 동안에는 떠날 수 없다.");return}
 if(!confirm(L[1]+"("+L[2]+"시간)을 떠날까? 떠나 있는 동안에는 정기 출정에 참가할 수 없다. 성공 확률 약 "+Math.round(lhChance(pw(),L[3])*100)+"%"))return;
 /* 화면은 바로 바꾸고, 저장은 한 번만 기다린다. 재시도는 accSoftSync 가 맡긴다(클릭 경로에서 여러 번 기다리면 체감이 길어진다). */
 const t0=Date.now();C.lh={k,t0,t1:t0+L[2]*3600000,pw:pw(),sd:Math.floor(Math.random()*1e9)};titleState();lhBusy=true;hubLH();toast("서버에 남기는 중...");
 try{const ok=await saveNowOk();if(!ok){lhDefer={kind:"start",nm:L[1],hr:L[2]};toast("출발은 이 기기에 남겨 두었다. 연결되면 서버에 맞추고 알린다.");accSoftSync();return}
  lhDefer=null;note("quest",L[1]+"을(를) 떠났다. "+L[2]+"시간 뒤에 돌아온다.");toast("🗺 "+L[1]+" 출발! "+L[2]+"시간 뒤에 돌아온다.")}
 finally{lhBusy=false;hubLH()}}
/* 정산 시드 기록: 같은 출정을 재접속·동기화로 두 번 받지 않는다. 최근 30개만 남긴다. */
function tripGot(map,sd){const k=String(sd||"");if(!k)return false;const o=C[map]=C[map]&&typeof C[map]==="object"?C[map]:{};if(o[k])return true;o[k]=1;const ks=Object.keys(o);if(ks.length>30)ks.slice(0,ks.length-30).forEach(x=>delete o[x]);return false}
async function lhClaim(early){const h=C.lh,L=h&&lhOf(h.k);if(!L||lhBusy)return;const now=Date.now(),done=now>=h.t1;if(!done&&!early)return;
 if(early&&!confirm("지금 철수할까? 지난 시간만큼의 절반만 받고, 마력석은 받지 못한다."))return;
 if(tripGot("lhGot",h.sd)){C.lh=null;hubLH();toast("이미 받은 토벌이다.");void saveNowRetry(4,1500);return}
 const g=rng(hs32("lh"+h.sd)),hrs=done?L[2]:Math.max(0,(now-h.t0)/3600000),ok=done&&g()<lhChance(h.pw,L[3]),mul=done?(ok?1:.5):LH_EARLY,st=L[9]||1;
 const gd=Math.round(L[4]*hrs*lhRollPct(st,g)*0.01*mul),ex=Math.round(L[5]*hrs*lhRollPct(st,g)*0.01*mul),dz=Math.round(L[6]*(L[2]?hrs/L[2]:0)+(done&&!ok?LH_FAILDZ:0)),mm=done&&ok?L[7]+(g()<.3?1:0):0;
 const evs=[],n=done?2+Math.min(4,L[2]):1;for(let i=0;i<n;i++){const e=LH_EV[Math.floor(g()*LH_EV.length)];if(!evs.includes(e))evs.push(e)}
 C.lh=null;C.gd=(C.gd||0)+gd;if(mm){C.inv=C.inv||{};C.inv.mana=(C.inv.mana||0)+mm}titleState();if(done){C.stats.lhDone=(C.stats.lhDone||0)+1;if(ok&&L[0]==="abyss")C.stats.lhAbyss=1}
 C.stats.maxGold=Math.max(C.stats.maxGold||0,C.gd);gain(ex,dz);guardAdd(Math.round(hrs*3));if(done&&ok){const pe=petDrop("lh");if(pe)evs.push(pe)}if(done){const mt=ok?matGain(["lh_hr"],L[2]):matGain(["lh_fail"]);if(mt)evs.push(mt)}if(typeof clpGain==="function"){const cp=clpGain("lh",{ok,done,hr:L[2]});if(cp)evs.push(cp)}
 const head=!done?"중간에 철수했다.":ok?"토벌 성공!":"토벌은 실패했지만 무사히 돌아왔다.",rw="골드 +"+gd+", 경험치 +"+ex+(mm?", 마력석 +"+mm:"")+", 절망도 +"+dz,tag=done?(ok?"성공":"실패"):"철수";
 /* 낙관적: 결과 팝업을 먼저 보여 주고, PATCH 는 뒤에서 여러 번 시도한다. 실패해도 로컬 보상은 되돌리지 않는다. */
 note("quest",L[1]+": "+head+" ("+rw+")");checkTitles();hubLH();
 alertBox("🗺 "+L[1]+" · "+tag,head+"\n\n"+evs.map(e=>"· "+e).join("\n")+"\n\n"+rw);if(typeof readProg==="function")readProg();
 lhBusy=true;hubLH();
 try{if(!await saveNowRetry(4,1500)){toast("보상은 반영했다. 서버 저장을 계속 시도한다.");accSoftSync()}}
 finally{lhBusy=false;hubLH()}}
function hubLH(){const box=$("#hlh");if(!box||!C)return;box.innerHTML="";const now=Date.now(),sm=$("#lhsum");if(sm)sm.textContent=lhOn()?(now>=C.lh.t1?"· 귀환! 보상 받기":"· "+lhOf(C.lh.k)[1]+" "+cdTxt(C.lh.t1-now)+" 남음"):"";
 if(lhOn()){const h=C.lh,L=lhOf(h.k),done=now>=h.t1,w=elT("div","dq lh-on"+(done?" got":"")),cp=elT("div","dq-copy"),bar=elT("div","bar"),f=elT("i");
  f.style.width=Math.min(100,(now-h.t0)/(h.t1-h.t0)*100)+"%";bar.appendChild(f);
  const wait=lhBusy||(lhDefer&&lhDefer.kind==="start");
  cp.append(elT("b","","🗺 "+L[1]+(done?" · 귀환!":" · 토벌 중")),elT("small","",done?"토벌을 마치고 돌아왔다. 보상을 받자.":(wait?"서버에 남기는 중 · ":"")+"남은 시간 "+cdTxt(h.t1-now)+" · 성공 확률 약 "+Math.round(lhChance(h.pw,L[3])*100)+"%"),bar);
  const b=elT("button","chip",done?"보상 받기":"철수");b.type="button";b.disabled=!!lhBusy;b.onclick=()=>lhClaim(!done);w.append(cp,b);box.appendChild(w);
  if(!done)box.appendChild(elT("p","hint","떠나 있는 동안 게임을 꺼 두어도 된다. 정기 출정에는 참가할 수 없다."+(lhDefer?" 아직 서버에 남기지 못한 변경이 있어, 연결되면 다시 맞춘다.":"")));return}
 if(typeof clueOn==="function"&&clueOn())box.appendChild(elT("p","hint","단서 탐색을 떠나 있는 동안에는 장기 토벌을 떠날 수 없다."));
 const pv=pw();LH.forEach(L=>{const w=elT("div","dq"),cp=elT("div","dq-copy"),c=lhChance(pv,L[3]),st=L[9]||1;
  cp.append(elT("b","",L[1]+" · "+L[2]+"시간"),elT("small","",L[8]+" 권장 전투력 "+L[3]+" · 성공 약 "+Math.round(c*100)+"% · 골드 약 "+lhEst(L[4],L[2],st)+", 경험치 약 "+lhEst(L[5],L[2],st)+(L[7]?", 마력석 "+L[7]+"+":"")+" · 절망도 +"+L[6]));
  const b=elT("button","chip",lhBusy?"저장 중...":"출발");b.type="button";b.disabled=!!C.fall||(typeof clueOn==="function"&&clueOn())||lhBusy;b.onclick=()=>lhStart(L[0]);w.append(cp,b);box.appendChild(w)})}
// 돌아올 시각이 되면 한 번 알린다. 저장 실패 시 보류했다가 accSoftSync 가 이어 올린다.
setInterval(async()=>{if(!C||!lhOn())return;const h=C.lh;if(Date.now()>=h.t1&&!h.nt&&!lhNtBusy){h.nt=1;lhNtBusy=true;try{const ok=await saveNowOk();const L=lhOf(h.k);if(!ok){lhDefer={kind:"nt",nm:L[1]};accSoftSync();return}lhDefer=null;note("quest",L[1]+"에서 돌아왔다! 마을에서 보상을 받자.");toast("🗺 "+L[1]+"에서 돌아왔다! 보상을 받자.");try{ding()}catch(e){}}finally{lhNtBusy=false}}if(!$("#v-hub").hidden)hubLH()},30000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)accSoftSync()});
setInterval(()=>{if(!document.hidden&&(lhOn()||lhDefer||savePending))accSoftSync()},60000);

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
function pubCard(){if(!C)return{};let power=0,q=null;try{power=typeof pw==="function"?pw():0}catch(e){power=0}try{q=typeof petCur==="function"?petCur():null}catch(e){q=null}
 const weapon=Number.isInteger(C.wp)&&C.wp>=0&&typeof WP!=="undefined"&&WP[C.wp]?WP[C.wp][0]+(wlv(C.wp)?" +"+wlv(C.wp):""):"없음";
 return{n:C.n,s:C.s||"",g:C.g,t:C.t||"",td:(typeof TD!=="undefined"&&TD[C.t])||"",a:(C.a||[]).join(" · "),v:C.v,lv:C.lv||1,cl:C.cl||0,ex:C.ex||0,dz:C.dz||0,wp:weapon,pw:power,ti:C.ti||"",tn:tiName(C.ti),rv:Number(C.rsv)||0,fc:C.fc||{},wf:Number(C.wf)||0,pet:q?{s:q.sp,n:q.nm,l:typeof petLv==="function"?petLv(q):1}:null,hf:C.healOff?1:0,du:{w:(C.stats&&C.stats.duW)||0,l:(C.stats&&C.stats.duL)||0},ev:C.dev&&typeof DEV!=="undefined"&&C.dev.id===DEV.id?{id:DEV.id,pt:C.dev.pt||0,w:C.dev.w||0,n:C.dev.n||0,t:C.dev.t||0}:null,db:(C.du&&!C.du.fin)?(C.du.t0||Date.now()):0,dr:C.dr||null,pf:C.pf&&typeof C.pf==="object"?C.pf:{},rel:Array.isArray(C.rel)&&C.rel.length?C.rel:null,fl:C.fall?1:0}}
function pubRemember(){if(!C)return;pubLast=pubCopy(pubCard())}
function pubSync(){if(!DB||!C||!pubLast)return;const body=pubCard(),patch={};
 Object.keys(body).forEach(k=>{const a=JSON.stringify(body[k]);if(a!==JSON.stringify(pubLast[k]))patch[k]=JSON.parse(a)});
 if(!C.fall&&Object.prototype.hasOwnProperty.call(patch,"fl"))patch.fl=null;
 if(!Object.keys(patch).length)return;
 if(patch.dz!=null||patch.hf!=null){patch.dz=body.dz;patch.ts=Date.now()}
 const prev=pubLast,next=pubCopy(Object.assign({},pubLast,patch));if(!C.fall)next.fl=0;pubLast=next;
 DB.doc("players/"+UID).patch(patch).catch(()=>{if(pubLast===next)pubLast=prev});whoPut()}
/* 사진 없는 명부. 목록·접속·보스는 이 칸만 읽고, 프로필 사진은 players/{나}/im 만 따로 받는다. */
function whoBody(){const b=pubCard(),o={n:String(b.n||"").slice(0,20),g:String(b.g||"").slice(0,2),a:String(b.a||"").slice(0,40),v:VL[b.v]?b.v:"",lv:Math.max(1,Number(b.lv)||1),pw:Math.max(0,Number(b.pw)||0),on:onlineStamp(),ti:String(b.ti||"").slice(0,40),tn:String(b.tn||"").slice(0,40),du:b.du||{w:0,l:0},db:Math.max(0,Number(b.db)||0),fl:b.fl?1:0,rv:Math.max(0,Number(b.rv)||0),dz:Math.max(0,Number(b.dz)||0)};if(b.ev)o.ev=b.ev;return o}
function whoPut(){if(!DB||!C||!UID)return;const b=whoBody();if(!b.n)return;DB.doc("who/"+UID).set(b).catch(()=>{})}
/* 친구 창과 프로필은 계정 기록이 아니라 공개 카드 players/{나}.fl 을 본다.
   공개 카드는 이번 접속에서 바뀐 칸만 고치므로, 타락 표시를 지우는 저장이 한 번 빠지면 다음 접속은 이미 지워진 것으로 기억하고 다시 쓰지 않는다.
   그래서 타락이 아닐 때는 fl 칸을 지우고, 타락 중일 때는 1로 다시 적는다. null 은 그 칸을 지운다. */
function pubFall(){if(!DB||!C||!UID)return;const on=!!C.fall;DB.doc("players/"+UID).patch({fl:on?1:null}).catch(()=>{});if(pubLast)pubLast.fl=on?1:0;whoPut()}
function regPlayer(pic){if(!DB||!C)return;if(!pic){pubSync();return}try{pubPic()}catch(e){}thumb(C.img,im=>{try{const body=pubCard();body.im=im||"";body.ts=Date.now();const prev=pubLast,next=pubCopy(body);pubLast=next;DB.doc("players/"+UID).patch(body).catch(()=>{if(pubLast===next)pubLast=prev});whoPut()}catch(e){}})}
function openProfile(uid){if(!DB||!uid)return;pfU=uid;$("#pfo").hidden=false;$("#pfm").textContent="";$("#pfr").hidden=uid===UID;$("#pfr").disabled=true;$("#pff").hidden=true;$("#pfg").hidden=true;$("#pfdm").hidden=true;$("#gbox").hidden=true;{const rb=$("#pfrel"),rx=$("#relbox");if(rb)rb.hidden=true;if(rx)rx.hidden=true}$("#pfb").textContent="프로필을 불러오는 중...";
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
  if(typeof relSection==="function")relSection(b,p,uid);
  // 운영자에게만: 이 사람의 계정 아이디(uid)를 보여 주고 복사할 수 있게 한다(복구·지급 작업용).
  if(ADM[UID]){const ub=elT("div","pf-uid"),code=elT("code","",uid),cp=elT("button","chip","UID 복사");cp.type="button";cp.onclick=()=>{try{navigator.clipboard.writeText(uid);cp.textContent="복사했다"}catch(e){prompt("UID",uid)}};ub.append(elT("small","","운영자 전용 · 계정 UID "),code,cp);b.appendChild(ub)}
  /* fmsgFriend 가 맞춘 accounts fr 을 반영한 뒤 친구 버튼을 그린다(친구 창을 안 열어도 됨). */
  Promise.resolve(typeof accSyncIfNewer==="function"?accSyncIfNewer():null).catch(()=>{}).then(()=>{if(pfU!==uid)return;frBtn(uid,p.n);if(typeof relBtn==="function")relBtn(uid,p.n);const dmb=$("#pfdm");dmb.hidden=uid===UID||!AUTH.uid;dmb.onclick=()=>{$("#pfo").hidden=true;pfU=null;goDM(uid,p.n)}})},
  e=>{$("#pfb").textContent="프로필을 불러오지 못했다."})}
$("#pfc").onclick=()=>{$("#pfo").hidden=true;pfU=null};
$("#pfo").onclick=e=>{if(e.target===$("#pfo"))$("#pfc").click()};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#pfo").hidden)$("#pfc").click()});

/* 받은 선물함(ginbox) 캐시. updNav·가방이 참조하므로 내비보다 위에 둔다. */
let ginList=[],ginIds="",ginReady=false,unGin=null,ginGen=0,ginMigBusy=false,ginTrimBusy=false;

function updNav(){const cb=document.querySelector("#nav [data-g=chat]");if(cb&&C){const k=Object.keys(C.dmu||{}).length,chatOpen=document.querySelector('#nav .nav-sub[data-for="chat"]'),folded=!chatOpen||chatOpen.hidden;cb.textContent=k&&folded?"채팅 ("+k+")":"채팅";const dm=document.querySelector("#nav [data-ct=d]");if(dm)dm.textContent=k&&!folded?"1:1 채팅 ("+k+")":"1:1 채팅";document.title=(k?"("+k+") ":"")+"魔法 成長記錄"}
 const b=document.querySelector("#nav [data-v=friends]");if(b){const n=Object.keys((C&&C.fq)||{}).length+Object.keys((C&&C.rqIn)||{}).length;b.textContent=n?"친구 ("+n+")":"친구"}
 const dub=document.querySelector("#nav [data-v=arena]");if(dub&&C){const n=(typeof DUI!=="undefined"?DUI.length:0),on=C.du&&!C.du.fin;dub.textContent=on?"대련 ⚔":n?"대련 ("+n+")":"대련";const act=document.querySelector("#nav [data-g=act]"),actOpen=document.querySelector('#nav .nav-sub[data-for="act"]');if(act)act.textContent=(on||n)&&actOpen&&actOpen.hidden?(on?"실전 ⚔":"실전 ("+n+")"):"실전"}
 const bgb=document.querySelector("#nav [data-v=bag]");if(bgb&&C){const n=ginList.length;bgb.textContent=n?"가방 ("+n+")":"가방"}
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
function bag(msg){const fresh=$("#v-bag").hidden;C.inv=C.inv||{};C.wps=C.wps||[];C.wl=C.wl||{};show("bag");drawRG();
 const rowEl=(label,sub,btns,ic)=>{const w=document.createElement("div");w.style.cssText="display:flex;gap:8px";const i=document.createElement("div");i.className="chip";i.style.cssText="flex:1;text-align:left;cursor:default";
  i.innerHTML="<b></b><small style='display:block;color:var(--mu);font-weight:400'></small>";i.querySelector("b").textContent=label;i.querySelector("small").textContent=sub;
  if(ic){const t=document.createElement("div");t.style.minWidth="0";t.append(...i.childNodes);i.classList.add("it-row");i.append(ic,t)}w.appendChild(i);
  btns.forEach(([t,fn,dis])=>{const b=document.createElement("button");b.type="button";b.className="chip";b.style.cssText="flex:0 0 auto;min-width:0;padding:10px 14px";b.textContent=t;b.disabled=!!dis;b.onclick=fn;w.appendChild(b)});return w};
 const it=$("#bgi");it.innerHTML="";const own=ITM.filter(x=>(C.inv[x[0]]||0)>0);
 if(!own.length)it.innerHTML="<p class='hint'>가진 아이템이 없다. 상점에서 살 수 있다.</p>";
 C.arm=C.arm||{};own.forEach(x=>{const id=x[0],on=armed(id);
  if(id==="license"){it.appendChild(rowEl(x[1]+" x"+C.inv[id],x[2]+" (지금 상한 "+petCap()+" / "+petCapMax()+"마리)",[["사용",petLicense,petCap()>=petCapMax()]],itIc(id)));return}
  if(id==="prism"){it.appendChild(rowEl(x[1]+" x"+C.inv[id],x[2],[[prismOn?"닫기":"사용",()=>{prismOn=!prismOn;prismPick=null;bag()}]],itIc(id)));if(prismOn)it.appendChild(prismBox());return}
  if(id==="hope"){it.appendChild(rowEl(x[1]+" x"+C.inv[id],x[2],[["사용",()=>{if(C.fall)return(bag("타락한 동안에는 희망의 결정이 빛나지 않는다."),$("#bgm").style.color="var(--bad)");if((C.dz||0)<=0)return bag("절망도가 이미 0이다. 아껴 두자.");
   if((C.inv.hope||0)<1)return;C.inv.hope--;const b0=C.dz;gain(0,-HOPE_DZ);note("quest","희망의 결정을 사용해 절망도가 "+(b0-C.dz)+" 내려갔다.");bag("희망의 결정이 부서지며 따뜻한 빛이 퍼졌다. 절망도가 "+(b0-C.dz)+" 내려갔다.")}]],itIc(id)));return}
  it.appendChild(rowEl(x[1]+" x"+C.inv[id]+(on?" · 준비됨":""),x[2]+(USE[id]?" ("+USE[id]+"에서 사용)":""),USE[id]?[[on?"준비 해제":"사용 준비",()=>{if(on)delete C.arm[id];else C.arm[id]=true;save();bag(x[1]+(on?" 준비를 해제했다.":"을(를) 준비했다. 다음 "+USE[id]+"에서 쓰인다."))}]]:[],itIc(id)))});
 bagWeapons(rowEl);
 const bm=$("#bgm");if(bm){bm.style.color="var(--mu)";bm.textContent=msg||""}if(fresh)applyGift()}
// 이 친구에게 쓸 수 있는 빈 칸 번호와, 다 찼다면 가장 빨리 비는 시각
/* TODO(선물 한도→서버): 클라 추정용. 진짜 한도는 gift/ RTDB 규칙. 서버 이관 후 이 함수·C.gsl 재검토. */
function giftSlot(u){C.gsl=C.gsl||{};const a=C.gsl[u]||[],now=Date.now();let best=-1,soon=Infinity;
 for(let i=0;i<GIFT_DAY;i++){const t=a[i]||0;if(now-t>DAY_MS+60000){best=i;break}soon=Math.min(soon,t+DAY_MS+60000)}
 return{i:best,left:[...Array(GIFT_DAY).keys()].filter(i=>now-(a[i]||0)>DAY_MS+60000).length,soon}}
/* ── 선물 동기화 ─────────────────────────────────────────────
   [권위] 받은 함 목록·알림·화면 = ginbox/{나}/{id} 만. (계정 c.rg 안 씀)
   [지금 이중 경로] gift/{나}/{보낸이}/{0~3} = RTDB 일일 한도 규칙 + 구버전 송신 큐.
                 giftn/{나} = 구버전·호환용 도착 벨(pull 트리거).
   [클라 상태] C.gs = 개봉·이관 완료 워터마크(accounts 에 저장). gs[칸]>=ts 이면
               gift 잔여로 ginbox 를 다시 채우지 않음. 이관 set 성공 후에만 gs↑.
   [소모] rgUse: 효과·목록·절망/경험치를 낙관 반영 후 ginbox 삭제·계정 저장은 백그라운드.
               삭제 실패 시에만 그 칸 효과를 되돌린다. ginPendDel 로 live 가 잠깐 다시 채우지 않게 한다.
   [후일 ginbox 단독] 구클라 소멸·일일 한도를 ginbox/서버로 옮기면 제거 후보:
       COMPAT_GIFT_PULL(ginPullGift·giftBellWatch), 보내기의 gift/ 쓰기,
       rgUse 의 gift/ 삭제, C.gs 의 gift 칸 키. ginWatch·rgUse(ginbox) 는 유지.
   TODO(선물 한도→서버): 일일 GIFT_DAY 한도는 아직 RTDB gift/ 칸 규칙 + 클라 C.gsl 뿐이다.
       Cloud Functions(또는 동등 서버)로 이관해 ginbox 쓰기와 함께 강제하고, 그다음 gift/
       경로·규칙·클라 giftSlot/gsl·COMPAT pull·giftn 을 제거한다. 구현 코드는 아직 없음.
   ─────────────────────────────────────────────────────────── */
const ginPath=id=>"ginbox/"+UID+"/"+id;
const ginSlotId=(from,slot)=>String(from)+"_"+Number(slot);
const ginMigId=(u,ts,g)=>"m_"+String(u||"x")+"_"+Number(ts||0)+"_"+String(g||"");
let giftBell=0,unGift=null,giftGen=0,ginPullBusy=false,ginPendDel=new Set();
/* ginbox·gift 공통 삭제. 404(이미 없음)는 성공. 잠깐 실패하면 짧게 재시도. */
async function giftDbDel(path){if(!DB||!path)return false;for(let i=0;i<3;i++){try{await DB.doc(path).delete();return true}catch(e){const c=String(e&&e.message||e);if(c==="404")return true;if(i<2)await new Promise(r=>setTimeout(r,200*(i+1)))}}return false}
function giftWatch(){applyGift()}
/* 마을·가방 진입: 옛 rg→ginbox 이전, ginbox 구독, (COMPAT) giftn·gift pull. */
async function applyGift(){if(!AUTH.uid||!C||!DB||LOCAL)return;try{await ginMigrate()}catch(e){}ginWatch();giftBellWatch();try{await ginPullGift()}catch(e){}}
/* 계정에 남던 옛 받은 함(c.rg)을 ginbox 로 한 번만 옮긴다. ginboxV>=1 이면 끝. */
async function ginMigrate(){if(!C||!DB||!AUTH.uid||(Number(C.ginboxV)||0)>=1||ginMigBusy)return;ginMigBusy=true;
 try{const puts=[],seen={};
  (Array.isArray(C.rg)?C.rg:[]).forEach(x=>{if(!x||GV[x.g]==null)return;const id=ginMigId(x.u,x.ts,x.g);if(seen[id])return;seen[id]=1;
   puts.push(DB.doc(ginPath(id)).set({g:x.g,n:String(x.n||"누군가").slice(0,20),u:String(x.u||""),ts:Number(x.ts)||Date.now()}).catch(()=>{}))});
  try{await ginPullGift(puts,seen)}catch(e){}
  if(puts.length)await Promise.all(puts);
  C.ginboxV=1;C.rg=[];if(typeof saveNow==="function")saveNow();else save()}finally{ginMigBusy=false}}
/* COMPAT_GIFT_PULL: 구버전·미게시 규칙으로 ginbox 에만 빠진 칸을 gift/ 에서 보충.
   후일 ginbox 단독 시 이 함수·호출(applyGift·giftBellWatch)을 제거한다. */
async function ginPullGift(puts,seen){if(!AUTH.uid||!C||!DB||LOCAL)return;if(!puts&&ginPullBusy)return;const own=!puts;if(own){ginPullBusy=true;puts=[];seen={}}
 try{C.gs=C.gs&&typeof C.gs==="object"?C.gs:{};const s=await once(DB.collection("gift/"+UID));let bump=false;
  s.docs.forEach(d=>{const f=d.id,v=d.data();if(!v||typeof v!=="object")return;
   const add=(key,slot,row)=>{if(!row||GV[row.g]==null||typeof row.ts!=="number")return;
    if((Number(C.gs[key])||0)>=row.ts)return;const id=slot==null?ginMigId(f,row.ts,row.g):ginSlotId(f,slot);if(seen[id])return;seen[id]=1;
    const body={g:row.g,n:String(row.n||"누군가").slice(0,20),u:f,ts:row.ts};if(slot!=null)body.slot=slot;
    puts.push(DB.doc(ginPath(id)).set(body).then(()=>{C.gs[key]=Math.max(Number(C.gs[key])||0,row.ts);bump=true}).catch(()=>{}))};
   if(v.g!=null&&v.ts!=null)add(f,null,v);
   Object.keys(v).filter(k=>/^[0-3]$/.test(k)).forEach(k=>add(f+"_"+k,Number(k),v[k]))});
  if(own){if(puts.length)await Promise.all(puts);if(bump){if(typeof saveNow==="function")saveNow();else save()}}}
 catch(e){}finally{if(own)ginPullBusy=false}}
/* COMPAT: giftn 벨 → ginPullGift. 신버전은 ginWatch 만으로도 충분. 후일 제거 후보. */
function giftBellWatch(){if(!AUTH.uid||!C||!DB||LOCAL||unGift)return;const gen=++giftGen;
 const take=sn=>{if(gen!==giftGen||!AUTH.uid||!C)return;const p=sn.exists?sn.data():null,ts=p&&typeof p.ts==="number"?p.ts:0;if(!ts||ts<=giftBell)return;giftBell=ts;ginPullGift()};
 DB.doc("giftn/"+UID).get().then(take).catch(()=>{});
 unGift=DB.doc("giftn/"+UID).live().onSnapshot(take,()=>{},30000)}
/* 본선: ginbox live. 목록·토스트·내비의 유일한 권위 구독. ginbox 단독 이후에도 유지. */
function ginWatch(){if(!AUTH.uid||!C||!DB||LOCAL)return;const gen=++ginGen;
 if(unGin){try{unGin()}catch(e){}unGin=null}ginReady=false;
 const take=sn=>{if(gen!==ginGen||!AUTH.uid||!C)return;ginApply(sn.docs||[])};
 try{once(DB.collection("ginbox/"+UID)).then(take).catch(()=>{})}catch(e){}
 unGin=DB.collection("ginbox/"+UID).live().onSnapshot(take,()=>{},30000)}
function ginApply(docs){const prev=ginIds,ready=ginReady,items=[];
 (docs||[]).forEach(d=>{const v=typeof d.data==="function"?d.data():d;if(!v||typeof v!=="object"||GV[v.g]==null)return;
  const id=d.id;if(!id||ginPendDel.has(id))return;items.push({id,g:v.g,n:String(v.n||"누군가").slice(0,20),u:String(v.u||""),ts:Number(v.ts)||0})});
 items.sort((a,b)=>(a.ts-b.ts)||(a.id<b.id?-1:1));
 const cap=typeof RG_MAX==="number"?RG_MAX:30;
 if(items.length>cap&&!ginTrimBusy){ginTrimBusy=true;const drop=items.slice(0,items.length-cap);
  Promise.all(drop.map(x=>DB.doc(ginPath(x.id)).delete().catch(()=>{}))).finally(()=>{ginTrimBusy=false})}
 ginList=items.length>cap?items.slice(-cap):items;ginIds=ginList.map(x=>x.id).join("|");ginReady=true;
 updNav();if(!$("#v-bag").hidden)drawRG();
 /* 첫 스냅샷은 이미 있던 함이라 알림 안 울림. 그 다음부터 새로 생긴 id 만 알림·토스트. */
 if(ready&&ginIds!==prev){const had=new Set(prev.split("|").filter(Boolean)),fresh=ginList.filter(x=>!had.has(x.id));
  if(fresh.length){const rs=fresh.map(x=>x.n+"님이 "+((ITM.find(t=>t[0]===x.g)||[])[1]||"선물")+"을(를) 보냈다");
   fresh.forEach(x=>note("gift",x.n+"님이 "+((ITM.find(t=>t[0]===x.g)||[])[1]||"선물")+"을(를) 선물했다. 가방의 받은 선물함에 넣어 두었다.",x.u));
   toast("🎁 "+rs.join(" / ")+" · 가방에 보관했다");
   if(!$("#v-hub").hidden){const h=$("#hm");if(h){h.style.color="var(--mu)";h.textContent=rs.join(" / ")+" (가방의 받은 선물함에 보관)"}}}}}
const rgVal=g=>Math.round(GV[g]*(C.t==="다정함"?1.5:1)*(1+(typeof petEff==="function"?petEff("gift"):0)));
const rgEff=g=>"절망도 -"+rgVal(g)+(GIFT_EX[g]?" · 경험치 +"+GIFT_EX[g]:"");
function rgGroups(){const m={};ginList.forEach(x=>{if(x&&x.g!=null&&GV[x.g]!=null)m[x.g]=(m[x.g]||0)+1});return Object.keys(m).map(g=>({g,n:m[g]}))}
/* 열기: 목록·절망·경험치를 먼저 낙관 반영하고, ginbox 삭제·gift 청소·계정 PATCH 는 뒤에서.
   삭제 실패 시 그 칸만 되돌린다. ginPendDel 로 live 스냅이 낙관 구간을 다시 채우지 않는다. */
async function rgUse(key){const m=$("#bgm");if(C.fall){bag("타락한 동안에는 선물의 온기가 닿지 않는다.");m.style.color="var(--bad)";return}
 const list=key==="all"?ginList.slice():(()=>{const i=ginList.findIndex(x=>x&&x.g===key);return i<0?[]:[ginList[i]]})();if(!list.length)return;if(key==="all"&&!confirm("정말 모두 열까?"))return;if((C.dz||0)<=0)return bag("절망도가 이미 0이다. 선물은 아껴 두자.");
 C.gs=C.gs&&typeof C.gs==="object"?C.gs:{};const opened=[];const b0=C.dz;let xs=0;
 const paintDz=()=>{const bar=$("#hc .hc-dz .bar i"),t=$("#hc .hc-dz b");if(bar&&C){bar.style.width=(C.dz||0)+"%";if(t)t.textContent=C.dz||0}const fb=$("#fbar");if(fb&&(C.dz||0)<90)fb.innerHTML=""};
 const takeOne=x=>{const z0=C.dz||0,e0=C.ex||0;ginPendDel.add(x.id);ginList=ginList.filter(y=>y&&y.id!==x.id);ginIds=ginList.map(y=>y.id).join("|");
  const add=GIFT_EX[x.g]||0;xs+=add;titleState();C.stats.giftsUsed=(C.stats.giftsUsed||0)+1;gain(add,-rgVal(x.g));
  opened.push({x,dDz:(C.dz||0)-z0,dEx:(C.ex||0)-e0});paintDz();updNav();if(!$("#v-bag").hidden)drawRG()};
 const undoOne=o=>{if(!o||!o.x)return;ginPendDel.delete(o.x.id);if(!ginList.some(y=>y&&y.id===o.x.id)){ginList.push(o.x);ginList.sort((a,b)=>(a.ts-b.ts)||(a.id<b.id?-1:1));ginIds=ginList.map(y=>y.id).join("|")}
  C.stats.giftsUsed=Math.max(0,(C.stats.giftsUsed||0)-1);C.dz=Math.max(0,Math.min(100,(C.dz||0)-o.dDz));C.ex=Math.max(0,(C.ex||0)-o.dEx);if(typeof lvOf==="function")C.lv=lvOf(C.ex);
  paintDz();updNav();if(!$("#v-bag").hidden)drawRG()};
 const giftSweep=x=>{const ts=Number(x.ts)||Date.now(),slotM=String(x.id).match(/^(.+)_([0-3])$/);
  if(slotM){C.gs[slotM[1]+"_"+slotM[2]]=Math.max(Number(C.gs[slotM[1]+"_"+slotM[2]])||0,ts);giftDbDel("gift/"+UID+"/"+slotM[1]+"/"+slotM[2])}
  else if(x.u){C.gs[x.u]=Math.max(Number(C.gs[x.u])||0,ts);giftDbDel("gift/"+UID+"/"+x.u)}};
 list.forEach(takeOne);
 if(!opened.length){bag("선물을 열지 못했다. 잠시 뒤 다시 시도해 보자.");if(m)m.style.color="var(--bad)";return}
 const nm=ITM.find(x=>x[0]===opened[0].x.g),drop=b0-(C.dz||0);
 note("gift",(opened.length>1?"선물 "+opened.length+"개":(nm?nm[1]:"선물"))+"을(를) 열었다. 절망도가 "+drop+" 내려갔다.");
 bag((opened.length>1?"선물 "+opened.length+"개를 열었다. ":(nm?nm[1]:"선물")+"을(를) 열었다. ")+"마음이 따뜻해진다. 절망도가 "+drop+" 내려갔다."+(xs?" 경험치 +"+xs+".":""));
 if(typeof saveNow==="function"){saveNow();try{if(typeof saveNowRetry==="function")saveNowRetry(3,1500)}catch(e){}}
 if(!(DB&&AUTH.uid)){opened.forEach(o=>ginPendDel.delete(o.x.id));return}
 opened.forEach(o=>{giftDbDel(ginPath(o.x.id)).then(ok=>{if(ok){ginPendDel.delete(o.x.id);giftSweep(o.x);return}
  undoOne(o);bag("일부 선물을 서버에서 지우지 못해 되돌렸다. 잠시 뒤 다시 열어 보자.");if(m)m.style.color="var(--bad)";
  if(typeof saveNow==="function")saveNow()}).catch(()=>{undoOne(o);if(typeof saveNow==="function")saveNow()})})}
function drawRG(){const box=$("#bgrg");if(!box||!C)return;box.innerHTML="";const rg=ginList,gr=rgGroups();
 $("#rgh").textContent="친구에게 받은 선물은 여기에 보관된다. 필요할 때 열어 절망도를 낮추자. (보관 "+rg.length+" / "+RG_MAX+")";
 if(!gr.length){box.appendChild(elT("p","hint","받은 선물이 없다."));return}
 gr.forEach(({g,n})=>{const it=ITM.find(t=>t[0]===g);if(!it)return;const w=document.createElement("div");w.style.cssText="display:flex;gap:8px";
  const c=elT("div","chip it-row");c.style.cssText="flex:1;text-align:left;cursor:default";const tx=elT("div");tx.style.minWidth="0";
  tx.append(elT("b","",(ITEM_IMG[g]?"":"🎁 ")+it[1]+" x"+n),elT("small","",rgEff(g)));tx.querySelector("small").style.cssText="display:block;color:var(--mu);font-weight:400";
  const ic=itIc(g);if(ic)c.append(ic,tx);else c.append(tx);
  const b=elT("button","chip","열기");b.type="button";b.style.cssText="flex:0 0 auto;min-width:0;padding:10px 14px";b.disabled=!!C.fall;b.onclick=()=>rgUse(g);w.append(c,b);box.appendChild(w)});
 if(rg.length>1){const a=elT("button","btn g","모두 열기 (절망도 -"+rg.reduce((s,x)=>s+rgVal(x.g),0)+")");a.type="button";a.disabled=!!C.fall;a.onclick=()=>rgUse("all");box.appendChild(a)}}
$("#pfg").onclick=()=>{const gb=$("#gbox"),u=pfU;if(!gb.hidden){gb.hidden=true;return}C.inv=C.inv||{};gb.hidden=false;gb.innerHTML="";
 const sl=giftSlot(u);gb.appendChild(elT("p","hint","이 친구에게 오늘 보낼 수 있는 선물 "+sl.left+" / "+GIFT_DAY+"개"+(sl.i<0?" · 약 "+cdTxt(sl.soon-Date.now())+" 뒤에 다시 보낼 수 있다":"")));
 const own=ITM.filter(x=>x[0][0]==="g"&&(C.inv[x[0]]||0)>0);if(!own.length){gb.appendChild(elT("p","hint","가방에 선물이 없다. 상점에서 사거나 공방에서 만들 수 있다."));return}
 let sel=null;const row=document.createElement("div");row.className="row";row.style.margin="10px 0";
 own.forEach(x=>{const b=document.createElement("button");b.type="button";b.className="chip";b.textContent=x[1]+" x"+C.inv[x[0]];{const ic=itIc(x[0],"sm");if(ic)b.prepend(ic)}b.setAttribute("aria-pressed","false");
  b.onclick=()=>{sel=x[0];row.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",c===b?"true":"false"))};row.appendChild(b)});
 const go=document.createElement("button");go.type="button";go.className="btn";go.textContent="보내기";go.disabled=sl.i<0;
 go.onclick=async()=>{const m=$("#pfm");if(!sel){m.style.color="var(--bad)";m.textContent="보낼 선물을 골라야 한다.";return}
  const g=giftSlot(u);if(g.i<0){m.style.color="var(--bad)";m.textContent="이 친구에게는 오늘 선물을 "+GIFT_DAY+"개 모두 보냈다.";return}
  go.disabled=true;
  try{const body={g:sel,ts:{".sv":"timestamp"},n:nmOf()};
   /* gift/ = 일일 한도(규칙). ginbox/ = 받은 함 권위. giftn = COMPAT 벨. 후일 한도 이관 후 gift·giftn 쓰기 제거. */
   await DB.doc("gift/"+u+"/"+UID+"/"+g.i).set(body);
   await DB.doc("ginbox/"+u+"/"+ginSlotId(UID,g.i)).set({g:sel,n:nmOf(),u:UID,ts:{".sv":"timestamp"},slot:g.i});
   try{await DB.doc("giftn/"+u).set({u:UID,g:sel,n:nmOf(),ts:{".sv":"timestamp"}})}catch(e){}
   C.gsl=C.gsl||{};(C.gsl[u]=C.gsl[u]||[])[g.i]=Date.now();
   C.inv[sel]--;titleState();C.stats.gifts=(C.stats.gifts||0)+1;save();checkTitles();m.style.color="var(--mu)";m.textContent="선물을 보냈다. (오늘 남은 선물 "+giftSlot(u).left+" / "+GIFT_DAY+"개)";gb.hidden=true}
  catch(e){const c=String(e&&e.message||e);if(c==="401"||c==="403"){C.gsl=C.gsl||{};(C.gsl[u]=C.gsl[u]||[])[g.i]=Date.now();save()}m.style.color="var(--bad)";m.textContent="지금은 보낼 수 없다. 같은 친구에게는 하루에 "+GIFT_DAY+"개까지 선물할 수 있다. 서버 규칙에 ginbox 쓰기가 열려 있는지도 확인해야 한다."}
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
  if(g==="act"){if(!here&&typeof openRooms==="function")openRooms();else if(!here)ord();else updNav();return}
  if(g==="setting"){if(!here){show("setting");drawSetting()}else updNav();return}
  if(g==="board"){if(curView!=="board"&&curView!=="ntc")board(null);else updNav();return}
  if(g==="record"){if(curView!=="titles"&&curView!=="inbox"&&curView!=="roster")openRec();else updNav();return}
  if(g==="chat"){if(curView!=="chat"){ct="g";chat()}else updNav();return}
  return}
 if(b.dataset.ct){const t=b.dataset.ct;if(curView==="chat"&&ct===t&&!(t==="d"&&peer))return;ct=t;chat();return}
 if(v==="hub")hub();
 if(v==="rooms"&&typeof openRooms==="function")openRooms();
 if(v==="shop")shop();
 if(v==="friends")friends();
 if(v==="board")board(null);
 if(v==="ntc")ntcView();
 if(v==="arena")arena();
 if(v==="ord")ord();
 if(v==="bag")bag();
 if(v==="pact"&&typeof pact==="function")pact();
 if(v==="craft")craft();
 if(v==="growth")growth();
 if(v==="titles")openRec();
 if(v==="inbox")inbox();
 if(v==="roster")roster();
 if(v==="world"&&typeof worldView==="function")worldView();
 if(v==="wev"&&typeof worldEvent==="function")worldEvent();
 if(v==="wqa"&&typeof worldQa==="function")worldQa();
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
function drawSkills(){skDay();const l=$("#bgs"),h=$("#skh");if(!l||!h)return;l.innerHTML="";const mx=mpMax(),left=mpLeft();
 h.textContent="오늘 남은 마력 "+left+" / "+mx+" (준비한 마법 몫 제외). 매일 밤 12시에 회복된다.";const dots=elT("span","mp");for(let i=0;i<mx;i++)dots.appendChild(elT("i",i<left?"":"off"));h.appendChild(dots);
 (C.a||[]).forEach(a=>{const k=SK[a];if(!k)return;const on=!!C.sk.arm[k.id],col=(AT.find(t=>t[0]===a)||[])[1]||"#8a6fd1",w=elT("div","sk"+(on?" on":""));w.style.setProperty("--c",col);
  const tx=elT("div","sk-tx");tx.append(elT("b","",k.nm+" · "+a+" 속성"),elT("small","",k.d+" ("+k.w+"에서 쓰인다)"));
  const b=elT("button","chip",on?"준비 해제":"준비");b.type="button";b.disabled=!on&&left<=0;
  b.onclick=()=>{skDay();if(C.sk.arm[k.id])delete C.sk.arm[k.id];else{if(mpLeft()<=0)return;C.sk.arm[k.id]=true}save();(typeof pact==="function"?pact:bag)(on?k.nm+" 준비를 풀었다.":k.nm+"을(를) 준비했다. 다음 "+k.w+"에서 쓰인다.")};
  w.append(elT("span","sk-ic"),tx,b);l.appendChild(w)})}

$("#tut-re").onclick=()=>{C.tut=C.tut||{};C.tut.got=C.tut.got&&typeof C.tut.got==="object"?C.tut.got:{};C.tut.hide=0;C.tut.fold=0;save();hub()};
function alertBox(t,x){$("#alt").textContent=t;$("#alx").textContent=x;$("#alo").hidden=false;$("#alc").focus({preventScroll:true})}
$("#alc").onclick=()=>{$("#alo").hidden=true};
setInterval(()=>{if(C&&!$("#v-hub").hidden){hubGuard();hubBoss()}},30000);
/* tut 에 fold·hide 만 있고 got 이 없으면(옛 저장) t.got['pf'] 에서 로그인 직후 마을 그리기가 깨진다. */
function drawTut(){const box=$("#tutbox");if(!box||!C)return;C.tut=C.tut||{};C.tut.got=C.tut.got&&typeof C.tut.got==="object"?C.tut.got:{};const t=C.tut;box.innerHTML="";if(t.hide)return;
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

/* 화면 모드: 블랙(기본)과 화이트 중에서 고른다. 고른 값은 이 기기에 기억한다. */
function thmSet(t){const r=document.documentElement;if(t==="light")r.dataset.theme="light";else delete r.dataset.theme;try{localStorage.setItem("mgr_theme",t)}catch(e){}thmDraw()}
function thmDraw(){const lt=document.documentElement.dataset.theme==="light";const m=document.querySelector('meta[name="theme-color"]');if(m)m.content=lt?"#f4efe6":"#0c0a14"}
thmDraw();
