/**
 * Framework-aligned AP subject + unit data
 * Sources: AP Central course pages (verified, March 2026)
 * Unit titles match official Course and Exam Descriptions.
 */

export const SUBJECTS = {
  // ── History & Social Sciences ──────────────────────────────────────────────
  "AP U.S. History": {
    archetype: "history_argument",
    skills: ["argumentation", "causation", "contextualization", "continuity and change over time", "comparison", "evidence selection"],
    commandVerbs: ["Evaluate", "Explain", "Compare", "Develop an argument", "Justify"],
    units: [
      { id: "unit1", name: "Unit 1: Period 1 (1491–1607)" },
      { id: "unit2", name: "Unit 2: Period 2 (1607–1754)" },
      { id: "unit3", name: "Unit 3: Period 3 (1754–1800)" },
      { id: "unit4", name: "Unit 4: Period 4 (1800–1848)" },
      { id: "unit5", name: "Unit 5: Period 5 (1844–1877)" },
      { id: "unit6", name: "Unit 6: Period 6 (1865–1898)" },
      { id: "unit7", name: "Unit 7: Period 7 (1890–1945)" },
      { id: "unit8", name: "Unit 8: Period 8 (1945–1980)" },
      { id: "unit9", name: "Unit 9: Period 9 (1980–Present)" }
    ]
  },
  "AP World History: Modern": {
    archetype: "history_argument",
    skills: ["argumentation", "causation", "contextualization", "continuity and change over time", "comparison", "evidence selection"],
    commandVerbs: ["Evaluate", "Explain", "Compare", "Develop an argument", "Justify"],
    units: [
      { id: "unit1", name: "Unit 1: The Global Tapestry" },
      { id: "unit2", name: "Unit 2: Networks of Exchange" },
      { id: "unit3", name: "Unit 3: Land-Based Empires" },
      { id: "unit4", name: "Unit 4: Transoceanic Interconnections" },
      { id: "unit5", name: "Unit 5: Revolutions" },
      { id: "unit6", name: "Unit 6: Consequences of Industrialization" },
      { id: "unit7", name: "Unit 7: Global Conflict" },
      { id: "unit8", name: "Unit 8: Cold War & Decolonization" },
      { id: "unit9", name: "Unit 9: Globalization" }
    ]
  },
  "AP European History": {
    archetype: "history_argument",
    skills: ["argumentation", "causation", "contextualization", "continuity and change over time", "comparison"],
    commandVerbs: ["Evaluate", "Explain", "Compare", "Develop an argument", "Justify"],
    units: [
      { id: "unit1", name: "Unit 1: Renaissance & Exploration" },
      { id: "unit2", name: "Unit 2: Age of Reformation" },
      { id: "unit3", name: "Unit 3: Absolutism & Constitutionalism" },
      { id: "unit4", name: "Unit 4: Scientific, Philosophical & Political Developments" },
      { id: "unit5", name: "Unit 5: Conflict, Crisis & Reaction in the Late 18th Century" },
      { id: "unit6", name: "Unit 6: Industrialization & Its Effects" },
      { id: "unit7", name: "Unit 7: 19th-Century Perspectives & Political Developments" },
      { id: "unit8", name: "Unit 8: 20th-Century Global Conflicts" },
      { id: "unit9", name: "Unit 9: Cold War & Contemporary Europe" }
    ]
  },
  "AP U.S. Government & Politics": {
    archetype: "policy_analysis",
    skills: ["argumentation", "concept application", "quantitative analysis", "SCOTUS comparison"],
    commandVerbs: ["Explain", "Evaluate", "Justify", "Describe", "Compare"],
    units: [
      { id: "unit1", name: "Unit 1: Foundations of American Democracy" },
      { id: "unit2", name: "Unit 2: Interactions Among Branches" },
      { id: "unit3", name: "Unit 3: Civil Liberties & Civil Rights" },
      { id: "unit4", name: "Unit 4: American Political Ideologies & Beliefs" },
      { id: "unit5", name: "Unit 5: Political Participation" }
    ]
  },
  "AP Comparative Government & Politics": {
    archetype: "policy_analysis",
    skills: ["comparison", "concept application", "argumentation"],
    commandVerbs: ["Compare", "Explain", "Evaluate", "Justify", "Describe"],
    units: [
      { id: "unit1", name: "Unit 1: Political Systems, Regimes & Governments" },
      { id: "unit2", name: "Unit 2: Political Institutions" },
      { id: "unit3", name: "Unit 3: Political Culture & Participation" },
      { id: "unit4", name: "Unit 4: Party & Electoral Systems & Citizen Organizations" },
      { id: "unit5", name: "Unit 5: Political & Economic Changes & Development" }
    ]
  },
  "AP Human Geography": {
    archetype: "data_analysis",
    skills: ["concept application", "spatial reasoning", "data analysis", "scale analysis"],
    commandVerbs: ["Explain", "Describe", "Compare", "Evaluate", "Interpret"],
    units: [
      { id: "unit1", name: "Unit 1: Thinking Geographically" },
      { id: "unit2", name: "Unit 2: Population & Migration Patterns & Processes" },
      { id: "unit3", name: "Unit 3: Cultural Patterns & Processes" },
      { id: "unit4", name: "Unit 4: Political Patterns & Processes" },
      { id: "unit5", name: "Unit 5: Agriculture & Rural Land-Use Patterns" },
      { id: "unit6", name: "Unit 6: Cities & Urban Land-Use Patterns" },
      { id: "unit7", name: "Unit 7: Industrial & Economic Development Patterns" }
    ]
  },
  "AP Psychology": {
    archetype: "data_analysis",
    skills: ["concept application", "research design", "data interpretation", "ethical reasoning"],
    commandVerbs: ["Explain", "Describe", "Predict", "Interpret", "Evaluate"],
    units: [
      { id: "unit1", name: "Unit 1: Biological Bases of Behavior" },
      { id: "unit2", name: "Unit 2: Cognition" },
      { id: "unit3", name: "Unit 3: Development & Learning" },
      { id: "unit4", name: "Unit 4: Social Psychology & Personality" },
      { id: "unit5", name: "Unit 5: Mental & Physical Health" }
    ]
  },
  "AP Macroeconomics": {
    archetype: "data_analysis",
    skills: ["graphical analysis", "model application", "quantitative analysis", "argumentation"],
    commandVerbs: ["Explain", "Draw", "Calculate", "Evaluate", "Predict"],
    units: [
      { id: "unit1", name: "Unit 1: Basic Economic Concepts" },
      { id: "unit2", name: "Unit 2: Economic Indicators & the Business Cycle" },
      { id: "unit3", name: "Unit 3: National Income & Price Determination" },
      { id: "unit4", name: "Unit 4: Financial Sector" },
      { id: "unit5", name: "Unit 5: Long-Run Consequences of Stabilization Policies" },
      { id: "unit6", name: "Unit 6: Open Economy — International Trade & Finance" }
    ]
  },
  "AP Microeconomics": {
    archetype: "data_analysis",
    skills: ["graphical analysis", "model application", "quantitative analysis", "argumentation"],
    commandVerbs: ["Explain", "Draw", "Calculate", "Evaluate", "Determine"],
    units: [
      { id: "unit1", name: "Unit 1: Basic Economic Concepts" },
      { id: "unit2", name: "Unit 2: Supply & Demand" },
      { id: "unit3", name: "Unit 3: Production, Cost & Perfect Competition" },
      { id: "unit4", name: "Unit 4: Imperfect Competition" },
      { id: "unit5", name: "Unit 5: Factor Markets" },
      { id: "unit6", name: "Unit 6: Market Failure & the Role of Government" }
    ]
  },
  "AP African American Studies": {
    archetype: "history_argument",
    skills: ["argumentation", "evidence selection", "thematic analysis", "contextualization"],
    commandVerbs: ["Explain", "Analyze", "Evaluate", "Compare", "Develop an argument"],
    units: [
      { id: "unit1", name: "Unit 1: Origins of the African Diaspora" },
      { id: "unit2", name: "Unit 2: Freedom, Enslavement & Resistance" },
      { id: "unit3", name: "Unit 3: The Practice of Freedom" },
      { id: "unit4", name: "Unit 4: Movements & Debates" }
    ]
  },

  // ── Sciences ──────────────────────────────────────────────────────────────
  "AP Biology": {
    archetype: "lab_science",
    skills: ["experimental design", "data analysis", "scientific reasoning", "claim-evidence-reasoning", "mathematical reasoning"],
    commandVerbs: ["Explain", "Describe", "Justify", "Predict", "Design", "Evaluate"],
    units: [
      { id: "unit1", name: "Unit 1: Chemistry of Life" },
      { id: "unit2", name: "Unit 2: Cell Structure & Function" },
      { id: "unit3", name: "Unit 3: Cellular Energetics" },
      { id: "unit4", name: "Unit 4: Cell Communication & Cell Cycle" },
      { id: "unit5", name: "Unit 5: Heredity" },
      { id: "unit6", name: "Unit 6: Gene Expression & Regulation" },
      { id: "unit7", name: "Unit 7: Natural Selection" },
      { id: "unit8", name: "Unit 8: Ecology" }
    ]
  },
  "AP Chemistry": {
    archetype: "lab_science",
    skills: ["experimental design", "data analysis", "mathematical reasoning", "claim-evidence-reasoning", "model use"],
    commandVerbs: ["Explain", "Calculate", "Justify", "Predict", "Design", "Determine"],
    units: [
      { id: "unit1", name: "Unit 1: Atomic Structure & Properties" },
      { id: "unit2", name: "Unit 2: Molecular & Ionic Compound Structure" },
      { id: "unit3", name: "Unit 3: Intermolecular Forces & Properties" },
      { id: "unit4", name: "Unit 4: Chemical Reactions" },
      { id: "unit5", name: "Unit 5: Kinetics" },
      { id: "unit6", name: "Unit 6: Thermodynamics" },
      { id: "unit7", name: "Unit 7: Equilibrium" },
      { id: "unit8", name: "Unit 8: Acids & Bases" },
      { id: "unit9", name: "Unit 9: Applications of Thermodynamics" }
    ]
  },
  "AP Physics 1": {
    archetype: "lab_science",
    skills: ["experimental design", "mathematical reasoning", "argumentation", "model use", "data analysis"],
    commandVerbs: ["Explain", "Calculate", "Justify", "Derive", "Design", "Predict"],
    units: [
      { id: "unit1", name: "Unit 1: Kinematics" },
      { id: "unit2", name: "Unit 2: Forces & Newton's Laws" },
      { id: "unit3", name: "Unit 3: Circular Motion & Gravitation" },
      { id: "unit4", name: "Unit 4: Energy" },
      { id: "unit5", name: "Unit 5: Momentum" },
      { id: "unit6", name: "Unit 6: Simple Harmonic Motion" },
      { id: "unit7", name: "Unit 7: Torque & Rotational Motion" },
      { id: "unit8", name: "Unit 8: Electric Charge & Electric Force" },
      { id: "unit9", name: "Unit 9: DC Circuits" },
      { id: "unit10", name: "Unit 10: Mechanical Waves & Sound" }
    ]
  },
  "AP Environmental Science": {
    archetype: "lab_science",
    skills: ["data analysis", "scientific reasoning", "claim-evidence-reasoning", "mathematical reasoning", "environmental problem-solving"],
    commandVerbs: ["Explain", "Calculate", "Describe", "Evaluate", "Justify", "Predict"],
    units: [
      { id: "unit1", name: "Unit 1: The Living World — Ecosystems" },
      { id: "unit2", name: "Unit 2: The Living World — Biodiversity" },
      { id: "unit3", name: "Unit 3: Populations" },
      { id: "unit4", name: "Unit 4: Earth Systems & Resources" },
      { id: "unit5", name: "Unit 5: Land & Water Use" },
      { id: "unit6", name: "Unit 6: Energy Resources & Consumption" },
      { id: "unit7", name: "Unit 7: Atmospheric Pollution" },
      { id: "unit8", name: "Unit 8: Aquatic & Terrestrial Pollution" },
      { id: "unit9", name: "Unit 9: Global Change" }
    ]
  },

  // ── Math & Computer Science ────────────────────────────────────────────────
  "AP Calculus AB": {
    archetype: "math_analysis",
    skills: ["mathematical reasoning", "computation", "interpretation", "justification", "model use"],
    commandVerbs: ["Calculate", "Determine", "Justify", "Explain", "Interpret", "Evaluate"],
    units: [
      { id: "unit1", name: "Unit 1: Limits & Continuity" },
      { id: "unit2", name: "Unit 2: Differentiation — Definition & Fundamental Properties" },
      { id: "unit3", name: "Unit 3: Differentiation — Composite, Implicit & Inverse Functions" },
      { id: "unit4", name: "Unit 4: Contextual Applications of Differentiation" },
      { id: "unit5", name: "Unit 5: Analytical Applications of Differentiation" },
      { id: "unit6", name: "Unit 6: Integration & Accumulation of Change" },
      { id: "unit7", name: "Unit 7: Differential Equations" },
      { id: "unit8", name: "Unit 8: Applications of Integration" }
    ]
  },
  "AP Calculus BC": {
    archetype: "math_analysis",
    skills: ["mathematical reasoning", "computation", "interpretation", "justification", "series analysis"],
    commandVerbs: ["Calculate", "Determine", "Justify", "Explain", "Interpret", "Evaluate"],
    units: [
      { id: "unit1", name: "Unit 1: Limits & Continuity" },
      { id: "unit2", name: "Unit 2: Differentiation — Definition & Fundamental Properties" },
      { id: "unit3", name: "Unit 3: Differentiation — Composite, Implicit & Inverse Functions" },
      { id: "unit4", name: "Unit 4: Contextual Applications of Differentiation" },
      { id: "unit5", name: "Unit 5: Analytical Applications of Differentiation" },
      { id: "unit6", name: "Unit 6: Integration & Accumulation of Change" },
      { id: "unit7", name: "Unit 7: Differential Equations" },
      { id: "unit8", name: "Unit 8: Applications of Integration" },
      { id: "unit9", name: "Unit 9: Parametric Equations, Polar Coordinates & Vector-Valued Functions" },
      { id: "unit10", name: "Unit 10: Infinite Sequences & Series" }
    ]
  },
  "AP Precalculus": {
    archetype: "math_analysis",
    skills: ["mathematical reasoning", "function analysis", "modeling", "justification"],
    commandVerbs: ["Determine", "Calculate", "Explain", "Interpret", "Justify"],
    units: [
      { id: "unit1", name: "Unit 1: Polynomial & Rational Functions" },
      { id: "unit2", name: "Unit 2: Exponential & Logarithmic Functions" },
      { id: "unit3", name: "Unit 3: Trigonometric & Polar Functions" },
      { id: "unit4", name: "Unit 4: Functions Involving Parameters, Vectors & Matrices" }
    ]
  },
  "AP Computer Science A": {
    archetype: "math_analysis",
    skills: ["code tracing", "algorithm design", "debugging", "class design", "data structure reasoning"],
    commandVerbs: ["Write", "Determine", "Explain", "Trace", "Design"],
    units: [
      { id: "unit1", name: "Unit 1: Using Objects & Methods" },
      { id: "unit2", name: "Unit 2: Selection & Iteration" },
      { id: "unit3", name: "Unit 3: Class Creation" },
      { id: "unit4", name: "Unit 4: Data Collections" }
    ]
  },

  // ── English ────────────────────────────────────────────────────────────────
  "AP English Language & Composition": {
    archetype: "literary_analysis",
    skills: ["argumentation", "rhetorical analysis", "synthesis", "organization", "style analysis"],
    commandVerbs: ["Develop an argument", "Analyze", "Explain", "Evaluate", "Synthesize"],
    units: [
      { id: "unit1", name: "Unit 1: Claims, Evidence & Commentary" },
      { id: "unit2", name: "Unit 2: Reasoning & Organization" },
      { id: "unit3", name: "Unit 3: Claim & Evidence in Argument" },
      { id: "unit4", name: "Unit 4: Rhetorical Situation in Arguments" },
      { id: "unit5", name: "Unit 5: Reasoning in Arguments" },
      { id: "unit6", name: "Unit 6: Developing a Thesis" },
      { id: "unit7", name: "Unit 7: Counterarguments" },
      { id: "unit8", name: "Unit 8: Cited Evidence in Argument" },
      { id: "unit9", name: "Unit 9: Composition" }
    ]
  },
  "AP English Literature & Composition": {
    archetype: "literary_analysis",
    skills: ["literary analysis", "textual evidence", "interpretation", "argumentation", "style analysis"],
    commandVerbs: ["Analyze", "Interpret", "Explain", "Evaluate", "Develop an argument"],
    units: [
      { id: "unit1", name: "Unit 1: Short Fiction I" },
      { id: "unit2", name: "Unit 2: Poetry I" },
      { id: "unit3", name: "Unit 3: Longer Fiction or Drama I" },
      { id: "unit4", name: "Unit 4: Short Fiction II" },
      { id: "unit5", name: "Unit 5: Poetry II" },
      { id: "unit6", name: "Unit 6: Longer Fiction or Drama II" },
      { id: "unit7", name: "Unit 7: Short Fiction III" },
      { id: "unit8", name: "Unit 8: Poetry III" },
      { id: "unit9", name: "Unit 9: Longer Fiction or Drama III" }
    ]
  },

  // ── Arts ───────────────────────────────────────────────────────────────────
  "AP Art History": {
    archetype: "literary_analysis",
    skills: ["visual analysis", "contextual analysis", "comparison", "argumentation", "cultural context"],
    commandVerbs: ["Analyze", "Compare", "Explain", "Evaluate", "Describe"],
    units: [
      { id: "unit1", name: "Unit 1: Global Prehistory" },
      { id: "unit2", name: "Unit 2: Ancient Mediterranean" },
      { id: "unit3", name: "Unit 3: Early Europe & Colonial Americas" },
      { id: "unit4", name: "Unit 4: Later Europe & Americas" },
      { id: "unit5", name: "Unit 5: Indigenous Americas" },
      { id: "unit6", name: "Unit 6: Africa" },
      { id: "unit7", name: "Unit 7: West & Central Asia" },
      { id: "unit8", name: "Unit 8: South, East & Southeast Asia" },
      { id: "unit9", name: "Unit 9: The Pacific" },
      { id: "unit10", name: "Unit 10: Global Contemporary" }
    ]
  },
  "AP Music Theory": {
    archetype: "math_analysis",
    skills: ["harmonic analysis", "voice leading", "ear training", "score analysis", "composition"],
    commandVerbs: ["Analyze", "Notate", "Identify", "Explain", "Compose"],
    units: [
      { id: "unit1", name: "Unit 1: Music Fundamentals I" },
      { id: "unit2", name: "Unit 2: Music Fundamentals II" },
      { id: "unit3", name: "Unit 3: Music Fundamentals III" },
      { id: "unit4", name: "Unit 4: Harmony & Voice Leading I" },
      { id: "unit5", name: "Unit 5: Harmony & Voice Leading II" },
      { id: "unit6", name: "Unit 6: Harmony & Voice Leading III" },
      { id: "unit7", name: "Unit 7: Harmony & Voice Leading IV" },
      { id: "unit8", name: "Unit 8: Modes & Form" }
    ]
  }
};

