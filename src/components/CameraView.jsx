
import { useEffect, useRef, useState } from 'react';

import {
  initializePoseDetection,
  detectPose,
  closePoseDetection,
} from '../ai/poseDetection';

import { calculateAngle } from '../biomechanics/angleCalculator';
import { createRepCounter } from '../biomechanics/movementAnalyzer';
import { evaluateExerciseForm } from '../biomechanics/exerciseRules';

import SkeletonOverlay from './SkeletonOverlay';
import JointAngleDisplay from './JointAngleDisplay';

const EXERCISE_IDS = {
  pushups: 'pushups',
  widegrippushups: 'widePushups',
  bentoverrows: 'bentOverRows',
  reversefly: 'reverseFly',
  shoulderpress: 'shoulderPress',
  lateralraises: 'lateralRaises',
  bicepcurls: 'bicepCurls',
  overheadtricepextensions: 'overheadTricepExtensions',
  squats: 'squats',
  lunges: 'lunges',
};

const EXERCISE_CONFIG = {
  pushups: { bottom: 100, top: 160, metric: 'elbow', cameraView: 'side' },
  widegrippushups: { bottom: 100, top: 160, metric: 'elbow', cameraView: 'front' },
  bentoverrows: { bottom: 100, top: 155, metric: 'elbow', cameraView: 'side' },
  reversefly: { bottom: 25, top: 75, metric: 'arm', cameraView: 'front' },
  shoulderpress: { bottom: 105, top: 155, metric: 'elbow', cameraView: 'front' },
  lateralraises: { bottom: 20, top: 75, metric: 'arm', cameraView: 'front' },
  bicepcurls: { bottom: 70, top: 150, metric: 'elbow', cameraView: 'side' },
  overheadtricepextensions: { bottom: 105, top: 155, metric: 'elbow', cameraView: 'side' },
  squats: { bottom: 115, top: 160, metric: 'knee', cameraView: 'side' },
  lunges: { bottom: 100, top: 160, metric: 'knee', cameraView: 'side' },
};

const HISTORY_SIZE = 12;

function normalizeExerciseName(name) {
  return (name || '').toLowerCase().replace(/[^a-z]/g, '');
}

function getVisiblePoint(landmarks, index) {
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
  const point = (index) => getVisiblePoint(landmarks, index);

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
  if (metric === 'elbow') return angles.leftElbow ?? angles.rightElbow;
  if (metric === 'arm') return angles.leftArmElevation ?? angles.rightArmElevation;
  if (metric === 'knee') return angles.leftKnee ?? angles.rightKnee;
  return null;
}

function getPhaseLabel(phase) {
  const labels = {
    unknown: 'Waiting for movement',
    contracted: 'Bottom position reached',
    extended: 'Starting position reached',
    extending: 'Returning to starting position',
    flexing: 'Moving into position',
  };

  return labels[phase] || phase;
}

function getRecentMovement(history, key) {
  const values = history
    .map((frame) => frame[key])
    .filter((value) => Number.isFinite(value));

  if (values.length < 3) return null;

  const movementDegrees = Math.max(...values) - Math.min(...values);

  return Number(movementDegrees.toFixed(1));
}

function buildMovementMetrics(history) {
  const torsoMovement = getRecentMovement(history, 'bodyAlignment');
  const leftArmMovement = getRecentMovement(history, 'leftArmElevation');
  const rightArmMovement = getRecentMovement(history, 'rightArmElevation');

  const armMovements = [leftArmMovement, rightArmMovement].filter(
    Number.isFinite
  );

  const upperArmMovement =
    armMovements.length > 0 ? Math.max(...armMovements) : null;

  return {
    torsoStability: {
      movementDegrees: torsoMovement,
    },
    upperArmStability: {
      movementDegrees: upperArmMovement,
    },
    hipStability: {
      movementDegrees: torsoMovement,
    },
    shoulderStability: {
      movementDegrees: upperArmMovement,
    },
    movementControl: {
      movementDegrees: getRecentMovement(history, 'primaryAngle'),
    },
  };
}

