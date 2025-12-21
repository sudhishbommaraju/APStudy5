import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export default function QuestionReview({ 
  question, 
  selectedAnswer,
  showExplanation = true
}) {
  const choices = [
    { key: 'A', text: question.choice_a },
    { key: 'B', text: question.choice_b },
    { key: 'C', text: question.choice_c },
    { key: 'D', text: question.choice_d },
  ];

  const isCorrect = selectedAnswer === question.correct_answer;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Question Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <span className="px-2 py-0.5 bg-slate-200 rounded-full font-medium">
            {question.skill_name}
          </span>
          <span className={cn(
            "px-2 py-0.5 rounded-full font-medium",
            question.difficulty === 'easy' && "bg-emerald-100 text-emerald-700",
            question.difficulty === 'medium' && "bg-amber-100 text-amber-700",
            question.difficulty === 'hard' && "bg-rose-100 text-rose-700"
          )}>
            {question.difficulty}
          </span>
          {isCorrect ? (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> Correct
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-medium flex items-center gap-1">
              <X className="w-3 h-3" /> Incorrect
            </span>
          )}
        </div>
      </div>

      {/* Question Text */}
      <div className="px-6 py-5">
        <div className="prose prose-slate prose-sm max-w-none">
          <ReactMarkdown>{question.question_text}</ReactMarkdown>
        </div>
      </div>

      {/* Answer Choices */}
      <div className="px-6 pb-4 space-y-2">
        {choices.map(({ key, text }) => {
          const isSelected = selectedAnswer === key;
          const isCorrectAnswer = key === question.correct_answer;
          
          let choiceStyle = "bg-slate-50 border-slate-200 text-slate-400";
          
          if (isCorrectAnswer) {
            choiceStyle = "bg-emerald-50 border-emerald-500 text-emerald-900";
          } else if (isSelected && !isCorrectAnswer) {
            choiceStyle = "bg-rose-50 border-rose-500 text-rose-900";
          }

          return (
            <div
              key={key}
              className={cn(
                "w-full flex items-start gap-3 p-4 rounded-lg border-2",
                choiceStyle
              )}
            >
              <span className={cn(
                "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold",
                isCorrectAnswer && "bg-emerald-500 text-white",
                isSelected && !isCorrectAnswer && "bg-rose-500 text-white",
                !isCorrectAnswer && !isSelected && "bg-slate-100 text-slate-400"
              )}>
                {isCorrectAnswer && <Check className="w-4 h-4" />}
                {isSelected && !isCorrectAnswer && <X className="w-4 h-4" />}
                {!isCorrectAnswer && !isSelected && key}
              </span>
              <span className="text-sm leading-relaxed pt-0.5">
                <ReactMarkdown className="prose prose-sm max-w-none [&>p]:m-0">{text}</ReactMarkdown>
              </span>
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className={cn(
          "px-6 py-5 border-t",
          isCorrect ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
        )}>
          <div className="flex items-center gap-2 mb-3">
            {isCorrect ? (
              <>
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-emerald-800">Correct!</span>
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center">
                  <X className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-rose-800">Incorrect</span>
              </>
            )}
          </div>
          <div className="prose prose-sm max-w-none text-slate-700">
            <ReactMarkdown>{question.explanation}</ReactMarkdown>
          </div>
          {!isCorrect && question.wrong_answer_explanations?.[selectedAnswer] && (
            <div className="mt-3 pt-3 border-t border-rose-200">
              <p className="text-sm text-rose-700">
                <strong>Why {selectedAnswer} is wrong:</strong> {question.wrong_answer_explanations[selectedAnswer]}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}