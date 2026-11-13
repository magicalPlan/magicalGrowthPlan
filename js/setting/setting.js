/* 설정 화면. main.js 다음에 불러야 한다. 메뉴의 설정은 drawSetting 을 그대로 부른다.
   앱 버전은 include.js 의 APP_VER 를 이 브라우저 mgr_ver 에 남긴다. 설정 화면 오른쪽 아래에서 같은 글을 본다. */
function verKeep(){const v=typeof APP_VER==="string"&&APP_VER?APP_VER:"1.0.0";try{localStorage.setItem("mgr_ver",v)}catch(e){}const el=$("#set-ver");if(el)el.textContent="앱 버전 "+v}
verKeep();
let setLinked="";
function pwShow(em){setLinked=em&&!mailDummy(em)?em:"";const b=$("#set-pw");if(b)b.hidden=!setLinked;if(!setLinked){const f=$("#set-pw-box");if(f)f.hidden=true}}
function mailErr(e,act){const s=String(e&&e.message||e),pw=act==="pw",leave=act==="leave";
 if(s==="401"||s==="403")return leave?"서버 규칙이 계정 기록 삭제를 막았다.":"서버 규칙이 이메일 기록을 막았다. mail 과 elogin 을 로그인 없이 읽을 수 있게 열어야 한다.";
 if(s.indexOf("EMAIL_EXISTS")===0)return "이미 다른 계정에 쓰이는 이메일이다.";
 if(s.indexOf("INVALID_PASSWORD")===0||s.indexOf("INVALID_LOGIN_CREDENTIALS")===0||s.indexOf("EMAIL_NOT_FOUND")===0)return "비밀번호가 맞지 않다.";
 if(s.indexOf("WEAK_PASSWORD")===0)return "새 비밀번호는 8자 이상·영문·숫자가 필요하다.";
 if(s==="CRYPTO_UNAVAILABLE"||s.indexOf("CRYPTO_UNAVAILABLE")===0)return "이 브라우저에서는 비밀번호를 안전하게 실을 수 없다. 최신 브라우저로 다시 하자.";
 if(s.indexOf("INVALID_EMAIL")===0||s.indexOf("MISSING_EMAIL")===0)return "이메일 형식이 아니다.";
 if(s.indexOf("CREDENTIAL_TOO_OLD_LOGIN_AGAIN")===0)return "로그인한 지 오래되었다. 다시 로그인한 뒤에 "+(leave?"탈퇴하자.":pw?"바꾸자.":"연동하자.");
 if(s.indexOf("TOO_MANY_ATTEMPTS")===0)return "시도가 너무 많다. 잠시 뒤에 다시 하자.";
 return (leave?"회원 탈퇴를 끝내지 못했다. ":pw?"비밀번호를 바꾸지 못했다. ":"연동하지 못했다. ")+"("+s+")"}
async function mailReauth(id,pw,extra){const emails=[],add=e=>{e=String(e||"").trim().toLowerCase();if(e&&emails.indexOf(e)<0)emails.push(e)};if(id)add(EM(id));add(AUTH.mail);add(extra);
 let last;for(const e of emails){try{const j=await idtWithPw("signInWithPassword",{email:e,returnSecureToken:true},pw);AUTH.tok=j.idToken;AUTH.rt=j.refreshToken;AUTH.mail=j.email||e;keep("mgr_rt",AUTH.rt);return j}catch(err){last=err}}
 throw last||new Error("비밀번호가 맞지 않다.")}
async function mailNote(){const n=$("#set-em");if(!n||!AUTH.uid){pwShow("");return}
 n.textContent="연동 상태를 확인하는 중이다.";
 if(!AUTH.tok||!AUTH.key){n.textContent="로그인 정보가 없어 연동 상태를 확인하지 못했다.";pwShow("");return}
 const id=mailId();let linked="";
 if(id&&DB){try{const s=await DB.doc("mail/"+id).get();if(s.exists&&typeof s.data()==="string")linked=s.data()}catch(e){}}
 try{const u=(await idt("lookup",{idToken:AUTH.tok})).users[0];AUTH.mail=u&&u.email||AUTH.mail||"";if(!mailId()&&u&&/^[A-Za-z0-9_]{3,20}$/.test(u.displayName||"")){AUTH.name=String(u.displayName).toLowerCase();keep("mgr_id",AUTH.name)}}catch(e){}
 const box=$("#set-mail-idbox");if(box)box.hidden=!!mailId();
 if(linked&&!mailDummy(linked))n.textContent="연동된 이메일: "+linked+". 아이디로도, 이 이메일로도 로그인할 수 있고, 비밀번호를 잊으면 이 주소로 초기화할 수 있다.";
 else if(AUTH.mail&&!mailDummy(AUTH.mail))n.textContent="계정 주소는 "+AUTH.mail+" 이다. 아래에서 연동을 마치면 아이디 로그인과 비밀번호 찾기도 이 주소를 쓴다.";
 else n.textContent="아이디로 로그인한다. 이메일을 연동하면 그 주소로도 들어올 수 있고, 비밀번호를 잊었을 때 초기화 메일을 받을 수 있다.";
 pwShow((linked&&!mailDummy(linked)&&linked)||(AUTH.mail&&!mailDummy(AUTH.mail)&&AUTH.mail)||"")}
