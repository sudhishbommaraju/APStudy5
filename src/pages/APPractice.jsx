import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuroraBackground } from '@/components/ui/animated-background';
import { ArrowLeft, Database, Link as LinkIcon, Loader2, CheckCircle, ExternalLink, History } from 'lucide-react';
import { toast } from 'sonner';
import APPracticeQuestion from '@/components/practice/APPracticeQuestion';
import PracticeHistoryList from '@/components/practice/PracticeHistoryList';
import SpacedRepetitionWidget from '@/components/flashcards/SpacedRepetitionWidget';

export default function APPractice() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [notionPageUrl, setNotionPageUrl] = useState('');
  const [subject, setSubject] = useState('');
  const [unit, setUnit] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [linkedPage, setLinkedPage] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const sessionStartRef = useRef(null);

  const apSubjects = [
    { id: 'biology', name: 'AP Biology' },
    { id: 'chemistry', name: 'AP Chemistry' },
    { id: 'physics_1', name: 'AP Physics 1' },
    { id: 'physics_2', name: 'AP Physics 2' },
    { id: 'physics_c_mech', name: 'AP Physics C: Mechanics' },
    { id: 'physics_c_em', name: 'AP Physics C: E&M' },
    { id: 'environmental_science', name: 'AP Environmental Science' },
    { id: 'calc_ab', name: 'AP Calculus AB' },
    { id: 'calc_bc', name: 'AP Calculus BC' },
    { id: 'statistics', name: 'AP Statistics' },
    { id: 'cs_a', name: 'AP Computer Science A' },
    { id: 'cs_principles', name: 'AP Computer Science Principles' },
    { id: 'us_history', name: 'AP US History' },
    { id: 'world_history', name: 'AP World History: Modern' },
    { id: 'european_history', name: 'AP European History' },
    { id: 'us_gov', name: 'AP US Government & Politics' },
    { id: 'comp_gov', name: 'AP Comparative Government & Politics' },
    { id: 'macro', name: 'AP Macroeconomics' },
    { id: 'micro', name: 'AP Microeconomics' },
    { id: 'psychology', name: 'AP Psychology' },
    { id: 'human_geo', name: 'AP Human Geography' },
    { id: 'english_lang', name: 'AP English Language & Composition' },
    { id: 'english_lit', name: 'AP English Literature & Composition' },
  ];

  const subjectUnits = {
    biology: [
      { id: 'unit_1', name: 'Unit 1: Chemistry of Life' },
      { id: 'unit_2', name: 'Unit 2: Cell Structure and Function' },
      { id: 'unit_3', name: 'Unit 3: Cellular Energetics' },
      { id: 'unit_4', name: 'Unit 4: Cell Communication and Cell Cycle' },
      { id: 'unit_5', name: 'Unit 5: Heredity' },
      { id: 'unit_6', name: 'Unit 6: Gene Expression and Regulation' },
      { id: 'unit_7', name: 'Unit 7: Natural Selection' },
      { id: 'unit_8', name: 'Unit 8: Ecology' }
    ],
    chemistry: [
      { id: 'unit_1', name: 'Unit 1: Atomic Structure and Properties' },
      { id: 'unit_2', name: 'Unit 2: Molecular and Ionic Compound Structure' },
      { id: 'unit_3', name: 'Unit 3: Intermolecular Forces and Properties' },
      { id: 'unit_4', name: 'Unit 4: Chemical Reactions' },
      { id: 'unit_5', name: 'Unit 5: Kinetics' },
      { id: 'unit_6', name: 'Unit 6: Thermodynamics' },
      { id: 'unit_7', name: 'Unit 7: Equilibrium' },
      { id: 'unit_8', name: 'Unit 8: Acids and Bases' },
      { id: 'unit_9', name: 'Unit 9: Applications of Thermodynamics' }
    ],
    physics_1: [
      { id: 'unit_1', name: 'Unit 1: Kinematics' },
      { id: 'unit_2', name: 'Unit 2: Dynamics' },
      { id: 'unit_3', name: 'Unit 3: Circular Motion and Gravitation' },
      { id: 'unit_4', name: 'Unit 4: Energy' },
      { id: 'unit_5', name: 'Unit 5: Momentum' },
      { id: 'unit_6', name: 'Unit 6: Simple Harmonic Motion' },
      { id: 'unit_7', name: 'Unit 7: Torque and Rotational Motion' },
      { id: 'unit_8', name: 'Unit 8: Electric Charge and Electric Force' },
      { id: 'unit_9', name: 'Unit 9: DC Circuits' },
      { id: 'unit_10', name: 'Unit 10: Mechanical Waves and Sound' }
    ],
    calc_ab: [
      { id: 'unit_1', name: 'Unit 1: Limits and Continuity' },
      { id: 'unit_2', name: 'Unit 2: Differentiation: Definition and Fundamental Properties' },
      { id: 'unit_3', name: 'Unit 3: Differentiation: Composite, Implicit, and Inverse Functions' },
      { id: 'unit_4', name: 'Unit 4: Contextual Applications of Differentiation' },
      { id: 'unit_5', name: 'Unit 5: Analytical Applications of Differentiation' },
      { id: 'unit_6', name: 'Unit 6: Integration and Accumulation of Change' },
      { id: 'unit_7', name: 'Unit 7: Differential Equations' },
      { id: 'unit_8', name: 'Unit 8: Applications of Integration' },
      { id: 'unit_9', name: 'Unit 9: Parametric Equations, Polar Coordinates, and Vector-Valued Functions' },
      { id: 'unit_10', name: 'Unit 10: Infinite Sequences and Series' }
    ],
    calc_bc: [
      { id: 'unit_1', name: 'Unit 1: Limits and Continuity' },
      { id: 'unit_2', name: 'Unit 2: Differentiation: Definition and Fundamental Properties' },
      { id: 'unit_3', name: 'Unit 3: Differentiation: Composite, Implicit, and Inverse Functions' },
      { id: 'unit_4', name: 'Unit 4: Contextual Applications of Differentiation' },
      { id: 'unit_5', name: 'Unit 5: Analytical Applications of Differentiation' },
      { id: 'unit_6', name: 'Unit 6: Integration and Accumulation of Change' },
      { id: 'unit_7', name: 'Unit 7: Differential Equations' },
      { id: 'unit_8', name: 'Unit 8: Applications of Integration' },
      { id: 'unit_9', name: 'Unit 9: Parametric Equations, Polar Coordinates, and Vector-Valued Functions' },
      { id: 'unit_10', name: 'Unit 10: Infinite Sequences and Series' }
    ],
    us_history: [
      { id: 'unit_1', name: 'Unit 1: Period 1: 1491-1607' },
      { id: 'unit_2', name: 'Unit 2: Period 2: 1607-1754' },
      { id: 'unit_3', name: 'Unit 3: Period 3: 1754-1800' },
      { id: 'unit_4', name: 'Unit 4: Period 4: 1800-1848' },
      { id: 'unit_5', name: 'Unit 5: Period 5: 1844-1877' },
      { id: 'unit_6', name: 'Unit 6: Period 6: 1865-1898' },
      { id: 'unit_7', name: 'Unit 7: Period 7: 1890-1945' },
      { id: 'unit_8', name: 'Unit 8: Period 8: 1945-1980' },
      { id: 'unit_9', name: 'Unit 9: Period 9: 1980-Present' }
    ],
    world_history: [
      { id: 'unit_1', name: 'Unit 1: The Global Tapestry (1200-1450)' },
      { id: 'unit_2', name: 'Unit 2: Networks of Exchange (1200-1450)' },
      { id: 'unit_3', name: 'Unit 3: Land-Based Empires (1450-1750)' },
      { id: 'unit_4', name: 'Unit 4: Transoceanic Interconnections (1450-1750)' },
      { id: 'unit_5', name: 'Unit 5: Revolutions (1750-1900)' },
      { id: 'unit_6', name: 'Unit 6: Consequences of Industrialization (1750-1900)' },
      { id: 'unit_7', name: 'Unit 7: Global Conflict (1900-Present)' },
      { id: 'unit_8', name: 'Unit 8: Cold War and Decolonization (1900-Present)' },
      { id: 'unit_9', name: 'Unit 9: Globalization (1900-Present)' }
    ],
    statistics: [
      { id: 'unit_1', name: 'Unit 1: Exploring One-Variable Data' },
      { id: 'unit_2', name: 'Unit 2: Exploring Two-Variable Data' },
      { id: 'unit_3', name: 'Unit 3: Collecting Data' },
      { id: 'unit_4', name: 'Unit 4: Probability, Random Variables, and Probability Distributions' },
      { id: 'unit_5', name: 'Unit 5: Sampling Distributions' },
      { id: 'unit_6', name: 'Unit 6: Inference for Categorical Data: Proportions' },
      { id: 'unit_7', name: 'Unit 7: Inference for Quantitative Data: Means' },
      { id: 'unit_8', name: 'Unit 8: Inference for Categorical Data: Chi-Square' },
      { id: 'unit_9', name: 'Unit 9: Inference for Quantitative Data: Slopes' }
    ],
    english_lang: [
      { id: 'unit_1', name: 'Unit 1: Rhetorical Situation' },
      { id: 'unit_2', name: 'Unit 2: Claims and Evidence' },
      { id: 'unit_3', name: 'Unit 3: Reasoning and Organization' },
      { id: 'unit_4', name: 'Unit 4: Style' },
      { id: 'unit_5', name: 'Unit 5: Joining the Conversation' },
      { id: 'unit_6', name: 'Unit 6: Research and Argumentation' },
      { id: 'unit_7', name: 'Unit 7: Synthesis and Revision' },
      { id: 'unit_8', name: 'Unit 8: Analyzing Arguments' },
      { id: 'unit_9', name: 'Unit 9: Writing Process' }
    ],
    psychology: [
      { id: 'unit_1', name: 'Unit 1: Scientific Foundations of Psychology' },
      { id: 'unit_2', name: 'Unit 2: Biological Bases of Behavior' },
      { id: 'unit_3', name: 'Unit 3: Sensation and Perception' },
      { id: 'unit_4', name: 'Unit 4: Learning' },
      { id: 'unit_5', name: 'Unit 5: Cognitive Psychology' },
      { id: 'unit_6', name: 'Unit 6: Developmental Psychology' },
      { id: 'unit_7', name: 'Unit 7: Motivation, Emotion, and Personality' },
      { id: 'unit_8', name: 'Unit 8: Clinical Psychology' },
      { id: 'unit_9', name: 'Unit 9: Social Psychology' }
    ],
    macro: [
      { id: 'unit_1', name: 'Unit 1: Basic Economic Concepts' },
      { id: 'unit_2', name: 'Unit 2: Economic Indicators and the Business Cycle' },
      { id: 'unit_3', name: 'Unit 3: National Income and Price Determination' },
      { id: 'unit_4', name: 'Unit 4: Financial Sector' },
      { id: 'unit_5', name: 'Unit 5: Long-Run Consequences of Stabilization Policies' },
      { id: 'unit_6', name: 'Unit 6: Open Economy—International Trade and Finance' }
    ],
    micro: [
      { id: 'unit_1', name: 'Unit 1: Basic Economic Concepts' },
      { id: 'unit_2', name: 'Unit 2: Supply and Demand' },
      { id: 'unit_3', name: 'Unit 3: Production, Cost, and the Perfect Competition Model' },
      { id: 'unit_4', name: 'Unit 4: Imperfect Competition' },
      { id: 'unit_5', name: 'Unit 5: Factor Markets' },
      { id: 'unit_6', name: 'Unit 6: Market Failure and the Role of Government' }
    ],
    us_gov: [
      { id: 'unit_1', name: 'Unit 1: Foundations of American Democracy' },
      { id: 'unit_2', name: 'Unit 2: Interactions Among Branches of Government' },
      { id: 'unit_3', name: 'Unit 3: Civil Liberties and Civil Rights' },
      { id: 'unit_4', name: 'Unit 4: American Political Ideologies and Beliefs' },
      { id: 'unit_5', name: 'Unit 5: Political Participation' }
    ],
    european_history: [
      { id: 'unit_1', name: 'Unit 1: Renaissance and Exploration (1450-1648)' },
      { id: 'unit_2', name: 'Unit 2: Age of Reformation (1450-1648)' },
      { id: 'unit_3', name: 'Unit 3: Absolutism and Constitutionalism (1648-1815)' },
      { id: 'unit_4', name: 'Unit 4: Scientific, Philosophical, and Political Developments (1648-1815)' },
      { id: 'unit_5', name: 'Unit 5: Conflict, Crisis, and Reaction in the Late 18th Century (1648-1815)' },
      { id: 'unit_6', name: 'Unit 6: Industrialization and Its Effects (1815-1914)' },
      { id: 'unit_7', name: 'Unit 7: 19th-Century Perspectives and Political Developments (1815-1914)' },
      { id: 'unit_8', name: 'Unit 8: 20th-Century Global Conflicts (1914-Present)' },
      { id: 'unit_9', name: 'Unit 9: Cold War and Contemporary Europe (1914-Present)' }
    ],
  };

  const availableUnits = subject ? (subjectUnits[subject] || Array.from({ length: 8 }, (_, i) => ({ id: `unit_${i + 1}`, name: `Unit ${i + 1}` }))) : [];

  // PHASE 5: Clear all caches when subject changes
  const handleSubjectChange = async (val) => {
    setSubject(val);
    setUnit('');
    setQuestions([]);
    try {
      const { clearCache } = await import('@/components/generation/FastQuestionGenerator');
      await clearCache();
      console.log(`[SUBJECT CHANGE] Cleared cache. New subject: ${val}`);
    } catch {}
  };

  useEffect(() => {
    // Clear any cached state - always reset to allow new generation
    setSubject('');
    setUnit('');
    setNotionPageUrl('');
    setLoading(false);
    
    loadLinkedPage();
  }, []);

  const loadLinkedPage = async () => {
    try {
      const user = await base44.auth.me();
      if (user.notion_practice_page) {
        setLinkedPage(user.notion_practice_page);
        setNotionPageUrl(user.notion_practice_page);
      }
    } catch (error) {
      console.error('Failed to load linked page:', error);
    }
  };

  const handleLinkNotion = async () => {
    if (!notionPageUrl) {
      toast.error('Please enter a Notion tracker URL');
      return;
    }

    setLoading(true);
    try {
      await base44.auth.updateMe({
        notion_practice_page: notionPageUrl
      });
      
      setLinkedPage(notionPageUrl);
      toast.success('Notion tracker linked for progress sync!');
    } catch (error) {
      toast.error('Failed to link Notion');
      console.error('[Notion] Link error:', error);
    }
    setLoading(false);
  };

  const handleStartPractice = async () => {
    if (!subject || !unit) {
      toast.error('Please select subject and unit');
      return;
    }
    
    if (loading) return; // Prevent duplicate calls

    setLoading(true);
    
    try {
      // PHASE 1: Log subject before request
      console.log(`[AP PRACTICE] Generating subject: "${subject}", unit: "${unit}", count: ${questionCount}`);

      // PHASE 5: CLEAR ALL CACHES BEFORE NEW GENERATION
      const { generateQuestionsOptimized, clearCache } = await import('@/components/generation/FastQuestionGenerator');
      await clearCache();

      // PHASE 1: Explicit count + mode in every request
      console.log(`[AP PRACTICE] Request: subject="${subject}" unit="${unit}" count=${questionCount} mode="practice"`);
      const result = await generateQuestionsOptimized({
        examType: 'AP',
        subjectId: subject,
        unitId: unit,
        difficulty: 'mixed',
        count: questionCount,
        mode: 'practice'
      });

      setQuestions(result.map(q => ({
        id: q.id,
        stimulus: q.stimulus || '',
        question_text: q.question_text || '',
        stem: q.question_text || '',
        answer_choices: [q.choice_a, q.choice_b, q.choice_c, q.choice_d],
        correct_answer: ['A', 'B', 'C', 'D'].indexOf(q.correct_answer),
        explanation: q.explanation,
        subject_id: subject,
        unit_id: unit
      })));
      setCurrentIndex(0);
      setCorrectCount(0);
      sessionStartRef.current = Date.now();

    } catch (error) {
      // PHASE 2: Fail loudly — never silently return partial/wrong content
      console.error(`[AP PRACTICE] Generation failed: ${error.message}`);
      toast.error(`Failed to generate ${questionCount} questions. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentIndex(currentIndex + 1);
  };

  const handleComplete = () => {
    setQuestions([]);
    setCurrentIndex(0);
    toast.success('Practice complete!');
  };

  if (questions.length > 0) {
    return (
      <AuroraBackground>
        <div className="min-h-screen">
          <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-4">
            <div className="flex items-center justify-between max-w-[1800px] mx-auto">
              <h2 className="text-lg font-medium text-white">AP Practice</h2>
              <Button
                variant="outline"
                onClick={() => {
                  setQuestions([]);
                  setCurrentIndex(0);
                }}
              >
                Exit Practice
              </Button>
            </div>
          </div>
          
          <div className="max-w-[1800px] mx-auto px-6 py-8">
            <APPracticeQuestion
              question={questions[currentIndex]}
              questionIndex={currentIndex}
              totalQuestions={questions.length}
              onNext={handleNext}
              onComplete={handleComplete}
            />
          </div>
        </div>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground>
    <div className="min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-6">
        <button
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-12"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="space-y-6">
          {/* Notion Integration Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-2xl font-light text-white">Notion Progress Tracker (Optional)</h2>
                <p className="text-neutral-400 mt-1">Link Notion to track your practice sessions</p>
              </div>
            </div>

            {linkedPage ? (
              <div className="space-y-4">
                <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-white font-medium">Notion Tracker Linked</p>
                      <p className="text-sm text-neutral-400">Progress will sync to your Notion page</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(linkedPage, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View in Notion
                  </Button>
                </div>
                <div className="text-sm text-neutral-400 mt-2">
                  All practice questions are Proofly-original content aligned to College Board skill taxonomies.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Notion Page URL (Optional)
                    </label>
                    <Input
                      placeholder="https://notion.so/your-tracker-page"
                      value={notionPageUrl}
                      onChange={(e) => setNotionPageUrl(e.target.value)}
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                    <p className="text-xs text-neutral-500 mt-2">
                      Link a Notion page to track your practice sessions and progress
                    </p>
                  </div>

                  <Button onClick={handleLinkNotion} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Linking...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Link Notion Tracker
                      </>
                    )}
                  </Button>

                  <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-neutral-300 mb-2">📚 Official Resources</h4>
                    <div className="space-y-2 text-xs text-neutral-400">
                      <a href="https://apcentral.collegeboard.org/courses/past-exam-questions" target="_blank" rel="noopener" className="block hover:text-white">
                        → AP Past Free-Response Questions
                      </a>
                      <a href="https://apcentral.collegeboard.org/media/pdf/ap-biology-course-and-exam-description.pdf" target="_blank" rel="noopener" className="block hover:text-white">
                        → AP Course & Exam Descriptions
                      </a>
                      <p className="text-xs text-neutral-500 mt-2 italic">
                        Proofly generates original questions aligned to official skill taxonomies. Official materials are linked for reference only.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Practice Session Configuration */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <h2 className="text-2xl font-light text-white mb-6">Start Practice Session</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Subject</label>
                <Select value={subject} onValueChange={handleSubjectChange}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="Select AP Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {apSubjects.map((subj) => (
                      <SelectItem key={subj.id} value={subj.id}>
                        {subj.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Unit</label>
                <Select value={unit} onValueChange={setUnit} disabled={!subject}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder={subject ? "Select Unit" : "Select subject first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Number of Questions
                </label>
                <Select value={questionCount.toString()} onValueChange={(v) => setQuestionCount(parseInt(v))}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Questions</SelectItem>
                    <SelectItem value="10">10 Questions</SelectItem>
                    <SelectItem value="15">15 Questions</SelectItem>
                    <SelectItem value="20">20 Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleStartPractice}
                disabled={loading || !subject || !unit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Practice...
                  </>
                ) : (
                  'Generate Practice'
                )}
              </Button>

              {/* Debug Panel */}
              <div className="text-xs text-gray-400 mt-4 p-3 bg-neutral-800 rounded-lg">
                <p>Loading: {loading ? "Yes" : "No"}</p>
                <p>Practice Count: {questions?.length || 0}</p>
                <p>Status: {questions.length > 0 ? "Ready" : "Click Generate to Begin"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AuroraBackground>
  );
}