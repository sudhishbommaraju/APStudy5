import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Sparkles, ArrowLeft, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { base44 } from '@/api/base44Client';
import MathRenderer from '@/components/ui/MathRenderer';

function Reviewer({ deck, cards, onExit }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[i];

  const go = (d) => {
    setFlipped(false);
    setI((x) => (x + d + cards.length) % cards.length);
  };

  return (
    <AppShell title={deck.name || 'Deck'} subtitle={`${cards.length} cards · ${deck.subject || 'AP'}`}>
      <button
        onClick={onExit}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All decks
      </button>

      <div className="mx-auto max-w-2xl">
        <p className="mb-2 text-center text-sm text-muted-foreground">
          Card {i + 1} of {cards.length}
        </p>
        <button
          onClick={() => setFlipped((f) => !f)}
          className="card-elevated relative flex min-h-[280px] w-full flex-col items-center justify-center p-8 text-center transition-transform hover:scale-[1.005]"
        >
          <div className="proofly-aurora pointer-events-none absolute inset-0 rounded-2xl" />
          <span className="relative mb-3 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {flipped ? 'Answer' : 'Question'}
          </span>
          <div className="relative text-xl font-medium text-foreground">
            <MathRenderer text={flipped ? card.back : card.front} />
          </div>
          <span className="relative mt-5 text-xs text-muted-foreground">Tap to flip</span>
        </button>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={() => go(-1)}
            className="grid h-12 w-12 place-items-center rounded-full border border-border bg-card hover:bg-secondary"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setFlipped((f) => !f)}
            className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-brand"
          >
            <RotateCw className="h-4 w-4" /> Flip
          </button>
          <button
            onClick={() => go(1)}
            className="grid h-12 w-12 place-items-center rounded-full border border-border bg-card hover:bg-secondary"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}

export default function FlashcardsHub() {
  const [decks, setDecks] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [activeCards, setActiveCards] = useState([]);

  async function load() {
    setLoading(true);
    try {
      const rows = await base44.entities.FlashcardDeck.list('-created_date', 200);
      const list = Array.isArray(rows) ? rows : [];
      setDecks(list);
      const entries = await Promise.all(
        list.map(async (d) => {
          try {
            const cards = await base44.entities.Flashcard.filter({ deck_id: d.id });
            return [d.id, Array.isArray(cards) ? cards.length : 0];
          } catch {
            return [d.id, 0];
          }
        })
      );
      setCounts(Object.fromEntries(entries));
    } catch {
      setDecks([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function open(deck) {
    try {
      const cards = await base44.entities.Flashcard.filter({ deck_id: deck.id });
      if (Array.isArray(cards) && cards.length) {
        setActiveCards(cards);
        setActive(deck);
      }
    } catch {
      /* ignore */
    }
  }

  if (active) {
    return <Reviewer deck={active} cards={activeCards} onExit={() => setActive(null)} />;
  }

  return (
    <AppShell
      title="Flashcards"
      subtitle="Review your decks and lock in the key facts."
      actions={
        <Link
          to="/Create"
          className="hidden items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-brand sm:flex"
        >
          <Sparkles className="h-4 w-4" /> Create
        </Link>
      }
    >
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-secondary/60" />
          ))}
        </div>
      ) : decks.length === 0 ? (
        <div className="card-elevated flex flex-col items-center p-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary">
            <Layers className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="mt-4 font-display text-lg font-bold text-foreground">No decks yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create a study set and Proofly builds a flashcard deck automatically.
          </p>
          <Link
            to="/Create"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-brand"
          >
            <Sparkles className="h-4 w-4" /> Create a study set
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((d) => (
            <button
              key={d.id}
              onClick={() => open(d)}
              className="group card-elevated flex flex-col p-5 text-left transition-transform hover:scale-[1.01]"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/15 text-sky-300">
                <Layers className="h-5 w-5" />
              </div>
              <p className="mt-3 line-clamp-2 font-semibold text-foreground group-hover:text-primary">
                {d.name || 'Untitled deck'}
              </p>
              <p className="line-clamp-1 text-xs text-muted-foreground">{d.subject || 'AP'}</p>
              <p className="mt-3 text-xs font-medium text-primary">{counts[d.id] ?? 0} cards →</p>
            </button>
          ))}
        </div>
      )}
    </AppShell>
  );
}
