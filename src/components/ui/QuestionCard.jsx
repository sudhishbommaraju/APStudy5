import React, { useState } from 'react';
import { Check, X, ChevronRight, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function QuestionCard({ 
  question, 
  onAnswer, 
  showFeedback = false,
  selectedAnswer = null,
  mode = 'practice'
}) {
  const [localSelected, setLocalSelected] = useState(selectedAnswer);
  const [submitted, setSubmitted] = useState(showFeedback);
  const [showHint, setShowHint] = useState(false);

  // Reset state when question changes
  React.useEffect(() => {
    setLocalSelected(selectedAnswer);
    setSubmitted(showFeedback);
    setShowHint(false);
  }, [question?.id, selectedAnswer, showFeedback]);

  const choices = [
    { key: 'A', text: question.choice_a },
    { key: 'B', text: question.choice_b },
    { key: 'C', text: question.choice_c },
    { key: 'D', text: question.choice_d },
  ];

  const handleSelect = (key) => {
    if (submitted && mode === 'practice') return;
    setLocalSelected(key);
    if (mode === 'exam') {
      onAnswer(key);
    }
  };

  const handleSubmit = () => {
    if (!localSelected) return;
    setSubmitted(true);
    onAnswer(localSelected);
  };

  const isCorrect = localSelected === question.correct_answer;
  const showResult = submitted && mode === 'practice';

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
        </div>
      </div>

      {/* Question Text */}
      <div className="px-6 py-5">
        <div className="prose prose-slate prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {question.question_text}
          </ReactMarkdown>
        </div>

        {/* Table Data */}
        {question.table_data && (() => {
          // Parse markdown table into chart data
          const parseTableToChart = (markdown) => {
            const lines = markdown.trim().split('\n').filter(line => line.trim() && !line.includes('---'));
            if (lines.length < 2) return null;

            const headers = lines[0].split('|').map(h => h.trim()).filter(Boolean);
            const rows = lines.slice(1).map(line => 
              line.split('|').map(cell => cell.trim()).filter(Boolean)
            );

            // Convert to chart data
            const chartData = rows.map(row => {
              const obj = { [headers[0]]: row[0] };
              for (let i = 1; i < headers.length; i++) {
                const value = parseFloat(row[i]);
                obj[headers[i]] = isNaN(value) ? row[i] : value;
              }
              return obj;
            });

            // Check if data is numeric (suitable for charting)
            const hasNumericData = chartData.some(item => 
              Object.values(item).some(v => typeof v === 'number')
            );

            return hasNumericData ? { headers, chartData } : null;
          };

          const chartInfo = parseTableToChart(question.table_data);

          if (chartInfo) {
            const { headers, chartData } = chartInfo;
            const dataKeys = headers.slice(1); // Skip first column (category)
            const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

            return (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey={headers[0]} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      stroke="#94a3b8"
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      stroke="#94a3b8"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                    {dataKeys.map((key, index) => (
                      <Bar 
                        key={key} 
                        dataKey={key} 
                        fill={colors[index % colors.length]}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          }

          // Fallback to table rendering
          return (
            <div className="mt-4 overflow-x-auto">
              <ReactMarkdown 
                remarkPlugins={[remarkMath]} 
                rehypePlugins={[rehypeKatex]}
                className="prose prose-sm max-w-none"
                components={{
                  table: ({node, ...props}) => <table className="min-w-full border border-slate-300" {...props} />,
                  th: ({node, ...props}) => <th className="border border-slate-300 px-3 py-2 bg-slate-100 font-semibold" {...props} />,
                  td: ({node, ...props}) => <td className="border border-slate-300 px-3 py-2" {...props} />,
                }}
              >
                {question.table_data}
              </ReactMarkdown>
            </div>
          );
        })()}

        {/* Graph Data */}
        {question.graph_data && (() => {
          try {
            const graphData = JSON.parse(question.graph_data);
            const maxY = Math.max(...graphData.data.map(d => d.y));
            const minY = Math.min(...graphData.data.map(d => d.y));
            const range = maxY - minY;

            return (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-600 mb-2 text-center">
                  {graphData.labels?.title || 'Graph'}
                </div>
                <div className="relative h-48 border-l-2 border-b-2 border-slate-400 ml-8 mb-6">
                  {/* Y-axis label */}
                  <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-slate-600 whitespace-nowrap">
                    {graphData.labels?.y || 'Y'}
                  </div>

                  {/* Data points */}
                  {graphData.data.map((point, i) => {
                    const x = (i / (graphData.data.length - 1)) * 100;
                    const y = ((point.y - minY) / range) * 100;
                    return (
                      <div
                        key={i}
                        className="absolute w-2 h-2 bg-indigo-600 rounded-full -translate-x-1 -translate-y-1"
                        style={{ left: `${x}%`, bottom: `${y}%` }}
                        title={`(${point.x}, ${point.y})`}
                      />
                    );
                  })}

                  {/* Line connecting points (if line graph) */}
                  {graphData.type === 'line' && graphData.data.map((point, i) => {
                    if (i === graphData.data.length - 1) return null;
                    const nextPoint = graphData.data[i + 1];
                    const x1 = (i / (graphData.data.length - 1)) * 100;
                    const y1 = ((point.y - minY) / range) * 100;
                    const x2 = ((i + 1) / (graphData.data.length - 1)) * 100;
                    const y2 = ((nextPoint.y - minY) / range) * 100;

                    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

                    return (
                      <div
                        key={`line-${i}`}
                        className="absolute h-0.5 bg-indigo-600 origin-left"
                        style={{
                          left: `${x1}%`,
                          bottom: `${y1}%`,
                          width: `${length}%`,
                          transform: `rotate(${angle}deg)`,
                        }}
                      />
                    );
                  })}
                </div>
                {/* X-axis label */}
                <div className="text-xs text-slate-600 text-center">
                  {graphData.labels?.x || 'X'}
                </div>
              </div>
            );
          } catch (e) {
            return null;
          }
        })()}
      </div>

      {/* Answer Choices */}
      <div className="px-6 pb-4 space-y-2">
        {choices.map(({ key, text }) => {
          const isSelected = localSelected === key;
          const isCorrectAnswer = key === question.correct_answer;
          
          let choiceStyle = "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50";
          
          if (showResult) {
            if (isCorrectAnswer) {
              choiceStyle = "bg-emerald-50 border-emerald-500 text-emerald-900";
            } else if (isSelected && !isCorrectAnswer) {
              choiceStyle = "bg-rose-50 border-rose-500 text-rose-900";
            } else {
              choiceStyle = "bg-slate-50 border-slate-200 text-slate-400";
            }
          } else if (isSelected) {
            choiceStyle = "bg-slate-900 border-slate-900 text-white";
          }

          return (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              disabled={showResult}
              className={cn(
                "w-full flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all duration-150",
                choiceStyle
              )}
            >
              <span className={cn(
                "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold",
                showResult && isCorrectAnswer && "bg-emerald-500 text-white",
                showResult && isSelected && !isCorrectAnswer && "bg-rose-500 text-white",
                !showResult && isSelected && "bg-white text-slate-900",
                !showResult && !isSelected && "bg-slate-100 text-slate-600"
              )}>
                {showResult && isCorrectAnswer && <Check className="w-4 h-4" />}
                {showResult && isSelected && !isCorrectAnswer && <X className="w-4 h-4" />}
                {!showResult && key}
              </span>
              <span className="text-sm leading-relaxed pt-0.5">
                <ReactMarkdown 
                  remarkPlugins={[remarkMath]} 
                  rehypePlugins={[rehypeKatex]}
                  className="prose prose-sm max-w-none [&>p]:m-0"
                >
                  {text}
                </ReactMarkdown>
              </span>
            </button>
          );
        })}
      </div>

      {/* Hint Section */}
      {mode === 'practice' && !submitted && question.hint && (
        <div className="px-6 pb-4">
          {!showHint ? (
            <Button 
              onClick={() => setShowHint(true)}
              variant="outline"
              className="w-full"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Show Hint
            </Button>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-amber-800 text-sm">Hint</span>
              </div>
              <p className="text-sm text-amber-900">{question.hint}</p>
            </div>
          )}
        </div>
      )}

      {/* Submit Button (Practice Mode) */}
      {mode === 'practice' && !submitted && (
        <div className="px-6 pb-5">
          <Button 
            onClick={handleSubmit}
            disabled={!localSelected}
            className="w-full h-12 text-base font-medium"
          >
            Check Answer
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Feedback (Practice Mode) - Show for all answers */}
      {showResult && isCorrect && (
        <div className="px-6 py-5 border-t bg-emerald-50 border-emerald-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-emerald-800">Correct!</span>
          </div>
          <div className="prose prose-sm max-w-none text-slate-700">
            <p className="font-medium text-slate-900 mb-2">Explanation:</p>
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {question.explanation}
            </ReactMarkdown>
          </div>
        </div>
      )}
      {showResult && !isCorrect && (
        <div className="px-6 py-5 border-t bg-rose-50 border-rose-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center">
              <X className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-rose-800">Incorrect</span>
          </div>
          <div className="mb-3">
            <p className="text-sm font-medium text-slate-700 mb-1">Correct Answer: {question.correct_answer}</p>
          </div>
          <div className="prose prose-sm max-w-none text-slate-700">
            <p className="font-medium text-slate-900 mb-2">Explanation:</p>
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {question.explanation}
            </ReactMarkdown>
          </div>
          {question.wrong_answer_explanations?.[localSelected] && (
            <div className="mt-3 pt-3 border-t border-rose-200">
              <p className="text-sm text-rose-700">
                <strong>Why {localSelected} is wrong:</strong> {question.wrong_answer_explanations[localSelected]}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}