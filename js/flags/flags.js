/* 계정 캐릭터 플래그 가방 — accounts/{uid}/c/flags
   ============================================================================
   저장 위치: C.flags (RTDB accounts/.../c/flags). 공개 카드(who/players)에는 올리지 않는다.
   Firebase 규칙: accounts/$uid 본인 쓰기면 충분. 최상위 새 노드·indexOn 불필요.

   구조:
     C.flags = {
       flag:       { [키]: 값 },   // 일반 진행·해금 (스토리와 무관)
       story_flag: { [키]: 값 }    // 스토리·이벤트 진행
     }
   값은 보통 1(켬) 또는 짧은 문자열/숫자. 키는 영문·숫자·_ 권장.

   의존성: 이 파일은 C / save 만 가정한다. VN·lock.js·상점·퀘스트는 여기 API만 쓰고
   C.flags 를 직접 만지지 않는다.
   이름 주의: data/story/lock.js 의 storyFlag(lock,n,now) 는 "단서 조각으로 이야기 열림"
   판정 함수다. 이 가방의 story_flag 칸 API 는 sflag* 로 부른다.
   ============================================================================ */

/** 빈 flags 객체. 캐릭터 생성·정규화에 쓴다. */
function flagsEmpty(){return{flag:{},story_flag:{}}}

/** ch(기본 C)에 flags.flag / flags.story_flag 객체를 보장하고 그 가방을 반환한다. */
function flagsEnsure(ch){ch=ch||(typeof C!=="undefined"?C:null);if(!ch||typeof ch!=="object")return null;
 if(!ch.flags||typeof ch.flags!=="object"||Array.isArray(ch.flags))ch.flags=flagsEmpty();
 if(!ch.flags.flag||typeof ch.flags.flag!=="object"||Array.isArray(ch.flags.flag))ch.flags.flag={};
 if(!ch.flags.story_flag||typeof ch.flags.story_flag!=="object"||Array.isArray(ch.flags.story_flag))ch.flags.story_flag={};
 return ch.flags}

/** 접속·생성 직후 한 번 불러 낡은 저장본도 flags 칸을 갖추게 한다. */
function flagsBoot(ch){return flagsEnsure(ch)}

function flagKey(k){k=String(k==null?"":k).trim();return k?k.slice(0,64):""}

/* ── 일반 플래그 C.flags.flag ── */
function flagGet(k,ch){const bag=flagsEnsure(ch);k=flagKey(k);if(!bag||!k)return undefined;return bag.flag[k]}
function flagHas(k,ch){return flagGet(k,ch)!=null}
function flagSet(k,v,ch){const bag=flagsEnsure(ch);k=flagKey(k);if(!bag||!k)return undefined;
 bag.flag[k]=v==null?1:v;return bag.flag[k]}
function flagClear(k,ch){const bag=flagsEnsure(ch);k=flagKey(k);if(!bag||!k)return;delete bag.flag[k]}

/* ── 스토리 플래그 C.flags.story_flag (API 접두 sflag — lock.js storyFlag 와 구분) ── */
function sflagGet(k,ch){const bag=flagsEnsure(ch);k=flagKey(k);if(!bag||!k)return undefined;return bag.story_flag[k]}
function sflagHas(k,ch){return sflagGet(k,ch)!=null}
function sflagSet(k,v,ch){const bag=flagsEnsure(ch);k=flagKey(k);if(!bag||!k)return undefined;
 bag.story_flag[k]=v==null?1:v;return bag.story_flag[k]}
function sflagClear(k,ch){const bag=flagsEnsure(ch);k=flagKey(k);if(!bag||!k)return;delete bag.story_flag[k]}

/** 켠 뒤 save()까지. 호출부가 저장을 맡기면 flagSet/sflagSet 만 써도 된다. */
function flagSetSave(k,v,ch){const r=flagSet(k,v,ch);try{if(typeof save==="function")save()}catch(e){}return r}
function sflagSetSave(k,v,ch){const r=sflagSet(k,v,ch);try{if(typeof save==="function")save()}catch(e){}return r}
