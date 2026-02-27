import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * A real flip-card component.
 * front / back are arbitrary ReactNode or string.
 * Resets flip state when `cardKey` changes.
 */
export default function FlipCard({ front, back, image, cardKey }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setFlipped(false);
  }, [cardKey]);

  return (
    <div
      className="w-full cursor-pointer"
      style={{ perspective: 1200 }}
      onClick={() => setFlipped(f => !f)}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: 'preserve-3d', position: 'relative', minHeight: 280 }}
      >
        {/* FRONT */}
        <div
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          className="absolute inset-0 rounded-2xl bg-neutral-900 border border-neutral-700 flex flex-col items-center justify-center p-8 text-center"
        >
          {image && (
            <img
              src={image}
              alt="card visual"
              className="max-h-32 object-contain rounded-lg mb-5"
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}
          <p className="text-xs text-[#D6B98C] uppercase tracking-widest mb-3 font-medium">Term / Concept</p>
          <p className="text-white text-2xl font-medium leading-snug">{front}</p>
          <p className="text-neutral-500 text-xs mt-6">Click to flip</p>
        </div>

        {/* BACK */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
          className="absolute inset-0 rounded-2xl bg-[#1A1A1A] border border-[#D6B98C]/30 flex flex-col items-center justify-center p-8 text-center"
        >
          <p className="text-xs text-[#D6B98C] uppercase tracking-widest mb-3 font-medium">Definition / Answer</p>
          <p className="text-neutral-100 text-lg leading-relaxed">{back}</p>
          <p className="text-neutral-500 text-xs mt-6">Click to flip back</p>
        </div>
      </motion.div>
    </div>
  );
}