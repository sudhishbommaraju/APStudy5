/**
 * SUBJECT-SPECIFIC PROMPTS
 * Tailored for each AP subject following College Board standards
 */

export const SUBJECT_PROMPTS = {
  // AP CALCULUS AB
  'ap_calculus_ab': {
    style: 'AP Calculus AB',
    requirements: `
- Focus on limits, derivatives, integrals, and Fundamental Theorem of Calculus
- Use proper calculus notation: $\\lim_{x \\to a}$, $\\frac{dy}{dx}$, $\\int_a^b f(x)dx$
- Include graph interpretations when relevant
- Test conceptual understanding (not just computation)
- Use realistic AP exam scenarios`,
    topics: 'Limits, Continuity, Derivatives, Chain Rule, Optimization, Related Rates, Riemann Sums, Definite/Indefinite Integrals, FTC'
  },

  // AP CALCULUS BC
  'ap_calculus_bc': {
    style: 'AP Calculus BC',
    requirements: `
- Include all Calc AB topics plus: parametric equations, polar curves, sequences/series, Taylor polynomials
- Use advanced notation: $\\sum_{n=1}^{\\infty}$, $x = f(t), y = g(t)$, $r = f(\\theta)$
- Test series convergence tests (ratio, integral, comparison)
- Include BC-specific applications`,
    topics: 'Parametric/Polar/Vector Functions, Series, Taylor/Maclaurin Series, Convergence Tests, Integration by Parts, L\'Hopital\'s Rule'
  },

  // AP STATISTICS
  'ap_statistics': {
    style: 'AP Statistics',
    requirements: `
- Focus on data analysis, probability, inference, and experimental design
- Use statistical notation: $\\bar{x}$, $\\sigma$, $\\mu$, $H_0$, $H_a$, $p$-value
- Include real-world contexts (surveys, experiments, observational studies)
- Test interpretation of statistical results, not just calculation
- Include hypothesis testing, confidence intervals, regression`,
    topics: 'Descriptive Statistics, Normal Distribution, Sampling Distributions, t-tests, z-tests, Chi-square, Regression, ANOVA, Experimental Design'
  },

  // AP PHYSICS 1
  'ap_physics_1': {
    style: 'AP Physics 1',
    requirements: `
- Algebra-based mechanics, waves, and electricity
- Use physics notation: $F = ma$, $v = v_0 + at$, $E_k = \\frac{1}{2}mv^2$
- Include free-body diagrams concepts
- Focus on conceptual understanding and problem-solving
- Use SI units (m, kg, s, N, J, W)`,
    topics: 'Kinematics, Newton\'s Laws, Work-Energy, Momentum, Rotational Motion, Simple Harmonic Motion, Waves, DC Circuits'
  },

  // AP PHYSICS 2
  'ap_physics_2': {
    style: 'AP Physics 2',
    requirements: `
- Fluid mechanics, thermodynamics, E&M, optics, modern physics
- Use notation: $PV = nRT$, $\\Delta U = Q - W$, $E = \\frac{kQ}{r^2}$, $B = \\frac{\\mu_0 I}{2\\pi r}$
- Include qualitative and quantitative reasoning
- Test understanding of electric/magnetic fields, circuits, thermodynamics`,
    topics: 'Thermodynamics, Electrostatics, DC/RC Circuits, Magnetism, Geometric/Physical Optics, Quantum/Atomic/Nuclear Physics'
  },

  // AP PHYSICS C: MECHANICS
  'ap_physics_c_mechanics': {
    style: 'AP Physics C: Mechanics',
    requirements: `
- Calculus-based mechanics
- Use calculus notation: $\\vec{F} = m\\vec{a}$, $\\int F dx = \\Delta KE$, $\\frac{d\\vec{L}}{dt} = \\vec{\\tau}$
- Include derivatives/integrals in problem solving
- Focus on advanced kinematics, energy, momentum, rotation, oscillations`,
    topics: 'Kinematics (calculus-based), Newton\'s Laws, Work-Energy Theorem, Conservation Laws, Rotational Dynamics, Simple Harmonic Motion, Gravitation'
  },

  // AP PHYSICS C: E&M
  'ap_physics_c_em': {
    style: 'AP Physics C: Electricity & Magnetism',
    requirements: `
- Calculus-based electricity and magnetism
- Use vector calculus notation: $\\vec{E} = -\\nabla V$, $\\oint \\vec{E} \\cdot d\\vec{A} = \\frac{Q_{enc}}{\\epsilon_0}$
- Include Gauss's Law, Ampere's Law, Faraday's Law applications
- Test Maxwell's equations conceptually`,
    topics: 'Electrostatics, Gauss\'s Law, Electric Potential, Capacitance, Current/Resistance, RC Circuits, Magnetism, Ampere\'s Law, Faraday\'s Law, Inductance, Maxwell\'s Equations'
  },

  // AP CHEMISTRY
  'ap_chemistry': {
    style: 'AP Chemistry',
    requirements: `
- Focus on atomic structure, bonding, reactions, thermodynamics, kinetics, equilibrium
- Use chemical notation: $2H_2O \\rightarrow 2H_2 + O_2$, $K_a$, $pH = -\\log[H^+]$
- Include stoichiometry, molarity calculations, gas laws
- Test understanding of molecular geometry, intermolecular forces, redox`,
    topics: 'Atomic Structure, Periodic Trends, Bonding, Molecular Geometry, Stoichiometry, Gas Laws, Solutions, Thermochemistry, Kinetics, Equilibrium, Acids/Bases, Redox, Electrochemistry'
  },

  // AP BIOLOGY
  'ap_biology': {
    style: 'AP Biology',
    requirements: `
- Focus on evolution, cellular processes, genetics, ecology, and systems
- Use biological terminology accurately (avoid excessive jargon)
- Include data interpretation (graphs, tables, experimental design)
- Test Big Ideas: Evolution, Energy, Information, Systems
- Include molecular biology, genetics problems (Punnett squares, Hardy-Weinberg)`,
    topics: 'Evolution, Cellular Structure/Function, Photosynthesis, Cellular Respiration, Cell Division, Genetics, Gene Expression, Ecology, Animal/Plant Systems, Homeostasis'
  },

  // AP ENVIRONMENTAL SCIENCE
  'ap_environmental_science': {
    style: 'AP Environmental Science',
    requirements: `
- Focus on ecosystems, biodiversity, populations, Earth systems, resources, pollution
- Include real-world environmental issues and policy
- Use scientific data interpretation (graphs, case studies)
- Test understanding of sustainability, conservation, human impact`,
    topics: 'Ecosystems, Biodiversity, Populations, Earth Systems, Water/Land/Energy Resources, Pollution, Global Change, Sustainability'
  },

  // AP COMPUTER SCIENCE A
  'ap_computer_science_a': {
    style: 'AP Computer Science A',
    requirements: `
- Focus on Java programming concepts
- Use code syntax with proper formatting: \`int x = 5;\`, \`for (int i = 0; i < n; i++)\`
- Test object-oriented programming, inheritance, polymorphism
- Include algorithm analysis, recursion, data structures (arrays, ArrayLists)
- Avoid asking students to write full programs - focus on reading/analyzing code`,
    topics: 'Primitive Types, Objects, Classes, Control Structures, Methods, Arrays, ArrayLists, 2D Arrays, Inheritance, Recursion, Searching/Sorting'
  },

  // AP COMPUTER SCIENCE PRINCIPLES
  'ap_computer_science_principles': {
    style: 'AP Computer Science Principles',
    requirements: `
- Focus on computational thinking, algorithms, programming concepts (language-agnostic)
- Test understanding of internet, cybersecurity, data, impact of computing
- Use pseudocode or simple code examples
- Include real-world applications and ethical implications`,
    topics: 'Algorithms, Programming, Internet, Data, Cybersecurity, Impact of Computing, Computational Thinking, Abstraction, Binary, Encryption'
  },

  // AP ENGLISH LANGUAGE & COMPOSITION
  'ap_english_language': {
    style: 'AP English Language & Composition',
    requirements: `
- Focus on rhetorical analysis, argument, synthesis
- Include passage-based questions with analysis of author's purpose, tone, diction
- Test understanding of rhetorical strategies (ethos, pathos, logos)
- Avoid asking for full essays - focus on analysis and comprehension
- Use excerpts from speeches, essays, articles`,
    topics: 'Rhetorical Analysis, Argument Structure, Evidence, Tone, Diction, Syntax, Rhetorical Devices, Synthesis, Claims/Warrants'
  },

  // AP ENGLISH LITERATURE & COMPOSITION
  'ap_english_literature': {
    style: 'AP English Literature & Composition',
    requirements: `
- Focus on literary analysis, themes, character development, symbolism
- Include poetry and prose analysis
- Test understanding of literary devices (metaphor, imagery, irony, symbolism)
- Use excerpts from novels, poems, plays
- Analyze tone, mood, point of view, structure`,
    topics: 'Literary Devices, Theme, Character Analysis, Symbolism, Tone, Point of View, Poetry Analysis, Prose Analysis, Figurative Language'
  },

  // AP US HISTORY
  'ap_us_history': {
    style: 'AP US History',
    requirements: `
- Focus on chronological periods from pre-Columbian to present
- Include stimulus-based questions (primary sources, political cartoons, data)
- Test causation, comparison, continuity/change over time
- Use historical thinking skills (contextualization, evidence, interpretation)
- Cover political, economic, social, cultural themes`,
    topics: 'Colonial Period, Revolution, Constitution, Expansion, Civil War, Reconstruction, Gilded Age, Progressive Era, WWI, Great Depression, WWII, Cold War, Civil Rights, Modern America'
  },

  // AP WORLD HISTORY: MODERN
  'ap_world_history': {
    style: 'AP World History: Modern',
    requirements: `
- Focus on 1200 CE to present, global interactions
- Include comparative analysis across regions and time periods
- Test themes: governance, economic systems, social structures, technology, culture
- Use primary/secondary sources as stimuli
- Cover Europe, Americas, Asia, Africa, Oceania`,
    topics: 'Global Trade Networks, Land-Based Empires, Transoceanic Interconnections, Revolutions, Imperialism, WWI, WWII, Cold War, Decolonization, Globalization'
  },

  // AP EUROPEAN HISTORY
  'ap_european_history': {
    style: 'AP European History',
    requirements: `
- Focus on 1450 to present
- Include Renaissance, Reformation, Enlightenment, Revolutions, World Wars
- Test causation, comparison, change over time
- Use primary sources and artwork as stimuli
- Cover political, intellectual, cultural, social, economic themes`,
    topics: 'Renaissance, Reformation, Absolutism, Enlightenment, French Revolution, Industrialization, Nationalism, Imperialism, WWI, WWII, Cold War, Contemporary Europe'
  },

  // AP US GOVERNMENT & POLITICS
  'ap_us_government': {
    style: 'AP US Government & Politics',
    requirements: `
- Focus on Constitution, branches of government, civil liberties/rights, political ideologies
- Include Supreme Court cases, political data (polls, voter turnout)
- Test understanding of federalism, checks and balances, policy-making
- Use current events and political scenarios`,
    topics: 'Constitution, Federalism, Legislative Branch, Executive Branch, Judicial Branch, Civil Liberties, Civil Rights, Political Parties, Elections, Interest Groups, Policy-Making'
  },

  // AP COMPARATIVE GOVERNMENT
  'ap_comparative_government': {
    style: 'AP Comparative Government & Politics',
    requirements: `
- Compare 6 countries: UK, Russia, China, Iran, Mexico, Nigeria
- Focus on political institutions, regimes, democratization, civil society
- Test comparative analysis across political systems
- Include real-world political events and data`,
    topics: 'Political Systems, Sovereignty, Authority, Regime Types, Electoral Systems, Political Culture, Civil Society, Democratization, Economic Liberalization'
  },

  // AP HUMAN GEOGRAPHY
  'ap_human_geography': {
    style: 'AP Human Geography',
    requirements: `
- Focus on spatial patterns, cultural landscapes, population, migration, urban development
- Include map-based questions and geographic data
- Test understanding of geographic concepts and models (gravity model, Rostow's stages)
- Use real-world examples and case studies`,
    topics: 'Population, Migration, Culture, Language, Religion, Ethnicity, Political Geography, Agriculture, Economic Development, Urbanization, Sustainability'
  },

  // AP PSYCHOLOGY
  'ap_psychology': {
    style: 'AP Psychology',
    requirements: `
- Cover major perspectives: biological, cognitive, behavioral, psychoanalytic, humanistic
- Include research methods, famous psychologists, experiments
- Test understanding of psychological concepts, disorders, therapies
- Use real-world scenarios and case studies`,
    topics: 'Research Methods, Biological Bases, Sensation/Perception, Learning, Memory, Cognition, Development, Motivation/Emotion, Personality, Social Psychology, Psychological Disorders, Treatment'
  },

  // AP MACROECONOMICS
  'ap_macroeconomics': {
    style: 'AP Macroeconomics',
    requirements: `
- Focus on GDP, inflation, unemployment, fiscal/monetary policy, international trade
- Use graphs (AD-AS, Phillips Curve, money market, loanable funds)
- Include policy scenarios (Federal Reserve actions, government spending)
- Test understanding of economic indicators and models`,
    topics: 'GDP, Inflation, Unemployment, Aggregate Demand/Supply, Fiscal Policy, Monetary Policy, Money Supply, International Trade, Exchange Rates, Economic Growth'
  },

  // AP MICROECONOMICS
  'ap_microeconomics': {
    style: 'AP Microeconomics',
    requirements: `
- Focus on supply/demand, elasticity, market structures, resource markets, market failures
- Use graphs (supply/demand, production costs, perfect competition, monopoly)
- Test understanding of consumer/producer surplus, deadweight loss, efficiency
- Include real-world market scenarios`,
    topics: 'Supply/Demand, Elasticity, Consumer Choice, Production Costs, Perfect Competition, Monopoly, Oligopoly, Monopolistic Competition, Factor Markets, Market Failures, Government Intervention'
  },

  // AP WORLD LANGUAGES (Spanish, French, etc.)
  'ap_spanish_language': {
    style: 'AP Spanish Language & Culture',
    requirements: `
- Questions should be in SPANISH
- Focus on reading comprehension, cultural context, interpretive communication
- Use authentic Spanish texts (articles, essays, excerpts)
- Test vocabulary, grammar in context, idiomatic expressions
- Include cultural references from Spanish-speaking countries`,
    topics: 'Las familias y las comunidades, La ciencia y la tecnología, La belleza y la estética, La vida contemporánea, Los desafíos mundiales, La identidad personal y pública'
  },

  'ap_french_language': {
    style: 'AP French Language & Culture',
    requirements: `
- Questions should be in FRENCH
- Focus on reading comprehension, cultural context, interpretive communication
- Use authentic French texts
- Test vocabulary, grammar, idiomatic expressions
- Include French and Francophone cultural references`,
    topics: 'La famille et la communauté, La science et la technologie, La beauté et l\'esthétique, La vie contemporaine, Les défis mondiaux, L\'identité personnelle et publique'
  },

  // AP ARTS
  'ap_art_history': {
    style: 'AP Art History',
    requirements: `
- Focus on artworks from prehistoric to contemporary (global scope)
- Test understanding of style, context, function, content, cultural significance
- Include specific artworks, artists, movements
- Use visual analysis techniques
- Cover diverse cultures and time periods`,
    topics: 'Global Prehistory, Ancient Mediterranean, Early Europe/Colonial Americas, Indigenous Americas, Africa, Asia, Islamic World, Renaissance, Baroque, Enlightenment, Modern, Contemporary'
  },

  'ap_music_theory': {
    style: 'AP Music Theory',
    requirements: `
- Focus on notation, scales, intervals, chords, harmonic analysis, voice leading
- Use musical notation: treble/bass clef, key signatures, time signatures
- Test understanding of chord progressions (I-IV-V-I), cadences, modulation
- Include aural skills concepts (rhythm, melody, harmony)`,
    topics: 'Notation, Scales, Intervals, Triads, Seventh Chords, Roman Numeral Analysis, Voice Leading, Harmonic Progression, Cadences, Modulation, Musical Form'
  },

  // AP CAPSTONE
  'ap_seminar': {
    style: 'AP Seminar',
    requirements: `
- Focus on argumentation, research, analysis of sources, multiple perspectives
- Test understanding of claims, evidence, reasoning, credibility
- Use real-world issues and controversial topics
- Include evaluation of arguments and counterarguments`,
    topics: 'Argument Analysis, Evidence Evaluation, Source Credibility, Bias, Research Methods, Perspective, Synthesis, Argumentation, Rhetorical Strategies'
  },

  'ap_research': {
    style: 'AP Research',
    requirements: `
- Focus on research design, methodology, data collection, analysis
- Test understanding of academic integrity, scholarly inquiry
- Include evaluation of research studies and methods
- Use real research scenarios and ethical considerations`,
    topics: 'Research Question Development, Literature Review, Methodology, Data Collection, Analysis, Interpretation, Academic Integrity, Scholarly Communication'
  },

  // STANDARDIZED TESTS
  'sat': {
    style: 'SAT',
    requirements: `
- Reading & Writing: grammar, rhetoric, vocabulary in context, passage analysis
- Math: algebra, problem-solving, data analysis (calculator and no-calculator sections)
- Use College Board SAT format and style
- Focus on practical problem-solving and real-world applications`,
    topics: 'SAT Reading (Evidence-Based), SAT Writing (Grammar/Rhetoric), SAT Math (Algebra, Problem Solving, Data Analysis, Geometry, Trigonometry)'
  },

  'act': {
    style: 'ACT',
    requirements: `
- English: grammar, punctuation, sentence structure, rhetorical skills
- Math: pre-algebra, algebra, geometry, trigonometry
- Reading: passage comprehension, inference, main idea
- Science: data interpretation, scientific reasoning
- Use ACT format and style`,
    topics: 'ACT English, ACT Math, ACT Reading, ACT Science Reasoning'
  },

  // BASE SUBJECTS (General)
  'reading_writing': {
    style: 'Reading & Writing',
    requirements: `
- Focus on reading comprehension, grammar, vocabulary, writing skills
- Use passages from various genres (fiction, nonfiction, poetry)
- Test understanding of main idea, inference, tone, author's purpose
- Include grammar and mechanics questions`,
    topics: 'Reading Comprehension, Grammar, Punctuation, Vocabulary, Main Idea, Inference, Tone, Rhetorical Devices'
  },

  'math': {
    style: 'Mathematics',
    requirements: `
- Cover arithmetic, algebra, geometry, pre-calculus
- Use proper mathematical notation: $x^2$, $\\frac{a}{b}$, $\\sqrt{x}$
- Test problem-solving, not just computation
- Include word problems and real-world applications`,
    topics: 'Arithmetic, Algebra, Geometry, Trigonometry, Functions, Equations, Inequalities, Data Analysis'
  },

  'science': {
    style: 'General Science',
    requirements: `
- Cover biology, chemistry, physics, earth science
- Use scientific method, data interpretation, experimental design
- Test understanding of scientific concepts and processes
- Include real-world scientific scenarios`,
    topics: 'Scientific Method, Biology, Chemistry, Physics, Earth Science, Data Analysis, Experimental Design'
  }
};

