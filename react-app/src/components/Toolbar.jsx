import { useState, useEffect, useCallback, useRef } from 'react';
import { FL } from '../paperUtils.js';

const FONT_SIZES = ['8','9','10','11','12','13','14','16','18','20','22','24','26','28','32','36','48','72'];

/** Thin separator between toolbar groups */
const Sep = () => <span className="tb-sep" />;

/** A single toolbar button */
function TBtn({ title, active, disabled, onCmd, children }) {
  return (
    <button
      type="button"
      title={title}
      className={`tb-btn${active ? ' tb-active' : ''}`}
      disabled={disabled}
      onMouseDown={e => { e.preventDefault(); onCmd && onCmd(); }}
    >
      {children}
    </button>
  );
}

/** Color swatch picker (text / highlight) */
function ColorPicker({ title, icon, cmd, method }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const COLORS = [
    '#000000','#ffffff','#ff0000','#cc0000','#990000',
    '#ff6600','#ffcc00','#ffff00','#99ff00','#00cc00',
    '#009900','#00ffff','#0099ff','#0000ff','#6600cc',
    '#cc00cc','#ff66cc','#996633','#666666','#aaaaaa',
  ];

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <span className="tb-color-wrap" ref={ref}>
      <button
        type="button"
        className="tb-btn tb-color-btn"
        title={title}
        onMouseDown={e => { e.preventDefault(); setOpen(o => !o); }}
      >
        {icon}
      </button>
      {open && (
        <div className="tb-color-pop">
          <div className="tb-color-grid">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                className="tb-swatch"
                style={{ background: c, border: c === '#ffffff' ? '1px solid #ccc' : 'none' }}
                title={c}
                onMouseDown={e => {
                  e.preventDefault();
                  document.execCommand(cmd, false, c);
                  setOpen(false);
                }}
              />
            ))}
          </div>
          <div style={{ padding: '4px 6px', borderTop: '1px solid #e0e0e0' }}>
            <input
              type="color"
              style={{ width: '100%', height: 22, border: 'none', padding: 0, cursor: 'pointer' }}
              onChange={e => { document.execCommand(cmd, false, e.target.value); }}
              onMouseDown={e => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </span>
  );
}

