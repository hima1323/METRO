import { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header/Header';
import MapView from './components/MapView/MapView';
import SidePanel from './components/SidePanel/SidePanel';
import AIChat from './components/AIChat/AIChat';
import { METRO_CITIES } from './data/metroData';
import { useMetroGraph } from './hooks/useMetroGraph';
import { useAIChat } from './hooks/useAIChat';

function App() {
  const [cityKey, setCityKey] = useState('delhi');
  const [algo, setAlgo] = useState('dijkstra-cost');
  const [source, setSource] = useState({ key: null, name: '' });
  const [dest, setDest] = useState({ key: null, name: '' });
  const [routeResult, setRouteResult] = useState(null);

  const cityData = METRO_CITIES[cityKey];
  const { findRoute, animatePath, clearAnimation, animatedPath, isAnimating } = useMetroGraph();
  const { messages, sendMessage, isTyping, aiCfg, saveCfg } = useAIChat(cityKey, cityData, (src, dst) => findRoute(cityData, src, dst, algo));

  useEffect(() => {
    setSource({ key: null, name: '' });
    setDest({ key: null, name: '' });
    setRouteResult(null);
    clearAnimation();
  }, [cityKey, clearAnimation]);

  useEffect(() => {
    if (source.key && dest.key && source.key !== dest.key) {
      const res = findRoute(cityData, source.key, dest.key, algo);
      setRouteResult(res);
      if (res && res.path) animatePath(res.path);
    } else {
      setRouteResult(null);
      clearAnimation();
    }
  }, [source.key, dest.key, algo, cityData, findRoute, animatePath, clearAnimation]);

  const handleApplyRoute = (from, to) => {
    setSource(from);
    setDest(to);
  };

  return (
    <div className="app-layout">
      <Header currentCity={cityKey} onCityChange={setCityKey} />
      
      <MapView 
        city={cityData} 
        animatedPath={animatedPath} 
      />
      
      <SidePanel
        city={cityData}
        cityKey={cityKey}
        algo={algo}
        setAlgo={setAlgo}
        source={source}
        setSource={setSource}
        dest={dest}
        setDest={setDest}
        routeResult={routeResult}
        isAnimating={isAnimating}
      />

      <AIChat
        messages={messages}
        sendMessage={sendMessage}
        isTyping={isTyping}
        aiCfg={aiCfg}
        saveCfg={saveCfg}
        onApplyRoute={handleApplyRoute}
      />
    </div>
  );
}

export default App;
