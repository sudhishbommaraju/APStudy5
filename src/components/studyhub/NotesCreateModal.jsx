import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Upload, Youtube, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import APSubjectSelector from './APSubjectSelector';
import { generateNotesPipeline } from './NotesGenerationPipeline';

const STEP_LABELS = {
  generating: 'Generating…',
  normalizing: 'Preparing content…',
  extracting: 'Extracting topics…',
  expanding: 'Structuring notes…',
  assembling: 'Finalizing notes…',
  uploading: 'Uploading file…',
  extracting_text: 'Extracting text…',
  fetching: 'Fetching video…',
};

const STEP_PCT = {
  generating: 10, normalizing: 20, extracting: 40,
  expanding: 65, assembling: 85, uploading: 15,
  extracting_text: 30, fetching: 20,
};

export default function NotesCreateModal({ defaultType, subjectOverride, onClose, onCreated }) {
  const [type, setType] = useState(defaultType || 'ai');
  const [subject, setSubject] = useState(subjectOverride || null);
  const [unit, setUnit] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [step, setStep] = useState('idle');
  const [error, setError] = useState('');

  const isLoading = !['idle', 'error', 'done'].includes(step);

  async function handleCreate() {
    setError('');
    setStep('generating');
    try {
      let rawText = '', context = '';

      if (type === 'ai') {
        if (!subject || !unit) { setError('Select a subject and unit.'); setStep('idle'); return; }
        const kinematicsExtra = subject.subject.toLowerCase().includes('physics') && unit.toLowerCase().includes('kinematics') 
          ? '\n\nFor Kinematics specifically, include ALL UAM (Uniform Acceleration Motion) equations in LaTeX form:\n$$v = v_0 + at$$\n$$x = v_0 t + \\frac{1}{2}at^2$$\n$$v^2 = v_0^2 + 2a\\Delta x$$\n$$\\Delta x = \\frac{v_0 + v}{2}t$$\n\nFor each equation, explain what each variable means, when to use it, and work through detailed example problems step-by-step. Include graphs like v vs t, x vs t, and a vs t with explanations.'
          : '';
        const seed = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert AP teacher. Write a comprehensive, detailed AP-level study guide (1000+ words) about:\nSubject: ${subject.subject}\nUnit: ${unit}\n\nMust include:\n- All major concepts, theories, and definitions\n- Key formulas, equations, or frameworks (write equations in LaTeX using $$ delimiters)\n- Important dates, people, or events if applicable\n- Common AP exam traps and how to avoid them\n- Connections between concepts\n- Real-world examples\n- How to solve problems step-by-step${kinematicsExtra}\n\nWrite as flowing educational prose — detailed enough that a student could learn the entire unit from it.`,
          model: 'gemini_3_flash',
          response_json_schema: { type: 'object', properties: { text: { type: 'string' } } }
        });
        rawText = seed?.text || unit;
        context = `${subject.subject} — ${unit}`;
      } else if (type === 'upload') {
        if (!file) { setError('Please select a file.'); setStep('idle'); return; }
        setStep('uploading');
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setStep('extracting_text');
        const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url, json_schema: { type: 'object', properties: { content: { type: 'string' } } }
        });
        rawText = extracted?.output?.content || '';
        context = file.name.replace(/\.[^.]+$/, '');
        if (rawText.length < 100) throw new Error('Could not extract text from this file.');
      } else if (type === 'youtube') {
        if (!url.trim()) { setError('Enter a YouTube URL.'); setStep('idle'); return; }
        setStep('fetching');
        const info = await base44.integrations.Core.InvokeLLM({
          prompt: `Look up this YouTube video and return its title and full transcript or detailed summary.\nURL: ${url}`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: { type: 'object', properties: { title: { type: 'string' }, subject: { type: 'string' }, transcript: { type: 'string' } } }
        });
        rawText = info?.transcript || info?.title || '';
        context = info?.subject ? `${info.subject} — ${info.title}` : info?.title || 'Video Notes';
        if (rawText.length < 50) throw new Error('Could not extract content from this video.');
      }

      const notesData = await generateNotesPipeline(rawText, context, s => setStep(s));

      const user = await base44.auth.me();
      const summaryArr = Array.isArray(notesData.summary) ? notesData.summary : (notesData.summary ? [notesData.summary] : []);
      const saved = await base44.entities.StudyNote.create({
        user_email: user.email,
        exam_type: 'AP',
        subject_id: subject?.id || type,
        title: notesData.title || context,
        content: summaryArr.join(' ') || context,
        notes_data: notesData,
        source_type: type,
      });

      setStep('done');
      onCreated(saved);
    } catch (e) {
      setError(e?.message || 'Failed to generate notes. Please try again.');
      setStep('error');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">New Note</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Type selector */}
          <div className="flex gap-2">
            {[
              { id: 'ai', icon: Sparkles, label: 'AI Generate' },
              { id: 'upload', icon: Upload, label: 'From PDF' },
              { id: 'youtube', icon: Youtube, label: 'YouTube' },
            ].map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setType(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  type === id ? 'bg-blue-500 text-white border-blue-500 shadow-sm' : 'border-gray-200 text-gray-600 hover:border-blue-300'
                }`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>

          {/* AI */}
          {type === 'ai' && (
            subjectOverride ? (
              <div>
                <div className="mb-4 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl text-sm font-semibold text-blue-700">
                  📘 {subjectOverride.subject}
                </div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Select Unit</label>
                <select value={unit} onChange={e => setUnit(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Choose a unit…</option>
                  {(subjectOverride.units || []).map(u => (
                    <option key={u.name} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <APSubjectSelector subject={subject} setSubject={setSubject} unit={unit} setUnit={setUnit} />
            )
          )}

          {/* Upload */}
          {type === 'upload' && (
            <div
              onClick={() => document.getElementById('modal-file-input').click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-300'}`}
            >
              <input id="modal-file-input" type="file" accept=".pdf,.txt,.docx,.doc,.md" className="hidden" onChange={e => setFile(e.target.files[0])} />
              {file ? (
                <div>
                  <CheckCircle className="w-7 h-7 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-700">{file.name}</p>
                </div>
              ) : (
                <div>
                  <Upload className="w-7 h-7 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-medium">Drop a PDF, Word doc, or text file</p>
                  <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                </div>
              )}
            </div>
          )}

          {/* YouTube */}
          {type === 'youtube' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">YouTube URL</label>
              <div className="relative">
                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Progress */}
          {isLoading && (
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>{STEP_LABELS[step] || 'Processing…'}</span>
                <span className="text-gray-400">{STEP_PCT[step] || 50}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${STEP_PCT[step] || 50}%` }}
                />
              </div>
            </div>
          )}

          <Button onClick={handleCreate} disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold shadow-sm">
            {isLoading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{STEP_LABELS[step] || 'Processing…'}</>
              : <><Sparkles className="w-4 h-4 mr-2" />Generate Notes</>}
          </Button>
        </div>
      </div>
    </div>
  );
}