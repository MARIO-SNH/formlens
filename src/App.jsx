import { useState } from 'react';
import './App.css';

import ExerciseSelector from './components/ExerciseSelector';
import WorkoutSetup from './components/WorkoutSetup';
import CameraView from './components/CameraView';
import WorkoutReport from './components/WorkoutReport';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [targetReps, setTargetReps] = useState(12);
  const [workoutReport, setWorkoutReport] = useState(null);

  function handleExerciseSelect(exercise) {
    setSelectedExercise(exercise);
    setCurrentPage('setup');
  }

  function handleStartWorkout(reps) {
    setTargetReps(reps);
    setWorkoutReport(null);
    setCurrentPage('camera');
  }

  function handleWorkoutComplete(report) {
    setWorkoutReport(report);
    setCurrentPage('report');
  }

  function handleRepeatWorkout() {
    setWorkoutReport(null);
    setCurrentPage('setup');
  }

  if (currentPage === 'exercises') {
    return (
      <ExerciseSelector
        onBack={() => setCurrentPage('home')}
        onSelectExercise={handleExerciseSelect}
      />
    );
  }

  if (currentPage === 'setup') {
    return (
      <WorkoutSetup
        exercise={selectedExercise}
        onBack={() => setCurrentPage('exercises')}
        onStart={handleStartWorkout}
      />
    );
  }

  if (currentPage === 'camera') {
    return (
      <CameraView
        exercise={selectedExercise}
        targetReps={targetReps}
        onBack={() => setCurrentPage('setup')}
        onComplete={handleWorkoutComplete}
      />
    );
  }

  if (currentPage === 'report') {
    return (
      <WorkoutReport
        report={workoutReport}
        onRepeat={handleRepeatWorkout}
        onHome={() => setCurrentPage('home')}
      />
    );
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="brand">
          <span className="brand-icon">✳</span>
          <span>FormLens</span>
        </div>
        <span className="nav-tag">AI FITNESS ANALYSIS</span>
      </nav>

      <main className="main-content">
        <section className="hero">
          <div className="hero-text">
            <span className="eyebrow">
              YOUR PERSONAL AI FITNESS ASSISTANT
            </span>

            <h1>
              Train smarter.
              <br />
              <span>Move better.</span>
            </h1>

            <p>
              Practice your exercises with live camera-based
              body tracking and movement feedback.
            </p>

            <button
              className="start-button"
              onClick={() => setCurrentPage('exercises')}
            >
              Start workout <span>→</span>
            </button>

            <div className="hero-note">
              <span className="status-dot"></span>
              AI-powered movement analysis
            </div>
          </div>

          <div className="visual-card">
            <div className="visual-header">
              <span>BODY TRACKING</span>
              <span className="live-tag">● READY</span>
            </div>

            <div className="skeleton-placeholder">
              <div className="skeleton-circle">◎</div>
              <div className="skeleton-label">
                YOUR MOVEMENT
                <br />
                STARTS HERE
              </div>
            </div>

            <div className="visual-footer">
              <span>POSE DETECTION</span>
              <span>READY TO START</span>
            </div>
          </div>
        </section>

        <section className="features">
          <div className="section-heading">
            <span>WHAT FORMLENS DOES</span>
            <h2>Focus on better movement.</h2>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <span className="feature-icon">◎</span>
              <h3>Live Body Tracking</h3>
              <p>Track body landmarks using your camera.</p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">⌁</span>
              <h3>AR Form Overlay</h3>
              <p>See body tracking and correction indicators on screen.</p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">↗</span>
              <h3>Workout Feedback</h3>
              <p>Review simple feedback after completing your set.</p>
            </div>
          </div>
        </section>

        <footer>
          FORMLENS © 2026 · MOVE WITH CONFIDENCE
        </footer>
      </main>
    </div>
  );
}

export default App;