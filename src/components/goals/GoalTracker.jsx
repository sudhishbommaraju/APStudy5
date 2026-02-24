import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Target, Trophy, TrendingUp, Calendar, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function GoalTracker({ examType }) {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newGoal, setNewGoal] = useState({
    type: 'questions',
    target: 50,
    deadline: '',
    description: ''
  });

  useEffect(() => {
    loadGoals();
  }, [examType]);

  async function loadGoals() {
    try {
      const user = await base44.auth.me();
      const userGoals = user.practice_goals || [];
      
      // Calculate progress for each goal
      const sessions = await base44.entities.EnginePracticeSession.filter({
        user_email: user.email
      }, '-completed_at', 100);

      const responses = await Promise.all(
        sessions.map(s => base44.entities.EnginePracticeResponse.filter({ session_id: s.id }))
      );
      const allResponses = responses.flat();

      const goalsWithProgress = userGoals.map(goal => {
        let progress = 0;
        
        if (goal.type === 'questions') {
          progress = allResponses.length;
        } else if (goal.type === 'accuracy') {
          const correct = allResponses.filter(r => r.is_correct).length;
          progress = allResponses.length > 0 ? (correct / allResponses.length) * 100 : 0;
        } else if (goal.type === 'sessions') {
          progress = sessions.filter(s => s.completed_at).length;
        }

        return {
          ...goal,
          progress,
          percentage: Math.min((progress / goal.target) * 100, 100)
        };
      });

      setGoals(goalsWithProgress);
    } catch (error) {
      console.error('Failed to load goals:', error);
    }
  }

  async function createGoal() {
    if (!newGoal.target || !newGoal.deadline) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      const existingGoals = user.practice_goals || [];
      
      const goal = {
        id: Date.now().toString(),
        ...newGoal,
        createdAt: new Date().toISOString(),
        examType
      };

      await base44.auth.updateMe({
        practice_goals: [...existingGoals, goal]
      });

      toast.success('Goal created!');
      setShowForm(false);
      setNewGoal({ type: 'questions', target: 50, deadline: '', description: '' });
      loadGoals();
    } catch (error) {
      toast.error('Failed to create goal');
    } finally {
      setLoading(false);
    }
  }

  async function deleteGoal(goalId) {
    try {
      const user = await base44.auth.me();
      const updatedGoals = (user.practice_goals || []).filter(g => g.id !== goalId);
      
      await base44.auth.updateMe({
        practice_goals: updatedGoals
      });

      toast.success('Goal deleted');
      loadGoals();
    } catch (error) {
      toast.error('Failed to delete goal');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-semibold text-white">Practice Goals</h2>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-neutral-900 border-neutral-800 p-6">
              <h3 className="text-lg font-medium text-white mb-4">Create New Goal</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Goal Type</label>
                  <Select value={newGoal.type} onValueChange={(v) => setNewGoal({...newGoal, type: v})}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="questions">Answer X Questions</SelectItem>
                      <SelectItem value="accuracy">Reach X% Accuracy</SelectItem>
                      <SelectItem value="sessions">Complete X Sessions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Target</label>
                  <Input
                    type="number"
                    value={newGoal.target}
                    onChange={(e) => setNewGoal({...newGoal, target: parseInt(e.target.value)})}
                    className="bg-neutral-800 border-neutral-700 text-white"
                    placeholder="50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Deadline</label>
                  <Input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Description (optional)</label>
                  <Input
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                    className="bg-neutral-800 border-neutral-700 text-white"
                    placeholder="e.g., Master SAT Math by finals"
                  />
                </div>

                <div className="flex gap-3">
                  <Button onClick={createGoal} disabled={loading} className="flex-1">
                    {loading ? 'Creating...' : 'Create Goal'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4">
        {goals.length === 0 ? (
          <Card className="bg-neutral-900 border-neutral-800 p-8 text-center">
            <Trophy className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400">No goals yet. Create your first practice goal!</p>
          </Card>
        ) : (
          goals.map((goal) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              layout
            >
              <Card className="bg-neutral-900 border-neutral-800 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {goal.percentage >= 100 ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                      )}
                      <h3 className="text-lg font-medium text-white">
                        {goal.type === 'questions' && `Answer ${goal.target} Questions`}
                        {goal.type === 'accuracy' && `Reach ${goal.target}% Accuracy`}
                        {goal.type === 'sessions' && `Complete ${goal.target} Sessions`}
                      </h3>
                    </div>
                    {goal.description && (
                      <p className="text-sm text-neutral-400 mb-3">{goal.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <Calendar className="w-4 h-4" />
                      <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteGoal(goal.id)}
                    className="text-neutral-400 hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">Progress</span>
                    <span className="text-white font-medium">
                      {Math.round(goal.progress)} / {goal.target}
                      {goal.type === 'accuracy' && '%'}
                    </span>
                  </div>
                  <Progress value={goal.percentage} className="h-2" />
                  <div className="text-right text-sm text-neutral-500">
                    {Math.round(goal.percentage)}% complete
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}