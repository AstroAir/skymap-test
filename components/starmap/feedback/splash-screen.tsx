'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Star } from 'lucide-react';

// Pre-generate star data to avoid impure render - optimized for GPU performance
function generateStars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: (i % 4) + 1,
    left: (i * 7.3 + 13) % 100,
    top: (i * 11.7 + 23) % 100,
    duration: 2 + (i % 3),
    delay: (i * 0.13) % 3,
    brightness: 0.3 + (i % 5) * 0.15,
  }));
}

// Generate shooting star data
function generateShootingStars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    startX: 10 + (i * 25) % 60,
    startY: 5 + (i * 15) % 30,
    delay: i * 2.5,
    duration: 3 + (i % 2),
  }));
}

const STARS = generateStars(80);
const SHOOTING_STARS = generateShootingStars(4);

interface SplashScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

export function SplashScreen({ 
  onComplete, 
  minDuration = 2500 
}: SplashScreenProps) {
  const t = useTranslations();
  const [phase, setPhase] = useState<'init' | 'stars' | 'logo' | 'loading' | 'fadeout'>('init');
  const [progress, setProgress] = useState(0);
  
  // Memoize loading messages for variety
  const loadingMessages = useMemo(() => [
    t('splash.loading'),
    t('splash.loadingStars', { defaultValue: 'Loading star catalogs...' }),
    t('splash.loadingEngine', { defaultValue: 'Initializing engine...' }),
  ], [t]);
  
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    // Phase 0: Initial state (0-100ms)
    const timer0 = setTimeout(() => setPhase('stars'), 100);
    
    // Phase 1: Stars appear (100-600ms)
    const timer1 = setTimeout(() => setPhase('logo'), 600);
    
    // Phase 2: Logo appears (600-1400ms)
    const timer2 = setTimeout(() => setPhase('loading'), 1400);
    
    // Phase 3: Loading progress with messages
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 600);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        // Smoother progress with easing
        const remaining = 100 - prev;
        const increment = Math.max(2, remaining * 0.15 + Math.random() * 5);
        return Math.min(prev + increment, 100);
      });
    }, 80);
    
    // Phase 4: Fade out
    const timer3 = setTimeout(() => {
      setPhase('fadeout');
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    }, minDuration - 300);
    
    // Complete
    const timer4 = setTimeout(() => {
      onComplete?.();
    }, minDuration);
    
    return () => {
      clearTimeout(timer0);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [minDuration, onComplete, loadingMessages]);

  const showContent = phase !== 'init';
  const showLogo = phase === 'logo' || phase === 'loading' || phase === 'fadeout';
  const showLoading = phase === 'loading';

  return (
    <div 
      className={cn(
        'fixed inset-0 z-[100] bg-gradient-to-b from-slate-950 via-slate-900 to-black',
        'flex flex-col items-center justify-center overflow-hidden safe-area-inset',
        phase === 'fadeout' && 'splash-fade-out pointer-events-none'
      )}
    >
      {/* Animated Star Field Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Stars layer with GPU-accelerated animations */}
        <div 
          className={cn(
            'absolute inset-0 transition-opacity duration-700',
            showContent ? 'opacity-100' : 'opacity-0'
          )}
        >
          {STARS.map((star) => (
            <div
              key={`star-${star.id}`}
              className="absolute rounded-full bg-white splash-star will-change-transform"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                left: `${star.left}%`,
                top: `${star.top}%`,
                '--twinkle-duration': `${star.duration}s`,
                '--twinkle-delay': `${star.delay}s`,
                opacity: star.brightness,
              } as React.CSSProperties}
            />
          ))}
        </div>
        
        {/* Shooting stars with smooth animation */}
        <div className="absolute inset-0 pointer-events-none">
          {SHOOTING_STARS.map((star) => (
            <div
              key={`shooting-${star.id}`}
              className={cn(
                'absolute h-px bg-gradient-to-r from-transparent via-white to-transparent',
                'splash-shooting-star will-change-transform'
              )}
              style={{
                width: '120px',
                left: `${star.startX}%`,
                top: `${star.startY}%`,
                transform: 'rotate(-45deg)',
                animationDelay: `${star.delay}s`,
                animationDuration: `${star.duration}s`,
              }}
            />
          ))}
        </div>
        
        {/* Nebula glow effect */}
        <div 
          className={cn(
            'absolute w-[500px] h-[500px] rounded-full splash-nebula-glow',
            'bg-gradient-radial from-violet-600/20 via-blue-500/10 to-transparent',
            'transition-opacity duration-1000',
            showContent ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            left: '50%',
            top: '35%',
            transform: 'translate(-50%, -50%)',
            filter: 'blur(60px)',
          }}
        />
        
        {/* Secondary nebula */}
        <div 
          className={cn(
            'absolute w-[300px] h-[300px] rounded-full',
            'bg-gradient-radial from-cyan-500/15 via-transparent to-transparent',
            'transition-opacity duration-1000 delay-300',
            showContent ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            right: '10%',
            bottom: '20%',
            filter: 'blur(50px)',
          }}
        />
      </div>
      
      {/* Logo Container */}
      <div 
        className={cn(
          'relative z-10 flex flex-col items-center px-4',
          showLogo ? 'splash-logo-enter' : 'opacity-0'
        )}
      >
        {/* Animated Logo Icon */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-6 sm:mb-8">
          {/* Pulsing ring effects */}
          <div className="absolute inset-0 rounded-full border border-primary/30 splash-ring-pulse" />
          <div 
            className="absolute inset-0 rounded-full border border-primary/20 splash-ring-pulse"
            style={{ animationDelay: '0.5s' }}
          />
          
          {/* Outer rotating ring */}
          <div 
            className="absolute inset-0 rounded-full border-2 border-primary/40"
            style={{ 
              animation: 'spin 12s linear infinite',
              borderStyle: 'dashed',
            }}
          />
          
          {/* Inner glow ring */}
          <div 
            className="absolute inset-3 rounded-full border border-primary/50 animate-pulse-subtle"
          />
          
          {/* Center star icon with glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <Star 
                className="w-12 h-12 sm:w-14 sm:h-14 text-primary splash-star-spin fill-primary/30"
                strokeWidth={1.5}
              />
              {/* Star glow */}
              <div 
                className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse-subtle"
              />
            </div>
          </div>
          
          {/* Orbiting dots */}
          {[0, 1, 2].map((i) => (
            <div
              key={`orbit-${i}`}
              className="absolute w-2 h-2 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 splash-orbit-dot shadow-lg shadow-blue-400/50"
              style={{
                top: '50%',
                left: '50%',
                animationDelay: `${i * 2}s`,
              }}
            />
          ))}
        </div>
        
        {/* App Name with reveal animation */}
        <h1 
          className={cn(
            'text-3xl sm:text-4xl font-bold text-white mb-2',
            showLogo && 'splash-text-enter'
          )}
          style={{ animationDelay: '0.2s' }}
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
            Sky
          </span>
          <span className="text-white">Map</span>
        </h1>
        
        <p 
          className={cn(
            'text-sm sm:text-base text-slate-400 mb-8 sm:mb-10 text-center opacity-0',
            showLogo && 'splash-text-enter'
          )}
          style={{ animationDelay: '0.4s' }}
        >
          {t('splash.tagline')}
        </p>
        
        {/* Loading Bar with glow effect */}
        <div 
          className={cn(
            'w-48 sm:w-56 transition-all duration-500',
            showLoading ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <div className="relative">
            <Progress 
              value={Math.min(progress, 100)} 
              className="h-1.5 bg-slate-800/80 splash-progress-bar rounded-full overflow-hidden"
            />
            {/* Progress glow overlay */}
            <div 
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: `linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3) ${progress}%, transparent ${progress}%)`,
              }}
            />
          </div>
          
          {/* Loading percentage */}
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-slate-500 transition-opacity duration-300">
              {loadingMessage}
            </p>
            <p className="text-xs text-slate-600 tabular-nums">
              {Math.round(Math.min(progress, 100))}%
            </p>
          </div>
        </div>
      </div>
      
      {/* Version & Credits */}
      <div 
        className={cn(
          'absolute bottom-8 sm:bottom-10 text-center px-4 safe-area-bottom',
          'transition-all duration-700 delay-500',
          showLogo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        <p className="text-[11px] sm:text-xs text-slate-600">
          {t('splash.poweredBy', { defaultValue: 'Powered by Stellarium Web Engine' })}
        </p>
      </div>
    </div>
  );
}
