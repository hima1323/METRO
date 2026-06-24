import { useState, useCallback, useRef } from 'react';
import { LANDMARKS } from '../data/metroData';

const CFG_KEY = 'metro_ai_cfg';

function loadCfg() {
  try { return JSON.parse(localStorage.getItem(CFG_KEY)) || {}; } catch { return {}; }
}

function resolveLocation(text, cityKey, stations) {
  const t = text.toLowerCase().trim();
  const lm = LANDMARKS[cityKey] || {};
  for (const [k, v] of Object.entries(lm)) {
    if (t.includes(k)) return { key: v, name: stations[v]?.[0] || v };
  }
  for (const [k, v] of Object.entries(stations)) {
    const name = v[0].toLowerCase();
    if (t.includes(name) || name.includes(t)) return { key: k, name: v[0] };
  }
  return null;
}

async function callOllama(prompt, url, model) {
  const res = await fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: model || 'llama3.2', prompt, stream: false }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  const data = await res.json();
  return data.response || '';
}

async function callGroq(prompt, key, model) {
  const sys = 'You are a metro route assistant. When asked about a journey between two places, respond with ROUTE: from=<station_key>, to=<station_key> on the last line.';
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: model || 'llama-3.1-8b-instant',
      messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }],
      max_tokens: 300,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function parseRoute(text) {
  const m = text.match(/ROUTE\s*:\s*from\s*=\s*(\w+)\s*,\s*to\s*=\s*(\w+)/i);
  return m ? { from: m[1], to: m[2] } : null;
}

function ruleBasedRespond(text, cityKey, stations, findRoute) {
  const t = text.toLowerCase();
  const words = t.split(/\s+/);
  const fromWords = ['from','starting','start','source','leaving','depart'];
  const toWords = ['to','destination','dest','going','reach','arrive','visit','go to'];

  let fromHint = null, toHint = null;
  const markers = [];
  words.forEach((w, i) => {
    if (fromWords.includes(w)) markers.push({ type: 'from', idx: i });
    if (toWords.includes(w)) markers.push({ type: 'to', idx: i });
  });

  const lm = LANDMARKS[cityKey] || {};
  const stationNames = Object.entries(stations).map(([k, v]) => ({ key: k, name: v[0].toLowerCase() }));

  function findInText(hint) {
    if (!hint) return null;
    const slice = words.slice(hint.idx + 1, hint.idx + 8).join(' ');
    for (const [k, v] of Object.entries(lm)) {
      if (slice.includes(k)) return { key: v, name: stations[v]?.[0] || v };
    }
    for (const { key, name } of stationNames) {
      if (slice.includes(name)) return { key, name: stations[key]?.[0] };
    }
    return null;
  }

  const fromM = markers.find(m => m.type === 'from');
  const toM = markers.find(m => m.type === 'to');
  if (fromM) fromHint = findInText(fromM);
  if (toM) toHint = findInText(toM);

  if (!fromHint || !toHint) {
    // Fuzzy: find any two locations mentioned
    const found = [];
    for (const [k, v] of Object.entries(lm)) {
      if (t.includes(k) && found.length < 2) found.push({ key: v, name: stations[v]?.[0] || v });
    }
    if (found.length < 2) {
      for (const { key, name } of stationNames) {
        if (t.includes(name) && found.length < 2 && !found.find(f => f.key === key)) {
          found.push({ key, name: stations[key]?.[0] });
        }
      }
    }
    if (found.length === 2) { fromHint = found[0]; toHint = found[1]; }
  }

  if (fromHint && toHint) {
    const result = findRoute(fromHint.key, toHint.key);
    return { type: 'route', from: fromHint, to: toHint, result };
  }

  if (t.includes('hello') || t.includes('hi') || t.includes('hey')) {
    return { type: 'text', text: "Hello! I can help you find metro routes. Try: \"India Gate to Red Fort\" or name any two places." };
  }
  return { type: 'text', text: "I couldn't identify two locations. Please mention a start and destination, e.g. \"Rajiv Chowk to Kashmere Gate\"." };
}

export function useAIChat(currentCity, cityData, findRoute) {
  const [messages, setMessages] = useState([
    { id: 0, role: 'ai', content: "Hi! I'm your Metro AI Assistant. Ask me things like: \"India Gate to Red Fort\" or \"nearest metro from Connaught Place\". I support Ollama (local) and Groq (cloud) for real AI responses.", type: 'text' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [aiCfg, setAICfg] = useState(() => ({
    backend: 'auto',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'llama3.2',
    groqKey: '',
    groqModel: 'llama-3.1-8b-instant',
    ...loadCfg()
  }));
  const idRef = useRef(1);

  const saveCfg = useCallback((cfg) => {
    setAICfg(cfg);
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  }, []);

  const addMessage = (role, content, type = 'text', extra = {}) => {
    const id = idRef.current++;
    setMessages(prev => [...prev, { id, role, content, type, ...extra }]);
    return id;
  };

  const updateMessage = useCallback((id, content, type = 'text', extra = {}) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content, type, ...extra } : m));
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || !cityData) return;
    addMessage('user', text);
    setIsTyping(true);
    const typingId = idRef.current++;
    setMessages(prev => [...prev, { id: typingId, role: 'ai', content: '...', type: 'typing' }]);

    let llmText = null, usedBackend = 'rule';
    const cfg = aiCfg;

    if (cfg.backend === 'auto' || cfg.backend === 'ollama') {
      try {
        llmText = await callOllama(text, cfg.ollamaUrl, cfg.ollamaModel);
        usedBackend = 'ollama';
      } catch {}
    }
    if (!llmText && cfg.groqKey && (cfg.backend === 'auto' || cfg.backend === 'groq')) {
      try {
        llmText = await callGroq(text, cfg.groqKey, cfg.groqModel);
        usedBackend = 'groq';
      } catch {}
    }

    const stations = cityData.stations;

    if (llmText) {
      const route = parseRoute(llmText);
      const cleanText = llmText.replace(/ROUTE\s*:.*/i, '').trim();
      if (route) {
        const fromRes = resolveLocation(route.from, currentCity, stations);
        const toRes = resolveLocation(route.to, currentCity, stations);
        if (fromRes && toRes) {
          const result = findRoute(fromRes.key, toRes.key);
          setMessages(prev => prev.map(m => m.id === typingId ? {
            ...m, content: cleanText, type: 'route',
            from: fromRes, to: toRes, result, backend: usedBackend
          } : m));
          setIsTyping(false); return;
        }
      }
      setMessages(prev => prev.map(m => m.id === typingId ? { ...m, content: cleanText, type: 'text' } : m));
      setIsTyping(false); return;
    }

    // Rule-based fallback
    const resp = ruleBasedRespond(text, currentCity, stations, (src, dst) => {
      return findRoute(src, dst);
    });
    if (resp.type === 'route') {
      setMessages(prev => prev.map(m => m.id === typingId ? {
        ...m, content: '', type: 'route',
        from: resp.from, to: resp.to, result: resp.result, backend: 'rule'
      } : m));
    } else {
      setMessages(prev => prev.map(m => m.id === typingId ? { ...m, content: resp.text, type: 'text' } : m));
    }
    setIsTyping(false);
  }, [aiCfg, cityData, currentCity, findRoute]);

  return { messages, sendMessage, isTyping, aiCfg, saveCfg };
}
