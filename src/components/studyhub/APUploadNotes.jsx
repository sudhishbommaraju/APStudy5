import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';
import { generateNotesPipeline } from './NotesGenerationPipeline';
import StructuredNotesViewer from './StructuredNotesViewer';

const STEP_LABELS = {
  uploading: 'Uploading file…',
  extracting_text: 'Extracting text…',
  normalizing: 'Cleaning content…',
  chunking: 'Segmenting content…',
  extracting: 'Extracting key topics…',
  expanding: 'Expanding each topic…',
  assembling: 'Assembling notes…',
  cache: 'Loading cached notes…',
};

export default function APUploadNotes() {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [notes, setNotes] = useState(null);
  const inputRef = useRef(null);
  const notesRef = useRef(null);

  const isLoading = !['idle', 'error', 'done'].includes(step);

  async function handleGenerate() {
    if (!file) return;
    setStep('uploading');
    setErrorMsg('');
    setNotes(null);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setStep('extracting_text');

      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: { type: 'object', properties: { content: { type: 'string' } } }
      });

      const rawText = extracted?.output?.content || '';
      if (rawText.length < 100) throw new Error('Could not extract readable text from this file.');

      const context = file.name.replace(/\.[^.]+$/, '');
      const result = await generateNotesPipeline(rawText, context, (s) => setStep(s));
      setNotes(result);
      setStep('done');
      setTimeout(() => notesRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) {
      setErrorMsg(e?.message || 'Failed to process file. Please try again.');
      setStep('error');
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Upload Study Material → Notes</h2>

        <div
          onClick={() => !isLoading && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
            file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
          } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,.docx,.doc,.md"
            onChange={e => { setFile(e.target.files[0]); setNotes(null); setStep('idle'); }}
            className="hidden"
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="w-8 h-8 text-blue-500" />
              <p className="font-semibold text-blue-700">{file.name}</p>
              <p className="text-xs text-blue-500">{(file.size / 1024).toFixed(1)} KB — click to change</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-gray-600 font-medium">Drop a PDF, Word doc, or text file</p>
              <p className="text-xs text-gray-400">or click to browse</p>
            </div>
          )}
        </div>

        {step === 'error' && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
        )}

        <div className="border-t border-gray-100 pt-6 mt-6">
          <Button
            onClick={handleGenerate}
            disabled={!file || isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg text-base font-medium shadow-sm"
          >
            {isLoading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{STEP_LABELS[step] || 'Processing…'}</>
              : <><Sparkles className="w-4 h-4 mr-2" />Generate Notes from Document</>}
          </Button>
        </div>

        {isLoading && (
          <div className="mt-4">
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-blue-400 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
            <div className="flex flex-wrap gap-2">
              {['uploading', 'extracting_text', 'extracting', 'expanding', 'assembling'].map((s, i) => (
                <span key={s} className={`text-xs px-2 py-0.5 rounded-full border ${
                  step === s ? 'bg-blue-100 border-blue-300 text-blue-700 font-medium' : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}>
                  {i + 1}. {STEP_LABELS[s]?.replace('…', '') || s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {step === 'done' && notes && (
        <div ref={notesRef}>
          <StructuredNotesViewer
            notes={notes}
            onRegenerate={() => { setNotes(null); setStep('idle'); }}
          />
        </div>
      )}
    </div>
  );
}