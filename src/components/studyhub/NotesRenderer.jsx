import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

/**
 * NotesRenderer — renders Markdown notes with LaTeX math ($...$ and $$...$$),
 * GitHub-flavoured tables/lists, styled for the Proofly reading experience.
 */
export default function NotesRenderer({ content }) {
  return (
    <div className="prose-notes max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ node, ...p }) => (
            <h1 className="mb-3 mt-6 font-display text-2xl font-extrabold text-foreground" {...p} />
          ),
          h2: ({ node, ...p }) => (
            <h2 className="mb-2 mt-6 border-b border-border pb-1 font-display text-xl font-bold text-foreground" {...p} />
          ),
          h3: ({ node, ...p }) => (
            <h3 className="mb-2 mt-5 font-display text-lg font-bold text-foreground" {...p} />
          ),
          p: ({ node, ...p }) => <p className="my-3 leading-relaxed text-foreground/90" {...p} />,
          ul: ({ node, ...p }) => <ul className="my-3 ml-5 list-disc space-y-1.5 text-foreground/90" {...p} />,
          ol: ({ node, ...p }) => <ol className="my-3 ml-5 list-decimal space-y-1.5 text-foreground/90" {...p} />,
          li: ({ node, ...p }) => <li className="leading-relaxed" {...p} />,
          strong: ({ node, ...p }) => <strong className="font-semibold text-foreground" {...p} />,
          code: ({ node, inline, ...p }) =>
            inline ? (
              <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-sm text-primary" {...p} />
            ) : (
              <code className="block overflow-x-auto rounded-xl bg-foreground/95 p-4 font-mono text-sm text-white" {...p} />
            ),
          blockquote: ({ node, ...p }) => (
            <blockquote className="my-4 border-l-4 border-primary/40 bg-secondary/40 py-2 pl-4 italic text-foreground/80" {...p} />
          ),
          img: ({ node, alt, ...p }) => (
            <span className="my-5 block">
              <img
                {...p}
                alt={alt || ''}
                loading="lazy"
                className="mx-auto block max-h-[26rem] w-full rounded-2xl border border-border bg-secondary/30 object-contain"
              />
              {alt ? (
                <span className="mt-2 block text-center text-xs text-muted-foreground">{alt}</span>
              ) : null}
            </span>
          ),
          table: ({ node, ...p }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full border-collapse text-sm" {...p} />
            </div>
          ),
          th: ({ node, ...p }) => (
            <th className="border border-border bg-secondary px-3 py-2 text-left font-semibold" {...p} />
          ),
          td: ({ node, ...p }) => <td className="border border-border px-3 py-2" {...p} />,
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
}
