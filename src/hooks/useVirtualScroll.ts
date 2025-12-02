import { useEffect, useRef, useState, useMemo } from 'react';

interface UseVirtualScrollOptions {
  itemHeight: number;
  overscan?: number;
  containerHeight: number;
}

export const useVirtualScroll = <T>(
  items: T[],
  { itemHeight, overscan = 3, containerHeight }: UseVirtualScrollOptions
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = useMemo(() => items.length * itemHeight, [items.length, itemHeight]);
  
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    
    const rangeStart = Math.max(0, start - overscan);
    const rangeEnd = Math.min(items.length, start + visibleCount + overscan);
    
    return {
      start: rangeStart,
      end: rangeEnd,
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: index + visibleRange.start,
      style: {
        position: 'absolute',
        top: (index + visibleRange.start) * itemHeight,
        height: itemHeight,
        left: 0,
        right: 0,
      },
    }));
  }, [items, visibleRange, itemHeight]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === container) {
          setScrollTop(container.scrollTop);
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  return {
    containerProps: {
      ref: containerRef,
      onScroll,
      style: {
        height: containerHeight,
        overflow: 'auto',
        position: 'relative' as const,
      },
    },
    totalHeight,
    visibleItems,
  };
};
