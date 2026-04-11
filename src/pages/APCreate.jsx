import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Loader2, FileText, Layers, RotateCcw, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardNavbar from '@/components/layout/DashboardNavbar';

const AP_SUBJECTS = {
  'Sciences': [
    { id: 'biology', name: 'AP Biology', emoji: '🧬' },
    { id: 'chemistry', name: 'AP Chemistry', emoji: '⚗️' },
    { id: 'physics_1', name: 'AP Physics 1', emoji: '⚡' },
    { id: 'physics_2', name: 'AP Physics 2', emoji: '🔬' },
    { id: 'physics_c_mech', name: 'AP Physics C: Mech', emoji: '🚀' },
    { id: 'environmental_science', name: 'AP Env. Science', emoji: '🌍' },
  ],
  'Math & CS': [
    { id: 'calc_ab', name: 'AP Calculus AB', emoji: '∫' },
    { id: 'calc_bc', name: 'AP Calculus BC', emoji: '∑' },
    { id: 'statistics', name: 'AP Statistics', emoji: '📊' },
    { id: 'computer_science_a', name: 'AP CS A', emoji: '💻' },
    { id: 'cs_principles', name: 'AP CS Principles', emoji: '🌐' },
  ],
  'History & Social Studies': [
    { id: 'us_history', name: 'AP US History', emoji: '🇺🇸' },
    { id: 'world_history', name: 'AP World History', emoji: '🌐' },
    { id: 'european_history', name: 'AP European History', emoji: '🏰' },
    { id: 'us_gov', name: 'AP US Government', emoji: '🏛️' },
    { id: 'human_geo', name: 'AP Human Geography', emoji: '🗺️' },
    { id: 'psychology', name: 'AP Psychology', emoji: '🧠' },
    { id: 'macro', name: 'AP Macroeconomics', emoji: '📈' },
    { id: 'micro', name: 'AP Microeconomics', emoji: '💰' },
  ],
  'English & Arts': [
    { id: 'english_lang', name: 'AP English Language', emoji: '✍️' },
    { id: 'english_lit', name: 'AP English Literature', emoji: '📚' },
    { id: 'art_history', name: 'AP Art History', emoji: '🎨' },
    { id: 'music_theory', name: 'AP Music Theory', emoji: '🎵' },
  ],
  'World Languages': [
    { id: 'spanish_lang', name: 'AP Spanish', emoji: '🇪🇸' },
    { id: 'french_lang', name: 'AP French', emoji: '🇫🇷' },
    { id: 'latin', name: 'AP Latin', emoji: '🏛️' },
  ],
};

