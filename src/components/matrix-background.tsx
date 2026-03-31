
import React from 'react';

const Column = () => <div className="matrix-column"></div>;
const Pattern = () => (
  <div className="matrix-pattern">
    {Array.from({ length: 40 }).map((_, i) => <Column key={i} />)}
  </div>
);

export function MatrixBackground() {
  return (
    <div className="matrix-container">
      <Pattern />
      <Pattern />
      <Pattern />
      <Pattern />
      <Pattern />
      <div className="matrix-overlay"></div>
    </div>
  );
}
