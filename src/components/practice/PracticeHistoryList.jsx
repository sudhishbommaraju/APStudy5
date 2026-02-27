import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { History, CheckCircle, XCircle, Clock, BookOpen } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function PracticeHistoryList() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const user = await base44.auth.me();
      const records = await base44.entities.PracticeHistory.filter(
        { user_email: user.email },
        '-completed_at',
        20
      );
      setHistory(records);
    } catch (e) {
      console.error('[PracticeHistory] load failed', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-10 text-neutral-500">
        <History className="w-8 h-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No practice sessions yet. Complete a session to see your history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((session, idx) => {
        const pct = Math.round(session.score_pct ?? (session.correct_count / session.total_questions) * 100);
        const isPassing = pct >= 70;
        return (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-2 h-2 rounded-full shrink-0 ${isPassing ? 'bg-green-500' : 'bg-red-500'}`} />
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{session.subject_name || session.subject_id}</p>
                <p className="text-neutral-400 text-xs truncate">{session.unit_name || session.unit_id}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 text-sm">
              <div className="text-center">
                <p className={`font-bold ${isPassing ? 'text-green-400' : 'text-red-400'}`}>{pct}%</p>
                <p className="text-neutral-500 text-xs">{session.correct_count}/{session.total_questions}</p>
              </div>
              {session.completed_at && (
                <p className="text-neutral-500 text-xs hidden sm:block">
                  {formatDistanceToNow(new Date(session.completed_at), { addSuffix: true })}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}