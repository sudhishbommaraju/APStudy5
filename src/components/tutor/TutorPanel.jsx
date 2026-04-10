import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Loader2, Lightbulb, Target, BookOpen, HelpCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Shared TutorPanel — works in both Practice and Flashcard modes.
 *
 * Props:
 *   subject        {string}   AP subject name
 *   unit           {string}   Unit name
 *   questionText   {string}   The question prompt
 *   options        {string[]} MCQ answer choices (optional)
 *   correctAnswer  {string}   Correct answer letter/text (NEVER shown pre-submission)
 *   userAnswer     {string}   What the user selected (optional)
 *   isSubmitted    {boolean}  Whether the user has already submitted
 */
export default function TutorPanel({ subject, unit, questionText, options = [], correctAnswer, userAnswer, isSubmitted }) {
  const [activeTab, setActiveTab] = useState('hint');
  const [content, setContent] = useState({ hint: null, strategy: null, concept: null, explain: null });
  const [loading, setLoading] = useState({ hint: false, strategy: false, concept: false, explain: false });

  // Reset on question change
  useEffect(() => {
    setContent({ hint: null, strategy: null, concept: null, explain: null });
    setActiveTab('hint');
  }, [questionText]);

  // Auto-load when tab changes
  useEffect(() => {
    if (activeTab === 'hint' && !content.hint && !loading.hint) loadHint();
    if (activeTab === 'strategy' && !content.strategy && !loading.strategy) loadStrategy();
    if (activeTab === 'concept' && !content.concept && !loading.concept) loadConcept();
    if (activeTab === 'explain' && isSubmitted && !content.explain && !loading.explain) loadExplain();
  }, [activeTab, isSubmitted]);

  const ctx = `Subject: ${subject || 'AP'}\nUnit: ${unit || ''}\nQuestion: "${questionText}"${options.length ? `\nOptions:\n${options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n')}` : ''}`;

  const setTab = (key, val) => setContent(prev => ({ ...prev, [key]: val }));
  const setLoad = (key, val) => setLoading(prev => ({ ...prev, [key]: val }));

  async function loadHint() {
    setLoad('hint', true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a Socratic AP tutor. Help the student think through the question WITHOUT revealing the answer.

${ctx}

Provide 1-2 guiding questions (Socratic method) that nudge the student toward the answer.
IMPORTANT: Do NOT state or hint at the correct answer choice. If the student asks "what is the answer?", respond: "I can guide you, but try answering first."`,
      });
      setTab('hint', res);
    } catch { setTab('hint', 'Could not load hint. Try again.'); }
    finally { setLoad('hint', false); }
  }

  async function loadStrategy() {
    setLoad('strategy', true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AP exam strategy coach. Explain how to approach this type of question.

${ctx}

Cover:
- What skill/concept this question tests
- How to eliminate wrong answers
- AP-specific test-taking tips for this subject

Do NOT reveal the correct answer. Keep it to 3-4 short bullet points.`,
      });
      setTab('strategy', res);
    } catch { setTab('strategy', 'Could not load strategy. Try again.'); }
    finally { setLoad('strategy', false); }
  }

  async function loadConcept() {
    setLoad('concept', true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Identify the core AP concept being tested in this question.

${ctx}

Return:
1. The specific concept name
2. A 2-sentence description of what it is
3. Why it appears on AP exams

Do NOT reveal the correct answer.`,
      });
      setTab('concept', res);
    } catch { setTab('concept', 'Could not load concept info. Try again.'); }
    finally { setLoad('concept', false); }
  }

  async function loadExplain() {
    setLoad('explain', true);
    const answerContext = userAnswer
      ? `\nThe student selected: ${userAnswer}\nCorrect answer: ${correctAnswer}`
      : `\nCorrect answer: ${correctAnswer}`;
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide a full post-submission explanation for this AP question.

${ctx}${answerContext}

Explain:
1. Why the correct answer is correct (with reasoning)
2. Why each wrong answer is wrong
3. The deeper concept this tests
4. How to remember this for the real AP exam`,
      });
      setTab('explain', res);
    } catch { setTab('explain', 'Could not load explanation. Try again.'); }
    finally { setLoad('explain', false); }
  }

  const renderContent = (key, color, label, Icon) => {
    if (loading[key]) return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className={`w-5 h-5 animate-spin text-${color}-400`} />
      </div>
    );
    if (!content[key]) return <p className="text-gray-400 text-sm">Loading...</p>;
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <p className="text-blue-600 text-xs font-semibold mb-2 flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5" /> {label}
          </p>
          <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{content[key]}</div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Tutor</p>
        {!isSubmitted && (
          <p className="text-xs text-gray-400 mt-0.5">Hints available · Answer locked until submission</p>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-4 bg-gray-50 rounded-none border-b border-gray-200 h-10">
          <TabsTrigger value="hint" className="text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-none text-gray-600">
            <Lightbulb className="w-3.5 h-3.5 mr-1" /> Hint
          </TabsTrigger>
          <TabsTrigger value="strategy" className="text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-none text-gray-600">
            <Target className="w-3.5 h-3.5 mr-1" /> Strategy
          </TabsTrigger>
          <TabsTrigger value="concept" className="text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-none text-gray-600">
            <HelpCircle className="w-3.5 h-3.5 mr-1" /> Concept
          </TabsTrigger>
          <TabsTrigger
            value="explain"
            disabled={!isSubmitted}
            className="text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-none text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1" /> Explain
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'hint'     && renderContent('hint',     'blue',   'Think about this:', Lightbulb)}
          {activeTab === 'strategy' && renderContent('strategy', 'blue',   'Approach Strategy:', Target)}
          {activeTab === 'concept'  && renderContent('concept',  'blue',   'Concept Tested:', HelpCircle)}
          {activeTab === 'explain'  && (
            !isSubmitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-gray-400 text-sm">Submit your answer to unlock the full explanation.</p>
              </div>
            ) : renderContent('explain', 'green', 'Full Explanation:', BookOpen)
          )}
        </div>
      </Tabs>
    </div>
  );
}