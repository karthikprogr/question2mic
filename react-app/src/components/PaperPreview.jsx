import { useEffect, useRef, useCallback, useState } from 'react';
import { blocks, buildHead, isPortrait, fstack } from '../paperUtils.js';
import Toolbar from './Toolbar.jsx';

/**
 * PaperPreview – live paper preview with inline editing.
 *
 * The entire paper column (.cp / sheet inner div) is one contenteditable
 * surface — exactly like Word. Selection can span multiple lines, toolbar
 * formatting applies across the selection, and images can be pasted.
 *
 * On blur the full innerHTML is diffed line-by-line against data-src indices
 * to sync changes back to the textarea.
 */
export default function PaperPreview({ text, details, logo, images, setText }) {
  const outRef  = useRef(null);
  const warnRef = useRef(null);
  const skipRef = useRef(false);   // prevents re-render loop after a sync
  const textRef = useRef(text);
  useEffect(() => { textRef.current = text; }, [text]);

  const [ctxMenu, setCtxMenu] = useState(null);

  // ── Sync the whole editable surface back to text ───────────────────────
  // Walk every [data-src] element inside the first .cp (or sheet inner div)
  // and update the matching line in the text state.
  const syncAll = useCallback(() => {
    if (!outRef.current) return;
    const lines = textRef.current.split('\n');
    let changed = false;
    const seen = new Set();   // prevent double-counting from both .cp copies

    outRef.current.querySelectorAll('.sheet').forEach(sheet => {
      // Always read from the FIRST .cp (or .sheet-body for portrait)
      const readFrom = sheet.querySelector('.cp[contenteditable]')
                    || sheet.querySelector('.sheet-body[contenteditable]');
      if (!readFrom) return;

      readFrom.querySelectorAll('[data-src]').forEach(el => {
        const idx = parseInt(el.getAttribute('data-src'), 10);
        if (isNaN(idx) || idx >= lines.length || seen.has(idx)) return;
        seen.add(idx);

        if (el.tagName === 'TABLE') return;
        if (el.tagName === 'TR') {
          const cells = [...el.cells].map(c => (c.innerText || c.textContent || '').trim());
          const reconstructed = cells.join(' | ');
          if (lines[idx] !== reconstructed) { lines[idx] = reconstructed; changed = true; }
          return;
        }
        const edited = (el.innerText || el.textContent || '')
          .replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
        if (lines[idx] !== edited) { lines[idx] = edited; changed = true; }
      });
    });

    if (changed) {
      skipRef.current = true;
      setText(lines.join('\n'));
    }
  }, [setText]);

  // ── Insert table at cursor ─────────────────────────────────────────────
  const handleInsertTable = useCallback((rows, cols) => {
    const hdr  = Array.from({ length: cols }, (_, i) =>
      `<th style="border:1px solid #000;padding:3px 6px;background:#f0f0f0;font-weight:700">Col ${i + 1}</th>`
    ).join('');
    const emptyRow = Array.from({ length: cols }, () =>
      `<td style="border:1px solid #000;padding:3px 6px;min-width:40px">&nbsp;</td>`
    ).join('');
    const tbody = Array.from({ length: rows }, () => `<tr>${emptyRow}</tr>`).join('');
    const html  = `<br><table style="border-collapse:collapse;width:100%;margin:4px 0">` +
                  `<thead><tr>${hdr}</tr></thead><tbody>${tbody}</tbody></table><br>`;
    document.execCommand('insertHTML', false, html);
  }, []);

  // ── @page orientation CSS ──────────────────────────────────────────────
  useEffect(() => {
    let st = document.getElementById('ps');
    if (!st) { st = document.createElement('style'); st.id = 'ps'; document.head.appendChild(st); }
    const pt = isPortrait(details.ori, details.cls);
    st.textContent = `@page{size:A4 ${pt ? 'portrait' : 'landscape'};margin:0}`;
  }, [details.ori, details.cls]);

  // ── Main render ────────────────────────────────────────────────────────
  useEffect(() => {
    if (skipRef.current) { skipRef.current = false; return; }

    document.documentElement.style.setProperty('--fs', details.fs);
    const pt = isPortrait(details.ori, details.cls);
    const sa = () =>
      `st-${details.pstyle}" style="font-family:${fstack(details.pfont, details.pcustom)};font-size:${details.fs}`;

    const sheetHtml = (c) => {
      const foot = (details.pstyle === 'border' && pt) ? '<div class="sheet-foot">0</div>' : '';
      if (pt) {
        return `<div class="sheet pt ${sa()}"><div contenteditable="true" class="sheet-body">${c}${foot}</div></div>`;
      }
      // Landscape: each .cp is its own contenteditable so grid layout is preserved.
      // Both columns get the same content — editing either one syncs back to text.
      return (
        `<div class="sheet ${sa()}">` +
          `<div class="two">` +
            `<div class="cp" contenteditable="true">${c}</div>` +
            `<div class="cp" contenteditable="true">${c}</div>` +
          `</div>` +
        `</div>`
      );
    };

    const head = buildHead(details, logo);

    function paginate(bl, withHead) {
      const host = document.createElement('div');
      host.innerHTML =
        `<div class="sheet${pt ? ' pt' : ''} ${sa()};position:fixed;left:-9999px;top:0;margin:0">` +
        `<div class="${pt ? '' : 'two'}"><div class="${pt ? '' : 'cp'}"></div></div></div>`;
      document.body.appendChild(host);
      const sh = host.firstChild, c = sh.firstChild.firstChild;
      const pages = []; let cur = withHead ? head : '', n = 0;
      c.innerHTML = cur;
      bl.forEach(b => {
        c.insertAdjacentHTML('beforeend', b);
        if (sh.scrollHeight > sh.clientHeight + 1 && n > 0) {
          pages.push(cur); cur = b; c.innerHTML = b; n = 1;
        } else { cur += b; n++; }
      });
      if (cur) pages.push(cur);
      host.remove();
      return pages;
    }

    let pages = [];
    let lineOffset = 0;
    text.split(/^\s*\[page\]\s*$/im).forEach((chunk, i) => {
      const bl = blocks(chunk, images, lineOffset);
      pages = pages.concat(paginate(bl, i === 0));
      lineOffset += chunk.split('\n').length + 1;
    });

    if (outRef.current) {
      outRef.current.innerHTML = pages.map((c, i) =>
        `<div class="pl noprint">Page ${i + 1} of ${pages.length} ` +
        `(${i % 2 ? 'back' : 'front'})${pt ? '' : ' – same paper twice, cut in the middle'}</div>` +
        sheetHtml(c)
      ).join('');
    }

    if (warnRef.current) {
      const bad = [];
      document.querySelectorAll('#out .sheet').forEach((x, i) => {
        if (x.scrollHeight > x.clientHeight + 2) bad.push(i + 1);
      });
      warnRef.current.textContent = bad.length
        ? 'Page ' + bad.join(', ') + ' overflows. Reduce the text size.' : '';
    }

    // Fix MathML namespace and trigger MathJax rendering
    // When MathML is inserted via innerHTML, it gets created in HTML namespace
    // We need to recreate it in the proper MathML namespace for MathJax to process it
    const fixMathMLAndTypeset = async () => {
      if (!outRef.current) return;

      // Step 1: Fix all <math> elements to use proper MathML namespace
      const htmlMathElements = outRef.current.querySelectorAll('math');
      console.log('[PaperPreview] Found', htmlMathElements.length, 'math elements to fix');
      
      htmlMathElements.forEach(mathEl => {
        try {
          // Create a proper MathML element with namespace
          const parser = new DOMParser();
          const mathDoc = parser.parseFromString(
            `<math xmlns="http://www.w3.org/1998/Math/MathML">${mathEl.innerHTML}</math>`,
            'application/xml'
          );
          
          const properMathEl = document.importNode(mathDoc.documentElement, true);
          
          // Replace the HTML-namespaced element with the MathML-namespaced one
          mathEl.parentNode.replaceChild(properMathEl, mathEl);
        } catch (err) {
          console.error('[PaperPreview] Failed to fix math element:', err);
        }
      });

      // Step 2: Wait for MathJax and typeset
      if (!window.MathJax) {
        console.warn('[PaperPreview] MathJax not loaded yet');
        return;
      }
      
      // Wait for MathJax.startup.promise if it exists (v3 initialization)
      if (window.MathJax.startup && window.MathJax.startup.promise) {
        await window.MathJax.startup.promise;
      }
      
      if (!window.MathJax.typesetPromise) {
        console.warn('[PaperPreview] MathJax.typesetPromise not available');
        return;
      }
      
      // Give DOM a moment to settle after namespace fixes
      setTimeout(async () => {
        console.log('[PaperPreview] Calling MathJax.typesetPromise()...');
        const mathElements = outRef.current.querySelectorAll('math');
        console.log('[PaperPreview] Typesetting', mathElements.length, 'MathML elements');
        
        try {
          await window.MathJax.typesetPromise([outRef.current]);
          console.log('[PaperPreview] MathJax typesetting complete');
          
          // Log how many mjx-container elements were created (MathJax output)
          const mjxContainers = outRef.current.querySelectorAll('mjx-container');
          console.log('[PaperPreview] Created', mjxContainers.length, 'rendered math containers');
        } catch (err) {
          console.error('[PaperPreview] MathJax typesetting failed:', err);
        }
      }, 100);
    };
    
    fixMathMLAndTypeset();
  }, [text, details, logo, images]);

  // ── Event delegation on #out ───────────────────────────────────────────
  useEffect(() => {
    const out = outRef.current;
    if (!out) return;

    // Sync on blur of any editable surface
    const onBlur = (ev) => {
      // Only sync when focus leaves the paper entirely
      const related = ev.relatedTarget;
      if (related && out.contains(related)) return; // still inside paper
      syncAll();
    };

    // Keyboard shortcuts
    const onKeyDown = (ev) => {
      // Escape → blur
      if (ev.key === 'Escape') {
        skipRef.current = false;
        document.activeElement?.blur();
      }
    };

    // ── Paste handler: support images from clipboard ───────────────────
    const onPaste = (ev) => {
      const items = ev.clipboardData?.items;
      if (!items) return;

      // Check for image items
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          ev.preventDefault();
          const blob = item.getAsFile();
          if (!blob) continue;
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target.result;
            // Insert as inline image at cursor
            const img = `<img src="${dataUrl}" style="max-width:100%;max-height:80mm;display:block;margin:4px 0;" alt="pasted image">`;
            document.execCommand('insertHTML', false, img);
          };
          reader.readAsDataURL(blob);
          return;
        }
      }

      // For plain text paste: strip HTML to avoid cross-block formatting bleed
      const html = ev.clipboardData.getData('text/html');
      const plain = ev.clipboardData.getData('text/plain');
      if (plain) {
        ev.preventDefault();
        document.execCommand('insertText', false, plain);
      }
    };

    // Right-click on table cell → context menu
    const onContextMenu = (ev) => {
      const td = ev.target.closest('td, th');
      if (!td || !out.contains(td)) return;
      ev.preventDefault();
      const outRect = out.getBoundingClientRect();
      setCtxMenu({ x: ev.clientX - outRect.left, y: ev.clientY - outRect.top, td });
    };

    // Click outside context menu → close it
    const onMouseDown = () => setCtxMenu(null);

    out.addEventListener('blur',        onBlur,        true);
    out.addEventListener('keydown',     onKeyDown,     true);
    out.addEventListener('paste',       onPaste,       true);
    out.addEventListener('contextmenu', onContextMenu, true);
    document.addEventListener('mousedown', onMouseDown);

    return () => {
      out.removeEventListener('blur',        onBlur,        true);
      out.removeEventListener('keydown',     onKeyDown,     true);
      out.removeEventListener('paste',       onPaste,       true);
      out.removeEventListener('contextmenu', onContextMenu, true);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [syncAll]);

  // ── Table context-menu actions ─────────────────────────────────────────
  const tableAction = useCallback((action) => {
    const td = ctxMenu?.td;
    if (!td) return;
    const table = td.closest('table');
    const tr    = td.closest('tr');

    const makeCell = (isHeader) => {
      const c = document.createElement(isHeader ? 'th' : 'td');
      c.style.cssText = isHeader
        ? 'border:1px solid #000;padding:3px 6px;background:#f0f0f0;font-weight:700'
        : 'border:1px solid #000;padding:3px 6px;min-width:40px';
      c.innerHTML = '&nbsp;';
      return c;
    };

    if (action === 'insertRowAbove' || action === 'insertRowBelow') {
      const cols = tr.cells.length;
      const newRow = document.createElement('tr');
      for (let i = 0; i < cols; i++) newRow.appendChild(makeCell(false));
      tr.parentNode.insertBefore(newRow,
        action === 'insertRowAbove' ? tr : tr.nextSibling);
    }
    if (action === 'deleteRow' && table.rows.length > 1) tr.remove();

    if (action === 'insertColLeft' || action === 'insertColRight') {
      const idx  = td.cellIndex + (action === 'insertColRight' ? 1 : 0);
      [...table.rows].forEach((r, ri) => {
        const cell = makeCell(ri === 0);
        r.insertBefore(cell, r.cells[idx] || null);
      });
    }
    if (action === 'deleteCol') {
      const idx = td.cellIndex;
      [...table.rows].forEach(r => { if (r.cells.length > 1) r.deleteCell(idx); });
    }
    if (action === 'deleteTable') table.remove();

    setCtxMenu(null);
    syncAll();
  }, [ctxMenu, syncAll]);

  return (
    <div className="preview-wrap">
      {/* ── Word-ribbon toolbar ── */}
      <Toolbar onInsertTable={handleInsertTable} />

      <div id="warn" ref={warnRef} />

      {/* ── Hint bar ── */}
      <div className="edit-hint noprint">
        ✏️ Click anywhere in the paper to edit — selection works across the whole page like Word.
        Paste images with <kbd>Ctrl+V</kbd>. Right-click a table cell for row/column options.
      </div>

      {/* ── Table context menu ── */}
      {ctxMenu && (
        <div
          className="tb-ctx-menu"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
          onMouseDown={e => e.stopPropagation()}
        >
          <div className="tb-ctx-section">Rows</div>
          <button onMouseDown={() => tableAction('insertRowAbove')}>Insert row above</button>
          <button onMouseDown={() => tableAction('insertRowBelow')}>Insert row below</button>
          <button onMouseDown={() => tableAction('deleteRow')}>Delete row</button>
          <div className="tb-ctx-section">Columns</div>
          <button onMouseDown={() => tableAction('insertColLeft')}>Insert column left</button>
          <button onMouseDown={() => tableAction('insertColRight')}>Insert column right</button>
          <button onMouseDown={() => tableAction('deleteCol')}>Delete column</button>
          <div className="tb-ctx-section">Table</div>
          <button onMouseDown={() => tableAction('deleteTable')} style={{ color: '#c0392b' }}>Delete table</button>
          <button onMouseDown={() => setCtxMenu(null)} style={{ opacity: 0.6 }}>✕ Close</button>
        </div>
      )}

      <div className="sheetbox">
        <div id="out" ref={outRef} />
      </div>
    </div>
  );
}
