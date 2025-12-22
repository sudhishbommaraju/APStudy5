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

export default function Notes() {
  const [user, setUser] = useState(null);
  const [selectedExam, setSelectedExam] = useState('');
  const [generating, setGenerating] = useState(false);
  const [unitName, setUnitName] = useState('');
  const [topics, setTopics] = useState('');
  const [generatedNote, setGeneratedNote] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setSelectedExam(currentUser.primary_exam || currentUser.selected_exams?.[0]);
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
    
    setGenerating(true);
    try {
      const prompt = `Generate comprehensive study notes for ${selectedExam.replace(/_/g, ' ').toUpperCase()}.

Unit: ${unitName}
Topics to cover: ${topics}

Create detailed, exam-focused notes that include:
- Key concepts and definitions
- Important formulas or principles
- Common exam question types
- Practice tips
- Connections between concepts

Format in markdown with clear sections and bullet points.

CRITICAL: Use VALID LaTeX with proper escape characters for all math. ALL math must render cleanly.
- Wrap math: $ for inline, $$ for display blocks
- Examples of CORRECT LaTeX:
  * Fractions: $\\frac{\\sin(30^\\circ)}{\\pi}$ (with backslash before frac)
  * Limits: $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$ (backslash before lim and to)
  * Powers: $x^2 + 5x - 3$
  * Roots: $\\sqrt{3}$
  * Trig: $\\sin(45^\\circ)$, $\\cos(x)$, $\\tan(x)$ (backslash before all functions)
- NEVER write: "ext\\lim", "o" (use \\to for arrows), "frac" without backslash
- Test that your LaTeX compiles correctly before using it`;

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
    } catch (e) {
      console.error('Failed to generate notes:', e);
    }
    setGenerating(false);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e8f1f8, #d9e9f5)', fontFamily: 'Georgia, serif' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Study Notes</h1>
              <p className="text-slate-500">AI-generated notes for each unit</p>
            </div>
          </div>
          <StudyTimer examType={selectedExam} activityType="notes" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Generator */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-6">
              <h3 className="font-semibold text-slate-900 mb-4">Generate Notes</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Unit Name
                  </label>
                  <Input
                    placeholder="e.g., Unit 3: Derivatives"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
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
                  className="w-full"
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
              <div className="bg-white rounded-xl border-2 border-emerald-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{generatedNote.title}</h3>
                    <p className="text-sm text-slate-500">{generatedNote.unit_name}</p>
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
              <div key={note.id} className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <h3 className="font-semibold text-slate-900">{note.title}</h3>
                    <p className="text-sm text-slate-500">{note.unit_name}</p>
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
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-900 mb-2">No notes yet</h3>
                <p className="text-slate-500 text-sm">Generate your first set of study notes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}