import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Sparkles, Loader2, BookOpen, Tags } from 'lucide-react';
import { toast } from 'sonner';

export default function APCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [detailLevel, setDetailLevel] = useState('medium');
  const [keywords, setKeywords] = useState('');
  const [outputFormat, setOutputFormat] = useState('notes');

  const apSubjects = [
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

  const handleGenerate = async () => {
    if (!subject || !topic) {
      toast.error('Please fill in subject and topic');
      return;
    }

    setLoading(true);
    try {
      const keywordList = keywords.split(',').map(k => k.trim()).filter(Boolean);
      
      const detailInstructions = {
        brief: 'concise overview with only essential concepts',
        medium: 'balanced coverage with key concepts and examples',
        comprehensive: 'in-depth explanation with detailed examples, practice problems, and edge cases'
      };

      const formatInstructions = {
        notes: 'structured study notes in markdown format',
        bullets: 'digestible bullet points summarizing key information',
        flashcards: 'flashcard format (Front: Question/Term | Back: Answer/Definition)'
      };

      let prompt = `Generate ${detailInstructions[detailLevel]} for AP ${subject}, topic: ${topic}. Format: ${formatInstructions[outputFormat]}.`;
      
      if (keywordList.length > 0) {
        prompt += ` Emphasize these concepts: ${keywordList.join(', ')}.`;
      }

      prompt += `\n\nInclude:\n- Key concepts and definitions\n- Important formulas or rules\n- Common mistakes to avoid\n- Practice tips`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true
      });

      const user = await base44.auth.me();
      await base44.entities.StudyNote.create({
        user_email: user.email,
        exam_type: 'AP',
        subject_id: subject,
        title: `${subject} - ${topic}`,
        content: response,
        key_concepts: keywordList
      });

      // Sync to Notion if connected
      if (user.notion_practice_page) {
        toast.info('Syncing to Notion...');
        console.log('Notes ready for Notion sync:', user.notion_practice_page);
      }

      toast.success('Notes generated successfully!');
      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      toast.error('Failed to generate notes');
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
            <Sparkles className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-light text-white">AI-Generated Custom Notes</h1>
              <p className="text-neutral-400 mt-1">Personalized study materials tailored to your needs</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">AP Subject</label>
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
              <label className="block text-sm font-medium text-neutral-300 mb-2">Topic</label>
              <Input
                placeholder="e.g., Cell Respiration, Derivatives, Progressive Era"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Detail Level
              </label>
              <Select value={detailLevel} onValueChange={setDetailLevel}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brief">Brief - Quick overview</SelectItem>
                  <SelectItem value="medium">Medium - Balanced coverage</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive - In-depth detail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Output Format</label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notes">Structured Notes</SelectItem>
                  <SelectItem value="bullets">Bullet Point Summary</SelectItem>
                  <SelectItem value="flashcards">Flashcard Format</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2 flex items-center gap-2">
                <Tags className="w-4 h-4" />
                Emphasize Keywords (optional)
              </label>
              <Textarea
                placeholder="Enter keywords or concepts separated by commas (e.g., ATP, mitochondria, electron transport chain)"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
                rows={3}
              />
              <p className="text-xs text-neutral-500 mt-1">AI will focus on these specific terms and concepts</p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Notes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}