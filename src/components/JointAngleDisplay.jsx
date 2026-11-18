
export default function JointAngleDisplay({ angles = {} }) {
  const angleItems = [
    { label: 'Left Knee', value: angles.leftKnee },
    { label: 'Right Knee', value: angles.rightKnee },
    { label: 'Left Hip', value: angles.leftHip },
    { label: 'Right Hip', value: angles.rightHip },
    { label: 'Left Elbow', value: angles.leftElbow },
    { label: 'Right Elbow', value: angles.rightElbow },
    { label: 'Left Arm Elevation', value: angles.leftArmElevation },
    { label: 'Right Arm Elevation', value: angles.rightArmElevation },
    { label: 'Body Alignment', value: angles.bodyAlignment },
  ];

  return (
    <section className="joint-angle-panel">
      <h2>Joint Angles</h2>
      <p className="joint-angle-subtitle">
        Live measurements from your body tracking
      </p>

      <div className="joint-angle-grid">
        {angleItems.map((item) => (
          <div className="joint-angle-card" key={item.label}>
            <span>{item.label}</span>
            <strong>
              {Number.isFinite(item.value)
                ? `${Math.round(item.value)}°`
                : '--'}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}
