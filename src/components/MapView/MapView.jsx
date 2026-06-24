import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

function MapUpdater({ center, zoom, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], duration: 1 });
    } else {
      map.setView(center, zoom, { animate: true, duration: 1 });
    }
  }, [center, zoom, bounds, map]);
  return null;
}

export default function MapView({ city, animatedPath }) {
  const isRouting = animatedPath && animatedPath.length > 0;
  
  // Compute bounds if routing
  let bounds = null;
  if (isRouting) {
    const lats = animatedPath.map(k => city.stations[k][0][0]);
    const lngs = animatedPath.map(k => city.stations[k][0][1]);
    if (lats.length) {
      bounds = L.latLngBounds(
        L.latLng(Math.min(...lats), Math.min(...lngs)),
        L.latLng(Math.max(...lats), Math.max(...lngs))
      );
    }
  }

  return (
    <div className="map-container">
      <MapContainer center={city.center} zoom={city.zoom} zoomControl={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <L.Control.Zoom position="bottomright" />
        <MapUpdater center={city.center} zoom={city.zoom} bounds={bounds} />

        {/* Base edges */}
        {!isRouting && (city.edges || []).map((e, i) => {
          const s1 = city.stations[e[0]];
          const s2 = city.stations[e[1]];
          if (!s1 || !s2) return null;
          let color = '#ccc';
          if (s1[2] === s2[2]) color = city.lines[s1[2]].color;
          return (
            <Polyline key={`edge-${i}`} positions={[s1[0], s2[0]]} color={color} weight={3} opacity={0.4} />
          );
        })}

        {/* Base stations */}
        {!isRouting && Object.entries(city.stations).map(([k, s]) => {
          const color = city.lines[s[2]]?.color || '#333';
          return (
            <CircleMarker key={k} center={s[0]} radius={4} color={color} fillColor="#fff" fillOpacity={1} weight={2}>
              <Tooltip direction="top" offset={[0, -5]} className="map-tooltip" opacity={1}>{s[1]}</Tooltip>
            </CircleMarker>
          );
        })}

        {/* Routing edges */}
        {isRouting && animatedPath.map((k, i) => {
          if (i === 0) return null;
          const prev = animatedPath[i-1];
          const s1 = city.stations[prev];
          const s2 = city.stations[k];
          let color = '#333';
          if (s1[2] === s2[2]) color = city.lines[s1[2]].color;
          return (
            <Polyline key={`route-edge-${i}`} positions={[s1[0], s2[0]]} color={color} weight={5} opacity={0.9} />
          );
        })}

        {/* Routing stations */}
        {isRouting && animatedPath.map((k, i) => {
          const s = city.stations[k];
          const color = city.lines[s[2]]?.color || '#333';
          const isCurrent = i === animatedPath.length - 1;
          const isEndpoint = i === 0 || i === animatedPath.length - 1;
          return (
            <CircleMarker 
              key={`route-stn-${k}`} 
              center={s[0]} 
              radius={isEndpoint ? 8 : 5} 
              color={color} 
              fillColor={isEndpoint ? color : "#fff"} 
              fillOpacity={1} 
              weight={isEndpoint ? 2 : 3}
              pathOptions={{ className: isCurrent ? 'anim-glow' : '' }}
            >
              <Tooltip direction="top" offset={[0, -10]} className="map-tooltip" opacity={1} permanent={isEndpoint}>{s[1]}</Tooltip>
            </CircleMarker>
          );
        })}

      </MapContainer>
    </div>
  );
}
