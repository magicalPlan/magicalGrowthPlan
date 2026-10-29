/* 채팅. main.js 다음에 불러야 한다. 단체 채팅, 마을 채팅, 1:1 대화, 운영자 열람, 새 메시지 알림.
   마을 탭은 chat 을, 프로필과 친구 목록은 goDM 과 openDM 을, 알림함은 goDM 을 그대로 부른다. */
let admT={},admK=null;
function admUI(){const b=document.querySelector("#ct [data-t=a]");const on=!!ADM[UID];if(b)b.hidden=!on;const bar=$("#ct");if(bar)bar.hidden=!on;try{drawNotice()}catch(e){}try{drawDoom()}catch(e){}}
let admGen=0;
async function watchAdm(){if(!ADM[UID])return;const gen=++admGen;const box=$("#al");if(box&&!Object.keys(admT).length)box.innerHTML="<p class='hint'>최근 대화를 불러오는 중...</p>";
 try{const s=await apiAdmOnce();if(gen!==admGen||$("#v-chat").hidden||ct!=="a")return;const th={};s.docs.forEach(d=>{const m=d.data();if(m&&m.k)(th[m.k]=th[m.k]||[]).push(m)});Object.values(th).forEach(a=>a.sort((x,y)=>x.ts-y.ts));admT=th;drawAdm()}
 catch(e){if(gen===admGen)cmsg("대화 목록을 불러오지 못했다. 운영자 등록과 데이터베이스 규칙을 확인해야 한다.")}}
function admLabel(k){const nm={};(admT[k]||[]).forEach(m=>nm[m.u]=m.n);return Object.keys(nm).map(u=>cn(u,nm[u])).join(" ↔ ")}
function drawAdm(){const l=$("#al");l.innerHTML="";const ks=Object.keys(admT).sort((a,b)=>{const x=admT[a],y=admT[b];return y[y.length-1].ts-x[x.length-1].ts});
 if(!ks.length){l.innerHTML="<p class='hint'>아직 1:1 대화가 없다.</p>"}
 ks.forEach(k=>{const b=document.createElement("button");b.type="button";b.className="chip";b.style.cssText="display:flex;justify-content:space-between;text-align:left";b.setAttribute("aria-pressed",admK===k?"true":"false");
  b.innerHTML="<span></span><strong></strong>";b.firstChild.textContent=admLabel(k);b.lastChild.textContent=admT[k].length+"개";b.onclick=()=>{admK=k;drawAdm()};l.appendChild(b)});
 $("#at2").hidden=!admK||!admT[admK];if(admK&&admT[admK]){$("#ah").textContent=admLabel(admK)+" (열람 전용)";paint($("#alg"),admT[admK].slice(),admK)}}
/* 채팅: 단체 채팅은 모두가 보는 공용방이고, 1:1은 두 사람이 같은 대화 키를 쓴다 */
let ct="g",peer=null,unC=null,unP=null,lastSend=0;
const cmsg=t=>{$("#cm2").style.color="var(--bad)";$("#cm2").textContent=t};
function chat(){const fresh=$("#v-chat").hidden;show("chat");admUI();$("#cm2").textContent="";if(!DB){cmsg("채팅 기능을 쓸 수 없다.");return}setT(ct,fresh)}
function sync(){$("#cin").hidden=ct==="a"||(ct==="d"&&!peer)}
/* 대화 그리기: 맨 아래를 보고 있을 때만 새 메시지를 따라 내려간다.
   위로 올려서 지난 대화를 읽는 중이면 그 자리를 지키고, 대신 '새 메시지 ↓' 버튼을 띄운다. th는 대화방 구분용이다. */
function newBtn(el,on){let b=document.getElementById(el.id+"-nb");
 if(!b){b=elT("button","newmsg","새 메시지 ↓");b.type="button";b.id=el.id+"-nb";b.hidden=true;b.onclick=()=>{pinLog(el,el.scrollHeight);b.hidden=true};el.after(b);
  el.addEventListener("scroll",()=>{if(el.scrollHeight-el.scrollTop-el.clientHeight<40)b.hidden=true})}
 b.hidden=!on}
