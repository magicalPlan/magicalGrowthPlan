/* 마을 화면. main.js 와 js/trial.js 다음에 불러야 한다. 다른 화면이 hub, pmCleanup 을 그대로 부른다.
   마을을 그릴 때는 공개 카드(players)를 다시 쓰지 않는다. 카드는 프로필·기여·타락처럼 내용이 바뀔 때 쓴다.
   로그인한 뒤 마을을 열 때와, 출정·장기 토벌에서 마을로 돌아올 때 서버의 prog(레벨·경험치)를 한 번만 읽는다. */
function hubLv(){return C&&C.xv>=2?lvOf(C.ex||0):(C&&C.lv)||1}
function paintLv(){if(!C||$("#v-hub").hidden)return;const lv=hubLv(),into=Math.max(0,(Number(C.ex)||0)-xpAt(lv)),nx=xpNeed(lv);
 const a=$("#hclv");if(a)a.textContent=String(lv);const bar=$("#hcxb");if(bar)bar.style.width=Math.min(100,into/nx*100)+"%";const tx=$("#hcxt");if(tx)tx.textContent=into+" / "+nx;
 const pwEl=$("#hcpw");if(pwEl){const keep=C.lv;C.lv=lv;pwEl.textContent=String(pw());C.lv=keep}
 const n=typeof need==="function"?need():null,bt=$("#b-trial");if(n&&bt){const ok=lv>=n.lv&&C.cl>=n.cl,cd=trLeft()>0,can=!C.fall&&gi()<5&&ok&&!cd;bt.disabled=!can;
  bt.textContent=C.fall?"재계약 시험 (타락 중에는 할 수 없다)":gi()>=5?"재계약 시험 (최고 등급)":!ok?"재계약 시험 (레벨 "+n.lv+", 토벌 "+n.cl+"회 필요)":cd?"재계약 시험 (약 "+trLeftTxt()+" 뒤에 다시 볼 수 있다)":"재계약 시험 도전"}}
let progBusy=false,progAgain=false;
async function readProg(){if(!C||!AUTH.uid||LOCAL||!DB)return;if(progBusy){progAgain=true;return}progBusy=true;
 try{do{progAgain=false;if(savePending&&typeof saveCloud==="function"){try{await saveCloud(true)}catch(e){}}if(savePending)break;
  let p=null;try{const s=await DB.doc("accounts/"+UID+"/prog").get();p=s.exists?s.data():null}catch(e){break}if(savePending)break;
  if(p&&p.ex!=null){const ex=Math.max(0,Number(p.ex)||0),xv=Number(p.xv)||2,lv=lvOf(ex),was=p.lv==null?lv:Number(p.lv)||0;
   C.ex=ex;C.xv=xv;C.lv=lv;if(typeof accBase!=="undefined"&&accBase){accBase.ex=ex;accBase.xv=xv;accBase.lv=was}if(lv!==was)save()}
  else{const ex0=C.ex,lv0=C.lv,xv0=C.xv;xpMigrate();C.lv=lvOf(C.ex||0);C.xv=2;
   if(C.ex!==ex0||C.lv!==lv0||C.xv!==xv0)save();else{try{await DB.doc("accounts/"+UID).patch({"prog/lv":C.lv||1,"prog/ex":C.ex||0,"prog/xv":2,ts:Date.now(),sid:MY_SID})}catch(e){}}}}while(progAgain)}
 finally{progBusy=false}if(!$("#v-hub").hidden){pmCleanup();paintLv()}}
