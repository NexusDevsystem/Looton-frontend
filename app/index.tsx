import { View, Text, ScrollView, ActivityIndicator, Image, TouchableOpacity, Dimensions, TextInput, Modal, SafeAreaView, FlatList, Animated, RefreshControl, Platform } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
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
import { FavoriteButton } from '../src/components/FavoriteButton'
import SmartNotificationService from '../src/services/SmartNotificationService'

import SteamPriceHistoryService from '../src/services/SteamPriceHistoryService'
import { DonationModal } from '../src/components/DonationComponents'
import DonationService from '../src/services/DonationService'

import { AddToListModal } from '../src/components/AddToListModal'
import { FilterChips } from '../src/components/FilterChips'
import { useFilters } from '../src/hooks/useFilters'
import { SteamGenresPreferencesModal } from '../src/components/SteamGenresPreferencesModal'
import { fetchCuratedFeed, SteamGenre, UserPreferences } from '../src/services/SteamGenresService'
import AdBanner from '../src/components/AdBanner'
import { showToast } from '../src/utils/SimpleToast'
import { TermsOfServiceModal } from '../src/components/TermsOfServiceModal'
import { SplashScreen } from '../src/components/SplashScreen'
import { OnboardingCarousel } from '../src/components/OnboardingCarousel'
import { useGameFeed, GameItem } from '../src/hooks/useGameFeed'

interface Deal {
  _id: string
  appId?: number
  url: string
  priceBase: number
  priceFinal: number
  discountPct: number
  kind?: 'game' | 'dlc' | 'package' | 'bundle' // Classificação real da Steam
  steamGenres?: Array<{ id: string; name: string }>
  imageUrls?: string[]
  image?: string
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
  
  // Filtro de loja
  const [storeFilter, setStoreFilter] = useState<'all' | 'steam' | 'epic'>('all')
  const [selectedGameDetails, setSelectedGameDetails] = useState<any>(null)
  const [gameDetailsModalVisible, setGameDetailsModalVisible] = useState(false)
  const [wishlistGames, setWishlistGames] = useState<any[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([])
  const [searchResults, setSearchResults] = useState<Deal[]>([])
  const [originalSearchResults, setOriginalSearchResults] = useState<Deal[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const [refreshing, setRefreshing] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showAddToListModal, setShowAddToListModal] = useState(false)
  const [selectedGameForList, setSelectedGameForList] = useState<{id: string, title: string} | null>(null)
  const [userPreferredSteamGenres, setUserPreferredSteamGenres] = useState<string[]>([])
  const [showPreferencesModal, setShowPreferencesModal] = useState(false)
  const [availableSteamGenres, setAvailableSteamGenres] = useState<SteamGenre[]>([])
  const [loadingGenres, setLoadingGenres] = useState(false)
  const [showCurrencyModal, setShowCurrencyModal] = useState(false)

  
  // Estados dos novos serviços
  const [showSmartNotification, setShowSmartNotification] = useState(false)
  const [currentNotification, setCurrentNotification] = useState<any>(null)
  const [priceAnalysis, setPriceAnalysis] = useState<Map<number, any>>(new Map())
  const [showDonationModal, setShowDonationModal] = useState(false) // Modal de doação controlado pelo usuário
  
  // Filtro de busca: 'all' | 'games' | 'dlcs'
  const [searchFilter, setSearchFilter] = useState<'all' | 'games' | 'dlcs'>('games')
  const [showTermsModal, setShowTermsModal] = useState(false)
  
  // Estados do fluxo de inicialização
  const [appState, setAppState] = useState<'splash' | 'onboarding' | 'terms' | 'app'>('splash')
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)
  
  // Estado para ordenação
  const [sortBy, setSortBy] = useState<'best_price' | 'biggest_discount'>('best_price')
  
  // Mock user ID - em um app real viria do contexto de autenticação
  // Leave empty to treat as unauthenticated in dev by default
  const [userId, setUserId] = useState('')
  const slideAnim = useRef(new Animated.Value(50)).current
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const searchInputRef = useRef<TextInput>(null)


  
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
  
