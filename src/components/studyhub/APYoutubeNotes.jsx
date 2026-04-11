import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Youtube, Loader2, Sparkles, BookOpen, Zap } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import NotesMasteryView from './NotesMasteryView';

function extractVideoId(url) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function APYoutubeNotes() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(null);
  const [showMastery, setShowMastery] = useState(false);

  const videoId = extractVideoId(url);

  async function generateNotes() {
    if (!url.trim()) return;
    setLoading(true);
    setNotes(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this YouTube video and generate AP study notes: ${url}

Look up the video title, description, and transcript. Then write detailed AP study notes in Markdown:

## 📹 Video Summary
- Title, channel, and what it covers

## 🗂️ AP Subject & Unit
- Exact AP subject and unit

## 🔑 Key Concepts
- Every important term with definitions

## 📖 Detailed Explanations
### [Each major topic]
- Thorough explanation of each

## 🧮 Formulas & Equations
- All formulas (use $$ for math)

## 💡 Worked Examples
- Step-by-step examples

## ⭐ AP Exam Tips
- High-frequency topics and common mistakes

## ✅ Review Checklist
- What to know after watching

Be thorough and accurate. Extract content directly from the video.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            detected_subject: { type: 'string' },
            content: { type: 'string' },
          }
        }
      });
      setNotes(result);
      toast.success('Notes generated from video!');
    } catch {
      toast.error('Failed to generate notes. Try again.');
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">YouTube Video → Notes</h2>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">YouTube Video URL</label>
          <p className="text-xs text-gray-400 mb-3">Paste any AP-related YouTube lesson or lecture</p>
          <div className="relative">
            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
            <input
              type="url"
              value={url}
              onChange={e => { setUrl(e.target.value); setNotes(null); }}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {videoId && (
          <div className="mt-4 flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <img
              src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
              alt="Video thumbnail"
              className="w-24 h-16 rounded-lg object-cover"
            />
            <div>
              <p className="text-xs text-gray-500 font-medium">Video detected</p>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">{videoId}</p>
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 pt-6 mt-6">
          <Button
            onClick={generateNotes}
            disabled={!url.trim() || loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg text-base font-medium shadow-sm"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating notes from video…</>
              : <><Sparkles className="w-4 h-4 mr-2" />Generate Notes from Video</>}
          </Button>
        </div>
      </div>

      {notes && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-gray-800">{notes.title || 'Video Notes'}</span>
              </div>
              {notes.detected_subject && (
                <p className="text-xs text-blue-500 mt-0.5 ml-6">{notes.detected_subject}</p>
              )}
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
          title={notes.title}
          onClose={() => setShowMastery(false)}
        />
      )}
    </div>
  );
}