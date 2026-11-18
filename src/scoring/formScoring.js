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
        if (
            typeof score !== "number" ||
            !Number.isFinite(score) ||
            score < 0 ||
            score > 100
        ) {
            continue;
        }

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

    if (totalWeight === 0) {
        return {
            score: null,
            rating: "Unable to assess",
            assessedFeatures: 0,
            message: "Not enough reliable measurements"
        };
    }

    const finalScore = Math.round(
        weightedTotal / totalWeight
    );

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