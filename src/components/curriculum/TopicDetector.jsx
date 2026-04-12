import { base44 } from '@/api/base44Client';

// Detect topics from question text using LLM
export async function detectTopicsFromQuestion(questionText, explanation) {
  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this AP exam question and identify 2-3 key curriculum topics it tests.

Question:
"${questionText}"

Explanation:
"${explanation}"

Return ONLY a JSON array of topic names (strings), e.g. ["topic1", "topic2", "topic3"]. Be specific and use official AP curriculum terms.`,
      response_json_schema: {
        type: 'array',
        items: { type: 'string' }
      }
    });

    return (result || []).map(t => t.toLowerCase().trim());
  } catch (e) {
    console.error('Failed to detect topics:', e);
    return [];
  }
}

// List of common AP topic keywords for faster detection
const TOPIC_KEYWORDS = {
  physics_1: {
    kinematics: ['position', 'displacement', 'velocity', 'acceleration', 'motion', 'graph'],
    dynamics: ['force', 'newton', 'friction', 'tension', 'normal force', 'net force'],
    energy: ['work', 'kinetic', 'potential', 'conservation', 'power'],
    momentum: ['momentum', 'impulse', 'collision', 'elastic', 'inelastic'],
    rotation: ['torque', 'angular', 'moment of inertia', 'rotating', 'spin'],
    shm: ['oscillation', 'spring', 'restoring', 'amplitude', 'period', 'pendulum'],
    waves: ['wave', 'wavelength', 'frequency', 'sound', 'doppler', 'interference']
  },
  calc_ab: {
    limits: ['limit', 'continuity', 'asymptote', 'infinity'],
    derivatives: ['derivative', 'slope', 'rate of change', 'chain rule', 'power rule'],
    applications: ['related rates', 'optimization', 'critical point', 'extrema', 'concavity'],
    integrals: ['integral', 'antiderivative', 'riemann', 'fundamental theorem'],
    differential: ['differential equation', 'slope field', 'separation of variables'],
    areas: ['area between', 'volume', 'disk', 'washer', 'shell method']
  }
};

// Fast topic detection based on keyword matching
export function detectTopicsFromKeywords(questionText, examType = 'physics_1') {
  const text = questionText.toLowerCase();
  const detected = [];
  const keywords = TOPIC_KEYWORDS[examType] || {};

  for (const [topic, words] of Object.entries(keywords)) {
    if (words.some(word => text.includes(word))) {
      detected.push(topic);
    }
  }

  return detected;
}