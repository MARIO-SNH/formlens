// FormLens - Exercise Definitions
// Defines all 10 supported exercises.

export const exerciseDefinitions = {

    // =========================
    // CHEST EXERCISES
    // =========================

    pushups: {
        id: "pushups",
        name: "Push-ups",
        muscleGroup: "Chest",
        preferredView: "Side view",

        primaryJoints: [
            "leftElbow",
            "rightElbow",
            "leftShoulder",
            "rightShoulder"
        ],

        analysisFeatures: [
            "elbowRangeOfMotion",
            "bodyAlignment",
            "hipSag",
            "shoulderSymmetry",
            "movementTempo"
        ],

        feedbackChecks: [
            "Maintain a straight body line",
            "Avoid letting your hips sag",
            "Keep your elbows controlled"
        ],

        angleThresholds: {
            bottom: 90,
            top: 160
        }
    },

    widePushups: {
        id: "widePushups",
        name: "Wide-grip Push-ups",
        muscleGroup: "Chest",
        preferredView: "Front and side view",

        primaryJoints: [
            "leftElbow",
            "rightElbow",
            "leftShoulder",
            "rightShoulder"
        ],

        analysisFeatures: [
            "elbowRangeOfMotion",
            "shoulderSymmetry",
            "bodyAlignment",
            "movementTempo"
        ],

        feedbackChecks: [
            "Keep both arms symmetrical",
            "Maintain a straight body line",
            "Control your lowering movement"
        ],

        angleThresholds: {
            bottom: 90,
            top: 160
        }
    },


    // =========================
    // BACK EXERCISES
    // =========================

    bentOverRows: {
        id: "bentOverRows",
        name: "Bent-over Rows",
        muscleGroup: "Back",
        preferredView: "Side view",

        primaryJoints: [
            "leftElbow",
            "rightElbow",
            "leftHip",
            "rightHip"
        ],

        analysisFeatures: [
            "elbowTravel",
            "torsoStability",
            "shoulderSymmetry",
            "movementTempo"
        ],

        feedbackChecks: [
            "Keep your torso stable",
            "Avoid excessive body swinging",
            "Pull both arms evenly"
        ],

        angleThresholds: {
            bottom: 80,
            top: 160
        }
    },

    reverseFly: {
        id: "reverseFly",
        name: "Reverse Fly",
        muscleGroup: "Back",
        preferredView: "Front view",

        primaryJoints: [
            "leftShoulder",
            "rightShoulder",
            "leftElbow",
            "rightElbow"
        ],

        analysisFeatures: [
            "armElevation",
            "shoulderSymmetry",
            "torsoStability",
            "movementTempo"
        ],

        feedbackChecks: [
            "Keep both arms moving evenly",
            "Avoid excessive torso movement",
            "Control the arm movement"
        ],

        angleThresholds: {
            bottom: 30,
            top: 100
        }
    },


    // =========================
    // SHOULDER EXERCISES
    // =========================

    shoulderPress: {
        id: "shoulderPress",
        name: "Shoulder Press",
        muscleGroup: "Shoulders",
        preferredView: "Front view",

        primaryJoints: [
            "leftElbow",
            "rightElbow",
            "leftShoulder",
            "rightShoulder"
        ],

        analysisFeatures: [
            "elbowExtension",
            "armSymmetry",
            "torsoCompensation",
            "movementTempo"
        ],

        feedbackChecks: [
            "Press both arms evenly",
            "Avoid excessive back arching",
            "Control the lowering movement"
        ],

        angleThresholds: {
            bottom: 80,
            top: 160
        }
    },

    lateralRaises: {
        id: "lateralRaises",
        name: "Lateral Raises",
        muscleGroup: "Shoulders",
        preferredView: "Front view",

        primaryJoints: [
            "leftShoulder",
            "rightShoulder",
            "leftElbow",
            "rightElbow"
        ],

        analysisFeatures: [
            "armElevation",
            "shoulderHiking",
            "elbowPosition",
            "armSymmetry"
        ],

        feedbackChecks: [
            "Raise both arms evenly",
            "Avoid shrugging your shoulders",
            "Keep the movement controlled"
        ],

        angleThresholds: {
            bottom: 20,
            top: 90
        }
    },


    // =========================
    // ARM EXERCISES
    // =========================

    bicepCurls: {
        id: "bicepCurls",
        name: "Bicep Curls",
        muscleGroup: "Arms",
        preferredView: "Front view",

        primaryJoints: [
            "leftElbow",
            "rightElbow"
        ],

        analysisFeatures: [
            "elbowRangeOfMotion",
            "upperArmStability",
            "armSymmetry",
            "movementTempo"
        ],

        feedbackChecks: [
            "Keep your upper arms stable",
            "Avoid swinging your body",
            "Curl both arms evenly"
        ],

        angleThresholds: {
            bottom: 60,
            top: 150
        }
    },

    overheadTricepExtensions: {
        id: "overheadTricepExtensions",
        name: "Overhead Tricep Extensions",
        muscleGroup: "Arms",
        preferredView: "Side view",

        primaryJoints: [
            "leftElbow",
            "rightElbow",
            "leftShoulder",
            "rightShoulder"
        ],

        analysisFeatures: [
            "elbowRangeOfMotion",
            "upperArmStability",
            "trunkCompensation",
            "armSymmetry"
        ],

        feedbackChecks: [
            "Keep your upper arms steady",
            "Avoid arching your back",
            "Extend your elbows in a controlled way"
        ],

        angleThresholds: {
            bottom: 70,
            top: 160
        }
    },


    // =========================
    // LEG EXERCISES
    // =========================

    squats: {
        id: "squats",
        name: "Squats",
        muscleGroup: "Legs",
        preferredView: "Side and front view",

        primaryJoints: [
            "leftKnee",
            "rightKnee",
            "leftHip",
            "rightHip"
        ],

        analysisFeatures: [
            "kneeAlignment",
            "squatDepth",
            "trunkInclination",
            "leftRightSymmetry",
            "movementTempo",
            "heelLift"
        ],

        feedbackChecks: [
            "Keep your knees aligned with your feet",
            "Maintain a controlled squat depth",
            "Keep your torso stable"
        ],

        angleThresholds: {
            bottom: 90,
            top: 160
        }
    },

    lunges: {
        id: "lunges",
        name: "Lunges",
        muscleGroup: "Legs",
        preferredView: "Front and side view",

        primaryJoints: [
            "leftKnee",
            "rightKnee",
            "leftHip",
            "rightHip"
        ],

        analysisFeatures: [
            "frontKneeAlignment",
            "lungeDepth",
            "hipStability",
            "strideConsistency",
            "movementTempo"
        ],

        feedbackChecks: [
            "Keep your front knee aligned",
            "Maintain a stable upper body",
            "Use a controlled stride"
        ],

        angleThresholds: {
            bottom: 90,
            top: 160
        }
    }
};


// Returns all available exercises.
export function getAllExercises() {
    return Object.values(exerciseDefinitions);
}


// Returns exercises belonging to a muscle group.
export function getExercisesByMuscleGroup(muscleGroup) {
    return getAllExercises().filter(
        exercise =>
            exercise.muscleGroup.toLowerCase() ===
            muscleGroup.toLowerCase()
    );
}


// Returns one exercise using its ID.
export function getExerciseById(exerciseId) {
    return exerciseDefinitions[exerciseId] || null;
}