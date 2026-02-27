import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import DeckFlashcardReview from '@/components/flashcards/DeckFlashcardReview';
import StructuredDeckGenerator from '@/components/flashcards/StructuredDeckGenerator';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Loader2, Trash2, Play, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuroraBackground } from '@/components/ui/animated-background';
import { toast } from 'sonner';

export default function Flashcards() {
  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) loadDecks();
  }, [user]);

  const loadDecks = async () => {
    setLoading(true);
    try {
      const userDecks = await base44.entities.FlashcardDeck.filter(
        { user_email: user.email },
        '-created_date'
      );
      const enriched = await Promise.all(
        userDecks.map(async deck => {
          const cards = await base44.entities.Flashcard.filter({ deck_id: deck.id });
          return {
            ...deck,
            cardCount: cards.length,
            masteredCount: cards.filter(c => c.mastery_level === 'mastered').length
          };
        })
      );
      setDecks(enriched);
    } catch {
      toast.error('Failed to load decks');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDeck = async (deckId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this deck and all cards?')) return;
    try {
      const cards = await base44.entities.Flashcard.filter({ deck_id: deckId });
      await Promise.all(cards.map(c => base44.entities.Flashcard.delete(c.id)));
      await base44.entities.FlashcardDeck.delete(deckId);
      setDecks(d => d.filter(x => x.id !== deckId));
      toast.success('Deck deleted');
    } catch {
      toast.error('Failed to delete deck');
    }
  };

  const handleDeckCreated = (deck) => {
    loadDecks();
    setSelectedDeck(deck);
  };

  if (selectedDeck) {
    return (
      <ProtectedRoute>
        <AuroraBackground>
          <DashboardNavbar />
          <div className="min-h-screen py-8">
            <DeckFlashcardReview
              deck={selectedDeck}
              onBack={() => setSelectedDeck(null)}
            />
          </div>
        </AuroraBackground>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AuroraBackground>
        <DashboardNavbar />
        <div className="min-h-screen py-12">
          <div className="max-w-5xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-light text-white mb-1">Flashcard Decks</h1>
              <p className="text-neutral-400 text-sm">Study by subject and unit — real flip cards with spaced repetition</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Generator sidebar */}
              <div>
                <StructuredDeckGenerator onDeckCreated={handleDeckCreated} />
              </div>

              {/* Decks grid */}
              <div className="lg:col-span-2">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-[#D6B98C]" />
                  </div>
                ) : decks.length === 0 ? (
                  <div className="text-center py-20 bg-neutral-900/40 border border-neutral-800 rounded-2xl">
                    <Layers className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                    <p className="text-neutral-400">No decks yet.</p>
                    <p className="text-neutral-600 text-sm mt-1">Generate your first deck using the panel on the left.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    <div className="grid gap-4">
                      {decks.map((deck, idx) => (
                        <motion.div
                          key={deck.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 cursor-pointer transition-all"
                          onClick={() => setSelectedDeck(deck)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              {/* Subject + Unit header */}
                              {deck.subject && (
                                <p className="text-[#D6B98C] text-xs font-medium mb-0.5">{deck.subject}</p>
                              )}
                              {deck.unit_number && deck.unit_title && (
                                <p className="text-neutral-300 text-sm font-semibold mb-1">
                                  Unit {deck.unit_number}: {deck.unit_title}
                                </p>
                              )}
                              <h3 className="text-white font-medium truncate">{deck.name}</h3>
                            </div>
                            <button
                              onClick={(e) => handleDeleteDeck(deck.id, e)}
                              className="text-neutral-600 hover:text-red-400 transition-colors ml-3 flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="text-xs text-neutral-500">
                              {deck.cardCount} cards &bull; {deck.masteredCount} mastered
                            </div>
                            <Button
                              onClick={(e) => { e.stopPropagation(); setSelectedDeck(deck); }}
                              size="sm"
                              className="bg-[#D6B98C] hover:bg-[#C9A96A] text-black text-xs font-semibold"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Study
                            </Button>
                          </div>

                          {/* Mastery progress */}
                          <div className="mt-3 h-1 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#D6B98C] to-yellow-500"
                              style={{
                                width: `${deck.cardCount > 0 ? (deck.masteredCount / deck.cardCount) * 100 : 0}%`
                              }}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </div>
      </AuroraBackground>
    </ProtectedRoute>
  );
}