function drawSetting(){
 const lt=document.documentElement.dataset.theme==="light",on=!!AUTH.uid;
 $("#set-thm").textContent=lt?"지금은 화이트 모드다.":"지금은 블랙 모드다.";
 $("#set-theme").textContent=lt?"☾ 블랙 모드":"☀ 화이트 모드";
 $("#set-note").textContent=on?"로그인한 계정이다. 로그아웃하면 이 브라우저의 로그인만 풀린다.":"로그인해야 기록이 계정에 남는다.";
 $("#set-out").hidden=!on;
 $("#set-leave").hidden=!on;
 $("#set-mail").hidden=!on;
 $("#set-em").hidden=!on;
 $("#set-mail-box").hidden=true;
 $("#set-pw").hidden=true;
 $("#set-pw-box").hidden=true;
 setLinked="";
 $("#setm").textContent="";
 verKeep();
 oddsDraw();
 if(on)mailNote();
}
/* 회원 탈퇴: 비밀번호로 다시 확인한 뒤 Firebase 계정과 이 계정의 서버 기록을 지운다. */
async function leaveWipe(){const uid=AUTH.uid,id=mailId();
 if(DB&&uid){const del=p=>{try{return DB.doc(p).delete()}catch(e){return Promise.resolve()}};
  await Promise.allSettled([del("accounts/"+uid),del("players/"+uid),del("who/"+uid),del("raid/"+uid),del("wboss/pic/"+uid),del("wboss/picm/"+uid)]);
  if(id){let linked="";try{const s=await DB.doc("mail/"+id).get();if(s.exists&&typeof s.data()==="string")linked=s.data()}catch(e){}
   try{await DB.doc("mail/"+id).delete()}catch(e){}
   if(linked&&!mailDummy(linked)){try{await DB.doc("elogin/"+mailKey(linked)).delete()}catch(e){}}}}
 try{["mgr_rt","mgr_id","mgr"].forEach(k=>localStorage.removeItem(k));if(uid){localStorage.removeItem("mgr_jc_"+uid);localStorage.removeItem("mgr_bk_"+uid);localStorage.removeItem("mgr_pend_"+uid);localStorage.removeItem("mgr_rr_"+uid)}}catch(e){}}
async function leaveAccount(){const m=$("#setm");if(m)m.textContent="";
 if(!AUTH.uid){if(m)m.textContent="로그인한 뒤에 탈퇴할 수 있다.";return}
 if(!confirm("정말 회원 탈퇴를 진행하시겠습니까?"))return;
 const pw=prompt("비밀번호를 입력해주십시오.");if(pw==null)return;
 if(!String(pw).length){if(m)m.textContent="비밀번호를 적어야 한다.";return}
 const btn=$("#set-leave");if(btn)btn.disabled=true;
 try{await mailReauth(mailId(),pw,setLinked||AUTH.mail||"");
  await leaveWipe();
  await idt("delete",{idToken:AUTH.tok});
  AUTH.uid=null;AUTH.tok=null;AUTH.rt="";AUTH.mail="";AUTH.name="";
  alert("회원 탈퇴에 성공하였습니다.");
  location.reload()}
 catch(err){if(m)m.textContent=mailErr(err,"leave");if(btn)btn.disabled=false}}
