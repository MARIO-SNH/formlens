
/*
 * FormLens - Exercise Form Rules
 *
 * Evaluates measurable exercise features using:
 * - Joint angles calculated by angleCalculator.js
 * - Exercise reference ranges
 * - MediaPipe landmark visibility
 *
 * This is a prototype rule-based assessment engine.
 * It does not diagnose injuries or provide clinical scores.
 */

import {
  exerciseReferenceData,
  LANDMARKS,
} from "../exercises/exerciseReferenceData";

// ---------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------

const DEFAULT_CONFIDENCE_THRESHOLD = 0.6;
const DEFAULT_ANGLE_TOLERANCE = 15;

// Map each measurable form feature to the angle values
// supplied by the frontend.
//
// Expected angle object examples:
// {
//   leftKnee: 90,
//   rightKnee: 92,
//   leftElbow: 85,
//   rightElbow: 88,
//   leftHip: 95,
//   rightHip: 96,
//   leftArmElevation: 90,
//   rightArmElevation: 92,
//   bodyAlignment: 175
// }

const FEATURE_RULES = {
  pushups: {
    bodyAlignment: {
      angleKeys: ["bodyAlignment"],
      target: [165, 180],
    },
    elbowRange: {
      angleKeys: ["leftElbow"],
      target: [70, 110],
    },
  },

  widePushups: {
    armSymmetry: {
      symmetryKeys: ["leftElbow", "rightElbow"],
    },
    elbowRange: {
      angleKeys: ["leftElbow", "rightElbow"],
      target: [70, 110],
    },
  },

  bentOverRows: {
    elbowRange: {
      angleKeys: ["leftElbow"],
      target: [60, 110],
    },
  },

  reverseFly: {
    armSymmetry: {
      symmetryKeys: ["leftArmElevation", "rightArmElevation"],
    },
    armElevation: {
      angleKeys: ["leftArmElevation", "rightArmElevation"],
      target: [60, 100],
    },
    elbowStability: {
      angleKeys: ["leftElbow", "rightElbow"],
      target: [150, 180],
    },
  },

  shoulderPress: {
    armSymmetry: {
      symmetryKeys: ["leftElbow", "rightElbow"],
    },
    elbowExtension: {
      angleKeys: ["leftElbow", "rightElbow"],
      target: [150, 180],
    },
  },

  lateralRaises: {
    armElevation: {
      angleKeys: ["leftArmElevation", "rightArmElevation"],
      target: [70, 100],
    },
    armSymmetry: {
      symmetryKeys: ["leftArmElevation", "rightArmElevation"],
    },
    elbowStability: {
      angleKeys: ["leftElbow", "rightElbow"],
      target: [150, 180],
    },
  },

  bicepCurls: {
    elbowRange: {
      angleKeys: ["leftElbow", "rightElbow"],
      target: [40, 70],
    },
    armSymmetry: {
      symmetryKeys: ["leftElbow", "rightElbow"],
    },
  },

  overheadTricepExtensions: {
    elbowExtension: {
      angleKeys: ["leftElbow"],
      target: [150, 180],
    },
  },

  squats: {
    squatDepth: {
      angleKeys: ["leftKnee"],
      target: [60, 100],
    },
    kneeAlignment: {
      symmetryKeys: ["leftKnee", "rightKnee"],
    },
    torsoStability: {
      angleKeys: ["leftHip"],
      target: [60, 110],
    },
  },

  lunges: {
    lungeDepth: {
      angleKeys: ["leftKnee"],
      target: [55, 90],
    },
    movementSymmetry: {
      symmetryKeys: ["leftKnee", "rightKnee"],
    },
  },
};

// ---------------------------------------------------------
// BASIC VALIDATION
// ---------------------------------------------------------

function isValidAngle(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 180
  );
}

function getLandmarkVisibility(landmarks, landmarkName) {
  if (!Array.isArray(landmarks)) {
    return null;
  }

  const index = LANDMARKS[landmarkName];

  if (index === undefined) {
    return null;
  }

  const landmark = landmarks[index];

  if (!landmark) {
    return 0;
  }

  return typeof landmark.visibility === "number"
    ? landmark.visibility
    : null;
}

