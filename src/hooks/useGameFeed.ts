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
    setLoading(prevLoading => {
      if (prevLoading) return prevLoading; // Se já está carregando, não faça nada
      return true;
    });
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

      // Se não há filtros de gênero, usar a rota /deals que funciona sem banco
      // IMPORTANTE: /deals só aceita limit, outros parâmetros podem causar problemas
      const endpoint = genresCsv ? `/games?${queryParams.toString()}` : `/deals?limit=20`;
      console.log(`🔄 Chamando endpoint: ${endpoint}`);
      const response = await api<GameFeedResponse | any[]>(endpoint);
      
      // Normalizar resposta baseado no endpoint usado
      let items: GameItem[];
      let nextCursor: number | null;
      
      if (genresCsv) {
        // Resposta do /games
        const gameResponse = response as GameFeedResponse;
        items = gameResponse.items;
        nextCursor = gameResponse.nextCursor;
      } else {
        // Resposta do /deals - converter para o formato esperado
        const dealsArray = response as any[];
        console.log(`📱 Primeiro deal recebido:`, JSON.stringify(dealsArray[0], null, 2));
        items = dealsArray.map((deal: any) => ({
          id: deal._id || deal.appId?.toString(),
          title: deal.game?.title || deal.title,
          coverUrl: deal.game?.coverUrl || deal.image,
          genres: deal.steamGenres || deal.game?.genres || [],
          tags: deal.game?.tags || deal.tags || [],
          priceFinalCents: deal.priceFinalCents,
          discountPct: deal.discountPct,
          store: deal.store?.name || 'Steam',
          url: deal.url
        }));
        nextCursor = null; // /deals não implementa paginação ainda
      }
      
      if (reset) {
        setData(items);
      } else {
        setData(prev => [...prev, ...items]);
      }
      
      setNextCursor(nextCursor);
      setHasNextPage(nextCursor !== null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar jogos');
      console.error('Erro no useGameFeed:', err);
    } finally {
      setLoading(false);
    }
  }, [genresCsv, sortBy]);

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
    setNextCursor(0);
    setHasNextPage(true);
    fetchPage(0, true);
  }, [genresCsv, sortBy, fetchPage]);

  return {
    data,
    loading,
    error,
    hasNextPage,
    refresh,
    loadMore
  };
}