/**
 * Rubric mini-templates by archetype (from the framework spec)
 * Each archetype yields 3–6 criteria that mirror AP scoring behavior.
 */
export const RUBRIC_TEMPLATES = {
  history_argument: {
    label: "History Argument (LEQ/SAQ/DBQ)",
    criteria: [
      "States a defensible, historically plausible thesis/claim",
      "Provides specific, accurate historical evidence from at least two categories",
      "Explains causal/comparative/continuity reasoning linking evidence to claim",
      "Addresses complexity or alternative interpretation",
      "Demonstrates accurate chronological understanding within the specified period",
      "Uses historically appropriate language and avoids major factual errors"
    ]
  },
  lab_science: {
    label: "Lab Science (Bio/Chem/Physics/APES)",
    criteria: [
      "States a testable hypothesis or scientific claim",
      "Describes experimental design with appropriate controls and variables",
      "Analyzes data accurately and identifies trends or patterns",
      "Applies claim-evidence-reasoning framework correctly",
      "Addresses sources of error or uncertainty",
      "Uses scientific models or representations appropriately"
    ]
  },
  math_analysis: {
    label: "Math Modeling & Analysis (Calc/Stats/CSA)",
    criteria: [
      "Sets up the problem correctly with appropriate notation",
      "Executes correct procedure or algorithm",
      "Arrives at correct result with appropriate units",
      "Interprets result in context of the problem",
      "Justifies reasoning and communicates steps clearly",
      "Addresses boundary cases or conditions as needed"
    ]
  },
  literary_analysis: {
    label: "Literary / Rhetorical Analysis",
    criteria: [
      "States a defensible, interpretive thesis or claim",
      "Selects and quotes specific, relevant textual evidence",
      "Explains how evidence supports the claim (not just summary)",
      "Analyzes rhetorical/literary devices and their effect",
      "Demonstrates sophisticated understanding of the text or argument",
      "Maintains clarity and organization throughout"
    ]
  },
  policy_analysis: {
    label: "Policy / Government Analysis",
    criteria: [
      "States a clear, defensible claim or position",
      "Accurately applies relevant constitutional principles or political concepts",
      "Provides specific, accurate evidence (cases, data, examples)",
      "Explains causal links between evidence and claim",
      "Addresses a counterargument or alternative perspective",
      "Demonstrates accurate understanding of political processes"
    ]
  },
  data_analysis: {
    label: "Data & Concept Application",
    criteria: [
      "Accurately identifies the relevant concept or model",
      "Correctly interprets data, graph, or quantitative information",
      "Applies concept to the specific scenario accurately",
      "Explains causal or correlational reasoning",
      "Addresses limitations or alternative explanations",
      "Uses precise, discipline-specific vocabulary"
    ]
  },
  world_language: {
    label: "World Language",
    criteria: [
      "Completes the communicative task fully",
      "Communicates clearly with minimal comprehension barriers",
      "Demonstrates appropriate vocabulary range and accuracy",
      "Shows grammatical control appropriate to level",
      "Includes relevant cultural comparison or awareness where required",
      "Maintains appropriate register and organizational structure"
    ]
  }
};

export function getSubjectList() {
  return Object.keys(SUBJECTS);
}

export function getUnitsForSubject(subject) {
  return SUBJECTS[subject]?.units || [];
}

export function getArchetypeForSubject(subject) {
  return SUBJECTS[subject]?.archetype || "data_analysis";
}

export function getSkillsForSubject(subject) {
  return SUBJECTS[subject]?.skills || [];
}

export function getCommandVerbsForSubject(subject) {
  return SUBJECTS[subject]?.commandVerbs || ["Explain", "Evaluate", "Justify"];
}