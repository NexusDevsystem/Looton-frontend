/**
 * RankingService
 * Re-ranking inteligente com expanders e diversidade
 * NUNCA filtra/exclui jogos - apenas reordena
 */

import {
  UserPreferences,
  RankedItem,
  FeedMetadata,
  FEED_CONFIG,
  RELEVANCE_WEIGHTS,
  GENRES,
  GenreSlug,
} from '../types/preferences';

interface Deal {
  _id: string;
  game?: {
    title?: string;
    genres?: string[];
    tags?: string[];
  };
  steamGenres?: Array<{ id: string; name: string }>;
  priceFinal: number;
  priceBase: number;
  discountPct: number;
  score?: number;
  popularity?: number;
  trending?: boolean;
  [key: string]: any;
}

/**
 * Normaliza gêneros do deal para slugs padrão
 */
function normalizeDealGenres(deal: Deal, debug = false): GenreSlug[] {
  const genres: Set<GenreSlug> = new Set();
  
  // Mapeamento direto de gêneros Steam (PT/EN) para slugs
  const genreMapping: Record<string, GenreSlug> = {
    // Português
    'corrida': 'racing',
    'ação': 'action',
    'aventura': 'adventure',
    'rpg': 'rpg',
    'esportes': 'sports',
    'luta': 'fighting',
    'estratégia': 'strategy',
    'indie': 'indie',
    'simulação': 'simulation',
    'plataforma': 'platformer',
    'mundo aberto': 'open_world',
    'tiro tático': 'tactical_shooter',
    'cooperativo': 'co_op',
    'multiplayer': 'multiplayer',
    'single-player': 'singleplayer',
    'um jogador': 'singleplayer',
    // Inglês
    'racing': 'racing',
    'action': 'action',
    'adventure': 'adventure',
    'sports': 'sports',
    'fighting': 'fighting',
    'strategy': 'strategy',
    'simulation': 'simulation',
    'platformer': 'platformer',
    'open world': 'open_world',
    'tactical shooter': 'tactical_shooter',
    'co-op': 'co_op',
    'cooperative': 'co_op',
    'first-person shooter': 'fps',
    'fps': 'fps',
    'shooter': 'fps',
    // Espanhol
    'carreras': 'racing',
    'acción': 'action',
    'deportes': 'sports',
    'lucha': 'fighting',
    'estrategia': 'strategy',
    'simulación': 'simulation',
    'plataformas': 'platformer',
    'mundo abierto': 'open_world',
    'disparos tácticos': 'tactical_shooter',
    'multijugador': 'multiplayer',
  };
  
  // De steamGenres
  if (deal.steamGenres && Array.isArray(deal.steamGenres)) {
    deal.steamGenres.forEach((g: any) => {
      const name = (g.name || g.description || '').toLowerCase().trim();
      
      // Tentar mapeamento direto primeiro
      if (genreMapping[name]) {
        genres.add(genreMapping[name]);
      } else {
        // Fallback: buscar por includes
        GENRES.forEach((genre) => {
          if (name.includes(genre.labelEn.toLowerCase()) || 
              name.includes(genre.labelPt.toLowerCase()) ||
              name.includes(genre.labelEs.toLowerCase())) {
            genres.add(genre.slug);
          }
        });
      }
    });
  }
  
  // De game.genres
  if (deal.game?.genres && Array.isArray(deal.game.genres)) {
    deal.game.genres.forEach((g: string) => {
      const gLower = g.toLowerCase().trim();
      
      // Tentar mapeamento direto primeiro
      if (genreMapping[gLower]) {
        genres.add(genreMapping[gLower]);
      } else {
        // Fallback: buscar por includes
        GENRES.forEach((genre) => {
          if (gLower.includes(genre.labelEn.toLowerCase()) || 
              gLower.includes(genre.labelPt.toLowerCase()) ||
              gLower.includes(genre.labelEs.toLowerCase())) {
            genres.add(genre.slug);
          }
        });
      }
    });
  }
  
  // De game.tags (multiplayer, co-op, etc.)
  if (deal.game?.tags && Array.isArray(deal.game.tags)) {
    deal.game.tags.forEach((tag: string) => {
      const tagLower = tag.toLowerCase().trim();
      if (genreMapping[tagLower]) {
        genres.add(genreMapping[tagLower]);
      } else {
        // Fallback manual para tags comuns
        if (tagLower.includes('multiplayer')) genres.add('multiplayer');
        if (tagLower.includes('co-op') || tagLower.includes('cooperative')) genres.add('co_op');
        if (tagLower.includes('single') || tagLower.includes('singleplayer')) genres.add('singleplayer');
      }
    });
  }
  
  if (debug) {
    console.log(`🔍 Gêneros normalizados para "${deal.game?.title || deal.title}":`, Array.from(genres));
    console.log(`   - steamGenres:`, deal.steamGenres?.map((g: any) => g.name || g.description));
    console.log(`   - game.genres:`, deal.game?.genres);
  }
  
  return Array.from(genres);
}

