import { View, Text, ScrollView, ActivityIndicator, Image, TouchableOpacity, Dimensions, TextInput, Modal, SafeAreaView, FlatList, Animated, RefreshControl } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState, useRef } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { GameDetailsModal } from '../src/components/GameDetailsModal'
import OnboardingStep1 from './onboarding/Step1'
import OnboardingStep2 from './onboarding/Step2'
import SingleOnboarding from './onboarding/SingleOnboarding'
import LoginScreen from './auth/LoginScreen'
import LoadingModal from './components/LoadingModal'
import * as OnboardingService from '../src/services/OnboardingService'
import * as AuthService from '../src/services/AuthService'
import { CurrencyProvider, useCurrency } from '../src/contexts/CurrencyContext'
import { WishlistTab } from '../src/components/WishlistTab'
import FavoritesAndLists from './favorites'
import { WishlistService } from '../src/services/WishlistService'
import { WishlistSyncService } from '../src/services/WishlistSyncService'
import { GameCover } from '../src/components/GameCover'
import { useImagePrefetch } from '../src/hooks/useImagePrefetch'
import { FavoriteButton } from '../src/components/FavoriteButton'
import { AddToListModal } from '../src/components/AddToListModal'
import { FilterChips } from '../src/components/FilterChips'
import { useFilters } from '../src/hooks/useFilters'
import { SteamGenresPreferencesModal } from '../src/components/SteamGenresPreferencesModal'
import { fetchCuratedFeed, SteamGenre, UserPreferences } from '../src/services/SteamGenresService'
import { showToast } from '../src/utils/SimpleToast'
import { TermsOfServiceModal } from '../src/components/TermsOfServiceModal'
import { LazyLowestPriceBadge } from '../src/components/LazyLowestPriceBadge'
import { PriceHistoryModal } from '../src/components/PriceHistoryModal'
import { SplashScreen } from '../src/components/SplashScreen'
import { OnboardingCarousel } from '../src/components/OnboardingCarousel'

interface Deal {
  _id: string
  appId?: number
  url: string
  priceBase: number
  priceFinal: number
  discountPct: number
  steamGenres?: Array<{ id: string; name: string }>
  game: {
    title: string
    coverUrl: string
    genres?: string[]
    tags?: string[]
  }
  store: {
    name: string
  }
  score?: number
}



import Constants from 'expo-constants'
import { router } from 'expo-router'

const API_URL = (() => {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL
  if (fromEnv && !fromEnv.includes('localhost')) return fromEnv
  try {
    const hostUri: any = (Constants as any)?.expoConfig?.hostUri
    if (hostUri) {
      const host = String(hostUri).split(':')[0]
      if (host && host !== 'localhost') return `http://${host}:3000`
    }
  } catch {}
  return fromEnv || 'http://localhost:3000'
})()
const { width, height } = Dimensions.get('window')
const isTablet = width >= 768

// Small component to render a price using CurrencyContext so it updates reactively
const PriceText: React.FC<{ value?: number | null; style?: any }> = ({ value, style }) => {
  try {
    const { formatPrice, currency } = useCurrency() as any
    let display = value === null || value === undefined || isNaN(value) || value === 0 ? 'Grátis' : formatPrice(value)

    // Normalize BRL rendering to avoid edge-cases like "RS2,00" and enforce single space after R$
    if (display !== 'Grátis' && currency === 'BRL') {
      // Fix cases where $ became S (uppercase side-effect), and ensure single space after symbol
      display = String(display)
        .replace(/^RS/, 'R$')
        .replace(/^R\$\s*/, 'R$ ')
    }

    return <Text style={[style, { textTransform: 'none' }]}>{display}</Text>
  } catch (e) {
    // fallback: use Intl for pt-BR
    try {
      if (value === null || value === undefined || isNaN(value) || value === 0) return <Text style={[style, { textTransform: 'none' }]}>Grátis</Text>
      const display = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
      const normalized = String(display).replace(/^R\$\s*/, 'R$ ')
      return <Text style={[style, { textTransform: 'none' }]}>{normalized}</Text>
    } catch (e2) {
      if (value === null || value === undefined || isNaN(value) || value === 0) return <Text style={[style, { textTransform: 'none' }]}>Grátis</Text>
      try {
        const display = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
        const normalized = String(display).replace(/^R\$\s*/, 'R$ ')
        return <Text style={[style, { textTransform: 'none' }]}>{normalized}</Text>
      } catch (e3) {
        return <Text style={[style, { textTransform: 'none' }]}>{`${Number(value).toFixed(2)} BRL`}</Text>
      }
    }
  }
}

