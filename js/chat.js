/* 채팅. main.js 다음에 불러야 한다. 단체 채팅, 마을 채팅, 1:1 대화, 운영자 열람, 새 메시지 알림.
   마을 탭은 chat 을, 프로필과 친구 목록은 goDM 과 openDM 을, 알림함은 goDM 을 그대로 부른다. */
let admT={},admK=null;
function admUI(){const b=document.querySelector("#ct [data-t=a]");if(b)b.hidden=!ADM[UID];try{drawNotice()}catch(e){}try{drawDoom()}catch(e){}}
function watchAdm(){if(!ADM[UID])return;unC=DB.collection("dm").limit(500).onSnapshot(s=>{const th={};s.docs.forEach(d=>{const m=d.data();if(m&&m.k)(th[m.k]=th[m.k]||[]).push(m)});Object.values(th).forEach(a=>a.sort((x,y)=>x.ts-y.ts));admT=th;drawAdm()},e=>cmsg("대화 목록을 불러오지 못했다. 운영자 등록과 데이터베이스 규칙을 확인해야 한다."))}
function admLabel(k){const nm={};(admT[k]||[]).forEach(m=>nm[m.u]=m.n);return Object.keys(nm).map(u=>cn(u,nm[u])).join(" ↔ ")}
function drawAdm(){const l=$("#al");l.innerHTML="";const ks=Object.keys(admT).sort((a,b)=>{const x=admT[a],y=admT[b];return y[y.length-1].ts-x[x.length-1].ts});
 if(!ks.length){l.innerHTML="<p class='hint'>아직 1:1 대화가 없다.</p>"}
 ks.forEach(k=>{const b=document.createElement("button");b.type="button";b.className="chip";b.style.cssText="display:flex;justify-content:space-between;text-align:left";b.setAttribute("aria-pressed",admK===k?"true":"false");
  b.innerHTML="<span></span><strong></strong>";b.firstChild.textContent=admLabel(k);b.lastChild.textContent=admT[k].length+"개";b.onclick=()=>{admK=k;drawAdm()};l.appendChild(b)});
 $("#at2").hidden=!admK||!admT[admK];if(admK&&admT[admK]){$("#ah").textContent=admLabel(admK)+" (열람 전용)";paint($("#alg"),admT[admK].slice(),admK)}}
/* 채팅: 단체 채팅은 모두가 보는 공용방이고, 1:1은 두 사람이 같은 대화 키를 쓴다 */
let ct="g",peer=null,unC=null,unP=null,lastSend=0;
const cmsg=t=>{$("#cm2").style.color="var(--bad)";$("#cm2").textContent=t};
function chat(){show("chat");admUI();$("#cm2").textContent="";if(!DB){cmsg("채팅 기능을 쓸 수 없다.");return}regPlayer();setT(ct)}
function sync(){$("#cin").hidden=ct==="a"||(ct==="d"&&!peer)}
/* 대화 그리기: 맨 아래를 보고 있을 때만 새 메시지를 따라 내려간다.
   위로 올려서 지난 대화를 읽는 중이면 그 자리를 지키고, 대신 '새 메시지 ↓' 버튼을 띄운다. th는 대화방 구분용이다. */
function newBtn(el,on){let b=document.getElementById(el.id+"-nb");
 if(!b){b=elT("button","newmsg","새 메시지 ↓");b.type="button";b.id=el.id+"-nb";b.hidden=true;b.onclick=()=>{el.scrollTop=el.scrollHeight;b.hidden=true};el.after(b);
  el.addEventListener("scroll",()=>{if(el.scrollHeight-el.scrollTop-el.clientHeight<40)b.hidden=true})}
 b.hidden=!on}
