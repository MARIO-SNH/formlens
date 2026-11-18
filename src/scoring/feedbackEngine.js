export const feedbackRules = {
    kneeAlignment: {
        message: "Your knees may be moving inward.",
        suggestion: "Try to keep your knees aligned with your toes."
    },
    squatDepth: {
        message: "Your squat depth may be limited.",
        suggestion: "Work towards a comfortable, controlled squat depth."
    },
    trunkInclination: {
        message: "Your torso angle may need adjustment.",
        suggestion: "Maintain a stable torso throughout the movement."
    },
    heelLift: {
        message: "Your heels appear to be lifting.",
        suggestion: "Try to keep your heels grounded."
    },
    bodyAlignment: {
        message: "Your body alignment needs attention.",
        suggestion: "Keep your body in a stable, straight position."
    },
    hipSag: {
        message: "Your hips may be dropping.",
        suggestion: "Engage your core and maintain a stable body position."
    },
    elbowRangeOfMotion: {
        message: "Your elbow movement range may be limited.",
        suggestion: "Use a comfortable and controlled range of motion."
    },
    upperArmStability: {
        message: "Your upper arm appears to be moving excessively.",
        suggestion: "Keep your upper arm stable while moving your forearm."
    },
    shoulderSymmetry: {
        message: "Your shoulders appear uneven.",
        suggestion: "Try to move both arms evenly."
    },
    armSymmetry: {
        message: "Your arms appear to be moving unevenly.",
        suggestion: "Focus on matching the movement on both sides."
    },
    leftRightSymmetry: {
        message: "A left-right movement imbalance was detected.",
        suggestion: "Try to maintain balanced movement on both sides."
    },
    torsoStability: {
        message: "Your torso appears unstable.",
        suggestion: "Keep your torso controlled throughout the exercise."
    },
    torsoCompensation: {
        message: "Your torso may be compensating for the movement.",
        suggestion: "Reduce momentum and focus on controlled movement."
    },
    movementTempo: {
        message: "Your movement tempo may be inconsistent.",
        suggestion: "Use a steady and controlled pace."
    },
    elbowTravel: {
        message: "Your elbows may be travelling too far.",
        suggestion: "Keep your elbow path controlled."
    },
    armElevation: {
        message: "Your arm elevation may need adjustment.",
        suggestion: "Raise your arms in a controlled and comfortable range."
    },
    shoulderHiking: {
        message: "Your shoulders appear to be shrugging.",
        suggestion: "Keep your shoulders relaxed and away from your ears."
    },
    elbowPosition: {
        message: "Your elbow position may need adjustment.",
        suggestion: "Keep your elbows in a stable position."
    },
    elbowExtension: {
        message: "Your elbow extension may be incomplete.",
        suggestion: "Work through a comfortable range without forcing the joint."
    },
    frontKneeAlignment: {
        message: "Your front knee alignment may need attention.",
        suggestion: "Keep your front knee aligned with your foot."
    },
    lungeDepth: {
        message: "Your lunge depth may be inconsistent.",
        suggestion: "Use a controlled and comfortable lunge depth."
    },
    hipStability: {
        message: "Your hips appear unstable.",
        suggestion: "Keep your hips level and controlled."
    },
    strideConsistency: {
        message: "Your stride length appears inconsistent.",
        suggestion: "Aim for a consistent and controlled stride."
    }
};

export function generateFeedback(deviations = []) {
    const warnings = [];
    const suggestions = [];

    for (const deviation of deviations) {
        const rule = feedbackRules[deviation];

        if (!rule) continue;

        warnings.push(rule.message);
        suggestions.push(rule.suggestion);
    }

    const uniqueWarnings = [...new Set(warnings)];
    const uniqueSuggestions = [...new Set(suggestions)];

    let summary;

    if (uniqueWarnings.length === 0) {
        summary = "No listed form deviations were provided for assessment.";
    } else {
        summary = `${uniqueWarnings.length} form observation(s) identified.`;
    }

    return {
        warnings: uniqueWarnings,
        suggestions: uniqueSuggestions,
        summary
    };
}