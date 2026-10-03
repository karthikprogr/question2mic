const $=id=>document.getElementById(id);
$('txt').value=`I. Choose the correct answer. 4 x 1 = 4M
1. Which part of the plant makes food? ( )
a) Root b) Stem c) Leaf d) Flower
2. Which of these animals lives in water? ( )
a) Cow b) Fish c) Hen d) Dog
3. Which water is safe to drink? ( )
a) Pond water b) Boiled and cooled water c) Sea water d) Puddle water
4. How many legs does an insect have? ( )
a) Four b) Six c) Eight d) Two
II. Write True or False. 4 x 1 = 4M
1. The Sun gives us light and heat. [ ]
2. Plants do not need water. [ ]
3. Teeth help us to chew food. [ ]
4. Frogs live only in water. [ ]
III. Fill in the blanks. 4 x 1 = 4M
1. The young one of a cow is called a ______.
2. We breathe in ______ gas.
3. We should brush our teeth ______ a day.
4. A bird lives in a ______.
IV. Match the following. 4 x 1 = 4M
A | B
Horse | Hive
Bee | Kennel
Dog | Stable
Spider | Web
[page]
V. Answer the following. 2 x 2 = 4M
1. Label the parts of the plant.
[image]
2. Write two uses of water.
[lines 2]`;
let LOGO='',IM=[],lastR=0,ii=0,PAPERS=[];
const e=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const fx=s=>e(s).replace(/\( \)/g,'(&emsp;&emsp;)');
const RM=/^(?=[IVXL])(X{0,3})(IX|IV|V?I{0,3})\.\s/;
const ROM={I:1,II:2,III:3,IV:4,V:5,VI:6,VII:7,VIII:8,IX:9,X:10,XI:11,XII:12,XIII:13,XIV:14,XV:15};
const MK=/(\d+\s*[x×*]\s*\d+\s*=\s*\d+\s*M?|\d+\s*M)\s*$/i;
const PART=/^Part\s*-?\s*[A-Za-z]\b/i;
/* Tidy text that came from Word: remove odd spacing, turn match columns into "left | right" */
function clean(raw){
 const out=[];let k='',inT=false;
 raw.split('\n').forEach(r=>{
  r=r.replace(/\u00a0/g,' ').replace(/&\s*quot;/g,'"').replace(/\s+$/,'');
  if(!r.trim())return;
  const ind=/^\s{3,}/.test(r),last=out.length-1;
  const l=r.trim().replace(/\(\s+\)/g,'( )').replace(/\(\)/g,'( )');
  const dig=/^\d+[.)]/.test(l),lab=/^[a-jA-J][.)]\s/.test(l);
  const parts=l.split(/\s{3,}|\t+/).map(x=>x.trim()).filter(Boolean);
  if(parts.length===2&&/^\(?\s*A\s*\)?$/.test(parts[0])&&/^\(?\s*B\s*\)?$/.test(parts[1])){out.push('A | B');k='m';inT=true;return}
  if(/^\d+\s*M$/i.test(l)&&k==='h'){out[last]+='   '+l;k='';return}
  if(RM.test(l)||PART.test(l)){const mk=l.match(MK),t=(mk?l.slice(0,mk.index):l).trim().replace(/\s+/g,' ');
   out.push(mk?t+'   '+mk[1].replace(/\s+/g,' '):t);k='h';inT=false;return}
  if(ind&&last>=0&&!dig&&!lab&&(l==='( )'||(!/\( \)/.test(l)&&l[0]!=='('))){
   if(k==='h'){const mk=out[last].match(MK),t=mk?out[last].slice(0,mk.index).trim():out[last];out[last]=t+' '+l+(mk?'   '+mk[1]:'');return}
   if(k==='q'||k==='m'){out[last]+=' '+l;return}}
  if(dig&&parts.length>=2){const b=parts[parts.length-1];
   if(b!=='( )'&&(/^[a-jA-J][.)]\s?\S/.test(b)||inT)){out.push(parts[0]+' | '+b);k='m';inT=true;return}}
  out.push(l.replace(/\s{2,}/g,' '));k=(dig||lab)?'q':'p';
 });
 return out.join('\n')}
