import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { Sparkles, Send, X, Loader2 } from 'lucide-react';

export default function AITutorPanel({
  question,
  userAnswer,
  correctAnswer,
  isSubmitted,
  examType,
  subject,
  unit,
  onClose
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickActions = [
    { label: 'Give me a hint', prompt: 'Can you give me a hint to solve this problem without revealing the answer?' },
    { label: 'Explain step-by-step', prompt: 'Can you walk me through this problem step by step?' },
    { label: 'Best strategy?', prompt: 'What is the best strategy to approach this type of problem?' },
    { label: 'What concept is tested?', prompt: 'What key concept or skill is this question testing?' }
  ];

  const handleQuickAction = async (prompt) => {
    await sendMessage(prompt);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    await sendMessage(input);
    setInput('');
  };

  const sendMessage = async (userMessage) => {
    const newUserMessage = { role: 'user', content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    setLoading(true);

    try {
      const contextPrompt = `You are an expert ${examType} tutor helping a student with this question:

Question: ${question.stem}

Answer Choices:
${question.answer_choices.map((choice, idx) => `${String.fromCharCode(65 + idx)}. ${choice}`).join('\n')}

Correct Answer: ${String.fromCharCode(65 + correctAnswer)}

${isSubmitted ? `Student selected: ${userAnswer !== null ? String.fromCharCode(65 + userAnswer) : 'No answer'}` : 'Student has not submitted yet.'}

Context:
- Exam: ${examType}
- Subject: ${subject || 'N/A'}
- Unit: ${unit || 'N/A'}

Student's question: ${userMessage}

Provide helpful, educational guidance. If they haven't submitted, give hints without revealing the answer. If they have submitted, you can explain the solution thoroughly. Use clear explanations and when needed, use LaTeX for math (wrap in $ for inline, $$ for block).`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: contextPrompt
      });

      const aiMessage = { role: 'assistant', content: response };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Tutor error:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-neutral-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-white">AI Tutor</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4 border-b border-neutral-800 space-y-2">
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickAction(action.prompt)}
            disabled={loading}
            className="w-full text-left px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-sm text-neutral-300 transition-colors disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-neutral-500 text-sm mt-8">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Ask me anything about this question!</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-100'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0 text-sm leading-relaxed">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                      code: ({ inline, children }) => 
                        inline ? (
                          <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-xs text-blue-400">{children}</code>
                        ) : (
                          <code className="block bg-neutral-800 p-3 rounded-lg text-xs overflow-x-auto my-2">{children}</code>
                        ),
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
                      li: ({ children }) => <li className="text-sm">{children}</li>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-neutral-800">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this problem..."
            disabled={loading}
            className="bg-neutral-900 border-neutral-800 text-white"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            size="icon"
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}