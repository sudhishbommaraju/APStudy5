import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Sparkles, Loader2, BookOpen, ChevronRight, FileText, Layers, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const AP_SUBJECTS = [
  { id: 'biology', name: 'AP Biology', units: ['Chemistry of Life','Cell Structure & Function','Cellular Energetics','Cell Communication','Heredity','Gene Expression','Natural Selection','Ecology'] },
  { id: 'chemistry', name: 'AP Chemistry', units: ['Atomic Structure','Molecular & Ionic Compounds','Intermolecular Forces','Chemical Reactions','Kinetics','Thermodynamics','Equilibrium','Acids & Bases','Electrochemistry'] },
  { id: 'physics_1', name: 'AP Physics 1', units: ['Kinematics',"Newton's Laws",'Work, Energy & Power','Systems & Momentum','Rotation','Oscillations','Waves & Sound'] },
  { id: 'physics_2', name: 'AP Physics 2', units: ['Fluids','Thermodynamics','Electric Force & Field','Electric Potential','Magnetism','Geometric & Physical Optics','Quantum & Nuclear Physics'] },
  { id: 'physics_c_mech', name: 'AP Physics C: Mechanics', units: ['Kinematics',"Newton's Laws",'Work, Energy & Power','Systems & Momentum','Rotation','Oscillations','Gravitation'] },
  { id: 'physics_c_em', name: 'AP Physics C: E&M', units: ['Electrostatics','Conductors & Capacitors','Electric Circuits','Magnetic Fields','Electromagnetism'] },
  { id: 'environmental_science', name: 'AP Environmental Science', units: ['Ecosystems','Biodiversity','Populations','Earth Systems','Land & Water Use','Energy Resources','Atmospheric Pollution','Aquatic & Terrestrial Pollution','Global Change'] },
  { id: 'calc_ab', name: 'AP Calculus AB', units: ['Limits & Continuity','Differentiation: Definition','Differentiation: Rules','Contextual Applications','Analytical Applications','Integration & Accumulation','Differential Equations','Applications of Integration'] },
  { id: 'calc_bc', name: 'AP Calculus BC', units: ['Limits & Continuity','Differentiation','Contextual Applications','Analytical Applications','Integration','Differential Equations','Applications of Integration','Parametric, Polar & Vectors','Series & Sequences'] },
  { id: 'statistics', name: 'AP Statistics', units: ['Exploring One-Variable Data','Exploring Two-Variable Data','Collecting Data','Probability','Sampling Distributions','Inference for Proportions','Inference for Means','Chi-Square Tests','Inference for Regression'] },
  { id: 'computer_science_a', name: 'AP Computer Science A', units: ['Primitive Types','Using Objects','Boolean Expressions & Conditionals','Iteration','Writing Classes','Array','ArrayList','2D Array','Inheritance','Recursion'] },
  { id: 'cs_principles', name: 'AP CS Principles', units: ['Creative Development','Data','Algorithms & Programming','Computer Systems & Networks','Impact of Computing'] },
  { id: 'us_history', name: 'AP US History', units: ['Period 1: 1491–1607','Period 2: 1607–1754','Period 3: 1754–1800','Period 4: 1800–1848','Period 5: 1844–1877','Period 6: 1865–1898','Period 7: 1890–1945','Period 8: 1945–1980','Period 9: 1980–Present'] },
  { id: 'world_history', name: 'AP World History', units: ['Global Tapestry','Networks of Exchange','Land-Based Empires','Transoceanic Interconnections','Revolutions','Consequences of Industrialization','Global Conflict','Cold War & Decolonization','Globalization'] },
  { id: 'european_history', name: 'AP European History', units: ['Renaissance & Exploration','Reformation','Absolutism & Constitutionalism','Scientific Revolution & Enlightenment','French Revolution & Napoleon','Industrialization','Nationalism & Imperialism','WWI & Interwar','WWII & Cold War Europe'] },
  { id: 'us_gov', name: 'AP US Government', units: ['Foundations of Democracy','Interactions Among Branches','Civil Liberties & Rights','American Political Ideologies','Political Participation'] },
  { id: 'comp_gov', name: 'AP Comparative Government', units: ['Political Systems, Regimes & Governments','Political Institutions','Political Culture & Participation','Party & Electoral Systems','Political & Economic Change','Public Policy'] },
  { id: 'macro', name: 'AP Macroeconomics', units: ['Basic Economic Concepts','Economic Indicators','Aggregate Demand & Supply','Financial Sector','Long-Run Consequences','Open Economy'] },
  { id: 'micro', name: 'AP Microeconomics', units: ['Basic Economic Concepts','Supply & Demand','Production, Cost & Perfect Competition','Imperfect Competition','Factor Markets','Market Failure & Government'] },
  { id: 'psychology', name: 'AP Psychology', units: ['Scientific Foundations','Biological Bases','Sensation & Perception','Learning','Cognitive Psychology','Developmental Psychology','Motivation & Emotion','Clinical Psychology','Social Psychology'] },
  { id: 'human_geo', name: 'AP Human Geography', units: ['Thinking Geographically','Population & Migration','Cultural Patterns','Political Organization','Agriculture & Rural Land Use','Cities & Urban Land Use','Industrial & Economic Development'] },
  { id: 'english_lang', name: 'AP English Language', units: ['Claims & Evidence','Rhetorical Situation','Argument','Style'] },
  { id: 'english_lit', name: 'AP English Literature', units: ['Short Fiction','Poetry','Longer Fiction & Drama'] },
  { id: 'art_history', name: 'AP Art History', units: ['Global Prehistory','Ancient Mediterranean','Early Europe & Colonial Americas','Later Europe & Americas','Indigenous Americas','Africa','West & South Asia','East Asia','Global Contemporary'] },
  { id: 'music_theory', name: 'AP Music Theory', units: ['Music Fundamentals','Scales & Keys','Intervals & Chords','Harmony & Voice Leading','Musical Form & Analysis'] },
  { id: 'spanish_lang', name: 'AP Spanish Language', units: ['Families & Communities','Science & Technology','Beauty & Aesthetics','Education & Careers','Identity & Social Issues','Environment & Geography'] },
  { id: 'french_lang', name: 'AP French Language', units: ['Personal & Public Identities','Families & Communities','Global Challenges','Science & Technology','Beauty & Aesthetics','Contemporary Life'] },
  { id: 'latin', name: 'AP Latin', units: ['Latin Literature: Caesar','Latin Literature: Vergil','Roman Culture & Society','Grammar & Syntax'] },
];

