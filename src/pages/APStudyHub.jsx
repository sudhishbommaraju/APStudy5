import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, ChevronRight, Sparkles, Upload, Youtube, BookOpen,
  Loader2, Trash2, Plus, Brain, CheckCircle, XCircle, RotateCcw
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import NotesDocumentView from '@/components/studyhub/NotesDocumentView';
import NotesCreateModal from '@/components/studyhub/NotesCreateModal';
import CourseManager from '@/components/studyhub/CourseManager';
import APPracticeQuestion from '@/components/practice/APPracticeQuestion';

import { AP_SUBJECTS, getSubjectCategories, getSubjectsByCategory } from '@/components/studyhub/AP_SUBJECTS';
import { calculateNextReviewDate } from '@/utils/spacedRepetitionUtils';
import { updateUserStreak } from '@/utils/streakUtils';

// Group subjects by category
const CATEGORIES = getSubjectCategories();

export default function APStudyHub() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [step, setStep] = useState(1); // 1=subjects, 2=subject detail, 3=view note, 4=generating quiz, 5=quiz, 6=results
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [subjectNotes, setSubjectNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => setUserEmail(u?.email || '')).catch(() => {});
  }, []);
  const [createType, setCreateType] = useState(null);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizResponses, setQuizResponses] = useState([]);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [generatingPractice, setGeneratingPractice] = useState(false);

  async function loadSubjectNotes(subject) {
    setLoadingNotes(true);
    try {
      const user = await base44.auth.me();
      const notes = await base44.entities.StudyNote.filter(
        { user_email: user.email, subject_id: subject.id },
        '-created_date', 30
      );
      setSubjectNotes(notes);
    } catch (e) {}
    setLoadingNotes(false);
  }

  async function loadCourses() {
    setLoadingCourses(true);
    try {
      const user = await base44.auth.me();
      const userCourses = await base44.entities.Course.filter(
        { user_email: user.email },
        'order', 50
      );
      setCourses(userCourses);
    } catch (e) {}
    setLoadingCourses(false);
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over) return;
    const noteId = active.id;
    const courseId = over.id === 'uncategorized' ? null : over.id;
    const note = subjectNotes.find(n => n.id === noteId);
    if (note) {
      await base44.entities.StudyNote.update(noteId, { course_id: courseId });
      setSubjectNotes(prev => prev.map(n => n.id === noteId ? { ...n, course_id: courseId } : n));
    }
  }

  function handleSelectSubject(subject) {
    setSelectedSubject(subject);
    setSubjectNotes([]);
    loadSubjectNotes(subject);
    loadCourses();
    setStep(2);
  }

  function handleViewNote(note) {
    setSelectedNote(note);
    setStep(3);
  }

  async function handleDeleteNote(noteId, e) {
    e.stopPropagation();
    await base44.entities.StudyNote.delete(noteId);
    setSubjectNotes(prev => prev.filter(n => n.id !== noteId));
  }

  function onNoteCreated(note) {
    setSubjectNotes(prev => [note, ...prev]);
    setSelectedNote(note);
    setShowCreate(false);
    setCreateType(null);
    setStep(3);
  }

  async function handleCreatePractice() {
    if (!selectedNote) return;
    setGeneratingPractice(true);
    const nd = selectedNote.notes_data || {};
    const notesText = [
      nd.title || selectedNote.title,
      ...(Array.isArray(nd.summary) ? nd.summary : []),
      ...(nd.sections || []).flatMap(s => [s.title, ...(s.bullets || [])]),
      ...(nd.keyTerms || []).map(k => typeof k === 'string' ? k : `${k.term}: ${k.definition}`),
    ].join('\n');

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AP exam question writer. Generate 10 rigorous AP-style multiple choice questions based ONLY on the following study notes. Test deep understanding, application, and analysis — not just recall. All 4 choices should be plausible.

Study Notes:
"""
${notesText.slice(0, 6000)}
"""

Return exactly 10 questions. Each must have: question, 4 options (A-D), correct answer letter, and a detailed explanation.`,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question_text: { type: 'string' },
                  choice_a: { type: 'string' },
                  choice_b: { type: 'string' },
                  choice_c: { type: 'string' },
                  choice_d: { type: 'string' },
                  correct_answer: { type: 'string' },
                  explanation: { type: 'string' }
                }
              }
            }
          }
        }
      });

      const mapped = (result?.questions || []).map(q => ({
        ...q,
        answer_choices: [q.choice_a, q.choice_b, q.choice_c, q.choice_d],
        subject_name: selectedSubject?.subject || selectedNote.subject_id,
        unit_name: selectedNote.title,
        difficulty: 'medium',
      }));

      setQuizQuestions(mapped);
      setQuizIndex(0);
      setQuizScore(0);
      setQuizResponses([]);
      setStep(5);
    } catch (e) {
      // stay on notes
    }
    setGeneratingPractice(false);
  }

  async function handleTakeQuiz() {
    if (!selectedNote) return;
    setGeneratingQuiz(true);
    setStep(4);

    const nd = selectedNote.notes_data || {};
    const notesText = [
      nd.title || selectedNote.title,
      ...(Array.isArray(nd.summary) ? nd.summary : []),
      ...(nd.sections || []).flatMap(s => [s.title, ...(s.bullets || [])]),
      ...(nd.keyTerms || []).map(k => typeof k === 'string' ? k : `${k.term}: ${k.definition}`),
    ].join('\n');

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AP exam question writer. Generate 10 AP-style multiple choice questions based ONLY on the following study notes. Questions should test understanding, not just recall. Make all 4 answer choices plausible.

Study Notes:
"""
${notesText.slice(0, 6000)}
"""

Return exactly 10 questions. Each must have a question, 4 answer options (A-D), the correct answer letter, and a brief explanation.`,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question_text: { type: 'string' },
                  choice_a: { type: 'string' },
                  choice_b: { type: 'string' },
                  choice_c: { type: 'string' },
                  choice_d: { type: 'string' },
                  correct_answer: { type: 'string' },
                  explanation: { type: 'string' }
                }
              }
            }
          }
        }
      });

      const mapped = (result?.questions || []).map(q => ({
        ...q,
        answer_choices: [q.choice_a, q.choice_b, q.choice_c, q.choice_d],
        subject_name: selectedSubject?.subject || selectedNote.subject_id,
        unit_name: selectedNote.title,
        difficulty: 'medium',
      }));

      setQuizQuestions(mapped);
      setQuizIndex(0);
      setQuizScore(0);
      setQuizResponses([]);
      setStep(5);
    } catch (e) {
      setStep(3);
    }
    setGeneratingQuiz(false);
  }

  const handleQuizNext = (wasCorrect) => {
    if (wasCorrect) setQuizScore(s => s + 1);
    setQuizResponses(prev => [...prev, wasCorrect]);
    setQuizIndex(i => i + 1);
  };

  const updateNoteMastery = async (correct, total) => {
    if (!selectedNote) return;
    const newTotal = (selectedNote.total_practice_attempts || 0) + total;
    const newCorrect = (selectedNote.correct_practice_attempts || 0) + correct;
    const newMastery = Math.min(100, Math.round((newCorrect / newTotal) * 100));
    const nextReview = calculateNextReviewDate(newMastery);
    await base44.entities.StudyNote.update(selectedNote.id, {
      total_practice_attempts: newTotal,
      correct_practice_attempts: newCorrect,
      mastery_percentage: newMastery,
      next_review_date: nextReview,
    });
    setSelectedNote(prev => ({ ...prev, total_practice_attempts: newTotal, correct_practice_attempts: newCorrect, mastery_percentage: newMastery, next_review_date: nextReview }));
  };

  const handleQuizComplete = async (wasCorrect) => {
    const finalScore = quizScore + (wasCorrect ? 1 : 0);
    const finalResponses = [...quizResponses, wasCorrect];
    setQuizScore(finalScore);
    updateNoteMastery(finalScore, quizQuestions.length);
    
    // Create Attempt records for score analyzer
    try {
      const user = await base44.auth.me();
      await updateUserStreak(user.email);
      const attempts = finalResponses.map((isCorrect, idx) => ({
        question_id: quizQuestions[idx]?.id || '',
        subject_id: selectedSubject?.id || '',
        unit_id: selectedNote?.unit_id || '',
        skill_id: selectedSubject?.id || '',
        unit_name: selectedNote?.title || '',
        skill_name: selectedNote?.title || '',
        difficulty: quizQuestions[idx]?.difficulty || 'medium',
        selected_answer: isCorrect ? quizQuestions[idx]?.correct_answer : (idx % 4 === 0 ? 'A' : idx % 4 === 1 ? 'B' : idx % 4 === 2 ? 'C' : 'D'),
        correct_answer: quizQuestions[idx]?.correct_answer || 'A',
        is_correct: isCorrect,
        mode: 'practice',
      }));
      if (attempts.length > 0) await base44.entities.Attempt.bulkCreate(attempts);
      
      // Award XP and coins
      const xpReward = finalScore * 2;
      const coinReward = finalScore * 5 + 10;
      
      const userStats = await base44.entities.UserStats.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0]);
      if (userStats) {
        await base44.entities.UserStats.update(userStats.id, {
          xp: (userStats.xp || 0) + xpReward
        });
      } else {
        await base44.entities.UserStats.create({
          user_email: user.email,
          xp: xpReward
        });
      }
      
      await base44.auth.updateMe({
        credits: (user.credits || 0) + coinReward
      });
    } catch (e) {
      console.error('Failed to update progress:', e);
    }
    
    setStep(6);
  };

  // ── Step 4: Generating quiz ──
  if (step === 4) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#0C0C0C] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-[#4B9E6B] animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-[#E0E0E0] mb-1">Building Your Quiz</h2>
            <p className="text-[#666] text-sm">Analyzing notes and generating AP-style questions…</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // ── Step 5: Quiz ──
  if (step === 5 && quizQuestions.length > 0) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#0C0C0C] p-6">
          <div className="max-w-3xl mx-auto">
            <button onClick={() => setStep(3)} className="flex items-center gap-1.5 text-xs text-[#666] hover:text-[#AAA] mb-8 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to notes
            </button>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#5B7FA6] mb-1">Notes Quiz</p>
                <h2 className="text-lg font-semibold text-[#E0E0E0]">{selectedNote?.title}</h2>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#666]">{quizIndex + 1} / {quizQuestions.length}</div>
                {selectedNote?.mastery_percentage > 0 && (
                  <div className="text-xs text-[#4B9E6B] font-semibold">Mastery: {selectedNote.mastery_percentage}%</div>
                )}
              </div>
            </div>
            <APPracticeQuestion
              question={quizQuestions[quizIndex]}
              questionIndex={quizIndex}
              totalQuestions={quizQuestions.length}
              onNext={handleQuizNext}
              onComplete={handleQuizComplete}
            />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // ── Step 6: Quiz Results ──
  if (step === 6) {
    const pct = Math.round((quizScore / quizQuestions.length) * 100);
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#0C0C0C] flex items-center justify-center p-6">
          <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-10 text-center max-w-sm w-full">
            <div className="text-4xl mb-5">{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📚'}</div>
            <h2 className="text-xl font-bold text-[#F0EDE8] mb-1">Quiz Complete</h2>
            <p className="text-[#666] text-sm mb-7">{selectedNote?.title}</p>
            <div className={`text-5xl font-bold mb-1 ${pct >= 80 ? 'text-[#4B9E6B]' : pct >= 60 ? 'text-[#D4A800]' : 'text-[#E05252]'}`}>{pct}%</div>
            <p className="text-[#555] text-sm mb-8">{quizScore} / {quizQuestions.length} correct</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setQuizIndex(0); setQuizScore(0); setQuizResponses([]); setStep(5); }}
                className="flex items-center gap-2 px-4 py-2 border border-[#2A2A2A] text-[#888] hover:text-[#CCC] hover:border-[#444] rounded-xl text-sm transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retake
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1A3A2A] border border-[#2A5A3A] text-[#4B9E6B] rounded-xl text-sm font-semibold hover:bg-[#1E4A30] transition-colors"
              >
                Back to Notes
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // ── Step 3: View Note ──
  if (step === 3 && selectedNote) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col h-screen bg-[#0C0C0C]">
          {/* Minimal breadcrumb bar */}
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[#1A1A1A] bg-[#0C0C0C] shrink-0">
            <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-xs text-[#666] hover:text-[#AAA] transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              {selectedSubject?.subject}
            </button>
            <ChevronRight className="w-3 h-3 text-[#333]" />
            <span className="text-xs text-[#888] truncate max-w-[300px]">{selectedNote.title}</span>
          </div>

          <div className="flex-1 overflow-hidden">
            <NotesDocumentView
              note={selectedNote}
              onUpdated={() => loadSubjectNotes(selectedSubject)}
              onCreatePractice={handleCreatePractice}
            />
          </div>

          {generatingPractice && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-[#111] border border-[#2A2A2A] rounded-2xl p-10 text-center shadow-2xl">
                <Loader2 className="w-10 h-10 text-[#4B9E6B] animate-spin mx-auto mb-4" />
                <h3 className="font-semibold text-[#E0E0E0] mb-1">Generating Practice</h3>
                <p className="text-sm text-[#666]">Creating AP-style questions from your notes…</p>
              </div>
            </div>
          )}
        </div>
      </ProtectedRoute>
    );
  }

  // ── Step 2: Subject Detail ──
  if (step === 2 && selectedSubject) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#0C0C0C]">
          <div className="max-w-4xl mx-auto px-6 py-10">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-[#555] mb-10">
              <button onClick={() => setStep(1)} className="hover:text-[#AAA] transition-colors">AP Study Hub</button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#AAA]">{selectedSubject.subject}</span>
            </div>

            <div className="mb-10">
              <h1 className="text-[2rem] font-bold text-[#F0EDE8] mb-2">{selectedSubject.subject}</h1>
              <span className="text-xs text-[#666] bg-[#1A1A1A] border border-[#2A2A2A] px-3 py-1 rounded-full">{selectedSubject.category}</span>
            </div>

            {/* Create Note Options */}
            <div className="mb-10">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#555] mb-4">Create Notes</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { type: 'ai', icon: Sparkles, label: 'AI Generate', desc: 'Structured AP notes from curriculum' },
                  { type: 'upload', icon: Upload, label: 'Upload Document', desc: 'From PDF, Word, or text file' },
                  { type: 'youtube', icon: Youtube, label: 'From YouTube', desc: 'Extract notes from a video' },
                ].map(({ type, icon: Icon, label, desc }) => (
                  <button
                    key={type}
                    onClick={() => { setCreateType(type); setShowCreate(true); }}
                    className="bg-[#111] border border-[#1E1E1E] hover:border-[#3A3A3A] rounded-xl p-4 text-left transition-all group"
                  >
                    <Icon className="w-4 h-4 text-[#666] group-hover:text-[#AAA] mb-3 transition-colors" />
                    <p className="font-semibold text-[#C0BAB2] text-sm mb-1">{label}</p>
                    <p className="text-xs text-[#555]">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Existing Notes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#555]">Your Notes</p>
                {subjectNotes.length > 0 && (
                  <span className="text-xs text-[#555]">{subjectNotes.length} note{subjectNotes.length !== 1 ? 's' : ''}</span>
                )}
              </div>

              {loadingNotes ? (
                <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 text-[#444] animate-spin" /></div>
              ) : subjectNotes.length === 0 ? (
                <div className="border border-dashed border-[#1E1E1E] rounded-xl p-12 text-center">
                  <BookOpen className="w-8 h-8 text-[#333] mx-auto mb-3" />
                  <p className="text-[#555] text-sm font-medium mb-1">No notes yet</p>
                  <p className="text-xs text-[#444]">Create your first note set above</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {subjectNotes.map(note => (
                    <button
                      key={note.id}
                      onClick={() => handleViewNote(note)}
                      className="bg-[#111] border border-[#1E1E1E] hover:border-[#3A3A3A] rounded-xl p-4 text-left transition-all group relative"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <BookOpen className="w-4 h-4 text-[#555]" />
                        <button
                          onClick={e => handleDeleteNote(note.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-[#444] hover:text-[#E05252] transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="font-semibold text-[#C0BAB2] text-sm leading-snug mb-1.5 line-clamp-2">{note.title}</p>
                      <p className="text-xs text-[#555]">
                        {note.source_type === 'youtube' ? '📺' : note.source_type === 'upload' ? '📄' : '✦'}
                        {' '}
                        {new Date(note.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      {note.mastery_percentage > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex-1 h-0.5 bg-[#1E1E1E] rounded-full overflow-hidden">
                            <div className="h-full bg-[#4B9E6B] transition-all" style={{ width: `${note.mastery_percentage}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-[#4B9E6B]">{note.mastery_percentage}%</span>
                        </div>
                      )}
                      {note.notes_data?.sections?.length > 0 && (
                        <p className="text-xs text-[#444] mt-1.5">{note.notes_data.sections.length} sections</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {showCreate && (
          <NotesCreateModal
            defaultType={createType}
            subjectOverride={selectedSubject}
            onClose={() => { setShowCreate(false); setCreateType(null); }}
            onCreated={onNoteCreated}
          />
        )}
      </ProtectedRoute>
    );
  }

  // ── Step 1: Subject Grid ──
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0C0C0C]">
        <div className="max-w-4xl mx-auto px-6 py-10">

          <div className="flex items-center gap-2 text-xs text-[#555] mb-10">
            <button onClick={() => navigate('/Dashboard')} className="hover:text-[#AAA] transition-colors">Dashboard</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#888]">AP Study Hub</span>
          </div>

          <div className="mb-12">
            <h1 className="text-[2.2rem] font-bold text-[#F0EDE8] mb-2">AP Study Hub</h1>
            <p className="text-[#666] text-sm">Select a subject to generate and review structured notes</p>
          </div>

          {CATEGORIES.map(category => {
            const subjects = getSubjectsByCategory(category);
            return (
              <div key={category} className="mb-10">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#555] mb-3">{category}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {subjects.map(subject => (
                    <button
                      key={subject.id}
                      onClick={() => handleSelectSubject(subject)}
                      className="bg-[#111] border border-[#1E1E1E] hover:border-[#3A3A3A] rounded-xl p-4 text-left transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#555] group-hover:text-[#888] transition-colors" />
                        <ChevronRight className="w-3 h-3 text-[#333] group-hover:text-[#666] transition-colors" />
                      </div>
                      <p className="text-[0.8rem] font-semibold text-[#C0BAB2] group-hover:text-[#E0DDD8] leading-snug transition-colors">
                        {subject.subject}
                      </p>
                      <p className="text-xs text-[#444] mt-1">{subject.units?.length || 0} units</p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ProtectedRoute>
  );
}