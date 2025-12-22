import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Check } from 'lucide-react';

const SUBJECTS_DATA = [
  { subject_id: 'ap_calculus_ab', name: 'AP Calculus AB', category: 'Math', icon: '∫' },
  { subject_id: 'ap_calculus_bc', name: 'AP Calculus BC', category: 'Math', icon: '∂' },
  { subject_id: 'ap_statistics', name: 'AP Statistics', category: 'Math', icon: 'σ' },
  { subject_id: 'ap_precalculus', name: 'AP Precalculus', category: 'Math', icon: 'θ' },
  { subject_id: 'ap_biology', name: 'AP Biology', category: 'Science', icon: '🧬' },
  { subject_id: 'ap_chemistry', name: 'AP Chemistry', category: 'Science', icon: '⚗️' },
  { subject_id: 'ap_physics_1', name: 'AP Physics 1', category: 'Science', icon: 'F' },
  { subject_id: 'ap_physics_2', name: 'AP Physics 2', category: 'Science', icon: 'E' },
  { subject_id: 'ap_physics_c_mech', name: 'AP Physics C: Mechanics', category: 'Science', icon: 'v' },
  { subject_id: 'ap_physics_c_em', name: 'AP Physics C: E&M', category: 'Science', icon: 'B' },
  { subject_id: 'ap_environmental_science', name: 'AP Environmental Science', category: 'Science', icon: '🌍' },
  { subject_id: 'ap_english_language', name: 'AP English Language', category: 'English', icon: '📝' },
  { subject_id: 'ap_english_literature', name: 'AP English Literature', category: 'English', icon: '📚' },
  { subject_id: 'ap_us_history', name: 'AP US History', category: 'History', icon: '🗽' },
  { subject_id: 'ap_world_history', name: 'AP World History', category: 'History', icon: '🌐' },
  { subject_id: 'ap_european_history', name: 'AP European History', category: 'History', icon: '🏛️' },
  { subject_id: 'ap_human_geography', name: 'AP Human Geography', category: 'Social Science', icon: '🗺️' },
  { subject_id: 'ap_psychology', name: 'AP Psychology', category: 'Social Science', icon: '🧠' },
  { subject_id: 'ap_macroeconomics', name: 'AP Macroeconomics', category: 'Social Science', icon: '💰' },
  { subject_id: 'ap_microeconomics', name: 'AP Microeconomics', category: 'Social Science', icon: '📊' },
  { subject_id: 'ap_computer_science_a', name: 'AP Computer Science A', category: 'Computer Science', icon: '💻' },
  { subject_id: 'ap_computer_science_principles', name: 'AP CS Principles', category: 'Computer Science', icon: '🖥️' },
  { subject_id: 'ap_art_history', name: 'AP Art History', category: 'Arts', icon: '🖼️' },
  { subject_id: 'ap_music_theory', name: 'AP Music Theory', category: 'Arts', icon: '🎵' },
  { subject_id: 'ap_seminar', name: 'AP Seminar', category: 'Capstone', icon: '💡' },
  { subject_id: 'ap_research', name: 'AP Research', category: 'Capstone', icon: '🔬' },
  { subject_id: 'ap_african_american_studies', name: 'AP African American Studies', category: 'Social Science', icon: '✊' },
  { subject_id: 'sat', name: 'SAT', category: 'Standardized', icon: '📝' },
  { subject_id: 'act', name: 'ACT', category: 'Standardized', icon: '📋' },
];

