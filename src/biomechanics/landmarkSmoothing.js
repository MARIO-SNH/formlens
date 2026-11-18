// FormLens - Landmark Smoothing
// Uses Exponential Moving Average (EMA) to reduce landmark jitter.

const COORDINATES = ["x", "y", "z"];

/**
 * Smooths current landmarks using previous landmarks.
 *
 * @param {Array} previousLandmarks
 * @param {Array} currentLandmarks
 * @param {number} alpha
 * @returns {Array}
 */

export function smoothLandmarks(
    previousLandmarks,
    currentLandmarks,
    alpha = 0.35
) {
    if (!Array.isArray(currentLandmarks)) {
        return [];
    }

    // First frame: no previous data exists.
    if (!Array.isArray(previousLandmarks)) {
        return currentLandmarks.map(point =>
            point ? { ...point } : point
        );
    }

    // Alpha controls how much the latest frame influences the result.
    const weight = Math.max(0, Math.min(1, alpha));

    return currentLandmarks.map((current, index) => {
        const previous = previousLandmarks[index];

        // Handle missing landmarks.
        if (!current) {
            return null;
        }

        // If no previous landmark exists, use the current one.
        if (!previous) {
            return { ...current };
        }

        const smoothed = { ...current };

        // Smooth x, y and z coordinates.
        for (const coordinate of COORDINATES) {
            if (
                Number.isFinite(current[coordinate]) &&
                Number.isFinite(previous[coordinate])
            ) {
                smoothed[coordinate] =
                    weight * current[coordinate] +
                    (1 - weight) * previous[coordinate];
            }
        }

        return smoothed;
    });
}