const UNITS_BY_SUBJECT = {
  biology: ['Chemistry of Life','Cell Structure & Function','Cellular Energetics','Cell Communication','Heredity','Gene Expression','Natural Selection','Ecology'],
  chemistry: ['Atomic Structure','Molecular & Ionic Compounds','Intermolecular Forces','Chemical Reactions','Kinetics','Thermodynamics','Equilibrium','Acids & Bases','Electrochemistry'],
  physics_1: ['Kinematics',"Newton's Laws",'Work, Energy & Power','Systems & Momentum','Rotation','Oscillations','Waves & Sound'],
  physics_2: ['Fluids','Thermodynamics','Electric Force & Field','Electric Potential','Magnetism','Geometric & Physical Optics','Quantum & Nuclear Physics'],
  physics_c_mech: ['Kinematics',"Newton's Laws",'Work, Energy & Power','Systems & Momentum','Rotation','Oscillations','Gravitation'],
  environmental_science: ['Ecosystems','Biodiversity','Populations','Earth Systems','Land & Water Use','Energy Resources','Atmospheric Pollution','Aquatic & Terrestrial Pollution','Global Change'],
  calc_ab: ['Limits & Continuity','Differentiation: Definition','Differentiation: Rules','Contextual Applications','Analytical Applications','Integration & Accumulation','Differential Equations','Applications of Integration'],
  calc_bc: ['Limits & Continuity','Differentiation','Contextual Applications','Analytical Applications','Integration','Differential Equations','Applications of Integration','Parametric, Polar & Vectors','Series & Sequences'],
  statistics: ['Exploring One-Variable Data','Exploring Two-Variable Data','Collecting Data','Probability','Sampling Distributions','Inference for Proportions','Inference for Means','Chi-Square Tests','Inference for Regression'],
  computer_science_a: ['Primitive Types','Using Objects','Boolean Expressions & Conditionals','Iteration','Writing Classes','Array','ArrayList','2D Array','Inheritance','Recursion'],
  cs_principles: ['Creative Development','Data','Algorithms & Programming','Computer Systems & Networks','Impact of Computing'],
  us_history: ['Period 1: 1491–1607','Period 2: 1607–1754','Period 3: 1754–1800','Period 4: 1800–1848','Period 5: 1844–1877','Period 6: 1865–1898','Period 7: 1890–1945','Period 8: 1945–1980','Period 9: 1980–Present'],
  world_history: ['Global Tapestry','Networks of Exchange','Land-Based Empires','Transoceanic Interconnections','Revolutions','Consequences of Industrialization','Global Conflict','Cold War & Decolonization','Globalization'],
  european_history: ['Renaissance & Exploration','Reformation','Absolutism & Constitutionalism','Scientific Revolution & Enlightenment','French Revolution & Napoleon','Industrialization','Nationalism & Imperialism','WWI & Interwar','WWII & Cold War Europe'],
  us_gov: ['Foundations of Democracy','Interactions Among Branches','Civil Liberties & Rights','American Political Ideologies','Political Participation'],
  human_geo: ['Thinking Geographically','Population & Migration','Cultural Patterns','Political Organization','Agriculture & Rural Land Use','Cities & Urban Land Use','Industrial & Economic Development'],
  psychology: ['Scientific Foundations','Biological Bases','Sensation & Perception','Learning','Cognitive Psychology','Developmental Psychology','Motivation & Emotion','Clinical Psychology','Social Psychology'],
  macro: ['Basic Economic Concepts','Economic Indicators','Aggregate Demand & Supply','Financial Sector','Long-Run Consequences','Open Economy'],
  micro: ['Basic Economic Concepts','Supply & Demand','Production, Cost & Perfect Competition','Imperfect Competition','Factor Markets','Market Failure & Government'],
  english_lang: ['Claims & Evidence','Rhetorical Situation','Argument','Style'],
  english_lit: ['Short Fiction','Poetry','Longer Fiction & Drama'],
  art_history: ['Global Prehistory','Ancient Mediterranean','Early Europe & Colonial Americas','Later Europe & Americas','Indigenous Americas','Africa','West & South Asia','East Asia','Global Contemporary'],
  music_theory: ['Music Fundamentals','Scales & Keys','Intervals & Chords','Harmony & Voice Leading','Musical Form & Analysis'],
  spanish_lang: ['Families & Communities','Science & Technology','Beauty & Aesthetics','Education & Careers','Identity & Social Issues','Environment & Geography'],
  french_lang: ['Personal & Public Identities','Families & Communities','Global Challenges','Science & Technology','Beauty & Aesthetics','Contemporary Life'],
  latin: ['Latin Literature: Caesar','Latin Literature: Vergil','Roman Culture & Society','Grammar & Syntax'],
};

