// FormLens - Exercise Form Scoring Engine

/**
 * Calculates an overall form score from individual feature scores.
 *
 * Each feature score must be between 0 and 100.
 * Missing or invalid measurements are excluded.
 *
 * @param {Object} featureScores
 * @param {Object} weights
 * @returns {Object}
 */

export function calculateFormScore(featureScores, weights = {}) {

    if (
        !featureScores ||
        typeof featureScores !== "object" ||
        Array.isArray(featureScores)
    ) {
        return {
            score: null,
            rating: "Unable to assess",
            assessedFeatures: 0,
            message: "No reliable form measurements available"
        };
    }

    let weightedTotal = 0;
    let totalWeight = 0;
    let assessedFeatures = 0;

    for (const [feature, score] of Object.entries(featureScores)) {

        // Ignore missing or invalid measurements.
        if (
            typeof score !== "number" ||
            !Number.isFinite(score) ||
            score < 0 ||
            score > 100
        ) {
            continue;
        }

        // Use the supplied weight, or default to 1.
        const weight = weights[feature] ?? 1;

        if (
            typeof weight !== "number" ||
            !Number.isFinite(weight) ||
            weight <= 0
        ) {
            continue;
        }

        weightedTotal += score * weight;
        totalWeight += weight;
        assessedFeatures++;
    }

    // Do not invent a score when no features are assessable.
    if (totalWeight === 0) {
        return {
            score: null,
            rating: "Unable to assess",
            assessedFeatures: 0,
            message: "Not enough reliable measurements"
        };
    }

    const finalScore = Math.round(weightedTotal / totalWeight);

    let rating;

    if (finalScore >= 90) {
        rating = "Excellent";
    } else if (finalScore >= 75) {
        rating = "Good";
    } else if (finalScore >= 60) {
        rating = "Needs Improvement";
    } else {
        rating = "Poor";
    }

    return {
        score: finalScore,
        rating,
        assessedFeatures,
        message: `Your estimated form score is ${finalScore}/100`
    };
}