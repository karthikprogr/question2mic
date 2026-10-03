import { useState, useEffect, useCallback, useRef } from 'react';
import Dashboard from './components/Dashboard.jsx';
import Editor from './components/Editor.jsx';
import { hload, hsave, FIELDS, fdate } from './paperUtils.js';

export const SANSKRIT_PAPER_DETAILS = {
  school: 'GAUTHAMI JUNIOR COLLEGE',
  campus: '',
  cls: '',
  sub: 'SANSKRIT - I',
  exam: 'UNIT - II',
  marks: 'MAX. MARKS: 35',
  time: '',
  ori: 'landscape',
  pfont: 'Cambria',
  pcustom: '',
  pstyle: 'border',
  fs: '12px',
};

export const SANSKRIT_PAPER_TEXT = `I  एकपदेन उत्तरकृत्य प्रश्नं लिखत ।   1 × 5 = 5
1. पदं तन्द्यबैते पुस्तके किम् अभवत् ?
2. आंभेवात् तं पुस्तके निमित्तमरीरीं लिखित ?
3. अस्मिन् स्वर्णकारणी तत्र, तत्र कस्य अभवत् ?
4. काशी जनकपुर्यस्य स्वर्णकारणी गच्छति कदा ?
5. कस्य प्रसनस्य उत्तरमस्ति मित्रम् ?

II  संयोजयत् उचितेन विकल्पेन ।   2 × 2 = 4
1. वयं तबरे कः स्थितः उत्सामे ?
2. का सेवा जनकपुरस्य भवति ।

III पूर्ण वाक्यं लिखत ।   2 × 3 = 6
1. गुरुः        2. सागरः       3. छात्रः

IV कतींः धातुरूपाणि लिखत ।   2 × 3 = 6
1. धावति       2. पठिष्यति

V  संधि विच्छेदं वा समासविच्छेदं वा लिखत ।   3 × 2 = 6
1. स्वदेशः     2. उपदेशः      3. अनौपचारिकः

VI संधि समासविवेचनं वा कृत्वा लिखत ।   3 × 2 = 6
1. राम + ईशः    2. श्री + ईशः   3. तदा + एव

VII अनुवादं कुरुत ।   3 × 1 = 3
1. कथ्यं ।
2. सर्वे भवन्तु सुखिनः सन्तु ।
3. अहं तु विद्यालयं गच्छामि ।
4. यथा इह तथा परत्र च मे ।

VIII उचितपदानि रिक्त स्थानानि पूरयत ।   3 × 1 = 3
1. छात्रः _______ गच्छन्ति । ( विद्यालयम् / उद्यानम् / गृहम् )
2. मम माता _______ पठति । ( भोजनम् / जलम् / फलम् )
3. सः प्रतिदिनम् _______ पठति । ( पुस्तकानि / पत्रम् / कथाः )`;

export const ENGLISH_PAPER_DETAILS = {
  school: 'GAUTHAMI TECHNO SCHOOL',
  campus: 'CHINTAL, HYDERABAD',
  cls: 'IV',
  sub: 'EVS',
  exam: 'SUMMATIVE ASSESSMENT \u2013 I',
  marks: '20M',
  time: '1 Hr',
  ori: 'auto',
  pfont: 'Cambria',
  pcustom: '',
  pstyle: 'classic',
  fs: '12px',
};

export const ENGLISH_PAPER_TEXT = `I. Choose the correct answer. 4 x 1 = 4M
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

export default function App() {
  const [view, setView] = useState('E'); // 'D' = Dashboard, 'E' = Editor
  const [details, setDetails] = useState(SANSKRIT_PAPER_DETAILS);
  const [text, setText] = useState(SANSKRIT_PAPER_TEXT);
  const [logo, setLogo] = useState('');
  const [images, setImages] = useState([]);
  const [curId, setCurId] = useState(null);
  const [history, setHistory] = useState(hload);
  const [appTheme, setAppTheme] = useState('auto');

  // Sync theme with document
  useEffect(() => {
    if (appTheme === 'auto') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', appTheme);
    }
  }, [appTheme]);

  // Refresh history from localStorage whenever we switch to Dashboard
  useEffect(() => {
    if (view === 'D') setHistory(hload());
  }, [view]);

  const saveHist = useCallback((how) => {
    const a = hload(), now = Date.now();
    let id = curId;
    if (!id) { id = 'p' + now.toString(36) + Math.random().toString(36).slice(2, 6); setCurId(id); }
    const i = a.findIndex(r => r.id === id);
    const rec = {
      id, created: i >= 0 ? a[i].created : now, updated: now, how,
      text, pfont: details.pfont, pages: document.querySelectorAll('#out .sheet').length,
    };
    FIELDS.forEach(k => { rec[k] = details[k] !== undefined ? details[k] : ''; });
    if (i >= 0) a[i] = rec; else a.unshift(rec);
    const ok = hsave(a);
    setHistory([...a]);
    return ok;
  }, [curId, text, details]);

  const openRec = useCallback((rec) => {
    const newDetails = { ...DEFAULT_DETAILS };
    FIELDS.forEach(k => { if (rec[k] != null) newDetails[k] = rec[k]; });
    if (rec.pfont) newDetails.pfont = rec.pfont;
    setDetails(newDetails);
    setText(rec.text || '');
    setCurId(rec.id);
    setView('E');
  }, []);

  const newPaper = useCallback(() => {
    setCurId(null);
    setText('');
    setView('E');
  }, []);

  return (
    <>
      <header className="top noprint">
        <b className="brand">Question Paper Maker</b>
        <nav>
          <button
            id="tabD"
            className={`tab ${view === 'D' ? 'on' : 'g'}`}
            onClick={() => setView('D')}
          >
            Dashboard
          </button>
          <button
            id="tabE"
            className={`tab ${view === 'E' ? 'on' : 'g'}`}
            onClick={() => setView('E')}
          >
            Editor
          </button>
        </nav>
        <button id="newp" className="g" onClick={newPaper}>+ New paper</button>
      </header>

      {view === 'D' ? (
        <Dashboard
          history={history}
          setHistory={setHistory}
          onOpen={openRec}
          onNew={newPaper}
        />
      ) : (
        <Editor
          details={details}
          setDetails={setDetails}
          text={text}
          setText={setText}
          logo={logo}
          setLogo={setLogo}
          images={images}
          setImages={setImages}
          curId={curId}
          setCurId={setCurId}
          saveHist={saveHist}
          appTheme={appTheme}
          setAppTheme={setAppTheme}
        />
      )}
    </>
  );
}
