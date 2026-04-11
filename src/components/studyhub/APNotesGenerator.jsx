import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Maximize2, Download, Copy, RefreshCw, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import APSubjectSelector from './APSubjectSelector';
import APVisuals from './APVisuals';

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner', desc: 'Core concepts only' },
  { value: 'standard', label: 'Standard', desc: 'AP exam level' },
  { value: 'advanced', label: 'Advanced', desc: 'Deep analysis + FRQ' },
];

export default function APNotesGenerator() {
  const [subject, setSubject] = useState(null);
  const [unit, setUnit] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const notesRef = useRef(null);

  const topics = subject && unit
    ? (subject.units.find(u => u.name === unit)?.topics || [])
    : [];

  async function generateNotes() {
    if (!subject || !unit) return;
    setLoading(true);
    setNotes(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert AP tutor. Generate comprehensive, well-structured study notes for:

Subject: ${subject.subject}
Unit: ${unit}${topic ? `\nTopic: ${topic}` : ''}
Difficulty: ${difficulty}

Format the notes in Markdown with:
1. ## Unit Overview (2-3 sentence summary)
2. ## Key Concepts (bulleted, clear definitions)
3. ## Detailed Explanations (with ### subheadings per subtopic)
4. ## Key Formulas / Equations (if applicable, use $$ for math)
5. ## Important Examples (worked through step-by-step)
6. ## Common AP Exam Tips (⭐ mark high-frequency topics)
7. ## Practice Problems (3 AP-style MCQ + 1 FRQ)
8. ## Solutions (fully explained)

Be detailed and thorough. Minimum 800 words. Use clear headings and bullet points.`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            has_graphs: { type: 'boolean' },
            has_diagrams: { type: 'boolean' },
          }
        }
      });
      setNotes(result);
      toast.success('Notes generated!');
    } catch {
      toast.error('Failed to generate notes. Try again.');
    }
    setLoading(false);
  }

  function copyNotes() {
    if (notes?.content) {
      navigator.clipboard.writeText(notes.content);
      toast.success('Notes copied!');
    }
  }

  function downloadNotes() {
    if (!notes?.content) return;
    const blob = new Blob([notes.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${notes.title || 'AP Notes'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Notes downloaded!');
  }

  const NotesContent = () => (
    <div className="prose prose-sm prose-slate max-w-none">
      <ReactMarkdown>{notes.content}</ReactMarkdown>
      {(notes.has_graphs || notes.has_diagrams) && subject && (
        <div className="mt-6">
          <APVisuals subjectId={subject.id} unit={unit} topic={topic} />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Config Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Configure Notes</h2>

        <APSubjectSelector subject={subject} setSubject={setSubject} unit={unit} setUnit={setUnit} />

        {/* Topic */}
        {topics.length > 0 && (
          <div className="mt-6">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Topic (optional)</label>
            <select
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="">All topics in unit</option>
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}

        {/* Difficulty */}
        <div className="mt-6">
          <label className="text-sm font-medium text-gray-700 mb-3 block">Depth Level</label>
          <div className="grid grid-cols-3 gap-4">
            {DIFFICULTY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDifficulty(opt.value)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  difficulty === opt.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="font-semibold text-gray-800 text-sm mb-1">{opt.label}</div>
                <div className="text-gray-500 text-xs">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 mt-6">
          <Button
            onClick={generateNotes}
            disabled={!subject || !unit || loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg text-base font-medium shadow-sm"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Notes…</>
              : <><Sparkles className="w-4 h-4 mr-2" /> Generate Notes</>}
          </Button>
        </div>
      </div>

      {/* Notes Output */}
      {notes && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-gray-800">{notes.title || `${subject?.subject} — ${unit}`}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={copyNotes} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Copy">
                <Copy className="w-4 h-4" />
              </button>
              <button onClick={downloadNotes} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Download">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={generateNotes} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Regenerate">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={() => setFullscreen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Fullscreen">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div ref={notesRef} className="px-8 py-6 max-h-[70vh] overflow-auto">
            <NotesContent />
          </div>
        </div>
      )}

      {/* Fullscreen Modal */}
      {fullscreen && notes && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200 sticky top-0 bg-white">
            <span className="text-base font-semibold text-gray-800">{notes.title}</span>
            <div className="flex items-center gap-2">
              <button onClick={copyNotes} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Copy className="w-4 h-4" /></button>
              <button onClick={downloadNotes} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Download className="w-4 h-4" /></button>
              <button onClick={generateNotes} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><RefreshCw className="w-4 h-4" /></button>
              <button onClick={() => setFullscreen(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">Exit Fullscreen</button>
            </div>
          </div>
          <div className="flex-1 overflow-auto px-12 py-8 max-w-4xl mx-auto w-full">
            <NotesContent />
          </div>
        </div>
      )}
    </div>
  );
}