/* 자연재해. main.js 다음에 불러야 한다.
   재해는 여섯 시간을 항상 채우지 않는다. 제압 전이면 그 구간이 끝날 때(최대 6시간)까지만 효과가 있고,
   제압되면 그 즉시 끝난다. 상점·시설·자연 회복은 disMine 을, 마을 화면은 hubDis 를 그대로 부른다. */
let DRP={};// 재해 id → 진압 점수 합(서버 기록에서 계산)
const disSlot=t=>Math.floor((t/3600000+9)/6);
function disInfo(sl){const id="d"+sl,g=rng(hs32(id)),r=g(),v="ABCD"[Math.floor(g()*4)],d=DIS[Math.floor(g()*DIS.length)],T0=(sl*6-9)*3600000;
 return r<DIS_P?{id,sl,v,k:d[0],nm:d[1],ic:d[2],el:d[3],ef:d[4],T0,T1:T0+DIS_MS}:null}
const disPts=x=>Math.max(DRP[x.id]||0,(C&&C.dr&&C.dr.id===x.id)?Number(C.dr.pts)||0:0);
const disDone=x=>!!x&&disPts(x)>=DIS_GOAL;
/* 지금 구간 안에서, 아직 제압되지 않았고, 시작한 지 6시간이 지나지 않은 재해. 제압됐거나 구간이 끝나면 null. */
function disLive(now){const t=now==null?Date.now():now,x=disInfo(disSlot(t));return x&&t>=x.T0&&t<x.T1&&!disDone(x)?x:null}
// 지금 내 마을을 덮친 재해의 종류. 제압됐거나 최대 시간이 지나면 ""
const disMine=()=>{if(!C)return "";const x=disLive(Date.now());return x&&x.v===C.v?x.k:""};
async function disAct(){const now=Date.now(),x=disInfo(disSlot(now)),m=$("#hm");if(!x||!C||now<x.T0||now>=x.T1)return;if(disDone(x))return;
 const left=DIS_CD-(Date.now()-((C.dr&&C.dr.at)||0));if(left>0){toast("재해 대응은 "+cdTxt(left)+" 뒤에 다시 할 수 있다.");return}
 if(C.fall){toast("타락한 동안에는 재해에 대응할 수 없다.");return}
 const add=(C.a||[]).includes(x.el)?2:1;if(!C.dr||C.dr.id!==x.id)C.dr={id:x.id,pts:0};C.dr.pts+=add;C.dr.at=Date.now();
 giveRw(DIS_HIT);titleState();C.stats.disActs=(C.stats.disActs||0)+1;guardAdd(5);save();checkTitles();
 try{await DB.doc("players/"+UID+"/dr").set(C.dr)}catch(e){}
 DRP[x.id]=Math.max(DRP[x.id]||0,0)+add;toast(x.ic+" "+VL[x.v].n+" "+x.nm+" 대응! 진압 +"+add+(add>1?" ("+x.el+" 속성 보너스)":"")+" · 골드 +"+DIS_HIT.g);if(typeof tallyDr==="function")tallyDr(x.id,add);if(typeof pubScore==="function")pubScore();disPaint()}
// 진압되면 기여한 사람에게 보상을 주고 알린다(한 번만).
function disCheck(){const x=disInfo(disSlot(Date.now()));if(!x||!C||!disDone(x))return;if(C.drw===x.id)return;C.drw=x.id;
 if(C.dr&&C.dr.id===x.id&&C.dr.pts>0){giveRw(DIS_WIN);note("disaster",VL[x.v].n+"의 "+x.nm+"이(가) 진압되었다! 함께 막아 낸 보상: "+rwTxt(DIS_WIN));toast(x.ic+" "+x.nm+" 진압! 보상 "+rwTxt(DIS_WIN))}
 else if(x.v===C.v)note("disaster",VL[x.v].n+"의 "+x.nm+"이(가) 진압되었다. 마을이 다시 평온해졌다.");save()}