  // Hook do novo feed
  const { 
    data: gameItems, 
    loading: feedLoading, 
    error: feedError, 
    hasNextPage, 
    refresh: refreshFeed, 
    loadMore 
  } = useGameFeed(selectedGenres, sortBy)

  // Estado para ofertas filtradas
  const [displayDeals, setDisplayDeals] = useState<Deal[]>([])
  
  // Memoizar gameItems para evitar loops
  const memoizedGameItems = useMemo(() => gameItems, [gameItems])
  
  // Função para converter GameItem para Deal (compatibilidade)
  const convertGameItemToDeal = useCallback((item: GameItem): Deal => ({
    _id: item.id,
    url: item.url,
    priceBase: item.priceFinalCents / 100, // assumindo que não há desconto, usar o preço final
    priceFinal: item.priceFinalCents / 100,
    discountPct: item.discountPct || 0,
    game: {
      title: item.title,
      coverUrl: item.coverUrl || '',
      genres: item.genres,
      tags: item.tags
    },
    store: {
      name: item.store
    }
  }), [])

  const initializeApp = useCallback(async () => {
    try {
      console.log('🚀 Inicializando app...')
      
      // Verificar se já viu onboarding e aceitou termos
      const hasSeenOnboardingBefore = await OnboardingService.hasSeenOnboarding()
      const hasAcceptedTerms = await OnboardingService.hasAcceptedTerms()
      
      setHasSeenOnboarding(hasSeenOnboardingBefore)
      
      // Determinar estado inicial baseado no histórico do usuário
      if (!hasSeenOnboardingBefore) {
        setAppState('splash')
      } else if (!hasAcceptedTerms) {
        setAppState('splash')  
      } else {
        setAppState('splash')
      }
      
    } catch (error) {
      console.error('Erro ao inicializar app:', error)
      setAppState('splash')
    }
  }, []) // Remover dependências desnecessárias

  useEffect(() => {
    // Inicializar app com verificação do fluxo de onboarding
    initializeApp()
  }, [initializeApp])

  // Carregar deals iniciais quando o app inicia
  useEffect(() => {
    if (appState === 'app') {
      fetchDeals()
      initializeSmartServices()
    }
  }, [appState])

