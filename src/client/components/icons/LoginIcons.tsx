import React from 'react';

const ICON_PROPS = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const EyeIcon: React.FC = () => (
  <svg {...ICON_PROPS}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon: React.FC = () => (
  <svg {...ICON_PROPS}>
    <path d="M17.94 17.94A10.94 10.94 0 0112 19c-5 0-9-7-9-7a21.86 21.86 0 015.06-5.94M1 1l22 22" />
  </svg>
);
