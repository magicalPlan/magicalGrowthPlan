/* 마을 경쟁. main.js 다음에 불러야 한다. 주간 점수, 순위, 우승 보상.
   출정·보스·포탈·시설은 guardAdd 를, 마을 화면은 hubGuard 를 그대로 부른다.
   다른 사람의 점수는 마을 탭에 들어올 때 한 번만 읽는다. 내 점수는 오른 즉시 칸에 더한다. */
let hgC=null,hgBusy=false;
function guardApplyMine(){if(!hgC||!C||!C.gp||C.gp.wk!==wkKey())return;const v=hgC[C.v];if(!v)return;const pt=Math.max(0,Math.min(1000,Number(C.gp.pt)||0));
 let me=v.ps.find(p=>p.u===UID);if(!me){if(!pt)return;me={u:UID,n:nmOf(),pt:0};v.ps.push(me)}if(me.pt===pt)return;me.pt=pt;me.n=nmOf();v.ps.sort((a,b)=>b.pt-a.pt);v.tot=v.ps.reduce((a,p)=>a+p.pt,0)}
async function hubGuard(force){const box=$("#hgu");if(!box||!C)return;if(!XON()){box.innerHTML="<p class='hint'>서버에 연결되어야 마을 경쟁에 참여할 수 있다.</p>";return}
 if((force||!hgC)&&!hgBusy){hgBusy=true;try{hgC=await guardWeek(wkKey());guardApplyMine()}catch(e){}finally{hgBusy=false}}if(!hgC||$("#v-hub").hidden)return;
 const rank=Object.values(hgC).sort((a,b)=>b.tot-a.tot),top=rank[0].tot||0,my=Math.max(((hgC[C.v]||{ps:[]}).ps.find(p=>p.u===UID)||{}).pt||0,C.gp&&C.gp.wk===wkKey()?C.gp.pt:0);box.innerHTML="";
 rank.forEach((r,i)=>{const w=elT("div","dq"+(r.v===C.v?" done":"")),cp=elT("div","dq-copy"),bar=elT("div","bar"),f=elT("i");f.style.width=(top?r.tot/top*100:0)+"%";bar.appendChild(f);
  cp.append(elT("b","",(i+1)+"위 "+VL[r.v].n+(r.v===C.v?" (우리 마을)":"")),elT("small","",r.tot+"점 · 참여 "+r.ps.length+"명"),bar);w.appendChild(cp);w.onclick=guardView;w.style.cursor="pointer";box.appendChild(w)});
 const m=elT("p","hint","내 이번 주 점수 "+my+" / 1000 · 누르면 자세히 볼 수 있다.");m.style.margin="4px 0 0";box.appendChild(m)}
const wkKey=(off=0)=>{const d=new Date();d.setDate(d.getDate()-((d.getDay()+6)%7)-7*off);return ymd(d)};
/* 점수를 더하기 전에 이번 주 서버에 올라가 있는 내 점수를 한 번 확인해서, 더 큰 쪽에서 이어 센다.
   (예전에는 기록 복구·다른 창 때문에 이 기기의 점수가 서버보다 작으면, 작은 값으로 덮어써서 마을 점수가 오히려 줄거나 한동안 오르지 않았다.)
   서버에 쓰지 못한 점수는 표시해 두었다가 30초마다 다시 올린다. */
const gSync={};
async function guardAdd(n){if(!C||!XON()||!n)return;const wk=wkKey();if(!C.gp||C.gp.wk!==wk)C.gp={wk,pt:0};
 if(!gSync[wk+C.v]){try{const sv=Number(((await DB.doc("guard/"+wk+"/"+C.v+"/"+UID).get()).data()||{}).pt)||0;gSync[wk+C.v]=1;if(C.gp.wk===wk&&sv>C.gp.pt)C.gp.pt=Math.min(1000,sv)}catch(e){}}
 if(!C.gp||C.gp.wk!==wk)return;const b=C.gp.pt;C.gp.pt=Math.min(1000,b+n);if(C.gp.pt===b)return;/* 최대(1000점)에 닿으면 조용히 넘어간다. 내 점수는 마을 경쟁 칸에서 볼 수 있다. */C.gp.dirty=1;save();guardPush();guardApplyMine();if(!$("#v-hub").hidden)hubGuard()}
function guardPush(){if(!C||!C.gp||!C.gp.dirty||!XON()||C.gp.wk!==wkKey())return;const pt=C.gp.pt;
 DB.doc("guard/"+C.gp.wk+"/"+C.v+"/"+UID).set({u:UID,n:nmOf(),pt}).then(()=>{if(C&&C.gp&&C.gp.pt===pt){delete C.gp.dirty;save()}}).catch(()=>{})}
