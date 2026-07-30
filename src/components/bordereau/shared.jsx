import React from 'react';

export function WelcomeCard({ eyebrow, title, sub }) {
  return (
    <div style={{
      background: 'var(--bordeaux)',
      color: 'var(--creme)',
      padding: '18px 20px',
      marginBottom: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
        fontSize: 60, opacity: 0.1, pointerEvents: 'none',
      }}>✦</div>
      <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.7, marginBottom: 6 }}>{eyebrow}</div>
      <div className="font-playfair" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }} dangerouslySetInnerHTML={{ __html: title }} />
      <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, opacity: 0.75, marginTop: 6 }}>{sub}</div>
    </div>
  );
}

export function SectionTitle({ children }) {
  return (
    <div className="font-fell" style={{
      fontStyle: 'italic',
      fontSize: 11,
      letterSpacing: 3,
      textTransform: 'uppercase',
      color: 'var(--bordeaux)',
      margin: '24px 0 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      {children}
      <span style={{
        flex: 1,
        height: 1,
        background: 'repeating-linear-gradient(90deg, var(--bordeaux) 0, var(--bordeaux) 4px, transparent 4px, transparent 8px)',
      }} />
    </div>
  );
}

export function BtnCoupon({ children, onClick, secondary, style, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="font-special"
      style={{
        background: secondary ? 'transparent' : 'var(--bordeaux)',
        color: secondary ? 'var(--bordeaux)' : 'var(--creme)',
        border: secondary ? '1.5px dashed var(--bordeaux)' : 'none',
        padding: '8px 16px',
        fontSize: 12,
        letterSpacing: 2,
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'all 0.15s',
        outline: secondary ? 'none' : '2px dashed var(--bordeaux)',
        outlineOffset: 3,
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function PerfoStrip() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', margin: '20px -16px', overflow: 'hidden' }}>
      <div style={{
        flex: 1, height: 1,
        background: 'repeating-linear-gradient(90deg, hsl(var(--border)) 0, hsl(var(--border)) 4px, transparent 4px, transparent 8px)',
      }} />
      <div style={{ display: 'flex', gap: 4, padding: '0 8px' }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
        ))}
      </div>
      <div style={{
        flex: 1, height: 1,
        background: 'repeating-linear-gradient(90deg, hsl(var(--border)) 0, hsl(var(--border)) 4px, transparent 4px, transparent 8px)',
      }} />
    </div>
  );
}

export function EtagereItem({ statusClass, dotClass, title, sub, stampColor, stampLabel, stampSub, icon, onClick }) {
  const borderColors = {
    enVol: '#1a3a5c',
    auRelais: '#8B6914',
    recu: '#2d6a2d',
    default: 'var(--bordeaux)',
  };
  const dotColors = {
    paye: 'var(--bordeaux)',
    enVol: '#1a3a5c',
    auRelais: '#8B6914',
    recu: '#2d6a2d',
  };
  const borderColor = borderColors[statusClass] || borderColors.default;

  return (
    <div className="animate-fade-slide" role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} onClick={onClick} onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) onClick(); }} style={{
      background: 'var(--papier)',
      border: '1px solid hsl(var(--border))',
      borderLeft: `4px solid ${borderColor}`,
      padding: '12px 14px',
      marginBottom: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      cursor: onClick ? 'pointer' : 'default',
    }}>
      {icon ? (
        <span style={{ fontSize: 20 }}>{icon}</span>
      ) : (
        <span style={{
          width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
          background: dotColors[dotClass] || dotColors.paye,
          animation: dotClass === 'enVol' ? 'pulse 2s infinite' : dotClass === 'auRelais' ? 'pulse 1.5s infinite' : 'none',
        }} />
      )}
      <div style={{ flex: 1 }}>
        <div className="font-playfair" style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
        {sub && <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase',
          padding: '2px 7px', border: `1px solid ${stampColor}`, color: stampColor,
        }}>
          {stampLabel}
        </div>
        {stampSub && <div style={{ fontSize: 9, marginTop: 4, color: 'hsl(var(--muted-foreground))' }}>{stampSub}</div>}
      </div>
    </div>
  );
}