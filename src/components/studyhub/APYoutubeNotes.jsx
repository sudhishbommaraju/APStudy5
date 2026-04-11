import React, { useState, useRef } from 'react';
import { Youtube, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { generateNotesPipeline } from './NotesGenerationPipeline';
import StructuredNotesViewer from './StructuredNotesViewer';

function extractVideoId(url) {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function isValidYoutubeUrl(url) {
  return /youtube\.com|youtu\.be/.test(url);
}

const STEP_LABELS = {
  normalizing: 'Cleaning transcript…',
  chunking: 'Segmenting content…',
  extracting: 'Extracting key topics…',
  expanding: 'Expanding each topic…',
  assembling: 'Assembling notes…',
  cache: 'Loading cached notes…',
};

export default function APYoutubeNotes() {
  const [url, setUrl] = useState('');
  const [step, setStep] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [notes, setNotes] = useState(null);
  const notesRef = useRef(null);

  const videoId = extractVideoId(url);
  const isLoading = !['idle', 'error', 'done'].includes(step);

  async function handleGenerate() {
    if (!url.trim() || !isValidYoutubeUrl(url)) {
      setErrorMsg('Enter a valid YouTube link (youtube.com or youtu.be)');
      setStep('error');
      return;
    }
    if (!videoId) {
      setErrorMsg('Could not read video ID. Try copying the link directly from YouTube.');
      setStep('error');
      return;
    }

    setStep('fetching');
    setErrorMsg('');
    setNotes(null);

    try {
      // Fetch video context via AI web search
      const videoInfo = await base44.integrations.Core.InvokeLLM({
        prompt: `Look up this YouTube video and return its title, subject area, and full transcript or detailed description.
URL: ${url}
Video ID: ${videoId}
Return as much content as possible from the video.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            subject: { type: 'string' },
            transcript: { type: 'string' }
          }
        }
      });

      const rawText = videoInfo?.transcript || videoInfo?.title || '';
      if (rawText.length < 50) throw new Error('Could not extract content from this video. Try another video or check captions are available.');

      const context = videoInfo?.subject
        ? `${videoInfo.subject} — ${videoInfo.title}`
        : videoInfo?.title || 'AP Study';

      const result = await generateNotesPipeline(rawText, context, (s) => setStep(s));
      setNotes(result);
      setStep('done');
      setTimeout(() => notesRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) {
      setErrorMsg(e?.message || 'Failed to generate notes. Please try again.');
      setStep('error');
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">YouTube Video → AP Study Notes</h2>
        <p className="text-xs text-gray-400 mb-6">Paste any AP-related YouTube lesson — we'll extract and generate structured multi-pass notes.</p>

        <div className="relative">
          <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
          <input
            type="url"
            value={url}
            onChange={e => { setUrl(e.target.value); if (step === 'error') setStep('idle'); }}
            onKeyDown={e => e.key === 'Enter' && !isLoading && handleGenerate()}
            placeholder="https://youtube.com/watch?v=..."
            disabled={isLoading}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          />
        </div>

        {videoId && step !== 'error' && (
          <div className="mt-3 flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="thumbnail" className="w-20 h-14 rounded-lg object-cover" />
            <div>
              <p className="text-xs font-medium text-gray-600">Video detected</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{videoId}</p>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
        )}

        <div className="mt-6">
          <Button
            onClick={handleGenerate}
            disabled={!url.trim() || isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg text-base font-medium shadow-sm"
          >
            {isLoading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{STEP_LABELS[step] || 'Processing…'}</>
              : <><Sparkles className="w-4 h-4 mr-2" />Generate Notes from Video</>}
          </Button>
        </div>

        {isLoading && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>{STEP_LABELS[step] || 'Working…'}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {['fetching', 'normalizing', 'chunking', 'extracting', 'expanding', 'assembling'].map((s, i) => (
                <span key={s} className={`text-xs px-2 py-0.5 rounded-full border ${
                  step === s ? 'bg-blue-100 border-blue-300 text-blue-700 font-medium' : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}>
                  {i + 1}. {s}
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