import React, { useState } from 'react';
import { AP_SUBJECTS, getSubjectCategories, getSubjectsByCategory } from './AP_SUBJECTS';

export default function APSubjectSelector({ subject, setSubject, unit, setUnit }) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = search
    ? AP_SUBJECTS.filter(s => s.subject.toLowerCase().includes(search.toLowerCase()))
    : AP_SUBJECTS;

  const units = subject?.units || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Subject */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">AP Subject</label>
        <p className="text-xs text-gray-400 mb-2">Choose from 25+ AP subjects</p>
        <div className="relative">
          <input
            type="text"
            placeholder="Search subjects..."
            value={subject ? subject.subject : search}
            onChange={e => { setSearch(e.target.value); setSubject(null); setUnit(''); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {showDropdown && (
            <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-auto">
              {filtered.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-400">No subjects found</div>
              )}
              {filtered.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSubject(s); setUnit(''); setSearch(''); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm text-gray-700 hover:text-blue-700 transition-colors border-b border-gray-50 last:border-0"
                >
                  <span className="font-medium">{s.subject}</span>
                  <span className="ml-2 text-xs text-gray-400">{s.category}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {showDropdown && (
          <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
        )}
      </div>

      {/* Unit */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Unit</label>
        <p className="text-xs text-gray-400 mb-2">Select a unit to study</p>
        <select
          value={unit}
          onChange={e => setUnit(e.target.value)}
          disabled={!subject}
          className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">{subject ? 'Select a unit' : 'Select a subject first'}</option>
          {units.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
        </select>
      </div>
    </div>
  );
}