/** Table insertion grid picker */
function TablePicker({ onInsert }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState([0, 0]);
  const ref = useRef(null);
  const MAX = 8;

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <span className="tb-color-wrap" ref={ref}>
      <button
        type="button"
        className="tb-btn"
        title="Insert table"
        onMouseDown={e => { e.preventDefault(); setOpen(o => !o); }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <rect x="0" y="0" width="6" height="6" rx="1"/>
          <rect x="8" y="0" width="6" height="6" rx="1"/>
          <rect x="0" y="8" width="6" height="6" rx="1"/>
          <rect x="8" y="8" width="6" height="6" rx="1"/>
        </svg>
        <span style={{ fontSize: 10, marginLeft: 2 }}>▾</span>
      </button>
      {open && (
        <div className="tb-color-pop tb-table-pop">
          <div className="tb-table-label">
            {hover[0] > 0 ? `${hover[1]} × ${hover[0]} table` : 'Insert table'}
          </div>
          <div className="tb-table-grid">
            {Array.from({ length: MAX }, (_, row) =>
              Array.from({ length: MAX }, (_, col) => (
                <div
                  key={`${row}-${col}`}
                  className={`tb-table-cell${row < hover[0] && col < hover[1] ? ' tb-table-cell-on' : ''}`}
                  onMouseEnter={() => setHover([row + 1, col + 1])}
                  onMouseDown={e => {
                    e.preventDefault();
                    onInsert(row + 1, col + 1);
                    setOpen(false);
                    setHover([0, 0]);
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </span>
  );
}

export default function Toolbar({ onInsertTable }) {
  const [fmt, setFmt] = useState({
    bold: false, italic: false, underline: false, strikethrough: false,
    alignLeft: false, alignCenter: false, alignRight: false, alignJustify: false,
    orderedList: false, unorderedList: false,
    fontSize: '12', fontName: 'Cambria',
  });

  // Poll formatting state from selection
  const updateFmt = useCallback(() => {
    setFmt({
      bold:          document.queryCommandState('bold'),
      italic:        document.queryCommandState('italic'),
      underline:     document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikeThrough'),
      alignLeft:     document.queryCommandState('justifyLeft'),
      alignCenter:   document.queryCommandState('justifyCenter'),
      alignRight:    document.queryCommandState('justifyRight'),
      alignJustify:  document.queryCommandState('justifyFull'),
      orderedList:   document.queryCommandState('insertOrderedList'),
      unorderedList: document.queryCommandState('insertUnorderedList'),
      fontSize:      document.queryCommandValue('fontSize') || '3',
      fontName:      document.queryCommandValue('fontName') || 'Cambria',
    });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', updateFmt);
    document.addEventListener('keyup', updateFmt);
    document.addEventListener('mouseup', updateFmt);
    return () => {
      document.removeEventListener('selectionchange', updateFmt);
      document.removeEventListener('keyup', updateFmt);
      document.removeEventListener('mouseup', updateFmt);
    };
  }, [updateFmt]);

  const cmd = (command, value) => {
    document.execCommand(command, false, value ?? null);
    updateFmt();
  };

  // Font size: execCommand uses 1-7 scale, map to pt
  const PT_TO_SCALE = { '8':1,'9':1,'10':2,'11':2,'12':3,'13':3,'14':4,'16':4,'18':5,'20':5,'22':6,'24':6,'26':6,'28':7,'32':7,'36':7,'48':7,'72':7 };
  const handleFontSize = (pt) => {
    // Use a span with inline style instead for precise control
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    document.execCommand('fontSize', false, '7');
    const spans = document.querySelectorAll('[size="7"]');
    spans.forEach(s => {
      s.removeAttribute('size');
      s.style.fontSize = pt + 'px';
    });
    updateFmt();
  };

  const handleFontFamily = (font) => {
    cmd('fontName', font);
  };

  return (
    <div className="tb-ribbon noprint">
      {/* ── Font family ── */}
      <select
        className="tb-select tb-font-sel"
        title="Font family"
        value={fmt.fontName.replace(/['"]/g, '')}
        onChange={e => handleFontFamily(e.target.value)}
        onMouseDown={e => e.stopPropagation()}
      >
        {FL.map(([n]) => (
          <option key={n} value={n} style={{ fontFamily: `'${n}'` }}>{n}</option>
        ))}
      </select>

      {/* ── Font size ── */}
      <select
        className="tb-select tb-size-sel"
        title="Font size"
        onChange={e => handleFontSize(e.target.value)}
        onMouseDown={e => e.stopPropagation()}
        defaultValue="12"
      >
        {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <Sep />

      {/* ── Text style ── */}
      <TBtn title="Bold (Ctrl+B)"          active={fmt.bold}          onCmd={() => cmd('bold')}>         <b>B</b></TBtn>
      <TBtn title="Italic (Ctrl+I)"        active={fmt.italic}        onCmd={() => cmd('italic')}>       <i>I</i></TBtn>
      <TBtn title="Underline (Ctrl+U)"     active={fmt.underline}     onCmd={() => cmd('underline')}>    <u>U</u></TBtn>
      <TBtn title="Strikethrough"          active={fmt.strikethrough} onCmd={() => cmd('strikeThrough')}><s>S</s></TBtn>

      {/* ── Subscript / Superscript ── */}
      <TBtn title="Subscript"   onCmd={() => cmd('subscript')}>   <sub style={{fontSize:9}}>x</sub></TBtn>
      <TBtn title="Superscript" onCmd={() => cmd('superscript')}> <sup style={{fontSize:9}}>x</sup></TBtn>

      <Sep />

      {/* ── Color ── */}
      <ColorPicker
        title="Text color"
        icon={<span style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}><b style={{fontSize:12,lineHeight:1}}>A</b><span style={{height:3,width:14,background:'#e53935',borderRadius:1}}/></span>}
        cmd="foreColor"
      />
      <ColorPicker
        title="Highlight color"
        icon={<span style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}><span style={{fontSize:11}}>🖍</span><span style={{height:3,width:14,background:'#ffff00',borderRadius:1}}/></span>}
        cmd="hiliteColor"
      />

      <Sep />

      {/* ── Alignment ── */}
      <TBtn title="Align left"    active={fmt.alignLeft}    onCmd={() => cmd('justifyLeft')}>
        <AlignIcon type="left"/>
      </TBtn>
      <TBtn title="Align center"  active={fmt.alignCenter}  onCmd={() => cmd('justifyCenter')}>
        <AlignIcon type="center"/>
      </TBtn>
      <TBtn title="Align right"   active={fmt.alignRight}   onCmd={() => cmd('justifyRight')}>
        <AlignIcon type="right"/>
      </TBtn>
      <TBtn title="Justify"       active={fmt.alignJustify} onCmd={() => cmd('justifyFull')}>
        <AlignIcon type="justify"/>
      </TBtn>

      <Sep />

      {/* ── Lists ── */}
      <TBtn title="Numbered list"  active={fmt.orderedList}   onCmd={() => cmd('insertOrderedList')}>
        <ListIcon ordered />
      </TBtn>
      <TBtn title="Bullet list"    active={fmt.unorderedList} onCmd={() => cmd('insertUnorderedList')}>
        <ListIcon />
      </TBtn>

      {/* ── Indent ── */}
      <TBtn title="Decrease indent" onCmd={() => cmd('outdent')}>
        <IndentIcon out />
      </TBtn>
      <TBtn title="Increase indent" onCmd={() => cmd('indent')}>
        <IndentIcon />
      </TBtn>

      <Sep />

      {/* ── Line spacing ── */}
      <select
        className="tb-select"
        title="Line spacing"
        style={{ width: 64 }}
        onMouseDown={e => e.stopPropagation()}
        onChange={e => {
          const sel = window.getSelection();
          if (!sel || !sel.rangeCount) return;
          const el = sel.getRangeAt(0).commonAncestorContainer;
          const block = el.nodeType === 3 ? el.parentElement : el;
          const editable = block.closest('[contenteditable]');
          if (editable) editable.style.lineHeight = e.target.value;
        }}
        defaultValue="1.3"
      >
        {['1.0','1.15','1.3','1.5','1.75','2.0','2.5'].map(v => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>

      <Sep />

      {/* ── Table ── */}
      <TablePicker onInsert={onInsertTable} />

      <Sep />

      {/* ── Clear formatting ── */}
      <TBtn title="Clear formatting" onCmd={() => cmd('removeFormat')}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 2 l4 10 M6 2 l4 10 M1 8 h8" />
          <line x1="11" y1="3" x2="13" y2="11" strokeWidth="2"/>
        </svg>
      </TBtn>
    </div>
  );
}

/* ── Inline SVG icons ─────────────────────────────────────────────────── */
function AlignIcon({ type }) {
  const lines = {
    left:    [[1,3,13,3],[1,6,9,6],[1,9,13,9],[1,12,9,12]],
    center:  [[2,3,12,3],[4,6,10,6],[2,9,12,9],[4,12,10,12]],
    right:   [[1,3,13,3],[5,6,13,6],[1,9,13,9],[5,12,13,12]],
    justify: [[1,3,13,3],[1,6,13,6],[1,9,13,9],[1,12,13,12]],
  };
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" fill="none">
      {(lines[type]||lines.left).map(([x1,y1,x2,y2],i) =>
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}/>
      )}
    </svg>
  );
}

function ListIcon({ ordered }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" fill="none">
      {ordered
        ? <>
            <text x="0" y="4" fontSize="4" fill="currentColor" stroke="none">1.</text>
            <text x="0" y="8.5" fontSize="4" fill="currentColor" stroke="none">2.</text>
            <text x="0" y="13" fontSize="4" fill="currentColor" stroke="none">3.</text>
          </>
        : <>
            <circle cx="2" cy="3.5" r="1" fill="currentColor" stroke="none"/>
            <circle cx="2" cy="7.5" r="1" fill="currentColor" stroke="none"/>
            <circle cx="2" cy="11.5" r="1" fill="currentColor" stroke="none"/>
          </>
      }
      <line x1="5" y1="3.5" x2="13" y2="3.5"/>
      <line x1="5" y1="7.5" x2="13" y2="7.5"/>
      <line x1="5" y1="11.5" x2="13" y2="11.5"/>
    </svg>
  );
}

function IndentIcon({ out }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" fill="none">
      <line x1="1" y1="2" x2="13" y2="2"/>
      <line x1="1" y1="12" x2="13" y2="12"/>
      {out
        ? <>
            <line x1="5" y1="5" x2="13" y2="5"/>
            <line x1="5" y1="8" x2="13" y2="8"/>
            <polyline points="4,5 1,7 4,9" fill="none"/>
          </>
        : <>
            <line x1="4" y1="5" x2="13" y2="5"/>
            <line x1="4" y1="8" x2="13" y2="8"/>
            <polyline points="1,5 4,7 1,9" fill="none"/>
          </>
      }
    </svg>
  );
}
