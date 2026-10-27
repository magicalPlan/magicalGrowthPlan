/* 캐릭터 제작. main.js 다음에 불러야 한다. 성별, 마을, 속성, 등급과 특성 뽑기, 시작.
   처음 들어오면 boot 가 rc 를 그대로 부른다. */
let pimg=null;
$("#im").onchange=e=>{const f=e.target.files[0];e.target.value="";pick(f,d=>{pimg=d;const p=$("#pv");p.src=d;p.hidden=false})};
let sg=null,sv=null,sa=null,hs=[],pk=null,busy=false;
function chips(el,list,f){list.forEach(it=>{const b=document.createElement("button");b.type="button";b.className="chip"+(it[2]?" vil":"");b.setAttribute("aria-pressed","false");
 if(it[1]&&it[1][0]==="#"){b.style.setProperty("--c",it[1]);b.innerHTML='<span class="dot"></span>'+it[0]+(it[2]?"<small>"+it[2]+"</small>":"")}else b.innerHTML=it[0]+(it[2]?"<small>"+it[2]+"</small>":"");
 b.onclick=()=>{f(it);[...el.children].forEach(x=>x.setAttribute("aria-pressed",x===b?"true":"false"))};el.appendChild(b)})}
chips($("#gd"),[["소년"],["소녀"]],i=>sg=i[0]);
chips($("#vl"),Object.keys(VL).map(k=>[VL[k].n,"",VL[k].d]),i=>sv=i[0][0]);
chips($("#at"),AT,i=>{sa=i[0];$("#v-create").style.setProperty("--glow",i[1])});
function roll(){let r=Math.random()*100,a=0;for(const[g,w]of GR){a+=w;if(r<a)return g}return"E"}
function rc(){const l=3-hs.length,o=$("#orb");$("#left").textContent=l>0?"남은 기회 "+l+"번":"기회를 모두 썼다. 하나를 골라라.";o.disabled=l<=0;
 o.innerHTML=hs.length?hs[hs.length-1].g:"<small>손을 얹는다</small>";const h=$("#hist");h.innerHTML="";
 hs.forEach((r,i)=>{const b=document.createElement("button");b.type="button";b.className="chip";b.setAttribute("aria-pressed",pk===i?"true":"false");
  b.innerHTML="<span>"+(i+1)+"번째 뽑기 <b>"+r.t+"</b><small style='display:block;color:var(--mu);font-weight:400'>"+TD[r.t]+"</small></span><strong>"+r.g+"등급</strong>";b.onclick=()=>{pk=i;rc()};h.appendChild(b)});
 $("#tdesc").textContent=pk!==null?"특성: "+hs[pk].t:""}
$("#orb").onclick=()=>{if(busy||hs.length>=3)return;busy=true;const o=$("#orb");o.classList.add("ch");
 setTimeout(()=>{o.classList.remove("ch");hs.push({g:roll(),t:TR[R(TR.length)]});if(pk===null)pk=0;busy=false;rc()},900)};
$("#ok").onclick=()=>{const n=$("#nm").value.trim(),m=$("#cm");
 if(!n)return m.textContent="이름을 입력해야 한다.";if(!sg)return m.textContent="소년 또는 소녀를 골라야 한다.";
 if(!sv)return m.textContent="시작 마을을 골라야 한다.";if(!sa)return m.textContent="속성을 골라야 한다.";
 if(pk===null)return m.textContent="수정구로 등급을 한 번 이상 뽑아야 한다.";
 C={n,s:sg,v:sv,a:[sa],g:hs[pk].g,t:hs[pk].t,born:Date.now(),xv:2,rsv:RST?RST.id:0,lv:1,ex:0,cl:0,dz:0,b:0,img:pimg,gd:100,inv:{},wps:[],wp:-1,wl:{},titles:[],ti:"",stats:{maxDespair:0,maxGold:100,loginDays:1,lastDay:new Date().toISOString().slice(0,10),reachedZero:false}};save();checkTitles();hub()};
