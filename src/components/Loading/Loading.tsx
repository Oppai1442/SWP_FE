import React, { useState, useEffect } from 'react';
import { 
  Loader2, Loader, RotateCw, RefreshCw, CircleDashed, 
  Clock, Zap, Heart, Star, Sun, Moon, Coffee, Wifi,
  Download, Upload, Search, Play, Pause, ArrowRight
} from 'lucide-react';

interface LoadingProps {
  isVisible: boolean;
  message?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'card' | 'inline' | 'popup' | 'fullscreen' | 'spinner' | 'dots' | 'pulse' | 'wave' | 'progress' | 'minimal';
  position?: 'center' | 'top-right' | 'bottom-right';
  showPercentage?: boolean;
  percentage?: number;
  customIcon?: React.ComponentType<any>;
}

const Loading: React.FC<LoadingProps> = ({ 
  isVisible, 
  message = "Đang tải...", 
  size = 'md',
  variant = 'default',
  position = 'center',
  showPercentage = false,
  percentage = 0,
  customIcon
}) => {
  const [progress, setProgress] = useState(0);
  const [particles, setParticles] = useState<Array<{x: number, y: number, delay: number}>>([]);

  const sizes = {
    xs: { icon: 'w-3 h-3', text: 'text-xs', container: 'p-3', spinner: 'w-8 h-8' },
    sm: { icon: 'w-4 h-4', text: 'text-sm', container: 'p-4', spinner: 'w-10 h-10' },
    md: { icon: 'w-5 h-5', text: 'text-base', container: 'p-6', spinner: 'w-12 h-12' },
    lg: { icon: 'w-6 h-6', text: 'text-lg', container: 'p-8', spinner: 'w-16 h-16' },
    xl: { icon: 'w-8 h-8', text: 'text-xl', container: 'p-10', spinner: 'w-20 h-20' }
  };

  const positionClasses = {
    center: 'fixed inset-0 flex items-center justify-center z-50',
    'top-right': 'fixed top-6 right-6 z-50',
    'bottom-right': 'fixed bottom-6 right-6 z-50'
  };

  useEffect(() => {
    if (!isVisible) return;

    const particleArray = Array.from({ length: 12 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3
    }));
    setParticles(particleArray);

    if (variant === 'progress' && !showPercentage) {
      const interval = setInterval(() => {
        setProgress(prev => (prev >= 100 ? 0 : prev + 1));
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isVisible, variant, showPercentage]);
  
  if (!isVisible) return null;

  const CurrentIcon = customIcon || Loader2;
  const currentSize = sizes[size];
  const displayPercentage = showPercentage ? percentage : progress;

  // Fullscreen variant
  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 bg-gray-950 z-50 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-cyan-500/5"></div>
        
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animation: `float 6s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}

        <div className="relative text-center">
          <div className="relative inline-block mb-8">
            <div className={`${currentSize.spinner} relative`}>
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20"></div>
              <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin"></div>
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/10 animate-ping"></div>
            </div>
          </div>
          
          <p className="text-gray-300 font-light text-lg mb-2">{message}</p>
          
          {showPercentage && (
            <p className="text-cyan-400 text-sm font-light">{percentage}%</p>
          )}
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
            50% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
          }
        `}</style>
      </div>
    );
  }

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-3">
        <div className={`relative ${currentSize.spinner}`}>
          <div className="absolute inset-0 rounded-full border border-gray-800"></div>
          <div className="absolute inset-0 rounded-full border-t border-cyan-400 animate-spin"></div>
        </div>
        <span className="text-gray-300 font-light text-sm">{message}</span>
      </div>
    );
  }

  // Spinner variant
  if (variant === 'spinner') {
    return (
      <div className="flex items-center justify-center gap-3">
        <div className={`relative ${currentSize.spinner}`}>
          <div className="absolute inset-0 rounded-full border-2 border-gray-800/50"></div>
          <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/10 to-transparent animate-pulse"></div>
        </div>
        <span className="text-gray-300 font-light text-sm">{message}</span>
      </div>
    );
  }

  // Dots variant
  if (variant === 'dots') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div 
              key={i}
              className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            ></div>
          ))}
        </div>
        <span className="text-gray-300 font-light text-sm">{message}</span>
      </div>
    );
  }

  // Pulse variant
  if (variant === 'pulse') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className={`${currentSize.spinner} bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full animate-pulse shadow-lg shadow-cyan-500/30`}></div>
        <span className="text-gray-300 font-light text-sm">{message}</span>
      </div>
    );
  }

  // Wave variant
  if (variant === 'wave') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className="w-1 bg-cyan-400 rounded-full transition-all duration-300"
              style={{
                height: `${20 + Math.sin((progress / 10 + i) * 0.5) * 15}px`,
                opacity: 0.5 + Math.sin((progress / 10 + i) * 0.5) * 0.5
              }}
            ></div>
          ))}
        </div>
        <span className="text-gray-300 font-light text-sm">{message}</span>
      </div>
    );
  }

  // Progress variant
  if (variant === 'progress') {
    return (
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-300 font-light text-sm">{message}</span>
          <span className="text-cyan-400 font-light text-sm">{displayPercentage}%</span>
        </div>
        <div className="relative w-full h-1.5 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full transition-all duration-300 ease-out shadow-lg shadow-cyan-500/30"
            style={{ width: `${displayPercentage}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Popup variant
  if (variant === 'popup') {
    return (
      <div className={positionClasses[position]}>
        {position === 'center' && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        )}
        
        <div className="relative bg-gray-900/90 backdrop-blur-md border border-gray-800/50 rounded-2xl shadow-2xl shadow-black/50 min-w-80 max-w-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent pointer-events-none"></div>
          
          <div className={`relative ${currentSize.container} flex flex-col items-center gap-6`}>
            <div className="relative">
              <div className={`${currentSize.spinner} rounded-full bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-cyan-500/20`}>
                <CurrentIcon className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
              <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-ping"></div>
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-white font-light text-base">{message}</p>
              
              {showPercentage && (
                <p className="text-cyan-400 text-sm font-light">{percentage}%</p>
              )}
              
              <div className="flex items-center justify-center gap-1.5 pt-2">
                {[0, 1, 2].map((i) => (
                  <div 
                    key={i}
                    className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 150}ms` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <div className="relative bg-gray-900/80 backdrop-blur-md border border-gray-800/50 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent pointer-events-none"></div>
        
        <div className={`relative ${currentSize.container} flex flex-col items-center justify-center gap-5 min-h-40`}>
          <div className="relative">
            <div className={`${currentSize.spinner} rounded-xl bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-cyan-500/20`}>
              <CurrentIcon className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
          </div>
          
          <p className="text-gray-300 font-light text-sm text-center">{message}</p>
          
          {showPercentage && (
            <p className="text-cyan-400 text-xs font-light">{percentage}%</p>
          )}
        </div>
      </div>
    );
  }

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className="inline-flex items-center gap-3">
        <CurrentIcon className={`${currentSize.icon} text-cyan-400 animate-spin`} />
        <span className="text-gray-300 font-light text-sm">{message}</span>
        {showPercentage && (
          <span className="text-cyan-400 font-light text-sm">{percentage}%</span>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className="flex items-center justify-center gap-4 py-6">
      <div className="relative">
        <div className={`absolute inset-0 rounded-full border border-cyan-500/20 animate-pulse`}></div>
        <CurrentIcon className={`${currentSize.icon} text-cyan-400 animate-spin relative z-10`} />
      </div>
      <span className="text-gray-300 font-light text-sm">{message}</span>
      {showPercentage && (
        <span className="text-cyan-400 font-light text-sm">{percentage}%</span>
      )}
    </div>
  );
};

export default Loading;
