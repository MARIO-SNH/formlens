export const exerciseDefinitions = [
    {
        id: "pushups",
        name: "Push-ups",
        muscleGroup: "Chest",
        preferredView: "side",
        primaryJoints: ["shoulder", "elbow"],
        analysisFeatures: [
            "elbowRangeOfMotion",
            "bodyAlignment",
            "hipSag",
            "movementTempo"
        ],
        feedbackChecks: [
            "bodyAlignment",
            "hipSag",
            "elbowRangeOfMotion"
        ],
        angleThresholds: { bottom: 90, top: 160 }
    },
    {
        id: "widePushups",
        name: "Wide-grip Push-ups",
        muscleGroup: "Chest",
        preferredView: "front",
        primaryJoints: ["shoulder", "elbow"],
        analysisFeatures: [
            "elbowRangeOfMotion",
            "shoulderSymmetry",
            "bodyAlignment"
        ],
        feedbackChecks: [
            "shoulderSymmetry",
            "bodyAlignment"
        ],
        angleThresholds: { bottom: 90, top: 160 }
    },
    {
        id: "bentOverRows",
        name: "Bent-over Rows",
        muscleGroup: "Back",
        preferredView: "side",
        primaryJoints: ["elbow", "hip"],
        analysisFeatures: [
            "elbowRangeOfMotion",
            "trunkInclination",
            "torsoStability"
        ],
        feedbackChecks: [
            "elbowTravel",
            "torsoStability",
            "trunkInclination"
        ],
        angleThresholds: { bottom: 150, top: 70 }
    },
    {
        id: "reverseFly",
        name: "Reverse Fly",
        muscleGroup: "Back",
        preferredView: "front",
        primaryJoints: ["shoulder", "elbow"],
        analysisFeatures: [
            "armElevation",
            "shoulderSymmetry",
            "torsoStability"
        ],
        feedbackChecks: [
            "armElevation",
            "shoulderHiking",
            "shoulderSymmetry"
        ],
        angleThresholds: { bottom: 40, top: 90 }
    },
    {
        id: "shoulderPress",
        name: "Shoulder Press",
        muscleGroup: "Shoulders",
        preferredView: "front",
        primaryJoints: ["shoulder", "elbow"],
        analysisFeatures: [
            "elbowExtension",
            "shoulderSymmetry",
            "torsoStability"
        ],
        feedbackChecks: [
            "elbowPosition",
            "shoulderSymmetry",
            "torsoCompensation"
        ],
        angleThresholds: { bottom: 80, top: 160 }
    },
    {
        id: "lateralRaises",
        name: "Lateral Raises",
        muscleGroup: "Shoulders",
        preferredView: "front",
        primaryJoints: ["shoulder", "elbow"],
        analysisFeatures: [
            "armElevation",
            "shoulderHiking",
            "armSymmetry"
        ],
        feedbackChecks: [
            "armElevation",
            "shoulderHiking",
            "armSymmetry"
        ],
        angleThresholds: { bottom: 10, top: 80 }
    },
    {
        id: "bicepCurls",
        name: "Bicep Curls",
        muscleGroup: "Arms",
        preferredView: "side",
        primaryJoints: ["elbow"],
        analysisFeatures: [
            "elbowRangeOfMotion",
            "upperArmStability",
            "torsoCompensation"
        ],
        feedbackChecks: [
            "upperArmStability",
            "torsoCompensation"
        ],
        angleThresholds: { bottom: 55, top: 150 }
    },
    {
        id: "overheadTricepExtensions",
        name: "Overhead Tricep Extensions",
        muscleGroup: "Arms",
        preferredView: "side",
        primaryJoints: ["elbow", "shoulder"],
        analysisFeatures: [
            "elbowExtension",
            "upperArmStability",
            "torsoStability"
        ],
        feedbackChecks: [
            "elbowPosition",
            "elbowExtension",
            "torsoStability"
        ],
        angleThresholds: { bottom: 150, top: 70 }
    },
    {
        id: "squats",
        name: "Squats",
        muscleGroup: "Legs",
        preferredView: "side",
        primaryJoints: ["knee", "hip"],
        analysisFeatures: [
            "kneeAlignment",
            "squatDepth",
            "trunkInclination",
            "heelLift",
            "movementTempo"
        ],
        feedbackChecks: [
            "kneeAlignment",
            "squatDepth",
            "trunkInclination",
            "heelLift"
        ],
        angleThresholds: { bottom: 90, top: 160 }
    },
    {
        id: "lunges",
        name: "Lunges",
        muscleGroup: "Legs",
        preferredView: "side",
        primaryJoints: ["knee", "hip"],
        analysisFeatures: [
            "frontKneeAlignment",
            "lungeDepth",
            "hipStability",
            "strideConsistency"
        ],
        feedbackChecks: [
            "frontKneeAlignment",
            "lungeDepth",
            "hipStability"
        ],
        angleThresholds: { bottom: 90, top: 160 }
    }
];

export function getAllExercises() {
    return exerciseDefinitions;
}

export function getExercisesByMuscleGroup(muscleGroup) {
    return exerciseDefinitions.filter(
        exercise => exercise.muscleGroup === muscleGroup
    );
}

export function getExerciseById(id) {
    return exerciseDefinitions.find(
        exercise => exercise.id === id
    ) || null;
}