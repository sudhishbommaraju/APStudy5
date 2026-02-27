import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText, Send } from 'lucide-react';
import { generateFRQFeedback } from '@/components/engine/AIExplanationEngine';
import { AP_SUBJECTS } from '@/components/config/subjects';

export default function APFRQSimulator() {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [prompts, setPrompts] = useState([]);
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [response, setResponse] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedSubject) {
      console.log("FRQ Subject:", selectedSubject);
      loadUnits();
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedUnit) {
      loadPrompts();
    }
  }, [selectedUnit]);

  async function loadUnits() {
    const unitList = await base44.entities.APUnit.filter({ subject_id: selectedSubject });
    setUnits(unitList.sort((a, b) => a.order_index - b.order_index));
  }

  async function loadPrompts() {
    const promptList = await base44.entities.APFRQPrompt.filter({
      unit_id: selectedUnit,
      is_active: true
    });
    setPrompts(promptList);
    if (promptList.length > 0) {
      setCurrentPrompt(promptList[0]);
    } else {
      // Generate FRQ if none exist
      await generateFRQ();
    }
  }

  async function generateFRQ() {
    if (!selectedSubject || !selectedUnit) return;
    
    setSubmitting(true);
    const unit = units.find(u => u.id === selectedUnit);
    
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate 1 AP-style Free Response Question for ${unit?.name}.

STRICT JSON FORMAT:
{
  "prompt_text": "The FRQ prompt (2-3 paragraphs max)",
  "total_points": 6,
  "rubric_criteria": [
    {"criterion": "Description", "points": 2},
    {"criterion": "Description", "points": 2},
    {"criterion": "Description", "points": 2}
  ]
}`,
      response_json_schema: {
        type: "object",
        properties: {
          prompt_text: { type: "string" },
          total_points: { type: "number" },
          rubric_criteria: {
            type: "array",
            items: {
              type: "object",
              properties: {
                criterion: { type: "string" },
                points: { type: "number" }
              }
            }
          }
        }
      }
    });

    const created = await base44.entities.APFRQPrompt.create({
      subject_id: selectedSubject,
      unit_id: selectedUnit,
      prompt_text: result.prompt_text,
      total_points: result.total_points,
      rubric_criteria: result.rubric_criteria,
      difficulty: 'medium',
      is_active: true
    });

    setCurrentPrompt(created);
    setPrompts([created]);
    setSubmitting(false);
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

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-4xl mx-auto px-6">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('APStudyKit'))}
          className="mb-8 text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to AP Study Kit
        </Button>

        <div className="mb-12">
          <h1 className="text-3xl font-light text-white mb-2">AP FRQ Simulator</h1>
          <p className="text-neutral-400">Practice free-response questions with AI feedback</p>
        </div>

        {/* Selection */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-neutral-400 mb-2 block">AP Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="bg-black border-neutral-700 text-white">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSubject && (
              <div>
                <label className="text-sm text-neutral-400 mb-2 block">Unit</label>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger className="bg-black border-neutral-700 text-white">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        Unit {u.order_index}: {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Prompt Display */}
        {currentPrompt && !feedback && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <FileText className="w-6 h-6 text-blue-400 mt-1" />
              <div className="flex-1">
                <h2 className="text-xl font-medium text-white mb-4">Free Response Question</h2>
                <div className="text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {currentPrompt.prompt_text}
                </div>
              </div>
            </div>

            <div className="bg-neutral-800/50 rounded-xl p-4 mb-6">
              <div className="text-sm text-neutral-400 mb-2">Rubric: {currentPrompt.total_points} points total</div>
              <div className="space-y-2">
                {currentPrompt.rubric_criteria.map((criterion, idx) => (
                  <div key={idx} className="text-sm text-neutral-300">
                    • {criterion.criterion} ({criterion.points} pts)
                  </div>
                ))}
              </div>
            </div>

            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Type your response here..."
              className="min-h-[300px] bg-black border-neutral-700 text-white mb-4"
            />

            <Button
              onClick={submitResponse}
              disabled={!response.trim() || submitting}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 py-6"
            >
              {submitting ? 'Analyzing...' : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit for AI Feedback
                </>
              )}
            </Button>
          </div>
        )}

        {/* Feedback Display */}
        {feedback && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <h2 className="text-2xl font-medium text-white mb-6">AI Feedback</h2>

            <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-6 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">
                  {feedback.estimated_score}/{currentPrompt.total_points}
                </div>
                <div className="text-sm text-blue-300">Estimated Score</div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-green-400 mb-3">Strengths</h3>
                <ul className="space-y-2">
                  {feedback.strengths.map((strength, idx) => (
                    <li key={idx} className="text-neutral-300 flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-orange-400 mb-3">Areas to Improve</h3>
                <ul className="space-y-2">
                  {feedback.areas_to_improve.map((area, idx) => (
                    <li key={idx} className="text-neutral-300 flex items-start gap-2">
                      <span className="text-orange-400">•</span>
                      {area}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-purple-400 mb-3">Revision Suggestions</h3>
                <p className="text-neutral-300 leading-relaxed">{feedback.revision_suggestions}</p>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <Button
                onClick={() => {
                  setResponse('');
                  setFeedback(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Try Another Question
              </Button>
              <Button
                onClick={() => navigate(createPageUrl('APStudyKit'))}
                className="flex-1 bg-white text-black hover:bg-neutral-100"
              >
                Back to Study Kit
              </Button>
            </div>
          </div>
        )}

        {prompts.length === 0 && selectedUnit && (
          <div className="text-center py-12 text-neutral-400">
            No FRQ prompts available for this unit yet
          </div>
        )}
      </div>
    </div>
  );
}