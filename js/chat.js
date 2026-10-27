/* 채팅. main.js 다음에 불러야 한다. 단체 채팅, 마을 채팅, 1:1 대화, 운영자 열람, 새 메시지 알림.
   마을 탭은 chat 을, 프로필과 친구 목록은 goDM 과 openDM 을, 알림함은 goDM 을 그대로 부른다. */
let admT={},admK=null;
function admUI(){const b=document.querySelector("#ct [data-t=a]");if(b)b.hidden=!ADM[UID];try{drawNotice()}catch(e){}try{drawDoom()}catch(e){}}
let admGen=0;
async function watchAdm(){if(!ADM[UID])return;const gen=++admGen;const box=$("#al");if(box&&!Object.keys(admT).length)box.innerHTML="<p class='hint'>최근 대화를 불러오는 중...</p>";
 try{const s=await apiAdmOnce();if(gen!==admGen||$("#v-chat").hidden||ct!=="a")return;const th={};s.docs.forEach(d=>{const m=d.data();if(m&&m.k)(th[m.k]=th[m.k]||[]).push(m)});Object.values(th).forEach(a=>a.sort((x,y)=>x.ts-y.ts));admT=th;drawAdm()}
 catch(e){if(gen===admGen)cmsg("대화 목록을 불러오지 못했다. 운영자 등록과 데이터베이스 규칙을 확인해야 한다.")}}
function admLabel(k){const nm={};(admT[k]||[]).forEach(m=>nm[m.u]=m.n);return Object.keys(nm).map(u=>cn(u,nm[u])).join(" ↔ ")}
function drawAdm(){const l=$("#al");l.innerHTML="";const ks=Object.keys(admT).sort((a,b)=>{const x=admT[a],y=admT[b];return y[y.length-1].ts-x[x.length-1].ts});
 if(!ks.length){l.innerHTML="<p class='hint'>아직 1:1 대화가 없다.</p>"}
 ks.forEach(k=>{const b=document.createElement("button");b.type="button";b.className="chip";b.style.cssText="display:flex;justify-content:space-between;text-align:left";b.setAttribute("aria-pressed",admK===k?"true":"false");
  b.innerHTML="<span></span><strong></strong>";b.firstChild.textContent=admLabel(k);b.lastChild.textContent=admT[k].length+"개";b.onclick=()=>{admK=k;drawAdm()};l.appendChild(b)});
 $("#at2").hidden=!admK||!admT[admK];if(admK&&admT[admK]){$("#ah").textContent=admLabel(admK)+" (열람 전용)";paint($("#alg"),admT[admK].slice(),admK)}}
/* 채팅: 단체 채팅은 모두가 보는 공용방이고, 1:1은 두 사람이 같은 대화 키를 쓴다 */
let ct="g",peer=null,unC=null,unP=null,lastSend=0;
const cmsg=t=>{$("#cm2").style.color="var(--bad)";$("#cm2").textContent=t};
function chat(){const fresh=$("#v-chat").hidden;show("chat");admUI();$("#cm2").textContent="";if(!DB){cmsg("채팅 기능을 쓸 수 없다.");return}setT(ct,fresh)}
function sync(){$("#cin").hidden=ct==="a"||(ct==="d"&&!peer)}
/* 대화 그리기: 맨 아래를 보고 있을 때만 새 메시지를 따라 내려간다.
   위로 올려서 지난 대화를 읽는 중이면 그 자리를 지키고, 대신 '새 메시지 ↓' 버튼을 띄운다. th는 대화방 구분용이다. */
