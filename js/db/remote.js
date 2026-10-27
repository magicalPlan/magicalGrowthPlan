/* Firebase Realtime Database. main.js 보다 먼저 불러야 한다.
   토큰이 만료되면 main.js 의 refresh 를 부른다. 계정 저장이 거절되면 lastSaveErr 에 이유를 남긴다. */
const IDX_BAD={};let lastSaveErr=null;
function fbdb(base){base=base.replace(/\/+$/,"");
const U=(p,q)=>base+"/"+p+".json?"+(AUTH.tok?"auth="+encodeURIComponent(AUTH.tok)+(q?"&":""):"")+(q||"");
const sn=(id,v)=>({id,exists:v!=null,data:()=>v==null?undefined:JSON.parse(JSON.stringify(v))});
/* 서버 요청에 시간 제한(20초)을 둔다. 휴대폰 네트워크에서 요청이 응답 없이 멈추면, 그 요청을 기다리던 출정 진행이 새로고침 전까지 영영 멈췄다. */
const tf=(u,o)=>{const opt=Object.assign({cache:"no-store"},o);if(typeof AbortController!=="function")return fetch(u,opt);const ac=new AbortController(),t=setTimeout(()=>ac.abort(),20000);return fetch(u,Object.assign(opt,{signal:ac.signal})).finally(()=>clearTimeout(t))};
const fx=async(mk,o)=>{let r=await tf(mk(),o);if(r.status===401&&AUTH.rt&&AUTH.key){try{await refresh();r=await tf(mk(),o)}catch(e){}}return r};
const J=async mk=>{const r=await fx(mk);if(!r.ok)throw new Error(r.status);return r.json()};
/* 데이터 사용량 절약: 실시간 감시는 POLL_MS(4초)마다 서버에 묻는다(채팅·대련처럼 빨라야 하는 곳만 더 짧게).
   브라우저 탭이 화면에 보이지 않는 동안에는 묻지 않고 기다렸다가, 다시 보이면 이어서 묻는다. */
const poll=(get,emit,err,ms)=>{let on=true,last="",t=null,first=true;const run=async()=>{if(!on)return;if(!first&&document.hidden){t=setTimeout(run,1000);return}first=false;try{const j=await get(),k=JSON.stringify(j);if(k!==last){last=k;emit(j)}}catch(e){err&&err({code:"unavailable",message:String(e)})}if(on)t=setTimeout(run,ms||POLL_MS)};run();return()=>{on=false;clearTimeout(t)}};
/* 실시간 채팅: 채팅·1:1·대련 화면은 서버와 연결을 열어 두고(EventSource), 바뀐 부분만 바로 받는다.
   몇 초마다 전체 목록을 다시 받는 것보다 빠르고 데이터도 훨씬 덜 쓴다. 탭이 안 보이면 연결을 닫고, 다시 보이면 연다.
   연결이 안 되는 환경(동시 접속 한도 초과 등)이면 예전처럼 몇 초마다 묻는 방식으로 자동으로 돌아간다. */
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
const D=p=>{const id=p.split("/").pop();return{id,path:p,get:async()=>sn(id,await J(()=>U(p))),
 set:async d=>{const body=JSON.stringify(d),r=await fx(()=>U(p),{method:"PUT",body});if(!r.ok){/* 서버가 알려 준 거절 이유를 기억해 두었다가 오류 안내에 보여 준다(원인 찾기용). */if(p.startsWith("accounts/")){let t="";try{t=await r.text()}catch(e){}lastSaveErr={st:r.status,msg:String(t).replace(/\s+/g," ").slice(0,160),kb:Math.round(body.length/1024)}}throw new Error(r.status)}},
 patch:async d=>{const body=JSON.stringify(d),r=await fx(()=>U(p),{method:"PATCH",body});if(!r.ok){if(p.startsWith("accounts/")){let t="";try{t=await r.text()}catch(e){}lastSaveErr={st:r.status,msg:String(t).replace(/\s+/g," ").slice(0,160),kb:Math.round(body.length/1024)}}throw new Error(r.status)}},
 peek:async()=>J(()=>U(p,"shallow=true")),
 delete:async()=>{const r=await fx(()=>U(p),{method:"DELETE"});if(!r.ok)throw new Error(r.status)},
 onSnapshot:(f,e,ms)=>{const pl=()=>poll(()=>J(()=>U(p)),j=>f(sn(id,j)),e,ms);return ms===POLL_FAST?live(()=>U(p),j=>f(sn(id,j)),e,pl):pl()}}};
const Q=(c,o)=>({where:(a,op,v)=>Q(c,{...o,w:[a,v]}),orderBy:()=>Q(c,o),by:f=>Q(c,{...o,ob:f}),limit:n=>Q(c,{...o,l:n}),first:n=>Q(c,{...o,f:n}),from:k=>Q(c,{...o,fr:k}),prefix:p=>Q(c,{...o,pre:p}),after:k=>Q(c,{...o,af:k}),end:k=>Q(c,{...o,en:k}),doc:id=>D(c+"/"+id),
 onSnapshot:(f,e,ms)=>{const q=[];if(o.w)q.push('orderBy="'+o.w[0]+'"','equalTo='+JSON.stringify(o.w[1]));else if(o.ob){q.push('orderBy="'+o.ob+'"');if(o.fr!=null)q.push("startAt="+encodeURIComponent(JSON.stringify(o.fr)));if(o.en!=null)q.push("endAt="+encodeURIComponent(JSON.stringify(o.en)))}else{q.push('orderBy="$key"');if(o.pre){const start=o.af&&o.af>o.pre?o.af:o.pre,end=o.en!=null&&String(o.en)<o.pre+"\uf8ff"?o.en:o.pre+"\uf8ff";q.push("startAt="+encodeURIComponent(JSON.stringify(start)),"endAt="+encodeURIComponent(JSON.stringify(end)))}else if(o.fr)q.push("startAt="+encodeURIComponent(JSON.stringify(o.fr)))}if(o.f)q.push("limitToFirst="+o.f);else if(o.l)q.push("limitToLast="+o.l);
 /* 서버 규칙에 찾기 목록(.indexOn)이 빠져 있으면 서버가 400 오류를 낸다. 그때는 최근 기록을 받아서 브라우저에서 골라낸다(조금 느리고 데이터를 더 쓰지만 동작은 한다). */
 const get=async()=>{if(o.w&&IDX_BAD[c]){const j=await J(()=>U(c,'orderBy="$key"&limitToLast=1500')),r={};Object.keys(j||{}).forEach(k=>{if(j[k]&&j[k][o.w[0]]===o.w[1])r[k]=j[k]});return r}
  try{return await J(()=>U(c,q.join("&")))}catch(x){if(o.w&&String(x.message)==="400"){IDX_BAD[c]=1;return get()}throw x}};
 const em=j=>f({docs:Object.keys(j||{}).map(k=>sn(k,j[k]))}),pl=()=>poll(get,em,e,ms);
 return ms===POLL_FAST&&!(o.w&&IDX_BAD[c])?live(()=>U(c,q.join("&")),em,e,pl):pl()}});
return{doc:D,collection:c=>Q(c,{})}}
