import React from 'react';

export default function CouponButton({ children, secondary, disabled, className = '', onClick, ...props }) {
  if (secondary) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`bordero-action-secondary px-4 py-2 text-[12px] cursor-pointer transition-all hover:bg-bordeaux/5 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bordero-action-primary px-4 py-2 text-[12px] cursor-pointer relative transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}