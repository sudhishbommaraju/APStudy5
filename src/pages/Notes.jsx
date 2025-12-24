import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft, Plus, Loader2, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import StudyTimer from '@/components/study/StudyTimer';


export default function Notes() {
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [generating, setGenerating] = useState(false);
  const [topics, setTopics] = useState('');
  const [generatedNote, setGeneratedNote] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        // User not authenticated, continue without user
      }
    };
    loadUser();
  }, []);

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list('subject_id'),
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units', selectedSubject],
    queryFn: () => base44.entities.Unit.filter({ subject_id: selectedSubject }),
    enabled: !!selectedSubject,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['notes'],
    queryFn: () => base44.entities.Note.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const generateNotes = async () => {
    if (!selectedUnit || !topics) return;
    
    setGenerating(true);
    try {
      const subject = subjects.find(s => s.subject_id === selectedSubject);
      const unit = units.find(u => u.id === selectedUnit);
      
      const prompt = `Generate comprehensive study notes for ${subject?.name || 'general topic'}.

Unit: ${unit?.unit_name || 'General'}
Topics to cover: ${topics}

CRITICAL FORMATTING REQUIREMENTS - READ CAREFULLY:

1. NEVER DUPLICATE EQUATIONS OR VALUES
2. NEVER show raw LaTeX commands like \\text, \\times, \\lim outside $ or $$
3. PERCENTAGES: Always plain text "80%" NEVER "$80\\%$"
4. STRICTLY SEPARATE plain text from math blocks
5. ALL equations in $$ display blocks, ONE TIME ONLY
6. Units MUST use \\text{} inside math: $9.8 \\text{ m/s}^{2}$
7. Use inline $ only for variables and formulas, NOT for regular numbers

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
        exam_type: selectedSubject || 'general',
        unit_id: selectedUnit,
        unit_name: unit?.unit_name || 'General',
        title: response.title,
        content: response.content,
        topics_covered: response.topics_covered,
        is_ai_generated: true,
      });

      setGeneratedNote(note);
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setSelectedUnit('');
      setTopics('');
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
          <p className="page-description">AI-generated notes for any subject and unit</p>
        </div>
        <StudyTimer examType={selectedSubject} activityType="notes" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
          {/* Generator */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 sticky top-6">
              <h3 className="font-semibold text-slate-100 mb-4">Generate Notes</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">
                    Subject
                  </label>
                  <Select value={selectedSubject} onValueChange={(value) => {
                    setSelectedSubject(value);
                    setSelectedUnit('');
                  }}>
                    <SelectTrigger className="w-full bg-slate-900/50 border-slate-700/50 text-slate-200">
                      <SelectValue placeholder="Choose a subject" />
                    </SelectTrigger>
                    <SelectContent className="max-h-96 bg-slate-900/95 backdrop-blur-xl border-slate-700/50">
                      {(() => {
                        const uniqueSubjects = Array.from(
                          new Map(subjects.map(s => [s.subject_id, s])).values()
                        );
                        const grouped = uniqueSubjects.reduce((acc, subject) => {
                          const category = subject.category;
                          if (!acc[category]) acc[category] = [];
                          acc[category].push(subject);
                          return acc;
                        }, {});
                        
                        return Object.entries(grouped).map(([category, categorySubjects]) => (
                          <div key={category}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              {category}
                            </div>
                            {categorySubjects.map((subject) => (
                              <SelectItem key={subject.subject_id} value={subject.subject_id} className="text-slate-200 focus:bg-slate-800/50 focus:text-white">
                                <div className="flex items-center gap-2">
                                  {subject.icon && <span>{subject.icon}</span>}
                                  <span>{subject.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>
                {selectedSubject && (
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1 block">
                      Unit
                    </label>
                    <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                      <SelectTrigger className="w-full bg-slate-900/50 border-slate-700/50 text-slate-200">
                        <SelectValue placeholder="Choose a unit" />
                      </SelectTrigger>
                      <SelectContent className="max-h-96 bg-slate-900/95 backdrop-blur-xl border-slate-700/50">
                        {units.sort((a, b) => a.unit_number - b.unit_number).map((unit) => (
                          <SelectItem key={unit.id} value={unit.id} className="text-slate-200 focus:bg-slate-800/50 focus:text-white">
                            Unit {unit.unit_number}: {unit.unit_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">
                    Topics to Cover
                  </label>
                  <Textarea
                    placeholder="List the topics you want covered in these notes..."
                    value={topics}
                    onChange={(e) => setTopics(e.target.value)}
                    rows={4}
                    className="text-white"
                  />
                </div>
                <Button
                  onClick={generateNotes}
                  disabled={generating || !selectedUnit || !topics}
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
                <div className="prose prose-sm max-w-none prose-invert prose-slate">
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      p: ({children}) => <p className="text-slate-100">{children}</p>,
                      li: ({children}) => <li className="text-slate-100">{children}</li>,
                      h1: ({children}) => <h1 className="text-slate-100">{children}</h1>,
                      h2: ({children}) => <h2 className="text-slate-100">{children}</h2>,
                      h3: ({children}) => <h3 className="text-slate-100">{children}</h3>,
                    }}
                  >
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
                <div className="prose prose-sm max-w-none prose-invert prose-slate">
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      p: ({children}) => <p className="text-slate-100">{children}</p>,
                      li: ({children}) => <li className="text-slate-100">{children}</li>,
                      h1: ({children}) => <h1 className="text-slate-100">{children}</h1>,
                      h2: ({children}) => <h2 className="text-slate-100">{children}</h2>,
                      h3: ({children}) => <h3 className="text-slate-100">{children}</h3>,
                    }}
                  >
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
    </>
  );
}