function hasVisibleLandmarks(
  landmarks,
  landmarkNames,
  minimumVisibility
) {
  // If landmarks are not supplied, angle availability is
  // used as the only available confidence check.
  if (!Array.isArray(landmarks)) {
    return true;
  }

  return landmarkNames.every((name) => {
    const visibility = getLandmarkVisibility(
      landmarks,
      name
    );

    // Missing visibility information is not treated as
    // proof that the landmark is invisible.
    if (visibility === null) {
      return true;
    }

    return visibility >= minimumVisibility;
  });
}

// ---------------------------------------------------------
// ANGLE SCORING
// ---------------------------------------------------------

export function getAngleDeviation(
  angle,
  targetRange,
  tolerance = DEFAULT_ANGLE_TOLERANCE
) {
  if (
    !isValidAngle(angle) ||
    !Array.isArray(targetRange) ||
    targetRange.length !== 2
  ) {
    return null;
  }

  const [minimum, maximum] = targetRange;

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

  const score = Math.max(
    0,
    Math.min(100, 100 - difference * 3)
  );

  return {
    angle,
    targetRange,
    difference: Number(difference.toFixed(1)),
    score: Number(score.toFixed(1)),
    withinRange: difference === 0,
    deviationDetected: difference > tolerance,
  };
}

// ---------------------------------------------------------
// FEATURE EVALUATION
// ---------------------------------------------------------

function evaluateAngleFeature({
  angles,
  rule,
  landmarks,
  minimumVisibility,
  tolerance,
}) {
  const availableAngles = rule.angleKeys
    .map((key) => ({
      key,
      value: angles?.[key],
    }))
    .filter((item) => isValidAngle(item.value));

  if (availableAngles.length === 0) {
    return {
      status: "unavailable",
      reason: "Required joint angles are unavailable.",
      score: null,
    };
  }

  const results = [];

  for (const item of availableAngles) {
    const requiredLandmarks = getLandmarksForAngle(item.key);

    if (
      !hasVisibleLandmarks(
        landmarks,
        requiredLandmarks,
        minimumVisibility
      )
    ) {
      continue;
    }

    const result = getAngleDeviation(
      item.value,
      rule.target,
      tolerance
    );

    if (result) {
      results.push({
        angleKey: item.key,
        ...result,
      });
    }
  }

  if (results.length === 0) {
    return {
      status: "unavailable",
      reason: "Required landmarks are not sufficiently visible.",
      score: null,
    };
  }

  const averageScore =
    results.reduce((sum, item) => sum + item.score, 0) /
    results.length;

  const deviations = results.filter(
    (item) => item.deviationDetected
  );

  return {
    status: deviations.length > 0 ? "warning" : "good",
    score: Number(averageScore.toFixed(1)),
    measurements: results,
    deviations,
  };
}

// ---------------------------------------------------------
// SYMMETRY EVALUATION
// ---------------------------------------------------------

function evaluateSymmetryFeature({
  angles,
  rule,
  landmarks,
  minimumVisibility,
  maximumDifference = 15,
}) {
  const [leftKey, rightKey] = rule.symmetryKeys;

  const leftAngle = angles?.[leftKey];
  const rightAngle = angles?.[rightKey];

  if (
    !isValidAngle(leftAngle) ||
    !isValidAngle(rightAngle)
  ) {
    return {
      status: "unavailable",
      reason: "Both left and right measurements are required.",
      score: null,
    };
  }

  const landmarkNames = [
    ...getLandmarksForAngle(leftKey),
    ...getLandmarksForAngle(rightKey),
  ];

  if (
    !hasVisibleLandmarks(
      landmarks,
      landmarkNames,
      minimumVisibility
    )
  ) {
    return {
      status: "unavailable",
      reason: "One or more required landmarks are not visible.",
      score: null,
    };
  }

  const difference = Math.abs(leftAngle - rightAngle);

  const score = Math.max(
    0,
    Math.min(
      100,
      100 - Math.max(0, difference - maximumDifference) * 3
    )
  );

  return {
    status:
      difference > maximumDifference ? "warning" : "good",
    score: Number(score.toFixed(1)),
    leftAngle,
    rightAngle,
    difference: Number(difference.toFixed(1)),
    maximumDifference,
    deviationDetected: difference > maximumDifference,
  };
}

