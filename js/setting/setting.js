/* 설정 화면. main.js 다음에 불러야 한다. 메뉴의 설정은 drawSetting 을 그대로 부른다.
   앱 버전은 include.js 의 APP_VER 를 이 브라우저 mgr_ver 에 남긴다. 설정 화면 오른쪽 아래에서 같은 글을 본다. */
function verKeep(){const v=typeof APP_VER==="string"&&APP_VER?APP_VER:"1.0.0";try{localStorage.setItem("mgr_ver",v)}catch(e){}const el=$("#set-ver");if(el)el.textContent="앱 버전 "+v}
verKeep();
let setLinked="";
function pwShow(em){setLinked=em&&!mailDummy(em)?em:"";const b=$("#set-pw");if(b)b.hidden=!setLinked;if(!setLinked){const f=$("#set-pw-box");if(f)f.hidden=true}}
function mailErr(e,act){const s=String(e&&e.message||e),pw=act==="pw";
 if(s==="401"||s==="403")return "서버 규칙이 이메일 기록을 막았다. mail 과 elogin 을 로그인 없이 읽을 수 있게 열어야 한다.";
 if(s.indexOf("EMAIL_EXISTS")===0)return "이미 다른 계정에 쓰이는 이메일이다.";
 if(s.indexOf("INVALID_PASSWORD")===0||s.indexOf("INVALID_LOGIN_CREDENTIALS")===0||s.indexOf("EMAIL_NOT_FOUND")===0)return "비밀번호가 맞지 않다.";
 if(s.indexOf("WEAK_PASSWORD")===0)return "새 비밀번호는 6자 이상이어야 한다.";
 if(s.indexOf("INVALID_EMAIL")===0||s.indexOf("MISSING_EMAIL")===0)return "이메일 형식이 아니다.";
 if(s.indexOf("CREDENTIAL_TOO_OLD_LOGIN_AGAIN")===0)return "로그인한 지 오래되었다. 다시 로그인한 뒤에 "+(pw?"바꾸자.":"연동하자.");
 if(s.indexOf("TOO_MANY_ATTEMPTS")===0)return "시도가 너무 많다. 잠시 뒤에 다시 하자.";
 return (pw?"비밀번호를 바꾸지 못했다. ":"연동하지 못했다. ")+"("+s+")"}
async function mailReauth(id,pw,extra){const emails=[],add=e=>{e=String(e||"").trim().toLowerCase();if(e&&emails.indexOf(e)<0)emails.push(e)};if(id)add(EM(id));add(AUTH.mail);add(extra);
 let last;for(const e of emails){try{const j=await idt("signInWithPassword",{email:e,password:pw,returnSecureToken:true});AUTH.tok=j.idToken;AUTH.rt=j.refreshToken;AUTH.mail=j.email||e;keep("mgr_rt",AUTH.rt);return j}catch(err){last=err}}
 throw last||new Error("비밀번호가 맞지 않다.")}
async function mailNote(){const n=$("#set-em");if(!n||!AUTH.uid){pwShow("");return}
 n.textContent="연동 상태를 확인하는 중이다.";
 if(!AUTH.tok||!AUTH.key){n.textContent="로그인 정보가 없어 연동 상태를 확인하지 못했다.";pwShow("");return}
 const id=mailId();let linked="";
 if(id&&DB){try{const s=await DB.doc("mail/"+id).get();if(s.exists&&typeof s.data()==="string")linked=s.data()}catch(e){}}
 try{const u=(await idt("lookup",{idToken:AUTH.tok})).users[0];AUTH.mail=u&&u.email||AUTH.mail||"";if(!mailId()&&u&&/^[A-Za-z0-9_]{3,20}$/.test(u.displayName||"")){AUTH.name=String(u.displayName).toLowerCase();keep("mgr_id",AUTH.name)}}catch(e){}
 const box=$("#set-mail-idbox");if(box)box.hidden=!!mailId();
 if(linked&&!mailDummy(linked))n.textContent="연동된 이메일: "+linked+". 아이디로도, 이 이메일로도 로그인할 수 있다.";
 else if(AUTH.mail&&!mailDummy(AUTH.mail))n.textContent="계정 주소가 이메일로 바뀌어 아이디 로그인이 막혀 있다. 아래에서 다시 연동하면 아이디 로그인이 돌아온다.";
 else n.textContent="아이디로 로그인한다. 이메일을 연동하면 그 주소로도 들어올 수 있고, 아이디 로그인은 그대로다.";
 pwShow((linked&&!mailDummy(linked)&&linked)||(AUTH.mail&&!mailDummy(AUTH.mail)&&AUTH.mail)||"")}
