import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { AP_SUBJECTS } from '@/components/studyhub/AP_SUBJECTS';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { CheckCircle, XCircle, Loader2, Play, Square, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS = { pending: 'pending', running: 'running', done: 'done', error: 'error', skipped: 'skipped' };

const STATUS_ICON = {
  pending: <span className="w-5 h-5 rounded-full border-2 border-gray-300 inline-block" />,
  running: <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />,
  done: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <XCircle className="w-5 h-5 text-red-400" />,
  skipped: <CheckCircle className="w-5 h-5 text-gray-400" />,
};

export default function BulkNotesGenerator() {
  const [statuses, setStatuses] = useState(() =>
    Object.fromEntries(AP_SUBJECTS.map(s => [s.id, { status: STATUS.pending, msg: '' }]))
  );
  const [running, setRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [errors, setErrors] = useState(0);
  const stopRef = useRef(false);

  const setStatus = (id, status, msg = '') =>
    setStatuses(prev => ({ ...prev, [id]: { status, msg } }));

  async function generateForSubject(subject, user) {
    const unit = subject.units?.[0];
    const context = `${subject.subject}${unit ? ' — ' + unit.name : ''}`;

    // Generate seed text via LLM
    const seed = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AP curriculum expert. Write a detailed, comprehensive AP-level study guide for:
Subject: ${subject.subject}
Unit: ${unit?.name || 'Core Concepts'}
Topics: ${unit?.topics?.join(', ') || ''}

Cover all major concepts, key formulas (in LaTeX using $$ delimiters), important definitions, examples, and exam tips. Write at least 800 words of detailed educational prose.`,
      model: 'gemini_3_flash',
      response_json_schema: { type: 'object', properties: { text: { type: 'string' } } }
    });

    const rawText = seed?.text || context;

    // Use pipeline
    const { generateNotesPipeline } = await import('@/components/studyhub/NotesGenerationPipeline');
    const notesData = await generateNotesPipeline(rawText, context, () => {});

    const summaryArr = Array.isArray(notesData.summary)
      ? notesData.summary
      : notesData.summary ? [notesData.summary] : [];

    await base44.entities.StudyNote.create({
      user_email: user.email,
      exam_type: 'AP',
      subject_id: subject.id,
      title: notesData.title || context,
      content: summaryArr.join(' ') || context,
      notes_data: notesData,
      source_type: 'ai',
    });
  }

  async function handleStart() {
    stopRef.current = false;
    setRunning(true);
    setCompleted(0);
    setErrors(0);

    // Reset all to pending
    setStatuses(Object.fromEntries(AP_SUBJECTS.map(s => [s.id, { status: STATUS.pending, msg: '' }])));

    const user = await base44.auth.me();

    for (let i = 0; i < AP_SUBJECTS.length; i++) {
      if (stopRef.current) break;

      const subject = AP_SUBJECTS[i];
      setCurrentIndex(i);
      setStatus(subject.id, STATUS.running);

      try {
        // Check if notes already exist
        const existing = await base44.entities.StudyNote.filter(
          { user_email: user.email, subject_id: subject.id },
          '-created_date', 1
        );

        if (existing.length > 0) {
          setStatus(subject.id, STATUS.skipped, 'Already has notes');
          setCompleted(c => c + 1);
          continue;
        }

        await generateForSubject(subject, user);
        setStatus(subject.id, STATUS.done);
        setCompleted(c => c + 1);
      } catch (e) {
        setStatus(subject.id, STATUS.error, e?.message || 'Failed');
        setErrors(e => e + 1);
      }
    }

    setRunning(false);
  }

  function handleStop() {
    stopRef.current = true;
  }

  function handleReset() {
    setStatuses(Object.fromEntries(AP_SUBJECTS.map(s => [s.id, { status: STATUS.pending, msg: '' }])));
    setCompleted(0);
    setErrors(0);
    setCurrentIndex(0);
  }

  const total = AP_SUBJECTS.length;
  const doneCount = Object.values(statuses).filter(s => s.status === STATUS.done || s.status === STATUS.skipped).length;
  const progress = Math.round((doneCount / total) * 100);

  return (
    <ProtectedRoute requireAdmin>
      <DashboardNavbar />
      <div className="min-h-screen bg-[#f8fafc] p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Bulk AP Notes Generator</h1>
            <p className="text-gray-500 text-sm">Auto-generate study notes for all {total} AP subjects. Subjects with existing notes are skipped.</p>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 flex items-center gap-4 flex-wrap">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">{doneCount} / {total} subjects</span>
                <span className="text-sm text-gray-400">{errors} errors</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              {!running ? (
                <>
                  <Button onClick={handleStart} className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
                    <Play className="w-4 h-4" /> Generate All
                  </Button>
                  <Button variant="outline" onClick={handleReset} className="gap-2">
                    <RefreshCw className="w-4 h-4" /> Reset
                  </Button>
                </>
              ) : (
                <Button onClick={handleStop} variant="outline" className="gap-2 border-red-300 text-red-600 hover:bg-red-50">
                  <Square className="w-4 h-4" /> Stop
                </Button>
              )}
            </div>
          </div>

          {/* Subject grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {AP_SUBJECTS.map((subject, i) => {
              const s = statuses[subject.id];
              const isActive = running && currentIndex === i;
              return (
                <div
                  key={subject.id}
                  className={`bg-white rounded-xl border p-4 flex items-start gap-3 transition-all ${
                    isActive ? 'border-blue-400 shadow-md shadow-blue-100' : 'border-gray-200'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{STATUS_ICON[s.status]}</div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold leading-tight truncate ${
                      s.status === STATUS.done ? 'text-green-700' :
                      s.status === STATUS.error ? 'text-red-600' :
                      s.status === STATUS.skipped ? 'text-gray-400' :
                      isActive ? 'text-blue-700' : 'text-gray-800'
                    }`}>{subject.subject}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{subject.category}</p>
                    {s.msg && <p className="text-xs text-gray-400 mt-1 truncate">{s.msg}</p>}
                    {isActive && <p className="text-xs text-blue-500 mt-1 animate-pulse">Generating…</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}