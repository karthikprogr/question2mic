import { useState, useEffect, useRef, useCallback } from 'react';
import PaperPreview from './PaperPreview.jsx';
import FileUpload from './FileUpload.jsx';
import { FL, readDataURL, fname, isPortrait, classNum, saveBlob, FIELDS } from '../paperUtils.js';
import { buildDocx } from '../docxExport.js';
import { SANSKRIT_PAPER_DETAILS, SANSKRIT_PAPER_TEXT, ENGLISH_PAPER_DETAILS, ENGLISH_PAPER_TEXT } from '../App.jsx';

export default function Editor({
  details, setDetails, text, setText,
  logo, setLogo, images, setImages,
  curId, setCurId, saveHist,
  appTheme, setAppTheme,
}) {
  const [hmsg, setHmsg] = useState('');
  const [pnote, setPnote] = useState('Choose Save as PDF, paper A4, margins None. Print double-sided, flip on the short edge.');

  const updateDetail = (key, val) => setDetails(d => ({ ...d, [key]: val }));

  // Font selector – populate list with FL
  const pfontOptions = FL.map(([n, g]) => (
    <option key={n} value={n} style={{ fontFamily: `'${n}',${g}` }}>{n}</option>
  ));

  const orientNote = (() => {
    const n = classNum(details.cls);
    const pt = isPortrait(details.ori, details.cls);
    return (n ? 'Class ' + n + ' → ' : 'Class not recognised → ') +
      (pt ? 'portrait, one paper per page' : 'landscape, two copies per sheet');
  })();

  // Save handler
  const handleSave = () => {
    const ok = saveHist('Saved');
    setHmsg(ok ? 'Saved in the dashboard history.' : 'Could not save history (browser storage is full or blocked).');
  };

  // Print handler
  const handlePrint = () => {
    saveHist('Printed');
    try { window.print(); }
    catch { setPnote('Printing is blocked here. Use "Open in new tab to print".'); }
  };

  // Open in new tab
  const handlePrint2 = () => {
    saveHist('Printed');
    const css = [...document.styleSheets].map(ss => {
      try { return [...ss.cssRules].map(r => r.cssText).join('\n'); } catch { return ''; }
    }).join('\n');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Question paper</title>
<link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap" rel="stylesheet">
<style>${css}body{background:#fff!important;display:block}.noprint{display:none}.sheet{margin:0 auto;box-shadow:none;break-after:page}</style>
</head><body>${document.getElementById('out').innerHTML}<script>setTimeout(function(){window.print()},700)<\/script></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.open(); w.document.write(html); w.document.close(); }
    else setPnote('Your browser blocked the new tab. Allow pop-ups, or press Ctrl+P.');
  };

  // Download DOCX
  const handleDownload = async () => {
    setPnote('Making the Word file...');
    try {
      const blob = await buildDocx(details, [...document.querySelectorAll('#out .sheet')]);
      const nm = ('Class-' + details.cls + '-' + details.sub).replace(/[^A-Za-z0-9-]+/g, '-') + '.docx';
      await saveBlob(nm, blob);
      setPnote('Word file ready. Open it in Word to edit. Spacing may differ a little from the preview.');
      setHmsg('Saved in the dashboard history.');
      saveHist('Word download');
    } catch (err) {
      setPnote('Could not make the Word file: ' + (err && err.message || err));
    }
  };

  return (
    <div className="wrap" id="viewE">
      {/* ===== Left panel ===== */}
      <div className="noprint">
        {/* File upload */}
        <FileUpload
          details={details}
          setDetails={setDetails}
          setText={setText}
          setLogo={setLogo}
          setImages={setImages}
          setCurId={setCurId}
        />

        {/* Paper details */}
        <div className="panel">
          <h2>2. Paper details</h2>
          <label htmlFor="school">School name</label>
          <input id="school" value={details.school} onChange={ev => updateDetail('school', ev.target.value)} />

          <label htmlFor="campus">Campus</label>
          <input id="campus" value={details.campus} onChange={ev => updateDetail('campus', ev.target.value)} />

          <div className="row">
            <div>
              <label htmlFor="cls">Class</label>
              <input id="cls" value={details.cls} onChange={ev => updateDetail('cls', ev.target.value)} />
            </div>
            <div>
              <label htmlFor="sub">Subject</label>
              <input id="sub" value={details.sub} onChange={ev => updateDetail('sub', ev.target.value)} />
            </div>
          </div>

          <label htmlFor="exam">Exam</label>
          <input id="exam" value={details.exam} onChange={ev => updateDetail('exam', ev.target.value)} />

          <div className="row">
            <div>
              <label htmlFor="marks">Marks</label>
              <input id="marks" value={details.marks} onChange={ev => updateDetail('marks', ev.target.value)} />
            </div>
            <div>
              <label htmlFor="time">Time</label>
              <input id="time" value={details.time} onChange={ev => updateDetail('time', ev.target.value)} />
            </div>
          </div>

          <label htmlFor="ori">Page layout</label>
          <select id="ori" value={details.ori} onChange={ev => updateDetail('ori', ev.target.value)}>
            <option value="auto">Automatic (Class 1–3 portrait, 4–10 landscape)</option>
            <option value="landscape">Always landscape</option>
            <option value="portrait">Always portrait</option>
          </select>
          <div className="s" id="onote">{orientNote}</div>

          <label htmlFor="pfont">Paper font</label>
          <select id="pfont" value={details.pfont} onChange={ev => {
            updateDetail('pfont', ev.target.value);
          }}>
            {pfontOptions}
            <option value="__custom">Other (type a font name)…</option>
          </select>
          {details.pfont === '__custom' && (
            <input
              id="pcustom"
              value={details.pcustom}
              onChange={ev => updateDetail('pcustom', ev.target.value)}
              placeholder="Type the font name exactly as in Word"
            />
          )}

          <label htmlFor="pstyle">Paper style</label>
          <select id="pstyle" value={details.pstyle} onChange={ev => updateDetail('pstyle', ev.target.value)}>
            <option value="classic">Classic (plain)</option>
            <option value="border">Full border box (College format, like Image 2)</option>
            <option value="box">Boxed header</option>
            <option value="line">Lines under sections</option>
            <option value="shade">Shaded sections</option>
          </select>

          <label htmlFor="apptheme">Screen theme</label>
          <select id="apptheme" value={appTheme} onChange={ev => setAppTheme(ev.target.value)}>
            <option value="auto">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>

          <label htmlFor="fs">Text size</label>
          <select id="fs" value={details.fs} onChange={ev => updateDetail('fs', ev.target.value)}>
            {['10px','11px','12px','13px','14px'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Print panel */}
        <div className="panel">
          <h2>3. Print</h2>
          <button id="print" onClick={handlePrint}>Print / Save as PDF</button>
          <button id="save" onClick={handleSave}>Save to history</button>
          <button id="dl" onClick={handleDownload}>Download .docx (Word)</button>
          <button id="print2" className="g" onClick={handlePrint2}>Open in new tab to print</button>
          <div className="s" id="hmsg">{hmsg}</div>
          <div className="s" id="pnote" style={{ marginTop: 8 }}>
            {pnote.includes('Choose') ? (
              <>{pnote.split('Save as PDF')[0]}<b>Save as PDF</b>{', paper '}<b>A4</b>{', margins '}<b>None</b>{'. Print double-sided, flip on the short edge.'}</>
            ) : pnote}
          </div>
        </div>
      </div>

      {/* ===== Right panel – Questions + Preview ===== */}
      <div>
        <div className="panel noprint">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
            <h2 style={{ margin: 0 }}>Questions (fix mistakes here)</h2>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="g"
                style={{ fontSize: '12px', padding: '3px 8px', margin: 0 }}
                onClick={() => { setDetails(SANSKRIT_PAPER_DETAILS); setText(SANSKRIT_PAPER_TEXT); }}
              >
                ✨ Load Sanskrit (Image 2)
              </button>
              <button
                type="button"
                className="g"
                style={{ fontSize: '12px', padding: '3px 8px', margin: 0 }}
                onClick={() => { setDetails(ENGLISH_PAPER_DETAILS); setText(ENGLISH_PAPER_TEXT); }}
              >
                🏫 Load English Sample
              </button>
            </div>
          </div>
          <details>
            <summary>How to write the questions</summary>
            <pre>{`I. Choose the correct answer. 4 x 1 = 4M   (section line, marks go at the end)
1. Which part of the plant makes food? ( )
a) Root b) Stem c) Leaf d) Flower           (options on one line)
A | B                                       (match table header)
Horse | Hive                                (match table row)
[image]                                     (picture goes here)
[lines 2]                                   (2 answer lines)
[page]                                      (force a new page; pages fill automatically)`}</pre>
          </details>
          <textarea
            id="txt"
            spellCheck
            value={text}
            onChange={ev => setText(ev.target.value)}
          />
        </div>

        {/* Paper preview */}
        <PaperPreview
          text={text}
          details={details}
          logo={logo}
          images={images}
          setText={setText}
        />
      </div>
    </div>
  );
}
