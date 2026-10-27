/* 사진 없는 명부(who). players 전체에는 프로필 사진이 들어 있어 받지 않는다.
   대련 검색과 이벤트 순위만 명부 전체를 받는다. 접속 중·보스 전투력은 on 이 그 기간 안인 사람만 받는다. */
let PLC=null,PLT=0,PLP=null;
const PL_TTL=300000;
function plAll(maxAge){if(PLC&&Date.now()-PLT<(maxAge==null?PL_TTL:maxAge))return Promise.resolve(PLC);if(PLP)return PLP;
 PLP=once(DB.collection("who")).then(sn=>{PLC=sn;PLT=Date.now();PLP=null;return sn},e=>{PLP=null;throw e});return PLP}
function plSince(since){return once(DB.collection("who").by("on").from(Number(since)||0))}
let WINC=null,WINSsince=Infinity,WINT=0,WINP=null;
/* 보스 체력처럼 최근 접속만 필요할 때. 이미 더 넓은 기간을 받아 두었으면 그대로 쓴다. 끝나면 onFresh 를 한 번 부른다. */
function plWindow(since,onFresh){since=Number(since)||0;if(WINC&&WINSsince<=since&&Date.now()-WINT<PL_TTL)return WINC;if(WINP)return WINC&&WINSsince<=since?WINC:null;
 const want=since;WINP=plSince(want).then(sn=>{WINP=null;WINC=sn;WINSsince=want;WINT=Date.now();try{onFresh&&onFresh()}catch(e){}return sn},()=>{WINP=null;return null});
 return null}
function plClear(){PLC=null;PLT=0;WINC=null;WINSsince=Infinity;WINT=0}
