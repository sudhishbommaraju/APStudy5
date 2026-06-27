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
    .trim();
}

// Models don't always use $-delimiters. Normalize the other common LaTeX
// delimiters to $/$$ so the parser below can find the math:
//   \( ... \)  ->  $ ... $    (inline)
//   \[ ... \]  ->  $$ ... $$  (display)
// Using function replacements avoids `$`-in-replacement-string quirks.
function normalizeDelims(s) {
  return s
    .replace(/\\\[/g, () => '$$')
    .replace(/\\\]/g, () => '$$')
    .replace(/\\\(/g, () => '$')
    .replace(/\\\)/g, () => '$');
}

function FallbackText({ children }) {
  return <span className="font-mono text-[0.95em] opacity-80">{children}</span>;
}

function MathSegment({ src, block }) {
  const clean = sanitize(src);
  try {
    // renderError keeps a bad expression from printing KaTeX's red error markup.
    const renderError = () => <FallbackText>{clean}</FallbackText>;
    if (block) return <BlockMath math={clean} renderError={renderError} />;
    return <InlineMath math={clean} renderError={renderError} />;
  } catch {
    return <FallbackText>{clean}</FallbackText>;
  }
}

// A whole string that is a single bare expression the model forgot to wrap —
// e.g. an MCQ option like "\frac{1}{2}", "\frac{\sqrt{3}}{2}", "x^2", "\infty".
// Must be a single token (no inner whitespace) so we never feed a full
// sentence to KaTeX.
function isBareExpression(s) {
  const t = s.trim();
  if (!t || /\s/.test(t)) return false;
  return /\\[a-zA-Z]+/.test(t) || /[\^_]\{?[A-Za-z0-9]/.test(t);
}

/**
 * MathRenderer — renders mixed text + LaTeX. Accepts $...$ / $$...$$ as well as
 * \( ... \) / \[ ... \] delimiters, and renders a lone bare expression as math.
 */
function MathRenderer({ text, className = '' }) {
  if (!text) return null;
  const str = normalizeDelims(String(text));

  // No $-delimited math: either a bare expression, or plain prose.
  if (!str.includes('$')) {
    if (isBareExpression(str)) {
      return (
        <span className={className}>
          <MathSegment src={str} block={false} />
        </span>
      );
    }
    return <span className={className}>{str}</span>;
  }

  const parts = [];
  // $$....$$ (block) first, then $...$ (inline).
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
    // An empty pair (e.g. "$$" from a stray delimiter) — drop it.
    if (inner) parts.push({ type: isBlock ? 'block' : 'inline', content: inner });
    lastIndex = match.index + raw.length;
  }
  if (lastIndex < str.length) {
    parts.push({ type: 'text', content: str.slice(lastIndex) });
  }

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
