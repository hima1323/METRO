import { useEffect, useRef, useMemo } from 'react';
import {
  MapContainer, TileLayer,
  Polyline, CircleMarker, Tooltip, LayerGroup
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

/* ── Legend Component ─────────────────── */
function Legend({ lines }) {
  return (
    <div className="map-legend">
      {Object.entries(lines).map(([key, line]) => (
        <div key={key} className="legend-item">
          <span className="legend-swatch" style={{ background: line.color }} />
          <span className="legend-label">{line.name}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Build edge coords from city ─────── */
function buildEdgePaths(city) {
  const paths = {};
  (city.edges || []).forEach(([a, b]) => {
    const ca = city.stations[a];
    const cb = city.stations[b];
    if (!ca || !cb) return;
    const coordsA = Array.isArray(ca[0]) ? ca[0] : [ca[0], ca[1]];
    const coordsB = Array.isArray(cb[0]) ? cb[0] : [cb[0], cb[1]];
    // Determine shared line
    const lineA = ca[2] || ca[1];
    const lineB = cb[2] || cb[1];
    const lineKey = lineA === lineB ? lineA : lineA;
    if (!paths[lineKey]) paths[lineKey] = [];
    // Store as pairs for proper separate edges
    paths[lineKey].push([coordsA, coordsB]);
  });
  return paths;
}

/* ── MapView ─────────────────────────── */
export default function MapView({ cityData, result, animatedPath, onStationClick }) {
  const mapRef = useRef(null);

  // Fly to new city on change
  useEffect(() => {
    if (!mapRef.current || !cityData) return;
    mapRef.current.flyTo(cityData.center, cityData.zoom, { duration: 1.2 });
  }, [cityData]);

  const edgePaths = useMemo(() => {
    if (!cityData) return {};
    return buildEdgePaths(cityData);
  }, [cityData]);

  // Build animated path coords
  const animCoords = useMemo(() => {
    if (!animatedPath || animatedPath.length < 2 || !cityData) return [];
    return animatedPath.map(key => {
      const s = cityData.stations[key];
      return s ? (Array.isArray(s[0]) ? s[0] : [s[0], s[1]]) : null;
    }).filter(Boolean);
  }, [animatedPath, cityData]);

  // Full route highlight coords
  const routeCoords = useMemo(() => {
    if (!result?.path || !cityData) return [];
    return result.path.map(key => {
      const s = cityData.stations[key];
      return s ? (Array.isArray(s[0]) ? s[0] : [s[0], s[1]]) : null;
    }).filter(Boolean);
  }, [result, cityData]);

  if (!cityData) return <div className="map-loading">Loading map…</div>;

  const stations = cityData.stations || {};
  const lines    = cityData.lines || {};

  // Which stations are on the route
  const routeSet = new Set(result?.path || []);
  const animSet  = new Set(animatedPath || []);

  return (
    <div className="map-wrap">
      <MapContainer
        center={cityData.center}
        zoom={cityData.zoom}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
          subdomains="abcd"
        />

        {/* ── Metro Lines ── */}
        {Object.entries(edgePaths).map(([lineKey, pairs]) => {
          const color = lines[lineKey]?.color || '#8b5e38';
          return pairs.map((pair, i) => (
            <Polyline
              key={`${lineKey}-${i}`}
              positions={pair}
              pathOptions={{ color, weight: 4, opacity: 0.75 }}
            />
          ));
        })}


        {/* ── Station Markers ── */}
        {Object.entries(stations).map(([key, s]) => {
          // Data format: [[lat, lng], 'Name', 'lineKey']
          const coords  = s[0]; // always an array [lat, lng]
          const stName  = s[1] || key;
          const lineKey = s[2];
          const color   = lines[lineKey]?.color || '#8b5e38';

          const isOnRoute  = routeSet.has(key);
          const isAnimated = animSet.has(key);
          const isRouteEnd = result?.path?.[0] === key || result?.path?.[result.path.length-1] === key;

          // Bigger & brighter markers for route stations
          const radius    = isRouteEnd ? 10 : isOnRoute ? 8 : 5;
          const fillColor = isRouteEnd ? '#00c8a0' : isAnimated ? '#00e5bb' : isOnRoute ? '#00b891' : color;
          const fillOpa   = isAnimated || isOnRoute ? 1 : 0.95;
          const weight    = isRouteEnd ? 3 : isOnRoute ? 2 : 1.5;
          const strokeColor = '#fff';

          return (
            <LayerGroup key={key}>
              {/* Invisible Hit Area for Easier Clicking */}
              <CircleMarker
                center={coords}
                radius={24}
                pathOptions={{ opacity: 0, fillOpacity: 0 }}
                eventHandlers={{
                  click: () => onStationClick && onStationClick(key, stName)
                }}
              />
              
              {/* Visible Marker */}
              <CircleMarker
                center={coords}
                radius={radius}
                pathOptions={{
                  fillColor, fillOpacity: fillOpa,
                  color: strokeColor, weight,
                }}
                interactive={false}
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', fontWeight: 600 }}>
                    {stName}
                    {isRouteEnd && <span style={{ display:'block', fontSize:'0.65rem', color:'#9a7858', fontWeight:400 }}>
                      {result?.path?.[0] === key ? 'Departure' : 'Arrival'}
                    </span>}
                  </div>
                </Tooltip>
              </CircleMarker>
            </LayerGroup>
          );
        })}

        {/* ── Station Labels for route ── */}
        {result?.path?.map((key, i) => {
          if (i !== 0 && i !== result.path.length - 1) return null;
          const s = stations[key];
          if (!s) return null;
          const coords = s[0];
          const stName = s[1] || key;
          return (
            <CircleMarker
              key={`label-${key}`}
              center={coords}
              radius={0}
              pathOptions={{ opacity: 0, fillOpacity: 0 }}
            >
              <Tooltip permanent direction="top" offset={[0, -10]} className="station-label-tooltip">
                {stName}
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* ── Route Path: glow backdrop ── */}
        {routeCoords.length > 1 && (
          <Polyline
            positions={routeCoords}
            pathOptions={{ color: '#ff6b00', weight: 14, opacity: 0.22, lineCap: 'round', lineJoin: 'round' }}
          />
        )}
        {/* ── Route Path: solid line ── */}
        {routeCoords.length > 1 && (
          <Polyline
            positions={routeCoords}
            pathOptions={{ color: '#ff6b00', weight: 6, opacity: 0.55, dashArray: '12 6', lineCap: 'round' }}
          />
        )}
        {/* ── Animated Path: vivid on top ── */}
        {animCoords.length > 1 && (
          <Polyline
            positions={animCoords}
            pathOptions={{ color: '#ff6b00', weight: 8, opacity: 1, lineCap: 'round', lineJoin: 'round' }}
          />
        )}

      </MapContainer>


      <Legend lines={lines} />
    </div>
  );
}
