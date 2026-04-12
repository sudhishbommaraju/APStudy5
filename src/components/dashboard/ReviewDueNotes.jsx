import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { isReviewDue, getDaysUntilReview, getMasteryLabel, getMasteryColor } from '@/utils/spacedRepetitionUtils';

const COLOR_MAP = {
  red: 'bg-red-50 border-red-200 text-red-700',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  gray: 'bg-gray-50 border-gray-200 text-gray-700',
};

export default function ReviewDueNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviewDueNotes();
  }, []);

  async function loadReviewDueNotes() {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      if (!user?.email) {
        setLoading(false);
        return;
      }

      // Fetch all user's notes with mastery data
      const allNotes = await base44.entities.StudyNote.filter(
        { user_email: user.email },
        '-updated_date',
        100
      );

      // Filter notes that need review
      const dueNotes = allNotes
        .filter(note => {
          if (note.mastery_percentage === 0 || !note.mastery_percentage) return false;
          return isReviewDue(note.next_review_date);
        })
        .sort((a, b) => {
          // Sort by days until review (soonest first)
          const daysA = getDaysUntilReview(a.next_review_date) || 999;
          const daysB = getDaysUntilReview(b.next_review_date) || 999;
          return daysA - daysB;
        })
        .slice(0, 5); // Show top 5

      setNotes(dueNotes);
    } catch (e) {
      console.error('Failed to load review due notes:', e);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900 text-sm">Spaced Repetition</h3>
        </div>
        <p className="text-sm text-gray-500">All your notes are up to date! Keep practicing to unlock review sessions.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <AlertCircle className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-gray-900 text-sm">Review Due ({notes.length})</h3>
      </div>

      <div className="space-y-3">
        {notes.map(note => {
          const daysUntil = getDaysUntilReview(note.next_review_date);
          const label = getMasteryLabel(note.mastery_percentage);
          const color = getMasteryColor(note.mastery_percentage);
          const colorClass = COLOR_MAP[color] || COLOR_MAP.gray;

          return (
            <button
              key={note.id}
              onClick={() => window.location.href = '/ap-study-hub'}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{note.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{note.subject_id || 'AP Study'}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 ml-2 flex-shrink-0" />
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-1 rounded border ${colorClass}`}>
                  {Math.round(note.mastery_percentage)}%
                </span>
                {daysUntil <= 0 ? (
                  <span className="text-xs text-red-600 font-semibold">Due today</span>
                ) : (
                  <span className="text-xs text-gray-500">Due in {daysUntil}d</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => window.location.href = '/ap-study-hub'}
        className="w-full mt-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      >
        Go to Study Hub →
      </button>
    </div>
  );
}