import React, { useEffect, useRef, useState } from 'react';

export default function CursorGlow() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const canvas = canvasRef.current;
    if (!canvas || isMobile) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track mouse
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      
      // Add particle near cursor
      if (Math.random() > 0.7) {
        particles.push({
          x: e.clientX + (Math.random() - 0.5) * 40,
          y: e.clientY + (Math.random() - 0.5) * 40,
          radius: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.3,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          life: 1,
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles = particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.01;
        particle.opacity = particle.life * 0.6;

        if (particle.life > 0) {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.radius * 3
          );
          gradient.addColorStop(0, `rgba(139, 92, 246, ${particle.opacity})`);
          gradient.addColorStop(1, `rgba(139, 92, 246, 0)`);
          ctx.fillStyle = gradient;
          ctx.fill();
          return true;
        }
        return false;
      });

      // Glow around cursor
      const { x, y } = mouseRef.current;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 100);
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.08)');
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationFrameId = requestAnimationFrame(animate);
    };

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion && !isMobile) {
      animate();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', checkMobile);
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}