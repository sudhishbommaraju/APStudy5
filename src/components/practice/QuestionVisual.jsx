import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts';

// ── Graph renderer for Calculus / Physics ──────────────────────────────────
function FunctionGraph({ spec }) {
  const data = useMemo(() => {
    const points = [];
    const [xMin, xMax] = spec.xRange || [-5, 5];
    const steps = 80;
    const dx = (xMax - xMin) / steps;

    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      let y = null;
      try {
        // Support "f(x) = ..." or raw expression
        const expr = (spec.function || '').replace(/^f\(x\)\s*=\s*/i, '');
        // Safe eval with x substituted
        // eslint-disable-next-line no-new-func
        y = new Function('x', `"use strict"; return (${expr.replace(/\^/g, '**')});`)(x);
        if (!isFinite(y)) y = null;
      } catch {
        y = null;
      }
      points.push({ x: parseFloat(x.toFixed(3)), y: y !== null ? parseFloat(y.toFixed(3)) : null });
    }
    return points;
  }, [spec]);

  const [yMin, yMax] = spec.yRange || [-10, 10];

  return (
    <div className="bg-neutral-800 rounded-lg p-4">
      <p className="text-xs text-neutral-400 mb-2 font-mono">{spec.function}</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="x" stroke="#888" tick={{ fontSize: 10 }} domain={spec.xRange} type="number" />
          <YAxis stroke="#888" tick={{ fontSize: 10 }} domain={[yMin, yMax]} />
          <Tooltip
            contentStyle={{ background: '#1a1a1a', border: '1px solid #333', fontSize: 11 }}
            formatter={(v) => [v !== null ? v : 'undefined', 'y']}
          />
          <ReferenceLine x={0} stroke="#555" />
          <ReferenceLine y={0} stroke="#555" />
          <Line
            type="monotone"
            dataKey="y"
            stroke="#60a5fa"
            dot={false}
            strokeWidth={2}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function DataPointGraph({ spec }) {
  const data = (spec.dataPoints || []).map(([x, y]) => ({ x, y }));
  const label = spec.type === 'velocity-time' ? { x: 'Time (s)', y: 'Velocity (m/s)' }
              : spec.type === 'position-time' ? { x: 'Time (s)', y: 'Position (m)' }
              : { x: 'x', y: 'y' };

  return (
    <div className="bg-neutral-800 rounded-lg p-4">
      <p className="text-xs text-neutral-400 mb-2 uppercase tracking-wider">{spec.type?.replace('-', ' ')}</p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="x" stroke="#888" tick={{ fontSize: 10 }} label={{ value: label.x, position: 'insideBottom', offset: -2, fill: '#888', fontSize: 10 }} />
          <YAxis stroke="#888" tick={{ fontSize: 10 }} label={{ value: label.y, angle: -90, position: 'insideLeft', fill: '#888', fontSize: 10 }} />
          <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', fontSize: 11 }} />
          <Line type="monotone" dataKey="y" stroke="#34d399" dot={{ r: 3, fill: '#34d399' }} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Diagram renderer for AP Biology ────────────────────────────────────────
const DIAGRAM_LABELS = {
  cell: ['nucleus', 'mitochondria', 'cell membrane', 'endoplasmic reticulum', 'golgi apparatus', 'cytoplasm'],
  mitosis: ['prophase', 'metaphase', 'anaphase', 'telophase'],
  food_web: ['producer', 'primary consumer', 'secondary consumer', 'decomposer']
};

function DiagramVisual({ spec }) {
  const type = spec.diagramType || 'cell';
  const highlighted = (spec.highlightedPart || '').toLowerCase();
  const parts = DIAGRAM_LABELS[type] || [];

  return (
    <div className="bg-neutral-800 rounded-lg p-4">
      <p className="text-xs text-neutral-400 mb-3 uppercase tracking-wider">{type.replace(/_/g, ' ')} diagram</p>
      <div className="flex flex-wrap gap-2">
        {parts.map((part) => (
          <span
            key={part}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              highlighted && part.includes(highlighted)
                ? 'bg-yellow-500/20 border-yellow-400 text-yellow-200'
                : 'bg-neutral-700 border-neutral-600 text-neutral-300'
            }`}
          >
            {part}
          </span>
        ))}
      </div>
      {highlighted && (
        <p className="text-xs text-yellow-400 mt-2">Highlighted: {spec.highlightedPart}</p>
      )}
    </div>
  );
}

// ── Map renderer for AP Human Geography ────────────────────────────────────
function MapVisual({ spec }) {
  const cities = spec.cities || [];
  const diffusionType = spec.diffusionType || '';

  return (
    <div className="bg-neutral-800 rounded-lg p-4">
      <p className="text-xs text-neutral-400 mb-2 uppercase tracking-wider">
        {diffusionType ? `${diffusionType} diffusion` : 'geographic distribution'}
      </p>
      {cities.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {cities.map((city, i) => (
            <span
              key={i}
              className={`px-2 py-1 text-xs rounded border ${
                i === 0
                  ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                  : 'bg-neutral-700 border-neutral-600 text-neutral-300'
              }`}
            >
              {typeof city === 'object' ? city.name : city}
              {i === 0 && diffusionType === 'hierarchical' ? ' (origin)' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────
export default function QuestionVisual({ visual }) {
  if (!visual || !visual.type || !visual.spec) return null;

  const { type, spec } = visual;

  if (type === 'graph') {
    if (spec.function) return <FunctionGraph spec={spec} />;
    if (spec.dataPoints) return <DataPointGraph spec={spec} />;
  }

  if (type === 'diagram') return <DiagramVisual spec={spec} />;
  if (type === 'map') return <MapVisual spec={spec} />;

  return null;
}