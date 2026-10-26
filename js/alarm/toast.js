/* 화면 위 알림과 짧은 알림음. main.js 다음에 불러야 한다.
   출정, 보스, 상점, 마을, 공지는 toast 와 ding 을 그대로 부른다. */
function toast(t,go){let w=$("#toasts");if(!w){w=elT("div");w.id="toasts";w.setAttribute("aria-live","polite");document.body.appendChild(w)}
 const b=elT("button","toast",t);b.type="button";b.onclick=()=>{b.remove();go&&go()};w.appendChild(b);setTimeout(()=>b.remove(),7000);while(w.children.length>3)w.firstChild.remove()}
function ding(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const a=ding.c||(ding.c=new A()),o=a.createOscillator(),g=a.createGain();o.type="sine";o.frequency.setValueAtTime(880,a.currentTime);o.frequency.setValueAtTime(1175,a.currentTime+.09);g.gain.setValueAtTime(.0001,a.currentTime);g.gain.exponentialRampToValueAtTime(.12,a.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+.35);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.36)}catch(e){}}
