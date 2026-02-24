import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ACTPractice() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [error, setError] = useState(null);
  const [examId, setExamId] = useState(null);
  const [practicing, setPracticing] = useState(false);

  useEffect(() => {
    // Always clear state to allow new generation
    setError(null);
    setSelectedSection('');
    setPracticing(false);
    
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      setError(null);
      const exams = await base44.entities.Exam.filter({ exam_type: 'ACT' });
      if (exams.length > 0) {
        setExamId(exams[0].id);
        const domainList = await base44.entities.Domain.filter({ exam_id: exams[0].id });
        setSections(domainList);
      }
    } catch (err) {
      console.error('Failed to load sections:', err);
      setError('Failed to load practice sections');
      toast.error('Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  const startPractice = async () => {
    if (!selectedSection) {
      toast.error('Please select a section');
      return;
    }

    try {
      setPracticing(true);
      const user = await base44.auth.me();
      
      // Get section info for question generation
      const sectionData = sections.find(s => s.id === selectedSection);
      const sectionName = sectionData?.name || 'ACT';

      // Check for existing questions
      let practiceQuestions = await base44.entities.ProoflyQuestion.filter({
        is_active: true
      }, '-created_date', questionCount);

      // Filter for ACT questions
      practiceQuestions = practiceQuestions.filter(q => 
        q.generation_metadata?.exam_type === 'ACT' &&
        (q.generation_metadata?.domain_id === selectedSection || !q.generation_metadata?.domain_id)
      );

      // Generate if needed
      if (practiceQuestions.length < questionCount) {
        console.log(`Generating ${questionCount} ACT questions for ${sectionName}...`);
        const { generateQuestions } = await import('@/components/generation/RobustQuestionGenerator');
        
        const result = await generateQuestions({
          exam_type: 'ACT',
          domain_id: selectedSection,
          difficulty: 3,
          count: questionCount,
          keywords: [sectionName]
        });

        if (result.success && result.questions.length > 0) {
          practiceQuestions = result.questions;
          toast.success(`Generated ${result.questions.length} original questions`);
        } else {
          throw new Error(result.error || 'Question generation failed');
        }
      }

      if (practiceQuestions.length === 0) {
        throw new Error('No questions available for practice');
      }

      const session = await base44.entities.EnginePracticeSession.create({
        user_email: user.email,
        exam_id: examId,
        domain_id: selectedSection,
        mode: 'untimed',
        status: 'active',
        question_count: practiceQuestions.length,
        started_at: new Date().toISOString()
      });

      if (!session || !session.id) {
        throw new Error('Session creation failed');
      }

      console.log('✓ ACT session created:', session.id);
      navigate(createPageUrl('EnginePracticeSession') + `?session=${session.id}`);
    } catch (err) {
      console.error('Failed to start practice:', err);
      toast.error(err.message || 'Failed to start practice');
    } finally {
      setPracticing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
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
          <h1 className="text-3xl font-light text-white mb-2">ACT Practice</h1>
          <p className="text-neutral-400">Master ACT sections with targeted practice</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4 flex gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 space-y-6">
          <div>
            <label className="text-sm text-neutral-400 mb-2 block">Section</label>
            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={loading}>
              <SelectTrigger className="bg-black border-neutral-700 text-white">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-neutral-400 mb-2 block">Number of Questions</label>
            <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(Number(v))}>
              <SelectTrigger className="bg-black border-neutral-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 Questions</SelectItem>
                <SelectItem value="10">10 Questions</SelectItem>
                <SelectItem value="20">20 Questions</SelectItem>
                <SelectItem value="30">30 Questions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={startPractice}
            disabled={!selectedSection || practicing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
          >
            {practicing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              'Start ACT Practice'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}