  // Inicializar serviços inteligentes (otimizado)
  const initializeSmartServices = async () => {
    try {
      // Outros serviços inteligentes podem ser inicializados aqui
      // Removido popup automático de doação
    } catch (error) {
      console.error('Erro ao inicializar serviços:', error)
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

  // Epic Games temporariamente desativada para melhorias
  const getFilteredDeals = (dealsToFilter: Deal[]) => {
    if (storeFilter === 'all') return dealsToFilter
    
    return dealsToFilter.filter(deal => {
      if (storeFilter === 'steam') {
        return deal.store?.name === 'Steam'
      } else if (storeFilter === 'epic') {
        return deal.store?.name === 'Epic Games'
      }
      return true
    })
  }

  // Effect para usar o novo feed quando houver filtros ativos
  useEffect(() => {
    if (activeTab === 'home' && !loading) {
      let dealsToUse: Deal[] = []
      
      if (hasActiveFilters && memoizedGameItems.length > 0) {
        // Usar o novo feed filtrado
        const convertedDeals = memoizedGameItems.map(convertGameItemToDeal)
        dealsToUse = convertedDeals
      } else if (deals.length > 0) {
        // Usar os deals originais sem filtros
        dealsToUse = deals
      }
      
      // Aplicar filtro de loja
      const filteredDeals = getFilteredDeals(dealsToUse)
      setDisplayDeals(filteredDeals)
    }
  }, [activeTab, memoizedGameItems, loading, hasActiveFilters, deals, storeFilter])

  // Função para filtrar resultados de busca por tipo usando classificação real da Steam
  const applySearchFilter = useCallback((results: Deal[]) => {
    if (searchFilter === 'all') return results
    
    return results.filter((item: any) => {
      const kind = item.kind || 'game' // Usar classificação real da Steam API
      
      if (searchFilter === 'dlcs') {
        // Mostrar apenas DLCs, pacotes e bundles classificados pela Steam
        return kind === 'dlc' || kind === 'package' || kind === 'bundle'
      } else {
        // searchFilter === 'games' - mostrar apenas jogos principais
        return kind === 'game'
      }
    })
  }, [searchFilter])

  useEffect(() => {
    if (!loading && deals.length > 0) {
      if (searchQuery.trim() === '') {
        setFilteredDeals(deals)
        setSearchResults([])
        setOriginalSearchResults([])
      } else {
        const filtered = deals.filter((deal: any) => 
          deal.game?.title?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        setFilteredDeals(filtered)
      }
    }
  }, [searchQuery, loading, deals])

  // Efeito para reaplicar filtro quando searchFilter muda
  useEffect(() => {
    if (originalSearchResults.length > 0) {
      const filteredResults = applySearchFilter(originalSearchResults)
      setSearchResults(filteredResults)
    }
  }, [searchFilter, originalSearchResults, applySearchFilter])

  // Efeito para resetar a busca quando sair da aba de busca
  useEffect(() => {
    if (activeTab === 'home' || activeTab === 'favorites' || activeTab === 'profile' || activeTab === 'wishlist' || activeTab === 'hardware') {
      // Limpar resultados da busca ao sair da aba
      setSearchResults([]);
      setOriginalSearchResults([]);
      // Não limpar a query para manter o texto caso o usuário volte rapidamente
    }
  }, [activeTab])

  // Função para buscar jogos na Steam API
  const searchSteamGames = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([])
      setOriginalSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      console.log('Buscando jogos na Steam:', query)

      const resp = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}&limit=20`)
      
      if (!resp.ok) {
        throw new Error(`Search failed: ${resp.status}`)
      }
      
      const data = await resp.json()
      const sourceArray = Array.isArray(data) ? data : []
      
      // Mapeamento corrigido para dados da rota /search
      const mappedResults = sourceArray.map((item: any, index: number) => {
        // Extrair appId do formato "app:12345"
        const appId = item.id ? item.id.replace('app:', '') : null
        
        // Converter preços de centavos para reais
        const priceBase = (item.priceOriginalCents || 0) / 100
        const priceFinal = (item.priceFinalCents || 0) / 100
        
        return {
          _id: `search-${appId || index}`,
          appId: appId ? Number(appId) : undefined,
          priceBase: priceBase,
          priceFinal: priceFinal,
          discountPct: item.discountPct || 0,
          url: `https://store.steampowered.com/app/${appId}/`,
          kind: item.kind || 'game', // Usar classificação real da Steam
          game: {
            title: item.title || 'Título não encontrado',
            coverUrl: item.image || ''
          },
          store: {
            name: 'Steam'
          }
        }
      })

      try { console.debug('Mapped search results (preview):', mappedResults.slice(0, 6)) } catch (e) {}
      
      // Armazenar resultados originais
      setOriginalSearchResults(mappedResults)
      
      // Aplicar filtro de tipo (games/dlcs)
      const filteredResults = applySearchFilter(mappedResults)
      setSearchResults(filteredResults)
    } catch (err) {
      console.error('Erro na busca Steam:', err)
      setSearchResults([])
      setOriginalSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Função para limpar a busca (resultados e query)
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setOriginalSearchResults([]);
  }, [setSearchQuery, setSearchResults, setOriginalSearchResults]);

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
    } else if (activeTab === 'home') {
      // Limpar tudo ao sair da aba de busca
      clearSearch();
    }
  }, [activeTab, searchQuery, searchSteamGames, clearSearch])

  const fetchDeals = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Timeout otimizado
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      // Usar diretamente a rota /deals que sabemos que funciona
      const response = await fetch(`${API_URL}/deals?limit=50`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const curated = await response.json()
      
      if (!Array.isArray(curated) || curated.length === 0) {
        setDeals([])
        setError('Nenhuma oferta encontrada no momento')
        return
      }

      // Processamento otimizado dos dados
      const sourceDeals: any[] = curated.map((item: any, index: number) => ({
        _id: item._id || `deal-${item.appId || index}`,
        appId: item.appId,
        url: item.url,
        priceBase: item.priceBase || 0,
        priceFinal: item.priceFinal || 0,
        discountPct: item.discountPct || 0,
        game: {
          title: item.game?.title || item.title || 'Título não encontrado',
          coverUrl: item.game?.coverUrl || item.coverUrl || (item.appId ? `https://cdn.akamai.steamstatic.com/steam/apps/${item.appId}/header.jpg` : null),
          genres: item.game?.genres || item.genres || [],
          tags: item.game?.tags || item.tags || []
        },
        store: item.store || { name: 'Steam' }
      }))
      
      // Remoção otimizada de duplicatas
      const seen = new Set()
      const uniqueDeals = sourceDeals.filter((deal: any) => {
        if (seen.has(deal._id)) return false
        seen.add(deal._id)
        return true
      })

      // Ordenação por desconto
      uniqueDeals.sort((a: Deal, b: Deal) => b.discountPct - a.discountPct)
      
      // Sistema de rotação diária de "Ofertas do Dia"
      const today = new Date()
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
      
      // Função de embaralhamento com seed baseado no dia
      const shuffleWithSeed = (array: Deal[], seed: number) => {
        const shuffled = [...array]
        let currentIndex = shuffled.length, randomIndex
        
        // Usar seed para garantir mesmo resultado no mesmo dia
        const seedRandom = (seed: number) => {
          const x = Math.sin(seed) * 10000
          return x - Math.floor(x)
        }
        
        while (currentIndex > 0) {
          randomIndex = Math.floor(seedRandom(seed + currentIndex) * currentIndex)
          currentIndex--
          
          // Trocar elementos
          const temp = shuffled[currentIndex]
          shuffled[currentIndex] = shuffled[randomIndex]
          shuffled[randomIndex] = temp
        }
        
        return shuffled
      }
      
      // Aplicar rotação diária com seed baseado no dia do ano
      const dailyRotatedDeals = shuffleWithSeed(uniqueDeals, dayOfYear)
      
      console.log(`🎲 Ofertas do Dia - Rotação para ${today.toLocaleDateString()} (dia ${dayOfYear})`)
      console.log(`🔄 ${dailyRotatedDeals.length} ofertas embaralhadas para hoje`)
      
      setDeals(dailyRotatedDeals)
      
    } catch (err: any) {
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
      setLoading(false)
    }
  }

  // Pull-to-refresh handler for Home
  const onRefresh = async () => {
    try {
      setRefreshing(true)
      await fetchDeals()
      // Também atualizar o feed filtrado se houver filtros ativos
      if (hasActiveFilters) {
        refreshFeed()
      }
    } finally {
      setRefreshing(false)
    }
  }



  // Verificar se há filtros ativos
  const hasActiveFiltersLocal = hasActiveFilters

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

  // Currency subtitle help      {/* Alerta de desativação temporária da Epic Games no topo */}
      <View style={{ 
        backgroundColor: '#F59E0B', 
        padding: 12, 
        borderRadius: 12,
        marginBottom: 16
      }}>
        <Text style={{ 
          color: '#1F2937', 
          fontWeight: '600',
          textAlign: 'center',
          fontSize: 14
        }}>
          ⚠️ Jogos da Epic Games temporariamente desativados para melhorias
        </Text>
      </View>
      
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
    return deals.reduce((best: any, current: any) => 
      current.discountPct > best.discountPct ? current : best, deals[0])
  }

  // Componente para análise de preço Steam
  const PriceAnalysisIndicator: React.FC<{ appId: number; currentPrice: number; title: string }> = ({ appId, currentPrice, title }) => {
    const [analysis, setAnalysis] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
      if (appId && appId > 0) {
        const loadAnalysis = async () => {
          try {
            setLoading(true)
            const priceService = SteamPriceHistoryService.getInstance()
            const result = await priceService.getPriceAnalysis(appId, title, currentPrice)
            setAnalysis(result)
          } catch (error) {
            console.error('Erro ao carregar análise de preço:', error)
          } finally {
            setLoading(false)
          }
        }

        loadAnalysis()
      }
    }, [appId, currentPrice, title])

    if (loading || !analysis) return null

    const getStatusColor = () => {
      switch (analysis.priceStatus) {
        case 'lowest': return '#10B981'
        case 'good': return '#F59E0B'
        case 'average': return '#6B7280'
        case 'high': return '#EF4444'
        default: return '#6B7280'
      }
    }

    const getStatusText = () => {
      switch (analysis.priceStatus) {
        case 'lowest': return 'Menor preço!'
        case 'good': return 'Bom preço'
        case 'average': return 'Preço médio'
        case 'high': return 'Preço alto'
        default: return ''
      }
    }

    const getStatusIcon = () => {
      switch (analysis.priceStatus) {
        case 'lowest': return 'trending-down'
        case 'good': return 'thumbs-up-outline'
        case 'average': return 'remove-outline'
        case 'high': return 'trending-up'
        default: return 'help-outline'
      }
    }

    // Mostrar apenas para deals realmente relevantes
    if (!analysis.isGoodDeal && analysis.priceStatus === 'average') return null
    if (analysis.priceStatus === 'high') return null // Não mostrar preços altos

    return (
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginTop: 4,
        backgroundColor: analysis.priceStatus === 'lowest' ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.3)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: analysis.priceStatus === 'lowest' ? 1 : 0,
        borderColor: analysis.priceStatus === 'lowest' ? '#10B981' : 'transparent'
      }}>
        <Ionicons name={getStatusIcon()} size={12} color={getStatusColor()} />
        <Text style={{ 
          color: getStatusColor(), 
          fontSize: 10, 
          fontWeight: '600',
          marginLeft: 4
        }}>
          {getStatusText()}
        </Text>
        {analysis.savingsFromAverage > 0 && (
          <Text style={{ 
            color: '#10B981', 
            fontSize: 9, 
            marginLeft: 4,
            opacity: 0.8
          }}>
            (-R${analysis.savingsFromAverage.toFixed(2)})
          </Text>
        )}
      </View>
    )
  }


  const openGameDetails = (deal: Deal) => {
    handleGamePress(deal)
  }

  // Função para analisar se o preço está alto ou baixo
  const getPriceIndicator = (deal: Deal) => {
    const discount = deal.discountPct || 0
    const finalPrice = deal.priceFinal || 0
    const originalPrice = deal.priceBase || finalPrice
    
    // Análise baseada no desconto e preço
    if (discount >= 70) {
      return { label: 'PREÇO MUITO BAIXO', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)' }
    } else if (discount >= 50) {
      return { label: 'PREÇO BAIXO', color: '#059669', bgColor: 'rgba(5, 150, 105, 0.15)' }
    } else if (discount >= 30) {
      return { label: 'PREÇO MÉDIO', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.15)' }
    } else if (discount >= 10) {
      return { label: 'PREÇO ALTO', color: '#DC2626', bgColor: 'rgba(220, 38, 38, 0.15)' }
    } else if (finalPrice > 150) {
      // Preço alto mesmo sem desconto
      return { label: 'PREÇO MUITO ALTO', color: '#991B1B', bgColor: 'rgba(153, 27, 27, 0.15)' }
    } else if (finalPrice < 20 && discount === 0) {
      // Preço baixo naturalmente
      return { label: 'PREÇO BAIXO', color: '#059669', bgColor: 'rgba(5, 150, 105, 0.15)' }
    }
    
    // Se não tem desconto e preço médio
    if (discount === 0) {
      return { label: 'PREÇO NORMAL', color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.15)' }
    }
    
    return null
  }



  const renderHeader = () => (
    <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: 32, fontWeight: '800', color: '#FFFFFF' }}>Looton</Text>
        </View>
      </View>
    </View>
  )

  // Componente animado para contorno dos jogos em destaque
  // Apenas contorno simples, sem brilho
  const AnimatedHighlightBorder: React.FC<{ children: React.ReactNode; isHighlighted: boolean; highlightColor: string }> = ({ children, isHighlighted, highlightColor }) => {
    if (!isHighlighted) {
      return <>{children}</>
    }

    return (
      <View style={{ 
        position: 'relative',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: highlightColor,
      }}>
        {children}
      </View>
    )
  }

  const renderGameCard = ({ item: deal }: { item: Deal & { isBestDeal?: boolean, highlightColor?: string } }) => {
    const isHighlighted = deal.discountPct >= 50;
    const isSuperDeal = deal.discountPct >= 70;
    const highlightColor = deal.highlightColor || (isSuperDeal ? '#FFD700' : isHighlighted ? '#ff8800' : '#FFD700');
    
    return (
      <View style={{ paddingHorizontal: isHighlighted ? 6 : 0, marginBottom: 16 }}>
        <AnimatedHighlightBorder isHighlighted={isHighlighted} highlightColor={highlightColor}>
          <TouchableOpacity
          onPress={() => openGameDetails(deal)}
          activeOpacity={0.95}
          style={{
            backgroundColor: '#374151',
            borderRadius: 16,
            marginBottom: 16,
            overflow: 'hidden',
            // Remover todos os efeitos de sombra/brilho
            shadowColor: 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0,
            elevation: 0,
            borderWidth: 0,
            borderColor: 'transparent'
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
        imageUrls={(deal.imageUrls && deal.imageUrls.length > 0) ? deal.imageUrls : [deal.game?.coverUrl]} 
        height={200} 
      />
        
        <View style={{ padding: isTablet ? 20 : 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: isTablet ? 10 : 8 }}>
          <Text style={{ 
            color: '#FFFFFF', 
            fontSize: isTablet ? 20 : 18, 
            fontWeight: '700',
            flex: 1,
            marginRight: 8
          }}>
            {deal.game?.title || 'Sem título'}
          </Text>
          
          {getPriceIndicator(deal) && (
            <View style={{
              backgroundColor: getPriceIndicator(deal)?.bgColor,
              paddingHorizontal: 6,
              paddingVertical: 3,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: getPriceIndicator(deal)?.color,
            }}>
              <Text style={{
                color: getPriceIndicator(deal)?.color,
                fontSize: 9,
                fontWeight: '800',
                letterSpacing: 0.5,
              }}>
                {getPriceIndicator(deal)?.label}
              </Text>
            </View>
          )}
        </View>
        
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
      </AnimatedHighlightBorder>
      </View>
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
            initial={selected.map((s: string) => ({ genre: s, weight: 1 }))}
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
    <SafeAreaView style={{ backgroundColor: '#374151' }}>
      <View style={{ 
        backgroundColor: '#374151', 
        flexDirection: 'row',
        paddingBottom: 10,
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
        { key: 'home', icon: 'game-controller', label: 'Games' },
        { key: 'hardware', icon: 'cube', label: 'Hardware' },
        { key: 'search', icon: 'search', label: 'Buscar' },
        { key: 'favorites', icon: 'eye', label: 'Vigiando' },
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
    </SafeAreaView>
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
                  <View style={{ paddingHorizontal: isTablet ? 40 : 24, maxWidth: isTablet ? 800 : '100%', alignSelf: 'center', width: '100%' }}>
                    <View style={{ 
                      marginBottom: 20
                    }}>
                      <Text style={{ 
                        color: '#FFFFFF', 
                        fontSize: isTablet ? 28 : 24, 
                        fontWeight: '700'
                      }}>
                        Ofertas do Dia
                      </Text>
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
                      onEndReached={() => {
                        if (hasActiveFilters && hasNextPage && !feedLoading) {
                          loadMore()
                        }
                      }}
                      onEndReachedThreshold={0.1}
                      ListFooterComponent={() => (
                        hasActiveFilters && feedLoading ? (
                          <View style={{ padding: 20, alignItems: 'center' }}>
                            <ActivityIndicator color="#3B82F6" />
                            <Text style={{ color: '#9CA3AF', marginTop: 8 }}>
                              Carregando mais...
                            </Text>
                          </View>
                        ) : null
                      )}
                    />
                  </View>
                </>
              )}
              
              <View style={{ height: 20 }} />
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
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    style={{
                      marginLeft: 8,
                      padding: 8,
                    }}
                    onPress={clearSearch}
                  >
                    <Ionicons 
                      name="close-circle" 
                      size={24} 
                      color="#9CA3AF" 
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Botões de Filtro Jogos/DLCs */}
              <View style={{ 
                flexDirection: 'row', 
                marginBottom: 20,
                backgroundColor: '#374151',
                borderRadius: 12,
                padding: 4
              }}>
                <TouchableOpacity
                  onPress={() => setSearchFilter('games')}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    backgroundColor: searchFilter === 'games' ? '#3B82F6' : 'transparent',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ 
                    color: searchFilter === 'games' ? '#FFFFFF' : '#9CA3AF',
                    fontSize: 14,
                    fontWeight: '600'
                  }}>
                    🎮 Jogos
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => setSearchFilter('dlcs')}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    backgroundColor: searchFilter === 'dlcs' ? '#3B82F6' : 'transparent',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ 
                    color: searchFilter === 'dlcs' ? '#FFFFFF' : '#9CA3AF',
                    fontSize: 14,
                    fontWeight: '600'
                  }}>
                    📦 DLCs & Expansões
                  </Text>
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
                  { icon: 'help-circle-outline', title: 'Ajuda', subtitle: 'Suporte e FAQ' },
                  { icon: 'heart-outline', title: 'Apoie o Looton', subtitle: 'Faça uma doação' }
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

                  if (item.title === 'Apoie o Looton') {
                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() => setShowDonationModal(true)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: isTablet ? 24 : 20,
                          borderBottomWidth: index < 3 ? 1 : 0, // Atualizado para 3 pois agora temos 4 itens
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
                        <Ionicons name="chevron-forward" size={isTablet ? 24 : 20} color="#9CA3AF" />
                      </TouchableOpacity>
                    )
                  } else {
                    return (
                      <TouchableOpacity
                        key={index}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: isTablet ? 24 : 20,
                          borderBottomWidth: index < 3 ? 1 : 0, // Atualizado para 3 pois agora temos 4 itens
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
                        <Ionicons name="chevron-forward" size={isTablet ? 24 : 20} color="#9CA3AF" />
                      </TouchableOpacity>
                    )
                  }
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

      {/* Banner de anúncio sutil - visível apenas na aba principal e quando não há modais abertos */}
      {!(selectedGameId || showGameDetails || showWishlist || showCurrencyModal || showAddToListModal || showPreferencesModal || showDonationModal || showTermsModal) && (
        <AdBanner visible={activeTab === 'home'} />
      )}

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
          store={selectedDeal?.store?.name === 'Epic Games' ? 'epic' : 'steam'}
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
      
      {/* Modal de Doação - Apenas quando o usuário ativa manualmente */}
      <DonationModal
        visible={showDonationModal}
        onClose={async () => {
          const donationService = DonationService.getInstance()
          await donationService.markAsDismissed()
          setShowDonationModal(false)
        }}
      />
      
      </View>
    </CurrencyProvider>
  )
}