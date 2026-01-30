/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-empty */
import { View, Text, ScrollView, ActivityIndicator, Image, TouchableOpacity, Dimensions, TextInput, Modal, SafeAreaView, FlatList, Animated, RefreshControl, Platform, Linking, Alert, Share } from 'react-native';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameDetailsModal } from '../src/components/GameDetailsModal';
import { HardwareInner } from './hardware';

import { CurrencyProvider, useCurrency } from '../src/contexts/CurrencyContext';
import { LanguageProvider, useLanguage } from '../src/contexts/LanguageContext';
import { useBottomInset } from '../src/hooks/useBottomInset';
import { WishlistTab } from '../src/components/WishlistTab';
import FavoritesAndLists from './favorites';
import { WishlistService } from '../src/services/WishlistService';
import { SubscriptionService } from '../src/services/SubscriptionService';
import { GameCover } from '../src/components/GameCover';
import { EventBus } from '../src/lib/EventBus';

import SteamPriceHistoryService from '../src/services/SteamPriceHistoryService';

// 🔕 Notificações locais REMOVIDAS - Backend envia tudo automaticamente
// DailyOfferNotificationService — Removido (backend envia às 12h e 18h)
// WatchedGamesNotificationService — Removido (backend monitora a cada 6h)
// BackgroundWatchedGamesService — Removido (backend cuida de tudo)

import { AddToListModal } from '../src/components/AddToListModal';
import { AdBanner } from '../src/components/AdBanner';
import { interstitialAdService } from '../src/services/InterstitialAdService';
import { useFilters } from '../src/hooks/useFilters';

// Lista de jogos que devem ser filtrados/removidos (não disponíveis na Steam mais)
const GAMES_TO_FILTER = [
  'DOOM',
  'DOOM Eternal', 
  'Doom',
  'Doom Eternal',
  // Adicionando mais jogos conhecidos que foram removidos ou não estão mais disponíveis
  'Paladins', // Removido da Steam em 2022
  'Nexomon', // Removido da Steam
  'Subnautica Below Zero Demo', // Versões de demonstração removidas
  'VRChat Demo', // Versões de demonstração removidas
  // Correção específica: Assassin's Creed Black Flag - Golden Edition não existe, apenas Assassin's Creed IV Black Flag
  'Assassin\'s Creed Black Flag - Golden Edition',
  'Assassin\'s Creed Black Flag Golden Edition',
  'Assassin\'s Creed IV Black Flag - Gold Edition', // Outra variação possível
  'Assassin\'s Creed IV Black Flag Gold Edition',  // Outra variação possível
  // Termos relacionados a conteúdo erótico/adulto
  'Milk',
  'Milky',
  'Lactation',
  'Lactating',
  'Breast',
  'Breasts',
  'Boob',
  'Boobs',
  'Tits',
  'Titties',
  'Ass',
  'Asses',
  'Butt',
  'Butts',
  'Thick',
  'Thick Girl',
  'Thick Girls',
  'Curvy',
  'Curves',
  'Busty',
  'Bust',
  'Hot',
  'Hot Girl',
  'Hot Girls',
  'Naughty',
  'Naughty Girl',
  'Naughty Girls',
  'Seductive',
  'Seduce',
  'Seduction',
  'Erotic',
  'Erotic Game',
  'Erotic Life',
  'Erotic Sim',
  'Erotic Simulation',
  'Lust',
  'Lustful',
  'Naughty Nurse',
  'Sexy Nurse',
  'Hot Nurse',
  'Adult Only',
  'Adult Game',
  'Adult Content',
  'Mature Content',
  'Mature Game',
  // Jogo específico a ser bloqueado
  'Shoot! & Ahhhhh~',
].map(title => title.toLowerCase()); // Converter para minúsculas para comparação case-insensitive
import { SteamGenresPreferencesModal } from '../src/components/SteamGenresPreferencesModal';
import { SteamGenre } from '../src/services/SteamGenresService';

import { showToast } from '../src/utils/SimpleToast';
import { useGameFeed, GameItem } from '../src/hooks/useGameFeed';

export interface Deal {
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
  releaseDate?: string // Data de lançamento
  isEarlyAccess?: boolean // Acesso antecipado
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


import { api } from '../src/api/client';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

// Small component to render a price using CurrencyContext so it updates reactively
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PriceText: React.FC<{
  value?: number | null;
  style?: any;
  deal?: any;
  showEarlyAccess?: boolean
}> = ({ value, style, deal, showEarlyAccess = true }) => {
  try {
    const { formatPrice, currency } = useCurrency();
    const { t } = useLanguage();

  // Verificar se é um jogo de Acesso Antecipado - busca mais ampla
    const isEarlyAccess = showEarlyAccess && deal && (
      deal.isEarlyAccess === true ||
  // Verificar no título do jogo
      (deal.game?.title && String(deal.game.title).toLowerCase().includes('early access')) ||
      (deal.game?.title && String(deal.game.title).toLowerCase().includes('acesso antecipado')) ||
      // Verificar nas tags
      (deal.game?.tags && Array.isArray(deal.game.tags) &&
       deal.game.tags.some((tag: string) =>
         String(tag).toLowerCase().includes('early access') ||
         String(tag).toLowerCase().includes('acesso antecipado'))) ||
  // Verificar nos gêneros Steam
      (deal.steamGenres && Array.isArray(deal.steamGenres) &&
       deal.steamGenres.some((genre: Record<string, unknown>) => 
         (genre.name && String(genre.name).toLowerCase().includes('early access')) || 
         (genre.name && String(genre.name).toLowerCase().includes('acesso antecipado')) ||
         (genre.description && String(genre.description).toLowerCase().includes('early access')) ||
         (genre.description && String(genre.description).toLowerCase().includes('acesso antecipado')))) ||
  // Verificar nos gêneros do jogo
      (deal.game?.genres && Array.isArray(deal.game.genres) && 
       deal.game.genres.some((genre: string | any) => 
         (typeof genre === 'string' && (String(genre).toLowerCase().includes('early access') || String(genre).toLowerCase().includes('acesso antecipado'))) ||
         (typeof genre === 'object' && genre.name && (String(genre.name).toLowerCase().includes('early access') || String(genre.name).toLowerCase().includes('acesso antecipado')))))
    );

    let display;
    if (isEarlyAccess) {
  // Se é early access, sempre mostrar "Acesso Antecipado"
      display = t('price.earlyAccess');
    } else {
  // Caso contrário, mostrar o preço normal ou "Grátis"
      display = value === null || value === undefined || isNaN(value) || value === 0 ? t('price.free') : formatPrice(value);
    }

    // Normalize BRL rendering to avoid edge-cases like "RS2,00" and enforce single space after R$ 
    if (display !== t('price.free') && display !== t('price.earlyAccess') && currency === 'BRL') {
      // Fix cases where $ became S (uppercase side-effect), and ensure single space after symbol
      display = String(display)
        .replace(/^RS/, 'R$')
        .replace(/^R\$\s*/, 'R$ ')
    }

    return <Text style={[style, { textTransform: 'none' }]}>{display}</Text>
  } catch (e) {
    // fallback: use Intl for pt-BR
    const { t: tFallback } = useLanguage();
    try {
  // Verificar se é acesso antecipado
      const isEarlyAccess = showEarlyAccess && deal && (
        (deal.game?.tags && Array.isArray(deal.game.tags) && 
         deal.game.tags.some((tag: string) => 
           tag.toLowerCase().includes('early access') || 
           tag.toLowerCase().includes('acesso antecipado'))) ||
        (deal.steamGenres && Array.isArray(deal.steamGenres) && 
         deal.steamGenres.some((genre: any) => 
           genre.name?.toLowerCase().includes('early access') || 
           genre.name?.toLowerCase().includes('acesso antecipado'))) ||
        (deal.game?.genres && Array.isArray(deal.game.genres) && 
         deal.game.genres.some((genre: string) => 
           genre.toLowerCase().includes('early access') || 
           genre.toLowerCase().includes('acesso antecipado')))
      );
      
      if (isEarlyAccess) return <Text style={[style, { textTransform: 'none' }]}>{tFallback('price.earlyAccess')}</Text>;
      if (value === null || value === undefined || isNaN(value) || value === 0) return <Text style={[style, { textTransform: 'none' }]}>{tFallback('price.free')}</Text>;
      const display = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
      const normalized = String(display).replace(/^R\$\s*/, 'R$ ');
      return <Text style={[style, { textTransform: 'none' }]}>{normalized}</Text>
    } catch (e2) {
  // Verificar se é acesso antecipado
      const isEarlyAccess = showEarlyAccess && deal && (
        (deal.game?.tags && Array.isArray(deal.game.tags) && 
         deal.game.tags.some((tag: string) => 
           tag.toLowerCase().includes('early access') || 
           tag.toLowerCase().includes('acesso antecipado'))) ||
        (deal.steamGenres && Array.isArray(deal.steamGenres) && 
         deal.steamGenres.some((genre: any) => 
           genre.name?.toLowerCase().includes('early access') || 
           genre.name?.toLowerCase().includes('acesso antecipado'))) ||
        (deal.game?.genres && Array.isArray(deal.game.genres) && 
         deal.game.genres.some((genre: string) => 
           genre.toLowerCase().includes('early access') || 
           genre.toLowerCase().includes('acesso antecipado')))
      );
      
      if (isEarlyAccess) return <Text style={[style, { textTransform: 'none' }]}>{tFallback('price.earlyAccess')}</Text>;
      if (value === null || value === undefined || isNaN(value) || value === 0) return <Text style={[style, { textTransform: 'none' }]}>{tFallback('price.free')}</Text>;
      try {
        const display = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
        const normalized = String(display).replace(/^R\$\s*/, 'R$ ');
        return <Text style={[style, { textTransform: 'none' }]}>{normalized}</Text>
      } catch (e3) {
        return <Text style={[style, { textTransform: 'none' }]}>{`${Number(value).toFixed(2)} BRL`}</Text>
      }
    }
  }
}

function HomeContent() {
  const { language, setLanguage, t } = useLanguage();
  const { paddingBottom: bottomNavPadding, isGestureNavigation } = useBottomInset();
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'favorites' | 'profile' | 'wishlist' | 'hardware'>('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [showGameDetails, setShowGameDetails] = useState(false)
  const [selectedGameId, setSelectedGameId] = useState<number | string | null>(null)
  const [showWishlist, setShowWishlist] = useState(false)
  const [wishlistCount, setWishlistCount] = useState(0)
  
  // Filtro de loja
  // Removido estado de seleção de loja - exibindo todos os jogos juntos
  const [selectedGameDetails, setSelectedGameDetails] = useState<any>(null)
  const [gameDetailsModalVisible, setGameDetailsModalVisible] = useState(false)
  const [wishlistGames, setWishlistGames] = useState<any[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([])
  

  const [searchResults, setSearchResults] = useState<Deal[]>([])
  const [originalSearchResults, setOriginalSearchResults] = useState<Deal[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showAddToListModal, setShowAddToListModal] = useState(false)
  const [selectedGameForList, setSelectedGameForList] = useState<{id: string, title: string} | null>(null)
  const [userPreferredSteamGenres, setUserPreferredSteamGenres] = useState<string[]>([])
  const [showPreferencesModal, setShowPreferencesModal] = useState(false)
  const [availableSteamGenres, setAvailableSteamGenres] = useState<SteamGenre[]>([])
  const [loadingGenres, setLoadingGenres] = useState(false)
  const [showCurrencyModal, setShowCurrencyModal] = useState(false)

  // Estados das notificações (backend gerencia o envio, app apenas exibe histórico)
  const [receivedNotifications, setReceivedNotifications] = useState<any[]>([]);
  const [showNotificationsHistory, setShowNotificationsHistory] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  
  // Estado para o modal de idioma
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  
  // Estados dos novos serviços
  const [showSmartNotification, setShowSmartNotification] = useState(false)
  const [currentNotification, setCurrentNotification] = useState<any>(null)
  const [priceAnalysis, setPriceAnalysis] = useState<Map<number, any>>(new Map())
  
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showProModal, setShowProModal] = useState(false)

  
  // Estado para controle de embaralhamento aleatório
  const [shuffledGameItems, setShuffledGameItems] = useState<GameItem[]>([]);
  const [isShuffled, setIsShuffled] = useState(false);
  
  // Estado para controle do layout dos cards (coluna ou grade)
  const [layoutType, setLayoutType] = useState<'column' | 'grid'>('column');
  
  // Carregar preferência de layout salva
  useEffect(() => {
    const loadLayoutPreference = async () => {
      try {
        const savedLayout = await AsyncStorage.getItem('@layout_preference');
        if (savedLayout === 'grid' || savedLayout === 'column') {
          setLayoutType(savedLayout);
        }
      } catch (error) {
  console.error('Erro ao carregar preferência de layout:', error);
      }
    };
    
    loadLayoutPreference();
  }, []);

  // Registrar push token automaticamente quando o app abre
  useEffect(() => {
    const registerPushToken = async () => {
      try {
        const { getCurrentPushToken, sendPushTokenToBackend } = await import('../src/notifications');
        const pushToken = await getCurrentPushToken('41306841-8939-4568-a1a1-af93af0428d1');
        
        if (pushToken) {
          console.log('Push token obtido:', pushToken.substring(0, 30) + '...');
          await sendPushTokenToBackend(pushToken);
          console.log('Push token enviado para o backend');
        } else {
          console.log('Nenhum push token disponível (permissão não concedida)');
        }
      } catch (error) {
        console.error('Erro ao registrar push token:', error);
      }
    };
    
    registerPushToken();
  }, []);

  // Verificar status premium do usuário
  useEffect(() => {
    const checkPremium = async () => {
      try {
        const premium = await SubscriptionService.isPremium();
        setIsPremium(premium);
        if (premium) {
          console.log('Usu�rio premium detectado - recursos premium ativados');
          // Atualizar o servi�o de anúncios intersticiais
          await interstitialAdService.updatePremiumStatus();
        }
      } catch (error) {
        console.error('Erro ao verificar status premium:', error);
        setIsPremium(false);
      }
    };
    
    checkPremium();
  }, []);
  
  // Salvar preferência de layout quando mudar
  useEffect(() => {
    const saveLayoutPreference = async () => {
      try {
        await AsyncStorage.setItem('@layout_preference', layoutType);
      } catch (error) {
  console.error('Erro ao salvar preferência de layout:', error);
      }
    };
    
    saveLayoutPreference();
  }, [layoutType]);
  
  // Verificar se deve mostrar onboarding de preferências no primeiro acesso
  // (Notificações agora são gerenciadas 100% pelo backend)
  
  // Listener para registrar notificações no histórico SEM bloquear exibi��o nativa
  useEffect(() => {
    const Notifications = require('expo-notifications');
    const subscription = Notifications.addNotificationReceivedListener((notification: any) => {
      const { title, body, data } = notification.request.content;
      
      // Registrar todas as notificações remotas, exceto notificações reagendadas localmente
      if (data?.isLocalReschedule) {
        return; // N�o registrar notificações reagendadas localmente (evitar duplicatas)
      }
      
      console.log('?? Notificação recebida (registrando no histórico):', title);
      
  // Adicionar ao histórico - tanto remotas quanto locais, exceto reagendadas
      setReceivedNotifications(prev => [{
        id: notification.request.identifier,
        title: title,
        body: body,
        data: data,
        timestamp: new Date().toISOString(),
      }, ...prev]);
    });
    
  // Carregar notificações do AsyncStorage (histórico persistente)
    const loadNotificationsHistory = async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const stored = await AsyncStorage.getItem('@notifications_history');
        if (stored) {
          setReceivedNotifications(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Erro ao carregar histórico de notificações:', error);
      }
    };

    loadNotificationsHistory();

    return () => {
      subscription.remove();
    };
  }, []);

  // Listener para notificações manipuladas (abertas pelo usuário) - para registrar também no histórico
  useEffect(() => {
    const Notifications = require('expo-notifications');
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const { notification } = response;
      const { title, body, data } = notification.request.content;

      // Registrar no histórico quando o usuário interage com a notificação
      setReceivedNotifications(prev => [{
        id: notification.request.identifier,
        title: title,
        body: body,
        data: data,
        timestamp: new Date().toISOString(),
        opened: true // Marcar que foi aberta pelo usuário
      }, ...prev]);
    });

    return () => {
      responseSubscription.remove();
    };
  }, []);
  
