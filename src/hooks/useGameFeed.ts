// hooks/useGameFeed.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export type GameItem = {
  id: string;
  title: string;
  coverUrl?: string;
  genres: string[];
  tags: string[];
  priceFinalCents: number;
  discountPct?: number;
  store: string;
  url: string;
};

export type GameFeedResponse = {
  items: GameItem[];
  nextCursor: number | null;
};

export function useGameFeed(
  selectedGenres: string[], 
  sortBy: 'best_price' | 'biggest_discount' = 'best_price'
) {
  const [data, setData] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(0);
  const [hasNextPage, setHasNextPage] = useState(true);

  const genresCsv = selectedGenres.join(',');

  const fetchPage = useCallback(async (cursor: number, reset = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        sortBy,
        limit: '20',
        cursor: cursor.toString()
      });

      if (genresCsv) {
        queryParams.append('genres', genresCsv);
      }

      const response = await api<GameFeedResponse>(`/games?${queryParams.toString()}`);
      
      if (reset) {
        setData(response.items);
      } else {
        setData(prev => [...prev, ...response.items]);
      }
      
      setNextCursor(response.nextCursor);
      setHasNextPage(response.nextCursor !== null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar jogos');
      console.error('Erro no useGameFeed:', err);
    } finally {
      setLoading(false);
    }
  }, [genresCsv, sortBy, loading]);

  const refresh = useCallback(() => {
    setNextCursor(0);
    setHasNextPage(true);
    fetchPage(0, true);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (nextCursor !== null && hasNextPage && !loading) {
      fetchPage(nextCursor);
    }
  }, [nextCursor, hasNextPage, loading, fetchPage]);

  // Recarregar quando gêneros ou ordenação mudarem
  useEffect(() => {
    refresh();
  }, [genresCsv, sortBy]);

  return {
    data,
    loading,
    error,
    hasNextPage,
    refresh,
    loadMore
  };
}