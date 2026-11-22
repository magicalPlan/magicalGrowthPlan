/* 화면 위 알림과 짧은 알림음. main.js 다음에 불러야 한다.
   출정, 보스, 상점, 마을, 공지는 toast 와 ding 을 그대로 부른다.
   AudioContext 는 첫 클릭·키 입력 뒤에만 만든다(Chrome autoplay). 그 전에는 ding 이 조용히 무시된다. */
function toast(t,go){let w=$("#toasts");if(!w){w=elT("div");w.id="toasts";w.setAttribute("aria-live","polite");document.body.appendChild(w)}
 const b=elT("button","toast");b.type="button";if(typeof clpFill==="function")clpFill(b,t);else b.textContent=t;b.onclick=()=>{b.remove();go&&go()};w.appendChild(b);setTimeout(()=>b.remove(),7000);while(w.children.length>3)w.firstChild.remove()}
function dingCtx(){return ding.c||null}
function dingUnlock(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ding.c)ding.c=new A();if(ding.c.state==="suspended")ding.c.resume().catch(()=>{})}catch(e){}}
function ding(){try{const a=ding.c;if(!a||a.state!=="running")return;
 const o=a.createOscillator(),g=a.createGain();o.type="sine";o.frequency.setValueAtTime(880,a.currentTime);o.frequency.setValueAtTime(1175,a.currentTime+.09);g.gain.setValueAtTime(.0001,a.currentTime);g.gain.exponentialRampToValueAtTime(.12,a.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+.35);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.36)}catch(e){}}
/* raw mp3 등. 첫 입력 뒤(dingUnlock)에만 재생된다. 같은 src 는 한 Audio 를 재사용. */
function sfx(src){try{if(!src)return;dingUnlock();sfx._m=sfx._m||{};let a=sfx._m[src];if(!a){a=new Audio(src);a.preload="auto";sfx._m[src]=a}a.currentTime=0;const p=a.play();if(p&&p.catch)p.catch(()=>{})}catch(e){}}
(["pointerdown","keydown","touchstart"].forEach(ev=>document.addEventListener(ev,dingUnlock,{capture:true,passive:true})));
