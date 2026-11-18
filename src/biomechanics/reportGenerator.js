const CATEGORY_FEEDBACK = {
  Excellent: [],
  Good: [
    'Keep practising to make your movement more consistent.',
  ],
  'Needs Improvement': [],
  Poor: [],
  'Insufficient Data': [
    'Keep your full body visible in the camera.',
    'Try again with good lighting and a clear camera view.',
  ],
};

export function generateWorkoutReport({
  exerciseName,
  completedReps = 0,
  targetReps = 0,
  repSamples = [],
} = {}) {
  const feedbackCounts = new Map();
  let goodObservations = 0;
  let warningObservations = 0;
  let validObservations = 0;

  for (const rep of repSamples) {
    for (const sample of rep) {
      if (!sample || typeof sample !== 'object') continue;

      for (const feature of Object.values(sample.features || {})) {
        if (feature.status === 'good') {
          goodObservations += 1;
          validObservations += 1;
        } else if (feature.status === 'warning') {
          warningObservations += 1;
          validObservations += 1;

          if (feature.feedback) {
            feedbackCounts.set(
              feature.feedback,
              (feedbackCounts.get(feature.feedback) || 0) + 1
            );
          }
        }
      }
    }
  }

  let category = 'Insufficient Data';

  if (completedReps > 0 && validObservations >= 5) {
    const goodRatio = goodObservations / validObservations;

    if (goodRatio >= 0.9) {
      category = 'Excellent';
    } else if (goodRatio >= 0.75) {
      category = 'Good';
    } else if (goodRatio >= 0.5) {
      category = 'Needs Improvement';
    } else {
      category = 'Poor';
    }
  }

  const corrections = [...feedbackCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([message]) => message);

  const feedback = corrections.length
    ? corrections
    : [...CATEGORY_FEEDBACK[category]];

  return {
    exerciseName: exerciseName || 'Workout',
    completedReps,
    targetReps,
    category,
    feedback,
    completedAt: new Date().toISOString(),
  };
}