/**
 * paperUtils.js – all pure formatting / parsing logic
 * (ported faithfully from the original app.js)
 */

export const FL = [
  ['Cambria','serif'],['Calibri','sans-serif'],['Times New Roman','serif'],
  ['Arial','sans-serif'],['Arial Narrow','sans-serif'],['Arial Black','sans-serif'],
  ['Verdana','sans-serif'],['Tahoma','sans-serif'],['Trebuchet MS','sans-serif'],
  ['Georgia','serif'],['Garamond','serif'],['Book Antiqua','serif'],
  ['Bookman Old Style','serif'],['Palatino Linotype','serif'],['Century','serif'],
  ['Century Gothic','sans-serif'],['Century Schoolbook','serif'],['Candara','sans-serif'],
  ['Constantia','serif'],['Corbel','sans-serif'],['Segoe UI','sans-serif'],
  ['Franklin Gothic Book','sans-serif'],['Gill Sans MT','sans-serif'],
  ['Lucida Sans','sans-serif'],['Rockwell','serif'],['Perpetua','serif'],
  ['Baskerville Old Face','serif'],['Calisto MT','serif'],['Comic Sans MS','cursive'],
  ['Courier New','monospace'],['Consolas','monospace'],['Lucida Console','monospace'],
  ['Mangal','serif'],['Nirmala UI','sans-serif'],['Kokila','serif'],
  ['Aparajita','serif'],['Utsaah','serif'],['Gautami','sans-serif'],
  ['Vani','sans-serif'],['Lora','serif'],['Noto Serif','serif'],
  ['Nunito Sans','sans-serif'],
];

// HTML-escape
export const e = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// escape + replace blank brackets
export const fx = s => e(s).replace(/\( \)/g, '(\u2003\u2003)');

