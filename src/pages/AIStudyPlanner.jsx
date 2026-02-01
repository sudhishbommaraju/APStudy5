import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Calendar, Target, TrendingUp, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addDays, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

export default function AIStudyPlanner() {
  const [user, setUser] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [targetDate, setTargetDate] = useState('');
  const [currentLevel, setCurrentLevel] = useState('beginner');
  const [studyGoal, setStudyGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        console.error('Failed to load user:', e);
      }
    };
    loadUser();
  }, []);

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list('subject_id'),
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ['attempts', user?.email],
    queryFn: () => base44.entities.Attempt.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const createPlanMutation = useMutation({
    mutationFn: async (planData) => {
      return await base44.entities.StudyPlan.create(planData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyPlans'] });
    },
  });

  const handleGeneratePlan = async () => {
    console.log('[AIStudyPlanner] Generate Plan clicked', {
      selectedSubjects,
      targetDate,
      currentLevel,
      studyGoal
    });

    // GUARD: Validate inputs - throw instead of silent return
    if (selectedSubjects.length === 0 || !targetDate) {
      alert('Please select subjects and target date');
      return;
    }

    // IMMEDIATE STATE CHANGE
    setIsGenerating(true);

    try {
      // Analyze user's current performance
      const performanceAnalysis = {};
      selectedSubjects.forEach(subjectId => {
        const subjectAttempts = attempts.filter(a => a.subject_id === subjectId);
        const accuracy = subjectAttempts.length > 0
          ? (subjectAttempts.filter(a => a.is_correct).length / subjectAttempts.length) * 100
          : 0;
        performanceAnalysis[subjectId] = {
          attempts: subjectAttempts.length,
          accuracy: accuracy.toFixed(1),
        };
      });

      // Get subject details
      const selectedSubjectDetails = subjects.filter(s => 
        selectedSubjects.includes(s.subject_id)
      );

      // Fetch units for selected subjects
      const allUnits = await base44.entities.Unit.list();
      const relevantUnits = allUnits.filter(u => 
        selectedSubjects.includes(u.subject_id)
      );

      const daysUntilTarget = Math.ceil(
        (new Date(targetDate) - new Date()) / (1000 * 60 * 60 * 24)
      );

      const prompt = `Generate a detailed, personalized study plan for a student.

Student Profile:
- Current Level: ${currentLevel}
- Study Goal: ${studyGoal || 'Master exam material'}
- Target Date: ${targetDate} (${daysUntilTarget} days from now)

Subjects to Study: ${selectedSubjectDetails.map(s => s.name).join(', ')}

Current Performance:
${selectedSubjectDetails.map(s => {
  const perf = performanceAnalysis[s.subject_id];
  return `- ${s.name}: ${perf.attempts} questions attempted, ${perf.accuracy}% accuracy`;
}).join('\n')}

Available Units:
${relevantUnits.slice(0, 15).map(u => `- ${u.subject_name}: ${u.unit_name}`).join('\n')}

Create a structured study plan with:
1. Weekly breakdown of what to study
2. Daily goals (questions to complete, units to review)
3. Milestones and checkpoints
4. Recommended focus areas based on current performance
5. Time allocation suggestions
6. Gamification elements (achievement targets, streak goals)

Format as a detailed, actionable plan that motivates the student.`;

      const response = await base44.integrations.Core.InvokeLLM({ prompt });

      setGeneratedPlan({
        subjects: selectedSubjectDetails,
        targetDate,
        daysUntilTarget,
        planContent: response,
        performance: performanceAnalysis,
      });
    } catch (e) {
      console.error('[AIStudyPlanner] Generation failed:', e);
      alert('Failed to generate study plan. Please try again.');
    } finally {
      // GUARANTEED STATE RESET
      setIsGenerating(false);
    }
  };

  const handleSavePlan = async () => {
    console.log('[AIStudyPlanner] Save Plan clicked', { generatedPlan });

    if (!generatedPlan) {
      console.error('[AIStudyPlanner] No plan to save');
      return;
    }

    try {
      // Create a study plan for each subject
      for (const subject of generatedPlan.subjects) {
        await createPlanMutation.mutateAsync({
          title: `AI-Generated Plan: ${subject.name}`,
          description: generatedPlan.planContent.slice(0, 200) + '...',
          subject_id: subject.subject_id,
          subject_name: subject.name,
          unit_ids: [],
          skill_ids: [],
          target_date: generatedPlan.targetDate,
          total_questions_target: Math.ceil(generatedPlan.daysUntilTarget * 10),
          status: 'active',
        });
      }

      alert('Study plans created successfully!');
      setGeneratedPlan(null);
    } catch (e) {
      console.error('Failed to save plans:', e);
      alert('Failed to save study plans.');
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">AI Study Planner</h1>
        <p className="page-description">Get a personalized study plan powered by AI</p>
      </div>

      {!generatedPlan ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Subject Selection */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <label className="text-sm font-medium text-slate-100 mb-3 block">
              What subjects do you want to study?
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto bg-slate-900/30 rounded-lg p-3 border border-slate-700/30">
              {subjects.map((subject) => (
                <label key={subject.subject_id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject.subject_id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSubjects(prev => [...prev, subject.subject_id]);
                      } else {
                        setSelectedSubjects(prev => prev.filter(id => id !== subject.subject_id));
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-600 text-violet-600"
                  />
                  <span className="text-sm text-slate-300">
                    {typeof subject.icon === 'string' ? subject.icon : ''} {subject.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Target Date */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <label className="text-sm font-medium text-slate-100 mb-3 block">
              When is your target date?
            </label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="bg-slate-900/50 border-slate-700/50 text-slate-200"
            />
          </div>

          {/* Current Level */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <label className="text-sm font-medium text-slate-100 mb-3 block">
              What's your current level?
            </label>
            <Select value={currentLevel} onValueChange={setCurrentLevel}>
              <SelectTrigger className="bg-slate-900/50 border-slate-700/50 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/95 border-slate-700/50">
                <SelectItem value="beginner" className="text-slate-200">Beginner - Just starting</SelectItem>
                <SelectItem value="intermediate" className="text-slate-200">Intermediate - Some practice done</SelectItem>
                <SelectItem value="advanced" className="text-slate-200">Advanced - Almost ready</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Study Goal */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <label className="text-sm font-medium text-slate-100 mb-3 block">
              What's your study goal? (Optional)
            </label>
            <Textarea
              value={studyGoal}
              onChange={(e) => setStudyGoal(e.target.value)}
              placeholder="e.g., Score 5 on AP Calc, Master all units, Improve weak areas..."
              className="bg-slate-900/50 border-slate-700/50 text-slate-200"
            />
          </div>

          {/* Generate Button */}
          <div className="space-y-2">
            <Button
              onClick={handleGeneratePlan}
              disabled={isGenerating || selectedSubjects.length === 0 || !targetDate}
              className="w-full h-14 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Your Plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate AI Study Plan
                </>
              )}
            </Button>
            {(selectedSubjects.length === 0 || !targetDate) && (
              <p className="text-xs text-slate-400 text-center">
                {!selectedSubjects.length && !targetDate && 'Please select subjects and set a target date'}
                {!selectedSubjects.length && targetDate && 'Please select at least one subject'}
                {selectedSubjects.length > 0 && !targetDate && 'Please set a target date'}
              </p>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Plan Header */}
          <div className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl border border-violet-500/30 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-100 mb-2">Your Personalized Study Plan</h2>
                <p className="text-slate-300">
                  {generatedPlan.daysUntilTarget} days until {format(new Date(generatedPlan.targetDate), 'MMM d, yyyy')}
                </p>
              </div>
              <Target className="w-10 h-10 text-violet-400" />
            </div>
            <div className="flex gap-2">
              {generatedPlan.subjects.map(s => (
                <span key={s.subject_id} className="px-3 py-1 bg-slate-800/60 rounded-full text-sm text-slate-200">
                  {typeof s.icon === 'string' ? s.icon : ''} {s.name}
                </span>
              ))}
            </div>
          </div>

          {/* Plan Content */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-slate-200 leading-relaxed">
                {generatedPlan.planContent}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => setGeneratedPlan(null)}
              variant="outline"
              className="flex-1"
            >
              Generate New Plan
            </Button>
            <Button
              onClick={handleSavePlan}
              className="flex-1 bg-violet-600 hover:bg-violet-700"
            >
              Save & Start Plan
            </Button>
          </div>
        </motion.div>
      )}
    </>
  );
}