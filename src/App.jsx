import { useState, useCallback, useRef } from 'react';
import Header from './components/Header/Header';
import SidePanel from './components/SidePanel/SidePanel';
import MapView from './components/MapView/MapView';
import AIChat from './components/AIChat/AIChat';
import { METRO_CITIES } from './data/metroData';
import { useMetroGraph } from './hooks/useMetroGraph';
import { useAIChat } from './hooks/useAIChat';

export default function App() {
  const [currentCity, setCurrentCity] = useState('delhi');
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [routeResult, setRouteResult] = useState(null);
  const [mapSelected, setMapSelected] = useState(null);
  
  const cityData = METRO_CITIES[currentCity];

  const {
    findRoute: graphFindRoute,
    animatePath,
    clearAnimation,
    animatedPath,
    isAnimating
  } = useMetroGraph();

  // Wrap findRoute to handle animations & state
  const handleFindRoute = useCallback(async (src, dest, algo) => {
    clearAnimation();
    setRouteResult(null);
    
    // Simulate slight delay for effect
    await new Promise(r => setTimeout(r, 400));
    
    const res = graphFindRoute(cityData, src, dest, algo);
    setRouteResult(res);
    
    if (res && res.path.length > 0) {
      animatePath(res.path);
      // Auto-collapse panel on mobile to show map
      if (window.innerWidth <= 768) setPanelCollapsed(true);
    }
    
    return res;
  }, [cityData, graphFindRoute, animatePath, clearAnimation]);

  const chat = useAIChat(currentCity, cityData, (src, dest) => {
    // LLM found a route, just return the raw data, don't auto-animate yet
    return graphFindRoute(cityData, src, dest, 'dijkstra-cost');
  });

  const handleApplyRoute = useCallback(async (src, dest) => {
    // When user clicks "Show on Map" from AI chat
    setPanelCollapsed(false);
    await handleFindRoute(src, dest, 'dijkstra-cost');
  }, [handleFindRoute]);

  const handleCityChange = useCallback((newCity) => {
    setCurrentCity(newCity);
    setRouteResult(null);
    setMapSelected(null);
    clearAnimation();
  }, [clearAnimation]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <Header currentCity={currentCity} onCityChange={handleCityChange} />
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <SidePanel 
          collapsed={panelCollapsed}
          onToggle={() => setPanelCollapsed(!panelCollapsed)}
          cityData={cityData}
          currentCity={currentCity}
          onFindRoute={handleFindRoute}
          result={routeResult}
          isAnimating={isAnimating}
          mapSelected={mapSelected}
        />
        
        <MapView 
          cityData={cityData} 
          result={routeResult} 
          animatedPath={animatedPath} 
          onStationClick={(key, name) => setMapSelected({ key, name, time: Date.now() })}
        />
        
        <AIChat 
          chat={chat} 
          onApplyRoute={handleApplyRoute} 
        />
      </div>
    </div>
  );
}