const RM = /^(?=[IVXL])(X{0,3})(IX|IV|V?I{1,3})([.):\s]|\s*$)/i;
const MK = /(\d+\s*[x×*XcC]\s*\d+\s*=\s*\d+\s*M?|\d+\s*M)\s*[।.\s]*$/i;
const PART = /^Part\s*-?\s*[A-Za-z]\b/i;
const SCH = /^\s*[A-Z][A-Z .&'-]{4,60}\b(SCHOOL|COLLEGE)\s*$/;

export const ROM = {
  I:1,II:2,III:3,IV:4,V:5,VI:6,VII:7,VIII:8,IX:9,X:10,
  XI:11,XII:12,XIII:13,XIV:14,XV:15,XVI:16,XVII:17,XVIII:18,XIX:19,XX:20
};

/** Tidy text that came from Word / OCR */
export function clean(raw) {
  // Auto-correct common OCR corruptions on Sanskrit/Devanagari papers
  let text = String(raw || '')
    .replace(/^गा\s+/gm, 'III. ')
    .replace(/^TTT\s+/gm, 'III. ')
    .replace(/^1\.\s+VII\b/gm, 'VII.')
    .replace(/^1\.\s+VI\b/gm, 'VI.')
    .replace(/^1\.\s+IV\b/gm, 'IV.')
    .replace(/\|\s*2x3=6/gi, '   2 × 3 = 6')
    .replace(/\|\s*3x1=3/gi, '   3 × 1 = 3')
    .replace(/\|\s*3x2=6/gi, '   3 × 2 = 6')
    .replace(/\b2८3\s*=\s*6/gi, '2 × 3 = 6')
    .replace(/\b32\s*=\s*6/gi, '3 × 2 = 6')
    .replace(/\b3c1\s*=\s*3/gi, '3 × 1 = 3')
    .replace(/\bREA\b/g, '2 × 2 = 4')
    // Fix jammed header lines like "80MMaximum Time:" or "80MTime:"
    .replace(/(\d+M)(Maximum\s+Time)/gi, '$1  $2')
    .replace(/(\d+M)(Time\s*:)/gi, '$1  $2')
    .replace(/(Maximum\s+Marks\s*:\s*\d+M)(Maximum\s+Time)/gi, '$1  $2');

  // ── Stitch broken equation fragments ──────────────────────────────────
  // Word equations (OMML) are dropped by mammoth leaving blank lines.
  // Pattern: short non-heading line + 2+ blank lines + continuation fragment.
  // We mark the gap with [?] and join the pieces into one question line.
  const rawLines = text.split('\n');
  const stitched = [];
  let si = 0;
  while (si < rawLines.length) {
    const line = rawLines[si];
    const trimmed = line.trim();
    if (!trimmed) { si++; continue; }

    // Count blank lines after current
    let blanks = 0, j = si + 1;
    while (j < rawLines.length && !rawLines[j].trim()) { blanks++; j++; }
    const nextLine = j < rawLines.length ? rawLines[j].trim() : '';

    const isFragmentLine = trimmed.length < 70 &&
      !/^\d+[.)]\s/.test(trimmed) &&
      !/^[IVXLCDM]+[.):\s]/i.test(trimmed) &&
      !/^Section\s*[-–]?\s*[A-Z]\b/i.test(trimmed) &&
      !/^Part\s*[-–]?\s*[A-Z]\b/i.test(trimmed) &&
      !/^(Maximum|Marks|Sub|Time|Class)\s*:/i.test(trimmed);

    const isContinuationLine = nextLine.length > 0 &&
      !/^\d+[.)]\s/.test(nextLine) &&
      !/^[IVXLCDM]+[.):\s]/i.test(nextLine) &&
      !/^Section\s*[-–]?\s*[A-Z]\b/i.test(nextLine) &&
      // Must start with lowercase or with specific continuation words — not a fresh imperative
      (/^[a-z(]/.test(nextLine) || /^(then|and|prove\s+that|to\s+coincide|or\s+)\b/i.test(nextLine));

    if (isFragmentLine && blanks >= 2 && isContinuationLine) {
      stitched.push(trimmed + ' [?] ' + nextLine);
      si = j + 1;
    } else {
      stitched.push(line);
      si++;
    }
  }
  text = stitched.join('\n');

  const out = []; let k = '', inT = false;
  text.split('\n').forEach(r => {
    r = r.replace(/\u00a0/g, ' ').replace(/&\s*quot;/g, '"').replace(/\s+$/, '');
    if (!r.trim()) { inT = false; return; }
    const ind = /^\s{3,}/.test(r), last = out.length - 1;
    const l = r.trim().replace(/\(\s+\)/g, '( )').replace(/\(\)/g, '( )');
    const dig = /^\d+[.)]/.test(l), lab = /^[a-jA-J][.)]\s/.test(l);
    const parts = l.split(/\s{3,}|\t+/).map(x => x.trim()).filter(Boolean);

    // Explicit Match Header A | B
    if (parts.length === 2 && /^\(?\s*A\s*\)?$/i.test(parts[0]) && /^\(?\s*B\s*\)?$/i.test(parts[1])) {
      out.push('A | B'); k = 'm'; inT = true; return;
    }
    if (/^\d+\s*M$/i.test(l) && k === 'h') { out[last] += '   ' + l; k = ''; return; }

    const isRoman = RM.test(l);
    // Section-A / Section-B / Section-C style headings (Maths/Junior College format)
    const isSectionHead = /^Section\s*[-–]?\s*[A-Z]\b/i.test(l);
    if (isRoman || PART.test(l) || isSectionHead) {
      inT = false;
      const mk = l.match(MK), t = (mk ? l.slice(0, mk.index) : l).trim().replace(/\s+/g, ' ');
      out.push(mk ? t + '   ' + mk[1].replace(/\s+/g, ' ') : t); k = 'h'; return;
    }

    if (ind && last >= 0 && !dig && !lab && (l === '( )' || (!/\( \)/.test(l) && l[0] !== '('))) {
      if (k === 'h') {
        const mk = out[last].match(MK), t = mk ? out[last].slice(0, mk.index).trim() : out[last];
        out[last] = t + ' ' + l + (mk ? '   ' + mk[1] : ''); return;
      }
      if (k === 'q' || k === 'm') { out[last] += ' ' + l; return; }
    }

    // Only convert to match table if we are explicitly inside an A | B table
    if (inT && dig && parts.length >= 2) {
      const b = parts[parts.length - 1];
      if (b !== '( )' && (/^[a-jA-J][.)]\s?\S/.test(b) || inT)) {
        out.push(parts[0] + ' | ' + b); k = 'm'; return;
      }
    }
    out.push(l.replace(/\s{2,}/g, ' ')); k = (dig || lab) ? 'q' : 'p';
  });
  return out.join('\n');
}

