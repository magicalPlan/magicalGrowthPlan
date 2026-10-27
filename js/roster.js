/* 등록자 탭. main.js 다음에 불러야 한다. 등록된 마법사 카드, 검색, 정렬.
   메뉴의 등록자 탭은 roster 를 그대로 부른다. 카드를 누르면 프로필이 열린다.
   기본은 전투력 높은 순이다. 순서를 바꾸면 그 기준의 상위 20명부터 다시 받는다.
   아래로 내리면 같은 기준으로 다음 20명을 받는다. 주기적으로 다시 받지 않는다. */
const RS_PAGE=20;
let RS=[],rsQ="",rsS="pw",rsEdge=null,rsDone=false,rsBusy=false,rsGen=0,rsShown=RS_PAGE;
function rsField(){return rsS==="lv"?"lv":"pw"}
function rsList(){const q=rsQ.trim().toLowerCase(),f=rsField();
 const L=RS.filter(p=>!q||String(p.n||"").toLowerCase().includes(q));
 L.sort((a,b)=>(Number(b[f])||0)-(Number(a[f])||0)||(a.u<b.u?-1:1));return L}
function rsBound(){const f=rsField();let v=null,n=0;RS.forEach(p=>{const x=Number(p[f]);if(v==null||x<v){v=x;n=1}else if(x===v)n++});return v==null?null:{v,n}}
async function rsLoad(){if(rsBusy||rsDone||!DB)return 0;const gen=rsGen,field=rsField(),edge=rsEdge,take=edge?RS_PAGE+edge.n:RS_PAGE;rsBusy=true;
 try{let q=DB.collection("players").by(field).limit(take);if(edge)q=q.end(edge.v);const sn=await once(q);if(gen!==rsGen)return 0;const raw=sn.docs||[],seen={};RS.forEach(p=>seen[p.u]=1);let added=0;
  raw.forEach(d=>{if(seen[d.id])return;const v=d.data()||{};if(!v.n||v[field]==null)return;seen[d.id]=1;RS.push(Object.assign({u:d.id},v));added++});
  if(raw.length<take||!added)rsDone=true;else rsEdge=rsBound();return added}
 catch(e){if(gen===rsGen)rsDone=true;return -1}finally{rsBusy=false}}
function rsDraw(){const box=$("#rsl");if(!box)return;const q=rsQ.trim(),L=rsList(),show=L.slice(0,rsShown),ord=rsS==="lv"?"레벨":"전투력";
 $("#rsh").textContent=ord+" 높은 순 · 불러온 마법사 "+RS.length+"명 · 지금 접속 중 "+RS.filter(isOn).length+"명"+(q?" · 찾은 결과 "+L.length+"명":"")+(rsDone?"":" · 아래로 내리면 다음 "+RS_PAGE+"명");
 box.innerHTML="";if(!show.length){box.appendChild(elT("p","hint",q&&!rsDone?"지금까지 불러온 이름에는 없다. 아래로 내리면 다음 "+RS_PAGE+"명 안에서 다시 찾는다.":q?"이름에 '"+rsQ+"'이(가) 들어간 마법사가 없다.":rsDone?"아직 등록된 마법사가 없다.":"목록을 불러오는 중..."));return}
 show.forEach(p=>{const c=document.createElement("button");c.type="button";c.className="ros-card"+(p.u===UID?" me":"");c.onclick=()=>openProfile(p.u);
  const top=elT("div","ros-top"),av=elT("div","ros-av");if(typeof p.im==="string"&&/^(data:image|https:)/.test(p.im)){const im=document.createElement("img");im.src=p.im;im.alt=String(p.n)+" 프로필 사진";im.loading="lazy";av.appendChild(im);hiAv(im,p.u);av.classList.add("has");av.title="사진 크게 보기";av.onclick=e=>{e.stopPropagation();picOpen(p.u,p.im,String(p.n))}}else av.textContent=String(p.n).slice(0,1);
  if(isOn(p)){const o=elT("i","ros-on","");o.title="접속 중";av.appendChild(o)}
  top.append(av,elT("b","ros-g g"+p.g,p.g+"등급"));
  c.append(top,elT("p","ros-n",cn(p.u,p.n)+(p.u===UID?" (나)":"")));const ti=tiName(p.ti,p.tn);if(ti)c.appendChild(elT("p","ros-ti","「"+ti+"」"));
  const at=elT("p","ros-at");String(p.a||"").split(" · ").filter(Boolean).forEach(a=>{const t=AT.find(x=>x[0]===a),sp=elT("span","ros-chip",a);if(t)sp.style.setProperty("--c",t[1]);at.appendChild(sp)});c.appendChild(at);
  c.appendChild(elT("p","ros-meta",[p.t?"특성 "+p.t:"",VL[p.v]?VL[p.v].n:""].filter(Boolean).join(" · ")));
  c.appendChild(elT("p","ros-meta","Lv "+(p.lv||1)+(p.pw?" · 전투력 "+p.pw:"")+(p.pet&&p.pet.s&&PETS[p.pet.s]?" · "+PETS[p.pet.s][2]+" "+(p.pet.n||PETS[p.pet.s][1]):"")));
  box.appendChild(c)})}
function rsAtEnd(){if($("#v-roster").hidden)return false;const box=$("#rsl");if(!box)return false;return box.getBoundingClientRect().bottom<=innerHeight+160}
async function rsMore(){if($("#v-roster").hidden||rsBusy)return;if(rsShown<rsList().length){rsShown=Math.min(rsList().length,rsShown+RS_PAGE);rsDraw();rsFill();return}if(rsDone)return;const n=await rsLoad();if($("#v-roster").hidden)return;if(n>0)rsShown=Math.min(rsList().length,rsShown+RS_PAGE);rsDraw();rsFill()}
function rsFill(){if($("#v-roster").hidden||rsBusy||rsQ.trim()||!rsAtEnd())return;if(rsShown<rsList().length||!rsDone)rsMore()}
async function roster(){show("roster");const box=$("#rsl");$("#rsq").value=rsQ;$("#rss").value=rsS;
 if(!XON()){RS=[];rsDone=true;box.innerHTML="<p class='hint'>서버에 연결되어야 등록자 목록을 볼 수 있다.</p>";$("#rsh").textContent="";return}
 rsGen++;RS=[];rsEdge=null;rsDone=false;rsBusy=false;rsShown=RS_PAGE;box.innerHTML="<p class='hint'>목록을 불러오는 중...</p>";$("#rsh").textContent="";
 const n=await rsLoad();if($("#v-roster").hidden)return;if(n<0&&!RS.length){box.innerHTML="<p class='hint'>목록을 불러오지 못했다. 다시 열어 보자.</p>";return}rsDraw();rsFill()}
$("#rsq").oninput=e=>{rsQ=e.target.value;rsShown=RS_PAGE;if(!$("#v-roster").hidden&&XON()){rsDraw();rsFill()}};
$("#rss").onchange=e=>{const v=e.target.value;if(v!=="pw"&&v!=="lv")return;rsS=v;if(!$("#v-roster").hidden&&XON()){try{window.scrollTo(0,0)}catch(err){}roster()}};
addEventListener("scroll",()=>{if(rsAtEnd())rsMore()},{passive:true});
