import { useState, useRef } from 'react';
import {
  clean, splitPapers, readDataURL, pdfPages, loadScript,
  shrink, takeHeader, OCR_PROMPT, FIELDS,
} from '../paperUtils.js';

// Language options for Tesseract OCR
const OCR_LANGS = [
  { value: '',            label: 'None (skip OCR – type questions manually)' },
  { value: 'eng',         label: 'English only' },
  { value: 'hin',         label: 'Hindi (Devanagari)' },
  { value: 'san',         label: 'Sanskrit (Devanagari)' },
  { value: 'hin+san',     label: 'Hindi + Sanskrit' },
  { value: 'eng+hin+san', label: 'English + Hindi + Sanskrit' },
  { value: 'tel',         label: 'Telugu' },
  { value: 'eng+tel',     label: 'English + Telugu' },
];

const DEFAULT_DETAILS_KEYS = ['cls', 'sub', 'exam', 'marks', 'time', 'campus', 'school'];

export default function FileUpload({ details, setDetails, setText, setLogo, setImages, setCurId }) {
  const [note, setNote] = useState('');
  const [engNote, setEngNote] = useState('');
  const [papers, setPapers] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(0);
  const [showPaperPick, setShowPaperPick] = useState(false);
  const [showRmode, setShowRmode] = useState(false);
  const [rmode, setRmode] = useState('quick');
  const [ocrLang, setOcrLang] = useState('eng');
  const [uploading, setUploading] = useState(false);
  const [showStop, setShowStop] = useState(false);
  const abortRef = useRef(null);

  const ext = f => (f.name.split('.').pop() || '').toLowerCase();
  const isImg = f => (f.type || '').startsWith('image/') || /^(jpe?g|png|webp|gif|bmp|heic|heif|tiff?)$/.test(ext(f));

  const applyDetails = (d) => {
    setDetails(prev => {
      const next = { ...prev };
      DEFAULT_DETAILS_KEYS.forEach(k => { if (d[k] != null) next[k] = d[k]; });
      return next;
    });
    const missing = DEFAULT_DETAILS_KEYS.filter(k => !d[k]);
    return missing;
  };

  const loadPaper = (idx, papersArr) => {
    const p = (papersArr || papers)[idx];
    if (!p) return [];
    setCurId(null);
    const miss = applyDetails(p);
    setText(clean(p.body));
    return miss;
  };

  const tail = miss =>
    ' Paper details were updated from the file.' +
    (miss.length ? ' Not found in the file: ' + miss.join(', ') + '. Please fill them in.' : '');

  const handleFiles = async (files) => {
    files = [...files]; if (!files.length) return;
    const docs = files.filter(f => /^(docx|txt|md|csv)$/.test(ext(f)));
    const pics = files.filter(f => isImg(f) || ext(f) === 'pdf');

    if (!docs.length && !pics.length) {
      setNote('This file type is not supported. Please upload a Word file (.docx), a PDF, a photo or scan, or a text file. For an old .doc file, open it in Word and use Save As .docx first.');
      return;
    }
    if (docs.length && pics.length) {
      setNote('Please upload either a Word/text file or photos/PDF, not both together.');
      return;
    }

    setUploading(true);
    setShowStop(false);

    try {
      if (docs.length) {
        const f = docs[0];
        setNote('Reading file...');
        let text;
        if (ext(f) === 'docx') {
          text = (await window.mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() })).value;
        } else {
          text = await f.text();
        }
        const ps = splitPapers(text);
        setPapers(ps);
        setShowPaperPick(ps.length >= 2);
        setSelectedPaper(0);
        const miss = loadPaper(0, ps);
        setNote('Loaded ' + f.name + (ps.length > 1 ? ' – ' + ps.length + ' papers found. Choose one below.' : '.') + tail(miss));
      } else {
        setShowPaperPick(false);
        setNote('Preparing...');
        let pages = [];
        for (const f of pics) {
          pages = pages.concat(ext(f) === 'pdf' ? await pdfPages(f) : [f]);
        }
        setShowStop(false);

        // If OCR language is None, skip OCR entirely
        if (!ocrLang) {
          setNote('Photo uploaded. OCR is set to None – please type the questions manually in the box on the right.');
          setUploading(false);
          return;
        }

        setNote('Loading the text reader...');

        // Tesseract OCR
        const r = await viaTesseract(pages, ocrLang, setNote);
        setCurId(null);
        applyDetails(r.d);
        setText(clean(r.t));
        setNote('Done.' + tail(Object.keys(r.d).filter(k => !r.d[k])) + ' Read the questions carefully and fix any wrong words.');
      }
    } catch (err) {
      const c = err && err.code;
      if (c === 'cancelled') {
        setCurId(null);
        setNote('Stopped. The text read so far is kept.');
      } else {
        setNote('Could not read this file. ' + (docs.length ? 'Please check it is a valid .docx file.' : 'The text reader could not start. Check the internet connection.'));
      }
    }
    setUploading(false);
    setShowStop(false);
  };

  const handleLogoChange = async (ev) => {
    if (ev.target.files[0]) {
      setLogo(await readDataURL(ev.target.files[0]));
    }
  };

  const handlePicsChange = async (ev) => {
    const urls = await Promise.all([...ev.target.files].map(readDataURL));
    setImages(urls);
  };

  const handlePaperSelect = (idx) => {
    setSelectedPaper(idx);
    loadPaper(idx);
  };

  return (
    <div className="panel">
      <h1>Paper formatter</h1>
      <p className="s">Upload the teacher's Word file, fix the text, and print in the two-copy school format.</p>

      <label htmlFor="ocrlang">OCR language (for photo/PDF uploads)</label>
      <select id="ocrlang" value={ocrLang} onChange={ev => setOcrLang(ev.target.value)}>
        {OCR_LANGS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
      </select>
      <div className="s" style={{ marginTop: 2, marginBottom: 8 }}>
        {ocrLang
          ? <>⚠️ If your paper has Sanskrit, Hindi or Telugu — select the matching language above <em>before</em> uploading.
              Landscape two-copy scans are automatically cropped to just the left copy.</>
          : <>🚫 OCR is off. Upload a Word/text file, or type the questions directly in the Questions box.</>
        }
      </div>

      <label htmlFor="up">1. Upload the paper: Word, PDF, photo, scan or handwritten</label>
      <input
        type="file"
        id="up"
        accept=".docx,.txt,.md,.csv,.pdf,image/*"
        multiple
        disabled={uploading}
        onChange={ev => handleFiles(ev.target.files)}
      />
      <div className="s" style={{ marginTop: 4 }}>
        For several photos or PDF pages of one paper, select them all together in page order.
      </div>

      {showRmode && (
        <div id="rmw">
          <label htmlFor="rmode">Photo reading speed</label>
          <select id="rmode" value={rmode} onChange={ev => setRmode(ev.target.value)}>
            <option value="quick">Fast (a few seconds)</option>
            <option value="default">Careful (slower, more exact)</option>
          </select>
        </div>
      )}

      {showStop && (
        <button id="stop" className="g" onClick={() => abortRef.current && abortRef.current.abort()}>Stop</button>
      )}

      <div className="s" id="eng" style={{ marginTop: 6 }}>{engNote}</div>
      <div className="s" id="note">{note}</div>

      {showPaperPick && papers.length >= 2 && (
        <div id="ppw">
          <label htmlFor="pp">Choose the paper to format</label>
          <select id="pp" value={selectedPaper} onChange={ev => handlePaperSelect(+ev.target.value)}>
            {papers.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
          </select>
        </div>
      )}

      <label htmlFor="logo">School logo (optional)</label>
      <input type="file" id="logo" accept="image/*" onChange={handleLogoChange} />

      <label htmlFor="pics">Pictures for [image] lines, in order (optional)</label>
      <input type="file" id="pics" accept="image/*" multiple onChange={handlePicsChange} />
    </div>
  );
}

/**
 * Tesseract OCR – supports multi-language (Hindi, Sanskrit, Telugu, etc.)
 * Landscape two-column papers are automatically cropped to left half only.
 */
async function viaTesseract(photos, lang, setNote) {
  if (!window.Tesseract) {
    await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
  }

  // Pre-process: crop each photo to left half if it is landscape (two-column sheet)
  const processed = await Promise.all(photos.map(f => cropLeftHalfIfTwoColumn(f)));

  const out = [];
  for (let i = 0; i < processed.length; i++) {
    const r = await window.Tesseract.recognize(processed[i], lang, {
      logger: m => {
        if (m.status === 'recognizing text') {
          setNote('Reading page ' + (i + 1) + ' of ' + processed.length + '... ' + Math.round(m.progress * 100) + '%  [lang: ' + lang + ']');
        }
      },
    });
    out.push(r.data.text);
  }

  const isDevanagari = /hin|san/.test(lang);
  const raw = out.join('\n').split('\n')
    .map(l => {
      l = l.trim();
      if (!isDevanagari) {
        l = l.replace(/\|/g, 'I').replace(/^(\d{1,2})\s*[.):,]?\s+(?=\S)/, '$1. ');
      }
      return l;
    })
    .filter(l => l.length > 1)
    .join('\n');

  const parsed = takeHeader(raw);
  // If Gauthami Junior College or Sanskrit paper detected, auto-format details
  if (/gauthami\s*junior\s*college/i.test(raw) || /sanskrit/i.test(raw)) {
    parsed.d.school = parsed.d.school || 'GAUTHAMI JUNIOR COLLEGE';
    parsed.d.exam = parsed.d.exam || 'UNIT - II';
    parsed.d.sub = parsed.d.sub || 'SANSKRIT - I';
    parsed.d.marks = parsed.d.marks || 'MAX. MARKS: 35';
    parsed.d.cls = '';
    parsed.d.campus = '';
    parsed.d.time = '';
    parsed.d.pstyle = 'border';
    parsed.d.ori = 'landscape';
  }
  return parsed;
}

/**
 * Crop image to left half if it is landscape (width > height).
 *
 * A standard landscape A4 with two side-by-side copies has ratio ≈ 1.41.
 * Any image wider than it is tall is treated as a two-column sheet and
 * cropped to its left half so the OCR reads each question only once.
 * Portrait images (ratio < 1) are left untouched.
 */
function cropLeftHalfIfTwoColumn(file) {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      // Use naturalWidth/Height for the actual pixel dimensions
      const w = img.naturalWidth  || img.width;
      const h = img.naturalHeight || img.height;
      const ratio = w / h;

      // If landscape (wider than tall) → two-copy paper → take left half only
      if (ratio > 1.1) {
        const c = document.createElement('canvas');
        c.width  = Math.floor(w / 2);
        c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, c.width, h, 0, 0, c.width, h);
        c.toBlob(b => resolve(b || file), 'image/jpeg', 0.92);
      } else {
        resolve(file);  // Portrait – read the whole page
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}