/** Turn text into HTML block strings */
export function blocks(txt, images, lineOffset = 0) {
  const B = []; let cur = '', hd = false, tbl = null, tblSrc = -1, mi = 0, ii = 0;
  let curSrc = -1; // source line index of the block being built
  const push = () => { if (cur) { B.push(cur); cur = ''; curSrc = -1; } };
  const fl = () => {
    if (tbl !== null) {
      if (!hd) push();
      // Wrap table with data-src of first table row
      cur += `<table class="m" data-src="${tblSrc}" contenteditable="false">${tbl}</table>`;
      tbl = null; tblSrc = -1; hd = false;
    }
  };
  let lastR = 0;
  txt.split('\n').forEach((raw, ri) => {
    const srcIdx = lineOffset + ri;
    let l = raw.replace(/\u00a0/g, ' ').trim(); if (!l) return; let m;

    // Check if it's a section heading first!
    const hm = l.match(/^([IVXLCDM]+)([.):\s]|\s*$)/i);
    const mk = l.match(MK);
    let isH = PART.test(l);
    // Section-A / Section-B style (Maths / Junior College format)
    if (!isH && /^Section\s*[-–]?\s*[A-Z]\b/i.test(l)) isH = true;
    if (!isH && hm) {
      const romanStr = hm[1].toUpperCase();
      if (ROM[romanStr]) {
        isH = true;
        lastR = ROM[romanStr];
      }
    }
    // If line has marks at the end and is not an individual question item
    if (!isH && mk && !/^\d+[.)]/.test(l) && !l.includes('|') && l.length < 90) {
      isH = true;
    }

    if (isH) {
      fl();
      let t = (mk ? l.slice(0, mk.index) : l).trim();
      t = t.replace(/\s*\|\s*$/, ' ।').trim();
      const mm = mk ? mk[1].replace(/\s*[x×*XcC]\s*/i, ' × ').replace(/\s*=\s*/, ' = ').replace(/\s*(M?)$/i, '$1').trim() : '';
      push();
      cur = `<div class="sec" data-src="${srcIdx}" contenteditable="true"><span>${e(t)}</span><span>${e(mm)}</span></div>`;
      curSrc = srcIdx;
      hd = true; return;
    }

    // Match Table checking (only if genuine table)
    if (l.includes('|')) {
      const [a0, b0] = l.split('|').map(x => x.trim());
      if (tbl === null) { tbl = ''; mi = 0; tblSrc = srcIdx; }
      if (/^[A-Za-z]$/.test(a0) && /^[A-Za-z]$/.test(b0)) {
        tbl += `<tr><th>${e(a0)}</th><th></th><th>${e(b0)}</th></tr>`;
      } else {
        mi++;
        const n = a0.match(/^(\d+)[.)]\s*/), lb = b0.match(/^([a-jA-J])[.)]\s*(.*)$/);
        tbl += `<tr data-src="${srcIdx}"><td>${n ? n[1] : mi}. ${fx(a0.replace(/^\d+[.)]\s*/, ''))}</td><td class="br">(\u2003)</td><td>${lb ? lb[1].toLowerCase() + ') ' + fx(lb[2]) : 'abcdefghij'[mi - 1] + ') ' + fx(b0)}</td></tr>`;
      }
      return;
    }
    fl();

    // Multiple inline numbered questions on one line: e.g. 1. गुरुः   2. सागरः   3. छात्रः
    const inlineItems = l.split(/\s{2,}(?=\d+[.)]\s*)/).filter(Boolean);
    if (inlineItems.length >= 2 && inlineItems.every(it => /^\d+[.)]/.test(it.trim()))) {
      if (!hd) push();
      cur += `<div class="q q-inline" data-src="${srcIdx}" contenteditable="true">` + inlineItems.map(it => {
        const sm = it.trim().match(/^(\d+[.)])\s*(.*)$/);
        return sm ? `<span class="inline-item"><span class="n">${sm[1]}</span> <span>${fx(sm[2])}</span></span>` : `<span>${fx(it)}</span>`;
      }).join('') + '</div>';
      curSrc = srcIdx;
      hd = false;
      return;
    }

    if (/^[a-j][.)]\s/i.test(l) && (/^[a-j]\)/i.test(l) || /\s[b-j][.)]\s/i.test(l))) {
      if (!hd) push();
      cur += `<div class="opt" data-src="${srcIdx}" contenteditable="true">` + l.split(/\s+(?=[a-j][.)]\s)/i).map(p => '<span>' + fx(p) + '</span>').join('') + '</div>';
      curSrc = srcIdx;
    } else if (/^\[image\]$/i.test(l)) {
      const u = images && images[ii++];
      cur += `<div class="im" data-src="${srcIdx}">${u ? `<img src="${u}">` : '<i>[picture]</i>'}</div>`;
      curSrc = srcIdx;
    } else if ((m = l.match(/^\[lines\s*(\d+)\]$/i))) {
      cur += `<div class="ln" data-src="${srcIdx}"></div>`.repeat(+m[1]);
      curSrc = srcIdx;
    } else if ((m = l.match(/^(\d+[.)]|[a-jA-J][.)])\s+(.*)$/))) {
      if (!hd) push();
      cur += `<div class="q" data-src="${srcIdx}" contenteditable="true"><span class="n">${m[1]}</span><span>${fx(m[2])}</span></div>`;
      curSrc = srcIdx;
    } else if ((m = l.match(/[^()]+?\( \)/g)) && m.join('').length >= l.length - 1) {
      if (!hd) push();
      cur += `<div class="opt" data-src="${srcIdx}" contenteditable="true">` + m.map(p => '<span>' + fx(p.trim()) + '</span>').join('') + '</div>';
      curSrc = srcIdx;
    } else {
      if (!hd) push();
      cur += `<div class="q" data-src="${srcIdx}" contenteditable="true"><span>${fx(l)}</span></div>`;
      curSrc = srcIdx;
    }
    hd = false;
  });
  fl(); push(); return B;
}

