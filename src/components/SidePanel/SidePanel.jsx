import { useState, useEffect, useRef } from 'react';
import './SidePanel.css';

const SVG_ICONS = {
  pin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>,
  dCost: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><line x1="12" y1="2" x2="12" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
  dDist: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>,
  bfs: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><circle cx="12" cy="5" r="3"></circle><circle cx="6" cy="19" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="10.5" y1="7.5" x2="7.5" y2="16.5"></line><line x1="13.5" y1="7.5" x2="16.5" y2="16.5"></line></svg>,
  astar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>,
  swap: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="14" x2="21" y2="3"></line><polyline points="8 21 3 21 3 16"></polyline><line x1="20" y1="10" x2="3" y2="21"></line></svg>,
  chevron: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>,
  time: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  stops: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
};

function AutocompleteInput({ value, onChange, onSelect, placeholder, iconColor, stations, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  
  useEffect(() => {
    const click = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', click);
    return () => document.removeEventListener('mousedown', click);
  }, []);

  const stList = Object.entries(stations).map(([k,v]) => ({ key: k, name: v[0] }));
  const filtered = value ? stList.filter(s => s.name.toLowerCase().includes(value.toLowerCase())) : [];

  return (
    <div className="input-group" ref={ref}>
      <div className={`dot-icon ${iconColor}`} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }} />
      <input
        className="stn-input"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        disabled={disabled}
      />
      {open && filtered.length > 0 && (
        <div className="autocomplete-dropdown">
          {filtered.slice(0, 8).map(s => (
            <div key={s.key} className="ac-item" onClick={() => { onSelect(s.key, s.name); setOpen(false); }}>
              {s.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SidePanel({ city, cityKey, algo, setAlgo, source, setSource, dest, setDest, routeResult, isAnimating }) {
  const [collapsed, setCollapsed] = useState(false);
  const stCount = Object.keys(city.stations).length;
  const lineCount = Object.keys(city.lines).length;

  const handleSwap = () => {
    const s = { ...source }, d = { ...dest };
    setSource(d); setDest(s);
  };

  return (
    <div className="panel-wrapper">
      <div className={`city-badge ${collapsed ? 'collapsed' : ''}`}>
        <div className="city-badge-icon">{SVG_ICONS.pin}</div>
        <div className="city-badge-info">
          <div className="city-badge-name">{city.name}</div>
          <div className="city-badge-lines">{lineCount} Line{lineCount!==1?'s':''} · {stCount} Station{stCount!==1?'s':''}</div>
        </div>
      </div>

      <button className="panel-toggle-btn" onClick={() => setCollapsed(!collapsed)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{transform: collapsed ? 'rotate(180deg)' : 'none', transition: '0.3s'}}>
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>

      <div className={`route-card ${collapsed ? 'collapsed' : ''}`}>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <AutocompleteInput
            value={source.name}
            onChange={v => setSource({ key: null, name: v })}
            onSelect={(k, n) => setSource({ key: k, name: n })}
            placeholder="Source station..."
            iconColor="green"
            stations={city.stations}
            disabled={isAnimating}
          />
          <button className="swap-btn" onClick={handleSwap} disabled={isAnimating}>{SVG_ICONS.swap}</button>
          <AutocompleteInput
            value={dest.name}
            onChange={v => setDest({ key: null, name: v })}
            onSelect={(k, n) => setDest({ key: k, name: n })}
            placeholder="Destination station..."
            iconColor="red"
            stations={city.stations}
            disabled={isAnimating}
          />
        </div>

        <div className="algo-section">
          <div className="algo-title">Algorithm</div>
          <div className="algo-grid">
            <button className={`algo-btn ${algo==='dijkstra-cost'?'active':''}`} onClick={()=>setAlgo('dijkstra-cost')} disabled={isAnimating}>
              <div className="algo-ico">{SVG_ICONS.dCost}</div>
              <div className="algo-n">Dijkstra</div><div className="algo-d">Min Cost</div>
            </button>
            <button className={`algo-btn ${algo==='dijkstra-dist'?'active':''}`} onClick={()=>setAlgo('dijkstra-dist')} disabled={isAnimating}>
              <div className="algo-ico">{SVG_ICONS.dDist}</div>
              <div className="algo-n">Dijkstra</div><div className="algo-d">Min Distance</div>
            </button>
            <button className={`algo-btn ${algo==='bfs'?'active':''}`} onClick={()=>setAlgo('bfs')} disabled={isAnimating}>
              <div className="algo-ico">{SVG_ICONS.bfs}</div>
              <div className="algo-n">BFS</div><div className="algo-d">Fewest Stops</div>
            </button>
            <button className={`algo-btn ${algo==='astar'?'active':''}`} onClick={()=>setAlgo('astar')} disabled={isAnimating}>
              <div className="algo-ico">{SVG_ICONS.astar}</div>
              <div className="algo-n">A*</div><div className="algo-d">Heuristic</div>
            </button>
          </div>
        </div>
      </div>

      {routeResult && routeResult.path.length > 0 && (
        <div className={`route-results ${collapsed ? 'collapsed' : ''}`}>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-v">{SVG_ICONS.dCost} &#8377;{routeResult.cost}</div>
              <div className="stat-l">Total Cost</div>
            </div>
            <div className="stat-box">
              <div className="stat-v">{SVG_ICONS.dDist} {routeResult.distance.toFixed(1)}</div>
              <div className="stat-l">Km Distance</div>
            </div>
            <div className="stat-box">
              <div className="stat-v">{SVG_ICONS.time} {Math.round((routeResult.distance/30)*60)}</div>
              <div className="stat-l">Minutes</div>
            </div>
            <div className="stat-box">
              <div className="stat-v">{SVG_ICONS.stops} {routeResult.path.length-1}</div>
              <div className="stat-l">Stops</div>
            </div>
          </div>
          <div>
            {routeResult.path.map((node, i) => {
              const st = city.stations[node];
              const isLast = i === routeResult.path.length - 1;
              const line = city.lines[st[2]];
              return (
                <div key={i} className="path-step">
                  <div className="step-line">
                    <div className="step-dot" style={{ background: line.color, borderColor: isLast ? line.color : '#fff' }} />
                  </div>
                  <div className="step-info" style={{ borderBottom: isLast ? 'none' : undefined }}>
                    <div className="step-name">{st[0]}</div>
                    <div className="step-meta"><span style={{ color: line.color, fontWeight: 600 }}>{line.name}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