async function guardWeek(wk){const out={};await Promise.all("ABCD".split("").map(async v=>{let d={};try{const s=await DB.doc("guard/"+wk+"/"+v).get();d=(s.exists&&s.data())||{}}catch(e){}
 const ps=Object.keys(d).filter(u=>d[u]&&typeof d[u]==="object").map(u=>({u,n:d[u].n,pt:Math.max(0,Math.min(1000,Number(d[u].pt)||0))})).sort((a,b)=>b.pt-a.pt);out[v]={v,ps,tot:ps.reduce((a,p)=>a+p.pt,0)}}));return out}
async function guardView(){show("guard");const box=$("#gl3"),m=$("#gm");m.textContent="";box.innerHTML="<p class='hint'>순위를 불러오는 중...</p>";if(!XON()){box.innerHTML="<p class='hint'>서버에 연결되어야 마을 경쟁에 참여할 수 있다.</p>";return}
 const [cur,last]=await Promise.all([guardWeek(wkKey()),guardWeek(wkKey(1))]);if($("#v-guard").hidden)return;box.innerHTML="";
 const rank=Object.values(cur).sort((a,b)=>b.tot-a.tot),mine=cur[C.v],myPt=(mine.ps.find(p=>p.u===UID)||{}).pt||0,end=new Date();end.setDate(end.getDate()+(7-((end.getDay()+6)%7)));end.setHours(0,0,0,0);
 box.appendChild(elT("p","x-cd","이번 주 집계 · "+(end.getMonth()+1)+"월 "+end.getDate()+"일 0시에 마감 · 내 점수 "+myPt+" / 1000"));
 rank.forEach((r,i)=>{const w=elT("div","card");w.style.cssText="margin-top:8px;padding:12px 14px"+(r.v===C.v?";border-color:#b89b5e":"");
  const top=elT("div","");top.style.cssText="display:flex;justify-content:space-between;align-items:baseline;gap:8px";top.append(elT("h2","",(i+1)+"위 · "+VL[r.v].n+(r.v===C.v?" (우리 마을)":"")),elT("b","",r.tot+"점"));w.appendChild(top);
  const bar=elT("div","bar"),f=elT("i");f.style.width=(rank[0].tot?r.tot/rank[0].tot*100:0)+"%";f.style.background="linear-gradient(90deg,#8a6a2e,#e6c56a)";bar.appendChild(f);w.appendChild(bar);
  w.appendChild(elT("p","boss-info","참여 "+r.ps.length+"명"+(r.ps.length?" · 1위 "+cn(r.ps[0].u,r.ps[0].n)+" "+r.ps[0].pt+"점":"")));
  if(r.v===C.v&&r.ps.length){const ol=elT("ol","boss-rank");r.ps.slice(0,5).forEach(p=>ol.appendChild(elT("li",p.u===UID?"me":"",cn(p.u,p.n)+" · "+p.pt+"점")));w.appendChild(ol)}box.appendChild(w)});
 // 지난주 우승
 const lr=Object.values(last).sort((a,b)=>b.tot-a.tot),lw=lr[0],lwk=wkKey(1);
 if(lw&&lw.tot>0){const c=elT("div","card");c.style.marginTop="16px";c.append(elT("p","boss-tag","지난주 결과"),elT("h2","","우승: "+VL[lw.v].n+" ("+lw.tot+"점)"));
  const joined=lw.v===C.v&&lw.ps.some(p=>p.u===UID&&p.pt>0),got=C.gwc===lwk;
  if(joined){const b=elT("button","btn",got?"우승 보상을 받았다":"우승 보상 받기 ("+rwTxt(GUARD_WIN)+")");b.type="button";b.disabled=got;b.onclick=()=>{if(C.gwc===lwk)return;C.gwc=lwk;giveRw(GUARD_WIN);note("guard",VL[lw.v].n+" 우승 보상: "+rwTxt(GUARD_WIN));save();checkTitles();guardView();m.style.color="var(--mu)";m.textContent="우승 보상을 받았다: "+rwTxt(GUARD_WIN)};c.appendChild(b)}
  else c.appendChild(elT("p","hint",lw.v===C.v?"지난주에 점수를 내지 않아 우승 보상이 없다.":"우승 마을에서 점수를 낸 사람만 보상을 받는다."));box.appendChild(c)}
 box.appendChild(elT("p","boss-info","점수 얻는 법: 정기 출정 성공 8~14(위험도) · 실패 2 · 보스 공격 3 · 마수 포탈 성공 30 · 실패 5 · 치유 10 · 일일 의뢰 모두 완료 15 · 타락한 친구 되돌리기 20. 한 사람의 주간 점수는 최대 1000."))}
$("#gb").onclick=()=>hub();
