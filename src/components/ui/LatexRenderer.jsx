import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

/**
 * LaTeX Renderer for Math Content
 * Supports inline ($...$) and block ($$...$$) LaTeX
 */

export default function LatexRenderer({ content }) {
  if (!content) return null;

  const renderContent = (text) => {
    const parts = [];
    let currentIndex = 0;
    
    // Match block math first ($$...$$)
    const blockRegex = /\$\$([\s\S]*?)\$\$/g;
    const inlineRegex = /\$((?!\$)[^\$]+?)\$/g;
    
    let match;
    const processedIndices = new Set();
    
    // Process block math
    const blockMatches = [];
    while ((match = blockRegex.exec(text)) !== null) {
      blockMatches.push({
        type: 'block',
        start: match.index,
        end: match.index + match[0].length,
        content: match[1]
      });
      for (let i = match.index; i < match.index + match[0].length; i++) {
        processedIndices.add(i);
      }
    }
    
    // Process inline math
    const inlineMatches = [];
    while ((match = inlineRegex.exec(text)) !== null) {
      // Skip if this position is already part of a block match
      if (!processedIndices.has(match.index)) {
        inlineMatches.push({
          type: 'inline',
          start: match.index,
          end: match.index + match[0].length,
          content: match[1]
        });
        for (let i = match.index; i < match.index + match[0].length; i++) {
          processedIndices.add(i);
        }
      }
    }
    
    // Combine and sort all matches
    const allMatches = [...blockMatches, ...inlineMatches].sort((a, b) => a.start - b.start);
    
    // Build parts array
    allMatches.forEach((matchObj, idx) => {
      // Add text before this match
      if (matchObj.start > currentIndex) {
        parts.push({
          type: 'text',
          content: text.substring(currentIndex, matchObj.start)
        });
      }
      
      // Add the math content
      parts.push(matchObj);
      currentIndex = matchObj.end;
    });
    
    // Add remaining text
    if (currentIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(currentIndex)
      });
    }
    
    return parts;
  };

  const parts = renderContent(content);

  return (
    <div className="latex-content">
      {parts.map((part, idx) => {
        if (part.type === 'block') {
          return (
            <div key={idx} className="my-4">
              <BlockMath math={part.content} />
            </div>
          );
        } else if (part.type === 'inline') {
          return <InlineMath key={idx} math={part.content} />;
        } else {
          return <span key={idx}>{part.content}</span>;
        }
      })}
    </div>
  );
}