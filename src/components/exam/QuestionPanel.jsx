import React from 'react';
import AIExplanation from './AIExplanation';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function QuestionPanel({
  question,
  selectedAnswer,
  onSelectAnswer,
  isSubmitted,
  isCorrect,
  onSubmit,
  onNext
}) {
  const getChoiceLabel = (index) => String.fromCharCode(65 + index);

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      {/* Question Text */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-6">
        <div className="prose prose-invert prose-lg max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              p: ({ children }) => <p className="text-neutral-100 leading-relaxed mb-4">{children}</p>,
              strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
              em: ({ children }) => <em className="text-neutral-300 italic">{children}</em>,
              code: ({ inline, children }) => 
                inline ? (
                  <code className="bg-neutral-800 text-blue-400 px-2 py-1 rounded text-sm">{children}</code>
                ) : (
                  <code className="block bg-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">{children}</code>
                ),
            }}
          >
            {question.stem}
          </ReactMarkdown>
        </div>
      </div>

      {/* Answer Choices */}
      <div className="space-y-3 mb-8">
        {question.answer_choices.map((choice, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrectChoice = index === question.correct_answer;
          const showCorrect = isSubmitted && isCorrectChoice;
          const showIncorrect = isSubmitted && isSelected && !isCorrect;

          return (
            <button
              key={index}
              onClick={() => !isSubmitted && onSelectAnswer(index)}
              disabled={isSubmitted}
              className={`w-full text-left p-6 rounded-xl border-2 transition-all ${
                showCorrect
                  ? 'bg-green-900/20 border-green-600'
                  : showIncorrect
                  ? 'bg-red-900/20 border-red-600'
                  : isSelected
                  ? 'bg-blue-900/20 border-blue-600'
                  : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
              } ${isSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  showCorrect
                    ? 'bg-green-600 text-white'
                    : showIncorrect
                    ? 'bg-red-600 text-white'
                    : isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {getChoiceLabel(index)}
                </div>
                <div className="flex-1 prose prose-invert">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      p: ({ children }) => <p className="text-neutral-100 m-0">{children}</p>,
                    }}
                  >
                    {choice}
                  </ReactMarkdown>
                </div>
                {showCorrect && <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />}
                {showIncorrect && <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        {!isSubmitted ? (
          <Button
            onClick={onSubmit}
            disabled={selectedAnswer === null}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            size="lg"
          >
            Submit Answer
          </Button>
        ) : (
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isCorrect ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
            }`}>
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">Incorrect</span>
                </>
              )}
            </div>
            <Button
              onClick={onNext}
              className="bg-white hover:bg-neutral-100 text-black px-8"
              size="lg"
            >
              Next Question
            </Button>
          </div>
        )}
      </div>

      {/* Explanation (after submit) */}
      {isSubmitted && question.explanation && (
        <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Explanation</h3>
          <div className="prose prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                p: ({ children }) => <p className="text-neutral-300 leading-relaxed">{children}</p>,
              }}
            >
              {question.explanation}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}