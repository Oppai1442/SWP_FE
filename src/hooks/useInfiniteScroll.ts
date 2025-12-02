import { useEffect, useRef, useState, useCallback } from 'react';
import { useApiQuery } from './useApi';

interface UseInfiniteScrollOptions<T> {
  queryKey: string[];
  apiUrl: string;
  pageSize?: number;
  threshold?: number;
}

export const useInfiniteScroll = <T>({
  queryKey,
  apiUrl,
  pageSize = 10,
  threshold = 100,
}: UseInfiniteScrollOptions<T>) => {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLElement | null>(null);

  const { data, isLoading, error } = useApiQuery<{ data: T[]; total: number }>(
    [...queryKey, page.toString()],
    `${apiUrl}?page=${page}&limit=${pageSize}`,
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
      onSuccess: (response) => {
        setHasMore(response.data.length === pageSize);
      },
    }
  );

  const allData = useRef<T[]>([]);
  
  useEffect(() => {
    if (data?.data) {
      if (page === 1) {
        allData.current = data.data;
      } else {
        allData.current = [...allData.current, ...data.data];
      }
    }
  }, [data, page]);

  const lastElementCallback = useCallback(
    (node: HTMLElement | null) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            setPage((prevPage) => prevPage + 1);
          }
        },
        {
          rootMargin: `${threshold}px`,
        }
      );

      if (node) {
        lastElementRef.current = node;
        observer.current.observe(node);
      }
    },
    [isLoading, hasMore, threshold]
  );

  const reset = useCallback(() => {
    setPage(1);
    setHasMore(true);
    allData.current = [];
  }, []);

  return {
    data: allData.current,
    isLoading,
    error,
    hasMore,
    lastElementCallback,
    reset,
  };
};
