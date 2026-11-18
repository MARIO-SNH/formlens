
import { useEffect, useRef } from 'react';

const CONNECTIONS = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],

  // Arms and shoulders
  [11, 12],
  [11, 13], [13, 15],
  [12, 14], [14, 16],
  [15, 17], [15, 19], [15, 21],
  [16, 18], [16, 20], [16, 22],

  // Torso
  [11, 23], [12, 24], [23, 24],

  // Legs
  [23, 25], [25, 27],
  [24, 26], [26, 28],
  [27, 29], [29, 31], [27, 31],
  [28, 30], [30, 32], [28, 32],
];

export default function SkeletonOverlay({ landmarks }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const pixelRatio = window.devicePixelRatio || 1;

    if (!width || !height) return;

    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (!landmarks || landmarks.length < 33) return;

    const isVisible = (index) => {
      const point = landmarks[index];

      return (
        point &&
        Number.isFinite(point.x) &&
        Number.isFinite(point.y) &&
        (point.visibility ?? 1) > 0.3
      );
    };

    // Draw connections
    ctx.strokeStyle = '#38D9A9';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    CONNECTIONS.forEach(([start, end]) => {
      if (!isVisible(start) || !isVisible(end)) return;

      ctx.beginPath();
      ctx.moveTo(
        landmarks[start].x * width,
        landmarks[start].y * height
      );
      ctx.lineTo(
        landmarks[end].x * width,
        landmarks[end].y * height
      );
      ctx.stroke();
    });

    // Draw joints
    landmarks.forEach((point, index) => {
      if (!isVisible(index)) return;

      ctx.beginPath();
      ctx.arc(
        point.x * width,
        point.y * height,
        5,
        0,
        Math.PI * 2
      );

      ctx.fillStyle = '#F9FAFB';
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#38D9A9';
      ctx.stroke();
    });
  }, [landmarks]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 5,
        pointerEvents: 'none',
      }}
    />
  );
}
