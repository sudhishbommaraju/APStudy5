import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Youtube, Loader2, Sparkles, BookOpen, Zap, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import NotesMasteryView from './NotesMasteryView';

// --- URL helpers ---
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

// --- Notes Viewer ---
function NotesViewer({ notes, onMaster }) {
  const [openSections, setOpenSections] = useState({});
  const [openQ, setOpenQ] = useState({});

  const toggle = (set, key) => set(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-gray-900 text-sm">{notes.title}</span>
        </div>
        <Button onClick={onMaster} className="bg-green-500 hover:bg-green-600 text-white text-sm gap-1.5" size="sm">
          <Zap className="w-3.5 h-3.5" /> Start Mastering
        </Button>
      </div>

      <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-auto">
        {/* Summary */}
        {notes.summary && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-1.5">Summary</p>
            <p className="text-sm text-blue-900 leading-relaxed">{notes.summary}</p>
          </div>
        )}

        {/* Key Terms */}
        {notes.keyTerms?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Key Terms</p>
            <div className="flex flex-wrap gap-2">
              {notes.keyTerms.map((term, i) => (
                <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-medium">
                  {term}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sections */}
        {notes.sections?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Study Sections</p>
            <div className="space-y-2">
              {notes.sections.map((sec, i) => (
                <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggle(setOpenSections, i)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <span className="text-sm font-semibold text-gray-800">{sec.title}</span>
                    {openSections[i] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {openSections[i] && (
                    <div className="px-4 py-3 bg-white">
                      {Array.isArray(sec.content) ? (
                        <ul className="space-y-1.5">
                          {sec.content.map((point, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                              <span className="text-blue-400 mt-1 shrink-0">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-700 leading-relaxed">{sec.content}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Practice Questions */}
        {notes.practiceQuestions?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Practice Questions</p>
            <div className="space-y-2">
              {notes.practiceQuestions.map((q, i) => (
                <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggle(setOpenQ, i)}
                    className="w-full flex items-start justify-between gap-4 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-sm text-gray-800 font-medium leading-relaxed">
                      <span className="text-blue-500 font-bold mr-2">Q{i + 1}.</span>{q.question}
                    </span>
                    {openQ[i] ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />}
                  </button>
                  {openQ[i] && (
                    <div className="px-4 py-3 bg-green-50 border-t border-green-100">
                      <p className="text-xs font-semibold text-green-600 mb-1">Answer</p>
                      <p className="text-sm text-green-800 leading-relaxed">{q.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Component ---
export default function APYoutubeNotes() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle | analyzing | generating | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const [notes, setNotes] = useState(null);
  const [showMastery, setShowMastery] = useState(false);
  const notesRef = useRef(null);

  const videoId = extractVideoId(url);

  async function handleGenerate() {
    // Validate
    if (!url.trim() || !isValidYoutubeUrl(url)) {
      setErrorMsg('Enter a valid YouTube link (youtube.com or youtu.be)');
      setStatus('error');
      return;
    }
    if (!videoId) {
      setErrorMsg('Could not read video ID from this URL. Try copying the link directly from YouTube.');
      setStatus('error');
      return;
    }

    setStatus('analyzing');
    setErrorMsg('');
    setNotes(null);

    try {
      setStatus('generating');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert AP tutor. Analyze this YouTube video and generate structured AP study notes.

Video URL: ${url}
Video ID: ${videoId}

Use your web access to:
1. Look up the video title and description
2. Find the transcript or captions if available
3. Identify the AP subject, unit, and all topics taught

Then generate structured notes. Return ONLY valid JSON (no markdown, no code blocks) matching exactly this schema:

{
  "title": "descriptive title of the video topic",
  "summary": "2-3 sentence overview of what was taught",
  "keyTerms": ["term1", "term2", "term3", ...],
  "sections": [
    {
      "title": "Section heading",
      "content": ["bullet point 1", "bullet point 2", "bullet point 3"]
    }
  ],
  "practiceQuestions": [
    {
      "question": "AP-style question text",
      "answer": "complete answer with explanation"
    }
  ]
}

Rules:
- 4 to 7 sections covering all major topics from the video
- Each section: 4-8 bullet points, clear and AP-exam accurate
- 4-5 practice questions at AP exam difficulty
- keyTerms: 8-15 important vocabulary terms
- Base content on what is actually in the video, not generic information`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            summary: { type: 'string' },
            keyTerms: { type: 'array', items: { type: 'string' } },
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  content: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            practiceQuestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  answer: { type: 'string' }
                }
              }
            }
          }
        }
      });

      if (!result || !result.title || !result.sections?.length) {
        throw new Error('Incomplete notes were generated. Please try again.');
      }

      setNotes(result);
      setStatus('done');
      setTimeout(() => notesRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) {
      setErrorMsg(e?.message || 'Failed to generate notes. Please try again.');
      setStatus('error');
    }
  }

  const isLoading = status === 'analyzing' || status === 'generating';

  // Build mastery text from notes
  const masteryText = notes
    ? `${notes.summary}\n\n${notes.sections?.map(s => `## ${s.title}\n${Array.isArray(s.content) ? s.content.map(c => `- ${c}`).join('\n') : s.content}`).join('\n\n')}`
    : '';

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">YouTube Video → AP Study Notes</h2>
        <p className="text-xs text-gray-400 mb-6">Paste any AP-related YouTube lesson — we'll analyze the video and generate structured notes.</p>

        {/* Input */}
        <div className="relative">
          <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
          <input
            type="url"
            value={url}
            onChange={e => { setUrl(e.target.value); if (status === 'error') setStatus('idle'); }}
            onKeyDown={e => e.key === 'Enter' && !isLoading && handleGenerate()}
            placeholder="https://youtube.com/watch?v=..."
            disabled={isLoading}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          />
        </div>

        {/* Thumbnail preview */}
        {videoId && status !== 'error' && (
          <div className="mt-3 flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="thumbnail" className="w-20 h-14 rounded-lg object-cover" />
            <div>
              <p className="text-xs font-medium text-gray-600">Video detected</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{videoId}</p>
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
        )}

        {/* Button */}
        <div className="mt-6">
          <Button
            onClick={handleGenerate}
            disabled={!url.trim() || isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg text-base font-medium shadow-sm"
          >
            {status === 'analyzing' && <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing video…</>}
            {status === 'generating' && <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating notes…</>}
            {(status === 'idle' || status === 'error' || status === 'done') && <><Sparkles className="w-4 h-4 mr-2" />Generate Notes from Video</>}
          </Button>
        </div>

        {/* Progress dots */}
        {isLoading && (
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-400">
            <span className={`flex items-center gap-1.5 ${status === 'analyzing' ? 'text-blue-500 font-medium' : 'text-gray-400'}`}>
              <span className={`w-2 h-2 rounded-full ${status === 'analyzing' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
              Analyzing video
            </span>
            <span className="text-gray-200">→</span>
            <span className={`flex items-center gap-1.5 ${status === 'generating' ? 'text-blue-500 font-medium' : 'text-gray-400'}`}>
              <span className={`w-2 h-2 rounded-full ${status === 'generating' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
              Generating notes
            </span>
          </div>
        )}
      </div>

      {/* Notes viewer */}
      {status === 'done' && notes && (
        <div ref={notesRef}>
          <NotesViewer notes={notes} onMaster={() => setShowMastery(true)} />
        </div>
      )}

      {showMastery && notes && (
        <NotesMasteryView notes={masteryText} title={notes.title} onClose={() => setShowMastery(false)} />
      )}
    </div>
  );
}