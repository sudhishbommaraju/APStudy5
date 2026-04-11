import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle, Sparkles, BookOpen, Zap } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import NotesMasteryView from './NotesMasteryView';

export default function APUploadNotes() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [notes, setNotes] = useState(null);
  const [showMastery, setShowMastery] = useState(false);
  const inputRef = useRef(null);

  async function handleGenerate() {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploading(false);
      setGenerating(true);

      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: { content: { type: 'string' } }
        }
      });

      const text = extracted?.output?.content || '';

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert AP tutor. Based on the following uploaded study material, generate comprehensive, well-structured AP study notes.

Format in Markdown with:
1. ## Overview (2-3 sentence summary)
2. ## Key Concepts (bulleted, clear definitions)
3. ## Detailed Explanations (with ### subheadings per topic)
4. ## Key Formulas / Equations (if applicable)
5. ## Important Examples (step-by-step)
6. ## AP Exam Tips (⭐ mark high-frequency topics)
7. ## Quick Review Checklist

Be thorough. Minimum 600 words. Preserve technical accuracy from the source material.

Source Material:
"""
${text.substring(0, 5000)}
"""`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
          }
        }
      });

      setNotes(result);
      toast.success('Notes generated from your document!');
    } catch {
      toast.error('Failed to process file. Try again.');
    }
    setUploading(false);
    setGenerating(false);
  }

  const isLoading = uploading || generating;

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
          <input ref={inputRef} type="file" accept=".pdf,.txt,.docx,.doc,.md" onChange={e => { setFile(e.target.files[0]); setNotes(null); }} className="hidden" />
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

        <div className="border-t border-gray-100 pt-6 mt-6">
          <Button
            onClick={handleGenerate}
            disabled={!file || isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg text-base font-medium shadow-sm"
          >
            {uploading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading file…</>
              : generating
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating notes…</>
              : <><Sparkles className="w-4 h-4 mr-2" />Generate Notes from Document</>}
          </Button>
        </div>
      </div>

      {notes && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-gray-800">{notes.title || file?.name}</span>
            </div>
            <Button
              onClick={() => setShowMastery(true)}
              className="bg-green-500 hover:bg-green-600 text-white text-sm gap-2"
              size="sm"
            >
              <Zap className="w-3.5 h-3.5" /> Start Mastering
            </Button>
          </div>
          <div className="px-8 py-6 max-h-[60vh] overflow-auto">
            <div className="prose prose-sm prose-slate max-w-none">
              <ReactMarkdown>{notes.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {showMastery && notes && (
        <NotesMasteryView
          notes={notes.content}
          title={notes.title || file?.name}
          onClose={() => setShowMastery(false)}
        />
      )}
    </div>
  );
}