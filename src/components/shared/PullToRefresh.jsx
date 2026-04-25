import React, { useRef, useState, useCallback } from 'react';

const THRESHOLD = 64; // px to pull before triggering

export default function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const el = containerRef.current;
    if (el && el.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      e.preventDefault();
      setPulling(true);
      setPullY(Math.min(delta * 0.5, THRESHOLD + 20));
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullY >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullY(THRESHOLD);
      await onRefresh?.();
      setRefreshing(false);
    }
    setPulling(false);
    setPullY(0);
    startY.current = null;
  }, [pullY, refreshing, onRefresh]);

  const progress = Math.min(pullY / THRESHOLD, 1);
  const showIndicator = pullY > 4;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative', overscrollBehaviorY: 'none' }}
    >
      {/* Pull indicator */}
      {showIndicator && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: pullY,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          zIndex: 10,
          transition: pulling ? 'none' : 'height 0.3s ease',
        }}>
          <div style={{
            fontFamily: 'IM Fell English, serif',
            fontStyle: 'italic',
            fontSize: 12,
            color: 'var(--bordeaux)',
            letterSpacing: 1,
            opacity: progress,
            transform: `rotate(${refreshing ? 360 : progress * 180}deg)`,
            transition: refreshing ? 'transform 0.6s linear' : 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}>
            <span style={{ fontSize: 20 }}>{refreshing ? '⟳' : '↓'}</span>
            <span>{refreshing ? 'Actualisation…' : progress >= 1 ? 'Relâcher' : 'Tirer pour actualiser'}</span>
          </div>
        </div>
      )}

      {/* Content shifted down while pulling */}
      <div style={{
        transform: `translateY(${pullY}px)`,
        transition: pulling ? 'none' : 'transform 0.3s ease',
      }}>
        {children}
      </div>
    </div>
  );
}