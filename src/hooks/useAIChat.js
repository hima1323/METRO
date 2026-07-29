import { useState, useCallback, useRef } from 'react';
import { LANDMARKS } from '../data/metroData';

// ─── API key from .env (VITE_GEMINI_KEY) ──────────────────────────────────
const DEFAULT_GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || '';
const CFG_KEY = 'metro_ai_cfg';

function loadCfg() {
  try { return JSON.parse(localStorage.getItem(CFG_KEY)) || {}; } catch { return {}; }
}

// ─── Fix: station data format is [[lat,lng], 'Name', 'lineKey'] so name = v[1]
function resolveLocation(text, cityKey, stations) {
  const t = text.toLowerCase().trim();
  const lm = LANDMARKS[cityKey] || {};
  for (const [k, v] of Object.entries(lm)) {
    if (t.includes(k)) return { key: v, name: stations[v]?.[1] || v };
  }
  for (const [k, v] of Object.entries(stations)) {
    const name = (v[1] || k).toLowerCase();
    if (t.includes(name) || name.includes(t)) return { key: k, name: v[1] || k };
  }
  return null;
}

// ─── Google AI Studio (Gemini) ─────────────────────────────────────────────
async function callGemini(prompt, apiKey, model = 'gemini-2.0-flash', cityName = '', stationList = '') {
  const key = apiKey || DEFAULT_GEMINI_KEY;
  const systemContext = `You are MetroBot, a smart metro route assistant for Indian cities.
Current city: ${cityName || 'Unknown'}.
Available station keys (for route extraction): ${stationList}.

Instructions:
- Answer questions about metro routes, fares, travel time, and city info naturally.
- If the user asks to go from A to B, identify the two station keys and include this on the LAST line of your response:
  ROUTE: from=<station_key>, to=<station_key>
- Use actual station keys from the list above (lowercase_with_underscores).
- Be conversational, concise, and helpful. Keep answers under 80 words.
- If you don't know a station, say so politely.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemContext}\n\nUser: ${prompt}` }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 300,
          temperature: 0.4,
        },
      }),
      signal: AbortSignal.timeout(20000),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini ${res.status}: ${err?.error?.message || 'API error'}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── Route tag parser ──────────────────────────────────────────────────────
function parseRoute(text) {
  const m = text.match(/ROUTE\s*:\s*from\s*=\s*(\w+)\s*,\s*to\s*=\s*(\w+)/i);
  return m ? { from: m[1], to: m[2] } : null;
}

