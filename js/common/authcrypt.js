/* 계정 비밀번호를 통신에 실을 때의 처리. data/game.js 다음에, main.js 보다 먼저 불러야 한다.
   Firebase Identity Toolkit 요청 본문에 사용자가 친 평문을 넣지 않는다.
   Web Crypto 의 PBKDF2 로 고정 솔트·횟수로 파생한 문자열만 보낸다. 파생에 실패하면 평문으로 보내지 않고 멈춘다.
   예전에 평문으로 만든 계정은 idtWithPw 가 한 번만 평문으로 열어 본 뒤, 같은 세션에서 파생 비밀번호로 바꿔 둔다. */

/* salt: 앱 공통 솔트. iter: PBKDF2 반복. ver: 앞에 붙여 옛 평문과 구분한다. 숫자·문자열만 고치면 바뀐다. */
const PW_WIRE={salt:"magical-growth-pw-v1",iter:120000,ver:"mg1"};

/* 가입·비밀번호 변경용 무결성. 빈 글자면 통과, 아니면 안내 문장. */
function pwCheck(pw){const t=String(pw||"");
 if(t.length<8)return "비밀번호는 8자 이상이어야 합니다.";
 if(t.length>16)return "비밀번호는 16자 이하여야 합니다.";
 if(/\s/.test(t))return "비밀번호에 공백을 넣을 수 없습니다.";
 if(!/[A-Za-z]/.test(t)||!/[0-9]/.test(t))return "비밀번호에 영문과 숫자를 함께 넣어야 합니다.";
 return ""}

function pwBadCred(e){return /INVALID_LOGIN_CREDENTIALS|EMAIL_NOT_FOUND|INVALID_PASSWORD/.test(String(e&&e.message||e))}

/* 통신용 비밀번호. 평문을 돌려주지 않는다. crypto.subtle 이 없으면 오류. */
async function pwWire(plain){if(!(window.crypto&&crypto.subtle&&crypto.subtle.importKey&&crypto.subtle.deriveBits))throw new Error("CRYPTO_UNAVAILABLE");
 const t=String(plain||"").normalize("NFC");if(!t)throw new Error("MISSING_PASSWORD");
 const enc=new TextEncoder(),key=await crypto.subtle.importKey("raw",enc.encode(t),{name:"PBKDF2"},false,["deriveBits"]);
 const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:enc.encode(PW_WIRE.salt),iterations:PW_WIRE.iter,hash:"SHA-256"},key,256);
 const b64=btoa(String.fromCharCode.apply(null,Array.from(new Uint8Array(bits)))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
 return PW_WIRE.ver+"$"+b64}

/* Identity Toolkit 에 비밀번호를 실어 보낸다. path 는 signUp / signInWithPassword / update.
   update 는 body 에 idToken 과 함께 password 칸만 파생값으로 바꾼다.
   로그인·재인증에서 파생값이 거절되면(옛 평문 계정) 한 번만 평문으로 연 뒤, update 로 파생 비밀번호로 옮긴다. */
async function idtWithPw(path,body,plain,opt){opt=opt||{};const wire=await pwWire(plain),payload=Object.assign({},body,{password:wire});
 try{return await idt(path,payload)}
 catch(e){if(path!=="signInWithPassword"||opt.noLegacy||!pwBadCred(e))throw e}
 const legacy=await idt("signInWithPassword",Object.assign({},body,{password:String(plain)}));
 try{const u=await idt("update",{idToken:legacy.idToken,password:wire,returnSecureToken:true});
  if(u&&u.idToken){legacy.idToken=u.idToken;if(u.refreshToken)legacy.refreshToken=u.refreshToken}}
 catch(x){}
 return legacy}