// ---------------------------------------------------------
// LANDMARK MAPPING FOR ANGLE MEASUREMENTS
// ---------------------------------------------------------

function getLandmarksForAngle(angleKey) {
  const mappings = {
    leftElbow: [
      "leftShoulder",
      "leftElbow",
      "leftWrist",
    ],
    rightElbow: [
      "rightShoulder",
      "rightElbow",
      "rightWrist",
    ],
    leftKnee: [
      "leftHip",
      "leftKnee",
      "leftAnkle",
    ],
    rightKnee: [
      "rightHip",
      "rightKnee",
      "rightAnkle",
    ],
    leftHip: [
      "leftShoulder",
      "leftHip",
      "leftKnee",
    ],
    rightHip: [
      "rightShoulder",
      "rightHip",
      "rightKnee",
    ],
    leftArmElevation: [
      "leftHip",
      "leftShoulder",
      "leftElbow",
    ],
    rightArmElevation: [
      "rightHip",
      "rightShoulder",
      "rightElbow",
    ],
    bodyAlignment: [
      "leftShoulder",
      "leftHip",
      "leftAnkle",
    ],
  };

  return mappings[angleKey] || [];
}

// ---------------------------------------------------------
// MAIN EXERCISE ASSESSMENT FUNCTION
// ---------------------------------------------------------

export function evaluateExerciseForm({
  exerciseId,
  angles = {},
  landmarks = null,
  cameraView = null,
  minimumVisibility = DEFAULT_CONFIDENCE_THRESHOLD,
  angleTolerance = DEFAULT_ANGLE_TOLERANCE,
} = {}) {
  const exercise = exerciseReferenceData.find(
    (item) => item.id === exerciseId
  );

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

  const exerciseRules = FEATURE_RULES[exerciseId] || {};
  const features = {};
  const deviations = [];
  const feedback = [];

  let weightedScore = 0;
  let availableWeight = 0;

  for (const [featureName, featureConfig] of Object.entries(
    exercise.formChecks
  )) {
    const rule = exerciseRules[featureName];

    // Do not penalise features for which no detection
    // algorithm has been implemented yet.
    if (!rule) {
      features[featureName] = {
        status: "unavailable",
        score: null,
        reason: "This feature detector is not implemented yet.",
      };
      continue;
    }

    // Skip a feature if its required camera view differs
    // from the selected view.
    if (
      cameraView &&
      featureConfig.cameraView &&
      cameraView !== featureConfig.cameraView
    ) {
      features[featureName] = {
        status: "unavailable",
        score: null,
        reason: `Requires ${featureConfig.cameraView} camera view.`,
      };
      continue;
    }

    let result;

    if (rule.symmetryKeys) {
      result = evaluateSymmetryFeature({
        angles,
        rule,
        landmarks,
        minimumVisibility,
        maximumDifference:
          featureConfig.maximumDifference || 15,
      });
    } else if (rule.angleKeys) {
      result = evaluateAngleFeature({
        angles,
        rule,
        landmarks,
        minimumVisibility,
        tolerance: angleTolerance,
      });
    } else {
      result = {
        status: "unavailable",
        score: null,
        reason: "No supported measurement rule.",
      };
    }

    features[featureName] = {
      ...result,
      weight: featureConfig.weight,
    };

    if (result.score !== null) {
      weightedScore +=
        result.score * featureConfig.weight;

      availableWeight += featureConfig.weight;
    }

    if (result.status === "warning") {
      deviations.push({
        feature: featureName,
        message: featureConfig.feedback,
        measurements: result.measurements || [],
        difference: result.difference ?? null,
      });

      feedback.push(featureConfig.feedback);
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
    confidenceThreshold: minimumVisibility,
  };
}

export default evaluateExerciseForm;
