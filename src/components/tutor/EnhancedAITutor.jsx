import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Send, Loader2, Brain, Upload, FileText, Sparkles, Lightbulb, BookOpen, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from '@/lib/utils';

export default function EnhancedAITutor({ 
  context = {},
  userEmail,
  onClose,
  inline = false
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('chat');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (context.initialPrompt) {
      setMessages([{ role: 'assistant', content: context.initialPrompt }]);
    }
  }, []);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const fileUrls = results.map((r, i) => ({ 
        url: r.file_url, 
        name: files[i].name 
      }));
      setUploadedFiles(prev => [...prev, ...fileUrls]);
    } catch (e) {
      console.error('File upload failed:', e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyzeMaterial = async () => {
    if (uploadedFiles.length === 0) return;
    
    setLoading(true);
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: `Analyze these materials: ${uploadedFiles.map(f => f.name).join(', ')}` 
    }]);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert study tutor. Analyze the following study materials and provide:

**📚 Summary of Key Concepts**
[Comprehensive overview of main ideas]

**🎯 Main Topics Covered**
1. [Topic 1 with brief explanation]
2. [Topic 2 with brief explanation]
3. [etc.]

**📝 Important Formulas & Definitions**
- [Formula/Definition]: [Explanation and use case]

**💡 Suggested Study Approach**
[Personalized study strategy based on content]

Be thorough but concise. Use LaTeX for math formulas ($...$).`,
        file_urls: uploadedFiles.map(f => f.url),
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Failed to analyze materials. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (uploadedFiles.length === 0) return;
    
    setLoading(true);
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: 'Generate practice questions from my materials' 
    }]);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on the uploaded study materials, generate 5 high-quality practice questions that test understanding of key concepts.

For each question:
**Question [N]**: [Clear, exam-style question]
**Answer**: [Correct answer]
**Explanation**: [Brief explanation of why this is correct]

Make questions progressively harder (easy → medium → hard).
Use LaTeX for math formulas ($...$).`,
        file_urls: uploadedFiles.map(f => f.url),
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Failed to generate questions. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleExplainConcept = async (concept) => {
    if (!concept.trim()) return;
    
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: `Explain: ${concept}` }]);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Explain the concept "${concept}" in a student-friendly way:

**🎯 Simple Definition**
[Clear, concise explanation in plain language]

**🌍 Real-World Analogy**
[Relatable comparison to everyday experience]
"Think of it like..."

**🔑 Key Components**
1. [Component 1]: [Explanation]
2. [Component 2]: [Explanation]

**📖 Example**
[Practical, concrete example with step-by-step walkthrough]

**⚠️ Common Mistakes to Avoid**
- [Misconception 1]
- [Misconception 2]