function drawSetting(){
 const lt=document.documentElement.dataset.theme==="light",on=!!AUTH.uid;
 $("#set-thm").textContent=lt?"지금은 화이트 모드다.":"지금은 블랙 모드다.";
 $("#set-theme").textContent=lt?"☾ 블랙 모드":"☀ 화이트 모드";
 $("#set-note").textContent=on?"로그인한 계정이다. 로그아웃하면 이 브라우저의 로그인만 풀린다.":"혼자 하기에서는 기록이 이 브라우저에만 남는다.";
 $("#set-out").hidden=!on;
 $("#set-mail").hidden=!on;
 $("#set-em").hidden=!on;
 $("#set-mail-box").hidden=true;
 $("#set-pw").hidden=true;
 $("#set-pw-box").hidden=true;
 setLinked="";
 $("#setm").textContent="";
 verKeep();
 if(on)mailNote();
}
$("#set-theme").onclick=()=>{thmSet(document.documentElement.dataset.theme==="light"?"dark":"light");drawSetting()};
$("#set-srv").onclick=()=>{const u=prompt("Firebase Realtime Database 주소를 입력한다.\n예: https://프로젝트이름-default-rtdb.firebaseio.com");if(u&&/^https:\/\//.test(u.trim())){try{localStorage.setItem("mgr_fb",u.trim())}catch(e){}location.reload()}else if(u)$("#setm").textContent="주소는 https:// 로 시작해야 한다."};
$("#set-mail").onclick=()=>{const b=$("#set-mail-box");if(!b||!AUTH.uid)return;b.hidden=!b.hidden;if(!b.hidden){$("#set-pw-box").hidden=true;const box=$("#set-mail-idbox");if(box)box.hidden=!!mailId();(mailId()?$("#set-mail-em"):$("#set-mail-id")).focus()}};
$("#set-mail-box").onsubmit=async e=>{e.preventDefault();const m=$("#setm"),btn=$("#set-mail-go"),em=mailOpt($("#set-mail-em").value),pw=$("#set-mail-pw").value,typed=($("#set-mail-id").value||"").trim();m.textContent="";
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
 btn.disabled=false};
$("#set-pw").onclick=()=>{const b=$("#set-pw-box");if(!b||!AUTH.uid||!setLinked)return;b.hidden=!b.hidden;if(!b.hidden){$("#set-mail-box").hidden=true;$("#set-pw-old").focus()}};
$("#set-pw-box").onsubmit=async e=>{e.preventDefault();const m=$("#setm"),btn=$("#set-pw-go"),old=$("#set-pw-old").value,nw=$("#set-pw-new").value,nw2=$("#set-pw-new2").value;m.textContent="";
 if(!AUTH.uid||!setLinked){m.textContent="이메일을 연동한 계정만 비밀번호를 바꿀 수 있다.";return}
 if(old.length<6){m.textContent="지금 비밀번호를 적어야 한다.";return}
 if(nw.length<6){m.textContent="새 비밀번호는 6자 이상이어야 한다.";return}
 if(nw!==nw2){m.textContent="새 비밀번호가 서로 다르다.";return}
 if(nw===old){m.textContent="새 비밀번호는 지금 것과 달라야 한다.";return}
 btn.disabled=true;
 try{await mailReauth(mailId(),old,setLinked);const j=await idt("update",{idToken:AUTH.tok,password:nw,returnSecureToken:true});if(j.idToken){AUTH.tok=j.idToken;if(j.refreshToken){AUTH.rt=j.refreshToken;keep("mgr_rt",AUTH.rt)}}
  $("#set-pw-old").value="";$("#set-pw-new").value="";$("#set-pw-new2").value="";$("#set-pw-box").hidden=true;
  m.textContent="비밀번호를 바꿨다. 다음 로그인부터 새 비밀번호를 쓴다."}
 catch(err){m.textContent=mailErr(err,"pw")}
 btn.disabled=false};
$("#set-out").onclick=()=>{const o=$("#b-out");if(o)o.click()};
