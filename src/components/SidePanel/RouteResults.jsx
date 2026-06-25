/* Route Results component */
const IcoClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
    <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>
  </svg>
);
const IcoRoad = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
    <path d="M3 12h18M3 6l3 6-3 6M21 6l-3 6 3 6"/>
  </svg>
);
const IcoRupee = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
    <path d="M6 3h12M6 8h12M6 21l7-13 7 13"/><path d="M6 12h7a4 4 0 0 1 0 8H6"/>
  </svg>
);
const IcoStops = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
  </svg>
);
const IcoCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);

const ALGO_LABELS = {
  'dijkstra-cost': 'Min Cost',
  'dijkstra-dist': 'Min Dist',
  'bfs':           'BFS',
  'astar':         'A*',
};

export default function RouteResults({ result, algo, cityData }) {
  if (!result || !result.path || result.path.length === 0) {
    return (
      <div className="no-route-panel">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <p>No route found between selected stations.</p>
      </div>
    );
  }

  const mins  = result.distance ? ((result.distance / 30) * 60).toFixed(0) : '?';
  const stops = result.path.length - 1;
  const stations = cityData?.stations || {};

  // Build journey steps with line info
  const steps = result.path.map((key, i) => {
    const st = stations[key];
    // Format: [[lat,lng], 'Name', 'lineKey'] — index 1 is name, index 2 is lineKey
    const name = st ? st[1] : key;
    const lineKey = st ? st[2] : null;
    const lineColor = (lineKey && cityData?.lines?.[lineKey]?.color) || '#8b5e38';
    const lineName = (lineKey && cityData?.lines?.[lineKey]?.name) || lineKey;
    return { key, name, lineKey, lineColor, lineName, isFirst: i === 0, isLast: i === result.path.length - 1 };
  });

  return (
    <div className="results-panel">
      <div className="results-hdr">
        <IcoCheck />
        <strong className="serif">Route Found</strong>
        <span className="algo-tag">{ALGO_LABELS[algo] || algo}</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><IcoClock /><div><p className="sv">{mins}</p><p className="sl">Min</p></div></div>
        <div className="stat-card"><IcoRoad /><div><p className="sv">{result.distance?.toFixed(1)}</p><p className="sl">km</p></div></div>
        <div className="stat-card"><IcoRupee /><div><p className="sv">₹{result.cost}</p><p className="sl">Fare</p></div></div>
        <div className="stat-card"><IcoStops /><div><p className="sv">{stops}</p><p className="sl">Stops</p></div></div>
      </div>

      <div className="journey-steps">
        {steps.map((s, i) => {
          const prev = i > 0 ? steps[i - 1] : null;
          const isChange = prev && prev.lineKey && s.lineKey && prev.lineKey !== s.lineKey;
          
          return (
            <div key={s.key} className="j-step" style={{ '--dot-color': s.lineColor }}>
              <span className="j-dot" style={{ color: s.lineColor, borderColor: s.lineColor }}/>
              <div>
                <p className="j-name">{s.name}</p>
                {s.isFirst && <p className="j-info">Boarding at {s.lineName}</p>}
                {s.isLast  && <p className="j-info">Destination</p>}
                {isChange && <span className="j-change" style={{ color: s.lineColor }}>Change to {s.lineName}</span>}
                {!s.isFirst && !s.isLast && !isChange && i % 4 === 0 && (
                  <span className="j-change">Continue</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
