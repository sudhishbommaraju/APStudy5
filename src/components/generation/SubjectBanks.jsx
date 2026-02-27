/**
 * PHASE 1 & 3: SUBJECT BANK STRUCTURE
 * Each subject has dedicated prompts, validation, and memory
 */

// PHASE 3: Map APPractice subject IDs → bank keys
export const SUBJECT_ID_MAP = {
  'biology':          'Biology',
  'human_geo':        'Human Geography',
  'us_history':       'US History',
  'chemistry':        'Chemistry',
  'calc_ab':          'Calculus',
  'calc_bc':          'Calculus',
  'world_history':    'World History',
  'european_history': 'European History',
  'us_gov':           'US Government',
  'macro':            'Economics',
  'micro':            'Economics',
  'statistics':       'Statistics',
  'psychology':       'Psychology',
  'english_lang':     'English',
  'english_lit':      'English',
  'physics_1':        'Physics',
  'physics_2':        'Physics',
  'physics_c_mech':   'Physics',
  'physics_c_em':     'Physics',
  'environmental_science': 'Environmental Science',
  'cs_a':             'Computer Science',
  'cs_principles':    'Computer Science',
};

// PHASE 4: Cross-subject contamination filters
// These terms must NOT appear in the named subject's questions
export const CROSS_SUBJECT_FILTERS = {
  'Human Geography': ['cell', 'organelle', 'DNA', 'enzyme', 'ribosome', 'mitochondria', 'photosynthesis', 'chromosome', 'allele', 'protein synthesis'],
  'Biology':         ['urban', 'migration rate', 'demographic', 'New Deal', 'geopolitical', 'urbanization', 'surplus value', 'colonialism'],
  'US History':      ['cell membrane', 'photosynthesis', 'enzyme', 'DNA replication', 'ribosome'],
  'Calculus':        ['cell', 'organism', 'urban', 'migration', 'New Deal', 'election'],
  'Chemistry':       ['urban', 'migration', 'demographic', 'election', 'civil war'],
};

