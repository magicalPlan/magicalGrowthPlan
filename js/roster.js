/* 등록자 탭. main.js 다음에 불러야 한다. 등록된 마법사 카드, 검색, 정렬.
   메뉴의 등록자 탭은 roster 를 그대로 부른다. 카드를 누르면 프로필이 열린다.
   기본은 전투력 높은 순이다. 순서를 바꾸면 그 기준의 상위 20명부터 다시 받는다.
   아래로 내리면 같은 기준으로 다음 20명을 받는다. 주기적으로 다시 받지 않는다.
   이름을 입력하면 apiRosterFind 가 사진 없는 명부에서 그 글자가 들어간 사람을 찾는다. 불러온 20명 안에서만 거르지 않는다.
   정렬별 목록은 약 45초 동안 메모리에 두어, 탭을 다시 열 때 바로 보여 준다.
   휴면(dm): 활성(RS)에서 빼고 RSD 에 모아, 목록을 다 받은 뒤 최하단 '화원'으로만 그린다.
   공개 사진은 스윕에서 하드 삭제되므로 카드에도 올리지 않는다(이니셜만). */
const RS_PAGE=20,RS_TTL=45000;
let RS=[],RSD=[],rsHits=[],rsQ="",rsS="pw",rsEdge=null,rsDone=false,rsBusy=false,rsGen=0,rsFindGen=0,rsFindBusy=false,rsFindErr=false,rsFindT=null,rsShown=RS_PAGE,rsBag={};
function rsSnapSave(){if(rsQ.trim()||!RS.length)return;rsBag[rsS]={at:Date.now(),list:RS.slice(),dm:RSD.slice(),edge:rsEdge?{v:rsEdge.v,n:rsEdge.n}:null,done:!!rsDone,shown:rsShown}}
function rsSnapUse(){const c=rsBag[rsS];if(!c||!c.list||!c.list.length||Date.now()-c.at>RS_TTL)return false;RS=c.list.slice();RSD=Array.isArray(c.dm)?c.dm.slice():[];rsEdge=c.edge?{v:c.edge.v,n:c.edge.n}:null;rsDone=!!c.done;rsShown=c.shown||RS_PAGE;rsBusy=false;return true}
function rsField(){return rsS==="lv"?"lv":"pw"}
function rsIsDm(p){return typeof isDm==="function"?isDm(p):!!p&&Number(p.dm)===1}
function rsList(){const f=rsField(),L=(rsQ.trim()?rsHits:RS).slice();
 if(rsQ.trim())L.sort((a,b)=>{const da=rsIsDm(a)?1:0,db=rsIsDm(b)?1:0;return da-db||(Number(b[f])||0)-(Number(a[f])||0)||(a.u<b.u?-1:1)});
 else L.sort((a,b)=>(Number(b[f])||0)-(Number(a[f])||0)||(a.u<b.u?-1:1));
 return L}
function rsDmList(){const f=rsField(),L=RSD.slice();
 L.sort((a,b)=>(Number(b[f])||0)-(Number(a[f])||0)||(a.u<b.u?-1:1));return L}
function rsFind(){clearTimeout(rsFindT);const q=rsQ.trim();
 if(!q){rsFindGen++;rsHits=[];rsFindBusy=false;rsFindErr=false;rsShown=RS_PAGE;if(!$("#v-roster").hidden){rsDraw();rsFill()}return}
 rsHits=[];rsFindErr=false;rsFindBusy=true;rsShown=RS_PAGE;rsDraw();
 rsFindT=setTimeout(()=>{const gen=++rsFindGen;apiRosterFind(q).then(L=>{if(gen!==rsFindGen||rsQ.trim()!==q||$("#v-roster").hidden)return;rsFindBusy=false;rsHits=L||[];rsDraw()},()=>{if(gen!==rsFindGen||rsQ.trim()!==q)return;rsFindBusy=false;rsFindErr=true;rsHits=[];rsDraw()})},280)}
