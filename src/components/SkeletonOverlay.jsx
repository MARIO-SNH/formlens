
import { useEffect, useRef } from 'react';

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [11, 12],
  [11, 13], [13, 15],
  [12, 14], [14, 16],
  [15, 17], [15, 19], [15, 21],
  [16, 18], [16, 20], [16, 22],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27],
  [24, 26], [26, 28],
  [27, 29], [29, 31], [27, 31],
  [28, 30], [30, 32], [28, 32],
];

const FEATURE_JOINTS = {
  bodyAlignment: [11, 23, 27],
  elbowRange: [11, 12, 13, 14, 15, 16],
  squatDepth: [23, 24, 25, 26, 27, 28],
  armElevation: [11, 12, 13, 14],
  armSymmetry: [11, 12, 13, 14],
  elbowStability: [11, 12, 13, 14, 15, 16],
};

export default function SkeletonOverlay({ landmarks, assessment }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const ratio = window.devicePixelRatio || 1;

    if (!width || !height) return;

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (!Array.isArray(landmarks) || landmarks.length < 33) return;

    const visible = (index) => {
      const point = landmarks[index];
      return (
        point &&
        Number.isFinite(point.x) &&
        Number.isFinite(point.y) &&
        (point.visibility ?? 1) >= 0.3
      );
    };

    const jointStatuses = {};

    Object.entries(assessment?.features || {}).forEach(([name, feature]) => {
      if (feature.status !== 'good' && feature.status !== 'warning') return;

      const joints = FEATURE_JOINTS[name] || [];
      joints.forEach((index) => {
        const status = feature.status;
        if (!jointStatuses[index] || status === 'warning') {
          jointStatuses[index] = status;
        }
      });
    });

    const pointColor = (index) => {
      if (jointStatuses[index] === 'good') return '#22c55e';
      if (jointStatuses[index] === 'warning') return '#ef4444';
      return '#e5e7eb';
    };

    CONNECTIONS.forEach(([start, end]) => {
      if (!visible(start) || !visible(end)) return;

      const startStatus = jointStatuses[start];
      const endStatus = jointStatuses[end];

      ctx.beginPath();
      ctx.moveTo(landmarks[start].x * width, landmarks[start].y * height);
      ctx.lineTo(landmarks[end].x * width, landmarks[end].y * height);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      ctx.strokeStyle =
        startStatus === 'warning' || endStatus === 'warning'
          ? '#ef4444'
          : startStatus === 'good' && endStatus === 'good'
            ? '#22c55e'
            : '#38d9a9';

      ctx.stroke();
    });

    landmarks.forEach((point, index) => {
      if (!visible(index)) return;

      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 5, 0, Math.PI * 2);
      ctx.fillStyle = pointColor(index);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#111827';
      ctx.stroke();
    });
  }, [landmarks, assessment]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Live augmented reality pose and form overlay"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 5,
        pointerEvents: 'none',
      }}
    />
  );
}
