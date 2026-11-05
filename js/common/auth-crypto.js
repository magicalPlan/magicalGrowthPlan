/* 회원가입·로그인 통신용 암호·해시. main.js 보다 먼저 불러야 한다.
   Identity Toolkit 과 서버 규칙이 쓰는 값은 여기 함수만 거친다. */

/* 통신용 암호화: 회원가입·로그인에서 비밀번호를 Identity Toolkit 으로 보내기 직전에 거친다.
   브라우저→서버 구간은 HTTPS 로 보호되고, 이 함수가 보낼 값을 한곳에서 만든다. */
async function authEncrypt(pw){
 const t=String(pw||"");
 if(!t)return "";
 if(!(window.crypto&&crypto.subtle))return t;
 const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("mgr.pw\0"+t.normalize("NFC")));
 return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
}

/* 비밀 코드처럼 평문을 서버·클라이언트에서 같은 지문으로 맞춰 볼 때 쓴다. */
async function authDigest(v){
 const t=String(v||"").trim().normalize("NFC");
 if(!t||!(window.crypto&&crypto.subtle))return "";
 const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t));
 return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