/**
 * Calcula relevância de um deal baseado em preferências
 */
function calculateRelevance(
  deal: Deal,
  preferences: UserPreferences,
  debug = false
): { score: number; matchedPreferences: string[]; expanderUsed?: string } {
  let score = 0;
  const matched: string[] = [];
  let expanderUsed: string | undefined = undefined;
  
  const dealGenres = normalizeDealGenres(deal, debug);
  const userGenres = preferences.genres || [];
  const subPrefs = preferences.subPreferences || {};
  
  // 1. GENRE MATCH (peso 100)
  const genreMatches = dealGenres.filter((g) => userGenres.includes(g));
  if (genreMatches.length > 0) {
    score += RELEVANCE_WEIGHTS.GENRE_MATCH * genreMatches.length;
    matched.push(...genreMatches.map((g) => `genre:${g}`));
  } else {
    // EXPANDER E1: Related Genres (peso 50)
    const relatedMatches: string[] = [];
    userGenres.forEach((userGenre) => {
      const genreData = GENRES.find((g) => g.slug === userGenre);
      if (genreData?.relatedGenres) {
        const relatedFound = dealGenres.filter((dg) =>
          genreData.relatedGenres!.includes(dg)
        );
        relatedMatches.push(...relatedFound);
      }
    });
    
    if (relatedMatches.length > 0) {
      score += RELEVANCE_WEIGHTS.RELATED_GENRE * relatedMatches.length;
      matched.push(...relatedMatches.map((g) => `related:${g}`));
      expanderUsed = 'E1';
    }
  }
  
  // 2. SUB-PREFERENCES (tags)
  if (subPrefs.multiplayer && dealGenres.includes('multiplayer')) {
    score += RELEVANCE_WEIGHTS.TAG_MULTIPLAYER;
    matched.push('tag:multiplayer');
  }
  
  if (subPrefs.coop && dealGenres.includes('co_op')) {
    score += RELEVANCE_WEIGHTS.TAG_COOP;
    matched.push('tag:co_op');
  }
  
  if (subPrefs.singleplayer && dealGenres.includes('singleplayer')) {
    score += RELEVANCE_WEIGHTS.TAG_MULTIPLAYER; // mesmo peso
    matched.push('tag:singleplayer');
  }
  
  // PT-BR (verificar em tags ou description)
  if (subPrefs.ptBr) {
    const hasPtBr = deal.game?.tags?.some((tag: string) =>
      tag.toLowerCase().includes('portuguese') ||
      tag.toLowerCase().includes('português') ||
      tag.toLowerCase().includes('pt-br')
    );
    if (hasPtBr) {
      score += RELEVANCE_WEIGHTS.TAG_PTBR;
      matched.push('tag:pt-br');
    }
  }
  
  // 3. PRICE MATCH
  if (subPrefs.maxPrice && deal.priceFinal <= subPrefs.maxPrice) {
    score += RELEVANCE_WEIGHTS.PRICE_MATCH;
    matched.push('price:match');
  }
  
  // EXPANDER E2: Trending/Popular
  if (deal.trending || (deal.popularity && deal.popularity > 80)) {
    score += RELEVANCE_WEIGHTS.TRENDING;
    if (!expanderUsed) expanderUsed = 'E2';
  }
  
  // EXPANDER E3: High Discount
  if (deal.discountPct >= FEED_CONFIG.HIGH_DISCOUNT_THRESHOLD) {
    score += RELEVANCE_WEIGHTS.HIGH_DISCOUNT;
    if (!expanderUsed) expanderUsed = 'E3';
  }
  
  // 4. POPULARITY (peso base)
  if (deal.popularity) {
    score += RELEVANCE_WEIGHTS.POPULARITY * (deal.popularity / 100);
  }
  
  // 5. EXPANDER E4: Exploration penalty (para empurrar para exploração)
  // Aplicado depois na seleção de exploration items
  
  return { score, matchedPreferences: matched, expanderUsed };
}

