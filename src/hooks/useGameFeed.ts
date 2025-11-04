// hooks/useGameFeed.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { fetchEpicGames } from '../api/epic-client';
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
  releaseDate?: string; // Data de lançamento
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
      // Primeiro buscar os jogos da Epic Games para colocar no topo
      const epicGames = await fetchEpicGames();
      
      const queryParams = new URLSearchParams({
        sortBy,
        limit: '100',
        cursor: cursor.toString()
      });

      if (genresCsv) {
        queryParams.append('genres', genresCsv);
      }

      // Usar a rota /deals para ofertas com rotação diária ativada
      // Isso garante que os usuários vejam ofertas diferentes a cada dia
      const endpoint = `/deals?limit=500&useDailyRotation=true`;
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
        
        // REMOVIDO: Rotação diária - agora o ranking faz o trabalho de ordenação
        // O RankingService vai organizar os itens baseado nas preferências do usuário
        
        // Lista de títulos conhecidos que devem ser filtrados (não disponíveis na Steam mais)
        const titlesToFilter = [
          'DOOM',
          'DOOM Eternal', 
          'Doom',
          'Doom Eternal',
          'Paladins',
          'Nexomon',
          'Subnautica Below Zero Demo',
          'VRChat Demo',
          // Correção específica: Assassin's Creed Black Flag - Golden Edition não existe, apenas Assassin's Creed IV Black Flag
          'Assassin\'s Creed Black Flag - Golden Edition',
          'Assassin\'s Creed Black Flag Golden Edition',
          'Assassin\'s Creed IV Black Flag - Gold Edition', // Outra variação possível
          'Assassin\'s Creed IV Black Flag Gold Edition',  // Outra variação possível
        ].map(title => title.toLowerCase());
        
        // Função para verificar se um título deve ser filtrado
        const shouldFilterTitle = (title: string) => {
          if (!title) return false;
          const lowerTitle = title.toLowerCase();
          return titlesToFilter.some(filterTitle => lowerTitle.includes(filterTitle));
        };
        
        // Função para verificar se um item tem informações suficientes para ser exibido
        const hasSufficientInfo = (item: any) => {
          // Verificar se tem título
          if (!item.game?.title && !item.title) return false;
          
          // Verificar se tem URL válida (deve conter steam)
          if (!item.url || !item.url.includes('store.steampowered.com') && !item.url.includes('steamcommunity.com')) {
            return false;
          }
          
          // Verificar se tem appId válido (pode ser número ou string no formato "app:123456")
          if (item.appId) {
            let appIdIsValid = true;
            
            if (typeof item.appId === 'string') {
              if (item.appId.includes(':')) {
                // Verificar se o appId está no formato "app:123456" e o número é válido
                const parts = item.appId.split(':');
                const appIdNumber = parseInt(parts[1], 10);
                appIdIsValid = !isNaN(appIdNumber) && appIdNumber > 0;
              } else {
                // Verificar se a string é um número válido
                const appIdNumber = parseInt(item.appId, 10);
                appIdIsValid = !isNaN(appIdNumber) && appIdNumber > 0;
              }
            } else if (typeof item.appId === 'number') {
              // Verificar se o número é válido
              appIdIsValid = !isNaN(item.appId) && item.appId > 0;
            } else {
              appIdIsValid = false;
            }
            
            if (!appIdIsValid) {
              console.log(`🎮 Filtrando item por appId inválido: ${item.game?.title || item.title} (${item.appId})`);
              return false;
            }
          }
          
          return true;
        };
        
        // Mostrar todos os tipos de conteúdo válidos (jogos, DLCs, pacotes) desde que tenham preço
        console.log(`🎮 Total de deals recebidos: ${dealsArray.length}`);
        const filteredDeals = dealsArray.filter((deal: any) => {
          // Verificar se tem informações suficientes
          if (!hasSufficientInfo(deal)) {
            console.log(`🎮 Filtrando item por informações insuficientes: ${deal.game?.title || deal.title}`);
            return false;
          }
          
          // Verificar se tem preço válido
          const hasValidPrice = typeof deal.priceFinalCents === 'number' && deal.priceFinalCents >= 0;
          const hasDiscount = typeof deal.discountPct === 'number' && deal.discountPct > 0;
          
          // Verificar se o título deve ser filtrado
          const title = deal.game?.title || deal.title;
          const isTitleToFilter = shouldFilterTitle(title);
          
          // Manter itens com preço válido e desconto, ou itens gratuitos, que têm informações suficientes e não estão na lista de exclusão
          const isValid = hasValidPrice && (hasDiscount || deal.priceFinalCents === 0) && !isTitleToFilter;
          if (!isValid) {
            if (isTitleToFilter) {
              console.log(`🎮 Filtrando item por título conhecido como removido: ${title}`);
            } else {
              console.log(`🎮 Filtrando item sem preço válido: ${title} (preço: ${deal.priceFinalCents}, desconto: ${deal.discountPct})`);
            }
          }
          return isValid;
        });
        console.log(`🎮 Após filtro: ${filteredDeals.length} itens válidos, ${dealsArray.length - filteredDeals.length} itens filtrados`);
        
        const steamItems = filteredDeals.map((deal: any) => ({
          id: deal._id || deal.appId?.toString(),
          title: deal.game?.title || deal.title,
          coverUrl: deal.game?.coverUrl || deal.image,
          genres: deal.steamGenres || deal.game?.genres || [],
          tags: deal.game?.tags || deal.tags || [],
          priceFinalCents: Math.round((deal.priceFinal || 0) * 100), // Converter para centavos
          discountPct: deal.discountPct,
          store: deal.store?.name || 'Steam',
          url: deal.url,
          releaseDate: deal.releaseDate, // Adicionando a data de lançamento
          // Adicionar campos necessários para o ranking
          _id: deal._id || deal.appId?.toString(),
          game: deal.game,
          steamGenres: deal.steamGenres,
          priceFinal: deal.priceFinal || 0,
          priceBase: deal.priceBase || 0,
          score: deal.score,
          popularity: deal.popularity,
          trending: deal.trending,
        }));
        
        // Combinar os jogos da Epic Games com os da Steam
        let combinedItems = [...epicGames, ...steamItems];
        
        // Ordenar com hierarquia de relevância:
        // 1. Jogos grátis da Epic sempre no topo (priceFinalCents === 0 e store === 'Epic')
        // 2. Jogos com maior desconto e popularidade (score/trending/popularity)
        // 3. Jogos mais recentes com desconto
        combinedItems.sort((a, b) => {
          // 1. Epic grátis sempre primeiro
          const aIsEpicFree = a.store === 'Epic' && a.priceFinalCents === 0;
          const bIsEpicFree = b.store === 'Epic' && b.priceFinalCents === 0;
          
          if (aIsEpicFree && !bIsEpicFree) return -1;
          if (!aIsEpicFree && bIsEpicFree) return 1;
          
          // 2. Se ambos são Epic grátis, manter ordem original
          if (aIsEpicFree && bIsEpicFree) return 0;
          
          // 3. Priorizar jogos com maior desconto (maior relevância para o usuário)
          const discountDiff = (b.discountPct || 0) - (a.discountPct || 0);
          if (Math.abs(discountDiff) > 10) return discountDiff; // Diferença significativa de desconto
          
          // 4. Usar score/popularity/trending se disponível
          const aScore = (a as any).score || (a as any).popularity || (a as any).trending || 0;
          const bScore = (b as any).score || (b as any).popularity || (b as any).trending || 0;
          
          if (bScore - aScore !== 0) return bScore - aScore;
          
          // 5. Jogos grátis (não Epic) têm prioridade sobre pagos
          const aIsFree = a.priceFinalCents === 0;
          const bIsFree = b.priceFinalCents === 0;
          
          if (aIsFree && !bIsFree) return -1;
          if (!aIsFree && bIsFree) return 1;
          
          // 6. Por último, manter ordem original (que já vem do backend com alguma relevância)
          return 0;
        });
        
        items = combinedItems;
        
        // Limitar a 40 itens conforme especificação do sistema de preferências
        // O ranking já foi aplicado, então pegamos os top 40
        items = items.slice(0, 40);
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