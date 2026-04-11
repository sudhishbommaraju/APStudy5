import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { generateNotesPipeline } from './NotesGenerationPipeline';
import StructuredNotesViewer from './StructuredNotesViewer';
import APSubjectSelector from './APSubjectSelector';

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner', desc: 'Core concepts only' },
  { value: 'standard', label: 'Standard', desc: 'AP exam level' },
  { value: 'advanced', label: 'Advanced', desc: 'Deep analysis + FRQ' },
];

const STEP_LABELS = {
  normalizing: 'Cleaning content…',
  chunking: 'Segmenting content…',
  extracting: 'Extracting key topics…',
  expanding: 'Expanding each topic…',
  assembling: 'Assembling notes…',
  cache: 'Loading cached notes…',
};

export default function APNotesGenerator() {
  const [subject, setSubject] = useState(null);
  const [unit, setUnit] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('standard');
  const [step, setStep] = useState('idle');
  const [notes, setNotes] = useState(null);

  const topics = subject && unit
    ? (subject.units.find(u => u.name === unit)?.topics || [])
    : [];

  const isLoading = !['idle', 'error', 'done'].includes(step);

  async function generateNotes() {
    if (!subject || !unit) return;
    setStep('generating');
    setNotes(null);
    try {
      // Seed text from subject+unit for the pipeline
      const seedText = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide a comprehensive overview of the following AP topic as raw educational text suitable for note-taking:\n\nSubject: ${subject.subject}\nUnit: ${unit}${topic ? `\nTopic: ${topic}` : ''}\nDifficulty: ${difficulty}\n\nWrite 600-800 words covering all key concepts, formulas, examples, and AP exam focus areas. Write as flowing educational text.`,
        model: 'gemini_3_flash',
        response_json_schema: { type: 'object', properties: { text: { type: 'string' } } }
      });

      const context = `${subject.subject} — ${unit}${topic ? ` — ${topic}` : ''}`;
      const result = await generateNotesPipeline(seedText?.text || unit, context, (s) => setStep(s));
      setNotes(result);
      setStep('done');
    } catch (e) {
      setStep('error');
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Configure Notes</h2>
        <APSubjectSelector subject={subject} setSubject={setSubject} unit={unit} setUnit={setUnit} />
        {topics.length > 0 && (
          <div className="mt-6">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Topic (optional)</label>
            <select value={topic} onChange={e => setTopic(e.target.value)} className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
              <option value="">All topics in unit</option>
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
        <div className="mt-6">
          <label className="text-sm font-medium text-gray-700 mb-3 block">Depth Level</label>
          <div className="grid grid-cols-3 gap-4">
            {DIFFICULTY_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setDifficulty(opt.value)}
                className={`p-4 rounded-xl border text-left transition-all ${difficulty === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                <div className="font-semibold text-gray-800 text-sm mb-1">{opt.label}</div>
                <div className="text-gray-500 text-xs">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-gray-100 pt-6 mt-6">
          <Button onClick={generateNotes} disabled={!subject || !unit || isLoading} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg text-base font-medium shadow-sm">
            {isLoading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{STEP_LABELS[step] || 'Processing…'}</>
              : <><Sparkles className="w-4 h-4 mr-2" />Generate Notes</>}
          </Button>
          {isLoading && (
            <div className="mt-4 flex flex-wrap gap-2">
              {['extracting', 'expanding', 'assembling'].map((s, i) => (
                <span key={s} className={`text-xs px-2 py-0.5 rounded-full border ${
                  step === s ? 'bg-blue-100 border-blue-300 text-blue-700 font-medium' : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}>{i + 1}. {STEP_LABELS[s]?.replace('…','') || s}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {step === 'done' && notes && (
        <StructuredNotesViewer notes={notes} onRegenerate={() => { setNotes(null); setStep('idle'); }} />
      )}
    </div>
  );
}