const MEDIAPIPE_VERSION = "0.10.14";

const MEDIAPIPE_MODULE_URL =
    `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/+esm`;

const MEDIAPIPE_WASM_URL =
    `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;

const POSE_MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let poseLandmarker = null;
let visionModule = null;

export async function initializePoseDetection() {
    if (poseLandmarker) {
        return poseLandmarker;
    }

    visionModule = await import(MEDIAPIPE_MODULE_URL);

    const visionFiles =
        await visionModule.FilesetResolver.forVisionTasks(
            MEDIAPIPE_WASM_URL
        );

    poseLandmarker =
        await visionModule.PoseLandmarker.createFromOptions(
            visionFiles,
            {
                baseOptions: {
                    modelAssetPath: POSE_MODEL_URL,
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numPoses: 1,
                minPoseDetectionConfidence: 0.5,
                minPosePresenceConfidence: 0.5,
                minTrackingConfidence: 0.5
            }
        );

    return poseLandmarker;
}

export function detectPose(videoElement) {
    if (!poseLandmarker) {
        throw new Error(
            "Pose detection has not been initialized."
        );
    }

    if (
        !videoElement ||
        videoElement.readyState < 2 ||
        videoElement.videoWidth === 0
    ) {
        return null;
    }

    const result = poseLandmarker.detectForVideo(
        videoElement,
        performance.now()
    );

    if (
        !result.landmarks ||
        result.landmarks.length === 0
    ) {
        return null;
    }

    return {
        landmarks: result.landmarks[0],
        worldLandmarks: result.worldLandmarks?.[0] || null,
        confidence: result.landmarks[0].reduce(
            (total, landmark) =>
                total + (landmark.visibility ?? 0),
            0
        ) / result.landmarks[0].length
    };
}

export function closePoseDetection() {
    if (poseLandmarker) {
        poseLandmarker.close();
        poseLandmarker = null;
    }
}