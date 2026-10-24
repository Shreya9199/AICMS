import React, { useEffect, useRef } from 'react';

/**
 * AnimatedBackground renders interactive, elegant floating glowing orbs
 * and an ambient canvas mesh with floating particles that gently react to mouse motion.
 * Designed to give a high-tech, trustworthy national governance portal aesthetic.
 */
export const AnimatedBackground = ({ variant = 'default' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle collection
    const particleCount = Math.min(Math.floor((width * height) / 22000), 55);
    const particles = [];

    const isDark = variant === 'dark';
    const baseColor = isDark ? 'rgba(96, 165, 250,' : 'rgba(59, 130, 246,';
    const accentColor = isDark ? 'rgba(167, 139, 250,' : 'rgba(99, 102, 241,';

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? baseColor : accentColor,
        alpha: Math.random() * 0.35 + 0.15,
      });
    }

    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const lineAlpha = (1 - dist / 130) * 0.15;
            ctx.strokeStyle = `rgba(147, 197, 253, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw and update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Slight mouse nudge
        const mdx = mouseX - p.x;
        const mdy = mouseY - p.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 140) {
          const force = (1 - mdist / 140) * 0.8;
          p.x -= (mdx / mdist) * force;
          p.y -= (mdy / mdist) * force;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [variant]);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {/* Dynamic Animated Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-3xl animate-blob" />
      <div className="absolute top-[20%] right-[-10%] w-[550px] h-[550px] rounded-full bg-indigo-500/10 blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-15%] left-[20%] w-[600px] h-[600px] rounded-full bg-cyan-400/10 blur-3xl animate-blob animation-delay-4000" />
      
      {/* Subdued Tech Grid Layer */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 mix-blend-overlay" />

      {/* Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
    </div>
  );
};