Use LaTeX for math formulas ($...$). Keep it simple and engaging!`,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Failed to explain concept. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleStepBySolve = async (problem) => {
    if (!problem.trim()) return;
    
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: `Help me solve: ${problem}` }]);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide step-by-step guidance for solving this problem: "${problem}"

Format your response as:

**Step 1: [What to do]**
[Clear explanation of this step]
[Show the work/calculation]

**Step 2: [What to do]**
[Clear explanation of this step]
[Show the work/calculation]

[Continue for all necessary steps]

**✓ Final Answer**: [Result]

**🧠 Key Concepts Used**
- [Concept 1]
- [Concept 2]

**⚠️ Common Mistakes**
- [Mistake 1 to avoid]
- [Mistake 2 to avoid]

**✓ How to Verify Your Answer**
[Method to check if answer is correct]

Use LaTeX for all math ($...$). Be detailed but clear.`,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Failed to provide solution. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const attempts = await base44.entities.Attempt.filter({ created_by: userEmail });
      const topicMasteries = await base44.entities.TopicMastery.filter({ created_by: userEmail });
      
      const weakTopics = topicMasteries
        .filter(t => t.accuracy < 70)
        .map(t => `${t.topic_name}: ${t.accuracy}%`)
        .slice(0, 5);
      
      const recentAttempts = attempts.slice(0, 10);
      const recentAccuracy = recentAttempts.length > 0
        ? (recentAttempts.filter(a => a.is_correct).length / recentAttempts.length * 100).toFixed(0)
        : 'N/A';

      let prompt = `You are a helpful, encouraging tutor. A student is asking: "${userMessage}"\n\n`;

      if (context.type === 'practice' && context.currentQuestion) {
        prompt += `CONTEXT: Practicing ${context.subject || 'a subject'}, current topic: ${context.currentQuestion.skill_name}\n`;
      }

      if (weakTopics.length > 0) {
        prompt += `\nWEAK AREAS:\n${weakTopics.join('\n')}\n`;
      }
      
      prompt += `\nRECENT PERFORMANCE: ${recentAccuracy}% accuracy\n`;
      prompt += `\nProvide clear, concise help using LaTeX for math ($...$). Be encouraging and supportive. Under 300 words.`;

      const response = await base44.integrations.Core.InvokeLLM({ 
        prompt,
        file_urls: uploadedFiles.length > 0 ? uploadedFiles.map(f => f.url) : undefined
      });

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

  const containerClass = inline 
    ? "flex flex-col h-[600px]"
    : "bg-[#1E1E1E] rounded-xl shadow-2xl w-full max-w-2xl h-[700px] flex flex-col border border-[#2A2A2A]";

  const wrapperClass = inline ? "" : "fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4";

  const content = (
    <div className={containerClass}>
      {/* Header */}
      {!inline && (
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D6B98C]/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-[#D6B98C]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#F5F5F5]">Enhanced AI Tutor</h3>
              <p className="text-xs text-[#8A8A8A]">Upload, analyze, and learn</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-[#8A8A8A] hover:text-[#F5F5F5]"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="p-4 border-b border-[#2A2A2A]">
        <Tabs value={mode} onValueChange={setMode}>
          <TabsList className="grid w-full grid-cols-5 bg-[#171717]">
            <TabsTrigger value="chat" className="text-xs">
              <Brain className="w-3 h-3 mr-1" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="analyze" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              Analyze
            </TabsTrigger>
            <TabsTrigger value="generate" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="explain" className="text-xs">
              <Lightbulb className="w-3 h-3 mr-1" />
              Explain
            </TabsTrigger>
            <TabsTrigger value="solve" className="text-xs">
              <BookOpen className="w-3 h-3 mr-1" />
              Solve
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* File Upload Section */}
      {(mode === 'analyze' || mode === 'generate') && (
        <div className="p-4 bg-[#171717] border-b border-[#2A2A2A]">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="w-full mb-2"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Study Materials (PDF, images, notes)
              </>
            )}
          </Button>
          {uploadedFiles.length > 0 && (
            <div className="space-y-1 mb-2">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-[#1E1E1E] rounded px-2 py-1.5 border border-[#2A2A2A]">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="w-3 h-3 text-[#D6B98C] flex-shrink-0" />
                    <span className="truncate text-[#B5B5B5]">{file.name}</span>
                  </div>
                  <button
                    onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))}
                    className="ml-2 text-[#DC2626] hover:text-[#EF4444] flex-shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {mode === 'analyze' && uploadedFiles.length > 0 && (
            <Button onClick={handleAnalyzeMaterial} className="w-full" size="sm" disabled={loading}>
              <FileText className="w-4 h-4 mr-2" />
              Analyze Materials
            </Button>
          )}
          {mode === 'generate' && uploadedFiles.length > 0 && (
            <Button onClick={handleGenerateQuestions} className="w-full" size="sm" disabled={loading}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Practice Questions
            </Button>
          )}
        </div>
      )}

      {/* Quick Action Forms */}
      {mode === 'explain' && (
        <div className="p-4 bg-[#171717] border-b border-[#2A2A2A]">
          <form onSubmit={(e) => {
            e.preventDefault();
            handleExplainConcept(e.target.concept.value);
            e.target.concept.value = '';
          }}>
            <Input
              name="concept"
              placeholder="Enter concept (e.g., 'photosynthesis', 'quadratic formula')"
              className="mb-2 border-[#2A2A2A] bg-[#1E1E1E] text-[#F5F5F5]"
            />
            <Button type="submit" size="sm" className="w-full" disabled={loading}>
              <Lightbulb className="w-4 h-4 mr-2" />
              Explain with Analogies
            </Button>
          </form>
        </div>
      )}

      {mode === 'solve' && (
        <div className="p-4 bg-[#171717] border-b border-[#2A2A2A]">
          <form onSubmit={(e) => {
            e.preventDefault();
            handleStepBySolve(e.target.problem.value);
            e.target.problem.value = '';
          }}>
            <textarea
              name="problem"
              placeholder="Paste the problem you need help solving..."
              className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#2A2A2A] rounded text-sm text-[#F5F5F5] mb-2 min-h-[60px] resize-none"
            />
            <Button type="submit" size="sm" className="w-full" disabled={loading}>
              <BookOpen className="w-4 h-4 mr-2" />
              Get Step-by-Step Solution
            </Button>
          </form>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && mode === 'chat' && (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-[#D6B98C] mx-auto mb-3" />
            <p className="text-sm text-[#8A8A8A] mb-2">
              Upload materials, get explanations, or solve problems step-by-step
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-4 text-xs">
              <span className="px-2 py-1 bg-[#171717] rounded border border-[#2A2A2A] text-[#8A8A8A]">📄 PDF Analysis</span>
              <span className="px-2 py-1 bg-[#171717] rounded border border-[#2A2A2A] text-[#8A8A8A]">✨ Question Generation</span>
              <span className="px-2 py-1 bg-[#171717] rounded border border-[#2A2A2A] text-[#8A8A8A]">💡 Concept Analogies</span>
              <span className="px-2 py-1 bg-[#171717] rounded border border-[#2A2A2A] text-[#8A8A8A]">📚 Step-by-Step Solutions</span>
            </div>
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
              <div className="w-7 h-7 rounded-lg bg-[#D6B98C]/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Brain className="w-4 h-4 text-[#D6B98C]" />
              </div>
            )}
            <div
              className={cn(
                "rounded-lg px-4 py-2 max-w-[85%]",
                msg.role === 'user'
                  ? "bg-[#D6B98C] text-[#0C0C0C]"
                  : "bg-[#171717] text-[#F5F5F5]"
              )}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none [&_p]:my-1 [&_.katex]:text-sm [&_strong]:text-[#D6B98C]">
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
            <div className="w-7 h-7 rounded-lg bg-[#D6B98C]/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-[#D6B98C]" />
            </div>
            <div className="bg-[#171717] rounded-lg px-4 py-2">
              <Loader2 className="w-4 h-4 text-[#8A8A8A] animate-spin" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {(mode === 'chat' || messages.length > 0) && (
        <form onSubmit={handleSubmit} className="p-4 border-t border-[#2A2A2A]">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 border-[#2A2A2A] bg-[#171717] text-[#F5F5F5] placeholder:text-[#8A8A8A]"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-[#D6B98C] hover:bg-[#C9A96A] text-[#0C0C0C]"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );

  return inline ? content : <div className={wrapperClass}>{content}</div>;
}