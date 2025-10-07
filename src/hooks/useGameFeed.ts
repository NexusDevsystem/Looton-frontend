// hooks/useGameFeed.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Função para obter o dia do ano
const getDayOfYear = (date: Date): number => {
  return Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
};

// Função de embaralhamento com seed baseado no dia
const shuffleWithSeed = (array: any[], seed: number) => {
  const shuffled = [...array];
  let currentIndex = shuffled.length, randomIndex;
  
  // Usar seed para garantir mesmo resultado no mesmo dia
  const seedRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  while (currentIndex > 0) {
    randomIndex = Math.floor(seedRandom(seed + currentIndex) * currentIndex);
    currentIndex--;
    
    // Trocar elementos
    const temp = shuffled[currentIndex];
    shuffled[currentIndex] = shuffled[randomIndex];
    shuffled[randomIndex] = temp;
  }
  
  return shuffled;
};

export function useGameFeed(
  selectedGenres: string[], 
  sortBy: 'best_price' | 'biggest_discount' = 'best_price',
  refreshKey?: number
) {
  const [data, setData] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(0);
  const [hasNextPage, setHasNextPage] = useState(true);

  const genresCsv = selectedGenres.join(',');

  // Função auxiliar para delay exponencial
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchPageWithRetry = async (endpoint: string, maxRetries = 3) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await api<GameFeedResponse | any[]>(endpoint);
        return response;
      } catch (error: any) {
        lastError = error;
        console.log(`⚠️ Tentativa ${attempt} falhou:`, error.message);
        
        if (attempt < maxRetries) {
          // Esperar antes de tentar novamente (delay exponencial)
          await sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }
    
    throw lastError; // Lançar o último erro se todas as tentativas falharem
  };

  const fetchPage = useCallback(async (cursor: number, reset = false) => {
    setLoading(prevLoading => {
      if (prevLoading) return prevLoading; // Se já está carregando, não faça nada
      return true;
    });
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        sortBy,
        limit: '30',
        cursor: cursor.toString()
      });

      if (genresCsv) {
        queryParams.append('genres', genresCsv);
      }

      // Se não há filtros de gênero, usar a rota /deals que funciona sem banco
      // IMPORTANTE: /deals só aceita limit, outros parâmetros podem causar problemas
      const endpoint = genresCsv ? `/games?${queryParams.toString()}` : `/deals?limit=40`; // Equilibrar entre performance e quantidade
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
        let dealsArray = response as any[];
        console.log(`📱 Primeiro deal recebido:`, JSON.stringify(dealsArray[0], null, 2));
        
        // Aplicar rotação diária se não houver filtros ativos
        if (!selectedGenres || selectedGenres.length === 0) {
          const today = new Date();
          const currentDayOfYear = getDayOfYear(today);
          
          // Embaralhar o array de deals com base no dia do ano
          dealsArray = shuffleWithSeed(dealsArray, currentDayOfYear);
          
          console.log(`🎲 Feed de jogos rotacionado para dia ${currentDayOfYear}`);
        }
        
        // Mostrar todos os tipos de conteúdo válidos (jogos, DLCs, pacotes) desde que tenham preço
        console.log(`🎮 Total de deals recebidos: ${dealsArray.length}`);
        const filteredDeals = dealsArray.filter((deal: any) => {
          // Verificar se tem preço válido
          const hasValidPrice = typeof deal.priceFinalCents === 'number' && deal.priceFinalCents >= 0;
          const hasDiscount = typeof deal.discountPct === 'number' && deal.discountPct > 0;
          
          // Manter itens com preço válido e desconto, ou itens gratuitos
          const isValid = hasValidPrice && (hasDiscount || deal.priceFinalCents === 0);
          if (!isValid) {
            console.log(`🎮 Filtrando item sem preço válido: ${deal.game?.title || deal.title} (preço: ${deal.priceFinalCents}, desconto: ${deal.discountPct})`);
          }
          return isValid;
        });
        console.log(`🎮 Após filtro: ${filteredDeals.length} itens válidos, ${dealsArray.length - filteredDeals.length} itens filtrados`);
        
        items = filteredDeals.map((deal: any) => ({
          id: deal._id || deal.appId?.toString(),
          title: deal.game?.title || deal.title,
          coverUrl: deal.game?.coverUrl || deal.image,
          genres: deal.steamGenres || deal.game?.genres || [],
          tags: deal.game?.tags || deal.tags || [],
          priceFinalCents: Math.round((deal.priceFinal || 0) * 100), // Converter para centavos
          discountPct: deal.discountPct,
          store: deal.store?.name || 'Steam',
          url: deal.url
        }));
        
        // Limitar a quantidade de itens para equilibrar performance e variedade
        items = items.slice(0, 30);
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
  }, [genresCsv, sortBy, selectedGenres, refreshKey]);

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