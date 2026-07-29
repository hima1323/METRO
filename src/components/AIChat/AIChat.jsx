import { useState, useEffect, useRef } from 'react';
import './AIChat.css';

/* ── SVG Icons ─────────────────────────── */
const IcoBot = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="22" height="22">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8.01" y2="16" />
    <line x1="16" y1="16" x2="16.01" y2="16" />
  </svg>
);
const IcoSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IcoClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcoGear = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IcoSave = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
const IcoMap = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);

/* ── Chat Messages ──────────────────────── */
function ChatMessage({ msg, onApplyRoute }) {
  if (msg.type === 'typing') {
    return (
      <div className="chat-msg ai">
        <div className="ai-avatar"><IcoBot /></div>
        <div className="chat-bubble ai-bubble typing">
          <span className="dot" /><span className="dot" /><span className="dot" />
        </div>
      </div>
    );
  }

  if (msg.role === 'user') {
    return (
      <div className="chat-msg user">
        <div className="chat-bubble user-bubble">{msg.content}</div>
      </div>
    );
  }

  if (msg.type === 'route' && msg.result) {
    const mins = msg.result.distance ? ((msg.result.distance / 30) * 60).toFixed(0) : '?';
    const stops = msg.result.path.length - 1;
    const backendLabel = msg.backend === 'ollama' ? 'Llama via Ollama' :
                         msg.backend === 'groq'   ? 'Llama via Groq' : 'Rule-based';

    return (
      <div className="chat-msg ai">
        <div className="ai-avatar"><IcoBot /></div>
        <div className="chat-bubble ai-bubble">
          {msg.content && <div className="ai-llm-text" dangerouslySetInnerHTML={{ __html: msg.content }} />}
          <div className="ai-route-card">
            <div className="ai-route-title">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{verticalAlign:'-1px', marginRight:'5px'}}><path d="M20 6L9 17l-5-5"/></svg>
              Route Found
            </div>
            <div className="ai-route-row"><span className="ai-tag src-tag">FROM</span><b>{msg.from.name}</b></div>
            <div className="ai-route-row"><span className="ai-tag dst-tag">TO</span><b>{msg.to.name}</b></div>
            <div className="ai-route-stats">
              <span>~{mins} min</span>
              <span>{msg.result.distance?.toFixed(1)} km</span>
              <span>&#8377;{msg.result.cost}</span>
              <span>{stops} stop{stops !== 1 ? 's' : ''}</span>
            </div>
            <div className="ai-backend-tag">{backendLabel}</div>
            <button className="ai-use-btn" onClick={() => onApplyRoute(msg.from.key, msg.to.key)}>
              <IcoMap /> Show on Map
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-msg ai">
      <div className="ai-avatar"><IcoBot /></div>
      <div className="chat-bubble ai-bubble" dangerouslySetInnerHTML={{ __html: msg.content }} />
    </div>
  );
}

/* ── Settings Panel ─────────────────────── */
function SettingsPanel({ aiCfg, onSave, onClose }) {
  const [cfg, setCfg] = useState(aiCfg);

  return (
    <div className="ai-settings-panel">
      <div className="cfg-group">
        <label>Backend Provider</label>
        <select value={cfg.backend} onChange={e => setCfg({...cfg, backend: e.target.value})}>
          <option value="gemini">Google Gemini (AI Studio)</option>
          <option value="rule">Rule-based (No AI)</option>
        </select>
      </div>
      <div className="cfg-group">
        <label>Gemini API Key</label>
        <input
          type="password"
          value={cfg.geminiKey || ''}
          onChange={e => setCfg({...cfg, geminiKey: e.target.value})}
          placeholder="Paste Google AI Studio key"
        />
      </div>
      <div className="cfg-group">
        <label>Gemini Model</label>
        <select value={cfg.geminiModel || 'gemini-2.0-flash'} onChange={e => setCfg({...cfg, geminiModel: e.target.value})}>
          <option value="gemini-2.0-flash">gemini-2.0-flash (Fast)</option>
          <option value="gemini-1.5-flash">gemini-1.5-flash</option>
          <option value="gemini-1.5-pro">gemini-1.5-pro (Smart)</option>
        </select>
      </div>
      <button className="cfg-save-btn" onClick={() => { onSave(cfg); onClose(); }}>
        <IcoSave /> Save Settings
      </button>
    </div>
  );
}

/* ── Main AIChat ────────────────────────── */
export default function AIChat({ chat, onApplyRoute }) {
  const { messages, sendMessage, isTyping, aiCfg, saveCfg } = chat;
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    sendMessage(input);
    setInput('');
  };

  const badgeText = aiCfg.backend === 'rule' ? 'Rule-based' : 'Gemini AI';

  return (
    <>
      {/* FAB */}
      <button className={`ai-fab ${open ? 'hidden' : ''}`} onClick={() => setOpen(true)}>
        <span className="ai-fab-pulse" />
        <span className="ai-fab-icon"><IcoBot /></span>
      </button>

      {/* Chat Panel */}
      <div className={`ai-chat-panel ${open ? 'open' : ''}`}>
        <div className="ai-chat-hdr">
          <div className="ai-hdr-left">
            <span className="ai-hdr-icon"><IcoBot /></span>
            <span className="ai-hdr-title">Metro AI</span>
            <span className="ai-status-badge">{badgeText}</span>
          </div>
          <div className="ai-hdr-actions">
            <button className="ai-hdr-btn" onClick={() => setShowSettings(!showSettings)}><IcoGear /></button>
            <button className="ai-hdr-btn" onClick={() => setOpen(false)}><IcoClose /></button>
          </div>
        </div>

        {showSettings && (
          <SettingsPanel aiCfg={aiCfg} onSave={saveCfg} onClose={() => setShowSettings(false)} />
        )}

        <div className="ai-chat-body" ref={scrollRef}>
          {messages.map(m => (
            <ChatMessage key={m.id} msg={m} onApplyRoute={onApplyRoute} />
          ))}
        </div>

        <div className="ai-chat-foot">
          <form className="ai-input-wrap" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="e.g. India Gate to Chandni Chowk"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isTyping}
            />
            <button type="submit" className="ai-send-btn" disabled={!input.trim() || isTyping}>
              <IcoSend />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