async function dmPng(el,title){const ms=(el&&el._ms||[]).slice();if(!ms.length)return toast("저장할 대화가 없다.");
 try{if(document.fonts&&document.fonts.ready)await document.fonts.ready}catch(e){}
 const light=document.documentElement.dataset.theme==="light",K=light?{bg:"#fbf7ee",card:"#ffffff",ink:"#2a2233",mu:"#7a6f80",me:"#8a6510",you:"#b0304a",ln:"#d9cba5",gold:"#8a6510"}:{bg:"#0f0b18",card:"#1a1428",ink:"#ece6f5",mu:"#9a90ab",me:"#d8c79a",you:"#e49aa9",ln:"#3a2f52",gold:"#e6c56a"};
 const FF=getComputedStyle(document.body).fontFamily||"sans-serif",W=DM_PNG_W,P=28,TW=W-P*2-24,LH=24;
 const mc=document.createElement("canvas").getContext("2d");
 const wrap=(t,f,max)=>{mc.font=f;const out=[];String(t).split("\n").forEach(par=>{let line="";for(const ch of Array.from(par)){if(mc.measureText(line+ch).width>max&&line){out.push(line);line=ch}else line+=ch}out.push(line)});return out};
 const two=n=>String(n).padStart(2,"0"),dt=t=>{const d=new Date(Number(t)||0);return d.getFullYear()+"."+two(d.getMonth()+1)+"."+two(d.getDate())+" "+two(d.getHours())+":"+two(d.getMinutes())};
 const fN="bold 15px "+FF,fT="16px "+FF,fS="12px "+FF;
 // 메시지마다 높이를 미리 잰다.
 const items=ms.map(m=>{const nm=cn(m.u,m.n)+(m.u===UID?" (나)":""),lines=wrap(m.x||"",fT,TW);return{m,nm,lines,h:16+20+lines.length*LH+12}});
 const HEAD=96,FOOT=44,PH=Math.round(W*297/210),pages=[];let cur=[],hh=HEAD;items.forEach(it=>{if(cur.length&&hh+it.h+8+FOOT>PH){pages.push(cur);cur=[];hh=HEAD}cur.push(it);hh+=it.h+8});if(cur.length)pages.push(cur);
 const stamp=(()=>{const d=new Date();return d.getFullYear()+two(d.getMonth()+1)+two(d.getDate())+"_"+two(d.getHours())+two(d.getMinutes())})(),safe=String(title||"대화").replace(/와의 1:1 대화| \(열람 전용\)/g,"").replace(/[\\/:*?"<>|\s]+/g,"_").slice(0,40);
 const jp=[];for(let pi=0;pi<pages.length;pi++){const its=pages[pi],H=HEAD+its.reduce((a,it)=>a+it.h+8,0)+FOOT,cv=document.createElement("canvas");cv.width=W*DM_PNG_X;cv.height=H*DM_PNG_X;const x=cv.getContext("2d");x.scale(DM_PNG_X,DM_PNG_X);x.textBaseline="top";
  x.fillStyle=K.bg;x.fillRect(0,0,W,H);
  x.fillStyle=K.gold;x.font="bold 13px "+FF;x.fillText("魔法 成長記錄 · 1:1 대화",P,22);
  x.fillStyle=K.ink;x.font="bold 20px "+FF;x.fillText(wrap(title||"",x.font=("bold 20px "+FF),W-P*2)[0]||"",P,42);
  x.fillStyle=K.mu;x.font=fS;x.fillText(dt(its[0].m.ts)+" ~ "+dt(its[its.length-1].m.ts)+(pages.length>1?"   ("+(pi+1)+"/"+pages.length+")":""),P,70);
  let y=HEAD;its.forEach(it=>{const mine=it.m.u===UID;x.fillStyle=K.card;x.strokeStyle=K.ln;x.lineWidth=1;const r=12,bx=P,bw=W-P*2;
   x.beginPath();if(x.roundRect)x.roundRect(bx,y,bw,it.h,r);else x.rect(bx,y,bw,it.h);x.fill();x.stroke();
   x.fillStyle=mine?K.me:K.you;x.fillRect(bx,y+10,3,it.h-20);
   x.font=fN;x.fillStyle=mine?K.me:K.you;x.fillText(it.nm,bx+14,y+12);let nx=bx+14+x.measureText(it.nm).width+8;
   if(typeof it.m.t==="string"&&it.m.t){x.font=fS;const tt="「"+it.m.t.slice(0,20)+"」";x.fillStyle=K.gold;x.fillText(tt,nx,y+14);nx+=x.measureText(tt).width+8}
   x.font=fS;x.fillStyle=K.mu;const tm=dt(it.m.ts);x.fillText(tm,bx+bw-14-x.measureText(tm).width,y+14);
   x.font=fT;x.fillStyle=K.ink;it.lines.forEach((ln,i)=>x.fillText(ln,bx+14,y+38+i*LH));y+=it.h+8});
  x.fillStyle=K.mu;x.font=fS;x.fillText("저장한 시각 "+dt(Date.now()),P,H-28);
  const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.92));if(!blob){toast("PDF를 만들지 못했다.");return}
  jp.push({b:new Uint8Array(await blob.arrayBuffer()),w:cv.width,h:cv.height,pw:595.28,ph:595.28*H/W})}
 const pdf=pdfJpeg(jp),a=document.createElement("a"),u=URL.createObjectURL(pdf);a.href=u;a.download="1대1_"+safe+"_"+stamp+".pdf";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);
 toast("대화를 PDF로 저장했다"+(pages.length>1?" ("+pages.length+"쪽).":"."))}
