
export function createRepCounter({
  bottomThreshold,
  topThreshold,
  confirmationFrames = 2,
  minimumRepFrames = 4,
}) {
  if (
    !Number.isFinite(bottomThreshold) ||
    !Number.isFinite(topThreshold) ||
    bottomThreshold >= topThreshold
  ) {
    throw new Error('Invalid repetition thresholds.');
  }

  let repetitions = 0;
  let phase = 'unknown';
  let hasReachedBottom = false;
  let bottomFrames = 0;
  let topFrames = 0;
  let repFrames = 0;

  function update(angle) {
    if (
      !Number.isFinite(angle) ||
      angle < 0 ||
      angle > 180
    ) {
      return { repetitions, phase, counted: false, valid: false };
    }

    let counted = false;
    repFrames += 1;

    if (angle <= bottomThreshold) {
      bottomFrames += 1;
      topFrames = 0;
      phase = 'contracted';

      if (bottomFrames >= confirmationFrames) {
        hasReachedBottom = true;
      }
    } else if (angle >= topThreshold) {
      topFrames += 1;
      bottomFrames = 0;
      phase = 'extended';

      if (
        hasReachedBottom &&
        topFrames >= confirmationFrames &&
        repFrames >= minimumRepFrames
      ) {
        repetitions += 1;
        counted = true;
        hasReachedBottom = false;
        repFrames = 0;
      }
    } else {
      bottomFrames = 0;
      topFrames = 0;

      phase = hasReachedBottom ? 'extending' : 'flexing';
    }

    return { repetitions, phase, counted, valid: true };
  }

  function reset() {
    repetitions = 0;
    phase = 'unknown';
    hasReachedBottom = false;
    bottomFrames = 0;
    topFrames = 0;
    repFrames = 0;
  }

  return { update, reset };
}
