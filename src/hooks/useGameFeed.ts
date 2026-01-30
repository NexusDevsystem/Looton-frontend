// hooks/useGameFeed.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';
import { fetchEpicGames } from '../api/epic-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type GameItem = {
  id: string;
  appId?: number; // appId numérico para o modal de detalhes
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

// Palavras-chave EXATAS para identificar DLCs, pacotes e conteúdos adicionais
// IMPORTANTE: Usar apenas termos muito específicos para evitar falsos positivos
const DLC_EXACT_KEYWORDS = [
  'soundtrack', 'ost', 'season pass', 'expansion pass', 'expansion pack',
  'character pack', 'weapon pack', 'skin pack', 'map pack', 'booster pack',
  'artbook', 'art book', 'wallpaper pack', 'deluxe upgrade', 'gold upgrade',
  'premium upgrade', 'ultimate upgrade', 'digital deluxe upgrade'
];

// Padrões que indicam DLC quando combinados com " - " no título
const DLC_SUFFIX_PATTERNS = [
  'dlc', 'expansion', 'soundtrack', 'ost', 'season pass', 'add-on', 'addon'
];

// Função para verificar se um item é DLC/pacote/conteúdo adicional
const isDLCOrPackage = (item: any): boolean => {
  // 1. Verificar pelo campo kind (mais confiável)
  if (item.kind && item.kind !== 'game') {
    return true;
  }

  // 2. Verificar pelo título
  const title = (item.title || item.game?.title || item.name || '').toLowerCase();

  // 2a. Verificar palavras-chave exatas
  for (const keyword of DLC_EXACT_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(title)) {
      return true;
    }
  }

  // 2b. Verificar padrão "Game Name - DLC/Expansion/etc"
  if (title.includes(' - ')) {
    for (const pattern of DLC_SUFFIX_PATTERNS) {
      const regex = new RegExp(`\\b${pattern}\\b`, 'i');
      if (regex.test(title)) {
        return true;
      }
    }
  }

  return false;
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

  // Ref para armazenar dados completos do cache para paginação local
  const cachedDataRef = useRef<GameItem[]>([]);

  const genresCsv = selectedGenres.join(',');

  // Função para gerar a chave do cache baseada no dia atual
  const getCacheKey = () => {
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return `game-feed-cache-${dateKey}-${genresCsv}-${sortBy}`;
  };

  // Função para limpar caches antigos
  const clearOldCaches = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith('game-feed-cache-'));
      const currentKey = getCacheKey();

      // Remover todos os caches exceto o do dia atual
      const keysToRemove = cacheKeys.filter(key => key !== currentKey);
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        if (__DEV__) console.log(`🗑️ Removidos ${keysToRemove.length} caches antigos`);
      }
    } catch (error) {
      if (__DEV__) console.error('Erro ao limpar caches antigos:', error);
    }
  };

  // Função para salvar dados no cache
  const saveToCache = async (items: GameItem[]) => {
    try {
      const cacheKey = getCacheKey();
      await AsyncStorage.setItem(cacheKey, JSON.stringify(items));
      if (__DEV__) console.log(`💾 Dados salvos no cache: ${cacheKey}`);

      // Limpar caches antigos após salvar
      clearOldCaches();
    } catch (error) {
      if (__DEV__) console.error('Erro ao salvar cache:', error);
    }
  };

  // Função para carregar dados do cache
  const loadFromCache = async (): Promise<GameItem[] | null> => {
    try {
      const cacheKey = getCacheKey();
      const cached = await AsyncStorage.getItem(cacheKey);

      if (cached) {
        const items = JSON.parse(cached);
        if (__DEV__) console.log(`📦 Dados carregados do cache: ${items.length} itens`);
        return items;
      }

      return null;
    } catch (error) {
      if (__DEV__) console.error('Erro ao carregar cache:', error);
      return null;
    }
  };

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
        if (__DEV__) console.log(`⚠️ Tentativa ${attempt} falhou:`, error.message);
        
        if (attempt < maxRetries) {
          // Esperar antes de tentar novamente (delay exponencial)
          await sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }
    
    throw lastError; // Lançar o último erro se todas as tentativas falharem
  };

  const fetchPage = useCallback(async (cursor: number, reset = false, forceRefresh = false) => {
    setLoading(prevLoading => {
      if (prevLoading) return prevLoading; // Se já está carregando, não faça nada
      return true;
    });
    setError(null);

    try {
      // Sempre buscar jogos da Epic Games frescos (mesmo se tiver cache)
      if (__DEV__) console.log(`🎮 Buscando jogos da Epic Games...`);
      const epicGames = await fetchEpicGames();
      if (__DEV__) console.log(`✅ Epic Games: ${epicGames.length} jogos encontrados`);

      // Se é o cursor 0 (primeira página) e não é um force refresh, tentar carregar do cache
      if (cursor === 0 && !forceRefresh) {
        const cachedData = await loadFromCache();
        if (cachedData && cachedData.length > 0) {
          if (__DEV__) console.log(`💾 Cache encontrado: ${cachedData.length} itens`);

          // Remover jogos da Epic do cache (podem estar desatualizados)
          const steamOnlyCache = cachedData.filter(item => item.store !== 'Epic');
          if (__DEV__) console.log(`🎮 Steam do cache: ${steamOnlyCache.length} jogos`);

          // Combinar Epic Games frescos com Steam do cache
          const combinedData = [...epicGames, ...steamOnlyCache];
          if (__DEV__) console.log(`✅ Total combinado: ${combinedData.length} jogos`);

          // Paginar os dados combinados localmente (100 itens por página)
          const pageSize = 100;
          const startIndex = 0;
          const endIndex = pageSize;
          const paginatedData = combinedData.slice(startIndex, endIndex);

          setData(paginatedData);
          setNextCursor(combinedData.length > pageSize ? 1 : null);
          setHasNextPage(combinedData.length > pageSize);
          setLoading(false);

          if (__DEV__) console.log(`📄 Primeira página do cache: ${paginatedData.length} jogos (de ${combinedData.length} total)`);

          // Armazenar referência aos dados completos do cache para paginação
          cachedDataRef.current = combinedData;

          return;
        }
      }

      if (__DEV__) console.log(`🌐 Buscando novos dados do backend...`);
      
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
      const endpoint = `/deals?limit=1000&useDailyRotation=false`;
      if (__DEV__) console.log(`🔄 Chamando endpoint: ${endpoint}`);
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
        if (__DEV__) console.log(`📱 Primeiro deal recebido:`, JSON.stringify(dealsArray[0], null, 2));
        
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
          // Verificar se tem título (pode estar em diferentes campos)
          const hasTitle = item.game?.title || item.title || item.name || item.game?.name;
          if (!hasTitle) {
            if (__DEV__) console.log(`🎮 Filtrando jogo sem título:`, JSON.stringify({ appId: item.appId || item._id, game: { title: item.game?.title }, url: item.url }));
            return false;
          }
          
          // Verificar se tem URL válida (Steam, Epic ou outras lojas válidas)
          if (!item.url) {
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
              if (__DEV__) console.log(`🎮 Filtrando item por appId inválido: ${item.game?.title || item.title} (${item.appId})`);
              return false;
            }
          }
          
          return true;
        };
        
        // Mostrar todos os tipos de conteúdo válidos (jogos, DLCs, pacotes) desde que tenham preço
        if (__DEV__) console.log(`🎮 Total de deals recebidos: ${dealsArray.length}`);

        // Contadores para debug
        let filteredNoTitle = 0;
        let filteredNoInfo = 0;
        let filteredUtility = 0;
        let filteredAdult = 0;
        let filteredNoPrice = 0;
        let filteredBlacklist = 0;

        const filteredDeals = dealsArray.filter((deal: any) => {
          // Verificar se tem informações suficientes
          if (!hasSufficientInfo(deal)) {
            filteredNoInfo++;
            return false;
          }

          // Verificar se tem preço válido (priceFinal vem em reais do backend)
          const price = deal.priceFinal ?? deal.priceFinalCents;
          const hasValidPrice = typeof price === 'number' && price >= 0;
          const hasDiscount = typeof deal.discountPct === 'number' && deal.discountPct > 0;

          // Aceitar jogos:
          // 1. Com desconto (qualquer valor)
          // 2. Grátis (price = 0)
          // 3. Com preço até R$ 200 (mesmo sem desconto) - top sellers e lançamentos
          const isAcceptablePrice = hasDiscount || price === 0 || (hasValidPrice && price > 0 && price <= 200);

          // Verificar se o título deve ser filtrado
          const title = deal.game?.title || deal.title || deal.name || deal.game?.name;
          const isTitleToFilter = shouldFilterTitle(title);

          // Filtrar utilitários (não são jogos)
          const tags = deal.game?.tags || deal.tags || [];
          const genres = deal.steamGenres || deal.game?.genres || [];
          const allTags = [...tags, ...genres].map((t: any) =>
            (typeof t === 'string' ? t : t?.description || t?.name || '').toLowerCase()
          );

          // Palavras-chave para utilitários (inglês e português)
          const utilityKeywords = [
            'utilit', 'software', 'tool', 'ferramenta', 'aplicativo',
            'video production', 'photo editing', 'audio production', 'game development',
            'design', 'illustration', 'animation', 'modeling', 'video editor',
            'produção de vídeo', 'edição de foto', 'produção de áudio', 'desenvolvimento de jogos',
            'web publishing', 'education', 'accounting', 'trading'
          ];

          // Títulos conhecidos de apps/utilitários
          const utilityTitles = [
            'lossless scaling', 'wallpaper engine', 'aseprite', 'rpg maker', 'gamemaker',
            'construct', 'clickteam', 'vegas', 'magix', 'movavi', 'filmora',
            'obs', 'streamlabs', 'xsplit', 'voicemod', 'soundpad'
          ];

          const titleLowerUtil = (title || '').toLowerCase();
          const isUtility = allTags.some((tag: string) => utilityKeywords.some(keyword => tag.includes(keyword))) ||
                           utilityTitles.some(utilTitle => titleLowerUtil.includes(utilTitle));

          if (isUtility) {
            filteredUtility++;
            return false;
          }

          // Filtrar conteúdo adulto EXPLÍCITO (inglês e português)
          // REMOVIDO: 'mature', 'anime', 'visual novel' - muito amplos e removem jogos legítimos
          const adultKeywords = [
            'adult only', 'adult_only', 'adultonly', 'sexual content', 'sexual themes',
            'hentai', 'erotic', 'nudity', 'nsfw', 'explicit',
            'adulto apenas', 'conteúdo adulto', 'conteudo adulto',
            'nudez', 'erótico explícito', 'erotico explicito', 'conteúdo sexual', 'conteudo sexual'
          ];
          const titleLower = (title || '').toLowerCase();

          // Verificar apenas termos MUITO específicos de conteúdo adulto
          const hasExplicitAdultContent = allTags.some((tag: string) => {
            const tagLower = tag.toLowerCase();
            return adultKeywords.some(keyword => {
              // Verificar match exato ou muito específico
              return tagLower === keyword || tagLower.includes(keyword);
            });
          }) || adultKeywords.some(keyword => titleLower.includes(keyword));

          // Apenas filtrar se realmente tiver conteúdo adulto explícito
          if (hasExplicitAdultContent) {
            filteredAdult++;
            return false;
          }

          // Manter itens com preço aceitável e que não sejam da blacklist
          const isValid = isAcceptablePrice && !isTitleToFilter;
          if (!isValid) {
            if (isTitleToFilter) {
              filteredBlacklist++;
            } else {
              filteredNoPrice++;
            }
          }
          return isValid;
        });

        // 🎮 Filtro de DLCs/Pacotes - Mostrar apenas jogos base
        let filteredDLCCount = 0;
        const gamesOnlyDeals = filteredDeals.filter((deal: any) => {
          if (isDLCOrPackage(deal)) {
            filteredDLCCount++;
            return false;
          }
          return true;
        });

        if (__DEV__ && filteredDLCCount > 0) {
          console.log(`🎮 Filtro DLC/Pacote: ${filteredDLCCount} itens removidos`);
        }

        // Log de resumo dos filtros
        if (__DEV__) {
          console.log(`\n🎮 ========== RESUMO DE FILTROS ==========`);
          console.log(`📦 Total recebidos do backend: ${dealsArray.length}`);
          console.log(`\n❌ FILTRADOS:`);
          console.log(`   - Sem info suficiente: ${filteredNoInfo}`);
          console.log(`   - Utilitários: ${filteredUtility}`);
          console.log(`   - Conteúdo adulto explícito: ${filteredAdult}`);
          console.log(`   - Sem preço válido/aceitável: ${filteredNoPrice}`);
          console.log(`   - Lista negra: ${filteredBlacklist}`);
          console.log(`   - DLCs/Pacotes: ${filteredDLCCount}`);
          console.log(`\n✅ TOTAL VÁLIDOS: ${gamesOnlyDeals.length} jogos`);
          console.log(`========================================\n`);
        }

        const steamItems = gamesOnlyDeals.map((deal: any) => {
          // Extrair appId numérico do _id (formato "steam:123456") ou do URL
          let numericAppId: number | undefined;
          const dealId = deal._id || deal.appId?.toString() || '';
          const steamMatch = dealId.match(/steam:(\d+)/);
          if (steamMatch) {
            numericAppId = parseInt(steamMatch[1], 10);
          } else if (deal.url) {
            const urlMatch = deal.url.match(/\/app\/(\d+)/);
            if (urlMatch) {
              numericAppId = parseInt(urlMatch[1], 10);
            }
          }

          return {
            id: dealId,
            appId: numericAppId, // appId numérico para o modal de detalhes
            title: deal.game?.title || deal.title || deal.name || deal.game?.name,
            coverUrl: deal.game?.coverUrl || deal.image,
            genres: deal.steamGenres || deal.game?.genres || [],
            tags: deal.game?.tags || deal.tags || [],
            priceFinalCents: Math.round((deal.priceFinal || 0) * 100), // Converter para centavos
            discountPct: deal.discountPct,
            store: deal.store?.name || 'Steam',
            url: deal.url,
            releaseDate: deal.releaseDate, // Adicionando a data de lançamento
            // Adicionar campos necessários para o ranking
            _id: dealId,
            game: deal.game,
            steamGenres: deal.steamGenres,
            priceFinal: deal.priceFinal || 0,
            priceBase: deal.priceBase || 0,
            score: deal.score,
            popularity: deal.popularity,
            trending: deal.trending,
          };
        });
        
        // Combinar os jogos da Epic Games com os da Steam
        let combinedItems = [...epicGames, ...steamItems];
        
        // Ordenar com hierarquia de relevância avançada:
        // Calcular score de relevância para cada jogo
        const calculateRelevanceScore = (item: any) => {
          let score = 0;

          // 1. Epic grátis = máxima prioridade (1000 pontos)
          if (item.store === 'Epic' && item.priceFinalCents === 0) {
            score += 1000;
          }

          // 2. Desconto (até 200 pontos para 100% de desconto)
          const discount = item.discountPct || 0;
          score += discount * 2;

          // 3. Jogos grátis (não Epic) = 150 pontos
          if (item.priceFinalCents === 0) {
            score += 150;
          }

          // 4. Score/Popularity/Trending (até 100 pontos)
          const popularityScore = item.score || item.popularity || item.trending || 0;
          score += Math.min(popularityScore, 100);

          // 5. Preço acessível (jogos mais baratos = mais pontos, até 50 pontos)
          if (item.priceFinalCents > 0 && item.priceFinalCents < 5000) {
            score += 50 - (item.priceFinalCents / 100);
          }

          // 6. Jogos lançados recentemente (até 30 pontos)
          if (item.releaseDate) {
            const releaseDate = new Date(item.releaseDate);
            const now = new Date();
            const daysSinceRelease = (now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceRelease < 30) {
              score += 30 - daysSinceRelease;
            } else if (daysSinceRelease < 90) {
              score += 15;
            }
          }

          // 7. Boost para gêneros prioritários (até 300 pontos)
          const tags = item.tags || [];
          const genres = item.genres || [];
          const steamGenres = item.steamGenres || [];
          const allCategories = [...tags, ...genres, ...steamGenres].map((t: any) =>
            (typeof t === 'string' ? t : t?.description || t?.name || '').toLowerCase()
          );

          // Tags de jogos de COMBATE/TIRO (Call of Duty, Arc, etc)
          const combatTags = [
            'action', 'shooter', 'fps', 'first-person shooter', 'third-person shooter',
            'multiplayer', 'pvp', 'tactical', 'combat', 'military', 'war', 'battle',
            'competitive', 'team-based', 'hero shooter', 'arena shooter', 'tps',
            'online co-op', 'co-op', 'looter shooter', 'extraction shooter'
          ];

          // Tags de jogos de CORRIDA (Assetto Corsa, Le Mans Ultimate, etc)
          const racingTags = [
            'racing', 'driving', 'sports', 'simulation', 'automobile sim',
            'rally', 'formula', 'track racing', 'street racing', 'cars',
            'motorsport', 'drift', 'arcade racing', 'realistic', 'vehicular combat'
          ];

          // Tags de jogos de SOBREVIVÊNCIA (The Forest, DayZ, etc)
          const survivalTags = [
            'survival', 'survival horror', 'open world survival craft',
            'crafting', 'base building', 'sandbox', 'resource management',
            'zombie', 'post-apocalyptic', 'wilderness', 'harsh survival',
            'permadeath', 'exploration', 'scavenging', 'horror'
          ];

          let genreBoost = 0;

          // Verificar se é jogo de combate/tiro
          const isCombat = allCategories.some(cat =>
            combatTags.some(tag => cat.includes(tag))
          );
          if (isCombat) {
            genreBoost += 150; // Boost alto para jogos de combate
          }

          // Verificar se é jogo de corrida
          const isRacing = allCategories.some(cat =>
            racingTags.some(tag => cat.includes(tag))
          );
          if (isRacing) {
            genreBoost += 150; // Boost alto para jogos de corrida
          }

          // Verificar se é jogo de sobrevivência
          const isSurvival = allCategories.some(cat =>
            survivalTags.some(tag => cat.includes(tag))
          );
          if (isSurvival) {
            genreBoost += 150; // Boost alto para jogos de sobrevivência
          }

          // Boost extra se combinar múltiplos gêneros prioritários
          const priorityCount = [isCombat, isRacing, isSurvival].filter(Boolean).length;
          if (priorityCount >= 2) {
            genreBoost += 100; // Bonus se combinar 2+ gêneros (ex: sobrevivência + combate)
          }

          score += genreBoost;

          return score;
        };

        combinedItems.sort((a, b) => {
          const scoreA = calculateRelevanceScore(a);
          const scoreB = calculateRelevanceScore(b);
          return scoreB - scoreA;
        });

        // Salvar todos os combinedItems no cache (apenas no cursor 0 = primeira carga)
        if (cursor === 0) {
          await saveToCache(combinedItems);
          // Armazenar referência aos dados completos para paginação local
          cachedDataRef.current = combinedItems;
        }

        items = combinedItems;

        // Implementar paginação para scroll infinito
        // Aumentado pageSize para 100 para mostrar mais jogos
        const pageSize = 100;
        const startIndex = cursor * pageSize;
        const endIndex = startIndex + pageSize;

        if (cursor === 0) {
          items = combinedItems.slice(0, pageSize);
          nextCursor = combinedItems.length > pageSize ? 1 : null;

          if (__DEV__) {
            console.log(`📄 Primeira página: ${items.length} jogos (de ${combinedItems.length} total)`);
          }
        } else {
          items = combinedItems.slice(startIndex, endIndex);
          nextCursor = endIndex < combinedItems.length ? cursor + 1 : null;

          if (__DEV__) {
            console.log(`📄 Página ${cursor + 1}: ${items.length} jogos`);
          }
        }
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

  const refresh = useCallback((forceRefresh = false) => {
    setNextCursor(0);
    setHasNextPage(true);
    // forceRefresh=false por padrão, então usa cache se disponível
    // Quando muda de dia, a chave do cache muda automaticamente e novos dados são buscados
    fetchPage(0, true, forceRefresh);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (nextCursor !== null && hasNextPage && !loading) {
      // Verificar se há dados em cache para paginação local
      const cachedGameData = cachedDataRef.current;

      if (cachedGameData && cachedGameData.length > 0) {
        // Paginação local dos dados em cache (100 itens por página)
        const pageSize = 100;
        const startIndex = nextCursor * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = cachedGameData.slice(startIndex, endIndex);

        setData(prev => [...prev, ...paginatedData]);
        setNextCursor(endIndex < cachedGameData.length ? nextCursor + 1 : null);
        setHasNextPage(endIndex < cachedGameData.length);

        if (__DEV__) console.log(`📄 Paginação local: carregados ${paginatedData.length} itens (${startIndex}-${endIndex} de ${cachedGameData.length})`);
      } else {
        // Se não há cache, buscar do backend
        fetchPage(nextCursor);
      }
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