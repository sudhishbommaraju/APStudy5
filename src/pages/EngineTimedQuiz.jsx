import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Clock } from 'lucide-react';

export default function EngineTimedQuiz() {
  const navigate = useNavigate();
  const [examType, setExamType] = useState('SAT');
  const [duration, setDuration] = useState(10);
  const [questionCount, setQuestionCount] = useState(10);

  async function startQuiz() {
    const user = await base44.auth.me();
    const exams = await base44.entities.Exam.filter({ exam_type: examType });
    
    const session = await base44.entities.EnginePracticeSession.create({
      user_email: user.email,
      exam_id: exams[0]?.id,
      mode: 'timed',
      question_count: questionCount,
      started_at: new Date().toISOString()
    });

    navigate(createPageUrl('EnginePracticeSession') + `?session=${session.id}&timed=${duration}`);
  }

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-2xl mx-auto px-6">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('EngineHome'))}
          className="mb-8 text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-12 text-center">
          <Clock className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h1 className="text-3xl font-light text-white mb-2">Timed Quiz</h1>
          <p className="text-neutral-400">Quick practice sprint under time pressure</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 space-y-6">
          <div>
            <label className="text-sm text-neutral-400 mb-2 block">Exam Type</label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger className="bg-black border-neutral-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SAT">SAT</SelectItem>
                <SelectItem value="ACT">ACT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-neutral-400 mb-2 block">Duration (minutes)</label>
            <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
              <SelectTrigger className="bg-black border-neutral-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="20">20 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-neutral-400 mb-2 block">Questions</label>
            <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(Number(v))}>
              <SelectTrigger className="bg-black border-neutral-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 questions</SelectItem>
                <SelectItem value="10">10 questions</SelectItem>
                <SelectItem value="15">15 questions</SelectItem>
                <SelectItem value="20">20 questions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={startQuiz}
            className="w-full bg-orange-500 text-white hover:bg-orange-600 py-6 text-lg"
          >
            <Clock className="w-5 h-5 mr-2" />
            Start {duration}-Minute Quiz
          </Button>
        </div>
      </div>
    </div>
  );
}