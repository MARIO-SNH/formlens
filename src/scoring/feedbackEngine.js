// FormLens - Exercise Feedback Engine

// Maps detected movement problems to corrective instructions.

const feedbackRules = {

    // Squat feedback
    kneeAlignment: {
        message: "Your knees are moving inward.",
        suggestion: "Keep your knees aligned with your feet."
    },

    squatDepth: {
        message: "Your squat depth may be limited.",
        suggestion: "Work towards a comfortable and controlled squat depth."
    },

    trunkInclination: {
        message: "Your torso is leaning excessively.",
        suggestion: "Maintain a stable torso throughout the movement."
    },

    heelLift: {
        message: "Your heels appear to be lifting.",
        suggestion: "Try to maintain contact between your heels and the floor."
    },

    // Push-up feedback
    bodyAlignment: {
        message: "Your body alignment needs attention.",
        suggestion: "Maintain a straight line from your shoulders to your ankles."
    },

    hipSag: {
        message: "Your hips appear to be sagging.",
        suggestion: "Engage your core and maintain a stable body position."
    },

    // Arm exercise feedback
    elbowRangeOfMotion: {
        message: "Your elbow movement range may be limited.",
        suggestion: "Use a comfortable and controlled range of motion."
    },

    upperArmStability: {
        message: "Your upper arms are moving excessively.",
        suggestion: "Keep your upper arms stable during the exercise."
    },

    // General movement feedback
    shoulderSymmetry: {
        message: "Your shoulders are moving unevenly.",
        suggestion: "Try to maintain balanced movement on both sides."
    },

    armSymmetry: {
        message: "Your arms are moving unevenly.",
        suggestion: "Try to move both arms with similar control."
    },

    leftRightSymmetry: {
        message: "An imbalance between your left and right sides was detected.",
        suggestion: "Focus on controlled and balanced movement."
    },

    torsoStability: {
        message: "Your torso movement is inconsistent.",
        suggestion: "Keep your upper body stable throughout the exercise."
    },

    torsoCompensation: {
        message: "Your torso appears to be compensating for the movement.",
        suggestion: "Reduce excessive body movement and use controlled motion."
    },

    movementTempo: {
        message: "Your movement tempo is inconsistent.",
        suggestion: "Perform each repetition at a controlled pace."
    },

    elbowTravel: {
        message: "Your elbow movement needs attention.",
        suggestion: "Focus on controlled elbow movement."
    },

    armElevation: {
        message: "Your arm elevation needs attention.",
        suggestion: "Raise your arms smoothly without excessive shoulder movement."
    },

    shoulderHiking: {
        message: "Your shoulders appear to be shrugging.",
        suggestion: "Keep your shoulders relaxed while raising your arms."
    },

    elbowPosition: {
        message: "Your elbow position needs attention.",
        suggestion: "Maintain a comfortable and consistent elbow position."
    },

    elbowExtension: {
        message: "Your elbow extension appears limited.",
        suggestion: "Extend your arms smoothly without forcing the joints."
    },

    frontKneeAlignment: {
        message: "Your front knee alignment needs attention.",
        suggestion: "Keep your front knee aligned with your foot."
    },

    lungeDepth: {
        message: "Your lunge depth may be limited.",
        suggestion: "Use a comfortable and controlled lunge depth."
    },

    hipStability: {
        message: "Your hips appear unstable.",
        suggestion: "Keep your hips steady throughout the movement."
    },

    strideConsistency: {
        message: "Your stride appears inconsistent.",
        suggestion: "Maintain a controlled and consistent stride."
    }
};


/**
 * Generates corrective feedback from detected deviations.
 *
 * @param {Array<string>} deviations
 * @returns {Object}
 */

export function generateFeedback(deviations = []) {

    if (!Array.isArray(deviations)) {
        return {
            warnings: [],
            suggestions: [],
            summary: "Unable to generate feedback."
        };
    }

    const warnings = [];
    const suggestions = [];

    for (const deviation of deviations) {

        const rule = feedbackRules[deviation];

        if (!rule) {
            continue;
        }

        if (!warnings.includes(rule.message)) {
            warnings.push(rule.message);
        }

        if (!suggestions.includes(rule.suggestion)) {
            suggestions.push(rule.suggestion);
        }
    }

    let summary;

    if (warnings.length === 0) {
        summary = deviations.length === 0
            ? "No movement deviations were reported."
            : "No matching feedback rules were found.";
    } else {
        summary = `${warnings.length} movement issue(s) identified.`;
    }

    return {
        warnings,
        suggestions,
        summary
    };
}