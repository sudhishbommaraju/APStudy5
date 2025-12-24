import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

export default function ReviewPopup({ open, onOpenChange, onSubmit, onDismiss }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setSubmitting(true);
    try {
      await onSubmit(rating, reviewText);
      onOpenChange(false);
    } catch (e) {
      console.error('Failed to submit review:', e);
    }
    setSubmitting(false);
  };

  const handleDismiss = async () => {
    await onDismiss();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-slate-900/95 backdrop-blur-xl border-slate-700/50">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <DialogTitle className="text-xl font-semibold text-slate-100">
              How's Proofly helping you so far?
            </DialogTitle>
          </div>
          <p className="text-sm text-slate-400">
            Your feedback helps us improve and helps other students discover Proofly
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-10 h-10 transition-all ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-slate-600'
                    }`}
                  />
                </motion.button>
              ))}
            </div>
            {rating > 0 && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-slate-300"
              >
                {rating === 5 && "Amazing! 🎉"}
                {rating === 4 && "Great! 😊"}
                {rating === 3 && "Good 👍"}
                {rating === 2 && "Okay 🤔"}
                {rating === 1 && "Needs improvement 😕"}
              </motion.p>
            )}
          </div>

          {/* Optional Text Feedback */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Tell us more (optional)
            </label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What do you like most? What could be better?"
              rows={4}
              className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-1 border-slate-700/50 text-slate-300 hover:bg-slate-800/50"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              className="flex-1 bg-violet-600 hover:bg-violet-700"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}