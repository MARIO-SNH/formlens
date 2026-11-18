
const COORDINATES = ["x", "y", "z"];

export function smoothLandmarks(
  previousLandmarks,
  currentLandmarks,
  alpha = 0.35,
  visibilityThreshold = 0.3
) {
  if (!Array.isArray(currentLandmarks)) {
    return [];
  }

  const weight = Math.max(0, Math.min(1, alpha));

  if (!Array.isArray(previousLandmarks)) {
    return currentLandmarks.map((point) =>
      point ? { ...point } : null
    );
  }

  return currentLandmarks.map((current, index) => {
    if (!current) {
      return null;
    }

    const previous = previousLandmarks[index];
    const visibility = current.visibility ?? 1;

    // Keep the current point without smoothing when it is unreliable.
    if (
      !previous ||
      visibility < visibilityThreshold
    ) {
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
