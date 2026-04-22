import React from 'react';

export default function CouponButton({ children, secondary, disabled, className = '', onClick, ...props }) {
  if (secondary) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`bg-transparent text-bordeaux border-[1.5px] border-dashed border-bordeaux px-4 py-2 font-typewriter text-[12px] tracking-[2px] uppercase cursor-pointer transition-all hover:bg-bordeaux/5 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
      className={`bg-bordeaux text-creme border-none px-4 py-2 font-typewriter text-[12px] tracking-[2px] uppercase cursor-pointer relative transition-all outline-2 outline-dashed outline-bordeaux outline-offset-[3px] hover:bg-bordeaux-dark hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#5a0015] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}