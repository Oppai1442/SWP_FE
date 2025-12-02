import type { ComponentType, FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  isVisible: boolean;
  message?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?:
    | 'default'
    | 'card'
    | 'inline'
    | 'popup'
    | 'fullscreen'
    | 'spinner'
    | 'dots'
    | 'pulse'
    | 'wave'
    | 'progress'
    | 'minimal';
  position?: 'center' | 'top-right' | 'bottom-right';
  showPercentage?: boolean;
  percentage?: number;
  customIcon?: ComponentType<any>;
}

const SIZE_MAP = {
  xs: { icon: 'h-3.5 w-3.5', text: 'text-xs', spinner: 'h-6 w-6', padding: 'px-3 py-2' },
  sm: { icon: 'h-4 w-4', text: 'text-sm', spinner: 'h-8 w-8', padding: 'px-4 py-3' },
  md: { icon: 'h-5 w-5', text: 'text-base', spinner: 'h-10 w-10', padding: 'px-5 py-4' },
  lg: { icon: 'h-6 w-6', text: 'text-lg', spinner: 'h-14 w-14', padding: 'px-6 py-5' },
  xl: { icon: 'h-7 w-7', text: 'text-xl', spinner: 'h-16 w-16', padding: 'px-8 py-6' },
};

const POSITION_MAP: Record<NonNullable<LoadingProps['position']>, string> = {
  center: 'fixed inset-0 z-50 flex items-center justify-center',
  'top-right': 'fixed top-6 right-6 z-50',
  'bottom-right': 'fixed bottom-6 right-6 z-50',
};

const Loading: FC<LoadingProps> = ({
  isVisible,
  message = 'Loading…',
  size = 'md',
  variant = 'default',
  position = 'center',
  showPercentage = false,
  percentage = 0,
  customIcon,
}) => {
  const [autoProgress, setAutoProgress] = useState(0);

  useEffect(() => {
    if (!isVisible || showPercentage || variant !== 'progress') {
      setAutoProgress(0);
      return;
    }
    const timer = setInterval(() => {
      setAutoProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 60);
    return () => clearInterval(timer);
  }, [isVisible, showPercentage, variant]);

  const currentSize = SIZE_MAP[size];
  const Icon = customIcon ?? Loader2;
  const progressValue = showPercentage ? Math.min(Math.max(percentage, 0), 100) : autoProgress;

  const renderSpinner = (className = currentSize.spinner) => (
    <span className={`relative inline-flex ${className} items-center justify-center`}>
      <span className="absolute inset-0 rounded-full border border-orange-300/30" />
      <Icon className={`${currentSize.icon} animate-spin text-orange-400`} />
    </span>
  );

  const renderDots = () => (
    <span className="flex gap-1">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-2.5 w-2.5 animate-bounce rounded-full bg-orange-400"
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </span>
  );

  const renderContent = () => {
    switch (variant) {
      case 'fullscreen':
        return (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white text-slate-800">
            {renderSpinner('h-20 w-20')}
            <p className="mt-4 text-lg font-medium">{message}</p>
            {showPercentage && (
              <p className="text-sm tracking-wider text-orange-500">{progressValue}%</p>
            )}
          </div>
        );
      case 'popup':
        return (
          <div className={POSITION_MAP[position]}>
            {position === 'center' && <div className="absolute inset-0 bg-black/30" />}
            <div className="relative min-w-[16rem] rounded-2xl border border-orange-200 bg-white px-8 py-6 text-center shadow-2xl">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-50 to-transparent" />
              <div className="relative space-y-4">
                {renderSpinner()}
                <p className="text-sm text-slate-700">{message}</p>
                {showPercentage && (
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                    {progressValue}%
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      case 'card':
        return (
          <div className="w-full rounded-2xl border border-orange-100 bg-white px-8 py-6 text-center shadow-md">
            {renderSpinner()}
            <p className="mt-4 text-sm text-slate-600">{message}</p>
            {showPercentage && (
              <p className="text-xs uppercase tracking-wide text-orange-500">{progressValue}%</p>
            )}
          </div>
        );
      case 'inline':
        return (
          <span className="inline-flex items-center gap-2 text-slate-600">
            <Icon className={`${currentSize.icon} animate-spin text-orange-500`} />
            <span className={`${currentSize.text} font-medium`}>{message}</span>
            {showPercentage && (
              <span className="text-xs uppercase tracking-wide text-orange-500">{progressValue}%</span>
            )}
          </span>
        );
      case 'spinner':
        return (
          <div className="flex items-center gap-3 text-slate-600">
            {renderSpinner()}
            <span className={`${currentSize.text} font-medium`}>{message}</span>
          </div>
        );
      case 'dots':
        return (
          <div className="flex flex-col items-center gap-3 text-slate-600">
            {renderDots()}
            <span className={`${currentSize.text} font-medium`}>{message}</span>
          </div>
        );
      case 'pulse':
        return (
          <div className="flex flex-col items-center gap-3 text-slate-600">
            <span className="h-12 w-12 animate-pulse rounded-full bg-orange-100 shadow-inner shadow-orange-200" />
            <span className={`${currentSize.text} font-medium`}>{message}</span>
          </div>
        );
      case 'wave':
        return (
          <div className="flex flex-col items-center gap-3 text-slate-600">
            <span className="flex items-end gap-1.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <span
                  key={index}
                  className="w-1 rounded-full bg-orange-400"
                  style={{
                    height: `${18 + Math.sin((progressValue / 8 + index) * 0.5) * 12}px`,
                    opacity: 0.4 + Math.sin((progressValue / 10 + index) * 0.5) * 0.4,
                  }}
                />
              ))}
            </span>
            <span className={`${currentSize.text} font-medium`}>{message}</span>
          </div>
        );
      case 'progress':
        return (
          <div className="w-full max-w-sm space-y-2">
            <div className="flex justify-between text-xs uppercase tracking-wide text-slate-500">
              <span>{message}</span>
              <span>{progressValue}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all"
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>
        );
      case 'minimal':
        return (
          <div className="flex items-center gap-3 text-slate-500">
            <span className="h-2 w-10 animate-pulse rounded-full bg-orange-400/50" />
            <span className={`${currentSize.text} font-medium`}>{message}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-4 text-slate-600">
            {renderSpinner()}
            <span className={`${currentSize.text} font-medium`}>{message}</span>
            {showPercentage && (
              <span className="text-xs uppercase tracking-wide text-orange-500">{progressValue}%</span>
            )}
          </div>
        );
    }
  };

  if (!isVisible) return null;

  if (variant === 'fullscreen' || variant === 'popup') {
    return renderContent();
  }

  return (
    <div className="flex items-center justify-center">
      <div className={variant === 'card' ? currentSize.padding : ''}>{renderContent()}</div>
    </div>
  );
};

export default Loading;
