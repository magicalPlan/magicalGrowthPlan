
// 등급 확률(%)은 합계 100. 숫자만 고치면 바뀐다.
   const GR=[["E",35],["D",25],["C",18],["B",12],["A",7],["S",3]],GL="EDCBAS";
   const AT=[["불","#e2574c","전투력 +6, 보스·타락 레이드 공격 피해 20% 증가"],["물","#4a90d9","출정과 시련에서 오르는 절망도 25% 감소"],["바람","#4fb893","출정 경험치 15% 증가"],["땅","#b08a57","재계약 시험 판정 +4. 출정에서 처음 나온 대실패를 30% 확률로 대지가 버텨 실패로 바꾼다(파티에 한 명이라도 있으면)."],["빛","#e0b93c","공명하면 상대의 절망도가 3 더 내려간다"],["어둠","#8a6fd1","절망도가 50 이상이면 전투력 +6"]];
   const TR=["불굴","예민함","냉정","낙천","끈기","천재","대기만성","행운","수집가","다정함","고독","협력자","집중","폭주","수호","치유의 손길","번뜩임","계약의 가호","불안정한 마력","상처 입은 마음","각성자"];
   const TD={"불굴":"출정에서 파티가 처음 지는 전투를 한 번 다시 싸운다.","예민함":"출정 중 함정을 미리 알아채 피한다.","냉정":"오르는 절망도가 20% 줄어든다.","낙천":"절망도가 내려갈 때 30% 더 내려간다.","끈기":"얻는 경험치가 20% 늘어난다.","천재":"전투력 +4.","대기만성":"레벨 8 전에는 전투력 -2. 레벨 8부터 전투력이 오르고(레벨 30까지 최대 +8), 그 뒤로는 레벨의 4분의 1만큼 끝없이 오른다(레벨 100 +25, 레벨 1000 +250).","행운":"무기 강화 성공 확률 +5%p, 출정 골드 10% 증가.","수집가":"출정에 성공하면 30% 확률로 마력석을 1개 줍는다.","다정함":"공명하면 내 절망도가 5 더 내려가고, 친구에게 받은 선물 효과가 50% 커진다.","고독":"혼자 출정하면 전투력 +8.","협력자":"2명 이상 출정하면 파티 전투력 +3.","집중":"재계약 시험 판정 +3.","폭주":"절망도가 60 이상이면 전투력 +6.","수호":"출정 후 오르는 절망도가 4 줄어든다.","치유의 손길":"내가 공명하면 상대의 절망도가 3 더 내려간다.","번뜩임":"출정 중 이벤트가 더 자주 일어나고, 이벤트로 얻는 경험치가 2배가 된다.","계약의 가호":"재계약 시험에 필요한 레벨과 토벌 횟수가 1씩 줄어든다.","불안정한 마력":"전투력 +6. 대신 재계약 시험 판정마다 20% 확률로 마법이 빗나가 -10.","상처 입은 마음":"전투력 +5. 대신 오르는 절망도가 20% 늘어난다.","각성자":"재계약에 성공할 때마다 전투력이 3 더 오른다."};


   // 마을 특성: rz=공명할 때 내 절망도 하락량, x=출정 경험치 배율, tb=시험 보너스, dz=출정 절망도 추가
   const VL={
      A:{n:"A마을",d:"물건이 풍부한 항구 마을. 출정 경험치가 조금 늘어난다.",x:1.15,tb:0,dz:0,rz:10},
      B:{n:"B마을",d:"치유의 숲이 있는 마을. 공명하면 내 절망도가 더 많이 내려간다.",x:1,tb:0,dz:0,rz:15},
      C:{n:"C마을",d:"대장간이 많은 요새 마을. 재계약 시험 판정 +8, 무기 강화 성공 확률 +5%p, 보스 레이드 피해 10% 증가.",x:1,tb:8,dz:0,rz:10,up:5,bd:1.1},
      D:{n:"D마을",d:"포탈의 그림자가 드리운 마을. 보상이 크지만 절망도가 빨리 오른다.",x:1.3,tb:0,dz:6,rz:10}};


      /* 고독한 출정: 출발할 때 파티가 나 혼자뿐이면 '고독한 출정'이 된다.
   ① 마수가 홀로 남은 마법소녀를 노려 권장 전투력이 SOLO_DF배(1.25배)가 되고, 실패·대실패로 오르는 절망도도 SOLO_DZ배가 된다.
   ② 대신 인원 보상 감소(혼자면 60%)가 없어지고(SOLO_M), 성공하면 고독의 보상 SOLO_RW(골드 + 확률로 마력석)를 더 받는다.
   ③ 혼자일 때만 일어나는 이벤트(SOLO_EV)가 SOLO_EVP(55%) 확률로 일반 이벤트 대신 나온다. 숫자만 고치면 바뀐다. */
   const SOLO_DF=1.15,SOLO_DZ=1.2,SOLO_M=1,SOLO_RW={g:40,mp:.5},SOLO_EVP=.55;
   const CHOICE_MS=15000;

   
   /* 앱 버전. 설정 화면 오른쪽 아래에 보이고, 켜질 때 이 브라우저(mgr_ver)에 같은 값을 남긴다. 버전을 맞출 때 이 문자열만 고친다. */
   const APP_VER="1.0.0.2";
   // 온라인 서버 설정: Firebase Realtime Database 주소를 여기에 적거나, 화면 위쪽 '서버 주소 설정' 버튼으로 입력한다.
   const FB_URL="https://magical-growth-default-rtdb.asia-southeast1.firebasedatabase.app";
   /* POLL_FAST 는 서버와 연결(EventSource)을 연다. 채팅·대련·레이드 상세처럼 바로 반영되어야 하는 곳만 쓴다.
      타락 목록과 정기 출정 자리는 collection().live() 로 같은 연결을 연다. 처음 한 번 받고, 그 뒤엔 바뀔 때만 받는다.
      타락 목록 연결과 공격 기록은 마을이나 레이드 화면에서만 열고, 그 화면을 벗어나면 닫는다.
      POLL_HUB 는 그 화면에서 묻는 타락 체력이다. 연결을 열지 않고 이 간격으로만 묻는다.
      POLL_HUB 를 POLL_FAST 와 같은 값으로 두면 타락 체력도 연결이 열린다. */
   const POLL_MS=4000,POLL_FAST=2500,POLL_HUB=20000;


   /* 계정: Firebase 이메일/비밀번호 로그인. 아이디는 가짜 이메일 주소로 바꿔서 쓴다. */

   /* Firebase 웹 API 키: 코드에 그대로 보이지 않도록 뒤집은 뒤 base64로 바꾸고 조각내 두었다(검색·자동 수집 방지용).
      주의: 브라우저 게임은 로그인할 때 이 키를 브라우저가 서버로 보내야 하므로, 완전히 숨길 수는 없다(개발자 도구로는 보인다).
      진짜 보호는 Google Cloud 콘솔의 'API 키 제한'(허용 웹사이트·허용 API)과 Firebase 데이터베이스 규칙이 맡는다.
    키를 바꾸려면: 새 키를 뒤집어서(reverse) base64로 바꾼 값을 조각으로 나눠 아래 배열에 넣는다. */
   const FB_KEY=(p=>{try{return atob(p.join("")).split("").reverse().join("")}catch(e){return ""}})(["Z0k2NDk4S0xGeD","U4ay1CLWJtQjFq","YnRQVG1pUEg3ZD","NEeVNheklB"] );


   const ERR={EMAIL_EXISTS:"이미 있는 아이디다.",INVALID_LOGIN_CREDENTIALS:"아이디나 비밀번호가 맞지 않다.",EMAIL_NOT_FOUND:"아이디나 비밀번호가 맞지 않다.",INVALID_PASSWORD:"아이디나 비밀번호가 맞지 않다.",WEAK_PASSWORD:"비밀번호가 너무 약하다. 6자 이상으로 적어야 한다.",OPERATION_NOT_ALLOWED:"Firebase에서 이메일/비밀번호 로그인이 켜져 있지 않다.",TOO_MANY_ATTEMPTS_TRY_LATER:"시도가 너무 많다. 잠시 뒤에 다시 해야 한다."};
   

   /* 최초의 구세주: Firebase 계정이 FOUNDER_CUTOFF(한국 시각) 전에 만들어졌으면 칭호를 준다.
      기준 시각 전에 가입한 사람은 언제 로그인하든 받는다. 기준을 바꾸려면 날짜만 고친다. */
   const FOUNDER_CUTOFF=Date.parse("2026-10-14T01:00:00+09:00");


   // 세계의 기원: 베타 테스터(2026-10-14 자정 전 가입)에게 주는 칭호. 기준은 위와 같은 방식이다.
   const ORIGIN_CUTOFF=Date.parse("2026-10-14T00:00:00+09:00");


   /* 보상 지급: 아래 목록에 한 줄을 넣으면, 기준 시각(cut) 전에 가입한 모든 계정이 다음 접속 때 한 번씩 받는다.
      [지급 번호(겹치지 않게), 골드, 마력석, 가입 기준 시각, 알림 제목, 알림 내용]. 이미 받은 번호는 다시 받지 않는다(C.cmp에 기록).
      가입 시각은 Firebase 계정 정보에서 확인하므로, 캐릭터를 새로 만들어도 기준 전에 가입한 계정이면 받는다. */
   const COMP=[["maint-20261018",1500,5,Date.parse("2026-10-18T12:00:00+09:00"),"점검 보상",
       "서버 점검과 복구 작업으로 오랫동안 기다리게 해서 죄송합니다.\n기다려 주셔서 정말 고맙습니다.\n\n점검 보상을 드립니다. 앞으로 더 안정적으로 운영하겠습니다.",{inv:{hope:2},eggs:1}],
      ["restore-apology-20261016",1000,5,Date.parse("2026-10-16T12:00:00+09:00"),"복구 보상",
       "서버 작업 중 실수로 캐릭터 기록과 1:1 대화 내역 일부가 사라졌습니다.\n불편을 드려 정말 죄송합니다.\n\n사과의 뜻으로 모든 마법소녀에게 골드 1000과 마력석 5개를 드립니다.\n복구되지 않은 부분이 있다면 운영자에게 알려 주세요."],
      ["promo-apology-20261014",500,0,Date.parse("2026-10-15T00:00:00+09:00"),"사과의 선물",
      "레벨 승급 시스템으로 불편을 드려 죄송합니다.\n승급 시스템은 삭제되었고, 레벨은 다시 막힘없이 오릅니다.\n\n사과의 뜻으로 모든 마법소녀에게 골드 500을 드립니다.\n앞으로도 마법 성장기록을 잘 부탁드립니다."]];


      /* 개인 지급: 특정 계정(uid)에게만 칭호·골드·마력석을 한 번 지급한다. 그 사람이 다음에 접속하면 자동으로 받는다(C.cmp에 기록, 다시 받지 않음).
   [지급 번호(겹치지 않게), 받는 사람 uid, 칭호 id 목록, 골드, 마력석, 알림 제목, 알림 내용, 무기 목록(선택: [[무기 번호, 강화 단계], …])].
   무기 번호: 0 칼, 1 총, 2 낫, 3 방패, 4 오브, 5 완드, 6 스태프. 이미 그 무기가 더 높은 단계면 그대로 둔다.
   그다음 칸(선택) {pw: 목표 전투력} 지금 전투력(오늘 하루짜리 무기 손질 효과는 빼고)이 목표보다 낮으면 그 차이만큼 영구 보너스 전투력(C.b)을 더한다.
   {pwAdd: 숫자} 지금 전투력과 상관없이 그만큼 영구 보너스 전투력을 더한다.
   {lv: 레벨} 그 레벨보다 낮으면 그 레벨로 올린다. {g: "S"} 그 등급보다 낮으면 올린다. {a: ["빛","바람"]} 속성을 그대로 정한다. {rn: 5} 마력 각인 네 개를 모두 그 단계 이상으로.
   여러 개를 함께 쓰면 레벨·등급·속성·각인을 먼저 돌려준 뒤에 pw(목표 전투력)를 맞춘다. */
   const GRANT=[["restore-amane-20261015","DMuKDE4MA6Obk3wTOTYn76ptWQy1",["savior","lh_abyss","s_midnight","s_edge"],0,0,"칭호 복구",
      "사라졌던 칭호를 돌려드립니다.\n불편을 드려 죄송합니다."],
      ["restore-orb5-20261015","HpqeCvpUTfNCqY4nSQ8XYXkp61G3",[],0,0,"무기 복구","오류로 사라졌던 무기를 돌려드립니다.\n불편을 드려 죄송합니다.",[[4,5]]],
      ["restore-nxto-20261015","nXToPaRzqCN48clh3XOy8ryi5dd2",["wf_1","wf_keeper","witch_save","witch_kill","savior","s_broke","s_bare"],0,0,"기록 복구","오류로 사라졌던 칭호와 전투력을 돌려드립니다.\n불편을 드려 죄송합니다.",[],{pw:600}],
      ["restore-gqlt-20261015","GQltsm4RVrQUaYWNyVQx3d5RpG63",["s_dawn","s_broke"],0,0,"기록 복구","오류로 사라졌던 기록을 돌려드립니다.\n불편을 드려 죄송합니다.",[],{lv:1100,g:"S",a:["빛","바람"],rn:5,pw:3500}],
      ["restore-nxto-pw600-20261015","nXToPaRzqCN48clh3XOy8ryi5dd2",[],0,0,"전투력 복구","오류로 사라졌던 전투력 600을 돌려드립니다.\n늦어져서 죄송합니다.",[],{pwAdd:600}],
      ["restore-leandros-20261018","la18Sl38HWd4C2dpSLoV7x2ter72",[],0,0,"기록 복구","오류로 사라졌던 레벨과 사역마 불꽃여우를 돌려드립니다.\n불편을 드려 죄송합니다.",[],{lv:900,pet:"fox"}],
      ["restore-fp1p-20261018","Fp1pGJmjJOdIOSphzVWd90TelM73",[],0,0,"기록 복구","오류로 사라졌던 레벨과 전투력을 돌려드립니다.\n불편을 드려 죄송합니다.",[],{lv:3156,pw:9570}],
      ["restore-fp1p-egg-20261019","Fp1pGJmjJOdIOSphzVWd90TelM73",[],0,0,"사역마의 알 복구","오류로 사라졌던 사역마의 알 하나를 돌려드립니다.\n불편을 드려 죄송합니다.",[],{eggs:1}],
      ["restore-nln3-egg-20261018","NLN3JwSl7PXHiiB1nwdoeQAD68Z2",[],0,0,"사역마의 알 복구","오류로 사라졌던 사역마의 알 하나를 돌려드립니다.\n불편을 드려 죄송합니다.",[],{eggs:1}],
      ["restore-amane-witchkill-20261018","DMuKDE4MA6Obk3wTOTYn76ptWQy1",["witch_kill"],0,0,"칭호 복구","오류로 사라졌던 칭호 「왕관을 부순 일격」을 돌려드립니다.\n불편을 드려 죄송합니다.",[],{}]];


      /* 한 사람의 캐릭터 전체 복구: 그 계정으로 처음 들어올 때 딱 한 번 백업 기록으로 되돌린다.
      지금 기록이 더 앞서 있는 부분(레벨, 칭호, 아이템 개수, 사역마)은 지우지 않고 남긴다. 받은 기록은 C.cmp에 남아 다시 적용되지 않는다. */
      const RESTORE_FULL=[["restore-ebron-full-20261018","nXToPaRzqCN48clh3XOy8ryi5dd2",{"a":["어둠"],"b":10,"bdSeen":1792038149635,"cl":22,"cmp":{"promo-apology-20261014":1791997446139},"daily":{"charm":1,"d":"2026-10-14"},"dex":{"bs":{"부서진 계약의 사도":2,"썩은 정원사":2},"ev":{"a_ghost":1,"a_light":1,"a_smug":1,"a_wreck":1,"ambush":1,"b_fairy":1,"b_spirit":1,"b_spring":1,"b_tree":1,"box":1,"c_armory":1,"c_drill":1,"c_smith":1,"c_wall":1,"camp":1,"chapel":1,"child":1,"confess":1,"cub":1,"d_echo":1,"d_portal":1,"d_rift":1,"d_voice":1,"despair_mirror":1,"fallen_girl":1,"fire_bridge":1,"florist":1,"fog":1,"fork":1,"hope_lamp":1,"mana_vein":1,"merchant":1,"mirror":1,"nest":1,"pit":1,"purse":1,"queen_envoy":1,"remains":1,"riddle":1,"seal_door":1,"star":1,"time_rift":1,"weapon_pile":1,"whisper":1},"it":{"candle":1,"charm":1,"flag":1,"g1":1,"g2":1,"g3":1,"hope":1,"mana":1,"map":1,"seal":1,"whet":1},"rw":{"evf":1,"evh":1,"itf":1,"ith":1,"wpf":1,"wph":1},"sk":{"dark":1}},"dml":{"CqeKPoHY1pUdcDXVeCciVGOpfY82":1791954584058,"D3Ga8gSQ5rfMY68GCND6FCREw003":1791921976331,"TLXwyHDof5hs2maSugjRj8OcA9G3":1791950817184,"bFG6iHrOxyPFeo6tOcajPpaumhn1":1791908229723,"oveVc5JYBKVX2JNdEJ4J8vXnS8j1":1791958905496,"pR7ru1D4VLThiAjL2Q3l9kMD5u33":1792003007467},"dmn":{"CqeKPoHY1pUdcDXVeCciVGOpfY82":"레인","D3Ga8gSQ5rfMY68GCND6FCREw003":"그레이스","TLXwyHDof5hs2maSugjRj8OcA9G3":"샤를","bFG6iHrOxyPFeo6tOcajPpaumhn1":"그레텔","oveVc5JYBKVX2JNdEJ4J8vXnS8j1":"마말레이","pR7ru1D4VLThiAjL2Q3l9kMD5u33":"Kyo"},"dms":{"CqeKPoHY1pUdcDXVeCciVGOpfY82":1791954584058,"D3Ga8gSQ5rfMY68GCND6FCREw003":1791921976331,"TLXwyHDof5hs2maSugjRj8OcA9G3":1791950817184,"bFG6iHrOxyPFeo6tOcajPpaumhn1":1791908229723,"oveVc5JYBKVX2JNdEJ4J8vXnS8j1":1791958905496,"pR7ru1D4VLThiAjL2Q3l9kMD5u33":1791999676635},"dq":{"bc":false,"d":"2026-10-15","l":[{"b":133,"c":true,"id":"buy"},{"id":"win","b":133,"c":false},{"b":129,"c":true,"id":"res"}]},"dr":{"at":1792011755492,"id":"d82965","pts":1},"drn":"d82966","drw":"d82966","duD":{"d":"2026-10-15","n":1},"duNt":{"i_yBcbJQiofCf6P9GAb8gD7SZzz6Q2_nXToPaRzqCN48clh3XOy8ryi5dd2_mv8gd48g":true},"duSeen":{"yBcbJQiofCf6P9GAb8gD7SZzz6Q2_nXToPaRzqCN48clh3XOy8ryi5dd2_mv8gd48g":true},"dz":88,"dzT":1792040170509,"edge":0,"ex":26937,"facl":{"spring":5,"forge":5,"drill":5,"tower":5,"market":5,"chapel":5,"library":5,"workshop":5},"fallT":[1792003871046],"fc":{"forge":600,"spring":1200,"workshop":820},"founder":1,"fr":{"04nOXmzRn9dUi41pwZ8gKbxoafT2":"IX","1O3fRQIwC3QYgbiDh7665xMfpj83":"엔페","1cMsWXO40ORyWmw4r94HVFtyZLn1":"Summer","2BuNOPBCRWTCxZRw05yIYi7D7mJ2":"ㅤ","3jdQB6vMdecz7bMRWR5IsHdCXEj1":"케세라","4lncon4QvpgNcDnzE9j50ubjQKr1":"아이리쉬","5Qws5XRLZpN4n2m6iqS5b1jxDb32":"Zㅣ존먼O","5TFD2Qumsoa0ISWYFdE7FezpJGK2":"오데트","8xGWfjLXz6f0xYpCtTkDrNFVK872":"버니타","90RinCqz1jQgU76Z6KVKFyMacAx2":"슈","9CDsNIdCCDfQFvxN2eWHLFNKAyD2":"스칼렛","BZgdcmizDLUVILiVYBQm6kECx5e2":"BB","BbrUy5pUYFVwoWeY2hPCNjf8RKs2":"멜로니","CJzLLuh4XMWByAaKzwKCipKwpk63":"고요한","CLVwZf5pdRSkLCXNXekNAUbMsuq2":"논","CqeKPoHY1pUdcDXVeCciVGOpfY82":"레인","D3Ga8gSQ5rfMY68GCND6FCREw003":"그레이스","DFHfG1jVzsZv5F0dlr2VyLnwUsQ2":"히라 코코네","DMuKDE4MA6Obk3wTOTYn76ptWQy1":"아마네","DRagw12drwRNlmYI4zFSaH3rSSf1":"J","Fp1pGJmjJOdIOSphzVWd90TelM73":"쿠키쨔무공명ㄴㄴ","FyPDWW47wjN6lJ3AEE0FfuvRBqr1":"프시케","G69wbC1O6JQrYaN9z1fPkbtI6a52":"시쿠","GQltsm4RVrQUaYWNyVQx3d5RpG63":"이안","GSbOZIurkXhLjpMnCSx33S26G382":"4O4","GeLNYSlQrOcGbVnC1w4S4cIuovw2":"아시다치 소우","HECWRncMOMV5rl2kImFtEUepcj83":"네뉴","HpqeCvpUTfNCqY4nSQ8XYXkp61G3":"세일럼","HzYG7AUieAgFbtauJla7aKGcN1L2":"러브","J2HdWWP6KSVBPob0KAi6PuqdxBx2":"베일","J47ZpbkzzBYoc1UJr9HJWu2e4ro1":"시그마","L283wvRnYyRIne6xAgOAgvaZ3vq1":"디아나 하프틴","LMkuYt9kGpd1YV8XAOrmPYN8XA42":"🌊세이렌","LrBYBl04PpQF6ZzWh1KjVKxzjRJ3":"레모","N8S2qsJmP3gwvpNeCXxWXdCaWQf2":"타에카","NLN3JwSl7PXHiiB1nwdoeQAD68Z2":"세렐","P2poFsqWsMfvHCVxQDJeMkSVzAP2":"다나","QOIM2ErQqJWM5A12Ifak4CYfcxF2":"QO","R7P0FcnUkLb12ZEAJxqMbqumzF42":"ロウ","RCM5pyIIlvVq6Ot5L8wYFgv0wjl2":"ⓐ","TD03dKEX25czJwZRR6V9JprvSq63":"영","TLXwyHDof5hs2maSugjRj8OcA9G3":"샤를","Tt3v4XAALDP0uEwLFJ8TYVLffR42":"은랑","UmlKjzGMv8SP0eaSVhUfT14hpgx2":"레테","Uzq4tStgN2XXfa16mmm4ieoK8JB3":"한지","VtnctpcLksU22vrpMup3eiMbuLD3":"세템버","XOWYx0m4qMMPPkoNHubHnvuKZhf2":"Eden","Y8VMLqvYWkPYCEhExZcfFESQPRL2":"A","YF3OINMpk6S2UE1T9BVYwgxRzJm2":"오스카","YTdCUiThANTax494Br0J2g91MXZ2":"세렌","Z2dP6X8iHkdvQhSYxqfWj6TWGUJ2":"달리아","az6vxnDTCpbaA3NnaCKhjL7ZcsC2":"시루","bFG6iHrOxyPFeo6tOcajPpaumhn1":"그레텔","bds6uTgU5qXmEVEhIWv9G0ZFeOA3":"Maverick","cv5jNEt4fVW37b2f1h2A7IGyUdE2":"아인","d99cmpvtxiX7SxTU6Z36cOCsKHn2":"L3P0","en1LS9S962ZDwrBbQjOLvQPNzt82":"릴드멜","ezslnNoEzbdIcY6M6jGLg5LhFA72":"소현","fv6DYCaxl6hRxbogfnwDQCl7yu12":"켈","giSn0O4NnHdtHlsyBKBhC3RVOr22":"미리암","gqHVWbtFBUVJaYEFDOfoHzNqxwt2":"시선","hBLrgMVpuXRwF26GWByupO5d5443":"유진","hFc9mVGhPQVuESK6zFzvbWaWzpc2":"경","izAVO7Os1RfT0cEGy4WghBEPxeZ2":"ユウ","kyQ1ubCjvuOCuBtpsC4u330u61C2":"카리스","la18Sl38HWd4C2dpSLoV7x2ter72":"레안드로스","ldbAnSDBnxYsS2QkbqdVloDHmG92":"조엘","m495Eggbd3WNgQH7xzf7azYOSq93":"카모츠키 하나에","mDRk0GyIUtMDCjximaBdFNmE7hD2":"๑⁃̀⩊⁃́๑","oveVc5JYBKVX2JNdEJ4J8vXnS8j1":"마말레이","pR7ru1D4VLThiAjL2Q3l9kMD5u33":"Kyo","pkoXWveVvuQ7PTzdQcc7LbAGGYd2":"세월","qpQoKidsMqMXLxFj1h73VeFw7R82":"Seio 시오","raTqPgZrw3RbRX37ru7KKQYywKb2":"우라미치","riuHw9Ra2sVwbCAxMEdZGS6ovHG2":"Mor","rwdHrGmYiufuRESHu92I3sqGB1X2":"수리","sYp8JZBGQfP6FEstUpMLIUIQg0N2":"쿠키쨔무 윤재이","uqetzpvV5HWNBVoxQMCR7l2AFp63":"타타","xpZmkLngbBQD7Ubnli5Ya2sNny62":"취운","xtoQRhuR74OnuA3nGDdZLIYafv32":"진달래","yBcbJQiofCf6P9GAb8gD7SZzz6Q2":"샬럿","yity8tJGZpPrBJ1ucwSxmfpjE6B2":"사키","zcwfZKlSGJfIN074Kvf0CqT14ur1":"비올렛 세른"},"fs":{"04nOXmzRn9dUi41pwZ8gKbxoafT2":1791970991612,"1O3fRQIwC3QYgbiDh7665xMfpj83":1791921845168,"1cMsWXO40ORyWmw4r94HVFtyZLn1":1791935199059,"2BuNOPBCRWTCxZRw05yIYi7D7mJ2":1791909989548,"3jdQB6vMdecz7bMRWR5IsHdCXEj1":1791965907642,"4lncon4QvpgNcDnzE9j50ubjQKr1":1791945171372,"5Qws5XRLZpN4n2m6iqS5b1jxDb32":1791942588608,"5TFD2Qumsoa0ISWYFdE7FezpJGK2":1791938020236,"8xGWfjLXz6f0xYpCtTkDrNFVK872":1791910260157,"90RinCqz1jQgU76Z6KVKFyMacAx2":1791956640959,"9CDsNIdCCDfQFvxN2eWHLFNKAyD2":1791911723783,"BZgdcmizDLUVILiVYBQm6kECx5e2":1791936459497,"BbrUy5pUYFVwoWeY2hPCNjf8RKs2":1791912170646,"CJzLLuh4XMWByAaKzwKCipKwpk63":1791957893219,"CLVwZf5pdRSkLCXNXekNAUbMsuq2":1791957855093,"CqeKPoHY1pUdcDXVeCciVGOpfY82":1791946437731,"D3Ga8gSQ5rfMY68GCND6FCREw003":1791912170606,"DFHfG1jVzsZv5F0dlr2VyLnwUsQ2":1791965977714,"DMuKDE4MA6Obk3wTOTYn76ptWQy1":1791985037572,"DRagw12drwRNlmYI4zFSaH3rSSf1":1791933901392,"Fp1pGJmjJOdIOSphzVWd90TelM73":1792000629354,"FyPDWW47wjN6lJ3AEE0FfuvRBqr1":1791993112120,"G69wbC1O6JQrYaN9z1fPkbtI6a52":1791965802032,"GQltsm4RVrQUaYWNyVQx3d5RpG63":1791918307005,"GSbOZIurkXhLjpMnCSx33S26G382":1791986548745,"GeLNYSlQrOcGbVnC1w4S4cIuovw2":1791916917901,"HECWRncMOMV5rl2kImFtEUepcj83":1791912170054,"HpqeCvpUTfNCqY4nSQ8XYXkp61G3":1791910277374,"HzYG7AUieAgFbtauJla7aKGcN1L2":1791969805708,"J2HdWWP6KSVBPob0KAi6PuqdxBx2":1791916083453,"J47ZpbkzzBYoc1UJr9HJWu2e4ro1":1791945637076,"L283wvRnYyRIne6xAgOAgvaZ3vq1":1791918423398,"LMkuYt9kGpd1YV8XAOrmPYN8XA42":1791944168764,"LrBYBl04PpQF6ZzWh1KjVKxzjRJ3":1791969152645,"N8S2qsJmP3gwvpNeCXxWXdCaWQf2":1791910262092,"NLN3JwSl7PXHiiB1nwdoeQAD68Z2":1791971202887,"P2poFsqWsMfvHCVxQDJeMkSVzAP2":1791918032848,"QOIM2ErQqJWM5A12Ifak4CYfcxF2":1791945767886,"R7P0FcnUkLb12ZEAJxqMbqumzF42":1791915891955,"RCM5pyIIlvVq6Ot5L8wYFgv0wjl2":1791912193414,"TD03dKEX25czJwZRR6V9JprvSq63":1791944186554,"TLXwyHDof5hs2maSugjRj8OcA9G3":1791938468572,"Tt3v4XAALDP0uEwLFJ8TYVLffR42":1791910284289,"UmlKjzGMv8SP0eaSVhUfT14hpgx2":1791944267293,"Uzq4tStgN2XXfa16mmm4ieoK8JB3":1791936719737,"VtnctpcLksU22vrpMup3eiMbuLD3":1791951978947,"XOWYx0m4qMMPPkoNHubHnvuKZhf2":1791945216925,"Y8VMLqvYWkPYCEhExZcfFESQPRL2":1792003096356,"YF3OINMpk6S2UE1T9BVYwgxRzJm2":1791969743644,"YTdCUiThANTax494Br0J2g91MXZ2":1791945160041,"Z2dP6X8iHkdvQhSYxqfWj6TWGUJ2":1792001095080,"az6vxnDTCpbaA3NnaCKhjL7ZcsC2":1791969129834,"bFG6iHrOxyPFeo6tOcajPpaumhn1":1791908062498,"bds6uTgU5qXmEVEhIWv9G0ZFeOA3":1791920527825,"cv5jNEt4fVW37b2f1h2A7IGyUdE2":1791942096625,"d99cmpvtxiX7SxTU6Z36cOCsKHn2":1791941518312,"en1LS9S962ZDwrBbQjOLvQPNzt82":1791910261022,"ezslnNoEzbdIcY6M6jGLg5LhFA72":1791910295090,"fv6DYCaxl6hRxbogfnwDQCl7yu12":1791909124825,"giSn0O4NnHdtHlsyBKBhC3RVOr22":1791945182974,"gqHVWbtFBUVJaYEFDOfoHzNqxwt2":1791933991457,"hBLrgMVpuXRwF26GWByupO5d5443":1791966794194,"hFc9mVGhPQVuESK6zFzvbWaWzpc2":1791956574545,"izAVO7Os1RfT0cEGy4WghBEPxeZ2":1791957081314,"kyQ1ubCjvuOCuBtpsC4u330u61C2":1791910268020,"la18Sl38HWd4C2dpSLoV7x2ter72":1791941901356,"ldbAnSDBnxYsS2QkbqdVloDHmG92":1791969140919,"m495Eggbd3WNgQH7xzf7azYOSq93":1791910255496,"mDRk0GyIUtMDCjximaBdFNmE7hD2":1791979645825,"oveVc5JYBKVX2JNdEJ4J8vXnS8j1":1791957854636,"pR7ru1D4VLThiAjL2Q3l9kMD5u33":1791966425144,"pkoXWveVvuQ7PTzdQcc7LbAGGYd2":1791944183092,"qpQoKidsMqMXLxFj1h73VeFw7R82":1791934655076,"raTqPgZrw3RbRX37ru7KKQYywKb2":1791944169232,"riuHw9Ra2sVwbCAxMEdZGS6ovHG2":1791910266695,"rwdHrGmYiufuRESHu92I3sqGB1X2":1791948361801,"sYp8JZBGQfP6FEstUpMLIUIQg0N2":1791954579936,"uqetzpvV5HWNBVoxQMCR7l2AFp63":1791971150828,"xpZmkLngbBQD7Ubnli5Ya2sNny62":1791944157437,"xtoQRhuR74OnuA3nGDdZLIYafv32":1791957809467,"yBcbJQiofCf6P9GAb8gD7SZzz6Q2":1792004657631,"yity8tJGZpPrBJ1ucwSxmfpjE6B2":1791986482538,"z2U2m3SGpwWJx36N1hQ8cgS5VVr1":1791905847346,"zcwfZKlSGJfIN074Kvf0CqT14ur1":1791980450026},"fu":{"d":"2026-10-15","u":{"chapel":1,"drill":1,"forge":1,"library":1,"market":1,"spring":1,"tower":1,"workshop":1}},"g":"C","gd":2305,"gp":{"pt":1000,"wk":"2026-10-12"},"gs":{"5Qws5XRLZpN4n2m6iqS5b1jxDb32_0":1791944203260,"5Qws5XRLZpN4n2m6iqS5b1jxDb32_1":1791944212767,"5Qws5XRLZpN4n2m6iqS5b1jxDb32_2":1791944214872,"5Qws5XRLZpN4n2m6iqS5b1jxDb32_3":1791944682503,"8xGWfjLXz6f0xYpCtTkDrNFVK872_0":1792002488687,"90RinCqz1jQgU76Z6KVKFyMacAx2_0":1791958970252,"BbrUy5pUYFVwoWeY2hPCNjf8RKs2_0":1791944159180,"BbrUy5pUYFVwoWeY2hPCNjf8RKs2_1":1791945167741,"BbrUy5pUYFVwoWeY2hPCNjf8RKs2_2":1792002603713,"CqeKPoHY1pUdcDXVeCciVGOpfY82_0":1791964518973,"CqeKPoHY1pUdcDXVeCciVGOpfY82_1":1791964521473,"DRagw12drwRNlmYI4zFSaH3rSSf1_0":1791998615431,"GQltsm4RVrQUaYWNyVQx3d5RpG63_0":1791918317266,"GQltsm4RVrQUaYWNyVQx3d5RpG63_1":1791944189582,"GQltsm4RVrQUaYWNyVQx3d5RpG63_2":1791944191445,"GQltsm4RVrQUaYWNyVQx3d5RpG63_3":1792002478856,"GeLNYSlQrOcGbVnC1w4S4cIuovw2_0":1791918116489,"HECWRncMOMV5rl2kImFtEUepcj83_0":1791945164633,"RCM5pyIIlvVq6Ot5L8wYFgv0wjl2_0":1791948150210,"RCM5pyIIlvVq6Ot5L8wYFgv0wjl2_1":1791948152346,"Tt3v4XAALDP0uEwLFJ8TYVLffR42_0":1791988492141,"Tt3v4XAALDP0uEwLFJ8TYVLffR42_1":1791988494366,"Tt3v4XAALDP0uEwLFJ8TYVLffR42_2":1791988498168,"Tt3v4XAALDP0uEwLFJ8TYVLffR42_3":1791998609980,"YTdCUiThANTax494Br0J2g91MXZ2_0":1791945209641,"YTdCUiThANTax494Br0J2g91MXZ2_1":1791969511611,"az6vxnDTCpbaA3NnaCKhjL7ZcsC2_0":1791998616005,"bFG6iHrOxyPFeo6tOcajPpaumhn1_0":1791948162907,"cv5jNEt4fVW37b2f1h2A7IGyUdE2_0":1791998665417,"cv5jNEt4fVW37b2f1h2A7IGyUdE2_1":1792000480057,"cv5jNEt4fVW37b2f1h2A7IGyUdE2_2":1792000482971,"cv5jNEt4fVW37b2f1h2A7IGyUdE2_3":1792000486639,"ezslnNoEzbdIcY6M6jGLg5LhFA72_0":1791986176562,"fv6DYCaxl6hRxbogfnwDQCl7yu12_0":1792002309901,"fv6DYCaxl6hRxbogfnwDQCl7yu12_1":1792003782587,"izAVO7Os1RfT0cEGy4WghBEPxeZ2_0":1791993103331,"izAVO7Os1RfT0cEGy4WghBEPxeZ2_1":1791995335708,"izAVO7Os1RfT0cEGy4WghBEPxeZ2_2":1791998609388,"izAVO7Os1RfT0cEGy4WghBEPxeZ2_3":1792001097754,"m495Eggbd3WNgQH7xzf7azYOSq93_0":1792002712696,"m495Eggbd3WNgQH7xzf7azYOSq93_1":1792002716009,"m495Eggbd3WNgQH7xzf7azYOSq93_2":1792003757220,"m495Eggbd3WNgQH7xzf7azYOSq93_3":1792003761108,"raTqPgZrw3RbRX37ru7KKQYywKb2_0":1791998613502},"gsl":{"5Qws5XRLZpN4n2m6iqS5b1jxDb32":[1791944487624,1791944492854],"8xGWfjLXz6f0xYpCtTkDrNFVK872":[1792002397645],"BbrUy5pUYFVwoWeY2hPCNjf8RKs2":[1792002545946],"D3Ga8gSQ5rfMY68GCND6FCREw003":[1791918344483,1792002459327],"Fp1pGJmjJOdIOSphzVWd90TelM73":[1792002349175,1792002453693],"GQltsm4RVrQUaYWNyVQx3d5RpG63":[1791918360048],"HpqeCvpUTfNCqY4nSQ8XYXkp61G3":[1791945658414],"Y8VMLqvYWkPYCEhExZcfFESQPRL2":[1792003193308],"az6vxnDTCpbaA3NnaCKhjL7ZcsC2":[1792002327454,1792002329587,1792002331884,1792002333851],"fv6DYCaxl6hRxbogfnwDQCl7yu12":[1791907315526],"giSn0O4NnHdtHlsyBKBhC3RVOr22":[1791969726860],"izAVO7Os1RfT0cEGy4WghBEPxeZ2":[1792002555893,1792002570937,1792002573043,1792002575856],"m495Eggbd3WNgQH7xzf7azYOSq93":[1792002584362],"oveVc5JYBKVX2JNdEJ4J8vXnS8j1":[1791958375444],"qpQoKidsMqMXLxFj1h73VeFw7R82":[1791937390293],"riuHw9Ra2sVwbCAxMEdZGS6ovHG2":[1792002467005]},"inv":{"candle":1,"charm":0,"flag":1,"g1":0,"g2":1,"g3":0,"hope":5,"mana":4,"map":1,"seal":1,"whet":1},"last":"x5973466_517","lv":674,"n":"에브론","nt":[{"k":"quest","t":"검은 숲 토벌을(를) 떠났다. 2시간 뒤에 돌아온다.","u":"","ts":1792040186117,"r":false},{"k":"march","t":"토벌 성공 · 전투 6번 · 파티 5명","u":"","ts":1792040153511,"r":false},{"k":"march","t":"토벌 실패 · 전투 6번 · 파티 7명 · 이벤트 골드 +20","u":"","ts":1792039853511,"r":true},{"k":"quest","t":"심연 변두리 원정: 토벌 성공! (골드 +561, 경험치 +281, 마력석 +2, 절망도 +30)","u":"","ts":1792039449603,"r":true},{"k":"title","t":"새 칭호를 얻었다: 심연 변두리의 생환자","u":"","ts":1792039449602,"r":true},{"k":"title","t":"새 칭호를 얻었다: 등대를 밝힌 자","u":"","ts":1792039436533,"r":true},{"k":"fac","t":"🗼 희망의 등대가 5단계가 되었다! 모든 마을에 새 빛: 전투력 +10","u":"","ts":1792039436500,"r":true},{"k":"title","t":"새 칭호를 얻었다: 매일의 약속","u":"","ts":1792039435931,"r":true},{"k":"notice","r":true,"t":"공지: 2026.10.15.10:48 신규 세계 구축\n-일일 퀘스트에서 [강화하기] 관련 퀘스트 삭제\n-정기 원정 출발/도착 알림 추가\n-대련 구인 게시판 추가\n-혼자 가는 출정에 대한 특별하고 어려운 이벤트!\n-공명 거절","ts":1792039419355,"u":""},{"k":"raid","r":true,"t":"Mor님이 타락했다. 맞서서 되돌려 주자.","ts":1792039419076,"u":"riuHw9Ra2sVwbCAxMEdZGS6ovHG2"},{"k":"disaster","r":true,"t":"⛰ C마을에 지진이(가) 닥쳤다! 효과: 마을 시설 효과와 이용이 멈춘다","ts":1792039417968,"u":""},{"k":"quest","r":true,"t":"심연 변두리 원정에서 돌아왔다! 마을에서 보상을 받자.","ts":1792039417920,"u":""},{"k":"portal","r":true,"t":"☄ A마을 핏빛 문이(가) 열렸다! 06:35까지 33명이 모여야 한다.","ts":1792013116047,"u":""},{"k":"raid","r":true,"t":"엔페님이 타락했다. 맞서서 되돌려 주자.","ts":1792012936629,"u":"1O3fRQIwC3QYgbiDh7665xMfpj83"},{"k":"quest","r":true,"t":"심연 변두리 원정을(를) 떠났다. 6시간 뒤에 돌아온다.","ts":1792012053555,"u":""},{"k":"march","r":true,"t":"토벌 성공 · 전투 5번 · 파티 5명","ts":1792011945047,"u":""},{"k":"disaster","r":true,"t":"🔥 D마을에 산불이(가) 닥쳤다! 우리 마을이다. 효과: 상점 가격 +20%","ts":1792011618044,"u":""},{"k":"quest","r":true,"t":"근교 순찰: 토벌 성공! (골드 +55, 경험치 +30, 절망도 +3)","ts":1792011557681,"u":""},{"k":"title","r":true,"t":"새 칭호를 얻었다: 긴 여정","ts":1792011557679,"u":""},{"k":"portal","r":true,"t":"☄ A마을 하늘의 균열이(가) 열렸다! 05:53까지 11명이 모여야 한다.","ts":1792010582041,"u":""},{"k":"raid","r":true,"t":"쿠키쨔무 나타샤님이 타락했다. 맞서서 되돌려 주자.","ts":1792010198224,"u":"Fp1pGJmjJOdIOSphzVWd90TelM73"},{"k":"quest","r":true,"t":"근교 순찰에서 돌아왔다! 마을에서 보상을 받자.","ts":1792009938043,"u":""},{"k":"raid","r":true,"t":"스칼렛님이 타락했다. 맞서서 되돌려 주자.","ts":1792008338239,"u":"9CDsNIdCCDfQFvxN2eWHLFNKAyD2"},{"k":"raid","r":true,"t":"엔페님이 타락했다. 맞서서 되돌려 주자.","ts":1792008338236,"u":"1O3fRQIwC3QYgbiDh7665xMfpj83"},{"k":"res","r":true,"t":"샬럿님이 공명해 주었다.","ts":1792007938166,"u":"yBcbJQiofCf6P9GAb8gD7SZzz6Q2"},{"k":"raid","r":true,"t":"🜏 절망의 마인 강림! 버니타이(가) D마을에서 마인이 되었다. 누구든 맞설 수 있다.","ts":1792007758224,"u":"8xGWfjLXz6f0xYpCtTkDrNFVK872"},{"k":"raid","r":true,"t":"🜏 절망의 마인 강림! 쿠키쨔무 나타샤이(가) B마을에서 마인이 되었다. 누구든 맞설 수 있다.","ts":1792007158225,"u":"Fp1pGJmjJOdIOSphzVWd90TelM73"},{"k":"portal","r":true,"t":"B마을 하늘의 균열 토벌 성공! 20명이 함께했다. 골드 50, 마을 점수 30","ts":1792006562133,"u":""},{"k":"quest","r":true,"t":"근교 순찰을(를) 떠났다. 1시간 뒤에 돌아온다.","ts":1792006313005,"u":""},{"k":"raid","r":true,"t":"샬럿님이 타락했다. 맞서서 되돌려 주자.","ts":1792006304040,"u":"yBcbJQiofCf6P9GAb8gD7SZzz6Q2"},{"k":"march","r":true,"t":"토벌 성공 · 전투 3번 · 파티 7명","ts":1792006276177,"u":""},{"k":"portal","r":true,"t":"☄ B마을 하늘의 균열이(가) 열렸다! 04:36까지 11명이 모여야 한다.","ts":1792005963046,"u":""},{"k":"raid","r":true,"t":"Mor님이 타락했다. 맞서서 되돌려 주자.","ts":1792005796773,"u":"riuHw9Ra2sVwbCAxMEdZGS6ovHG2"},{"k":"march","r":true,"t":"토벌 성공 · 전투 5번 · 파티 7명","ts":1792005628053,"u":""},{"k":"res","r":true,"t":"버니타님이 공명해 주었다.","ts":1792005278126,"u":"8xGWfjLXz6f0xYpCtTkDrNFVK872"},{"k":"march","r":true,"t":"토벌 성공 · 전투 6번 · 파티 3명","ts":1792005047043,"u":""},{"k":"march","r":true,"t":"토벌 성공 · 전투 5번 · 파티 7명 · 이벤트 골드 +40","ts":1792004745047,"u":""},{"k":"title","r":true,"t":"새 칭호를 얻었다: 맨손의 심연","ts":1792004745044,"u":""},{"k":"fr","r":true,"t":"샬럿님이 친구 신청을 보냈다.","ts":1792004678166,"u":"yBcbJQiofCf6P9GAb8gD7SZzz6Q2"},{"k":"quest","r":true,"t":"지혜의 각인을 5단계로 새겼다. (얻는 경험치 +20%)","ts":1792004587647,"u":""},{"k":"title","r":true,"t":"새 칭호를 얻었다: 각인의 대가","ts":1792004587645,"u":""},{"k":"quest","r":true,"t":"지혜의 각인을 4단계로 새겼다. (얻는 경험치 +16%)","ts":1792004586288,"u":""},{"k":"quest","r":true,"t":"지혜의 각인을 3단계로 새겼다. (얻는 경험치 +12%)","ts":1792004584992,"u":""},{"k":"quest","r":true,"t":"지혜의 각인을 2단계로 새겼다. (얻는 경험치 +8%)","ts":1792004583762,"u":""},{"k":"quest","r":true,"t":"지혜의 각인을 1단계로 새겼다. (얻는 경험치 +4%)","ts":1792004581950,"u":""},{"k":"quest","r":true,"t":"힘의 각인을 5단계로 새겼다. (전투력 +20)","ts":1792004571893,"u":""},{"k":"quest","r":true,"t":"힘의 각인을 4단계로 새겼다. (전투력 +16)","ts":1792004570574,"u":""},{"k":"quest","r":true,"t":"힘의 각인을 3단계로 새겼다. (전투력 +12)","ts":1792004568806,"u":""},{"k":"quest","r":true,"t":"힘의 각인을 2단계로 새겼다. (전투력 +8)","ts":1792004556312,"u":""},{"k":"quest","r":true,"t":"힘의 각인을 1단계로 새겼다. (전투력 +4)","ts":1792004553992,"u":""},{"k":"quest","r":true,"t":"평온의 각인을 5단계로 새겼다. (오르는 절망도 -20%)","ts":1792004546905,"u":""},{"k":"raid","r":true,"t":"타락한 멜로니에게 마지막 일격을 넣어 되돌렸다.","ts":1792004519388,"u":"BbrUy5pUYFVwoWeY2hPCNjf8RKs2"},{"k":"raid","r":true,"t":"멜로니님이 타락했다. 맞서서 되돌려 주자.","ts":1792004478285,"u":"BbrUy5pUYFVwoWeY2hPCNjf8RKs2"},{"k":"march","r":true,"t":"토벌 성공 · 전투 5번 · 파티 7명","ts":1792004447042,"u":""},{"k":"raid","r":true,"t":"타락한 버니타에게 마지막 일격을 넣어 되돌렸다.","ts":1792004339375,"u":"8xGWfjLXz6f0xYpCtTkDrNFVK872"},{"k":"raid","r":true,"t":"버니타님이 타락했다. 맞서서 되돌려 주자.","ts":1792004178307,"u":"8xGWfjLXz6f0xYpCtTkDrNFVK872"},{"k":"fall","r":true,"t":"타락에서 벗어나 원래 모습으로 돌아왔다.","ts":1792003953655,"u":""},{"k":"march","r":true,"t":"토벌 성공 · 전투 6번 · 파티 7명 · 이벤트 골드 +80","ts":1792003871063,"u":""},{"k":"fall","r":true,"t":"타락의 대가로 경험치 79, 골드 118을(를) 잃었다. 레벨이 612(으)로 떨어졌다.","ts":1792003871061,"u":""},{"k":"fall","r":true,"t":"절망도가 100에 닿아 타락했다. 친구들이 맞서 주기를 기다리자.","ts":1792003871047,"u":""},{"k":"gift","r":true,"t":"켈님이 별빛 쿠키을(를) 선물했다. 가방의 받은 선물함에 넣어 두었다.","ts":1792003798159,"u":"fv6DYCaxl6hRxbogfnwDQCl7yu12"},{"k":"gift","r":true,"t":"카모츠키 하나에님이 별빛 쿠키을(를) 선물했다. 가방의 받은 선물함에 넣어 두었다.","ts":1792003778145,"u":"m495Eggbd3WNgQH7xzf7azYOSq93"},{"k":"gift","r":true,"t":"카모츠키 하나에님이 별빛 쿠키을(를) 선물했다. 가방의 받은 선물함에 넣어 두었다.","ts":1792003778144,"u":"m495Eggbd3WNgQH7xzf7azYOSq93"},{"k":"raid","r":true,"t":"함께 맞섰던 절망의 마인이 쓰러졌다! 토벌 보상: 골드 60, 마력석 1","ts":1792003758224,"u":""},{"k":"res","r":true,"t":"카모츠키 하나에님이 공명해 주었다.","ts":1792003758143,"u":"m495Eggbd3WNgQH7xzf7azYOSq93"},{"k":"res","r":true,"t":"이안님이 공명해 주었다.","ts":1792003758142,"u":"GQltsm4RVrQUaYWNyVQx3d5RpG63"},{"k":"raid","r":true,"t":"함께 맞섰던 절망의 마인이 쓰러졌다! 토벌 보상: 골드 60, 마력석 1","ts":1792003698317,"u":""},{"k":"raid","r":true,"t":"🜏 절망의 마인 강림! ユウ이(가) D마을에서 마인이 되었다. 누구든 맞설 수 있다.","ts":1792003550572,"u":"izAVO7Os1RfT0cEGy4WghBEPxeZ2"},{"k":"raid","r":true,"t":"🜏 절망의 마인 강림! 스칼렛이(가) D마을에서 마인이 되었다. 누구든 맞설 수 있다.","ts":1792003550571,"u":"9CDsNIdCCDfQFvxN2eWHLFNKAyD2"},{"k":"march","r":true,"t":"토벌 성공 · 전투 5번 · 파티 5명","ts":1792003545600,"u":""},{"k":"raid","r":true,"t":"함께 맞섰던 절망의 마인이 쓰러졌다! 토벌 보상: 골드 60, 마력석 1","ts":1792003338224,"u":""},{"k":"raid","r":true,"t":"🜏 절망의 마인 강림! 샬럿이(가) C마을에서 마인이 되었다. 누구든 맞설 수 있다.","ts":1792003243059,"u":"yBcbJQiofCf6P9GAb8gD7SZzz6Q2"},{"k":"march","r":true,"t":"토벌 성공 · 전투 3번 · 파티 7명","ts":1792003238047,"u":""},{"k":"duel","r":true,"t":"샬럿님과의 대련: 패배. (골드 +8)","ts":1792003170422,"u":""},{"k":"fr","r":true,"t":"A님이 친구 신청을 수락했다.","ts":1792003118138,"u":"Y8VMLqvYWkPYCEhExZcfFESQPRL2"},{"k":"duel","r":true,"t":"샬럿님이 대련을 신청했다! 대련장에서 받을 수 있다.","ts":1792003086128,"u":""},{"k":"gift","r":true,"t":"ユウ님의 선물을 열었다. 절망도가 15 내려갔다.","ts":1792002772651,"u":""},{"k":"gift","r":true,"t":"카모츠키 하나에님이 별빛 쿠키을(를) 선물했다. 가방의 받은 선물함에 넣어 두었다.","ts":1792002718420,"u":"m495Eggbd3WNgQH7xzf7azYOSq93"},{"k":"gift","r":true,"t":"카모츠키 하나에님이 별빛 쿠키을(를) 선물했다. 가방의 받은 선물함에 넣어 두었다.","ts":1792002718175,"u":"m495Eggbd3WNgQH7xzf7azYOSq93"},{"k":"portal","r":true,"t":"☄ B마을 잿빛 소용돌이이(가) 열렸다! 03:41까지 10명이 모여야 한다.","ts":1792002662041,"u":""}],"ntcSeen":1792028997739,"nts":1792028997739,"pc":{"p497765":true,"p497766":true,"p497768":true,"p497769":true,"p497777":true,"p497779":true},"pf":{"ap":"쉽게 흩날리는 희고 긴 머리카락을 새장 베일을 얹어 묶어두었다. 베일에 가려져 눈은 보이지 않아도 그 입이 미소짓고 있음은 확실히 관측 가능하다. 마법소녀라 하기엔 칙칙하기 그지없는, 검은 정복에 가까운 차림새.","et":"괜찮아, 사랑해.","mg":"어둠 속성의 구체를 쏘는 것 같긴 한데, 등급이 낮아서인지 정확한 효과는 불명이다.","pe":"재미없는 복장과는 달리 유하고 흥밋거리를 찾아다니는 성격... 아마도."},"pj":{"p497765":true,"p497766":true,"p497768":true,"p497769":true,"p497777":true,"p497779":true},"pn":{"p497769":true,"p497777":true,"p497778":true,"p497779":true,"p497780":true,"p497781":true},"rc":{"8xGWfjLXz6f0xYpCtTkDrNFVK872":1792004339249,"9CDsNIdCCDfQFvxN2eWHLFNKAyD2":1792003719456,"BbrUy5pUYFVwoWeY2hPCNjf8RKs2":1792004519262,"GQltsm4RVrQUaYWNyVQx3d5RpG63":1791918977966,"J2HdWWP6KSVBPob0KAi6PuqdxBx2":1791934823595,"Tt3v4XAALDP0uEwLFJ8TYVLffR42":1791999052126,"az6vxnDTCpbaA3NnaCKhjL7ZcsC2":1792002157975,"hFc9mVGhPQVuESK6zFzvbWaWzpc2":1791958142991,"izAVO7Os1RfT0cEGy4WghBEPxeZ2":1792003555268,"yBcbJQiofCf6P9GAb8gD7SZzz6Q2":1792003250259,"riuHw9Ra2sVwbCAxMEdZGS6ovHG2":1792039442406},"rg":[{"g":"g2","n":"은랑","ts":1791998609980,"u":"Tt3v4XAALDP0uEwLFJ8TYVLffR42"},{"g":"g2","n":"우라미치","ts":1791998613502,"u":"raTqPgZrw3RbRX37ru7KKQYywKb2"},{"g":"g2","n":"J","ts":1791998615431,"u":"DRagw12drwRNlmYI4zFSaH3rSSf1"},{"g":"g2","n":"아인","ts":1791998665417,"u":"cv5jNEt4fVW37b2f1h2A7IGyUdE2"},{"g":"g2","n":"아인","ts":1792000480057,"u":"cv5jNEt4fVW37b2f1h2A7IGyUdE2"},{"g":"g1","n":"아인","ts":1792000482971,"u":"cv5jNEt4fVW37b2f1h2A7IGyUdE2"},{"g":"g2","n":"아인","ts":1792000486639,"u":"cv5jNEt4fVW37b2f1h2A7IGyUdE2"},{"g":"g2","n":"켈","ts":1792002309901,"u":"fv6DYCaxl6hRxbogfnwDQCl7yu12"},{"g":"g2","n":"이안","ts":1792002478856,"u":"GQltsm4RVrQUaYWNyVQx3d5RpG63"},{"g":"g2","n":"버니타","ts":1792002488687,"u":"8xGWfjLXz6f0xYpCtTkDrNFVK872"},{"g":"g2","n":"멜로니","ts":1792002603713,"u":"BbrUy5pUYFVwoWeY2hPCNjf8RKs2"},{"g":"g2","n":"카모츠키 하나에","ts":1792002712696,"u":"m495Eggbd3WNgQH7xzf7azYOSq93"},{"g":"g2","n":"카모츠키 하나에","ts":1792002716009,"u":"m495Eggbd3WNgQH7xzf7azYOSq93"},{"g":"g2","n":"카모츠키 하나에","ts":1792003757220,"u":"m495Eggbd3WNgQH7xzf7azYOSq93"},{"g":"g2","n":"카모츠키 하나에","ts":1792003761108,"u":"m495Eggbd3WNgQH7xzf7azYOSq93"},{"g":"g2","n":"켈","ts":1792003782587,"u":"fv6DYCaxl6hRxbogfnwDQCl7yu12"}],"rl":{"1O3fRQIwC3QYgbiDh7665xMfpj83":1791967598354,"1cMsWXO40ORyWmw4r94HVFtyZLn1":1791967601014,"2BuNOPBCRWTCxZRw05yIYi7D7mJ2":1791963748149,"4lncon4QvpgNcDnzE9j50ubjQKr1":1791963744179,"5Qws5XRLZpN4n2m6iqS5b1jxDb32":1791963741318,"5TFD2Qumsoa0ISWYFdE7FezpJGK2":1791967608748,"8xGWfjLXz6f0xYpCtTkDrNFVK872":1792005259651,"90RinCqz1jQgU76Z6KVKFyMacAx2":1791967614736,"9CDsNIdCCDfQFvxN2eWHLFNKAyD2":1791967620137,"BZgdcmizDLUVILiVYBQm6kECx5e2":1791967630744,"BbrUy5pUYFVwoWeY2hPCNjf8RKs2":1791967639831,"CJzLLuh4XMWByAaKzwKCipKwpk63":1791967642581,"CqeKPoHY1pUdcDXVeCciVGOpfY82":1791949500376,"D3Ga8gSQ5rfMY68GCND6FCREw003":1791949508260,"DRagw12drwRNlmYI4zFSaH3rSSf1":1791951391505,"Fp1pGJmjJOdIOSphzVWd90TelM73":1791906995291,"GQltsm4RVrQUaYWNyVQx3d5RpG63":1791951386791,"GeLNYSlQrOcGbVnC1w4S4cIuovw2":1791953105705,"HECWRncMOMV5rl2kImFtEUepcj83":1791953177598,"HpqeCvpUTfNCqY4nSQ8XYXkp61G3":1791951404942,"J2HdWWP6KSVBPob0KAi6PuqdxBx2":1791953182432,"J47ZpbkzzBYoc1UJr9HJWu2e4ro1":1791953172116,"L283wvRnYyRIne6xAgOAgvaZ3vq1":1791953187351,"LMkuYt9kGpd1YV8XAOrmPYN8XA42":1791946414194,"N8S2qsJmP3gwvpNeCXxWXdCaWQf2":1791953783523,"P2poFsqWsMfvHCVxQDJeMkSVzAP2":1791953807130,"QOIM2ErQqJWM5A12Ifak4CYfcxF2":1791953812527,"R7P0FcnUkLb12ZEAJxqMbqumzF42":1791954179324,"RCM5pyIIlvVq6Ot5L8wYFgv0wjl2":1791951835519,"TD03dKEX25czJwZRR6V9JprvSq63":1791946429401,"TLXwyHDof5hs2maSugjRj8OcA9G3":1791954199218,"Tt3v4XAALDP0uEwLFJ8TYVLffR42":1791956371008,"UmlKjzGMv8SP0eaSVhUfT14hpgx2":1791956374513,"Uzq4tStgN2XXfa16mmm4ieoK8JB3":1791956378192,"VtnctpcLksU22vrpMup3eiMbuLD3":1791957105159,"XOWYx0m4qMMPPkoNHubHnvuKZhf2":1791957110841,"Y8VMLqvYWkPYCEhExZcfFESQPRL2":1792003189294,"YTdCUiThANTax494Br0J2g91MXZ2":1791957107703,"bFG6iHrOxyPFeo6tOcajPpaumhn1":1791957114106,"bds6uTgU5qXmEVEhIWv9G0ZFeOA3":1791946442571,"cv5jNEt4fVW37b2f1h2A7IGyUdE2":1791946446806,"d99cmpvtxiX7SxTU6Z36cOCsKHn2":1791957123757,"en1LS9S962ZDwrBbQjOLvQPNzt82":1791958440325,"ezslnNoEzbdIcY6M6jGLg5LhFA72":1791958445065,"fv6DYCaxl6hRxbogfnwDQCl7yu12":1791958448614,"giSn0O4NnHdtHlsyBKBhC3RVOr22":1791969719862,"gqHVWbtFBUVJaYEFDOfoHzNqxwt2":1791958545541,"kyQ1ubCjvuOCuBtpsC4u330u61C2":1791958552661,"la18Sl38HWd4C2dpSLoV7x2ter72":1791959459159,"m495Eggbd3WNgQH7xzf7azYOSq93":1791959464936,"oveVc5JYBKVX2JNdEJ4J8vXnS8j1":1791959466199,"pkoXWveVvuQ7PTzdQcc7LbAGGYd2":1791959475894,"qpQoKidsMqMXLxFj1h73VeFw7R82":1791934670025,"raTqPgZrw3RbRX37ru7KKQYywKb2":1791960461581,"riuHw9Ra2sVwbCAxMEdZGS6ovHG2":1791960464432,"z2U2m3SGpwWJx36N1hQ8cgS5VVr1":1791907000913},"rn":{"calm":5,"luck":5,"pow":5,"wis":5},"rs":1792007919109,"rsb":0,"rsn":{"1O3fRQIwC3QYgbiDh7665xMfpj83_1792008325133":true,"1O3fRQIwC3QYgbiDh7665xMfpj83_1792012842288":true,"8xGWfjLXz6f0xYpCtTkDrNFVK872_1792007742241":true,"9CDsNIdCCDfQFvxN2eWHLFNKAyD2_1792008327335":true,"Fp1pGJmjJOdIOSphzVWd90TelM73_1792010185993":true,"riuHw9Ra2sVwbCAxMEdZGS6ovHG2_1792039363416":true},"s":"소녀","scar":1792007553655,"sk":{"day":"2026-10-15","used":0,"arm":{}},"stats":{"abyssBare":1,"abyssWins":24,"bossHits":4,"bossKillsD":1,"bossKillsW":1,"chats":770,"comments":8,"dawnWin":1,"disActs":1,"dqAll":1,"duL":1,"facGive":2620,"facUses":16,"falls":9,"gifts":25,"giftsUsed":3,"huntsLost":26,"huntsWon":134,"lastDay":"2026-10-15","lhDone":2,"loginDays":3,"maxDespair":100,"maxGold":2305,"portalWins":16,"purchases":269,"raidHits":13,"raidKills":3,"reachedZero":true,"recovered":9,"resonances":131,"runes":20,"trialWins":2,"upgradeFails":25,"upgrades":35,"wfGive":3000,"witchKills":1,"witchSaves":5,"lhAbyss":1},"t":"고독","tcb":7,"ti":"wf_keeper","titles":["first_steps","gold_100","dark","shop_1","first_weapon","upgrade_1","rookie_hunter","founder","level_5","despair_50","level_10","friend_1","friend_5","res_1","grade_d","trial_1","gift_1","dq_1","shop_10","despair_100","fallen","returned","hunter_5","level_20","upgrade_5","res_10","hunter_10","hunter_25","weapon_master","hope_return","gold_500","abyss_1","fac_1","boss_d","tut_done","dex_ev","all_weapons","abyss_10","s_unlucky","s_blade","s_7falls","s_hoard","grade_c","rune_1","wf_1","boss_w","wf_keeper","s_broke","witch_save","s_dawn","witch_kill","savior","gift_10","rune_all","s_bare","lh_1","daily_3","wf_done","lh_abyss"],"trT":1791997652284,"tut":{"done":1,"fold":true,"got":{"bs":1,"dq":1,"fr":1,"mr":1,"pf":1,"pt":1,"rs":1,"up":1,"wp":1}},"v":"D","vcSeen":1792039432155,"wb":{"d":0,"day":"2026-10-15","h":"d-2026-10-15p","w":0},"wbc":{"d-2026-10-14p":true,"w-2026-10-12":true},"wbp":{"d-2026-10-14p":true,"w-2026-10-12":true},"wf":3000,"wfl":5,"wl":{"w0":5,"w1":5,"w2":5,"w3":5,"w4":5,"w5":5,"w6":5},"wp":0,"wps":[5,2,1,3,0,4,6],"wtmp":{"day":"2026-10-15","v":1},"fq":{},"fo":{},"rqIn":{},"wfDone":1,"dmu":{},"arm":{},"mj":null,"healOff":true}]];
      const RS_REPAY=["maint-20261018","restore-apology-20261016"];


      /* 고정 운영자: 데이터베이스의 admins 칸과 상관없이 항상 운영자로 인정할 계정(uid). 운영자를 늘리려면 이 목록에 uid를 더한다. */
      const ADMIN_FIXED=["TLXwyHDof5hs2maSugjRj8OcA9G3",  "SvQ1nHzfKwf4kpBCIyT8FqUxYMc2"];


      /* 자연 회복: 10분마다 절망도가 10씩 내려간다. 게임을 꺼 둔 동안 지난 시간도 다시 접속하면 한꺼번에 반영된다.
      타락 중에는 회복되지 않는다. 특성·속성 보정 없이 정확히 HEAL_DZ만큼 내려간다. 숫자만 고치면 바뀐다. */
      const HEAL_MS=600000,HEAL_DZ=10;


      /* 계정 만들기 비밀 코드: 코드 자체는 파일에 적지 않고, 바꾼 값(해시)만 적어 둔다. 코드를 바꾸려면 새 코드의 SHA-256 값으로 이 줄을 고친다. */
      const SIGNUP_CODE_HASH="1b83fc8e623c6ce0b7e9c3a18bd155b6727c2ede7ce4d8ad3236e3948975638f",AUTO_JC="희망하라";
      const TRIAL_CD=24*3600000;


      /* 프로필 이미지: 가운데를 잘라 160px로 줄여 저장한다 */
      /* 프로필 사진: 내 사진은 AV_BIG(400)픽셀까지 저장해 크게 볼 수 있다. 다른 사람에게 보이는 사진은 데이터 사용량을 아끼려고 AV_SMALL(64)픽셀로 줄여서 올린다. */
      const AV_BIG=400,AV_SMALL=64;


   /* 장기 토벌: 1~6시간 동안 혼자 먼 곳으로 토벌을 떠난다. 떠나 있는 동안 게임을 꺼 두어도 되고, 돌아오면 보상을 받는다.
      [키, 이름, 시간, 권장 전투력, 시간당 골드, 시간당 경험치, 시간당 절망도, 마력석, 설명].
      성공 확률은 떠날 때의 전투력 ÷ 권장 전투력 × 0.85 (최저 30%, 최고 95%). 실패하면 보상이 절반이고 절망도가 LH_FAILDZ 더 오른다.
      중간에 철수하면 지난 시간만큼의 절반만 받는다(마력석 없음). 떠나 있는 동안에는 정기 출정에 참가할 수 없다. 숫자만 고치면 바뀐다. */
   /* 레벨업에 필요한 경험치: 레벨 L → L+1에 XP_BASE + XP_STEP×(L-1). 1→2는 40, 2→3은 50, 3→4는 60 …
      (예전에는 모든 레벨이 40으로 같았다.) 숫자만 고치면 바뀐다. */
   const XP_BASE=40,XP_STEP=10;


   /* 2026-10-27 보상 상향: 시간당 골드 55·60·65·72 → 80·90·100·115, 시간당 경험치 30·32·34·36 → 45·50·55·60, 마력석 0·0·1·2 → 0·1·2·4 */
   const LH=[["near","근교 순찰",1,60,80,45,3,0,"마을 둘레의 숲길을 돌며 떠도는 마수를 쫓아낸다."],
   ["forest","검은 숲 토벌",2,150,90,50,4,1,"빛이 들지 않는 숲 깊은 곳, 마수의 둥지를 치운다."],
   ["ruin","무너진 성채 원정",4,300,100,55,4,2,"옛 마법소녀들이 지키던 성채. 지금은 마수의 소굴이다."],
   ["abyss","심연 변두리 원정",6,450,115,60,5,4,"심연이 시작되는 곳. 돌아오지 못한 이들의 흔적이 남아 있다."]];
   const LH_FAILDZ=10,LH_EARLY=.5,LH_EV=["멀리서 마수의 울음소리가 들렸다.","부서진 마법봉 조각을 주웠다.","길 잃은 아이를 마을까지 데려다주었다.","마수 무리와 맞닥뜨려 한바탕 싸웠다.","오래된 결계석이 희미하게 빛나고 있었다.","잠시 모닥불 곁에서 숨을 골랐다.","누군가 남긴 편지를 발견했다. 끝까지 싸우겠다는 다짐이 적혀 있었다.","거대한 마수의 그림자가 스쳐 지나갔다.","마력이 고인 샘에서 상처를 씻었다.","쓰러진 마수에게서 반짝이는 조각이 떨어졌다."];
   const PIC_PX=1200,PIC_MD=360;


   /* 공명 버튼: 같은 상대에게는 3시간에 한 번. 기다려야 하면 남은 시간을 버튼에 보여 주고, 프로필 창이 열려 있는 동안 1초마다 갱신한다. */
   const RES_CD=10800000;
   // 나에게 온 공명 요청을 확인해서 받은 공명 목록에 넣는다.
   /* 공명 수락·거절: 친구가 청한 공명은 '받은 공명'(C.rqIn)에 쌓이고, 받아들이면 절망도가 내려간다. 수락·거절은 친구 소식(fmsg)으로 상대에게 알린다.
      RQ_TTL(24시간)이 지난 공명은 저절로 사라진다. */
   const RQ_TTL=86400000;


   /* 가방, 무기 강화, 선물 */
   // 아이템: [id, 이름, 설명, 가격]. 마력석은 무기 강화 재료이고, g로 시작하는 id는 친구에게 보내는 선물이다. 숫자는 임시 값이다.
   const ITM=[["mana","마력석","무기를 강화할 때 쓰는 재료.",40],["charm","결계 부적","다음 출정에서 오르는 절망도가 절반으로 줄어든다. 하루에 3개까지 살 수 있다.",50],["map","마수 사냥 지도","다음 출정의 전투 횟수가 3번으로 고정된다. 보상은 원래 정해진 횟수대로 받는다.",70],["flag","용기의 깃발","다음 출정에서 파티 전원의 전투력이 5 오른다.",60],["seal","여왕의 인장","재계약 시험에서 한 번 실패해도 절망도가 오르지 않는다.",120],["candle","계약의 촛불","다음 재계약 시험의 판정에 +5를 더한다. 한 번에 1개까지만 가질 수 있다.",90],["whet","보호의 숫돌","준비해 두면 강화에 실패했을 때 마력석 대신 숫돌이 깨진다(마력석을 돌려받는다). 실패했을 때만 사라진다.",100],["hope","희망의 결정","가방에서 사용하면 내 절망도가 바로 30 내려간다. 타락 중에는 쓸 수 없다.",300],["g1","작은 꽃다발","친구에게 선물하면, 친구가 원할 때 열어 절망도를 8 낮출 수 있다.",30],["g2","별빛 쿠키","친구에게 선물하면, 친구가 원할 때 열어 절망도를 15 낮출 수 있다.",60],["g3","달빛 편지","친구에게 선물하면, 친구가 원할 때 열어 절망도를 3 낮출 수 있다.",20]];
   const GV={g1:8,g2:15,g3:3},HOPE_DZ=30;
   // 소모품: 가방에서 '사용 준비'를 눌러 두면 다음 출정이나 시험에서 쓰인다.
   const USE={charm:"출정",map:"출정",flag:"출정",seal:"시험",candle:"시험",whet:"강화"},CHARM_MAX=3;
   // 강화 성공 확률(%): 현재 단계 0→+1, +1→+2 ... +4→+5 순서. 숫자만 고치면 바뀐다. 실패하면 마력석만 사라지고 단계는 그대로다(보호의 숫돌을 준비하면 마력석도 지켜 준다).
   const UPR=[90,75,60,45,30];
   // 받은 선물: 보낸 친구가 정한 선물 종류만 인정하고, 한 번에 최대 40까지 절망도를 낮춘다.
   /* 선물: 같은 친구에게 하루(24시간)에 GIFT_DAY개까지 보낼 수 있다. 서버에는 gift/{받는 사람}/{보낸 사람}/{0~3} 네 칸에 나눠 기록하고,
      각 칸은 보낸 지 24시간이 지나야 다시 쓸 수 있다(서버 규칙도 같은 조건으로 막는다). 받는 쪽은 한 번에 최대 40까지 절망도가 내려간다.
      보낸 뒤에는 giftn/{받는 사람}에 마지막 시각만 남긴다. 받는 사람은 앉아 있는 동안 그 시각만 보고, 마을에 들어오거나 가방을 열거나 시각이 새로워지면 칸 전체를 한 번 받는다. */
   const GIFT_DAY=4,DAY_MS=86400000;
   /* 받은 선물함: 친구에게 받은 선물을 최대 RG_MAX개까지 보관한다(넘치면 가장 오래된 것부터 사라진다).
      꺼내 쓰면 그 선물의 효과(작은 꽃다발 -8, 별빛 쿠키 -15, 달빛 편지 -3, '다정함' 특성은 1.5배)만큼 절망도가 내려간다.
      받은 선물은 다른 친구에게 다시 보낼 수 없다. 타락한 동안에는 쓸 수 없다. 숫자만 고치면 바뀐다. */
   const RG_MAX=30;


   /* 캐릭터 설정: 외관, 성격, 마법, 기타를 자유롭게 적고 언제든 고친다. 다른 사람의 프로필 창에도 보인다. */
   const PF=[["ap","외관"],["pe","성격"],["mg","마법"],["et","기타"]];
   // 전투를 이어서 진행한다. 선택지 이벤트를 만나면 멈추고 파티의 선택을 기다린다.
   /* 전투 판정: 백면체 주사위(1~100)를 굴려 대성공 · 성공 · 실패 · 대실패를 정한다.
      성공 기준치는 파티 전투력이 권장 전투력에 비해 얼마나 높은지(비율)로 정한다. 평균 전투력 500 기준으로 맞춰 두었다.
      주사위 ≤ T의 1/5 → 대성공, ≤ T → 성공, ≤ T+30(최대 95) → 실패, 그보다 크거나 96 이상 → 대실패. 아무리 강해도 대실패 5%는 남는다.
      실패는 밀려나지만 계속 나아가고, 대실패는 그 자리에서 퇴각(토벌 실패)한다. 숫자만 고치면 바뀐다. */
   const BJ=[{n:"대실패",ex:0,dz:10,t:["마수 무리에 포위당해 간신히 퇴각했다.","공격이 모두 빗나가고 파티가 무너졌다.","예상보다 훨씬 강한 마수에게 짓밟혔다."]},
   {n:"실패",ex:2,dz:5,t:["밀려났지만 이를 악물고 버텨 냈다.","상처를 입었지만 겨우 길을 열었다.","마수를 놓쳤지만 다시 대열을 정비했다."]},
   {n:"성공",ex:8,dz:0,t:["마수 무리를 쓰러뜨렸다.","호흡을 맞춰 마수를 정리했다.","침착하게 마수를 하나씩 베어 냈다."]},
   {n:"대성공",ex:15,dz:-2,t:["완벽한 연계로 마수를 한순간에 쓸어버렸다!","마력이 폭발하며 마수 무리를 단숨에 소멸시켰다!","빈틈 하나 없는 움직임으로 마수를 압도했다!"]}];
   const EARTH_P=.3;
   // 낫(수확의 일격): 파티에 낫을 든 사람이 있으면 대성공 범위가 기준치의 1/5에서 1/SCY_CRIT로 넓어진다. 낫의 대가(출정 후 절망도)는 SCY_DZ.
   const SCY_CRIT=3.5,SCY_DZ=2;
   // 방장이 2.2초마다 진행한다: 기록 한 줄씩 공개 → 선택지 시작 → 표 확인 → 결과.
   // 끝난 방은 결과 공개 뒤 1분이 지나면 방장이 지운다.
   const ROOM_KEEP=60000;


   /* 정기 출정: 5분마다 출정 15개가 시각에 맞춰 자동으로 열린다.
      누가 만드는 방이 아니라 현재 시각으로 계산하므로 모두에게 같은 출정이 보이고, 방장이 없어서 유령방이 생기지 않는다.
      서버에는 각자 자기 자리만 rooms/xm{묶음}_e{0~9}/{나}에 기록한다. 마감(출발 2분 전) 전에 먼저 참가한 XMAX(7)명이 파티가 된다.
      전투와 이벤트는 출정 번호를 씨앗으로 쓴 난수로 계산해서 참가자 모두의 화면에서 같은 결과가 나온다.
      선택지 투표는 rooms/xv{출정}_c{번호}/{나}에 기록하고, 마감 시각까지 들어온 표만 센다. */
   const XS=300000,XN=15,XCLOSE=120000,XSTEP=2200,XKEEP=24;
   const XPL=["외곽","폐허","숲길","지하수로","옛 성채","묘지","포탈 흔적","버려진 광산","안개 골짜기","무너진 다리"];
   // 위험도: df = 마수 강함 배율, rw = 보상 배율. 숫자만 고치면 바뀐다.
   const XDF=[null,{n:"위험도 ★",df:.85,rw:.8},{n:"위험도 ★★",df:1,rw:1},{n:"위험도 ★★★",df:1.2,rw:1.4},{n:"위험도 ★★★★ 심연",df:1.45,rw:2,dz:1.5}];
   /* 심연: 묶음마다 1~2개가 열리는 가장 위험한 출정. 권장 전투력이 훨씬 높고(1.45배), 보상은 2배, 전투에서 오르는 절망도는 1.5배.
      전투력 ABYSS_MIN 이상만 참가할 수 있다. 끝까지 토벌하면 칭호 '심연을 걷는 자'. 숫자만 고치면 바뀐다. */
   const ABYSS_MIN=450,ABYSS_PL=["심연의 입구","심연 · 잊힌 제단","심연 · 무저갱","심연 · 검은 왕좌","심연 · 끝없는 회랑"];
   // 정기 출정 한 방의 정원. 인원별 보상 배율은 settle()의 [0, 1명 … 7명] 표에서 고친다.
   const XMAX=7;
   // 내가 참가한 출정을 진행한다. 화면을 보고 있지 않아도 돌아가서 결과와 보상을 받는다.
   // 출정이 서버 문제 등으로 끝나지 못하면 캐릭터가 출정에 묶이지 않도록 정리한다(시간 제한, 직접 정리 버튼).
   const X_FETCH_GIVEUP=5*60000,X_VOTE_GIVEUP=30000,X_HARD_LIMIT=20*60000;


   /* 상점 */
   // 무기: [이름, 설명, 가격, 전투력 보너스]. 숫자는 임시 값이다.
   /* 완드 출정 경험치 보너스(하향: 15% → 8%). 숫자만 고치면 바뀐다. */
   const WAND_EX=.08;


   const WP=[["칼","가장 기본이 되는 근접 무기. 강화할 때마다 전투력이 2씩 오른다.",80,7],["총","멀리서 마수를 꿰뚫는다. 명중률이 높아 재계약 시험의 운 판정이 최소 8은 나온다.",90,6],["낫","수확하듯 마수를 벤다. 전투력이 높고, 파티에 낫을 든 사람이 있으면 출정에서 대성공이 더 잘 나온다(수확의 일격). 대신 출정 후 절망도가 2 더 오른다.",90,15],["방패","든든하게 몸을 지킨다. 출정이나 시험에 실패했을 때 오르는 절망도가 크게 줄어든다.",80,4],["오브","마력을 모으는 수정구. 공명을 하거나 받을 때 내 절망도가 2 더 내려간다.",90,5],["완드","마법을 곧게 뻗는 지팡이. 출정 경험치가 "+Math.round(WAND_EX*100)+"% 늘어난다.",80,6],["스태프","큰 마력을 다루는 긴 지팡이. 출정에서 파티 전투력을 2 올려 준다.",120,8]];
   /* 1:1 대화를 PDF로 저장: 지금 화면에 불러온 대화 전체를 캔버스에 그린 뒤, A4 비율의 쪽으로 나눠 PDF 한 파일로 내려받는다(외부 라이브러리 없음).
      DM_PNG_W = 그림 너비(픽셀), DM_PNG_X = 선명도 배율. DM_PNG_H는 예전 PNG 저장에서 쓰던 값으로 지금은 쓰지 않는다. */
   const DM_PNG_W=720,DM_PNG_H=7000,DM_PNG_X=2;


   /* 정기 출정 알림음: 출발할 때(T0가 되는 순간)와 결과가 나올 때 울린다. 성공은 밝은 세 음, 실패는 낮은 두 음.
      [주파수(Hz), 시작 시각(초), 길이(초)]만 고치면 소리가 바뀐다. 브라우저는 화면을 한 번이라도 누른 뒤에만 소리를 낸다. */
   const XSND={start:[[523,0,.16],[659,.15,.16],[784,.3,.3]],win:[[784,0,.14],[988,.13,.14],[1319,.26,.4]],lose:[[392,0,.25],[294,.22,.45]]};


   /* 일일 의뢰: 하루에 3개를 뽑는다. 뽑힌 순간의 기록을 기준으로, 그 뒤에 늘어난 횟수가 진행도다.
      [id, 내용, 목표 횟수, 기록에서 횟수를 세는 방법, 보상(g=골드, m=마력석), 혼자 하기에서도 가능한지]. 숫자만 고치면 바뀐다. */
   const DQ=[["march","출정에 1번 나가기",1,s=>(s.huntsWon||0)+(s.huntsLost||0),{g:30},1],
   ["win","토벌에 2번 성공하기",2,s=>s.huntsWon||0,{m:1},1],
   ["buy","상점에서 물건 1번 사기",1,s=>s.purchases||0,{g:20},1],
   ["boss","보스 레이드에서 1번 공격하기",1,s=>s.bossHits||0,{g:25},1],
   ["res","다른 마법소녀에게 2번 공명하기",2,s=>s.resonances||0,{g:25},0],
   ["gift","친구에게 선물 1번 보내기",1,s=>s.gifts||0,{g:30},0],
   ["chat","채팅 3번 하기",3,s=>s.chats||0,{g:20},0]];
   const DQ_BONUS={g:30,m:1},DQ_N=3;


   /* 마법: 속성마다 마법이 하나씩 있다. 가방 화면에서 '준비'해 두면 다음 해당 상황에서 쓰이고, 쓸 때 마력을 1 쓴다.
      마력은 하루 2 + (속성 수 - 1)이고 매일 밤 12시에 회복된다. 준비만 해 두고 안 쓴 마법도 그때 풀린다. */
   const SK={불:{id:"fire",nm:"홍련의 일격",d:"다음 보스 레이드 공격의 피해가 2배가 된다.",w:"보스 레이드"},
   물:{id:"water",nm:"정화의 물결",d:"다음 출정에서 파티 전원의 절망도 상승이 5 줄어든다.",w:"출정"},
   바람:{id:"wind",nm:"바람의 길잡이",d:"다음 출정에서 운에 맡기는 선택지가 한 번 반드시 좋은 쪽으로 풀린다.",w:"출정"},
   땅:{id:"earth",nm:"대지의 가호",d:"다음 재계약 시험에서 실패한 층을 한 번 다시 판정한다.",w:"재계약 시험"},
   빛:{id:"light",nm:"구원의 빛",d:"다음 타락 레이드 공격의 피해가 3배가 된다. 타락한 친구를 되돌릴 때 쓴다.",w:"타락 레이드"},
   어둠:{id:"dark",nm:"그림자 계약",d:"다음 출정에서 파티 전투력이 8 오른다. 대신 내 절망도가 6 더 오른다.",w:"출정"}};
   const DEX=[
   {k:"ev",nm:"출정 이벤트",half:{g:100},full:{g:300,m:5},items:()=>EV.concat(...Object.values(VEV)).map(x=>{const v=evVil(x.id),[n,d]=evName(x,v||"A");return{id:x.id,nm:n,ds:d,tag:v?VL[v].n+" 전용":x.o?"선택지":"일반",hint:v?VL[v].n+" 출신과 함께 출정하면 만날 수 있다.":"출정 중에 만날 수 있다."}}).concat(SOLO_EV.map(x=>{const[n,d]=evName(x,"A");return{id:x.id,nm:n,ds:d,tag:"고독한 출정"+(x.o?" · 선택지":""),hint:"혼자 출발하는 고독한 출정에서만 만날 수 있다."}}))},
   {k:"bs",nm:"보스",half:{g:80},full:{g:200,m:3},items:()=>DBOSS.map(b=>({id:b[0],nm:b[0],ds:b[1]+" 약점: "+b[2]+" 속성.",tag:"오전·오후 보스",hint:"오전·오후 보스로 나타난다. 한 번 공격하면 기록된다."})).concat(WBOSS.map(b=>({id:b[0],nm:b[0],ds:b[1]+" 약점: "+b[2]+" 속성.",tag:"주간 보스",hint:"주간 보스로 나타난다. 한 번 공격하면 기록된다."})))},
   {k:"wp",nm:"무기",half:{g:50},full:{g:150,m:2},items:()=>WP.map((w,i)=>({id:"w"+i,nm:w[0],ds:w[1]+" 전투력 +"+w[3]+".",tag:"무기",hint:"상점에서 살 수 있다."}))},
   {k:"it",nm:"아이템",half:{g:40},full:{g:100,m:1},items:()=>ITM.map(x=>({id:x[0],nm:x[1],ds:x[2],tag:GV[x[0]]!=null?"선물":USE[x[0]]||x[0]==="hope"?"소모품":"재료",hint:"상점에서 한 번 사면 기록된다."}))},
   {k:"sk",nm:"마법",half:{m:2},full:{m:5},items:()=>Object.keys(SK).map(a=>({id:SK[a].id,nm:SK[a].nm,ds:SK[a].d,tag:a+" 속성",hint:a+" 속성을 얻어 한 번 쓰면 기록된다."}))}];


   /* 알림함: C.nt에 최근 50개까지 저장한다. [k: 종류, t: 내용, u: 관련된 사람, ts: 시각, r: 읽음] */
   const NTI={res:["♡",""],gift:["❀",""],fr:["☍",""],title:["✦",""],warn:["!","bad"],fall:["✕","bad"],boss:["⚔",""],march:["⚑",""],raid:["☾","bad"],quest:["✓",""],dex:["❖",""],dm:["✉",""],notice:["📢",""],portal:["☄","bad"],guard:["♜",""],fac:["🏛",""],board:["📝",""],disaster:["⚠","bad"],wave:["⚔","bad"],duel:["⚔",""]};
   /* 알림 종류별 보기: [키, 이름, 포함되는 알림 종류]. 목록에 없는 종류는 '기타'로 모인다. */
   const NT_CAT=[["all","전체",null],["social","교류",["res","gift","fr","dm","board","duel"]],["battle","전투",["boss","march","raid","portal","wave","disaster","fall","warn"]],
   ["grow","성장·보상",["quest","title","dex","fac","guard"]],["notice","공지",["notice"]],["etc","기타",[]]];


   /* 보스 레이드: 오전 보스는 0시~12시, 오후 보스는 12시~24시에 나오고, 주간 보스는 매주 월요일 0시에 바뀐다. 모든 플레이어가 같은 보스의 HP를 함께 깎는다.
      서버에는 wboss/{보스 번호}/{플레이어}에 각자의 누적 피해만 기록해서, 여러 명이 동시에 공격해도 덮어써지지 않는다.
      보스: [이름, 설명, 약점 속성]. 약점 속성을 가진 마법소녀는 피해 30% 증가. */
   const DBOSS=[["그림자 늑대 무리","밤마다 마을 외곽을 맴도는 굶주린 그림자들.","빛"],["울음의 인형사","부서진 인형들을 실로 엮어 끌고 다닌다.","불"],["녹슨 기사","주인을 잃고도 계약을 지키려는 빈 갑옷.","물"],["안개의 마녀","안개 속에서 길 잃은 마음을 부른다.","바람"],["흡혈 나비 여왕","날갯짓마다 희망을 빨아들인다.","땅"],["가면 쓴 광대","웃는 얼굴로 절망을 연기한다.","어둠"],["썩은 정원사","시든 꽃밭에 마법소녀의 꿈을 묻는다.","불"]];
   const WBOSS=[["검은 달의 성녀","달이 검게 물드는 주에 나타나 기도를 절망으로 바꾼다.","빛"],["끝없는 장례 행렬","관을 멘 행렬이 지날 때마다 누군가 깨어나지 못한다.","불"],["부서진 계약의 사도","깨진 계약서 조각으로 빚어진 거대한 사도.","땅"],["잿빛 고래","하늘을 헤엄치며 마을 위로 잿빛 비를 뿌린다.","바람"]];
   // t: 하루 공격 횟수, HP = base + k × 참가자들의 전투력 합(첫 공격 때 기준), dz: 공격할 때 오르는 절망도, hit: 공격 1번 골드, kill: 처치 보상, mvp: 피해 1위 추가 마력석
   // 오전·오후 보스 HP = 3000 + 6.5 × 참가자 전투력 합. 평균 전투력 500 기준으로 6명 이상이 공격 횟수를 다 써야 쓰러진다(상향).
   // 주의: k(참가자 1명이 늘리는 HP)는 한 사람이 공격 횟수를 다 써서 주는 피해(전투력 × 약 2.5 × 3번)보다 작아야 한다. 크면 사람이 늘수록 더 못 잡는다.
   // 주간 보스 HP = 60000 + 22 × 참가자 전투력 합. 일주일 내내 하루 3번씩 공격하는 사람이 4명쯤, 또는 절반쯤 공격하는 사람이 8명쯤 있어야 쓰러진다(상향).
   /* 보스 상향(2차): HP = base + k × 참가자 전투력 합 + m × 가장 강한 참가자의 전투력.
      m 덕분에 전투력이 아주 높은 한 사람이 혼자 잡을 수 없고, k+m이 한 사람이 주는 피해보다 작아서 강한 사람이 끼면 여전히 도움이 된다.
      오전·오후 보스: 전투력 1500 정도인 사람 5명이 공격 횟수를 다 쓰면 쓰러진다(4명이면 반반, 전투력 500이면 10명 이상). 전투력 9500인 사람 혼자로는 거의 못 잡는다.
      주간 보스: 전투력 1500 정도인 사람 4명이 일주일 내내(하루 3번) 공격하거나, 10명이 절반쯤 공격해야 쓰러진다. */
   const BOSS={d:{nm:"오전·오후 보스",until:"반나절마다",t:3,base:25000,k:5.5,m:4.5,dz:2,hit:15,kill:{g:180,m:2},mvp:1},
   w:{nm:"주간 보스",until:"일요일 밤 12시까지",t:3,base:250000,k:12.5,m:44,dz:4,hit:22,kill:{g:400,m:5},mvp:3}};
   /* 보스 상향 전에 나온 보스(오늘 오후 보스·이번 주 주간 보스)는 예전 체력 공식을 그대로 쓴다. 공식이 바뀌면서 이미 쓰러진 보스가 되살아나지 않게 하기 위해서다. */
   const BOSS_OLD={d:{base:3000,k:6.5,m:0},w:{base:60000,k:22,m:0}},BOSS_NEW_FROM={d:"d-2026-10-19a",w:"w-2026-10-19"};
   /* 오전·오후 보스 체력(3차, 2026-10-19~10-26): 처음 공격 때 그때 기준으로 잡은 전투력의 절망의 마인 체력 × D_HP_X(2배).
      마인 체력 = (300 + 전투력 × 12) × WITCH_HP(3). 정해진 체력은 첫 공격 기록(hp0)에 남아서, 그 보스가 끝날 때까지 모두에게 똑같이 쓰인다. */
   const D_HP_X=2;
   /* 보스 체력(2026-10-27 오전 보스, 2026-10-26 주간 보스부터): 처음 공격 때 전투력 1위의 전투력으로 마인 체력을 구하고 D_HP_X배. 최소 min.
      1위는 공개 카드 한 명만 읽는다. 이미 hp0가 적힌 보스는 그 숫자를 유지한다. */
   const BOSS_SCALE={d:{x:3.75,min:600,win:864e5},w:{x:21,min:6000,win:6048e5}},BOSS_SCALE_FROM={d:"d-2026-10-27a",w:"w-2026-10-26"};
   /* 보스 패턴과 대응: 보스는 BP_MS(20분)마다 행동을 바꾼다. 행동은 시각으로 정해져 모두에게 똑같이 보인다.
      공격할 때 대응 세 가지 중 하나를 고른다. 패턴에 맞는 대응을 고르면 피해가 커지고, 틀리면 손해를 본다.
      · 💢 분노의 돌진: 🛡 방어 태세가 정답(반격을 막고 되받아친다). ⚔ 강타로 덤비면 반격을 맞아 절망도가 3 더 오른다.
      · 💤 지친 숨 고르기: ⚔ 강타가 정답(빈틈에 힘껏, 피해 ×1.3).
      · 🌀 마력 결집: ✦ 약점 노리기가 정답(피해 ×1.8). 약점 노리기는 다른 때 쓰면 피해가 반으로 준다.
      🛡 방어 태세는 언제 써도 공격 때 절망도가 오르지 않는다(돌진 때가 아니면 피해 ×0.7). 숫자만 고치면 바뀐다. */
   const BP_MS=20*60000,BP=[
   {id:"charge",ic:"💢",nm:"분노의 돌진",ds:"눈이 붉게 타오른다. 섣불리 덤비면 반격당한다. 몸을 지켜야 한다.",w:40,best:"def"},
   {id:"rest",ic:"💤",nm:"지친 숨 고르기",ds:"거친 숨을 몰아쉰다. 빈틈투성이다. 힘껏 내려칠 때!",w:35,best:"str"},
   {id:"focus",ic:"🌀",nm:"마력 결집",ds:"마력이 몸 한 점으로 모여든다. 그곳이 바로 약점이다.",w:25,best:"weak"}];
   const BA={str:{ic:"⚔",nm:"강타"},def:{ic:"🛡",nm:"방어 태세"},weak:{ic:"✦",nm:"약점 노리기"}};
   const bpT={};
   const RECOVER_DZ=30,HIT_CD=120000,SELF_CD=300000,RAID_DZ=2;


   /* 절망의 마인: WITCH_WIN(7일) 안에 WITCH_N(3)번째로 타락하면 평범한 마수가 아니라 '절망의 마인'이 된다.
      ① 체력이 WITCH_HP배이고, 친구가 아니어도 모든 마법소녀가 맞설 수 있다. 강림하면 모두에게 알림이 간다.
      ② 마인이 살아 있는 동안 마인이 태어난 마을에 '마인의 저주'가 내려 그 마을 주민의 자연 회복이 절반이 된다.
      ③ 마인에게 맞서면 절망도가 WITCH_DZ 오른다(일반 타락보다 위험). 대신 공격마다 골드 WITCH_HIT, 마지막 일격은 WITCH_LAST,
         쓰러지면 한 번이라도 맞선 모두가 WITCH_ALL 보상을 받는다.
      ④ 마인이 된 사람은 골드를 FALL_GOLD의 두 배로 잃고, 돌아온 뒤 후유증이 WITCH_SCAR 동안 이어진다. 숫자만 고치면 바뀐다. */
   const WITCH_N=3,WITCH_WIN=7*86400000,WITCH_HP=3,WITCH_DZ=4,WITCH_HIT=15,WITCH_LAST={g:100,m:2},WITCH_ALL={g:60,m:1},WITCH_SCAR=3*3600000;
   /* 타락의 대가: ① 지금 쌓인 경험치를 모두 잃고 레벨이 하나 떨어진다(레벨 1 아래로는 안 떨어진다). ② 가진 골드의 FALL_GOLD만큼을 잃는다.
      ③ 타락한 동안에는 경험치를 얻지 못한다. ④ 되돌아온 뒤에도 SCAR_MS 동안 '타락의 후유증'으로 얻는 경험치가 절반이 된다. 숫자만 고치면 바뀐다. */
   const FALL_GOLD=.1,SCAR_MS=3600000;


   /* 마수 포탈: 매시간 무작위 시각에 마을 한 곳에 포탈이 열린다. 언제 어디에 열릴지는 시각으로 계산해서 모두에게 같다.
      열린 뒤 10분 안에 정해진 인원(새벽 약 10명, 그 밖 약 30명)이 모이면 토벌 성공. 모자라면 모자란 비율만큼 마을 주민이 다친다(최대 P_HURT명).
      다친 주민은 그 뒤 1시간 동안 누구나 치유할 수 있다. 치유는 '치유 시작'을 누르고 1분 뒤 '치유 완료'를 누르면 된다.
      치유계(빛·물 속성 또는 '치유의 손길' 특성)는 한 번에 6명, 그 밖에는 3명을 치유한다. 한 포탈에서 한 사람이 최대 3번.
      서버 기록: portal/{포탈}/j/{나} 참가(한 번만), portal/{포탈}/h/{나} 치유 기록. 숫자만 고치면 바뀐다. */
   const PS=3600000,PGATHER=600000,PHEAL=3600000,PHEAL_WAIT=60000,PHEAL_MAX=3;
   const PNAMES=["하늘의 균열","검은 안개 포탈","핏빛 문","울부짖는 틈","잿빛 소용돌이","뒤틀린 별의 문"];
   // 필요 인원: 새벽(한국 시각 0시~6시)에 열린 포탈은 9~11명, 그 밖의 시간은 27~33명. 숫자만 고치면 바뀐다.
   const P_DAWN=[9,11],P_DAY=[27,33],P_HURT=30;


   /* 마을 경쟁: 일주일(월요일 0시 시작) 동안 마을 사람들의 점수를 합쳐 순위를 겨룬다. 한 사람의 주간 점수는 최대 1000.
      점수: 정기 출정 성공 10(위험도에 따라 8~14), 실패 2 · 보스 공격 3 · 마수 포탈 성공 30, 실패 5 · 치유 10 · 일일 의뢰 모두 완료 15 · 타락한 친구 되돌리기 20.
      지난주 1등 마을에서 점수를 낸 사람은 우승 보상을 받는다. 서버 기록: guard/{주}/{마을}/{나} */
   const GUARD_WIN={g:150,m:2};
   const NTC_KEEP=30;


   /* 튜토리얼: 처음 하는 사람을 위한 단계별 안내. 해낸 단계는 자동으로 체크되고 보상을 받을 수 있다. 모두 받으면 완료 보상과 칭호 '새내기 졸업'.
      C.tut = {got:{단계:1}, done:완료 보상 받음, hide:칸 숨김}. 단계: [id, 제목, 하는 법, 해냈는지, 보상, 바로 가기]. 숫자만 고치면 바뀐다. */
   const TUT=[
   ["pf","프로필 꾸미기","마을 화면의 '프로필 편집'에서 사진이나 외관·성격 같은 캐릭터 설정을 적어 보자. 다른 사람이 내 프로필을 눌렀을 때 보인다.",c=>!!c.img||Object.values(c.pf||{}).some(v=>String(v||"").trim()),{g:20},()=>{hub();$("#b-edit").click()}],
   ["wp","무기 사서 장착하기","상점에서 무기를 하나 사면 바로 장착된다. 무기마다 특징이 다르고, 전투력이 오르면 출정 판정이 쉬워진다.",c=>c.wp>=0,{g:30},()=>shop()],
   ["mr","정기 출정 다녀오기","마을 오른쪽 '정기 출정'에서 마음에 드는 출정에 참가하자. 5분마다 열리고, 출발 시각에 자동으로 떠난다. 전투는 대성공·성공·실패·대실패로 판정된다.",c=>((c.stats||{}).huntsWon||0)+((c.stats||{}).huntsLost||0)>=1,{m:1},()=>hub()],
   ["dq","일일 의뢰 보상 받기","'오늘의 의뢰'를 끝내고 '받기'를 누르자. 매일 밤 12시에 새 의뢰 3개가 나온다.",c=>!!(c.dq&&c.dq.l&&c.dq.l.some(q=>q.c))||((c.stats||{}).dqAll||0)>0,{g:20},()=>hub()],
   ["fr","친구 만들기","채팅이나 친구 화면에서 다른 사람의 프로필을 열고 '친구 추가'를 누르자. 상대가 수락하면 친구가 된다.",c=>Object.keys(c.fr||{}).length>=1,{g:20},()=>friends()],
   ["rs","공명하기","친구의 프로필에서 '공명하기'로 공명을 청하고, 친구가 받아들이면 서로의 절망도가 내려간다. 같은 친구에게는 3시간에 한 번.",c=>((c.stats||{}).resonances||0)>=1,{g:20},()=>friends()],
   ["bs","보스 레이드 공격하기","모두 함께 같은 보스와 싸운다. 공격할 때마다 골드를 받고, 쓰러뜨리면 참가한 모두가 보상을 받는다.",c=>((c.stats||{}).bossHits||0)>=1,{g:20},()=>bossView()],
   ["up","무기 강화해 보기","상점에서 마력석을 사서 마법·가방 화면에서 무기를 강화하자. 실패해도 단계는 떨어지지 않는다.",c=>((c.stats||{}).upgrades||0)+((c.stats||{}).upgradeFails||0)>=1,{m:1},()=>bag()],
   ["pt","마수 포탈 돕기","한 시간에 한 번 예고 없이 열리는 포탈에 출동하거나, 다친 주민을 치유하자. 열리면 화면 위에 알림이 뜬다.",c=>Object.keys(c.pj||{}).length>0||((c.stats||{}).heals||0)>0,{g:30},()=>portalView()]];
   const TUT_DONE={g:100,m:2};


   /* 마을 시설. A·B·C·D 마을은 VL 에 있다. 시설 고유 키와 표시 이름(title)은 따로 둔다.
      키는 저장 경로에, 이름은 화면과 vfac 기록의 t 칸에 쓴다.
      마을 전체 기여와 단계는 vfac/{마을}/{키} 에, 사람별 기여는 vfactop/{마을}/{키}/{사람} 에 둔다. */
   const FAC_KEY={spring:"치유의 샘",forge:"대장간",drill:"훈련장",tower:"감시탑",market:"시장",chapel:"성당",library:"서고",workshop:"공방"};
   /* [키, 이름, 설명, 단계당 효과 문구]. 단계 기준(누적 점수)과 효과 크기는 숫자만 고치면 바뀐다. */
   const FAC=[["spring",FAC_KEY.spring,"마을 한가운데 맑은 샘이 솟는다.",l=>"10분마다 자연 회복 +"+l],
   ["forge",FAC_KEY.forge,"마력을 다루는 대장장이가 머문다.",l=>"무기 강화 성공 확률 +"+2*l+"%p"],
   ["drill",FAC_KEY.drill,"마수와의 싸움을 대비하는 훈련장.",l=>"출정 경험치 +"+3*l+"%"],
   ["tower",FAC_KEY.tower,"마수의 움직임을 먼저 읽는 높은 탑.",l=>"출정 전투 판정 +"+l+" (파티 중 가장 높은 감시탑 적용)"],
   ["market",FAC_KEY.market,"떠돌이 상인들이 모여드는 장터.",l=>"상점 가격 "+2*l+"% 할인"],
   ["chapel",FAC_KEY.chapel,"부서진 스테인드글라스 아래 기도하는 곳.",l=>"공명할 때 내 절망도 추가 -"+l],
   ["library",FAC_KEY.library,"여왕의 옛 기록이 잠든 서고.",l=>"재계약 시험 판정 +"+l],
   ["workshop",FAC_KEY.workshop,"마력석을 다듬는 장인들의 공방.",l=>"출정 골드 +"+5*l+"%"]];


   /* 시설 이용: 1단계 이상 지어진 시설은 하루에 한 번씩 이용할 수 있다(매일 밤 12시 초기화). [설명, 실행]. 숫자만 고치면 바뀐다. */
   const FAC_USE={
   spring:[l=>"샘물 마시기: 절망도 -"+(4+2*l),l=>{const b=C.dz;gain(0,-(4+2*l));return "맑은 샘물을 마셨다. 절망도가 "+(b-C.dz)+" 내려갔다."}],
   forge:[l=>"무기 손질: 오늘 하루 무기 전투력 +"+3*l,l=>{C.wtmp={day:today(),v:3*l};return "대장장이가 무기를 손봐 주었다. 오늘 하루 무기 전투력 +"+3*l+"."}],
   drill:[l=>"훈련: 경험치 +"+(10+5*l),l=>{gain(10+5*l,0);return "땀 흘려 훈련했다. 경험치 +"+(10+5*l)+"."}],
   tower:[l=>"정찰: 골드 +"+(20+15*l),l=>{C.gd=(C.gd||0)+20+15*l;return "감시탑에서 정찰을 돕고 골드 "+(20+15*l)+"을(를) 받았다."}],
   market:[l=>"특가 상품: "+(l>=3?"별빛 쿠키":"작은 꽃다발")+" 1개",l=>{const id=l>=3?"g2":"g1";C.inv=C.inv||{};C.inv[id]=(C.inv[id]||0)+1;dexAdd("it",id);return "시장의 특가 상품으로 "+ITM.find(x=>x[0]===id)[1]+" 1개를 얻었다."}],
   chapel:[l=>"기도: 다음 공명 효과 증가",()=>{C.rsb=1;return "조용히 기도했다. 다음 공명의 효과가 커진다."}],
   library:[l=>"기록 열람: 다음 재계약 시험 판정 +"+(2+l),l=>{C.tcb=Math.max(C.tcb||0,2+l);return "여왕의 옛 기록을 읽었다. 다음 재계약 시험 판정 +"+(2+l)+"."}],
   workshop:[l=>"부적 받기: 결계 부적 1개",()=>{C.inv=C.inv||{};C.inv.charm=(C.inv.charm||0)+1;dexAdd("it","charm");return "공방에서 결계 부적 1개를 받았다."}]};
   const FAC_LV=[300,800,1600,3000,5000],FAC_STONE=40,FAC_TOTAL=1000;


   /* 희망의 등대: A·B·C·D 네 마을이 함께 짓는 하나뿐인 공동 시설. 효과는 마을과 상관없이 모든 마법소녀에게 적용된다.
      동시 접속자 80명 기준: 1단계는 접속자 한 명당 골드 약 250(하루 안팎), 5단계 완공은 한 명당 약 3,750점(2~3주)이 필요하다.
      '힘을 합쳐야' 하므로, 단계가 오르려면 전체 기여가 기준을 넘는 것과 함께 네 마을 각각이 그 기준의 WF_SHARE(12%) 이상을 보태야 한다.
      (네 마을이 똑같이 나누면 25%씩이니, 한 마을이 그 절반에도 못 미치면 다른 마을이 아무리 모아도 멈춘다.)
      기여는 각자의 플레이어 기록(players/{나}.wf)에 저장하고 모두의 기록을 합쳐 계산한다(서버 규칙 추가 불필요). 숫자만 고치면 바뀐다. */
   const WF_LV=[20000,50000,100000,180000,300000],WF_SHARE=.12,WF_STONE=50,WF_EXP=.05,WF_GOLD=.05,WF_CALM=.05,WF_PW=10,WF_LIGHT={dz:15,m:1};
   const WF_EFF=["출정 경험치 +"+WF_EXP*100+"%","출정 골드 +"+WF_GOLD*100+"%","오르는 절망도 -"+WF_CALM*100+"%","하루 한 번 '등대의 빛': 절망도 -"+WF_LIGHT.dz+", 마력석 +"+WF_LIGHT.m,"전투력 +"+WF_PW];


   /* 대련장: 무기·레벨·등급·특성·각인은 모두 무시하고, 두 사람이 체력 100·마력 2로 똑같이 시작해 겨루는 1:1 대련.
      다른 것은 오직 '속성 비기'(첫 번째 속성)와 수 읽기뿐이다. 매 판 두 사람이 동시에 행동을 고른다.
      · ⚔ 공격: 상대의 ✦ 마법을 끊는다(마법 쓴 쪽 -22). 공격끼리는 둘 다 -15. ◎ 집중한 상대에게 -15.
      · 🛡 방어: ⚔ 공격을 막고 반격한다(공격한 쪽 -8). 하지만 ✦ 마법에는 뚫린다(-25).
      · ✦ 마법(마력 2): 방어·집중한 상대에게 -25. 마법끼리는 둘 다 -25. 공격에 끊기면 마력만 잃는다.
      · ◎ 집중: 마력 +2(최대 5).
      · ★ 비기(마력 4, 한 대련에 한 번): 속성마다 다른 필살기. 막을 수 없지만, 쓰는 동안은 무방비다.
      10판이 지나면 체력이 많은 쪽이 이긴다. 상대의 선택은 '봉인(암호)'된 채로 먼저 올라가고, 둘 다 고른 뒤에야 열리므로 몰래 볼 수 없다.
      서버 기록: rooms/xa{받는 사람}/{보낸 사람} 대련 신청, rooms/xb{대련}/{나} 내 수 기록(서버 규칙 추가 불필요). 숫자만 고치면 바뀐다. */
   const DU_HP=100,DU_MP0=2,DU_MPMAX=5,DU_MAG=2,DU_FOC=2,DU_SP=4,DU_ROUNDS=10,DU_INV=120000,DU_IDLE=90000,DU_RW={w:20,l:8},DU_DAY=5;
   const DU_ACT={atk:["공격","⚔"],def:["방어","🛡"],mag:["마법","✦"],foc:["집중","◎"],sp:["비기","★"]};
   // DU_TAKE[내 행동][상대 행동] = 내가 받는 피해
   const DU_TAKE={atk:{atk:15,def:8,mag:0,foc:0},def:{atk:0,def:0,mag:25,foc:0},mag:{atk:22,def:0,mag:25,foc:0},foc:{atk:15,def:0,mag:25,foc:0}};
   // 속성 비기: d 상대 피해, h 내 회복, ev 이번 판 상대 공격을 피함, gd 이번 판 받는 피해 0, dr 상대 마력을 0으로
   const DU_SPS={"불":["업화",{d:22},"상대에게 22 피해"],"물":["치유의 물결",{h:20},"체력 20 회복"],"바람":["질풍",{d:14,ev:1},"상대에게 14 피해, 이번 판 상대의 공격·마법을 피한다(비기는 피할 수 없다)"],
   "땅":["대지의 벽",{gd:1},"이번 판 받는 모든 피해 0(상대의 비기까지 막는다). 대신 상대에게 피해를 주지 못한다"],"빛":["심판의 빛",{d:14,h:6},"상대에게 14 피해, 체력 6 회복"],"어둠":["저주",{d:18,dr:1},"상대에게 18 피해, 상대의 마력을 0으로"]};
   const DU_BUSY=1800000;


   /* 대련 이벤트: DEV.t0 ~ DEV.t1 동안 대련 결과로 점수를 모아 순위를 겨룬다. 승리 3점 · 무승부 2점 · 패배 1점.
      같은 상대와의 대련은 하루에 DEV.PAIR번까지만 점수가 된다(친한 사람끼리 점수를 몰아주는 것을 막는다).
      끝나고 DEV.GRACE(1시간)가 지나면 순위가 확정되고, 각자 접속할 때 순위 보상을 한 번 받는다. 숫자만 고치면 바뀐다.
      새 이벤트를 열려면 id·기간·보상만 바꾸면 된다(id가 바뀌면 점수는 0부터 다시 센다). */
   const DEV={id:"duel-ev-20261020",nm:"대련 이벤트",t0:Date.parse("2026-10-18T16:00:00+09:00"),t1:Date.parse("2026-10-21T00:00:00+09:00"),PAIR:2,GRACE:3600000,
   PT:{w:3,d:2,l:1},RW:[{g:1500,m:15},{g:1000,m:10},{g:700,m:7},{g:500,m:5},{g:300,m:3}],JOIN:{n:3,g:100}};
   /* 대련 구인 게시판: rooms/xr/{나} = {n 이름, e 속성, g 등급, m 한마디, ts 올린 시각}. 본인만 올리고 내릴 수 있다(서버 규칙 추가 불필요).
      DUR_TTL(2시간)이 지나면 자동으로 목록에서 빠진다. 대련 중인 사람은 '대련 중'으로 표시된다. 숫자만 고치면 바뀐다. */
   const DUR_TTL=2*3600000,DUR_MSG=40;


   /* 교류 게시판: 글, 댓글, 대댓글(댓글에 다는 답글 한 단계).
      단체 채팅과 같은 저장 공간(chat)을 쓴다. 새 글 목록은 "bp_"(제목·미리보기·댓글 수), 본문은 "bb_", 그 글의 댓글은 "bc_글_" 이다.
      목록을 열 때는 bp_ 만 받고, 글을 열 때 본문과 그 글의 댓글을 받는다. 예전 글·댓글은 "b_"에 섞여 있다.
      그 공간은 서버가 '본인 이름으로 새로 쓰기'만 허락하므로 남의 글을 고치거나 지울 수 없다. 삭제는 '지움 표시'를 남기는 방식이고, 글쓴이 본인과 운영자의 지움 표시만 인정한다.
      글 {bt:"p", ti:제목, pv:미리보기, cc:댓글 수}, 본문 {bt:"body", x:내용}, 댓글 {bt:"c", p:글, r:부모 댓글 또는 ""}, 지움 {bt:"d", ref:대상}. 숫자만 고치면 바뀐다. */
   const BD_MAX=800,BD_TITLE=40,BD_BODY=1000,BD_CMT=300,BD_GAP=8000;
   /* 게시글 사진: 사진은 글과 따로 chat/bimg_{글} 에 저장한다. 게시판 목록을 불러올 때는 사진을 받지 않고,
      글을 열었을 때만 그 글의 사진 하나를 받아서 데이터 사용량을 아낀다. 사진은 긴 변 BDI_MAX픽셀 JPEG로 줄인다(최대 약 BDI_KB KB). */
   const BDI_MAX=720,BDI_KB=180;


   /* 접속 시각: 페이지를 열 때 내 명부(who)에 시각(on)만 남긴다. 접속 인원 수는 세지 않고, 그 목록도 받지 않는다.
      ON_WIN 은 대련·등록자에서 최근 접속으로 볼 기준이다. 보스 체력은 전투력 1위 한 명을 읽는다. */
   const ON_WIN=150000;
   /* 자연재해: 하루를 6시간씩 넷(한국 시각 0·6·12·18시)으로 나누고, 구간마다 DIS_P 확률로 한 마을에 재해가 닥친다.
      언제 어디에 무엇이 오는지는 시각으로 계산해서 모두에게 같다.
      제압되지 않은 동안만 그 마을 주민에게 효과가 있고, 길어도 그 구간이 끝날 때(최대 6시간)까지다.
      제압되면 그 즉시 효과가 끝나고 시설은 바로 다시 쓸 수 있다.
      누구든(다른 마을 주민도) '재해 대응'으로 진압 점수를 보탤 수 있다.
      재해마다 맞서기 좋은 속성이 있어서, 그 속성을 가진 사람은 대응 점수를 두 배로 보탠다.
      기여는 각자의 기록에 남기고, 진압 진행도는 tally/dr/{재해} 합계만 읽는다. score 전체를 받지 않는다.
      [키, 이름, 아이콘, 맞서기 좋은 속성, 효과 설명]. 숫자만 고치면 바뀐다. */
   const DIS=[["fire","산불","🔥","물","상점 가격 +20%"],["flood","홍수","🌊","땅","자연 회복량 절반"],["storm","폭풍","🌪","바람","출정 경험치 -20%"],
   ["quake","지진","⛰","빛","마을 시설 효과와 이용이 멈춘다"],["frost","혹한","❄","불","공명 효과 절반"],["eclipse","일식","🌑","어둠","출정 골드 -30%"]];
   const DIS_MS=6*3600000,DIS_P=.6,DIS_GOAL=12,DIS_CD=20*60000,DIS_HIT={g:20},DIS_WIN={g:60,m:1};


   // 자연 회복량: 치유의 샘 단계만큼 늘고, 홍수가 덮친 동안에는 절반.

   /* 마력 각인: 마력석을 써서 내 몸에 영구적인 각인을 새긴다. 무기 강화와 달리 실패가 없고, 무기를 바꿔도 사라지지 않는다.
      [키, 이름, 아이콘, 단계별 효과 문구]. 단계당 효과 크기는 pw(), gain(), 출정 골드 계산에 있는 rnLv(...) 앞 숫자를 고치면 바뀐다.
      새기는 비용은 rnCost(지금 단계)개의 마력석(2, 3, 4, 5, 6 → 각인 하나를 끝까지 새기는 데 20개). */
   const RN=[["pow","힘의 각인","⚔",l=>"전투력 +"+4*l],["calm","평온의 각인","🕊",l=>"오르는 절망도 -"+4*l+"%"],["wis","지혜의 각인","📖",l=>"얻는 경험치 +"+4*l+"%"],["luck","풍요의 각인","💰",l=>"출정 골드 +"+5*l+"%"]];
   const RN_MAX=5;


   /* 운명의 재계약: 아주 어려운 조건을 모두 채우면, 계약을 다시 맺어 특성을 '무작위로' 바꿀 수 있다.
      지금 특성을 뺀 모든 특성 중 하나가 같은 확률로 나온다(좋지 않은 특성이 나올 수도 있다). 되돌릴 수 없다.
      조건: 고독한 출정 성공 RT_SOLO회 이상, 토벌 성공 RT_CL회 이상, 마력석 RT_MANA개, 골드 RT_GOLD, 절망도 RT_DZMAX 이하, 지난 재계약에서 RT_CD(7일) 경과, 타락하지 않음.
      대가: 의식이 끝나면 절망도가 RT_DZ 오른다. 숫자만 고치면 바뀐다. */
   const RT_SOLO=5,RT_CL=100,RT_MANA=15,RT_GOLD=2000,RT_DZMAX=30,RT_DZ=40,RT_CD=7*86400000;


   /* 몬스터 웨이브: 매일 정해진 시각(한국 시각 WV_HOURS)에 30분 동안 열리는 공동 방어전.
      마수 무리가 1웨이브부터 10웨이브까지 차례로 몰려오고, 모두가 넣은 피해를 합쳐 앞 웨이브부터 차례로 쓰러뜨린다. 웨이브마다 HP가 WV_GROW배씩 커진다.
      30초에 한 번 공격할 수 있고, 공격할 때마다 골드를 조금 받는다. 30분이 끝나면 막아 낸 웨이브 수만큼 참가자 모두가 보상을 받는다.
      피해 기록은 보스 레이드와 같은 저장 공간(wboss/{웨이브}/{나})에 각자 자기 몫만 남긴다(서버 규칙 추가 불필요).
      평균 전투력 500 기준: 다섯 명이 꾸준히 싸우면 7~8웨이브, 열 명이면 10웨이브까지 노려 볼 만하다. 숫자만 고치면 바뀐다. */
   const WV_HOURS=[13,21],WV_LEN=30*60000,WV_N=10,WV_HP=4000,WV_GROW=1.3,WV_CD=30000,WV_HIT=8;


   /* 웨이브 상향: 1웨이브 HP = 첫 공격 때 접속 중인 가장 강한 마법소녀의 전투력 × WV_K (최소 WV_HP). 정해진 값은 첫 공격 기록(b0)에 남아 그 웨이브가 끝날 때까지 모두에게 같다.
      전투력 9500인 사람이 30분 내내 혼자 싸우면 5웨이브 안팎, 10웨이브를 모두 막으려면 그런 사람 3~4명이 30분 내내 힘을 모아야 한다.
      (첫 공격이 이 방식 전 파일에서 들어온 웨이브는 예전 값 WV_HP를 그대로 쓴다.) 보상: 막은 웨이브당 골드 WV_RW.g·경험치 WV_RW.ex, WV_RW.mEvery웨이브마다 마력석 1, 피해 1위 마력석 WV_RW.mvp. */
   const WV_K=8,WV_RW={g:30,ex:15,mEvery:2,mvp:3};
   const WV_NAMES=["굶주린 그림자 떼","썩은 송곳니 무리","울부짖는 박쥐 떼","가시 덩굴 마수","돌가죽 멧돼지 떼","핏빛 늑대 무리","잿빛 거미 군단","뒤틀린 기사단","날개 달린 악몽","웨이브의 군주"];


   /* 재계약 시험: 시험장에 들어가기만 해서는 아무것도 쓰지 않는다. '나아간다'를 처음 누르는 순간 시험이 시작되고,
      그때부터 24시간 대기 시간이 돌아가며 준비한 계약의 촛불과 여왕의 표식도 그때 쓰인다. 시작 전에 나가면 손해가 없다. */
   /* 재계약 시험 난이도: 층마다 목표 = 31 + 22×등급 + 4×층 (+ 마지막 층 12). 실패는 TRIAL_LIVES번까지 허용하고, 그보다 더 밀려나면 탈락한다.
      요구 레벨에 갓 도달한 캐릭터의 합격률은 약 50%, 레벨을 더 올리거나 촛불·대지의 가호 등으로 준비하면 크게 오른다. 숫자만 고치면 바뀐다. */
   const TRIAL_LIVES=2;