/* JPEG 그림들을 한 쪽씩 담은 PDF를 만든다(외부 라이브러리 없이). 쪽 크기는 A4 너비(595pt)에 그림 비율을 맞춘다. */
function pdfJpeg(pgs){const enc=new TextEncoder(),parts=[],offs=[];let len=0;const put=x=>{const b=typeof x==="string"?enc.encode(x):x;parts.push(b);len+=b.length};
 const n=2+pgs.length*3,obj=(i,body)=>{offs[i]=len;put(i+" 0 obj\n");body();put("\nendobj\n")};
 put("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
 obj(1,()=>put("<< /Type /Catalog /Pages 2 0 R >>"));
 obj(2,()=>put("<< /Type /Pages /Count "+pgs.length+" /Kids ["+pgs.map((_,i)=>(3+i*3)+" 0 R").join(" ")+"] >>"));
 pgs.forEach((g,i)=>{const P=3+i*3,I=P+1,S=P+2,pw=g.pw.toFixed(2),ph=g.ph.toFixed(2),cs="q "+pw+" 0 0 "+ph+" 0 0 cm /Im0 Do Q";
  obj(P,()=>put("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 "+pw+" "+ph+"] /Resources << /XObject << /Im0 "+I+" 0 R >> >> /Contents "+S+" 0 R >>"));
  obj(I,()=>{put("<< /Type /XObject /Subtype /Image /Width "+g.w+" /Height "+g.h+" /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length "+g.b.length+" >>\nstream\n");put(g.b);put("\nendstream")});
  obj(S,()=>put("<< /Length "+cs.length+" >>\nstream\n"+cs+"\nendstream"))});
 const xr=len;put("xref\n0 "+(n+1)+"\n0000000000 65535 f \n");for(let i=1;i<=n;i++)put(String(offs[i]).padStart(10,"0")+" 00000 n \n");
 put("trailer\n<< /Size "+(n+1)+" /Root 1 0 R >>\nstartxref\n"+xr+"\n%%EOF");
 return new Blob(parts,{type:"application/pdf"})}
function paint(el,ms,th){th=th==null?"":String(th);ms=ms.filter(m=>m&&!m.bt);const same=el.dataset.th===th,nearB=el.scrollHeight-el.scrollTop-el.clientHeight<40,top=el.scrollTop,prevLast=Number(el.dataset.last||0);
 ms.sort((a,b)=>a.ts-b.ts);el._ms=ms;const last=ms.length?Number(ms[ms.length-1].ts)||0:0;el.dataset.th=th;el.dataset.last=last;
 const keep=()=>{if(!same||nearB){el.scrollTop=el.scrollHeight;newBtn(el,false)}else{el.scrollTop=top;if(last>prevLast)newBtn(el,true)}};
 el.innerHTML="";if(!ms.length){el.innerHTML="<div class='cm-empty'><span>✦</span><p>아직 대화가 없다.</p><small>먼저 인사를 건네 보자.</small></div>";newBtn(el,false);return}
 /* 말풍선: 내 말은 오른쪽, 다른 사람 말은 왼쪽. 같은 사람이 3분 안에 이어 말하면 이름과 얼굴을 한 번만 보인다. 날짜가 바뀌면 구분선을 넣는다. */
 let pu=null,pt=0,pd="",need=false;
 ms.forEach(m=>{const me=m.u===UID,ts=Number(m.ts)||0,d=ts?new Date(ts):null,dk=d?d.getFullYear()+"."+(d.getMonth()+1)+"."+d.getDate():"";
  if(dk&&dk!==pd){const sep=elT("div","cm-day",(d.getMonth()+1)+"월 "+d.getDate()+"일");el.appendChild(sep);pu=null}pd=dk||pd;
  const cont=pu===m.u&&ts-pt<180000;pu=m.u;pt=ts;
  const p=elT("div","cm"+(me?" me":"")+(cont?" cont":""));
  const nm=cn(m.u,m.n),av=elT("span","cm-av",(nm||"?").slice(0,1));if(!me&&m.u){av.dataset.u=m.u;if(!avSet(av,m.u))need=true}
  const body=elT("div","cm-body"),head=elT("div","cm-head"),b=elT("b","cm-n",nm+(me?" (나)":""));
  if(m.u&&!me){b.tabIndex=0;b.setAttribute("role","button");b.classList.add("link");b.onclick=()=>openProfile(m.u);b.onkeydown=e=>{if(e.key==="Enter")openProfile(m.u)};av.onclick=()=>openProfile(m.u);av.classList.add("link")}
  head.appendChild(b);if(typeof m.t==="string"&&m.t)head.appendChild(elT("span","ttl-chip",m.t.slice(0,20)));
  const row=elT("div","cm-row"),bub=elT("span","cm-x",String(m.x==null?"":m.x)),tm=elT("small","cm-t",d?String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"):"");
  row.append(bub,tm);body.append(head,row);p.append(av,body);el.appendChild(p)});if(need)avLoad();keep()}
/* 채팅 프로필 사진: 등록자 목록(players)에 이미 들어 있는 작은 사진을 쓴다. 목록은 plAll이 모아 두므로 따로 많이 받지 않는다.
   사진이 없는 사람은 이름 첫 글자를 그대로 보인다. 목록에 없는 새 사람이 보이면 5분에 한 번까지만 목록을 다시 받는다. */
let AVM=null,AVK=null,AVT=-1,avBusy=false,avLast=0;
function avMap(){if(PLC&&AVT!==PLT){AVM={};AVK=new Set();PLC.docs.forEach(d=>{AVK.add(d.id);const q=d.data();if(q&&typeof q.im==="string"&&/^(data:image\/|https:)/.test(q.im))AVM[d.id]=q.im});AVT=PLT}return AVM}
function avSet(av,u){const mp=avMap();if(!mp)return false;const im=mp[u];if(im&&!av.querySelector("img")){const i=document.createElement("img");i.src=im;i.alt="";i.loading="lazy";av.textContent="";av.appendChild(i);av.classList.add("has")}return AVK.has(u)||Date.now()-avLast<300000}
function avLoad(){if(!DB||avBusy)return;if(AVK&&Date.now()-avLast<300000)return;avBusy=true;avLast=Date.now();
 plAll(AVK?0:undefined).then(()=>{avBusy=false;document.querySelectorAll(".cm-av[data-u]").forEach(a=>avSet(a,a.dataset.u))},()=>{avBusy=false})}
function setT(t){ct=t;unC&&unC();unC=null;unP&&unP();unP=null;
 document.querySelectorAll("#ct button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.t===t?"true":"false"));
 $("#cg").hidden=t!=="g";$("#cvl").hidden=t!=="v";$("#cd").hidden=t!=="d";$("#ca").hidden=t!=="a";
 if(t==="g")unC=DB.collection("chat").orderBy("ts","desc").limit(40).onSnapshot(s=>paint($("#gl"),s.docs.map(d=>d.data()).filter(m=>m&&!m.vc),"g"),e=>cmsg("채팅을 불러오지 못했다."),POLL_FAST);
 // 마을 채팅: 단체 채팅과 같은 저장 공간을 쓰되 이름이 "c_{마을}_"로 시작한다. 내 마을의 대화만 불러온다.
 else if(t==="v"){vcNew=false;vcMark();$("#cvh").textContent=VL[C.v].n+" 주민끼리 나누는 채팅이다. 다른 마을 주민에게는 보이지 않는다.";C.vcSeen=srvNow();save();updNav();
  unC=DB.collection("chat").prefix("c_"+C.v+"_").limit(40).onSnapshot(s=>{const ms=s.docs.map(d=>d.data()).filter(m=>m&&m.vc===C.v);paint($("#vcl"),ms,"v"+C.v);C.vcSeen=srvNow()},e=>cmsg("마을 채팅을 불러오지 못했다."),POLL_FAST)}
 else if(t==="a")watchAdm();else{peer=null;$("#dt").hidden=true;$("#cpick").hidden=false;$("#pl2").dataset.sig="";
  // 목록은 친구 먼저, 그다음 이름순으로 고정한다. 이름·등급·안 읽음 표시가 바뀔 때만 다시 그려서 화면이 흔들리지 않는다.
  dmBackfill();{let alive=true;const go=()=>plAll(PL_TTL).then(s=>{if(!alive)return;peerDocs=s.docs.map(d=>[d.id,d.data()]);drawPeers()},()=>cmsg("플레이어 목록을 불러오지 못했다."));go();const iv=setInterval(go,60000);unP=()=>{alive=false;clearInterval(iv)}}}
 sync()}
/* 1:1 대화 상대 목록: 최근에 대화를 주고받은 사람이 맨 위. 대화한 적 없는 사람은 그 아래에 친구 먼저, 이름순.
   C.dml = 상대별 마지막으로 메시지를 주고받은 시각(내가 보낸 것, 받은 것 모두). 순서가 바뀔 때만 다시 그린다. */
let peerDocs=[],dmBackfilled=false;
// 이 기능 전에 주고받은 대화도 목록에 나오도록, 기록이 없는 친구와의 대화를 한 번 찾아본다.
async function dmBackfill(){if(dmBackfilled||!C||!DB||!AUTH.uid)return;dmBackfilled=true;C.dml=C.dml||{};const ids=Object.keys(C.fr||{}).filter(u=>!C.dml[u]).slice(0,30);let ch=false;
 await Promise.all(ids.map(async u=>{try{const k=[UID,u].sort().join("_"),sn=await once(DB.collection("dm").where("k","==",k));const t=Math.max(0,...sn.docs.map(d=>Number((d.data()||{}).ts)||0));if(t>0){C.dml[u]=Math.max(C.dml[u]||0,t);ch=true}}catch(e){}}));
 if(ch){save();if(!$("#v-chat").hidden&&ct==="d")drawPeers()}}
function dmTouch(id,t){if(!C||!id)return;C.dml=C.dml||{};if((C.dml[id]||0)>=t)return;C.dml[id]=t;const ks=Object.keys(C.dml);if(ks.length>80)ks.sort((a,b)=>C.dml[a]-C.dml[b]).slice(0,ks.length-80).forEach(k=>delete C.dml[k]);if(!$("#v-chat").hidden&&ct==="d")drawPeers()}
function drawPeers(){const l=$("#pl2");if(!l||!C)return;const fr=C.fr||{},dl=C.dml||{},nm=p=>String((p&&p.n)||"");
 const ps=peerDocs.filter(x=>x[0]!==UID&&x[1]&&(dl[x[0]]||(C.dmu&&C.dmu[x[0]])||peer===x[0])).sort((a,b)=>(dl[b[0]]||0)-(dl[a[0]]||0)||(fr[b[0]]?1:0)-(fr[a[0]]?1:0)||nm(a[1]).localeCompare(nm(b[1]),"ko")).slice(0,60);
 const sig=ps.map(([id,p])=>id+"|"+nm(p)+"|"+tiName(p.ti,p.tn)+"|"+p.g+"|"+p.a+"|"+(C.dmu&&C.dmu[id]?1:0)+"|"+(ADM[id]?1:0)+"|"+(dl[id]?agoTxt(dl[id]):"")).join(",");if(l.dataset.sig===sig)return;l.dataset.sig=sig;l.innerHTML="";
 if(!ps.length){l.innerHTML="<p class='hint'>아직 대화를 나눈 상대가 없다.</p>";const b=elT("button","btn g","친구 목록에서 대화 시작하기");b.type="button";b.onclick=()=>friends();l.appendChild(b)}
 ps.forEach(([id,p])=>{const b=document.createElement("button");b.type="button";b.className="chip";b.style.textAlign="left";b.dataset.id=id;b.textContent=(C.dmu&&C.dmu[id]?"● ":"")+(fr[id]?"☍ ":"")+cn(id,p.n)+(tiName(p.ti,p.tn)?" 「"+tiName(p.ti,p.tn)+"」":"")+" ("+p.g+"등급 "+p.a+")"+(dl[id]?" · "+agoTxt(dl[id]):"");b.setAttribute("aria-pressed",peer===id?"true":"false");b.onclick=()=>openDM(id,p.n);b.style.flex="1";
  const w=document.createElement("div");w.style.cssText="display:flex;gap:8px";const pb=document.createElement("button");pb.type="button";pb.className="chip";pb.style.cssText="flex:0 0 auto;min-width:0;padding:10px 14px";pb.textContent="프로필";pb.onclick=()=>openProfile(id);w.append(b,pb);l.appendChild(w)})}
setInterval(()=>{if(C&&!$("#v-chat").hidden&&ct==="d"&&!$("#cpick").hidden)drawPeers()},60000);
function openDM(id,n){peer=id;unC&&unC();$("#cpick").hidden=true;if(C.dmu&&C.dmu[id]){delete C.dmu[id];save();document.querySelectorAll("#pl2 .chip").forEach(c=>{if(c.dataset.id===id)c.textContent=c.textContent.replace(/^● /,"")})}const k=[UID,id].sort().join("_");$("#dh").textContent=n+"와의 1:1 대화";$("#dt").hidden=false;
 document.querySelectorAll("#pl2 .chip").forEach(c=>c.setAttribute("aria-pressed",c.dataset.id===id?"true":"false"));
 unC=DB.collection("dm").where("k","==",k).onSnapshot(s=>paint($("#dl"),s.docs.map(d=>d.data()),k),(e)=>cmsg("대화를 불러오지 못했다. (오류 "+String(e&&e.message||e).replace(/\D/g,"").slice(0,3)+")"),POLL_FAST);sync()}
$("#dpng").onclick=()=>dmPng($("#dl"),$("#dh").textContent);$("#apng").onclick=()=>dmPng($("#alg"),$("#ah").textContent);
/* 채팅 순서: 예전에는 보내는 사람 기기의 시계로 시각(ts)을 적었다. 기기 시계가 30~40초 빠르거나 느린 사람이 있으면
   그 사람 메시지가 맨 아래에 붙어 있다가 다른 메시지들 사이로 끼어 올라가는 일이 생겼다.
   이제 시각은 서버가 직접 적고({".sv":"timestamp"}), 메시지 이름(순서용)도 서버 시계에 맞춘 시각으로 만든다. */
let SKEW=0,skewOk=false;const srvNow=()=>Date.now()+SKEW;
async function clockSync(){if(skewOk||!XON()||!UID)return;skewOk=true;try{const a=Date.now();await DB.doc("wboss/clk/"+UID).set({t:{".sv":"timestamp"}});const b=Date.now();const v=Number(((await DB.doc("wboss/clk/"+UID).get()).data()||{}).t);if(v>0&&b-a<5000)SKEW=Math.round(v-(a+b)/2)}catch(e){skewOk=false}}
// 너무 빨리 연달아 보내면 버리지 않고 잠깐 기다렸다가 보낸다.
let sendT=null;
function send(){const x=$("#ci").value.trim();if(!x)return;const wait=800-(Date.now()-lastSend);if(wait>0){clearTimeout(sendT);sendT=setTimeout(send,wait);return}if(ct==="d"&&!peer)return cmsg("대화 상대를 먼저 골라야 한다.");
 lastSend=Date.now();clockSync();const id=(ct==="v"?"c_"+C.v+"_":"")+srvNow().toString(36)+Math.random().toString(36).slice(2,6),d={u:UID,n:C.n,x:x,ts:{".sv":"timestamp"}};if(ct==="v")d.vc=C.v;if(tiName(C.ti))d.t=tiName(C.ti);const to=ct==="d"?peer:null;if(to)d.k=[UID,to].sort().join("_");
 DB.collection(ct==="d"?"dm":"chat").doc(id).set(d).then(()=>{if(to){dmTouch(to,Date.now());save();dmBell(to,x)}$("#ci").value="";$("#cm2").textContent="";titleState();C.stats.chats=(C.stats.chats||0)+1;save()}).catch(e=>{const c=String(e&&e.message||e);cmsg(c==="401"||c==="403"?"메시지를 보내지 못했다. 서버 규칙에서 쓰기가 막혀 있다. (오류 "+c+")":"메시지를 보내지 못했다. 인터넷 연결을 확인하고 다시 보내 보자. (오류 "+c+")")})}
// 대화 중에는 상대 목록을 접어 두고, 버튼으로 다시 펼친다.
$("#pchg").onclick=()=>{unC&&unC();unC=null;peer=null;$("#dt").hidden=true;$("#cpick").hidden=false;document.querySelectorAll("#pl2 .chip").forEach(c=>c.setAttribute("aria-pressed","false"));sync()};
// 엔터와 보내기 버튼 모두 폼 제출로 처리한다. 휴대폰 한글 키보드에서도 엔터가 확실히 먹는다.
$("#cin").onsubmit=e=>{e.preventDefault();send()};

/* 1:1 새 메시지 알림: 보낼 때 받는 사람의 dmn/{받는 사람}/{보낸 사람}에 '새 메시지 왔음' 표시를 남기고,
   받는 사람은 5초마다 확인해서 화면 위 알림, 짧은 알림음, 채팅 탭 숫자, 알림함으로 알려 준다.
   C.dms = 보낸 사람별로 마지막으로 확인한 시각, C.dmu = 아직 안 읽은 사람, C.dmn = 보낸 사람 이름. */
const goDM=(u,n)=>{chat();setT("d");openDM(u,n||(C.dmn&&C.dmn[u])||(C.fr&&C.fr[u])||"상대")};
let dmBusy=false;
/* 1:1 알림 신호: 서버 규칙에 dmn 항목이 없어도 동작하도록, 이미 열려 있는 rooms 아래 rooms/xd{받는 사람}/{보낸 사람}에 '보냈다'는 표시만 남긴다.
   메시지 내용은 넣지 않는다(내용은 받는 사람만 읽을 수 있는 dm에서 따로 가져온다). dmn 규칙이 있으면 그쪽도 함께 쓴다. */
function dmBell(to,x){DB.doc("rooms/xd"+to+"/"+UID).set({n:nmOf(),ts:{".sv":"timestamp"}}).catch(()=>{});DB.doc("rooms/xd"+to+"/ts").set({".sv":"timestamp"}).catch(()=>{});
 DB.doc("dmn/"+to+"/"+UID).set({n:nmOf(),x:String(x).slice(0,40),ts:{".sv":"timestamp"}}).catch(()=>{})}
// 그 사람과의 마지막 메시지 내용(알림 미리보기용)
async function dmLast(f){try{const k=[UID,f].sort().join("_"),sn=await once(DB.collection("dm").where("k","==",k)),ms=sn.docs.map(d=>d.data()).filter(m=>m&&m.u===f).sort((a,b)=>(a.ts||0)-(b.ts||0));return ms.length?String(ms[ms.length-1].x||""):""}catch(e){return ""}}
async function checkDM(){if(!AUTH.uid||!C||!DB||dmBusy)return;dmBusy=true;try{const got={};
 const take=(f,v)=>{if(!v||typeof v!=="object"||typeof v.ts!=="number")return;if(!got[f]||v.ts>got[f].ts)got[f]=v};
 try{const d=(await DB.doc("rooms/xd"+UID).get()).data()||{};Object.keys(d).forEach(f=>{if(f!=="ts")take(f,d[f])})}catch(e){}
 try{const s=await once(DB.collection("dmn/"+UID));s.docs.forEach(d=>take(d.id,d.data()))}catch(e){}
 if(!C)return;const first=!C.dms;C.dms=C.dms||{};C.dmu=C.dmu||{};C.dmn=C.dmn||{};let ch=false;
 for(const f of Object.keys(got)){const v=got[f];if(v.ts<=(C.dms[f]||0))continue;C.dms[f]=v.ts;ch=true;const n=String(v.n||"누군가").slice(0,20);C.dmn[f]=n;dmTouch(f,v.ts);
  if(first)continue;// 이 기능이 처음 켜질 때는 예전 메시지로 알림을 쏟아 내지 않는다.
  if(!$("#v-chat").hidden&&ct==="d"&&peer===f)continue;// 지금 그 대화를 보고 있으면 알림 없이 넘어간다.
  C.dmu[f]=1;const x=String(v.x||"")||await dmLast(f);note("dm",n+"님에게서 1:1 메시지가 왔다"+(x?": "+x:"."),f);toast("✉ "+n+(x?": "+x:"님에게서 1:1 메시지가 왔다"),()=>goDM(f,n));ding()}
 if(ch){save();updNav();if(!$("#v-chat").hidden&&ct==="d")document.querySelectorAll("#pl2 .chip").forEach(c=>{if(c.dataset.id&&C.dmu[c.dataset.id]&&!/^● /.test(c.textContent))c.textContent="● "+c.textContent})}}
 catch(e){}finally{dmBusy=false}}
setInterval(()=>{if(!document.hidden)checkDM()},10000);
$("#ct").onclick=e=>{const t=e.target.dataset&&e.target.dataset.t;if(t&&DB)setT(t)};
// 마을 채팅에 새 메시지가 오면(내가 보지 않는 동안) 탭에 ● 표시를 한다. 30초마다 가장 최근 메시지 한 개만 확인한다.
let vcNew=false;function vcMark(){const b=document.querySelector("#ct [data-t=v]");if(b)b.textContent="마을 채팅"+(vcNew?" ●":"")}
setInterval(async()=>{if(!C||!DB||!XON()||!AUTH.uid||document.hidden)return;if(!$("#v-chat").hidden&&ct==="v"){vcNew=false;vcMark();return}
 try{const sn=await once(DB.collection("chat").prefix("c_"+C.v+"_").limit(1)),m=sn.docs.map(d=>d.data())[0];vcNew=!!(m&&m.vc===C.v&&m.u!==UID&&Number(m.ts)>(C.vcSeen||0));vcMark()}catch(e){}},60000);
