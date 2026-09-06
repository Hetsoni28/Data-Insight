import React, { useState, useRef, useEffect } from 'react';
import { createSession, sessionMessageStream } from '../../api/dataInsightApi';

/* global document */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  artifact?: any;
  isStreaming?: boolean;
}

const SUGGESTIONS = [
  'Summarize this dataset',
  'What are the top trends?',
  'Find outliers or anomalies',
  'Show key statistics',
];

const S = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#F8FAFC',
  },
  suggestionsWrap: {
    padding: '12px 12px 4px',
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
  },
  chip: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#059669',
    backgroundColor: '#ECFDF5',
    border: '1px solid #A7F3D0',
    padding: '4px 10px',
    cursor: 'pointer',
    transition: 'background-color 0.12s',
  },
  chatArea: {
    flexGrow: 1,
    overflowY: 'auto' as const,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  msgRow: (role: 'user' | 'assistant') => ({
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: role === 'user' ? 'flex-end' : 'flex-start',
  }),
  avatarRow: (role: 'user' | 'assistant') => ({
    display: 'flex',
    alignItems: 'flex-end',
    gap: '7px',
    flexDirection: (role === 'user' ? 'row-reverse' : 'row') as 'row' | 'row-reverse',
    maxWidth: '90%',
  }),
  avatar: (role: 'user' | 'assistant') => ({
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: role === 'user' ? '#1E293B' : '#10B981',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '9px',
    fontWeight: 800,
    flexShrink: 0,
    letterSpacing: '0.02em',
  }),
  bubble: (role: 'user' | 'assistant') => ({
    padding: '9px 13px',
    fontSize: '12px',
    lineHeight: 1.6,
    color: role === 'user' ? '#FFFFFF' : '#0F172A',
    backgroundColor: role === 'user' ? '#1E293B' : '#FFFFFF',
    border: role === 'user' ? 'none' : '1px solid #E2E8F0',
    borderLeft: role === 'assistant' ? '3px solid #10B981' : (role === 'user' ? 'none' : '1px solid #E2E8F0'),
    boxShadow: role === 'assistant' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
    wordBreak: 'break-word' as const,
    whiteSpace: 'pre-wrap' as const,
    maxWidth: '100%',
  }),
  artifactCard: {
    marginTop: '6px',
    padding: '10px 12px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #A7F3D0',
    borderLeft: '3px solid #10B981',
    fontSize: '11px',
    color: '#334155',
  },
  typingDots: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    padding: '4px 2px',
  },
  inputBar: {
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #E2E8F0',
    padding: '10px 12px',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexShrink: 0,
  },
  inputField: {
    flexGrow: 1,
    height: '36px',
    padding: '0 12px',
    fontSize: '12px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  inputFieldFocus: {
    borderColor: '#10B981',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)',
  },
  sendBtn: {
    width: '36px',
    height: '36px',
    backgroundColor: '#10B981',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    transition: 'background-color 0.12s',
    flexShrink: 0,
  },
  sendBtnDisabled: {
    backgroundColor: '#A7F3D0',
    cursor: 'not-allowed',
  },
  newChatBtn: {
    background: 'none',
    border: '1px solid #E2E8F0',
    cursor: 'pointer',
    padding: '5px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748B',
    flexShrink: 0,
    transition: 'border-color 0.12s, color 0.12s',
  },
  headerBar: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#0F172A',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
};

const TypingDots = () => (
  <div style={S.typingDots}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: '6px', height: '6px', borderRadius: '50%',
        backgroundColor: '#10B981',
        animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
      }} />
    ))}
  </div>
);

export const ChatPanel: React.FC<{ datasetId: string }> = ({ datasetId }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: 'Hello! Ask me anything about your dataset — trends, summaries, outliers, forecasts.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleNewChat = () => {
    setSessionId(null);
    setShowSuggestions(true);
    setMessages([{ id: Date.now().toString(), role: 'assistant', content: 'New session started. What would you like to know about your data?' }]);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setShowSuggestions(false);
    setInput('');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      let sid = sessionId;
      if (!sid) {
        const session = await createSession(datasetId, 'Excel Chat');
        sid = session.id;
        setSessionId(session.id);
      }

      const aId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: aId, role: 'assistant', content: '', isStreaming: true }]);

      await sessionMessageStream(
        sid, text.trim(),
        (token) => setMessages(prev => prev.map(m => m.id === aId ? { ...m, content: m.content + token } : m)),
        (artifact) => setMessages(prev => prev.map(m => m.id === aId ? { ...m, artifact } : m)),
        () => { setMessages(prev => prev.map(m => m.id === aId ? { ...m, isStreaming: false } : m)); setLoading(false); },
        () => {
          setMessages(prev => [...prev, { id: (Date.now() + 2).toString(), role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
          setLoading(false);
        }
      );
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 2).toString(), role: 'assistant', content: 'Error connecting to AI service. Please try again.' }]);
      setLoading(false);
    }
  };

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.headerBar}>
        <div style={S.headerTitle}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          AI Copilot
        </div>
        <button style={S.newChatBtn} onClick={handleNewChat}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div style={S.suggestionsWrap}>
          {SUGGESTIONS.map(s => (
            <button key={s} style={S.chip} onClick={() => sendMessage(s)}>{s}</button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={S.chatArea} ref={chatAreaRef}>
        {messages.map(m => (
          <div key={m.id} style={S.msgRow(m.role)}>
            <div style={S.avatarRow(m.role)}>
              <div style={S.avatar(m.role)}>
                {m.role === 'user' ? 'YOU' : 'DI'}
              </div>
              <div style={S.bubble(m.role)}>
                {m.isStreaming && !m.content
                  ? <TypingDots />
                  : <span
                      style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{
                        __html: m.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      }}
                    />
                }
                {m.isStreaming && m.content && (
                  <span style={{ display: 'inline-block', width: '2px', height: '14px', backgroundColor: '#10B981', marginLeft: '2px', verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />
                )}
              </div>
            </div>
            {m.artifact && (
              <div style={{ ...S.artifactCard, alignSelf: 'flex-start', maxWidth: '85%', marginLeft: '33px' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '11px', color: '#059669' }}>📎 AI Artifact</div>
                <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>
                  {JSON.stringify(m.artifact).substring(0, 120)}...
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <div style={S.inputBar}>
        <input
          style={{ ...S.inputField, ...(inputFocused ? S.inputFieldFocus : {}) }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          placeholder="Ask anything about your data..."
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          disabled={loading}
        />
        <button
          style={{ ...S.sendBtn, ...(loading || !input.trim() ? S.sendBtnDisabled : {}) }}
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes typingBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};
