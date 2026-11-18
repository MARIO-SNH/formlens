
const LANDMARKS = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

const EXERCISE_RULES = {
  pushups: {
    name: 'Push-ups',
    cameraView: 'side',
    checks: [
      {
        key: 'bodyAlignment',
        label: 'Body Alignment',
        weight: 0.6,
        angleKey: 'bodyAlignment',
        min: 165,
        max: 180,
        feedback: 'Keep your shoulders, hips and ankles aligned.',
      },
      {
        key: 'elbowRange',
        label: 'Elbow Position',
        weight: 0.4,
        angleKey: 'leftElbow',
        alternativeAngleKey: 'rightElbow',
        min: 70,
        max: 110,
        feedback: 'Bend your elbow to a controlled depth during the push-up.',
      },
    ],
  },

  squats: {
    name: 'Squats',
    cameraView: 'side',
    checks: [
      {
        key: 'squatDepth',
        label: 'Squat Depth',
        weight: 0.7,
        angleKey: 'leftKnee',
        alternativeAngleKey: 'rightKnee',
        min: 60,
        max: 100,
        feedback: 'Bend your knees further while maintaining control.',
      },
      {
        key: 'torsoStability',
        label: 'Torso Position',
        weight: 0.3,
        angleKey: 'leftHip',
        alternativeAngleKey: 'rightHip',
        min: 45,
        max: 120,
        feedback: 'Maintain a controlled torso position throughout the squat.',
      },
    ],
  },

  lateralRaises: {
    name: 'Lateral Raises',
    cameraView: 'front',
    checks: [
      {
        key: 'armElevation',
        label: 'Arm Elevation',
        weight: 0.5,
        angleKey: 'leftArmElevation',
        alternativeAngleKey: 'rightArmElevation',
        min: 70,
        max: 100,
        feedback: 'Raise your arms towards shoulder height.',
      },
      {
        key: 'armSymmetry',
        label: 'Arm Symmetry',
        weight: 0.3,
        type: 'symmetry',
        firstAngle: 'leftArmElevation',
        secondAngle: 'rightArmElevation',
        maxDifference: 15,
        feedback: 'Try to raise both arms evenly.',
      },
      {
        key: 'elbowPosition',
        label: 'Elbow Position',
        weight: 0.2,
        angleKey: 'leftElbow',
        alternativeAngleKey: 'rightElbow',
        min: 140,
        max: 180,
        feedback: 'Keep a slight, consistent bend in your elbows.',
      },
    ],
  },

  bicepCurls: {
    name: 'Bicep Curls',
    cameraView: 'side',
    checks: [
      {
        key: 'elbowRange',
        label: 'Elbow Movement',
        weight: 0.6,
        angleKey: 'leftElbow',
        alternativeAngleKey: 'rightElbow',
        min: 40,
        max: 150,
        feedback: 'Move through a controlled elbow range.',
      },
      {
        key: 'upperArmStability',
        label: 'Upper Arm Position',
        weight: 0.4,
        type: 'stability',
        shoulder: 'LEFT_SHOULDER',
        elbow: 'LEFT_ELBOW',
        maxMovement: 0.12,
        feedback: 'Keep your upper arm close to your torso.',
      },
    ],
  },
};

function getVisibleLandmark(landmarks, index) {
  const point = landmarks?.[index];

  if (
    !point ||
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    (point.visibility ?? 1) < 0.3
  ) {
    return null;
  }

  return point;
}

function getAngle(angles, primary, alternative) {
  const first = angles?.[primary];

  if (Number.isFinite(first)) return first;

  const second = angles?.[alternative];

  return Number.isFinite(second) ? second : null;
}

function isWithinRange(value, min, max) {
  return Number.isFinite(value) && value >= min && value <= max;
}

function evaluateRangeCheck(check, angles) {
  const value = getAngle(
    angles,
    check.angleKey,
    check.alternativeAngleKey
  );

  if (value === null) {
    return { status: 'unavailable', score: null };
  }

  return {
    status: isWithinRange(value, check.min, check.max)
      ? 'good'
      : 'warning',
    score: isWithinRange(value, check.min, check.max) ? 100 : 0,
    value,
  };
}

function evaluateSymmetryCheck(check, angles) {
  const first = angles?.[check.firstAngle];
  const second = angles?.[check.secondAngle];

  if (!Number.isFinite(first) || !Number.isFinite(second)) {
    return { status: 'unavailable', score: null };
  }

  const difference = Math.abs(first - second);
  const good = difference <= check.maxDifference;

  return {
    status: good ? 'good' : 'warning',
    score: good ? 100 : 0,
    value: difference,
  };
}

function evaluateStabilityCheck(check, landmarks) {
  const shoulderIndex = LANDMARKS[check.shoulder];
  const elbowIndex = LANDMARKS[check.elbow];

  const shoulder = getVisibleLandmark(landmarks, shoulderIndex);
  const elbow = getVisibleLandmark(landmarks, elbowIndex);

  if (!shoulder || !elbow) {
    return { status: 'unavailable', score: null };
  }

  // This is a positional proxy, not a measurement of movement over time.
  const verticalDifference = Math.abs(shoulder.x - elbow.x);
  const good = verticalDifference <= check.maxMovement;

  return {
    status: good ? 'good' : 'warning',
    score: good ? 100 : 0,
    value: verticalDifference,
  };
}

function evaluateCheck(check, angles, landmarks) {
  if (check.type === 'symmetry') {
    return evaluateSymmetryCheck(check, angles);
  }

  if (check.type === 'stability') {
    return evaluateStabilityCheck(check, landmarks);
  }

  return evaluateRangeCheck(check, angles);
}

function getRating(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Needs Improvement';
  return 'Poor';
}

export function evaluateExerciseForm({
  exerciseId,
  angles = {},
  landmarks = [],
  cameraView,
}) {
  const rule = EXERCISE_RULES[exerciseId];

  if (!rule) {
    return {
      success: false,
      exerciseId,
      exerciseName: 'Unknown exercise',
      cameraView: cameraView || 'unknown',
      formScore: null,
      rating: 'Not assessed',
      features: {},
      feedback: ['Detailed form assessment is not available for this exercise.'],
      assessedFeatures: 0,
      unavailableFeatures: 0,
      availableWeight: 0,
    };
  }

  const features = {};
  const feedback = [];

  let weightedScore = 0;
  let availableWeight = 0;
  let assessedFeatures = 0;
  let unavailableFeatures = 0;

  for (const check of rule.checks) {
    const result = evaluateCheck(check, angles, landmarks);

    features[check.key] = {
      label: check.label,
      status: result.status,
      value: result.value ?? null,
      weight: check.weight,
    };

    if (result.status === 'unavailable') {
      unavailableFeatures += 1;
      continue;
    }

    assessedFeatures += 1;
    availableWeight += check.weight;
    weightedScore += result.score * check.weight;

    if (result.status === 'warning') {
      feedback.push(check.feedback);
    }
  }

  const formScore =
    availableWeight > 0
      ? Math.round(weightedScore / availableWeight)
      : null;

  return {
    success: formScore !== null,
    exerciseId,
    exerciseName: rule.name,
    cameraView: rule.cameraView,
    formScore,
    rating: formScore === null ? 'Not assessed' : getRating(formScore),
    features,
    feedback,
    assessedFeatures,
    unavailableFeatures,
    availableWeight: Math.round(availableWeight * 100),
  };
}
