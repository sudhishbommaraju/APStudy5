import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DeckManager({ onCreateDeck }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Deck name required');
      return;
    }

    try {
      setLoading(true);
      await onCreateDeck(name, description);
      toast.success('Deck created!');
      setName('');
      setDescription('');
      setShowForm(false);
    } catch (error) {
      toast.error('Failed to create deck');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Deck
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-3"
        >
          <input
            type="text"
            placeholder="Deck name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder-neutral-500"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder-neutral-500 resize-none h-20"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleCreate}
              disabled={loading}
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Creating...' : 'Create'}
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
        </motion.div>
      )}
    </motion.div>
  );
}