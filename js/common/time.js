/* 날짜와 남은 시간. 의뢰, 알림, 쿨타임이 같은 하루 기준을 쓰도록 여기로 모았다. */
// 이 기기 시각의 오늘. "2026-10-26" 처럼 맞춘다. 하루가 바뀌는 제한(상점, 보스, 의뢰)이 이 문자열을 비교한다.
const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const ymd=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");

// 1970-01-01 부터 센 날짜 번호. 보스 교대처럼 하루를 정수로 자를 때 쓴다.
const dayN=d=>Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5);

// 지난 시각을 "방금 / N분 전 / N시간 전 / N일 전" 으로 줄인다. 분 단위로만 센다.
const agoTxt=t=>{const m=Math.floor((Date.now()-t)/60000);return m<1?"방금":m<60?m+"분 전":m<1440?Math.floor(m/60)+"시간 전":Math.floor(m/1440)+"일 전"};

// 남은 밀리초를 "2시간 3분" 또는 "4분 5초" 또는 "6초" 로 만든다. 1시간은 3600초, 1분은 60초.
const cdTxt=ms=>{const t=Math.ceil(ms/1000),h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;return h?h+"시간 "+m+"분":m?m+"분 "+s+"초":s+"초"};
