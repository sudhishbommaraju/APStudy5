import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Target, Calendar, TrendingUp, Play, Trash2, CheckCircle2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import CreateStudyPlanModal from '@/components/studyplan/CreateStudyPlanModal';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function StudyPlans() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

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

  const { data: studyPlans = [] } = useQuery({
    queryKey: ['studyPlans', user?.email],
    queryFn: () => base44.entities.StudyPlan.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ['attempts', user?.email],
    queryFn: () => base44.entities.Attempt.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const deletePlanMutation = useMutation({
    mutationFn: (planId) => base44.entities.StudyPlan.delete(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyPlans'] });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StudyPlan.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyPlans'] });
    },
  });

  const handleStartPractice = async (plan) => {
    navigate(createPageUrl('Practice'), {
      state: {
        autoGenerate: true,
        studyPlan: plan
      }
    });
  };

  const handleCompletePlan = (plan) => {
    updatePlanMutation.mutate({
      id: plan.id,
      data: { status: 'completed' }
    });
  };

  const getProgressForPlan = (plan) => {
    if (!plan.total_questions_target) return 0;
    return Math.min(100, (plan.questions_completed / plan.total_questions_target) * 100);
  };

  const getDaysRemaining = (targetDate) => {
    if (!targetDate) return null;
    const days = differenceInDays(new Date(targetDate), new Date());
    return days;
  };

  const activePlans = studyPlans.filter(p => p.status === 'active');
  const completedPlans = studyPlans.filter(p => p.status === 'completed');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-slate-700 border-t-violet-500 rounded-full" />
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Study Plans</h1>
        <p className="page-description">Create and track personalized study plans</p>
      </div>

      <div className="space-y-6">
        {/* Create New Plan Button */}
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Study Plan
        </Button>

        {/* Active Plans */}
        {activePlans.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">Active Plans</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {activePlans.map((plan) => {
                const progress = getProgressForPlan(plan);
                const daysRemaining = getDaysRemaining(plan.target_date);
                
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 shadow-lg hover:border-violet-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-100 mb-1">{plan.title}</h3>
                        <p className="text-sm text-slate-400">{plan.subject_name}</p>
                      </div>
                      <button
                        onClick={() => deletePlanMutation.mutate(plan.id)}
                        className="text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {plan.description && (
                      <p className="text-sm text-slate-300 mb-4">{plan.description}</p>
                    )}

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-slate-400 mb-2">
                        <span>Progress</span>
                        <span>{plan.questions_completed} / {plan.total_questions_target} questions</span>
                      </div>
                      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <div className="text-xs text-slate-400 mb-1">Sessions</div>
                        <div className="text-lg font-semibold text-slate-100">{plan.practice_sessions_completed}</div>
                      </div>
                      {daysRemaining !== null && (
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <div className="text-xs text-slate-400 mb-1">Days Left</div>
                          <div className={cn(
                            "text-lg font-semibold",
                            daysRemaining < 0 ? "text-rose-400" : "text-slate-100"
                          )}>
                            {daysRemaining < 0 ? 'Overdue' : daysRemaining}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleStartPractice(plan)}
                        className="flex-1"
                        size="sm"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Practice
                      </Button>
                      <Button
                        onClick={() => handleCompletePlan(plan)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Complete
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Plans */}
        {completedPlans.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">Completed Plans</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {completedPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-slate-800/20 backdrop-blur-sm rounded-xl border border-slate-700/30 p-6 opacity-75"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100 mb-1">{plan.title}</h3>
                      <p className="text-sm text-slate-400">{plan.subject_name}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-sm text-slate-400 mt-2">
                    {plan.questions_completed} questions • {plan.practice_sessions_completed} sessions
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {studyPlans.length === 0 && (
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-100 mb-2">No Study Plans Yet</h3>
            <p className="text-slate-400 mb-6">Create your first study plan to start organizing your learning</p>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-gradient-to-r from-violet-600 to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Plan
            </Button>
          </div>
        )}
      </div>

      <CreateStudyPlanModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </>
  );
}