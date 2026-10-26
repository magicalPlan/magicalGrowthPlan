/* 교류 게시판. main.js 다음에 불러야 한다. 글, 댓글, 답글, 사진, 고정과 작성 중인 초안.
   메뉴와 알림함은 board 를 그대로 부른다. */
let BD=[],bdT=0,bdOpen=null,bdLast=0,bdReply=null,bdBusy=false;
// 작성 중인 글과 댓글을 보관한다. 화면이 새로 그려지거나 다른 탭에 다녀와도, 새로고침해도 이어서 쓸 수 있다(올리면 지워진다).
let bdDraft={};try{bdDraft=JSON.parse(localStorage.getItem("mgr_bd_draft")||"{}")||{}}catch(e){}
const bdSave=()=>{try{localStorage.setItem("mgr_bd_draft",JSON.stringify(bdDraft))}catch(e){}};
// 입력칸에 커서가 있거나 쓰다 만 내용이 있으면 자동 새로고침으로 화면을 다시 그리지 않는다.
const bdTyping=()=>{const a=document.activeElement;return !!(a&&$("#bdl")&&$("#bdl").contains(a)&&/^(INPUT|TEXTAREA)$/.test(a.tagName))};
const bdId=()=>"b_"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const bdAgo=t=>{const m=Math.floor((Date.now()-t)/60000);return m<1?"방금":m<60?m+"분 전":m<1440?Math.floor(m/60)+"시간 전":Math.floor(m/1440)+"일 전"};
async function loadBoard(force){if(!DB||!XON()||bdBusy)return;if(!force&&Date.now()-bdT<10000)return;bdBusy=true;bdT=Date.now();
 try{const sn=await once(DB.collection("chat").prefix("b_").limit(BD_MAX));BD=sn.docs.map(d=>Object.assign({id:d.id},d.data()||{})).filter(m=>m&&m.bt&&m.u&&typeof m.ts==="number");bdNotify()}catch(e){}finally{bdBusy=false}}
// 지워진 것: 글쓴이 본인이나 운영자가 남긴 지움 표시가 있는 글·댓글
// 고정: 운영자가 남긴 고정·해제 표시 중 가장 최근 것을 따른다. 고정된 글은 고정한 시각 순으로 맨 위에 온다.
function bdPins(){const last={};BD.filter(m=>(m.bt==="pin"||m.bt==="unpin")&&ADM[m.u]&&m.ref).sort((a,b)=>a.ts-b.ts).forEach(m=>{last[m.ref]=m.bt==="pin"?m.ts:0});Object.keys(last).forEach(k=>{if(!last[k])delete last[k]});return last}
// 수정: 저장 공간이 '새로 쓰기'만 허락하므로, 수정은 {bt:"e", ref:대상, x:새 내용} 기록을 새로 남기는 방식이다.
// 원래 글쓴이 본인이 남긴 수정 기록만 인정하고, 그중 가장 최근 것을 보여 준다.
let bdEdit=null;
function bdEdits(){const by={};BD.forEach(m=>{by[m.id]=m});const ed={};BD.filter(m=>m.bt==="e"&&by[m.ref]&&by[m.ref].u===m.u&&typeof m.x==="string").sort((a,b)=>a.ts-b.ts).forEach(m=>{ed[m.ref]={x:m.x,ts:m.ts}});return ed}
function bdDead(){const by={};BD.forEach(m=>{by[m.id]=m});const dead={};BD.filter(m=>m.bt==="d"&&by[m.ref]&&(by[m.ref].u===m.u||ADM[m.u])).forEach(m=>dead[m.ref]=1);return dead}
// 내 글에 달린 댓글, 내 댓글에 달린 답글을 알려 준다.
function bdNotify(){if(!C)return;const first=C.bdSeen==null,seen=C.bdSeen||0,dead=bdDead(),by={};BD.forEach(m=>by[m.id]=m);let mx=seen,n=0;
 BD.filter(m=>m.bt==="c"&&m.u!==UID&&m.ts>seen&&!dead[m.id]).forEach(m=>{mx=Math.max(mx,m.ts);const post=by[m.p],par=m.r?by[m.r]:null;if(!post||dead[m.p])return;
  if(!first&&((par&&par.u===UID)||(!par&&post.u===UID))){n++;note("board",String(m.n||"누군가")+"님이 "+(par?"내 댓글에 답글을":"내 글 「"+String(post.ti||"").slice(0,20)+"」에 댓글을")+" 달았다: "+String(m.x||"").slice(0,40),m.p)}});
 if(first||mx>seen){C.bdSeen=Math.max(mx,first?Date.now():0);save()}if(n){toast("📝 게시판에 새 댓글 "+n+"개");ding()}}
