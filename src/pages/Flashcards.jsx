import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import DeckManager from '@/components/flashcards/DeckManager';
import FlashcardReview from '@/components/flashcards/FlashcardReview';
import { motion } from 'framer-motion';
import { BookOpen, Loader2, Trash2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuroraBackground } from '@/components/ui/animated-background';
import { toast } from 'sonner';

export default function Flashcards() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadDecks();
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const loadDecks = async () => {
    try {
      setLoading(true);
      const userData = await base44.auth.me();
      const userDecks = await base44.entities.FlashcardDeck.filter({
        user_email: userData.email
      }, '-created_date');

      // Enrich decks with card counts
      const enrichedDecks = await Promise.all(
        userDecks.map(async (deck) => {
          const cards = await base44.entities.Flashcard.filter({
            deck_id: deck.id
          });
          return {
            ...deck,
            cardCount: cards.length,
            masteredCount: cards.filter(c => c.mastery_level === 'mastered').length
          };
        })
      );

      setDecks(enrichedDecks);
    } catch (error) {
      console.error('Failed to load decks:', error);
      toast.error('Failed to load decks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeck = async (name, description) => {
    try {
      const userData = await base44.auth.me();
      const newDeck = await base44.entities.FlashcardDeck.create({
        user_email: userData.email,
        name,
        description
      });
      setDecks([newDeck, ...decks]);
      return newDeck;
    } catch (error) {
      console.error('Failed to create deck:', error);
      throw error;
    }
  };

  const handleDeleteDeck = async (deckId) => {
    if (!window.confirm('Delete this deck and all cards?')) return;

    try {
      const cards = await base44.entities.Flashcard.filter({
        deck_id: deckId
      });

      await Promise.all(
        cards.map(card => base44.entities.Flashcard.delete(card.id))
      );

      await base44.entities.FlashcardDeck.delete(deckId);
      setDecks(decks.filter(d => d.id !== deckId));
      setSelectedDeck(null);
      toast.success('Deck deleted');
    } catch (error) {
      toast.error('Failed to delete deck');
    }
  };

  if (!selectedDeck) {
    return (
      <ProtectedRoute>
        <AuroraBackground>
          <DashboardNavbar />
          <div className="min-h-screen py-12">
            <div className="max-w-4xl mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h1 className="text-3xl font-light text-white mb-2">Flashcard Decks</h1>
                <p className="text-neutral-400">Create, review, and master flashcards with spaced repetition</p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar */}
                <div>
                  <DeckManager onCreateDeck={handleCreateDeck} />
                </div>

                {/* Decks Grid */}
                <div className="lg:col-span-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                    </div>
                  ) : decks.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-900/50 border border-neutral-800 rounded-lg">
                      <BookOpen className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                      <p className="text-neutral-400">No decks yet. Create your first one!</p>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid gap-4"
                    >
                      {decks.map((deck, idx) => (
                        <motion.div
                          key={deck.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg p-5 transition-all cursor-pointer"
                          onClick={() => setSelectedDeck(deck)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-white">{deck.name}</h3>
                              {deck.description && (
                                <p className="text-sm text-neutral-400 mt-1">{deck.description}</p>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDeck(deck.id);
                              }}
                              className="text-neutral-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-sm text-neutral-500">
                              {deck.cardCount} cards • {deck.masteredCount} mastered
                            </div>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDeck(deck);
                              }}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Review
                            </Button>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3 h-1 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                              style={{
                                width: `${deck.cardCount > 0 ? (deck.masteredCount / deck.cardCount) * 100 : 0}%`
                              }}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </AuroraBackground>
      </ProtectedRoute>
    );
  }

  // Review Mode
  return (
    <ProtectedRoute>
      <AuroraBackground>
        <DashboardNavbar />
        <div className="min-h-screen py-12">
          <div className="max-w-2xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 flex items-center justify-between"
            >
              <div>
                <button
                  onClick={() => setSelectedDeck(null)}
                  className="text-neutral-400 hover:text-white transition-colors text-sm mb-2"
                >
                  ← Back to Decks
                </button>
                <h1 className="text-3xl font-light text-white">{selectedDeck.name}</h1>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8"
            >
              <FlashcardReview deck={selectedDeck} />
            </motion.div>
          </div>
        </div>
      </AuroraBackground>
    </ProtectedRoute>
  );
}