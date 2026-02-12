/**
 * Star field canvas animation hook
 * Manages the animated star field background with twinkling stars and shooting stars
 */

import { useCallback, useEffect, useRef } from 'react';
import type { Star, ShootingStar } from '@/types/landing';
import { generateStars, createShootingStar } from '@/lib/constants/landing';

const STAR_COUNT = 200;
const MAX_SHOOTING_STARS = 2;
const SHOOTING_STAR_SPAWN_CHANCE = 0.005;

export function useStarField(canvasRef: React.RefObject<HTMLCanvasElement | null>, isDark: boolean = true) {
  const animationRef = useRef<number>(0);
  const starsRef = useRef<Star[]>(generateStars(STAR_COUNT));
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const sizeRef = useRef({ width: 0, height: 0 });
  const pausedRef = useRef(false);

  const drawStaticStars = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const { width, height } = sizeRef.current;
    ctx.clearRect(0, 0, width, height);
    starsRef.current.forEach((star) => {
      ctx.beginPath();
      ctx.arc(star.x * width, star.y * height, Math.max(0.5, star.size), 0, Math.PI * 2);
      ctx.fillStyle = isDark
        ? `rgba(255, 255, 255, ${Math.max(0.1, star.opacity)})`
        : `rgba(0, 0, 0, ${Math.max(0.05, star.opacity * 0.4)})`;
      ctx.fill();
    });
  }, [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const stars = starsRef.current;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      sizeRef.current = { width: rect.width, height: rect.height };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // If user prefers reduced motion, draw static stars and stop
    if (prefersReducedMotion.matches) {
      drawStaticStars(canvas, ctx);
      const onMotionChange = (e: MediaQueryListEvent) => {
        if (!e.matches) {
          // User turned off reduced motion, re-run effect
          resizeCanvas();
        }
      };
      prefersReducedMotion.addEventListener('change', onMotionChange);
      return () => {
        window.removeEventListener('resize', resizeCanvas);
        prefersReducedMotion.removeEventListener('change', onMotionChange);
      };
    }

    // Pause animation when tab is not visible
    const onVisibilityChange = () => {
      if (document.hidden) {
        pausedRef.current = true;
        cancelAnimationFrame(animationRef.current);
      } else {
        pausedRef.current = false;
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    let time = 0;

    const animate = () => {
      if (pausedRef.current) return;

      const { width, height } = sizeRef.current;
      ctx.clearRect(0, 0, width, height);

      // Draw stars
      stars.forEach((star) => {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
        const opacity = star.opacity + twinkle * 0.2;
        const size = star.size + twinkle * 0.3;

        ctx.beginPath();
        ctx.arc(
          star.x * width,
          star.y * height,
          Math.max(0.5, size),
          0,
          Math.PI * 2
        );
        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${Math.max(0.1, opacity)})`
          : `rgba(0, 0, 0, ${Math.max(0.05, opacity * 0.4)})`;
        ctx.fill();
      });

      // Manage shooting stars
      if (Math.random() < SHOOTING_STAR_SPAWN_CHANCE && shootingStarsRef.current.length < MAX_SHOOTING_STARS) {
        shootingStarsRef.current.push(createShootingStar());
      }

      // Draw and update shooting stars
      shootingStarsRef.current = shootingStarsRef.current.filter((star: ShootingStar) => {
        const x = star.x * width;
        const y = star.y * height;
        const endX = x + Math.cos(star.angle) * star.length;
        const endY = y + Math.sin(star.angle) * star.length;

        const gradient = ctx.createLinearGradient(x, y, endX, endY);
        if (isDark) {
          gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
          gradient.addColorStop(0.5, `rgba(255, 255, 255, ${star.opacity * 0.8})`);
          gradient.addColorStop(1, `rgba(255, 255, 255, ${star.opacity})`);
        } else {
          gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
          gradient.addColorStop(0.5, `rgba(0, 0, 0, ${star.opacity * 0.3})`);
          gradient.addColorStop(1, `rgba(0, 0, 0, ${star.opacity * 0.4})`);
        }

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Update position
        star.x += (Math.cos(star.angle) * star.speed) / width;
        star.y += (Math.sin(star.angle) * star.speed) / height;
        star.opacity -= 0.01;

        return star.opacity > 0 && star.x < 1.5 && star.y < 1.5;
      });

      time += 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      cancelAnimationFrame(animationRef.current);
    };
  }, [canvasRef, isDark, drawStaticStars]);
}
