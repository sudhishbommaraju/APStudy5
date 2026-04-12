// AP Curriculum Map - Official topic definitions per unit
export const AP_CURRICULUM = {
  ap_physics_1: {
    name: 'AP Physics 1',
    units: {
      1: {
        name: 'Kinematics',
        topics: [
          'position', 'displacement', 'velocity', 'speed', 'acceleration',
          'constant velocity motion', 'constant acceleration motion',
          'motion graphs', 'x-t graphs', 'v-t graphs', 'a-t graphs',
          'free fall', 'projectile motion', 'vectors'
        ],
        forbiddenTopics: ['force', 'newton', 'energy', 'momentum', 'torque', 'oscillation', 'wave']
      },
      2: {
        name: 'Dynamics',
        topics: [
          'force', 'newton first law', 'newton second law', 'newton third law',
          'mass', 'weight', 'normal force', 'friction', 'tension',
          'free body diagram', 'net force', 'inclined planes',
          'circular motion', 'centripetal force'
        ],
        forbiddenTopics: ['energy', 'work', 'momentum', 'oscillation', 'wave']
      },
      3: {
        name: 'Work, Energy & Power',
        topics: [
          'work', 'kinetic energy', 'potential energy', 'gravitational potential energy',
          'elastic potential energy', 'work-energy theorem', 'conservation of energy',
          'power', 'mechanical energy', 'energy dissipation'
        ],
        forbiddenTopics: ['momentum', 'impulse', 'torque', 'oscillation']
      },
      4: {
        name: 'Momentum',
        topics: [
          'momentum', 'impulse', 'conservation of momentum', 'collisions',
          'elastic collision', 'inelastic collision', 'perfectly inelastic collision',
          'systems of particles', 'center of mass'
        ],
        forbiddenTopics: ['energy', 'torque', 'oscillation', 'wave']
      },
      5: {
        name: 'Rotation',
        topics: [
          'rotational motion', 'angular velocity', 'angular acceleration',
          'torque', 'rotational inertia', 'moment of inertia', 'angular momentum',
          'rotational kinetic energy', 'rotational dynamics',
          'rolling motion', 'rotational equilibrium'
        ],
        forbiddenTopics: ['linear momentum', 'oscillation', 'wave']
      },
      6: {
        name: 'Simple Harmonic Motion',
        topics: [
          'oscillation', 'simple harmonic motion', 'springs', 'restoring force',
          'hooke\'s law', 'amplitude', 'period', 'frequency', 'phase',
          'energy in SHM', 'pendulum', 'resonance'
        ],
        forbiddenTopics: ['force concepts from other units', 'wave propagation']
      },
      7: {
        name: 'Waves',
        topics: [
          'wave motion', 'transverse waves', 'longitudinal waves', 'wavelength',
          'frequency', 'wave speed', 'superposition', 'interference',
          'standing waves', 'doppler effect', 'sound waves', 'intensity'
        ],
        forbiddenTopics: ['oscillation mechanics', 'energy in SHM']
      }
    }
  },
  ap_calc_ab: {
    name: 'AP Calculus AB',
    units: {
      1: {
        name: 'Limits & Continuity',
        topics: [
          'limits', 'one-sided limits', 'infinite limits', 'limits at infinity',
          'continuity', 'removable discontinuity', 'jump discontinuity',
          'vertical asymptotes', 'horizontal asymptotes', 'squeeze theorem'
        ],
        forbiddenTopics: ['derivatives', 'integrals', 'differential equations']
      },
      2: {
        name: 'Differentiation',
        topics: [
          'derivative', 'derivative definition', 'power rule', 'product rule',
          'quotient rule', 'chain rule', 'implicit differentiation',
          'logarithmic differentiation', 'exponential derivatives'
        ],
        forbiddenTopics: ['integrals', 'differential equations', 'limits basics']
      },
      3: {
        name: 'Applications of Differentiation',
        topics: [
          'related rates', 'optimization', 'local extrema', 'absolute extrema',
          'mean value theorem', 'rolle\'s theorem', 'increasing/decreasing',
          'concavity', 'second derivative test', 'critical points'
        ],
        forbiddenTopics: ['integrals', 'differential equations']
      },
      4: {
        name: 'Integration',
        topics: [
          'antiderivatives', 'indefinite integrals', 'riemann sums',
          'definite integrals', 'fundamental theorem of calculus',
          'u-substitution', 'integration by parts', 'numerical integration'
        ],
        forbiddenTopics: ['derivatives applications', 'differential equations']
      },
      5: {
        name: 'Differential Equations',
        topics: [
          'differential equations', 'slope fields', 'separation of variables',
          'exponential growth/decay', 'logistic models', 'euler\'s method'
        ],
        forbiddenTopics: ['derivatives only', 'advanced integration']
      },
      6: {
        name: 'Applications of Integration',
        topics: [
          'area between curves', 'volume of solids of revolution',
          'disk method', 'washer method', 'shell method',
          'arc length', 'particle motion', 'accumulation functions'
        ],
        forbiddenTopics: ['derivatives', 'differential equations basics']
      }
    }
  },
  ap_biology: {
    name: 'AP Biology',
    units: {
      1: {
        name: 'Chemistry of Life',
        topics: [
          'atoms', 'molecules', 'macromolecules', 'carbohydrates', 'lipids',
          'proteins', 'nucleic acids', 'water properties', 'buffers',
          'ph', 'enzyme function', 'activation energy'
        ],
        forbiddenTopics: ['cell structure', 'genetics', 'photosynthesis']
      },
      2: {
        name: 'Cell Structure & Function',
        topics: [
          'prokaryotic cells', 'eukaryotic cells', 'cell membrane',
          'organelles', 'nucleus', 'mitochondria', 'chloroplasts',
          'endoplasmic reticulum', 'golgi apparatus', 'cell transport',
          'osmosis', 'diffusion'
        ],
        forbiddenTopics: ['genetics', 'photosynthesis', 'evolution']
      },
      3: {
        name: 'Cellular Energetics',
        topics: [
          'atp', 'photosynthesis', 'light reactions', 'dark reactions',
          'cellular respiration', 'glycolysis', 'krebs cycle', 'electron transport',
          'fermentation', 'atp production'
        ],
        forbiddenTopics: ['genetics', 'cell division', 'evolution']
      },
      4: {
        name: 'Cell Communication & Division',
        topics: [
          'cell signaling', 'signal transduction', 'mitosis', 'meiosis',
          'cytokinesis', 'cell cycle', 'checkpoints', 'apoptosis',
          'binary fission'
        ],
        forbiddenTopics: ['evolution', 'photosynthesis', 'inheritance']
      }
    }
  }
};