function pmCleanup(){if(!C)return;if(!(AUTH.uid&&!LOCAL&&DB)&&!(C.xv>=2)){xpMigrate();save()}if(C.pl==null&&!C.pmx)return;if(C.pmx>0){C.ex=(C.ex||0)+C.pmx;C.lv=lvOf(C.ex)}["pl","plt","pmk","pmc","pmx"].forEach(k=>delete C[k]);save()}
function hub(){const fresh=$("#v-hub").hidden,online=!!(C&&AUTH.uid&&!LOCAL&&DB);show("hub");if(!fresh||!online)pmCleanup();setTimeout(checkComp,800);setTimeout(checkGrant,900);titleProgress();const v=VL[C.v],ac=AT.find(a=>a[0]===C.a[0])[1];$("#hc").style.setProperty("--c",ac);
 const tt=titleById(C.ti),wn=C.wp>=0?WP[C.wp][0]+(wlv(C.wp)?" +"+wlv(C.wp):""):"없음",cell=(k,x)=>"<div><small>"+k+"</small><b>"+x+"</b></div>",lv=hubLv(),lvKeep=C.lv;if(C.xv>=2)C.lv=lv;const power=pw();if(C.xv>=2)C.lv=lvKeep;const into=Math.max(0,(Number(C.ex)||0)-xpAt(lv)),nx=xpNeed(lv);
 $("#hc").innerHTML="<div class='hc-top'>"+(C.img?"<img class='av' alt='프로필 이미지' src='"+C.img+"'>":"<div class='av hc-noimg' aria-hidden='true'>"+esc(String(C.n).slice(0,1))+"</div>")+"<div class='hc-id'><h2>"+esc(cn(UID,C.n))+"</h2><p>"+v.n+" · "+C.s+" · "+C.a.join("·")+"</p>"+(tt?"<p class='hc-ti'>✦ "+tt[1]+"</p>":"")+"</div><span class='hc-grade'>"+C.g+"</span></div>"
  +"<div class='hc-grid'>"+cell("레벨","<span id='hclv'>"+lv+"</span>")+cell("토벌",C.cl+"회")+cell("전투력","<span id='hcpw'>"+power+"</span>")+cell("골드",C.gd||0)+cell("무기",wn)+cell("특성",C.t)+"</div>"+(petCur()?"<p class='hc-pet'>"+PETS[petCur().sp][2]+" "+PETS[petCur().sp][1]+" "+esc(petCur().nm)+" · 친밀도 "+petLv(petCur())+"단계</p>":"")
  +"<div class='hc-xp"+(C.fall||scarLeft()>0?" scar":"")+"'><small>경험치</small><div class='bar'><i id='hcxb' style='width:"+Math.min(100,into/nx*100)+"%'></i></div><b id='hcxt'>"+into+" / "+nx+"</b></div>"+(C.fall?"<p class='hc-next' style='color:#ff8da0'>타락 중에는 경험치를 얻을 수 없다.</p>":scarLeft()>0?"<p class='hc-next' style='color:#ff8da0'>타락의 후유증: 얻는 경험치 절반 (약 "+Math.ceil(scarLeft()/60000)+"분 남음)</p>":"")+"<div class='hc-dz'><small>절망도</small><div class='bar'><i style='width:"+C.dz+"%'></i></div><b>"+C.dz+"</b></div><div class='hc-heal'><p class='hc-next' id='hcnext'>"+healTxt()+"</p><button type='button' class='chip hc-htog' id='hctog' aria-pressed='"+(C.healOff?"false":"true")+"'>자연 회복 "+(C.healOff?"꺼짐":"켜짐")+"</button></div>"
  +((()=>{const a=ITM.filter(x=>USE[x[0]]&&armed(x[0])).map(x=>x[1]).concat(Object.keys(SKID).filter(armedSk).map(id=>SKID[id].nm));return a.length?"<p class='hc-arm'>준비: "+a.join(", ")+"</p>":""})())+"<details class='hc-more'><summary>속성 · 특성 · 캐릭터 설정 자세히</summary><dl class='kv'><dt>속성</dt><dd>"+C.a.map(a=>{const x=AT.find(t=>t[0]===a);return a+"<small style='display:block;color:var(--mu)'>"+(x?x[2]:"")+"</small>"}).join("")+"</dd><dt>특성</dt><dd>"+C.t+"<small style='display:block;color:var(--mu)'>"+(TD[C.t]||"")+"</small></dd><dt>마을</dt><dd>"+v.d+"</dd></dl></details>";
 {const ht=$("#hctog");if(ht)ht.onclick=healToggle}const pr2=pfRows(C.pf);if(pr2){pr2.style.marginTop="10px";$("#hc .hc-more").appendChild(pr2)}
 const fb=$("#fbar");fb.innerHTML="";if(C.fall||C.dz>=90){const d=document.createElement("div"),b=document.createElement("b"),p=document.createElement("span");d.className="fallbar"+(C.fall?"":" warn");
  b.textContent=C.fall?"타락":"타락 직전";p.textContent=C.fall?"절망에 삼켜져 마수가 되었다. 친구들이 맞서 쓰러뜨려 주면 원래 모습으로 돌아온다.":"절망도가 "+C.dz+"이다. 100이 되면 타락한다. 공명이나 선물로 절망도를 낮추자.";d.append(b,p);
  if(C.fall){const g=document.createElement("button");g.type="button";g.className="btn";g.textContent="나의 그림자 보기";g.onclick=()=>openRaid(UID);d.appendChild(g)}fb.appendChild(d)}
 if(C.du&&!C.du.fin&&!unDu)duWatch();
 const n=need(),ok=lv>=n.lv&&C.cl>=n.cl,cd=trLeft()>0,can=!C.fall&&gi()<5&&ok&&!cd;$("#b-trial").disabled=!can;
 $("#b-trial").textContent=C.fall?"재계약 시험 (타락 중에는 할 수 없다)":gi()>=5?"재계약 시험 (최고 등급)":!ok?"재계약 시험 (레벨 "+n.lv+", 토벌 "+n.cl+"회 필요)":cd?"재계약 시험 (약 "+trLeftTxt()+" 뒤에 다시 볼 수 있다)":"재계약 시험 도전";$("#hm").textContent="";watchHub();$("#b-out").hidden=!AUTH.uid;if(fresh)applyGift();drawDQ();drawTut();updNav();drawRaids();checkRaid();sweepRooms();hubPortal();pTick().then(hubPortal);hubGuard(fresh);hubBoss();hubFac();if(fresh)loadFac().then(()=>{if($("#v-hub").hidden)return;hubFac();disCheck();hubDis()});onlineOnce();hubDis();disAlert();hubLH();if(fresh&&online)readProg()}

