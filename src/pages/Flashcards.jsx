import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import DeckFlashcardReview from '@/components/flashcards/DeckFlashcardReview';
import StructuredDeckGenerator from '@/components/flashcards/StructuredDeckGenerator';
import { Loader2, Trash2, Play, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
        <div className="min-h-screen bg-[#f8fafc]">
          <DashboardNavbar />
          <div className="py-8">
            <DeckFlashcardReview
              deck={selectedDeck}
              onBack={() => setSelectedDeck(null)}
            />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f8fafc]">
        <DashboardNavbar />
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Flashcard Decks</h1>
            <p className="text-gray-500 text-sm mt-1">Study by subject and unit with spaced repetition</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
            {/* Generator card */}
            <div className="lg:sticky lg:top-6 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Generate Deck</h2>
              <StructuredDeckGenerator onDeckCreated={handleDeckCreated} />
            </div>

            {/* Deck list */}
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
              ) : decks.length === 0 ? (
                <div className="text-center py-20 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No decks yet</p>
                  <p className="text-gray-400 text-sm mt-1">Generate your first deck using the panel on the left.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {decks.map((deck) => (
                    <div
                      key={deck.id}
                      className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md p-5 cursor-pointer transition-all"
                      onClick={() => setSelectedDeck(deck)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          {deck.subject && (
                            <p className="text-blue-500 text-xs font-semibold mb-0.5">{deck.subject}</p>
                          )}
                          {deck.unit_number && deck.unit_title && (
                            <p className="text-gray-500 text-xs mb-1">Unit {deck.unit_number}: {deck.unit_title}</p>
                          )}
                          <h3 className="text-gray-900 font-semibold truncate">{deck.name}</h3>
                        </div>
                        <button
                          onClick={(e) => handleDeleteDeck(deck.id, e)}
                          className="text-gray-300 hover:text-red-400 transition-colors ml-3 flex-shrink-0 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${deck.cardCount > 0 ? (deck.masteredCount / deck.cardCount) * 100 : 0}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="text-xs text-gray-400">
                          {deck.cardCount} cards &bull; {deck.masteredCount} mastered
                        </div>
                        <Button
                          onClick={(e) => { e.stopPropagation(); setSelectedDeck(deck); }}
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg shadow-sm"
                        >
                          <Play className="w-3 h-3 mr-1" /> Study
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}