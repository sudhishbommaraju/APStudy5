import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Zap, Target } from 'lucide-react';

export default function ACTAdaptivePractice() {
  const navigate = useNavigate();
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [questionCount, setQuestionCount] = useState(20);
  const [mode, setMode] = useState('untimed');

  useEffect(() => {
    let mounted = true;
    
    async function loadDomains() {
      try {
        const exams = await base44.entities.Exam.filter({ exam_type: 'ACT' });
        if (exams.length > 0 && mounted) {
          const domainList = await base44.entities.Domain.filter({ exam_id: exams[0].id });
          if (mounted) {
            setDomains(domainList);
          }
        }
      } catch (error) {
        console.error('Failed to load domains:', error);
      }
    }
    
    loadDomains();
    
    return () => {
      mounted = false;
    };
  }, []);

  async function startPractice() {
    try {
      const user = await base44.auth.me();
      const exams = await base44.entities.Exam.filter({ exam_type: 'ACT' });
      
      const session = await base44.entities.EnginePracticeSession.create({
        user_email: user.email,
        exam_id: exams[0]?.id,
        domain_id: selectedDomain,
        mode,
        question_count: questionCount,
        started_at: new Date().toISOString()
      });

      navigate(createPageUrl('EnginePracticeSession') + `?session=${session.id}`);
    } catch (error) {
      console.error('Failed to start practice:', error);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-16">
      <div className="max-w-3xl mx-auto px-6">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="mb-8 text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-12 text-center">
          <Zap className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">ACT Adaptive Practice</h1>
          <p className="text-gray-500">Questions that adapt to your performance</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Section</label>
            <Select value={selectedDomain} onValueChange={setSelectedDomain}>
              <SelectTrigger className="bg-white border-gray-200 text-gray-900">
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
            <label className="text-sm font-medium text-gray-700 mb-2 block">Question Count</label>
            <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(Number(v))}>
              <SelectTrigger className="bg-white border-gray-200 text-gray-900">
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
            <label className="text-sm font-medium text-gray-700 mb-2 block">Mode</label>
            <div className="flex gap-4">
              <button
                onClick={() => setMode('untimed')}
                className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                  mode === 'untimed'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                Untimed
              </button>
              <button
                onClick={() => setMode('timed')}
                className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                  mode === 'timed'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                Timed
              </button>
            </div>
          </div>

          <Button
            onClick={startPractice}
            disabled={!selectedDomain}
            className="w-full bg-blue-500 text-white hover:bg-blue-600 py-6 text-lg shadow-sm"
          >
            <Target className="w-5 h-5 mr-2" />
            Start Adaptive Practice
          </Button>
        </div>
      </div>
    </div>
  );
}