/* 캐릭터 기록에서 바뀐 칸만 반영한다. 계정 문서 전체를 다시 쓰지 않는다.
   경로는 캐릭터 기준이다. 예: "stats/chats", "dml/상대id". */
function apiApplyFields(obj,fields){
 Object.keys(fields||{}).forEach(path=>{
  const parts=String(path).split("/");let o=obj;
  for(let i=0;i<parts.length-1;i++){const k=parts[i];if(!o[k]||typeof o[k]!=="object")o[k]={};o=o[k]}
  o[parts[parts.length-1]]=fields[path]})
}
/* 바뀐 칸만 PATCH. 로컬 C 에 먼저 반영한 뒤 서버로 보낸다.
   성공 시 accBase 도 같은 칸을 맞춰, 이어지는 saveCloud increment/diff 가 겹치지 않게 한다. */
function apiAccountWrite(fields){
 if(!C||!fields)return Promise.resolve();
 apiApplyFields(C,fields);
 if(!AUTH.uid||LOCAL||!DB){
  try{localStorage.setItem("mgr",JSON.stringify(C))}catch(e){}
  return Promise.resolve()}
 const body={};Object.keys(fields).forEach(k=>{body["c/"+k]=fields[k]});
 if(Object.keys(fields).some(k=>k==="lv"||k==="ex"||k==="xv")){
  body["prog/lv"]=C.lv||1;body["prog/ex"]=C.ex||0;body["prog/xv"]=C.xv||2}
 return apiPatch("accounts/"+AUTH.uid,body).then(()=>{
  try{if(typeof accBase!=="undefined"&&accBase){const copy={};
   Object.keys(fields).forEach(k=>{const v=fields[k];copy[k]=v&&typeof v==="object"?JSON.parse(JSON.stringify(v)):v});
   apiApplyFields(accBase,copy)}}catch(e){}})}
