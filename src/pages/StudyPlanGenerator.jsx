import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Sparkles, Loader2, Calendar, BookOpen, Play, ChevronDown, ChevronUp, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const AP_SUBJECTS = [
  { id: 'biology', name: 'AP Biology' },
  { id: 'chemistry', name: 'AP Chemistry' },
  { id: 'physics_1', name: 'AP Physics 1' },
  { id: 'physics_2', name: 'AP Physics 2' },
  { id: 'physics_c_mech', name: 'AP Physics C: Mechanics' },
  { id: 'environmental_science', name: 'AP Environmental Science' },
  { id: 'calc_ab', name: 'AP Calculus AB' },
  { id: 'calc_bc', name: 'AP Calculus BC' },
  { id: 'statistics', name: 'AP Statistics' },
  { id: 'computer_science_a', name: 'AP Computer Science A' },
  { id: 'us_history', name: 'AP US History' },
  { id: 'world_history', name: 'AP World History' },
  { id: 'us_gov', name: 'AP US Government' },
  { id: 'macro', name: 'AP Macroeconomics' },
  { id: 'micro', name: 'AP Microeconomics' },
  { id: 'psychology', name: 'AP Psychology' },
  { id: 'human_geo', name: 'AP Human Geography' },
  { id: 'english_lang', name: 'AP English Language' },
  { id: 'english_lit', name: 'AP English Literature' },
];

const SAT_SECTIONS = [
  { id: 'reading_writing', name: 'Reading & Writing' },
  { id: 'math', name: 'Math' },
  { id: 'mixed', name: 'Mixed (Both)' },
];

const ACT_SECTIONS = [
  { id: 'english', name: 'English' },
  { id: 'math', name: 'Math' },
  { id: 'reading', name: 'Reading' },
  { id: 'science', name: 'Science' },
  { id: 'mixed', name: 'Mixed (All)' },
];

const EXAM_DURATIONS = [
  { value: '2', label: '2 weeks' },
  { value: '4', label: '4 weeks' },
  { value: '6', label: '6 weeks' },
  { value: '8', label: '8 weeks' },
];

const weekColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-yellow-500'];