// 새 재해가 닥치면 한 번 알린다.
function disAlert(){const now=Date.now(),x=disInfo(disSlot(now));if(!x||!C||now<x.T0||now>=x.T1||C.drn===x.id||disDone(x))return;C.drn=x.id;save();
 const t=x.ic+" "+VL[x.v].n+"에 "+x.nm+"이(가) 닥쳤다! "+(x.v===C.v?"우리 마을이다. ":"")+"효과: "+x.ef;note("disaster",t);toast(t);if(x.v===C.v)ding()}
function hubDis(){const box=$("#hdi");if(!box||!C)return;box.innerHTML="";const now=Date.now(),x=disInfo(disSlot(now));
 if(!x||now<x.T0||now>=x.T1){const nx=(disSlot(now)+1)*6-9,d=new Date(nx*3600000);box.appendChild(elT("p","hint","지금은 평온하다. 다음 날씨는 "+String((d.getUTCHours()+9)%24).padStart(2,"0")+"시에 바뀐다."));return}
 const done=disDone(x),pts=Math.min(DIS_GOAL,disPts(x)),w=elT("div","dq dis"+(done?" got":x.v===C.v?" mine":"")),cp=elT("div","dq-copy"),bar=elT("div","bar"),f=elT("i");
 f.style.width=(pts/DIS_GOAL*100)+"%";bar.appendChild(f);
 cp.append(elT("b","",x.ic+" "+VL[x.v].n+" · "+x.nm+(x.v===C.v?" (우리 마을)":"")),elT("small","",done?"진압 완료! 효과가 끝났고 시설은 다시 쓸 수 있다.":"효과: "+x.ef+" · 진압 "+pts+" / "+DIS_GOAL+" · "+x.el+" 속성은 대응 점수 2배 · 진압되면 바로 끝 · 길어도 "+(()=>{const mm=Math.max(1,Math.ceil((x.T1-now)/60000));return (mm>=60?Math.floor(mm/60)+"시간 ":"")+(mm%60)+"분"})()),bar);
 const left=DIS_CD-(now-((C.dr&&C.dr.at)||0)),b=elT("button","chip",done?"완료":left>0?Math.ceil(left/60000)+"분 뒤":"대응");b.type="button";b.disabled=done||left>0||!!C.fall;b.onclick=disAct;w.append(cp,b);box.appendChild(w);
 if(!done)box.appendChild(elT("p","hint","대응할 때마다 골드 "+DIS_HIT.g+", 마을 경쟁 점수 5. 진압되면 대응한 모두에게 "+rwTxt(DIS_WIN)+"."))}
/* 제압 점수는 이 칸만 다시 읽는다. 점수가 목표에 닿으면 효과를 끄고, 시설 버튼도 다시 쓸 수 있게 그린다. */
let disPull=0,disSeen=null;
async function disPullNow(force){const now=Date.now(),x=disInfo(disSlot(now));if(!x||now<x.T0||now>=x.T1||!DB||typeof XON!=="function"||!XON())return;if(!force&&(disDone(x)||now-disPull<25000))return;disPull=now;
 try{const s=await DB.doc("tally/dr/"+x.id).get(),p=s.exists?s.data():null;if(p&&p.pts)DRP[x.id]=Math.max(DRP[x.id]||0,Number(p.pts)||0)}catch(e){}}
function disPaint(){const k=(()=>{const x=disLive(Date.now());return x?x.id:"-"})(),flip=disSeen!==k;disSeen=k;disAlert();disCheck();
 if(typeof $==="function"&&!$("#v-hub").hidden)hubDis();
 if(!flip)return;if(typeof $==="function"&&!$("#v-hub").hidden&&typeof hubFac==="function")hubFac();if(typeof $==="function"&&!$("#v-fac").hidden&&typeof facView==="function")facView(true);if(typeof updNav==="function")updNav()}
async function disSync(){if(!C||typeof XON!=="function"||!XON())return;await disPullNow(false);disPaint()}
setInterval(disSync,30000);
