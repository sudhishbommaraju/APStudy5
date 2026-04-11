import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine } from 'recharts';

// Kinematic graphs for Physics
function KinematicsGraphs() {
  const xtData = [
    { t: 0, x: 0 }, { t: 1, x: 2 }, { t: 2, x: 5 }, { t: 3, x: 9 }, { t: 4, x: 14 },
  ];
  const vtData = [
    { t: 0, v: 2 }, { t: 1, v: 3 }, { t: 2, v: 4 }, { t: 3, v: 5 }, { t: 4, v: 6 },
  ];
  const atData = [
    { t: 0, a: 1 }, { t: 1, a: 1 }, { t: 2, a: 1 }, { t: 3, a: 1 }, { t: 4, a: 1 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
      {[
        { data: xtData, key: 'x', label: 'Position vs Time', color: '#3b82f6', yLabel: 'x (m)' },
        { data: vtData, key: 'v', label: 'Velocity vs Time', color: '#10b981', yLabel: 'v (m/s)' },
        { data: atData, key: 'a', label: 'Acceleration vs Time', color: '#f59e0b', yLabel: 'a (m/s²)' },
      ].map(({ data, key, label, color, yLabel }) => (
        <div key={key} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-600 mb-3 text-center">{label}</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="t" tick={{ fontSize: 10 }} label={{ value: 't (s)', position: 'insideBottom', fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}

// Function graphs for Precalc/Calculus
function FunctionGraphs() {
  const data = Array.from({ length: 41 }, (_, i) => {
    const x = (i - 20) * 0.25;
    return { x: parseFloat(x.toFixed(2)), quadratic: x * x, cubic: x * x * x / 4, linear: x * 1.5 };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-600 mb-3 text-center">Quadratic vs Linear Functions</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="x" tick={{ fontSize: 9 }} domain={[-5, 5]} type="number" />
            <YAxis tick={{ fontSize: 9 }} domain={[-10, 25]} />
            <ReferenceLine x={0} stroke="#94a3b8" />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Tooltip />
            <Line type="monotone" dataKey="quadratic" stroke="#3b82f6" strokeWidth={2} dot={false} name="x²" />
            <Line type="monotone" dataKey="linear" stroke="#10b981" strokeWidth={2} dot={false} name="1.5x" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-600 mb-3 text-center">Cubic Function</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="x" tick={{ fontSize: 9 }} domain={[-5, 5]} type="number" />
            <YAxis tick={{ fontSize: 9 }} />
            <ReferenceLine x={0} stroke="#94a3b8" />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Tooltip />
            <Line type="monotone" dataKey="cubic" stroke="#f59e0b" strokeWidth={2} dot={false} name="x³/4" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Free Body Diagram (SVG)
function FreeBodyDiagram() {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 my-4">
      <p className="text-xs font-semibold text-gray-600 mb-3 text-center">Sample Free Body Diagram</p>
      <svg viewBox="0 0 200 200" className="w-full max-w-xs mx-auto block" xmlns="http://www.w3.org/2000/svg">
        {/* Object */}
        <rect x="75" y="80" width="50" height="40" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" rx="4" />
        <text x="100" y="105" textAnchor="middle" fontSize="10" fill="#1e40af">m</text>
        {/* Normal force up */}
        <line x1="100" y1="80" x2="100" y2="30" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrowGreen)" />
        <text x="110" y="55" fontSize="9" fill="#10b981">Fₙ</text>
        {/* Weight down */}
        <line x1="100" y1="120" x2="100" y2="170" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrowRed)" />
        <text x="108" y="155" fontSize="9" fill="#ef4444">Fg</text>
        {/* Applied force right */}
        <line x1="125" y1="100" x2="175" y2="100" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrowYellow)" />
        <text x="148" y="93" fontSize="9" fill="#f59e0b">Fₐ</text>
        {/* Friction left */}
        <line x1="75" y1="100" x2="25" y2="100" stroke="#8b5cf6" strokeWidth="2" markerEnd="url(#arrowPurple)" />
        <text x="35" y="93" fontSize="9" fill="#8b5cf6">Ff</text>
        <defs>
          <marker id="arrowGreen" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
          <marker id="arrowRed" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#ef4444" /></marker>
          <marker id="arrowYellow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#f59e0b" /></marker>
          <marker id="arrowPurple" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#8b5cf6" /></marker>
        </defs>
      </svg>
    </div>
  );
}

// Equilibrium reaction diagram (Chemistry)
function EquilibriumDiagram() {
  const data = [
    { t: 0, forward: 10, reverse: 0 },
    { t: 2, forward: 8, reverse: 2 },
    { t: 4, forward: 6, reverse: 4 },
    { t: 6, forward: 5, reverse: 5 },
    { t: 8, forward: 5, reverse: 5 },
    { t: 10, forward: 5, reverse: 5 },
  ];
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 my-4">
      <p className="text-xs font-semibold text-gray-600 mb-3 text-center">Chemical Equilibrium: Reaction Rates Over Time</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="t" tick={{ fontSize: 10 }} label={{ value: 'Time', position: 'insideBottom', fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} label={{ value: 'Rate', angle: -90, position: 'insideLeft', fontSize: 10 }} />
          <Tooltip />
          <Line type="monotone" dataKey="forward" stroke="#3b82f6" strokeWidth={2} name="Forward Rate" dot={false} />
          <Line type="monotone" dataKey="reverse" stroke="#ef4444" strokeWidth={2} name="Reverse Rate" dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 text-center mt-2">At equilibrium, forward rate = reverse rate</p>
    </div>
  );
}

const VISUAL_MAP = {
  ap_physics_1: KinematicsGraphs,
  ap_physics_2: KinematicsGraphs,
  ap_physics_c_mech: KinematicsGraphs,
  ap_precalculus: FunctionGraphs,
  ap_calc_ab: FunctionGraphs,
  ap_calc_bc: FunctionGraphs,
  ap_chemistry: EquilibriumDiagram,
};

const PHYSICS_UNITS_WITH_FBD = ["Newton's Laws", 'Kinematics', 'Work, Energy & Power'];

export default function APVisuals({ subjectId, unit }) {
  const Component = VISUAL_MAP[subjectId];
  const showFBD = (subjectId === 'ap_physics_1' || subjectId === 'ap_physics_2' || subjectId === 'ap_physics_c_mech')
    && PHYSICS_UNITS_WITH_FBD.some(u => unit?.includes(u.split(' ')[0]));

  if (!Component && !showFBD) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">📊 Visual Aids</p>
      {Component && <Component />}
      {showFBD && <FreeBodyDiagram />}
    </div>
  );
}