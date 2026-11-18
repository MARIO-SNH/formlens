import { useEffect, useRef, useState } from 'react';

import {
  initializePoseDetection,
  detectPose,
  closePoseDetection,
} from '../ai/poseDetection';

import { calculateAngle } from '../biomechanics/angleCalculator';
import { createRepCounter } from '../biomechanics/movementAnalyzer';
import { evaluateExerciseForm } from '../biomechanics/exerciseRules';
import { smoothLandmarks } from '../biomechanics/landmarkSmoothing';
import { generateWorkoutReport } from '../biomechanics/reportGenerator';

import SkeletonOverlay from './SkeletonOverlay';

const EXERCISES = {
  pushups: {
    id: 'pushups',
    name: 'Push-ups',
    bottom: 100,
    top: 160,
    metric: 'elbow',
    cameraView: 'side',
    instruction: 'Stand side-on. Keep your shoulders, hips, elbows and ankles visible.',
  },
  widegrippushups: {
    id: 'widePushUps',
    name: 'Wide-grip Push-ups',
    bottom: 100,
    top: 160,
    metric: 'elbow',
    cameraView: 'front',
    instruction: 'Face the camera and keep both arms visible.',
  },
  bentoverrows: {
    id: 'bentOverRows',
    name: 'Bent-over Rows',
    bottom: 100,
    top: 155,
    metric: 'elbow',
    cameraView: 'side',
    instruction: 'Stand side-on and keep your back and arms visible.',
  },
  reversefly: {
    id: 'reverseFly',
    name: 'Reverse Fly',
    bottom: 25,
    top: 75,
    metric: 'arm',
    cameraView: 'front',
    instruction: 'Face the camera and keep both arms visible.',
  },
  shoulderpress: {
    id: 'shoulderPress',
    name: 'Shoulder Press',
    bottom: 105,
    top: 155,
    metric: 'elbow',
    cameraView: 'front',
    instruction: 'Face the camera and keep your upper body visible.',
  },
  lateralraises: {
    id: 'lateralRaises',
    name: 'Lateral Raises',
    bottom: 20,
    top: 75,
    metric: 'arm',
    cameraView: 'front',
    instruction: 'Face the camera and keep both arms and shoulders visible.',
  },
  bicepcurls: {
    id: 'bicepCurls',
    name: 'Bicep Curls',
    bottom: 70,
    top: 150,
    metric: 'elbow',
    cameraView: 'side',
    instruction: 'Stand side-on and keep your shoulder, elbow and wrist visible.',
  },
  overheadtricepextensions: {
    id: 'overheadTricepExtensions',
    name: 'Overhead Tricep Extensions',
    bottom: 105,
    top: 155,
    metric: 'elbow',
    cameraView: 'side',
    instruction: 'Stand side-on and keep your upper arm and elbow visible.',
  },
  squats: {
    id: 'squats',
    name: 'Squats',
    bottom: 110,
    top: 160,
    metric: 'knee',
    cameraView: 'side',
    instruction: 'Stand side-on. Keep your hip, knee, ankle and foot visible.',
  },
  lunges: {
    id: 'lunges',
    name: 'Lunges',
    bottom: 100,
    top: 160,
    metric: 'knee',
    cameraView: 'side',
    instruction: 'Stand side-on and keep your hips, knees and ankles visible.',
  },
};

const ASSESSABLE_EXERCISES = new Set([
  'pushups',
  'squats',
  'lateralRaises',
  'bicepCurls',
]);

function normalizeExerciseName(name) {
  return String(name || '').toLowerCase().replace(/[^a-z]/g, '');
}

function visiblePoint(landmarks, index) {
  const point = landmarks?.[index];

  if (
    !point ||
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    (point.visibility ?? 1) < 0.3
  ) {
    return null;
  }

  return point;
}

function calculateJointAngles(landmarks) {
  const point = (index) => visiblePoint(landmarks, index);

  return {
    leftKnee: calculateAngle(point(23), point(25), point(27)),
    rightKnee: calculateAngle(point(24), point(26), point(28)),
    leftHip: calculateAngle(point(11), point(23), point(25)),
    rightHip: calculateAngle(point(12), point(24), point(26)),
    leftElbow: calculateAngle(point(11), point(13), point(15)),
    rightElbow: calculateAngle(point(12), point(14), point(16)),
    leftArmElevation: calculateAngle(point(23), point(11), point(13)),
    rightArmElevation: calculateAngle(point(24), point(12), point(14)),
    bodyAlignment: calculateAngle(point(11), point(23), point(27)),
  };
}

