import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Mirrors the AP subject list used in APPractice
const AP_SUBJECTS = [
  { id: 'ap_biology', name: 'AP Biology', units: [
    { n: 1, title: 'Chemistry of Life' },
    { n: 2, title: 'Cell Structure & Function' },
    { n: 3, title: 'Cellular Energetics' },
    { n: 4, title: 'Cell Communication & Cell Cycle' },
    { n: 5, title: 'Heredity' },
    { n: 6, title: 'Gene Expression & Regulation' },
    { n: 7, title: 'Natural Selection' },
    { n: 8, title: 'Ecology' },
  ]},
  { id: 'ap_calculus_ab', name: 'AP Calculus AB', units: [
    { n: 1, title: 'Limits & Continuity' },
    { n: 2, title: 'Differentiation: Definition & Fundamental Properties' },
    { n: 3, title: 'Differentiation: Composite, Implicit & Inverse Functions' },
    { n: 4, title: 'Contextual Applications of Differentiation' },
    { n: 5, title: 'Analytical Applications of Differentiation' },
    { n: 6, title: 'Integration & Accumulation of Change' },
    { n: 7, title: 'Differential Equations' },
    { n: 8, title: 'Applications of Integration' },
  ]},
  { id: 'ap_chemistry', name: 'AP Chemistry', units: [
    { n: 1, title: 'Atomic Structure & Properties' },
    { n: 2, title: 'Molecular & Ionic Compound Structure' },
    { n: 3, title: 'Intermolecular Forces & Properties' },
    { n: 4, title: 'Chemical Reactions' },
    { n: 5, title: 'Kinetics' },
    { n: 6, title: 'Thermodynamics' },
    { n: 7, title: 'Equilibrium' },
    { n: 8, title: 'Acids & Bases' },
    { n: 9, title: 'Electrochemistry' },
  ]},
  { id: 'ap_physics_1', name: 'AP Physics 1', units: [
    { n: 1, title: 'Kinematics' },
    { n: 2, title: 'Force & Newton\'s Laws' },
    { n: 3, title: 'Circular Motion & Gravitation' },
    { n: 4, title: 'Energy' },
    { n: 5, title: 'Momentum' },
    { n: 6, title: 'Simple Harmonic Motion' },
    { n: 7, title: 'Torque & Rotational Motion' },
    { n: 8, title: 'Electric Charge & Electric Force' },
    { n: 9, title: 'DC Circuits' },
    { n: 10, title: 'Mechanical Waves & Sound' },
  ]},
  { id: 'ap_us_history', name: 'AP US History', units: [
    { n: 1, title: 'Period 1: 1491–1607' },
    { n: 2, title: 'Period 2: 1607–1754' },
    { n: 3, title: 'Period 3: 1754–1800' },
    { n: 4, title: 'Period 4: 1800–1848' },
    { n: 5, title: 'Period 5: 1844–1877' },
    { n: 6, title: 'Period 6: 1865–1898' },
    { n: 7, title: 'Period 7: 1890–1945' },
    { n: 8, title: 'Period 8: 1945–1980' },
    { n: 9, title: 'Period 9: 1980–Present' },
  ]},
  { id: 'ap_human_geography', name: 'AP Human Geography', units: [
    { n: 1, title: 'Thinking Geographically' },
    { n: 2, title: 'Population & Migration Patterns' },
    { n: 3, title: 'Cultural Patterns & Processes' },
    { n: 4, title: 'Political Patterns & Processes' },
    { n: 5, title: 'Agriculture & Rural Land-Use' },
    { n: 6, title: 'Cities & Urban Land-Use' },
    { n: 7, title: 'Industrial & Economic Development' },
  ]},
  { id: 'ap_english_lang', name: 'AP English Language', units: [
    { n: 1, title: 'Claims, Reasoning & Evidence' },
    { n: 2, title: 'Rhetorical Situation' },
    { n: 3, title: 'Claims & Evidence in Argument' },
    { n: 4, title: 'Reasoning & Organization' },
    { n: 5, title: 'Style in Argument' },
    { n: 6, title: 'Composing Argument' },
  ]},
  { id: 'ap_psychology', name: 'AP Psychology', units: [
    { n: 1, title: 'Scientific Foundations' },
    { n: 2, title: 'Biological Bases of Behavior' },
    { n: 3, title: 'Sensation & Perception' },
    { n: 4, title: 'Learning' },
    { n: 5, title: 'Cognitive Psychology' },
    { n: 6, title: 'Developmental Psychology' },
    { n: 7, title: 'Motivation, Emotion & Personality' },
    { n: 8, title: 'Clinical Psychology' },
    { n: 9, title: 'Social Psychology' },
  ]},
];

// Diagram-enabled subjects/units
const DIAGRAM_UNITS = {
  ap_biology: [2, 3, 4, 6],
  ap_chemistry: [2, 3, 5, 6],
  ap_physics_1: [1, 2, 3, 4, 5],
  ap_human_geography: [2, 4, 5, 6, 7],
};

