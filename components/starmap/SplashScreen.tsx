'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

// Pre-generate star data to avoid impure render
function generateStars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: (i % 3) + 1,
    left: (i * 7.3 + 13) % 100,
    top: (i * 11.7 + 23) % 100,
    delay: (i * 0.17) % 2,
  }));
}

const STARS = generateStars(100);

interface SplashScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

export function SplashScreen({ 
  onComplete, 
  minDuration = 2500 
}: SplashScreenProps) {
  const t = useTranslations();
  const [phase, setPhase] = useState<'stars' | 'logo' | 'loading' | 'fadeout'>('stars');
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Phase 1: Stars appear (0-500ms)
    const timer1 = setTimeout(() => setPhase('logo'), 500);
    
    // Phase 2: Logo appears (500-1500ms)
    const timer2 = setTimeout(() => setPhase('loading'), 1500);
    
    // Phase 3: Loading progress (1500-2300ms)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 15 + 5;
      });
    }, 100);
    
    // Phase 4: Fade out (2300-2500ms)
    const timer3 = setTimeout(() => {
      setPhase('fadeout');
      clearInterval(progressInterval);
    }, minDuration - 200);
    
    // Complete
    const timer4 = setTimeout(() => {
      onComplete?.();
    }, minDuration);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearInterval(progressInterval);
    };
  }, [minDuration, onComplete]);

  return (
    <div 
      className={cn(
        'fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden transition-opacity duration-300',
        phase === 'fadeout' && 'opacity-0 pointer-events-none'
      )}
    >
      {/* Animated Star Field Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Static stars layer */}
        <div className="absolute inset-0">
          {STARS.map((star) => (
            <div
              key={`star-${star.id}`}
              className={cn(
                'absolute rounded-full bg-white transition-opacity duration-1000',
                phase === 'stars' ? 'opacity-0' : 'opacity-100'
              )}
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                left: `${star.left}%`,
                top: `${star.top}%`,
                animationDelay: `${star.delay}s`,
                animation: 'twinkle 3s ease-in-out infinite',
              }}
            />
          ))}
        </div>
        
        {/* Shooting stars */}
        <div className="absolute inset-0">
          {[...Array(3)].map((_, i) => (
            <div
              key={`shooting-${i}`}
              className="absolute w-[100px] h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
              style={{
                left: `${20 + i * 30}%`,
                top: `${10 + i * 20}%`,
                transform: 'rotate(-45deg)',
                animation: `shootingStar 3s ease-in-out ${i * 1.5}s infinite`,
              }}
            />
          ))}
        </div>
        
        {/* Milky Way glow */}
        <div 
          className={cn(
            'absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent transition-opacity duration-1000',
            phase !== 'stars' ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            transform: 'rotate(-30deg) scale(1.5)',
          }}
        />
        
        {/* Nebula effect */}
        <div 
          className={cn(
            'absolute w-[600px] h-[600px] rounded-full blur-[100px] transition-opacity duration-1500',
            phase !== 'stars' ? 'opacity-30' : 'opacity-0'
          )}
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(59,130,246,0.2) 50%, transparent 70%)',
            left: '50%',
            top: '30%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
      
      {/* Logo Container */}
      <div 
        className={cn(
          'relative z-10 flex flex-col items-center transition-all duration-700',
          phase === 'stars' && 'opacity-0 scale-90',
          phase !== 'stars' && 'opacity-100 scale-100'
        )}
      >
        {/* Animated Telescope/Star Icon */}
        <div className="relative w-24 h-24 mb-6">
          {/* Outer ring */}
          <div 
            className={cn(
              'absolute inset-0 rounded-full border-2 border-primary/50 transition-all duration-1000',
              phase !== 'stars' && 'animate-spin-slow'
            )}
            style={{ animationDuration: '8s' }}
          />
          
          {/* Inner ring */}
          <div 
            className="absolute inset-2 rounded-full border border-primary/30"
            style={{ animation: 'pulse 2s ease-in-out infinite' }}
          />
          
          {/* Center star */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg 
              viewBox="0 0 24 24" 
              className="w-12 h-12 text-primary"
              fill="currentColor"
            >
              <path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 18.26L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z" />
            </svg>
          </div>
          
          {/* Orbiting dots */}
          {[0, 1, 2].map((i) => (
            <div
              key={`orbit-${i}`}
              className="absolute w-2 h-2 rounded-full bg-blue-400"
              style={{
                animation: `orbit 4s linear infinite`,
                animationDelay: `${i * 1.33}s`,
                top: '50%',
                left: '50%',
                transformOrigin: '0 0',
              }}
            />
          ))}
        </div>
        
        {/* App Name */}
        <h1 className="text-3xl font-bold text-white mb-2 tracking-wider">
          <span className="text-primary">Sky</span>Map
        </h1>
        
        <p className="text-sm text-slate-400 mb-8">
          {t('splash.tagline')}
        </p>
        
        {/* Loading Bar */}
        <div 
          className={cn(
            'w-48 h-1 bg-slate-800 rounded-full overflow-hidden transition-opacity duration-300',
            phase === 'loading' ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div 
            className="h-full bg-gradient-to-r from-primary via-blue-400 to-primary rounded-full transition-all duration-200"
            style={{ 
              width: `${Math.min(progress, 100)}%`,
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
            }}
          />
        </div>
        
        {/* Loading Text */}
        <p 
          className={cn(
            'text-xs text-slate-500 mt-3 transition-opacity duration-300',
            phase === 'loading' ? 'opacity-100' : 'opacity-0'
          )}
        >
          {t('splash.loading')}
        </p>
      </div>
      
      {/* Version & Credits */}
      <div 
        className={cn(
          'absolute bottom-8 text-center transition-opacity duration-500',
          phase !== 'stars' ? 'opacity-100' : 'opacity-0'
        )}
      >
        <p className="text-xs text-slate-600">
          Powered by Stellarium Web Engine
        </p>
      </div>
      
      {/* Custom Animations */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        
        @keyframes shootingStar {
          0% { 
            opacity: 0;
            transform: translateX(-100px) translateY(-100px) rotate(-45deg);
          }
          5% {
            opacity: 1;
          }
          15% {
            opacity: 0;
            transform: translateX(200px) translateY(200px) rotate(-45deg);
          }
          100% {
            opacity: 0;
            transform: translateX(200px) translateY(200px) rotate(-45deg);
          }
        }
        
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(48px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(48px) rotate(-360deg);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