/**
 * Get subject-specific prompt enhancements
 */
export function getSubjectPrompt(subjectId) {
  return SUBJECT_PROMPTS[subjectId] || SUBJECT_PROMPTS['math']; // Default fallback
}

/**
 * Build complete generation prompt for a subject
 */
export function buildPrompt(subjectId, unit, skill, difficulty) {
  const subjectConfig = getSubjectPrompt(subjectId);
  
  let context = subjectConfig.style;
  if (unit) context += ` - ${unit.unit_name}`;
  if (skill) context += ` - ${skill.skill_name}`;
  
  return `Generate a COLLEGE BOARD LEVEL ${subjectConfig.style} multiple-choice question for: ${context}

CRITICAL: This must be AP exam quality - challenging, rigorous, and testing deep understanding.

SUBJECT-SPECIFIC REQUIREMENTS:
${subjectConfig.requirements}

RELEVANT TOPICS FOR THIS SUBJECT:
${subjectConfig.topics}

MANDATORY REQUIREMENTS:
- Create a RIGOROUS College Board AP exam-level question (no easy questions)
- Question MUST test deep conceptual understanding and application, NOT simple recall
- All 4 answer choices MUST be highly plausible with sophisticated distractors
- Wrong answers should reflect common AP-level student misconceptions
- Use proper notation (LaTeX for math/science: $x^2$, $\\frac{a}{b}$, $\\int$, $\\sum$, etc.)
- Explanation must be comprehensive with complete College Board-level reasoning
- Match the exact style and rigor of actual AP exams for this subject

Return JSON:
{
  "question_text": "Rigorous College Board-level question",
  "choice_a": "Sophisticated plausible option",
  "choice_b": "Sophisticated plausible option", 
  "choice_c": "Sophisticated plausible option",
  "choice_d": "Sophisticated plausible option",
  "correct_answer": "A" or "B" or "C" or "D",
  "explanation": "Complete AP-level explanation with step-by-step reasoning",
  "hint": "Strategic hint appropriate for AP-level students"
}`;
}