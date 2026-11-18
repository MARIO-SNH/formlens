import { useState } from 'react';

const PRESET_REPS = [8, 10, 12, 15];

export default function WorkoutSetup({ exercise, onBack, onStart }) {
  const [selectedReps, setSelectedReps] = useState(12);
  const [customReps, setCustomReps] = useState('');

  function startWorkout() {
    const reps = customReps.trim()
      ? Number(customReps)
      : selectedReps;

    if (!Number.isInteger(reps) || reps < 1 || reps > 100) {
      return;
    }

    onStart(reps);
  }

  const validCustom =
    customReps.trim() !== '' &&
    Number.isInteger(Number(customReps)) &&
    Number(customReps) >= 1 &&
    Number(customReps) <= 100;

  return (
    <main className="setup-page">
      <button className="back-button" onClick={onBack}>
        ← Back to exercises
      </button>

      <section className="setup-card">
        <span className="eyebrow">WORKOUT SETUP</span>
        <h1>Set your <span>target.</span></h1>

        <p className="setup-exercise">
          Selected exercise: <strong>{exercise}</strong>
        </p>

        <h2>How many repetitions?</h2>

        <div className="rep-options">
          {PRESET_REPS.map((reps) => (
            <button
              key={reps}
              type="button"
              className={
                !customReps && selectedReps === reps
                  ? 'rep-option selected'
                  : 'rep-option'
              }
              onClick={() => {
                setSelectedReps(reps);
                setCustomReps('');
              }}
            >
              {reps}
            </button>
          ))}
        </div>

        <label className="custom-reps-label" htmlFor="custom-reps">
          Or enter a custom target
        </label>

        <input
          id="custom-reps"
          className="custom-reps-input"
          type="number"
          min="1"
          max="100"
          step="1"
          placeholder="Enter reps (1–100)"
          value={customReps}
          onChange={(event) => setCustomReps(event.target.value)}
        />

        <p className="setup-note">
          Your set will finish automatically when you reach your target.
          You can also finish it early.
        </p>

        <button
          className="start-workout-button"
          onClick={startWorkout}
          disabled={customReps.trim() !== '' && !validCustom}
        >
          Start workout →
        </button>
      </section>
    </main>
  );
}