import React, { memo } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

/**
 * Minimal LaTeX cleaner — only fixes what's strictly necessary.
 * Do NOT touch backslashes or restructure expressions.
 */
function sanitize(latex) {
  if (!latex || typeof latex !== 'string') return '';
  return latex
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // Remove surrounding whitespace
    .trim();
}

function MathSegment({ src, block }) {
  const clean = sanitize(src);
  try {
    if (block) return <BlockMath math={clean} />;
    return <InlineMath math={clean} />;
  } catch {
    // Silent fallback — show as clean text, not red error
    return <span className="font-mono text-sm opacity-70">{clean}</span>;
  }
}

/**
 * MathRenderer — parses $...$ inline and $$...$$ block math from text strings.
 * Handles mixed text + math gracefully.
 */
function MathRenderer({ text, className = '' }) {
  if (!text) return null;
  const str = String(text);

  // Fast path: no dollar signs at all
  if (!str.includes('$')) {
    return <span className={className}>{str}</span>;
  }

  const parts = [];
  // Match $$....$$ first (block), then $...$ (inline)
  const pattern = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: str.slice(lastIndex, match.index) });
    }
    const raw = match[0];
    const isBlock = raw.startsWith('$$');
    const inner = isBlock ? raw.slice(2, -2).trim() : raw.slice(1, -1).trim();
    parts.push({ type: isBlock ? 'block' : 'inline', content: inner });
    lastIndex = match.index + raw.length;
  }
  if (lastIndex < str.length) {
    parts.push({ type: 'text', content: str.slice(lastIndex) });
  }

  // Only plain text found
  if (parts.length === 1 && parts[0].type === 'text') {
    return <span className={className}>{str}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.type === 'text') return <span key={i}>{part.content}</span>;
        if (part.type === 'block') {
          return (
            <span key={i} className="block my-4 overflow-x-auto text-center">
              <MathSegment src={part.content} block={true} />
            </span>
          );
        }
        return <MathSegment key={i} src={part.content} block={false} />;
      })}
    </span>
  );
}

export default memo(MathRenderer);