function newBtn(el,on){let b=document.getElementById(el.id+"-nb");
 if(!b){b=elT("button","newmsg","새 메시지 ↓");b.type="button";b.id=el.id+"-nb";b.hidden=true;b.onclick=()=>{pinLog(el,el.scrollHeight);b.hidden=true};el.after(b);
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
function pinLog(el,y){const b=el.style.scrollBehavior;el.style.scrollBehavior="auto";el.scrollTop=y;el.style.scrollBehavior=b}
function paint(el,ms,th){th=th==null?"":String(th);ms=ms.filter(m=>m&&!m.bt);const same=el.dataset.th===th,nearB=el.scrollHeight-el.scrollTop-el.clientHeight<40,top=el.scrollTop,prevLast=Number(el.dataset.last||0);
 ms.sort((a,b)=>a.ts-b.ts);el._ms=ms;const last=ms.length?Number(ms[ms.length-1].ts)||0:0;el.dataset.th=th;el.dataset.last=last;
 const keep=()=>{if(!same||nearB){const end=()=>pinLog(el,el.scrollHeight);end();newBtn(el,false);requestAnimationFrame(end)}else{pinLog(el,top);if(last>prevLast)newBtn(el,true)}};
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
function avSet(av,u){const mp=avMap();if(!mp)return true;const im=mp[u];if(im&&!av.querySelector("img")){const i=document.createElement("img");i.src=im;i.alt="";i.loading="lazy";av.textContent="";av.appendChild(i);av.classList.add("has")}return AVK.has(u)||Date.now()-avLast<300000}
function avLoad(){if(!DB||avBusy)return;if(AVK&&Date.now()-avLast<300000)return;avBusy=true;avLast=Date.now();
 plAll(AVK?0:undefined).then(()=>{avBusy=false;document.querySelectorAll(".cm-av[data-u]").forEach(a=>avSet(a,a.dataset.u))},()=>{avBusy=false})}
function setT(t,fresh){const enterDm=t==="d"&&(!!fresh||ct!=="d"||!!peer),enterAdm=t==="a"&&(!!fresh||ct!=="a");ct=t;unC&&unC();unC=null;unP&&unP();unP=null;if(t!=="a")admGen++
 document.querySelectorAll("#ct button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.t===t?"true":"false"));
 $("#cg").hidden=t!=="g";$("#cvl").hidden=t!=="v";$("#cd").hidden=t!=="d";$("#ca").hidden=t!=="a";
 if(t==="g")unC=apiWatchGlobal(ms=>paint($("#gl"),ms,"g"),()=>cmsg("채팅을 불러오지 못했다."));
 // 마을 채팅: 단체 채팅과 같은 저장 공간을 쓰되 이름이 "c_{마을}_"로 시작한다. 내 마을의 대화만 불러온다.
 else if(t==="v"){vcNew=false;vcMark();$("#cvh").textContent=VL[C.v].n+" 주민끼리 나누는 채팅이다. 다른 마을 주민에게는 보이지 않는다.";C.vcSeen=srvNow();save();updNav();
  unC=apiWatchVillage(C.v,ms=>{paint($("#vcl"),ms,"v"+C.v);C.vcSeen=srvNow()},()=>cmsg("마을 채팅을 불러오지 못했다."))}
 else if(t==="a"){if(enterAdm)watchAdm();else drawAdm()}else{peer=null;dmOpenGen++;$("#dt").hidden=true;$("#cpick").hidden=false;$("#pl2").dataset.sig="";
  dmApply();if(enterDm)dmList()}
 sync()}
/* 1:1 목록: 탭을 열 때 우편함(이름, 받은 시각)만 한 번 받는다. 본문은 그 상대를 열 때 한 번 받는다.
   C.dml = 상대별 마지막 시각. peerDocs = [id, {n, ts}]. */
let peerDocs=[],dmListGen=0,dmOpenGen=0;
function dmTrim(){if(!C||!C.dml)return;const ks=Object.keys(C.dml);if(ks.length>80)ks.sort((a,b)=>C.dml[a]-C.dml[b]).slice(0,ks.length-80).forEach(k=>delete C.dml[k])}
function dmApply(extra){if(!C)return;C.dml=C.dml||{};const rows={};
 const put=(id,n,ts)=>{if(!id||id===UID)return;const cur=rows[id]||{n:"",ts:0},nm=String(n||"").replace(/👑/g,"").slice(0,20);if(nm)cur.n=nm;const t=Number(ts)||0;if(t>cur.ts)cur.ts=t;rows[id]=cur};
 Object.keys(C.dml).forEach(id=>put(id,(C.dmn&&C.dmn[id])||(C.fr&&C.fr[id])||"",C.dml[id]));
 Object.keys(C.dmu||{}).forEach(id=>put(id,(C.dmn&&C.dmn[id])||(C.fr&&C.fr[id])||"",(C.dms&&C.dms[id])||C.dml[id]));
 Object.keys(extra||{}).forEach(id=>{const v=extra[id]||{};put(id,v.n,v.ts);if(v.n){C.dmn=C.dmn||{};C.dmn[id]=String(v.n).replace(/👑/g,"").slice(0,20)}if((Number(v.ts)||0)>(C.dml[id]||0))C.dml[id]=Number(v.ts)});
 dmTrim();peerDocs=Object.keys(rows).map(id=>[id,rows[id]]);
 if(!$("#v-chat").hidden&&ct==="d"&&$("#cpick")&&!$("#cpick").hidden)drawPeers()}
async function dmList(){const gen=++dmListGen;dmApply();if(!DB)return;try{const rows=await apiDmIndex();if(gen!==dmListGen||$("#v-chat").hidden||ct!=="d")return;dmApply(rows)}catch(e){if(gen===dmListGen)cmsg("대화 목록을 불러오지 못했다.")}}
function dmTouch(id,t){if(!C||!id)return;C.dml=C.dml||{};if((C.dml[id]||0)>=t)return;C.dml[id]=t;dmTrim();const row=peerDocs.find(x=>x[0]===id);if(row)row[1].ts=Math.max(row[1].ts||0,t);else peerDocs.push([id,{n:(C.dmn&&C.dmn[id])||(C.fr&&C.fr[id])||"",ts:t}]);if(!$("#v-chat").hidden&&ct==="d"&&$("#cpick")&&!$("#cpick").hidden)drawPeers()}
function drawPeers(){const l=$("#pl2");if(!l||!C)return;const fr=C.fr||{};
 const ps=peerDocs.filter(x=>x[0]!==UID&&x[1]).sort((a,b)=>(b[1].ts||0)-(a[1].ts||0)||String(a[1].n||"").localeCompare(String(b[1].n||""),"ko")).slice(0,60);
 const sig=ps.map(([id,p])=>id+"|"+(p.n||"")+"|"+(C.dmu&&C.dmu[id]?1:0)+"|"+(fr[id]?1:0)+"|"+(p.ts?agoTxt(p.ts):"")).join(",");if(l.dataset.sig===sig)return;l.dataset.sig=sig;l.innerHTML="";
 if(!ps.length){l.innerHTML="<p class='hint'>아직 대화를 나눈 상대가 없다.</p>";const b=elT("button","btn g","친구 목록에서 대화 시작하기");b.type="button";b.onclick=()=>friends();l.appendChild(b)}
 ps.forEach(([id,p])=>{const b=document.createElement("button");b.type="button";b.className="chip";b.style.textAlign="left";b.dataset.id=id;const when=p.ts?agoTxt(p.ts):"";b.textContent=(C.dmu&&C.dmu[id]?"● ":"")+(fr[id]?"☍ ":"")+cn(id,p.n||"상대")+(when?" · "+when:"");b.setAttribute("aria-pressed",peer===id?"true":"false");b.onclick=()=>openDM(id,p.n||"상대");b.style.flex="1";
  const w=document.createElement("div");w.style.cssText="display:flex;gap:8px";const pb=document.createElement("button");pb.type="button";pb.className="chip";pb.style.cssText="flex:0 0 auto;min-width:0;padding:10px 14px";pb.textContent="프로필";pb.onclick=()=>openProfile(id);w.append(b,pb);l.appendChild(w)})}
setInterval(()=>{if(C&&!$("#v-chat").hidden&&ct==="d"&&$("#cpick")&&!$("#cpick").hidden)drawPeers()},60000);
function dmPaint(ms,k){const el=$("#dl"),mine=(el._ms||[]).filter(m=>m&&m.u===UID&&!ms.some(s=>s&&s.u===m.u&&s.x===m.x&&Math.abs((Number(s.ts)||0)-(Number(m.ts)||0))<15000));paint(el,ms.concat(mine),k)}
function dmLoad(id,quiet){if(!DB)return;const k=[UID,id].sort().join("_"),gen=++dmOpenGen;if(!quiet){const el=$("#dl");el._ms=[];el.dataset.th="";el.innerHTML="<div class='cm-empty'><p>대화를 불러오는 중...</p></div>"}
 return apiDmThread(k).then(sn=>{if(gen!==dmOpenGen||peer!==id||$("#v-chat").hidden||ct!=="d"||$("#dt").hidden)return;dmPaint((sn.docs||[]).map(d=>d.data()).filter(Boolean),k)},e=>{if(!quiet&&gen===dmOpenGen)cmsg("대화를 불러오지 못했다. (오류 "+String(e&&e.message||e).replace(/\D/g,"").slice(0,3)+")")})}
function openDM(id,n){peer=id;unC&&unC();unC=null;$("#cpick").hidden=true;if(C&&C.dmu&&C.dmu[id]){delete C.dmu[id];save()}const name=n||(C&&C.dmn&&C.dmn[id])||(C&&C.fr&&C.fr[id])||"상대";$("#dh").textContent=name+"와의 1:1 대화";$("#dt").hidden=false;dmLoad(id);sync()}
$("#dpng").onclick=()=>dmPng($("#dl"),$("#dh").textContent);$("#apng").onclick=()=>dmPng($("#alg"),$("#ah").textContent);
/* 채팅 순서: 예전에는 보내는 사람 기기의 시계로 시각(ts)을 적었다. 기기 시계가 30~40초 빠르거나 느린 사람이 있으면
   그 사람 메시지가 맨 아래에 붙어 있다가 다른 메시지들 사이로 끼어 올라가는 일이 생겼다.
   이제 시각은 서버가 직접 적고({".sv":"timestamp"}), 메시지 이름(순서용)도 서버 시계에 맞춘 시각으로 만든다. */
let SKEW=0,skewOk=false;const srvNow=()=>Date.now()+SKEW;
const clockSync=()=>apiClockSync();
// 너무 빨리 연달아 보내면 버리지 않고 잠깐 기다렸다가 보낸다.
let sendT=null;
function send(){const x=$("#ci").value.trim();if(!x)return;const wait=800-(Date.now()-lastSend);if(wait>0){clearTimeout(sendT);sendT=setTimeout(send,wait);return}if(ct==="d"&&!peer)return cmsg("대화 상대를 먼저 골라야 한다.");
 lastSend=Date.now();clockSync();const id=(ct==="v"?"c_"+C.v+"_":"")+srvNow().toString(36)+Math.random().toString(36).slice(2,6),d={u:UID,n:C.n,x:x,ts:{".sv":"timestamp"}};if(ct==="v")d.vc=C.v;if(tiName(C.ti))d.t=tiName(C.ti);const to=ct==="d"?peer:null;if(to)d.k=[UID,to].sort().join("_");
 apiPostMessage(ct==="d"?"dm":"chat",id,d).then(()=>{const fields={};if(to){const msg={u:UID,n:C.n,x,ts:Date.now()};if(d.t)msg.t=d.t;dmTouch(to,msg.ts);if(C.dml&&C.dml[to])fields["dml/"+to]=C.dml[to];apiDmBell(to,x);if(peer===to&&$("#dt")&&!$("#dt").hidden){const el=$("#dl");paint(el,(el._ms||[]).concat([msg]),[UID,to].sort().join("_"))}}$("#ci").value="";$("#cm2").textContent="";titleState();fields["stats/chats"]=(C.stats.chats||0)+1;apiAccountWrite(fields).catch(()=>{})}).catch(e=>{const c=String(e&&e.message||e);cmsg(c==="401"||c==="403"?"메시지를 보내지 못했다. 서버 규칙에서 쓰기가 막혀 있다. (오류 "+c+")":"메시지를 보내지 못했다. 인터넷 연결을 확인하고 다시 보내 보자. (오류 "+c+")")})}
// 목록으로 돌아가면 상대와 받은 시각만 다시 한 번 받는다. 본문은 받지 않는다.
$("#pchg").onclick=()=>{dmOpenGen++;unC&&unC();unC=null;peer=null;$("#dt").hidden=true;$("#cpick").hidden=false;sync();dmList()};
// 엔터와 보내기 버튼 모두 폼 제출로 처리한다. 휴대폰 한글 키보드에서도 엔터가 확실히 먹는다.
$("#cin").onsubmit=e=>{e.preventDefault();send()};

/* 1:1 새 메시지 알림: 우편함에는 이름과 시각만 있다. 본문은 그 대화를 열 때 받는다.
   C.dms = 보낸 사람별로 마지막으로 확인한 시각, C.dmu = 아직 안 읽은 사람, C.dmn = 보낸 사람 이름. */
const goDM=(u,n)=>{const name=n||(C&&C.dmn&&C.dmn[u])||(C&&C.fr&&C.fr[u])||"상대";if($("#v-chat").hidden||ct!=="d"){ct="d";chat()}openDM(u,name)};
let dmBusy=false;
/* 1:1 알림 신호: rooms/xd{받는 사람}/{보낸 사람}과 dmn 에는 이름과 시각만 남긴다. 본문은 dm 에만 있다. */
function dmBell(to,x){apiDmBell(to,x)}
async function checkDM(){if(!AUTH.uid||!C||!DB||dmBusy)return;dmBusy=true;try{const got={};
 const take=(f,v)=>{if(!v||typeof v!=="object"||typeof v.ts!=="number")return;if(!got[f]||v.ts>got[f].ts)got[f]=v};
 try{const d=(await apiDmBox()).data()||{};Object.keys(d).forEach(f=>{if(f!=="ts")take(f,d[f])})}catch(e){}
 try{const s=await apiDmnList();s.docs.forEach(d=>take(d.id,d.data()))}catch(e){}
 if(!C)return;const first=!C.dms;C.dms=C.dms||{};C.dmu=C.dmu||{};C.dmn=C.dmn||{};let ch=false;
 for(const f of Object.keys(got)){const v=got[f];if(v.ts<=(C.dms[f]||0))continue;C.dms[f]=v.ts;ch=true;const n=String(v.n||"누군가").slice(0,20);C.dmn[f]=n;dmTouch(f,v.ts);
  if(first)continue;// 이 기능이 처음 켜질 때는 예전 메시지로 알림을 쏟아 내지 않는다.
  if(!$("#v-chat").hidden&&ct==="d"&&peer===f){dmLoad(f,1);continue}// 그 대화를 보고 있으면 본문만 한 번 다시 받는다.
  C.dmu[f]=1;const x=String(v.x||"").slice(0,40);note("dm",n+"님에게서 1:1 메시지가 왔다"+(x?": "+x:"."),f);toast("✉ "+n+(x?": "+x:"님에게서 1:1 메시지가 왔다"),()=>goDM(f,n));ding()}
 if(ch){save();updNav();if(!$("#v-chat").hidden&&ct==="d")document.querySelectorAll("#pl2 .chip").forEach(c=>{if(c.dataset.id&&C.dmu[c.dataset.id]&&!/^● /.test(c.textContent))c.textContent="● "+c.textContent})}}
 catch(e){}finally{dmBusy=false}}
setInterval(()=>{if(!document.hidden)checkDM()},10000);
$("#ct").onclick=e=>{const t=e.target.dataset&&e.target.dataset.t;if(t&&DB)setT(t)};
// 마을 채팅에 새 메시지가 오면(내가 보지 않는 동안) 탭에 ● 표시를 한다. 30초마다 가장 최근 메시지 한 개만 확인한다.
let vcNew=false;function vcMark(){const b=document.querySelector("#ct [data-t=v]");if(b)b.textContent="마을 채팅"+(vcNew?" ●":"")}
setInterval(async()=>{if(!C||!DB||!XON()||!AUTH.uid||document.hidden)return;if(!$("#v-chat").hidden&&ct==="v"){vcNew=false;vcMark();return}
 try{const sn=await apiVillageLatest(C.v),m=sn.docs.map(d=>d.data())[0];vcNew=!!(m&&m.vc===C.v&&m.u!==UID&&Number(m.ts)>(C.vcSeen||0));vcMark()}catch(e){}},60000);
