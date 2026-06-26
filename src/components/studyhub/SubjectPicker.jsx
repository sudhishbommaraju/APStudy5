import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { AP_SUBJECTS, getSubjectCategories, getSubjectsByCategory } from './AP_SUBJECTS';

const CATEGORY_DOT = {
  'Math & CS': 'bg-violet-400',
  Science: 'bg-emerald-400',
  'History & Social Studies': 'bg-amber-400',
  'English & Arts': 'bg-rose-400',
  'World Languages': 'bg-sky-400',
};

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onOutside]);
}

/**
 * SubjectPicker — searchable AP subject dropdown grouped by category.
 */
export function SubjectPicker({ value, onChange, label = 'AP subject' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  const selected = AP_SUBJECTS.find((s) => s.id === value);
  const categories = useMemo(() => getSubjectCategories(), []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .map((cat) => ({
        cat,
        items: getSubjectsByCategory(cat).filter(
          (s) => !q || s.subject.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length);
  }, [categories, query]);

  return (
    <div ref={ref} className="relative">
      {label && <label className="text-sm font-semibold text-foreground">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`mt-2 flex w-full items-center gap-3 rounded-xl border bg-card px-3.5 py-3 text-left text-sm transition-colors ${
          open ? 'border-primary' : 'border-border hover:border-primary/40'
        }`}
      >
        {selected && (
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
              CATEGORY_DOT[selected.category] || 'bg-violet-400'
            }`}
          />
        )}
        <span className={`flex-1 truncate ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
          {selected ? selected.subject : 'Choose a subject'}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl shadow-black/50">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search subjects…"
              className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-1.5">
            {groups.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">No subjects found</p>
            ) : (
              groups.map((g) => (
                <div key={g.cat} className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {g.cat}
                  </p>
                  {g.items.map((s) => {
                    const active = s.id === value;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          onChange(s.id);
                          setOpen(false);
                          setQuery('');
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          active ? 'bg-primary/15 text-primary' : 'text-foreground hover:bg-secondary'
                        }`}
                      >
                        <span className={`h-2 w-2 shrink-0 rounded-full ${CATEGORY_DOT[g.cat]}`} />
                        <span className="flex-1 truncate">{s.subject}</span>
                        {active && <Check className="h-4 w-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * UnitPicker — simple dropdown for a subject's units (plus a default option).
 */
export function UnitPicker({ subject, value, onChange, defaultLabel = 'Auto-detect from content', label = 'Unit (optional)' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));
  const units = subject?.units || [];

  return (
    <div ref={ref} className="relative">
      {label && <label className="block text-sm font-semibold text-foreground">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`mt-2 flex w-full items-center gap-3 rounded-xl border bg-card px-3.5 py-3 text-left text-sm transition-colors ${
          open ? 'border-primary' : 'border-border hover:border-primary/40'
        }`}
      >
        <span className={`flex-1 truncate ${value ? 'text-foreground' : 'text-muted-foreground'}`}>
          {value || defaultLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 shadow-2xl shadow-black/50">
          <button
            type="button"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              !value ? 'bg-primary/15 text-primary' : 'text-foreground hover:bg-secondary'
            }`}
          >
            <span className="flex-1 truncate">{defaultLabel}</span>
            {!value && <Check className="h-4 w-4" />}
          </button>
          {units.map((u) => {
            const active = value === u.name;
            return (
              <button
                key={u.name}
                type="button"
                onClick={() => {
                  onChange(u.name);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  active ? 'bg-primary/15 text-primary' : 'text-foreground hover:bg-secondary'
                }`}
              >
                <span className="flex-1 truncate">{u.name}</span>
                {active && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