export default function APCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=subject, 2=unit, 3=output
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [outputFormat, setOutputFormat] = useState('notes');
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [flippedCards, setFlippedCards] = useState(new Set());

  const units = selectedSubject ? (UNITS_BY_SUBJECT[selectedSubject.id] || []) : [];

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    setSelectedUnit(null);
    setStep(2);
  };

  const handleGenerate = async () => {
    if (!selectedSubject || !selectedUnit) return;
    setLoading(true);
    setGeneratedContent(null);
    setFlashcards([]);
    setFlippedCards(new Set());

    try {
      const unitNum = units.indexOf(selectedUnit) + 1;

      if (outputFormat === 'flashcards') {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert AP tutor. Generate 15 high-quality flashcards for ${selectedSubject.name}, Unit ${unitNum}: "${selectedUnit}".
Each flashcard: Front = a precise, testable question or key term. Back = complete accurate answer (2-4 sentences).`,
          response_json_schema: {
            type: 'object',
            properties: {
              flashcards: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { front: { type: 'string' }, back: { type: 'string' }, category: { type: 'string' } }
                }
              }
            }
          }
        });
        setFlashcards(result.flashcards || []);
      } else {
        const formatInstructions = outputFormat === 'notes'
          ? 'comprehensive structured study notes in markdown. Include ## headers, **bold** key terms, code blocks for formulas, bullet lists, and a "Common Mistakes" section.'
          : 'a thorough bullet-point summary. Use nested bullets, bold vocabulary, include formulas where relevant.';

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert AP tutor writing study materials for students aiming for a 5.
Generate ${formatInstructions}
Subject: ${selectedSubject.name}
Unit ${unitNum}: ${selectedUnit}
Flag high-frequency AP exam topics with ⭐. End with 3-5 "Key Takeaways". Minimum 600 words.`,
          response_json_schema: {
            type: 'object',
            properties: { title: { type: 'string' }, content: { type: 'string' } }
          }
        });
        setGeneratedContent(result);

        const user = await base44.auth.me();
        base44.entities.StudyNote.create({
          user_email: user.email,
          exam_type: 'AP',
          subject_id: selectedSubject.id,
          title: `${selectedSubject.name} — ${selectedUnit}`,
          content: result.content,
        }).catch(() => {});
      }

      toast.success('Generated successfully!');
      setStep(3);
    } catch (e) {
      toast.error('Generation failed. Please try again.');
    }
    setLoading(false);
  };

  const toggleFlip = (idx) => {
    setFlippedCards(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <ProtectedRoute>
      <DashboardNavbar />
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="max-w-5xl mx-auto px-6 py-10">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
            <button onClick={() => navigate('/Dashboard')} className="hover:text-gray-600">Dashboard</button>
            <ChevronRight className="w-3 h-3" />
            {step === 1 && <span className="text-gray-700 font-medium">AP Study Materials</span>}
            {step >= 2 && (
              <>
                <button onClick={() => { setStep(1); setSelectedSubject(null); }} className="hover:text-gray-600">AP Study Materials</button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-700 font-medium">{selectedSubject?.name}</span>
              </>
            )}
            {step === 3 && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-700 font-medium">{selectedUnit}</span>
              </>
            )}
          </div>

          {/* Step 1: Subject selection */}
          {step === 1 && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">AP Study Materials</h1>
                <p className="text-gray-500">Select a subject to generate notes or flashcards</p>
              </div>
              {Object.entries(AP_SUBJECTS).map(([category, subjects]) => (
                <div key={category} className="mb-8">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{category}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {subjects.map(subject => (
                      <button
                        key={subject.id}
                        onClick={() => handleSelectSubject(subject)}
                        className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-blue-400 hover:shadow-sm transition-all group"
                      >
                        <div className="text-2xl mb-2">{subject.emoji}</div>
                        <div className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 leading-tight">{subject.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Step 2: Unit + Format */}
          {step === 2 && (
            <>
              <button onClick={() => { setStep(1); setSelectedSubject(null); }} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to subjects
              </button>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedSubject?.emoji} {selectedSubject?.name}</h1>
                <p className="text-gray-500">Choose a unit and format</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                {units.map((unit, i) => (
                  <button
                    key={unit}
                    onClick={() => setSelectedUnit(unit)}
                    className={`border rounded-xl p-4 text-left transition-all ${
                      selectedUnit === unit
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="text-xs font-semibold text-gray-400 mb-1">Unit {i + 1}</div>
                    <div className={`text-sm font-semibold leading-tight ${selectedUnit === unit ? 'text-blue-700' : 'text-gray-800'}`}>
                      {unit}
                    </div>
                  </button>
                ))}
              </div>

              {selectedUnit && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Output Format</h3>
                  <div className="flex gap-2 mb-6">
                    {[['notes', '📄', 'Study Notes'], ['bullets', '•', 'Bullet Summary'], ['flashcards', '🃏', 'Flashcards']].map(([val, icon, label]) => (
                      <button
                        key={val}
                        onClick={() => setOutputFormat(val)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                          outputFormat === val ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'
                        }`}
                      >
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="bg-blue-500 hover:bg-blue-600 w-full"
                    size="lg"
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</>
                      : <><Sparkles className="w-4 h-4 mr-2" />Generate {outputFormat === 'flashcards' ? 'Flashcards' : 'Notes'}</>}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Step 3: Output */}
          {step === 3 && (
            <>
              <button onClick={() => { setStep(2); setGeneratedContent(null); setFlashcards([]); }} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to units
              </button>

              {/* Notes/Bullets */}
              {generatedContent && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <h3 className="text-sm font-semibold text-gray-800">{generatedContent.title || `${selectedSubject?.name} — ${selectedUnit}`}</h3>
                    </div>
                    <button onClick={() => { setGeneratedContent(null); setStep(2); }} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> Regenerate
                    </button>
                  </div>
                  <div className="px-6 py-5 overflow-auto max-h-[70vh]">
                    <div className="prose prose-sm prose-slate max-w-none">
                      <ReactMarkdown>{generatedContent.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {/* Flashcards */}
              {flashcards.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-500" />
                      <h3 className="text-sm font-semibold text-gray-800">{flashcards.length} Flashcards — {selectedSubject?.name}: {selectedUnit}</h3>
                    </div>
                    <span className="text-xs text-gray-400">Click a card to flip</span>
                  </div>
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-auto">
                    {flashcards.map((card, idx) => {
                      const isFlipped = flippedCards.has(idx);
                      return (
                        <button
                          key={idx}
                          onClick={() => toggleFlip(idx)}
                          className={`text-left p-4 rounded-xl border-2 transition-all min-h-[100px] ${
                            isFlipped ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:border-blue-200 hover:shadow-sm'
                          }`}
                        >
                          <div className="text-xs font-semibold uppercase tracking-wider mb-2 ${isFlipped ? 'text-blue-500' : 'text-gray-400'}">
                            {isFlipped ? '✓ Answer' : `Card ${idx + 1}`}
                          </div>
                          <p className={`text-sm leading-relaxed ${isFlipped ? 'text-blue-900' : 'text-gray-800 font-medium'}`}>
                            {isFlipped ? card.back : card.front}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}