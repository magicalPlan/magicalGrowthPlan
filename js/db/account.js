/* 캐릭터 기록에서 바뀐 칸만 반영한다. 계정 문서 전체를 다시 쓰지 않는다.
   경로는 캐릭터 기준이다. 예: "stats/chats", "dml/상대id". */
function apiApplyFields(obj,fields){
 Object.keys(fields||{}).forEach(path=>{
  const parts=String(path).split("/");let o=obj;
  for(let i=0;i<parts.length-1;i++){const k=parts[i];if(!o[k]||typeof o[k]!=="object")o[k]={};o=o[k]}
  o[parts[parts.length-1]]=fields[path]})}
/* RTDB ServerValue.increment. 골드처럼 동시 증감이 겹쳐야 하는 칸에 쓴다. */
const apiInc=n=>({".sv":{"increment":Math.trunc(Number(n)||0)}});
/* 바뀐 칸만 PATCH.
   fields = 절대값으로 쓸 칸(가방·장착 등). 로컬 C 에 반영 후 그대로 보낸다.
   inc = {gd:-2000} 처럼 증감만 보낼 칸. 로컬 C 는 호출 쪽에서 이미 맞춰 두고, 서버에는 increment 만 나간다.
   (절대 gd 로 덮으면 다른 탭·서버 지급과 레이스가 난다.)
   성공 시 accBase 는 절대 fields + inc 대상은 지금 C 값으로 맞춰, 이어지는 saveCloud diff 가 겹치지 않게 한다. */
function apiAccountWrite(fields,inc){
 if(!C)return Promise.resolve();
 fields=fields&&typeof fields==="object"?fields:{};
 inc=inc&&typeof inc==="object"?inc:null;
 apiApplyFields(C,fields);
 if(!AUTH.uid||LOCAL||!DB){
  try{localStorage.setItem("mgr",JSON.stringify(C))}catch(e){}
  return Promise.resolve()}
 const body={};
 Object.keys(fields).forEach(k=>{
  if(inc&&Object.prototype.hasOwnProperty.call(inc,k))return;
  body["c/"+k]=fields[k]});
 Object.keys(inc||{}).forEach(k=>{const d=Math.trunc(Number(inc[k])||0);if(d)body["c/"+k]=apiInc(d)});
 if(!Object.keys(body).length)return Promise.resolve();
 if(Object.keys(fields).some(k=>k==="lv"||k==="ex"||k==="xv")||(inc&&(inc.lv!=null||inc.ex!=null||inc.xv!=null))){
  body["prog/lv"]=C.lv||1;body["prog/ex"]=C.ex||0;body["prog/xv"]=C.xv||2}
 return apiPatch("accounts/"+AUTH.uid,body).then(()=>{
  try{if(typeof accBase==="undefined"||!accBase)return;
   const copy={};
   Object.keys(fields).forEach(k=>{if(inc&&Object.prototype.hasOwnProperty.call(inc,k))return;
    const v=fields[k];copy[k]=v&&typeof v==="object"?JSON.parse(JSON.stringify(v)):v});
   apiApplyFields(accBase,copy);
   /* increment 칸은 서버가 더하므로, 기준점은 로컬 최종 절대값으로 맞춘다. */
   Object.keys(inc||{}).forEach(k=>{
    const parts=String(k).split("/");let o=C,a=accBase;
    for(let i=0;i<parts.length-1;i++){const p=parts[i];if(!a[p]||typeof a[p]!=="object")a[p]={};a=a[p];o=o&&o[p]}
    const last=parts[parts.length-1];a[last]=o?o[last]:a[last]})}catch(e){}})}