// ─── Rule-based fallback ───────────────────────────────────────────────────
function ruleBasedRespond(text, cityKey, stations, findRoute) {
  const t = text.toLowerCase();
  const words = t.split(/\s+/);
  const fromWords = ['from', 'starting', 'start', 'source', 'leaving', 'depart'];
  const toWords   = ['to', 'destination', 'dest', 'going', 'reach', 'arrive', 'visit'];

  const markers = [];
  words.forEach((w, i) => {
    if (fromWords.includes(w)) markers.push({ type: 'from', idx: i });
    if (toWords.includes(w))   markers.push({ type: 'to',   idx: i });
  });

  const lm = LANDMARKS[cityKey] || {};
  const stationNames = Object.entries(stations).map(([k, v]) => ({
    key: k,
    name: (v[1] || k).toLowerCase(),
  }));

  function findInText(hint) {
    if (!hint) return null;
    const slice = words.slice(hint.idx + 1, hint.idx + 8).join(' ');
    for (const [k, v] of Object.entries(lm)) {
      if (slice.includes(k)) return { key: v, name: stations[v]?.[1] || v };
    }
    for (const { key, name } of stationNames) {
      if (slice.includes(name)) return { key, name: stations[key]?.[1] || key };
    }
    return null;
  }

  const fromM = markers.find(m => m.type === 'from');
  const toM   = markers.find(m => m.type === 'to');
  let fromHint = fromM ? findInText(fromM) : null;
  let toHint   = toM   ? findInText(toM)   : null;

  if (!fromHint || !toHint) {
    const found = [];
    for (const [k, v] of Object.entries(lm)) {
      if (t.includes(k) && found.length < 2) found.push({ key: v, name: stations[v]?.[1] || v });
    }
    if (found.length < 2) {
      for (const { key, name } of stationNames) {
        if (t.includes(name) && found.length < 2 && !found.find(f => f.key === key)) {
          found.push({ key, name: stations[key]?.[1] || key });
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
    return { type: 'text', text: "Hello! I'm your Metro assistant powered by Gemini. Ask me things like: \"Rajiv Chowk to Hauz Khas\" or \"nearest metro from India Gate\"." };
  }

  return {
    type: 'text',
    text: "I couldn't identify two locations in your message. Please mention a start and destination — e.g. \"Connaught Place to Kashmere Gate\".",
  };
}

// ─── Main hook ────────────────────────────────────────────────────────────
export function useAIChat(currentCity, cityData, findRoute) {
  const [messages, setMessages] = useState([
    {
      id: 0,
      role: 'ai',
      content: "Hi! I'm MetroBot, powered by <b>Google Gemini</b>. Ask me anything like: <i>\"India Gate to Red Fort\"</i>, <i>\"How long from Rajiv Chowk to Hauz Khas?\"</i>, or just name two places.",
      type: 'text',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [aiCfg, setAICfg] = useState(() => ({
    backend: 'gemini',
    geminiKey: DEFAULT_GEMINI_KEY,
    geminiModel: 'gemini-2.0-flash',
    ...loadCfg(),
  }));
  const idRef = useRef(1);

  const saveCfg = useCallback((cfg) => {
    setAICfg(cfg);
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || !cityData) return;

    const id = idRef.current++;
    setMessages(prev => [...prev, { id, role: 'user', content: text, type: 'text' }]);
    setIsTyping(true);

    const typingId = idRef.current++;
    setMessages(prev => [...prev, { id: typingId, role: 'ai', content: '...', type: 'typing' }]);

    const stations   = cityData.stations;
    const cityName   = cityData.name || currentCity;
    // Build a compact station key list to help Gemini pick the right keys
    const stationList = Object.entries(stations)
      .map(([k, v]) => `${k}(${v[1] || k})`)
      .join(', ');

    let llmText = null;
    let usedBackend = 'rule';

    // ── Try Gemini first ────────────────────────────────────────────────
    const gKey = aiCfg.geminiKey || DEFAULT_GEMINI_KEY;
    if (gKey && (aiCfg.backend === 'gemini' || aiCfg.backend === 'auto')) {
      try {
        llmText = await callGemini(text, gKey, aiCfg.geminiModel || 'gemini-2.0-flash', cityName, stationList);
        usedBackend = 'gemini';
      } catch (e) {
        console.warn('Gemini failed:', e.message);
      }
    }

    // ── Process Gemini response ─────────────────────────────────────────
    if (llmText) {
      const routeTag  = parseRoute(llmText);
      // Remove the ROUTE: line from displayed text
      const cleanText = llmText.replace(/ROUTE\s*:.*$/im, '').trim();

      if (routeTag) {
        // Try to resolve station keys from the tag Gemini generated
        const fromRes = stations[routeTag.from]
          ? { key: routeTag.from, name: stations[routeTag.from]?.[1] || routeTag.from }
          : resolveLocation(routeTag.from, currentCity, stations);

        const toRes = stations[routeTag.to]
          ? { key: routeTag.to, name: stations[routeTag.to]?.[1] || routeTag.to }
          : resolveLocation(routeTag.to, currentCity, stations);

        if (fromRes && toRes) {
          const result = findRoute(fromRes.key, toRes.key);
          setMessages(prev => prev.map(m => m.id === typingId
            ? { ...m, content: cleanText, type: 'route', from: fromRes, to: toRes, result, backend: usedBackend }
            : m));
          setIsTyping(false);
          return;
        }
      }
      // Plain text response from Gemini (no route detected)
      setMessages(prev => prev.map(m => m.id === typingId
        ? { ...m, content: cleanText, type: 'text', backend: usedBackend }
        : m));
      setIsTyping(false);
      return;
    }

    // ── Rule-based fallback ─────────────────────────────────────────────
    const resp = ruleBasedRespond(text, currentCity, stations, (src, dst) => findRoute(src, dst));
    if (resp.type === 'route') {
      setMessages(prev => prev.map(m => m.id === typingId
        ? { ...m, content: '', type: 'route', from: resp.from, to: resp.to, result: resp.result, backend: 'rule' }
        : m));
    } else {
      setMessages(prev => prev.map(m => m.id === typingId
        ? { ...m, content: resp.text, type: 'text', backend: 'rule' }
        : m));
    }
    setIsTyping(false);
  }, [aiCfg, cityData, currentCity, findRoute]);

  return { messages, sendMessage, isTyping, aiCfg, saveCfg };
}
