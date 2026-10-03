import { useState, useCallback } from 'react';
import { hload, hsave, classNum, fdate, e, saveBlob } from '../paperUtils.js';

export default function Dashboard({ history, setHistory, onOpen, onNew }) {
  const [search, setSearch] = useState('');
  const [filterCls, setFilterCls] = useState('');
  const [hnote, setHnote] = useState('History is saved in this web browser on this computer. Use Download backup to keep a copy or move it to another computer. Pictures and the logo are not saved.');

  const classes = [...new Set(history.map(r => r.cls))].sort((x, y) => classNum(x) - classNum(y));
  const subs = new Set(history.map(r => (r.sub || '').toLowerCase()));
  const last = history.reduce((m, r) => Math.max(m, r.updated || 0), 0);

  const filtered = history
    .filter(r =>
      (!filterCls || r.cls === filterCls) &&
      (!search || (r.cls + ' ' + r.sub + ' ' + r.exam).toLowerCase().includes(search.toLowerCase().trim()))
    )
    .sort((x, y) => y.updated - x.updated);

  const handleDelete = useCallback((id, sure) => {
    if (!sure) return false;
    const a = hload().filter(r => r.id !== id);
    hsave(a); setHistory(a);
    return true;
  }, [setHistory]);

  const handleExport = async () => {
    await saveBlob('paper-history-backup.json', new Blob([JSON.stringify(hload(), null, 1)], { type: 'application/json' }));
  };

  const handleImport = (e2) => {
    const f = e2.target.files[0]; if (!f) return;
    f.text().then(txt => {
      try {
        const n = JSON.parse(txt);
        if (!Array.isArray(n)) throw 0;
        const a = hload(), ids = new Set(a.map(r => r.id)); let k = 0;
        n.forEach(r => { if (r && r.id && r.cls != null && !ids.has(r.id)) { a.push(r); k++; } });
        hsave(a); setHistory([...a]);
        setHnote('Restored ' + k + ' paper(s) from backup.');
      } catch { setHnote('That file is not a valid backup.'); }
    });
    e2.target.value = '';
  };

  return (
    <section className="dash noprint">
      <h2>Overview</h2>

      {/* Stats */}
      <div className="stats">
        <div className="stat"><b>{history.length}</b><span>Papers created</span></div>
        <div className="stat"><b>{classes.length}</b><span>Classes covered</span></div>
        <div className="stat"><b>{subs.size}</b><span>Subjects</span></div>
        <div className="stat">
          <b style={{ fontSize: '16px', padding: '6px 0' }}>{last ? fdate(last) : '–'}</b>
          <span>Last updated</span>
        </div>
        {history.length > 0 && (
          <div className="chips" style={{ gridColumn: '1/-1' }}>
            {classes.map(c => (
              <span key={c} className="chip">
                Class {c}: {history.filter(r => r.cls === c).length}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Papers list */}
      <div className="panel">
        <h2>Papers created</h2>
        <div className="row">
          <input
            id="q"
            value={search}
            onChange={ev => setSearch(ev.target.value)}
            placeholder="Search by class, subject or exam"
            aria-label="Search papers"
          />
          <select
            id="fc"
            value={filterCls}
            onChange={ev => setFilterCls(ev.target.value)}
            aria-label="Filter by class"
          >
            <option value="">All classes</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div id="list">
          {filtered.length === 0 ? (
            <p className="s">
              {history.length
                ? 'No paper matches your search.'
                : 'No papers yet. Click "+ New paper", then press Save to history, Print or Download to keep it here.'}
            </p>
          ) : (
            filtered.map(r => (
              <HistoryCard
                key={r.id}
                rec={r}
                onOpen={() => onOpen(r)}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        <button id="exp" className="g" onClick={handleExport}>Download backup</button>
        <label htmlFor="imp-file" style={{ display: 'inline' }}>
          <button className="g" onClick={() => document.getElementById('imp-file').click()}>Restore backup</button>
        </label>
        <input type="file" id="imp-file" accept=".json" hidden onChange={handleImport} />
        <div className="s" id="hnote" style={{ marginTop: 8 }}>{hnote}</div>
      </div>
    </section>
  );
}

function HistoryCard({ rec, onOpen, onDelete }) {
  const [sure, setSure] = useState(false);

  return (
    <div className="card">
      <div>
        <b>{rec.cls ? 'Class ' + rec.cls + ' · ' : ''}{rec.sub}</b>
        <div className="s" style={{ margin: '2px 0' }}>
          {rec.exam} · {rec.marks} · {rec.time} · {rec.pages || '?'} page(s)
        </div>
        <div className="s" style={{ margin: 0 }}>
          {rec.how || 'Saved'} · {fdate(rec.updated)}
        </div>
      </div>
      <div>
        <button data-id={rec.id} onClick={onOpen}>Open</button>
        {sure ? (
          <button
            className="g"
            onClick={() => { onDelete(rec.id, true); setSure(false); }}
            style={{ color: '#b3261e', borderColor: '#b3261e' }}
          >
            Sure? Delete
          </button>
        ) : (
          <button className="g" onClick={() => setSure(true)}>Delete</button>
        )}
      </div>
    </div>
  );
}
