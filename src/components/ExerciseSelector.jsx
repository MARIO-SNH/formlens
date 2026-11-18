
import { useState } from 'react';

const exercises = {
  Chest: ['Push-ups', 'Wide-grip push-ups'],
  Back: ['Bent-over rows', 'Reverse fly'],
  Shoulders: ['Shoulder press', 'Lateral raises'],
  Arms: ['Bicep curls', 'Overhead tricep extensions'],
  Legs: ['Squats', 'Lunges'],
};

function ExerciseSelector({ onBack, onSelectExercise }) {
  const [selectedGroup, setSelectedGroup] = useState('Chest');

  return (
    <div className="selector-page">
      <button className="back-button" onClick={onBack}>
        ← Back to Home
      </button>

      <div className="selector-heading">
        <span className="eyebrow">PERSONALIZED WORKOUT</span>
        <h1>Choose your <span>exercise.</span></h1>
        <p>
          Select a muscle group and choose the exercise
          you want FormLens to analyze.
        </p>
      </div>

      <div className="muscle-tabs">
        {Object.keys(exercises).map((group) => (
          <button
            key={group}
            className={
              selectedGroup === group
                ? 'muscle-tab active'
                : 'muscle-tab'
            }
            onClick={() => setSelectedGroup(group)}
          >
            {group}
          </button>
        ))}
      </div>

      <div className="exercise-grid">
        {exercises[selectedGroup].map((exercise, index) => (
          <button
            className="exercise-card"
            key={exercise}
            onClick={() => onSelectExercise(exercise)}
          >
            <div className="exercise-number">
              0{index + 1}
            </div>

            <h3>{exercise}</h3>

            <p>AI-powered form assessment</p>

            <span className="exercise-arrow">→</span>
          </button>
        ))}
      </div>

      <div className="selector-footer">
        10 EXERCISES · 5 MUSCLE GROUPS
      </div>
    </div>
  );
}

export default ExerciseSelector;
