/* 등록자 목록 캐시. 프로필 사진이 들어 있어 무겁다. 기본 5분 동안 다시 받지 않고 함께 쓴다. */
let PLC=null,PLT=0,PLP=null;
const PL_TTL=300000;
function plAll(maxAge){if(PLC&&Date.now()-PLT<(maxAge==null?PL_TTL:maxAge))return Promise.resolve(PLC);if(PLP)return PLP;
 PLP=once(DB.collection("players")).then(sn=>{PLC=sn;PLT=Date.now();PLP=null;return sn},e=>{PLP=null;throw e});return PLP}
