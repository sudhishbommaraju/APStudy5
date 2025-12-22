import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, BookOpen, Brain, Paperclip, X, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from '@/lib/utils';
import SubjectChangeDialog from '@/components/study/SubjectChangeDialog';

export default function Tutor() {
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const fileUrls = results.map((r, idx) => ({
        url: r.file_url,
        name: files[idx].name,
        type: files[idx].type,
      }));
      setUploadedFiles(prev => [...prev, ...fileUrls]);
    } catch (e) {
      console.error('Failed to upload files:', e);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (idx) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || loading) return;

    const userMessage = input.trim();
    const filesToSend = [...uploadedFiles];
    setInput('');
    setUploadedFiles([]);
    
    const messageContent = {
      text: userMessage,
      files: filesToSend,
    };
    setMessages(prev => [...prev, { role: 'user', content: messageContent }]);
    setLoading(true);

    try {
      const subjectContext = selectedSubject 
        ? `The student is currently studying ${selectedSubject}. ` 
        : '';

      // Build conversation history for context
      const conversationHistory = messages.slice(-6).map(msg => {
        if (msg.role === 'user') {
          return `Student: ${typeof msg.content === 'string' ? msg.content : msg.content.text}`;
        } else {
          return `Tutor: ${msg.content}`;
        }
      }).join('\n\n');

      const contextSection = conversationHistory 
        ? `\n\nPrevious conversation:\n${conversationHistory}\n\n` 
        : '';

      const prompt = `You are an expert tutor helping students prepare for AP exams and standardized tests. ${subjectContext}${contextSection}

Student question: ${userMessage}${filesToSend.length > 0 ? '\n(The student has provided screenshots/images for you to analyze)' : ''}

Provide a detailed, educational response that:
1. Explains the concept thoroughly with clear examples
2. Highlights what types of questions commonly appear on tests about this topic
3. Provides tips for remembering key information
4. Uses clear formatting with bullet points and examples where helpful
${filesToSend.length > 0 ? '5. Analyzes any images provided and addresses questions about them' : ''}

Keep your tone friendly and encouraging. CRITICAL: Use VALID LaTeX with proper escape characters. ALL math must render cleanly.
- Wrap math: $ for inline, $$ for display blocks
- Examples of CORRECT LaTeX:
  * Fractions: $\\frac{\\sin(30^\\circ)}{\\pi}$ (with backslash before frac)
  * Limits: $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$ (backslash before lim and to)
  * Powers: $x^2 + 5x - 3$
  * Roots: $\\sqrt{3}$
  * Trig: $\\sin(45^\\circ)$, $\\cos(x)$, $\\tan(x)$ (backslash before all functions)
- NEVER write: "ext\\lim", "o" (use \\to for arrows), "frac" without backslash
- Test that your LaTeX compiles correctly before using it`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        file_urls: filesToSend.length > 0 ? filesToSend.map(f => f.url) : undefined,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e) {
      console.error('Failed to get tutor response:', e);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I had trouble processing that. Could you try asking again?' 
      }]);
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setInput('');
    setUploadedFiles([]);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d4a6f)', fontFamily: 'Georgia, serif' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Brain className="w-6 h-6" />
                AI Tutor
              </h1>
              <p className="text-slate-500 mt-1">
                Ask questions and get detailed explanations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSubjectDialog(true)}
              >
                <BookOpen className="w-4 h-4 mr-1" />
                {selectedSubject || 'Select Subject'}
              </Button>
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startNewConversation}
                >
                  New Chat
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <Brain className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Start a conversation</h3>
              <p className="text-slate-500 text-sm mb-4">
                Ask me anything about your subjects, test strategies, or specific topics
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-md mx-auto">
                <button
                  onClick={() => setInput("Explain the key concepts I should know for AP Calculus")}
                  className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-sm text-slate-700 transition-colors"
                >
                  💡 Key concepts for AP Calculus
                </button>
                <button
                  onClick={() => setInput("What types of questions appear most on the SAT Math section?")}
                  className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-sm text-slate-700 transition-colors"
                >
                  📝 Common SAT Math questions
                </button>
                <button
                  onClick={() => setInput("How do I solve quadratic equations?")}
                  className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-sm text-slate-700 transition-colors"
                >
                  🔢 Solving quadratic equations
                </button>
                <button
                  onClick={() => setInput("Tips for remembering formulas")}
                  className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-sm text-slate-700 transition-colors"
                >
                  🧠 Memory tips for formulas
                </button>
              </div>
            </div>
          ) : (
            messages.map((message, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3",
                    message.role === 'user'
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200"
                  )}
                >
                  {message.role === 'user' ? (
                    <div>
                      {typeof message.content === 'string' ? (
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      ) : (
                        <>
                          {message.content.text && (
                            <p className="text-sm leading-relaxed mb-2">{message.content.text}</p>
                          )}
                          {message.content.files && message.content.files.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {message.content.files.map((file, i) => (
                                <div key={i} className="relative group">
                                  {file.type?.startsWith('image/') ? (
                                    <img 
                                      src={file.url} 
                                      alt={file.name}
                                      className="max-w-[200px] max-h-[200px] rounded-lg border border-slate-300"
                                    />
                                  ) : (
                                    <div className="px-3 py-2 bg-slate-800 rounded-lg flex items-center gap-2">
                                      <Paperclip className="w-4 h-4" />
                                      <span className="text-xs">{file.name}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
                          ul: ({ children }) => <ul className="my-2 ml-4 list-disc">{children}</ul>,
                          ol: ({ children }) => <ol className="my-2 ml-4 list-decimal">{children}</ol>,
                          li: ({ children }) => <li className="my-1">{children}</li>,
                          h3: ({ children }) => <h3 className="text-base font-semibold my-3">{children}</h3>,
                          strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                          code: ({ inline, children }) => 
                            inline ? (
                              <code className="px-1 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">
                                {children}
                              </code>
                            ) : (
                              <code className="block bg-slate-900 text-slate-100 rounded-lg p-3 my-2">
                                {children}
                              </code>
                            ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-slate-600">
                      {user?.full_name?.[0] || 'U'}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-slate-100">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="relative group">
                  {file.type?.startsWith('image/') ? (
                    <div className="relative">
                      <img 
                        src={file.url} 
                        alt={file.name}
                        className="max-w-[100px] max-h-[100px] rounded-lg border border-slate-200"
                      />
                      <button
                        onClick={() => removeFile(idx)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative px-3 py-2 bg-slate-100 rounded-lg flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-slate-600" />
                      <span className="text-xs text-slate-700">{file.name}</span>
                      <button
                        onClick={() => removeFile(idx)}
                        className="ml-1"
                      >
                        <X className="w-3 h-3 text-slate-500 hover:text-slate-700" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || uploading}
              className="self-end"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your studies..."
              className="flex-1 min-h-[60px] max-h-[200px] resize-none"
              disabled={loading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={(!input.trim() && uploadedFiles.length === 0) || loading}
              className="self-end"
              size="icon"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Press Enter to send, Shift+Enter for new line • Upload images for analysis
          </p>
        </div>
      </div>

      <SubjectChangeDialog
        open={showSubjectDialog}
        onOpenChange={setShowSubjectDialog}
        selectedSubject={selectedSubject}
        onSelectSubject={(subjectId) => {
          setSelectedSubject(subjectId);
          setShowSubjectDialog(false);
        }}
      />
    </div>
  );
}