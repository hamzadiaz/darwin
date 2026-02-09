'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  fitness: number; // 0-1, determines color and survival
  age: number;
  maxAge: number;
  generation: number;
  trail: { x: number; y: number }[];
}

export function EvolutionCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let particles: Particle[] = [];
    let generation = 0;
    let genTimer = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };
    resize();
    window.addEventListener('resize', resize);

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    function spawn(count: number, gen: number): Particle[] {
      return Array.from({ length: count }, () => ({
        x: Math.random() * w(),
        y: Math.random() * h(),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 2 + Math.random() * 3,
        fitness: Math.random(),
        age: 0,
        maxAge: 200 + Math.random() * 300,
        generation: gen,
        trail: [],
      }));
    }

    particles = spawn(40, 0);

    function evolve() {
      // Sort by fitness, keep top 30%
      particles.sort((a, b) => b.fitness - a.fitness);
      const survivors = particles.slice(0, Math.max(8, Math.floor(particles.length * 0.3)));
      generation++;

      // Breed new particles from survivors
      const children: Particle[] = [];
      while (children.length < 30) {
        const p1 = survivors[Math.floor(Math.random() * survivors.length)];
        const p2 = survivors[Math.floor(Math.random() * survivors.length)];
        children.push({
          x: (p1.x + p2.x) / 2 + (Math.random() - 0.5) * 60,
          y: (p1.y + p2.y) / 2 + (Math.random() - 0.5) * 60,
          vx: (p1.vx + p2.vx) / 2 + (Math.random() - 0.5) * 0.5,
          vy: (p1.vy + p2.vy) / 2 + (Math.random() - 0.5) * 0.5,
          size: 2 + Math.random() * 3,
          fitness: Math.min(1, (p1.fitness + p2.fitness) / 2 + (Math.random() - 0.3) * 0.2),
          age: 0,
          maxAge: 200 + Math.random() * 300,
          generation,
          trail: [],
        });
      }
      particles = [...survivors.map(s => ({ ...s, age: 0, trail: [] })), ...children];
    }

    function draw() {
      ctx.clearRect(0, 0, w(), h());
      genTimer++;

      if (genTimer > 300) {
        evolve();
        genTimer = 0;
      }

      // Draw connections between nearby fit particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100 && particles[i].fitness > 0.4 && particles[j].fitness > 0.4) {
            const alpha = (1 - dist / 100) * 0.15 * Math.min(particles[i].fitness, particles[j].fitness);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 255, 136, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      particles.forEach(p => {
        p.age++;
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges softly
        if (p.x < 0 || p.x > w()) p.vx *= -1;
        if (p.y < 0 || p.y > h()) p.vy *= -1;
        p.x = Math.max(0, Math.min(w(), p.x));
        p.y = Math.max(0, Math.min(h(), p.y));

        // Fitness affects behavior: fit particles grow, unfit shrink
        const lifeRatio = 1 - p.age / p.maxAge;
        const currentSize = p.size * lifeRatio * (0.5 + p.fitness * 0.8);

        // Trail
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 8) p.trail.shift();

        // Draw trail
        if (p.fitness > 0.5 && p.trail.length > 2) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let t = 1; t < p.trail.length; t++) {
            ctx.lineTo(p.trail[t].x, p.trail[t].y);
          }
          ctx.strokeStyle = `rgba(0, 255, 136, ${0.05 * p.fitness})`;
          ctx.lineWidth = currentSize * 0.5;
          ctx.stroke();
        }

        // Color: green for fit, red/dim for unfit
        const r = Math.floor(255 * (1 - p.fitness));
        const g = Math.floor(255 * p.fitness * 0.53);
        const b = Math.floor(136 * p.fitness);
        const alpha = lifeRatio * (0.3 + p.fitness * 0.7);

        // Glow for fit particles
        if (p.fitness > 0.7) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentSize * 3, 0, Math.PI * 2);
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize * 3);
          glow.addColorStop(0, `rgba(0, 255, 136, ${0.1 * p.fitness * lifeRatio})`);
          glow.addColorStop(1, 'rgba(0, 255, 136, 0)');
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, currentSize), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g + 180}, ${b + 100}, ${alpha})`;
        ctx.fill();

        // Death: remove aged particles
        if (p.age >= p.maxAge) {
          p.fitness = 0;
        }
      });

      // Remove dead
      particles = particles.filter(p => p.fitness > 0);

      // Gen counter
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(72, 79, 88, 0.4)';
      ctx.fillText(`gen ${generation}`, 12, h() - 12);

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  );
}
