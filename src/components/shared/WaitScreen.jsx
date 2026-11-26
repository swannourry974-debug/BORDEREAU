import React from 'react';

export default function WaitScreen({ label = 'On ouvre le carnet…' }) {
  return (
    <div className="bordero-wait" role="status" aria-live="polite">
      <div className="bordero-wait-inline">
        <span className="bordero-loading-indicator" aria-hidden="true" />
        <p className="bordero-wait-caption">{label}</p>
      </div>
    </div>
  );
}
