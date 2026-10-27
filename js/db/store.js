/* 저장소 통로. 화면은 이 함수만 부른다. 실제 읽기와 쓰기는 js/db 의 local, remote 가 맡는다. */
function apiPut(path,data){return DB.doc(path).set(data)}
function apiPatch(path,data){const d=DB.doc(path);return d.patch(data)}
function apiGet(path){return DB.doc(path).get()}
function apiCol(name){return DB.collection(name)}