function rsBound(){const f=rsField();let v=null,n=0;RS.concat(RSD).forEach(p=>{const x=Number(p[f]);if(v==null||x<v){v=x;n=1}else if(x===v)n++});return v==null?null:{v,n}}
function rsTakeDm(seen,v,id){if(seen[id])return false;if(!v.n)return false;seen[id]=1;RSD.push(Object.assign({u:id},v));return true}
async function rsLoad(){if(rsBusy||rsDone||!DB)return 0;const gen=rsGen,field=rsField(),edge=rsEdge,take=edge?RS_PAGE+edge.n:RS_PAGE;rsBusy=true;
 try{let q=DB.collection("players").by(field).limit(take);if(edge)q=q.end(edge.v);const sn=await once(q);if(gen!==rsGen)return 0;const raw=sn.docs||[],seen={};RS.forEach(p=>seen[p.u]=1);RSD.forEach(p=>seen[p.u]=1);let added=0,got=0;
  raw.forEach(d=>{if(seen[d.id])return;const v=d.data()||{};if(!v.n||v[field]==null)return;got++;
   if(rsIsDm(v)){rsTakeDm(seen,v,d.id);return}
   seen[d.id]=1;RS.push(Object.assign({u:d.id},v));added++});
  /* 휴면만 있는 페이지(added=0, got>0)도 경계를 밀고 이어 받는다. */
  if(raw.length<take||!got)rsDone=true;else rsEdge=rsBound();
  if(added>0||got>0||rsDone)rsSnapSave();return added}
 catch(e){if(gen===rsGen)rsDone=true;return -1}finally{rsBusy=false}}
function rsCard(p,dormant){const c=document.createElement("button");c.type="button";c.className="ros-card"+(p.u===UID?" me":"")+(dormant?" dm":"");c.onclick=()=>openProfile(p.u);
  const top=elT("div","ros-top"),av=elT("div","ros-av");
  if(!dormant&&typeof p.im==="string"&&/^(data:image|https:)/.test(p.im)){const im=document.createElement("img");im.src=p.im;im.alt=String(p.n)+" 프로필 사진";im.loading="lazy";av.appendChild(im);hiAv(im,p.u);av.classList.add("has");av.title="사진 크게 보기";av.onclick=e=>{e.stopPropagation();picOpen(p.u,p.im,String(p.n))}}
  else av.textContent=String(p.n).slice(0,1);
  if(!dormant&&isOn(p)){const o=elT("i","ros-on","");o.title="접속 중";av.appendChild(o)}
  top.append(av,elT("b","ros-g g"+p.g,p.g+"등급"));
  c.append(top,elT("p","ros-n",cn(p.u,p.n)+(p.u===UID?" (나)":"")));
  if(dormant)c.appendChild(elT("p","ros-hw","화원"));
  else{const ti=tiName(p.ti,p.tn);if(ti)c.appendChild(elT("p","ros-ti","「"+ti+"」"))}
  const at=elT("p","ros-at");String(p.a||"").split(" · ").filter(Boolean).forEach(a=>{const t=AT.find(x=>x[0]===a),sp=elT("span","ros-chip",a);if(t)sp.style.setProperty("--c",t[1]);at.appendChild(sp)});c.appendChild(at);
  c.appendChild(elT("p","ros-meta",[p.t?"특성 "+p.t:"",VL[p.v]?VL[p.v].n:""].filter(Boolean).join(" · ")));
  c.appendChild(elT("p","ros-meta","Lv "+(p.lv||1)+(p.pw?" · 전투력 "+p.pw:"")+( !dormant&&p.pet&&p.pet.s&&PETS[p.pet.s]?" · "+PETS[p.pet.s][2]+" "+(p.pet.n||PETS[p.pet.s][1]):"")));
  return c}
