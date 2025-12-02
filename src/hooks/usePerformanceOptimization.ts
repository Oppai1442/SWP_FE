import { useCallback, useRef, useEffect } from 'react';

interface PerformanceOptions {
  debounceMs?: number;
  throttleMs?: number;
}

export const usePerformanceOptimization = () => {
  const observer = useRef<IntersectionObserver | null>(null);

  const debounceFn = (fn: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  };

  const throttleFn = (fn: Function, delay: number) => {
    let lastRun: number = 0;
    return (...args: any[]) => {
      const now = Date.now();
      if (now - lastRun >= delay) {
        fn(...args);
        lastRun = now;
      }
    };
  };

  const useLazyLoad = (elementRef: React.RefObject<HTMLElement>, options = {}) => {
    useEffect(() => {
      if (!elementRef.current) return;

      observer.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLImageElement;
              if (target.dataset.src) {
                target.src = target.dataset.src;
                observer.current?.unobserve(target);
              }
            }
          });
        },
        { rootMargin: '50px', ...options }
      );

      observer.current.observe(elementRef.current);

      return () => {
        if (observer.current) {
          observer.current.disconnect();
        }
      };
    }, [elementRef, options]);
  };

  const useDebounce = <T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ) => {
    const debouncedFn = useCallback(debounceFn(fn, delay), [fn, delay]);
    return debouncedFn;
  };

  const useThrottle = <T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ) => {
    const throttledFn = useCallback(throttleFn(fn, delay), [fn, delay]);
    return throttledFn;
  };

  return {
    useLazyLoad,
    useDebounce,
    useThrottle,
  };
};

// Memoization helper
export const memoWithProps = <T extends Record<string, any>>(
  obj: T,
  propsToCompare: (keyof T)[]
): boolean => {
  const prev = useRef<Partial<T>>();
  
  if (!prev.current) {
    prev.current = {};
    return true;
  }

  const hasChanged = propsToCompare.some(
    (prop) => prev.current![prop] !== obj[prop]
  );
  
  if (hasChanged) {
    propsToCompare.forEach((prop) => {
      prev.current![prop] = obj[prop];
    });
    return true;
  }

  return false;
};
