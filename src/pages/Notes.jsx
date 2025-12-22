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

CRITICAL MATH RENDERING REQUIREMENTS:
- ALL math MUST be wrapped in LaTeX delimiters: $ for inline, $$ for display blocks
- NEVER use caret notation (^) in plain text - it MUST be inside LaTeX
- ALL exponents MUST use proper LaTeX with curly braces: $x^{2}$ NOT x^2
- ALL numbers with exponents: $3^{2}$ NOT 3^2
- Complex expressions: $2n^{2}$ NOT 2n^2
- Formula examples: $$2(3^{2}) = 18$$ NOT [2(3^2) = 18]
- Chemical formulas: $\\text{H}_2\\text{O}$ NOT H2O
- Scientific notation: $3.2 \\times 10^{-5}$ NOT 3.2 × 10^-5

Examples of CORRECT LaTeX formatting:
- Derivatives: $\\frac{d}{dx}[x^{n}] = nx^{n-1}$ (use curly braces)
- Powers: $x^{2} + 5x - 3$
- Fractions: $\\frac{a}{b}$
- Roots: $\\sqrt{x}$ or $\\sqrt[3]{27}$
- Chemistry: $\\text{CO}_2$, $2\\text{H}_2\\text{O}$, $\\text{C}_6\\text{H}_{12}\\text{O}_6$
- Physics: $F = ma$, $E = mc^{2}$, $v^{2} = u^{2} + 2as$

Create detailed, exam-focused notes that include:
- Key concepts and definitions
- Important formulas (with proper LaTeX as shown above)
- Step-by-step examples with display math blocks
- Common exam question types
- Practice tips
- Connections between concepts

Format:
- Use markdown with clear sections and bullet points
- Write explanations in plain English OUTSIDE math delimiters
- Put ALL calculations inside $$ display blocks
- Example structure: "The formula is:" $$E = mc^{2}$$ "Where E is energy..."
- Include clear explanations before formulas`;

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