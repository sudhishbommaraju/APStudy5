import React from 'react';
import { Star } from 'lucide-react';

export default function ReviewCard({ review, user }) {
  // Anonymize user name
  const displayName = user?.full_name 
    ? user.full_name.split(' ')[0] + ' ' + user.full_name.split(' ').slice(1).map(n => n[0] + '.').join(' ')
    : 'Anonymous Student';

  return (
    <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5 shadow-lg">
      {/* Star Rating */}
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= review.star_rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-slate-600'
            }`}
          />
        ))}
      </div>

      {/* Review Text */}
      {review.review_text && (
        <p className="text-slate-200 text-sm leading-relaxed mb-3">
          "{review.review_text}"
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{displayName}</span>
        {review.subject_context && (
          <span className="px-2 py-1 rounded-full bg-violet-500/20 text-violet-300">
            {review.subject_context}
          </span>
        )}
      </div>
    </div>
  );
}