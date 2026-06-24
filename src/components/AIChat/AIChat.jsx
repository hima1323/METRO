import { useState, useRef, useEffect } from 'react';
import './AIChat.css';

const BotIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/>
    <path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>
  </svg>
);
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

export default function AIChat({ messages, sendMessage, isTyping, aiCfg, saveCfg, onApplyRoute }) {
  const [text, setText] = useState('');
  const [showCfg, setShowCfg] = useState(false);
  const [tempCfg, setTempCfg] = useState(aiCfg);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { setTempCfg(aiCfg); }, [showCfg, aiCfg]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || isTyping) return;
    sendMessage(text);
    setText('');
  };

  const handleSave = () => { saveCfg(tempCfg); setShowCfg(false); };

  const getBackendName = (b) => {
    if (b === 'ollama') return 'Ollama (Local)';
    if (b === 'groq') return 'Groq (Cloud)';
    return 'Rule-based';
  };

  return (
    <div className="ai-chat-panel">
      {showCfg && (
        <div className="settings-modal">
          <div className="modal-title">AI Settings</div>
          <div className="cfg-group">
            <span className="cfg-label">Backend Provider</span>
            <select className="cfg-select" value={tempCfg.backend} onChange={e=>setTempCfg({...tempCfg, backend: e.target.value})}>
              <option value="auto">Auto (Ollama ➔ Groq ➔ Rules)</option>
              <option value="ollama">Ollama (Local)</option>
              <option value="groq">Groq (Cloud API)</option>
            </select>
          </div>
          <div className="cfg-group">
            <span className="cfg-label">Ollama URL</span>
            <input className="cfg-input" type="text" value={tempCfg.ollamaUrl} onChange={e=>setTempCfg({...tempCfg, ollamaUrl: e.target.value})} />
          </div>
          <div className="cfg-group">
            <span className="cfg-label">Ollama Model</span>
            <input className="cfg-input" type="text" value={tempCfg.ollamaModel} onChange={e=>setTempCfg({...tempCfg, ollamaModel: e.target.value})} />
          </div>
          <div className="cfg-group">
            <span className="cfg-label">Groq API Key</span>
            <input className="cfg-input" type="password" value={tempCfg.groqKey} onChange={e=>setTempCfg({...tempCfg, groqKey: e.target.value})} placeholder="gsk_..." />
          </div>
          <button className="cfg-save" onClick={handleSave}>Save Settings</button>
        </div>
      )}

      <div className="ai-header">
        <div className="ai-brand">
          <div className="ai-avatar"><BotIcon /></div>
          <div>
            <div className="ai-title">Metro AI</div>
            <div className="ai-status">
              <span className={`status-dot ${aiCfg.backend === 'auto' && !aiCfg.groqKey ? 'offline' : ''}`} />
              {aiCfg.backend === 'auto' && !aiCfg.groqKey ? 'Local Mode' : 'Online'}
            </div>
          </div>
        </div>
        <button className="settings-btn" onClick={()=>setShowCfg(!showCfg)}><SettingsIcon /></button>
      </div>

      <div className="ai-messages">
        {messages.map(m => (
          <div key={m.id} className={`msg-row ${m.role}`}>
            {m.type === 'typing' ? (
              <div className="msg-bubble"><div className="typing-indicator"><div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/></div></div>
            ) : m.type === 'route' ? (
              <>
                {m.content && <div className="msg-bubble">{m.content}</div>}
                <div className="msg-route-card">
                  <div className="msg-route-title">
                    Suggested Route
                    <span className="msg-backend">{getBackendName(m.backend)}</span>
                  </div>
                  <div className="msg-route-stn">{m.from.name}</div>
                  <div className="msg-route-sep" />
                  <div className="msg-route-stn">{m.to.name}</div>
                  <button className="cfg-save" style={{ marginTop: 12, padding: 8 }} onClick={() => onApplyRoute(m.from, m.to)}>
                    View on Map
                  </button>
                </div>
              </>
            ) : (
              <div className="msg-bubble">{m.content}</div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form className="ai-input-wrap" onSubmit={onSubmit}>
        <input 
          type="text" className="ai-input" 
          placeholder="e.g. Gateway of India to Airport" 
          value={text} onChange={e=>setText(e.target.value)}
          disabled={isTyping}
        />
        <button type="submit" className="ai-send-btn" disabled={isTyping || !text.trim()}><SendIcon /></button>
      </form>
    </div>
  );
}
