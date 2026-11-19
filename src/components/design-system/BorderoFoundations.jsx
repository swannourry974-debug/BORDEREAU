import React from 'react';

export function BorderoEmptyState({ icon = '◇', title, description, action }) {
  return (
    <div className="bordero-empty-state">
      <div className="text-4xl mb-3 text-bordeaux" aria-hidden="true">{icon}</div>
      {title && <h3 className="font-heading text-xl font-bold text-bordeaux mb-2">{title}</h3>}
      {description && <p className="font-body italic text-encre/65 leading-7 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function BorderoLoadingIndicator({ label = 'Chargement…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-bordeaux">
      <div className="bordero-loading-indicator" aria-hidden="true" />
      <div className="font-body italic text-sm text-bordeaux/60">{label}</div>
    </div>
  );
}

export function BorderoNotice({ tone = 'info', title, children }) {
  const toneClass = tone === 'success'
    ? 'border-green-700/30 bg-green-700/10 text-green-900'
    : tone === 'danger'
      ? 'border-red-800/30 bg-red-800/10 text-red-900'
      : 'border-bordeaux/25 bg-bordeaux/5 text-bordeaux';

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      {title && <div className="font-ui text-[11px] font-bold uppercase tracking-[2px] mb-1">{title}</div>}
      <div className="font-body text-sm italic leading-6">{children}</div>
    </div>
  );
}

export default { BorderoEmptyState, BorderoLoadingIndicator, BorderoNotice };