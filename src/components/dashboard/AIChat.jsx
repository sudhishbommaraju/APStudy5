import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SUGGESTIONS = [
  'Explain linear equations for SAT',
  'What are my weakest areas?',
  'Summarize ACT Science section',
  'Tips for improving reading speed',
];

export default function AIChat({ theme }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your Proofly AI tutor. Ask me about any SAT/ACT/AP concept, practice problem, or get a topic summary!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);

    const history = newMessages.slice(-8).map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n');
    const reply = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert SAT/ACT/AP tutor named Proofly AI. Be concise, helpful, and encouraging. Answer in 2-4 sentences max unless a detailed explanation is needed.

Conversation so far:
${history}

Respond to the student's last message.`,
    });

    setMessages(prev => [...prev, { role: 'assistant', content: typeof reply === 'string' ? reply : reply?.text || 'Sorry, I had trouble responding. Try again!' }]);
    setLoading(false);
  };

  const bg = theme.isDark ? '#0f1623' : '#ffffff';
  const border = theme.border;
  const accent = theme.accent;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 1000,
          width: 52, height: 52, borderRadius: '50%',
          background: accent, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 20px ${accent}55`,
          transition: 'all 200ms ease',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {open ? <X size={20} color="#fff" /> : <MessageCircle size={20} color="#fff" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 28, zIndex: 999,
          width: 360, height: 480,
          background: bg, border: `1px solid ${border}`,
          borderRadius: 20,
          boxShadow: theme.isDark ? '0 8px 40px rgba(0,0,0,0.5)' : '0 8px 40px rgba(0,0,0,0.12)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatSlideIn 200ms ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', borderBottom: `1px solid ${border}`,
            display: 'flex', alignItems: 'center', gap: 10,
            background: theme.isDark ? '#111827' : '#f8fafc',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={16} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: theme.text }}>Proofly AI Tutor</p>
              <p style={{ margin: 0, fontSize: 11, color: '#10b981', fontWeight: 500 }}>● Online</p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '9px 13px', borderRadius: 14,
                  fontSize: 13, lineHeight: 1.5,
                  background: m.role === 'user' ? accent : theme.isDark ? '#1f2937' : '#f1f5f9',
                  color: m.role === 'user' ? '#fff' : theme.text,
                  borderBottomRightRadius: m.role === 'user' ? 4 : 14,
                  borderBottomLeftRadius: m.role === 'assistant' ? 4 : 14,
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '9px 13px', borderRadius: 14, borderBottomLeftRadius: 4, background: theme.isDark ? '#1f2937' : '#f1f5f9' }}>
                  <Loader2 size={14} color={theme.textMuted} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div style={{ padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} style={{
                  fontSize: 11, padding: '5px 10px', borderRadius: 999,
                  border: `1px solid ${border}`, background: 'transparent',
                  color: theme.textMuted, cursor: 'pointer',
                  transition: 'all 150ms',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = theme.textMuted; }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: `1px solid ${border}`, display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask anything..."
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 10, fontSize: 13,
                border: `1px solid ${border}`, background: theme.isDark ? '#1f2937' : '#f8fafc',
                color: theme.text, outline: 'none',
              }}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()} style={{
              width: 36, height: 36, borderRadius: 10, border: 'none',
              background: input.trim() && !loading ? accent : theme.isDark ? '#1f2937' : '#e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: input.trim() && !loading ? 'pointer' : 'default',
              transition: 'all 150ms',
            }}>
              <Send size={14} color={input.trim() && !loading ? '#fff' : theme.textMuted} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatSlideIn { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}