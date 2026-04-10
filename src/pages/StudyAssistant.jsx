import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import MessageBubble from '@/components/assistant/MessageBubble';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, Sparkles, BookOpen, HelpCircle, TrendingUp } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  { icon: HelpCircle, text: "Explain how to solve quadratic equations step by step" },
  { icon: BookOpen, text: "What are the key themes in AP US History Period 3?" },
  { icon: TrendingUp, text: "What topics should I focus on to improve my SAT score?" },
  { icon: Sparkles, text: "Give me a practice question on cell respiration" },
];

export default function StudyAssistant() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'study_assistant',
        metadata: { name: 'Study Session' }
      });
      setConversation(conv);

      const unsubscribe = base44.agents.subscribeToConversation(conv.id, (data) => {
        setMessages(data.messages || []);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error('Failed to init conversation', e);
    } finally {
      setInitializing(false);
    }
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || !conversation || loading) return;
    setInput('');
    setLoading(true);
    await base44.agents.addMessage(conversation, { role: 'user', content: msg });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0C0C0C] flex flex-col">
        <DashboardNavbar />

        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">AI Study Assistant</h1>
              <p className="text-sm text-neutral-400">Ask anything — explanations, practice questions, study tips</p>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 mb-4">
            {initializing ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="space-y-6 pt-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-blue-400" />
                  </div>
                  <h2 className="text-lg font-medium text-white mb-2">How can I help you study today?</h2>
                  <p className="text-sm text-neutral-500">Ask me anything about your study material or pick a suggestion below.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUGGESTED_PROMPTS.map((p, i) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => sendMessage(p.text)}
                        className="flex items-start gap-3 p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-left transition-all"
                      >
                        <Icon className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                        <span className="text-sm text-neutral-300">{p.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => <MessageBubble key={i} message={msg} />)
            )}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="h-7 w-7 rounded-lg bg-neutral-800 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about any topic, request an explanation, or get practice questions..."
              className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-neutral-500"
              disabled={loading || initializing}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading || initializing}
              size="icon"
              className="rounded-xl bg-blue-600 hover:bg-blue-700 shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}