/** Build the header HTML */
export function buildHead(details, logo) {
  const { school, campus, cls, sub, exam, marks, time } = details;
  const hasSchoolMeta = (cls && cls.trim()) || (campus && campus.trim()) || (time && time.trim());
  const rawMarks = marks ? marks.trim() : '';
  const marksFormatted = rawMarks ? (/^(max\.?\s*marks|marks)/i.test(rawMarks) ? rawMarks : 'MAX. MARKS: ' + rawMarks) : '';

  if (!hasSchoolMeta) {
    // College / Compact Header style (centered College name, centered Exam, centered Subject with MAX. MARKS on right)
    return `<div class="hdr">
      <div class="h1">${logo ? `<img src="${logo}">` : ''}<span>${e(school)}</span></div>
      ${exam && exam.trim() ? `<div class="h3" style="margin:2px 0 3px">${e(exam)}</div>` : ''}
      <div class="h4" style="border-bottom:none;margin-bottom:6px;display:flex;justify-content:center;position:relative">
        <span style="font-weight:700">${e(sub)}</span>
        ${marksFormatted ? `<span style="position:absolute;right:0;font-weight:700">${e(marksFormatted)}</span>` : ''}
      </div>
    </div>`;
  }

  return `<div class="hdr">
    <div class="h1">${logo ? `<img src="${logo}">` : ''}<span>${e(school)}</span></div>
    <div class="h2">
      <span>${cls.trim() ? 'Class : ' + e(cls) : ''}</span>
      <span>${e(campus)}</span>
      <span>${marks.trim() ? 'Marks : ' + e(marks) : ''}</span>
    </div>
    <div class="h3">${e(exam)}</div>
    <div class="h4"><span>Sub : ${e(sub)}</span><span>${time.trim() ? 'Time : ' + e(time) : ''}</span></div>
  </div>`;
}

