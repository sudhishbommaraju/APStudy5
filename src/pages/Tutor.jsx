import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, BookOpen, Sparkles, Loader2, Users, Video } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CollaborativeSession from '@/components/tutor/CollaborativeSession';

export default function Tutor() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showQuizGenerator, setShowQuizGenerator] = useState(false);
  const [collaborativeModalOpen, setCollaborativeModalOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('');
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

  const { data: attempts = [] } = useQuery({
    queryKey: ['attempts', user?.email],
    queryFn: () => base44.entities.Attempt.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const analyzeWeaknesses = () => {
    if (attempts.length < 5) return null;

    const skillErrors = {};
    attempts.filter(a => !a.is_correct).forEach(a => {
      if (!skillErrors[a.skill_name]) {
        skillErrors[a.skill_name] = 0;
      }
      skillErrors[a.skill_name]++;
    });

    const weakSkills = Object.entries(skillErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([skill, count]) => ({ skill, count }));

    return weakSkills;
  };

  const generateCustomQuiz = async (weakSkill) => {
    setIsLoading(true);
    try {
      const prompt = `Generate 5 practice questions specifically for the skill: "${weakSkill.skill}"

This is an area where the student has made mistakes. Create questions that:
1. Target common misconceptions
2. Build understanding step-by-step
3. Include detailed explanations
4. Use LaTeX for math notation

For each question, provide:
- Question text
- 4 multiple choice options (A, B, C, D)
- Correct answer
- Detailed explanation

Format as a numbered list.`;

      const response = await base44.integrations.Core.InvokeLLM({ prompt });

      const aiMessage = { 
        role: 'assistant', 
        content: `📝 **Custom Practice Quiz for: ${weakSkill.skill}**\n\nYou've had difficulty with this skill (${weakSkill.count} mistakes). Here's a targeted practice quiz:\n\n${response}\n\n---\n\nTake your time and try to answer these questions. Let me know if you need help with any of them!`
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (e) {
      console.error('Failed to generate quiz:', e);
    }
    setIsLoading(false);
    setShowQuizGenerator(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Analyze user's attempt history for personalization
      let performanceContext = '';
      if (attempts.length > 0) {
        const weakSkills = analyzeWeaknesses();
        if (weakSkills && weakSkills.length > 0) {
          performanceContext = `\n\nStudent's weak areas (from recent mistakes): ${weakSkills.map(w => w.skill).join(', ')}. If relevant to the question, provide extra support in these areas.`;
        }

        const recentErrors = attempts
          .filter(a => !a.is_correct)
          .slice(0, 5)
          .map(a => a.skill_name);
        if (recentErrors.length > 0) {
          performanceContext += `\nRecent mistakes in: ${[...new Set(recentErrors)].join(', ')}.`;
        }
      }

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
${performanceContext}

The student asks: "${input}"

Provide a clear, educational response that:
1. Explains concepts in simple, conversational terms
2. Uses relevant examples and real-world applications
3. Breaks down complex topics into manageable parts
4. Encourages further learning and curiosity
5. Uses proper LaTeX notation for math: inline ($...$) and display ($$...$$)
6. Provides step-by-step guidance for problem-solving
7. If the question relates to their weak areas, provide extra practice suggestions
8. Be adaptive - ask follow-up questions to gauge understanding
9. Offer to generate practice problems, flashcards, or recommend course modules

CRITICAL - LaTeX Formatting Rules:
- Inline math: $x^2 + 3x + 5$
- Display math (centered): $$\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$
- Use \\frac{}{} for fractions, never plain /
- Use \\text{} for units: $100\\text{ m/s}$
- Use proper subscripts: $H_2O$ not H2O
- Use proper superscripts: $x^2$ not x^2

Be encouraging, conversational, and supportive. Build rapport with the student.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
      });

      const aiMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, aiMessage]);

      // Proactive suggestions and collaborative features
      const weakSkills = analyzeWeaknesses();
      if (weakSkills && weakSkills.length > 0 && input.toLowerCase().includes(weakSkills[0].skill.toLowerCase())) {
        setTimeout(() => {
          const followUpMessage = {
            role: 'assistant',
            content: `💡 **I can help you master ${weakSkills[0].skill}:**\n\n1. 📝 Generate a custom practice quiz\n2. 🎴 Create flashcard sets\n3. 📚 Recommend specific course modules\n4. 🤝 Start a collaborative problem-solving session\n5. 🎯 Create a focused micro-lesson\n\nWhat would be most helpful?`
          };
          setMessages(prev => [...prev, followUpMessage]);
        }, 1000);
      }
      
      // Set current topic for collaborative sessions
      setCurrentTopic(input);
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

  // Proactive assistance based on recent struggles
  useEffect(() => {
    if (!user || attempts.length < 3 || messages.length > 0) return;

    const recentAttempts = attempts.slice(0, 10);
    const recentIncorrect = recentAttempts.filter(a => !a.is_correct);
    
    if (recentIncorrect.length >= 3) {
      const strugglingSkills = {};
      recentIncorrect.forEach(a => {
        if (!strugglingSkills[a.skill_name]) {
          strugglingSkills[a.skill_name] = 0;
        }
        strugglingSkills[a.skill_name]++;
      });

      const topStruggle = Object.entries(strugglingSkills)
        .sort((a, b) => b[1] - a[1])[0];

      if (topStruggle && topStruggle[1] >= 2) {
        const proactiveMessage = {
          role: 'assistant',
          content: `👋 Hi! I noticed you've been having some difficulty with **${topStruggle[0]}** (${topStruggle[1]} recent mistakes). I'm here to help!\n\n**I can assist you with:**\n1. 📝 Explain the key concepts step-by-step\n2. 🎯 Generate a custom practice quiz on this topic\n3. 📚 Suggest relevant study materials\n4. 💡 Review common misconceptions\n\nWhat would you like help with?`
        };
        setMessages([proactiveMessage]);
      }
    }
  }, [user, attempts.length]);

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

        {/* Weakness Analysis Banner */}
        {messages.length === 0 && attempts.length >= 5 && analyzeWeaknesses() && (
          <div className="p-4 bg-rose-500/10 border-b border-rose-500/30">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-rose-200 mb-2">🎯 Your Weak Areas</h4>
                <div className="flex flex-wrap gap-2 mb-2">
                  {analyzeWeaknesses().map((weak, i) => (
                    <button
                      key={i}
                      onClick={() => generateCustomQuiz(weak)}
                      className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-full text-xs text-rose-300 transition-all"
                    >
                      {weak.skill} ({weak.count} mistakes)
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setInput(`Create a micro-lesson on ${analyzeWeaknesses()[0].skill} with examples`)}
                    className="px-2 py-1 bg-violet-500/20 hover:bg-violet-500/30 rounded text-xs text-violet-300"
                  >
                    📚 Micro-lesson
                  </button>
                  <button
                    onClick={() => setInput(`Suggest flashcard deck for ${analyzeWeaknesses()[0].skill}`)}
                    className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-xs text-blue-300"
                  >
                    🎴 Flashcards
                  </button>
                  <button
                    onClick={() => generateCustomQuiz(analyzeWeaknesses()[0])}
                    className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 rounded text-xs text-emerald-300"
                  >
                    ✏️ Practice Quiz
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
          <div className="flex gap-2 mb-2">
            <Button
              onClick={() => setCollaborativeModalOpen(true)}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Users className="w-3 h-3 mr-1" />
              Collaborate
            </Button>
            <Button
              onClick={() => {
                const topic = input || 'General problem-solving';
                setCurrentTopic(topic);
                setCollaborativeModalOpen(true);
              }}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Video className="w-3 h-3 mr-1" />
              Live Session
            </Button>
          </div>
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything... I'm here to help you learn!"
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

      <CollaborativeSession
        open={collaborativeModalOpen}
        onOpenChange={setCollaborativeModalOpen}
        user={user}
        currentTopic={currentTopic}
      />
      </div>
    </>
  );
}