import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import APPracticeQuestion from '@/components/practice/APPracticeQuestion';
import { generateQuestionsOptimized, clearCache } from '@/components/generation/FastQuestionGenerator';

const AP_SUBJECTS = {
  'Sciences': [
    { id: 'biology', name: 'AP Biology', emoji: '🧬' },
    { id: 'chemistry', name: 'AP Chemistry', emoji: '⚗️' },
    { id: 'physics_1', name: 'AP Physics 1', emoji: '⚡' },
    { id: 'physics_2', name: 'AP Physics 2', emoji: '🔬' },
    { id: 'physics_c_mech', name: 'AP Physics C: Mech', emoji: '🚀' },
    { id: 'environmental_science', name: 'AP Environmental Science', emoji: '🌍' },
  ],
  'Math & CS': [
    { id: 'calc_ab', name: 'AP Calculus AB', emoji: '∫' },
    { id: 'calc_bc', name: 'AP Calculus BC', emoji: '∑' },
    { id: 'statistics', name: 'AP Statistics', emoji: '📊' },
    { id: 'computer_science_a', name: 'AP Computer Science A', emoji: '💻' },
  ],
  'History & Social Studies': [
    { id: 'us_history', name: 'AP US History', emoji: '🇺🇸' },
    { id: 'world_history', name: 'AP World History', emoji: '🌐' },
    { id: 'us_gov', name: 'AP US Government', emoji: '🏛️' },
    { id: 'human_geo', name: 'AP Human Geography', emoji: '🗺️' },
    { id: 'psychology', name: 'AP Psychology', emoji: '🧠' },
    { id: 'macro', name: 'AP Macroeconomics', emoji: '📈' },
    { id: 'micro', name: 'AP Microeconomics', emoji: '💰' },
  ],
  'English': [
    { id: 'english_lang', name: 'AP English Language', emoji: '✍️' },
    { id: 'english_lit', name: 'AP English Literature', emoji: '📚' },
  ],
};