export const SUBJECT_BANKS = {
  'Biology': {
    name: 'AP Biology',
    units: [
      { id: 1, name: 'Chemistry of Life', keywords: ['water', 'carbon', 'macromolecule', 'polymer', 'monomer', 'carbohydrate', 'lipid', 'protein', 'nucleic acid'] },
      { id: 2, name: 'Cell Structure', keywords: ['membrane', 'organelle', 'nucleus', 'mitochondria', 'chloroplast', 'ribosome', 'ER', 'Golgi', 'cell wall'] },
      { id: 3, name: 'Cellular Energetics', keywords: ['ATP', 'photosynthesis', 'respiration', 'glycolysis', 'Krebs', 'electron transport', 'fermentation', 'energy'] },
      { id: 4, name: 'Cell Communication', keywords: ['signal', 'receptor', 'ligand', 'transduction', 'response', 'hormone', 'feedback', 'cell cycle', 'apoptosis'] },
      { id: 5, name: 'Heredity', keywords: ['allele', 'genotype', 'phenotype', 'inheritance', 'Punnett', 'chromosome', 'meiosis', 'linkage', 'crossing over'] },
      { id: 6, name: 'Gene Expression', keywords: ['DNA', 'RNA', 'transcription', 'translation', 'gene', 'mutation', 'regulation', 'operon', 'epigenetic'] },
      { id: 7, name: 'Natural Selection', keywords: ['evolution', 'adaptation', 'fitness', 'natural selection', 'variation', 'speciation', 'phylogeny', 'ancestry'] },
      { id: 8, name: 'Ecology', keywords: ['ecosystem', 'population', 'community', 'biodiversity', 'energy flow', 'nutrient cycle', 'biome', 'climate'] }
    ],
    systemPrompt: (unit, count) => `You are generating STRICTLY AP Biology questions for Unit ${unit.id}: ${unit.name}.

UNIT SCOPE: You must ONLY generate questions from this specific unit.
Content must relate to: ${unit.keywords.join(', ')}.

MANDATORY STRUCTURE:
- Stimulus: 2-4 sentences with biological context, data, or experimental scenario
- Application-based question (NOT definition recall)
- 4 plausible distractors based on common misconceptions
- Must test application, analysis, or synthesis

FORBIDDEN:
- "What is the definition of..."
- Pure vocabulary recall
- Content from other AP Biology units
- Content from other subjects

Generate ${count} questions in JSON format:
{"questions":[{"stimulus":"context","question":"prompt","options":["A","B","C","D"],"correctIndex":0}]}`
  },

  'Human Geography': {
    name: 'AP Human Geography',
    units: [
      { id: 1, name: 'Thinking Geographically', keywords: ['map', 'scale', 'spatial', 'region', 'pattern', 'distribution', 'data', 'geographic'] },
      { id: 2, name: 'Population', keywords: ['population', 'demographic', 'birth rate', 'death rate', 'migration', 'density', 'pyramid', 'transition'] },
      { id: 3, name: 'Cultural Patterns', keywords: ['culture', 'language', 'religion', 'ethnicity', 'diffusion', 'acculturation', 'assimilation'] },
      { id: 4, name: 'Political Geography', keywords: ['state', 'nation', 'sovereignty', 'border', 'territory', 'geopolitical', 'federal', 'unitary'] },
      { id: 5, name: 'Agriculture', keywords: ['agriculture', 'farming', 'subsistence', 'commercial', 'green revolution', 'crop', 'livestock'] },
      { id: 6, name: 'Industrialization', keywords: ['industry', 'manufacturing', 'economic development', 'sector', 'industrialization', 'factory'] },
      { id: 7, name: 'Cities and Urban', keywords: ['urban', 'city', 'urbanization', 'suburb', 'metropolitan', 'gentrification', 'sprawl', 'infrastructure'] }
    ],
    systemPrompt: (unit, count) => `You are generating STRICTLY AP Human Geography questions for Unit ${unit.id}: ${unit.name}.

UNIT SCOPE: You must ONLY generate questions from this specific unit.
Content must relate to: ${unit.keywords.join(', ')}.

MANDATORY STRUCTURE:
- Stimulus: 2-4 sentences with geographic context, data, maps, or case study
- Application-based question requiring spatial analysis
- 4 plausible distractors
- Must test geographic thinking and patterns

FORBIDDEN:
- Biology, history, or science content
- Pure definition recall
- Content from other HuG units

Generate ${count} questions in JSON format:
{"questions":[{"stimulus":"context","question":"prompt","options":["A","B","C","D"],"correctIndex":0}]}`
  },

  'US History': {
    name: 'AP US History',
    units: [
      { id: 1, name: 'Colonial Period', keywords: ['colonial', 'colony', 'settlement', 'Native American', 'British', 'plantation', 'mercantilism'] },
      { id: 2, name: 'Revolutionary Era', keywords: ['revolution', 'independence', 'Constitution', 'founding', 'Jefferson', 'Washington', 'federalist'] },
      { id: 3, name: 'Early Republic', keywords: ['republic', 'Madison', 'Monroe', 'expansion', 'War of 1812', 'nationalism'] },
      { id: 4, name: 'Antebellum', keywords: ['antebellum', 'slavery', 'abolition', 'sectionalism', 'reform', 'Jackson', 'manifest destiny'] },
      { id: 5, name: 'Civil War', keywords: ['Civil War', 'Lincoln', 'Confederate', 'Union', 'emancipation', 'reconstruction'] },
      { id: 6, name: 'Gilded Age', keywords: ['industrialization', 'railroad', 'immigration', 'urbanization', 'labor', 'trust', 'Gilded Age'] },
      { id: 7, name: 'Progressive Era', keywords: ['progressive', 'reform', 'Roosevelt', 'regulation', 'suffrage', 'muckraker'] },
      { id: 8, name: 'World Wars', keywords: ['World War', 'WWI', 'WWII', 'Great Depression', 'New Deal', 'Pearl Harbor'] },
      { id: 9, name: 'Postwar America', keywords: ['Cold War', 'civil rights', 'Vietnam', 'Great Society', 'Reagan', 'conservative'] }
    ],
    systemPrompt: (unit, count) => `You are generating STRICTLY AP US History questions for Unit ${unit.id}: ${unit.name}.

UNIT SCOPE: You must ONLY generate questions from this specific unit.
Content must relate to: ${unit.keywords.join(', ')}.

MANDATORY STRUCTURE:
- Stimulus: 2-4 sentences with historical context, primary source, or event description
- Application-based question requiring historical analysis
- 4 plausible distractors
- Must test causation, continuity, or contextualization

FORBIDDEN:
- Biology, geography, or science content
- Pure fact recall
- Content from other APUSH units

Generate ${count} questions in JSON format:
{"questions":[{"stimulus":"context","question":"prompt","options":["A","B","C","D"],"correctIndex":0}]}`
  },

  'Chemistry': {
    name: 'AP Chemistry',
    units: [
      { id: 1, name: 'Atomic Structure', keywords: ['atom', 'electron', 'proton', 'neutron', 'orbital', 'quantum', 'periodic', 'element'] },
      { id: 2, name: 'Bonding', keywords: ['bond', 'covalent', 'ionic', 'metallic', 'Lewis', 'VSEPR', 'molecular geometry'] },
      { id: 3, name: 'States of Matter', keywords: ['gas', 'liquid', 'solid', 'phase', 'pressure', 'kinetic', 'IMF', 'intermolecular'] },
      { id: 4, name: 'Reactions', keywords: ['reaction', 'stoichiometry', 'limiting', 'yield', 'equation', 'mole', 'oxidation', 'reduction'] },
      { id: 5, name: 'Kinetics', keywords: ['rate', 'kinetics', 'collision', 'activation energy', 'catalyst', 'mechanism'] },
      { id: 6, name: 'Thermodynamics', keywords: ['energy', 'enthalpy', 'entropy', 'Gibbs', 'spontaneous', 'heat', 'thermodynamic'] },
      { id: 7, name: 'Equilibrium', keywords: ['equilibrium', 'Le Chatelier', 'Kc', 'Kp', 'concentration', 'shift'] },
      { id: 8, name: 'Acids and Bases', keywords: ['acid', 'base', 'pH', 'buffer', 'titration', 'neutralization', 'Ka', 'Kb'] },
      { id: 9, name: 'Applications', keywords: ['electrochemistry', 'cell', 'electrode', 'battery', 'electrolysis', 'corrosion'] }
    ],
    systemPrompt: (unit, count) => `You are generating STRICTLY AP Chemistry questions for Unit ${unit.id}: ${unit.name}.

UNIT SCOPE: You must ONLY generate questions from this specific unit.
Content must relate to: ${unit.keywords.join(', ')}.

MANDATORY STRUCTURE:
- Stimulus: 2-4 sentences with chemical context, data, or experimental setup
- Application-based calculation or conceptual question
- 4 plausible distractors
- Must test chemical reasoning

FORBIDDEN:
- Biology, history, or other subject content
- Pure memorization
- Content from other chemistry units

Generate ${count} questions in JSON format:
{"questions":[{"stimulus":"context","question":"prompt","options":["A","B","C","D"],"correctIndex":0}]}`
  },

  'Calculus': {
    name: 'AP Calculus AB',
    units: [
      { id: 1, name: 'Limits', keywords: ['limit', 'continuity', 'asymptote', 'approach', 'infinite'] },
      { id: 2, name: 'Derivatives', keywords: ['derivative', 'differentiation', 'rate', 'slope', 'tangent', 'chain rule', 'product rule'] },
      { id: 3, name: 'Applications of Derivatives', keywords: ['optimization', 'maximum', 'minimum', 'related rates', 'linearization', 'mean value'] },
      { id: 4, name: 'Integrals', keywords: ['integral', 'antiderivative', 'integration', 'Riemann', 'area', 'accumulation'] },
      { id: 5, name: 'Applications of Integrals', keywords: ['area', 'volume', 'average value', 'accumulation', 'fundamental theorem'] }
    ],
    systemPrompt: (unit, count) => `You are generating STRICTLY AP Calculus AB questions for Unit ${unit.id}: ${unit.name}.

UNIT SCOPE: You must ONLY generate questions from this specific unit.
Content must relate to: ${unit.keywords.join(', ')}.

MANDATORY STRUCTURE:
- Stimulus: 2-4 sentences with mathematical context or function description
- Application-based calculation question
- 4 plausible distractors
- Must test calculus reasoning

FORBIDDEN:
- Biology, history, or other subject content
- Pure formula recall
- Content from other calculus units

Generate ${count} questions in JSON format:
{"questions":[{"stimulus":"context","question":"prompt","options":["A","B","C","D"],"correctIndex":0}]}`
  }
};