// 게시판은 보고 있을 때 1분마다, 다른 화면에서는 새 댓글 알림용으로 5분마다만 새로 받는다.
let bdBgT=0;setInterval(()=>{if(!C||!AUTH.uid||document.hidden)return;const on=!$("#v-board").hidden;if(!on&&Date.now()-bdBgT<300000)return;bdBgT=Date.now();loadBoard().then(()=>{if(on&&!bdTyping())drawBoard()})},60000);
function board(post){show("board");if(post!==undefined)bdOpen=post;$("#bdm").textContent="";drawBoard();loadBoard(true).then(()=>{if(!bdTyping())drawBoard()})}
const bdName=m=>{const s=elT("span","bd-who");const b=elT("b","",cn(m.u,m.n));if(m.u!==UID){b.style.cursor="pointer";b.onclick=e=>{e.stopPropagation();openProfile(m.u)}}s.appendChild(b);if(m.tn)s.appendChild(elT("span","ttl-chip",String(m.tn).slice(0,20)));s.appendChild(elT("small",""," · "+bdAgo(m.ts)));return s};let bdImg=null;const BDIC={};
function bdShrink(file,cb){if(!file||!/^image\//.test(file.type))return cb(null,"사진 파일만 올릴 수 있다.");const u=URL.createObjectURL(file),im=new Image();
 im.onload=()=>{URL.revokeObjectURL(u);let w=im.width,h=im.height;const k=Math.min(1,BDI_MAX/Math.max(w,h));w=Math.max(1,Math.round(w*k));h=Math.max(1,Math.round(h*k));
  const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(im,0,0,w,h);let q=.75,d=c.toDataURL("image/jpeg",q);
  while(d.length>BDI_KB*1370&&q>.35){q-=.1;d=c.toDataURL("image/jpeg",q)}if(d.length>BDI_KB*1370)return cb(null,"사진이 너무 크다. 다른 사진을 골라 보자.");cb(d)};
 im.onerror=()=>{URL.revokeObjectURL(u);cb(null,"사진을 읽지 못했다.")};im.src=u}
async function bdImgLoad(id){if(BDIC[id]!==undefined)return BDIC[id];try{const v=(await DB.doc("chat/bimg_"+id).get()).data();BDIC[id]=v&&typeof v.im==="string"&&/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(v.im)?v.im:null}catch(e){return null}return BDIC[id]}
async function bdWrite(doc,okMsg,fixedId){const m=$("#bdm");if(Date.now()-bdLast<BD_GAP){m.style.color="var(--bad)";m.textContent="너무 빨리 쓰고 있다. 잠시 뒤에 다시 쓰자.";return false}
 const id=fixedId||bdId(),d=Object.assign({u:UID,n:nmOf(),ts:Date.now()},tiName(C.ti)?{tn:tiName(C.ti)}:{},doc);
 try{await DB.doc("chat/"+id).set(d);bdLast=Date.now();BD.push(Object.assign({id},d));if(okMsg){m.style.color="var(--mu)";m.textContent=okMsg}return id}
 catch(e){m.style.color="var(--bad)";m.textContent="올리지 못했다. 캐릭터가 서버에 저장돼 있는지(위쪽 경고)와 인터넷 연결을 확인해야 한다.";return false}}
function drawBoard(){const box=$("#bdl");if(!box||!C)return;box.innerHTML="";if(!XON()){box.appendChild(elT("p","hint","서버에 연결되어야 게시판을 쓸 수 있다."));return}
 const dead=bdDead(),eds=bdEdits(),pins=bdPins(),posts=BD.filter(m=>m.bt==="p"&&!dead[m.id]).sort((a,b)=>(pins[b.id]||0)-(pins[a.id]||0)||b.ts-a.ts),cmts=BD.filter(m=>m.bt==="c"&&!dead[m.id]).map(m=>eds[m.id]?Object.assign({},m,{x:eds[m.id].x,ed:eds[m.id].ts}):m);
 if(bdOpen){const p=posts.find(x=>x.id===bdOpen);const back=elT("button","btn g","← 글 목록");back.type="button";back.style.cssText="width:auto;padding:8px 14px;margin:0 0 10px";back.onclick=()=>{bdOpen=null;bdReply=null;bdEdit=null;drawBoard()};box.appendChild(back);
  if(!p){box.appendChild(elT("p","hint","지워졌거나 찾을 수 없는 글이다."));return}
  const c=elT("div","card bd-post");if(pins[p.id])c.classList.add("pinned");c.append(elT("h2","",(pins[p.id]?"📌 ":"")+(p.ti||"(제목 없음)")),bdName(p),elT("p","bd-body",String(p.x||"")));
  if(p.img){const fig=elT("div","bd-img");fig.appendChild(elT("p","hint","사진을 불러오는 중…"));c.appendChild(fig);bdImgLoad(p.id).then(src=>{fig.innerHTML="";if(!src){fig.appendChild(elT("p","hint","사진을 불러오지 못했다."));return}const i=document.createElement("img");i.src=src;i.alt=(p.ti||"게시글")+" 사진";i.loading="lazy";i.onclick=()=>imgFull(src,p.ti||"");fig.appendChild(i)})}
  if(ADM[UID]){const pb=elT("button","chip",pins[p.id]?"고정 해제":"📌 맨 위에 고정");pb.type="button";pb.style.cssText="margin:8px 6px 0 0;padding:6px 12px;font-size:.82rem";pb.onclick=async()=>{bdLast=0;if(await bdWrite({bt:pins[p.id]?"unpin":"pin",ref:p.id},pins[p.id]?"고정을 풀었다.":"글을 맨 위에 고정했다."))drawBoard()};c.appendChild(pb)}
  if(p.u===UID||ADM[UID]){const del=elT("button","chip","글 지우기");del.type="button";del.style.cssText="margin-top:8px;padding:6px 12px;font-size:.82rem";del.onclick=async()=>{if(!confirm("이 글을 지울까? 댓글도 함께 보이지 않게 된다."))return;bdLast=0;if(await bdWrite({bt:"d",ref:p.id},"글을 지웠다.")){bdOpen=null;drawBoard()}};c.appendChild(del)}
  box.appendChild(c);
  // 답글에도 계속 답글을 달 수 있다. 들여쓰기는 4단계까지만 깊어지고, 그보다 깊으면 누구에게 단 답글인지 @이름으로 보여 준다.
  const mine=cmts.filter(x=>x.p===p.id),byId={};mine.forEach(x=>byId[x.id]=x);const tops=mine.filter(x=>!x.r||!byId[x.r]).sort((a,b)=>a.ts-b.ts);box.appendChild(elT("h2","","댓글 "+mine.length));
  const cmtEl=(m,lvl)=>{const w=elT("div","bd-cmt"+(lvl?" re":""));if(lvl)w.style.marginLeft=(Math.min(lvl,4)*20)+"px";const par=m.r&&byId[m.r];
   const body=elT("p","bd-body","");if(lvl>=2&&par){body.appendChild(elT("span","bd-at","@"+cn(par.u,par.n)+" "))}else if(m.r&&!par){body.appendChild(elT("span","bd-at","(지워진 댓글에 단 답글) "))}body.appendChild(document.createTextNode(String(m.x||"")));const nm=bdName(m);if(m.ed)nm.appendChild(elT("small","bd-ed"," · 수정됨"));w.append(nm);
   if(bdEdit===m.id&&m.u===UID){const ef=elT("form","row bd-cf");ef.style.flexWrap="nowrap";const ei=elT("input");ei.type="text";ei.maxLength=BD_CMT;ei.value=String(m.x||"");ei.setAttribute("aria-label","댓글 수정");ei.style.flex="1";
    const es=elT("button","btn","저장");es.type="submit";es.style.cssText="width:auto;margin:0;padding:9px 14px";const ec=elT("button","btn g","취소");ec.type="button";ec.style.cssText="width:auto;margin:0;padding:9px 14px";ec.onclick=()=>{bdEdit=null;drawBoard()};ef.append(ei,es,ec);
    ef.onsubmit=async e=>{e.preventDefault();const x=ei.value.trim().slice(0,BD_CMT);if(!x){$("#bdm").style.color="var(--bad)";$("#bdm").textContent="내용을 비울 수는 없다. 지우려면 '지우기'를 누르자.";return}if(x===String(m.x||"")){bdEdit=null;drawBoard();return}
     es.disabled=true;bdLast=0;const ok=await bdWrite({bt:"e",ref:m.id,x},"댓글을 고쳤다.");es.disabled=false;if(ok){bdEdit=null;drawBoard()}};
    w.appendChild(ef);setTimeout(()=>{ei.focus();ei.setSelectionRange(ei.value.length,ei.value.length)});return w}
   w.appendChild(body);const act=elT("div","bd-act");
   {const r=elT("button","chip","답글");r.type="button";r.onclick=()=>{bdReply=bdReply===m.id?null:m.id;drawBoard()};act.appendChild(r)}
   if(m.u===UID){const e2=elT("button","chip","수정");e2.type="button";e2.onclick=()=>{bdEdit=m.id;bdReply=null;drawBoard()};act.appendChild(e2)}
   if(m.u===UID||ADM[UID]){const d=elT("button","chip","지우기");d.type="button";d.onclick=async()=>{if(!confirm("이 댓글을 지울까?"))return;bdLast=0;if(await bdWrite({bt:"d",ref:m.id},"댓글을 지웠다."))drawBoard()};act.appendChild(d)}
   w.appendChild(act);if(bdReply===m.id)w.appendChild(bdForm(p.id,m.id,"@"+String(m.n||"")+"에게 답글 (최대 "+BD_CMT+"자)"));return w};
  const tree=(m,lvl,seen)=>{if(seen[m.id])return;seen[m.id]=1;box.appendChild(cmtEl(m,lvl));mine.filter(x=>x.r===m.id).sort((a,b)=>a.ts-b.ts).forEach(c=>tree(c,lvl+1,seen))};
  if(!tops.length)box.appendChild(elT("p","hint","아직 댓글이 없다. 첫 댓글을 남겨 보자."));
  {const seen={};tops.forEach(t=>tree(t,0,seen))}
  box.appendChild(bdForm(p.id,"","댓글을 입력 (최대 "+BD_CMT+"자)"));return}
 const top=elT("div","row");top.style.cssText="justify-content:space-between;align-items:center;margin-bottom:10px";top.appendChild(elT("p","hint","글 "+posts.length+"개 · 최근 글이 위에 온다."));
 const wb=elT("button","btn","✎ 글쓰기");wb.type="button";wb.style.cssText="width:auto;margin:0;padding:9px 16px";top.appendChild(wb);box.appendChild(top);
 const f=elT("form","card bd-new");f.hidden=!bdDraft.open;const ti=elT("input");ti.type="text";ti.maxLength=BD_TITLE;ti.placeholder="제목 (최대 "+BD_TITLE+"자)";ti.setAttribute("aria-label","제목");
 const tx=elT("textarea");tx.rows=6;tx.maxLength=BD_BODY;tx.placeholder="내용 (최대 "+BD_BODY+"자)";tx.setAttribute("aria-label","내용");tx.style.marginTop="8px";
 const go=elT("button","btn","올리기");go.type="submit";const cc=elT("button","btn g","취소");cc.type="button";
 const pr=elT("div","bd-pick"),fi=elT("input");fi.type="file";fi.accept="image/*";fi.hidden=true;const pb=elT("button","chip","📷 사진 첨부");pb.type="button";pb.onclick=()=>fi.click();const pv=elT("div","bd-pv");
 const drawPv=()=>{pv.innerHTML="";if(!bdImg)return;const i=document.createElement("img");i.src=bdImg;i.alt="첨부한 사진 미리보기";const x=elT("button","chip","사진 빼기");x.type="button";x.onclick=()=>{bdImg=null;drawPv()};pv.append(i,x)};
 fi.onchange=()=>{const file=fi.files&&fi.files[0];fi.value="";if(!file)return;pb.disabled=true;bdShrink(file,(d,err)=>{pb.disabled=false;if(!d){$("#bdm").style.color="var(--bad)";$("#bdm").textContent=err;return}bdImg=d;$("#bdm").textContent="";drawPv()})};
 pr.append(pb,fi,elT("small","","사진 1장 · 자동으로 작게 줄여서 올린다"));drawPv();
 f.append(ti,tx,pr,pv,go,cc);ti.value=bdDraft.nt||"";tx.value=bdDraft.nx||"";
 ti.oninput=()=>{bdDraft.nt=ti.value;bdSave()};tx.oninput=()=>{bdDraft.nx=tx.value;bdSave()};
 if(f.hidden===false&&(bdDraft.nt||bdDraft.nx))f.appendChild(elT("p","hint","작성 중이던 글을 불러왔다."));
 cc.onclick=()=>{f.hidden=true;bdDraft.open=0;bdImg=null;bdSave()};
 wb.onclick=()=>{f.hidden=!f.hidden;bdDraft.open=f.hidden?0:1;bdSave();if(!f.hidden)ti.focus()};
 f.onsubmit=async e=>{e.preventDefault();const t=ti.value.trim().slice(0,BD_TITLE),x=tx.value.trim().slice(0,BD_BODY);if(!t||!x){$("#bdm").style.color="var(--bad)";$("#bdm").textContent="제목과 내용을 모두 적어야 한다.";return}
  go.disabled=true;let id;if(bdImg){const nid=bdId();try{await DB.doc("chat/bimg_"+nid).set({bt:"img",u:UID,ts:Date.now(),im:bdImg})}catch(e){go.disabled=false;$("#bdm").style.color="var(--bad)";$("#bdm").textContent="사진을 올리지 못했다. 사진을 빼고 다시 올려 보자.";return}
   BDIC[nid]=bdImg;id=await bdWrite({bt:"p",ti:t,x,img:1},"글을 올렸다.",nid);if(id)bdImg=null}else id=await bdWrite({bt:"p",ti:t,x},"글을 올렸다.");go.disabled=false;if(id){delete bdDraft.nt;delete bdDraft.nx;bdDraft.open=0;bdSave();titleState();C.stats.posts=(C.stats.posts||0)+1;save();checkTitles();bdOpen=id;drawBoard()}};
 box.appendChild(f);
 if(!posts.length){box.appendChild(elT("p","hint","아직 글이 없다. 첫 글을 남겨 보자."));return}
 posts.forEach(p=>{const n=cmts.filter(x=>x.p===p.id).length,r=elT("button","bd-item"+(pins[p.id]?" pinned":""));r.type="button";const h=elT("div","bd-ti");if(pins[p.id])h.appendChild(elT("span","bd-pin","📌 고정"));h.append(elT("b","",p.ti||"(제목 없음)"));if(p.img)h.appendChild(elT("span","bd-n","📷"));if(n)h.appendChild(elT("span","bd-n","["+n+"]"));
  r.append(h,bdName(p),elT("p","bd-prev",String(p.x||"").replace(/\s+/g," ").slice(0,80)));r.onclick=()=>{bdOpen=p.id;bdReply=null;drawBoard();window.scrollTo(0,0)};box.appendChild(r)})}
function bdForm(pid,rid,ph){const key="c:"+pid+":"+(rid||""),f=elT("form","row bd-cf");f.style.flexWrap="nowrap";const i=elT("input");i.type="text";i.maxLength=BD_CMT;i.placeholder=ph;i.setAttribute("aria-label",ph);i.style.flex="1";
 i.value=bdDraft[key]||"";i.oninput=()=>{if(i.value)bdDraft[key]=i.value;else delete bdDraft[key];bdSave()};
 const b=elT("button","btn",rid?"답글":"댓글");b.type="submit";b.style.cssText="width:auto;margin:0;padding:9px 14px";f.append(i,b);
 f.onsubmit=async e=>{e.preventDefault();const x=i.value.trim().slice(0,BD_CMT);if(!x)return;b.disabled=true;const ok=await bdWrite({bt:"c",p:pid,r:rid||"",x});b.disabled=false;if(ok){delete bdDraft[key];bdSave();titleState();C.stats.comments=(C.stats.comments||0)+1;save();checkTitles();bdReply=null;drawBoard()}};
 if(rid)setTimeout(()=>i.focus());return f}
