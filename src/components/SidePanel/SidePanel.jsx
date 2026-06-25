import { useState, useRef, useEffect, useCallback } from 'react';
import RouteResults from './RouteResults';
import './SidePanel.css';

/* ── SVG Icons ─────────────────────────── */
const IcoRupee = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="19" height="19">
    <path d="M6 3h12M6 8h12M6 21l7-13 7 13"/><path d="M6 12h7a4 4 0 0 1 0 8H6"/>
  </svg>
);
const IcoRoad = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="19" height="19">
    <path d="M3 12h18M3 6l3 6-3 6M21 6l-3 6 3 6"/>
  </svg>
);
const IcoGraph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="19" height="19">
    <circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>
    <line x1="12" y1="7" x2="5" y2="17"/><line x1="12" y1="7" x2="19" y2="17"/><line x1="5" y1="19" x2="19" y2="19"/>
  </svg>
);
const IcoTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="19" height="19">
    <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>
    <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
    <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
  </svg>
);
const IcoSwap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14">
    <path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
  </svg>
);
const IcoArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);
const IcoSpin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
    className="spin" width="14" height="14">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);
const IcoMapPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </svg>
);

const ALGOS = [
  { key: 'dijkstra-cost', label: 'Dijkstra', sub: 'Min Cost',     Icon: IcoRupee },
  { key: 'dijkstra-dist', label: 'Dijkstra', sub: 'Min Distance', Icon: IcoRoad  },
  { key: 'min-transfers', label: 'Dijkstra', sub: 'Min Transfer', Icon: IcoSwap  },
  { key: 'bfs',           label: 'BFS',      sub: 'Fewest Stops', Icon: IcoGraph },
  { key: 'astar',         label: 'A*',        sub: 'Heuristic',   Icon: IcoTarget},
];

/* ── Autocomplete Input ─────────────────── */
function StationInput({ id, placeholder, value, onChange, onSelect, stations }) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const wrapRef = useRef(null);

  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v);
    if (v.length > 0) {
      const q = v.toLowerCase();
      const results = Object.entries(stations)
        .filter(([, s]) => s[0].toLowerCase().includes(q))
        .slice(0, 8);
      setFiltered(results);
      setOpen(results.length > 0);
    } else {
      setOpen(false);
    }
  };

  useEffect(() => {
    const handler = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="ac-wrap" ref={wrapRef}>
      <input
        id={id}
        type="text"
        className="station-input"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={() => { if (filtered.length > 0) setOpen(true); }}
        autoComplete="off"
      />
      {open && (
        <div className="dropdown open">
          {filtered.map(([k, s]) => (
            <div key={k} className="dropdown-item" onMouseDown={() => {
              onSelect(k, s[0]);
              setOpen(false);
            }}>
              <span className="color-pip" style={{ background: '#8b5e38' }} />
              {s[0]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main SidePanel ─────────────────────── */
export default function SidePanel({
  collapsed, onToggle,
  cityData, currentCity,
  onFindRoute, result, isAnimating, mapSelected,
}) {
  const [srcKey, setSrcKey] = useState('');
  const [srcLabel, setSrcLabel] = useState('');
  const [destKey, setDestKey] = useState('');
  const [destLabel, setDestLabel] = useState('');
  const [algo, setAlgo] = useState('dijkstra-cost');
  const [loading, setLoading] = useState(false);

  // Reset when city changes
  useEffect(() => {
    setSrcKey(''); setSrcLabel('');
    setDestKey(''); setDestLabel('');
  }, [currentCity]);

  // Handle map selection
  useEffect(() => {
    if (!mapSelected) return;
    if (!srcKey) {
      setSrcKey(mapSelected.key);
      setSrcLabel(mapSelected.name);
    } else if (!destKey) {
      setDestKey(mapSelected.key);
      setDestLabel(mapSelected.name);
    } else {
      // Both filled, replace source and clear dest for a new route query
      setSrcKey(mapSelected.key);
      setSrcLabel(mapSelected.name);
      setDestKey('');
      setDestLabel('');
    }
  }, [mapSelected]);

  const handleSwap = () => {
    setSrcKey(destKey);   setSrcLabel(destLabel);
    setDestKey(srcKey);   setDestLabel(srcLabel);
  };

  const handleFind = useCallback(async () => {
    if (!srcKey || !destKey || isAnimating) return;
    setLoading(true);
    await onFindRoute(srcKey, destKey, algo);
    setLoading(false);
  }, [srcKey, destKey, algo, isAnimating, onFindRoute]);

  const stations = cityData?.stations || {};
  const lineCount = cityData ? Object.keys(cityData.lines || {}).length : 0;
  const stCount   = Object.keys(stations).length;

  return (
    <>
      {/* Panel toggle tab */}
      <div className="panel-toggle" onClick={onToggle} title="Toggle sidebar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d={collapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'}/>
        </svg>
      </div>

      <aside className={`side-panel${collapsed ? ' collapsed' : ''}`}>
        <div className="panel-inner">

          {/* City badge */}
          <div className="city-badge">
            <span className="city-badge-icon"><IcoMapPin /></span>
            <div>
              <p className="city-badge-name serif">{cityData?.name || 'Select City'}</p>
              <p className="city-badge-lines">{lineCount} Lines · {stCount} Stations</p>
            </div>
          </div>

          {/* Route form */}
          <div className="route-box">
            <div className="field-group">
              <label className="field-label">
                <span className="dot dot-green"/>From
              </label>
              <StationInput
                id="src-input"
                placeholder="Source station…"
                value={srcLabel}
                onChange={setSrcLabel}
                onSelect={(k, n) => { setSrcKey(k); setSrcLabel(n); }}
                stations={stations}
              />
            </div>

            <div className="swap-row">
              <button className="swap-btn" onClick={handleSwap} title="Swap">
                <IcoSwap />
              </button>
            </div>

            <div className="field-group">
              <label className="field-label">
                <span className="dot dot-red"/>To
              </label>
              <StationInput
                id="dest-input"
                placeholder="Destination station…"
                value={destLabel}
                onChange={setDestLabel}
                onSelect={(k, n) => { setDestKey(k); setDestLabel(n); }}
                stations={stations}
              />
            </div>
          </div>

          {/* Algorithm grid */}
          <div className="algo-section">
            <p className="section-label">Algorithm</p>
            <div className="algo-grid">
              {ALGOS.map(a => (
                <button
                  key={a.key}
                  className={`algo-btn${algo === a.key ? ' active' : ''}`}
                  onClick={() => setAlgo(a.key)}
                >
                  <span className="algo-ico"><a.Icon /></span>
                  <span className="algo-n">{a.label}</span>
                  <span className="algo-d">{a.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Find Route button */}
          <button
            className={`find-btn${loading || isAnimating ? ' loading' : ''}`}
            onClick={handleFind}
            disabled={!srcKey || !destKey || loading || isAnimating}
          >
            <span>{loading || isAnimating ? 'Finding…' : 'Find Route'}</span>
            {loading || isAnimating ? <IcoSpin /> : <IcoArrow />}
          </button>

          {/* Results */}
          {result && (
            <RouteResults result={result} algo={algo} cityData={cityData} srcKey={srcKey} destKey={destKey} />
          )}

        </div>
      </aside>
    </>
  );
}
