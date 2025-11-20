/**
 * Sistema de Preferências do Looton
 * Re-ranking inteligente sem exclusão dura
 */

export type GenreSlug = 
  | 'racing'
  | 'fps'
  | 'action'
  | 'adventure'
  | 'rpg'
  | 'sports'
  | 'fighting'
  | 'strategy'
  | 'indie'
  | 'simulation'
  | 'platformer'
  | 'open_world'
  | 'tactical_shooter'
  | 'co_op'
  | 'multiplayer'
  | 'singleplayer';

export interface Genre {
  slug: GenreSlug;
  labelPt: string;
  labelEn: string;
  labelEs: string;
  relatedGenres?: GenreSlug[]; // Para expander E1
}

export interface SubPreferences {
  multiplayer?: boolean;
  coop?: boolean;
  singleplayer?: boolean;
  ptBr?: boolean;
  maxPrice?: number | null;
}

export interface UserPreferences {
  userId?: string; // Backend user ID ou null se anônimo
  deviceId: string; // Gerado localmente para anônimos
  genres: GenreSlug[]; // Gêneros escolhidos
  subPreferences?: SubPreferences;
  lastUpdated: string; // ISO timestamp
  onboardingCompleted: boolean;
  version: number; // Para versionamento de schema
}

export interface RankedItem {
  item: any; // Deal original
  relevanceScore: number; // Pontuação calculada
  matchedPreferences: string[]; // Quais preferências bateram
  expanderUsed?: string; // Ex: "E1", "E3", null se matched
  isExploration?: boolean; // true se é item de exploração
}

export interface FeedMetadata {
  totalItems: number;
  matchedItems: number; // Bateram preferências
  explorationItems: number; // Exploração (10-15%)
  expandersUsed: string[]; // ["E1", "E3", "E5"]
  explorationRatio: number; // %
  avgRelevanceScore: number;
}

// Constantes
export const GENRES: Genre[] = [
  { slug: 'racing', labelPt: 'Corrida', labelEn: 'Racing', labelEs: 'Carreras', relatedGenres: ['sports', 'simulation'] },
  { slug: 'fps', labelPt: 'Tiro em Primeira Pessoa (FPS)', labelEn: 'First-Person Shooter (FPS)', labelEs: 'Disparos en Primera Persona (FPS)', relatedGenres: ['tactical_shooter', 'action'] },
  { slug: 'action', labelPt: 'Ação', labelEn: 'Action', labelEs: 'Acción', relatedGenres: ['fps', 'fighting'] },
  { slug: 'adventure', labelPt: 'Aventura', labelEn: 'Adventure', labelEs: 'Aventura', relatedGenres: ['rpg', 'open_world'] },
  { slug: 'rpg', labelPt: 'RPG', labelEn: 'RPG', labelEs: 'RPG', relatedGenres: ['adventure', 'open_world'] },
  { slug: 'sports', labelPt: 'Esportes', labelEn: 'Sports', labelEs: 'Deportes', relatedGenres: ['racing', 'simulation'] },
  { slug: 'fighting', labelPt: 'Luta', labelEn: 'Fighting', labelEs: 'Lucha', relatedGenres: ['action'] },
  { slug: 'strategy', labelPt: 'Estratégia', labelEn: 'Strategy', labelEs: 'Estrategia', relatedGenres: ['simulation'] },
  { slug: 'indie', labelPt: 'Indie', labelEn: 'Indie', labelEs: 'Indie', relatedGenres: ['platformer'] },
  { slug: 'simulation', labelPt: 'Simulação', labelEn: 'Simulation', labelEs: 'Simulación', relatedGenres: ['strategy', 'racing'] },
  { slug: 'platformer', labelPt: 'Plataforma', labelEn: 'Platformer', labelEs: 'Plataformas', relatedGenres: ['indie', 'adventure'] },
  { slug: 'open_world', labelPt: 'Mundo Aberto', labelEn: 'Open World', labelEs: 'Mundo Abierto', relatedGenres: ['rpg', 'adventure'] },
  { slug: 'tactical_shooter', labelPt: 'Tiro Tático', labelEn: 'Tactical Shooter', labelEs: 'Disparos Tácticos', relatedGenres: ['fps', 'strategy'] },
  { slug: 'co_op', labelPt: 'Cooperativo', labelEn: 'Co-op', labelEs: 'Cooperativo', relatedGenres: ['multiplayer'] },
  { slug: 'multiplayer', labelPt: 'Multiplayer', labelEn: 'Multiplayer', labelEs: 'Multijugador', relatedGenres: ['co_op'] },
  { slug: 'singleplayer', labelPt: 'Single-player', labelEn: 'Single-player', labelEs: 'Un jugador' },
];

export const DEFAULT_PREFERENCES: UserPreferences = {
  deviceId: '',
  genres: [],
  subPreferences: {},
  lastUpdated: new Date().toISOString(),
  onboardingCompleted: false,
  version: 1,
};

// Configurações do sistema
export const FEED_CONFIG = {
  PAGE_SIZE: 40,
  EXPLORATION_RATIO_MIN: 0.10, // 10%
  EXPLORATION_RATIO_MAX: 0.15, // 15%
  MAX_SINGLE_SUBGENRE_RATIO: 0.40, // 40% máximo de um subgênero
  HIGH_DISCOUNT_THRESHOLD: 30, // % para expander E3
};

// Pesos de relevância
export const RELEVANCE_WEIGHTS = {
  GENRE_MATCH: 100, // Grande impulso
  RELATED_GENRE: 50, // Expander E1
  TAG_MULTIPLAYER: 20,
  TAG_COOP: 20,
  TAG_PTBR: 15,
  PRICE_MATCH: 25,
  TRENDING: 10,
  HIGH_DISCOUNT: 15,
  POPULARITY: 5,
  EXPLORATION: -50, // Penalidade para empurrar para exploração
};
