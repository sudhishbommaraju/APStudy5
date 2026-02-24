import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Zap, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import AdaptiveQuestionSelector from '@/components/practice/AdaptiveQuestionSelector';

export default function SATAdaptivePractice() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    
    async function checkDailyLimit() {
      try {
        const user = await base44.auth.me();
        const today = new Date().toISOString().split('T')[0];
        
        const todaySessions = await base44.entities.EnginePracticeSession.filter({
          user_email: user.email
        }, '-created_date', 100);

        if (mounted) {
          const todayCount = todaySessions.filter(s => 
            s.created_date && s.created_date.startsWith(today)
          ).length;

          setGenerationCount(todayCount);
        }
      } catch (error) {
        console.error('Failed to check daily limit:', error);
      }
    }
    
    checkDailyLimit();
    
    return () => {
      mounted = false;
    };
  }, []);

  async function handleStartPractice(settings) {
    // Check daily limit for free users
    if (generationCount >= 3) {
      toast.error('Daily limit reached (3 practices per day for free users)');
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      const exams = await base44.entities.Exam.filter({ exam_type: 'SAT' });
      
      if (!exams.length) throw new Error('SAT exam not found');

      // Generate questions with adaptive difficulty
      const { generateQuestionsWithRetry } = await import('@/components/generation/RobustQuestionGenerator');
      
      const result = await generateQuestionsWithRetry({
        examType: 'SAT',
        difficulty: settings.difficulty,
        questionCount: settings.questionCount,
        questionType: 'MCQ',
        userEmail: user.email,
        adaptiveDifficulty: settings.difficulty === 'adaptive'
      });

      if (!result.success || result.questions.length === 0) {
        throw new Error(result.error || 'Failed to generate questions');
      }

      // Create new practice session
      const session = await base44.entities.EnginePracticeSession.create({
        user_email: user.email,
        exam_id: exams[0].id,
        question_count: result.questions.length,
        mode: 'untimed',
        status: 'active',
        started_at: new Date().toISOString()
      });

      if (!session || !session.id) {
        throw new Error('Failed to create practice session');
      }

      toast.success(`Generated ${result.questions.length} SAT questions!`);
      navigate(createPageUrl('EnginePracticeSession') + `?session=${session.id}`);
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error(error.message || 'Failed to generate practice');
    } finally {
      setLoading(false);
    }
  }

  const canGenerate = generationCount < 3;

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-4xl mx-auto px-6">
        <button
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-12"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-light text-white mb-2">SAT Adaptive Practice</h1>
          <p className="text-neutral-400">Generate personalized SAT practice based on your performance</p>
          
          {!canGenerate && (
            <Card className="bg-orange-900/20 border-orange-500/30 p-4 mt-4">
              <p className="text-orange-400 text-sm">
                Daily limit reached ({generationCount}/3 practices today). 
                You can still review past sessions.
              </p>
            </Card>
          )}
        </div>

        {canGenerate ? (
          <AdaptiveQuestionSelector 
            examType="SAT"
            onStart={handleStartPractice}
          />
        ) : (
          <Card className="bg-neutral-900 border-neutral-800 p-8 text-center">
            <BookOpen className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Daily Limit Reached</h3>
            <p className="text-neutral-400 mb-6">
              You've generated {generationCount} practice sessions today. 
              Come back tomorrow for more!
            </p>
            <Button
              onClick={() => navigate(createPageUrl('Dashboard'))}
              variant="outline"
            >
              View Past Sessions
            </Button>
          </Card>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-neutral-900 border-neutral-800 p-8 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
              <p className="text-white text-lg">Generating your practice session...</p>
              <p className="text-neutral-400 text-sm mt-2">This may take a few seconds</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}