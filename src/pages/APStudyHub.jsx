import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, ChevronRight, Sparkles, Upload, Youtube, BookOpen,
  Loader2, Trash2, Plus, Brain, CheckCircle, XCircle, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import NotesDocumentView from '@/components/studyhub/NotesDocumentView';
import NotesCreateModal from '@/components/studyhub/NotesCreateModal';
import NotesSidebar from '@/components/studyhub/NotesSidebar';
import CourseManager from '@/components/studyhub/CourseManager';
import APPracticeQuestion from '@/components/practice/APPracticeQuestion';
import NotionImporter from '@/components/studyhub/NotionImporter';
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
        <DashboardNavbar />
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Building Your Quiz</h2>
            <p className="text-gray-500 text-sm">Analyzing your notes and generating AP-style questions…</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // ── Step 5: Quiz ──
  if (step === 5 && quizQuestions.length > 0) {
    return (
      <ProtectedRoute>
        <DashboardNavbar />
        <div className="min-h-screen bg-[#f8fafc] p-6">
          <div className="max-w-5xl mx-auto">
            <button onClick={() => setStep(3)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
              <ArrowLeft className="w-4 h-4" /> Back to notes
            </button>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Notes Quiz</p>
                <h2 className="text-lg font-bold text-gray-900">{selectedNote?.title}</h2>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">{quizIndex + 1} / {quizQuestions.length}</div>
                {selectedNote?.mastery_percentage > 0 && (
                  <div className="text-xs text-blue-500 font-semibold">Mastery: {selectedNote.mastery_percentage}%</div>
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
        <DashboardNavbar />
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center max-w-md w-full">
            <div className="text-5xl mb-4">{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📚'}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Quiz Complete!</h2>
            <p className="text-gray-500 text-sm mb-6">{selectedNote?.title}</p>
            <div className="text-5xl font-bold text-blue-500 mb-2">{pct}%</div>
            <p className="text-gray-500 mb-8">{quizScore} / {quizQuestions.length} correct</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => { setQuizIndex(0); setQuizScore(0); setQuizResponses([]); setStep(5); }}>
                <RotateCcw className="w-4 h-4 mr-2" /> Retake
              </Button>
              <Button className="bg-blue-500 hover:bg-blue-600" onClick={() => setStep(3)}>
                Back to Notes
              </Button>
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
        <DashboardNavbar />
        <div className="flex flex-col h-[calc(100vh-64px)]">
          {/* Top bar */}
          <div className="flex items-center gap-3 px-6 py-3 bg-[#f8fafc] border-b border-gray-200 shrink-0">
            <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-4 h-4" />
              <span>{selectedSubject?.subject}</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-sm font-semibold text-gray-900 truncate max-w-xs">{selectedNote.title}</span>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <NotesDocumentView
                note={selectedNote}
                onUpdated={() => loadSubjectNotes(selectedSubject)}
                onCreatePractice={handleCreatePractice}
              />
            </div>
            <NotesSidebar
              note={selectedNote}
              onCreatePractice={handleCreatePractice}
              onCreateFlashcards={() => {}}
            />
          </div>

          {generatingPractice && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
                <Loader2 className="w-10 h-10 text-green-500 animate-spin mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-1">Generating Practice</h3>
                <p className="text-sm text-gray-500">Creating AP-style questions from your notes…</p>
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
        <DashboardNavbar />
        <div className="min-h-screen bg-[#f8fafc]">
          <div className="max-w-5xl mx-auto px-6 py-10">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
              <button onClick={() => setStep(1)} className="hover:text-gray-600">AP Study Hub</button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-700 font-medium">{selectedSubject.subject}</span>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <h1 className="text-3xl font-bold text-gray-900">{selectedSubject.subject}</h1>
              <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{selectedSubject.category}</span>
            </div>

            {/* Course Manager */}
            <div className="mb-10">
              <CourseManager courses={courses} onCoursesUpdated={loadCourses} userEmail={userEmail} />
            </div>

            {/* Notion Importer */}
            <div className="mb-10">
              <NotionImporter onImportComplete={() => loadSubjectNotes(selectedSubject)} />
            </div>

            {/* Create Note Options */}
            <div className="mb-10">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Create New Notes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { type: 'ai', icon: Sparkles, label: 'AI Generate', desc: 'Auto-generate structured AP notes', color: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50', iconColor: 'text-blue-500', iconBg: 'bg-blue-100' },
                  { type: 'upload', icon: Upload, label: 'Upload Document', desc: 'From PDF, Word, or text file', color: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50', iconColor: 'text-purple-500', iconBg: 'bg-purple-100' },
                  { type: 'youtube', icon: Youtube, label: 'From YouTube', desc: 'Extract notes from a video', color: 'border-red-200 hover:border-red-400 hover:bg-red-50', iconColor: 'text-red-500', iconBg: 'bg-red-100' },
                ].map(({ type, icon: Icon, label, desc, color, iconColor, iconBg }) => (
                  <button
                    key={type}
                    onClick={() => { setCreateType(type); setShowCreate(true); }}
                    className={`bg-white border rounded-2xl p-5 text-left transition-all group ${color}`}
                  >
                    <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <p className="font-semibold text-gray-800 text-sm mb-1">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Existing Notes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Your Notes</h2>
                {subjectNotes.length > 0 && (
                  <span className="text-xs text-gray-400">{subjectNotes.length} note{subjectNotes.length !== 1 ? 's' : ''}</span>
                )}
              </div>

              {loadingNotes ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-gray-300 animate-spin" /></div>
              ) : subjectNotes.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-10 text-center">
                  <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium mb-1">No notes yet for this subject</p>
                  <p className="text-xs text-gray-400">Create your first note set using the options above</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjectNotes.map(note => (
                    <button
                      key={note.id}
                      onClick={() => handleViewNote(note)}
                      className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-blue-400 hover:shadow-sm transition-all group relative"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-blue-500" />
                        </div>
                        <button
                          onClick={e => handleDeleteNote(note.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="font-semibold text-gray-800 text-sm leading-tight mb-1 line-clamp-2">{note.title}</p>
                      <p className="text-xs text-gray-400">
                        {note.source_type === 'youtube' ? '📺 YouTube' : note.source_type === 'upload' ? '📄 Upload' : '✨ AI Generated'}
                        {' · '}
                        {new Date(note.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      {note.mastery_percentage > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all" style={{ width: `${note.mastery_percentage}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-blue-600">{note.mastery_percentage}%</span>
                        </div>
                      )}
                      {note.notes_data?.sections?.length > 0 && (
                        <p className="text-xs text-blue-400 mt-2">{note.notes_data.sections.length} sections</p>
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
      <DashboardNavbar />
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="max-w-5xl mx-auto px-6 py-10">

          <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
            <button onClick={() => navigate('/Dashboard')} className="hover:text-gray-600">Dashboard</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-700 font-medium">AP Study Hub</span>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AP Study Hub</h1>
            <p className="text-gray-500">Select a subject to generate and review structured AP notes</p>
          </div>

          {CATEGORIES.map(category => {
            const subjects = getSubjectsByCategory(category);
            return (
              <div key={category} className="mb-10">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{category}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {subjects.map(subject => (
                    <button
                      key={subject.id}
                      onClick={() => handleSelectSubject(subject)}
                      className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-blue-400 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-blue-400 group-hover:text-blue-600" />
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-200 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 leading-tight">
                        {subject.subject}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{subject.units?.length || 0} units</p>
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