function oddsTxt(p){const n=Math.round(Number(p)*1e6)/10000;if(!isFinite(n))return "-";return n.toFixed(4).replace(/0+$/,"").replace(/\.$/,"")+"%"}
/* 2열(항목|확률) × n행 표. pairs: [[라벨, 0~1 확률], ...] */
function oddsTable(pairs,heads){const t=elT("table","set-odd-table"),thead=elT("thead"),hr=elT("tr"),tb=elT("tbody");
 hr.append(elT("th","",(heads&&heads[0])||"항목"),elT("th","",(heads&&heads[1])||"확률"));thead.appendChild(hr);t.appendChild(thead);
 (pairs||[]).forEach(([lab,p])=>{if(!(Number(p)>0))return;const tr=elT("tr");tr.append(elT("td","",lab),elT("td","",oddsTxt(p)));tb.appendChild(tr)});
 t.appendChild(tb);return t}
/* 수상한 상인: 등급 확률 + (등급×균등) 보상별 확률. merchant.js 의 SHADY_* 를 읽는다. */
function oddsShady(){if(typeof SHADY_TIER_P==="undefined"||typeof SHADY_POOL==="undefined")return null;
 const box=elT("div","set-odd-box"),cost=typeof SHADY_COST!=="undefined"?SHADY_COST:2000,n=typeof SHADY_N!=="undefined"?SHADY_N:10;
 box.append(elT("p","set-odd-name","수상한 상인 상자"),elT("p","hint","상점 「수상한 상인」. "+n+"회 열기(총 "+cost+"골드). 칸마다 독립으로 등급을 뽑고, 같은 등급 안 보상은 균등하다."));
 box.appendChild(elT("p","set-odd-sub","등급 확률"));
 box.appendChild(oddsTable(SHADY_TIER_P.map((p,i)=>[(i+1)+"등급",p]),["등급","확률"]));
 const items=[];SHADY_POOL.forEach((pool,ti)=>{const tp=Number(SHADY_TIER_P[ti])||0,len=(pool&&pool.length)||1;
  (pool||[]).forEach(r=>{const nm=typeof shadyName==="function"?shadyName(r):(r&&r.id)||"?";items.push([nm+(r&&r.n?" ×"+r.n:"")+" · "+(ti+1)+"등급",tp/len])})});
 box.appendChild(elT("p","set-odd-sub","보상별 확률"));
 box.appendChild(oddsTable(items,["보상","확률"]));return box}
function oddsDraw(){const box=$("#set-odds");if(!box||typeof PETS==="undefined"||typeof PET_RATE==="undefined"||typeof PET_EV==="undefined")return;box.innerHTML="";
 const rate={};PET_RATE.forEach(([k,p])=>{rate[k]=p});
 const egg=elT("div","set-odd-box");egg.append(elT("p","set-odd-name","사역마의 알"),elT("p","hint","품으면 1시간 뒤에 희귀도가 정해진다. 같은 희귀도 안에서는 종마다 같다."));
 egg.appendChild(oddsTable([[PET_RARE[1],rate[1]],[PET_RARE[2],rate[2]],[PET_RARE[3],rate[3]]],["희귀도","확률"]));
 const leg=PET_EV.leg||0,lim=PET_EV.lim||0,rare=PET_EV.rare||0,common=Math.max(0,1-leg-lim-rare),limN=Object.values(PETS).filter(x=>x[3]===4).length||1,ev=elT("div","set-odd-box");
 ev.append(elT("p","set-odd-name",PET_EV.ic+" "+PET_EV.nm),elT("p","hint","기간 한정은 "+limN+"마리가 같은 확률(각 "+oddsTxt(lim/limN)+")이다. 그다음은 희귀, 나머지는 일반이다."));
 ev.appendChild(oddsTable([[PET_RARE[3],leg],[PET_RARE[4],lim],[PET_RARE[2],rare],[PET_RARE[1],common]],["희귀도","확률"]));
 box.append(egg,ev);const sh=oddsShady();if(sh)box.appendChild(sh)}
(function(){const d=$("#set-odds-fold");if(!d)return;const m=d.querySelector(".set-fold-mark");
 d.addEventListener("toggle",()=>{if(m)m.textContent=d.open?"접기":"펼치기"})})();