export function getCurriculumForSubject(subjectId) {
  return AP_CURRICULUM[subjectId];
}

export function getUnitTopics(subjectId, unitId) {
  const subject = AP_CURRICULUM[subjectId];
  if (!subject || !subject.units[unitId]) return [];
  return subject.units[unitId].topics || [];
}

export function getForbiddenTopics(subjectId, unitId) {
  const subject = AP_CURRICULUM[subjectId];
  if (!subject || !subject.units[unitId]) return [];
  return subject.units[unitId].forbiddenTopics || [];
}

export function validateTopicAlignment(subjectId, unitId, detectedTopics) {
  const allowedTopics = getUnitTopics(subjectId, unitId);
  const forbiddenTopics = getForbiddenTopics(subjectId, unitId);

  const normalized = (topics) => topics.map(t => t.toLowerCase().trim());
  const allowedLower = normalized(allowedTopics);
  const forbiddenLower = normalized(forbiddenTopics);
  const detectedLower = normalized(detectedTopics);

  const misalignedTopics = detectedLower.filter(t => 
    !allowedLower.some(a => a.includes(t) || t.includes(a)) &&
    forbiddenLower.some(f => f.includes(t) || t.includes(f))
  );

  return {
    isAligned: misalignedTopics.length === 0,
    misalignedTopics,
    allowedTopics: allowedTopics
  };
}