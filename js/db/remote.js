/* Firebase Realtime Database. main.js 보다 먼저 불러야 한다.
   토큰이 만료되면 main.js 의 refresh 를 부른다. 계정 저장이 거절되면 lastSaveErr 에 이유를 남긴다. */
let lastSaveErr=null;
function fbdb(base){base=base.replace(/\/+$/,"");
const U=(p,q)=>base+"/"+p+".json?"+(AUTH.tok?"auth="+encodeURIComponent(AUTH.tok)+(q?"&":""):"")+(q||"");
const sn=(id,v)=>({id,exists:v!=null,data:()=>v==null?undefined:JSON.parse(JSON.stringify(v))});
/* 서버 요청에 시간 제한(20초)을 둔다. 휴대폰 네트워크에서 요청이 응답 없이 멈추면, 그 요청을 기다리던 출정 진행이 새로고침 전까지 영영 멈췄다. */
const tf=(u,o)=>{const opt=Object.assign({cache:"no-store"},o);if(typeof AbortController!=="function")return fetch(u,opt);const ac=new AbortController(),t=setTimeout(()=>ac.abort(),20000);return fetch(u,Object.assign(opt,{signal:ac.signal})).finally(()=>clearTimeout(t))};
const fx=async(mk,o)=>{let r=await tf(mk(),o);if(r.status===401&&AUTH.rt&&AUTH.key){try{await refresh();r=await tf(mk(),o)}catch(e){}}return r};
/* SAME: 데이터가 그대로라 서버가 본문 없이 304를 준 경우. JSON과 겹치지 않는 표식이다. */
const SAME={};
const J=async(mk,bag)=>{const o=bag?{headers:{"X-Firebase-ETag":"true"}}:null;if(bag&&bag.tag)o.headers["if-none-match"]=bag.tag;const r=await fx(mk,o);if(r.status===304)return SAME;if(!r.ok)throw new Error(r.status);if(bag){const tag=r.headers.get("ETag");if(tag)bag.tag=tag}return r.json()};
/* POLL_FAST 와 live() 만 EventSource 로 연결을 연다(채팅·대련·보고 있는 레이드, 타락 목록, 재해 점수, 선물 도착, 1:1 도착, 정기 출정 자리, 마수 포탈). 그 밖은 연결 없이 주기적으로 묻는다.
   처음 받을 때 ETag를 기억한다. 다음부터는 그 값을 보내서, 같으면 본문 없이 304만 받고 화면은 그대로 둔다. 바뀔 때만 본문을 받아 반영한다.
   연결이 거절되어 이 묻기로 돌아와도 같다. 출정·타락 목록·채팅도 그대로인 동안에는 전문을 다시 받지 않는다.
   묻기가 실패하면 다음 간격을 두 배씩 늘린다(최대 60초). 한 번 성공하면 원래 간격으로 돌아온다.
   브라우저 탭이 화면에 보이지 않는 동안에는 묻지 않고 기다렸다가, 다시 보이면 이어서 묻는다. */
const poll=(get,emit,err,ms)=>{let on=true,last="",t=null,first=true,base=ms||POLL_MS,gap=base,bag={tag:""};const run=async()=>{if(!on)return;if(!first&&document.hidden){t=setTimeout(run,1000);return}first=false;try{const j=await get(bag);if(j!==SAME){const k=JSON.stringify(j);if(k!==last){last=k;emit(j)}}gap=base}catch(e){err&&err({code:"unavailable",message:String(e)});gap=Math.min(Math.max(gap*2,base*2),60000)}if(on)t=setTimeout(run,gap)};run();return()=>{on=false;clearTimeout(t)}};
/* 실시간 채팅: 채팅·1:1·대련 화면은 서버와 연결을 열어 두고(EventSource), 바뀐 부분만 바로 받는다.
   몇 초마다 전체 목록을 다시 받는 것보다 빠르고 데이터도 훨씬 덜 쓴다. 탭이 안 보이면 연결을 닫고, 다시 보이면 연다.
   연결이 안 되는 환경(동시 접속 한도 초과 등)이면 주기적으로 묻는 방식으로 돌아간다. 그때도 같으면 본문을 받지 않는다. */
const live=(mk,emit,err,fallback)=>{if(typeof EventSource!=="function")return fallback();
 let on=true,es=null,tree=null,fails=0,ok=false,stopPoll=null,last="",retryT=null;
 const put=(path,data,merge)=>{const ks=String(path||"/").split("/").filter(Boolean);
  if(!ks.length){if(merge){tree=tree&&typeof tree==="object"?tree:{};Object.keys(data||{}).forEach(k=>{if(data[k]==null)delete tree[k];else tree[k]=data[k]})}else tree=data;return}
  tree=tree&&typeof tree==="object"?tree:{};let o=tree;ks.slice(0,-1).forEach(k=>{if(!o[k]||typeof o[k]!=="object")o[k]={};o=o[k]});const lk=ks[ks.length-1];
  if(merge){o[lk]=o[lk]&&typeof o[lk]==="object"?o[lk]:{};Object.keys(data||{}).forEach(k=>{if(data[k]==null)delete o[lk][k];else o[lk][k]=data[k]})}else if(data==null)delete o[lk];else o[lk]=data};
 const out=()=>{const k=JSON.stringify(tree);if(k!==last){last=k;emit(tree==null?null:JSON.parse(k))}};
 const toPoll=()=>{close();if(on&&!stopPoll)stopPoll=fallback()};
 const close=()=>{if(es){try{es.close()}catch(e){}es=null}};
 const open=()=>{if(!on||es||stopPoll||document.hidden)return;let u;try{u=mk()}catch(e){return toPoll()}es=new EventSource(u);
  const h=(ev,mg)=>{try{const j=JSON.parse(ev.data);if(!j)return;put(j.path,j.data,mg);ok=true;fails=0;out()}catch(e){}};
  es.addEventListener("put",ev=>h(ev,false));es.addEventListener("patch",ev=>h(ev,true));
  es.addEventListener("cancel",()=>toPoll());
  es.addEventListener("auth_revoked",async()=>{close();try{if(AUTH.rt&&AUTH.key)await refresh()}catch(e){}retryT=setTimeout(open,500)});
  es.onerror=()=>{if(!es||es.readyState!==2)return;close();fails++;if(!ok||fails>=3){toPoll();return}retryT=setTimeout(open,3000)}};
 const vis=()=>{if(!on)return;if(document.hidden){if(!stopPoll)close()}else open()};
 document.addEventListener("visibilitychange",vis);open();
 return()=>{on=false;clearTimeout(retryT);document.removeEventListener("visibilitychange",vis);close();if(stopPoll)stopPoll()}};
const D=(p,lv)=>{const id=p.split("/").pop();return{id,path:p,get:async()=>sn(id,await J(()=>U(p))),
 set:async d=>{const body=JSON.stringify(d),r=await fx(()=>U(p),{method:"PUT",body});if(!r.ok){/* 서버가 알려 준 거절 이유를 기억해 두었다가 오류 안내에 보여 준다(원인 찾기용). */if(p.startsWith("accounts/")){let t="";try{t=await r.text()}catch(e){}lastSaveErr={st:r.status,msg:String(t).replace(/\s+/g," ").slice(0,160),kb:Math.round(body.length/1024)}}throw new Error(r.status)}},
 patch:async d=>{const body=JSON.stringify(d),r=await fx(()=>U(p),{method:"PATCH",body});if(!r.ok){if(p.startsWith("accounts/")){let t="";try{t=await r.text()}catch(e){}lastSaveErr={st:r.status,msg:String(t).replace(/\s+/g," ").slice(0,160),kb:Math.round(body.length/1024)}}throw new Error(r.status)}},
 peek:async()=>J(()=>U(p,"shallow=true")),
 delete:async()=>{const r=await fx(()=>U(p),{method:"DELETE"});if(!r.ok)throw new Error(r.status)},
 transact:async fn=>{for(let i=0;i<4;i++){const r=await fx(()=>U(p),{headers:{"X-Firebase-ETag":"true"}});if(!r.ok)throw new Error(r.status);const tag=r.headers.get("ETag");let cur=null;try{cur=await r.json()}catch(e){cur=null}if(cur===undefined)cur=null;const next=fn(cur);if(next===undefined)return cur;const w=await fx(()=>U(p),{method:"PUT",headers:tag?{"if-match":tag}:{},body:JSON.stringify(next)});if(w.status===412)continue;if(!w.ok)throw new Error(w.status);return next}throw new Error("412")},
 live:()=>D(p,1),
 onSnapshot:(f,e,ms)=>{const pl=()=>poll(bag=>J(()=>U(p),bag),j=>f(sn(id,j)),e,ms);return ms===POLL_FAST||lv?live(()=>U(p),j=>f(sn(id,j)),e,pl):pl()}}};
const qq=o=>{const q=[];if(o.w)q.push('orderBy="'+o.w[0]+'"','equalTo='+JSON.stringify(o.w[1]));else if(o.ob){q.push('orderBy="'+o.ob+'"');if(o.fr!=null)q.push("startAt="+encodeURIComponent(JSON.stringify(o.fr)));if(o.en!=null)q.push("endAt="+encodeURIComponent(JSON.stringify(o.en)))}else{q.push('orderBy="$key"');if(o.pre){const start=o.af&&o.af>o.pre?o.af:o.pre,end=o.en!=null&&String(o.en)<o.pre+"\uf8ff"?o.en:o.pre+"\uf8ff";q.push("startAt="+encodeURIComponent(JSON.stringify(start)),"endAt="+encodeURIComponent(JSON.stringify(end)))}else if(o.fr)q.push("startAt="+encodeURIComponent(JSON.stringify(o.fr)))}if(o.f)q.push("limitToFirst="+o.f);else if(o.l)q.push("limitToLast="+o.l);return q.join("&")};
const Q=(c,o)=>({where:(a,op,v)=>Q(c,{...o,w:[a,v]}),orderBy:()=>Q(c,o),by:f=>Q(c,{...o,ob:f}),limit:n=>Q(c,{...o,l:n}),first:n=>Q(c,{...o,f:n}),from:k=>Q(c,{...o,fr:k}),prefix:p=>Q(c,{...o,pre:p}),after:k=>Q(c,{...o,af:k}),end:k=>Q(c,{...o,en:k}),live:()=>Q(c,{...o,lv:1}),doc:id=>D(c+"/"+id),
 /* 한 번만 읽기. 주기 조회의 ETag 확인으로 들어가지 않는다. */
 grab:async()=>{const j=await J(()=>U(c,qq(o)));return{docs:Object.keys(j||{}).map(k=>sn(k,j[k]))}},
 onSnapshot:(f,e,ms)=>{
 /* 찾기 목록(.indexOn)이 없으면 서버가 400을 낸다. 최근 1,500개를 통째로 받아 고르지 않는다. 실패하면 poll 이 간격을 늘린다. */
 const get=bag=>J(()=>U(c,qq(o)),bag);
 const em=j=>f({docs:Object.keys(j||{}).map(k=>sn(k,j[k]))}),pl=()=>poll(get,em,e,ms);
 return ms===POLL_FAST||o.lv?live(()=>U(c,qq(o)),em,e,pl):pl()}});
return{doc:D,collection:c=>Q(c,{})}}