function unitAllowsDiagrams(subjectId, unitNumber) {
  return (DIAGRAM_UNITS[subjectId] || []).includes(unitNumber);
}

export default function StructuredDeckGenerator({ onDeckCreated }) {
  const [subjectId, setSubjectId] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [count, setCount] = useState(15);
  const [loading, setLoading] = useState(false);

  const selectedSubject = AP_SUBJECTS.find(s => s.id === subjectId);
  const selectedUnit = selectedSubject?.units.find(u => u.n === Number(unitNumber));

  const generate = async () => {
    if (!subjectId || !unitNumber || !selectedSubject || !selectedUnit) {
      toast.error('Please select a subject and unit');
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      const unitTitle = selectedUnit.title;
      const unitNum = selectedUnit.n;
      const withDiagrams = unitAllowsDiagrams(subjectId, unitNum);
      const deckLabel = `${selectedSubject.name} — Unit ${unitNum}: ${unitTitle}`;

      const prompt = `You are generating flashcards strictly for:
Subject: ${selectedSubject.name}
Unit: ${unitNum} — ${unitTitle}

All cards must relate ONLY to this unit. Do NOT include content from other units.

FLASHCARD RULES:
- front: a key term, concept, or question (concise)
- back: clear definition or explanation (1-3 sentences)
${withDiagrams ? '- optional_image_keyword: a short image search keyword for a relevant diagram/diagram type (e.g. "cell membrane diagram", "free body diagram", leave empty string if not needed)' : ''}
- No multiple choice. Just front/back pairs.

Generate exactly ${count} flashcards as JSON:`;

      const schema = {
        type: 'object',
        properties: {
          flashcards: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                front: { type: 'string' },
                back: { type: 'string' },
                ...(withDiagrams ? { optional_image_keyword: { type: 'string' } } : {})
              },
              required: ['front', 'back']
            }
          }
        }
      };

      const result = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      const flashcards = result.flashcards || [];

      if (flashcards.length === 0) {
        toast.error('AI returned no flashcards. Please try again.');
        return;
      }

      // Check for existing deck for this subject+unit
      const existing = await base44.entities.FlashcardDeck.filter({
        user_email: user.email,
        subject_id: subjectId,
        unit_number: unitNum
      });

      let deck;
      if (existing.length > 0) {
        deck = existing[0];
        // Delete old cards
        const oldCards = await base44.entities.Flashcard.filter({ deck_id: deck.id });
        await Promise.all(oldCards.map(c => base44.entities.Flashcard.delete(c.id)));
      } else {
        deck = await base44.entities.FlashcardDeck.create({
          user_email: user.email,
          name: deckLabel,
          subject: selectedSubject.name,
          subject_id: subjectId,
          unit_number: unitNum,
          unit_title: unitTitle,
          is_active: true
        });
      }

      const cards = flashcards.map(fc => ({
        deck_id: deck.id,
        front: fc.front,
        back: fc.back,
        category: `Unit ${unitNum}: ${unitTitle}`,
        mastery_level: 'new',
        times_reviewed: 0,
        ...(fc.optional_image_keyword ? {
          optional_image: `https://source.unsplash.com/400x200/?${encodeURIComponent(fc.optional_image_keyword)}`
        } : {})
      }));

      await base44.entities.Flashcard.bulkCreate(cards);

      toast.success(`Generated ${cards.length} cards for ${deckLabel}`);
      if (onDeckCreated) onDeckCreated(deck);
    } catch (e) {
      console.error('[StructuredDeckGenerator]', e);
      toast.error(e.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        {selectedSubject && selectedUnit && (
          <p className="text-blue-500 text-xs font-medium">
            {selectedSubject.name} — Unit {selectedUnit.n}: {selectedUnit.title}
          </p>
        )}
      </div>

      {/* Subject */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Subject</label>
        <div className="relative">
          <select
            value={subjectId}
            onChange={e => { setSubjectId(e.target.value); setUnitNumber(''); }}
            className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm pr-8 focus:outline-none focus:border-blue-400"
          >
            <option value="">Select AP Subject...</option>
            {AP_SUBJECTS.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Unit */}
      {selectedSubject && (
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Unit</label>
          <div className="relative">
            <select
              value={unitNumber}
              onChange={e => setUnitNumber(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm pr-8 focus:outline-none focus:border-blue-400"
            >
              <option value="">Select Unit...</option>
              {selectedSubject.units.map(u => (
                <option key={u.n} value={u.n}>Unit {u.n}: {u.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Card count */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Number of Cards</label>
        <div className="flex gap-2">
          {[10, 15, 20, 30].map(n => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                count === n
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={generate}
        disabled={loading || !subjectId || !unitNumber}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-sm"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating {count} cards...</>
        ) : (
          <><Sparkles className="w-4 h-4 mr-2" />Generate Deck</>
        )}
      </Button>
    </div>
  );
}