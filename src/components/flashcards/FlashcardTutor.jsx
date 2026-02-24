import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Loader2, Lightbulb, Target, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FlashcardTutor({ question, isSubmitted }) {
  const [activeTab, setActiveTab] = useState('hint');
  const [hintContent, setHintContent] = useState(null);
  const [strategyContent, setStrategyContent] = useState(null);
  const [explainContent, setExplainContent] = useState(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  const [loadingExplain, setLoadingExplain] = useState(false);

  useEffect(() => {
    // Reset content when question changes
    setHintContent(null);
    setStrategyContent(null);
    setExplainContent(null);
    setActiveTab('hint');
  }, [question]);

  const generateHint = async () => {
    if (hintContent) return;
    setLoadingHint(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a Socratic tutor helping a student with a flashcard question.

Question: "${question}"

Provide a GUIDING QUESTION (not the answer) that helps the student think through this concept. Use Socratic method - ask questions that lead them to discover the answer themselves.

Do NOT reveal the answer. Only provide 1-2 guiding questions.

Format your response as a short, thoughtful question.`,
      });
      setHintContent(response);
    } catch (error) {
      setHintContent('Failed to generate hint. Please try again.');
    } finally {
      setLoadingHint(false);
    }
  };

  const generateStrategy = async () => {
    if (strategyContent) return;
    setLoadingStrategy(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert tutor explaining test-taking strategies.

Question: "${question}"

Explain a general APPROACH for tackling similar questions. Focus on:
- What concepts/skills this tests
- How to identify key information
- Common patterns or frameworks to apply

Do NOT reveal the specific answer to this question. Keep it strategic and educational.

Format: 2-3 short paragraphs.`,
      });
      setStrategyContent(response);
    } catch (error) {
      setStrategyContent('Failed to generate strategy. Please try again.');
    } finally {
      setLoadingStrategy(false);
    }
  };

  const generateExplanation = async () => {
    if (explainContent || !isSubmitted) return;
    setLoadingExplain(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide a DEEP EXPLANATION for this flashcard question.

Question: "${question}"

Provide:
1. The core concept being tested
2. Why this is important to understand
3. How this connects to broader topics
4. Common misconceptions

Format: 3-4 paragraphs with clear explanations.`,
      });
      setExplainContent(response);
    } catch (error) {
      setExplainContent('Failed to generate explanation. Please try again.');
    } finally {
      setLoadingExplain(false);
    }
  };

  // Auto-generate content when tab is selected
  useEffect(() => {
    if (activeTab === 'hint' && !hintContent && !loadingHint) {
      generateHint();
    } else if (activeTab === 'strategy' && !strategyContent && !loadingStrategy) {
      generateStrategy();
    } else if (activeTab === 'explain' && !explainContent && !loadingExplain && isSubmitted) {
      generateExplanation();
    }
  }, [activeTab, isSubmitted]);

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 bg-neutral-900">
          <TabsTrigger value="hint" className="data-[state=active]:bg-blue-600">
            <Lightbulb className="w-4 h-4 mr-2" />
            Hint
          </TabsTrigger>
          <TabsTrigger value="strategy" className="data-[state=active]:bg-purple-600">
            <Target className="w-4 h-4 mr-2" />
            Strategy
          </TabsTrigger>
          <TabsTrigger 
            value="explain" 
            disabled={!isSubmitted}
            className="data-[state=active]:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Explain
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hint" className="flex-1 p-6 overflow-y-auto">
          {loadingHint ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : hintContent ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-invert max-w-none"
            >
              <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                <p className="text-blue-300 text-sm font-semibold mb-2 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Think about this:
                </p>
                <p className="text-neutral-200 text-base leading-relaxed">{hintContent}</p>
              </div>
            </motion.div>
          ) : (
            <p className="text-neutral-500">Click to load hint...</p>
          )}
        </TabsContent>

        <TabsContent value="strategy" className="flex-1 p-6 overflow-y-auto">
          {loadingStrategy ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            </div>
          ) : strategyContent ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-invert max-w-none"
            >
              <div className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-4">
                <p className="text-purple-300 text-sm font-semibold mb-3 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Approach Strategy:
                </p>
                <div className="text-neutral-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {strategyContent}
                </div>
              </div>
            </motion.div>
          ) : (
            <p className="text-neutral-500">Click to load strategy...</p>
          )}
        </TabsContent>

        <TabsContent value="explain" className="flex-1 p-6 overflow-y-auto">
          {!isSubmitted ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400">Submit your answer to unlock explanation</p>
              </div>
            </div>
          ) : loadingExplain ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-green-400" />
            </div>
          ) : explainContent ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-invert max-w-none"
            >
              <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
                <p className="text-green-300 text-sm font-semibold mb-3 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Deep Dive:
                </p>
                <div className="text-neutral-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {explainContent}
                </div>
              </div>
            </motion.div>
          ) : (
            <p className="text-neutral-500">Loading explanation...</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}