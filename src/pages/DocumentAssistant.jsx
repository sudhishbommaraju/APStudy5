import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Sparkles, Loader2, BookOpen, Plus, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { motion, AnimatePresence } from 'framer-motion';

export default function DocumentAssistant() {
  const [user, setUser] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedFlashcards, setGeneratedFlashcards] = useState([]);
  const [studyGuide, setStudyGuide] = useState(null);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
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
        name: files[i].name,
        type: files[i].type
      }));
      setUploadedFiles(prev => [...prev, ...fileUrls]);
    } catch (e) {
      console.error('File upload failed:', e);
      alert('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyzeDocuments = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert study assistant. Analyze the following study materials comprehensively.

Provide a detailed analysis in this EXACT format:

## 📚 Document Summary
[2-3 sentence overview of what these materials cover]

## 🎯 Main Topics
1. **[Topic Name]**: [Brief description]
2. **[Topic Name]**: [Brief description]
3. **[Topic Name]**: [Brief description]

## 📖 Key Definitions
- **[Term]**: [Clear, concise definition]
- **[Term]**: [Clear, concise definition]

## 📐 Important Formulas
- **[Formula Name]**: $[LaTeX formula]$
  - Use: [When/how to use it]
- **[Formula Name]**: $[LaTeX formula]$
  - Use: [When/how to use it]

## 💡 Key Concepts
1. [Concept with explanation]
2. [Concept with explanation]

## 📝 Study Tips
- [Specific tip based on content]
- [Specific tip based on content]

Use LaTeX notation for all math: $x^2$, $$\\frac{a}{b}$$
Be thorough but concise.`,
        file_urls: uploadedFiles.map(f => f.url),
      });

      setAnalysis(response);
    } catch (e) {
      console.error('Analysis failed:', e);
      alert('Failed to analyze documents. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsAnalyzing(true);
    setAnalysis(null);
    setStudyGuide(null);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on the uploaded study materials, generate flashcards for effective studying.

Create 10-15 flashcards covering the most important concepts, definitions, and formulas.

Return ONLY a valid JSON array (no markdown, no code blocks) in this exact format:
[
  {
    "front": "Question or term",
    "back": "Answer or definition (use LaTeX for math: $x^2$)",
    "category": "Category name"
  }
]

Make flashcards:
- Clear and focused
- Cover key concepts and definitions
- Include formulas with LaTeX notation
- Progressive difficulty (easy to hard)`,
        file_urls: uploadedFiles.map(f => f.url),
        response_json_schema: {
          type: 'object',
          properties: {
            flashcards: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  front: { type: 'string' },
                  back: { type: 'string' },
                  category: { type: 'string' }
                },
                required: ['front', 'back', 'category']
              }
            }
          },
          required: ['flashcards']
        }
      });

      setGeneratedFlashcards(response.flashcards || []);
    } catch (e) {
      console.error('Flashcard generation failed:', e);
      alert('Failed to generate flashcards. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateStudyGuide = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsAnalyzing(true);
    setAnalysis(null);
    setGeneratedFlashcards([]);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert educational content creator. Create a comprehensive study guide from the uploaded materials.

Format the study guide in Notion-compatible markdown with this structure:

# 📚 Study Guide: [Topic Name]

## 📖 Overview
[2-3 paragraph overview of the topic]

## 🎯 Learning Objectives
- [ ] Objective 1
- [ ] Objective 2
- [ ] Objective 3

## 📝 Key Concepts

### Concept 1: [Name]
**Definition:** [Clear definition]

**Explanation:** [Detailed explanation]

**Example:** [Real-world example]

---

### Concept 2: [Name]
[Repeat structure]

## 📐 Important Formulas & Equations

### Formula 1: [Name]
$$[LaTeX formula]$$

**When to use:** [Application]

**Example problem:** [Step-by-step example]

---

## 💡 Study Tips
- Tip 1
- Tip 2
- Tip 3

## 🧠 Practice Questions
1. Question 1
   - Answer: [Answer with explanation]
2. Question 2
   - Answer: [Answer with explanation]

## 📊 Summary Table
| Concept | Key Points | Formula (if applicable) |
|---------|-----------|------------------------|
| [Name] | [Points] | [Formula] |

## 🔗 Related Topics
- Topic 1
- Topic 2

---
*Study Guide generated from your notes*

Use proper Notion markdown formatting:
- Use ## for main sections
- Use ### for subsections
- Use **bold** for emphasis
- Use - for bullet points
- Use - [ ] for checkboxes
- Use $$...$$ for display math
- Use $...$ for inline math
- Use | for tables
- Use --- for dividers`,
        file_urls: uploadedFiles.map(f => f.url),
      });

      setStudyGuide(response);
    } catch (e) {
      console.error('Study guide generation failed:', e);
      alert('Failed to generate study guide. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('✅ Copied to clipboard! Paste into Notion.');
    } catch (e) {
      console.error('Failed to copy:', e);
      alert('Failed to copy to clipboard');
    }
  };

  const handleSaveFlashcards = async () => {
    if (generatedFlashcards.length === 0 || !user) return;

    try {
      // Create a new deck
      const deck = await base44.entities.FlashcardDeck.create({
        name: `From: ${uploadedFiles[0]?.name || 'Documents'}`,
        description: 'Generated from uploaded study materials',
        is_custom: true,
        card_count: generatedFlashcards.length
      });

      // Create flashcards
      const flashcardPromises = generatedFlashcards.map(card =>
        base44.entities.Flashcard.create({
          deck_id: deck.id,
          front: card.front,
          back: card.back,
          category: card.category,
          difficulty: 'medium',
          mastery_level: 'new'
        })
      );

      await Promise.all(flashcardPromises);
      alert(`✅ ${generatedFlashcards.length} flashcards saved to your deck!`);
    } catch (e) {
      console.error('Failed to save flashcards:', e);
      alert('Failed to save flashcards. Please try again.');
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📄 Document Assistant</h1>
        <p className="page-description">Upload study materials for AI analysis and flashcard generation</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-[#F5F5F5] mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#D6B98C]" />
            Upload Documents
          </h2>
          
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
            className="w-full mb-4"
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
                Select Files (PDF, images, notes)
              </>
            )}
          </Button>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs text-[#8A8A8A] mb-2">Uploaded files ({uploadedFiles.length})</p>
              {uploadedFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between bg-[#171717] rounded-lg p-3 border border-[#2A2A2A]">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-[#D6B98C] flex-shrink-0" />
                    <span className="text-sm text-[#B5B5B5] truncate">{file.name}</span>
                  </div>
                  <button
                    onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))}
                    className="ml-2 text-[#DC2626] hover:text-[#EF4444] flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={handleAnalyzeDocuments}
              disabled={uploadedFiles.length === 0 || isAnalyzing}
              size="sm"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-1" />
                  Analyze
                </>
              )}
            </Button>

            <Button
              onClick={handleGenerateStudyGuide}
              disabled={uploadedFiles.length === 0 || isAnalyzing}
              variant="outline"
              size="sm"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <BookOpen className="w-3 h-3 mr-1" />
                  Study Guide
                </>
              )}
            </Button>

            <Button
              onClick={handleGenerateFlashcards}
              disabled={uploadedFiles.length === 0 || isAnalyzing}
              variant="outline"
              size="sm"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3 mr-1" />
                  Flashcards
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Analysis Results */}
        <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-[#F5F5F5] mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#D6B98C]" />
            Analysis Results
          </h2>

          {!analysis && !generatedFlashcards.length && !studyGuide && (
            <div className="text-center py-12 text-[#8A8A8A]">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Upload documents and generate content</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="prose prose-sm max-w-none [&_h2]:text-[#D6B98C] [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_strong]:text-[#F5F5F5] [&_li]:text-[#B5B5B5] [&_p]:text-[#B5B5B5]"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {analysis}
                </ReactMarkdown>
              </motion.div>
            )}

            {studyGuide && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-[#B5B5B5]">📚 Study Guide Ready</p>
                  <Button onClick={() => copyToClipboard(studyGuide)} size="sm">
                    📋 Copy for Notion
                  </Button>
                </div>
                <div className="bg-[#171717] rounded-lg p-6 border border-[#2A2A2A] max-h-[600px] overflow-y-auto">
                  <div className="prose prose-sm max-w-none [&_h1]:text-[#D6B98C] [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-[#D6B98C] [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-[#F5F5F5] [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_strong]:text-[#F5F5F5] [&_li]:text-[#B5B5B5] [&_p]:text-[#B5B5B5] [&_table]:text-[#B5B5B5] [&_th]:text-[#F5F5F5] [&_td]:border-[#2A2A2A] [&_th]:border-[#2A2A2A]">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {studyGuide}
                    </ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            )}

            {generatedFlashcards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-[#B5B5B5]">{generatedFlashcards.length} flashcards generated</p>
                  <Button onClick={handleSaveFlashcards} size="sm">
                    <Plus className="w-3 h-3 mr-1" />
                    Save to Deck
                  </Button>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {generatedFlashcards.map((card, i) => (
                    <div key={i} className="bg-[#171717] rounded-lg p-4 border border-[#2A2A2A]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[#D6B98C]">{card.category}</span>
                        <span className="text-xs text-[#8A8A8A]">Card {i + 1}</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-[#8A8A8A] mb-1">Front:</p>
                          <p className="text-sm text-[#F5F5F5]">{card.front}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#8A8A8A] mb-1">Back:</p>
                          <div className="text-sm text-[#B5B5B5] prose prose-sm max-w-none [&_.katex]:text-sm">
                            <ReactMarkdown
                              remarkPlugins={[remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                            >
                              {card.back}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}