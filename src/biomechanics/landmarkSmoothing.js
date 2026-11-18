const COORDINATES = ["x", "y", "z"];

export function smoothLandmarks(
    previousLandmarks,
    currentLandmarks,
    alpha = 0.35
) {
    if (!Array.isArray(currentLandmarks)) {
        return [];
    }

    if (!Array.isArray(previousLandmarks)) {
        return currentLandmarks.map(point =>
            point ? { ...point } : point
        );
    }

    const weight = Math.max(0, Math.min(1, alpha));

    return currentLandmarks.map((current, index) => {
        const previous = previousLandmarks[index];

        if (!current) return null;

        if (!previous) {
            return { ...current };
        }

        const smoothed = { ...current };

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