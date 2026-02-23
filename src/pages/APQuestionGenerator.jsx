import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Sparkles, Loader2, Plus, Tags } from 'lucide-react';
import { toast } from 'sonner';

export default function APQuestionGenerator() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [unit, setUnit] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [questionCount, setQuestionCount] = useState(5);
  const [keywords, setKeywords] = useState('');

  const apSubjects = [
    { id: 'biology', name: 'AP Biology' },
    { id: 'chemistry', name: 'AP Chemistry' },
    { id: 'physics_1', name: 'AP Physics 1' },
    { id: 'calc_ab', name: 'AP Calculus AB' },
    { id: 'calc_bc', name: 'AP Calculus BC' },
    { id: 'us_history', name: 'AP US History' },
    { id: 'world_history', name: 'AP World History: Modern' },
    { id: 'statistics', name: 'AP Statistics' },
    { id: 'psychology', name: 'AP Psychology' },
    { id: 'macro', name: 'AP Macroeconomics' },
    { id: 'micro', name: 'AP Microeconomics' },
  ];

  const handleGenerateQuestions = async () => {
    if (!subject || !topic) {
      toast.error('Please fill in subject and topic');
      return;
    }

    setLoading(true);
    try {
      const { generateQuestionsWithRetry } = await import('@/components/generation/RobustQuestionGenerator');
      
      const keywordList = keywords.split(',').map(k => k.trim()).filter(Boolean);
      
      const result = await generateQuestionsWithRetry({
        examType: 'AP',
        subjectId: subject,
        unitId: unit,
        difficulty: difficulty,
        questionCount: questionCount,
        questionType: 'MCQ',
        topic: topic,
        keywords: keywordList
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to generate questions');
        return;
      }

      toast.success(`${result.count} questions generated successfully!`);
      
      // Start practice session with generated questions
      const session = await base44.entities.EnginePracticeSession.create({
        user_email: (await base44.auth.me()).email,
        exam_id: 'AP',
        subject_id: subject,
        unit_id: unit,
        question_count: result.count,
        mode: 'untimed'
      });

      navigate(createPageUrl('EnginePracticeSession') + `?session=${session.id}`);
    } catch (error) {
      toast.error('Generation failed: ' + error.message);
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-3xl mx-auto px-6">
        <button
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-12"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-8 h-8 text-purple-500" />
            <div>
              <h1 className="text-3xl font-light text-white">AI Question Generator</h1>
              <p className="text-neutral-400 mt-1">Create custom practice questions tailored to your needs</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Subject</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectValue placeholder="Select AP Subject" />
                </SelectTrigger>
                <SelectContent>
                  {apSubjects.map((subj) => (
                    <SelectItem key={subj.id} value={subj.id}>
                      {subj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Unit (Optional)</label>
              <Input
                placeholder="e.g., Unit 3, Unit 7"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Specific Topic</label>
              <Input
                placeholder="e.g., Cellular Respiration, Derivatives, Cold War"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Difficulty Level: {difficulty}/5
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value))}
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>Easy</span>
                <span>Medium</span>
                <span>Hard</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Number of Questions</label>
              <Select value={questionCount.toString()} onValueChange={(v) => setQuestionCount(parseInt(v))}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Questions</SelectItem>
                  <SelectItem value="10">10 Questions</SelectItem>
                  <SelectItem value="15">15 Questions</SelectItem>
                  <SelectItem value="20">20 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2 flex items-center gap-2">
                <Tags className="w-4 h-4" />
                Emphasize Keywords (Optional)
              </label>
              <Textarea
                placeholder="Enter specific concepts to focus on (comma-separated)"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
                rows={2}
              />
            </div>

            <Button
              onClick={handleGenerateQuestions}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Generate & Start Practice
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}