const UNITS_DATA = {
  ap_calculus_ab: [
    'Limits and Continuity',
    'Differentiation: Definition and Fundamental Properties',
    'Differentiation: Composite, Implicit, and Inverse Functions',
    'Contextual Applications of Differentiation',
    'Analytical Applications of Differentiation',
    'Integration and Accumulation of Change',
    'Differential Equations',
    'Applications of Integration',
  ],
  ap_calculus_bc: [
    'Limits and Continuity',
    'Differentiation: Definition and Fundamental Properties',
    'Differentiation: Composite, Implicit, and Inverse Functions',
    'Contextual Applications of Differentiation',
    'Analytical Applications of Differentiation',
    'Integration and Accumulation of Change',
    'Differential Equations',
    'Applications of Integration',
    'Parametric, Polar, and Vector-Valued Functions',
    'Infinite Sequences and Series',
  ],
  ap_statistics: [
    'Exploring One-Variable Data',
    'Exploring Two-Variable Data',
    'Collecting Data',
    'Probability, Random Variables, and Probability Distributions',
    'Sampling Distributions',
    'Inference for Categorical Data',
    'Inference for Quantitative Data',
  ],
  ap_precalculus: [
    'Polynomial and Rational Functions',
    'Exponential and Logarithmic Functions',
    'Trigonometric and Polar Functions',
    'Functions Involving Parameters, Vectors, and Matrices',
  ],
  ap_biology: [
    'Chemistry of Life',
    'Cell Structure and Function',
    'Cellular Energetics',
    'Cell Communication and Cell Cycle',
    'Heredity',
    'Gene Expression and Regulation',
    'Natural Selection',
    'Ecology',
  ],
  ap_chemistry: [
    'Atomic Structure and Properties',
    'Molecular and Ionic Compound Structure',
    'Intermolecular Forces and Properties',
    'Chemical Reactions',
    'Kinetics',
    'Thermodynamics',
    'Equilibrium',
    'Acids and Bases',
    'Applications of Thermodynamics',
  ],
  ap_physics_1: [
    'Kinematics',
    'Dynamics',
    'Circular Motion and Gravitation',
    'Energy',
    'Momentum',
    'Simple Harmonic Motion',
    'Torque and Rotational Motion',
  ],
  ap_physics_2: [
    'Fluids',
    'Thermodynamics',
    'Electric Force, Field, and Potential',
    'Electric Circuits',
    'Magnetism and Electromagnetic Induction',
    'Geometric and Physical Optics',
    'Quantum, Atomic, and Nuclear Physics',
  ],
  ap_physics_c_mech: [
    'Kinematics',
    'Newton\'s Laws of Motion',
    'Work, Energy, and Power',
    'Systems of Particles and Linear Momentum',
    'Circular Motion and Rotation',
    'Oscillations and Gravitation',
  ],
  ap_physics_c_em: [
    'Electrostatics',
    'Conductors, Capacitors, and Dielectrics',
    'Electric Circuits',
    'Magnetic Fields',
    'Electromagnetism',
  ],
  ap_environmental_science: [
    'The Living World: Ecosystems',
    'The Living World: Biodiversity',
    'Populations',
    'Earth Systems and Resources',
    'Land and Water Use',
    'Energy Resources and Consumption',
    'Atmospheric Pollution',
    'Aquatic and Terrestrial Pollution',
    'Global Change',
  ],
  ap_english_language: [
    'Rhetorical Situation',
    'Claims and Evidence',
    'Reasoning and Organization',
    'Style',
  ],
  ap_english_literature: [
    'Short Fiction',
    'Poetry',
    'Longer Fiction or Drama',
  ],
  ap_us_history: [
    'Period 1: 1491–1607',
    'Period 2: 1607–1754',
    'Period 3: 1754–1800',
    'Period 4: 1800–1848',
    'Period 5: 1844–1877',
    'Period 6: 1865–1898',
    'Period 7: 1890–1945',
    'Period 8: 1945–1980',
    'Period 9: 1980–Present',
  ],
  ap_world_history: [
    'The Global Tapestry',
    'Networks of Exchange',
    'Land-Based Empires',
    'Transoceanic Interconnections',
    'Revolutions',
    'Consequences of Industrialization',
    'Global Conflict',
    'Cold War and Decolonization',
    'Globalization',
  ],
  ap_european_history: [
    'Renaissance and Exploration',
    'Age of Reformation',
    'Absolutism and Constitutionalism',
    'Scientific, Philosophical, and Political Developments',
    'Conflict, Crisis, and Reaction',
    'Industrialization and Its Effects',
    '20th-Century Global Conflicts',
    'Cold War and Contemporary Europe',
  ],
  ap_human_geography: [
    'Thinking Geographically',
    'Population and Migration Patterns',
    'Cultural Patterns and Processes',
    'Political Patterns and Processes',
    'Agriculture and Rural Land-Use',
    'Cities and Urban Land-Use',
    'Industrial and Economic Development',
  ],
  ap_psychology: [
    'Scientific Foundations of Psychology',
    'Biological Bases of Behavior',
    'Sensation and Perception',
    'Learning',
    'Cognitive Psychology',
    'Developmental Psychology',
    'Motivation, Emotion, and Personality',
    'Clinical Psychology',
    'Social Psychology',
  ],
  ap_macroeconomics: [
    'Basic Economic Concepts',
    'Economic Indicators and the Business Cycle',
    'National Income and Price Determination',
    'Financial Sector',
    'Long-Run Consequences of Stabilization Policies',
    'Open Economy – International Trade and Finance',
  ],
  ap_microeconomics: [
    'Basic Economic Concepts',
    'Supply and Demand',
    'Production, Cost, and the Perfect Competition Model',
    'Imperfect Competition',
    'Factor Markets',
    'Market Failure and the Role of Government',
  ],
  ap_computer_science_a: [
    'Primitive Types',
    'Using Objects',
    'Boolean Expressions and If Statements',
    'Iteration',
    'Writing Classes',
    'Array',
    'ArrayList',
    '2D Array',
    'Inheritance',
    'Recursion',
  ],
  ap_computer_science_principles: [
    'Creative Development',
    'Data',
    'Algorithms and Programming',
    'Computer Systems and Networks',
    'Impact of Computing',
  ],
  ap_art_history: [
    'Global Prehistory',
    'Ancient Mediterranean',
    'Early Europe and Colonial Americas',
    'Later Europe and Americas',
    'Indigenous Americas',
    'Africa',
    'West and Central Asia',
    'South, East, and Southeast Asia',
    'The Pacific',
    'Global Contemporary',
  ],
  ap_music_theory: [
    'Musical Notation',
    'Basic Harmony',
    'Voice Leading and Harmonic Progression',
    'Form',
    'Analysis',
    'Composition Techniques',
  ],
  ap_seminar: [
    'Question and Explore',
    'Understand and Analyze',
    'Evaluate Multiple Perspectives',
    'Synthesize Ideas',
    'Team, Transform, and Transmit',
  ],
  ap_research: [
    'Research Question Development',
    'Literature Review',
    'Research Methods',
    'Data Analysis',
    'Academic Writing and Presentation',
  ],
  ap_african_american_studies: [
    'Origins of the African Diaspora',
    'Freedom, Enslavement, and Resistance',
    'The Practice of Freedom',
    'Movements and Debates',
  ],
  sat: [
    'Math',
    'Reading and Writing',
  ],
  act: [
    'Math',
    'English',
    'Reading',
    'Science',
  ],
};

