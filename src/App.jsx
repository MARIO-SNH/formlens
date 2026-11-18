
import { useState } from 'react';
import './App.css';
import ExerciseSelector from './components/ExerciseSelector';
import CameraView from './components/CameraView';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedExercise, setSelectedExercise] = useState('');

  const handleExerciseSelect = (exercise) => {
    setSelectedExercise(exercise);
    setCurrentPage('camera');
  };

  if (currentPage === 'exercises') {
    return (
      <ExerciseSelector
        onBack={() => setCurrentPage('home')}
        onSelectExercise={handleExerciseSelect}
      />
    );
  }

  if (currentPage === 'camera') {
    return (
      <CameraView
        exercise={selectedExercise}
        onBack={() => setCurrentPage('exercises')}
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
              Analyze your exercise technique in real time.
              Track your movement, understand your form,
              and improve every repetition with AI-powered
              feedback.
            </p>

            <button
              className="start-button"
              onClick={() => setCurrentPage('exercises')}
            >
              Start assessment <span>→</span>
            </button>

            <div className="hero-note">
              <span className="status-dot"></span>
              AI-powered movement analysis
            </div>
          </div>

          <div className="visual-card">
            <div className="visual-header">
              <span>BODY TRACKING</span>
              <span className="live-tag">● LIVE PREVIEW</span>
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
            <h2>Everything you need to move better.</h2>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <span className="feature-icon">◎</span>
              <h3>Pose Detection</h3>
              <p>Track body landmarks using camera-based AI technology.</p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">⌁</span>
              <h3>Joint Analysis</h3>
              <p>Understand joint angles and movement patterns during exercise.</p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">↗</span>
              <h3>Form Assessment</h3>
              <p>Receive movement-quality scores and actionable feedback.</p>
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
