import React from 'react';

export default function BorderoCard({ children, className = '', ...props }) {
  return (
    <section {...props} className={`bordero-card rounded-[16px] p-4 ${className}`}>
      {children}
    </section>
  );
}