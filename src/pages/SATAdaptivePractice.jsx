import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Zap, Target, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SATAdaptivePractice() {
  const navigate = useNavigate();
  const [section, setSection] = useState('');
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [questionCount, setQuestionCount] = useState(20);
  const [mode, setMode] = useState('untimed');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examId, setExamId] = useState(null);

  useEffect(() => {
    loadDomains();
  }, []);

  async function loadDomains() {
    try {
      setLoading(true);
      setError(null);
      const exams = await base44.entities.Exam.filter({ exam_type: 'SAT' });
      if (exams.length > 0) {
        setExamId(exams[0].id);
        const domainList = await base44.entities.Domain.filter({ exam_id: exams[0].id });
        setDomains(domainList);
      }
    } catch (err) {
      console.error('Failed to load domains:', err);
      if (err.message?.includes('rate limit') || err.message?.includes('429')) {
        setError('Rate limit reached. Please wait a moment before trying again.');
        toast.error('Rate limit reached. Please try again in a moment.');
      } else {
        setError('Failed to load practice sections. Please try again.');
        toast.error('Failed to load sections');
      }
    } finally {
      setLoading(false);
    }
  }

  async function startPractice() {
    if (!examId || !selectedDomain) {
      toast.error('Please select a section');
      return;
    }

    try {
      const user = await base44.auth.me();
      const session = await base44.entities.EnginePracticeSession.create({
        user_email: user.email,
        exam_id: examId,
        domain_id: selectedDomain,
        mode,
        question_count: questionCount,
        started_at: new Date().toISOString()
      });

      navigate(createPageUrl('EnginePracticeSession') + `?session=${session.id}`);
    } catch (err) {
      console.error('Failed to start practice:', err);
      if (err.message?.includes('rate limit') || err.message?.includes('429')) {
        toast.error('Rate limit reached. Please wait a moment and try again.');
      } else {
        toast.error('Failed to start practice session');
      }
    }
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

        {error && (
          <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4 flex gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 text-sm font-medium">Loading Error</p>
              <p className="text-red-200/70 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 space-y-6">
          <div>
            <label className="text-sm text-neutral-400 mb-2 block">Section</label>
            {loading ? (
              <div className="flex items-center gap-2 py-2 px-3 text-neutral-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading sections...</span>
              </div>
            ) : (
              <Select value={selectedDomain} onValueChange={setSelectedDomain} disabled={loading || domains.length === 0}>
                <SelectTrigger className="bg-black border-neutral-700 text-white">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
            disabled={!selectedDomain || loading}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 py-6 text-lg disabled:opacity-50"
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