  // Salvar notificações no AsyncStorage quando houver mudan�as
  useEffect(() => {
    const saveNotificationsHistory = async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.setItem('@notifications_history', JSON.stringify(receivedNotifications));
      } catch (error) {
        console.error('Erro ao salvar histórico de notificações:', error);
      }
    };
    
    if (receivedNotifications.length > 0) {
      saveNotificationsHistory();
    }
  }, [receivedNotifications]);
  
  // Listener para evento de abrir detalhes do jogo (vindo do modal de notificação)
  useEffect(() => {
    const handleOpenGameDetails = async (data: { appId: string }) => {
      console.log('Abrindo detalhes do jogo via EventBus:', data.appId);
      
      // Buscar dados do jogo
      try {
        const response = await fetch(`https://looton.onrender.com/api/game-details/${data.appId}`);
        const gameData = await response.json();
        
        if (gameData) {
          setSelectedGameDetails(gameData);
          setGameDetailsModalVisible(true);
        }
      } catch (error) {
        console.error('Erro ao buscar detalhes do jogo:', error);
      }
    };

    EventBus.on('openGameDetails', handleOpenGameDetails);

    return () => {
      EventBus.off('openGameDetails', handleOpenGameDetails);
    };
  }, []);
  
  // Verificação de jogos vigiados agora é feita pelo backend a cada 6h (00:00, 06:00, 12:00, 18:00)
  
  // Background fetch removido - backend cuida de tudo automaticamente
  
  // Notificações de oferta do dia são enviadas automaticamente pelo backend �s 12h e 18h
  // N�o hé mais necessidade de toggle local
  
  // Filtro de busca: 'all' | 'games' | 'dlcs'
  const [searchFilter, setSearchFilter] = useState<'all' | 'games' | 'dlcs'>('games')
  const [showTermsModal, setShowTermsModal] = useState(false)
  
  // Estado para ordenação
  const [sortBy, setSortBy] = useState<'best_price' | 'biggest_discount'>('best_price')
  

  
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(100)).current
  // Em React Native o retorno de setTimeout costuma ser um number em alguns ambientes
  // Usar ReturnType<typeof setTimeout> para compatibilidade entre browsers/Node/RN
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchInputRef = useRef<TextInput | null>(null)

  
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
  
  // Estados para controle de atualização
  const [refreshKey, setRefreshKey] = useState(0);

  // Hook do novo feed
  const { 
    data: gameItems, 
    loading: feedLoading, 
    error: feedError, 
    hasNextPage, 
    refresh: refreshFeed, 
    loadMore 
  } = useGameFeed(selectedGenres, sortBy, refreshKey)


  
  // Memoizar gameItems para evitar loops
  const memoizedGameItems = useMemo(() => {
  // Se estiver embaralhado, usar os dados embaralhados, senão os originais
    return isShuffled && shuffledGameItems.length > 0 ? shuffledGameItems : gameItems;
  }, [gameItems, shuffledGameItems, isShuffled]);
  
  // Efeito para resetar o embaralhamento quando os gameItems originais mudarem
  // (por exemplo, quando os filtros mudam ou quando refreshFeed é chamado)
  useEffect(() => {
    if (gameItems.length > 0 && isShuffled) {
      setIsShuffled(false);
      setShuffledGameItems([]);
    }
  }, [gameItems]);
  
  // Fun��o para filtrar jogos indesejados (não disponíveis na Steam mais)
  const shouldFilterGame = useCallback((title: string) => {
    if (!title) return false;
    const lowerTitle = title.toLowerCase();
    return GAMES_TO_FILTER.some(filterTitle => lowerTitle.includes(filterTitle));
  }, [])
  
  // FunÃ§Ã£o para verificar se o appId do jogo é vÃ¡lido (nÃ£o removido da Steam)
  const isValidSteamApp = useCallback((appId: number | string | null | undefined) => {
    if (!appId) return true; // Se nÃ£o tem appId, nÃ£o podemos verificar, entÃ£o assumimos como vÃ¡lido
    
    // Para jogos da Epic Games, o appId pode ser um UUID em vez de um nÃºmero
    // Assumir como vÃ¡lido se for string nÃ£o numérica (provavelmente UUID da Epic)
    if (typeof appId === 'string' && isNaN(Number(appId)) && !appId.includes(':')) {
      return true;
    }
    
    let numericAppId: number;
    
    // Converter appId para nÃºmero, lidando com diferentes formatos
    if (typeof appId === 'string' && appId.includes(':')) {
      // Se o appId estÃ¡ no formato "app:123456", extrair o nÃºmero
      const parts = appId.split(':');
      numericAppId = parseInt(parts[1], 10);
    } else if (typeof appId === 'string') {
      numericAppId = parseInt(appId, 10);
    } else {
      numericAppId = appId;
    }
    
    // Verificar se o appId é um número v�lido
    if (isNaN(numericAppId) || numericAppId <= 0) {
      return false; // appId inv�lido
    }
    
    // Alguns appIds conhecidos que foram removidos ou são inv�lidos
    const invalidAppIds = [
      1234567890, // Exemplo de appId claramente invÃ¡lido
      // Adicione aqui mais appIds conhecidos como invÃ¡lidos, se necessÃ¡rio
    ];
    
    return !invalidAppIds.includes(numericAppId);
  }, [])
  
  // Fun��o para verificar se um jogo é rec�m-lan�ado (nos �ltimos 60 dias)
  const isRecentlyReleased = useCallback((releaseDate: string | undefined) => {
    if (!releaseDate) return false;
    
    try {
      const release = new Date(releaseDate);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - release.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Considerar como rec�m-lan�ado se lan�ado nos �ltimos 60 dias
      return diffDays <= 60;
    } catch (error) {
      console.error('Erro ao verificar data de lan�amento:', error);
      return false;
    }
  }, []);

  // Fun��o para verificar se um jogo tem informações suficientes para ser exibido
  const hasSufficientInfo = useCallback((deal: any) => {
    // Verificar se tem título
    if (!deal.game?.title || deal.game.title.trim() === '') {
      console.log('Filtrando jogo sem título:', deal);
      return false;
    }
    
    // Verificar se tem URL v�lida (deve conter steam ou epic, dependendo da loja)
    if (!deal.url) {
      console.log('Filtrando jogo sem URL:', deal.game?.title);
      return false;
    }
    
    // Para jogos da Steam ou Epic, verificar se tem URL v�lida
    const isSteamUrl = deal.url.includes('store.steampowered.com') || deal.url.includes('steamcommunity.com');
    const isEpicUrl = deal.url.includes('epicgames.com') || deal.url.includes('store.epicgames.com');
    
    if (!isSteamUrl && !isEpicUrl) {
      console.log('Filtrando jogo com URL inv�lida:', deal.game?.title, deal.url);
      return false;
    }
    
    // Verificar se tem appId vÃ¡lido (pode ser nÃºmero ou string no formato "app:123456")
    if (deal.appId) {
      let appIdIsValid = true;
      
      if (typeof deal.appId === 'string') {
        if (deal.appId.includes(':')) {
          // Verificar se o appId estÃ¡ no formato "app:123456" e o nÃºmero é vÃ¡lido
          const parts = deal.appId.split(':');
          const appIdNumber = parseInt(parts[1], 10);
          appIdIsValid = !isNaN(appIdNumber) && appIdNumber > 0;
        } else {
          // Verificar se a string é um nÃºmero vÃ¡lido
          const appIdNumber = parseInt(deal.appId, 10);
          appIdIsValid = !isNaN(appIdNumber) && appIdNumber > 0;
        }
      } else if (typeof deal.appId === 'number') {
        // Verificar se o nÃºmero é vÃ¡lido
        appIdIsValid = !isNaN(deal.appId) && deal.appId > 0;
      } else {
        appIdIsValid = false;
      }
      
      if (!appIdIsValid) {
        console.log('Filtrando jogo com appId invÃ¡lido:', deal.game?.title, deal.appId);
        return false;
      }
    }
    
    return true;
  }, [])
  
  // FunÃ§Ã£o para converter GameItem para Deal (compatibilidade) e filtrar itens invÃ¡lidos
  const convertGameItemToDeal = useCallback((item: GameItem): Deal | null => {
    // Criar um objeto temporÃ¡rio para verificar informaÃ§Ãµes suficientes
    const tempDeal = {
      game: { title: item.title },
      url: item.url,
      appId: item.id
    };
    
    // Verificar se tem informaÃ§Ãµes suficientes
    if (!hasSufficientInfo(tempDeal)) {
      return null; // Filtrar este jogo por informaÃ§Ãµes insuficientes
    }
    
    // Verificar se o jogo deve ser filtrado
    if (shouldFilterGame(item.title)) {
      return null; // Filtrar este jogo
    }
    
    // Verificar se o appId é vÃ¡lido
    if (item.id && !isValidSteamApp(item.id)) {
      return null; // Filtrar este jogo se o appId for invÃ¡lido
    }
    
    // Calcular preÃ§o base a partir do preÃ§o final e desconto percentual
    let discountPct = item.discountPct || 0;
    const priceFinal = item.priceFinalCents / 100;
    let priceBase: number;
    
    // Verificar e corrigir descontos invÃ¡lidos
    if (discountPct < 0 || discountPct > 200) {
      // Desconto invÃ¡lido detectado, recalculando
      console.warn(`Desconto invÃ¡lido detectado: ${discountPct}% para ${item.title}, recalculando...`);
      
      // Se preÃ§o final for 0, é jogo grÃ¡tis (100% de desconto)
      if (priceFinal === 0) {
        discountPct = 100;
      } else if (item.priceFinalCents > 0) {
        // Tentar inferir o desconto com base na origem dos dados
        // Para dados da Epic Games, podemos confiar mais no desconto fornecido
        if (item.store === 'Epic Games') {
          // No caso da Epic, se temos desconto invÃ¡lido e preÃ§o_final = 0, é grÃ¡tis
          if (priceFinal === 0) {
            discountPct = 100;
          } else {
            // Manter o desconto como 0 se for invÃ¡lido e nÃ£o for grÃ¡tis
            discountPct = 0;
          }
        } else {
          // Para outros casos, manter como 0
          discountPct = 0;
        }
      } else {
        // Desconto invÃ¡lido e dados inconsistentes, manter como 0
        discountPct = 0;
      }
    }
    
    // Verificar se o preÃ§o final é 0 (gratuito), o que indica 100% de desconto
    if (priceFinal === 0) {
      // Jogo grÃ¡tis - desconto deve ser 100%
      priceBase = item.priceFinalCents > 0 ? item.priceFinalCents / 100 : 100; // PreÃ§o base fictÃ­cio para cÃ¡lculos
      discountPct = 100;
    } else if (discountPct > 0 && discountPct < 100) {
      // Se houver desconto entre 0 e 100%, calcular o preÃ§o original
      // priceBase = priceFinal / (1 - discountPct / 100)
      priceBase = priceFinal / (1 - discountPct / 100);
    } else if (discountPct >= 100) {
      // Se o desconto for 100% ou mais (gratuito), o preÃ§o base é o preÃ§o final dividido por um valor muito pequeno
      // Neste caso, vamos considerar o preÃ§o final como o preÃ§o base para evitar problemas de divisÃ£o por zero
      priceBase = priceFinal;
    } else {
      // Se nÃ£o houver desconto (ou desconto negativo), usar o preÃ§o final como preÃ§o base
      priceBase = priceFinal;
    }
    
    // Garantir que o desconto esteja dentro de limites razoÃ¡veis
    const finalDiscountPct = Math.max(0, Math.min(100, discountPct));
    
    // Arredondar para 2 casas decimais para evitar problemas de precisÃ£o
    priceBase = Math.round(priceBase * 100) / 100;
    
    return {
      _id: item.id,
      url: item.url,
      priceBase: priceBase,
      priceFinal: priceFinal,
      discountPct: finalDiscountPct, // Usar o desconto corrigido
      releaseDate: item.releaseDate, // Incluindo a data de lanÃ§amento
      game: {
        title: item.title,
        coverUrl: item.coverUrl || '',
        genres: item.genres,
        tags: item.tags
      },
      store: {
        name: item.store
      }
    };
  }, [shouldFilterGame, isValidSteamApp, hasSufficientInfo])

  // Inicializar app diretamente sem onboarding
  useEffect(() => {
    const initializeApp = async () => {
      try {
  console.log('Inicializando app...')
        
        // Carregar deals iniciais
        fetchDeals()
        
        // Solicitar permissÃ£o de notificaÃ§Ã£o apenas uma vez
        const requestNotificationPermission = async () => {
          try {
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default
            const hasAskedBefore = await AsyncStorage.getItem('@notification_permission_asked')
            
            if (!hasAskedBefore) {
              // Aguardar um pouco antes de pedir
              setTimeout(async () => {
                try {
                  const Notifications = require('expo-notifications')
                  await Notifications.requestPermissionsAsync()
                  await AsyncStorage.setItem('@notification_permission_asked', 'true')
                } catch (e) {
                  console.log('Erro ao solicitar permissÃ£o de notificaÃ§Ã£o:', e)
                }
              }, 2000)
            }
          } catch (e) {
            console.log('Erro ao verificar permissÃ£o de notificaÃ§Ã£o:', e)
          }
        }
        
        requestNotificationPermission()
        
        // AnimaÃ§Ã£o de entrada do app
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
      } catch (error) {
        console.error('Erro ao inicializar app:', error)
        // Mesmo com erro, tentar carregar deals
        fetchDeals()
      }
    }

    initializeApp()
  }, [])


  // Inicializar serviÃ§os inteligentes (otimizado)
  const initializeSmartServices = async () => {
    try {
      // Outros serviÃ§os inteligentes podem ser inicializados aqui
      // Removido popup automÃ¡tico de doaÃ§Ã£o
    } catch (error) {
      console.error('Erro ao inicializar serviÃ§os:', error)
    }
  }

  // Efeito para atualizar os dados quando necessÃ¡rio
  useEffect(() => {
    if (activeTab === 'home') {
      fetchDeals(); // Atualizar os dados
    }
  }, [activeTab]); // Removida a dependÃªncia de selectedStore




  const checkFirstTime = async () => {
    // VerificaÃ§Ã£o de termos removida - nÃ£o estamos usando esta funcionalidade no momento
  }





  // FunÃ§Ã£o para filtrar resultados de busca por tipo usando classificaÃ§Ã£o real da Steam
  const applySearchFilter = useCallback((results: Deal[]) => {
    if (searchFilter === 'all') return results
    
    return results.filter((item: any) => {
      const kind = item.kind || 'game' // Usar classificaÃ§Ã£o real da Steam API
      
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
      // NÃ£o limpar a query para manter o texto caso o usuÃ¡rio volte rapidamente
    }
  }, [activeTab])

  // FunÃ§Ã£o para buscar jogos na Steam API
  const searchSteamGames = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([])
      setOriginalSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      console.log('Buscando jogos na Steam:', query)

      const data = await api<any>(`/search?q=${encodeURIComponent(query)}&limit=20`)
      const sourceArray = Array.isArray(data) ? data : []
      
      // Mapeamento corrigido para dados da rota /search
      const mappedResults = sourceArray.map((item: any, index: number) => {
        // Extrair appId do formato "app:12345"
        const appId = item.id ? item.id.replace('app:', '') : null
        
        // Converter preÃ§os de centavos para reais
        const priceBase = (item.priceOriginalCents || 0) / 100
        const priceFinal = (item.priceFinalCents || 0) / 100
        
        return {
          _id: `search-${appId || index}`,
          appId: appId ? Number(appId) : undefined,
          priceBase: priceBase,
          priceFinal: priceFinal,
          discountPct: item.discountPct || 0,
          url: item.url || `https://store.steampowered.com/app/${appId}/`,
          kind: item.kind || 'game', // Usar classificaÃ§Ã£o real da Steam
          game: {
            title: item.title || 'TÃ­tulo nÃ£o encontrado',
            coverUrl: item.image || ''
          },
          store: {
            name: item.store || (item.id?.includes('epic_') ? 'Epic Games' : 'Steam')
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

  // FunÃ§Ã£o para limpar a busca (resultados e query)
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
    
    // Buscar apÃ³s 500ms de inatividade
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

  // FunÃ§Ã£o para obter o dia do ano
  const getDayOfYear = (date: Date): number => {
    return Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  };

  // FunÃ§Ã£o para obter data armazenada/local
  const getLastUpdatedDay = async (): Promise<number | null> => {
    try {
      const lastUpdateStr = await AsyncStorage.getItem('LAST_DEALS_UPDATE_DAY');
      return lastUpdateStr ? parseInt(lastUpdateStr, 10) : null;
    } catch (error) {
      console.error('Erro ao obter última atualização:', error);
      return null;
    }
  };

  // FunÃ§Ã£o para salvar a data do Ãºltimo update
  const setLastUpdatedDay = async (day: number): Promise<void> => {
    try {
      await AsyncStorage.setItem('LAST_DEALS_UPDATE_DAY', day.toString());
    } catch (error) {
      console.error('Erro ao salvar última atualização:', error);
    }
  };

  const fetchDeals = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Buscar todos os dados (Steam)
      const endpoint = `/deals?limit=100`;
      
      // Verificar se já passou um dia desde a última atualização
      const today = new Date();
      const currentDayOfYear = getDayOfYear(today);
      const lastUpdatedDay = await getLastUpdatedDay();
      
      // ForÃ§ar atualização se for um novo dia
      if (lastUpdatedDay === null || lastUpdatedDay !== currentDayOfYear) {
  console.log(`Atualizando ofertas - Novo dia detectado (hoje: ${currentDayOfYear}, �ltimo: ${lastUpdatedDay})`);
      }
      
      // Usar função api do client.ts que agora tem timeout de 20s e mais configurações
      const response = await api<any>(endpoint);

      // A resposta do endpoint /deals está no formato original
      const curated = Array.isArray(response) ? response : [];

      if (!Array.isArray(curated) || curated.length === 0) {
        setDeals([])
        setError('Nenhuma oferta encontrada no momento')
        return
      }

      // Processamento otimizado dos dados

      // Processamento normal para dados gerais (Steam e outros)
      const rawDeals = curated.map((item: any, index: number) => ({
        _id: item._id || `deal-${item.appId || index}`,
        appId: item.appId,
        url: item.url,
        priceBase: item.priceBase || 0,
        priceFinal: item.priceFinal || 0,
        discountPct: item.discountPct || 0,
        game: {
          title: item.game?.title || item.title || 'TÃ­tulo nÃ£o encontrado',
          coverUrl: item.game?.coverUrl || item.coverUrl || (item.appId ? `https://cdn.akamai.steamstatic.com/steam/apps/${item.appId}/header.jpg` : null),
          genres: item.game?.genres || item.genres || [],
          tags: item.game?.tags || item.tags || []
        },
        store: item.store || { name: 'Steam' }
      }));

      // Filtrar jogos indesejados (como DOOM se nÃ£o estiver mais disponÃ­vel), appIds invÃ¡lidos e jogos com informaÃ§Ãµes insuficientes
      const sourceDeals: any[] = rawDeals.filter(deal => {
        if (!hasSufficientInfo(deal)) return false; // Filtrar por informaÃ§Ãµes insuficientes
        if (shouldFilterGame(deal.game?.title)) return false; // Filtrar por tÃ­tulo
        // Filtrar por appId invÃ¡lido
        if (deal.appId && !isValidSteamApp(deal.appId)) return false;
        return true;
      })
      
      // RemoÃ§Ã£o otimizada de duplicatas
      const seen = new Set()
      const uniqueDeals = sourceDeals.filter((deal: any) => {
        if (seen.has(deal._id)) return false
        seen.add(deal._id)
        return true
      })

      // OrdenaÃ§Ã£o hierÃ¡rquica: super ofertas primeiro, depois ofertas normais
      uniqueDeals.sort((a: Deal, b: Deal) => {
        const aIsSuperDeal = a.discountPct >= 70;
        const bIsSuperDeal = b.discountPct >= 70;
        
        // Se ambos forem super ofertas ou ambos nÃ£o forem, ordenar por desconto
        if (aIsSuperDeal === bIsSuperDeal) {
          return b.discountPct - a.discountPct;
        }
        
        // Super ofertas vÃªm primeiro
        return aIsSuperDeal ? -1 : 1;
      })
      
      // Sistema de rotaÃ§Ã£o diÃ¡ria de "Ofertas do Dia" - aplicar rotaÃ§Ã£o a todos os dados
      let dailyRotatedDeals = uniqueDeals;
      // FunÃ§Ã£o de embaralhamento com seed baseado no dia
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
      
      // Aplicar rotaÃ§Ã£o diÃ¡ria com seed baseado no dia do ano (embaralhamento tradicional)
      dailyRotatedDeals = shuffleWithSeed(uniqueDeals, currentDayOfYear);
      
  console.log(`Ofertas do Dia - Rotação para ${today.toLocaleDateString()} (dia ${currentDayOfYear})`)
  console.log(`${dailyRotatedDeals.length} ofertas embaralhadas para hoje`)


      setDeals(dailyRotatedDeals); // Mostrar todos os dados
      
      // Salvar que atualizamos hoje
      await setLastUpdatedDay(currentDayOfYear);
      
      // Notificação de oferta do dia agora é enviada pelo backend Ã s 12h e 18h
      
    } catch (err: any) {
      let errorMessage = 'Erro ao carregar ofertas'
      if (err?.name === 'AbortError') {
        errorMessage = 'Timeout: Verifique sua conexÃ£o'
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

  // FunÃ§Ã£o auxiliar para embaralhar array aleatoriamente
  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };




  // Pull-to-refresh handler for Home
  const onRefresh = async () => {
    try {
      setRefreshing(true)
      await fetchDeals()
      // Atualizar o feed também
      if (hasActiveFilters) {
        refreshFeed()
      } else {
        // Se nÃ£o tiver filtros, forÃ§ar a atualização dos gameItems
        refreshFeed()
      }
    } finally {
      setRefreshing(false)
    }
  }




  // Verificar se hÃ¡ filtros ativos
  const hasActiveFiltersLocal = hasActiveFilters

  const loadWishlistCount = async () => {
    try {
      const wishlist = await WishlistService.getWishlist()
      setWishlistCount(wishlist.length)
    } catch (error) {
      console.error('Erro ao carregar contador da wishlist:', error)
    }
  }

  const handleGamePress = async (deal: Deal) => {
    // Detectar se é um jogo da Epic Games
    const isEpicGame = deal.store?.name?.toLowerCase().includes('epic') || deal.url.includes('epicgames.com');

    if (isEpicGame) {
      // Para jogos da Epic, usar o _id como identificador único (em vez de appId)
      // O modal vai usar os dados locais do deal em vez de buscar da API Steam
      const epicGameId = deal._id || deal.game?.title || 'epic-game';

      console.log('🎮 Abrindo detalhes do jogo da Epic:', {
        title: deal.game?.title,
        productSlug: (deal as any).productSlug,
        urlSlug: (deal as any).urlSlug,
        catalogNs: (deal as any).catalogNs,
        offerMappings: (deal as any).offerMappings,
      });

      setSelectedGameId(epicGameId as any);
      setSelectedDeal(deal);
      setGameDetailsModalVisible(true);

      // Rastrear ação de abrir detalhes do jogo
      interstitialAdService.trackAction();
      return;
    }

    // Para deals normais (Steam), prefere usar appId; tenta extrair do url ou do _id como fallback
    let appId: number | null = (deal as any).appId || null
    console.debug('handleGamePress start', { id: deal._id, appId: (deal as any).appId, url: (deal as any).url, game: deal.game })

    if (!appId) {
      // tenta extrair do URL (ex: https://store.steampowered.com/app/1849250)
      const url = (deal as any).url || ''
      const m = url && typeof url === 'string' ? url.match(/\/app\/(\d+)/) : null
      if (m) appId = parseInt(m[1], 10)
    }

    if (!appId && deal._id) {
      // extrai a primeira sequência longa de dígitos do _id como fallback apenas para jogos da Steam
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

    // Rastrear ação de abrir detalhes do jogo
    interstitialAdService.trackAction();
  }

  const handleCloseGameDetails = () => {
    setGameDetailsModalVisible(false)
    setSelectedGameId(null)
    setSelectedDeal(null)
    loadWishlistCount() // Recarregar contador apÃ³s possÃ­veis mudanÃ§as na wishlist
    
    // Tentar mostrar anÃºncio ao fechar detalhes
    interstitialAdService.tryShowAd();
  }

  const handleAddToWishlist = async (appId: number, title: string, currentPrice: number, desiredPrice: number, coverUrl: string) => {
    try {
      await WishlistService.addToWishlist({
        appId,
        title,
        currentPrice,
        desiredPrice,
        coverUrl,
        notified: false,
        store: 'Steam',
        url: `https://store.steampowered.com/app/${appId}/`
      })
      await loadWishlistCount()
      await loadWishlistGames()
    } catch (error) {
      console.error('Erro ao adicionar Ã  wishlist:', error)
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
      console.error('Erro ao atualizar preÃ§o desejado:', error)
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
      if (priceInReais === null || priceInReais === undefined || isNaN(priceInReais) || priceInReais === 0) return t('price.free')
      try {
        // Use Intl with the provided currency as a sensible fallback
        const locale = currency === 'BRL' ? 'pt-BR' : 'en-US'
        return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(priceInReais)
      } catch (e2) {
        return `${priceInReais.toFixed(2)} ${currency}`
      }
    }
  }

  // Currency subtitle help      
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

  // Componente para anÃ¡lise de preÃ§o Steam
  // Componente removido: anÃ¡lise de preÃ§o avanÃ§ada nÃ£o essencial


  const openGameDetails = (deal: Deal) => {
    handleGamePress(deal)
  }

  // FunÃ§Ã£o para analisar se o preÃ§o estÃ¡ alto ou baixo
  const getPriceIndicator = (deal: Deal) => {
    const discount = deal.discountPct || 0
    const finalPrice = deal.priceFinal || 0
    const originalPrice = deal.priceBase || finalPrice
    
    // AnÃ¡lise baseada no desconto e preÃ§o
    if (discount >= 70) {
      return { label: t('price.veryLow'), color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)' }
    } else if (discount >= 50) {
      return { label: t('price.lowest'), color: '#059669', bgColor: 'rgba(5, 150, 105, 0.15)' }
    } else if (discount >= 30) {
      return { label: t('price.average'), color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.15)' }
    } else if (discount >= 10) {
      return { label: t('price.high'), color: '#DC2626', bgColor: 'rgba(220, 38, 38, 0.15)' }
    } else if (finalPrice > 150) {
      // PreÃ§o alto mesmo sem desconto
      return { label: t('price.veryHigh'), color: '#991B1B', bgColor: 'rgba(153, 27, 27, 0.15)' }
    } else if (finalPrice < 20 && discount === 0) {
      // PreÃ§o baixo naturalmente
      return { label: t('price.good'), color: '#059669', bgColor: 'rgba(5, 150, 105, 0.15)' }
    }
    
    // Se nÃ£o tem desconto e preÃ§o médio
    if (discount === 0) {
      return { label: t('price.normal'), color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.15)' }
    }
    
    return null
  }

  // FunÃ§Ã£o para testar a notificaÃ§Ã£o de oferta do dia
  const sendTestDailyOffer = async () => {
    try {
      // Pegar a primeira oferta disponÃ­vel para usar como exemplo
      const testDeal: Deal = deals[0] || {
        _id: 'test-deal',
        url: 'https://store.steampowered.com',
        priceBase: 199.99,
        priceFinal: 49.99,
        discountPct: 75,
        game: {
          title: 'Jogo de Teste',
          coverUrl: '',
          genres: [],
          tags: []
        },
        store: {
          name: 'Steam'
        }
      };
      
      // NotificaÃ§Ãµes agora sÃ£o enviadas pelo backend
      // Para testar, use os endpoints de debug do backend:
      // GET /debug/test-daily-offer
      // GET /debug/test-watched-games
      showToast('Use os endpoints de debug do backend para testar notificaÃ§Ãµes');
    } catch (error) {
      console.error('Erro ao enviar notificaÃ§Ã£o de teste:', error);
      showToast('Erro ao enviar notificaÃ§Ã£o de teste');
    }
  };

  // FunÃ§Ã£o para testar notificaÃ§Ã£o de jogo vigiado
  const sendTestWatchedGame = async () => {
    try {
      // NotificaÃ§Ãµes agora sÃ£o enviadas pelo backend
      // Para testar, use: GET /debug/test-watched-games
      showToast('Use GET /debug/test-watched-games no backend para testar');
    } catch (error) {
      console.error('Erro:', error);
      showToast('Erro ao processar teste');
    }
  };

  // Componente para anÃ¡lise de preÃ§o Steam
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
            console.error('Erro ao carregar anÃ¡lise de preÃ§o:', error)
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
        case 'lowest': return 'Menor preÃ§o!'
        case 'good': return 'Bom preÃ§o'
        case 'average': return 'PreÃ§o médio'
        case 'high': return 'PreÃ§o alto'
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
    if (analysis.priceStatus === 'high') return null // NÃ£o mostrar preÃ§os altos

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

  const renderHeader = () => (
    <View style={{ paddingHorizontal: 20, paddingTop: 0, paddingBottom: 0 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Image
            source={require('../assets/images/Logosemsundo.png')}
            style={{ width: 32, height: 32, marginRight: 12 }}
            resizeMode="contain"
          />
          <View>
            <Text style={{ fontSize: 32, fontWeight: '800', color: '#FFFFFF' }}>{t('header.title')}</Text>
            <Text style={{ 
              color: '#9CA3AF', 
              fontSize: 14, 
              fontWeight: '400',
              marginTop: -2
            }}>
              {t('header.subtitle')}
            </Text>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {/* Toggle de Layout */}
          <TouchableOpacity
            onPress={() => setLayoutType(prev => prev === 'column' ? 'grid' : 'column')}
            style={{
              padding: 8,
            }}
          >
            <Ionicons 
              name={layoutType === 'grid' ? 'list' : 'grid'} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>

          {/* Sino de notificaÃ§Ãµes */}
          <TouchableOpacity
            onPress={() => setShowNotificationsHistory(true)}
            style={{
              position: 'relative',
              padding: 8,
            }}
          >
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            {receivedNotifications.length > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  backgroundColor: '#EF4444',
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                  {receivedNotifications.length > 99 ? '99+' : receivedNotifications.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  // Componente animado para contorno dos jogos em destaque
  // Apenas contorno simples, sem brilho
  const AnimatedHighlightBorder: React.FC<{ children: React.ReactNode; isHighlighted: boolean; highlightColor: string }> = ({ children, isHighlighted, highlightColor }) => {
    // Sempre retornar os filhos - o destaque serÃ¡ aplicado diretamente no card
    return <>{children}</>
  }

  // FunÃ§Ã£o auxiliar para renderizar o Ã­cone da loja como logo circular
  const renderStoreIcon = (storeName: string | undefined) => {
    if (!storeName) {
      return (
        <View style={{ 
          width: isTablet ? 28 : 24, 
          height: isTablet ? 28 : 24, 
          borderRadius: 14, 
          backgroundColor: '#4B5563',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Ionicons name="storefront-outline" size={isTablet ? 16 : 14} color="#FFFFFF" />
        </View>
      );
    }

    switch (storeName) {
      case 'Steam':
        return (
          <Image 
            source={require('../assets/images/steam.png')} 
            style={{ width: isTablet ? 28 : 24, height: isTablet ? 28 : 24 }} 
            resizeMode="contain"
          />
        );
      case 'Epic Games':
        return (
          <Image 
            source={require('../assets/images/epicgames.png')} 
            style={{ width: isTablet ? 28 : 24, height: isTablet ? 28 : 24 }} 
            resizeMode="contain"
          />
        );
      case 'Origin':
        return (
          <View style={{ 
            width: isTablet ? 28 : 24, 
            height: isTablet ? 28 : 24, 
            borderRadius: 14, 
            backgroundColor: '#F56C26',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Ionicons name="logo-game-controller" size={isTablet ? 16 : 14} color="#FFFFFF" />
          </View>
        );
      case 'Uplay':
        return (
          <View style={{ 
            width: isTablet ? 28 : 24, 
            height: isTablet ? 28 : 24, 
            borderRadius: 14, 
            backgroundColor: '#000000',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Ionicons name="key" size={isTablet ? 16 : 14} color="#FFFFFF" />
          </View>
        );
      case 'Humble Bundle':
        return (
          <View style={{ 
            width: isTablet ? 28 : 24, 
            height: isTablet ? 28 : 24, 
            borderRadius: 14, 
            backgroundColor: '#ab6441',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Ionicons name="cube" size={isTablet ? 16 : 14} color="#FFFFFF" />
          </View>
        );
      case 'Green Man Gaming':
        return (
          <View style={{ 
            width: isTablet ? 28 : 24, 
            height: isTablet ? 28 : 24, 
            borderRadius: 14, 
            backgroundColor: '#8BBC3E',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Ionicons name="leaf" size={isTablet ? 16 : 14} color="#FFFFFF" />
          </View>
        );
      default:
        return (
          <View style={{ 
            width: isTablet ? 28 : 24, 
            height: isTablet ? 28 : 24, 
            borderRadius: 14, 
            backgroundColor: '#4B5563',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Ionicons name="storefront-outline" size={isTablet ? 16 : 14} color="#FFFFFF" />
          </View>
        );
    }
  };

  const renderGameCard = ({ item: deal, index, isGridLayout }: { item: Deal & { isBestDeal?: boolean, highlightColor?: string }, index?: number, isGridLayout?: boolean }) => {
    const isHighlighted = deal.discountPct >= 50;
    const isSuperDeal = deal.discountPct >= 70;
    const isRecentlyReleasedFlag = deal.releaseDate ? isRecentlyReleased(deal.releaseDate) : false;
    const highlightColor = deal.highlightColor || (isSuperDeal ? '#FFD700' : isHighlighted ? '#ff8800' : '#FFD700');
    
    // Verificar se é Early Access - busca mais ampla
    const isEarlyAccess = deal.isEarlyAccess === true ||
      // Verificar no tÃ­tulo do jogo
      (deal.game?.title && String(deal.game.title).toLowerCase().includes('early access')) ||
      (deal.game?.title && String(deal.game.title).toLowerCase().includes('acesso antecipado')) ||
      // Verificar nas tags
      (deal.game?.tags && Array.isArray(deal.game.tags) && 
       deal.game.tags.some((tag: string) => 
         String(tag).toLowerCase().includes('early access') || 
         String(tag).toLowerCase().includes('acesso antecipado'))) ||
      // Verificar nos gÃªneros Steam
      (deal.steamGenres && Array.isArray(deal.steamGenres) && 
       deal.steamGenres.some((genre: any) => 
         (genre.name && String(genre.name).toLowerCase().includes('early access')) || 
         (genre.name && String(genre.name).toLowerCase().includes('acesso antecipado')) ||
         (genre.description && String(genre.description).toLowerCase().includes('early access')) ||
         (genre.description && String(genre.description).toLowerCase().includes('acesso antecipado')))) ||
      // Verificar nos gÃªneros do jogo
      (deal.game?.genres && Array.isArray(deal.game.genres) && 
       deal.game.genres.some((genre: string | any) => 
         (typeof genre === 'string' && (String(genre).toLowerCase().includes('early access') || String(genre).toLowerCase().includes('acesso antecipado'))) ||
         (typeof genre === 'object' && genre.name && (String(genre.name).toLowerCase().includes('early access') || String(genre.name).toLowerCase().includes('acesso antecipado')))));
    
    // Ajustar dimensÃµes para modo grid (como hardware)
    const imageHeight = isGridLayout ? 120 : 200;
    const titleFontSize = isGridLayout ? (isTablet ? 16 : 14) : (isTablet ? 20 : 18);
    const priceFontSize = isGridLayout ? (isTablet ? 20 : 18) : (isTablet ? 26 : 22);
    const oldPriceFontSize = isGridLayout ? (isTablet ? 12 : 11) : (isTablet ? 16 : 14);
    const padding = isGridLayout ? (isTablet ? 12 : 10) : (isTablet ? 20 : 16);
    const headerPadding = isGridLayout ? 8 : 10;
    const headerFontSize = isGridLayout ? (isTablet ? 14 : 12) : (isTablet ? 18 : 16);
    
    return (
      <View style={{ marginBottom: isGridLayout ? 12 : 16 }}>
        <View 
          style={{
            borderRadius: isGridLayout ? 12 : 16,
            overflow: 'hidden',
          }}
        >
          <TouchableOpacity
          onPress={() => openGameDetails(deal)}
          activeOpacity={0.95}
          style={{
            backgroundColor: '#374151',
            borderRadius: isGridLayout ? 10 : 14, // Menor que 16 para acomodar a borda de 2px da View wrapper
            overflow: 'hidden',
            // Adicionar leve sombreamento
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
            borderWidth: 0,
            borderColor: 'transparent'
          }}
        >

      {/* Destaque para jogos recém-lanÃ§ados */}
      {isRecentlyReleasedFlag && !isGridLayout && (
        <View style={{ position: 'absolute', top: 8, left: 8, zIndex: 20, alignItems: 'center' }}>
          <View
            accessible
            accessibilityLabel="Novo LanÃ§amento!"
            style={{
              backgroundColor: '#10B981', // Verde para novos lanÃ§amentos
              padding: 4,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#059669',
              shadowColor: '#10B981',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.6,
              shadowRadius: 6,
              elevation: 10,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Ionicons name="flame" size={16} color="#FFFFFF" />
          </View>
          <Text style={{ color: '#10B981', fontSize: 9, marginTop: 4, fontWeight: '600' }}>
            LANÃ‡AMENTO!
          </Text>
        </View>
      )}
      {/* Barra superior com a loja */}
      <LinearGradient
        colors={deal.store?.name?.toLowerCase().includes('epic') ? ['#000000', '#1a1a1a'] : ['#60a5fa', '#3b82f6']} // Gradiente preto para jogos da Epic Games, azul para Steam
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'center',
          paddingHorizontal: isTablet ? 20 : 16,
          paddingVertical: headerPadding,
          borderTopLeftRadius: isGridLayout ? 10 : 14, // Mantém o arredondamento do card
          borderTopRightRadius: isGridLayout ? 10 : 14
        }}
      >
        {renderStoreIcon(deal.store?.name)}
        <Text style={{ 
          color: '#FFFFFF', 
          fontSize: headerFontSize, 
          fontWeight: 'bold', 
          marginLeft: 10,
          textShadowColor: 'rgba(0, 0, 0, 0.3)', // Adiciona sombra para melhor contraste
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 1
        }}>
          {deal.store?.name || 'Loja'}
        </Text>
      </LinearGradient>
      
      {/* Removido: botões de favorito e adicionar Ã  lista foram movidos para o botão 'Desejar' no modal */}

      <GameCover 
        imageUrls={(deal.imageUrls && deal.imageUrls.length > 0) ? deal.imageUrls : [deal.game?.coverUrl]} 
        height={imageHeight}
        style={{ width: '100%', height: imageHeight, borderTopLeftRadius: 0, borderTopRightRadius: 0 }} 
      />
        
        <View style={{ padding: padding }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: isGridLayout ? 6 : (isTablet ? 10 : 8), minHeight: isGridLayout ? 40 : undefined }}>
          <Text 
            style={{ 
              color: '#FFFFFF', 
              fontSize: titleFontSize, 
              fontWeight: '700',
              flex: 1,
              marginRight: 8
            }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {String(deal.game?.title || 'TÃ­tulo nÃ£o encontrado')}
          </Text>
          
          {getPriceIndicator(deal) && !isGridLayout && (
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
          <View style={{ flex: 1, justifyContent: 'center', paddingRight: 8 }}>
            {(deal.discountPct || 0) > 0 && (
              <PriceText
                value={deal.priceBase}
                deal={deal}
                style={{ color: '#EF4444', fontSize: oldPriceFontSize, textDecorationLine: 'line-through', marginBottom: 2, lineHeight: isGridLayout ? (isTablet ? 14 : 13) : (isTablet ? 18 : 16) }} // PreÃ§o base em vermelho
              />
            )}
            {/* Final price: highlight in green when discounted */}
            <PriceText
              value={deal.priceFinal}
              deal={deal}
              style={((deal.discountPct || 0) > 0 || (deal.priceBase && deal.priceFinal < deal.priceBase))
                ? { color: '#10B981', backgroundColor: 'rgba(16,185,129,0.08)', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 4, fontSize: priceFontSize, fontWeight: '900', lineHeight: isGridLayout ? (isTablet ? 22 : 20) : (isTablet ? 28 : 24), textShadowColor: 'rgba(16,185,129,0.06)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 1, alignSelf: 'flex-start' } // PreÃ§o final em destaque verde
                : { color: (deal as any).isFree || deal.priceFinal === 0 ? '#3B82F6' : '#FFFFFF', fontSize: priceFontSize, fontWeight: '800', lineHeight: isGridLayout ? (isTablet ? 22 : 20) : (isTablet ? 28 : 24) }
              }
            />
          </View>
          
          {(deal.discountPct || 0) > 0 && (
            <View style={{ 
              backgroundColor: '#DC2626', 
              paddingHorizontal: isGridLayout ? 8 : 12, 
              paddingVertical: isGridLayout ? 4 : 6, 
              borderRadius: isGridLayout ? 16 : 20 
            }}>
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: isGridLayout ? (isTablet ? 11 : 10) : (isTablet ? 14 : 12), 
                fontWeight: '700' 
              }}>
                -{Math.round(deal.discountPct || 0)}%
              </Text>
            </View>
          )}
        </View>
      </View>
        </TouchableOpacity>
      </View>
      </View>
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
  { code: 'EUR', name: 'Euro', symbol: '�' },
  { code: 'GBP', name: 'British Pound', symbol: '�' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '�' },
    { code: 'AUD', name: 'Australian Dollar', symbol: '$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: '$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '�' },
    { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '?' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '?' },
  { code: 'KRW', name: 'South Korean Won', symbol: '?' },
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
              placeholder="Buscar moeda (cÃ³digo ou nome)"
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
                  <Text style={{ color: c.code === currency ? '#FFFFFF' : '#E5E7EB', fontSize: 15, fontWeight: '700' }}>{c.code} é {c.name}</Text>
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
      backgroundColor: 'transparent', 
      paddingBottom: bottomNavPadding, // Usa o padding dinÃ¢mico baseado no tipo de navegaÃ§Ã£o
      paddingTop: 7
    }}>
      <View style={{ 
        backgroundColor: 'rgba(55, 65, 81, 0.7)', // Cinza escuro com leve transparÃªncia
        flexDirection: 'row',
        paddingBottom: 10, // Padding consistente
        paddingHorizontal: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        justifyContent: 'center',
        alignItems: 'center',
        // Adicionando efeitos de blur e sombra para iPhone-like
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
          },
          android: {
            elevation: 8,
          }
        }),
      }}>
      {[
        { key: 'home', icon: 'game-controller', label: t('tab.games') },
        { key: 'hardware', icon: 'desktop-outline', label: t('tab.hardware') },
        { key: 'search', icon: 'search', label: t('tab.search') },
        { key: 'favorites', icon: 'eye', label: t('tab.watching') },
        { key: 'profile', icon: 'settings', label: t('tab.config') }
      ].map((tab: { key: string; icon: string; label: string }) => (
        <TouchableOpacity
          key={tab.key}
          onPress={() => {
            // Rastrear aÃ§Ã£o e tentar mostrar anÃºncio intersticial
            interstitialAdService.trackAction();
            interstitialAdService.tryShowAd();
            setActiveTab(tab.key as any);
          }}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8
          }}
        >
          <Ionicons 
            name={activeTab === tab.key ? (tab.icon as any) : (tab.icon.endsWith('-outline') ? tab.icon : `${tab.icon}-outline` as any)} 
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
    </View>
  )

  // Modal de HistÃ³rico de NotificaÃ§Ãµes
  const NotificationsHistoryModal = () => {
    const clearAllNotifications = async () => {
      setReceivedNotifications([]);
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.removeItem('@notifications_history');
      setShowNotificationsHistory(false);
    };
    
    const formatTimestamp = (timestamp: string) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Agora';
      if (diffMins < 60) return `${diffMins}min atrÃ¡s`;
      if (diffHours < 24) return `${diffHours}h atrÃ¡s`;
      if (diffDays === 1) return 'Ontem';
      return `${diffDays}d atrÃ¡s`;
    };
    
    return (
      <Modal 
        visible={showNotificationsHistory} 
        animationType="fade" 
        transparent 
        onRequestClose={() => setShowNotificationsHistory(false)}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => setShowNotificationsHistory(false)}
          style={{ 
            flex: 1, 
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
          }}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{ 
              width: '100%',
              maxWidth: 500,
              maxHeight: '80%',
              backgroundColor: '#1F2937',
              borderRadius: 20,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {/* Header */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: '#374151',
              backgroundColor: '#111827'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="notifications" size={22} color="#3B82F6" style={{ marginRight: 10 }} />
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
                  {t('notifications.title')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowNotificationsHistory(false)}>
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            
            {/* Lista de NotificaÃ§Ãµes */}
            {receivedNotifications.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Ionicons name="notifications-off-outline" size={48} color="#4B5563" />
                <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 12, textAlign: 'center' }}>
                  {t('notifications.empty')}
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 6, textAlign: 'center' }}>
                  {t('notifications.emptyDesc')}
                </Text>
              </View>
            ) : (
              <>
                <ScrollView 
                  style={{ maxHeight: 400 }}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ paddingBottom: 8 }}
                >
                  {receivedNotifications.map((notification, index) => (
                    <View
                      key={notification.id}
                      style={{
                        padding: 14,
                        marginHorizontal: 16,
                        marginTop: index === 0 ? 12 : 0,
                        marginBottom: 10,
                        backgroundColor: '#374151',
                        borderRadius: 10,
                        borderLeftWidth: 3,
                        borderLeftColor: notification.data?.type === 'watched_game_deal' ? '#10B981' : '#3B82F6',
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', flex: 1, marginRight: 8 }}>
                          {notification.title}
                        </Text>
                        <Text style={{ color: '#9CA3AF', fontSize: 11 }}>
                          {formatTimestamp(notification.timestamp)}
                        </Text>
                      </View>
                      <Text style={{ color: '#D1D5DB', fontSize: 13, lineHeight: 18 }}>
                        {notification.body}
                      </Text>
                      {notification.data?.url && (
                        <TouchableOpacity
                          onPress={() => {
                            Linking.openURL(notification.data.url);
                            setShowNotificationsHistory(false);
                          }}
                          style={{
                            marginTop: 10,
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            backgroundColor: '#10B981',
                            borderRadius: 6,
                            alignSelf: 'flex-start',
                          }}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
                            Ver Oferta
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </ScrollView>
                
                {/* BotÃ£o Limpar Todas */}
                <View style={{ 
                  padding: 16, 
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: '#374151'
                }}>
                  <TouchableOpacity
                    onPress={clearAllNotifications}
                    style={{
                      padding: 12,
                      backgroundColor: '#DC2626',
                      borderRadius: 10,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
                      {t('notifications.clearAll')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Componente para Modal de Privacidade
  const PrivacyModal = () => (
    <Modal visible={showPrivacyModal} animationType="fade" transparent onRequestClose={() => setShowPrivacyModal(false)}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ 
          width: '90%', 
          maxWidth: 560, 
          backgroundColor: '#374151', 
          borderRadius: 16, 
          padding: 20,
          margin: 20
        }}>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 16 
          }}>
            <Text style={{ 
              color: '#FFFFFF', 
              fontSize: 18, 
              fontWeight: '700' 
            }}>
              Políticas de Privacidade
            </Text>
            <TouchableOpacity
              onPress={() => setShowPrivacyModal(false)}
              style={{ padding: 8 }}
            >
              <Ionicons name="close" size={24} color="#E5E7EB" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
            <Text style={{ color: '#E5E7EB', fontSize: 15, lineHeight: 22 }}>
              Nossa política de privacidade:{'\n\n'}
              - Coletamos apenas dados necessários para funcionamento do app (como sua lista de observação e preferências){'\n\n'}
              - Não compartilhamos seus dados com terceiros{'\n\n'}
              - Você pode solicitar a remoção de seus dados a qualquer momento{'\n\n'}
              - Utilizamos notificações push para informar sobre ofertas relevantes{'\n\n'}
              - Seus dados são armazenados de forma segura em nossos servidores
            </Text>
          </ScrollView>
          
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'flex-end', 
            marginTop: 20 
          }}>
            <TouchableOpacity
              onPress={() => {
                Linking.openURL('mailto:nexusdevsystem@gmail.com')
                setShowPrivacyModal(false)
              }}
              style={{ 
                backgroundColor: '#3B82F6', 
                paddingHorizontal: 16, 
                paddingVertical: 10, 
                borderRadius: 8,
                marginLeft: 10
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                Contato
              </Text>
            </TouchableOpacity>
            
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )

  // Componente para Modal de Ajuda
  const HelpModal = () => (
    <Modal visible={showHelpModal} animationType="fade" transparent onRequestClose={() => setShowHelpModal(false)}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ 
          width: '90%', 
          maxWidth: 560, 
          backgroundColor: '#374151', 
          borderRadius: 16, 
          padding: 20,
          margin: 20
        }}>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 16 
          }}>
            <Text style={{ 
              color: '#FFFFFF', 
              fontSize: 18, 
              fontWeight: '700' 
            }}>
              Central de Ajuda
            </Text>
            <TouchableOpacity 
              onPress={() => setShowHelpModal(false)} 
              style={{ padding: 8 }}
            >
              <Ionicons name="close" size={24} color="#E5E7EB" />
            </TouchableOpacity>
          </View>
          
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: '#E5E7EB', fontSize: 15, lineHeight: 22, marginBottom: 10 }}>
              Precisa de ajuda? Temos algumas opções para você:
            </Text>
            
            <TouchableOpacity
              onPress={() => {
                Linking.openURL('https://www.nexusdevsystem.com')
                setShowHelpModal(false)
              }}
              style={{ 
                backgroundColor: '#1F2937', 
                padding: 15, 
                borderRadius: 12, 
                marginBottom: 10 
              }}
            >
              <Text style={{ color: '#3B82F6', fontSize: 15, fontWeight: '600' }}>
                Visitar nosso site
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                Linking.openURL('mailto:nexusdevsystem@gmail.com')
                setShowHelpModal(false)
              }}
              style={{ 
                backgroundColor: '#1F2937', 
                padding: 15, 
                borderRadius: 12 
              }}
            >
              <Text style={{ color: '#3B82F6', fontSize: 15, fontWeight: '600' }}>
                Enviar email
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )

  // Componente para Modal da VersÃ£o Pro
  // TEMPORARIAMENTE DESABILITADO - SerÃ¡ ativado quando configurar assinaturas no Play Console
  /*
  const ProModal = () => (
    <Modal visible={showProModal} animationType="fade" transparent onRequestClose={() => setShowProModal(false)}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ 
          width: '90%', 
          maxWidth: 400, 
          backgroundColor: '#374151', 
          borderRadius: 16, 
          padding: 30,
          margin: 20,
          alignItems: 'center'
        }}>
          <Ionicons name="diamond" size={64} color="#FFD700" style={{ marginBottom: 20 }} />
          
          <Text style={{ 
            color: '#FFFFFF', 
            fontSize: 20, 
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: 15
          }}>
            {t('pro.title')}
          </Text>
          
          <Text style={{ 
            color: '#E5E7EB', 
            fontSize: 16, 
            lineHeight: 24,
            textAlign: 'center',
            marginBottom: 30
          }}>
            {t('pro.description')}
          </Text>
          
          <TouchableOpacity
            onPress={async () => {
              setShowProModal(false);
              
              // Abrir tela nativa de assinaturas do Google Play
              try {
                const { getGooglePlaySubscriptionDeepLink, SUBSCRIPTION_INFO } = require('../src/constants/app');
                const url = getGooglePlaySubscriptionDeepLink(SUBSCRIPTION_INFO.MONTHLY_SKU);
                
                const canOpen = await Linking.canOpenURL(url);
                if (canOpen) {
                  await Linking.openURL(url);
                } else {
                  Alert.alert(
                    'Assinar Premium',
                    'Por favor, acesse a Google Play Store para assinar o Looton Premium.'
                  );
                }
              } catch (error) {
                console.error('Erro ao abrir Google Play:', error);
                Alert.alert(
                  'Erro',
                  'NÃ£o foi possÃ­vel abrir a Google Play Store'
                );
              }
            }}
            style={{ 
              backgroundColor: '#10B981', 
              paddingHorizontal: 20, 
              paddingVertical: 15, 
              borderRadius: 12,
              width: '100%',
              alignItems: 'center'
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
              {t('pro.button')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setShowProModal(false)}
            style={{ 
              marginTop: 20,
              padding: 10
            }}
          >
            <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
              {t('pro.continueButton')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  )
  */

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
        {/* Banner AdMob - Aparece em todas as abas exceto Config (profile) */}
        {activeTab !== 'profile' && (
          <View style={{ paddingTop: 35, paddingBottom: 8 }}>
            <AdBanner isPremium={isPremium} />
          </View>
        )}
        
        {activeTab === 'home' && (
          <View style={{ flex: 1 }}>
            <View style={{ paddingBottom: 0 }}>
              {renderHeader()}
            </View>
            
            {(loading || feedLoading) && (
              <View style={{ padding: 50, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={{ color: '#9CA3AF', marginTop: 20, fontSize: 16 }}>
                  {t('home.loading')}
                </Text>
              </View>
            )}

            {(error || feedError) && (
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
                  onPress={async () => await fetchDeals()}
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

            {!feedLoading && !feedError && (gameItems.length > 0 || deals.length > 0) && (
              <>
                <FlatList
                key={layoutType} // ForÃ§a nova renderizaÃ§Ã£o quando o layout muda
                data={(() => {
                  console.log(`Debug: hasActiveFilters=${hasActiveFilters}, memoizedGameItems.length=${memoizedGameItems.length}, deals.length=${deals.length}`);
                  
                  // Usar deals como fallback quando nÃ£o hÃ¡ itens no feed ou quando o feed falha
                  let result = (hasActiveFilters && memoizedGameItems.length > 0) ? memoizedGameItems.map(convertGameItemToDeal).filter((deal): deal is Deal => deal !== null) : (deals.length > 0 ? deals : memoizedGameItems.map(convertGameItemToDeal).filter((deal): deal is Deal => deal !== null));
                  console.log(`Debug: FlatList data length=${result.length}`);
                  
                  // Aplicar ordenaÃ§Ã£o hierÃ¡rquica: super ofertas primeiro, depois ofertas normais
            result = result.sort((a: Deal, b: Deal) => {
                    const aIsSuperDeal = a.discountPct >= 70;
                    const bIsSuperDeal = b.discountPct >= 70;
                    
                    // Se ambos forem super ofertas ou ambos nÃ£o forem, ordenar por desconto
                    if (aIsSuperDeal === bIsSuperDeal) {
                      return b.discountPct - a.discountPct;
                    }
                    
                    // Super ofertas vÃªm primeiro
                    return aIsSuperDeal ? -1 : 1;
                  });

                  // Remover itens da Epic Games do feed principal (já que estÃ£o no banner)
                  result = result.filter((deal) => {
                    const storeName = deal.store?.name || (deal as any).store || '';
                    if (storeName.toLowerCase().includes('epic')) {
                      return false; // NÃ£o incluir itens da Epic no feed principal
                    }
                    return true;
                  });


                  // Remove known test card(s) by filtering titles or known test IDs
                  const bannedIds = new Set(['info_test_version', 'test_card']);
                  result = result.filter((deal) => {
                    const rawId = (deal as any)._id || (deal as any).id || '';
                    if (rawId && bannedIds.has(String(rawId))) return false;

                    const raw = (deal.game?.title || (deal as any).title || '').toString();
                    if (!raw) return true;
                    // Normalize: lowercase and remove common diacritics
                    const normalized = raw.toLowerCase().normalize ? raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : raw.toLowerCase();
                    // Exclude titles that contain both 'nota' and 'teste' or explicit 'versao de teste'
                    if (normalized.includes('nota') && normalized.includes('teste')) return false;
                    if (normalized.includes('versao de teste') || normalized.includes('versÃ£o de teste')) return false;
                    return true;
                  });

                  return result;
                })()}
                renderItem={({ item, index }) => {
                  // Renderizar o card com base no layout selecionado
                  if (layoutType === 'grid') {
                    // Calcular largura exata: (largura total - padding lateral - gap) / 2
                    const screenWidth = width;
                    const horizontalPadding = (isTablet ? 40 : 24) * 2;
                    const gap = 8;
                    const cardWidth = (screenWidth - horizontalPadding - gap) / 2;
                    
                    return (
                      <View style={{ 
                        width: cardWidth,
                      }}>
                        {renderGameCard({ item, index, isGridLayout: true })}
                      </View>
                    );
                  }
                  return renderGameCard({ item, index, isGridLayout: false });
                }}
                keyExtractor={(item, index) => `${item._id || 'game'}-${index}`}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                initialNumToRender={50}
                windowSize={21}
                maxToRenderPerBatch={20}
                numColumns={layoutType === 'grid' ? 2 : 1}
                columnWrapperStyle={layoutType === 'grid' ? { gap: 8 } : null}
                getItemLayout={(data, index) => {
                  if (layoutType === 'grid') {
                    // Para layout em grade, calcular altura diferente
                    return {
                      length: 300, // Altura estimada de cada item no layout de grade
                      offset: 300 * index,
                      index,
                    };
                  } else {
                    // Layout em coluna (original)
                    return {
                      length: 280, // Altura estimada de cada item
                      offset: 280 * index,
                      index,
                    };
                  }
                }}
                onEndReached={() => {
                  // Carregar mais itens quando chegar ao final
                  if (hasNextPage && !feedLoading) {
                    loadMore()
                  }
                }}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={() => {
                  // Banner do Jogo Grátis da Semana da Epic Games (Carrossel)
                  const allItems = [...(gameItems || []), ...(deals || [])];

                  const freeEpicGames = allItems.filter(item => {
                    const storeName = (item as any).store?.name || (item as any).store || (item as any).storeName || '';
                    const finalPrice = (item as any).priceFinalCents || (item as any).priceFinal || 0;
                    const basePrice = (item as any).priceBase || 0;

                    // Grátis da semana: preço original > 0 e preço final = 0 (desconto de 100%)
                    const isTemporaryFree = basePrice > 0 && finalPrice === 0;

                    return (String(storeName).toLowerCase().includes('epic')) && isTemporaryFree;
                  });

                  // Remover duplicatas baseado no título do jogo
                  const uniqueFreeEpicGames = freeEpicGames.filter((item, index, self) => {
                    const title = (item as any).game?.title || (item as any).title || '';
                    return index === self.findIndex(i => {
                      const iTitle = (i as any).game?.title || (i as any).title || '';
                      return iTitle === title;
                    });
                  });

                  if (uniqueFreeEpicGames.length > 0) {
                    // Usar estado para controlar qual jogo está sendo mostrado
                    const [currentGameIndex, setCurrentGameIndex] = React.useState(0);

                    // Alternar automaticamente entre os jogos a cada 4 segundos
                    React.useEffect(() => {
                      if (uniqueFreeEpicGames.length > 1) {
                        const interval = setInterval(() => {
                          setCurrentGameIndex((prevIndex) =>
                            (prevIndex + 1) % uniqueFreeEpicGames.length
                          );
                        }, 4000); // 4 segundos

                        return () => clearInterval(interval);
                      }
                    }, [uniqueFreeEpicGames.length]);

                    // Pegar o jogo atual
                    const currentGame = uniqueFreeEpicGames[currentGameIndex];

                    // Normalizar o item para o formato Deal
                    const normalizedDeal: Deal | null = 'priceFinal' in (currentGame as any)
                      ? (currentGame as Deal)
                      : convertGameItemToDeal(currentGame as GameItem);

                    if (!normalizedDeal) return null;

                    const imageUrl = normalizedDeal.game?.coverUrl || (normalizedDeal as any).image || '';
                    const gameTitle = normalizedDeal.game?.title || (normalizedDeal as any).title || '';

                    return (
                      <View style={{ marginTop: 3, marginBottom: 10 }}>
                        <TouchableOpacity
                          onPress={() => {
                            handleGamePress(normalizedDeal);
                          }}
                          style={{
                            borderRadius: 16,
                            overflow: 'hidden',
                            height: 160,
                          }}
                        >
                          <Image
                            source={{ uri: imageUrl }}
                            style={{
                              width: '100%',
                              height: '100%',
                              resizeMode: 'cover',
                            }}
                          />
                          <View style={{
                            position: 'absolute',
                            top: 10,
                            left: 10,
                          }}>
                            <Text style={{
                              color: '#FFFFFF',
                              fontSize: 12,
                              fontWeight: 'bold',
                              backgroundColor: 'rgba(0,0,0,0.7)',
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6,
                            }}>
                              Grátis na Epic Games
                            </Text>
                          </View>
                          <View style={{
                            position: 'absolute',
                            bottom: 10,
                            left: 10,
                            right: 10,
                          }}>
                            <Text style={{
                              color: '#FFFFFF',
                              fontSize: 16,
                              fontWeight: 'bold',
                            }} numberOfLines={1}>
                              {gameTitle}
                            </Text>
                          </View>

                          {/* Indicadores de página (dots) quando há múltiplos jogos */}
                          {uniqueFreeEpicGames.length > 1 && (
                            <View style={{
                              position: 'absolute',
                              bottom: 10,
                              right: 10,
                              flexDirection: 'row',
                              gap: 6,
                            }}>
                              {uniqueFreeEpicGames.map((_, index) => (
                                <View
                                  key={`dot-${index}`}
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: index === currentGameIndex ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                                  }}
                                />
                              ))}
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  }
                  return null;
                }}
                ListFooterComponent={() => (
                  <View style={{ height: 20 }}>
                    {hasActiveFilters && feedLoading ? (
                      <View style={{ padding: 20, alignItems: 'center' }}>
                        <ActivityIndicator color="#3B82F6" />
                        <Text style={{ color: '#9CA3AF', marginTop: 8 }}>
                          Carregando mais...
                        </Text>
                      </View>
                    ) : null}
                  </View>
                )}
                contentContainerStyle={{ 
                  maxWidth: isTablet ? 800 : width, 
                  alignSelf: 'center', 
                  width: '100%', 
                  paddingHorizontal: isTablet ? 40 : 24,
                  gap: layoutType === 'grid' ? 8 : 0 // Adicionar gap entre os itens no layout de grade
                }}
                refreshControl={
                  <RefreshControl
                    refreshing={false}
                    onRefresh={onRefresh}
                    enabled={true}
                  />
                }
              />
              </>
            )}
            
            {/* Renderizar FlatList vazia quando nÃ£o hÃ¡ dados */}
            {!loading && !feedLoading && !error && !feedError && gameItems.length === 0 && deals.length === 0 && (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
                <Text style={{ color: '#9CA3AF', fontSize: 16 }}>Nenhuma oferta disponÃ­vel no momento</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'search' && (
          <View style={{ flex: 1, paddingTop: 10 }}>
            <View style={{ paddingHorizontal: isTablet ? 40 : 20, marginBottom: 20, maxWidth: isTablet ? 800 : '100%', alignSelf: 'center', width: '100%' }}>
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: isTablet ? 32 : 28, 
                fontWeight: '800',
                marginBottom: 20,
                textAlign: isTablet ? 'center' : 'left'
              }}>
                {t('search.placeholder')}
              </Text>
              
              <View style={{ 
                flexDirection: 'row', 
                backgroundColor: '#374151', 
                borderRadius: 16, 
                paddingHorizontal: 16,
                paddingVertical: 2,
                marginBottom: 20,
                alignItems: 'center'
              }}>
                <Ionicons name="search-outline" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                <TextInput
                  placeholder={t('search.placeholder')}
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  style={{
                    flex: 1,
                    color: '#FFFFFF',
                    fontSize: 16,
                    paddingVertical: 8
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

              {/* BotÃµes de Filtro Jogos/DLCs */}
              <View style={{ 
                flexDirection: 'row', 
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
                    {t('gameDetails.tabs.games')}
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
                    {t('gameDetails.tabs.dlcs')}
                  </Text>
                </TouchableOpacity>
              </View>


            </View>

            <FlatList
              data={searchQuery.trim().length > 0 ? searchResults : []}
              renderItem={({ item, index }) => {
                // Calcular largura exata: (largura total - padding lateral - gap) / 2
                const screenWidth = width;
                const horizontalPadding = (isTablet ? 40 : 24) * 2;
                const gap = 8;
                const cardWidth = (screenWidth - horizontalPadding - gap) / 2;

                return (
                  <View style={{ 
                    width: cardWidth,
                  }}>
                    {renderGameCard({ item, index, isGridLayout: true })}
                  </View>
                );
              }}
              keyExtractor={(item, index) => `search-${item._id || 'game'}-${index}`}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 8 }}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              initialNumToRender={8}
              windowSize={5}
              maxToRenderPerBatch={5}
              numColumns={2}
              columnWrapperStyle={{ gap: 8 }}
              getItemLayout={(data, index) => {
                // Para layout em grade, calcular altura diferente
                return {
                  length: 300, // Altura estimada de cada item no layout de grade
                  offset: 300 * index,
                  index,
                };
              }}
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
          <View style={{ flex: 1, paddingTop: -10 }}>
            <FavoritesAndLists />
          </View>
        )}

        {activeTab === 'hardware' && (
          // Embed hardware screen content to keep it as a regular tab
          <View style={{ flex: 1, paddingTop: -18 }}>
            {/* The inner component brings its own header and list */}
            <HardwareInner />
          </View>
        )}

        {activeTab === 'profile' && (
          <ScrollView style={{ flex: 1, paddingTop: 60 }}>
            <View style={{ paddingHorizontal: isTablet ? 40 : 20, maxWidth: isTablet ? 600 : '100%', alignSelf: 'center', width: '100%' }}>
              {/* Header do Perfil - REMOVIDO */}

              {/* ConfiguraÃ§Ãµes */}
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
                  {t('settings.title')}
                </Text>

                {[
                  { icon: 'star-outline', title: t('settings.rateApp'), subtitle: t('settings.rateAppDesc'), key: 'rate' },
                  { icon: 'language-outline', title: t('settings.language'), subtitle: t('settings.languageDesc'), key: 'language' },
                  { icon: 'share-social-outline', title: t('settings.share'), subtitle: t('settings.shareDesc'), key: 'share' },
                  { icon: 'bug-outline', title: t('settings.reportBug'), subtitle: t('settings.reportBugDesc'), key: 'bug' },
                  { icon: 'shield-checkmark-outline', title: 'Políticas de privacidade', subtitle: t('settings.privacyDesc'), key: 'privacy' }
                ].map((item, index) => {
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        // Implementar aÃ§Ãµes para cada item
                        if (item.key === 'rate') {
                          // Abrir avaliaÃ§Ã£o na Play Store
                          Linking.openURL('https://play.google.com/store/apps/details?id=com.nexusdevsystem.looton&pcampaignid=web_share');
                        } else if (item.key === 'language') {
                          setShowLanguageModal(true);
                        } else if (item.key === 'share') {
                          // Compartilhar o aplicativo via opÃ§Ãµes do sistema
                          const shareMessage = 'Confira o Looton - aplicativo para encontrar as melhores ofertas de jogos! https://play.google.com/store/apps/details?id=com.nexusdevsystem.looton&pcampaignid=web_share';
                          Share.share({
                            title: 'Confira esse app de ofertas de jogos',
                            message: shareMessage,
                          });
                        } else if (item.key === 'bug') {
                          // Abrir email para reportar bugs
                          Linking.openURL('mailto:nexusdevsystem@gmail.com?subject=Bug Report - Looton App');
                        } else if (item.key === 'privacy') {
                          Linking.openURL('https://www.nexusdevsystem.com/privacy-policy');
                        }
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: isTablet ? 20 : 16,
                        borderBottomWidth: index < 4 ? 1 : 0, // NÃ£o adicionar borda na última opÃ§Ã£o
                        borderBottomColor: '#4B5563'
                      }}
                    >
                      <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: '#3B82F6', // Azul para todos os itens
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 16
                      }}>
                        <Ionicons name={item.icon as any} size={18} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ 
                          color: '#FFFFFF', 
                          fontSize: isTablet ? 16 : 15, 
                          fontWeight: '600',
                          marginBottom: 2
                        }}>
                          {item.title}
                        </Text>
                        <Text style={{ 
                          color: '#9CA3AF', 
                          fontSize: isTablet ? 14 : 13
                        }}>
                          {item.subtitle}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  );
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
                  {t('about.title')}
                </Text>
                <Text style={{ 
                  color: '#9CA3AF', 
                  fontSize: isTablet ? 16 : 14,
                  lineHeight: isTablet ? 24 : 20,
                  textAlign: isTablet ? 'center' : 'left'
                }}>
                  {t('about.version')} 1.8{'\n'}
                  {t('about.description')}{'\n'}
                  {t('about.tagline')}
                </Text>
              </View>

            </View>
          </ScrollView>
        )}
      </Animated.View>

      {renderBottomNav()}

      {/* Modais */}

      {selectedGameId && (
          <GameDetailsModal
            appId={typeof selectedGameId === 'number' ? selectedGameId : 0}
            visible={gameDetailsModalVisible}
            onClose={() => setGameDetailsModalVisible(false)}
            currentPrice={selectedDeal?.priceFinal}
            originalPrice={selectedDeal?.priceBase}
            discount={selectedDeal?.discountPct}
            gameTitle={selectedDeal?.game?.title}
            store={selectedDeal?.store?.name?.toLowerCase().includes('epic') || selectedDeal?.url?.includes('epicgames.com') ? 'epic' : 'steam'}
            gameData={selectedDeal} // Passar os dados completos do jogo
            useLocalDataOnly={selectedDeal?.store?.name?.toLowerCase().includes('epic') || selectedDeal?.url?.includes('epicgames.com')} // Usar dados locais para Epic
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

      {/* Modal de adicionar Ã  lista */}
      {selectedGameForList && (
        <AddToListModal
          visible={showAddToListModal}
          onClose={() => {
            setShowAddToListModal(false)
            setSelectedGameForList(null)
          }}
          gameId={selectedGameForList.id}
          gameTitle={selectedGameForList.title}
          userId={''}
        />
      )}

      {/* Modal de Privacidade removido */}

      {/* Modal de Ajuda */}
      <Modal visible={showHelpModal} animationType="fade" transparent onRequestClose={() => setShowHelpModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ 
            width: '90%', 
            maxWidth: 560, 
            backgroundColor: '#374151', 
            borderRadius: 16, 
            padding: 20,
            margin: 20
          }}>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 16 
            }}>
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: 18, 
                fontWeight: '700' 
              }}>
                Central de Ajuda
              </Text>
              <TouchableOpacity 
                onPress={() => setShowHelpModal(false)} 
                style={{ padding: 8 }}
              >
                <Ionicons name="close" size={24} color="#E5E7EB" />
              </TouchableOpacity>
            </View>
            
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#E5E7EB', fontSize: 15, lineHeight: 22, marginBottom: 10 }}>
                Precisa de ajuda? Temos algumas opÃ§Ãµes para vocÃª:
              </Text>
              
              <TouchableOpacity
                onPress={() => {
                  Linking.openURL('https://www.nexusdevsystem.com')
                  setShowHelpModal(false)
                }}
                style={{ 
                  backgroundColor: '#1F2937', 
                  padding: 15, 
                  borderRadius: 12, 
                  marginBottom: 10 
                }}
              >
                <Text style={{ color: '#3B82F6', fontSize: 15, fontWeight: '600' }}>
                  ?? Visitar nosso site
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  Linking.openURL('mailto:nexusdevsystem@gmail.com')
                  setShowHelpModal(false)
                }}
                style={{ 
                  backgroundColor: '#1F2937', 
                  padding: 15, 
                  borderRadius: 12 
                }}
              >
                <Text style={{ color: '#3B82F6', fontSize: 15, fontWeight: '600' }}>
                  ?? Enviar email
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'flex-end' 
            }}>
              <TouchableOpacity
                onPress={() => setShowHelpModal(false)}
                style={{ 
                  backgroundColor: '#4B5563', 
                  paddingHorizontal: 16, 
                  paddingVertical: 10, 
                  borderRadius: 8 
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                  Fechar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>



  {/* Modal de Prefer�ncias - Steam Genres */}
      <SteamGenresPreferencesModal
        visible={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        currentPreferences={userPreferredSteamGenres}
        onSave={async (selectedGenreIds: string[]) => {
          try {
            console.log('=== SALVANDO PREFER�NCIAS STEAM ===')
            console.log('G�neros selecionados:', selectedGenreIds)
            
            // Atualizar estado local
            setUserPreferredSteamGenres(selectedGenreIds)
            
            // Recarregar deals com novo boost
            await fetchDeals()
            
            setShowPreferencesModal(false)
            showToast('Prefer�ncias salvas! ?')
            
          } catch (error) {
            console.error('Erro ao salvar preferÃªncias:', error)
            showToast('Erro ao salvar preferÃªncias')
          }
        }}
      />
      
      {/* Modal de DoaÃ§Ã£o - Apenas quando o usuÃ¡rio ativa manualmente */}
      

      
      {/* Modal de HistÃ³rico de NotificaÃ§Ãµes */}
      {showNotificationsHistory && <NotificationsHistoryModal />}
      
      {/* Modal de Idioma */}
      <Modal visible={showLanguageModal} animationType="fade" transparent onRequestClose={() => setShowLanguageModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ 
            width: '90%', 
            maxWidth: 500, 
            backgroundColor: '#374151', 
            borderRadius: 16, 
            padding: 20,
            margin: 20
          }}>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 16 
            }}>
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: 18, 
                fontWeight: '700' 
              }}>
                {t('settings.language')}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowLanguageModal(false)} 
                style={{ padding: 8 }}
              >
                <Ionicons name="close" size={24} color="#E5E7EB" />
              </TouchableOpacity>
            </View>
            
            <View style={{ marginBottom: 20 }}>
              {[
                { code: 'pt', name: 'Portugu�s', flag: '????' },
                { code: 'en', name: 'English', flag: '????' },
                { code: 'es', name: 'Espa�ol', flag: '????' }
              ].map((lang, index) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={async () => {
                    await setLanguage(lang.code as 'pt' | 'en' | 'es');
                    setShowLanguageModal(false);
                  }}
                  style={{ 
                    backgroundColor: language === lang.code ? '#3B82F6' : '#1F2937', 
                    padding: 15, 
                    borderRadius: 12, 
                    marginBottom: 10,
                    borderWidth: language === lang.code ? 2 : 0,
                    borderColor: '#60A5FA'
                  }}
                >
                  <Text style={{ 
                    color: language === lang.code ? '#FFFFFF' : '#9CA3AF', 
                    fontSize: 15, 
                    fontWeight: language === lang.code ? '700' : '600' 
                  }}>
                    {lang.flag} {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'flex-end' 
            }} />
          </View>
        </SafeAreaView>
      </Modal>
      
      {/* Modal de Privacidade */}
      <Modal visible={showPrivacyModal} animationType="fade" transparent onRequestClose={() => setShowPrivacyModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ 
            width: '90%', 
            maxWidth: 560, 
            backgroundColor: '#374151', 
            borderRadius: 16, 
            padding: 20,
            margin: 20
          }}>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 16 
            }}>
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: 18, 
                fontWeight: '700' 
              }}>
                Políticas de Privacidade
              </Text>
              <TouchableOpacity
                onPress={() => setShowPrivacyModal(false)}
                style={{ padding: 8 }}
              >
                <Ionicons name="close" size={24} color="#E5E7EB" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
              <Text style={{ color: '#E5E7EB', fontSize: 15, lineHeight: 22 }}>
                Nossa política de privacidade:{'\n\n'}
                - Coletamos apenas dados necessários para funcionamento do app (como sua lista de observação e preferências){'\n\n'}
                - Não compartilhamos seus dados com terceiros{'\n\n'}
                - Você pode solicitar a remoção de seus dados a qualquer momento{'\n\n'}
                - Utilizamos notificações push para informar sobre ofertas relevantes{'\n\n'}
                - Seus dados são armazenados de forma segura em nossos servidores
              </Text>
            </ScrollView>
            
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'flex-end', 
              marginTop: 20 
            }}>
              <TouchableOpacity
                onPress={() => {
                  Linking.openURL('mailto:nexusdevsystem@gmail.com')
                  setShowPrivacyModal(false)
                }}
                style={{ 
                  backgroundColor: '#3B82F6', 
                  paddingHorizontal: 16, 
                  paddingVertical: 10, 
                  borderRadius: 8,
                  marginLeft: 10
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                  Contato
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal da VersÃ£o Pro - TEMPORARIAMENTE DESABILITADO */}
      {/* <ProModal /> */}
      
      </View>
    </CurrencyProvider>
  )
}

export default function Home() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <HomeContent />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}





