import React, { useEffect, useState } from 'react';
import LoadingPassportTicket from './LoadingPassportTicket';

export default function LoadingScreen({ onComplete, mode = 'loading', onWake }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (mode !== 'loading') return;
    if (progress >= 100) {
      const t = setTimeout(() => onComplete?.(), 400);
      return () => clearTimeout(t);
    }
    const speed = progress < 60 ? 35 : progress < 85 ? 55 : 80;
    const t = setTimeout(() => setProgress(p => Math.min(p + 1, 100)), speed);
    return () => clearTimeout(t);
  }, [progress, onComplete, mode]);

  const isIdle = mode === 'idle';

  return (
    <div className="bordero-wait" onClick={isIdle ? onWake : undefined}>
      <div className="bordero-wait-sheet">
        <LoadingPassportTicket mode={mode} progress={progress} onWake={onWake} />
      </div>
    </div>
  );
}
