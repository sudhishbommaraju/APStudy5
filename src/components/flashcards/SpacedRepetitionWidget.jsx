import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Calendar, Loader2 } from 'lucide-react';

export default function SpacedRepetitionWidget() {
  const [dueCount, setDueCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const user = await base44.auth.me();
      const today = new Date().toISOString().split('T')[0];

      // Get all decks for user
      const decks = await base44.entities.FlashcardDeck.filter({ user_email: user.email });
      if (decks.length === 0) { setDueCount(0); return; }

      // Count cards due today or overdue across all decks
      let due = 0;
      await Promise.all(decks.map(async (deck) => {
        const cards = await base44.entities.Flashcard.filter({ deck_id: deck.id });
        due += cards.filter(c => !c.next_review || c.next_review <= today).length;
      }));
      setDueCount(due);
    } catch (e) {
      setDueCount(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />;
  if (dueCount === null) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Calendar className="w-4 h-4 text-blue-400" />
      <span className="text-neutral-300">
        <span className="font-semibold text-blue-400">{dueCount}</span> card{dueCount !== 1 ? 's' : ''} due for review
      </span>
    </div>
  );
}