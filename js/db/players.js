/* 사진 없는 명부(who). players 전체에는 프로필 사진이 들어 있어 받지 않는다.
   대련 검색과 이벤트 순위, 그리고 등록자 탭에서 이름을 입력했을 때만 명부를 받는다.
   보스 체력은 전투력 1위 한 명만 받는다. 명부는 5분 동안 다시 받지 않는다. */
let PLC=null,PLT=0,PLP=null;
const PL_TTL=300000;
function plAll(maxAge){if(PLC&&Date.now()-PLT<(maxAge==null?PL_TTL:maxAge))return Promise.resolve(PLC);if(PLP)return PLP;
 PLP=once(DB.collection("who")).then(sn=>{PLC=sn;PLT=Date.now();PLP=null;return sn},e=>{PLP=null;throw e});return PLP}
function plSince(since){return once(DB.collection("who").by("on").from(Number(since)||0))}
/* 등록자 탭의 이름 검색. 글자가 이름 어딘가에 들어간 사람을 사진 없는 명부에서 고른다.
   목록을 열 때는 부르지 않고, 이름을 입력했을 때만 부른다. */
function apiRosterFind(q){q=String(q||"").trim().toLowerCase();if(!q||!DB)return Promise.resolve([]);
 return plAll().then(sn=>{const L=[];(sn.docs||[]).forEach(d=>{const p=d.data()||{},n=String(p.n||"");if(!n||!n.toLowerCase().includes(q))return;L.push(Object.assign({u:d.id},p))});return L})}
let WINC=null,WINSsince=Infinity,WINT=0,WINP=null;
/* 최근 접속 구간. 이미 더 넓은 기간을 받아 두었으면 그대로 쓴다. 끝나면 onFresh 를 한 번 부른다. */
function plWindow(since,onFresh){since=Number(since)||0;if(WINC&&WINSsince<=since&&Date.now()-WINT<PL_TTL)return WINC;if(WINP)return WINC&&WINSsince<=since?WINC:null;
 const want=since;WINP=plSince(want).then(sn=>{WINP=null;WINC=sn;WINSsince=want;WINT=Date.now();try{onFresh&&onFresh()}catch(e){}return sn},()=>{WINP=null;return null});
 return null}
let TOPC=null,TOPT=0,TOPP=null;
/* 전투력 1위. players 는 pw 순 찾기가 되어 있어 맨 끝 한 명만 받는다. 5분 동안 다시 쓰지 않는다. */
function plTop(){if(TOPC&&Date.now()-TOPT<PL_TTL)return Promise.resolve(TOPC);if(TOPP)return TOPP;
 TOPP=once(DB.collection("players").by("pw").limit(1)).then(sn=>{const d=(sn.docs||[])[0],p=d?d.data()||{}:{};TOPC={u:d?d.id:"",pw:Math.max(0,Number(p.pw)||0)};TOPT=Date.now();TOPP=null;return TOPC},()=>{TOPP=null;return null});return TOPP}
function plClear(){PLC=null;PLT=0;WINC=null;WINSsince=Infinity;WINT=0;TOPC=null;TOPT=0;TOPP=null}