// Generic bank for subjects not yet in SUBJECT_BANKS
function buildGenericBank(subjectName) {
  return {
    name: subjectName,
    units: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Unit ${i + 1}`,
      keywords: ['concept', 'principle', 'theory', 'analysis', 'application']
    })),
    systemPrompt: (unit, count) => `You are generating STRICTLY AP-level ${subjectName} questions for Unit ${unit.id}: ${unit.name}.

You must ONLY generate questions that are directly relevant to ${subjectName}.
Do NOT include content from other subjects.

MANDATORY STRUCTURE:
- Stimulus: 2-4 sentences of context
- Application-based question (NOT definition recall)
- 4 plausible distractors

FORBIDDEN:
- Pure vocabulary recall
- Content from unrelated subjects

Generate ${count} questions:
{"questions":[{"stimulus":"context","question":"prompt","options":["A","B","C","D"],"correctIndex":0}]}`
  };
}

/**
 * PHASE 2 & 3: Validate required parameters, resolve subject ID to bank
 */
export function validateGenerationParams(subjectId, unitInput) {
  // PHASE 1: Hard requirement
  if (!subjectId) {
    throw new Error('Subject is required for question generation');
  }
  if (!unitInput) {
    throw new Error('Unit is required for question generation');
  }

  // PHASE 3: Resolve subject ID → bank key (switch-style mapping)
  const bankKey = SUBJECT_ID_MAP[subjectId] ?? subjectId;
  console.log(`[GENERATION] Resolving subject: "${subjectId}" → bank: "${bankKey}"`);

  let bank = SUBJECT_BANKS[bankKey];
  if (!bank) {
    // Build a generic bank for unsupported subjects rather than hard-crashing
    console.warn(`[GENERATION] No dedicated bank for "${bankKey}", using generic prompt`);
    bank = buildGenericBank(bankKey);
  }

  // Resolve unit: supports numeric id, "unit_3" string, or full name
  let unitId = unitInput;
  if (typeof unitInput === 'string' && unitInput.startsWith('unit_')) {
    unitId = parseInt(unitInput.replace('unit_', ''), 10);
  }
  const unitData = bank.units.find(u => u.id === parseInt(unitId) || u.name === unitInput);
  if (!unitData) {
    // Fall back to first unit rather than crashing
    console.warn(`[GENERATION] Unknown unit "${unitInput}" for "${bankKey}", falling back to unit 1`);
    return { bank, unitData: bank.units[0], bankKey };
  }

  return { bank, unitData, bankKey };
}

/**
 * PHASE 4: Unit-specific AND cross-subject contamination validation
 */
export function validateUnitMatch(question, unitData, bankKey) {
  const text = `${question.stimulus || ''} ${question.question || ''}`.toLowerCase();

  // Check unit keywords
  const hasUnitKeyword = unitData.keywords.some(kw => text.includes(kw.toLowerCase()));
  if (!hasUnitKeyword) {
    console.warn(`[UNIT VALIDATION] Rejected - no Unit ${unitData.id} keywords in question`);
    return false;
  }

  // PHASE 4: Cross-subject contamination check
  const forbiddenTerms = CROSS_SUBJECT_FILTERS[bankKey] || [];
  const hasForbidden = forbiddenTerms.some(term => text.includes(term.toLowerCase()));
  if (hasForbidden) {
    const found = forbiddenTerms.find(term => text.includes(term.toLowerCase()));
    console.warn(`[SUBJECT FILTER] Rejected - forbidden term "${found}" found in ${bankKey} question`);
    return false;
  }

  return true;
}

/**
 * PHASE 5: Separate memory per subject/unit
 */
const usedQuestions = {};

export function getUsedQuestions(subject, unit) {
  const key = `${subject}_${unit}`;
  if (!usedQuestions[key]) {
    usedQuestions[key] = new Set();
  }
  return usedQuestions[key];
}

export function addUsedQuestion(subject, unit, hash) {
  const key = `${subject}_${unit}`;
  if (!usedQuestions[key]) {
    usedQuestions[key] = new Set();
  }
  usedQuestions[key].add(hash);
}

export function clearUsedQuestions(subject, unit) {
  const key = `${subject}_${unit}`;
  if (usedQuestions[key]) {
    usedQuestions[key].clear();
  }
}

/**
 * PHASE 6: Subject-scoped localStorage for cross-session tracking
 */
export function getQuestionHistory(subject, unit) {
  try {
    const key = `question_history_${subject}_${unit}`;
    const history = localStorage.getItem(key);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

export function addToQuestionHistory(subject, unit, hash) {
  try {
    const key = `question_history_${subject}_${unit}`;
    const history = getQuestionHistory(subject, unit);
    history.push(hash);
    // Keep only last 100 questions per subject/unit
    const trimmed = history.slice(-100);
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to store question history:', e);
  }
}

export function isDuplicateAcrossPractices(subject, unit, hash) {
  const history = getQuestionHistory(subject, unit);
  return history.includes(hash);
}

/**
 * Question hashing utility
 */
export function hashQuestion(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 50);
}