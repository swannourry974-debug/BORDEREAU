import React from 'react';

export default function BorderoButton({ children, variant = 'gold', className = '', ...props }) {
  const isGhost = variant === 'ghost';
  return (
    <button
      {...props}
      className={`bordero-ui inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[16px] border px-5 py-3 text-sm font-semibold shadow-[0_10px_24px_rgba(46,17,17,0.18)] ${className}`}
      style={{
        background: isGhost ? 'transparent' : 'var(--cta-orange)',
        color: isGhost ? 'var(--or-clair)' : 'var(--bordeaux)',
        borderColor: 'rgba(200,161,101,0.48)',
      }}
    >
      {children}
    </button>
  );
}