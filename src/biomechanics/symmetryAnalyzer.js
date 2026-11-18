export function analyzeSymmetry(
    leftAngle,
    rightAngle,
    tolerance = 10
) {
    const leftValid =
        typeof leftAngle === "number" &&
        Number.isFinite(leftAngle) &&
        leftAngle >= 0 &&
        leftAngle <= 180;

    const rightValid =
        typeof rightAngle === "number" &&
        Number.isFinite(rightAngle) &&
        rightAngle >= 0 &&
        rightAngle <= 180;

    if (!leftValid || !rightValid) {
        return {
            difference: null,
            symmetryScore: null,
            isSymmetrical: null,
            message: "Unable to assess symmetry"
        };
    }

    const difference = Math.abs(leftAngle - rightAngle);

    const symmetryScore = Math.max(
        0,
        Math.round(100 - (difference / 180) * 100)
    );

    const isSymmetrical = difference <= tolerance;

    return {
        difference: Math.round(difference),
        symmetryScore,
        isSymmetrical,
        message: isSymmetrical
            ? "Good left/right symmetry"
            : "Left/right movement imbalance detected"
    };
}