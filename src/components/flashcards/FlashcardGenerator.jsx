import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function FlashcardGenerator({ sourceContent, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [deckName, setDeckName] = useState('');
  const [showForm, setShowForm] = useState(false);

  const generateFlashcards = async () => {
    if (!deckName.trim()) {
      toast.error('Please enter a deck name');
      return;
    }

    setLoading(true);
    try {
      const prompt = `Extract key concepts from this content and create flashcard pairs (front/back). Content:\n\n${sourceContent.substring(0, 2000)}\n\nReturn as JSON array: [{"front": "Question/Term", "back": "Answer/Definition"}, ...]`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              front: { type: 'string' },
              back: { type: 'string' }
            }
          }
        }
      });

      // Create deck and cards
      const user = await base44.auth.me();
      const deck = await base44.entities.FlashcardDeck.create({
        user_email: user.email,
        name: deckName,
        description: `Generated from: ${sourceContent.substring(0, 100)}...`
      });

      // Create flashcards
      const cards = response.map(card => ({
        deck_id: deck.id,
        front: card.front,
        back: card.back,
        mastery_level: 'new'
      }));

      await base44.entities.Flashcard.bulkCreate(cards);

      toast.success(`Created ${response.length} flashcards!`);
      setDeckName('');
      setShowForm(false);
      if (onSuccess) onSuccess(deck);
    } catch (error) {
      console.error('Failed to generate flashcards:', error);
      toast.error('Failed to generate flashcards');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4"
    >
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 text-purple-400 hover:text-purple-300 transition-colors py-3"
        >
          <Plus className="w-5 h-5" />
          Generate Flashcards from Content
        </button>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Deck name (e.g., Biology Ch. 5)"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500"
          />
          <div className="flex gap-2">
            <Button
              onClick={generateFlashcards}
              disabled={loading}
              size="sm"
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-1" />
                  Generate
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowForm(false)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}