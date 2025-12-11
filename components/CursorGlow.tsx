import React, { useEffect, useRef } from 'react';

const CursorGlow: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = window.devicePixelRatio || 1;

    // Configuration
    // Reduced count slightly to ensure 60fps consistency which reduces jitter perception
    const particleCount = window.innerWidth < 768 ? 30 : 60; 
    const connectionDist = 150;
    const mouseDist = 200;
    
    // Data Arrays
    const pX = new Float32Array(particleCount);
    const pY = new Float32Array(particleCount);
    const pVX = new Float32Array(particleCount);
    const pVY = new Float32Array(particleCount);

    const initParticles = () => {
      for (let i = 0; i < particleCount; i++) {
        pX[i] = Math.random() * width;
        pY[i] = Math.random() * height;
        // Increased speed slightly as requested ("too slow")
        // Using consistent direction to avoid "vibrating" look of random noise
        const speed = 0.8; 
        const angle = Math.random() * Math.PI * 2;
        pVX[i] = Math.cos(angle) * speed;
        pVY[i] = Math.sin(angle) * speed;
      }
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = window.devicePixelRatio || 1;
      
      // Ensure integer pixel dimensions
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      ctx.scale(dpr, dpr);
      initParticles();
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let lastTime = performance.now();
    let animationFrameId: number;

    const animate = () => {
      const now = performance.now();
      // Calculate delta time in seconds, capped at 0.1s to prevent huge jumps
      let dt = (now - lastTime) / 1000;
      lastTime = now;
      if (dt > 0.1) dt = 0.1;

      ctx.clearRect(0, 0, width, height);
      
      // 1. Update Positions (Linear smooth drift)
      // We use 60 as a base multiplier so speeds in pixels/frame act as pixels/sec roughly
      const timeScale = 60 * dt; 

      for (let i = 0; i < particleCount; i++) {
        pX[i] += pVX[i] * timeScale;
        pY[i] += pVY[i] * timeScale;

        // Smooth wrap around
        if (pX[i] < -10) pX[i] = width + 10;
        if (pX[i] > width + 10) pX[i] = -10;
        if (pY[i] < -10) pY[i] = height + 10;
        if (pY[i] > height + 10) pY[i] = -10;
      }

      // 2. Draw Particles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < particleCount; i++) {
          ctx.beginPath();
          // Using small squares is faster than arcs
          ctx.rect(pX[i], pY[i], 2, 2);
          ctx.fill();
      }

      // 3. Draw Lines
      // We separate mouse interaction from particle movement to prevent jitter.
      // The "reactivity" is purely visual (lines appearing).
      
      ctx.lineWidth = 1;
      const mouseDistSq = mouseDist * mouseDist;
      const connectionDistSq = connectionDist * connectionDist;

      for (let i = 0; i < particleCount; i++) {
        const px = pX[i];
        const py = pY[i];

        // Mouse Connections
        // Calculate distance to mouse
        const dxM = mouse.x - px;
        const dyM = mouse.y - py;
        const distMSq = dxM * dxM + dyM * dyM;

        if (distMSq < mouseDistSq) {
            const alpha = 1 - distMSq / mouseDistSq;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
            ctx.moveTo(px, py);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
        }

        // Particle-to-Particle Connections
        // We only check j > i to avoid duplicates
        for (let j = i + 1; j < particleCount; j++) {
          const dx = px - pX[j];
          const dy = py - pY[j];
          const distSq = dx * dx + dy * dy;

          if (distSq < connectionDistSq) {
            const alpha = 1 - distSq / connectionDistSq;
            // Optimization: Skip very faint lines
            if (alpha > 0.05) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.15})`;
                ctx.moveTo(px, py);
                ctx.lineTo(pX[j], pY[j]);
                ctx.stroke();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ touchAction: 'none' }}
    />
  );
};

export default React.memo(CursorGlow);