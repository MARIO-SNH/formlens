export function calculateAngle(A, B, C) {
    if (!A || !B || !C) return null;

    const vectorBA = {
        x: A.x - B.x,
        y: A.y - B.y,
        z: (A.z || 0) - (B.z || 0)
    };

    const vectorBC = {
        x: C.x - B.x,
        y: C.y - B.y,
        z: (C.z || 0) - (B.z || 0)
    };

    const dotProduct =
        vectorBA.x * vectorBC.x +
        vectorBA.y * vectorBC.y +
        vectorBA.z * vectorBC.z;

    const magnitudeBA = Math.sqrt(
        vectorBA.x ** 2 +
        vectorBA.y ** 2 +
        vectorBA.z ** 2
    );

    const magnitudeBC = Math.sqrt(
        vectorBC.x ** 2 +
        vectorBC.y ** 2 +
        vectorBC.z ** 2
    );

    if (magnitudeBA === 0 || magnitudeBC === 0) {
        return null;
    }

    let cosineAngle =
        dotProduct / (magnitudeBA * magnitudeBC);

    cosineAngle = Math.max(-1, Math.min(1, cosineAngle));

    const angleRadians = Math.acos(cosineAngle);

    return Math.round(angleRadians * (180 / Math.PI));
}