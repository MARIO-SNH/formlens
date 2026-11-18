
function isValidPoint(point) {
  return (
    point &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y)
  );
}

export function calculateAngle(A, B, C) {
  if (
    !isValidPoint(A) ||
    !isValidPoint(B) ||
    !isValidPoint(C)
  ) {
    return null;
  }

  const vectorBA = {
    x: A.x - B.x,
    y: A.y - B.y,
    z: Number.isFinite(A.z) && Number.isFinite(B.z)
      ? A.z - B.z
      : 0,
  };

  const vectorBC = {
    x: C.x - B.x,
    y: C.y - B.y,
    z: Number.isFinite(C.z) && Number.isFinite(B.z)
      ? C.z - B.z
      : 0,
  };

  const dotProduct =
    vectorBA.x * vectorBC.x +
    vectorBA.y * vectorBC.y +
    vectorBA.z * vectorBC.z;

  const magnitudeBA = Math.hypot(
    vectorBA.x,
    vectorBA.y,
    vectorBA.z
  );

  const magnitudeBC = Math.hypot(
    vectorBC.x,
    vectorBC.y,
    vectorBC.z
  );

  if (
    magnitudeBA < 1e-8 ||
    magnitudeBC < 1e-8
  ) {
    return null;
  }

  const cosine =
    dotProduct / (magnitudeBA * magnitudeBC);

  const clampedCosine = Math.max(
    -1,
    Math.min(1, cosine)
  );

  const radians = Math.acos(clampedCosine);
  const degrees = radians * (180 / Math.PI);

  if (!Number.isFinite(degrees)) {
    return null;
  }

  return Number(degrees.toFixed(1));
}
