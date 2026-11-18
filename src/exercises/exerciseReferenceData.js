/*
 * FormLens - Exercise Reference Library
 *
 * Purpose:
 * - Defines all 10 supported exercises.
 * - Provides initial biomechanical reference ranges.
 * - Defines MediaPipe landmark requirements.
 * - Defines repetition-counting thresholds.
 * - Defines camera-specific form checks.
 * - Provides scoring weights and feedback.
 *
 * IMPORTANT:
 * These values are initial prototype estimates.
 * They must be calibrated and tested with real users.
 *
 * Angle convention:
 * calculateAngle(A, B, C) returns the interior angle at B.
 * A straight joint is approximately 180 degrees.
 */

export const LANDMARKS = {
  nose: 0,

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

  leftHeel: 29,
  rightHeel: 30,

  leftFootIndex: 31,
  rightFootIndex: 32,
};

export const exerciseReferenceData = [
  // =========================================================
  // 1. PUSH-UPS
  // =========================================================
  {
    id: "pushups",
    name: "Push-ups",
    muscleGroup: "Chest",

    cameraViews: ["side"],
    primaryCameraView: "side",

    difficulty: "moderate",

    requiredLandmarks: [
      "leftShoulder",
      "leftElbow",
      "leftWrist",
      "leftHip",
      "leftKnee",
      "leftAnkle",
    ],

    angles: {
      elbow: {
        points: ["leftShoulder", "leftElbow", "leftWrist"],
        top: [160, 180],
        bottom: [70, 110],
      },
      bodyAlignment: {
        points: ["leftShoulder", "leftHip", "leftAnkle"],
        target: [165, 180],
      },
    },

    repetition: {
      metric: "elbow",
      bottomThreshold: 100,
      topThreshold: 160,
      minimumConfidence: 0.6,
    },

    phases: [
      "extended",
      "descending",
      "contracted",
      "extending",
    ],

    formChecks: {
      bodyAlignment: {
        cameraView: "side",
        weight: 35,
        target: [165, 180],
        tolerance: 10,
        feedback: "Keep your shoulders, hips and ankles aligned.",
      },
      elbowRange: {
        cameraView: "side",
        weight: 30,
        target: [70, 110],
        feedback: "Lower your body with controlled elbow movement.",
      },
      hipStability: {
        cameraView: "side",
        weight: 20,
        feedback: "Avoid letting your hips sag or rise excessively.",
      },
      movementControl: {
        cameraView: "side",
        weight: 15,
        feedback: "Perform each repetition with controlled movement.",
      },
    },
  },

  // =========================================================
  // 2. WIDE-GRIP PUSH-UPS
  // =========================================================
  {
    id: "widePushups",
    name: "Wide-grip Push-ups",
    muscleGroup: "Chest",

    cameraViews: ["front", "diagonal"],
    primaryCameraView: "front",

    difficulty: "moderate",

    requiredLandmarks: [
      "leftShoulder",
      "rightShoulder",
      "leftElbow",
      "rightElbow",
      "leftWrist",
      "rightWrist",
      "leftHip",
      "rightHip",
    ],

    angles: {
      leftElbow: {
        points: ["leftShoulder", "leftElbow", "leftWrist"],
        top: [160, 180],
        bottom: [70, 110],
      },
      rightElbow: {
        points: ["rightShoulder", "rightElbow", "rightWrist"],
        top: [160, 180],
        bottom: [70, 110],
      },
    },

    repetition: {
      metric: "leftElbow",
      bottomThreshold: 100,
      topThreshold: 160,
      minimumConfidence: 0.6,
    },

    phases: [
      "extended",
      "descending",
      "contracted",
      "extending",
    ],

    formChecks: {
      armSymmetry: {
        cameraView: "front",
        weight: 35,
        maximumDifference: 15,
        feedback: "Keep both arms moving evenly.",
      },
      elbowRange: {
        cameraView: "front",
        weight: 30,
        target: [70, 110],
        feedback: "Use a controlled and consistent range of motion.",
      },
      shoulderSymmetry: {
        cameraView: "front",
        weight: 20,
        maximumDifference: 15,
        feedback: "Keep both shoulders at a similar height.",
      },
      movementControl: {
        cameraView: "front",
        weight: 15,
        feedback: "Avoid rushing through your repetitions.",
      },
    },
  },

  // =========================================================
  // 3. BENT-OVER ROWS
  // =========================================================
  {
    id: "bentOverRows",
    name: "Bent-over Rows",
    muscleGroup: "Back",

    cameraViews: ["side"],
    primaryCameraView: "side",

    difficulty: "moderate",

    requiredLandmarks: [
      "leftShoulder",
      "leftElbow",
      "leftWrist",
      "leftHip",
      "leftKnee",
      "leftAnkle",
    ],

    angles: {
      elbow: {
        points: ["leftShoulder", "leftElbow", "leftWrist"],
        lowered: [150, 180],
        pulled: [60, 110],
      },
    },

    referenceMeasurements: {
      torsoInclinationDegrees: {
        min: 25,
        max: 45,
        note: "Approximate angle above horizontal.",
      },
    },

    repetition: {
      metric: "elbow",
      bottomThreshold: 100,
      topThreshold: 155,
      minimumConfidence: 0.6,
    },

    phases: [
      "extended",
      "flexing",
      "contracted",
      "extending",
    ],

    formChecks: {
      torsoStability: {
        cameraView: "side",
        weight: 35,
        maximumMovementDegrees: 15,
        feedback: "Keep your torso stable while pulling.",
      },
      elbowRange: {
        cameraView: "side",
        weight: 25,
        target: [60, 110],
        feedback: "Pull your elbows through a controlled range.",
      },
      shoulderStability: {
        cameraView: "side",
        weight: 20,
        feedback: "Avoid excessive shoulder movement.",
      },
      movementControl: {
        cameraView: "side",
        weight: 20,
        feedback: "Avoid using momentum to lift the weight.",
      },
    },
  },

  // =========================================================
  // 4. REVERSE FLY
  // =========================================================
  {
    id: "reverseFly",
    name: "Reverse Fly",
    muscleGroup: "Back",

    cameraViews: ["front", "diagonal"],
    primaryCameraView: "front",

    difficulty: "moderate",

    requiredLandmarks: [
      "leftShoulder",
      "rightShoulder",
      "leftElbow",
      "rightElbow",
      "leftWrist",
      "rightWrist",
      "leftHip",
      "rightHip",
    ],

    angles: {
      leftArmElevation: {
        points: ["leftHip", "leftShoulder", "leftElbow"],
        lowered: [0, 25],
        raised: [60, 100],
      },
      rightArmElevation: {
        points: ["rightHip", "rightShoulder", "rightElbow"],
        lowered: [0, 25],
        raised: [60, 100],
      },
      leftElbow: {
        points: ["leftShoulder", "leftElbow", "leftWrist"],
        target: [150, 180],
      },
      rightElbow: {
        points: ["rightShoulder", "rightElbow", "rightWrist"],
        target: [150, 180],
      },
    },

    repetition: {
      metric: "leftArmElevation",
      bottomThreshold: 25,
      topThreshold: 75,
      minimumConfidence: 0.6,
    },

    phases: [
      "lowered",
      "raising",
      "raised",
      "lowering",
    ],

    formChecks: {
      armSymmetry: {
        cameraView: "front",
        weight: 35,
        maximumDifference: 15,
        feedback: "Raise both arms evenly.",
      },
      armElevation: {
        cameraView: "front",
        weight: 25,
        target: [60, 100],
        feedback: "Raise your arms through a controlled range.",
      },
      elbowStability: {
        cameraView: "front",
        weight: 20,
        target: [150, 180],
        feedback: "Maintain a slight, consistent elbow bend.",
      },
      torsoStability: {
        cameraView: "side",
        weight: 20,
        feedback: "Keep your torso stable during the movement.",
      },
    },
  },

  // =========================================================
  // 5. SHOULDER PRESS
  // =========================================================
  {
    id: "shoulderPress",
    name: "Shoulder Press",
    muscleGroup: "Shoulders",

    cameraViews: ["front", "side"],
    primaryCameraView: "front",

    difficulty: "moderate",

    requiredLandmarks: [
      "leftShoulder",
      "rightShoulder",
      "leftElbow",
      "rightElbow",
      "leftWrist",
      "rightWrist",
      "leftHip",
      "rightHip",
    ],

    angles: {
      leftElbow: {
        points: ["leftShoulder", "leftElbow", "leftWrist"],
        lowered: [70, 110],
        raised: [150, 180],
      },
      rightElbow: {
        points: ["rightShoulder", "rightElbow", "rightWrist"],
        lowered: [70, 110],
        raised: [150, 180],
      },
      leftArmElevation: {
        points: ["leftHip", "leftShoulder", "leftElbow"],
        target: [140, 180],
      },
      rightArmElevation: {
        points: ["rightHip", "rightShoulder", "rightElbow"],
        target: [140, 180],
      },
    },

    repetition: {
      metric: "leftElbow",
      bottomThreshold: 105,
      topThreshold: 155,
      minimumConfidence: 0.6,
    },

    phases: [
      "lowered",
      "extending",
      "raised",
      "flexing",
    ],

    formChecks: {
      armSymmetry: {
        cameraView: "front",
        weight: 30,
        maximumDifference: 15,
        feedback: "Press both arms upward evenly.",
      },
      elbowExtension: {
        cameraView: "front",
        weight: 30,
        target: [150, 180],
        feedback: "Complete the upward movement without forcing your elbows.",
      },
      shoulderElevation: {
        cameraView: "front",
        weight: 20,
        target: [140, 180],
        feedback: "Move both arms through a comfortable overhead range.",
      },
      torsoStability: {
        cameraView: "side",
        weight: 20,
        feedback: "Avoid excessive backward leaning.",
      },
    },
  },

  // =========================================================
  // 6. LATERAL RAISES
  // =========================================================
  {
    id: "lateralRaises",
    name: "Lateral Raises",
    muscleGroup: "Shoulders",

    cameraViews: ["front"],
    primaryCameraView: "front",

    difficulty: "beginner",

    requiredLandmarks: [
      "leftShoulder",
      "rightShoulder",
      "leftElbow",
      "rightElbow",
      "leftHip",
      "rightHip",
    ],

    angles: {
      leftArmElevation: {
        points: ["leftHip", "leftShoulder", "leftElbow"],
        lowered: [0, 20],
        raised: [70, 100],
      },
      rightArmElevation: {
        points: ["rightHip", "rightShoulder", "rightElbow"],
        lowered: [0, 20],
        raised: [70, 100],
      },
      leftElbow: {
        points: ["leftShoulder", "leftElbow", "leftWrist"],
        target: [150, 180],
      },
      rightElbow: {
        points: ["rightShoulder", "rightElbow", "rightWrist"],
        target: [150, 180],
      },
    },

    repetition: {
      metric: "leftArmElevation",
      bottomThreshold: 20,
      topThreshold: 75,
      minimumConfidence: 0.6,
    },

    phases: [
      "lowered",
      "raising",
      "raised",
      "lowering",
    ],

    formChecks: {
      armElevation: {
        cameraView: "front",
        weight: 35,
        target: [70, 100],
        feedback: "Raise your arms to a comfortable shoulder-height position.",
      },
      armSymmetry: {
        cameraView: "front",
        weight: 30,
        maximumDifference: 15,
        feedback: "Keep both arms at a similar height.",
      },
      elbowStability: {
        cameraView: "front",
        weight: 15,
        target: [150, 180],
        feedback: "Maintain a consistent elbow position.",
      },
      torsoStability: {
        cameraView: "front",
        weight: 20,
        feedback: "Avoid swinging your torso to raise the weights.",
      },
    },
  },

  // =========================================================
  // 7. BICEP CURLS
  // =========================================================
  {
    id: "bicepCurls",
    name: "Bicep Curls",
    muscleGroup: "Arms",

    cameraViews: ["front", "side"],
    primaryCameraView: "front",

    difficulty: "beginner",

    requiredLandmarks: [
      "leftShoulder",
      "rightShoulder",
      "leftElbow",
      "rightElbow",
      "leftWrist",
      "rightWrist",
      "leftHip",
      "rightHip",
    ],

    angles: {
      leftElbow: {
        points: ["leftShoulder", "leftElbow", "leftWrist"],
        extended: [150, 180],
        curled: [40, 70],
      },
      rightElbow: {
        points: ["rightShoulder", "rightElbow", "rightWrist"],
        extended: [150, 180],
        curled: [40, 70],
      },
    },

    repetition: {
      metric: "leftElbow",
      bottomThreshold: 70,
      topThreshold: 150,
      minimumConfidence: 0.6,
    },

    phases: [
      "extended",
      "flexing",
      "contracted",
      "extending",
    ],

    formChecks: {
      elbowRange: {
        cameraView: "side",
        weight: 35,
        target: [40, 70],
        feedback: "Curl through a controlled range of motion.",
      },
      upperArmStability: {
        cameraView: "side",
        weight: 30,
        maximumMovementDegrees: 15,
        feedback: "Keep your upper arms close to your sides.",
      },
      armSymmetry: {
        cameraView: "front",
        weight: 20,
        maximumDifference: 15,
        feedback: "Move both arms evenly.",
      },
      torsoStability: {
        cameraView: "side",
        weight: 15,
        feedback: "Avoid swinging your torso to lift the weight.",
      },
    },
  },

  // =========================================================
  // 8. OVERHEAD TRICEP EXTENSIONS
  // =========================================================
  {
    id: "overheadTricepExtensions",
    name: "Overhead Tricep Extensions",
    muscleGroup: "Arms",

    cameraViews: ["side"],
    primaryCameraView: "side",

    difficulty: "moderate",

    requiredLandmarks: [
      "leftShoulder",
      "leftElbow",
      "leftWrist",
      "leftHip",
    ],

    angles: {
      elbow: {
        points: ["leftShoulder", "leftElbow", "leftWrist"],
        flexed: [60, 110],
        extended: [150, 180],
      },
      upperArmElevation: {
        points: ["leftHip", "leftShoulder", "leftElbow"],
        target: [140, 180],
      },
    },

    repetition: {
      metric: "elbow",
      bottomThreshold: 105,
      topThreshold: 155,
      minimumConfidence: 0.6,
    },

    phases: [
      "flexed",
      "extending",
      "extended",
      "flexing",
    ],

    formChecks: {
      elbowExtension: {
        cameraView: "side",
        weight: 35,
        target: [150, 180],
        feedback: "Extend your elbows through a comfortable range.",
      },
      upperArmStability: {
        cameraView: "side",
        weight: 30,
        feedback: "Keep your upper arms relatively stable.",
      },
      elbowSymmetry: {
        cameraView: "front",
        weight: 20,
        maximumDifference: 15,
        feedback: "Keep both elbows in a similar position.",
      },
      torsoStability: {
        cameraView: "side",
        weight: 15,
        feedback: "Avoid excessive back arching.",
      },
    },
  },

  // =========================================================
  // 9. SQUATS
  // =========================================================
  {
    id: "squats",
    name: "Squats",
    muscleGroup: "Legs",

    cameraViews: ["side", "front"],
    primaryCameraView: "side",

    difficulty: "beginner",

    requiredLandmarks: [
      "leftShoulder",
      "leftHip",
      "leftKnee",
      "leftAnkle",
      "leftHeel",
      "leftFootIndex",
    ],

    angles: {
      knee: {
        points: ["leftHip", "leftKnee", "leftAnkle"],
        standing: [165, 180],
        bottom: [60, 100],
      },
      hip: {
        points: ["leftShoulder", "leftHip", "leftKnee"],
        standing: [150, 180],
        bottom: [60, 110],
      },
    },

    repetition: {
      metric: "knee",
      bottomThreshold: 110,
      topThreshold: 160,
      minimumConfidence: 0.6,
    },

    phases: [
      "extended",
      "descending",
      "contracted",
      "extending",
    ],

    formChecks: {
      kneeAlignment: {
        cameraView: "front",
        weight: 30,
        feedback: "Keep your knees aligned with your feet.",
      },
      squatDepth: {
        cameraView: "side",
        weight: 25,
        target: [60, 100],
        feedback: "Work towards your selected squat-depth target.",
      },
      torsoStability: {
        cameraView: "side",
        weight: 25,
        feedback: "Maintain a controlled and stable torso position.",
      },
      heelStability: {
        cameraView: "side",
        weight: 20,
        feedback: "Keep your heels in contact with the ground.",
      },
    },
  },

  // =========================================================
  // 10. LUNGES
  // =========================================================
  {
    id: "lunges",
    name: "Lunges",
    muscleGroup: "Legs",

    cameraViews: ["side", "front"],
    primaryCameraView: "side",

    difficulty: "moderate",

    requiredLandmarks: [
      "leftShoulder",
      "leftHip",
      "leftKnee",
      "leftAnkle",
      "rightHip",
      "rightKnee",
      "rightAnkle",
    ],

    angles: {
      frontKnee: {
        points: ["leftHip", "leftKnee", "leftAnkle"],
        standing: [165, 180],
        bottom: [55, 90],
      },
      rearKnee: {
        points: ["rightHip", "rightKnee", "rightAnkle"],
        standing: [150, 180],
        bottom: [60, 110],
      },
    },

    repetition: {
      metric: "frontKnee",
      bottomThreshold: 100,
      topThreshold: 160,
      minimumConfidence: 0.6,
    },

    phases: [
      "extended",
      "descending",
      "contracted",
      "extending",
    ],

    formChecks: {
      frontKneeAlignment: {
        cameraView: "front",
        weight: 30,
        feedback: "Keep your front knee aligned with your foot.",
      },
      lungeDepth: {
        cameraView: "side",
        weight: 25,
        target: [55, 90],
        feedback: "Use a controlled and comfortable lunge depth.",
      },
      hipStability: {
        cameraView: "front",
        weight: 20,
        feedback: "Keep your hips stable throughout the movement.",
      },
      movementSymmetry: {
        cameraView: "front",
        weight: 25,
        feedback: "Aim for consistent movement on both sides.",
      },
    },
  },
];

// ===========================================================
// HELPER FUNCTIONS
// ===========================================================

export function getAllExerciseReferences() {
  return exerciseReferenceData;
}

export function getExerciseReferenceById(id) {
  return (
    exerciseReferenceData.find((exercise) => exercise.id === id) ||
    null
  );
}

export function getExerciseReferencesByMuscleGroup(muscleGroup) {
  return exerciseReferenceData.filter(
    (exercise) =>
      exercise.muscleGroup.toLowerCase() ===
      muscleGroup.toLowerCase()
  );
}

export function getExerciseCameraView(id) {
  const exercise = getExerciseReferenceById(id);
  return exercise?.primaryCameraView || null;
}

export function getExerciseRepetitionSettings(id) {
  const exercise = getExerciseReferenceById(id);
  return exercise?.repetition || null;
}

export function getExerciseFormChecks(id) {
  const exercise = getExerciseReferenceById(id);
  return exercise?.formChecks || null;
}