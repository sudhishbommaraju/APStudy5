import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Loader2, Brain, MessageSquare, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from '@/lib/utils';

export default function AITutorWidget({ 
  context = {},
  userEmail,
  onClose 
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Add initial context message
    if (context.initialPrompt) {
      setMessages([{
        role: 'assistant',
        content: context.initialPrompt
      }]);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Fetch user performance data
      const attempts = await base44.entities.Attempt.filter({ created_by: userEmail });
      const topicMasteries = await base44.entities.TopicMastery.filter({ created_by: userEmail });
      
      // Build performance context
      const weakTopics = topicMasteries
        .filter(t => t.accuracy < 70)
        .map(t => `${t.topic_name}: ${t.accuracy}%`)
        .slice(0, 5);
      
      const recentAttempts = attempts.slice(0, 10);
      const recentAccuracy = recentAttempts.length > 0
        ? (recentAttempts.filter(a => a.is_correct).length / recentAttempts.length * 100).toFixed(0)
        : 'N/A';

      let prompt = `You are a helpful, encouraging tutor. A student is asking: "${userMessage}"

`;

      // Add context from where they're asking
      if (context.type === 'practice') {
        prompt += `CONTEXT: Student is practicing ${context.subject || 'a subject'}.\n`;
        if (context.currentQuestion) {
          prompt += `Current question topic: ${context.currentQuestion.skill_name}\n`;
        }
      } else if (context.type === 'notes') {
        prompt += `CONTEXT: Student is reviewing notes on ${context.topic || 'a topic'}.\n`;
      } else if (context.type === 'flashcards') {
        prompt += `CONTEXT: Student is studying flashcards on ${context.topic || 'a topic'}.\n`;
      }

      // Add performance data
      if (weakTopics.length > 0) {
        prompt += `\nSTUDENT'S WEAK AREAS:\n${weakTopics.join('\n')}\n`;
      }
      
      prompt += `\nRECENT PERFORMANCE: ${recentAccuracy}% accuracy in last ${recentAttempts.length} questions.\n`;

      prompt += `\nProvide a clear, concise explanation that:
1. Directly answers the question
2. Uses LaTeX for math ($...$)
3. Includes examples if helpful
4. Relates to their weak areas if relevant
5. Is encouraging and supportive

Keep response under 300 words.`;

      const response = await base44.integrations.Core.InvokeLLM({ prompt });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e) {
      console.error('Tutor error:', e);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-end p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md h-[600px] flex flex-col border border-[#CBD5E1]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
              <Brain className="w-5 h-5 text-[#1E3A8A]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#000000]">AI Tutor</h3>
              <p className="text-xs text-[#64748B]">Ask me anything</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-[#64748B] hover:text-[#000000]"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-[#1E3A8A] mx-auto mb-3" />
              <p className="text-sm text-[#64748B]">
                Ask me to explain concepts, review topics, or help with questions
              </p>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0 mt-1">
                  <Brain className="w-4 h-4 text-[#1E3A8A]" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-lg px-4 py-2 max-w-[80%]",
                  msg.role === 'user'
                    ? "bg-[#1E3A8A] text-white"
                    : "bg-[#F1F5F9] text-[#000000]"
                )}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none [&_p]:my-1 [&_.katex]:text-sm">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
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
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                <Brain className="w-4 h-4 text-[#1E3A8A]" />
              </div>
              <div className="bg-[#F1F5F9] rounded-lg px-4 py-2">
                <Loader2 className="w-4 h-4 text-[#64748B] animate-spin" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-[#E5E7EB]">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 border-[#CBD5E1] text-[#000000]"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-[#1E3A8A] hover:bg-[#1e40af]"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}