export default function APCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [unit, setUnit] = useState('');
  const [outputFormat, setOutputFormat] = useState('notes');
  const [generatedContent, setGeneratedContent] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [flippedCards, setFlippedCards] = useState(new Set());

  const selectedSubjectData = AP_SUBJECTS.find(s => s.id === subject);
  const unitOptions = selectedSubjectData?.units || [];

  const handleGenerate = async () => {
    if (!subject || !unit) {
      toast.error('Please select a subject and unit');
      return;
    }
    setLoading(true);
    setGeneratedContent(null);
    setFlashcards([]);
    setFlippedCards(new Set());

    try {
      const subjectName = selectedSubjectData?.name || subject;

      if (outputFormat === 'flashcards') {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert AP tutor. Generate 15 high-quality flashcards for ${subjectName}, Unit: "${unit}".

Each flashcard must:
- Front: A precise, testable question or key term (as it would appear on the AP exam)
- Back: A complete, accurate answer with the core concept clearly explained (2-4 sentences)
- Include important details: formulas, dates, names, processes as appropriate
- Cover the most important and commonly tested concepts from this unit

Generate cards that span easy recall, application, and analysis levels.`,
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
                  }
                }
              }
            }
          }
        });
        setFlashcards(result.flashcards || []);
      } else {
        const formatInstructions = outputFormat === 'notes'
          ? 'comprehensive structured study notes in markdown. Include: ## section headers, key terms in **bold**, formulas in code blocks, bullet lists for processes, numbered lists for steps, and a "Common Mistakes" section at the end.'
          : 'a thorough bullet-point summary. Use nested bullets for sub-concepts. Bold key vocabulary. Include formulas where relevant.';

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert AP tutor writing study materials for students aiming for a 5 on the AP exam.

Generate ${formatInstructions}

Subject: ${subjectName}
Unit: ${unit}

Requirements:
- Cover ALL major testable concepts in this unit thoroughly
- Include specific examples, diagrams described in text, and connections to other units
- Mention key scientists, theorists, events, or formulas by name
- Flag high-frequency AP exam topics with ⭐
- End with 3-5 "Key Takeaways" the student must remember
- Minimum 600 words of substantive content`,
          response_json_schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' }
            }
          }
        });
        setGeneratedContent(result);

        const user = await base44.auth.me();
        await base44.entities.StudyNote.create({
          user_email: user.email,
          exam_type: 'AP',
          subject_id: subject,
          title: `${subjectName} — ${unit}`,
          content: result.content,
        }).catch(() => {});
      }

      toast.success('Generated successfully!');
    } catch (error) {
      toast.error('Generation failed. Please try again.');
      console.error(error);
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
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate(createPageUrl('Dashboard'))} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="text-sm text-gray-400">AP Study Materials</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">AP Study Materials</h1>
          <p className="text-gray-500 text-sm mt-1">Generate detailed notes and flashcards for any AP subject and unit</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">

          {/* LEFT: Controls */}
          <div className="lg:sticky lg:top-6 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Generate Materials</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">AP Subject</label>
                  <Select value={subject} onValueChange={(v) => { setSubject(v); setUnit(''); }}>
                    <SelectTrigger className="bg-white border-gray-200 text-gray-900 text-sm">
                      <SelectValue placeholder="Select subject…" />
                    </SelectTrigger>
                    <SelectContent>
                      {AP_SUBJECTS.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Unit</label>
                  <Select value={unit} onValueChange={setUnit} disabled={!subject}>
                    <SelectTrigger className="bg-white border-gray-200 text-gray-900 text-sm">
                      <SelectValue placeholder={subject ? 'Select unit…' : 'Select subject first'} />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Format</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[['notes', '📄', 'Notes'], ['bullets', '•', 'Bullets'], ['flashcards', '🃏', 'Cards']].map(([val, icon, label]) => (
                      <button key={val} onClick={() => setOutputFormat(val)}
                        className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                          outputFormat === val ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                        }`}>
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={loading || !subject || !unit}
                  className="bg-blue-500 hover:bg-blue-600 text-white w-full rounded-lg shadow-sm"
                  size="default"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</>
                    : <><Sparkles className="w-4 h-4 mr-2" />Generate</>}
                </Button>
              </div>
            </div>

            {/* Info card */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 mb-1">💡 Tips</p>
              <ul className="text-xs text-blue-600 space-y-1 leading-relaxed">
                <li>• Notes = full markdown study guide</li>
                <li>• Bullets = scannable summary</li>
                <li>• Cards = flip-to-reveal flashcards</li>
                <li>• ⭐ marks high-frequency AP topics</li>
              </ul>
            </div>
          </div>

          {/* RIGHT: Output */}
          <div>
            {!generatedContent && flashcards.length === 0 && !loading && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-700 mb-2">Select a subject & unit</h3>
                <p className="text-sm text-gray-400 max-w-xs">Choose your AP subject and unit on the left, then generate detailed study notes or flashcards.</p>
              </div>
            )}

            {loading && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
                <p className="text-sm text-gray-500">Generating detailed {outputFormat === 'flashcards' ? 'flashcards' : 'notes'}…</p>
                <p className="text-xs text-gray-400 mt-1">This may take 10–20 seconds</p>
              </div>
            )}

            {/* Notes / Bullets output */}
            {generatedContent && !loading && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-semibold text-gray-800">{generatedContent.title || `${selectedSubjectData?.name} — ${unit}`}</h3>
                  </div>
                  <button onClick={() => setGeneratedContent(null)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>
                <div className="px-6 py-5 overflow-auto max-h-[70vh]">
                  <div className="prose prose-sm prose-slate max-w-none">
                    <ReactMarkdown>{generatedContent.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {/* Flashcards output */}
            {flashcards.length > 0 && !loading && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-semibold text-gray-800">{flashcards.length} Flashcards — {selectedSubjectData?.name}: {unit}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">Click a card to flip</span>
                    <button onClick={() => setFlashcards([])} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-auto">
                  {flashcards.map((card, idx) => {
                    const isFlipped = flippedCards.has(idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleFlip(idx)}
                        className={`text-left p-4 rounded-xl border-2 transition-all min-h-[100px] ${
                          isFlipped
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white border-gray-200 hover:border-blue-200 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className={`text-xs font-semibold uppercase tracking-wider ${isFlipped ? 'text-blue-500' : 'text-gray-400'}`}>
                            {isFlipped ? 'Answer' : 'Question'} {idx + 1}
                          </span>
                          {card.category && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{card.category}</span>
                          )}
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
          </div>
        </div>
      </div>
    </div>
  );
}