/* Turn text into blocks (a question with its options stays together) */
function blocks(txt){
 const B=[];let cur='',hd=false,tbl=null,mi=0;
 const push=()=>{if(cur){B.push(cur);cur=''}};
 const fl=()=>{if(tbl!==null){if(!hd)push();cur+='<table class="m">'+tbl+'</table>';tbl=null;hd=false}};
 txt.split('\n').forEach(raw=>{
  const l=raw.replace(/\u00a0/g,' ').trim();if(!l)return;let m;
  if(l.includes('|')){const [a0,b0]=l.split('|').map(x=>x.trim());
   if(tbl===null){tbl='';mi=0}
   if(/^[A-Za-z]$/.test(a0)&&/^[A-Za-z]$/.test(b0))tbl+=`<tr><th>${e(a0)}</th><th></th><th>${e(b0)}</th></tr>`;
   else{mi++;const n=a0.match(/^(\d+)[.)]\s*/),lb=b0.match(/^([a-jA-J])[.)]\s*(.*)$/);
    tbl+=`<tr><td>${n?n[1]:mi}. ${fx(a0.replace(/^\d+[.)]\s*/,''))}</td><td class="br">(&emsp;)</td><td>${lb?lb[1].toLowerCase()+') '+fx(lb[2]):'abcdefghij'[mi-1]+') '+fx(b0)}</td></tr>`}
   return}
  fl();
  const hm=l.match(/^([IVX]+)\.\s/),mk=l.match(MK);let isH=PART.test(l);
  if(!isH&&hm&&RM.test(l)){const v=ROM[hm[1]]||0;if(v===lastR+1||mk){isH=true;lastR=v||lastR}}
  if(isH){const t=(mk?l.slice(0,mk.index):l).trim();
   const mm=mk?mk[1].replace(/\s*[x×*]\s*/i,' × ').replace(/\s*=\s*/,' = ').replace(/\s*(M?)$/i,'$1'):'';
   push();cur=`<div class="sec"><span>${e(t)}</span><span>${mm}</span></div>`;hd=true;return}
  if(/^[a-j][.)]\s/i.test(l)&&(/^[a-j]\)/i.test(l)||/\s[b-j][.)]\s/i.test(l))){
   cur+='<div class="opt">'+l.split(/\s+(?=[a-j][.)]\s)/i).map(p=>'<span>'+fx(p)+'</span>').join('')+'</div>'}
  else if(/^\[image\]$/i.test(l)){const u=IM[ii++];cur+='<div class="im">'+(u?`<img src="${u}">`:'<i>[picture]</i>')+'</div>'}
  else if(m=l.match(/^\[lines\s*(\d+)\]$/i))cur+='<div class="ln"></div>'.repeat(+m[1]);
  else if(m=l.match(/^(\d+[.)]|[a-jA-J][.)])\s+(.*)$/)){if(!hd)push();cur+=`<div class="q"><span class="n">${m[1]}</span><span>${fx(m[2])}</span></div>`}
  else if((m=l.match(/[^()]+?\( \)/g))&&m.join('').length>=l.length-1)cur+='<div class="opt">'+m.map(p=>'<span>'+fx(p.trim())+'</span>').join('')+'</div>';
  else cur+=`<div class="q"><span>${fx(l)}</span></div>`;
  hd=false});
 fl();push();return B}
function head(){
 return `<div class="hdr"><div class="h1">${LOGO?`<img src="${LOGO}">`:''}<span>${e($('school').value)}</span></div>
 <div class="h2"><span>${$('cls').value.trim()?'Class : '+e($('cls').value):''}</span><span>${e($('campus').value)}</span><span>${$('marks').value.trim()?'Marks : '+e($('marks').value):''}</span></div>
 <div class="h3">${e($('exam').value)}</div>
 <div class="h4"><span>Sub : ${e($('sub').value)}</span><span>${$('time').value.trim()?'Time : '+e($('time').value):''}</span></div></div>`}
function classNum(v){v=(v==null?$('cls').value:v).toUpperCase().replace(/CLASS|STD|GRADE/g,'').replace(/[^A-Z0-9]/g,'');
 const d=v.match(/^(\d+)(ST|ND|RD|TH)?$/);if(d)return +d[1];
 return ({I:1,II:2,III:3,IV:4,V:5,VI:6,VII:7,VIII:8,IX:9,X:10,XI:11,XII:12})[v]||0}
