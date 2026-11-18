
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

import SkeletonOverlay from './SkeletonOverlay';
import JointAngleDisplay from './JointAngleDisplay';

const EXERCISES = {
  pushups: {
    id: 'pushups',
    name: 'Push-ups',
    bottom: 100,
    top: 160,
    metric: 'elbow',
    cameraView: 'side',
    instruction: 'Stand side-on to the camera. Keep your shoulders, hips and ankles visible.',
  },
  widegrippushups: {
    id: 'widePushups',
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
  const p = (index) => visiblePoint(landmarks, index);

  return {
    leftKnee: calculateAngle(p(23), p(25), p(27)),
    rightKnee: calculateAngle(p(24), p(26), p(28)),
    leftHip: calculateAngle(p(11), p(23), p(25)),
    rightHip: calculateAngle(p(12), p(24), p(26)),
    leftElbow: calculateAngle(p(11), p(13), p(15)),
    rightElbow: calculateAngle(p(12), p(14), p(16)),
    leftArmElevation: calculateAngle(p(23), p(11), p(13)),
    rightArmElevation: calculateAngle(p(24), p(12), p(14)),
    bodyAlignment: calculateAngle(p(11), p(23), p(27)),
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

export default function CameraView({ exercise, onBack }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const repCounterRef = useRef(null);
  const runningRef = useRef(false);
  const previousLandmarksRef = useRef(null);

  const exerciseKey = normalizeExerciseName(exercise);
  const config = EXERCISES[exerciseKey];
  const canAssess = Boolean(config && ASSESSABLE_EXERCISES.has(config.id));

  const [cameraStatus, setCameraStatus] = useState('idle');
  const [poseStatus, setPoseStatus] = useState('loading');
  const [poseData, setPoseData] = useState(null);
  const [jointAngles, setJointAngles] = useState({});
  const [repetitions, setRepetitions] = useState(0);
  const [movementPhase, setMovementPhase] = useState('unknown');
  const [formAssessment, setFormAssessment] = useState(null);
  const [error, setError] = useState('');

  // Create a counter for the initially selected exercise.
  if (config && !repCounterRef.current) {
    repCounterRef.current = createRepCounter({
      bottomThreshold: config.bottom,
      topThreshold: config.top,
    });
  }

  // Reset the counter and smoothing history whenever the exercise changes.
  useEffect(() => {
    if (!config) {
      repCounterRef.current = null;
      return;
    }

    repCounterRef.current = createRepCounter({
      bottomThreshold: config.bottom,
      topThreshold: config.top,
    });

    previousLandmarksRef.current = null;
    setRepetitions(0);
    setMovementPhase('unknown');
    setFormAssessment(null);
    setPoseData(null);
    setJointAngles({});
  }, [exerciseKey]);

  function resetRepetitions() {
    repCounterRef.current?.reset();
    previousLandmarksRef.current = null;

    setRepetitions(0);
    setMovementPhase('unknown');
    setFormAssessment(null);
  }

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
    resetRepetitions();

    setCameraStatus('idle');
    setPoseStatus('loading');
    setPoseData(null);
    setJointAngles({});
  }

  function runPoseDetection() {
    if (!runningRef.current) return;

    const video = videoRef.current;

    if (!video || video.readyState < 2 || !video.videoWidth) {
      animationRef.current = requestAnimationFrame(runPoseDetection);
      return;
    }

    try {
      const result = detectPose(video);

      if (result?.landmarks?.length) {
        const rawLandmarks = result.landmarks;

        // Smooth landmark positions to reduce frame-to-frame jitter.
        const smoothedLandmarks = smoothLandmarks(
          previousLandmarksRef.current,
          rawLandmarks,
          0.35,
          0.3
        );

        previousLandmarksRef.current = smoothedLandmarks;

        // Use the smoothed points consistently for angles and assessment.
        const smoothedPose = {
          ...result,
          landmarks: smoothedLandmarks,
        };

        const angles = calculateJointAngles(smoothedLandmarks);

        setPoseData(smoothedPose);
        setJointAngles(angles);
        setPoseStatus('detected');

        if (config) {
          const angle = getRepetitionAngle(angles, config.metric);
          const repResult = repCounterRef.current?.update(angle);

          if (repResult) {
            setRepetitions(repResult.repetitions);
            setMovementPhase(repResult.phase);
          }

          if (canAssess) {
            const assessment = evaluateExerciseForm({
              exerciseId: config.id,
              angles,
              landmarks: smoothedLandmarks,
              cameraView: config.cameraView,
            });

            setFormAssessment(assessment);
          } else {
            setFormAssessment(null);
          }
        }
      } else {
        previousLandmarksRef.current = null;

        setPoseData(null);
        setJointAngles({});
        setFormAssessment(null);
        setPoseStatus('not-detected');
      }
    } catch (err) {
      console.error('Pose detection error:', err);

      setPoseStatus('error');
      setError('Body tracking stopped unexpectedly. Stop and restart the camera.');

      runningRef.current = false;
      return;
    }

    animationRef.current = requestAnimationFrame(runPoseDetection);
  }

  async function startCamera() {
    try {
      setError('');
      setPoseData(null);
      setJointAngles({});
      previousLandmarksRef.current = null;
      resetRepetitions();

      setPoseStatus('loading');
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
          closePoseDetection();
          return;
        }

        runningRef.current = true;
        runPoseDetection();
      } catch (err) {
        console.error('Pose initialization error:', err);

        if (!cancelled) {
          setPoseStatus('error');
          setError('Could not initialize body tracking. Please stop and try again.');
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

  const phaseLabel = {
    unknown: 'Waiting for movement',
    contracted: 'Bottom position',
    extended: 'Starting position',
    extending: 'Returning upward',
    flexing: 'Moving downward',
  };

  return (
    <div className="camera-page">
      <button
        className="back-button"
        onClick={() => {
          stopCamera();
          onBack?.();
        }}
      >
        ← Back to exercises
      </button>

      <h1>Live Form Assessment</h1>

      <p className="camera-subtitle">
        Selected exercise: <strong>{config?.name || exercise}</strong>
      </p>

      <div className="camera-box">
        {cameraStatus === 'active' ? (
          <div
            style={{
              position: 'relative',
              width: '100%',
              lineHeight: 0,
              overflow: 'hidden',
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
                transform: 'scaleX(-1)',
              }}
            />

            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: 'scaleX(-1)',
              }}
            >
              <SkeletonOverlay
                landmarks={poseData?.landmarks}
                assessment={formAssessment}
              />
            </div>

            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                zIndex: 10,
                padding: '8px 12px',
                background: 'rgba(17, 24, 39, 0.85)',
                color: '#fff',
                borderRadius: 8,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <div>● AR body tracking</div>
              <div>Landmarks: {poseData?.landmarks?.length ?? 0}</div>
            </div>
          </div>
        ) : (
          <div className="camera-placeholder">
            <span className="camera-icon">◉</span>
            <p>
              {cameraStatus === 'loading'
                ? 'Starting camera...'
                : 'Your camera preview will appear here'}
            </p>
          </div>
        )}
      </div>

      <div className="camera-status">
        <p>
          Camera:{' '}
          <strong>
            {cameraStatus === 'active'
              ? 'Active'
              : cameraStatus === 'loading'
                ? 'Starting...'
                : 'Off'}
          </strong>
        </p>

        <p>
          Body tracking:{' '}
          <strong>
            {poseStatus === 'detected'
              ? 'Body detected'
              : poseStatus === 'not-detected'
                ? 'No body detected. Move into view.'
                : poseStatus === 'error'
                  ? 'Tracking error'
                  : 'Searching for body...'}
          </strong>
        </p>

        <p>Landmarks received: {poseData?.landmarks?.length ?? 0}</p>

        {poseData && (
          <p>
            Pose visibility estimate:{' '}
            {Math.round((poseData.confidence ?? 0) * 100)}%
          </p>
        )}
      </div>

      <JointAngleDisplay angles={jointAngles} />

      {config && (
        <section className="joint-angle-panel">
          <h2>Repetition Counter</h2>

          <div className="joint-angle-grid">
            <div className="joint-angle-card">
              <span>Completed Reps</span>
              <strong>{repetitions}</strong>
            </div>

            <div className="joint-angle-card">
              <span>Movement Phase</span>
              <strong>{phaseLabel[movementPhase] || movementPhase}</strong>
            </div>
          </div>

          <button
            className="stop-camera-button"
            onClick={resetRepetitions}
            style={{ marginTop: 16 }}
          >
            Reset Repetitions
          </button>
        </section>
      )}

      <section className="joint-angle-panel">
        <h2>Form Assessment</h2>

        {!canAssess ? (
          <p>
            Live pose tracking and repetition counting are available for this
            exercise. Detailed form scoring is not enabled for it yet.
          </p>
        ) : !formAssessment ? (
          <p>
            {poseStatus === 'not-detected'
              ? 'Move into the camera view so your body can be assessed.'
              : 'Waiting for visible joint measurements...'}
          </p>
        ) : formAssessment.formScore === null ? (
          <p>
            {formAssessment.feedback?.[0] ||
              'More visible joint measurements are needed.'}
          </p>
        ) : (
          <>
            <div className="joint-angle-grid">
              <div className="joint-angle-card">
                <span>Live Form Estimate</span>
                <strong>{Math.round(formAssessment.formScore)}/100</strong>
              </div>

              <div className="joint-angle-card">
                <span>Rating</span>
                <strong>{formAssessment.rating}</strong>
              </div>

              <div className="joint-angle-card">
                <span>Checks Assessed</span>
                <strong>{formAssessment.assessedFeatures}</strong>
              </div>
            </div>

            <h3>Form Feedback</h3>

            {formAssessment.feedback.length ? (
              <ul>
                {formAssessment.feedback.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            ) : (
              <p>No deviation detected in the measured checks.</p>
            )}

            <h3>Assessment Details</h3>

            <ul>
              {Object.entries(formAssessment.features).map(([name, feature]) => (
                <li key={name}>
                  <strong>{name.replace(/([A-Z])/g, ' $1')}:</strong>{' '}
                  {feature.status === 'unavailable'
                    ? 'Not assessed'
                    : feature.status === 'warning'
                      ? 'Needs attention'
                      : 'Within target range'}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="camera-instructions">
        <h3>Camera positioning</h3>

        <p>
          {config?.instruction ||
            'Keep your full body visible and make sure the lighting is good.'}
        </p>

        {config && (
          <p>
            Required view: <strong>{config.cameraView}</strong>
          </p>
        )}
      </section>

      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          margin: '12px 0',
        }}
      >
        <span>
          <strong style={{ color: '#22c55e' }}>●</strong> Within target
        </span>
        <span>
          <strong style={{ color: '#ef4444' }}>●</strong> Needs attention
        </span>
        <span>
          <strong style={{ color: '#9ca3af' }}>●</strong> Not assessed
        </span>
      </div>

      {error && <p className="camera-error">{error}</p>}

      <div className="camera-controls">
        {cameraStatus === 'idle' ? (
          <button className="start-camera-button" onClick={startCamera}>
            Start Camera
          </button>
        ) : (
          <button className="stop-camera-button" onClick={stopCamera}>
            Stop Camera
          </button>
        )}
      </div>
    </div>
  );
}