export default function StudyPlanGenerator() {
  const navigate = useNavigate();

  // Read exam type from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const defaultExamType = urlParams.get('type') || 'AP';

  const [examType, setExamType] = useState(defaultExamType);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [weeks, setWeeks] = useState('4');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [performanceData, setPerformanceData] = useState([]);
  const [loadingPerf, setLoadingPerf] = useState(true);
  const [savedPlans, setSavedPlans] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadData();
  }, [examType]);

  // Sync examType when URL changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('type');
    if (t && t !== examType) setExamType(t);
  }, [window.location.search]);

  const loadData = async () => {
    setLoadingPerf(true);
    setPlan(null);
    setSelectedSubject('');
    try {
      const user = await base44.auth.me();
      const [history, plans] = await Promise.all([
        base44.entities.PracticeHistory.filter({ user_email: user.email }, '-completed_at', 100),
        base44.entities.StudyPlan.filter({ created_by: user.email }, '-created_date', 20),
      ]);
      // Filter history to this exam type
      const filtered = history.filter(h => {
        if (examType === 'AP') return !['SAT', 'ACT'].includes(h.subject_id?.toUpperCase()) && !['sat', 'act'].includes(h.subject_id);
        return h.subject_id?.toUpperCase() === examType || h.subject_name?.toUpperCase().includes(examType);
      });
      setPerformanceData(filtered);
      // Filter plans to exam type
      const typePlans = plans.filter(p => p.subject_name?.includes(examType) || p.title?.includes(examType));
      setSavedPlans(typePlans);
    } catch (e) {
      console.error(e);
    }
    setLoadingPerf(false);
  };

  const getWeakUnits = (subjectId) => {
    const relevant = performanceData.filter(s => s.subject_id === subjectId);
    const unitMap = {};
    relevant.forEach(s => {
      const key = s.unit_id || s.unit_name || 'unknown';
      if (!unitMap[key]) unitMap[key] = { name: s.unit_name || s.unit_id, total: 0, correct: 0 };
      unitMap[key].total += s.total_questions || 0;
      unitMap[key].correct += s.correct_count || 0;
    });
    return Object.values(unitMap)
      .filter(u => u.total > 0)
      .map(u => ({ ...u, accuracy: Math.round((u.correct / u.total) * 100) }))
      .sort((a, b) => a.accuracy - b.accuracy);
  };

  const generatePlan = async () => {
    if (!selectedSubject) { toast.error('Please select a section/subject'); return; }
    setLoading(true);
    setPlan(null);
    try {
      const user = await base44.auth.me();
      let subjectName, perfContext;

      if (examType === 'AP') {
        subjectName = AP_SUBJECTS.find(s => s.id === selectedSubject)?.name || selectedSubject;
        const weakUnits = getWeakUnits(selectedSubject);
        perfContext = weakUnits.length > 0
          ? `Student's weakest units:\n${weakUnits.slice(0, 6).map(u => `- ${u.name}: ${u.accuracy}% accuracy`).join('\n')}`
          : `No prior data. Create a balanced plan covering all major units.`;
      } else {
        subjectName = `${examType} ${selectedSubject === 'mixed' ? '(All Sections)' : selectedSubject.replace('_', ' & ')}`;
        const overallAcc = performanceData.length > 0
          ? Math.round(performanceData.reduce((s, h) => s + (h.score_pct || 0), 0) / performanceData.length)
          : null;
        perfContext = overallAcc !== null
          ? `Student's average ${examType} accuracy: ${overallAcc}%. ${performanceData.length} sessions completed.`
          : `No prior ${examType} data. Create a foundational plan.`;
      }

      const prompt = `You are an expert ${examType} exam coach. Create a ${weeks}-week study plan for ${subjectName}.

Student performance: ${perfContext}

Create a week-by-week schedule that:
1. Prioritizes weak areas first
2. Assigns 3-5 specific topics per week
3. Includes daily time estimates (e.g. "30 min")
4. Gives actionable study tips per week
5. Ends with a review/mock test week

Return JSON:
{
  "subject": "${subjectName}",
  "totalWeeks": ${weeks},
  "overview": "2-sentence plan summary",
  "weeks": [{
    "week": 1,
    "theme": "short theme",
    "focusUnits": ["unit 1", "unit 2"],
    "topics": [{"topic": "specific topic", "unit": "unit name", "dailyTime": "30 min", "tip": "brief tip"}],
    "weeklyGoal": "what student can do by end of week",
    "practiceUnit": "unit_id or section to practice"
  }]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            totalWeeks: { type: 'number' },
            overview: { type: 'string' },
            weeks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  week: { type: 'number' },
                  theme: { type: 'string' },
                  focusUnits: { type: 'array', items: { type: 'string' } },
                  topics: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        topic: { type: 'string' },
                        unit: { type: 'string' },
                        dailyTime: { type: 'string' },
                        tip: { type: 'string' },
                      }
                    }
                  },
                  weeklyGoal: { type: 'string' },
                  practiceUnit: { type: 'string' },
                }
              }
            }
          }
        }
      });

      setPlan(result);
      setExpanded({ 0: true });

      // Save plan to entity
      await base44.entities.StudyPlan.create({
        title: `${examType} - ${subjectName} (${weeks}wk)`,
        description: result.overview,
        subject_id: selectedSubject,
        subject_name: subjectName,
        target_date: new Date(Date.now() + parseInt(weeks) * 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
        status: 'active',
      });
      loadData(); // refresh history
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate plan. Please try again.');
    }
    setLoading(false);
  };

  const startPractice = (unit) => {
    if (examType === 'AP') {
      sessionStorage.setItem('ap_practice_subject', selectedSubject);
      sessionStorage.setItem('ap_practice_unit', unit);
      navigate('/APPractice');
    } else if (examType === 'SAT') {
      navigate('/SATPractice');
    } else {
      navigate('/ACTPractice');
    }
  };

  const toggleWeek = (i) => setExpanded(p => ({ ...p, [i]: !p[i] }));

  const subjectOptions = examType === 'AP' ? AP_SUBJECTS : examType === 'SAT' ? SAT_SECTIONS : ACT_SECTIONS;

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8">
      <div className="max-w-4xl mx-auto px-6">
        <button onClick={() => navigate('/Dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">AI Study Plan Generator</h1>
          <p className="text-gray-500 text-sm mt-1">Personalized week-by-week schedule based on your performance</p>
        </div>

        {/* Exam Type Tabs */}
        <div className="flex gap-2 mb-6">
          {['SAT', 'ACT', 'AP'].map(t => (
            <button key={t} onClick={() => setExamType(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold border transition-all ${
                examType === t ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Config Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-semibold text-gray-900">Configure Your {examType} Plan</h2>
          </div>

          {!loadingPerf && performanceData.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-sm text-blue-700">
              ✓ Found {performanceData.length} past {examType} sessions — your plan will be personalized.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {examType === 'AP' ? 'AP Subject' : `${examType} Section`}
              </label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                  <SelectValue placeholder={examType === 'AP' ? 'Select AP Subject' : `Select ${examType} Section`} />
                </SelectTrigger>
                <SelectContent>
                  {subjectOptions.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Study Duration</label>
              <Select value={weeks} onValueChange={setWeeks}>
                <SelectTrigger className="bg-white border-gray-200 text-gray-900"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXAM_DURATIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={generatePlan} disabled={loading || !selectedSubject} className="w-full bg-blue-500 hover:bg-blue-600 text-white shadow-sm" size="lg">
            {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating personalized plan…</> : <><Sparkles className="w-5 h-5 mr-2" />Generate Study Plan</>}
          </Button>
        </div>

        {/* Past Plans History */}
        {savedPlans.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6">
            <button onClick={() => setShowHistory(p => !p)} className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">Past {examType} Plans ({savedPlans.length})</span>
              </div>
              {showHistory ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showHistory && (
              <div className="mt-4 space-y-2">
                {savedPlans.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.title}</p>
                      <p className="text-xs text-gray-400">{p.description?.slice(0, 80)}…</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Plan Output */}
        {plan && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <h2 className="text-base font-semibold text-gray-900">{plan.subject} — {plan.totalWeeks}-Week Plan</h2>
              </div>
              <p className="text-gray-600 text-sm">{plan.overview}</p>
            </div>

            {(plan.weeks || []).map((week, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <button onClick={() => toggleWeek(i)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${weekColors[i % weekColors.length]} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                      {week.week}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 text-sm">Week {week.week}: {week.theme}</p>
                      <p className="text-xs text-gray-500">{(week.focusUnits || []).join(' · ')}</p>
                    </div>
                  </div>
                  {expanded[i] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {expanded[i] && (
                  <div className="px-5 pb-5 border-t border-gray-100">
                    <div className="bg-gray-50 rounded-lg p-3 mt-4 mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Weekly Goal</p>
                      <p className="text-sm text-gray-700">{week.weeklyGoal}</p>
                    </div>

                    <div className="space-y-3 mb-4">
                      {(week.topics || []).map((t, j) => (
                        <div key={j} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <BookOpen className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className="text-sm font-medium text-gray-900">{t.topic}</p>
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full shrink-0">{t.dailyTime}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{t.unit}</p>
                            {t.tip && <p className="text-xs text-gray-400 mt-1 italic">💡 {t.tip}</p>}
                          </div>
                        </div>
                      ))}
                    </div>

                    {week.practiceUnit && (
                      <Button onClick={() => startPractice(week.practiceUnit)} size="sm" className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm w-full">
                        <Play className="w-4 h-4 mr-2" /> Start Practice for Week {week.week}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}