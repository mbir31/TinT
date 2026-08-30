/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Player, GameType } from '../types';
import { PLAYER_THEMES } from '../constants/themes';

interface CelebrationEffectsProps {
  winner: Player | null;
  gameType?: GameType;
  reducedMotion?: boolean;
  onFinished?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: 'circle' | 'rect' | 'star' | 'disc' | 'cross';
  alpha: number;
  decay: number;
  gravity: number;
}

export const CelebrationEffects: React.FC<CelebrationEffectsProps> = ({
  winner,
  gameType = 'tictactoe',
  reducedMotion = false,
  onFinished
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!winner) return;

    // Respect system and app prefers-reduced-motion
    const systemReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || systemReducedMotion) {
      // Just call onFinished after a short delay for reduced motion
      const timer = setTimeout(() => {
        onFinished?.();
      }, 2500);
      return () => clearTimeout(timer);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const theme = PLAYER_THEMES[winner.colorKey] || PLAYER_THEMES.blue;
    const colors = [
      theme.primary,
      theme.accent || '#FFD166',
      '#EF476F',
      '#06D6A0',
      '#FFD166',
      '#118AB2',
      '#FFFFFF'
    ];

    const particles: Particle[] = [];
    const count = Math.min(85, Math.floor(width / 14)); // Responsive particle density

    // Generate burst particles from bottom and center
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * (0.15 + Math.random() * 0.7)) * (Math.random() > 0.5 ? 1 : 1);
      const speed = 7 + Math.random() * 12;
      const isLeft = Math.random() > 0.5;

      let shape: Particle['shape'] = 'circle';
      if (gameType === 'tictactoe') {
        shape = Math.random() > 0.5 ? 'cross' : Math.random() > 0.5 ? 'circle' : 'star';
      } else if (gameType === 'dotsboxes') {
        shape = Math.random() > 0.5 ? 'rect' : 'star';
      } else {
        shape = Math.random() > 0.5 ? 'disc' : 'star';
      }

      particles.push({
        x: isLeft ? width * 0.15 + (Math.random() * 60 - 30) : width * 0.85 + (Math.random() * 60 - 30),
        y: height * 0.85,
        vx: (isLeft ? 1 : -1) * Math.cos(angle) * speed + (Math.random() * 4 - 2),
        vy: -Math.sin(angle) * speed - (Math.random() * 4),
        size: 7 + Math.random() * 9,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.18,
        shape,
        alpha: 1,
        decay: 0.006 + Math.random() * 0.007,
        gravity: 0.24 + Math.random() * 0.08
      });
    }

    let animationFrameId: number;
    let isRunning = true;

    const drawStar = (
      c: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      spikes: number,
      outerRadius: number,
      innerRadius: number
    ) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      c.beginPath();
      c.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        c.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        c.lineTo(x, y);
        rot += step;
      }
      c.lineTo(cx, cy - outerRadius);
      c.closePath();
      c.fill();
    };

    const render = () => {
      if (!isRunning || !ctx) return;

      ctx.clearRect(0, 0, width, height);

      let aliveCount = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.alpha <= 0.01) continue;

        aliveCount++;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.985;
        p.rotation += p.rotationSpeed;
        p.alpha = Math.max(0, p.alpha - p.decay);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.strokeStyle = '#073B4C';
        ctx.lineWidth = 1.5;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
          ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        } else if (p.shape === 'disc' || p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          // Inner gloss
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(-p.size * 0.15, -p.size * 0.15, p.size * 0.18, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'star') {
          drawStar(ctx, 0, 0, 5, p.size * 0.7, p.size * 0.35);
          ctx.stroke();
        } else if (p.shape === 'cross') {
          ctx.lineWidth = 3;
          ctx.strokeStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(-p.size / 2, -p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.moveTo(p.size / 2, -p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      if (aliveCount > 0) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        isRunning = false;
        onFinished?.();
      }
    };

    animationFrameId = requestAnimationFrame(render);

    const safetyTimer = setTimeout(() => {
      isRunning = false;
      onFinished?.();
    }, 4000);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      clearTimeout(safetyTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [winner, gameType, reducedMotion, onFinished]);

  if (!winner) return null;

  return (
    <div
      id="celebration-particles-layer"
      className="fixed inset-0 pointer-events-none z-45 overflow-hidden"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