const UNITS_BY_SUBJECT = {
  biology: [
    { id: 'unit1', name: 'Chemistry of Life', emoji: '⚗️', keywords: ['macromolecules', 'water', 'pH', 'bonds'] },
    { id: 'unit2', name: 'Cell Structure & Function', emoji: '🔬', keywords: ['organelles', 'membrane', 'transport'] },
    { id: 'unit3', name: 'Cellular Energetics', emoji: '⚡', keywords: ['photosynthesis', 'respiration', 'ATP'] },
    { id: 'unit4', name: 'Cell Communication', emoji: '📡', keywords: ['signal transduction', 'receptors', 'feedback'] },
    { id: 'unit5', name: 'Heredity', emoji: '🧬', keywords: ['meiosis', 'Mendel', 'genetics', 'chromosomes'] },
    { id: 'unit6', name: 'Gene Expression', emoji: '🔑', keywords: ['DNA replication', 'transcription', 'translation'] },
    { id: 'unit7', name: 'Natural Selection', emoji: '🦎', keywords: ['evolution', 'Hardy-Weinberg', 'selection'] },
    { id: 'unit8', name: 'Ecology', emoji: '🌿', keywords: ['populations', 'communities', 'ecosystems', 'energy flow'] },
  ],
  chemistry: [
    { id: 'unit1', name: 'Atomic Structure', emoji: '⚛️', keywords: ['electrons', 'orbitals', 'periodic trends'] },
    { id: 'unit2', name: 'Molecular & Ionic Compounds', emoji: '🔗', keywords: ['bonding', 'Lewis structures', 'VSEPR'] },
    { id: 'unit3', name: 'Intermolecular Forces', emoji: '🤝', keywords: ['IMF', 'properties of solids/liquids'] },
    { id: 'unit4', name: 'Chemical Reactions', emoji: '🔥', keywords: ['stoichiometry', 'reaction types', 'net ionic'] },
    { id: 'unit5', name: 'Kinetics', emoji: '⏱️', keywords: ['rate laws', 'activation energy', 'mechanisms'] },
    { id: 'unit6', name: 'Thermodynamics', emoji: '🌡️', keywords: ['enthalpy', 'entropy', 'Gibbs free energy'] },
    { id: 'unit7', name: 'Equilibrium', emoji: '⚖️', keywords: ['Keq', 'Le Chatelier', 'ICE tables'] },
    { id: 'unit8', name: 'Acids & Bases', emoji: '🧪', keywords: ['pH', 'Ka/Kb', 'buffers', 'titration'] },
    { id: 'unit9', name: 'Electrochemistry', emoji: '⚡', keywords: ['galvanic cells', 'electrolysis', 'Nernst'] },
  ],
  calc_ab: [
    { id: 'unit1', name: 'Limits & Continuity', emoji: '→', keywords: ['limits', 'continuity', 'asymptotes'] },
    { id: 'unit2', name: 'Differentiation: Definition', emoji: "f'", keywords: ['derivative definition', 'differentiability'] },
    { id: 'unit3', name: 'Differentiation: Rules', emoji: '∂', keywords: ['chain rule', 'product rule', 'implicit'] },
    { id: 'unit4', name: 'Contextual Applications', emoji: '📐', keywords: ['related rates', 'linearization', 'motion'] },
    { id: 'unit5', name: 'Analytical Applications', emoji: '📉', keywords: ['MVT', 'critical points', 'optimization'] },
    { id: 'unit6', name: 'Integration & Accumulation', emoji: '∫', keywords: ['antiderivatives', 'FTC', 'Riemann sums'] },
    { id: 'unit7', name: 'Differential Equations', emoji: 'dy/dx', keywords: ['slope fields', 'separation of variables'] },
    { id: 'unit8', name: 'Applications of Integration', emoji: '📊', keywords: ['area', 'volume', 'accumulation'] },
  ],
  us_history: [
    { id: 'unit1', name: 'Period 1: 1491–1607', emoji: '🌿', keywords: ['Native Americans', 'Columbus', 'Columbian Exchange'] },
    { id: 'unit2', name: 'Period 2: 1607–1754', emoji: '⛵', keywords: ['colonization', 'Chesapeake', 'New England'] },
    { id: 'unit3', name: 'Period 3: 1754–1800', emoji: '🦅', keywords: ['Revolution', 'Constitution', 'new nation'] },
    { id: 'unit4', name: 'Period 4: 1800–1848', emoji: '🌾', keywords: ['Jacksonian democracy', 'market revolution', 'reform'] },
    { id: 'unit5', name: 'Period 5: 1844–1877', emoji: '⚔️', keywords: ['Civil War', 'slavery', 'Reconstruction'] },
    { id: 'unit6', name: 'Period 6: 1865–1898', emoji: '🏭', keywords: ['industrialization', 'Gilded Age', 'immigration'] },
    { id: 'unit7', name: 'Period 7: 1890–1945', emoji: '🌍', keywords: ['Progressive Era', 'WWI', 'New Deal', 'WWII'] },
    { id: 'unit8', name: 'Period 8: 1945–1980', emoji: '☢️', keywords: ['Cold War', 'Civil Rights', 'Vietnam'] },
    { id: 'unit9', name: 'Period 9: 1980–Present', emoji: '💻', keywords: ['Reagan', 'globalization', 'post-Cold War'] },
  ],
  statistics: [
    { id: 'unit1', name: 'Exploring One-Variable Data', emoji: '📊', keywords: ['distributions', 'mean', 'median', 'spread'] },
    { id: 'unit2', name: 'Exploring Two-Variable Data', emoji: '📈', keywords: ['scatterplots', 'correlation', 'regression'] },
    { id: 'unit3', name: 'Collecting Data', emoji: '📋', keywords: ['sampling', 'experiments', 'bias'] },
    { id: 'unit4', name: 'Probability', emoji: '🎲', keywords: ['probability rules', 'conditional', 'independence'] },
    { id: 'unit5', name: 'Sampling Distributions', emoji: '🔔', keywords: ['CLT', 'sampling variability'] },
    { id: 'unit6', name: 'Inference for Proportions', emoji: '🔍', keywords: ['z-tests', 'confidence intervals', 'p-value'] },
    { id: 'unit7', name: 'Inference for Means', emoji: '🎯', keywords: ['t-tests', 'paired data'] },
    { id: 'unit8', name: 'Chi-Square Tests', emoji: '✂️', keywords: ['goodness of fit', 'independence', 'homogeneity'] },
    { id: 'unit9', name: 'Inference for Regression', emoji: '📉', keywords: ['slope inference', 'prediction intervals'] },
  ],
  psychology: [
    { id: 'unit1', name: 'Scientific Foundations', emoji: '🔬', keywords: ['research methods', 'statistics', 'history'] },
    { id: 'unit2', name: 'Biological Bases', emoji: '🧠', keywords: ['neurons', 'brain structures', 'neurotransmitters'] },
    { id: 'unit3', name: 'Sensation & Perception', emoji: '👁️', keywords: ['sensory processing', 'perceptual organization'] },
    { id: 'unit4', name: 'Learning', emoji: '📚', keywords: ['classical conditioning', 'operant conditioning', 'observational'] },
    { id: 'unit5', name: 'Cognitive Psychology', emoji: '💭', keywords: ['memory', 'thinking', 'language', 'problem solving'] },
    { id: 'unit6', name: 'Developmental Psychology', emoji: '👶', keywords: ['Piaget', 'Erikson', 'attachment'] },
    { id: 'unit7', name: 'Motivation & Emotion', emoji: '❤️', keywords: ['theories of motivation', 'emotional theories'] },
    { id: 'unit8', name: 'Clinical Psychology', emoji: '🏥', keywords: ['disorders', 'DSM', 'therapies'] },
    { id: 'unit9', name: 'Social Psychology', emoji: '👥', keywords: ['conformity', 'obedience', 'attribution', 'attitudes'] },
  ],
  human_geo: [
    { id: 'unit1', name: 'Thinking Geographically', emoji: '🗺️', keywords: ['maps', 'scale', 'spatial concepts'] },
    { id: 'unit2', name: 'Population & Migration', emoji: '👥', keywords: ['demographic transition', 'migration push/pull'] },
    { id: 'unit3', name: 'Cultural Patterns', emoji: '🎭', keywords: ['culture diffusion', 'language', 'religion'] },
    { id: 'unit4', name: 'Political Organization', emoji: '🏛️', keywords: ['state sovereignty', 'borders', 'supranationalism'] },
    { id: 'unit5', name: 'Agriculture & Rural Land Use', emoji: '🌾', keywords: ['von Thünen', 'Green Revolution'] },
    { id: 'unit6', name: 'Cities & Urban Land Use', emoji: '🏙️', keywords: ['Burgess', 'gentrification', 'urban models'] },
    { id: 'unit7', name: 'Industrial & Economic Dev.', emoji: '🏭', keywords: ['Weber', 'development models', 'globalization'] },
  ],
  macro: [
    { id: 'unit1', name: 'Basic Economic Concepts', emoji: '💡', keywords: ['scarcity', 'opportunity cost', 'PPF', 'comparative advantage'] },
    { id: 'unit2', name: 'Economic Indicators', emoji: '📊', keywords: ['GDP', 'unemployment', 'inflation', 'CPI'] },
    { id: 'unit3', name: 'Aggregate Demand & Supply', emoji: '📈', keywords: ['AD', 'SRAS', 'LRAS', 'macroequilibrium'] },
    { id: 'unit4', name: 'Financial Sector', emoji: '🏦', keywords: ['money supply', 'banking', 'Federal Reserve', 'monetary policy'] },
    { id: 'unit5', name: 'Long-Run Consequences', emoji: '⏳', keywords: ['Phillips curve', 'stagflation', 'crowding out'] },
    { id: 'unit6', name: 'Open Economy', emoji: '🌐', keywords: ['trade', 'exchange rates', 'balance of payments'] },
  ],
  english_lang: [
    { id: 'unit1', name: 'Claims & Evidence', emoji: '📝', keywords: ['claim', 'evidence', 'reasoning', 'sources'] },
    { id: 'unit2', name: 'Rhetorical Situation', emoji: '🎤', keywords: ['speaker', 'audience', 'purpose', 'context', 'exigence'] },
    { id: 'unit3', name: 'Argument', emoji: '⚖️', keywords: ['line of reasoning', 'counterargument', 'concession', 'rebuttal'] },
    { id: 'unit4', name: 'Style', emoji: '✒️', keywords: ['diction', 'syntax', 'tone', 'figurative language'] },
  ],
  world_history: [
    { id: 'unit1', name: 'Global Tapestry', emoji: '🌍', keywords: ['Han China', 'Dar al-Islam', 'Byzantine', 'Medieval Europe'] },
    { id: 'unit2', name: 'Networks of Exchange', emoji: '🛣️', keywords: ['Silk Roads', 'Indian Ocean', 'trans-Saharan'] },
    { id: 'unit3', name: 'Land-Based Empires', emoji: '🏰', keywords: ['Mongols', 'Ottomans', 'Mughals', 'Ming'] },
    { id: 'unit4', name: 'Transoceanic Interconnections', emoji: '⛵', keywords: ['Columbian Exchange', 'Atlantic trade', 'technology'] },
    { id: 'unit5', name: 'Revolutions', emoji: '🔥', keywords: ['Enlightenment', 'American/French Revolutions', 'Industrial Revolution'] },
    { id: 'unit6', name: 'Consequences of Industrialization', emoji: '🏭', keywords: ['imperialism', 'migration', 'nationalism'] },
    { id: 'unit7', name: 'Global Conflict', emoji: '⚔️', keywords: ['WWI', 'WWII', 'Cold War', 'decolonization'] },
    { id: 'unit8', name: 'Cold War & Decolonization', emoji: '☢️', keywords: ['Cold War', 'proxy wars', 'independence movements'] },
    { id: 'unit9', name: 'Globalization', emoji: '🌐', keywords: ['technology', 'economics', 'culture', 'environment'] },
  ],
  us_gov: [
    { id: 'unit1', name: 'Foundations of Democracy', emoji: '📜', keywords: ['Constitution', 'Federalist Papers', 'separation of powers'] },
    { id: 'unit2', name: 'Interactions Among Branches', emoji: '⚖️', keywords: ['checks and balances', 'Congress', 'presidency', 'courts'] },
    { id: 'unit3', name: 'Civil Liberties & Rights', emoji: '🗽', keywords: ['Bill of Rights', 'due process', 'equal protection'] },
    { id: 'unit4', name: 'American Political Ideologies', emoji: '🗳️', keywords: ['political ideology', 'public opinion', 'polling'] },
    { id: 'unit5', name: 'Political Participation', emoji: '🏛️', keywords: ['voting', 'elections', 'parties', 'interest groups'] },
  ],
  physics_1: [
    { id: 'unit1', name: 'Kinematics', emoji: '🚗', keywords: ['displacement', 'velocity', 'acceleration', 'projectile'] },
    { id: 'unit2', name: "Newton's Laws", emoji: '⚖️', keywords: ['forces', 'free body diagrams', 'friction', 'Newton'] },
    { id: 'unit3', name: 'Work, Energy & Power', emoji: '⚡', keywords: ['work-energy theorem', 'conservation of energy', 'power'] },
    { id: 'unit4', name: 'Systems & Momentum', emoji: '💥', keywords: ['momentum', 'impulse', 'collisions', 'conservation'] },
    { id: 'unit5', name: 'Rotation', emoji: '🌀', keywords: ['torque', 'angular momentum', 'rotational kinematics'] },
    { id: 'unit6', name: 'Oscillations', emoji: '🎵', keywords: ['SHM', 'springs', 'pendulum', 'period'] },
    { id: 'unit7', name: 'Waves & Sound', emoji: '🔊', keywords: ['wave properties', 'interference', 'Doppler', 'standing waves'] },
  ],
  calc_bc: [
    { id: 'unit1', name: 'Limits & Continuity', emoji: '→', keywords: ['limits', 'continuity', 'asymptotes'] },
    { id: 'unit2', name: 'Differentiation: Definition', emoji: "f'", keywords: ['derivative definition', 'differentiability'] },
    { id: 'unit3', name: 'Differentiation: Rules', emoji: '∂', keywords: ['chain rule', 'product rule', 'implicit'] },
    { id: 'unit4', name: 'Contextual Applications', emoji: '📐', keywords: ['related rates', 'linearization', 'motion'] },
    { id: 'unit5', name: 'Analytical Applications', emoji: '📉', keywords: ['MVT', 'critical points', 'optimization'] },
    { id: 'unit6', name: 'Integration & Accumulation', emoji: '∫', keywords: ['antiderivatives', 'FTC', 'techniques'] },
    { id: 'unit7', name: 'Differential Equations', emoji: 'dy/dx', keywords: ['slope fields', 'Euler', 'logistic'] },
    { id: 'unit8', name: 'Applications of Integration', emoji: '📊', keywords: ['area', 'volume', 'arc length'] },
    { id: 'unit9', name: 'Parametric, Polar & Vectors', emoji: '🎯', keywords: ['parametric', 'polar coordinates', 'vectors'] },
    { id: 'unit10', name: 'Series & Sequences', emoji: '∞', keywords: ['Taylor series', 'convergence', 'Maclaurin'] },
  ],
  english_lit: [
    { id: 'unit1', name: 'Short Fiction', emoji: '📖', keywords: ['character', 'setting', 'plot', 'conflict', 'theme'] },
    { id: 'unit2', name: 'Poetry', emoji: '🎭', keywords: ['speaker', 'imagery', 'tone', 'structure', 'sound devices'] },
    { id: 'unit3', name: 'Longer Fiction & Drama', emoji: '🎬', keywords: ['character development', 'motif', 'allegory', 'symbolism'] },
  ],
  computer_science_a: [
    { id: 'unit1', name: 'Primitive Types', emoji: '🔢', keywords: ['int', 'double', 'boolean', 'casting', 'operators'] },
    { id: 'unit2', name: 'Using Objects', emoji: '📦', keywords: ['classes', 'methods', 'String', 'Math', 'wrapper classes'] },
    { id: 'unit3', name: 'Boolean Expressions & Conditionals', emoji: '🔀', keywords: ['if-else', 'switch', 'logical operators'] },
    { id: 'unit4', name: 'Iteration', emoji: '🔁', keywords: ['while', 'for', 'nested loops', 'traversal'] },
    { id: 'unit5', name: 'Writing Classes', emoji: '🏗️', keywords: ['constructors', 'encapsulation', 'static', 'scope'] },
    { id: 'unit6', name: 'Array', emoji: '📋', keywords: ['array creation', 'traversal', 'algorithms'] },
    { id: 'unit7', name: 'ArrayList', emoji: '📝', keywords: ['ArrayList methods', 'generics', 'traversal'] },
    { id: 'unit8', name: '2D Array', emoji: '🗂️', keywords: ['2D traversal', 'row-column', 'nested loops'] },
    { id: 'unit9', name: 'Inheritance', emoji: '🧬', keywords: ['extends', 'super', 'polymorphism', 'overriding'] },
    { id: 'unit10', name: 'Recursion', emoji: '🌀', keywords: ['base case', 'recursive case', 'call stack'] },
  ],
  micro: [
    { id: 'unit1', name: 'Basic Economic Concepts', emoji: '💡', keywords: ['scarcity', 'opportunity cost', 'PPF', 'gains from trade'] },
    { id: 'unit2', name: 'Supply & Demand', emoji: '📊', keywords: ['market equilibrium', 'elasticity', 'surplus', 'shortage'] },
    { id: 'unit3', name: 'Production, Cost & Perfect Competition', emoji: '🏭', keywords: ['TC', 'MC', 'ATC', 'profit maximization'] },
    { id: 'unit4', name: 'Imperfect Competition', emoji: '🏆', keywords: ['monopoly', 'oligopoly', 'monopolistic competition'] },
    { id: 'unit5', name: 'Factor Markets', emoji: '👷', keywords: ['labor market', 'MRC', 'MRP', 'wages'] },
    { id: 'unit6', name: 'Market Failure & Government', emoji: '⚖️', keywords: ['externalities', 'public goods', 'Gini coefficient'] },
  ],
  environmental_science: [
    { id: 'unit1', name: 'The Living World: Ecosystems', emoji: '🌿', keywords: ['food webs', 'energy flow', 'biogeochemical cycles'] },
    { id: 'unit2', name: 'The Living World: Biodiversity', emoji: '🦋', keywords: ['ecosystem services', 'island biogeography', 'keystone species'] },
    { id: 'unit3', name: 'Populations', emoji: '📈', keywords: ['population growth', 'carrying capacity', 'survivorship curves'] },
    { id: 'unit4', name: 'Earth Systems', emoji: '🌍', keywords: ['plate tectonics', 'soil', 'atmosphere', 'freshwater'] },
    { id: 'unit5', name: 'Land & Water Use', emoji: '🚜', keywords: ['agriculture', 'deforestation', 'fishing', 'urban sprawl'] },
    { id: 'unit6', name: 'Energy Resources', emoji: '⚡', keywords: ['fossil fuels', 'renewable energy', 'nuclear', 'EROI'] },
    { id: 'unit7', name: 'Atmospheric Pollution', emoji: '💨', keywords: ['air quality', 'photochemical smog', 'ozone depletion'] },
    { id: 'unit8', name: 'Aquatic & Terrestrial Pollution', emoji: '🌊', keywords: ['water pollution', 'eutrophication', 'solid waste'] },
    { id: 'unit9', name: 'Global Change', emoji: '🌡️', keywords: ['climate change', 'greenhouse gases', 'sea level rise'] },
  ],
  physics_2: [
    { id: 'unit1', name: 'Fluids', emoji: '💧', keywords: ['pressure', 'buoyancy', 'continuity', 'Bernoulli'] },
    { id: 'unit2', name: 'Thermodynamics', emoji: '🌡️', keywords: ['heat', 'temperature', 'entropy', 'ideal gas'] },
    { id: 'unit3', name: 'Electric Force & Field', emoji: '⚡', keywords: ["Coulomb's law", 'electric field', 'Gauss'] },
    { id: 'unit4', name: 'Electric Potential', emoji: '🔋', keywords: ['voltage', 'potential energy', 'capacitors'] },
    { id: 'unit5', name: 'Magnetism', emoji: '🧲', keywords: ['magnetic force', 'Ampere', 'Faraday', 'induction'] },
    { id: 'unit6', name: 'Geometric & Physical Optics', emoji: '🔭', keywords: ['reflection', 'refraction', 'diffraction', 'interference'] },
    { id: 'unit7', name: 'Quantum & Nuclear Physics', emoji: '⚛️', keywords: ['photoelectric', 'wave-particle', 'nuclear reactions'] },
  ],
  physics_c_mech: [
    { id: 'unit1', name: 'Kinematics', emoji: '🚗', keywords: ['vectors', 'calculus kinematics', 'projectile'] },
    { id: 'unit2', name: "Newton's Laws", emoji: '⚖️', keywords: ['net force', 'variable forces', 'friction'] },
    { id: 'unit3', name: 'Work, Energy & Power', emoji: '⚡', keywords: ['work integral', 'energy conservation', 'power'] },
    { id: 'unit4', name: 'Systems & Momentum', emoji: '💥', keywords: ['impulse-momentum', 'collisions', 'center of mass'] },
    { id: 'unit5', name: 'Rotation', emoji: '🌀', keywords: ['moment of inertia', 'angular momentum', 'rolling'] },
    { id: 'unit6', name: 'Oscillations', emoji: '🎵', keywords: ['SHM', 'energy in SHM', 'damping'] },
    { id: 'unit7', name: 'Gravitation', emoji: '🌍', keywords: ["Newton's law of gravity", 'orbital mechanics', 'Kepler'] },
  ],
};

