import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Play, Settings } from 'lucide-react';

export default function EnginePracticeBuilder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  const [examType, setExamType] = useState('SAT');
  const [section, setSection] = useState('');
  const [domain, setDomain] = useState('');
  const [skill, setSkill] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [questionCount, setQuestionCount] = useState(10);
  const [mode, setMode] = useState('untimed');

  const [domains, setDomains] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDomains();
  }, [examType]);

  useEffect(() => {
    if (domain) {
      loadSkills();
    }
  }, [domain]);

  async function loadDomains() {
    const exams = await base44.entities.Exam.filter({ exam_type: examType });
    if (exams.length > 0) {
      const examId = exams[0].id;
      const domainList = await base44.entities.Domain.filter({ exam_id: examId });
      setDomains(domainList);
    }
  }

  async function loadSkills() {
    const skillList = await base44.entities.EngineSkill.filter({ domain_id: domain });
    setSkills(skillList);
  }

  async function startPractice() {
    setLoading(true);
    
    const user = await base44.auth.me();
    const exams = await base44.entities.Exam.filter({ exam_type: examType });
    
    const session = await base44.entities.EnginePracticeSession.create({
      user_email: user.email,
      exam_id: exams[0]?.id,
      domain_id: domain,
      mode,
      question_count: questionCount,
      started_at: new Date().toISOString()
    });

    navigate(createPageUrl('EnginePracticeSession') + `?session=${session.id}`);
  }

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-4xl mx-auto px-6">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="mb-8 text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-12">
          <h1 className="text-3xl font-light text-white mb-2">Custom Practice Builder</h1>
          <p className="text-neutral-400">Build a personalized practice session with AI-generated questions</p>
        </div>

        <div className="space-y-8">
          {/* Exam Selection */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <h2 className="text-xl font-medium text-white mb-6">1. Select Exam</h2>
            <div className="flex gap-4">
              {['SAT', 'ACT'].map((type) => (
                <button
                  key={type}
                  onClick={() => setExamType(type)}
                  className={`flex-1 py-4 px-6 rounded-xl border-2 transition-all ${
                    examType === type
                      ? 'border-white bg-white text-black'
                      : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  <div className="text-lg font-semibold">{type}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Domain/Skill Selection */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <h2 className="text-xl font-medium text-white mb-6">2. Select Focus Area</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-neutral-400 mb-2 block">Domain</label>
                <Select value={domain} onValueChange={setDomain}>
                  <SelectTrigger className="bg-black border-neutral-700 text-white">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {domain && (
                <div>
                  <label className="text-sm text-neutral-400 mb-2 block">Skill (optional)</label>
                  <Select value={skill} onValueChange={setSkill}>
                    <SelectTrigger className="bg-black border-neutral-700 text-white">
                      <SelectValue placeholder="All skills in domain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>All skills</SelectItem>
                      {skills.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <h2 className="text-xl font-medium text-white mb-6">3. Configure Session</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-neutral-400 mb-2 block">Difficulty</label>
                <Select value={String(difficulty)} onValueChange={(v) => setDifficulty(Number(v))}>
                  <SelectTrigger className="bg-black border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Easy</SelectItem>
                    <SelectItem value="2">2 - Medium-Easy</SelectItem>
                    <SelectItem value="3">3 - Medium</SelectItem>
                    <SelectItem value="4">4 - Medium-Hard</SelectItem>
                    <SelectItem value="5">5 - Hard</SelectItem>
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
                    <SelectItem value="5">5 questions</SelectItem>
                    <SelectItem value="10">10 questions</SelectItem>
                    <SelectItem value="15">15 questions</SelectItem>
                    <SelectItem value="20">20 questions</SelectItem>
                    <SelectItem value="25">25 questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
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
            </div>
          </div>

          {/* Start Button */}
          <Button
            onClick={startPractice}
            disabled={!domain || loading}
            className="w-full bg-white text-black hover:bg-neutral-100 py-6 text-lg"
          >
            {loading ? (
              'Generating Questions...'
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Start Practice Session
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}