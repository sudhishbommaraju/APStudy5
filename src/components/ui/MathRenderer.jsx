import React, { memo } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// Clean common AI LaTeX mistakes before rendering
function sanitizeLatex(latex) {
  return latex
    .replace(/,\s*(?=[^{}]*\})/g, '') // remove commas inside math
    .replace(/\\text\s*\{([^}]*)\}/g, '\\text{$1}') // normalize \text{}
    .trim();
}

// Render a single math segment
function MathSegment({ src, block }) {
  const clean = sanitizeLatex(src);
  try {
    return block
      ? <BlockMath math={clean} />
      : <InlineMath math={clean} />;
  } catch {
    return <span className="text-red-400 font-mono text-xs">{src}</span>;
  }
}

// Split text into math and non-math segments and render
function MathRenderer({ text, className = '' }) {
  if (!text) return null;

  // Split on $$...$$ (block) and $...$ (inline)
  const parts = [];
  let remaining = text;
  const pattern = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let lastIndex = 0;
  let match;

  pattern.lastIndex = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    const raw = match[0];
    const isBlock = raw.startsWith('$$');
    const inner = isBlock ? raw.slice(2, -2) : raw.slice(1, -1);
    parts.push({ type: isBlock ? 'block' : 'inline', content: inner });
    lastIndex = match.index + raw.length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  if (parts.length === 1 && parts[0].type === 'text') {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.type === 'text') return <span key={i}>{part.content}</span>;
        if (part.type === 'block') {
          return (
            <span key={i} className="block my-3 text-center overflow-x-auto">
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