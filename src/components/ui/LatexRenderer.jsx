import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * LATEX RENDERER WITH FAILSAFE
 * Handles rendering errors gracefully
 */
export default function LatexRenderer({ content, subject, onRegenerate }) {
  const [renderError, setRenderError] = useState(false);

  useEffect(() => {
    setRenderError(false);
  }, [content]);

  // Error boundary for LaTeX rendering
  const handleError = (error) => {
    console.error('LaTeX render error:', error);
    setRenderError(true);
  };

  if (renderError) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-rose-300 mb-2">
          Rendering Error
        </h3>
        <p className="text-sm text-rose-400 mb-4">
          This content contains formatting errors and cannot be displayed.
        </p>
        {onRegenerate && (
          <Button 
            onClick={onRegenerate}
            variant="outline"
            className="border-rose-400 text-rose-400 hover:bg-rose-500/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Regenerate Content
          </Button>
        )}
      </div>
    );
  }

  try {
    return (
      <div className="prose prose-sm max-w-none prose-invert [&_*]:text-white [&_.katex]:text-white [&_.katex-error]:text-white">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            p: ({ children }) => <p className="text-white mb-3 leading-relaxed">{children}</p>,
            li: ({ children }) => <li className="text-white mb-1">{children}</li>,
            ul: ({ children }) => <ul className="text-white mb-4 ml-4 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="text-white mb-4 ml-4 space-y-1">{children}</ol>,
            h1: ({ children }) => <h1 className="text-white text-2xl font-bold mb-4 mt-8">{children}</h1>,
            h2: ({ children }) => <h2 className="text-white text-xl font-bold mb-4 mt-6 pb-2 border-b-2 border-violet-500/30">{children}</h2>,
            h3: ({ children }) => <h3 className="text-white text-lg font-bold mb-3 mt-5">{children}</h3>,
            h4: ({ children }) => <h4 className="text-white text-base font-semibold mb-2 mt-4">{children}</h4>,
            strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
            em: ({ children }) => <em className="text-white italic">{children}</em>,
            code: ({ children }) => <code className="text-white bg-slate-700/50 px-1 rounded">{children}</code>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  } catch (error) {
    handleError(error);
    return null;
  }
}