(function(){const bindDialog=(openId,dialogId)=>{const open=$("#"+openId),dialog=$("#"+dialogId);if(!open||!dialog)return;
 open.onclick=()=>{if(!dialog.open)dialog.showModal()};
 const close=dialog.querySelector(".set-dialog-close");if(close)close.onclick=()=>dialog.close();
 dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close()})};
 bindDialog("set-terms-open","set-terms-dialog");bindDialog("set-privacy-open","set-privacy-dialog");
 const d=$("#set-license-fold");if(d){const m=d.querySelector(".set-fold-mark");d.addEventListener("toggle",()=>{if(m)m.textContent=d.open?"접기":"펼치기"})}})();
{const b=$("#set-theme");if(b)b.onclick=()=>{thmSet(document.documentElement.dataset.theme==="light"?"dark":"light");drawSetting()}}
{const b=$("#set-srv");if(b)b.onclick=()=>{const u=prompt("Firebase Realtime Database 주소를 입력한다.\n예: https://프로젝트이름-default-rtdb.firebaseio.com");if(u&&/^https:\/\//.test(u.trim())){try{localStorage.setItem("mgr_fb",u.trim())}catch(e){}location.reload()}else if(u)$("#setm").textContent="주소는 https:// 로 시작해야 한다."}}
{const b=$("#set-mail");if(b)b.onclick=()=>{const box=$("#set-mail-box");if(!box||!AUTH.uid)return;box.hidden=!box.hidden;if(!box.hidden){$("#set-pw-box").hidden=true;const idb=$("#set-mail-idbox");if(idb)idb.hidden=!!mailId();(mailId()?$("#set-mail-em"):$("#set-mail-id")).focus()}}}
{const f=$("#set-mail-box");if(f)f.onsubmit=async e=>{e.preventDefault();const m=$("#setm"),btn=$("#set-mail-go"),em=mailOpt($("#set-mail-em").value),pw=$("#set-mail-pw").value,typed=($("#set-mail-id").value||"").trim();m.textContent="";
 if(em===null||!em){m.textContent=em===null?"이메일 형식이 아니다.":"받을 수 있는 이메일을 적어야 한다.";return}
 if(pw.length<6){m.textContent="비밀번호를 적어야 한다.";return}
 const id=mailId()||(/^[A-Za-z0-9_]{3,20}$/.test(typed)?typed.toLowerCase():"");
 if(!id){m.textContent="가입할 때 쓴 아이디를 적어야 한다.";$("#set-mail-idbox").hidden=false;return}
 btn.disabled=true;
 try{await mailReauth(id,pw,em);await mailSave(id,em);
  $("#set-mail-pw").value="";$("#set-mail-box").hidden=true;
  m.textContent=em+" 을 연동했다. 아이디로도, 이 이메일로도 로그인할 수 있다.";
  mailNote()}
 catch(err){m.textContent=mailErr(err)}
 btn.disabled=false}}
{const b=$("#set-pw");if(b)b.onclick=()=>{const box=$("#set-pw-box");if(!box||!AUTH.uid||!setLinked)return;box.hidden=!box.hidden;if(!box.hidden){$("#set-mail-box").hidden=true;$("#set-pw-old").focus()}}}
{const f=$("#set-pw-box");if(f)f.onsubmit=async e=>{e.preventDefault();const m=$("#setm"),btn=$("#set-pw-go"),old=$("#set-pw-old").value,nw=$("#set-pw-new").value,nw2=$("#set-pw-new2").value;m.textContent="";
 if(!AUTH.uid||!setLinked){m.textContent="이메일을 연동한 계정만 비밀번호를 바꿀 수 있다.";return}
 if(old.length<6){m.textContent="지금 비밀번호를 적어야 한다.";return}
 const bad=pwCheck(nw);if(bad){m.textContent=bad;return}
 if(nw!==nw2){m.textContent="새 비밀번호가 서로 다르다.";return}
 if(nw===old){m.textContent="새 비밀번호는 지금 것과 달라야 한다.";return}
 btn.disabled=true;
 try{await mailReauth(mailId(),old,setLinked);const j=await idtWithPw("update",{idToken:AUTH.tok,returnSecureToken:true},nw,{noLegacy:true});if(j.idToken){AUTH.tok=j.idToken;if(j.refreshToken){AUTH.rt=j.refreshToken;keep("mgr_rt",AUTH.rt)}}
  $("#set-pw-old").value="";$("#set-pw-new").value="";$("#set-pw-new2").value="";$("#set-pw-box").hidden=true;
  m.textContent="비밀번호를 바꿨다. 다음 로그인부터 새 비밀번호를 쓴다."}
 catch(err){m.textContent=mailErr(err,"pw")}
 btn.disabled=false}}
{const b=$("#set-out");if(b)b.onclick=()=>logOut()}
{const b=$("#set-leave");if(b)b.onclick=()=>leaveAccount()}
