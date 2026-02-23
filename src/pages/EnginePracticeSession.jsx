import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { getQuestionsForPractice } from '@/components/engine/QuestionGenerator';
import { Clock, ArrowRight, Check, X } from 'lucide-react';

export default function EnginePracticeSession() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session');

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  async function loadSession() {
    const sessionData = await base44.entities.EnginePracticeSession.list();
    const current = sessionData.find(s => s.id === sessionId);
    setSession(current);

    // Get skills for this domain
    const skills = await base44.entities.EngineSkill.filter({ 
      domain_id: current.domain_id 
    });

    // Generate/fetch questions
    const allQuestions = [];
    for (const skill of skills.slice(0, 3)) { // Use top 3 skills
      const skillQuestions = await getQuestionsForPractice({
        skillId: skill.id,
        difficulty: 3,
        count: Math.ceil(current.question_count / 3)
      });
      allQuestions.push(...skillQuestions);
    }

    setQuestions(allQuestions.slice(0, current.question_count));
    setLoading(false);
  }

  async function submitAnswer() {
    const responseTime = Date.now() - startTime;
    const isCorrect = selectedAnswer === questions[currentIndex].correct_answer;

    const response = await base44.entities.EnginePracticeResponse.create({
      session_id: sessionId,
      question_id: questions[currentIndex].id,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      response_time_ms: responseTime
    });

    setResponses([...responses, response]);
    setAnswered(true);

    // Update skill performance
    const user = await base44.auth.me();
    const skillPerf = await base44.entities.EngineUserSkillPerformance.filter({
      user_email: user.email,
      skill_id: questions[currentIndex].skill_id
    });

    if (skillPerf.length > 0) {
      const perf = skillPerf[0];
      await base44.entities.EngineUserSkillPerformance.update(perf.id, {
        attempts: perf.attempts + 1,
        correct: perf.correct + (isCorrect ? 1 : 0),
        accuracy: ((perf.correct + (isCorrect ? 1 : 0)) / (perf.attempts + 1)) * 100,
        last_updated: new Date().toISOString()
      });
    } else {
      await base44.entities.EngineUserSkillPerformance.create({
        user_email: user.email,
        skill_id: questions[currentIndex].skill_id,
        attempts: 1,
        correct: isCorrect ? 1 : 0,
        accuracy: isCorrect ? 100 : 0,
        last_updated: new Date().toISOString()
      });
    }
  }

  async function nextQuestion() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setAnswered(false);
      setStartTime(Date.now());
    } else {
      // Session complete
      const correct = responses.filter(r => r.is_correct).length;
      await base44.entities.EnginePracticeSession.update(sessionId, {
        completed_at: new Date().toISOString(),
        score: (correct / questions.length) * 100
      });
      navigate(createPageUrl('EngineResults') + `?session=${sessionId}`);
    }
  }

  if (loading || !questions.length) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading practice session...</div>
      </div>
    );
  }

  const current = questions[currentIndex];
  const isCorrect = answered && selectedAnswer === current.correct_answer;

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-4xl mx-auto px-6">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-neutral-400">
              Question {currentIndex + 1} of {questions.length}
            </span>
            {session?.mode === 'timed' && (
              <div className="flex items-center gap-2 text-neutral-400">
                <Clock className="w-4 h-4" />
                <span>{Math.floor((Date.now() - startTime) / 1000)}s</span>
              </div>
            )}
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-6">
          <div className="text-white text-lg mb-8 leading-relaxed">
            {current.stem}
          </div>

          <div className="space-y-3">
            {current.answer_choices.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => !answered && setSelectedAnswer(idx)}
                disabled={answered}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  answered
                    ? idx === current.correct_answer
                      ? 'border-green-500 bg-green-500/10'
                      : idx === selectedAnswer
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-neutral-700 bg-neutral-800'
                    : selectedAnswer === idx
                    ? 'border-white bg-white text-black'
                    : 'border-neutral-700 hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                      answered && idx === current.correct_answer
                        ? 'border-green-500 text-green-500'
                        : answered && idx === selectedAnswer
                        ? 'border-red-500 text-red-500'
                        : selectedAnswer === idx
                        ? 'border-black text-black'
                        : 'border-neutral-600 text-neutral-400'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className={
                      answered
                        ? idx === current.correct_answer || idx === selectedAnswer
                          ? 'text-white'
                          : 'text-neutral-400'
                        : selectedAnswer === idx
                        ? 'text-black'
                        : 'text-white'
                    }>
                      {choice}
                    </span>
                  </div>
                  {answered && idx === current.correct_answer && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                  {answered && idx === selectedAnswer && idx !== current.correct_answer && (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Explanation */}
        {answered && (
          <div className={`bg-neutral-900 border-2 rounded-2xl p-6 mb-6 ${
            isCorrect ? 'border-green-500' : 'border-red-500'
          }`}>
            <div className={`font-semibold mb-3 ${
              isCorrect ? 'text-green-500' : 'text-red-500'
            }`}>
              {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </div>
            <div className="text-neutral-300 leading-relaxed">
              {current.explanation}
            </div>
          </div>
        )}

        {/* Action Button */}
        {!answered ? (
          <Button
            onClick={submitAnswer}
            disabled={selectedAnswer === null}
            className="w-full bg-white text-black hover:bg-neutral-100 py-6 text-lg"
          >
            Submit Answer
          </Button>
        ) : (
          <Button
            onClick={nextQuestion}
            className="w-full bg-white text-black hover:bg-neutral-100 py-6 text-lg"
          >
            {currentIndex < questions.length - 1 ? (
              <>
                Next Question
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            ) : (
              'View Results'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}