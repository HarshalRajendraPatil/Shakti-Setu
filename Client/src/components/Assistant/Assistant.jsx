import { useState, useEffect, useRef, useContext } from 'react';
import { Mic, Send, Volume2, Shield } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { useTTS } from '../../hooks/useTTS';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { fetchGroundedResponse } from '../../services/api';
import GlassCard from '../common/GlassCard';

const Assistant = () => {
  const { t, user, language, chatMessages, setChatMessages, chatInput, setChatInput } = useContext(AppContext);
  const { speak } = useTTS();
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  
  const { isListening, start: startMic, stop: stopMic } = useSpeechRecognition((text) => {
    setChatInput(text);
  });

  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([{ role: 'ai', text: t.assistantWelcome }]);
    }
  }, []); 

  useEffect(() => { 
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [chatMessages, loading]);

  const handleSend = async () => {
    if (!chatInput.trim() || loading) return;
    const userText = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);
    try {
      const { text, sources } = await fetchGroundedResponse(userText, user, language);
      setChatMessages(prev => [...prev, { role: 'ai', text, sources }]);
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, { role: 'ai', text: t.errorAPI }]);
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="page-container assistant-layout">
      <GlassCard className="chat-window">
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="avatar-circle">
              <Shield size={20} color="white" />
            </div>
            <div>
              <h2>{t.assistantTitle}</h2>
              <p className="status-indicator">
                <span className="dot"></span> {t.assistantOnline}
              </p>
            </div>
          </div>
        </div>
        <div className="messages-area">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`message-row ${msg.role}`}>
              <div className={`message-bubble ${msg.role}`}>
                <p>{msg.text}</p>
                {msg.sources?.length > 0 && (
                  <div className="sources-container">
                    <p className="sources-label">{t.source}:</p>
                    <div className="sources-list">
                      {msg.sources.map((src, i) => (
                        <a 
                          key={i} 
                          href={src.uri} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="source-chip"
                        >
                          {src.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {msg.role === 'ai' && (
                  <button 
                    onClick={() => speak(msg.text, language)} 
                    className="read-aloud-btn"
                  >
                    <Volume2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message-row ai">
              <div className="message-bubble ai loading-bubble">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                {t.assistantThinking}
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
        <div className="input-area">
          <div className="input-bar">
            <button 
              onClick={isListening ? stopMic : startMic} 
              className={`mic-btn ${isListening ? 'active' : ''}`}
            >
              <Mic size={20} />
            </button>
            <input 
              type="text" 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
              placeholder={isListening ? t.assistantListening : t.assistantPrompt} 
              disabled={loading} 
            />
            <button 
              onClick={handleSend} 
              disabled={!chatInput.trim() || loading} 
              className="send-btn"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default Assistant;
