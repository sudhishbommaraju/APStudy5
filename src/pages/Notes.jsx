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
import AITutorWidget from '@/components/tutor/AITutorWidget';
import { MessageSquare } from 'lucide-react';


export default function Notes() {
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [generating, setGenerating] = useState(false);
  const [topics, setTopics] = useState('');
  const [generatedNote, setGeneratedNote] = useState(null);
  const [generationLock, setGenerationLock] = useState(false);
  const [showTutor, setShowTutor] = useState(false);
  const [tutorContext, setTutorContext] = useState({});

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
    if (!selectedUnit || !topics || generationLock) return;
    
    setGenerationLock(true);
    setGenerating(true);
    try {
      const subject = subjects.find(s => s.subject_id === selectedSubject);
      const unit = units.find(u => u.id === selectedUnit);
      
      const prompt = `Generate comprehensive study notes for ${subject?.name || 'general topic'}.

Unit: ${unit?.unit_name || 'General'}
Topics to cover: ${topics}

ABSOLUTE CRITICAL RULES - MUST FOLLOW EXACTLY:

1. NEVER TYPE "ext" - FORBIDDEN WORD:
   ✓ CORRECT: Use \\text{} in LaTeX: "$H_{2}O$", "$100\\text{°C}$"
   ✗ ABSOLUTELY NEVER WRITE: "ext" in any form
   - NOT "extH2O", NOT "extO2", NOT "ext{H}", NOT "ext(", NOT "ext[", NOT "ext"
   - If you need text in math, use \\text{word} NEVER "ext"

2. NEVER TYPE "$$" OUTSIDE MARKDOWN BLOCKS:
   ✓ CORRECT: Use $$ on its own lines for display math
   ✗ ABSOLUTELY NEVER: "formula)$$" or "H2O$$" or "ext{anything}$$"
   - $$ should ONLY appear at start/end of display math blocks
   - NEVER append $$ to end of sentences or formulas

3. ALL CHEMICAL FORMULAS - LATEX ONLY, NO DUPLICATION:
   ✓ CORRECT: "$H_{2}O$", "$CO_{2}$", "$NH_{3}$", "$CH_{4}$"
   ✗ NEVER: "H2O", "CO2", "NH3" without $ delimiters
   ✗ NEVER: "$H_{2}O$H2O" or "H2OH2O" or "$CO_{2}$$CO_{2}$" (ANY duplication)
   ✗ NEVER: Write any chemical formula more than ONCE

4. ALL NUMBERS WITH UNITS - LATEX, NO DUPLICATION:
   ✓ CORRECT: "$25\\text{ g}$", "$100\\text{°C}$", "$9.8\\text{ m/s}^{2}$"
   ✗ NEVER: "25 g", "100°C" (use LaTeX)
   ✗ NEVER: "$25\\text{ g}$25 g" or "100100" (ANY duplication)

5. INLINE MATH for variables, NO DUPLICATION:
   ✓ CORRECT: "$A = 2$", "$B = 3$", "$x = 5$"
   ✗ NEVER: "A = 2" without $ delimiters
   ✗ NEVER: "$A = 2$A = 2" or "x = 5x = 5" (ANY duplication)

6. ARROWS - Use → and ← symbols:
   ✓ CORRECT: "$2H_{2} + O_{2} \\rightarrow 2H_{2}O$" (displays as →)
   ✗ NEVER: Write the word "arrow" or "rightarrow" as plain text
   - Use \\rightarrow in LaTeX for →
   - Use \\leftarrow in LaTeX for ←

7. DISPLAY MATH for equations (on separate lines):
   ✓ CORRECT:
   
$$
2H_{2} + O_{2} \\rightarrow 2H_{2}O
$$

   ✗ NEVER: "ightarrow" or "$formula$$" or inline display
   ✗ NEVER: Duplicate the equation in any form

7. STRUCTURE - Use clear sections:
   - ## Main Topic
   - Brief explanation in plain English
   - **Formula:** (then $$ block)
   - **Variables:**
     - List with LaTeX: "$m$ is mass"
   - ### Example
   - Step by step with $$ blocks
   - **Key Points:** bullet list
   - **Common Mistakes:** bullet list

PERFECT EXAMPLE FORMAT:

## Chemical Reactions

Chemical reactions involve rearranging atoms to form new substances.

**General Form:**

$$
C \\times H + O_{2} \\rightarrow CO_{2} + H_{2}O
$$

**For stoichiometric calculations:**

$$
\\text{Moles of products} = \\text{Coefficient ratio} \\times \\text{Moles of reactants}
$$

### Example: Combination Reaction

**Given:** $A = 2$ and $H_{2}$, $B = O_{2}$

**Reaction:**

$$
2H_{2} + O_{2} \\rightarrow 2H_{2}O
$$

**Balancing Steps:**
1. Count atoms on each side
   - Left: H=4, O=2
   - Right: H=4, O=2
2. The equation is balanced

**Key Points:**
- Always balance chemical equations
- Count atoms on both sides
- Use coefficients, not subscripts

**Common Mistakes:**
- Forgetting to balance equations
- Confusing combination with decomposition reactions

ABSOLUTELY FORBIDDEN - DO NOT WRITE:
- "ext" in ANY form
- "$$" at end of text like "H2O$$"
- Formulas without $ delimiters
- ANY duplication: "H2OH2O", "$A = 2$A = 2", "100100", "$CO_{2}$$CO_{2}$"
- The word "arrow" - use \\rightarrow or \\leftarrow in LaTeX
- Any number, variable, or formula written MORE THAN ONCE

FINAL CHECK BEFORE RETURNING:
✓ NO "ext" anywhere
✓ NO "$$" outside proper blocks
✓ ALL formulas in $...$ or $$...$$
✓ Clear section structure
✓ ZERO duplication of any kind - each element/number appears ONCE
✓ NO word "arrow" - use → via \\rightarrow
✓ Every formula, number, variable written EXACTLY ONE TIME`;

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
    } finally {
      setGenerating(false);
      setGenerationLock(false);
    }
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
                          <SelectItem key={unit.id} value={unit.id} className="text-white focus:bg-slate-800/50 focus:text-white">
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
                  disabled={generating || generationLock || !selectedUnit || !topics}
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100">{generatedNote.title}</h3>
                      <p className="text-sm text-slate-400">{generatedNote.unit_name}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGeneratedNote(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    View All Notes
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none prose-invert [&_*]:text-white [&_.katex]:text-white [&_.katex-error]:text-white [&_code]:text-white">
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      p: ({children}) => <p className="text-white mb-3 leading-relaxed">{children}</p>,
                      li: ({children}) => <li className="text-white mb-1">{children}</li>,
                      ul: ({children}) => <ul className="text-white mb-4 ml-4 space-y-1">{children}</ul>,
                      ol: ({children}) => <ol className="text-white mb-4 ml-4 space-y-1">{children}</ol>,
                      h1: ({children}) => <h1 className="text-white text-2xl font-bold mb-4 mt-8">{children}</h1>,
                      h2: ({children}) => <h2 className="text-white text-xl font-bold mb-4 mt-6 pb-2 border-b-2 border-violet-500/30">{children}</h2>,
                      h3: ({children}) => <h3 className="text-white text-lg font-bold mb-3 mt-5">{children}</h3>,
                      h4: ({children}) => <h4 className="text-white text-base font-semibold mb-2 mt-4">{children}</h4>,
                      strong: ({children}) => <strong className="text-white font-bold">{children}</strong>,
                      em: ({children}) => <em className="text-white italic">{children}</em>,
                      code: ({children}) => <code className="text-white bg-slate-700/50 px-1 rounded">{children}</code>,
                    }}
                  >
                    {generatedNote.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {!generatedNote && notes.filter(n => n.created_by === user?.email).map((note) => (
              <div key={note.id} className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-violet-400" />
                  <div>
                    <h3 className="font-semibold text-slate-100">{note.title}</h3>
                    <p className="text-sm text-slate-400">{note.unit_name}</p>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none prose-invert [&_*]:text-white [&_.katex]:text-white [&_.katex-error]:text-white [&_code]:text-white">
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      p: ({children}) => <p className="text-white mb-3 leading-relaxed">{children}</p>,
                      li: ({children}) => <li className="text-white mb-1">{children}</li>,
                      ul: ({children}) => <ul className="text-white mb-4 ml-4 space-y-1">{children}</ul>,
                      ol: ({children}) => <ol className="text-white mb-4 ml-4 space-y-1">{children}</ol>,
                      h1: ({children}) => <h1 className="text-white text-2xl font-bold mb-4 mt-8">{children}</h1>,
                      h2: ({children}) => <h2 className="text-white text-xl font-bold mb-4 mt-6 pb-2 border-b-2 border-violet-500/30">{children}</h2>,
                      h3: ({children}) => <h3 className="text-white text-lg font-bold mb-3 mt-5">{children}</h3>,
                      h4: ({children}) => <h4 className="text-white text-base font-semibold mb-2 mt-4">{children}</h4>,
                      strong: ({children}) => <strong className="text-white font-bold">{children}</strong>,
                      em: ({children}) => <em className="text-white italic">{children}</em>,
                      code: ({children}) => <code className="text-white bg-slate-700/50 px-1 rounded">{children}</code>,
                    }}
                  >
                    {note.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {!generatedNote && notes.filter(n => n.created_by === user?.email).length === 0 && (
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