// 마을 화면의 정기 출정 칸 열고 닫기. 이 기기에서 마지막 상태를 기억한다.
function xFold(open){const b=$("#xtog"),box=$("#xbox");if(!b||!box)return;box.hidden=!open;b.textContent=open?"접기 ▲":"펼치기 ▼";b.setAttribute("aria-expanded",open?"true":"false");try{localStorage.setItem("mgr_xopen",open?"1":"0")}catch(e){}if(open)drawXAll()}
$("#xtog").onclick=()=>xFold($("#xbox").hidden);
// 장기 토벌 칸 열고 닫기. 닫아도 제목 옆에 진행 상황(토벌 중·귀환)이 보인다. 이 기기에서 마지막 상태를 기억한다.
function lhFold(open){const b=$("#lhtog"),box=$("#hlh");if(!b||!box)return;box.hidden=!open;b.textContent=open?"접기 ▲":"펼치기 ▼";b.setAttribute("aria-expanded",open?"true":"false");try{localStorage.setItem("mgr_lhopen",open?"1":"0")}catch(e){}}
$("#lhtog").onclick=()=>lhFold($("#hlh").hidden);
(()=>{let v="1";try{v=localStorage.getItem("mgr_lhopen")||"1"}catch(e){}if(v==="0")lhFold(false)})();
(()=>{let v="1";try{v=localStorage.getItem("mgr_xopen")||"1"}catch(e){}if(v==="0")xFold(false)})();