export default function CameraView({ exercise, onBack }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  const movementHistoryRef = useRef([]);

  const exerciseKey = normalizeExerciseName(exercise);
  const exerciseId = EXERCISE_IDS[exerciseKey] || null;
  const exerciseConfig = EXERCISE_CONFIG[exerciseKey] || null;

  const repCounterRef = useRef(null);
  const currentExerciseRef = useRef(null);

  if (exerciseConfig && currentExerciseRef.current !== exerciseKey) {
    repCounterRef.current = createRepCounter({
      bottomThreshold: exerciseConfig.bottom,
      topThreshold: exerciseConfig.top,
    });

    currentExerciseRef.current = exerciseKey;
  }

  const [cameraStatus, setCameraStatus] = useState('idle');
  const [poseStatus, setPoseStatus] = useState('loading');
  const [poseData, setPoseData] = useState(null);
  const [jointAngles, setJointAngles] = useState({});
  const [repetitions, setRepetitions] = useState(0);
  const [movementPhase, setMovementPhase] = useState('unknown');
  const [formAssessment, setFormAssessment] = useState(null);
  const [error, setError] = useState('');

  const cameraInstructions = {
    squats: 'Stand sideways to the camera so your hips, knees and ankles are visible.',
    pushups: 'Position the camera to your side so your full body is visible.',
    widegrippushups: 'Face the camera. Keep both arms and shoulders visible.',
    bentoverrows: 'Position the camera to your side. Keep your back and arms visible.',
    reversefly: 'Face the camera and keep both arms and shoulders visible.',
    shoulderpress: 'Face the camera with your full upper body visible.',
    lateralraises: 'Face the camera and keep both arms visible.',
    bicepcurls: 'Use a side view and keep your shoulder, elbow and wrist visible.',
    overheadtricepextensions: 'Use a side view and keep your upper arm and elbow visible.',
    lunges: 'Use a front or side view. Keep your hips, knees and ankles visible.',
  };

  function resetRepCounter() {
    if (repCounterRef.current) repCounterRef.current.reset();

    movementHistoryRef.current = [];

    setRepetitions(0);
    setMovementPhase('unknown');
    setFormAssessment(null);
  }

  function stopCamera() {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) videoRef.current.srcObject = null;

    closePoseDetection();
    resetRepCounter();

    setCameraStatus('idle');
    setPoseStatus('loading');
    setPoseData(null);
    setJointAngles({});
    setError('');
  }

  function runPoseDetection() {
    if (!streamRef.current) return;

    const video = videoRef.current;

    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      animationRef.current = requestAnimationFrame(runPoseDetection);
      return;
    }

    try {
      const result = detectPose(video);

      if (result?.landmarks?.length) {
        const landmarks = result.landmarks;
        const angles = calculateJointAngles(landmarks);

        setPoseData(result);
        setJointAngles(angles);
        setPoseStatus('detected');

        if (exerciseConfig && exerciseId && repCounterRef.current) {
          const repetitionAngle = getRepetitionAngle(
            angles,
            exerciseConfig.metric
          );

          const history = movementHistoryRef.current;

          history.push({
            bodyAlignment: angles.bodyAlignment,
            leftArmElevation: angles.leftArmElevation,
            rightArmElevation: angles.rightArmElevation,
            primaryAngle: repetitionAngle,
          });

          if (history.length > HISTORY_SIZE) history.shift();

          const movementMetrics = buildMovementMetrics(history);

          const repResult = repCounterRef.current.update(repetitionAngle);

          setRepetitions(repResult.repetitions);
          setMovementPhase(repResult.phase);

          const assessment = evaluateExerciseForm({
            exerciseId,
            angles,
            landmarks,
            cameraView: exerciseConfig.cameraView,
            phase: repResult.phase,
            movementMetrics,
          });

          setFormAssessment(assessment);
        }
      } else {
        movementHistoryRef.current = [];
        setPoseData(null);
        setJointAngles({});
        setFormAssessment(null);
        setPoseStatus('not-detected');
      }
    } catch (err) {
      console.error('Pose detection error:', err);
      setPoseStatus('error');
    }

    animationRef.current = requestAnimationFrame(runPoseDetection);
  }

  async function startCamera() {
    try {
      setError('');
      setPoseData(null);
      setJointAngles({});
      resetRepCounter();
      setPoseStatus('loading');
      setCameraStatus('loading');

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported by this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraStatus('active');
    } catch (err) {
      console.error('Camera error:', err);
      setCameraStatus('idle');

      setError(
        err.message ||
          'Unable to access your camera. Please check camera permissions.'
      );
    }
  }

  useEffect(() => {
    if (cameraStatus !== 'active') return;

    let cancelled = false;

    async function setupCameraAndPose() {
      try {
        const video = videoRef.current;

        if (!video || !streamRef.current) return;

        video.srcObject = streamRef.current;
        await video.play();

        await initializePoseDetection();

        if (cancelled || !streamRef.current) return;

        runPoseDetection();
      } catch (err) {
        console.error('Pose detection initialization error:', err);

        if (!cancelled) {
          setPoseStatus('error');
          setError(
            'Camera is working, but body tracking could not start. Check the console for details.'
          );
        }
      }
    }

    setupCameraAndPose();

    return () => {
      cancelled = true;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [cameraStatus]);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      closePoseDetection();
    };
  }, []);

  return (
    <div className="camera-page">
      <button className="back-button" onClick={onBack}>
        Back to exercises
      </button>

      <h1>Live Form Assessment</h1>

      <p className="camera-subtitle">
        Selected exercise: <strong>{exercise}</strong>
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
                objectFit: 'cover',
              }}
            />

            <SkeletonOverlay landmarks={poseData?.landmarks} />

            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                zIndex: 20,
                padding: '10px 14px',
                background: '#111827',
                color: '#38D9A9',
                border: '2px solid #38D9A9',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 'bold',
                lineHeight: 1.5,
              }}
            >
              Landmarks: {poseData?.landmarks?.length ?? 0}
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
              ? 'Body detected successfully!'
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
            Visibility estimate: {Math.round((poseData.confidence ?? 0) * 100)}%
          </p>
        )}
      </div>

      <JointAngleDisplay angles={jointAngles} />

      {exerciseConfig && (
        <section className="joint-angle-panel">
          <h2>Repetition Counter</h2>

          <div className="joint-angle-grid">
            <div className="joint-angle-card">
              <span>Completed Reps</span>
              <strong>{repetitions}</strong>
            </div>

            <div className="joint-angle-card">
              <span>Movement Phase</span>
              <strong>{getPhaseLabel(movementPhase)}</strong>
            </div>
          </div>

          <button
            className="stop-camera-button"
            onClick={resetRepCounter}
            style={{ marginTop: 16 }}
          >
            Reset Repetitions
          </button>
        </section>
      )}

      <section className="joint-angle-panel">
        <h2>Form Assessment</h2>

        {!formAssessment ? (
          <p>
            {cameraStatus !== 'active'
              ? 'Start the camera to assess your exercise form.'
              : poseStatus === 'not-detected'
                ? 'Move into the camera view so your body can be assessed.'
                : 'Waiting for movement measurements...'}
          </p>
        ) : !formAssessment.success ? (
          <p>Assessment could not be completed: {formAssessment.error}</p>
        ) : formAssessment.formScore === null ? (
          <div>
            <h3>Unable to assess</h3>
            <p>
              More visible movement measurements are needed to calculate your
              form score.
            </p>
          </div>
        ) : (
          <>
            <div className="joint-angle-grid">
              <div className="joint-angle-card">
                <span>Form Score</span>
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

              <div className="joint-angle-card">
                <span>Checks Unavailable</span>
                <strong>{formAssessment.unavailableFeatures}</strong>
              </div>
            </div>

            <h3>Form Feedback</h3>

            {formAssessment.feedback?.length > 0 ? (
              <ul>
                {formAssessment.feedback.map((message, index) => (
                  <li key={`${message}-${index}`}>{message}</li>
                ))}
              </ul>
            ) : (
              <p>No deviations detected in the features assessed so far.</p>
            )}

            <h3>Assessment Details</h3>

            <ul>
              {Object.entries(formAssessment.features || {}).map(
                ([featureName, feature]) => (
                  <li key={featureName}>
                    <strong>
                      {featureName.replace(/([A-Z])/g, ' $1')}:
                    </strong>{' '}
                    {feature.status === 'unavailable'
                      ? 'Unable to assess'
                      : feature.status === 'warning'
                        ? 'Needs attention'
                        : 'Within target range'}
                  </li>
                )
              )}
            </ul>
          </>
        )}
      </section>

      <div className="camera-instructions">
        <h3>Camera positioning</h3>
        <p>
          {cameraInstructions[exerciseKey] ||
            'Keep your full body visible and make sure the lighting is good.'}
        </p>
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