async function dmPng(el,title){const ms=(el&&el._ms||[]).slice().sort((a,b)=>(Number(a.ts)||0)-(Number(b.ts)||0));if(!ms.length)return toast("저장할 대화가 없다.");
 try{
  const font=await dmFontOpen();
  const two=n=>String(n).padStart(2,"0"),dt=t=>{const d=new Date(Number(t)||0);return d.getFullYear()+"."+two(d.getMonth()+1)+"."+two(d.getDate())+" "+two(d.getHours())+":"+two(d.getMinutes())};
  const stamp=(()=>{const d=new Date();return d.getFullYear()+two(d.getMonth()+1)+two(d.getDate())+"_"+two(d.getHours())+two(d.getMinutes())})(),safe=String(title||"대화").replace(/와의 1:1 대화| \(열람 전용\)/g,"").replace(/[\\/:*?"<>|\s]+/g,"_").slice(0,40);
  const raw=["마법 성장기록 · 1:1 대화",String(title||"1:1 대화"),"저장 "+dt(Date.now()),""];
  ms.forEach(m=>{const nm=String(cn(m.u,m.n)||"").replace(/👑/g,"").trim()||"이름 없음",who=nm+(m.u===UID?" (나)":""),body=String(m.x==null?"":m.x).replace(/\r\n/g,"\n").replace(/\r/g,"\n");raw.push("["+who+"]: "+body+" ("+dt(m.ts)+")")});
  const need=new Set([63]);for(const ch of raw.join("\n")){const cp=ch.codePointAt(0);if(font.cmap.has(cp))need.add(cp)}
  const sub=ttfSubset(font,need),FS=11,maxW=595.28-96,measure=s=>{let w=0;for(const ch of s){const g=sub.gid.get(ch.codePointAt(0))||0;w+=(sub.adv[g]||0)*FS/sub.upem}return w};
  const fit=s=>{let o="";for(const ch of s)o+=sub.gid.has(ch.codePointAt(0))?ch:"?";return o};
  const lines=[];raw.forEach(row=>String(row).split("\n").forEach(par=>{const t=fit(par);if(!t){lines.push("");return}let line="";for(const ch of t){if(line&&measure(line+ch)>maxW){lines.push(line);line=ch}else line+=ch}lines.push(line)}));
  const made=pdfMake(lines,sub),a=document.createElement("a"),u=URL.createObjectURL(made.blob);a.href=u;a.download="1대1_"+safe+"_"+stamp+".pdf";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);
  toast("대화를 PDF로 저장했다"+(made.pages>1?" ("+made.pages+"쪽).":"."))
 }catch(e){toast("PDF를 만들지 못했다.")}}
let dmFontP=null;
function dmFontOpen(){if(!dmFontP)dmFontP=fetch("fonts/PretendardVariable.ttf").then(r=>{if(!r.ok)throw new Error("font");return r.arrayBuffer()}).then(ttfOpen).catch(e=>{dmFontP=null;throw e});return dmFontP}
/* 1:1 PDF: 화면을 그림으로 넣지 않고, [이름]: 내용 (시간) 글만 넣는다.
   fonts/PretendardVariable.ttf 에서 이 대화에 나온 글자만 골라 기본 굵기 윤곽을 심는다. */
function ttfOpen(buf){const src=buf instanceof Uint8Array?buf:new Uint8Array(buf),bytes=new Uint8Array(src.byteLength);bytes.set(src);const view=new DataView(bytes.buffer),n=view.getUint16(4),tables={};
 for(let i=0;i<n;i++){const o=12+i*16;let tag="";for(let k=0;k<4;k++)tag+=String.fromCharCode(bytes[o+k]);tables[tag]={off:view.getUint32(o+8),len:view.getUint32(o+12)}}
 ["cmap","glyf","head","hhea","hmtx","loca","maxp","name","OS/2","post"].forEach(t=>{if(!tables[t])throw new Error(t)});
 const head=tables.head.off,hhea=tables.hhea.off,numGlyphs=view.getUint16(tables.maxp.off+4),indexToLoc=view.getInt16(head+50),loca=[],locaOff=tables.loca.off;
 if(indexToLoc===0){for(let i=0;i<=numGlyphs;i++)loca.push(view.getUint16(locaOff+i*2)*2)}else{for(let i=0;i<=numGlyphs;i++)loca.push(view.getUint32(locaOff+i*4))}
 const os2=tables["OS/2"].off,post=tables.post.off;
 return {bytes,view,tables,cmap:ttfReadCmap(view,tables.cmap.off),upem:view.getUint16(head+18),bbox:[view.getInt16(head+36),view.getInt16(head+38),view.getInt16(head+40),view.getInt16(head+42)],ascent:view.getInt16(hhea+4),descent:view.getInt16(hhea+6),cap:view.getUint16(os2)>=2?view.getInt16(os2+88):view.getInt16(hhea+4),nH:view.getUint16(hhea+34),numGlyphs,loca,ulPos:view.getInt16(post+8),ulTh:view.getInt16(post+10)}}
function ttfReadCmap(view,off){const n=view.getUint16(off+2);let best=-1,score=-1;
 for(let i=0;i<n;i++){const p=off+4+i*8,plat=view.getUint16(p),o=off+view.getUint32(p+4),fmt=view.getUint16(o),s=(fmt===12?3:fmt===4?2:0)+(plat===3||plat===0?1:0);if(s>score){score=s;best=o}}
 if(best<0)throw new Error("cmap");
 const map=new Map(),fmt=view.getUint16(best);
 if(fmt===12){const ng=view.getUint32(best+12);for(let i=0;i<ng;i++){const p=best+16+i*12,start=view.getUint32(p),end=view.getUint32(p+4),gid=view.getUint32(p+8);for(let c=start;c<=end;c++)map.set(c,gid+(c-start))}}
 else if(fmt===4){const segX=view.getUint16(best+6),seg=segX/2,endP=best+14,startP=endP+segX+2,deltaP=startP+segX,offP=deltaP+segX;
  for(let i=0;i<seg;i++){const end=view.getUint16(endP+i*2),start=view.getUint16(startP+i*2),delta=view.getInt16(deltaP+i*2),ro=view.getUint16(offP+i*2);if(start===0xFFFF)continue;
   for(let c=start;c<=end;c++){let gid;if(ro===0)gid=(c+delta)&0xFFFF;else{const pos=offP+i*2+ro+(c-start)*2;gid=view.getUint16(pos)}if(gid)map.set(c,gid)}}}
 if(!map.size)throw new Error("cmap");return map}
function ttfComponents(view,start,end){const ids=[];if(end-start<10||view.getInt16(start)>=0)return ids;let p=start+10;
 while(p+4<=end){const flags=view.getUint16(p);ids.push(view.getUint16(p+2));p+=4;p+=(flags&1)?4:2;if(flags&8)p+=2;else if(flags&64)p+=4;else if(flags&128)p+=8;if(!(flags&32))break}return ids}
function ttfRewrite(glyph,oldToNew){const g=glyph.slice();if(g.length<10)return g;const view=new DataView(g.buffer,g.byteOffset,g.byteLength);if(view.getInt16(0)>=0)return g;let p=10;
 while(p+4<=g.length){const flags=view.getUint16(p);view.setUint16(p+2,oldToNew.get(view.getUint16(p+2))||0);p+=4;p+=(flags&1)?4:2;if(flags&8)p+=2;else if(flags&64)p+=4;else if(flags&128)p+=8;if(!(flags&32))break}return g}
function ttfAdv(font,gid){const off=font.tables.hmtx.off,n=font.nH;return font.view.getUint16(off+(gid<n?gid:n-1)*4)}
function ttfLsb(font,gid){const off=font.tables.hmtx.off,n=font.nH;return gid<n?font.view.getInt16(off+gid*4+2):font.view.getInt16(off+n*4+(gid-n)*2)}
function ttfChecksum(data){const n=data.length,pad=(4-(n%4))%4,b=new Uint8Array(n+pad);b.set(data);const v=new DataView(b.buffer);let s=0;for(let i=0;i<b.length;i+=4)s=(s+v.getUint32(i))>>>0;return s}
function ttfAssemble(tables){const tags=Object.keys(tables).sort(),n=tags.length;let sr=1,es=0;while((sr<<1)<=n){sr<<=1;es++}sr*=16;const rs=n*16-sr,recs=tags.map(tag=>({tag,data:tables[tag],sum:ttfChecksum(tables[tag]),len:tables[tag].length}));
 let off=12+n*16;const at=recs.map(r=>{const o=off;off+=r.len;off=(off+3)&~3;return o});const out=new Uint8Array(off),dv=new DataView(out.buffer);
 dv.setUint32(0,0x00010000);dv.setUint16(4,n);dv.setUint16(6,sr);dv.setUint16(8,es);dv.setUint16(10,rs);
 recs.forEach((r,i)=>{const p=12+i*16;for(let k=0;k<4;k++)out[p+k]=r.tag.charCodeAt(k);dv.setUint32(p+4,r.sum);dv.setUint32(p+8,at[i]);dv.setUint32(p+12,r.len);out.set(r.data,at[i])});
 const headAt=at[recs.findIndex(r=>r.tag==="head")];let sum=0;for(let i=0;i<out.length;i+=4)sum=(sum+dv.getUint32(i))>>>0;dv.setUint32(headAt+8,(0xB1B0AFBA-sum)>>>0);return out}
function ttfCmap12(pairs){const groups=[];pairs.forEach(([cp,gid])=>{const g=groups[groups.length-1];if(g&&cp===g.end+1&&gid===g.gid+(cp-g.start))g.end=cp;else groups.push({start:cp,end:cp,gid})});
 const len=16+groups.length*12,b=new Uint8Array(len),dv=new DataView(b.buffer);dv.setUint16(0,12);dv.setUint32(4,len);dv.setUint32(12,groups.length);
 groups.forEach((g,i)=>{const o=16+i*12;dv.setUint32(o,g.start);dv.setUint32(o+4,g.end);dv.setUint32(o+8,g.gid)});return b}
function ttfCmap4(pairs){const segs=pairs.filter(([cp])=>cp<=0xFFFF).map(([cp,gid])=>({start:cp,end:cp,gid}));segs.push({start:0xFFFF,end:0xFFFF,sentinel:true});
 const seg=segs.length,segX=seg*2;let search=1,entry=0;while((search<<1)<=seg){search<<=1;entry++}search*=2;const range=segX-search,ids=[];segs.forEach(s=>{if(!s.sentinel)ids.push(s.gid)});
 const length=16+seg*8+ids.length*2;if(length>65535)return null;const b=new Uint8Array(length),dv=new DataView(b.buffer);let o=0;const u16=v=>{dv.setUint16(o,v);o+=2},i16=v=>{dv.setInt16(o,v);o+=2};
 u16(4);u16(length);u16(0);u16(segX);u16(search);u16(entry);u16(range);segs.forEach(s=>u16(s.end));u16(0);segs.forEach(s=>u16(s.start));
 segs.forEach(s=>i16(s.sentinel?1:0));const rangeAt=o;o+=seg*2;const glyphAt=o;ids.forEach(g=>u16(g));let gi=0;
 segs.forEach((s,i)=>{if(s.sentinel){dv.setUint16(rangeAt+i*2,0);return}const rel=glyphAt+gi*2-(rangeAt+i*2);gi++;dv.setUint16(rangeAt+i*2,rel)});return b}
function ttfCmapTable(pairs){const list=pairs.slice().sort((a,b)=>a[0]-b[0]),sub12=ttfCmap12(list),sub4=ttfCmap4(list),recs=[[3,10,sub12],[0,4,sub12]];if(sub4)recs.unshift([3,1,sub4]);
 const headLen=4+recs.length*8;let off=headLen;const parts=[new Uint8Array(headLen)];const dv=new DataView(parts[0].buffer);dv.setUint16(2,recs.length);
 recs.forEach((r,i)=>{dv.setUint16(4+i*8,r[0]);dv.setUint16(6+i*8,r[1]);dv.setUint32(8+i*8,off);off+=r[2].length;parts.push(r[2])});
 const out=new Uint8Array(off);let p=0;parts.forEach(x=>{out.set(x,p);p+=x.length});return out}
function ttfSubset(font,cps){const want=new Set([0]),cpList=[];cps.forEach(cp=>{const g=font.cmap.get(cp);if(g){want.add(g);cpList.push([cp,g])}});
 const glyfOff=font.tables.glyf.off,stack=[...want];
 while(stack.length){const g=stack.pop(),a=font.loca[g],b=font.loca[g+1];if(!(b>a))continue;ttfComponents(font.view,glyfOff+a,glyfOff+b).forEach(c=>{if(!want.has(c)){want.add(c);stack.push(c)}})}
 const old=[...want].sort((x,y)=>x-y),oldToNew=new Map();old.forEach((g,i)=>oldToNew.set(g,i));
 const glyphs=old.map(g=>{const a=font.loca[g],b=font.loca[g+1],raw=b>a?font.bytes.slice(glyfOff+a,glyfOff+b):new Uint8Array(0),rw=ttfRewrite(raw,oldToNew),pad=(4-(rw.length%4))%4;if(!pad)return rw;const p=new Uint8Array(rw.length+pad);p.set(rw);return p});
 let glyfLen=0;const loca=new Uint8Array((glyphs.length+1)*4),lv=new DataView(loca.buffer);glyphs.forEach((g,i)=>{lv.setUint32(i*4,glyfLen);glyfLen+=g.length});lv.setUint32(glyphs.length*4,glyfLen);
 const glyf=new Uint8Array(glyfLen);let at=0;glyphs.forEach(g=>{glyf.set(g,at);at+=g.length});
 const gid=new Map(),pairs=[];cpList.forEach(([cp,og])=>{const ng=oldToNew.get(og);if(!gid.has(cp)){gid.set(cp,ng);pairs.push([ng,cp])}});
 const adv=old.map(g=>ttfAdv(font,g)),hmtx=new Uint8Array(old.length*4),hv=new DataView(hmtx.buffer);old.forEach((g,i)=>{hv.setUint16(i*4,adv[i]);hv.setInt16(i*4+2,ttfLsb(font,g))});
 const cut=(tag)=>font.bytes.slice(font.tables[tag].off,font.tables[tag].off+font.tables[tag].len);
 const viewOf=u=>new DataView(u.buffer,u.byteOffset,u.byteLength);
 const head=cut("head");viewOf(head).setUint32(8,0);viewOf(head).setInt16(50,1);
 const hhea=cut("hhea");viewOf(hhea).setUint16(34,old.length);
 const maxp=cut("maxp");viewOf(maxp).setUint16(4,old.length);
 const os2=cut("OS/2");let first=0xFFFF,last=0;cpList.forEach(([cp])=>{if(cp<=0xFFFF){if(cp<first)first=cp;if(cp>last)last=cp}});if(first>last){first=0;last=0}viewOf(os2).setUint16(64,first);viewOf(os2).setUint16(66,last);
 const post=new Uint8Array(32),pv=new DataView(post.buffer);pv.setInt32(0,0x00030000);pv.setInt16(8,font.ulPos);pv.setInt16(10,font.ulTh);
 const bin=ttfAssemble({"OS/2":os2,cmap:ttfCmapTable(pairs.map(([ng,cp])=>[cp,ng])),glyf,head,hhea,hmtx,loca,maxp,name:cut("name"),post});
 return {bin,gid,adv,pairs,upem:font.upem,ascent:font.ascent,descent:font.descent,cap:font.cap||font.ascent,bbox:font.bbox}}
function pdfGlyphHex(str,gid){let h="";for(const ch of str)h+=(gid.get(ch.codePointAt(0))||0).toString(16).padStart(4,"0");return "<"+h+">"}
function pdfToUnicode(pairs){const enc=cp=>{if(cp<=0xFFFF)return cp.toString(16).padStart(4,"0");const v=cp-0x10000,hi=0xD800+(v>>10),lo=0xDC00+(v&1023);return hi.toString(16).padStart(4,"0")+lo.toString(16).padStart(4,"0")};
 let body="/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n";
 const rows=pairs.filter(([g])=>g);for(let i=0;i<rows.length;i+=100){const c=rows.slice(i,i+100);body+=c.length+" beginbfchar\n";c.forEach(([g,cp])=>{body+="<"+g.toString(16).padStart(4,"0")+"> <"+enc(cp)+">\n"});body+="endbfchar\n"}
 return body+"endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend\n"}
function pdfMake(lines,sub){const enc=new TextEncoder(),parts=[],offs=[];let len=0;const put=x=>{const b=typeof x==="string"?enc.encode(x):x;parts.push(b);len+=b.length};
 const FS=11,LH=16,M=48,y0=841.89-M-FS,cap=Math.max(1,Math.floor((y0-M)/LH)),pages=[];for(let i=0;i<lines.length;i+=cap)pages.push(lines.slice(i,i+cap));if(!pages.length)pages.push([""]);
 const n=7+pages.length*2,obj=(i,body)=>{offs[i]=len;put(i+" 0 obj\n");body();put("\nendobj\n")};
 put("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
 obj(1,()=>put("<< /Type /Catalog /Pages 2 0 R >>"));
 obj(2,()=>put("<< /Type /Pages /Count "+pages.length+" /Kids ["+pages.map((_,i)=>(8+i*2)+" 0 R").join(" ")+"] >>"));
 obj(3,()=>put("<< /Type /Font /Subtype /Type0 /BaseFont /Pretendard /Encoding /Identity-H /DescendantFonts [4 0 R] /ToUnicode 7 0 R >>"));
 obj(4,()=>put("<< /Type /Font /Subtype /CIDFontType2 /BaseFont /Pretendard /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor 5 0 R /CIDToGIDMap /Identity /DW 1000 /W [0 ["+sub.adv.map(a=>Math.round(a*1000/sub.upem)).join(" ")+"]] >>"));
 obj(5,()=>{const k=1000/sub.upem,r=v=>Math.round(v*k);put("<< /Type /FontDescriptor /FontName /Pretendard /Flags 4 /FontBBox ["+sub.bbox.map(r).join(" ")+"] /ItalicAngle 0 /Ascent "+r(sub.ascent)+" /Descent "+r(sub.descent)+" /CapHeight "+r(sub.cap||sub.ascent)+" /StemV 80 /FontFile2 6 0 R >>")});
 obj(6,()=>{put("<< /Length "+sub.bin.length+" >>\nstream\n");put(sub.bin);put("\nendstream")});
 const tu=pdfToUnicode(sub.pairs);
 obj(7,()=>put("<< /Length "+tu.length+" >>\nstream\n"+tu+"\nendstream"));
 pages.forEach((ls,i)=>{const P=8+i*2,S=P+1;let cs="BT\n/F1 "+FS+" Tf\n"+LH+" TL\n"+M.toFixed(2)+" "+y0.toFixed(2)+" Td\n";ls.forEach(line=>{cs+=(line?pdfGlyphHex(line,sub.gid):"()")+" Tj\nT*\n"});cs+="ET";
  obj(P,()=>put("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 3 0 R >> >> /Contents "+S+" 0 R >>"));
  obj(S,()=>put("<< /Length "+cs.length+" >>\nstream\n"+cs+"\nendstream"))});
 const xr=len;put("xref\n0 "+(n+1)+"\n0000000000 65535 f \n");for(let i=1;i<=n;i++)put(String(offs[i]).padStart(10,"0")+" 00000 n \n");
 put("trailer\n<< /Size "+(n+1)+" /Root 1 0 R >>\nstartxref\n"+xr+"\n%%EOF");
 return {blob:new Blob(parts,{type:"application/pdf"}),pages:pages.length,bytes:()=>{const out=new Uint8Array(len);let p=0;parts.forEach(b=>{out.set(b,p);p+=b.length});return out}}}
function pinLog(el,y){const b=el.style.scrollBehavior;el.style.scrollBehavior="auto";el.scrollTop=y;el.style.scrollBehavior=b}
function paint(el,ms,th){th=th==null?"":String(th);ms=ms.filter(m=>m&&!m.bt);const same=el.dataset.th===th,nearB=el.scrollHeight-el.scrollTop-el.clientHeight<40,top=el.scrollTop,prevLast=Number(el.dataset.last||0);
 ms.sort((a,b)=>a.ts-b.ts);el._ms=ms;const last=ms.length?Number(ms[ms.length-1].ts)||0:0;el.dataset.th=th;el.dataset.last=last;
 const keep=()=>{if(!same||nearB){const end=()=>pinLog(el,el.scrollHeight);end();newBtn(el,false);requestAnimationFrame(end)}else{pinLog(el,top);if(last>prevLast)newBtn(el,true)}};
 el.innerHTML="";if(!ms.length){el.innerHTML="<div class='cm-empty'><span>✦</span><p>아직 대화가 없다.</p><small>먼저 인사를 건네 보자.</small></div>";newBtn(el,false);return}
 /* 말풍선: 내 말은 오른쪽, 다른 사람 말은 왼쪽. 같은 사람이 3분 안에 이어 말하면 이름과 얼굴을 한 번만 보인다. 날짜가 바뀌면 구분선을 넣는다. */
 let pu=null,pt=0,pd="",need=false;
 ms.forEach(m=>{const me=m.u===UID,ts=Number(m.ts)||0,d=ts?new Date(ts):null,dk=d?d.getFullYear()+"."+(d.getMonth()+1)+"."+d.getDate():"";
  if(dk&&dk!==pd){const sep=elT("div","cm-day",(d.getMonth()+1)+"월 "+d.getDate()+"일");el.appendChild(sep);pu=null}pd=dk||pd;
  const cont=pu===m.u&&ts-pt<180000;pu=m.u;pt=ts;
  const p=elT("div","cm"+(me?" me":"")+(cont?" cont":""));
  const nm=cn(m.u,m.n),av=elT("span","cm-av",(nm||"?").slice(0,1));if(!me&&m.u){av.dataset.u=m.u;if(!avSet(av,m.u))need=true}
  const body=elT("div","cm-body"),head=elT("div","cm-head"),b=elT("b","cm-n",nm+(me?" (나)":""));
  if(m.u&&!me){b.tabIndex=0;b.setAttribute("role","button");b.classList.add("link");b.onclick=()=>openProfile(m.u);b.onkeydown=e=>{if(e.key==="Enter")openProfile(m.u)};av.onclick=()=>openProfile(m.u);av.classList.add("link")}
  head.appendChild(b);if(typeof m.t==="string"&&m.t)head.appendChild(elT("span","ttl-chip",m.t.slice(0,20)));
  const row=elT("div","cm-row"),bub=elT("span","cm-x",String(m.x==null?"":m.x)),tm=elT("small","cm-t",d?String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"):"");
  row.append(bub,tm);body.append(head,row);p.append(av,body);el.appendChild(p)});if(need)avLoad();keep()}
/* 채팅 프로필 사진: 화면에 나온 사람의 players/{그 사람}/im 만 받는다. 등록자 전체를 받지 않는다.
   한 번 받은 사진은 이 탭에서 기억하고, 대화가 다시 그려져도 그 사진을 붙인다. 사진이 없으면 이름 첫 글자를 그대로 둔다. */
const AVC={},AVT={};
let avBusy=false;
function avPaint(av,im){if(!im||av.querySelector("img"))return;const i=document.createElement("img");i.src=im;i.alt="";i.loading="lazy";av.textContent="";av.appendChild(i);av.classList.add("has")}
function avSet(av,u){if(!u)return true;if(AVC[u]==null)return false;avPaint(av,AVC[u]);return true}
function avApply(){document.querySelectorAll(".cm-av[data-u]").forEach(a=>avSet(a,a.dataset.u))}
function avLoad(){if(!DB||avBusy)return;const now=Date.now(),ids=[];document.querySelectorAll(".cm-av[data-u]").forEach(a=>{const u=a.dataset.u;if(!u||AVC[u]!=null||(AVT[u]&&AVT[u]>now)||ids.indexOf(u)>=0)return;ids.push(u)});if(!ids.length)return;avBusy=true;
 Promise.all(ids.slice(0,8).map(async u=>{try{const d=(await DB.doc("players/"+u+"/im").get()).data();AVC[u]=typeof d==="string"&&/^(data:image\/|https:)/.test(d)?d:""}catch(e){AVT[u]=Date.now()+20000}})).then(()=>{avBusy=false;avApply();avLoad()},()=>{avBusy=false})}
function setT(t,fresh){const enterDm=t==="d"&&(!!fresh||ct!=="d"||!!peer),enterAdm=t==="a"&&(!!fresh||ct!=="a");ct=t;unC&&unC();unC=null;unP&&unP();unP=null;if(t!=="a")admGen++
 document.querySelectorAll("#ct button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.t===t?"true":"false"));
 $("#cg").hidden=t!=="g";$("#cvl").hidden=t!=="v";$("#cd").hidden=t!=="d";$("#ca").hidden=t!=="a";if(typeof navSync==="function")navSync("chat",false)
 if(t==="g")unC=apiWatchGlobal(ms=>paint($("#gl"),ms,"g"),()=>cmsg("채팅을 불러오지 못했다."));
 // 마을 채팅: 단체 채팅과 같은 저장 공간을 쓰되 이름이 "c_{마을}_"로 시작한다. 내 마을의 대화만 불러온다.
 else if(t==="v"){vcNew=false;vcMark();$("#cvh").textContent=VL[C.v].n+" 주민끼리 나누는 채팅이다. 다른 마을 주민에게는 보이지 않는다.";C.vcSeen=srvNow();save();updNav();
  unC=apiWatchVillage(C.v,ms=>{paint($("#vcl"),ms,"v"+C.v);C.vcSeen=srvNow()},()=>cmsg("마을 채팅을 불러오지 못했다."))}
 else if(t==="a"){if(enterAdm)watchAdm();else drawAdm()}else{dmMenu(false);peer=null;dmOpenGen++;$("#dt").hidden=true;$("#cpick").hidden=false;$("#pl2").dataset.sig="\u0001";
  dmApply();if(enterDm)dmList()}
 sync()}
/* 1:1 목록: 탭을 열 때 우편함(이름, 받은 시각)만 한 번 받는다. 본문은 그 상대를 열 때 한 번 받는다.
   C.dml = 상대별 마지막 시각. peerDocs = [id, {n, ts}]. */
let peerDocs=[],dmListGen=0,dmOpenGen=0;
function dmTrim(){if(!C||!C.dml)return;const ks=Object.keys(C.dml);if(ks.length>80)ks.sort((a,b)=>C.dml[a]-C.dml[b]).slice(0,ks.length-80).forEach(k=>delete C.dml[k])}
function dmApply(extra){if(!C)return;C.dml=C.dml||{};const rows={};let back=false;
 const held=(id,ts)=>{const g=Number(C.dmGone&&C.dmGone[id])||0,t=Number(ts)||0;if(!g||t>g){if(g&&t>g){delete C.dmGone[id];back=true}return false}return true};
 const put=(id,n,ts)=>{if(!id||id===UID||held(id,ts))return;const cur=rows[id]||{n:"",ts:0},nm=String(n||"").replace(/👑/g,"").slice(0,20);if(nm)cur.n=nm;const t=Number(ts)||0;if(t>cur.ts)cur.ts=t;rows[id]=cur};
 Object.keys(C.dml).forEach(id=>put(id,(C.dmn&&C.dmn[id])||(C.fr&&C.fr[id])||"",C.dml[id]));
 Object.keys(C.dmu||{}).forEach(id=>put(id,(C.dmn&&C.dmn[id])||(C.fr&&C.fr[id])||"",(C.dms&&C.dms[id])||C.dml[id]));
 Object.keys(extra||{}).forEach(id=>{const v=extra[id]||{};if(held(id,v.ts))return;put(id,v.n,v.ts);if(v.n){C.dmn=C.dmn||{};C.dmn[id]=String(v.n).replace(/👑/g,"").slice(0,20)}if((Number(v.ts)||0)>(C.dml[id]||0))C.dml[id]=Number(v.ts)});
 dmTrim();peerDocs=Object.keys(rows).map(id=>[id,rows[id]]);
 if(back)save();
 if(!$("#v-chat").hidden&&ct==="d"&&$("#cpick")&&!$("#cpick").hidden)drawPeers()}
async function dmList(){const gen=++dmListGen;dmApply();if(!DB)return;try{const rows=await apiDmIndex();if(gen!==dmListGen||$("#v-chat").hidden||ct!=="d")return;dmApply(rows)}catch(e){if(gen===dmListGen)cmsg("대화 목록을 불러오지 못했다.")}}
function dmTouch(id,t){if(!C||!id)return;if(C.dmGone&&Number(C.dmGone[id])&&t>Number(C.dmGone[id]))delete C.dmGone[id];C.dml=C.dml||{};if((C.dml[id]||0)>=t)return;C.dml[id]=t;dmTrim();const row=peerDocs.find(x=>x[0]===id);if(row)row[1].ts=Math.max(row[1].ts||0,t);else peerDocs.push([id,{n:(C.dmn&&C.dmn[id])||(C.fr&&C.fr[id])||"",ts:t}]);if(!$("#v-chat").hidden&&ct==="d"&&$("#cpick")&&!$("#cpick").hidden)drawPeers()}
function drawPeers(){const l=$("#pl2");if(!l||!C)return;const fr=C.fr||{};
 const ps=peerDocs.filter(x=>x[0]!==UID&&x[1]).sort((a,b)=>(b[1].ts||0)-(a[1].ts||0)||String(a[1].n||"").localeCompare(String(b[1].n||""),"ko")).slice(0,60);
 const sig=ps.map(([id,p])=>id+"|"+(p.n||"")+"|"+(C.dmu&&C.dmu[id]?1:0)+"|"+(fr[id]?1:0)+"|"+(p.ts?agoTxt(p.ts):"")).join(",");if(l.dataset.sig===sig)return;l.dataset.sig=sig;l.innerHTML="";
 if(!ps.length){l.innerHTML="<p class='hint'>아직 대화를 나눈 상대가 없다.</p>";const b=elT("button","btn g","친구 목록에서 대화 시작하기");b.type="button";b.onclick=()=>friends();l.appendChild(b)}
 ps.forEach(([id,p])=>{const b=document.createElement("button");b.type="button";b.className="chip";b.style.textAlign="left";b.dataset.id=id;const when=p.ts?agoTxt(p.ts):"";b.textContent=(C.dmu&&C.dmu[id]?"● ":"")+(fr[id]?"☍ ":"")+cn(id,p.n||"상대")+(when?" · "+when:"");b.setAttribute("aria-pressed",peer===id?"true":"false");b.onclick=()=>openDM(id,p.n||"상대");b.style.flex="1";
  const w=document.createElement("div");w.style.cssText="display:flex;gap:8px";const pb=document.createElement("button");pb.type="button";pb.className="chip";pb.style.cssText="flex:0 0 auto;min-width:0;padding:10px 14px";pb.textContent="프로필";pb.onclick=()=>openProfile(id);w.append(b,pb);l.appendChild(w)})}
setInterval(()=>{if(C&&!$("#v-chat").hidden&&ct==="d"&&$("#cpick")&&!$("#cpick").hidden)drawPeers()},60000);
function dmPaint(ms,k){const el=$("#dl"),mine=(el._ms||[]).filter(m=>m&&m.u===UID&&!ms.some(s=>s&&s.u===m.u&&s.x===m.x&&Math.abs((Number(s.ts)||0)-(Number(m.ts)||0))<15000));paint(el,ms.concat(mine),k)}
function dmLoad(id,quiet){if(!DB)return;const k=[UID,id].sort().join("_"),gen=++dmOpenGen;if(!quiet){const el=$("#dl");el._ms=[];el.dataset.th="";el.innerHTML="<div class='cm-empty'><p>대화를 불러오는 중...</p></div>"}
 return apiDmThread(k).then(sn=>{if(gen!==dmOpenGen||peer!==id||$("#v-chat").hidden||ct!=="d"||$("#dt").hidden)return;dmPaint((sn.docs||[]).map(d=>d.data()).filter(Boolean),k)},e=>{if(!quiet&&gen===dmOpenGen)cmsg("대화를 불러오지 못했다. (오류 "+String(e&&e.message||e).replace(/\D/g,"").slice(0,3)+")")})}
function openDM(id,n){peer=id;unC&&unC();unC=null;dmMenu(false);$("#cpick").hidden=true;if(C&&C.dmu&&C.dmu[id]){delete C.dmu[id];save()}const name=n||(C&&C.dmn&&C.dmn[id])||(C&&C.fr&&C.fr[id])||"상대";$("#dh").textContent=name+"와의 1:1 대화";$("#dt").hidden=false;dmLoad(id);dmLeftPeek(id);sync()}
/* 1:1 머리의 설정. PDF 저장은 예전과 같고, 나가기는 내 목록에서만 지운다. */
function dmMenu(show){const m=$("#dmenu"),b=$("#dpng");if(!m||!b)return;m.hidden=show!==true;b.setAttribute("aria-expanded",m.hidden?"false":"true")}
let dmAskOn=false;
function dmAsk(o){const box=$("#dask");if(dmAskOn||!box)return Promise.resolve(null);dmAskOn=true;$("#daskm").textContent=o.text||"";const y=$("#dasky"),n=$("#daskn");y.hidden=!o.yes;if(o.yes)y.textContent=o.yes;n.textContent=o.no||"아니오";
 return new Promise(res=>{const done=v=>{dmAskOn=false;y.onclick=n.onclick=null;box.hidden=true;res(v)};y.onclick=()=>done(true);n.onclick=()=>done(false);box.hidden=false;(o.yes?y:n).focus()})}
async function dmLeave(){dmMenu(false);const id=peer;if(!id||!C)return;const ok=await dmAsk({text:"채팅방을 나가면 채팅 내역이 삭제됩니다. 정말 나가시겠습니까?",yes:"예",no:"아니오"});if(ok!==true||peer!==id)return;
 const row=peerDocs.find(x=>x[0]===id),known=Math.max(Number(C.dml&&C.dml[id])||0,Number(C.dms&&C.dms[id])||0,row&&Number(row[1].ts)||0,srvNow());C.dmGone=C.dmGone||{};C.dmGone[id]=known;
 ["dml","dmn","dmu","dms"].forEach(k=>{if(C[k])delete C[k][id]});peerDocs=peerDocs.filter(x=>x[0]!==id);save();
 dmOpenGen++;peer=null;$("#dl")._ms=[];$("#dt").hidden=true;$("#cpick").hidden=false;const list=$("#pl2");if(list)list.dataset.sig="\u0001";sync();drawPeers();
 if(DB){apiDmDrop(id).catch(()=>{});apiDmLeave(id).catch(()=>cmsg("상대에게 퇴장을 알리지 못했다."))}toast("채팅방에서 나왔다.")}
const dmLeftWait={};
function dmLeftNotice(id,ts){if(!id||!ts)return;dmLeftWait[id]=ts;dmLeftShow()}
function dmLeftShow(){if(dmAskOn||!C)return;const id=Object.keys(dmLeftWait)[0];if(!id)return;const ts=dmLeftWait[id];if((Number(C.dmBye&&C.dmBye[id])||0)>=ts||((C.dms&&C.dms[id])||0)>=ts){delete dmLeftWait[id];dmLeftShow();return}
 dmAsk({text:"사용자가 퇴장하였습니다. 다시 채팅을 보내면 이어집니다.",no:"확인"}).then(v=>{if(v===null)return;delete dmLeftWait[id];C.dms=C.dms||{};if(ts>(C.dms[id]||0))C.dms[id]=ts;C.dmBye=C.dmBye||{};C.dmBye[id]=ts;save();dmLeftShow()})}
async function dmLeftPeek(id){if(!DB||!UID||!id||dmLeftPeek.busy)return;dmLeftPeek.busy=true;try{const d=(await DB.doc("dmn/"+UID+"/"+id).get()).data();if(d&&d.left&&typeof d.ts==="number")dmLeftNotice(id,d.ts)}catch(e){}finally{dmLeftPeek.busy=false}}
$("#dpng").onclick=e=>{e.stopPropagation();const m=$("#dmenu");dmMenu(!!(m&&m.hidden))};$("#dpdf").onclick=()=>{dmMenu(false);dmPng($("#dl"),$("#dh").textContent)};$("#dleave").onclick=()=>dmLeave();
document.addEventListener("click",e=>{const m=$("#dmenu");if(!m||m.hidden)return;const s=$("#dset");if(s&&s.contains(e.target))return;dmMenu(false)});
$("#apng").onclick=()=>dmPng($("#alg"),$("#ah").textContent);
/* 채팅 순서: 예전에는 보내는 사람 기기의 시계로 시각(ts)을 적었다. 기기 시계가 30~40초 빠르거나 느린 사람이 있으면
   그 사람 메시지가 맨 아래에 붙어 있다가 다른 메시지들 사이로 끼어 올라가는 일이 생겼다.
   이제 시각은 서버가 직접 적고({".sv":"timestamp"}), 메시지 이름(순서용)도 서버 시계에 맞춘 시각으로 만든다. */
let SKEW=0,skewOk=false;const srvNow=()=>Date.now()+SKEW;
const clockSync=()=>apiClockSync();
// 너무 빨리 연달아 보내면 버리지 않고 잠깐 기다렸다가 보낸다.
let sendT=null;
function send(){const x=$("#ci").value.trim();if(!x)return;const wait=800-(Date.now()-lastSend);if(wait>0){clearTimeout(sendT);sendT=setTimeout(send,wait);return}if(ct==="d"&&!peer)return cmsg("대화 상대를 먼저 골라야 한다.");
 lastSend=Date.now();clockSync();const id=(ct==="v"?"c_"+C.v+"_":"")+srvNow().toString(36)+Math.random().toString(36).slice(2,6),d={u:UID,n:C.n,x:x,ts:{".sv":"timestamp"}};if(ct==="v")d.vc=C.v;if(tiName(C.ti))d.t=tiName(C.ti);const to=ct==="d"?peer:null;if(to)d.k=[UID,to].sort().join("_");
 apiPostMessage(ct==="d"?"dm":"chat",id,d).then(()=>{const fields={};if(to){const msg={u:UID,n:C.n,x,ts:Date.now()};if(d.t)msg.t=d.t;dmTouch(to,msg.ts);if(C.dml&&C.dml[to])fields["dml/"+to]=C.dml[to];apiDmBell(to,x);if(peer===to&&$("#dt")&&!$("#dt").hidden){const el=$("#dl");paint(el,(el._ms||[]).concat([msg]),[UID,to].sort().join("_"))}}$("#ci").value="";$("#cm2").textContent="";titleState();fields["stats/chats"]=(C.stats.chats||0)+1;apiAccountWrite(fields).catch(()=>{})}).catch(e=>{const c=String(e&&e.message||e);cmsg(c==="401"||c==="403"?"메시지를 보내지 못했다. 서버 규칙에서 쓰기가 막혀 있다. (오류 "+c+")":"메시지를 보내지 못했다. 인터넷 연결을 확인하고 다시 보내 보자. (오류 "+c+")")})}
// 목록으로 돌아가면 상대와 받은 시각만 다시 한 번 받는다. 본문은 받지 않는다.
$("#pchg").onclick=()=>{dmMenu(false);dmOpenGen++;unC&&unC();unC=null;peer=null;$("#dt").hidden=true;$("#cpick").hidden=false;sync();dmList()};
// 엔터와 보내기 버튼 모두 폼 제출로 처리한다. 휴대폰 한글 키보드에서도 엔터가 확실히 먹는다.
$("#cin").onsubmit=e=>{e.preventDefault();send()};

/* 1:1 새 메시지 알림: dmn/{나}의 이름·시각·미리보기만 본다. 본문은 그 대화를 열 때 받는다.
   C.dms = 보낸 사람별로 마지막으로 확인한 시각, C.dmu = 아직 안 읽은 사람, C.dmn = 보낸 사람 이름. */
const goDM=(u,n)=>{const name=n||(C&&C.dmn&&C.dmn[u])||(C&&C.fr&&C.fr[u])||"상대";if($("#v-chat").hidden||ct!=="d"){ct="d";chat()}openDM(u,name)};
let dmBusy=false;
/* 1:1 알림은 dmn/{나}만 30초마다 본다. 이름·시각·미리보기가 거기 있다. 대화 목록을 열 때는 예전 우편함도 한 번 본다. */
function dmBell(to,x){apiDmBell(to,x)}
async function checkDM(){if(!AUTH.uid||!C||!DB||dmBusy)return;dmBusy=true;try{const got={};
 const take=(f,v)=>{if(!v||typeof v!=="object"||typeof v.ts!=="number")return;if(!got[f]||v.ts>got[f].ts)got[f]=v};
 try{const s=await apiDmnList();s.docs.forEach(d=>take(d.id,d.data()))}catch(e){}
 if(!C)return;const first=!C.dms;C.dms=C.dms||{};C.dmu=C.dmu||{};C.dmn=C.dmn||{};let ch=false;
 for(const f of Object.keys(got)){const v=got[f];if(v.left){if((Number(C.dmBye&&C.dmBye[f])||0)<v.ts&&(C.dms[f]||0)<v.ts)dmLeftNotice(f,v.ts);continue}if(v.ts<=(C.dms[f]||0))continue;if(C.dmGone&&Number(C.dmGone[f])&&v.ts<=Number(C.dmGone[f]))continue;C.dms[f]=v.ts;ch=true;const n=String(v.n||"누군가").slice(0,20);C.dmn[f]=n;dmTouch(f,v.ts);
  if(first)continue;// 이 기능이 처음 켜질 때는 예전 메시지로 알림을 쏟아 내지 않는다.
  if(!$("#v-chat").hidden&&ct==="d"&&peer===f){dmLoad(f,1);continue}// 그 대화를 보고 있으면 본문만 한 번 다시 받는다.
  C.dmu[f]=1;const x=String(v.x||"").slice(0,40);note("dm",n+"님에게서 1:1 메시지가 왔다"+(x?": "+x:"."),f);toast("✉ "+n+(x?": "+x:"님에게서 1:1 메시지가 왔다"),()=>goDM(f,n));ding()}
 if(ch){save();updNav();if(!$("#v-chat").hidden&&ct==="d")document.querySelectorAll("#pl2 .chip").forEach(c=>{if(c.dataset.id&&C.dmu[c.dataset.id]&&!/^● /.test(c.textContent))c.textContent="● "+c.textContent})}}
 catch(e){}finally{dmBusy=false}}
setInterval(()=>{if(!document.hidden)checkDM()},30000);
setInterval(()=>{if(!document.hidden&&C&&DB&&!$("#v-chat").hidden&&ct==="d"&&peer&&$("#dt")&&!$("#dt").hidden)dmLeftPeek(peer)},8000);
$("#ct").onclick=e=>{const t=e.target.dataset&&e.target.dataset.t;if(t&&DB)setT(t)};
// 마을 채팅에 새 메시지가 오면(내가 보지 않는 동안) 탭에 ● 표시를 한다. 30초마다 가장 최근 메시지 한 개만 확인한다.
let vcNew=false;function vcMark(){const b=document.querySelector("#nav [data-ct=v]");if(b){b.textContent="마을 채팅"+(vcNew?" ●":"");const n=b.querySelector(".nav-n");if(n)n.remove()}}
setInterval(async()=>{if(!C||!DB||!XON()||!AUTH.uid||document.hidden)return;if(!$("#v-chat").hidden&&ct==="v"){vcNew=false;vcMark();return}
 try{const sn=await apiVillageLatest(C.v),m=sn.docs.map(d=>d.data())[0];vcNew=!!(m&&m.vc===C.v&&m.u!==UID&&Number(m.ts)>(C.vcSeen||0));vcMark()}catch(e){}},60000);
