import React from 'react';

export default function PerfoStrip() {
  return (
    <div className="flex items-center my-5 -mx-4 overflow-hidden">
      <span className="flex-1 h-px perfo-line" />
      <div className="flex gap-1 px-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full border border-foreground/20 bg-creme" />
        ))}
      </div>
      <span className="flex-1 h-px perfo-line" />
    </div>
  );
}