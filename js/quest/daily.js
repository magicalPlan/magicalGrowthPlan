/* 오늘의 의뢰. main.js 다음에 불러야 한다.
   마을 화면은 drawDQ, dqReady 를, 제목의 접기 버튼은 dqFold 를 그대로 부른다.
   의뢰 목록과 보상 숫자는 data/game.js 의 DQ 에 있다. */
const dqDef=id=>DQ.find(q=>q[0]===id);
function ensureDQ(){if(!C)return;titleState();if(C.dq&&C.dq.d===today()&&Array.isArray(C.dq.l)){
  // 목록에서 없어진 의뢰(예: 무기 강화)가 오늘 의뢰에 남아 있으면 다른 의뢰로 바꿔 준다.
  const bad=C.dq.l.filter(q=>!dqDef(q.id));if(bad.length){const have=C.dq.l.map(q=>q.id),pool=DQ.filter(q=>(q[5]||!LOCAL)&&!have.includes(q[0]));
   C.dq.l=C.dq.l.map(q=>{if(dqDef(q.id))return q;const n=pool.length?pool.splice(R(pool.length),1)[0]:null;return n?{id:n[0],b:n[3](C.stats),c:false}:null}).filter(Boolean);save()}return}
 const pool=DQ.filter(q=>q[5]||!LOCAL).slice();const l=[];while(l.length<DQ_N&&pool.length){const q=pool.splice(R(pool.length),1)[0];l.push({id:q[0],b:q[3](C.stats),c:false})}
 C.dq={d:today(),l,bc:false};save()}
const dqProg=q=>{const d=dqDef(q.id);return d?Math.min(d[2],Math.max(0,d[3](C.stats||{})-q.b)):0};
function dqReady(){if(!C||!C.dq||C.dq.d!==today())return 0;let n=C.dq.l.filter(q=>!q.c&&dqDef(q.id)&&dqProg(q)>=dqDef(q.id)[2]).length;if(!C.dq.bc&&C.dq.l.length&&C.dq.l.every(q=>q.c))n++;return n}
function drawDQ(){const l=$("#dql");if(!l||!C)return;ensureDQ();l.innerHTML="";
 {const sm=$("#dqsum");if(sm){const done=C.dq.l.filter(q=>q.c).length,rd=dqReady();sm.textContent="받음 "+done+" / "+C.dq.l.length+(rd?" · 받을 보상 "+rd+"개":"")}}
 const row=(cls,title,sub,pct,label,dis,fn)=>{const w=document.createElement("div");w.className="dq "+cls;const cp=document.createElement("div");cp.className="dq-copy";const b=document.createElement("b"),sm=document.createElement("small");b.textContent=title;sm.textContent=sub;cp.append(b,sm);
  if(pct!=null){const bar=document.createElement("div"),i=document.createElement("i");bar.className="bar";i.style.width=pct+"%";bar.appendChild(i);cp.appendChild(bar)}
  const bt=document.createElement("button");bt.type="button";bt.className="chip";bt.textContent=label;bt.disabled=dis;bt.onclick=fn;w.append(cp,bt);l.appendChild(w)};
 C.dq.l.forEach(q=>{const d=dqDef(q.id);if(!d)return;const p=dqProg(q),ok=p>=d[2];
  row(q.c?"got":ok?"done":"",d[1],p+" / "+d[2]+" · 보상: "+rwTxt(d[4]),p/d[2]*100,q.c?"받음":ok?"받기":"진행 중",q.c||!ok,()=>{if(q.c||dqProg(q)<d[2])return;q.c=true;giveRw(d[4]);save();checkTitles();hub();const h=$("#hm");h.style.color="var(--mu)";h.textContent="의뢰 완료! "+rwTxt(d[4])+"을(를) 받았다."})});
 const all=C.dq.l.length&&C.dq.l.every(q=>q.c);
 row("bonus"+(C.dq.bc?" got":all?" done":""),"모두 완료 보너스",(all?"오늘 의뢰를 모두 끝냈다.":"의뢰 3개를 모두 받으면 열린다.")+" · 보상: "+rwTxt(DQ_BONUS),null,C.dq.bc?"받음":"받기",C.dq.bc||!all,()=>{if(C.dq.bc||!C.dq.l.every(q=>q.c))return;C.dq.bc=true;giveRw(DQ_BONUS);note("quest","오늘의 의뢰를 모두 끝냈다. "+rwTxt(DQ_BONUS)+"을(를) 받았다.");C.stats.dqAll=(C.stats.dqAll||0)+1;guardAdd(15);save();checkTitles();hub();const h=$("#hm");h.style.color="var(--mu)";h.textContent="오늘의 의뢰를 모두 끝냈다! "+rwTxt(DQ_BONUS)+"을(를) 받았다."})}
// 오늘의 의뢰 칸 열고 닫기. 닫아도 제목 옆에 진행 상황이 보인다. 이 기기에서 마지막 상태를 기억한다.
function dqFold(open){const b=$("#dqtog"),box=$("#dqbox");if(!b||!box)return;box.hidden=!open;b.textContent=open?"접기 ▲":"펼치기 ▼";b.setAttribute("aria-expanded",open?"true":"false");try{localStorage.setItem("mgr_dqopen",open?"1":"0")}catch(e){}}
$("#dqtog").onclick=()=>dqFold($("#dqbox").hidden);
(()=>{let v="1";try{v=localStorage.getItem("mgr_dqopen")||"1"}catch(e){}if(v==="0")dqFold(false)})();
