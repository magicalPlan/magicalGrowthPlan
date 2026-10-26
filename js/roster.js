/* 등록자 탭. main.js 다음에 불러야 한다. 등록된 마법사 카드, 검색, 정렬.
   메뉴의 등록자 탭은 roster 를 그대로 부른다. 카드를 누르면 프로필이 열린다. */
/* 등록자 탭: 게임에 등록된 모든 캐릭터를 카드로 보여 준다(플레이어 기록 players를 읽는다. 다른 탭과 같은 캐시를 써서 데이터를 거의 더 쓰지 않는다).
   카드를 누르면 그 사람의 프로필이 열린다. */
let RS=[],rsQ="",rsS="g";
async function roster(){show("roster");const box=$("#rsl");$("#rsh").textContent="";
 if(!XON()){box.innerHTML="<p class='hint'>서버에 연결되어야 등록자 목록을 볼 수 있다.</p>";return}
 if(!RS.length)box.innerHTML="<p class='hint'>목록을 불러오는 중...</p>";let docs=[];try{docs=(await plAll(60000)).docs}catch(e){}
 if($("#v-roster").hidden)return;RS=docs.map(d=>Object.assign({u:d.id},d.data()||{})).filter(p=>p&&p.n&&p.g);$("#rsq").value=rsQ;$("#rss").value=rsS;rsDraw()}
function rsDraw(){const box=$("#rsl");if(!box)return;const q=rsQ.trim().toLowerCase(),gi=g=>GL.indexOf(g);
 let L=RS.filter(p=>!q||String(p.n).toLowerCase().includes(q));
 const by={g:(a,b)=>gi(b.g)-gi(a.g)||(b.lv||0)-(a.lv||0),lv:(a,b)=>(b.lv||0)-(a.lv||0),pw:(a,b)=>(b.pw||0)-(a.pw||0),on:(a,b)=>(isOn(b)?1:0)-(isOn(a)?1:0)||gi(b.g)-gi(a.g),n:(a,b)=>String(a.n).localeCompare(String(b.n),"ko")}[rsS]||(()=>0);
 L.sort((a,b)=>by(a,b)||String(a.n).localeCompare(String(b.n),"ko"));
 $("#rsh").textContent="등록된 마법사 "+RS.length+"명 · 지금 접속 중 "+RS.filter(isOn).length+"명"+(q?" · 찾은 결과 "+L.length+"명":"");
 box.innerHTML="";if(!L.length){box.innerHTML="";box.appendChild(elT("p","hint",q?"이름에 '"+rsQ+"'이(가) 들어간 마법사가 없다.":"아직 등록된 마법사가 없다."));return}
 L.forEach(p=>{const c=document.createElement("button");c.type="button";c.className="ros-card"+(p.u===UID?" me":"");c.onclick=()=>openProfile(p.u);
  const top=elT("div","ros-top"),av=elT("div","ros-av");if(typeof p.im==="string"&&/^(data:image|https:)/.test(p.im)){const im=document.createElement("img");im.src=p.im;im.alt=String(p.n)+" 프로필 사진";im.loading="lazy";av.appendChild(im);hiAv(im,p.u);av.classList.add("has");av.title="사진 크게 보기";av.onclick=e=>{e.stopPropagation();picOpen(p.u,p.im,String(p.n))}}else av.textContent=String(p.n).slice(0,1);
  if(isOn(p)){const o=elT("i","ros-on","");o.title="접속 중";av.appendChild(o)}
  top.append(av,elT("b","ros-g g"+p.g,p.g+"등급"));
  c.append(top,elT("p","ros-n",cn(p.u,p.n)+(p.u===UID?" (나)":"")));const ti=tiName(p.ti,p.tn);if(ti)c.appendChild(elT("p","ros-ti","「"+ti+"」"));
  const at=elT("p","ros-at");String(p.a||"").split(" · ").filter(Boolean).forEach(a=>{const t=AT.find(x=>x[0]===a),sp=elT("span","ros-chip",a);if(t)sp.style.setProperty("--c",t[1]);at.appendChild(sp)});c.appendChild(at);
  c.appendChild(elT("p","ros-meta",[p.t?"특성 "+p.t:"",VL[p.v]?VL[p.v].n:""].filter(Boolean).join(" · ")));
  c.appendChild(elT("p","ros-meta","Lv "+(p.lv||1)+(p.pw?" · 전투력 "+p.pw:"")+(p.pet&&p.pet.s&&PETS[p.pet.s]?" · "+PETS[p.pet.s][2]+" "+(p.pet.n||PETS[p.pet.s][1]):"")));
  box.appendChild(c)})}
$("#rsq").oninput=e=>{rsQ=e.target.value;rsDraw()};$("#rss").onchange=e=>{rsS=e.target.value;rsDraw()};
