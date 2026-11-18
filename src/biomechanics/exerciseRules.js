
const VISIBILITY_THRESHOLD = 0.6;
const ANGLE_TOLERANCE = 10;
const SYMMETRY_TOLERANCE = 15;

const LANDMARKS = {
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
};

const ANGLE_LANDMARKS = {
  leftElbow: ['leftShoulder', 'leftElbow', 'leftWrist'],
  rightElbow: ['rightShoulder', 'rightElbow', 'rightWrist'],
  leftKnee: ['leftHip', 'leftKnee', 'leftAnkle'],
  rightKnee: ['rightHip', 'rightKnee', 'rightAnkle'],
  leftArmElevation: ['leftHip', 'leftShoulder', 'leftElbow'],
  rightArmElevation: ['rightHip', 'rightShoulder', 'rightElbow'],
  bodyAlignment: ['leftShoulder', 'leftHip', 'leftAnkle'],
};

const RULES = {
  pushups: {
    name: 'Push-ups',
    cameraView: 'side',
    features: {
      bodyAlignment: {
        type: 'angle',
        keys: ['bodyAlignment'],
        target: [165, 180],
        weight: 50,
        feedback: 'Keep your shoulders, hips and ankles aligned.',
      },
      elbowRange: {
        type: 'angle',
        keys: ['leftElbow', 'rightElbow'],
        target: [70, 110],
        weight: 50,
        feedback: 'Lower your body through a controlled elbow range.',
      },
    },
  },

  squats: {
    name: 'Squats',
    cameraView: 'side',
    features: {
      squatDepth: {
        type: 'angle',
        keys: ['leftKnee', 'rightKnee'],
        target: [60, 100],
        weight: 100,
        feedback: 'Work towards your selected squat-depth target.',
      },
    },
  },

  lateralRaises: {
    name: 'Lateral Raises',
    cameraView: 'front',
    features: {
      armElevation: {
        type: 'angle',
        keys: ['leftArmElevation', 'rightArmElevation'],
        target: [70, 100],
        weight: 40,
        feedback: 'Raise your arms to a comfortable shoulder-height position.',
      },
      armSymmetry: {
        type: 'symmetry',
        keys: ['leftArmElevation', 'rightArmElevation'],
        weight: 40,
        feedback: 'Keep both arms at a similar height.',
      },
      elbowStability: {
        type: 'angle',
        keys: ['leftElbow', 'rightElbow'],
        target: [150, 180],
        weight: 20,
        feedback: 'Maintain a consistent elbow position.',
      },
    },
  },

  bicepCurls: {
    name: 'Bicep Curls',
    cameraView: 'side',
    features: {
      elbowRange: {
        type: 'angle',
        keys: ['leftElbow', 'rightElbow'],
        target: [40, 70],
        weight: 100,
        feedback: 'Curl through a controlled range of motion.',
      },
    },
  },
};

function validAngle(value) {
  return Number.isFinite(value) && value >= 0 && value <= 180;
}

function landmarksVisible(landmarks, angleKeys) {
  if (!Array.isArray(landmarks)) return false;

  const required = [
    ...new Set(angleKeys.flatMap((key) => ANGLE_LANDMARKS[key] || [])),
  ];

  if (!required.length) return false;

  return required.every((name) => {
    const point = landmarks[LANDMARKS[name]];

    return (
      point &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      (point.visibility ?? 1) >= VISIBILITY_THRESHOLD
    );
  });
}

