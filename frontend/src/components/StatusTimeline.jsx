import React from 'react';

const STAGES = [
  { key: 'PENDING', label: 'Booked', hint: 'Waiting for the doctor to confirm' },
  { key: 'CONFIRMED', label: 'Confirmed', hint: 'Turn up at the clinic room' },
  { key: 'COMPLETED', label: 'Completed', hint: 'Consultation finished' },
];

/**
 * Shows where an appointment has got to, so "PENDING" stops being a word
 * students have to guess the meaning of. A cancelled appointment leaves the
 * normal path, so it is shown on its own rather than as a fourth stage.
 */
export default function StatusTimeline({ status }) {
  if (status === 'CANCELLED') {
    return (
      <div className="timeline timeline-cancelled">
        <div className="timeline-step done">
          <span className="timeline-dot" aria-hidden="true" />
          <span className="timeline-label">Booked</span>
        </div>
        <div className="timeline-step current">
          <span className="timeline-dot" aria-hidden="true" />
          <span className="timeline-label">Cancelled</span>
          <span className="timeline-hint">This appointment will not go ahead</span>
        </div>
      </div>
    );
  }

  const currentIndex = Math.max(0, STAGES.findIndex((s) => s.key === status));

  return (
    <ol className="timeline">
      {STAGES.map((stage, index) => {
        const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo';
        return (
          <li key={stage.key} className={`timeline-step ${state}`}>
            <span className="timeline-dot" aria-hidden="true" />
            <span className="timeline-label">{stage.label}</span>
            {state === 'current' && <span className="timeline-hint">{stage.hint}</span>}
          </li>
        );
      })}
    </ol>
  );
}
