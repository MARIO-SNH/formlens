export default function WorkoutReport({ report, onRepeat, onHome }) {
  const category = report?.category || 'Insufficient Data';
  const feedback = report?.feedback || [];

  const categoryDescriptions = {
    Excellent: 'Your observed movement was consistently within the selected form targets.',
    Good: 'Your movement was generally controlled, with a few areas to improve.',
    'Needs Improvement': 'Some parts of your movement need more attention and practice.',
    Poor: 'The available movement observations showed several areas needing correction.',
    'Insufficient Data': 'There was not enough reliable movement data to assess this set.',
  };

  const categoryClass = category
    .toLowerCase()
    .replaceAll(' ', '-');

  return (
    <main className="report-page">
      <section className="report-card">
        <span className="eyebrow">SET COMPLETE</span>
        <h1>Workout <span>summary.</span></h1>

        <div className={`report-category ${categoryClass}`}>
          {category}
        </div>

        <p className="report-description">
          {categoryDescriptions[category] || categoryDescriptions['Insufficient Data']}
        </p>

        <div className="report-details">
          <div>
            <span>Exercise</span>
            <strong>{report?.exerciseName || 'Workout'}</strong>
          </div>

          <div>
            <span>Repetitions completed</span>
            <strong>
              {report?.completedReps ?? 0}
              {report?.targetReps
                ? ` / ${report.targetReps}`
                : ''}
            </strong>
          </div>
        </div>

        <div className="report-feedback">
          <h2>Form feedback</h2>

          {feedback.length > 0 ? (
            <ul>
              {feedback.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>
              {category === 'Insufficient Data'
                ? 'Try again with your full body visible and good lighting.'
                : 'No additional corrections were identified in the available checks.'}
            </p>
          )}
        </div>

        <div className="report-actions">
          <button className="start-workout-button" onClick={onRepeat}>
            Do another set
          </button>

          <button className="report-home-button" onClick={onHome}>
            Back to home
          </button>
        </div>
      </section>
    </main>
  );
}
