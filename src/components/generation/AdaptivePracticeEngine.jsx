/**
 * Adaptive Difficulty Engine (lightweight, in-memory + localStorage)
 * Tracks accuracy and speed per subject/unit, adjusts difficulty dynamically.
 */

const STORAGE_KEY = 'adaptive_perf';
const HIGH_THRESHOLD = 0.75;   // >75% accuracy → increase difficulty
const LOW_THRESHOLD  = 0.50;   // <50% accuracy → decrease difficulty
const MIN_SAMPLES    = 3;       // Need at least 3 answers before adjusting

function loadPerf() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function savePerf(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function key(subjectId, unitId) {
  return `${subjectId}__${unitId}`;
}

/**
 * Record the outcome of one answered question.
 * @param {string} subjectId
 * @param {string|number} unitId
 * @param {boolean} isCorrect
 * @param {number} timeSpentMs  - milliseconds the user took to answer
 */
export function recordAnswer(subjectId, unitId, isCorrect, timeSpentMs = 0) {
  const perf = loadPerf();
  const k = key(subjectId, unitId);

  if (!perf[k]) {
    perf[k] = { attempts: 0, correct: 0, totalTimeMs: 0, difficulty: 'medium' };
  }

  perf[k].attempts  += 1;
  perf[k].correct   += isCorrect ? 1 : 0;
  perf[k].totalTimeMs += timeSpentMs;

  // Recalculate difficulty after MIN_SAMPLES
  if (perf[k].attempts >= MIN_SAMPLES) {
    const accuracy = perf[k].correct / perf[k].attempts;
    const avgTimeS  = perf[k].totalTimeMs / perf[k].attempts / 1000;

    if (accuracy >= HIGH_THRESHOLD && avgTimeS < 30) {
      perf[k].difficulty = 'hard';
    } else if (accuracy < LOW_THRESHOLD || avgTimeS > 90) {
      perf[k].difficulty = 'easy';
    } else {
      perf[k].difficulty = 'medium';
    }
  }

  savePerf(perf);
}

/**
 * Get the recommended difficulty for a subject/unit.
 * Returns 'easy' | 'medium' | 'hard'
 */
export function getRecommendedDifficulty(subjectId, unitId) {
  const perf = loadPerf();
  return perf[key(subjectId, unitId)]?.difficulty ?? 'medium';
}

/**
 * Get full performance stats for display.
 */
export function getPerformanceStats(subjectId, unitId) {
  const perf = loadPerf();
  const data = perf[key(subjectId, unitId)];
  if (!data || data.attempts === 0) return null;

  return {
    attempts: data.attempts,
    accuracy: Math.round((data.correct / data.attempts) * 100),
    avgTimeS: Math.round(data.totalTimeMs / data.attempts / 1000),
    difficulty: data.difficulty
  };
}