function rsDraw(){const box=$("#rsl");if(!box)return;const q=rsQ.trim(),L=rsList(),show=L.slice(0,rsShown),ord=rsS==="lv"?"레벨":"전투력";
 const activeN=q?L.filter(p=>!rsIsDm(p)).length:RS.length,onN=(q?L:RS).filter(p=>!rsIsDm(p)&&isOn(p)).length;
 $("#rsh").textContent=q?(rsFindBusy?"이름을 찾는 중...":"이름에 '"+q+"'이(가) 들어간 마법사 "+L.length+"명"+(L.length?" · 지금 접속 중 "+onN+"명":"")+(L.length>show.length?" · 아래로 내리면 다음 "+RS_PAGE+"명":"")):ord+" 높은 순 · 불러온 마법사 "+activeN+"명 · 지금 접속 중 "+onN+"명"+(rsDone?"":" · 아래로 내리면 다음 "+RS_PAGE+"명");
 box.innerHTML="";if(!show.length&&!(rsDone&&!q&&RSD.length)){box.appendChild(elT("p","hint",q&&rsFindBusy?"이름을 찾는 중...":q&&rsFindErr?"이름을 찾지 못했다. 잠시 뒤에 다시 입력해 보자.":q?"이름에 '"+q+"'이(가) 들어간 마법사가 없다.":rsDone?"아직 등록된 마법사가 없다.":"목록을 불러오는 중..."));return}
 if(q)show.forEach(p=>box.appendChild(rsCard(p,rsIsDm(p))));
 else{show.forEach(p=>box.appendChild(rsCard(p,false)));
  if(rsDone&&RSD.length){box.appendChild(elT("p","ros-dm-h","화원 · 휴면 계정"));rsDmList().forEach(p=>box.appendChild(rsCard(p,true)))}}}
function rsAtEnd(){if($("#v-roster").hidden)return false;const box=$("#rsl");if(!box)return false;return box.getBoundingClientRect().bottom<=innerHeight+160}
async function rsMore(){if($("#v-roster").hidden||rsBusy)return;if(rsQ.trim()){if(rsShown<rsList().length){rsShown=Math.min(rsList().length,rsShown+RS_PAGE);rsDraw()}return}if(rsShown<rsList().length){rsShown=Math.min(rsList().length,rsShown+RS_PAGE);rsDraw();rsFill();return}if(rsDone)return;const n=await rsLoad();if($("#v-roster").hidden)return;if(n>0)rsShown=Math.min(rsList().length,rsShown+RS_PAGE);rsDraw();rsFill()}
function rsFill(){if($("#v-roster").hidden||rsBusy||!rsAtEnd())return;if(rsQ.trim()){if(rsShown<rsList().length)rsMore();return}if(rsShown<rsList().length||!rsDone)rsMore()}
async function roster(){show("roster");const box=$("#rsl");$("#rsq").value=rsQ;$("#rss").value=rsS;
 if(!XON()){RS=[];RSD=[];rsDone=true;box.innerHTML="<p class='hint'>서버에 연결되어야 등록자 목록을 볼 수 있다.</p>";$("#rsh").textContent="";return}
 if(rsQ.trim()){rsFind();return}
 if(rsSnapUse()){rsDraw();rsFill();return}
 rsGen++;RS=[];RSD=[];rsEdge=null;rsDone=false;rsBusy=false;rsShown=RS_PAGE;box.innerHTML="<p class='hint'>목록을 불러오는 중...</p>";$("#rsh").textContent="";
 const n=await rsLoad();if($("#v-roster").hidden)return;if(n<0&&!RS.length&&!RSD.length){box.innerHTML="<p class='hint'>목록을 불러오지 못했다. 다시 열어 보자.</p>";return}rsSnapSave();rsDraw();rsFill()}
$("#rsq").oninput=e=>{rsQ=e.target.value;if(!$("#v-roster").hidden&&XON())rsFind()};
$("#rss").onchange=e=>{const v=e.target.value;if(v!=="pw"&&v!=="lv")return;rsS=v;if($("#v-roster").hidden||!XON())return;try{window.scrollTo(0,0)}catch(err){}if(rsQ.trim()){rsShown=RS_PAGE;rsDraw();return}roster()};
addEventListener("scroll",()=>{if(rsAtEnd())rsMore()},{passive:true});
