import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Zap, Target } from 'lucide-react';

export default function SATAdaptivePractice() {
  const navigate = useNavigate();
  const [section, setSection] = useState('');
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [questionCount, setQuestionCount] = useState(20);
  const [mode, setMode] = useState('untimed');

  useEffect(() => {
    loadDomains();
  }, []);

  async function loadDomains() {
    const exams = await base44.entities.Exam.filter({ exam_type: 'SAT' });
    if (exams.length > 0) {
      const domainList = await base44.entities.Domain.filter({ exam_id: exams[0].id });
      setDomains(domainList);
    }
  }

  async function startPractice() {
    const user = await base44.auth.me();
    const exams = await base44.entities.Exam.filter({ exam_type: 'SAT' });
    
    const session = await base44.entities.EnginePracticeSession.create({
      user_email: user.email,
      exam_id: exams[0]?.id,
      domain_id: selectedDomain,
      mode,
      question_count: questionCount,
      started_at: new Date().toISOString()
    });

    navigate(createPageUrl('EnginePracticeSession') + `?session=${session.id}`);
  }

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-3xl mx-auto px-6">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="mb-8 text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-12 text-center">
          <Zap className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-3xl font-light text-white mb-2">SAT Adaptive Practice</h1>
          <p className="text-neutral-400">AI-powered questions that adapt to your skill level</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 space-y-6">
          <div>
            <label className="text-sm text-neutral-400 mb-2 block">Section</label>
            <Select value={selectedDomain} onValueChange={setSelectedDomain}>
              <SelectTrigger className="bg-black border-neutral-700 text-white">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {domains.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-neutral-400 mb-2 block">Question Count</label>
            <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(Number(v))}>
              <SelectTrigger className="bg-black border-neutral-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 questions</SelectItem>
                <SelectItem value="20">20 questions</SelectItem>
                <SelectItem value="30">30 questions</SelectItem>
                <SelectItem value="40">40 questions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-neutral-400 mb-2 block">Mode</label>
            <div className="flex gap-4">
              <button
                onClick={() => setMode('untimed')}
                className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                  mode === 'untimed'
                    ? 'border-white bg-white text-black'
                    : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'
                }`}
              >
                Untimed
              </button>
              <button
                onClick={() => setMode('timed')}
                className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                  mode === 'timed'
                    ? 'border-white bg-white text-black'
                    : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'
                }`}
              >
                Timed
              </button>
            </div>
          </div>

          <Button
            onClick={startPractice}
            disabled={!selectedDomain}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 py-6 text-lg"
          >
            <Target className="w-5 h-5 mr-2" />
            Start Adaptive Practice
          </Button>
        </div>

        <div className="mt-8 bg-blue-900/20 border border-blue-800/30 rounded-xl p-6">
          <h3 className="text-blue-400 font-medium mb-2">Adaptive Engine</h3>
          <div className="text-sm text-blue-300/70 space-y-1">
            <p>• Questions automatically adjust to your skill level</p>
            <p>• Accuracy &gt; 80%: Difficulty increases</p>
            <p>• Accuracy &lt; 60%: Difficulty decreases</p>
            <p>• Focus on skills where you need the most practice</p>
          </div>
        </div>
      </div>
    </div>
  );
}