/**
 * Re-rankeia o feed completo com expanders e diversidade
 * NUNCA exclui itens - apenas reordena
 */
export function rankFeed(
  deals: Deal[],
  preferences: UserPreferences,
  page: number = 1
): { items: RankedItem[]; metadata: FeedMetadata } {
  console.log(`🎲 RankingService.rankFeed iniciado com ${deals.length} deals`);
  console.log(`🎯 Preferências do usuário: ${preferences.genres.join(', ')}`);
  
  const pageSize = FEED_CONFIG.PAGE_SIZE;
  const explorationMin = Math.floor(pageSize * FEED_CONFIG.EXPLORATION_RATIO_MIN);
  const explorationMax = Math.ceil(pageSize * FEED_CONFIG.EXPLORATION_RATIO_MAX);
  
  // 1. Calcular relevância para TODOS os deals
  const ranked: RankedItem[] = deals.map((deal, index) => {
    const { score, matchedPreferences, expanderUsed } = calculateRelevance(deal, preferences, index < 10);
    return {
      item: deal,
      relevanceScore: score,
      matchedPreferences,
      expanderUsed,
      isExploration: false,
    };
  });
  
  console.log(`📊 Itens com score > 0: ${ranked.filter(r => r.relevanceScore > 0).length}`);
  
  // Contar matches diretos (sem expander)
  const directMatches = ranked.filter(r => r.relevanceScore > 0 && !r.expanderUsed).length;
  console.log(`🎯 Matches diretos (preferências): ${directMatches}`);
  console.log(`🔧 Matches via expanders: ${ranked.filter(r => r.relevanceScore > 0 && r.expanderUsed).length}`);
  
  const top5 = ranked
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5);
  console.log(`🏆 Top 5 por relevância:`, top5.map(r => ({
    title: r.item.game?.title || r.item.title,
    score: r.relevanceScore,
    expander: r.expanderUsed,
    matched: r.matchedPreferences
  })));
  
  // 2. Ordenar por relevância (maior primeiro)
  ranked.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    // Em caso de empate: desconto > popularidade
    const discountDiff = (b.item.discountPct || 0) - (a.item.discountPct || 0);
    if (discountDiff !== 0) return discountDiff;
    return (b.item.popularity || 0) - (a.item.popularity || 0);
  });
  
  // 3. Separar em matched (score > 0) e unmatched (score <= 0)
  const matched = ranked.filter((r) => r.relevanceScore > 0);
  const unmatched = ranked.filter((r) => r.relevanceScore <= 0);
  
  // 4. Definir quantidade de exploração (10-15%)
  const explorationCount = Math.min(
    Math.max(explorationMin, Math.floor(Math.random() * (explorationMax - explorationMin + 1)) + explorationMin),
    Math.floor(pageSize * 0.15) // máximo 15%
  );
  
  // 5. Selecionar items de exploração dos unmatched (aleatório mas preferindo high discount/trending)
  const explorationPool = unmatched
    .sort((a, b) => {
      // Priorizar high discount e trending mesmo em exploração
      const scoreA = (a.item.discountPct >= 30 ? 50 : 0) + (a.item.trending ? 30 : 0);
      const scoreB = (b.item.discountPct >= 30 ? 50 : 0) + (b.item.trending ? 30 : 0);
      return scoreB - scoreA;
    })
    .slice(0, explorationCount * 3); // Pool 3x maior para randomizar
  
  // Embaralhar e pegar quantidade necessária
  const shuffled = explorationPool.sort(() => Math.random() - 0.5);
  const explorationItems = shuffled.slice(0, explorationCount).map((r) => ({
    ...r,
    isExploration: true,
    expanderUsed: r.expanderUsed || 'E4',
  }));
  
  // 6. Combinar matched + exploration
  let finalItems = [...matched];
  
  // Inserir exploration distribuído (não só no final)
  const explorationInsertInterval = Math.floor(matched.length / explorationCount);
  explorationItems.forEach((explItem, idx) => {
    const insertPos = Math.min(
      (idx + 1) * explorationInsertInterval,
      finalItems.length
    );
    finalItems.splice(insertPos, 0, explItem);
  });
  
  // 7. EXPANDER E5: Se ainda não atingiu pageSize, preencher com unmatched restantes
  if (finalItems.length < pageSize) {
    const explorationIds = new Set(explorationItems.map((e) => e.item._id));
    const remainingUnmatched = unmatched
      .filter((u) => !explorationIds.has(u.item._id))
      .slice(0, pageSize - finalItems.length);
    finalItems.push(...remainingUnmatched);
  }
  
  // 8. EXPANDER E6: Se AINDA não atingiu, relaxar preço e pegar mais
  if (finalItems.length < pageSize && preferences.subPreferences?.maxPrice) {
    // Pegar items acima do preço mas ordenados por relevância parcial
    const abovePriceItems = deals
      .filter((d) => 
        d.priceFinal > preferences.subPreferences!.maxPrice! &&
        !finalItems.some((fi) => fi.item._id === d._id)
      )
      .map((deal) => {
        const { score, matchedPreferences, expanderUsed } = calculateRelevance(deal, {
          ...preferences,
          subPreferences: { ...preferences.subPreferences, maxPrice: undefined },
        });
        return {
          item: deal,
          relevanceScore: score,
          matchedPreferences,
          expanderUsed: expanderUsed || 'E6',
          isExploration: false,
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, pageSize - finalItems.length);
    
    finalItems.push(...abovePriceItems);
  }
  
  // 9. Diversidade: limitar 40% de um único subgênero
  // (implementação simplificada - pode ser refinada)
  
  // 10. Paginação
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pageItems = finalItems.slice(startIdx, endIdx);
  
  // 11. Metadata
  const expandersUsed = Array.from(
    new Set(pageItems.map((r) => r.expanderUsed).filter((e): e is string => !!e))
  );
  
  const metadata: FeedMetadata = {
    totalItems: pageItems.length,
    matchedItems: pageItems.filter((r) => r.relevanceScore > 0 && !r.isExploration).length,
    explorationItems: pageItems.filter((r) => r.isExploration).length,
    expandersUsed,
    explorationRatio: pageItems.length > 0 
      ? pageItems.filter((r) => r.isExploration).length / pageItems.length 
      : 0,
    avgRelevanceScore: pageItems.length > 0
      ? pageItems.reduce((sum, r) => sum + r.relevanceScore, 0) / pageItems.length
      : 0,
  };
  
  return { items: pageItems, metadata };
}

/**
 * Rankeia sem preferências (usuário não fez onboarding)
 * Retorna trending/popular + exploração
 */
export function rankFeedWithoutPreferences(
  deals: Deal[],
  page: number = 1
): { items: RankedItem[]; metadata: FeedMetadata } {
  const pageSize = FEED_CONFIG.PAGE_SIZE;
  
  // Priorizar trending e high discount
  const ranked: RankedItem[] = deals.map((deal) => {
    let score = 0;
    const matched: string[] = [];
    
    if (deal.trending) {
      score += 80;
      matched.push('trending');
    }
    
    if (deal.discountPct >= 50) {
      score += 60;
      matched.push('high-discount');
    } else if (deal.discountPct >= 30) {
      score += 30;
    }
    
    if (deal.popularity && deal.popularity > 70) {
      score += 40;
      matched.push('popular');
    }
    
    return {
      item: deal,
      relevanceScore: score,
      matchedPreferences: matched,
      expanderUsed: 'E2',
      isExploration: true,
    };
  });
  
  // Ordenar
  ranked.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  // Paginação
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pageItems = ranked.slice(startIdx, endIdx);
  
  const metadata: FeedMetadata = {
    totalItems: pageItems.length,
    matchedItems: 0,
    explorationItems: pageItems.length,
    expandersUsed: ['E2', 'E3'],
    explorationRatio: 1.0,
    avgRelevanceScore: pageItems.length > 0
      ? pageItems.reduce((sum, r) => sum + r.relevanceScore, 0) / pageItems.length
      : 0,
  };
  
  return { items: pageItems, metadata };
}
