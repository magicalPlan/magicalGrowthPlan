/* 같은 씨앗이면 누구나 같은 순서가 나오는 난수. 포탈, 재해, 출정, 보스가 시각만으로 같은 판을 만들 때 쓴다. */
// FNV-1a. 문자열을 32비트 정수 하나로 접는다. 같은 글자는 항상 같은 수가 된다.
const hs32=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};

// 씨앗 하나로 0 이상 1 미만의 수를 차례로 뽑는 함수를 만든다.
// 한 번 뽑을 때마다 씨앗에 고정 상수를 더하고, 곱과 비트 섞기로 다음 수를 고른다.
const rng=seed=>{let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};

// Math.random 을 위 생성기로 잠깐 갈아끼운 뒤 f 를 실행하고, 끝나면 원래 난수로 되돌린다.
const seeded=(seed,f)=>{const o=Math.random;Math.random=rng(seed);try{return f()}finally{Math.random=o}};
