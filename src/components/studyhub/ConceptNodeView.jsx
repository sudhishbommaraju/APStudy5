import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Maximize2, Minimize2 } from 'lucide-react';

export default function ConceptNodeView({ note, onNodeSelect, onClose }) {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    generateConceptNodes();
  }, [note]);

  useEffect(() => {
    if (nodes.length > 0) simulateForces();
  }, [nodes.length]);

  function generateConceptNodes() {
    const nd = note.notes_data || {};
    const conceptNodes = [];
    const W = 900, H = 650;
    const cx = W / 2, cy = H / 2;

    conceptNodes.push({
      id: 'main',
      label: note.title,
      type: 'main',
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      connections: []
    });

    const sections = nd.sections || [];
    const sectionRadius = 230;
    sections.forEach((sec, i) => {
      const angle = (2 * Math.PI * i) / sections.length - Math.PI / 2;
      const id = 'section-' + i;
      conceptNodes.push({
        id,
        label: sec.title,
        type: 'section',
        sectionIndex: i,
        x: cx + sectionRadius * Math.cos(angle),
        y: cy + sectionRadius * Math.sin(angle),
        vx: 0,
        vy: 0,
        connections: ['main']
      });
    });

    const keyTerms = nd.keyTerms || [];
    const termRadius = 370;
    const termCount = Math.min(10, keyTerms.length);
    keyTerms.slice(0, termCount).forEach((term, i) => {
      const termText = typeof term === 'string' ? term : term.term;
      const angle = (2 * Math.PI * i) / termCount - Math.PI / 2;
      conceptNodes.push({
        id: 'term-' + i,
        label: termText.length > 22 ? termText.slice(0, 19) + '...' : termText,
        type: 'term',
        x: cx + termRadius * Math.cos(angle),
        y: cy + termRadius * Math.sin(angle),
        vx: 0,
        vy: 0,
        connections: ['section-' + (i % Math.max(1, sections.length))]
      });
    });

    setNodes(conceptNodes);
  }

  function simulateForces() {
    let iterations = 0;
    const maxIterations = 120;
    const damping = 0.85;
    const repulsion = 8000;
    const attraction = 0.03;
    const centerForce = 0.003;
    const W = 900, H = 650;

    const animate = () => {
      if (iterations >= maxIterations) return;

      setNodes(prevNodes => {
        const updated = prevNodes.map(n => ({ ...n }));

        for (let i = 0; i < updated.length; i++) {
          for (let j = i + 1; j < updated.length; j++) {
            const dx = updated[j].x - updated[i].x;
            const dy = updated[j].y - updated[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy) + 1;
            const force = repulsion / (dist * dist);
            updated[i].vx -= (force * dx) / dist;
            updated[i].vy -= (force * dy) / dist;
            updated[j].vx += (force * dx) / dist;
            updated[j].vy += (force * dy) / dist;
          }
        }

        updated.forEach(node => {
          node.connections.forEach(cId => {
            const target = updated.find(n => n.id === cId);
            if (target) {
              const dx = target.x - node.x;
              const dy = target.y - node.y;
              node.vx += attraction * dx;
              node.vy += attraction * dy;
              target.vx -= attraction * dx;
              target.vy -= attraction * dy;
            }
          });
        });

        updated.forEach(node => {
          if (node.type !== 'main') {
            node.vx += centerForce * (W / 2 - node.x);
            node.vy += centerForce * (H / 2 - node.y);
          }
        });

        updated.forEach(node => {
          node.vx *= damping;
          node.vy *= damping;
          node.x += node.vx;
          node.y += node.vy;
          node.x = Math.max(50, Math.min(W - 50, node.x));
          node.y = Math.max(50, Math.min(H - 50, node.y));
        });

        return updated;
      });

      iterations++;
      requestAnimationFrame(animate);
    };

    animate();
  }

  function handleNodeClick(node) {
    setSelectedNode(node.id);
    onNodeSelect?.(node);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    nodes.forEach(node => {
      node.connections.forEach(connId => {
        const target = nodes.find(n => n.id === connId);
        if (target) {
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    });

    nodes.forEach(node => {
      const isSelected = selectedNode === node.id;
      const radius = node.type === 'main' ? 48 : node.type === 'section' ? 34 : 24;

      let color = '#3b82f6';
      if (node.type === 'main') color = '#1e40af';
      else if (node.type === 'section') color = '#0ea5e9';
      else color = '#10b981';

      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = isSelected ? '#f59e0b' : color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = isSelected ? '#d97706' : 'rgba(255,255,255,0.4)';
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = node.type === 'main' ? 'bold 11px sans-serif' : '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const words = node.label.split(' ');
      const maxWidth = radius * 1.7;
      const lines = [];
      let current = '';
      words.forEach(w => {
        const test = current ? current + ' ' + w : w;
        if (ctx.measureText(test).width < maxWidth) {
          current = test;
        } else {
          if (current) lines.push(current);
          current = w;
        }
      });
      if (current) lines.push(current);
      const lineHeight = 12;
      const startY = node.y - (lines.length - 1) * lineHeight / 2;
      lines.forEach((line, i) => ctx.fillText(line, node.x, startY + i * lineHeight));
    });
  }, [nodes, selectedNode]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clicked = nodes.find(node => {
      const radius = node.type === 'main' ? 50 : node.type === 'section' ? 35 : 25;
      const dist = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      return dist <= radius;
    });

    if (clicked) handleNodeClick(clicked);
  };

  return (
    <div className={'fixed inset-0 ' + (fullscreen ? 'z-50' : '') + ' flex flex-col bg-white dark:bg-[#0C0C0C]'}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#171717]">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-lg text-gray-500">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F5F5F5]">Concept Map: {note.title}</h2>
        </div>
        <button onClick={() => setFullscreen(!fullscreen)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-lg text-gray-500">
          {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <canvas
          ref={canvasRef}
          width={900}
          height={650}
          onClick={handleCanvasClick}
          className="w-full cursor-pointer bg-white dark:bg-[#0C0C0C]"
        />
      </div>

      {selectedNode && (
        <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800/40">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <span className="font-semibold">Selected:</span> {nodes.find(n => n.id === selectedNode)?.label}
          </p>
        </div>
      )}
    </div>
  );
}