function getRepetitionAngle(angles, metric) {
  if (metric === 'elbow') {
    return angles.leftElbow ?? angles.rightElbow;
  }

  if (metric === 'arm') {
    return angles.leftArmElevation ?? angles.rightArmElevation;
  }

  if (metric === 'knee') {
    return angles.leftKnee ?? angles.rightKnee;
  }

  return null;
}

export default function CameraView({
  exercise,
  targetReps = 12,
  onBack,
  onComplete,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const repCounterRef = useRef(null);
  const runningRef = useRef(false);
  const previousLandmarksRef = useRef(null);
  const sampleBufferRef = useRef([]);
  const completedRepSamplesRef = useRef([]);
  const finishingRef = useRef(false);

  const exerciseKey = normalizeExerciseName(exercise);
  const config = EXERCISES[exerciseKey];
  const canAssess = Boolean(
    config && ASSESSABLE_EXERCISES.has(config.id)
  );

  const [cameraStatus, setCameraStatus] = useState('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [poseData, setPoseData] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [repetitions, setRepetitions] = useState(0);
  const [error, setError] = useState('');

  if (config && !repCounterRef.current) {
    repCounterRef.current = createRepCounter({
      bottomThreshold: config.bottom,
      topThreshold: config.top,
    });
  }

  useEffect(() => {
    repCounterRef.current = config
      ? createRepCounter({
          bottomThreshold: config.bottom,
          topThreshold: config.top,
        })
      : null;

    previousLandmarksRef.current = null;
    sampleBufferRef.current = [];
    completedRepSamplesRef.current = [];
    finishingRef.current = false;

    setRepetitions(0);
    setAssessment(null);
    setPoseData(null);
    setIsPaused(false);
  }, [exerciseKey, targetReps]);

  function stopCamera() {
    runningRef.current = false;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    previousLandmarksRef.current = null;
    closePoseDetection();

    setCameraStatus('idle');
    setIsPaused(false);
    setPoseData(null);
  }

  function finishSet() {
    if (finishingRef.current) return;

    finishingRef.current = true;
    runningRef.current = false;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    const report = generateWorkoutReport({
      exerciseName: config?.name || exercise,
      completedReps: completedRepSamplesRef.current.length,
      targetReps,
      repSamples: completedRepSamplesRef.current,
    });

    stopCamera();
    onComplete?.(report);
  }

  function runPoseDetection() {
    if (!runningRef.current || finishingRef.current) return;

    const video = videoRef.current;

    if (!video || video.readyState < 2 || !video.videoWidth) {
      animationRef.current = requestAnimationFrame(runPoseDetection);
      return;
    }

    try {
      const result = detectPose(video);

      if (result?.landmarks?.length) {
        const smoothedLandmarks = smoothLandmarks(
          previousLandmarksRef.current,
          result.landmarks,
          0.35,
          0.3
        );

        previousLandmarksRef.current = smoothedLandmarks;

        const smoothedPose = {
          ...result,
          landmarks: smoothedLandmarks,
        };

        const angles = calculateJointAngles(smoothedLandmarks);

        setPoseData(smoothedPose);

        if (config) {
          const angle = getRepetitionAngle(angles, config.metric);
          const repResult = repCounterRef.current?.update(angle);

          let currentAssessment = null;

          if (canAssess) {
            currentAssessment = evaluateExerciseForm({
              exerciseId: config.id,
              angles,
              landmarks: smoothedLandmarks,
              cameraView: config.cameraView,
            });

            setAssessment(currentAssessment);
          } else {
            setAssessment(null);
          }

          if (currentAssessment?.success) {
            sampleBufferRef.current.push({
              features: currentAssessment.features,
            });

            // Prevent an unusually long set from growing without limit.
            if (sampleBufferRef.current.length > 600) {
              sampleBufferRef.current.shift();
            }
          }

          if (repResult?.counted) {
            completedRepSamplesRef.current.push(
              [...sampleBufferRef.current]
            );

            sampleBufferRef.current = [];

            setRepetitions(repResult.repetitions);

            if (repResult.repetitions >= targetReps) {
              // Allow the state update to commit before creating the report.
              window.setTimeout(() => {
                finishSet();
              }, 0);

              return;
            }
          } else if (repResult) {
            setRepetitions(repResult.repetitions);
          }
        }
      } else {
        previousLandmarksRef.current = null;
        setPoseData(null);
        setAssessment(null);
      }
    } catch (err) {
      console.error('Pose detection error:', err);
      runningRef.current = false;
      setError('Body tracking stopped. Please stop and restart the camera.');
      return;
    }

    if (runningRef.current) {
      animationRef.current = requestAnimationFrame(runPoseDetection);
    }
  }

  async function startCamera() {
    try {
      setError('');
      setPoseData(null);
      setAssessment(null);
      setRepetitions(0);

      repCounterRef.current?.reset();
      sampleBufferRef.current = [];
      completedRepSamplesRef.current = [];
      previousLandmarksRef.current = null;
      finishingRef.current = false;

      setCameraStatus('loading');

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported by this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraStatus('active');
    } catch (err) {
      console.error('Camera error:', err);
      setCameraStatus('idle');

      setError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow camera access in your browser settings.'
          : err.message || 'Unable to access the camera.'
      );
    }
  }

  function pauseWorkout() {
    runningRef.current = false;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    setIsPaused(true);
  }

  function resumeWorkout() {
    if (!streamRef.current || finishingRef.current) return;

    runningRef.current = true;
    setIsPaused(false);
    runPoseDetection();
  }

  useEffect(() => {
    if (cameraStatus !== 'active') return undefined;

    let cancelled = false;

    async function initialize() {
      try {
        const video = videoRef.current;

        if (!video || !streamRef.current) return;

        video.srcObject = streamRef.current;
        await video.play();
        await initializePoseDetection();

        if (cancelled || !streamRef.current) {
          return;
        }

        runningRef.current = true;
        runPoseDetection();
      } catch (err) {
        console.error('Pose initialization error:', err);

        if (!cancelled) {
          runningRef.current = false;
          setError(
            'Could not initialize body tracking. Please stop and try again.'
          );
        }
      }
    }

    initialize();

    return () => {
      cancelled = true;
      runningRef.current = false;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [cameraStatus]);

  useEffect(() => {
    return () => {
      runningRef.current = false;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      closePoseDetection();
    };
  }, []);

  if (!config) {
    return (
      <main className="camera-page">
        <p>That exercise could not be found.</p>
        <button className="back-button" onClick={onBack}>
          Back
        </button>
      </main>
    );
  }

  return (
    <main className="camera-page workout-camera-page">
      <header className="workout-topbar">
        <button
          className="back-button"
          onClick={() => {
            stopCamera();
            onBack?.();
          }}
        >
          ← Back
        </button>

        <div className="workout-exercise-name">
          <span>{config.name}</span>
          <small>FormLens AR workout</small>
        </div>
      </header>

      <section className="rep-counter-card">
        <div>
          <span className="rep-counter-label">REPETITIONS</span>
          <div className="rep-counter-value">
            {repetitions}
            <span> / {targetReps}</span>
          </div>
        </div>

        <div className="rep-progress-track">
          <div
            className="rep-progress-fill"
            style={{
              width: `${Math.min(100, (repetitions / targetReps) * 100)}%`,
            }}
          />
        </div>
      </section>

      <section className="workout-camera-frame">
        {cameraStatus === 'active' ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="workout-video"
            />

            <div className="workout-overlay">
              <SkeletonOverlay
                landmarks={poseData?.landmarks}
                assessment={assessment}
              />
            </div>

            <div className="tracking-indicator">
              <span className={poseData ? 'tracking-dot active' : 'tracking-dot'} />
              {poseData ? 'Body detected' : 'Move into camera view'}
            </div>

            {isPaused && (
              <div className="paused-overlay">
                <strong>Workout paused</strong>
                <span>Resume when you're ready.</span>
              </div>
            )}
          </>
        ) : (
          <div className="workout-camera-placeholder">
            <div className="camera-placeholder-icon">◎</div>

            <h2>
              {cameraStatus === 'loading'
                ? 'Starting camera…'
                : 'Ready when you are'}
            </h2>

            <p>
              {cameraStatus === 'loading'
                ? 'Please allow camera and body tracking to initialize.'
                : config.instruction}
            </p>
          </div>
        )}
      </section>

      <p className="camera-position-hint">
        Camera view: {config.cameraView}. Keep the required joints visible.
      </p>

      {error && <p className="camera-error">{error}</p>}

      <div className="workout-controls">
        {cameraStatus === 'idle' ? (
          <button className="start-workout-button" onClick={startCamera}>
            Start camera
          </button>
        ) : cameraStatus === 'loading' ? (
          <button className="start-workout-button" disabled>
            Starting…
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                className="start-workout-button"
                onClick={resumeWorkout}
              >
                Resume
              </button>
            ) : (
              <button
                className="pause-workout-button"
                onClick={pauseWorkout}
              >
                Pause
              </button>
            )}

            <button
              className="finish-workout-button"
              onClick={finishSet}
            >
              Finish set
            </button>
          </>
        )}
      </div>
    </main>
  );
}