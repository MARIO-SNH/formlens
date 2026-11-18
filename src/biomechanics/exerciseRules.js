
import { getExerciseReferenceById } from "../exercises/exerciseReferenceData";

const VISIBILITY_THRESHOLD = 0.6;
const ANGLE_TOLERANCE = 10;
const SYMMETRY_TOLERANCE = 15;

const FEATURE_ANGLE_KEYS = {
  pushups: {
    elbowRange: ["leftElbow", "rightElbow"],
    bodyAlignment: ["bodyAlignment"],
  },
  widePushUps: {
    elbowRange: ["leftElbow", "rightElbow"],
  },
  bentOverRows: {
    elbowRange: ["leftElbow", "rightElbow"],
  },
  reverseFly: {
    armElevation: ["leftArmElevation", "rightArmElevation"],
    elbowStability: ["leftElbow", "rightElbow"],
  },
  shoulderPress: {
    elbowExtension: ["leftElbow", "rightElbow"],
    shoulderElevation: ["leftArmElevation", "rightArmElevation"],
  },
  lateralRaises: {
    armElevation: ["leftArmElevation", "rightArmElevation"],
    elbowStability: ["leftElbow", "rightElbow"],
  },
  bicepCurls: {
    elbowRange: ["leftElbow", "rightElbow"],
  },
  overheadTricepExtensions: {
    elbowExtension: ["leftElbow", "rightElbow"],
  },
  squats: {
    squatDepth: ["leftKnee", "rightKnee"],
  },
  lunges: {
    lungeDepth: ["leftKnee", "rightKnee"],
  },
};

const FEATURE_SYMMETRY_KEYS = {
  widePushUps: {
    armSymmetry: ["leftElbow", "rightElbow"],
  },
  reverseFly: {
    armSymmetry: ["leftArmElevation", "rightArmElevation"],
  },
  shoulderPress: {
    armSymmetry: ["leftElbow", "rightElbow"],
  },
  lateralRaises: {
    armSymmetry: ["leftArmElevation", "rightArmElevation"],
  },
  bicepCurls: {
    armSymmetry: ["leftElbow", "rightElbow"],
  },
  squats: {
    kneeAlignment: ["leftKnee", "rightKnee"],
  },
  lunges: {
    movementSymmetry: ["leftKnee", "rightKnee"],
  },
};

const FEATURE_PHASES = {
  pushups: { elbowRange: ["contracted"] },
  widePushUps: { elbowRange: ["contracted"] },
  bentOverRows: { elbowRange: ["contracted"] },
  reverseFly: { armElevation: ["contracted"] },
  shoulderPress: {
    elbowExtension: ["extended"],
    shoulderElevation: ["extended"],
  },
  lateralRaises: { armElevation: ["contracted"] },
  bicepCurls: { elbowRange: ["contracted"] },
  overheadTricepExtensions: { elbowExtension: ["extended"] },
  squats: { squatDepth: ["contracted"] },
  lunges: { lungeDepth: ["contracted"] },
};

function isValidAngle(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 180
  );
}

function getLandmarkNamesForAngle(angleKey) {
  const mappings = {
    leftElbow: ["leftShoulder", "leftElbow", "leftWrist"],
    rightElbow: ["rightShoulder", "rightElbow", "rightWrist"],
    leftKnee: ["leftHip", "leftKnee", "leftAnkle"],
    rightKnee: ["rightHip", "rightKnee", "rightAnkle"],
    leftArmElevation: ["leftHip", "leftShoulder", "leftElbow"],
    rightArmElevation: ["rightHip", "rightShoulder", "rightElbow"],
    bodyAlignment: ["leftShoulder", "leftHip", "leftAnkle"],
  };

  return mappings[angleKey] || [];
}

