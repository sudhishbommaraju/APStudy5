import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle, Lightbulb } from 'lucide-react';
import { generateExplanation } from '@/components/engine/AIExplanationEngine';
import LatexRenderer from '@/components/ui/LatexRenderer';

export default function EngineMistakes() {
  const navigate = useNavigate();
  const [mistakes, setMistakes] = useState([]);
  const [questions, setQuestions] = useState({});
  const [selectedMistake, setSelectedMistake] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingExplanation, setGeneratingExplanation] = useState(false);

  useEffect(() => {
    loadMistakes();
  }, []);

  async function loadMistakes() {
    const user = await base44.auth.me();
    const allResponses = await base44.entities.EnginePracticeResponse.list();
    const userMistakes = allResponses.filter(r => !r.is_correct);
    
    // Load questions for these mistakes
    const allQuestions = await base44.entities.ProoflyQuestion.list();
    const questionMap = {};
    allQuestions.forEach(q => {
      questionMap[q.id] = q;
    });
    
    setMistakes(userMistakes.slice(0, 20));
    setQuestions(questionMap);
    setLoading(false);
  }

  async function showExplanation(mistake) {
    setSelectedMistake(mistake);
    setGeneratingExplanation(true);
    
    const question = questions[mistake.question_id];
    const user = await base44.auth.me();
    
    const exp = await generateExplanation({
      question,
      selectedAnswer: mistake.selected_answer,
      correctAnswer: question.correct_answer,
      userEmail: user.email
    });
    
    setExplanation(exp);
    setGeneratingExplanation(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading mistakes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-4xl mx-auto px-6">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('EngineHome'))}
          className="mb-8 text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-12">
          <h1 className="text-3xl font-light text-white mb-2">Mistake Review</h1>
          <p className="text-neutral-400">Learn from your errors with AI-powered explanations</p>
        </div>

        {mistakes.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">
            No mistakes yet! Keep practicing.
          </div>
        ) : (
          <div className="space-y-4">
            {mistakes.map((mistake) => {
              const question = questions[mistake.question_id];
              if (!question) return null;

              return (
                <div
                  key={mistake.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-1" />
                    <div className="flex-1">
                      <div className="text-white mb-3 leading-relaxed">
                        <LatexRenderer content={question.stem} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {question.answer_choices.map((choice, idx) => (
                          <div
                            key={idx}
                            className={`text-sm p-2 rounded ${
                              idx === question.correct_answer
                                ? 'bg-green-900/20 text-green-400 border border-green-800'
                                : idx === mistake.selected_answer
                                ? 'bg-red-900/20 text-red-400 border border-red-800'
                                : 'text-neutral-400'
                            }`}
                          >
                            {String.fromCharCode(65 + idx)}. <LatexRenderer content={choice} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => showExplanation(mistake)}
                    className="w-full bg-white text-black hover:bg-neutral-100"
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Get AI Explanation
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Explanation Modal */}
        {selectedMistake && explanation && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-2xl max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-medium text-white mb-6">AI Explanation</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-blue-400 mb-2">Concept</h3>
                  <p className="text-neutral-300 leading-relaxed">{explanation.concept_explanation}</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-green-400 mb-2">Why Correct Answer Works</h3>
                  <p className="text-neutral-300 leading-relaxed">{explanation.correct_reasoning}</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-red-400 mb-2">Your Error</h3>
                  <p className="text-neutral-300 leading-relaxed">{explanation.student_error_analysis}</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-orange-400 mb-2">Practice Recommendation</h3>
                  <p className="text-neutral-300 leading-relaxed">{explanation.practice_recommendation}</p>
                </div>
              </div>

              <Button
                onClick={() => {
                  setSelectedMistake(null);
                  setExplanation(null);
                }}
                className="w-full mt-6 bg-white text-black hover:bg-neutral-100"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}