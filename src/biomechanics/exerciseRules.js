const VISIBILITY_THRESHOLD = 0.6;
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
        feedback: 'Keep your shoulders, hips and ankles aligned.',
      },
      elbowRange: {
        type: 'angle',
        keys: ['leftElbow', 'rightElbow'],
        target: [70, 110],
        feedback: 'Use a controlled elbow bend as you lower your body.',
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
        target: [60, 110],
        feedback: 'Work towards a comfortable, controlled squat depth.',
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
        feedback: 'Raise your arms towards shoulder height.',
      },
      armSymmetry: {
        type: 'symmetry',
        keys: ['leftArmElevation', 'rightArmElevation'],
        feedback: 'Try to raise both arms evenly.',
      },
      elbowPosition: {
        type: 'angle',
        keys: ['leftElbow', 'rightElbow'],
        target: [150, 180],
        feedback: 'Keep a slight, comfortable bend in your elbows.',
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
        target: [40, 80],
        feedback: 'Curl through a controlled range of motion.',
      },
    },
  },
};

function validAngle(value) {
  return Number.isFinite(value) && value >= 0 && value <= 180;
}

function isLandmarkVisible(landmarks, name) {
  const point = landmarks?.[LANDMARKS[name]];

  return Boolean(
    point &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    (point.visibility ?? 1) >= VISIBILITY_THRESHOLD
  );
}

function areAngleLandmarksVisible(landmarks, angleKey) {
  const required = ANGLE_LANDMARKS[angleKey];

  return Boolean(
    required?.every((name) => isLandmarkVisible(landmarks, name))
  );
}

function evaluateAngleFeature(angles, config, landmarks) {
  const values = config.keys
    .filter((key) => (
      validAngle(angles[key]) &&
      areAngleLandmarksVisible(landmarks, key)
    ))
    .map((key) => angles[key]);

  if (!values.length) {
    return {
      status: 'unavailable',
      score: null,
    };
  }

  const [minimum, maximum] = config.target;

  const deviations = values.map((value) => {
    if (value < minimum) return minimum - value;
    if (value > maximum) return value - maximum;
    return 0;
  });

  const averageDeviation =
    deviations.reduce((sum, value) => sum + value, 0) /
    deviations.length;

  return {
    status: averageDeviation <= 10 ? 'good' : 'warning',
    score: Math.max(0, 100 - averageDeviation * 3),
  };
}

function evaluateSymmetryFeature(angles, config, landmarks) {
  const [leftKey, rightKey] = config.keys;

  if (
    !validAngle(angles[leftKey]) ||
    !validAngle(angles[rightKey]) ||
    !areAngleLandmarksVisible(landmarks, leftKey) ||
    !areAngleLandmarksVisible(landmarks, rightKey)
  ) {
    return {
      status: 'unavailable',
      score: null,
    };
  }

  const difference = Math.abs(angles[leftKey] - angles[rightKey]);

  return {
    status: difference <= SYMMETRY_TOLERANCE ? 'good' : 'warning',
    score: Math.max(
      0,
      100 - Math.max(0, difference - SYMMETRY_TOLERANCE) * 3
    ),
  };
}

export function evaluateExerciseForm({
  exerciseId,
  angles = {},
  landmarks = [],
  cameraView = null,
} = {}) {
  const rule = RULES[exerciseId];

  if (!rule) {
    return {
      success: false,
      exerciseId,
      exerciseName: 'Unknown exercise',
      cameraView,
      features: {},
      feedback: [],
      assessedFeatures: 0,
      unavailableFeatures: 0,
    };
  }

  if (cameraView && cameraView !== rule.cameraView) {
    return {
      success: false,
      exerciseId,
      exerciseName: rule.name,
      cameraView,
      features: {},
      feedback: [`Please use the ${rule.cameraView} camera view.`],
      assessedFeatures: 0,
      unavailableFeatures: Object.keys(rule.features).length,
    };
  }

  const features = {};
  const feedback = [];

  for (const [name, config] of Object.entries(rule.features)) {
    const result = config.type === 'symmetry'
      ? evaluateSymmetryFeature(angles, config, landmarks)
      : evaluateAngleFeature(angles, config, landmarks);

    features[name] = {
      status: result.status,
      score: result.score,
      feedback: config.feedback,
    };

    if (result.status === 'warning') {
      feedback.push(config.feedback);
    }
  }

  const assessedFeatures = Object.values(features).filter(
    (feature) => feature.score !== null
  ).length;

  const unavailableFeatures = Object.values(features).length - assessedFeatures;

  return {
    success: assessedFeatures > 0,
    exerciseId,
    exerciseName: rule.name,
    cameraView: rule.cameraView,
    features,
    feedback,
    assessedFeatures,
    unavailableFeatures,
  };
}