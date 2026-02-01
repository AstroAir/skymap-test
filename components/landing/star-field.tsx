'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  angle: number;
}

function generateStars(count: number): Star[] {
  const result: Star[] = [];
  for (let i = 0; i < count; i++) {
    result.push({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      twinkleOffset: Math.random() * Math.PI * 2,
    });
  }
  return result;
}

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const starsRef = useRef<Star[]>(generateStars(200));
  const shootingStarsRef = useRef<ShootingStar[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stars = starsRef.current;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let time = 0;

    const createShootingStar = (): ShootingStar => ({
      x: Math.random() * 0.5,
      y: Math.random() * 0.3,
      length: Math.random() * 80 + 40,
      speed: Math.random() * 4 + 2,
      opacity: 1,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
    });

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Draw stars
      stars.forEach((star) => {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
        const opacity = star.opacity + twinkle * 0.2;
        const size = star.size + twinkle * 0.3;

        ctx.beginPath();
        ctx.arc(
          star.x * rect.width,
          star.y * rect.height,
          Math.max(0.5, size),
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, opacity)})`;
        ctx.fill();
      });

      // Manage shooting stars
      if (Math.random() < 0.005 && shootingStarsRef.current.length < 2) {
        shootingStarsRef.current.push(createShootingStar());
      }

      // Draw and update shooting stars
      shootingStarsRef.current = shootingStarsRef.current.filter((star: ShootingStar) => {
        const x = star.x * rect.width;
        const y = star.y * rect.height;
        const endX = x + Math.cos(star.angle) * star.length;
        const endY = y + Math.sin(star.angle) * star.length;

        const gradient = ctx.createLinearGradient(x, y, endX, endY);
        gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${star.opacity * 0.8})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${star.opacity})`);

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Update position
        star.x += (Math.cos(star.angle) * star.speed) / rect.width;
        star.y += (Math.sin(star.angle) * star.speed) / rect.height;
        star.opacity -= 0.01;

        return star.opacity > 0 && star.x < 1.5 && star.y < 1.5;
      });

      time += 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ background: 'transparent' }}
    />
  );
}
