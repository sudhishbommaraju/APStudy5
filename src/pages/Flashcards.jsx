import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import DeckFlashcardReview from '@/components/flashcards/DeckFlashcardReview';
import { Loader2, ArrowLeft, ChevronRight, Sparkles, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const AP_SUBJECTS = {
  'Sciences': [
    { id: 'biology', name: 'AP Biology', emoji: '🧬', subjectLabel: 'AP Biology' },
    { id: 'chemistry', name: 'AP Chemistry', emoji: '⚗️', subjectLabel: 'AP Chemistry' },
    { id: 'physics_1', name: 'AP Physics 1', emoji: '⚡', subjectLabel: 'AP Physics 1' },
    { id: 'physics_2', name: 'AP Physics 2', emoji: '🔬', subjectLabel: 'AP Physics 2' },
    { id: 'physics_c_mech', name: 'AP Physics C: Mech', emoji: '🚀', subjectLabel: 'AP Physics C: Mechanics' },
    { id: 'environmental_science', name: 'AP Env. Science', emoji: '🌍', subjectLabel: 'AP Environmental Science' },
  ],
  'Math & CS': [
    { id: 'calc_ab', name: 'AP Calculus AB', emoji: '∫', subjectLabel: 'AP Calculus AB' },
    { id: 'calc_bc', name: 'AP Calculus BC', emoji: '∑', subjectLabel: 'AP Calculus BC' },
    { id: 'statistics', name: 'AP Statistics', emoji: '📊', subjectLabel: 'AP Statistics' },
    { id: 'computer_science_a', name: 'AP CS A', emoji: '💻', subjectLabel: 'AP Computer Science A' },
    { id: 'cs_principles', name: 'AP CS Principles', emoji: '🌐', subjectLabel: 'AP CS Principles' },
  ],
  'History & Social Studies': [
    { id: 'us_history', name: 'AP US History', emoji: '🇺🇸', subjectLabel: 'AP US History' },
    { id: 'world_history', name: 'AP World History', emoji: '🌐', subjectLabel: 'AP World History' },
    { id: 'european_history', name: 'AP European History', emoji: '🏰', subjectLabel: 'AP European History' },
    { id: 'us_gov', name: 'AP US Government', emoji: '🏛️', subjectLabel: 'AP US Government' },
    { id: 'human_geo', name: 'AP Human Geography', emoji: '🗺️', subjectLabel: 'AP Human Geography' },
    { id: 'psychology', name: 'AP Psychology', emoji: '🧠', subjectLabel: 'AP Psychology' },
    { id: 'macro', name: 'AP Macroeconomics', emoji: '📈', subjectLabel: 'AP Macroeconomics' },
    { id: 'micro', name: 'AP Microeconomics', emoji: '💰', subjectLabel: 'AP Microeconomics' },
  ],
  'English & Arts': [
    { id: 'english_lang', name: 'AP English Language', emoji: '✍️', subjectLabel: 'AP English Language' },
    { id: 'english_lit', name: 'AP English Literature', emoji: '📚', subjectLabel: 'AP English Literature' },
  ],
  'World Languages': [
    { id: 'spanish_lang', name: 'AP Spanish', emoji: '🇪🇸', subjectLabel: 'AP Spanish Language' },
    { id: 'french_lang', name: 'AP French', emoji: '🇫🇷', subjectLabel: 'AP French Language' },
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
  spanish_lang: ['Families & Communities','Science & Technology','Beauty & Aesthetics','Education & Careers','Identity & Social Issues','Environment & Geography'],
  french_lang: ['Personal & Public Identities','Families & Communities','Global Challenges','Science & Technology','Beauty & Aesthetics','Contemporary Life'],
};

const CARD_COUNTS = [10, 15, 20, 30];

export default function Flashcards() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=subject, 2=unit, 3=studying
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [cardCount, setCardCount] = useState(15);
  const [loading, setLoading] = useState(false);
  const [studyDeck, setStudyDeck] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const units = selectedSubject ? (UNITS_BY_SUBJECT[selectedSubject.id] || []) : [];

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    setSelectedUnit(null);
    setStep(2);
  };

  const handleGenerate = async () => {
    if (!selectedSubject || !selectedUnit || !user) return;
    setLoading(true);
    try {
      const unitNum = units.indexOf(selectedUnit) + 1;
      const deckLabel = `${selectedSubject.subjectLabel} — Unit ${unitNum}: ${selectedUnit}`;

      const prompt = `You are generating flashcards for:
Subject: ${selectedSubject.subjectLabel}
Unit: ${unitNum} — ${selectedUnit}

RULES:
- front: a key term, concept, or question (concise)
- back: clear definition or explanation (1-3 sentences)
- Only content from this unit

Generate exactly ${cardCount} flashcards as JSON:`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            flashcards: {
              type: 'array',
              items: {
                type: 'object',
                properties: { front: { type: 'string' }, back: { type: 'string' } },
                required: ['front', 'back']
              }
            }
          }
        }
      });

      const flashcards = result.flashcards || [];
      if (flashcards.length === 0) { toast.error('No cards generated. Try again.'); return; }

      // Find or create deck
      const existing = await base44.entities.FlashcardDeck.filter({ user_email: user.email, subject_id: selectedSubject.id, unit_number: unitNum });
      let deck;
      if (existing.length > 0) {
        deck = existing[0];
        const old = await base44.entities.Flashcard.filter({ deck_id: deck.id });
        await Promise.all(old.map(c => base44.entities.Flashcard.delete(c.id)));
      } else {
        deck = await base44.entities.FlashcardDeck.create({
          user_email: user.email,
          name: deckLabel,
          subject: selectedSubject.subjectLabel,
          subject_id: selectedSubject.id,
          unit_number: unitNum,
          unit_title: selectedUnit,
          is_active: true
        });
      }

      await base44.entities.Flashcard.bulkCreate(flashcards.map(fc => ({
        deck_id: deck.id,
        front: fc.front,
        back: fc.back,
        category: `Unit ${unitNum}: ${selectedUnit}`,
        mastery_level: 'new',
        times_reviewed: 0,
      })));

      toast.success(`Generated ${flashcards.length} flashcards!`);
      setStudyDeck(deck);
      setStep(3);
    } catch (e) {
      toast.error('Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Study
  if (step === 3 && studyDeck) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#f8fafc]">
          <DashboardNavbar />
          <div className="py-8">
            <DeckFlashcardReview deck={studyDeck} onBack={() => setStep(2)} />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardNavbar />
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="max-w-5xl mx-auto px-6 py-10">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
            <button onClick={() => navigate('/Dashboard')} className="hover:text-gray-600">Dashboard</button>
            <ChevronRight className="w-3 h-3" />
            {step === 1 && <span className="text-gray-700 font-medium">Flashcards</span>}
            {step >= 2 && (
              <>
                <button onClick={() => { setStep(1); setSelectedSubject(null); }} className="hover:text-gray-600">Flashcards</button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-700 font-medium">{selectedSubject?.name}</span>
              </>
            )}
          </div>

          {/* Step 1: Subject Selection */}
          {step === 1 && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Flashcards</h1>
                <p className="text-gray-500">Select a subject to generate flashcard decks</p>
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

          {/* Step 2: Unit + Generate */}
          {step === 2 && (
            <>
              <button onClick={() => { setStep(1); setSelectedSubject(null); }} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to subjects
              </button>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedSubject?.emoji} {selectedSubject?.name}</h1>
                <p className="text-gray-500">Choose a unit to generate flashcards</p>
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
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Number of Cards</h3>
                  <div className="flex gap-2 mb-6">
                    {CARD_COUNTS.map(n => (
                      <button
                        key={n}
                        onClick={() => setCardCount(n)}
                        className={`w-14 h-10 rounded-lg text-sm font-semibold transition-all ${
                          cardCount === n ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {n}
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
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating {cardCount} cards…</>
                      : <><Sparkles className="w-4 h-4 mr-2" />Generate {cardCount} Flashcards</>}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}