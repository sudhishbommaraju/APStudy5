import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft, Plus, Loader2, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import StudyTimer from '@/components/study/StudyTimer';
import { checkAndResetCredits, checkCredits, useCredit } from '@/components/monetization/CreditHelper';
import UpgradeModal from '@/components/monetization/UpgradeModal';

export default function Notes() {
  const [user, setUser] = useState(null);
  const [selectedExam, setSelectedExam] = useState('');
  const [generating, setGenerating] = useState(false);
  const [unitName, setUnitName] = useState('');
  const [topics, setTopics] = useState('');
  const [generatedNote, setGeneratedNote] = useState(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        const { user: refreshedUser } = await checkAndResetCredits(currentUser);
        setUser(refreshedUser);
        setSelectedExam(refreshedUser.primary_exam || refreshedUser.selected_exams?.[0]);
      } catch (e) {
        // User not authenticated, continue without user
      }
    };
    loadUser();
  }, []);

  const { data: notes = [] } = useQuery({
    queryKey: ['notes', selectedExam],
    queryFn: () => base44.entities.Note.filter({ exam_type: selectedExam }),
    enabled: !!selectedExam,
  });

  const generateNotes = async () => {
    if (!unitName || !topics) return;
    
    // Check credits
    const { allowed, remaining } = await checkCredits(user, 'daily_notes_count');
    if (!allowed) {
      setUpgradeModalOpen(true);
      return;
    }
    
    setGenerating(true);
    try {
      const prompt = `Generate comprehensive study notes for ${selectedExam.replace(/_/g, ' ').toUpperCase()}.

Unit: ${unitName}
Topics to cover: ${topics}

CRITICAL FORMATTING REQUIREMENTS - READ CAREFULLY:

1. NEVER DUPLICATE EQUATIONS OR VALUES
2. NEVER show raw LaTeX commands like \\text, \\times in visible text
3. STRICTLY SEPARATE plain text from math blocks
4. ALL equations in $$ display blocks, ONE TIME ONLY
5. Units MUST use \\text{} inside math: $9.8 \\text{ m/s}^{2}$

NOTES FORMAT (FOLLOW EXACTLY):

Use markdown headers and bullet points.

For each concept:
- Write explanation in plain English
- Show formula in its own $$ block
- Provide example with step-by-step math blocks
- No duplicated equations

CORRECT EXAMPLE STRUCTURE:

## Gravitational Potential Energy

Gravitational potential energy is the energy stored due to position.

Formula:

$$
PE = mgh
$$

Where:
- $m$ is mass in kilograms
- $g$ is gravitational acceleration ($9.8 \\text{ m/s}^{2}$)
- $h$ is height in meters

### Example Calculation

Given a 2 kg object at 10 m height:

$$
PE = (2)(9.8)(10) = 196 \\text{ J}
$$

NEVER WRITE:
- PE = mghPE = mgh (duplicated)
- 9.8\\textm/s^2 (broken)
- Inline math mixed with text

Create detailed notes including:
- Key concepts (plain text)
- Formulas (in $$ blocks)
- Step-by-step examples
- Practice tips
- Common mistakes

Each equation appears ONCE in proper $$ blocks with units in \\text{}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            topics_covered: { type: 'array', items: { type: 'string' } },
          },
          required: ['title', 'content', 'topics_covered'],
        },
      });

      const note = await base44.entities.Note.create({
        exam_type: selectedExam,
        unit_name: unitName,
        title: response.title,
        content: response.content,
        topics_covered: response.topics_covered,
        is_ai_generated: true,
      });

      setGeneratedNote(note);
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setUnitName('');
      setTopics('');
      
      // Use a credit
      const updatedUser = await useCredit(user, 'daily_notes_count');
      setUser(updatedUser);
    } catch (e) {
      console.error('Failed to generate notes:', e);
    }
    setGenerating(false);
  };

  return (
    <>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Study Notes</h1>
          <p className="page-description">AI-generated notes for each unit</p>
          {user?.plan === 'free' && (
            <p className="text-sm text-slate-500 mt-2">
              Daily note generations: {(user.daily_notes_count || 0)}/5 used
            </p>
          )}
        </div>
        <StudyTimer examType={selectedExam} activityType="notes" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
          {/* Generator */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 sticky top-6">
              <h3 className="font-semibold text-slate-100 mb-4">Generate Notes</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">
                    Unit Name
                  </label>
                  <Input
                    placeholder="e.g., Unit 3: Derivatives"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">
                    Topics to Cover
                  </label>
                  <Textarea
                    placeholder="List the topics you want covered in these notes..."
                    value={topics}
                    onChange={(e) => setTopics(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button
                  onClick={generateNotes}
                  disabled={generating || !unitName || !topics}
                  className="w-full bg-violet-600 hover:bg-violet-700"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Notes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Notes List */}
          <div className="lg:col-span-2 space-y-4">
            {generatedNote && (
              <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border-2 border-emerald-500/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100">{generatedNote.title}</h3>
                    <p className="text-sm text-slate-400">{generatedNote.unit_name}</p>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {generatedNote.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {notes.filter(n => n.created_by === user?.email).map((note) => (
              <div key={note.id} className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-violet-400" />
                  <div>
                    <h3 className="font-semibold text-slate-100">{note.title}</h3>
                    <p className="text-sm text-slate-400">{note.unit_name}</p>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {note.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {notes.filter(n => n.created_by === user?.email).length === 0 && !generatedNote && (
              <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-12 text-center">
                <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-100 mb-2">No notes yet</h3>
                <p className="text-slate-400 text-sm">Generate your first set of study notes</p>
              </div>
            )}
        </div>
      </div>
      
      <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
    </>
  );
}