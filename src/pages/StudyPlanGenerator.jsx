import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Sparkles, Loader2, Calendar, BookOpen, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const AP_SUBJECTS = [
  { id: 'biology', name: 'AP Biology' },
  { id: 'chemistry', name: 'AP Chemistry' },
  { id: 'physics_1', name: 'AP Physics 1' },
  { id: 'physics_2', name: 'AP Physics 2' },
  { id: 'physics_c_mech', name: 'AP Physics C: Mechanics' },
  { id: 'physics_c_em', name: 'AP Physics C: E&M' },
  { id: 'environmental_science', name: 'AP Environmental Science' },
  { id: 'calc_ab', name: 'AP Calculus AB' },
  { id: 'calc_bc', name: 'AP Calculus BC' },
  { id: 'statistics', name: 'AP Statistics' },
  { id: 'cs_a', name: 'AP Computer Science A' },
  { id: 'cs_principles', name: 'AP Computer Science Principles' },
  { id: 'us_history', name: 'AP US History' },
  { id: 'world_history', name: 'AP World History: Modern' },
  { id: 'european_history', name: 'AP European History' },
  { id: 'us_gov', name: 'AP US Government & Politics' },
  { id: 'comp_gov', name: 'AP Comparative Government & Politics' },
  { id: 'macro', name: 'AP Macroeconomics' },
  { id: 'micro', name: 'AP Microeconomics' },
  { id: 'psychology', name: 'AP Psychology' },
  { id: 'human_geo', name: 'AP Human Geography' },
  { id: 'english_lang', name: 'AP English Language & Composition' },
  { id: 'english_lit', name: 'AP English Literature & Composition' },
];

const EXAM_DURATIONS = [
  { value: '2', label: '2 weeks' },
  { value: '4', label: '4 weeks' },
  { value: '6', label: '6 weeks' },
  { value: '8', label: '8 weeks' },
];

export default function StudyPlanGenerator() {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [weeks, setWeeks] = useState('4');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [performanceData, setPerformanceData] = useState([]);
  const [loadingPerf, setLoadingPerf] = useState(true);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    setLoadingPerf(true);
    try {
      const user = await base44.auth.me();
      const history = await base44.entities.PracticeHistory.filter(
        { user_email: user.email }, '-completed_at', 50
      );
      setPerformanceData(history);
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
    if (!selectedSubject) { toast.error('Please select a subject'); return; }
    setLoading(true);
    setPlan(null);
    try {
      const subjectName = AP_SUBJECTS.find(s => s.id === selectedSubject)?.name || selectedSubject;
      const weakUnits = getWeakUnits(selectedSubject);

      const perfContext = weakUnits.length > 0
        ? `The student's weakest units (by accuracy) are:\n${weakUnits.slice(0, 6).map(u => `- ${u.name}: ${u.accuracy}% accuracy (${u.total} questions attempted)`).join('\n')}`
        : `No prior performance data available for this subject. Create a balanced plan covering all major units.`;

      const prompt = `You are an expert AP exam coach. Create a ${weeks}-week study plan for ${subjectName}.

Student performance data:
${perfContext}

Create a week-by-week study schedule that:
1. Prioritizes the weakest units first
2. Assigns 3–5 specific topics per week
3. Includes daily time estimates (e.g. "30 min")
4. Gives actionable study tips per week
5. Ends with a review/mock test week

Return a JSON object with this structure:
{
  "subject": "${subjectName}",
  "totalWeeks": ${weeks},
  "overview": "2-sentence summary of the plan strategy",
  "weeks": [
    {
      "week": 1,
      "theme": "short theme name",
      "focusUnits": ["unit name 1", "unit name 2"],
      "topics": [
        { "topic": "specific topic", "unit": "unit it belongs to", "dailyTime": "30 min", "tip": "brief study tip" }
      ],
      "weeklyGoal": "what the student should be able to do by end of week",
      "practiceUnit": "unit_id to practice (use the unit's id format like unit_1, unit_2)"
    }
  ]
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
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate plan. Please try again.');
    }
    setLoading(false);
  };

  const startPractice = (unit) => {
    sessionStorage.setItem('ap_practice_subject', selectedSubject);
    sessionStorage.setItem('ap_practice_unit', unit);
    navigate('/APPractice');
  };

  const toggleWeek = (i) => setExpanded(p => ({ ...p, [i]: !p[i] }));

  const weekColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-yellow-500'];

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8">
      <div className="max-w-4xl mx-auto px-6">
        <button
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">AI Study Plan Generator</h1>
          <p className="text-gray-500 text-sm mt-1">Personalized week-by-week schedule based on your performance data</p>
        </div>

        {/* Config Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-semibold text-gray-900">Configure Your Plan</h2>
          </div>

          {!loadingPerf && performanceData.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-sm text-blue-700">
              ✓ Found {performanceData.length} past sessions — your plan will be personalized to your weak areas.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">AP Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                  <SelectValue placeholder="Select AP Subject" />
                </SelectTrigger>
                <SelectContent>
                  {AP_SUBJECTS.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Study Duration</label>
              <Select value={weeks} onValueChange={setWeeks}>
                <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_DURATIONS.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={generatePlan}
            disabled={loading || !selectedSubject}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
            size="lg"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating your personalized plan...</>
            ) : (
              <><Sparkles className="w-5 h-5 mr-2" />Generate Study Plan</>
            )}
          </Button>
        </div>

        {/* Plan Output */}
        {plan && (
          <div className="space-y-4">
            {/* Overview */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <h2 className="text-base font-semibold text-gray-900">{plan.subject} — {plan.totalWeeks}-Week Plan</h2>
              </div>
              <p className="text-gray-600 text-sm">{plan.overview}</p>
            </div>

            {/* Week Cards */}
            {(plan.weeks || []).map((week, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Week Header */}
                <button
                  onClick={() => toggleWeek(i)}
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                >
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
                    {/* Weekly goal */}
                    <div className="bg-gray-50 rounded-lg p-3 mt-4 mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Weekly Goal</p>
                      <p className="text-sm text-gray-700">{week.weeklyGoal}</p>
                    </div>

                    {/* Topics */}
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

                    {/* Practice CTA */}
                    {week.practiceUnit && (
                      <Button
                        onClick={() => startPractice(week.practiceUnit)}
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm w-full"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Practice Session for Week {week.week}
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