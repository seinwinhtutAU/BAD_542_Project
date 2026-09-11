import React from 'react';

export function splitSymptomNote(symptomsText) {
  if (!symptomsText) return { reported: '', analysis: null };

  const parts = symptomsText.split(/\n\nAI (?:symptom )?(?:summary|analysis):\s*/i);
  const reported = parts[0] || '';
  const analysisText = parts[1] || '';

  if (!analysisText) return { reported, analysis: null };

  const getField = (label) => {
    const match = analysisText.match(new RegExp(`(?:^|\\n)${label}:\\s*(.*)`, 'i'));
    return match ? match[1].trim() : '';
  };

  return {
    reported,
    analysis: {
      summary: getField('Summary'),
      urgency: getField('Urgency'),
      specialty: getField('Suggested specialty'),
      safetyNote: getField('Safety note'),
    },
  };
}

export default function AiSymptomSummary({ analysis }) {
  if (!analysis) return null;

  return (
    <div className="ai-summary-content">
      {analysis.summary && (
        <div className="ai-summary-row ai-summary-summary">
          <div className="ai-summary-label">Clinical summary</div>
          <div>{analysis.summary}</div>
        </div>
      )}
      <div className="ai-summary-fields">
        {analysis.urgency && (
          <div className="ai-summary-field">
            <div className="ai-summary-label">Urgency</div>
            <div className="ai-summary-value">{analysis.urgency}</div>
          </div>
        )}
        {analysis.specialty && (
          <div className="ai-summary-field">
            <div className="ai-summary-label">Suggested specialty</div>
            <div className="ai-summary-value">{analysis.specialty}</div>
          </div>
        )}
      </div>
      {analysis.safetyNote && (
        <div className="ai-summary-safety">
          <div className="ai-summary-label">Safety note</div>
          <div>{analysis.safetyNote}</div>
        </div>
      )}
    </div>
  );
}
