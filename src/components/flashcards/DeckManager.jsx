import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DeckManager({ onCreateDeck }) {
  const [showForm, setShowForm] = useState(false);
  const [showAIForm, setShowAIForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [unit, setUnit] = useState('');
  const [cardCount, setCardCount] = useState(10);

  const apSubjects = [
    { id: 'biology', name: 'AP Biology' },
    { id: 'chemistry', name: 'AP Chemistry' },
    { id: 'calc_ab', name: 'AP Calculus AB' },
    { id: 'us_history', name: 'AP US History' },
    { id: 'psychology', name: 'AP Psychology' }
  ];

  const subjectUnits = {
    biology: Array.from({ length: 8 }, (_, i) => ({ id: `unit_${i + 1}`, name: `Unit ${i + 1}` })),
    chemistry: Array.from({ length: 9 }, (_, i) => ({ id: `unit_${i + 1}`, name: `Unit ${i + 1}` })),
    calc_ab: Array.from({ length: 10 }, (_, i) => ({ id: `unit_${i + 1}`, name: `Unit ${i + 1}` })),
    us_history: Array.from({ length: 9 }, (_, i) => ({ id: `unit_${i + 1}`, name: `Unit ${i + 1}` })),
    psychology: Array.from({ length: 9 }, (_, i) => ({ id: `unit_${i + 1}`, name: `Unit ${i + 1}` }))
  };

  const availableUnits = subject ? (subjectUnits[subject] || []) : [];

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

  const handleAIGenerate = async () => {
    if (!subject || !unit) {
      toast.error('Select subject and unit');
      return;
    }

    try {
      setLoading(true);
      const subjectName = apSubjects.find(s => s.id === subject)?.name || subject;
      const unitName = availableUnits.find(u => u.id === unit)?.name || unit;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate ${cardCount} flashcards for ${subjectName} - ${unitName}.
        
Return JSON with this format:
{
  "cards": [
    {"front": "question", "back": "answer"}
  ]
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            cards: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  front: { type: 'string' },
                  back: { type: 'string' }
                }
              }
            }
          }
        }
      });

      if (!result?.cards || result.cards.length === 0) {
        throw new Error('No flashcards generated');
      }

      const deck = await onCreateDeck(`${subjectName} - ${unitName}`, `AI-generated flashcards`);
      
      for (const card of result.cards) {
        await base44.entities.Flashcard.create({
          deck_id: deck.id,
          front: card.front,
          back: card.back,
          mastery_level: 'new'
        });
      }

      toast.success(`Created ${result.cards.length} flashcards!`);
      setSubject('');
      setUnit('');
      setShowAIForm(false);
    } catch (error) {
      console.error('AI generation failed:', error);
      toast.error('Failed to generate flashcards');
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
      {!showForm && !showAIForm ? (
        <>
          <Button
            onClick={() => setShowForm(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Deck
          </Button>
          <Button
            onClick={() => setShowAIForm(true)}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Generate Deck
          </Button>
        </>
      ) : showAIForm ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-3"
        >
          <Select value={subject} onValueChange={(val) => { setSubject(val); setUnit(''); }}>
            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent>
              {apSubjects.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={unit} onValueChange={setUnit} disabled={!subject}>
            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
              <SelectValue placeholder={subject ? "Select Unit" : "Select subject first"} />
            </SelectTrigger>
            <SelectContent>
              {availableUnits.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(cardCount)} onValueChange={(v) => setCardCount(Number(v))}>
            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 Cards</SelectItem>
              <SelectItem value="10">10 Cards</SelectItem>
              <SelectItem value="15">15 Cards</SelectItem>
              <SelectItem value="20">20 Cards</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              onClick={handleAIGenerate}
              disabled={loading || !subject || !unit}
              size="sm"
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {loading ? 'Generating...' : 'Generate'}
            </Button>
            <Button
              onClick={() => setShowAIForm(false)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
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