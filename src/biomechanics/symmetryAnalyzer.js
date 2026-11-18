// FormLens - Left/Right Symmetry Analyzer

/**
 * Compares left and right joint angles.
 *
 * @param {number|null} leftAngle
 * @param {number|null} rightAngle
 * @param {number} tolerance
 * @returns {object}
 */

export function analyzeSymmetry(
    leftAngle,
    rightAngle,
    tolerance = 10
) {
    // Check whether both measurements are valid.
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

    // Do not calculate symmetry if either side is unavailable.
    if (!leftValid || !rightValid) {
        return {
            difference: null,
            symmetryScore: null,
            isSymmetrical: null,
            message: "Unable to assess symmetry"
        };
    }

    // Calculate the difference between both sides.
    const difference = Math.abs(leftAngle - rightAngle);

    // Calculate an approximate symmetry score.
    const symmetryScore = Math.max(
        0,
        Math.round(100 - (difference / 180) * 100)
    );

    // Determine whether the difference is within tolerance.
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