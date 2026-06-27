import React, { useId } from 'react';

/**
 * Proofly logo — a faceted winged "V" with a diamond crest, rendered as a
 * transparent-background SVG so it sits cleanly on both light and dark themes.
 * Lit faces use the bright-blue gradient; folded faces use a deep navy.
 */
export function LogoMark({ size = 34, className = '' }) {
  const uid = useId();
  const lit = `pf-lit-${uid}`;
  const fold = `pf-fold-${uid}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={lit} x1="16" y1="26" x2="104" y2="106" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3D7BFF" />
          <stop offset="0.55" stopColor="#2563EB" />
          <stop offset="1" stopColor="#16267A" />
        </linearGradient>
        <linearGradient id={fold} x1="16" y1="26" x2="104" y2="106" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1E50C8" />
          <stop offset="1" stopColor="#0E1A56" />
        </linearGradient>
      </defs>
      {/* left wing */}
      <path d="M16 34 L45 52 L60 104 Z" fill={`url(#${lit})`} />
      <path d="M45 52 L53 68 L60 104 Z" fill={`url(#${fold})`} />
      {/* right wing */}
      <path d="M104 34 L75 52 L60 104 Z" fill={`url(#${lit})`} />
      <path d="M75 52 L67 68 L60 104 Z" fill={`url(#${fold})`} />
      {/* diamond crest */}
      <path d="M60 26 L47 52 L60 78 Z" fill={`url(#${lit})`} />
      <path d="M60 26 L73 52 L60 78 Z" fill={`url(#${fold})`} />
    </svg>
  );
}

export default function Logo({ markSize = 30, showText = true, className = '', textClassName = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={markSize} className="shrink-0" />
      {showText && (
        <span className={`font-display text-[1.35rem] font-bold tracking-tight text-foreground ${textClassName}`}>
          Proofly
        </span>
      )}
    </span>
  );
}
