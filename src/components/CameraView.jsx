
import { useEffect, useRef, useState } from 'react';

function CameraView({ exercise, onBack }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraStatus, setCameraStatus] = useState('idle');
  const [error, setError] = useState('');

  const startCamera = async () => {
    try {
      setError('');
      setCameraStatus('loading');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: 1280,
          height: 720,
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraStatus('active');

    } catch (err) {
      console.error('Camera error:', err);
      setError(
        'Camera access failed. Check browser permissions and try again.'
      );
      setCameraStatus('idle');
    }
  };

  // Attach the camera stream after the video element appears
  useEffect(() => {
    if (cameraStatus === 'active' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;

      videoRef.current.play().catch((err) => {
        console.error('Video playback error:', err);
        setError('Could not display the camera. Please try again.');
      });
    }
  }, [cameraStatus]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraStatus('idle');
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const cameraInstructions = {
    Squats: 'Position your camera to the side so your hips, knees and ankles are visible.',
    'Push-ups': 'Position your camera to the side so your shoulders, hips and ankles are visible.',
    'Bicep curls': 'Position your camera at the front or side so your shoulders, elbows and wrists are visible.',
    Lunges: 'Position your camera at the front or side so your hips, knees and ankles are visible.',
  };

  const instruction =
    cameraInstructions[exercise] ||
    'Position your camera so your full body and the joints involved in the exercise are visible.';

  return (
    <div className="camera-page">
      <button
        className="back-button"
        onClick={() => {
          stopCamera();
          onBack();
        }}
      >
        ← Back to exercises
      </button>

      <div className="camera-heading">
        <span className="eyebrow">CAMERA SETUP</span>
        <h1>Ready for <span>{exercise}?</span></h1>
        <p>Position yourself correctly before starting your assessment.</p>
      </div>

      <div className="camera-layout">
        <div className="camera-box">
          {cameraStatus === 'active' ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="camera-video"
            />
          ) : (
            <div className="camera-placeholder">
              <span className="camera-symbol">◎</span>
              <h3>
                {cameraStatus === 'loading'
                  ? 'Starting camera...'
                  : 'Camera preview'}
              </h3>
              <p>Your live camera feed will appear here.</p>
            </div>
          )}

          <div className="camera-status">
            <span className="status-dot"></span>
            {cameraStatus === 'active'
              ? 'CAMERA ACTIVE'
              : 'CAMERA NOT STARTED'}
          </div>
        </div>

        <div className="camera-instructions">
          <h2>Positioning instructions</h2>
          <p>{instruction}</p>

          <ul>
            <li>Keep your entire body visible.</li>
            <li>Use a stable camera position.</li>
            <li>Ensure the room has good lighting.</li>
            <li>Avoid objects blocking your body.</li>
          </ul>

          {error && <p className="camera-error">{error}</p>}

          {cameraStatus === 'active' ? (
            <button className="start-button" onClick={stopCamera}>
              Stop camera
            </button>
          ) : (
            <button
              className="start-button"
              onClick={startCamera}
              disabled={cameraStatus === 'loading'}
            >
              {cameraStatus === 'loading' ? 'Starting...' : 'Start camera'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CameraView;