export default function Home() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'favorites' | 'profile' | 'wishlist' | 'hardware'>('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [showGameDetails, setShowGameDetails] = useState(false)
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null)
  const [showWishlist, setShowWishlist] = useState(false)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [selectedGameDetails, setSelectedGameDetails] = useState<any>(null)
  const [gameDetailsModalVisible, setGameDetailsModalVisible] = useState(false)
  const [wishlistGames, setWishlistGames] = useState<any[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([])
  const [searchResults, setSearchResults] = useState<Deal[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const [refreshing, setRefreshing] = useState(false)
  const [showAddToListModal, setShowAddToListModal] = useState(false)
  const [selectedGameForList, setSelectedGameForList] = useState<{id: string, title: string} | null>(null)
  const [userPreferredSteamGenres, setUserPreferredSteamGenres] = useState<string[]>([])
  const [showPreferencesModal, setShowPreferencesModal] = useState(false)
  const [availableSteamGenres, setAvailableSteamGenres] = useState<SteamGenre[]>([])
  const [loadingGenres, setLoadingGenres] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showCurrencyModal, setShowCurrencyModal] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPriceHistoryModal, setShowPriceHistoryModal] = useState(false)
  const [selectedGameForHistory, setSelectedGameForHistory] = useState<{ id?: number; name?: string } | null>(null)
  
  // Estados do fluxo de inicialização
  const [appState, setAppState] = useState<'splash' | 'onboarding' | 'terms' | 'app'>('splash')
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)
  
  // Mock user ID - em um app real viria do contexto de autenticação
  // Leave empty to treat as unauthenticated in dev by default
  const [userId, setUserId] = useState('')
  const slideAnim = useRef(new Animated.Value(50)).current
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const searchInputRef = useRef<any | null>(null)

  // Hook de filtros
  const {
    selectedGenres,
    selectedTags,
    availableGenres,
    availableTags,
    toggleGenre,
    toggleTag,
    clearFilters,
    hasActiveFilters,
    fetchFilteredDeals
  } = useFilters()

  // Estado para ofertas filtradas
  const [displayDeals, setDisplayDeals] = useState<Deal[]>([])

  // Função removida - GameCover gerencia os erros internamente

  // Prefetch das imagens para melhor performance
  useImagePrefetch(deals.map(deal => ({ coverUrl: deal.game?.coverUrl })))

  useEffect(() => {
    // Inicializar app com verificação do fluxo de onboarding
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      console.log('🚀 Inicializando app...')
      
      // Verificar se já viu onboarding e aceitou termos
      const hasSeenOnboardingBefore = await OnboardingService.hasSeenOnboarding()
      const hasAcceptedTerms = await OnboardingService.hasAcceptedTerms()
      
      setHasSeenOnboarding(hasSeenOnboardingBefore)
      
      // Determinar estado inicial baseado no histórico do usuário
      if (!hasSeenOnboardingBefore) {
        // Primeira vez: Splash → Onboarding → Termos → App
        setAppState('splash')
      } else if (!hasAcceptedTerms) {
        // Já viu onboarding mas não aceitou termos: Splash → Termos → App
        setAppState('splash')
      } else {
        // Usuário completo: Splash → App
        setAppState('splash')
      }
      
      // Carregar dados básicos em background
      fetchDeals()
      loadWishlistCount()
      loadWishlistGames()
      
    } catch (error) {
      console.error('Erro ao inicializar app:', error)
      // Em caso de erro, iniciar do começo
      setAppState('splash')
    }
  }

  // Funções de transição entre estados
  const handleSplashFinish = async () => {
    const hasSeenOnboardingBefore = await OnboardingService.hasSeenOnboarding()
    const hasAcceptedTerms = await OnboardingService.hasAcceptedTerms()
    
    if (!hasSeenOnboardingBefore) {
      setAppState('onboarding')
    } else if (!hasAcceptedTerms) {
      setAppState('terms')
    } else {
      setAppState('app')
      // Animação de entrada do app
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        })
      ]).start()
    }
  }

  const handleOnboardingFinish = async () => {
    await OnboardingService.setOnboardingSeen()
    const hasAcceptedTerms = await OnboardingService.hasAcceptedTerms()
    
    if (!hasAcceptedTerms) {
      setAppState('terms')
    } else {
      setAppState('app')
      // Animação de entrada do app
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        })
      ]).start()
    }
  }

  const handleTermsAccept = async () => {
    await OnboardingService.setTermsAccepted()
    setAppState('app')
    showToast('Bem-vindo ao Looton! 🎮')
    
    // Animação de entrada do app
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start()
  }

  const checkFirstTime = async () => {
    try {
      const hasAcceptedTerms = await OnboardingService.hasAcceptedTerms()
      if (!hasAcceptedTerms) {
        setShowTermsModal(true)
      }
    } catch (error) {
      console.log('Error checking first time:', error)
      // Em caso de erro, mostre os termos por segurança
      setShowTermsModal(true)
    }
  }

  // Effect para aplicar filtros na aba home
  useEffect(() => {
    if (activeTab === 'home') {
      applyFilters()
    }
  }, [deals, selectedGenres, selectedTags, activeTab, userPreferredSteamGenres])

  // Função para organizar jogos com filtro de gênero e destaque da melhor oferta
  const applyFilters = () => {
    console.log('=== Aplicando Filtros ===');
    console.log('Total de jogos:', deals.length);
    console.log('Gêneros preferidos selecionados:', userPreferredSteamGenres);
    
    let filteredDeals = deals;
    
    // SISTEMA SIMPLIFICADO: Backend já faz boost, aqui só filtros de UI se necessário
    if (userPreferredSteamGenres && userPreferredSteamGenres.length > 0) {
      console.log('Gêneros Steam preferidos para filtro de UI:', userPreferredSteamGenres.join(', '));
      
      filteredDeals = deals.filter(deal => {
        const gameGenres = deal.game?.genres || [];
        const gameTitle = (deal.game?.title || '').toLowerCase();
        
        // Debug apenas alguns jogos para não poluir o console
        if (Math.random() < 0.1) {
          console.log(`Jogo: ${deal.game?.title}, Gêneros: [${gameGenres.join(', ')}]`);
        }
        
        // Mapeamento expandido de gêneros em português para keywords
        const genreMapping: Record<string, string[]> = {
          'Ação': [
            'action', 'shooter', 'combat', 'fighting', 'fps', 'tps', 'third person shooter', 'first person shooter',
            'call of duty', 'battlefield', 'counter-strike', 'doom', 'halo', 'gears of war', 'mortal kombat',
            'tekken', 'street fighter', 'overwatch', 'apex', 'valorant', 'csgo', 'cod', 'pubg', 'fortnite',
            'gun', 'weapon', 'war', 'battle', 'military', 'zombie', 'survival horror', 'beat em up',
            'hack and slash', 'stealth', 'ninja', 'assassin', 'metal gear', 'hitman'
          ],
          'Aventura': [
            'adventure', 'exploration', 'story rich', 'narrative', 'puzzle', 'mystery', 'detective',
            'tomb raider', 'uncharted', 'zelda', 'assassins creed', 'life is strange', 'telltale',
            'point and click', 'visual novel', 'interactive fiction', 'walking simulator',
            'open world', 'exploration', 'quest', 'journey', 'discovery', 'treasure', 'indiana jones'
          ],
          'Corrida': [
            'racing', 'driving', 'automobile', 'motorcycle', 'car', 'race', 'speed', 'drift', 'rally',
            'forza', 'need for speed', 'gran turismo', 'f1', 'formula', 'nfs', 'burnout', 'dirt',
            'wreckfest', 'assetto corsa', 'project cars', 'crew', 'driver', 'midnight club',
            'track', 'circuit', 'nascar', 'motogp', 'bikes', 'supercars', 'street racing',
            'arcade racing', 'simulation racing', 'kart', 'go kart', 'mario kart'
          ],
          'RPG': [
            'rpg', 'role-playing', 'jrpg', 'character action', 'leveling', 'stats', 'experience',
            'witcher', 'elder scrolls', 'fallout', 'final fantasy', 'dragon age', 'mass effect',
            'divinity', 'baldurs gate', 'pillars of eternity', 'pathfinder', 'cyberpunk',
            'fantasy', 'medieval', 'magic', 'wizard', 'warrior', 'rogue', 'mage', 'knight',
            'dungeon', 'dragon', 'sword', 'sorcery', 'turn-based rpg', 'action rpg', 'crpg'
          ],
          'Estratégia': [
            'strategy', 'rts', 'real time strategy', 'turn-based', 'turn based strategy', 'tower defense',
            '4x', 'grand strategy', 'tactical', 'management', 'base building', 'resource management',
            'civilization', 'age of empires', 'starcraft', 'command and conquer', 'total war',
            'cities skylines', 'anno', 'tropico', 'crusader kings', 'europa universalis',
            'xcom', 'chess', 'board game', 'war game', 'empire', 'conquest'
          ],
          'Esportes': [
            'sports', 'football', 'soccer', 'basketball', 'baseball', 'tennis', 'golf', 'hockey',
            'fifa', 'nba', '2k', 'madden', 'nhl', 'mlb', 'pes', 'pro evolution soccer',
            'olympics', 'swimming', 'athletics', 'boxing', 'wrestling', 'ufc', 'mma',
            'skateboarding', 'snowboarding', 'skiing', 'surfing', 'volleyball', 'american football'
          ],
          'Simulação': [
            'simulation', 'sim', 'simulator', 'life sim', 'farming', 'farm', 'city builder',
            'cities skylines', 'simcity', 'euro truck', 'american truck', 'flight simulator',
            'farming simulator', 'construction', 'tycoon', 'business', 'management',
            'train simulator', 'bus simulator', 'cooking', 'medical', 'surgery simulator',
            'goat simulator', 'job simulator', 'realistic', 'educational'
          ],
          'Indie': [
            'indie', 'independent', 'pixel art', 'retro', 'artistic', 'experimental', 'creative',
            'minimalist', 'abstract', 'unique', 'innovative', 'small developer', 'art game',
            'atmospheric', 'emotional', 'personal', 'stylized', 'hand drawn', '2d', 'pixel'
          ],
          'Casual': [
            'casual', 'family friendly', 'relaxing', 'chill', 'simple', 'easy', 'accessible',
            'puzzle', 'match 3', 'hidden object', 'time management', 'card game', 'board game',
            'trivia', 'word game', 'educational', 'kids', 'children', 'all ages', 'cute'
          ],
          'Acesso Antecipado': [
            'early access', 'alpha', 'beta', 'preview', 'development', 'work in progress',
            'upcoming', 'unreleased', 'in development', 'pre-release'
          ]
        };

        const matchesFilter = userPreferredSteamGenres.some((selectedGenre: string) => {
          const keywords = genreMapping[selectedGenre] || [selectedGenre.toLowerCase()];
          
          // Debug específico para Corrida
          if (selectedGenre === 'Corrida') {
            console.log(`🏎️ Verificando ${deal.game?.title} para Corrida:`);
            console.log(`   - Gêneros do jogo: [${gameGenres.join(', ')}]`);
            console.log(`   - Keywords de busca: [${keywords.join(', ')}]`);
            console.log(`   - Título: ${gameTitle}`);
          }
          
          // Verifica gêneros primeiro com match mais flexível
          let hasMatch = false;
          let matchReason = '';
          
          if (gameGenres.length > 0) {
            hasMatch = gameGenres.some(gameGenre => {
              const gameGenreLower = gameGenre.toLowerCase();
              const matchFound = keywords.some(keyword => {
                const keywordLower = keyword.toLowerCase();
                // Match mais flexível: permite palavras parciais
                return gameGenreLower.includes(keywordLower) || 
                       keywordLower.includes(gameGenreLower) ||
                       gameGenreLower.startsWith(keywordLower.substring(0, 4)) ||
                       keywordLower.startsWith(gameGenreLower.substring(0, 4));
              });
              
              if (matchFound && selectedGenre === 'Corrida') {
                const matchedKeyword = keywords.find(k => {
                  const kLower = k.toLowerCase();
                  return gameGenreLower.includes(kLower) || kLower.includes(gameGenreLower) ||
                         gameGenreLower.startsWith(kLower.substring(0, 4)) || kLower.startsWith(gameGenreLower.substring(0, 4));
                });
                console.log(`   ✅ Match no gênero: "${gameGenre}" ↔ "${matchedKeyword}"`);
                matchReason = `gênero: ${gameGenre}`;
              }
              
              return matchFound;
            });
          }
          
          // Verifica no título com match flexível
          if (!hasMatch) {
            hasMatch = keywords.some(keyword => {
              const keywordLower = keyword.toLowerCase();
              // Match no título com diferentes estratégias
              const titleMatch = gameTitle.includes(keywordLower) ||
                               keywordLower.includes(gameTitle.split(' ')[0]) ||
                               gameTitle.split(' ').some(word => word.length > 3 && keywordLower.includes(word));
              
              if (titleMatch && selectedGenre === 'Corrida') {
                console.log(`   ✅ Match no título: "${gameTitle}" ↔ "${keyword}"`);
                matchReason = `título: ${keyword}`;
              }
              return titleMatch;
            });
          }
          
          if (hasMatch) {
            console.log(`✅ ${deal.game?.title} PASSA no filtro (${selectedGenre})`);
          }
          
          return hasMatch;
        });
        
        return matchesFilter;
      });
      
      console.log(`Filtrados por gênero: ${deals.length} -> ${filteredDeals.length} jogos`);
      
      // Sistema de fallback: se encontrou poucos jogos, expandir criterios
      if (filteredDeals.length < 10) {
        console.log(`⚠️ Poucos jogos encontrados (${filteredDeals.length}), aplicando fallback...`);
        
        const fallbackDeals = deals.filter(deal => {
          const gameTitle = (deal.game?.title || '').toLowerCase();
          const gameGenres = deal.game?.genres || [];
          
          // Já incluído no filtro principal
          if (filteredDeals.some(fd => fd._id === deal._id)) return false;
          
          // Fallback com keywords mais gerais para cada gênero
          const fallbackKeywords: Record<string, string[]> = {
            'Ação': ['action', 'combat', 'fight', 'war', 'gun', 'battle'],
            'Aventura': ['adventure', 'story', 'quest', 'explore'],
            'Corrida': ['car', 'drive', 'speed', 'race', 'motor', 'vehicle'],
            'RPG': ['rpg', 'role', 'fantasy', 'magic', 'level'],
            'Estratégia': ['strategy', 'tactical', 'management', 'build'],
            'Esportes': ['sport', 'football', 'soccer', 'basket'],
            'Simulação': ['sim', 'simulator', 'real', 'life'],
            'Indie': ['indie', 'pixel', 'art', 'small'],
            'Casual': ['casual', 'puzzle', 'simple', 'easy'],
            'Acesso Antecipado': ['early', 'alpha', 'beta', 'preview']
          };
          
          return userPreferredSteamGenres.some((selectedGenre: string) => {
            const fallbackKeys = fallbackKeywords[selectedGenre] || [];
            return fallbackKeys.some(keyword => 
              gameTitle.includes(keyword) || 
              gameGenres.some(genre => genre.toLowerCase().includes(keyword))
            );
          });
        });
        
        // Adiciona os jogos do fallback
        filteredDeals = [...filteredDeals, ...fallbackDeals.slice(0, 15)];
        console.log(`Fallback adicionou ${fallbackDeals.length} jogos. Total: ${filteredDeals.length}`);
      }
      
      // Debug especial se ainda há poucos jogos
      if (userPreferredSteamGenres.includes('Corrida') && filteredDeals.length < 5) {
        console.log('🚨 AINDA POUCOS JOGOS DE CORRIDA! Verificando primeiros 10 jogos:');
        deals.slice(0, 10).forEach(deal => {
          console.log(`   - ${deal.game?.title}: gêneros [${deal.game?.genres?.join(', ') || 'nenhum'}]`);
        });
      }
    } else {
      console.log('Nenhum gênero selecionado, mostrando todos os jogos');
    }
    
    // Processar ofertas com destaque
    const processedDeals = filteredDeals.map(deal => {
      return {
        ...deal,
        isBestDeal: deal.discountPct >= 50, // Marcar como melhor oferta se desconto >= 50%
        highlightColor: deal.discountPct >= 70 ? '#FFD700' : deal.discountPct >= 50 ? '#ff8800' : null
      };
    });
    
    // Ordenar para colocar as melhores ofertas primeiro (maior desconto)
    const sortedDeals = processedDeals.sort((a, b) => {
      // Primeiro, ordenar por maior desconto
      if (a.discountPct !== b.discountPct) {
        return b.discountPct - a.discountPct; // Maior desconto primeiro
      }
      
      // Se empate no desconto, ordenar por menor preço
      return a.priceFinal - b.priceFinal;
    });
    
    console.log('Jogos finais após processamento:', sortedDeals.length);
    console.log('Melhores ofertas encontradas (>=50%):', sortedDeals.filter(d => d.isBestDeal).length);
    console.log('Super ofertas encontradas (>=70%):', sortedDeals.filter(d => d.discountPct >= 70).length);
    
    setDisplayDeals(sortedDeals);
  }

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDeals(deals)
      setSearchResults([])
    } else {
      const filtered = deals.filter(deal => 
        deal.game?.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredDeals(filtered)
    }
  }, [searchQuery, deals])

  // Função para buscar jogos na Steam API
  const searchSteamGames = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      console.log('Buscando jogos na Steam:', query)

      const resp = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}&limit=50`)
      if (!resp.ok) throw new Error(`Erro ${resp.status}: ${resp.statusText}`)
      const data = await resp.json()

      // If backend returned an array (adapter-level /search), use it directly
      let sourceArray: any[] = []
      if (Array.isArray(data)) {
        sourceArray = data
      } else if (data && Array.isArray(data.games)) {
        sourceArray = data.games
      }

      // Mapeia para o formato esperado
      const mappedResults = sourceArray.map((item: any, index: number) => {
        // Parse dos preços vindos como strings da busca
        const parsePriceString = (priceStr: string): number => {
          if (!priceStr || priceStr === 'Grátis' || priceStr === 'N/A') return 0
          const cleaned = priceStr.replace(/[R$\s]/g, '')
          if (cleaned.indexOf(',') > cleaned.indexOf('.') || (cleaned.indexOf(',') !== -1 && cleaned.indexOf('.') === -1)) {
            return parseFloat(cleaned.replace(',', '.')) || 0
          }
          return parseFloat(cleaned) || 0
        }

        // If item already has numeric priceFinal (from /search), prefer it
        const priceFinal = typeof item.priceFinal === 'number' ? item.priceFinal : parsePriceString(item.price || item.formattedPrice || '')
        const priceBase = typeof item.priceBase === 'number' ? item.priceBase : (item.originalPrice === item.price ? 0 : parsePriceString(item.originalPrice || ''))

        // Normalize appId field (some adapters use storeAppId)
        const appIdVal = item.appId || item.storeAppId || item.appid || item.app_id || null
        const urlVal = item.url || (appIdVal ? `https://store.steampowered.com/app/${appIdVal}` : '')

        // Tenta extrair appId do url se ainda não tivermos um appId
        let finalAppId: any = appIdVal
        if (!finalAppId && urlVal) {
          const mUrl = String(urlVal).match(/\/app\/(\d+)/)
          if (mUrl) finalAppId = mUrl[1]
        }

        // fallback: extrai uma sequência de dígitos longa do próprio item se presente
        if (!finalAppId && item._id) {
          const mId = String(item._id).match(/(\d{4,})/)
          if (mId) finalAppId = mId[1]
        }

        // Normalize cover URL and force https quando possível
        let cover = item.coverUrl || item.imageUrl || item.header_image || null
        if (cover && typeof cover === 'string') {
          cover = cover.trim()
          if (cover.startsWith('//')) cover = `https:${cover}`
          if (cover.startsWith('http://')) cover = cover.replace('http://', 'https://')
        }

        return {
          _id: `search-${finalAppId || index}`,
          appId: finalAppId ? Number(finalAppId) : undefined,
          priceBase,
          priceFinal,
          discountPct: typeof item.discountPct === 'number' ? item.discountPct : (typeof item.discount === 'number' ? item.discount : 0),
          // keep numeric prices and let the UI format according to selected currency
          formattedPrice: priceFinal === 0 ? 'GRÁTIS' : undefined,
          originalFormattedPrice: (priceBase && priceBase > 0 && priceBase !== priceFinal) ? undefined : null,
          isFree: item.isFree || item.price === 'Grátis',
          url: urlVal || '',
          game: {
            title: item.title,
            coverUrl: cover
          },
          store: {
            name: 'Steam'
          }
        }
      })

      try { console.debug('Mapped search results (preview):', mappedResults.slice(0, 6)) } catch (e) {}
      setSearchResults(mappedResults)
    } catch (err) {
      console.error('Erro na busca Steam:', err)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Debounce da busca
  const handleSearchChange = (text: string) => {
    setSearchQuery(text)
    
    // Limpar timeout anterior
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }
    
    // Buscar após 500ms de inatividade
    searchTimeout.current = setTimeout(() => {
      if (activeTab === 'search') {
        searchSteamGames(text)
      }
    }, 500)
  }

  // Trigger search when switching to search tab and query is present
  useEffect(() => {
    if (activeTab === 'search') {
      // focus input when entering search tab
      try { searchInputRef.current?.focus?.() } catch (e) {}
      if (searchQuery.trim().length >= 2) {
        // call immediately without waiting for debounce
        searchSteamGames(searchQuery)
      }
    }
  }, [activeTab])

  const fetchDeals = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🚀 Iniciando busca de ofertas...')
      console.log('📡 API_URL:', API_URL)
      console.log('🔗 Fazendo requisição para:', `${API_URL}/deals?limit=50`)
      
      // Timeout personalizado para debug
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        console.log('⏰ Timeout da requisição (15s)')
      }, 15000)
      
      // Usar diretamente a rota /deals que sabemos que funciona
      const response = await fetch(`${API_URL}/deals?limit=50`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      clearTimeout(timeoutId)
      
      console.log('📥 Resposta recebida:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Erro na resposta: ${response.status} - ${errorText}`)
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const curated = await response.json()
      console.log('📦 Dados recebidos:', curated?.length || 'não é array', typeof curated)
      
      if (!Array.isArray(curated) || curated.length === 0) {
        console.log('⚠️ API /deals retornou vazio ou não é array')
        setDeals([])
        setError('Nenhuma oferta encontrada no momento')
        return
      }
      
      console.log('✅ Processando', curated.length, 'ofertas...')
      console.log('📋 Primeiro item para debug:', JSON.stringify(curated[0], null, 2))

      // Os dados já vêm na estrutura correta da API, só precisamos garantir compatibilidade
      const sourceDeals: any[] = curated.map((item: any, index: number) => {
        console.log(`🎮 Processando jogo ${index}: ${item.game?.title || item.title || 'SEM TÍTULO'}`)
        
        return {
          _id: item._id || `deal-${item.appId || index}`,
          appId: item.appId,
          url: item.url,
          priceBase: item.priceBase || 0,
          priceFinal: item.priceFinal || 0,
          discountPct: item.discountPct || 0,
          game: {
            title: item.game?.title || item.title || 'Título não encontrado',
            coverUrl: item.game?.coverUrl || item.coverUrl,
            genres: item.game?.genres || item.genres || [],
            tags: item.game?.tags || item.tags || []
          },
          store: item.store || { name: 'Steam' }
        }
      })
      
      // Os dados já estão na estrutura correta, só remover duplicatas
      const uniqueDeals = sourceDeals.filter((deal: any, index: number, self: any[]) => 
        index === self.findIndex((d: any) => d._id === deal._id)
      )
      
      // Garantir placeholders mínimos para UI
      uniqueDeals.forEach((d: any) => {
        if (!d.game?.title) d.game.title = 'Jogo sem título'
        if (!d.game?.coverUrl || typeof d.game.coverUrl !== 'string' || d.game.coverUrl.trim() === '') {
          // Try to build a Steam header image if appId is present; otherwise leave null
          if (d.appId) d.game.coverUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${d.appId}/header.jpg`
        }
      })

      // Ordena por melhor desconto (base)
      const sortedDeals = uniqueDeals.sort((a: Deal, b: Deal) => b.discountPct - a.discountPct)
      
      // Coletar todos os gêneros únicos para atualizar as opções do modal
      const allGenres = new Set<string>();
      sortedDeals.forEach((deal: Deal) => {
        if (deal.game?.genres) {
          deal.game.genres.forEach((genre: string) => allGenres.add(genre));
        }
      });
      const sortedGenres = Array.from(allGenres).sort();
      console.log('=== DEBUG GÊNEROS ===');
      console.log('Total de gêneros únicos coletados:', sortedGenres.length);
      console.log('Gêneros únicos coletados:', sortedGenres);
      
      // Só atualiza se realmente encontrou gêneros, senão mantém o fallback
      if (sortedGenres.length > 0) {
        console.log('Setando gêneros coletados da API...');
        // Nota: setAvailableGenresFromGames removido - usando availableSteamGenres agora
        console.log('Gêneros disponíveis:', sortedGenres.slice(0, 10));
      } else {
        console.log('Nenhum gênero coletado da API, mantendo fallback...');
      }

      // Attempt to apply personalization based on onboarding prefs (favoriteGenres / genreWeights)
      ;(async () => {
        try {
          const prefs = await OnboardingService.loadLocalPrefs()
          const weights: Record<string, number> = (prefs && prefs.genreWeights) || {}
          if (!weights || Object.keys(weights).length === 0) {
            setDeals(sortedDeals || [])
            return
          }

          // mapping of genre -> keywords (same idea used in applyFilters)
          const genreKeywords: Record<string, string[]> = {
            'RPG': ['rpg', 'role', 'adventure'],
            'Ação': ['action', 'combat', 'fight', 'war'],
            'Aventura': ['adventure', 'quest', 'journey'],
            'Estratégia': ['strategy', 'tactical', 'empire'],
            'Simulação': ['simulator', 'farming', 'city', 'tycoon'],
            'Esportes': ['sport', 'football', 'soccer', 'racing'],
            'FPS': ['shooter', 'fps', 'gun'],
            'Puzzle': ['puzzle', 'brain', 'logic'],
            'Indie': ['indie', 'pixel']
          }

          const scoreFor = (deal: any) => {
            let s = 0
            // Prefer explicit genres returned by the backend
            const dg: string[] = (deal.game && deal.game.genres) || []
            if (dg && dg.length > 0) {
              for (const g of dg) {
                if (weights[g]) s += Number(weights[g]) || 0
              }
              return s
            }

            // Fallback: keyword match on title
            const title = (deal.game?.title || '').toLowerCase()
            for (const [genre, w] of Object.entries(weights)) {
              const kws = genreKeywords[genre] || [genre.toLowerCase()]
              if (kws.some(k => title.includes(k))) s += Number(w) || 0
            }
            return s
          }

          const personalized = sortedDeals.slice().sort((a: Deal, b: Deal) => {
            // primary sort by discountPct
            const d = (b.discountPct || 0) - (a.discountPct || 0)
            if (Math.abs(d) > 1e-6) return d
            // secondary sort by personalization score
            const sb = scoreFor(b) - scoreFor(a)
            if (Math.abs(sb) > 1e-6) return sb > 0 ? 1 : -1
            return 0
          })

          setDeals(personalized || sortedDeals)
        } catch (e) {
          // fallback to base order on any error
          setDeals(sortedDeals || [])
        }
      })()
      
    } catch (err: any) {
      console.error('💥 Erro ao buscar ofertas:', err)
      console.error('💥 Tipo do erro:', typeof err)
      console.error('💥 Mensagem:', err?.message || 'Erro desconhecido')
      
      let errorMessage = 'Erro ao carregar ofertas'
      if (err?.name === 'AbortError') {
        errorMessage = 'Timeout: Verifique sua conexão'
      } else if (err?.message?.includes('Network')) {
        errorMessage = 'Erro de rede: Verifique sua internet'
      } else if (err?.message) {
        errorMessage = `Erro: ${err.message}`
      }
      
      setError(errorMessage)
      setDeals([])
    } finally {
      console.log('🏁 Finalizando busca de ofertas')
      setLoading(false)
    }
  }

  // Pull-to-refresh handler for Home
  const onRefresh = async () => {
    try {
      setRefreshing(true)
      await fetchDeals()
    } finally {
      setRefreshing(false)
    }
  }

  const loadWishlistCount = async () => {
    try {
      const wishlist = await WishlistService.getWishlist()
      setWishlistCount(wishlist.length)
    } catch (error) {
      console.error('Erro ao carregar contador da wishlist:', error)
    }
  }

  const handleGamePress = (deal: Deal) => {
  // Para deals normais, prefere usar appId; tenta extrair do url ou do _id como fallback
  let appId: number | null = (deal as any).appId || null
  console.debug('handleGamePress start', { id: deal._id, appId: (deal as any).appId, url: (deal as any).url, game: deal.game })

    if (!appId) {
      // tenta extrair do URL (ex: https://store.steampowered.com/app/1849250)
      const url = (deal as any).url || ''
      const m = url && typeof url === 'string' ? url.match(/\/app\/(\d+)/) : null
      if (m) appId = parseInt(m[1], 10)
    }

    if (!appId && deal._id) {
      // extrai a primeira sequência longa de dígitos do _id como fallback
      const m2 = String(deal._id).match(/(\d{4,})/)
      if (m2) appId = parseInt(m2[1], 10)
    }

    if (!appId) {
      console.warn('handleGamePress: não foi possível determinar appId para deal', deal)
      return
    }

    setSelectedGameId(appId)
    setSelectedDeal(deal)
    setGameDetailsModalVisible(true)
  }

  const handleCloseGameDetails = () => {
    setGameDetailsModalVisible(false)
    setSelectedGameId(null)
    setSelectedDeal(null)
    loadWishlistCount() // Recarregar contador após possíveis mudanças na wishlist
  }

  const handleAddToWishlist = async (appId: number, title: string, currentPrice: number, desiredPrice: number, coverUrl: string) => {
    try {
      await WishlistService.addToWishlist({
        appId,
        title,
        currentPrice,
        desiredPrice,
        coverUrl,
        store: 'Steam',
        url: `https://store.steampowered.com/app/${appId}/`
      })
      await loadWishlistCount()
      await loadWishlistGames()
    } catch (error) {
      console.error('Erro ao adicionar à wishlist:', error)
    }
  }

  const handleRemoveFromWishlist = async (appId: number) => {
    try {
      await WishlistService.removeFromWishlist(appId)
      await loadWishlistCount()
      await loadWishlistGames()
    } catch (error) {
      console.error('Erro ao remover da wishlist:', error)
    }
  }

  const handleUpdateDesiredPrice = async (appId: number, newPrice: number) => {
    try {
      await WishlistService.updateDesiredPrice(appId, newPrice)
      await loadWishlistGames()
    } catch (error) {
      console.error('Erro ao atualizar preço desejado:', error)
    }
  }

  const loadWishlistGames = async () => {
    try {
      const games = await WishlistService.getWishlist()
      setWishlistGames(games)
    } catch (error) {
      console.error('Erro ao carregar jogos da wishlist:', error)
    }
  }

  const formatPrice = (priceInReais: number | undefined | null, currency: string = 'BRL') => {
    try {
      const { formatPrice: fp } = useCurrency() as any
      return fp(priceInReais ?? 0)
    } catch (e) {
      if (priceInReais === null || priceInReais === undefined || isNaN(priceInReais) || priceInReais === 0) return 'Grátis'
      try {
        // Use Intl with the provided currency as a sensible fallback
        const locale = currency === 'BRL' ? 'pt-BR' : 'en-US'
        return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(priceInReais)
      } catch (e2) {
        return `${priceInReais.toFixed(2)} ${currency}`
      }
    }
  }

  // Currency subtitle helper component uses hook from context
  const CurrencySubtitle: React.FC = () => {
    try {
      const { currency } = useCurrency() as any
      return <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 2 }}>{currency}</Text>
    } catch (e) {
      return <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 2 }}>Real Brasileiro (BRL)</Text>
    }
  }

  const getBestDeal = () => {
    return deals.reduce((best, current) => 
      current.discountPct > best.discountPct ? current : best, deals[0])
  }


  const openGameDetails = (deal: Deal) => {
    handleGamePress(deal)
  }

  const openPriceHistoryModal = (gameId?: number, gameName?: string) => {
    setSelectedGameForHistory({ id: gameId, name: gameName })
    setShowPriceHistoryModal(true)
  }

  const closePriceHistoryModal = () => {
    setShowPriceHistoryModal(false)
    setSelectedGameForHistory(null)
  }

  const renderHeader = () => (
    <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1 }}>
            Looton
          </Text>
          <Text style={{ fontSize: 16, color: '#9CA3AF', marginTop: 4 }}>
            Melhores ofertas de jogos
          </Text>
        </View>

        {/* Ícone de configurações */}
        <TouchableOpacity
          onPress={() => setShowPreferencesModal(true)}
          style={{ 
            backgroundColor: '#374151', 
            padding: 12, 
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4
          }}
        >
          <Ionicons name="settings" size={24} color="#E5E7EB" />
        </TouchableOpacity>

      </View>
    </View>
  )



  const renderGameCard = ({ item: deal }: { item: Deal & { isBestDeal?: boolean, highlightColor?: string } }) => {
    const isHighlighted = deal.discountPct >= 50;
    const isSuperDeal = deal.discountPct >= 70;
    const highlightColor = deal.highlightColor || (isSuperDeal ? '#FFD700' : isHighlighted ? '#ff8800' : '#FFD700');
    
    return (
      <TouchableOpacity
        onPress={() => openGameDetails(deal)}
        activeOpacity={0.95}
        style={{
          backgroundColor: '#374151',
          borderRadius: 16,
          marginBottom: 16,
          overflow: 'hidden',
          shadowColor: isHighlighted ? highlightColor : '#000',
          shadowOffset: { width: 0, height: isHighlighted ? 0 : 4 },
          shadowOpacity: isHighlighted ? 0.8 : 0.3,
          shadowRadius: isHighlighted ? 12 : 8,
          elevation: isHighlighted ? 16 : 8,
          borderWidth: isHighlighted ? 2 : 0,
          borderColor: isHighlighted ? highlightColor : 'transparent'
        }}
      >
  {isHighlighted && (
        <View style={{ position: 'absolute', top: 10, right: 10, zIndex: 20, alignItems: 'center' }}>
          <View
            accessible
            accessibilityLabel={isSuperDeal ? "Super Oferta!" : "Ótima Oferta!"}
            style={{
              backgroundColor: '#111827',
              padding: 6,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: highlightColor,
              shadowColor: highlightColor,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.6,
              shadowRadius: 6,
              elevation: 10,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Ionicons name={isSuperDeal ? "flash" : "star"} size={20} color={highlightColor} />
          </View>
          <Text style={{ color: highlightColor, fontSize: 11, marginTop: 6, fontWeight: '600' }}>
            {isSuperDeal ? "Super Oferta!" : "Ótima Oferta!"}
          </Text>
        </View>
      )}
      {/* Removido: botões de favorito e adicionar à lista foram movidos para o botão 'Desejar' no modal */}

      <GameCover
        title={deal.game?.title || 'Sem título'}
        coverUrl={deal.game?.coverUrl}
        aspect={16/9}
        width="100%"
        onPress={() => openGameDetails(deal)}
      />
        
        <View style={{ padding: isTablet ? 20 : 16 }}>
        <Text style={{ 
          color: '#FFFFFF', 
          fontSize: isTablet ? 20 : 18, 
          fontWeight: '700',
          marginBottom: isTablet ? 10 : 8
        }}>
          {deal.game?.title || 'Sem título'}
        </Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            {(deal.discountPct || 0) > 0 && (
              <PriceText
                value={deal.priceBase}
                style={{ color: '#9CA3AF', fontSize: isTablet ? 16 : 14, textDecorationLine: 'line-through', marginBottom: 4 }}
              />
            )}
            {/* Final price: highlight in green when discounted */}
            <PriceText
              value={deal.priceFinal}
              style={((deal.discountPct || 0) > 0 || (deal.priceBase && deal.priceFinal < deal.priceBase))
                ? { color: '#10B981', backgroundColor: 'rgba(16,185,129,0.08)', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 4, fontSize: isTablet ? 26 : 22, fontWeight: '900', lineHeight: isTablet ? 26 : 22, textShadowColor: 'rgba(16,185,129,0.06)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 1, alignSelf: 'flex-start' }
                : { color: (deal as any).isFree || deal.priceFinal === 0 ? '#3B82F6' : '#FFFFFF', fontSize: isTablet ? 26 : 22, fontWeight: '800' }
              }
            />
          </View>
          
          {(deal.discountPct || 0) > 0 && (
            <View style={{ 
              backgroundColor: '#DC2626', 
              paddingHorizontal: 12, 
              paddingVertical: 6, 
              borderRadius: 20 
            }}>
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: isTablet ? 14 : 12, 
                fontWeight: '700' 
              }}>
                -{Math.round(deal.discountPct || 0)}%
              </Text>
            </View>
          )}
        </View>
        
        {/* Badge de menor preço histórico - safe lazy loading */}
        <LazyLowestPriceBadge
          gameId={deal.appId}
          currentPrice={deal.priceFinal}
          gameName={deal.game?.title}
          onPress={() => openPriceHistoryModal(deal.appId, deal.game?.title)}
        />
        
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: '#4B5563'
        }}>
          <Ionicons name="storefront-outline" size={isTablet ? 18 : 16} color="#9CA3AF" />
          <Text style={{ 
            color: '#9CA3AF', 
            fontSize: isTablet ? 14 : 12,
            marginLeft: 6,
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            {deal.store?.name || 'Loja'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

// Onboarding modal render helper near the end of the file
const OnboardingModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const [step, setStep] = useState(1)
  const [selected, setSelected] = useState<string[]>([])

  if (!visible) return null

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0b1020' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 12 }}>
          <TouchableOpacity onPress={async () => { await OnboardingService.saveLocalPrefs({ favoriteGenres: [], genreWeights: {} }); onClose() }} style={{ padding: 8 }}>
            <Text style={{ color: '#9CA3AF' }}>Pular</Text>
          </TouchableOpacity>
        </View>
        {step === 1 && (
          <OnboardingStep1
            initial={selected}
            onNext={(sel: string[]) => { setSelected(sel); setStep(2) }}
          />
        )}
        {step === 2 && (
          <OnboardingStep2
            initial={selected.map(s => ({ genre: s, weight: 1 }))}
            onSubmit={async (weights: { genre: string; weight: number }[]) => {
              // transform to answers shape and POST
              const answers = weights.map((w: { genre: string; weight: number }) => ({ questionId: w.genre, genres: [w.genre], weight: w.weight }))
              let prefs: any = null
              try {
                // userId may be empty string for anonymous - send empty userId as placeholder
                prefs = await OnboardingService.postAnswers(userId || '', answers)
              } catch (e) {
                console.warn('Onboarding submit failed (post), falling back to local prefs', e)
              }

              try {
                // If postAnswers returned null or undefined, compute simple fallback via the service
                if (!prefs) prefs = await OnboardingService.postAnswers(userId || '', answers)
                await OnboardingService.saveLocalPrefs(prefs)
              } catch (e) {
                console.warn('Failed saving local prefs', e)
                try { await OnboardingService.saveLocalPrefs({ favoriteGenres: selected, genreWeights: {} }) } catch (e2) {}
              }

              // small delay to let UI update before closing modal (avoid abrupt unmount race)
              setTimeout(() => onClose(), 120)
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  )
}


const CurrencyModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  // lazy hook usage
  const ctx = (() => {
    try { return useCurrency() as any } catch (e) { return null }
  })()

  const currency = ctx?.currency || 'BRL'
  const setCurrency = ctx?.setCurrency || (async () => {})

  const currencyList = [
    { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'AUD', name: 'Australian Dollar', symbol: '$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: '$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' }
  ]

  const [query, setQuery] = useState('')
  const filtered = currencyList.filter(c => c.code.toLowerCase().includes(query.toLowerCase()) || c.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: '90%', maxWidth: 560, backgroundColor: '#32343a', borderRadius: 16, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: '#E5E7EB', fontSize: 18, fontWeight: '700' }}>Selecionar Moeda</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Ionicons name="close" size={22} color="#E5E7EB" />
            </TouchableOpacity>
          </View>

          <View style={{ paddingBottom: 12 }}>
            <TextInput
              placeholder="Buscar moeda (código ou nome)"
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              style={{ backgroundColor: '#26272b', color: '#E5E7EB', padding: 10, borderRadius: 10 }}
            />
          </View>

          <View style={{ maxHeight: 360 }}>
            <ScrollView contentContainerStyle={{ paddingVertical: 8 }} showsVerticalScrollIndicator>
              {filtered.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  onPress={async () => {
                    await setCurrency(c.code)
                    onClose()
                  }}
                  style={{ padding: 12, backgroundColor: c.code === currency ? '#3B82F6' : '#26272b', borderRadius: 10, marginBottom: 8 }}
                >
                  <Text style={{ color: c.code === currency ? '#FFFFFF' : '#E5E7EB', fontSize: 15, fontWeight: '700' }}>{c.code} — {c.name}</Text>
                  <Text style={{ color: c.code === currency ? '#FFFFFF' : '#9CA3AF', marginTop: 4 }}>{c.symbol}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}



  const renderBottomNav = () => (
    <View style={{ 
      backgroundColor: '#374151', 
      flexDirection: 'row',
      paddingBottom: 34,
      paddingTop: 16,
      paddingHorizontal: 20,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 12
    }}>
      {[
        { key: 'home', icon: 'home', label: 'Início' },
        { key: 'hardware', icon: 'cube', label: 'Hardware' },
        { key: 'search', icon: 'search', label: 'Buscar' },
        { key: 'favorites', icon: 'heart', label: 'Desejos' },
        { key: 'profile', icon: 'person', label: 'Perfil' }
      ].map((tab: { key: string; icon: string; label: string }) => (
        <TouchableOpacity
          key={tab.key}
          onPress={() => setActiveTab(tab.key as any)}
          style={{
            flex: 1,
            alignItems: 'center',
            paddingVertical: 8
          }}
        >
          <Ionicons 
            name={activeTab === tab.key ? (tab.icon as any) : (`${tab.icon}-outline` as any)} 
            size={24} 
            color={activeTab === tab.key ? '#3B82F6' : '#9CA3AF'} 
          />
          <Text style={{ 
            color: activeTab === tab.key ? '#3B82F6' : '#9CA3AF',
            fontSize: 12,
            fontWeight: activeTab === tab.key ? '600' : '400',
            marginTop: 4
          }}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )

  // Renderização condicional baseada no estado da app
  if (appState === 'splash') {
    return <SplashScreen onFinish={handleSplashFinish} />
  }

  if (appState === 'onboarding') {
    return <OnboardingCarousel onFinish={handleOnboardingFinish} />
  }

  if (appState === 'terms') {
    return (
      <TermsOfServiceModal
        visible={true}
        onAccept={handleTermsAccept}
      />
    )
  }

  // App principal
  return (
    <CurrencyProvider>
      <View style={{ flex: 1, backgroundColor: '#1F2937' }}>
      <StatusBar style="light" />
      
      <Animated.View style={{ 
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }}>
        {activeTab === 'home' && (
          <View style={{ flex: 1 }}>
            {renderHeader()}
            
            <ScrollView 
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#3B82F6"
                  colors={["#3B82F6"]}
                />
              }
            >
              {loading && (
                <View style={{ padding: 50, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={{ color: '#9CA3AF', marginTop: 20, fontSize: 16 }}>
                    Carregando ofertas...
                  </Text>
                </View>
              )}

              {error && (
                <View style={{ 
                  marginHorizontal: 20,
                  padding: 24, 
                  backgroundColor: '#374151', 
                  borderRadius: 16, 
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: '#DC2626'
                }}>
                  <Text style={{ color: '#F87171', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                    Erro ao carregar ofertas
                  </Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 20 }}>
                    {error}
                  </Text>
                  <TouchableOpacity
                    onPress={fetchDeals}
                    style={{
                      backgroundColor: '#3B82F6',
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 12,
                      marginTop: 12,
                      alignSelf: 'flex-start'
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                      Tentar novamente
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {!loading && !error && (deals.length > 0 || displayDeals.length > 0) && (
                <>
                  <View style={{ paddingHorizontal: isTablet ? 40 : 20, maxWidth: isTablet ? 800 : '100%', alignSelf: 'center', width: '100%' }}>
                    <View style={{ 
                      flexDirection: 'row', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: 20
                    }}>
                      <Text style={{ 
                        color: '#FFFFFF', 
                        fontSize: isTablet ? 28 : 24, 
                        fontWeight: '700'
                      }}>
                        {hasActiveFilters() ? 'Ofertas Filtradas' : 'Todas as Ofertas'}
                      </Text>
                      
                      <TouchableOpacity
                        onPress={() => setShowFilters(true)}
                        style={{
                          backgroundColor: hasActiveFilters() ? '#3B82F6' : '#374151',
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 12,
                          flexDirection: 'row',
                          alignItems: 'center'
                        }}
                      >
                        <Ionicons 
                          name="filter" 
                          size={16} 
                          color={hasActiveFilters() ? '#FFFFFF' : '#9CA3AF'} 
                        />
                        <Text style={{ 
                          color: hasActiveFilters() ? '#FFFFFF' : '#9CA3AF',
                          fontSize: 14,
                          fontWeight: '600',
                          marginLeft: 6
                        }}>
                          Filtros
                        </Text>
                        {hasActiveFilters() && (
                          <View style={{
                            backgroundColor: '#FFFFFF',
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            marginLeft: 6
                          }} />
                        )}
                      </TouchableOpacity>
                    </View>
                    
                    <FlatList
                      data={displayDeals.length > 0 ? displayDeals : deals}
                      renderItem={renderGameCard}
                      keyExtractor={(item, index) => `${item._id || 'game'}-${index}`}
                      scrollEnabled={false}
                      showsVerticalScrollIndicator={false}
                      removeClippedSubviews={true}
                      initialNumToRender={5}
                      windowSize={5}
                      maxToRenderPerBatch={3}
                    />
                  </View>
                </>
              )}
              
              <View style={{ height: 120 }} />
            </ScrollView>
          </View>
        )}

        {activeTab === 'search' && (
          <View style={{ flex: 1, paddingTop: 60 }}>
            <View style={{ paddingHorizontal: isTablet ? 40 : 20, marginBottom: 20, maxWidth: isTablet ? 800 : '100%', alignSelf: 'center', width: '100%' }}>
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: isTablet ? 32 : 28, 
                fontWeight: '800',
                marginBottom: 20,
                textAlign: isTablet ? 'center' : 'left'
              }}>
                Buscar Jogos
              </Text>
              
              <View style={{ 
                flexDirection: 'row', 
                backgroundColor: '#374151', 
                borderRadius: 16, 
                paddingHorizontal: 16,
                paddingVertical: 4,
                marginBottom: 20,
                alignItems: 'center'
              }}>
                <Ionicons name="search-outline" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                <TextInput
                  ref={searchInputRef}
                  placeholder="Procure por jogos"
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  style={{
                    flex: 1,
                    color: '#FFFFFF',
                    fontSize: 16,
                    paddingVertical: 12
                  }}
                />
                {isSearching && (
                  <ActivityIndicator size="small" color="#3B82F6" style={{ marginLeft: 8 }} />
                )}
                <TouchableOpacity
                  style={{
                    marginLeft: 8,
                    padding: 8,
                    backgroundColor: hasActiveFilters() ? '#3B82F6' : '#333',
                    borderRadius: 8
                  }}
                  onPress={() => setShowFilters(!showFilters)}
                >
                  <Ionicons 
                    name="options" 
                    size={16} 
                    color={hasActiveFilters() ? '#000' : '#FFF'} 
                  />
                </TouchableOpacity>
              </View>

              {searchQuery.length > 0 && (
                <Text style={{ 
                  color: '#9CA3AF', 
                  fontSize: 14,
                  marginBottom: 16
                }}>
                  Buscando em toda a Steam Store...
                </Text>
              )}

              {/* Filtros */}
              {showFilters && (
                <FilterChips
                  selectedGenres={selectedGenres}
                  selectedTags={selectedTags}
                  availableGenres={availableGenres}
                  availableTags={availableTags}
                  onGenreToggle={toggleGenre}
                  onTagToggle={toggleTag}
                  onClear={clearFilters}
                />
              )}
            </View>

            <FlatList
              data={searchQuery.trim().length > 0 ? searchResults : []}
              renderItem={renderGameCard}
              keyExtractor={(item, index) => `search-${item._id || 'game'}-${index}`}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              initialNumToRender={8}
              windowSize={5}
              maxToRenderPerBatch={5}
              ListEmptyComponent={() => (
                <View style={{ alignItems: 'center', marginTop: 50 }}>
                  {isSearching ? (
                    <>
                      <ActivityIndicator size="large" color="#3B82F6" />
                      <Text style={{ color: '#9CA3AF', fontSize: 18, marginTop: 16 }}>
                        Procurando jogos...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="search-outline" size={64} color="#4B5563" />
                      <Text style={{ color: '#9CA3AF', fontSize: 18, marginTop: 16 }}>
                        {searchQuery ? 'Nenhum jogo encontrado' : 'Procure por jogos'}
                      </Text>
                      {!searchQuery && (
                        <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                          Procure por jogos na Steam Store
                        </Text>
                      )}
                    </>
                  )}
                </View>
              )}
            />
          </View>
        )}

        {activeTab === 'favorites' && (
          <FavoritesAndLists />
        )}

        {activeTab === 'hardware' && (
          // Embed hardware screen content to keep it as a regular tab
          <View style={{ flex: 1, paddingTop: 60 }}>
            {/* The inner component brings its own header and list */}
            {(() => {
              const { HardwareInner } = require('./hardware')
              const Comp = HardwareInner
              return <Comp />
            })()}
          </View>
        )}

        {activeTab === 'profile' && (
          <ScrollView style={{ flex: 1, paddingTop: 60 }}>
            <View style={{ paddingHorizontal: isTablet ? 40 : 20, maxWidth: isTablet ? 600 : '100%', alignSelf: 'center', width: '100%' }}>
              {/* Header do Perfil */}
              <View style={{ alignItems: 'center', marginBottom: 30 }}>
                <View style={{
                  width: isTablet ? 100 : 80,
                  height: isTablet ? 100 : 80,
                  borderRadius: isTablet ? 50 : 40,
                  backgroundColor: '#374151',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16
                }}>
                  <Ionicons name="person" size={isTablet ? 50 : 40} color="#9CA3AF" />
                </View>
                <Text style={{ 
                  color: '#FFFFFF', 
                  fontSize: isTablet ? 28 : 24, 
                  fontWeight: '700',
                  marginBottom: 4,
                  textAlign: 'center'
                }}>
                  Usuário Looton
                </Text>
                <Text style={{ 
                  color: '#9CA3AF', 
                  fontSize: isTablet ? 18 : 16,
                  textAlign: 'center'
                }}>
                  Caçador de ofertas
                </Text>
              </View>

              {/* Estatísticas */}
              <View style={{
                backgroundColor: '#374151',
                borderRadius: 16,
                padding: isTablet ? 24 : 20,
                marginBottom: 20
              }}>
                <Text style={{ 
                  color: '#FFFFFF', 
                  fontSize: isTablet ? 20 : 18, 
                  fontWeight: '700',
                  marginBottom: 16,
                  textAlign: isTablet ? 'center' : 'left'
                }}>
                  Suas Estatísticas
                </Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ color: '#3B82F6', fontSize: isTablet ? 28 : 24, fontWeight: '800' }}>
                      {deals.length}
                    </Text>
                    <Text style={{ color: '#9CA3AF', fontSize: isTablet ? 14 : 12, textAlign: 'center' }}>
                      Ofertas Vistas
                    </Text>
                  </View>
                  
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <PriceText value={0} style={{ color: '#3B82F6', fontSize: isTablet ? 28 : 24, fontWeight: '800' }} />
                    <Text style={{ color: '#9CA3AF', fontSize: isTablet ? 14 : 12, textAlign: 'center' }}>
                      Economizado
                    </Text>
                  </View>
                  
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ color: '#F59E0B', fontSize: isTablet ? 28 : 24, fontWeight: '800' }}>
                      0
                    </Text>
                    <Text style={{ color: '#9CA3AF', fontSize: isTablet ? 14 : 12, textAlign: 'center' }}>
                      Favoritos
                    </Text>
                  </View>
                </View>
              </View>

              {/* Configurações */}
              <View style={{
                backgroundColor: '#374151',
                borderRadius: 16,
                marginBottom: 20
              }}>
                <Text style={{ 
                  color: '#FFFFFF', 
                  fontSize: isTablet ? 20 : 18, 
                  fontWeight: '700',
                  padding: isTablet ? 24 : 20,
                  paddingBottom: 0,
                  textAlign: isTablet ? 'center' : 'left'
                }}>
                  Configurações
                </Text>

                {[
                  { icon: 'card-outline', title: 'Moeda', subtitle: 'Real Brasileiro (BRL)' },
                  { icon: 'shield-checkmark-outline', title: 'Privacidade', subtitle: 'Gerenciar dados' },
                  { icon: 'help-circle-outline', title: 'Ajuda', subtitle: 'Suporte e FAQ' }
                ].map((item, index) => {
                  if (item.title === 'Moeda') {
                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() => setShowCurrencyModal(true)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: isTablet ? 24 : 20,
                          borderBottomWidth: index < 2 ? 1 : 0,
                          borderBottomColor: '#4B5563'
                        }}
                      >
                        <Ionicons name={item.icon as any} size={isTablet ? 28 : 24} color="#9CA3AF" />
                        <View style={{ flex: 1, marginLeft: isTablet ? 20 : 16 }}>
                          <Text style={{ color: '#FFFFFF', fontSize: isTablet ? 18 : 16, fontWeight: '600' }}>
                            {item.title}
                          </Text>
                          <CurrencySubtitle />
                        </View>
                        <Ionicons name="chevron-forward" size={isTablet ? 24 : 20} color="#6B7280" />
                      </TouchableOpacity>
                    )
                  }

                  return (
                    <TouchableOpacity
                      key={index}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: isTablet ? 24 : 20,
                        borderBottomWidth: index < 2 ? 1 : 0,
                        borderBottomColor: '#4B5563'
                      }}
                    >
                      <Ionicons name={item.icon as any} size={isTablet ? 28 : 24} color="#9CA3AF" />
                      <View style={{ flex: 1, marginLeft: isTablet ? 20 : 16 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: isTablet ? 18 : 16, fontWeight: '600' }}>
                          {item.title}
                        </Text>
                        <Text style={{ color: '#9CA3AF', fontSize: isTablet ? 16 : 14, marginTop: 2 }}>
                          {item.subtitle}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={isTablet ? 24 : 20} color="#6B7280" />
                    </TouchableOpacity>
                  )
                })}
              </View>



              {/* Sobre o App */}
              <View style={{
                backgroundColor: '#374151',
                borderRadius: 16,
                padding: isTablet ? 24 : 20,
                marginBottom: 40
              }}>
                <Text style={{ 
                  color: '#FFFFFF', 
                  fontSize: isTablet ? 20 : 18, 
                  fontWeight: '700',
                  marginBottom: 12,
                  textAlign: isTablet ? 'center' : 'left'
                }}>
                  Sobre o Looton
                </Text>
                <Text style={{ 
                  color: '#9CA3AF', 
                  fontSize: isTablet ? 16 : 14,
                  lineHeight: isTablet ? 24 : 20,
                  textAlign: isTablet ? 'center' : 'left'
                }}>
                  Versão 1.0.0{'\n'}
                  O melhor aplicativo para encontrar ofertas de jogos.{'\n'}
                  Desenvolvido com ❤️ para gamers.
                </Text>
              </View>

            </View>
          </ScrollView>
        )}
      </Animated.View>

      {renderBottomNav()}

      {selectedGameId && (
        <GameDetailsModal
          appId={selectedGameId!}
          visible={gameDetailsModalVisible}
          onClose={() => setGameDetailsModalVisible(false)}
          currentPrice={selectedDeal?.priceFinal}
          originalPrice={selectedDeal?.priceBase}
          discount={selectedDeal?.discountPct}
          gameTitle={selectedDeal?.game?.title}
          userId={userId}
        />
      )}

      <WishlistTab
        visible={activeTab === 'wishlist'}
        onClose={() => setActiveTab('home')}
      />

      <CurrencyModal
        visible={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
      />



      {/* Modal de adicionar à lista */}
      {selectedGameForList && (
        <AddToListModal
          visible={showAddToListModal}
          onClose={() => {
            setShowAddToListModal(false)
            setSelectedGameForList(null)
          }}
          gameId={selectedGameForList.id}
          gameTitle={selectedGameForList.title}
          userId={userId}
        />
      )}

      {/* Modal de filtros */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#1F2937' }}>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#374151'
          }}>
            <Text style={{ 
              color: '#FFFFFF', 
              fontSize: 20, 
              fontWeight: '700' 
            }}>
              Filtros
            </Text>
            <TouchableOpacity
              onPress={() => setShowFilters(false)}
              style={{
                backgroundColor: '#374151',
                borderRadius: 20,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Ionicons name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <FilterChips
              selectedGenres={selectedGenres}
              selectedTags={selectedTags}
              availableGenres={availableGenres}
              availableTags={availableTags}
              onGenreToggle={toggleGenre}
              onTagToggle={toggleTag}
              onClear={clearFilters}
            />
          </ScrollView>

          <View style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderTopColor: '#374151'
          }}>
            <TouchableOpacity
              onPress={() => setShowFilters(false)}
              style={{
                backgroundColor: '#3B82F6',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center'
              }}
            >
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: 16, 
                fontWeight: '600' 
              }}>
                Aplicar Filtros
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal de Preferências - Steam Genres */}
      <SteamGenresPreferencesModal
        visible={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        currentPreferences={userPreferredSteamGenres}
        onSave={async (selectedGenreIds: string[]) => {
          try {
            console.log('=== SALVANDO PREFERÊNCIAS STEAM ===')
            console.log('Gêneros selecionados:', selectedGenreIds)
            
            // Atualizar estado local
            setUserPreferredSteamGenres(selectedGenreIds)
            
            // Salvar localmente como fallback
            const preferences = {
              preferredSteamGenreIds: selectedGenreIds,
              favoriteGenres: selectedGenreIds, // compatibilidade com sistema antigo
              minDiscount: 0,
              stores: []
            }
            
            // Salvar localmente (usar método disponível)
            await OnboardingService.saveLocalPrefs(preferences)
            
            // Recarregar deals com novo boost
            await fetchDeals()
            
            setShowPreferencesModal(false)
            showToast('Preferências salvas! 🎮')
            
          } catch (error) {
            console.error('Erro ao salvar preferências:', error)
            showToast('Erro ao salvar preferências')
          }
        }}
      />

      {/* Modal de histórico de preços */}
      <PriceHistoryModal
        visible={showPriceHistoryModal}
        onClose={closePriceHistoryModal}
        gameId={selectedGameForHistory?.id}
        gameName={selectedGameForHistory?.name}
      />
      
      </View>
    </CurrencyProvider>
  )
}
