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
  }, [nodes]);

  function generateConceptNodes() {
    const nd = note.notes_data || {};
    const conceptNodes = [];

    // Central node for the unit
    conceptNodes.push({
      id: 'main',
      label: note.title,
      type: 'main',
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      connections: []
    });

    // Section nodes
    const sections = nd.sections || [];
    sections.forEach((sec, i) => {
      const id = `section-${i}`;
      conceptNodes.push({
        id,
        label: sec.title,
        type: 'section',
        sectionIndex: i,
        x: 200 + (i % 3) * 200,
        y: 150 + Math.floor(i / 3) * 150,
        vx: 0,
        vy: 0,
        connections: ['main']
      });
    });

    // Key term nodes (connected to sections)
    const keyTerms = nd.keyTerms || [];
    keyTerms.slice(0, Math.min(8, keyTerms.length)).forEach((term, i) => {
      const termText = typeof term === 'string' ? term : term.term;
      conceptNodes.push({
        id: `term-${i}`,
        label: termText.length > 20 ? termText.slice(0, 17) + '...' : termText,
        type: 'term',
        x: 100 + Math.random() * 600,
        y: 200 + Math.random() * 300,
        vx: 0,
        vy: 0,
        connections: [`section-${i % sections.length}`]
      });
    });

    setNodes(conceptNodes);
  }

  function simulateForces() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let iterations = 0;
    const maxIterations = 50;
    const damping = 0.95;
    const repulsion = 200;
    const attraction = 0.05;
    const centerForce = 0.02;

    const animate = () => {
      if (iterations >= maxIterations) return;

      setNodes(prevNodes => {
        const updated = prevNodes.map(n => ({ ...n }));

        // Repulsion between all nodes
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

        // Attraction along connections
        updated.forEach(node => {
          node.connections.forEach(cId => {
            const target = updated.find(n => n.id === cId);
            if (target) {
              const dx = target.x - node.x;
              const dy = target.y - node.y;
              const dist = Math.sqrt(dx * dx + dy * dy) + 1;

              node.vx += attraction * dx;
              node.vy += attraction * dy;
              target.vx -= attraction * dx;
              target.vy -= attraction * dy;
            }
          });
        });

        // Center attraction
        updated.forEach(node => {
          if (node.type !== 'main') {
            const dx = 400 - node.x;
            const dy = 300 - node.y;
            node.vx += centerForce * dx;
            node.vy += centerForce * dy;
          }
        });

        // Apply velocity and damping
        updated.forEach(node => {
          node.vx *= damping;
          node.vy *= damping;
          node.x += node.vx;
          node.y += node.vy;

          // Boundary check
          node.x = Math.max(20, Math.min(780, node.x));
          node.y = Math.max(20, Math.min(580, node.y));
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
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 800, 600);

    // Draw connections
    nodes.forEach(node => {
      node.connections.forEach(connId => {
        const target = nodes.find(n => n.id === connId);
        if (target) {
          ctx.strokeStyle = '#e5e7eb';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
        }
      });
    });

    // Draw nodes
    nodes.forEach(node => {
      const isSelected = selectedNode === node.id;
      const radius = node.type === 'main' ? 50 : node.type === 'section' ? 35 : 25;

      let color = '#3b82f6';
      if (node.type === 'main') color = '#1e40af';
      else if (node.type === 'section') color = '#0ea5e9';
      else color = '#10b981';

      ctx.fillStyle = isSelected ? '#fbbf24' : color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fill();

      // Stroke
      ctx.strokeStyle = isSelected ? '#f59e0b' : color;
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lines = node.label.split(' ');
      const lineHeight = 14;
      const startY = node.y - (lines.length - 1) * lineHeight / 2;
      lines.forEach((line, i) => {
        ctx.fillText(line, node.x, startY + i * lineHeight);
      });
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
    <div className={`fixed inset-0 ${fullscreen ? 'z-50' : ''} flex flex-col bg-white dark:bg-[#0C0C0C]`}>
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
          width={800}
          height={600}
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