function portrait(){const o=$('ori').value;if(o!=='auto')return o==='portrait';const n=classNum();return n>=1&&n<=3}
const FL=[['Cambria','serif'],['Calibri','sans-serif'],['Times New Roman','serif'],['Arial','sans-serif'],['Arial Narrow','sans-serif'],['Arial Black','sans-serif'],['Verdana','sans-serif'],['Tahoma','sans-serif'],['Trebuchet MS','sans-serif'],['Georgia','serif'],['Garamond','serif'],['Book Antiqua','serif'],['Bookman Old Style','serif'],['Palatino Linotype','serif'],['Century','serif'],['Century Gothic','sans-serif'],['Century Schoolbook','serif'],['Candara','sans-serif'],['Constantia','serif'],['Corbel','sans-serif'],['Segoe UI','sans-serif'],['Franklin Gothic Book','sans-serif'],['Gill Sans MT','sans-serif'],['Lucida Sans','sans-serif'],['Rockwell','serif'],['Perpetua','serif'],['Baskerville Old Face','serif'],['Calisto MT','serif'],['Comic Sans MS','cursive'],['Courier New','monospace'],['Consolas','monospace'],['Lucida Console','monospace'],['Mangal','serif'],['Nirmala UI','sans-serif'],['Kokila','serif'],['Aparajita','serif'],['Utsaah','serif'],['Gautami','sans-serif'],['Vani','sans-serif'],['Lora','serif'],['Noto Serif','serif'],['Nunito Sans','sans-serif']];
const fname=()=>$('pfont').value==='__custom'?($('pcustom').value.trim()||'Cambria'):$('pfont').value;
const fstack=()=>{const n=fname().replace(/['"]/g,''),f=FL.find(x=>x[0]===n);return "'"+n+"',"+(f?f[1]:'serif')};
const sa=()=>`st-${$('pstyle').value}" style="font-family:${fstack()};font-size:${$('fs').value}`;
const sheet=(c,pt)=>pt?`<div class="sheet pt ${sa()}"><div>${c}</div></div>`:`<div class="sheet ${sa()}"><div class="two"><div class="cp">${c}</div><div class="cp">${c}</div></div></div>`;
/* Fill pages automatically: add blocks until the page is full */
function paginate(bl,withHead,pt){
 const host=document.createElement('div');
 host.innerHTML=`<div class="sheet${pt?' pt':''} ${sa()};position:fixed;left:-9999px;top:0;margin:0"><div class="${pt?'':'two'}"><div class="${pt?'':'cp'}"></div></div></div>`;
 document.body.appendChild(host);const sh=host.firstChild,c=sh.firstChild.firstChild;
 const pages=[];let cur=withHead?head():'',n=0;c.innerHTML=cur;
 bl.forEach(b=>{c.insertAdjacentHTML('beforeend',b);
  if(sh.scrollHeight>sh.clientHeight+1&&(n>0||withHead&&cur)&&n>0){pages.push(cur);cur=b;c.innerHTML=b;n=1}
  else{cur+=b;n++}});
 if(cur)pages.push(cur);host.remove();return pages}
function render(){
 const pt=portrait();
 const st=document.getElementById('ps')||document.head.appendChild(Object.assign(document.createElement('style'),{id:'ps'}));
 st.textContent='@page{size:A4 '+(pt?'portrait':'landscape')+';margin:0}';
 $('onote').textContent=(classNum()?'Class '+classNum()+' → ':'Class not recognised → ')+(pt?'portrait, one paper per page':'landscape, two copies per sheet');
 document.documentElement.style.setProperty('--fs',$('fs').value);
 lastR=0;ii=0;let pages=[];
 $('txt').value.split(/^\s*\[page\]\s*$/im).forEach((ch,i)=>{pages=pages.concat(paginate(blocks(ch),i===0,pt))});
 $('out').innerHTML=pages.map((c,i)=>`<div class="pl noprint">Page ${i+1} of ${pages.length} (${i%2?'back':'front'})${pt?'':' – same paper twice, cut in the middle'}</div>`+sheet(c,pt)).join('');
 const bad=[];document.querySelectorAll('#out .sheet').forEach((x,i)=>{if(x.scrollHeight>x.clientHeight+2)bad.push(i+1)});
 $('warn').textContent=bad.length?'Page '+bad.join(', ')+' has one part that is too big. Make the text size smaller.':'';
}
/* Word file can hold many papers: split and let the teacher choose */
function applyDetails(d){
 ['cls','sub','exam','marks','time'].forEach(k=>$(k).value=d[k]||'');
 if(d.school)$('school').value=d.school;if(d.campus)$('campus').value=d.campus;
 return[['cls','class'],['sub','subject'],['exam','exam name'],['marks','marks'],['time','time']].filter(x=>!$(x[0]).value).map(x=>x[1])}
function loadPaper(i){const p=PAPERS[i];if(!p)return[];curId=null;const miss=applyDetails(p);$('txt').value=clean(p.body);render();return miss}
const SCH=/^\s*[A-Z][A-Z .&'-]{4,60}\b(SCHOOL|COLLEGE)\s*$/;
function splitPapers(t){
 const L=t.replace(/\u00a0/g,' ').split('\n'),idx=[];
 L.forEach((x,i)=>{if((SCH.test(x)||/techno school/i.test(x))&&x.trim().length<60)idx.push(i)});
 if(!idx.length){L.unshift('');idx.push(0)}
 return idx.map((st,k)=>{const ch=L.slice(st,idx[k+1]||L.length),H=ch.slice(1,9),p={};let used=0,m,paper='';
  if(ch[0].trim())p.school=ch[0].trim();
  H.forEach((x,j)=>{let any=false;
   if(m=x.match(/Class\s*:\s*(\S+)\s+(.*?)\s+Marks\s*:\s*(\S+)/i)){p.cls=m[1];p.campus=m[2];p.marks=m[3];any=true}
   else if(m=x.match(/Sub\s*:\s*(\S+)\s+(.*?)\s+Time\s*:\s*(.+?)\s*$/i)){p.sub=m[1];p.exam=m[2];p.time=m[3];any=true}
   else{
    if(m=x.match(/Class\s*:\s*(\S+)/i)){p.cls=m[1];any=true}
    if(m=x.match(/Marks\s*:\s*(\S+)/i)){p.marks=m[1];any=true}
    if(m=x.match(/Sub(?:ject)?\s*:\s*(\S+)/i)){p.sub=m[1];any=true}
    if(m=x.match(/Time\s*:\s*(.+?)\s*$/i)){p.time=m[1];any=true}
    if(/^\s*PAPER\s*-?\s*\d/i.test(x)){paper=x.trim().replace(/\s+/g,' ');any=true}}
   if(any)used=j+1;else if(!x.trim()&&used===j)used=j+1});
  if(paper)p.exam=(p.exam||'')+' ('+paper+')';
  p.body=ch.slice(1+used).join('\n');
  p.label=(k+1)+'. '+(p.cls?'Class '+p.cls+' – ':'')+(p.sub||'Paper')+(paper?' – '+paper:'');
  return p})}
['school','campus','cls','sub','exam','marks','time','fs','ori','txt','pfont','pstyle'].forEach(i=>$(i).addEventListener('input',render));
const rd=f=>new Promise(r=>{const x=new FileReader();x.onload=()=>r(x.result);x.readAsDataURL(f)});
$('logo').onchange=async v=>{if(v.target.files[0]){LOGO=await rd(v.target.files[0]);render()}};
$('pics').onchange=async v=>{IM=await Promise.all([...v.target.files].map(rd));render()};
$('pp').onchange=()=>loadPaper(+$('pp').value);

/* ---------- Word (.docx) export ---------- */
async function saveBlob(name,blob){
 try{if(window.claude&&claude.use){const d=await claude.use('downloads');if(d){await d.save({filename:name,data:blob});return 'ok'}}}
 catch(err){if(err&&err.code==='declined')return 'declined'}
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();return 'ok'}
async function buildDocx(){
 const pt=portrait(),font=fname().replace(/["&<>]/g,''),base=Math.round(parseFloat($('fs').value)*1.5),W=pt?10300:7500,sty=$('pstyle').value;
 const media=[],mid={};let did=1;
 const x=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const rpr=o=>`<w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/>${o&&o.b?'<w:b/>':''}${o&&o.i?'<w:i/>':''}<w:sz w:val="${(o&&o.sz)||base}"/></w:rPr>`;
 const run=(t,o)=>`<w:r>${rpr(o)}<w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
 const tab=o=>`<w:r>${rpr(o)}<w:tab/></w:r>`;
 const rt=pos=>`<w:tab w:val="right" w:pos="${pos}"/>`;
 const para=(inner,o)=>{o=o||{};return `<w:p><w:pPr>${o.bdr?`<w:pBdr><w:bottom w:val="single" w:sz="${o.bdr}" w:space="1" w:color="000000"/></w:pBdr>`:''}${o.shd?'<w:shd w:val="clear" w:color="auto" w:fill="E4E4E4"/>':''}${o.tabs?'<w:tabs>'+o.tabs+'</w:tabs>':''}<w:spacing w:before="${o.before||0}" w:after="${o.after==null?30:o.after}" w:line="250" w:lineRule="auto"/>${o.ind?`<w:ind w:left="${o.ind}" w:hanging="${o.hang||0}"/>`:''}${o.jc?`<w:jc w:val="${o.jc}"/>`:''}</w:pPr>${inner}</w:p>`};
 const img=(el,mw,mh)=>{const m=(el.src||'').match(/^data:image\/(png|jpe?g|gif);base64,(.*)$/);if(!m)return '';
  if(!mid[el.src]){media.push({ext:m[1]==='jpeg'?'jpg':m[1],data:m[2]});mid[el.src]=media.length}
  const w=el.naturalWidth||200,h=el.naturalHeight||200,k=Math.min(mw/w,mh/h,1),cx=Math.round(w*k*9525),cy=Math.round(h*k*9525),n=did++;
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${n}" name="Picture ${n}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="p${n}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rImg${mid[el.src]}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`};
 const conv=cp=>[...cp.children].flatMap(k=>k.className==='hdr'?[...k.children]:[k]).map(el=>{
  const c=el.className,sp=[...el.children].map(k=>k.textContent),B={b:1};
  if(c==='h1'){const im=el.querySelector('img');return para((im?img(im,200,36)+run('  '):'')+run(el.textContent.trim(),{b:1,sz:Math.round(base*1.9)}),{jc:'center',after:80})}
  if(c==='h2')return para(run(sp[0],B)+tab()+run(sp[1],B)+tab()+run(sp[2],B),{tabs:`<w:tab w:val="center" w:pos="${W/2}"/>`+rt(W)});
  if(c==='h3')return para(run(el.textContent,B),{jc:'center'});
  if(c==='h4')return para(run(sp[0],B)+tab()+run(sp[1],B),{tabs:rt(W),bdr:8,after:80});
  if(c==='sec')return para(run(sp[0],B)+tab()+run(sp[1],B),{tabs:rt(W),before:100,bdr:sty==='line'?4:0,shd:sty==='shade'});
  if(c==='q'){const n=el.querySelector('.n');return n?para(run(sp[0])+tab()+run(sp[1]),{ind:360,hang:360}):para(run(el.textContent))}
  if(c==='opt')return para(run(sp.join('      ')),{ind:360});
  if(c==='im'){const im=el.querySelector('img');return para(im?img(im,W/15*.7,144):run(el.textContent),{jc:'center',before:80,after:80})}
  if(c==='ln')return para('',{bdr:4,before:240,ind:360});
  if(el.tagName==='TABLE')return [...el.rows].map(r=>{const t=[...r.cells].map(d=>d.textContent),h=r.cells[0].tagName==='TH',o=h?B:null;
   return para(run(t[0],o)+tab()+run(t[1],o)+tab()+run(t[2],o),{ind:360,tabs:rt(Math.round(W*.52))+`<w:tab w:val="left" w:pos="${Math.round(W*.57)}"/>`})}).join('');
  return para(run(el.textContent));
 }).join('');
 const sheets=[...document.querySelectorAll('#out .sheet')],brk='<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/></w:pPr><w:r><w:rPr><w:sz w:val="2"/></w:rPr><w:br w:type="page"/></w:r></w:p>';
 let body='';
 sheets.forEach((sh,i)=>{
  const cp=pt?sh.firstChild:sh.querySelector('.cp'),ps=conv(cp);
  if(pt)body+=ps;
  else{const cw=7909,c=(extra)=>`<w:tc><w:tcPr><w:tcW w:w="${cw}" w:type="dxa"/>${extra}</w:tcPr>${ps}</w:tc>`;
   body+=`<w:tbl><w:tblPr><w:tblW w:w="${cw*2}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="${cw}"/><w:gridCol w:w="${cw}"/></w:tblGrid><w:tr>${c('<w:tcMar><w:right w:w="280" w:type="dxa"/></w:tcMar>')}${c('<w:tcBorders><w:left w:val="dashed" w:sz="6" w:space="0" w:color="000000"/></w:tcBorders><w:tcMar><w:left w:w="280" w:type="dxa"/></w:tcMar>')}</w:tr></w:tbl>`}
  body+=i<sheets.length-1?brk:'<w:p/>'});
 const sect=pt?'<w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="800" w:right="800" w:bottom="800" w:left="800" w:header="0" w:footer="0" w:gutter="0"/>':'<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="510" w:right="510" w:bottom="510" w:left="510" w:header="0" w:footer="0" w:gutter="0"/>';
 const X='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',z=new JSZip();
 z.file('[Content_Types].xml',X+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="gif" ContentType="image/gif"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
 z.file('_rels/.rels',X+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 z.file('word/_rels/document.xml.rels',X+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+media.map((m,i)=>`<Relationship Id="rImg${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${i+1}.${m.ext}"/>`).join('')+'</Relationships>');
 media.forEach((m,i)=>z.file(`word/media/image${i+1}.${m.ext}`,m.data,{base64:true}));
 z.file('word/document.xml',X+`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${body}<w:sectPr>${sect}</w:sectPr></w:body></w:document>`);
 return z.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})}
$('dl').onclick=async()=>{
 $('pnote').textContent='Making the Word file...';
 try{const blob=await buildDocx(),nm=('Class-'+$('cls').value+'-'+$('sub').value).replace(/[^A-Za-z0-9-]+/g,'-')+'.docx';
  const r=await saveBlob(nm,blob);if(r==='ok')histNote(saveHist('Word download'));
  $('pnote').textContent=r==='declined'?'Download cancelled.':'Word file ready. Open it in Word to edit. Spacing may differ a little from the preview.'}
 catch(err){$('pnote').textContent='Could not make the Word file: '+(err&&err.message||err)}};
$('apptheme').onchange=()=>{const v=$('apptheme').value;v==='auto'?document.documentElement.removeAttribute('data-theme'):document.documentElement.setAttribute('data-theme',v)};
$('print').onclick=()=>{histNote(saveHist('Printed'));try{window.print()}catch(x){$('pnote').textContent='Printing is blocked here. Use "Open in new tab to print".'}};
$('print2').onclick=()=>{histNote(saveHist('Printed'));
 const css=[...document.styleSheets].map(ss=>{try{return [...ss.cssRules].map(r=>r.cssText).join('\n')}catch(x){return ''}}).join('\n'),lk='<link rel="stylesheet" href="'+new URL('style.css',location.href).href+'">';
 const html='<!DOCTYPE html><html><head><meta charset="utf-8"><title>Question paper</title><link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap" rel="stylesheet">'+lk+'<style>'+css+'body{background:#fff!important;display:block}.noprint{display:none}.sheet{margin:0 auto;box-shadow:none;break-after:page}</style></head><body>'+$('out').innerHTML+'<script>setTimeout(function(){window.print()},700)<\/script></body></html>';
 let w=null;try{w=window.open('','_blank')}catch(x){}
 if(w){w.document.open();w.document.write(html);w.document.close()}
 else $('pnote').innerHTML='Your browser blocked the new tab. Allow pop-ups, or open this page in a full browser tab and press <b>Ctrl+P</b>.'};
/* ---------- History + dashboard ---------- */
const HK='qpm.history.v1';let curId=null;
const hload=()=>{try{const a=JSON.parse(localStorage.getItem(HK)||'[]');return Array.isArray(a)?a:[]}catch(x){return[]}};
const hsave=a=>{try{localStorage.setItem(HK,JSON.stringify(a));return true}catch(x){return false}};
const FIELDS=['cls','sub','exam','marks','time','campus','school','fs','ori','pstyle','pcustom'];
function saveHist(how){
 const a=hload(),now=Date.now();
 if(!curId)curId='p'+now.toString(36)+Math.random().toString(36).slice(2,6);
 const i=a.findIndex(r=>r.id===curId),rec={id:curId,created:i>=0?a[i].created:now,updated:now,how,text:$('txt').value,pfont:$('pfont').value,pages:document.querySelectorAll('#out .sheet').length};
 FIELDS.forEach(k=>rec[k]=$(k).value);
 if(i>=0)a[i]=rec;else a.unshift(rec);
 return hsave(a)}
const histNote=ok=>{$('hmsg').textContent=ok?'Saved in the dashboard history.':'Could not save history (browser storage is full or blocked).'};
const fdate=t=>new Date(t).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'});
function dash(){
 const a=hload(),q=$('q').value.toLowerCase().trim();
 const cls=[...new Set(a.map(r=>r.cls))].sort((x,y)=>classNum(x)-classNum(y)),cur=$('fc').value;
 $('fc').innerHTML='<option value="">All classes</option>'+cls.map(c=>`<option>${e(c)}</option>`).join('');$('fc').value=cls.includes(cur)?cur:'';
 const subs=new Set(a.map(r=>(r.sub||'').toLowerCase()));
 const last=a.reduce((m,r)=>Math.max(m,r.updated||0),0);
 $('stats').innerHTML=`<div class="stat"><b>${a.length}</b><span>Papers created</span></div><div class="stat"><b>${cls.length}</b><span>Classes covered</span></div><div class="stat"><b>${subs.size}</b><span>Subjects</span></div><div class="stat"><b style="font-size:16px;padding:6px 0">${last?fdate(last):'–'}</b><span>Last updated</span></div>`
  +(a.length?'<div class="chips" style="grid-column:1/-1">'+cls.map(c=>`<span class="chip">Class ${e(c)}: ${a.filter(r=>r.cls===c).length}</span>`).join('')+'</div>':'');
 const f=a.filter(r=>(!$('fc').value||r.cls===$('fc').value)&&(!q||(r.cls+' '+r.sub+' '+r.exam).toLowerCase().includes(q))).sort((x,y)=>y.updated-x.updated);
 $('list').innerHTML=f.length?f.map(r=>`<div class="card"><div><b>${r.cls?'Class '+e(r.cls)+' · ':''}${e(r.sub)}</b><div class="s" style="margin:2px 0">${e(r.exam)} · ${e(r.marks)} · ${e(r.time)} · ${r.pages||'?'} page(s)</div><div class="s" style="margin:0">${e(r.how||'Saved')} · ${fdate(r.updated)}</div></div><div><button data-o="${r.id}">Open</button><button class="g" data-d="${r.id}">Delete</button></div></div>`).join('')
  :'<p class="s">'+(a.length?'No paper matches your search.':'No papers yet. Click “+ New paper”, then press Save to history, Print or Download to keep it here.')+'</p>'}
function show(v){$('viewD').hidden=v!=='D';$('viewE').hidden=v!=='E';$('tabD').classList.toggle('on',v==='D');$('tabD').classList.toggle('g',v!=='D');$('tabE').classList.toggle('on',v==='E');$('tabE').classList.toggle('g',v!=='E');
 if(v==='D')dash();else render()}
function openRec(id){const r=hload().find(x=>x.id===id);if(!r)return;
 FIELDS.forEach(k=>{if(r[k]!=null)$(k).value=r[k]});
 $('pfont').value=FL.some(f=>f[0]===r.pfont)||r.pfont==='__custom'?r.pfont:'Cambria';$('pcustom').hidden=$('pfont').value!=='__custom';
 $('txt').value=r.text||'';curId=id;$('hmsg').textContent='';$('ppw').hidden=true;show('E')}
$('tabD').onclick=()=>show('D');$('tabE').onclick=()=>show('E');
$('newp').onclick=()=>{curId=null;$('txt').value='';$('note').textContent='';$('ppw').hidden=true;$('hmsg').textContent='';show('E')};
$('save').onclick=()=>histNote(saveHist('Saved'));
$('q').oninput=dash;$('fc').onchange=dash;
$('list').onclick=v=>{const b=v.target.closest('button');if(!b)return;
 if(b.dataset.o)return openRec(b.dataset.o);
 if(b.dataset.d){if(b.dataset.sure){hsave(hload().filter(r=>r.id!==b.dataset.d));if(curId===b.dataset.d)curId=null;dash()}
  else{b.dataset.sure='1';b.textContent='Sure? Delete'}}};
$('exp').onclick=async()=>{await saveBlob('paper-history-backup.json',new Blob([JSON.stringify(hload(),null,1)],{type:'application/json'}))};
$('impb').onclick=()=>$('imp').click();
$('imp').onchange=async v=>{const f=v.target.files[0];if(!f)return;
 try{const n=JSON.parse(await f.text());if(!Array.isArray(n))throw 0;const a=hload(),ids=new Set(a.map(r=>r.id));let k=0;
  n.forEach(r=>{if(r&&r.id&&r.cls!=null&&!ids.has(r.id)){a.push(r);k++}});hsave(a);dash();$('hnote').textContent='Restored '+k+' paper(s) from backup.'}
 catch(x){$('hnote').textContent='That file is not a valid backup.'}};
$('pfont').innerHTML=FL.map(([n,g])=>`<option value="${n}" style="font-family:'${n}',${g}">${n}</option>`).join('')+'<option value="__custom">Other (type a font name)…</option>';
$('pfont').value='Cambria';
$('pfont').addEventListener('change',()=>{$('pcustom').hidden=$('pfont').value!=='__custom'});
$('pcustom').addEventListener('input',render);

/* ---------- One upload box: Word, PDF, photo, scan, text ---------- */
let PHOTOS=[],SMP=null,SLIM=null,AB=null;
(async()=>{try{if(window.claude&&claude.use){SMP=await claude.use('sample');if(SMP){SLIM=await SMP.limits().catch(()=>null);if(!(SLIM&&SLIM.images))SMP=null}}}catch(x){SMP=null}
 $('rmw').hidden=!SMP;$('eng').textContent=SMP?'Photo reader: Claude. It can read handwriting well.':'Photo reader: built-in. It works for printed or typed text only. Handwriting will not read well.'})();
const loadScript=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)});
const OCR_PROMPT=`Type out the school question paper shown in the attached photo(s). Several photos are consecutive pages of one paper. If the same paper appears twice side by side, type it ONCE only.
Reply with plain text only, in exactly this format:
- If the paper shows them, put the header details on the first line as: #HEADER school=GAUTHAMI TECHNO SCHOOL; class=IV; subject=EVS; marks=20M; time=1 Hr; exam=SUMMATIVE ASSESSMENT - I
- Leave out any header detail the paper does not show.
- Each section heading on its own line: Roman numeral followed by a dot, the title, then the marks at the end exactly as written, for example: I. Choose the correct answer. 4 x 1 = 4M
- Each question on its own line starting with its number and a dot, for example: 1. Which part of the plant makes food? ( )
- Put all multiple-choice options on ONE line: a) Root b) Stem c) Leaf d) Flower
- Items that sit side by side on one line (like 1. word 2. word 3. word) stay on one line.
- Write answer brackets as ( )
- For match the following: first a line "A | B", then one line per row such as: 1. Horse | a. Hive
- Where a diagram or picture is drawn, write [image] on its own line.
- Where blank answer lines are drawn, write [lines 2] using the number of lines.
Keep Hindi, Sanskrit, Telugu or any other script exactly as written, in its own script. Copy the wording exactly, including spelling mistakes. Write [?] for any word you cannot read. No comments, no markdown.`;

const shrink=f=>new Promise(res=>{const u=URL.createObjectURL(f),i=new Image();
 i.onload=()=>{const k=Math.min(1,1800/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);
  c.getContext('2d').drawImage(i,0,0,c.width,c.height);c.toBlob(b=>{URL.revokeObjectURL(u);res(b||f)},'image/jpeg',.88)};
 i.onerror=()=>{URL.revokeObjectURL(u);res(f)};i.src=u});
function takeHeader(t){const d={};let m;
 const text=t.split('\n').filter((x,i)=>{if(i>=8)return true;
  if(m=x.match(/Class\s*:\s*(\S+)\s+(.*?)\s+Marks\s*:\s*(\S+)/i)){d.cls=m[1];d.campus=m[2];d.marks=m[3];return false}
  if(m=x.match(/Sub\s*:\s*(\S+)\s+(.*?)\s+Time\s*:\s*(.+?)\s*$/i)){d.sub=m[1];d.exam=m[2];d.time=m[3];return false}
  if((SCH.test(x)||/techno school/i.test(x))&&x.length<60){d.school=x.trim();return false}
  return true}).join('\n');return{t:text,d}}
async function viaClaude(){
 AB=new AbortController();const imgs=await Promise.all(PHOTOS.map(shrink));
 const r=await SMP(OCR_PROMPT,{images:imgs,modelTier:$('rmode').value,signal:AB.signal,
  onText:o=>{$('txt').value=o.text.replace(/^#HEADER.*\n?/i,'');$('note').textContent='Reading... '+o.text.length+' characters so far'}});
 let t=r.text.replace(/^```\w*\n?|```$/gm,'').trim();const d={};
 const m=t.match(/^#HEADER\s*(.*)$/mi);
 if(m){t=t.replace(m[0],'');const K={school:'school',class:'cls',subject:'sub',marks:'marks',time:'time',exam:'exam'};
  m[1].split(';').forEach(p=>{const i=p.indexOf('=');if(i>0){const k=K[p.slice(0,i).trim().toLowerCase()],v=p.slice(i+1).trim();if(k&&v)d[k]=v}})}
 return{t,d}}
async function viaTesseract(){
 if(!window.Tesseract)await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
 const out=[];
 for(let i=0;i<PHOTOS.length;i++){
  const r=await Tesseract.recognize(PHOTOS[i],'eng',{logger:m=>{if(m.status==='recognizing text')$('note').textContent='Reading page '+(i+1)+' of '+PHOTOS.length+'... '+Math.round(m.progress*100)+'%'}});
  out.push(r.data.text)}
 return takeHeader(out.join('\n').split('\n').map(l=>l.replace(/\|/g,'I').trim().replace(/^(\d{1,2})\s*[.):,]?\s+(?=\S)/,'$1. ')).filter(l=>l.length>1).join('\n'))}
async function pdfPages(f){
 if(!window.pdfjsLib){await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'}
 const pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise,out=[];
 for(let i=1;i<=Math.min(pdf.numPages,6);i++){const pg=await pdf.getPage(i),vp=pg.getViewport({scale:1.6}),c=document.createElement('canvas');
  c.width=vp.width;c.height=vp.height;await pg.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;
  out.push(await new Promise(r=>c.toBlob(r,'image/jpeg',.88)))}
 return out}
const tail=miss=>' Paper details were updated from the file.'+(miss.length?' Not found in the file: '+miss.join(', ')+'. Please fill them in.':'');
async function handleFiles(files){
 files=[...files];if(!files.length)return;
 const ext=f=>(f.name.split('.').pop()||'').toLowerCase();
 const isImg=f=>(f.type||'').startsWith('image/')||/^(jpe?g|png|webp|gif|bmp|heic|heif|tiff?)$/.test(ext(f));
 const docs=files.filter(f=>/^(docx|txt|md|csv)$/.test(ext(f))),pics=files.filter(f=>isImg(f)||ext(f)==='pdf');
 if(!docs.length&&!pics.length){$('note').textContent='This file type is not supported. Please upload a Word file (.docx), a PDF, a photo or scan, or a text file. For an old .doc file, open it in Word and use Save As .docx first.';return}
 if(docs.length&&pics.length){$('note').textContent='Please upload either a Word/text file or photos/PDF, not both together.';return}
 $('up').disabled=true;$('stop').hidden=true;
 try{
  if(docs.length){const f=docs[0];$('note').textContent='Reading file...';
   const text=ext(f)==='docx'?(await mammoth.extractRawText({arrayBuffer:await f.arrayBuffer()})).value:await f.text();
   PAPERS=splitPapers(text);$('pp').innerHTML=PAPERS.map((p,i)=>`<option value="${i}">${e(p.label)}</option>`).join('');$('ppw').hidden=PAPERS.length<2;
   const miss=loadPaper(0);
   $('note').textContent='Loaded '+f.name+(PAPERS.length>1?' – '+PAPERS.length+' papers found. Choose one below.':'.')+tail(miss)}
  else{$('ppw').hidden=true;$('note').textContent='Preparing...';
   let pages=[];for(const f of pics)pages=pages.concat(ext(f)==='pdf'?await pdfPages(f):[f]);
   PHOTOS=pages;$('stop').hidden=!SMP;$('note').textContent=SMP?'Starting...':'Loading the text reader...';
   const r=SMP?await viaClaude():await viaTesseract();
   curId=null;const miss=applyDetails(r.d);$('txt').value=clean(r.t);render();
   $('note').textContent='Done.'+tail(miss)+' Read the questions carefully and fix any wrong words.'}}
 catch(err){const c=err&&err.code;
  if(c==='cancelled'){curId=null;$('txt').value=clean($('txt').value);render();$('note').textContent='Stopped. The text read so far is kept.'}
  else $('note').textContent=c==='declined'||c==='not_granted'?'Reading was cancelled.':c==='rate_limited'?'Please wait a moment and try again.':'Could not read this file. '+(docs.length?'Please check it is a valid .docx file.':SMP?'Try a clearer, well-lit photo.':'The text reader could not start. Check the internet connection.')}
 $('up').disabled=false;$('stop').hidden=true;$('up').value=''}
$('up').onchange=v=>handleFiles(v.target.files);
$('stop').onclick=()=>{if(AB)AB.abort()};

render();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(render);
dash();