function areLandmarksVisible(landmarks, angleKeys) {
  if (!Array.isArray(landmarks)) return true;

  const landmarkMap = {
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

  const requiredNames = [
    ...new Set(angleKeys.flatMap(getLandmarkNamesForAngle)),
  ];

  return requiredNames.every((name) => {
    const point = landmarks[landmarkMap[name]];

    return (
      point &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      (point.visibility ?? 1) >= VISIBILITY_THRESHOLD
    );
  });
}

function evaluateTarget(angle, target) {
  if (
    !isValidAngle(angle) ||
    !Array.isArray(target) ||
    target.length !== 2
  ) {
    return null;
  }

  const [minimum, maximum] = target;

  if (
    !Number.isFinite(minimum) ||
    !Number.isFinite(maximum) ||
    minimum > maximum
  ) {
    return null;
  }

  let difference = 0;

  if (angle < minimum) {
    difference = minimum - angle;
  } else if (angle > maximum) {
    difference = angle - maximum;
  }

  return {
    angle,
    target,
    difference: Number(difference.toFixed(1)),
    score: Math.max(0, Number((100 - difference * 3).toFixed(1))),
    withinRange: difference === 0,
    deviationDetected: difference > ANGLE_TOLERANCE,
  };
}

function evaluateAngleFeature(angles, angleKeys, target, landmarks) {
  const results = [];

  for (const key of angleKeys) {
    if (!isValidAngle(angles?.[key])) continue;
    if (!areLandmarksVisible(landmarks, [key])) continue;

    const result = evaluateTarget(angles[key], target);

    if (result) {
      results.push({ angleKey: key, ...result });
    }
  }

  if (results.length === 0) {
    return {
      status: "unavailable",
      score: null,
      reason: "Required joint angles or landmarks are unavailable.",
    };
  }

  const score =
    results.reduce((sum, result) => sum + result.score, 0) /
    results.length;

  const deviationDetected = results.some(
    (result) => result.deviationDetected
  );

  return {
    status: deviationDetected ? "warning" : "good",
    score: Number(score.toFixed(1)),
    measurements: results,
    deviationDetected,
  };
}

function evaluateSymmetryFeature(
  angles,
  angleKeys,
  landmarks,
  maximumDifference = SYMMETRY_TOLERANCE
) {
  if (!Array.isArray(angleKeys) || angleKeys.length !== 2) {
    return {
      status: "unavailable",
      score: null,
      reason: "Two corresponding measurements are required.",
    };
  }

  const [leftKey, rightKey] = angleKeys;
  const leftAngle = angles?.[leftKey];
  const rightAngle = angles?.[rightKey];

  if (
    !isValidAngle(leftAngle) ||
    !isValidAngle(rightAngle) ||
    !areLandmarksVisible(landmarks, angleKeys)
  ) {
    return {
      status: "unavailable",
      score: null,
      reason: "Both sides must be visible and measurable.",
    };
  }

  const difference = Math.abs(leftAngle - rightAngle);
  const tolerance = Number.isFinite(maximumDifference)
    ? maximumDifference
    : SYMMETRY_TOLERANCE;

  const excessDifference = Math.max(0, difference - tolerance);

  return {
    status: difference > tolerance ? "warning" : "good",
    score: Math.max(0, Number((100 - excessDifference * 3).toFixed(1))),
    leftAngle,
    rightAngle,
    difference: Number(difference.toFixed(1)),
    maximumDifference: tolerance,
    deviationDetected: difference > tolerance,
  };
}

export function evaluateExerciseForm({
  exerciseId,
  angles = {},
  landmarks = null,
  cameraView = null,
  phase = "unknown",
} = {}) {
  const exercise = getExerciseReferenceById(exerciseId);

  if (!exercise) {
    return {
      success: false,
      exerciseId,
      error: `Unknown exercise: ${exerciseId}`,
      formScore: null,
      features: {},
      deviations: [],
      feedback: [],
    };
  }

  const angleRules = FEATURE_ANGLE_KEYS[exerciseId] || {};
  const symmetryRules = FEATURE_SYMMETRY_KEYS[exerciseId] || {};
  const phaseRules = FEATURE_PHASES[exerciseId] || {};

  const features = {};
  const deviations = [];
  const feedback = [];

  let weightedScore = 0;
  let availableWeight = 0;

  for (const [featureName, config] of Object.entries(
    exercise.formChecks || {}
  )) {
    const requiredView = config.cameraView;

    if (cameraView && requiredView && cameraView !== requiredView) {
      features[featureName] = {
        status: "unavailable",
        score: null,
        reason: `This check requires the ${requiredView} camera view.`,
      };
      continue;
    }

    const allowedPhases = phaseRules[featureName];

    if (allowedPhases && !allowedPhases.includes(phase)) {
      features[featureName] = {
        status: "unavailable",
        score: null,
        reason: "Waiting for the relevant movement position.",
      };
      continue;
    }

    let result;
    const symmetryKeys = symmetryRules[featureName];
    const angleKeys = angleRules[featureName];

    if (symmetryKeys) {
      result = evaluateSymmetryFeature(
        angles,
        symmetryKeys,
        landmarks,
        config.maximumDifference
      );
    } else if (angleKeys && config.target) {
      result = evaluateAngleFeature(
        angles,
        angleKeys,
        config.target,
        landmarks
      );
    } else {
      result = {
        status: "unavailable",
        score: null,
        reason: "A measurement rule for this feature is not implemented yet.",
      };
    }

    features[featureName] = {
      ...result,
      weight: config.weight,
      feedbackMessage: config.feedback,
    };

    if (result.score !== null && Number.isFinite(config.weight)) {
      weightedScore += result.score * config.weight;
      availableWeight += config.weight;
    }

    if (result.status === "warning") {
      deviations.push({
        feature: featureName,
        message: config.feedback,
        measurements: result.measurements || [],
        difference: result.difference ?? null,
      });

      if (config.feedback) feedback.push(config.feedback);
    }
  }

  const formScore =
    availableWeight > 0
      ? Number((weightedScore / availableWeight).toFixed(1))
      : null;

  return {
    success: true,
    exerciseId,
    exerciseName: exercise.name,
    cameraView,
    phase,
    formScore,
    rating:
      formScore === null
        ? "Unable to assess"
        : formScore >= 90
          ? "Excellent"
          : formScore >= 75
            ? "Good"
            : formScore >= 60
              ? "Needs Improvement"
              : "Poor",
    features,
    deviations,
    feedback: [...new Set(feedback)],
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
