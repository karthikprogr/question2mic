/**
 * docxExport.js – Build a .docx blob from the rendered sheets
 * Ported faithfully from the original app.js buildDocx()
 */
import { fname, fstack, isPortrait } from './paperUtils.js';

export async function buildDocx(details, sheetElements) {
  const { pfont: pfontVal, pcustom: pcustomVal, fs, ori, pstyle, cls } = details;
  const pt = isPortrait(ori, cls);
  const font = fname(pfontVal, pcustomVal).replace(/["&<>]/g, '');
  const base = Math.round(parseFloat(fs) * 1.5);
  const W = pt ? 10300 : 7500;
  const sty = pstyle;
  const media = [], mid = {};
  let did = 1;

  const x = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const rpr = o => `<w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/>${o && o.b ? '<w:b/>' : ''}${o && o.i ? '<w:i/>' : ''}<w:sz w:val="${(o && o.sz) || base}"/></w:rPr>`;
  const run = (t, o) => `<w:r>${rpr(o)}<w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
  const tab = o => `<w:r>${rpr(o)}<w:tab/></w:r>`;
  const rt = pos => `<w:tab w:val="right" w:pos="${pos}"/>`;
  const para = (inner, o) => {
    o = o || {};
    return `<w:p><w:pPr>${o.bdr ? `<w:pBdr><w:bottom w:val="single" w:sz="${o.bdr}" w:space="1" w:color="000000"/></w:pBdr>` : ''}${o.shd ? '<w:shd w:val="clear" w:color="auto" w:fill="E4E4E4"/>' : ''}${o.tabs ? '<w:tabs>' + o.tabs + '</w:tabs>' : ''}<w:spacing w:before="${o.before || 0}" w:after="${o.after == null ? 30 : o.after}" w:line="250" w:lineRule="auto"/>${o.ind ? `<w:ind w:left="${o.ind}" w:hanging="${o.hang || 0}"/>` : ''}${o.jc ? `<w:jc w:val="${o.jc}"/>` : ''}</w:pPr>${inner}</w:p>`;
  };

  const img = (el, mw, mh) => {
    const m = (el.src || '').match(/^data:image\/(png|jpe?g|gif);base64,(.*)$/);
    if (!m) return '';
    if (!mid[el.src]) { media.push({ ext: m[1] === 'jpeg' ? 'jpg' : m[1], data: m[2] }); mid[el.src] = media.length; }
    const w = el.naturalWidth || 200, h = el.naturalHeight || 200;
    const k = Math.min(mw / w, mh / h, 1);
    const cx = Math.round(w * k * 9525), cy = Math.round(h * k * 9525), n = did++;
    return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${n}" name="Picture ${n}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="p${n}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rImg${mid[el.src]}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
  };

  const conv = cp => [...cp.children].flatMap(k => k.className === 'hdr' ? [...k.children] : [k]).map(el => {
    const c = el.className, sp = [...el.children].map(k => k.textContent), B = { b: 1 };
    if (c === 'h1') { const im = el.querySelector('img'); return para((im ? img(im, 200, 36) + run('  ') : '') + run(el.textContent.trim(), { b: 1, sz: Math.round(base * 1.9) }), { jc: 'center', after: 80 }); }
    if (c === 'h2') return para(run(sp[0], B) + tab() + run(sp[1], B) + tab() + run(sp[2], B), { tabs: `<w:tab w:val="center" w:pos="${W / 2}"/>` + rt(W) });
    if (c === 'h3') return para(run(el.textContent, B), { jc: 'center' });
    if (c === 'h4') return para(run(sp[0], B) + tab() + run(sp[1], B), { tabs: rt(W), bdr: 8, after: 80 });
    if (c === 'sec') return para(run(sp[0], B) + tab() + run(sp[1], B), { tabs: rt(W), before: 100, bdr: sty === 'line' ? 4 : 0, shd: sty === 'shade' });
    if (c && c.includes('q-inline')) return para(run(sp.join('       ')), { ind: 360 });
    if (c === 'sheet-foot') return para(run(el.textContent, B), { jc: 'center' });
    if (c === 'q') { const n = el.querySelector('.n'); return n ? para(run(sp[0]) + tab() + run(sp[1]), { ind: 360, hang: 360 }) : para(run(el.textContent)); }
    if (c === 'opt') return para(run(sp.join('      ')), { ind: 360 });
    if (c === 'im') { const im = el.querySelector('img'); return para(im ? img(im, W / 15 * .7, 144) : run(el.textContent), { jc: 'center', before: 80, after: 80 }); }
    if (c === 'ln') return para('', { bdr: 4, before: 240, ind: 360 });
    if (el.tagName === 'TABLE') return [...el.rows].map(r => {
      const t = [...r.cells].map(d => d.textContent), h = r.cells[0].tagName === 'TH', o = h ? B : null;
      return para(run(t[0], o) + tab() + run(t[1], o) + tab() + run(t[2], o), { ind: 360, tabs: rt(Math.round(W * .52)) + `<w:tab w:val="left" w:pos="${Math.round(W * .57)}"/>` });
    }).join('');
    return para(run(el.textContent));
  }).join('');

  const brk = '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/></w:pPr><w:r><w:rPr><w:sz w:val="2"/></w:rPr><w:br w:type="page"/></w:r></w:p>';
  let body = '';
  sheetElements.forEach((sh, i) => {
    const cp = pt ? sh.firstChild : sh.querySelector('.cp'), ps = conv(cp);
    if (pt) { body += ps; }
    else {
      const cw = 7909;
      const c = extra => `<w:tc><w:tcPr><w:tcW w:w="${cw}" w:type="dxa"/>${extra}</w:tcPr>${ps}</w:tc>`;
      body += `<w:tbl><w:tblPr><w:tblW w:w="${cw * 2}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="${cw}"/><w:gridCol w:w="${cw}"/></w:tblGrid><w:tr>${c('<w:tcMar><w:right w:w="280" w:type="dxa"/></w:tcMar>')}${c('<w:tcBorders><w:left w:val="dashed" w:sz="6" w:space="0" w:color="000000"/></w:tcBorders><w:tcMar><w:left w:w="280" w:type="dxa"/></w:tcMar>')}</w:tr></w:tbl>`;
    }
    body += i < sheetElements.length - 1 ? brk : '<w:p/>';
  });

  const sect = pt
    ? '<w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="800" w:right="800" w:bottom="800" w:left="800" w:header="0" w:footer="0" w:gutter="0"/>'
    : '<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="510" w:right="510" w:bottom="510" w:left="510" w:header="0" w:footer="0" w:gutter="0"/>';

  const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const z = new window.JSZip();
  z.file('[Content_Types].xml', X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="gif" ContentType="image/gif"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  z.file('_rels/.rels', X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  z.file('word/_rels/document.xml.rels', X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + media.map((m, i) => `<Relationship Id="rImg${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${i + 1}.${m.ext}"/>`).join('') + '</Relationships>');
  media.forEach((m, i) => z.file(`word/media/image${i + 1}.${m.ext}`, m.data, { base64: true }));
  z.file('word/document.xml', X + `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${body}<w:sectPr>${sect}</w:sectPr></w:body></w:document>`);
  return z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}
