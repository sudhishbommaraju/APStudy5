import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, FileText, Send, RefreshCw, BookOpen, Target, Award } from 'lucide-react';
import { generateFRQFeedback } from '@/components/engine/AIExplanationEngine';
import { generateFrameworkFRQ } from '@/components/frq/FrameworkFRQGenerator';
import { getSubjectList, getUnitsForSubject, RUBRIC_TEMPLATES, getArchetypeForSubject } from '@/components/frq/FRQSubjectData';

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy', desc: 'Recall & basic application' },
  { value: 'medium', label: 'Medium', desc: 'Analytical reasoning' },
  { value: 'hard', label: 'Hard', desc: 'Complex argumentation' }
];

const SELECT_CLASS = "w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

export default function APFRQSimulator() {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [response, setResponse] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const subjects = getSubjectList();
  const units = getUnitsForSubject(selectedSubject);

  function handleSubjectChange(e) {
    setSelectedSubject(e.target.value);
    setSelectedUnit('');
    setCurrentPrompt(null);
    setFeedback(null);
    setResponse('');
  }

  function handleResponseChange(e) {
    const val = e.target.value;
    setResponse(val);
    setWordCount(val.trim() ? val.trim().split(/\s+/).length : 0);
  }

  async function handleGeneratePrompt() {
    if (!selectedSubject || !selectedUnit) return;
    setLoading(true);
    setFeedback(null);
    setResponse('');
    setWordCount(0);

    const unit = units.find(u => u.id === selectedUnit);

    // Check for cached prompt first
    const cached = await base44.entities.APFRQPrompt.filter({
      subject_id: selectedSubject,
      unit_id: selectedUnit,
      difficulty,
      is_active: true
    });

    if (cached.length > 0) {
      // Pick a random cached one for variety
      const pick = cached[Math.floor(Math.random() * cached.length)];
      setCurrentPrompt(pick);
    } else {
      const generated = await generateFrameworkFRQ({
        subject: selectedSubject,
        unitId: selectedUnit,
        unitTitle: unit?.name,
        difficulty
      });
      setCurrentPrompt(generated);
    }
    setLoading(false);
  }

  async function handleNewQuestion() {
    if (!selectedSubject || !selectedUnit) return;
    setLoading(true);
    setFeedback(null);
    setResponse('');
    setWordCount(0);
    const unit = units.find(u => u.id === selectedUnit);
    const generated = await generateFrameworkFRQ({
      subject: selectedSubject,
      unitId: selectedUnit,
      unitTitle: unit?.name,
      difficulty
    });
    setCurrentPrompt(generated);
    setLoading(false);
  }

  async function submitResponse() {
    if (!response.trim()) return;
    setSubmitting(true);
    const user = await base44.auth.me();

    const feedbackResult = await generateFRQFeedback({
      prompt: currentPrompt,
      userResponse: response
    });

    await base44.entities.FRQResponse.create({
      user_email: user.email,
      prompt_id: currentPrompt.id,
      response_text: response,
      ai_feedback: feedbackResult,
      estimated_score: feedbackResult.estimated_score,
      submitted_at: new Date().toISOString()
    });

    setFeedback(feedbackResult);
    setSubmitting(false);
  }

  const archetype = selectedSubject ? getArchetypeForSubject(selectedSubject) : null;
  const archetypeLabel = archetype ? RUBRIC_TEMPLATES[archetype]?.label : null;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-6">
        <button
          onClick={() => navigate('/Dashboard')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">AP FRQ Simulator</h1>
          <p className="text-gray-500">Framework-aligned free-response practice with AP-style rubrics and AI scoring feedback</p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Configure Your FRQ</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Subject */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">AP Subject</label>
              <select value={selectedSubject} onChange={handleSubjectChange} className={SELECT_CLASS}>
                <option value="" disabled>Select subject</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Unit */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Unit</label>
              <select
                value={selectedUnit}
                onChange={e => setSelectedUnit(e.target.value)}
                disabled={!selectedSubject}
                className={SELECT_CLASS}
              >
                <option value="" disabled>{selectedSubject ? 'Select unit' : 'Select a subject first'}</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>

          {/* Difficulty */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-3 block">Difficulty</label>
            <div className="grid grid-cols-3 gap-4">
              {DIFFICULTY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDifficulty(opt.value)}
                  className={`p-5 rounded-xl border text-left transition-all ${
                    difficulty === opt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="font-semibold text-gray-800 text-sm mb-1">{opt.label}</div>
                  <div className="text-gray-500 text-xs">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Archetype badge */}
          {archetypeLabel && (
            <div className="flex items-center gap-2 mb-6 border-t border-gray-100 pt-5">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-blue-600">Rubric template: <span className="font-medium">{archetypeLabel}</span></span>
            </div>
          )}

          <div className="border-t border-gray-100 pt-6">
            <Button
              onClick={handleGeneratePrompt}
              disabled={!selectedSubject || !selectedUnit || loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg text-base font-medium shadow-sm"
            >
              {loading ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating FRQ Prompt…</>
              ) : (
                <><FileText className="w-4 h-4 mr-2" /> Generate FRQ Prompt</>
              )}
            </Button>
          </div>
        </div>

        {/* FRQ Prompt + Response */}
        {currentPrompt && !feedback && (
          <div className="space-y-6">
            {/* Prompt Card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                  {currentPrompt.subject_id}
                </span>
                {currentPrompt.unit_title && (
                  <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                    {currentPrompt.unit_title}
                  </span>
                )}
                {currentPrompt.command_verb && (
                  <span className="px-2 py-1 rounded text-xs font-mono bg-purple-100 text-purple-700 border border-purple-200">
                    {currentPrompt.command_verb}
                  </span>
                )}
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  currentPrompt.difficulty === 'hard' ? 'bg-red-100 text-red-600' :
                  currentPrompt.difficulty === 'easy' ? 'bg-green-100 text-green-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  {currentPrompt.difficulty}
                </span>
              </div>

              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Free Response Question
              </h2>

              <div className="text-gray-800 leading-relaxed text-base whitespace-pre-wrap mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                {currentPrompt.prompt_text}
              </div>

              {/* Skills assessed */}
              {currentPrompt.skills_assessed?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-xs text-gray-400 self-center">Skills:</span>
                  {currentPrompt.skills_assessed.map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Rubric */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-700">Scoring Rubric — {currentPrompt.total_points} points total</span>
                </div>
                <div className="space-y-3">
                  {currentPrompt.rubric_criteria?.map((criterion, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded shrink-0 mt-0.5">
                        {criterion.points} pt{criterion.points !== 1 ? 's' : ''}
                      </span>
                      <div>
                        <div className="text-sm text-gray-800 font-medium">{criterion.criterion}</div>
                        {criterion.description && (
                          <div className="text-xs text-gray-500 mt-0.5">{criterion.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {currentPrompt.scoring_note && (
                  <div className="mt-4 pt-4 border-t border-amber-200">
                    <p className="text-xs text-amber-700">
                      <span className="font-semibold">Full credit note: </span>
                      {currentPrompt.scoring_note}
                    </p>
                  </div>
                )}
              </div>

              {/* Response area */}
              <div className="mb-2 border-t border-gray-100 pt-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Your Response</label>
                  <span className="text-xs text-neutral-500">{wordCount} words</span>
                </div>
                <Textarea
                  value={response}
                  onChange={handleResponseChange}
                  placeholder="Write your response here. Be specific — reference evidence, use the command verb directive, and address all rubric criteria..."
                  className="min-h-[280px] bg-white border-gray-300 text-gray-900 text-sm leading-relaxed"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  onClick={handleNewQuestion}
                  disabled={loading}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> New Question
                </Button>
                <Button
                  onClick={submitResponse}
                  disabled={!response.trim() || submitting || wordCount < 10}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {submitting ? 'Analyzing your response...' : (
                    <><Send className="w-4 h-4 mr-2" /> Submit for AI Feedback</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Display */}
        {feedback && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-500" />
              AI Feedback
            </h2>

            {/* Score */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-center">
              <div className="text-5xl font-bold text-blue-600 mb-1">
                {feedback.estimated_score}<span className="text-2xl text-blue-400">/{currentPrompt.total_points}</span>
              </div>
              <div className="text-sm text-blue-600 font-medium">Estimated Score</div>
              <div className="text-xs text-gray-500 mt-1">
                {Math.round((feedback.estimated_score / currentPrompt.total_points) * 100)}% — {
                  feedback.estimated_score / currentPrompt.total_points >= 0.8 ? 'Excellent' :
                  feedback.estimated_score / currentPrompt.total_points >= 0.6 ? 'Developing' : 'Needs Work'
                }
              </div>
            </div>

            {/* Original prompt for reference */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Prompt</p>
              <p className="text-sm text-gray-700 leading-relaxed">{currentPrompt.prompt_text}</p>
            </div>

            {/* Feedback sections */}
            <div className="space-y-6">
              {feedback.strengths?.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <span>✓</span> Strengths
                  </h3>
                  <ul className="space-y-2">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="text-gray-700 text-sm flex items-start gap-2 pl-2">
                        <span className="text-green-500 mt-0.5">•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.areas_to_improve?.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-orange-700 mb-3">Areas to Improve</h3>
                  <ul className="space-y-2">
                    {feedback.areas_to_improve.map((a, i) => (
                      <li key={i} className="text-gray-700 text-sm flex items-start gap-2 pl-2">
                        <span className="text-orange-500 mt-0.5">•</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.revision_suggestions && (
                <div>
                  <h3 className="text-base font-semibold text-purple-700 mb-3">Revision Suggestions</h3>
                  <p className="text-gray-700 text-sm leading-relaxed pl-2">{feedback.revision_suggestions}</p>
                </div>
              )}
            </div>

            {/* Per-rubric breakdown if available */}
            {currentPrompt.rubric_criteria?.length > 0 && (
              <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Rubric Reference</h3>
                <div className="space-y-2">
                  {currentPrompt.rubric_criteria.map((c, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-amber-700 font-bold text-xs bg-amber-100 px-2 py-0.5 rounded shrink-0">{c.points}pt</span>
                      <span className="text-gray-600">{c.criterion}</span>
                    </div>
                  ))}
                </div>
                {currentPrompt.scoring_note && (
                  <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                    <span className="text-gray-600 font-medium">Full credit requires: </span>
                    {currentPrompt.scoring_note}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <Button
                onClick={() => { setResponse(''); setFeedback(null); setWordCount(0); }}
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Try Same Prompt Again
              </Button>
              <Button
                onClick={handleNewQuestion}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> New Question
              </Button>
            </div>
          </div>
        )}

        {!selectedSubject && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Select a subject and unit above to generate a framework-aligned FRQ prompt
          </div>
        )}
      </div>
    </div>
  );
}