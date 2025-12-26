import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, BookOpen, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Tutor() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        console.error('Failed to load user:', e);
      }
    };
    loadUser();
  }, []);

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list('subject_id'),
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units', selectedSubject],
    queryFn: () => base44.entities.Unit.filter({ subject_id: selectedSubject }),
    enabled: !!selectedSubject,
  });

  const { data: skills = [] } = useQuery({
    queryKey: ['skills'],
    queryFn: () => base44.entities.Skill.list(),
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build context about available subjects, units, skills
      let contextInfo = 'Available subjects: ';
      if (subjects.length > 0) {
        contextInfo += subjects.map(s => s.name).join(', ') + '. ';
      }

      if (selectedSubject) {
        const subject = subjects.find(s => s.subject_id === selectedSubject);
        contextInfo += `Current focus: ${subject?.name}. `;
        
        if (units.length > 0) {
          contextInfo += `Units in this subject: ${units.map(u => u.unit_name).join(', ')}. `;
        }

        const subjectSkills = skills.filter(sk => sk.subject_id === selectedSubject);
        if (subjectSkills.length > 0) {
          contextInfo += `Skills covered: ${subjectSkills.map(sk => sk.skill_name).slice(0, 10).join(', ')}. `;
        }
      }

      const prompt = `You are an expert tutor helping students prepare for ${selectedSubject ? subjects.find(s => s.subject_id === selectedSubject)?.name : 'various exams'}. 

${contextInfo}

The student asks: "${input}"

Provide a clear, educational response that:
1. Explains concepts in simple terms
2. Uses relevant examples
3. Breaks down complex topics into manageable parts
4. Encourages further learning
5. Uses LaTeX notation ($...$) for mathematical expressions
6. Provides step-by-step guidance for problem-solving

Be encouraging and supportive. If the question relates to a specific unit or skill from the context above, reference it directly.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
      });

      const aiMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (e) {
      console.error('Failed to get AI response:', e);
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try asking your question again.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const starterQuestions = [
    "Explain the concept of derivatives in calculus",
    "What's the difference between ionic and covalent bonds?",
    "How do I solve quadratic equations?",
    "Explain the causes of the American Revolution",
  ];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">AI Tutor</h1>
        <p className="page-description">Ask questions and get personalized help</p>
      </div>

      <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
        {/* Subject Selector */}
        <div className="p-4 border-b border-slate-700/50">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-full bg-slate-900/50 border-slate-700/50 text-slate-200">
              <SelectValue placeholder="Select a subject (optional)" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700/50">
              <SelectItem value="all" className="text-slate-200">General Questions</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.subject_id} value={subject.subject_id} className="text-slate-200">
                  {subject.icon} {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Chat Messages */}
        <div className="h-[500px] overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-100 mb-2">Welcome to Your AI Tutor</h3>
              <p className="text-slate-400 mb-6">Ask me anything about your studies!</p>
              
              <div className="grid md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {starterQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    className="p-3 bg-slate-900/50 hover:bg-slate-900/70 rounded-lg text-left text-sm text-slate-300 transition-all border border-slate-700/30 hover:border-violet-500/50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-900/50 border border-slate-700/50 text-slate-100'
                }`}
              >
                {message.role === 'user' ? (
                  <p className="text-sm leading-relaxed">{message.content}</p>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    className="prose prose-sm prose-invert max-w-none"
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      code: ({ inline, children }) => 
                        inline ? (
                          <code className="px-1 py-0.5 bg-slate-800 rounded text-violet-300">{children}</code>
                        ) : (
                          <code className="block bg-slate-800 p-2 rounded my-2">{children}</code>
                        ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-white">
                    {user?.full_name?.[0] || 'U'}
                  </span>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
              </div>
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl px-4 py-3">
                <p className="text-slate-400 text-sm">Thinking...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-1 min-h-[60px] max-h-[120px] bg-slate-900/50 border-slate-700/50 text-slate-200 resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-4 bg-violet-600 hover:bg-violet-700"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
        </div>
      </div>
    </>
  );
}