/** Extract class number from class string */
export function classNum(v) {
  v = (v == null ? '' : v).toUpperCase().replace(/CLASS|STD|GRADE/g, '').replace(/[^A-Z0-9]/g, '');
  const d = v.match(/^(\d+)(ST|ND|RD|TH)?$/); if (d) return +d[1];
  return ({ I:1,II:2,III:3,IV:4,V:5,VI:6,VII:7,VIII:8,IX:9,X:10,XI:11,XII:12 })[v] || 0;
}

/** Is this paper portrait? */
export function isPortrait(oriValue, cls) {
  if (oriValue !== 'auto') return oriValue === 'portrait';
  const n = classNum(cls);
  return n >= 1 && n <= 3;
}

/** Font name helper */
export function fname(pfontValue, pcustomValue) {
  return pfontValue === '__custom' ? (pcustomValue.trim() || 'Cambria') : pfontValue;
}

/** CSS font stack */
export function fstack(pfontValue, pcustomValue) {
  const n = fname(pfontValue, pcustomValue).replace(/['"]/g, '');
  const f = FL.find(x => x[0] === n);
  return "'" + n + "'," + (f ? f[1] : 'serif');
}

/** Build a page-sized sheet HTML */
export function sheetHtml(content, pt, pstyle, pfont, pcustom, fs) {
  const fs2 = fs || '12px';
  const stk = fstack(pfont, pcustom);
  const sc = `st-${pstyle}" style="font-family:${stk};font-size:${fs2}`;
  // Footer (page number) only on portrait border style – never on landscape copies
  const foot = (pstyle === 'border' && pt) ? '<div class="sheet-foot">0</div>' : '';
  if (pt) return `<div class="sheet pt ${sc}"><div>${content}${foot}</div></div>`;
  return `<div class="sheet ${sc}"><div class="two"><div class="cp">${content}</div><div class="cp">${content}</div></div></div>`;
}

/** Split a Word document into multiple papers */
export function splitPapers(t) {
  const raw = t.replace(/\u00a0/g, ' ');
  const L = raw.split('\n');
  const idx = [];
  L.forEach((x, i) => {
    if ((SCH.test(x) || /techno school/i.test(x) || /junior college/i.test(x)) && x.trim().length < 60) idx.push(i);
  });
  if (!idx.length) { L.unshift(''); idx.push(0); }

  // Parse each detected school-header block into a paper object
  const parsed = idx.map((st, k) => {
    const ch = L.slice(st, idx[k + 1] || L.length), H = ch.slice(1, 9), p = {};
    let used = 0, m, paper = '';
    if (ch[0].trim()) p.school = ch[0].trim();
    H.forEach((x, j) => {
      let any = false;
      // Fix jammed "80MMaximum Time:" before matching
      const xf = x
        .replace(/(\d+M)(Maximum\s+Time)/gi, '$1  $2')
        .replace(/(\d+M)(Time\s*:)/gi, '$1  $2');
      if ((m = xf.match(/Class\s*:\s*(\S+)\s+(.*?)\s+Marks\s*:\s*(\S+)/i))) { p.cls = m[1]; p.campus = m[2]; p.marks = m[3]; any = true; }
      else if ((m = xf.match(/Sub\s*:\s*(\S+)\s+(.*?)\s+Time\s*:\s*(.+?)\s*$/i))) { p.sub = m[1]; p.exam = m[2]; p.time = m[3]; any = true; }
      else {
        if ((m = xf.match(/Class\s*:\s*(\S+)/i))) { p.cls = m[1]; any = true; }
        if ((m = xf.match(/(?:Maximum\s+)?Marks\s*:\s*(\S+)/i))) { p.marks = m[1]; any = true; }
        if ((m = xf.match(/Sub(?:ject)?\s*:\s*(\S+)/i))) { p.sub = m[1]; any = true; }
        if ((m = xf.match(/(?:Maximum\s+)?Time\s*:\s*(.+?)\s*$/i))) { p.time = m[1]; any = true; }
        if (/^\s*PAPER\s*-?\s*\d/i.test(x)) { paper = x.trim().replace(/\s+/g, ' '); any = true; }
        // Exam name patterns: "Term-I Exams (MEC-I)", "UNIT - II", "SA-I" etc.
        if (!any && /^(term|unit|sa[-\s]|summative|formative|annual|half|pre)/i.test(x.trim())) {
          p.exam = x.trim(); any = true;
        }
      }
      if (any) used = j + 1; else if (!x.trim() && used === j) used = j + 1;
    });
    if (paper) p.exam = (p.exam || '') + ' (' + paper + ')';
    p.body = ch.slice(1 + used).join('\n');
    p.label = (k + 1) + '. ' + (p.cls ? 'Class ' + p.cls + ' – ' : '') + (p.sub || 'Paper') + (paper ? ' – ' + paper : '');
    return p;
  });

  // ── De-duplicate columns from two-column Word documents ─────────────────
  //
  // A two-column Word document printed in landscape (two-copy format) is read
  // by mammoth column by column. For a 2-page doc it comes out as:
  //   [block A] left-col page 1  → school name detected → paper 0
  //   [block B] right-col page 1 → school name detected → paper 1  (duplicate of A)
  //   [block C] left-col page 2  → no school name → appended to paper 1's body
  //   [block D] right-col page 2 → no school name → also appended to paper 1's body
  //
  // Strategy:
  //   1. Group consecutive papers that share the same school+sub+cls as one
  //      logical paper, taking only the first occurrence of each block.
  //   2. Within the merged body, remove any lines that are exact duplicates of
  //      lines already seen (right-column mirrors of left-column content).
  //
  const isSamePaper = (a, b) =>
    a.school && b.school &&
    a.school.trim().toLowerCase() === b.school.trim().toLowerCase() &&
    (a.sub || '').trim().toLowerCase() === (b.sub || '').trim().toLowerCase() &&
    (a.cls || '').trim().toLowerCase() === (b.cls || '').trim().toLowerCase();

  // Step 1: group duplicates
  const groups = [];
  for (const p of parsed) {
    const last = groups[groups.length - 1];
    if (last && isSamePaper(last[0], p)) {
      last.push(p);
    } else {
      groups.push([p]);
    }
  }

  // Step 2: for each group, merge bodies by deduplicating repeated lines
  return groups.map((grp, gi) => {
    const base = grp[0];
    // Collect all body text from every copy in the group
    const allBodies = grp.map(p => p.body);

    // Deduplicate: split each body into lines, keep only lines not yet seen
    const seen = new Set();
    const mergedLines = [];
    for (const bodyText of allBodies) {
      for (const line of bodyText.split('\n')) {
        const key = line.trim();
        if (!key) continue;           // skip blank lines (we'll join with \n anyway)
        if (!seen.has(key)) {
          seen.add(key);
          mergedLines.push(line);    // preserve original spacing/indentation
        }
      }
    }

    return {
      ...base,
      body: mergedLines.join('\n'),
      label: (gi + 1) + '. ' + (base.cls ? 'Class ' + base.cls + ' – ' : '') +
             (base.sub || 'Paper'),
    };
  });
}

/** Parse header block from OCR text */
export function takeHeader(t) {
  const d = {}; let m;
  const lines = t.split('\n');
  const remaining = [];

  for (let i = 0; i < lines.length; i++) {
    const x = lines[i].trim();
    if (!x) continue;
    if (i < 8) {
      if ((m = x.match(/Class\s*:\s*(\S+)\s+(.*?)\s+Marks\s*:\s*(\S+)/i))) {
        d.cls = m[1]; d.campus = m[2]; d.marks = m[3]; continue;
      }
      if ((m = x.match(/Sub\s*:\s*(\S+)\s+(.*?)\s+Time\s*:\s*(.+?)\s*$/i))) {
        d.sub = m[1]; d.exam = m[2]; d.time = m[3]; continue;
      }
      // Check for College / School Name
      if (/college|school|vidyalaya|academy/i.test(x) && x.length < 60 && !d.school) {
        d.school = x.trim();
        if (/junior college/i.test(x)) {
          d.pstyle = 'border';
          d.cls = '';
          d.campus = '';
          d.time = '';
        }
        continue;
      }
      // Check for Exam Name like UNIT - II or Summative Assessment
      if (/^(unit\s*[-–]\s*[ivx\d]+|summative|formative|term|annual|half\s*yearly|pre-?board)/i.test(x) && !d.exam) {
        d.exam = x.trim();
        continue;
      }
      // Check for Subject and/or MAX. MARKS on same line
      if (/sanskrit|hindi|english|math|science|social|evs|physics|chemistry|biology/i.test(x) || /max\.?\s*marks/i.test(x)) {
        const mkMatch = x.match(/(?:max\.?\s*marks|marks)\s*[:=]?\s*(\d+\S*)/i);
        if (mkMatch) {
          d.marks = mkMatch[1];
          const subPart = x.replace(mkMatch[0], '').replace(/[:=|-]+$/, '').trim();
          if (subPart && !d.sub) d.sub = subPart;
          continue;
        } else if (!d.sub && x.length < 40) {
          d.sub = x.trim();
          continue;
        }
      }
    }
    remaining.push(lines[i]);
  }
  return { t: remaining.join('\n'), d };
}

/** Read a file as a data URL */
export const readDataURL = f => new Promise(r => {
  const x = new FileReader(); x.onload = () => r(x.result); x.readAsDataURL(f);
});

/** Shrink an image file to max 1800px */
export const shrink = f => new Promise(res => {
  const u = URL.createObjectURL(f), i = new Image();
  i.onload = () => {
    const k = Math.min(1, 1800 / Math.max(i.width, i.height));
    const c = document.createElement('canvas');
    c.width = Math.round(i.width * k); c.height = Math.round(i.height * k);
    c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
    c.toBlob(b => { URL.revokeObjectURL(u); res(b || f); }, 'image/jpeg', 0.88);
  };
  i.onerror = () => { URL.revokeObjectURL(u); res(f); };
  i.src = u;
});

/** Load a JS script lazily */
export const loadScript = src => new Promise((ok, no) => {
  const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no;
  document.head.appendChild(s);
});

/** Render PDF pages to image blobs */
export async function pdfPages(f) {
  if (!window.pdfjsLib) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  const pdf = await window.pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise, out = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 6); i++) {
    const pg = await pdf.getPage(i), vp = pg.getViewport({ scale: 1.6 }), c = document.createElement('canvas');
    c.width = vp.width; c.height = vp.height;
    await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    out.push(await new Promise(r => c.toBlob(r, 'image/jpeg', 0.88)));
  }
  return out;
}

/** Format a timestamp for display */
export const fdate = t => new Date(t).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

/** Save a blob as a download */
export async function saveBlob(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  return 'ok';
}

/** History key */
export const HK = 'qpm.history.v1';
export const hload = () => { try { const a = JSON.parse(localStorage.getItem(HK) || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } };
export const hsave = a => { try { localStorage.setItem(HK, JSON.stringify(a)); return true; } catch { return false; } };

export const FIELDS = ['cls','sub','exam','marks','time','campus','school','fs','ori','pstyle','pcustom'];

/** OCR prompt for Claude vision */
export const OCR_PROMPT = `Type out the school question paper shown in the attached photo(s). Several photos are consecutive pages of one paper. If the same paper appears twice side by side, type it ONCE only.
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
