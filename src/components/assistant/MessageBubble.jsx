import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-7 w-7 rounded-lg bg-neutral-800 flex items-center justify-center mt-0.5 shrink-0">
          <Bot className="w-4 h-4 text-blue-400" />
        </div>
      )}
      <div className={cn("max-w-[85%]", isUser && "flex flex-col items-end")}>
        {message.content && (
          <div className={cn(
            "rounded-2xl px-4 py-2.5",
            isUser
              ? "bg-blue-600 text-white"
              : "bg-neutral-900 border border-neutral-800 text-neutral-100"
          )}>
            {isUser ? (
              <p className="text-sm leading-relaxed">{message.content}</p>
            ) : (
              <ReactMarkdown
                className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={{
                  p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                  code: ({ inline, children }) => inline
                    ? <code className="px-1 py-0.5 rounded bg-neutral-800 text-blue-300 text-xs">{children}</code>
                    : <pre className="bg-neutral-800 rounded-lg p-3 overflow-x-auto my-2 text-xs text-neutral-200"><code>{children}</code></pre>,
                  h1: ({ children }) => <h1 className="text-base font-semibold text-white my-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-sm font-semibold text-white my-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-medium text-white my-1">{children}</h3>,
                  blockquote: ({ children }) => <blockquote className="border-l-2 border-blue-500 pl-3 my-2 text-neutral-400">{children}</blockquote>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
      </div>
    </div>
  );
}