function evaluateAngleFeature(angles, config, landmarks) {
  const values = config.keys
    .map((key) => ({ key, value: angles[key] }))
    .filter(({ key, value }) =>
      validAngle(value) &&
      landmarksVisible(landmarks, [key])
    );

  if (!values.length) {
    return {
      status: 'unavailable',
      score: null,
      reason: 'Required joints are not clearly visible.',
    };
  }

  const measurements = values.map(({ key, value }) => {
    const [min, max] = config.target;
    const difference =
      value < min ? min - value : value > max ? value - max : 0;

    return {
      angleKey: key,
      angle: value,
      target: config.target,
      difference: Number(difference.toFixed(1)),
      score: Math.max(0, 100 - difference * 3),
      withinRange: difference === 0,
    };
  });

  const score =
    measurements.reduce((sum, item) => sum + item.score, 0) /
    measurements.length;

  const warning = measurements.some(
    (item) => item.difference > ANGLE_TOLERANCE
  );

  return {
    status: warning ? 'warning' : 'good',
    score: Number(score.toFixed(1)),
    measurements,
    deviationDetected: warning,
  };
}

function evaluateSymmetryFeature(angles, config, landmarks) {
  const [leftKey, rightKey] = config.keys;
  const left = angles[leftKey];
  const right = angles[rightKey];

  if (
    !validAngle(left) ||
    !validAngle(right) ||
    !landmarksVisible(landmarks, config.keys)
  ) {
    return {
      status: 'unavailable',
      score: null,
      reason: 'Both sides must be visible to assess symmetry.',
    };
  }

  const difference = Math.abs(left - right);
  const excess = Math.max(0, difference - SYMMETRY_TOLERANCE);
  const score = Math.max(0, 100 - excess * 3);

  return {
    status: difference > SYMMETRY_TOLERANCE ? 'warning' : 'good',
    score: Number(score.toFixed(1)),
    leftAngle: left,
    rightAngle: right,
    difference: Number(difference.toFixed(1)),
    deviationDetected: difference > SYMMETRY_TOLERANCE,
  };
}

export function evaluateExerciseForm({
  exerciseId,
  angles = {},
  landmarks = null,
  cameraView = null,
} = {}) {
  const rule = RULES[exerciseId];

  if (!rule) {
    return {
      success: false,
      exerciseId,
      error: `No assessment rules are configured for ${exerciseId}.`,
      formScore: null,
      features: {},
      feedback: [],
      assessedFeatures: 0,
      unavailableFeatures: 0,
    };
  }

  if (cameraView && cameraView !== rule.cameraView) {
    return {
      success: true,
      exerciseId,
      exerciseName: rule.name,
      cameraView,
      formScore: null,
      rating: 'Wrong camera view',
      features: {},
      feedback: [`Please use the ${rule.cameraView} camera view.`],
      assessedFeatures: 0,
      unavailableFeatures: Object.keys(rule.features).length,
      availableWeight: 0,
    };
  }

  const features = {};
  const feedback = [];
  let weightedScore = 0;
  let availableWeight = 0;

  for (const [name, config] of Object.entries(rule.features)) {
    const result =
      config.type === 'symmetry'
        ? evaluateSymmetryFeature(angles, config, landmarks)
        : evaluateAngleFeature(angles, config, landmarks);

    features[name] = {
      ...result,
      weight: config.weight,
      feedbackMessage: config.feedback,
    };

    if (result.score !== null) {
      weightedScore += result.score * config.weight;
      availableWeight += config.weight;
    }

    if (result.status === 'warning') {
      feedback.push(config.feedback);
    }
  }

  const formScore =
    availableWeight > 0
      ? Number((weightedScore / availableWeight).toFixed(1))
      : null;

  const rating =
    formScore === null
      ? 'Unable to assess'
      : formScore >= 90
        ? 'Excellent'
        : formScore >= 75
          ? 'Good'
          : formScore >= 60
            ? 'Needs Improvement'
            : 'Poor';

  return {
    success: true,
    exerciseId,
    exerciseName: rule.name,
    cameraView: rule.cameraView,
    formScore,
    rating,
    features,
    feedback,
    assessedFeatures: Object.values(features).filter(
      (feature) => feature.score !== null
    ).length,
    unavailableFeatures: Object.values(features).filter(
      (feature) => feature.score === null
    ).length,
    availableWeight,
  };
}

export default evaluateExerciseForm;
