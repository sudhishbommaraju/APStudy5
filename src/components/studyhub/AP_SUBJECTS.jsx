export const AP_SUBJECTS = [
  {
    subject: 'AP Precalculus',
    id: 'ap_precalculus',
    category: 'Math & CS',
    units: [
      {
        name: 'Unit 1: Polynomial and Rational Functions',
        topics: [
          'Change in Tandem', 'Rates of Change', 'Polynomial Functions and Rates of Change',
          'Polynomial Functions and Complex Zeros', 'Polynomial Functions and End Behavior',
          'Polynomial Functions and Zeros', 'Rational Functions and End Behavior',
          'Rational Functions and Zeros', 'Rational Functions and Vertical Asymptotes',
          'Rational Functions and Holes', 'Equivalent Representations of Polynomial and Rational Expressions',
          'Transformations of Functions', 'Function Model Selection and Assumption Articulation',
          'Function Model Construction and Application',
        ]
      },
      {
        name: 'Unit 2: Exponential and Logarithmic Functions',
        topics: [
          'Arithmetic and Geometric Sequences', 'Geometric Series',
          'Exponential Functions', 'Exponential Function Manipulation',
          'Exponential Function Context and Data Modeling',
          'Competing Function Model Validation',
          'Composition of Functions', 'Inverse Functions',
          'Logarithmic Expressions', 'Logarithmic Functions',
          'Logarithmic Function Manipulation',
          'Exponential and Logarithmic Equations and Inequalities',
          'Exponential Function Context and Data Modeling (advanced)',
          'Semi-log Plots',
        ]
      },
      {
        name: 'Unit 3: Trigonometric and Polar Functions',
        topics: [
          'Periodic Phenomena', 'Sine, Cosine, and Tangent',
          'Sine and Cosine Function Values', 'Sine and Cosine Function Graphs',
          'Sinusoidal Functions', 'Sinusoidal Function Transformations',
          'Sinusoidal Function Context and Data Modeling',
          'The Tangent Function', 'Inverse Trigonometric Functions',
          'Trigonometric Equations and Inequalities',
          'The Secant, Cosecant, and Cotangent Functions',
          'Equivalent Representations of Trigonometric Functions',
          'Trigonometry and Polar Coordinates',
          'Polar Function Graphs', 'Rates of Change in Polar Functions',
        ]
      },
      {
        name: 'Unit 4: Functions Involving Parameters, Vectors, and Matrices',
        topics: [
          'Parametric Functions', 'Parametric Functions Modeling Planar Motion',
          'Parametric Functions and Rates of Change',
          'Implicitly Defined Functions',
          'Conic Sections',
          'Vectors', 'Vector-Valued Functions',
          'Matrix Representations of Systems of Equations',
          'The Inverse and Determinant of a Matrix',
          'Linear Transformations and Matrices',
          'Matrices as Functions', 'Matrices Modeling Contexts',
        ]
      },
    ]
  },
  {
    subject: 'AP Calculus AB',
    id: 'ap_calc_ab',
    category: 'Math & CS',
    units: [
      { name: 'Limits & Continuity', topics: ['Limits graphically/numerically', 'Squeeze theorem', 'Continuity'] },
      { name: 'Differentiation', topics: ['Derivative definition', 'Power rule', 'Chain rule', 'Implicit differentiation'] },
      { name: 'Applications of Differentiation', topics: ['Related rates', 'Optimization', 'Mean Value Theorem', 'L\'Hôpital\'s Rule'] },
      { name: 'Integration & Accumulation', topics: ['Riemann sums', 'Fundamental Theorem', 'U-substitution'] },
      { name: 'Differential Equations', topics: ['Slope fields', 'Separation of variables', 'Exponential models'] },
      { name: 'Applications of Integration', topics: ['Area between curves', 'Volume of solids', 'Particle motion'] },
    ]
  },
  {
    subject: 'AP Calculus BC',
    id: 'ap_calc_bc',
    category: 'Math & CS',
    units: [
      { name: 'Limits & Continuity', topics: ['Limits', 'Continuity', 'L\'Hôpital\'s Rule'] },
      { name: 'Differentiation', topics: ['All AB topics', 'Parametric derivatives', 'Polar derivatives'] },
      { name: 'Integration', topics: ['Integration by parts', 'Partial fractions', 'Improper integrals'] },
      { name: 'Differential Equations', topics: ['Logistic growth', 'Euler\'s method'] },
      { name: 'Sequences & Series', topics: ['Convergence tests', 'Taylor series', 'Power series', 'Radius of convergence'] },
      { name: 'Parametric & Polar', topics: ['Parametric motion', 'Polar area', 'Arc length'] },
    ]
  },
  {
    subject: 'AP Statistics',
    id: 'ap_statistics',
    category: 'Math & CS',
    units: [
      { name: 'Exploring One-Variable Data', topics: ['Distributions', 'Measures of center/spread', 'Normal distribution'] },
      { name: 'Exploring Two-Variable Data', topics: ['Scatterplots', 'Correlation', 'Least squares regression'] },
      { name: 'Collecting Data', topics: ['Sampling methods', 'Experimental design', 'Bias'] },
      { name: 'Probability', topics: ['Basic probability', 'Conditional probability', 'Random variables'] },
      { name: 'Sampling Distributions', topics: ['Central Limit Theorem', 'Sampling distributions'] },
      { name: 'Inference', topics: ['Confidence intervals', 'Hypothesis testing', 'Chi-square tests', 'Regression inference'] },
    ]
  },
  {
    subject: 'AP Computer Science A',
    id: 'ap_cs_a',
    category: 'Math & CS',
    units: [
      { name: 'Primitive Types', topics: ['int, double, boolean', 'Casting', 'Math class'] },
      { name: 'Using Objects', topics: ['String methods', 'Wrapper classes', 'Math methods'] },
      { name: 'Boolean Expressions & Conditionals', topics: ['if/else', 'switch', 'De Morgan\'s laws'] },
      { name: 'Iteration', topics: ['for, while, do-while', 'Nested loops', 'Loop algorithms'] },
      { name: 'Writing Classes', topics: ['Constructors', 'Methods', 'Encapsulation'] },
      { name: 'Array & ArrayList', topics: ['Arrays', 'ArrayList', 'Traversals', 'Algorithms'] },
      { name: 'Inheritance & Recursion', topics: ['Polymorphism', 'Abstract classes', 'Recursion'] },
    ]
  },
  {
    subject: 'AP Physics 1',
    id: 'ap_physics_1',
    category: 'Science',
    units: [
      { name: 'Kinematics', topics: ['1D motion', '2D motion', 'Projectile motion', 'Vectors'] },
      { name: "Newton's Laws", topics: ['Free body diagrams', 'Net force', 'Friction', 'Inclined planes'] },
      { name: 'Work, Energy & Power', topics: ['Work-energy theorem', 'Conservation of energy', 'Power'] },
      { name: 'Systems & Momentum', topics: ['Impulse', 'Conservation of momentum', 'Collisions'] },
      { name: 'Rotation', topics: ['Torque', 'Angular momentum', 'Rotational kinematics'] },
      { name: 'Oscillations', topics: ['Simple harmonic motion', 'Springs', 'Pendulums'] },
      { name: 'Waves & Sound', topics: ['Wave properties', 'Interference', 'Doppler effect'] },
    ]
  },
  {
    subject: 'AP Physics 2',
    id: 'ap_physics_2',
    category: 'Science',
    units: [
      { name: 'Fluids', topics: ['Pressure', 'Buoyancy', 'Bernoulli\'s equation', 'Fluid dynamics'] },
      { name: 'Thermodynamics', topics: ['Heat engines', 'Laws of thermodynamics', 'Entropy'] },
      { name: 'Electric Force & Field', topics: ['Coulomb\'s law', 'Electric field', 'Gauss\'s law'] },
      { name: 'Electric Potential & Circuits', topics: ['Potential energy', 'Capacitors', 'Ohm\'s law', 'Kirchhoff\'s rules'] },
      { name: 'Magnetism', topics: ['Magnetic force', 'Biot-Savart law', 'Electromagnetic induction'] },
      { name: 'Optics & Modern Physics', topics: ['Geometric optics', 'Wave optics', 'Quantum mechanics', 'Nuclear physics'] },
    ]
  },
  {
    subject: 'AP Physics C: Mechanics',
    id: 'ap_physics_c_mech',
    category: 'Science',
    units: [
      { name: 'Kinematics', topics: ['Calculus-based kinematics', 'Motion equations'] },
      { name: "Newton's Laws", topics: ['Variable forces', 'Non-constant acceleration'] },
      { name: 'Work, Energy & Power', topics: ['Work as integral', 'Conservative forces', 'Potential energy functions'] },
      { name: 'Systems & Momentum', topics: ['Impulse integral', 'Center of mass'] },
      { name: 'Rotation', topics: ['Moment of inertia integrals', 'Angular momentum'] },
      { name: 'Oscillations & Gravitation', topics: ['SHM calculus derivation', 'Universal gravitation', 'Orbits'] },
    ]
  },
  {
    subject: 'AP Chemistry',
    id: 'ap_chemistry',
    category: 'Science',
    units: [
      { name: 'Atomic Structure', topics: ['Electron configuration', 'Periodic trends', 'Quantum numbers'] },
      { name: 'Molecular Bonding', topics: ['VSEPR', 'Polarity', 'Hybridization', 'Lewis structures'] },
      { name: 'Intermolecular Forces', topics: ['IMFs', 'Phase diagrams', 'Solutions'] },
      { name: 'Chemical Reactions', topics: ['Stoichiometry', 'Reaction types', 'Net ionic equations'] },
      { name: 'Kinetics', topics: ['Rate laws', 'Mechanisms', 'Activation energy', 'Arrhenius equation'] },
      { name: 'Thermodynamics', topics: ['Enthalpy', 'Entropy', 'Gibbs free energy', 'Hess\'s law'] },
      { name: 'Equilibrium', topics: ['Keq expressions', 'Le Chatelier\'s principle', 'ICE tables'] },
      { name: 'Acids & Bases', topics: ['pH/pOH', 'Buffers', 'Titrations', 'Ka/Kb'] },
      { name: 'Electrochemistry', topics: ['Galvanic cells', 'Electrolysis', 'Nernst equation'] },
    ]
  },
  {
    subject: 'AP Biology',
    id: 'ap_biology',
    category: 'Science',
    units: [
      { name: 'Chemistry of Life', topics: ['Macromolecules', 'Water properties', 'Enzyme function'] },
      { name: 'Cell Structure & Function', topics: ['Organelles', 'Membrane transport', 'Cell signaling'] },
      { name: 'Cellular Energetics', topics: ['Photosynthesis', 'Cellular respiration', 'Fermentation'] },
      { name: 'Cell Communication & Division', topics: ['Signal transduction', 'Mitosis', 'Meiosis'] },
      { name: 'Heredity', topics: ['Mendelian genetics', 'Non-Mendelian', 'Chi-square analysis'] },
      { name: 'Gene Expression', topics: ['DNA replication', 'Transcription', 'Translation', 'Regulation'] },
      { name: 'Natural Selection', topics: ['Evolution evidence', 'Hardy-Weinberg', 'Speciation'] },
      { name: 'Ecology', topics: ['Population ecology', 'Community interactions', 'Energy flow', 'Biogeochemical cycles'] },
    ]
  },
  {
    subject: 'AP Environmental Science',
    id: 'ap_env_science',
    category: 'Science',
    units: [
      { name: 'The Living World', topics: ['Ecosystems', 'Biodiversity', 'Population ecology'] },
      { name: 'Populations', topics: ['Population growth models', 'Carrying capacity'] },
      { name: 'Earth Systems & Resources', topics: ['Plate tectonics', 'Soil', 'Atmosphere', 'Water'] },
      { name: 'Land & Water Use', topics: ['Agriculture', 'Deforestation', 'Irrigation'] },
      { name: 'Energy Resources', topics: ['Fossil fuels', 'Renewables', 'Nuclear energy'] },
      { name: 'Atmospheric Pollution', topics: ['Air pollutants', 'Ozone', 'Acid rain', 'Indoor pollution'] },
      { name: 'Aquatic & Terrestrial Pollution', topics: ['Water pollution', 'Solid waste', 'Pesticides'] },
      { name: 'Global Change', topics: ['Climate change', 'Ocean acidification', 'Global treaties'] },
    ]
  },
  {
    subject: 'AP US History',
    id: 'ap_us_history',
    category: 'History & Social Studies',
    units: [
      { name: 'Period 1: 1491–1607', topics: ['Native American societies', 'European exploration', 'Columbian Exchange'] },
      { name: 'Period 2: 1607–1754', topics: ['Colonial settlement', 'Slavery origins', 'Colonial economies'] },
      { name: 'Period 3: 1754–1800', topics: ['Revolution', 'Constitutional debates', 'Early republic'] },
      { name: 'Period 4: 1800–1848', topics: ['Market revolution', 'Jacksonian democracy', 'Antebellum reform'] },
      { name: 'Period 5: 1844–1877', topics: ['Manifest Destiny', 'Civil War causes', 'Reconstruction'] },
      { name: 'Period 6: 1865–1898', topics: ['Industrialization', 'Gilded Age', 'Populism'] },
      { name: 'Period 7: 1890–1945', topics: ['Progressivism', 'WWI', 'New Deal', 'WWII'] },
      { name: 'Period 8: 1945–1980', topics: ['Cold War', 'Civil Rights', 'Great Society', 'Vietnam'] },
      { name: 'Period 9: 1980–Present', topics: ['Reagan revolution', 'End of Cold War', 'Post-9/11 era'] },
    ]
  },
  {
    subject: 'AP World History',
    id: 'ap_world_history',
    category: 'History & Social Studies',
    units: [
      { name: 'Global Tapestry', topics: ['Afro-Eurasian civilizations', 'Americas', 'Dar al-Islam'] },
      { name: 'Networks of Exchange', topics: ['Silk Roads', 'Indian Ocean', 'Mongol Empire'] },
      { name: 'Land-Based Empires', topics: ['Gunpowder empires', 'Ottoman', 'Mughal', 'Qing'] },
      { name: 'Transoceanic Interconnections', topics: ['Columbian Exchange', 'Atlantic slave trade', 'Maritime empires'] },
      { name: 'Revolutions', topics: ['Enlightenment', 'American Revolution', 'French Revolution', 'Haitian Revolution'] },
      { name: 'Consequences of Industrialization', topics: ['Industrial capitalism', 'Imperialism', 'Social Darwinism'] },
      { name: 'Global Conflict', topics: ['WWI', 'WWII', 'Causes and effects'] },
      { name: 'Cold War & Decolonization', topics: ['Superpower rivalry', 'Independence movements', 'Non-Aligned'] },
      { name: 'Globalization', topics: ['Economic interdependence', 'Technology', 'Migration', 'Climate'] },
    ]
  },
  {
    subject: 'AP European History',
    id: 'ap_euro_history',
    category: 'History & Social Studies',
    units: [
      { name: 'Renaissance & Reformation', topics: ['Humanism', 'Protestant Reformation', 'Counter-Reformation'] },
      { name: 'Absolutism & Constitutionalism', topics: ['Louis XIV', 'English Civil War', 'Glorious Revolution'] },
      { name: 'Scientific Revolution & Enlightenment', topics: ['Copernicus to Newton', 'Philosophes', 'Political thought'] },
      { name: 'French Revolution & Napoleon', topics: ['Causes', 'Phases', 'Napoleonic era', 'Legacy'] },
      { name: 'Industrialization', topics: ['British industrialization', 'Social impacts', 'Capitalism vs. socialism'] },
      { name: 'Nationalism & Imperialism', topics: ['German/Italian unification', 'Scramble for Africa', 'Social Darwinism'] },
      { name: 'WWI & Interwar', topics: ['Causes of WWI', 'Paris Peace', 'Rise of fascism', 'Great Depression'] },
      { name: 'WWII & Cold War Europe', topics: ['WWII causes', 'Holocaust', 'Cold War division', 'Marshall Plan'] },
    ]
  },
  {
    subject: 'AP US Government & Politics',
    id: 'ap_us_gov',
    category: 'History & Social Studies',
    units: [
      { name: 'Foundations of Democracy', topics: ['Enlightenment influences', 'Articles of Confederation', 'Constitutional Convention'] },
      { name: 'Interactions Among Branches', topics: ['Congress', 'Presidency', 'Judiciary', 'Checks and balances'] },
      { name: 'Civil Liberties & Rights', topics: ['Bill of Rights', 'Due process', 'Equal protection', 'Key Supreme Court cases'] },
      { name: 'American Political Ideologies', topics: ['Liberal vs. conservative', 'Political socialization', 'Public opinion'] },
      { name: 'Political Participation', topics: ['Voting', 'Political parties', 'Interest groups', 'Media'] },
    ]
  },
  {
    subject: 'AP Comparative Government',
    id: 'ap_comp_gov',
    category: 'History & Social Studies',
    units: [
      { name: 'Political Systems', topics: ['Regime types', 'Democratic vs. authoritarian'] },
      { name: 'Case Studies', topics: ['UK', 'Russia', 'China', 'Iran', 'Nigeria', 'Mexico'] },
      { name: 'Political Institutions', topics: ['Legislatures', 'Executives', 'Judiciaries'] },
      { name: 'Citizens & Society', topics: ['Civil society', 'Political culture', 'Elections'] },
    ]
  },
  {
    subject: 'AP Human Geography',
    id: 'ap_human_geo',
    category: 'History & Social Studies',
    units: [
      { name: 'Thinking Geographically', topics: ['Maps and scale', 'Geographic data', 'Spatial concepts'] },
      { name: 'Population & Migration', topics: ['Population models', 'Push/pull factors', 'Migration patterns'] },
      { name: 'Cultural Patterns', topics: ['Culture regions', 'Language diffusion', 'Religion geography'] },
      { name: 'Political Organization', topics: ['State sovereignty', 'Boundaries', 'Supranational organizations'] },
      { name: 'Agriculture & Rural Land Use', topics: ['Agricultural revolutions', 'Land use models', 'Sustainability'] },
      { name: 'Cities & Urban Land Use', topics: ['Urbanization', 'Urban models', 'Gentrification'] },
      { name: 'Industrial & Economic Development', topics: ['Development measures', 'Trade', 'Global economic patterns'] },
    ]
  },
  {
    subject: 'AP Psychology',
    id: 'ap_psychology',
    category: 'History & Social Studies',
    units: [
      { name: 'Scientific Foundations', topics: ['History', 'Research methods', 'Statistics'] },
      { name: 'Biological Bases', topics: ['Neurons', 'Brain anatomy', 'Genetics and behavior'] },
      { name: 'Sensation & Perception', topics: ['Sensory processes', 'Perceptual illusions', 'Signal detection'] },
      { name: 'Learning', topics: ['Classical conditioning', 'Operant conditioning', 'Observational learning'] },
      { name: 'Cognitive Psychology', topics: ['Memory models', 'Problem solving', 'Language'] },
      { name: 'Developmental Psychology', topics: ['Stages', 'Attachment theory', 'Moral development'] },
      { name: 'Motivation & Emotion', topics: ['Motivation theories', 'Emotion theories', 'Stress'] },
      { name: 'Clinical Psychology', topics: ['Psychological disorders', 'DSM', 'Treatment approaches'] },
      { name: 'Social Psychology', topics: ['Attitudes', 'Conformity', 'Prejudice', 'Aggression'] },
    ]
  },
  {
    subject: 'AP Macroeconomics',
    id: 'ap_macro',
    category: 'History & Social Studies',
    units: [
      { name: 'Basic Economic Concepts', topics: ['Scarcity', 'Opportunity cost', 'PPC', 'Comparative advantage'] },
      { name: 'Economic Indicators', topics: ['GDP', 'Unemployment', 'Inflation', 'CPI'] },
      { name: 'Aggregate Demand & Supply', topics: ['AD/AS model', 'Fiscal policy', 'Multiplier effect'] },
      { name: 'Financial Sector', topics: ['Money supply', 'Banking', 'Federal Reserve', 'Monetary policy'] },
      { name: 'Long-Run Consequences', topics: ['Economic growth', 'Loanable funds market'] },
      { name: 'Open Economy', topics: ['Balance of payments', 'Exchange rates', 'Trade deficits'] },
    ]
  },
  {
    subject: 'AP Microeconomics',
    id: 'ap_micro',
    category: 'History & Social Studies',
    units: [
      { name: 'Basic Economic Concepts', topics: ['Supply and demand', 'Elasticity', 'Consumer/producer surplus'] },
      { name: 'Production, Cost & Perfect Competition', topics: ['Production function', 'Cost curves', 'Profit maximization'] },
      { name: 'Imperfect Competition', topics: ['Monopoly', 'Monopolistic competition', 'Oligopoly', 'Game theory'] },
      { name: 'Factor Markets', topics: ['Labor markets', 'Marginal resource cost', 'Wage determination'] },
      { name: 'Market Failure & Government', topics: ['Externalities', 'Public goods', 'Income distribution', 'Government intervention'] },
    ]
  },
  {
    subject: 'AP English Language',
    id: 'ap_english_lang',
    category: 'English & Arts',
    units: [
      { name: 'Rhetorical Situation', topics: ['Exigence', 'Audience', 'Purpose', 'Context'] },
      { name: 'Claims & Evidence', topics: ['Thesis', 'Evidence types', 'Source evaluation'] },
      { name: 'Argument', topics: ['Logos', 'Ethos', 'Pathos', 'Fallacies', 'Counterargument'] },
      { name: 'Style', topics: ['Syntax', 'Diction', 'Figurative language', 'Tone'] },
    ]
  },
  {
    subject: 'AP English Literature',
    id: 'ap_english_lit',
    category: 'English & Arts',
    units: [
      { name: 'Short Fiction', topics: ['Character', 'Setting', 'Plot', 'Narrative perspective', 'Symbols'] },
      { name: 'Poetry', topics: ['Structure', 'Speaker', 'Figurative language', 'Sound devices', 'Theme'] },
      { name: 'Longer Fiction & Drama', topics: ['Novel analysis', 'Drama techniques', 'Sustained argument'] },
    ]
  },
  {
    subject: 'AP Spanish Language',
    id: 'ap_spanish',
    category: 'World Languages',
    units: [
      { name: 'Families & Communities', topics: ['Family structures', 'Social roles', 'Community involvement'] },
      { name: 'Science & Technology', topics: ['Digital media', 'Scientific advances', 'Technology ethics'] },
      { name: 'Beauty & Aesthetics', topics: ['Art forms', 'Architecture', 'Literary expression'] },
      { name: 'Education & Careers', topics: ['Educational systems', 'Career paths', 'Professional communication'] },
    ]
  },
  {
    subject: 'AP Art History',
    id: 'ap_art_history',
    category: 'English & Arts',
    units: [
      { name: 'Global Prehistory', topics: ['Cave paintings', 'Megalithic structures', 'Figurines'] },
      { name: 'Ancient Mediterranean', topics: ['Greek art', 'Roman art', 'Egyptian art'] },
      { name: 'Early Europe', topics: ['Medieval art', 'Byzantine', 'Romanesque', 'Gothic'] },
      { name: 'Renaissance', topics: ['Italian Renaissance', 'Northern Renaissance', 'Baroque'] },
      { name: 'Modern Art', topics: ['Impressionism', 'Modernism', 'Postmodernism', 'Contemporary'] },
    ]
  },
];

export const getSubjectById = (id) => AP_SUBJECTS.find(s => s.id === id);
export const getSubjectCategories = () => [...new Set(AP_SUBJECTS.map(s => s.category))];
export const getSubjectsByCategory = (cat) => AP_SUBJECTS.filter(s => s.category === cat);