export default function SeedData() {
  const [seeding, setSeeding] = useState(false);
  const [done, setDone] = useState(false);

  const seedDatabase = async () => {
    setSeeding(true);
    try {
      // Create all subjects
      for (const subject of SUBJECTS_DATA) {
        await base44.entities.Subject.create(subject);
      }

      // Create all units
      for (const [subjectId, units] of Object.entries(UNITS_DATA)) {
        const subject = SUBJECTS_DATA.find(s => s.subject_id === subjectId);
        for (let i = 0; i < units.length; i++) {
          await base44.entities.Unit.create({
            subject_id: subjectId,
            subject_name: subject.name,
            unit_number: i + 1,
            unit_name: units[i],
          });
        }
      }

      setDone(true);
    } catch (e) {
      console.error('Seeding failed:', e);
    }
    setSeeding(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 p-8 max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Seed Database</h1>
        <p className="text-slate-600 mb-6">
          Click below to populate the database with all AP subjects and units.
        </p>
        <Button 
          onClick={seedDatabase} 
          disabled={seeding || done}
          className="w-full"
        >
          {seeding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {done && <Check className="w-4 h-4 mr-2" />}
          {done ? 'Database Seeded!' : seeding ? 'Seeding...' : 'Seed Database'}
        </Button>
      </div>
    </div>
  );
}