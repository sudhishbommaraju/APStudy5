import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Target, Edit2, Check, X } from 'lucide-react';

export default function PSATScoreCard({ theme, psatScore, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(psatScore ? String(psatScore) : '');
  const [saving, setSaving] = useState(false);

  const predictedSAT = psatScore ? Math.min(1600, Math.round(psatScore * 1.03 + 20)) : null;

  const handleSave = async () => {
    const val = parseInt(input);
    if (isNaN(val) || val < 320 || val > 1520) return;
    setSaving(true);
    await base44.auth.updateMe({ psat_score: val });
    onUpdate(val);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div style={{
      background: theme.card, border: `1px solid ${theme.border}`,
      borderRadius: 16, padding: 20,
      boxShadow: theme.isDark ? '0 0 0 1px #1f2937' : '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Target size={15} color={theme.accent} />
          <p style={{ fontSize: 13, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>PSAT Baseline</p>
        </div>
        {!editing && (
          <button
            onClick={() => { setInput(psatScore ? String(psatScore) : ''); setEditing(true); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
          >
            <Edit2 size={12} /> {psatScore ? 'Edit' : 'Add Score'}
          </button>
        )}
      </div>

      {editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div>
            <input
              type="number"
              min={320} max={1520}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="320–1520"
              style={{
                width: 100, padding: '6px 10px', borderRadius: 8,
                border: `1px solid ${theme.border}`, background: theme.isDark ? '#1f2937' : '#f8fafc',
                color: theme.text, fontSize: 14, outline: 'none',
              }}
            />
            <p style={{ fontSize: 10, color: theme.textMuted, margin: '3px 0 0' }}>Enter your PSAT score</p>
          </div>
          <button onClick={handleSave} disabled={saving} style={{ background: theme.accent, border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            {saving ? '…' : <Check size={14} />}
          </button>
          <button onClick={() => setEditing(false)} style={{ background: 'none', border: `1px solid ${theme.border}`, borderRadius: 8, padding: '6px 10px', color: theme.textMuted, cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      ) : psatScore ? (
        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <p style={{ fontSize: 28, fontWeight: 800, color: theme.text, margin: 0, lineHeight: 1 }}>{psatScore}</p>
            <p style={{ fontSize: 11, color: theme.textMuted, margin: '4px 0 0' }}>PSAT Score</p>
          </div>
          <div style={{ width: 1, background: theme.border }} />
          <div>
            <p style={{ fontSize: 28, fontWeight: 800, color: theme.accent, margin: 0, lineHeight: 1 }}>{predictedSAT}</p>
            <p style={{ fontSize: 11, color: theme.textMuted, margin: '4px 0 0' }}>Predicted SAT</p>
          </div>
          <div style={{ width: 1, background: theme.border }} />
          <div>
            <p style={{ fontSize: 11, color: theme.textMuted, margin: '0 0 4px' }}>Practice lifts your estimate as your accuracy improves</p>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: theme.textMuted, margin: 0 }}>Add your PSAT score to get a personalized SAT score prediction that improves as you practice.</p>
      )}
    </div>
  );
}