const QUESTION_COUNTS = [5, 10, 15, 20, 25, 30];

export default function APPractice() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=subject, 2=unit, 3=practice
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const units = selectedSubject ? (UNITS_BY_SUBJECT[selectedSubject.id] || []) : [];

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    setSelectedUnit(null);
    setStep(2);
  };

  const handleStartPractice = async () => {
    if (!selectedUnit) return;
    setLoading(true);
    await clearCache(true);
    const qs = await generateQuestionsOptimized({
      examType: 'AP',
      subjectId: selectedSubject.id,
      unitId: selectedUnit.id,
      difficulty: 'mixed',
      count: questionCount,
      mode: 'practice',
      forceRefresh: true,
    });
    const mapped = qs.slice(0, questionCount).map(q => ({
      ...q,
      subject_name: selectedSubject.name,
      unit_name: selectedUnit.name,
      answer_choices: [q.choice_a, q.choice_b, q.choice_c, q.choice_d],
    }));
    setQuestions(mapped);
    setCurrentIndex(0);
    setScore(0);
    setStep(3);
    setLoading(false);
  };

  const handleNext = (wasCorrect) => {
    if (wasCorrect) setScore(s => s + 1);
    setCurrentIndex(i => i + 1);
  };

  const handleComplete = (wasCorrect) => {
    const finalScore = score + (wasCorrect ? 1 : 0);
    setScore(finalScore);
    setStep(4);
  };

  // Step 4: Results
  if (step === 4) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <ProtectedRoute>
        <DashboardNavbar />
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center max-w-md w-full">
            <div className="text-5xl mb-4">{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📚'}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Practice Complete!</h2>
            <p className="text-gray-500 mb-6">{selectedSubject?.name} — {selectedUnit?.name}</p>
            <div className="text-5xl font-bold text-blue-500 mb-2">{pct}%</div>
            <p className="text-gray-500 mb-8">{score} / {questions.length} correct</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => { setStep(2); setSelectedUnit(null); }}>
                Change Unit
              </Button>
              <Button className="bg-blue-500 hover:bg-blue-600" onClick={() => { setStep(1); setSelectedSubject(null); }}>
                New Subject
              </Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Step 3: Practice
  if (step === 3 && questions.length > 0) {
    return (
      <ProtectedRoute>
        <DashboardNavbar />
        <div className="min-h-screen bg-[#f8fafc] p-6">
          <div className="max-w-5xl mx-auto">
            <button onClick={() => setStep(2)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
              <ArrowLeft className="w-4 h-4" /> Back to unit selection
            </button>
            <APPracticeQuestion
              question={questions[currentIndex]}
              questionIndex={currentIndex}
              totalQuestions={questions.length}
              onNext={handleNext}
              onComplete={handleComplete}
            />
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
            {step === 1 && <span className="text-gray-700 font-medium">AP Practice</span>}
            {step >= 2 && (
              <>
                <button onClick={() => setStep(1)} className="hover:text-gray-600">AP Practice</button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-700 font-medium">{selectedSubject?.name}</span>
              </>
            )}
          </div>

          {/* Step 1: Subject selection */}
          {step === 1 && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">AP Practice</h1>
                <p className="text-gray-500">Select a subject to start practicing</p>
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

          {/* Step 2: Unit selection */}
          {step === 2 && (
            <>
              <button onClick={() => setStep(1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to subjects
              </button>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedSubject?.emoji} {selectedSubject?.name}</h1>
                <p className="text-gray-500">Choose a unit to practice</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
                {units.map(unit => (
                  <button
                    key={unit.id}
                    onClick={() => setSelectedUnit(unit)}
                    className={`border rounded-xl p-4 text-left transition-all ${
                      selectedUnit?.id === unit.id
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="text-xl mb-1">{unit.emoji}</div>
                    <div className={`text-sm font-semibold leading-tight ${selectedUnit?.id === unit.id ? 'text-blue-700' : 'text-gray-800'}`}>
                      {unit.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 truncate">{unit.keywords.slice(0, 3).join(' · ')}</div>
                  </button>
                ))}
              </div>

              {selectedUnit && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Number of Questions</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {QUESTION_COUNTS.map(n => (
                      <button
                        key={n}
                        onClick={() => setQuestionCount(n)}
                        className={`w-14 h-10 rounded-lg text-sm font-semibold transition-all ${
                          questionCount === n
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <Button
                    onClick={handleStartPractice}
                    disabled={loading}
                    className="bg-blue-500 hover:bg-blue-600 w-full"
                    size="lg"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Questions…</>
                    ) : (
                      <><BookOpen className="w-4 h-4 mr-2" /> Start {questionCount} Questions</>
                    )}
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