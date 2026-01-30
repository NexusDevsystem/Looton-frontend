import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Linking,
  Platform,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WishlistService, WishlistItem } from '../services/WishlistService';
import { AddToListModal } from './AddToListModal';
import { useLanguage } from '../contexts/LanguageContext';
import { getGooglePlaySubscriptionDeepLink, SUBSCRIPTION_INFO } from '../constants/app';
import { API_URL } from '../api/client';


const { width, height } = Dimensions.get('window');

// ðŸ”’ BLINDAGEM CONTRA .length CRASH
const len = (v: any) => (Array.isArray(v) ? v.length : 0);
const arr = <T,>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : []);

interface GameDetailsProps {
  appId?: number | undefined;
  visible: boolean;
  onClose: () => void;
  currentPrice?: number;
  originalPrice?: number;
  discount?: number;
  gameTitle?: string;
  userId?: string;
  store?: 'steam' | 'epic';
  gameData?: any;
  useLocalDataOnly?: boolean;
}

interface GameDetails {
  appId: number;
  name: string;
  type: string;
  required_age: number;
  is_free: boolean;
  detailed_description: string;
  about_the_game: string;
  short_description: string;
  developers: string[];
  publishers: string[];
  platforms: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  metacritic?: {
    score: number;
    url: string;
  };
  categories: Array<{
    id: number;
    description: string;
  }>;
  genres: Array<{
    id: string;
    description: string;
  }>;
  screenshots: Array<{
    id: number;
    path_thumbnail: string;
    path_full: string;
  }>;
  movies?: Array<{
    id: number;
    name: string;
    thumbnail: string;
    webm: {
      '480': string;
      max: string;
    };
    mp4: {
      '480': string;
      max: string;
    };
    highlight: boolean;
  }>;
  recommendations?: {
    total: number;
  };
  achievements?: {
    total: number;
  };
  release_date: {
    coming_soon: boolean;
    date: string;
  };
  support_info: {
    url: string;
    email: string;
  };
  background: string;
  background_raw: string;
  pc_requirements?: {
    minimum: string;
    recommended?: string;
  };
  mac_requirements?: {
    minimum: string;
    recommended?: string;
  };
  linux_requirements?: {
    minimum: string;
    recommended?: string;
  };
  legal_notice?: string;
  price_overview?: {
    currency: string;
    initial: number;
    final: number;
    discount_percent: number;
    initial_formatted: string;
    final_formatted: string;
  };
  header_image: string;
  capsule_image: string;
  capsule_imagev5: string;
}

export const GameDetailsModal: React.FC<GameDetailsProps> = ({
  appId,
  visible,
  onClose,
  currentPrice = 0,
  originalPrice = 0,
  discount = 0,
  gameTitle = '',
  userId,
  store = 'steam',
  gameData,
  useLocalDataOnly = false,
}) => {
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [watchOption, setWatchOption] = useState<'any' | 'specific' | null>(null); // 'any' para qualquer promoção, 'specific' para preço específico
  const [showUpgradeToPremiumModal, setShowUpgradeToPremiumModal] = useState(false);

  const [desiredPrice, setDesiredPrice] = useState('');
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistItem, setWishlistItem] = useState<WishlistItem | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!visible) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tryUseProvidedData = async (gd?: any) => {
      try {
        const data = gd as any;

        // Para jogos da Epic, os dados vêm em data.game ou diretamente em data
        const gameInfo = data.game || data;

        // Extrair keyImages (todas as imagens disponíveis da Epic)
        const keyImages = gameInfo.keyImages || data.keyImages || [];

        // Extrair imagem de capa (preferir OfferImageWide ou DieselStoreFrontWide)
        const offerImage = keyImages.find((img: any) =>
          img.type === 'OfferImageWide' || img.type === 'DieselStoreFrontWide'
        );
        const coverImage = offerImage?.url || gameInfo.coverUrl || gameInfo.image || data.image ||
                          (keyImages[0]?.url) || '';

        // Extrair screenshots (usar keyImages filtradas por tipo de screenshot)
        let screenshots = keyImages.filter((img: any) =>
          img.type === 'Screenshot' ||
          img.type === 'OfferImageWide' ||
          img.type === 'DieselStoreFrontWide' ||
          img.type === 'Thumbnail'
        );

        // Se não houver screenshots específicos, usar todas as keyImages
        if (screenshots.length === 0 && keyImages.length > 0) {
          screenshots = keyImages;
        }

        // Se ainda não houver screenshots mas houver imagem de capa, adicionar a capa
        if (screenshots.length === 0 && coverImage) {
          screenshots = [{ url: coverImage, type: 'Cover' }];
        }

        // Filtrar apenas imagens válidas
        screenshots = screenshots.filter((s: any) => s?.url || typeof s === 'string');

        // Extrair gêneros
        const genres = gameInfo.genres || data.genres || gameInfo.tags || data.tags || [];

        // Extrair descrição
        const description = gameInfo.description || data.description || gameInfo.about || data.about || '';

        // Extrair desenvolvedor e publisher
        const developer = gameInfo.developer || data.developer || 'Epic Games';
        const publisher = gameInfo.publisher || data.publisher || 'Epic Games';

        const mapped: GameDetails = {
          appId: data.appId || data.id || 0,
          name: gameInfo.title || gameInfo.name || data.title || data.name || '',
          type: 'game',
          required_age: 0,
          is_free: data.isFree || (data.priceFinal === 0) || (data.priceFinalCents === 0) || false,
          detailed_description: description || 'Descrição não disponível',
          about_the_game: description || 'Informações não disponíveis',
          short_description: description || 'Descrição não disponível',
          developers: [developer],
          publishers: [publisher],
          platforms: {
            windows: true,
            mac: false,
            linux: false,
          },
          categories: genres.map((g: any, idx: number) => ({
            id: idx,
            description: typeof g === 'string' ? g : (g.name || g.path || g)
          })),
          genres: genres.map((g: any, idx: number) => ({
            id: String(idx),
            description: typeof g === 'string' ? g : (g.name || g.path || g)
          })),
          screenshots: screenshots.map((s: any, idx: number) => {
            // Suportar diferentes formatos: string, objeto com url, objeto com path_full
            const fullPath = typeof s === 'string' ? s : (s.url || s.path_full || '');
            const thumbPath = typeof s === 'string' ? s : (s.thumbnail || s.url || s.path_full || '');

            return {
              id: idx,
              path_full: fullPath,
              path_thumbnail: thumbPath
            };
          }),
          movies: [],
          recommendations: { total: 0 },
          achievements: { total: 0 },
          release_date: {
            coming_soon: false,
            date: gameInfo.releaseDate || gameInfo.effectiveDate || data.releaseDate || data.effectiveDate || ''
          },
          support_info: { url: '', email: '' },
          background: coverImage,
          background_raw: coverImage,
          pc_requirements: {
            minimum: 'Requisitos não disponíveis para jogos da Epic Games Store'
          },
          mac_requirements: { minimum: 'Requisitos não disponíveis' },
          linux_requirements: { minimum: 'Requisitos não disponíveis' },
          header_image: coverImage,
          capsule_image: coverImage,
          capsule_imagev5: coverImage
        } as GameDetails;

        setGameDetails(mapped);
        return true;
      } catch (e) {
        console.error('tryUseProvidedData failed', e);
        return false;
      }
    };

    // Se useLocalDataOnly for true (jogos da Epic), usar dados locais
    if (useLocalDataOnly && gameData) {
      tryUseProvidedData(gameData);
      setLoading(false);
      if (appId) checkWishlistStatus();
    }
    // Default behavior: fetch details by appId (Steam flow)
    else if (appId) {
      fetchGameDetails();
      checkWishlistStatus();
    }
  }, [visible, appId, gameData, store, useLocalDataOnly]);

  const fetchGameDetails = async () => {
    try {
      setLoading(true);
      console.log(`Buscando detalhes para appId: ${appId}`, 'store:', store);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos timeout
      
      // Determinar endpoint baseado na loja
      let endpoint = '';
      endpoint = `${API_URL}/steam/details/${appId}`;
      
      const response = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`Jogo com appId ${appId} não encontrado na Steam`);
          // Define dados mínimos para jogos não encontrados
          setGameDetails({
            appId,
            name: gameTitle || 'Jogo não encontrado',
            type: 'game',
            required_age: 0,
            is_free: false,
            detailed_description: 'Detalhes não disponíveis para este jogo.',
            about_the_game: 'Informações não disponíveis.',
            short_description: 'Jogo não encontrado na Steam.',
            developers: ['Desconhecido'],
            publishers: ['Desconhecido'],
            platforms: { windows: false, mac: false, linux: false },
            categories: [],
            genres: [],
            screenshots: [],
            movies: [],
            recommendations: { total: 0 },
            release_date: { coming_soon: false, date: 'Data não disponível' },
            support_info: { url: '', email: '' },
            background: '',
            background_raw: '',
            pc_requirements: { minimum: 'Requisitos não disponíveis' },
            mac_requirements: { minimum: 'Requisitos não disponíveis' },
            linux_requirements: { minimum: 'Requisitos não disponíveis' },
            header_image: '',
            capsule_image: '',
            capsule_imagev5: ''
          });
          return;
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Detalhes carregados para: ${data.name || data.title}`);
      
      // Definir os detalhes recebidos da API
      setGameDetails({
        ...data,
        appId: appId || data.appId,
        name: data.name || data.title || gameTitle,
        header_image: data.header_image || data.coverUrl || '',
        capsule_image: data.capsule_image || data.coverUrl || '',
        capsule_imagev5: data.capsule_imagev5 || data.coverUrl || ''
      });
      

    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        Alert.alert('Timeout', 'A busca por detalhes demorou muito para responder');
      } else {
  console.log('Definindo dados básicos devido ao erro');
  // Define dados mínimos em caso de erro
        setGameDetails({
          appId,
          name: gameTitle || 'Erro ao carregar',
          type: 'game',
          required_age: 0,
          is_free: false,
          detailed_description: 'Não foi possível carregar os detalhes deste jogo.',
          about_the_game: 'Informações indisponíveis no momento.',
          short_description: 'Erro ao carregar informações.',
          developers: ['Desconhecido'],
          publishers: ['Desconhecido'],
          platforms: { windows: false, mac: false, linux: false },
          categories: [],
          genres: [],
          screenshots: [],
          movies: [],
          recommendations: { total: 0 },
          release_date: { coming_soon: false, date: 'Data não disponível' },
          support_info: { url: '', email: '' },
          background: '',
          background_raw: '',
          pc_requirements: { minimum: 'Requisitos não disponíveis' },
          mac_requirements: { minimum: 'Requisitos não disponíveis' },
          linux_requirements: { minimum: 'Requisitos não disponíveis' },
          header_image: '',
          capsule_image: '',
          capsule_imagev5: ''
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const checkWishlistStatus = async () => {
    const inWishlist = await WishlistService.isInWishlist(appId);
    setIsInWishlist(inWishlist);
    
    if (inWishlist) {
      const item = await WishlistService.getWishlistItem(appId);
      setWishlistItem(item);
      setDesiredPrice(item?.desiredPrice.toString() || '');
    }
  };

  const handleAddToWishlist = async () => {
    const price = parseFloat(desiredPrice.replace(',', '.'));
    
    if (isNaN(price) || price <= 0) {
      Alert.alert('Erro', 'Por favor, insira um preço válido');
      return;
    }

    try {
      const wishlistItem: Omit<WishlistItem, 'addedAt'> = {
        appId,
        title: gameDetails?.name || gameTitle,
        currentPrice,
        desiredPrice: price,
        coverUrl: gameDetails?.header_image || '',
        notified: false,
        store: store || 'steam',
        url: store === 'steam' && appId ? `https://store.steampowered.com/app/${appId}` : (gameData?.storeUrl || gameDetails?.support_info?.url || '')
      };

      await WishlistService.addToWishlist(wishlistItem);
      setIsInWishlist(true);
      setShowWishlistModal(false);
  setWatchOption(null); // Resetar a opção selecionada
  Alert.alert('Sucesso', `${gameDetails?.name || gameTitle} foi adicionado à sua lista de vigilância!`);
    } catch (error: any) {
      // TEMPORARIAMENTE DESABILITADO - Sem limite de jogos vigiados
      // if (error.message === 'LIMIT_REACHED') {
      //   setShowWishlistModal(false);
      //   setShowUpgradeToPremiumModal(true);
      // } else {
        Alert.alert('Erro', 'Não foi possível adicionar à lista de vigilância');
      // }
    }
  };

  const handleAddToWishlistAnyPromotion = async () => {
    try {
      await WishlistService.addToWishlist({
        appId,
        title: gameDetails?.name || gameTitle,
        currentPrice,
        desiredPrice: 0, // 0 indica que deve ser notificado sobre qualquer promoção
        coverUrl: gameDetails?.header_image || '',
        notified: false,
        store: store || 'steam',
        url: store === 'steam' && appId ? `https://store.steampowered.com/app/${appId}` : (gameData?.storeUrl || gameDetails?.support_info?.url || '')
      });
      setIsInWishlist(true);
      setShowWishlistModal(false);
      setWatchOption(null); // Resetar a opção selecionada
      Alert.alert('Sucesso', `Agora você está vigiando ${gameDetails?.name || gameTitle} para qualquer promoção!`);
    } catch (error: any) {
      // TEMPORARIAMENTE DESABILITADO - Sem limite de jogos vigiados
      // if (error.message === 'LIMIT_REACHED') {
      //   setShowWishlistModal(false);
      //   setShowUpgradeToPremiumModal(true);
      // } else {
        Alert.alert('Erro', 'Não foi possível adicionar à lista de vigilância');
      // }
    }
  };

  const handleRemoveFromWishlist = async () => {
    Alert.alert(
      'Remover da Lista',
      `Deseja remover "${gameDetails?.name || gameTitle}" da sua lista de desejos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await WishlistService.removeFromWishlist(appId);
            setIsInWishlist(false);
            setWishlistItem(null);
          },
        },
      ]
    );
  };

  // Use currency context for formatting
  let formatPrice: (p?: number | null) => string = (p) => 'Grátis'
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useCurrency } = require('../contexts/CurrencyContext') as any
    const ctx = useCurrency()
    formatPrice = (p?: number | null) => ctx.formatPrice(p ?? 0)
  } catch (e) {
    formatPrice = (p?: number | null) => {
      // Verificar se é acesso antecipado
      const isEarlyAccess = gameDetails && (
        (gameDetails.genres && Array.isArray(gameDetails.genres) && 
         gameDetails.genres.some((genre: any) => 
           typeof genre === 'object' 
             ? (genre.description?.toLowerCase().includes('early access') || 
                genre.description?.toLowerCase().includes('acesso antecipado'))
             : (genre.toLowerCase().includes('early access') || 
                genre.toLowerCase().includes('acesso antecipado')))) ||
        (gameDetails.categories && Array.isArray(gameDetails.categories) && 
         gameDetails.categories.some((cat: any) => 
           cat.description?.toLowerCase().includes('early access') || 
           cat.description?.toLowerCase().includes('acesso antecipado')))
      );
      
      if (isEarlyAccess) return t('price.earlyAccess');
      if (!p || isNaN(p) || p === 0) return t('price.free')
      try {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p)
      } catch (e2) {
        return `${p.toFixed(2)} BRL`
      }
    }
  }

  const openStorePage = () => {
    let url = '';

    try {
      // Prefer gameData.url or gameData.storeUrl if available
      if (gameData?.url) {
        url = gameData.url;
      } else if (gameData?.storeUrl) {
        url = gameData.storeUrl;
      } else if ((gameDetails as any)?.storeUrl) {
        url = (gameDetails as any).storeUrl;
      } else if ((gameDetails as any)?.purchaseUrl) {
        url = (gameDetails as any).purchaseUrl;
      }
      // Construir URL específica da loja
      else if (store === 'epic') {
        // Para Epic Games, montar URL usando slugs disponíveis
        const epicData: any = gameData || {};

        console.log('🔍 Tentando construir URL da Epic Games:', {
          productSlug: epicData.productSlug,
          urlSlug: epicData.urlSlug,
          catalogNs: epicData.catalogNs,
          offerMappings: epicData.offerMappings,
          gameTitle: gameTitle
        });

        // Tentar múltiplas estratégias de construção de URL
        let slug = '';

        // 1. Tentar productSlug
        if (epicData.productSlug) {
          slug = epicData.productSlug;
          console.log('✅ Usando productSlug:', slug);
        }
        // 2. Tentar urlSlug
        else if (epicData.urlSlug) {
          slug = epicData.urlSlug;
          console.log('✅ Usando urlSlug:', slug);
        }
        // 3. Tentar catalogNs.mappings
        else if (epicData.catalogNs?.mappings?.[0]?.pageSlug) {
          slug = epicData.catalogNs.mappings[0].pageSlug;
          console.log('✅ Usando catalogNs.mappings[0].pageSlug:', slug);
        }
        // 4. Tentar offerMappings
        else if (epicData.offerMappings?.[0]?.pageSlug) {
          slug = epicData.offerMappings[0].pageSlug;
          console.log('✅ Usando offerMappings[0].pageSlug:', slug);
        }
        // 5. Tentar construir slug do título
        else if (gameTitle) {
          // Converter título para slug (kebab-case)
          slug = gameTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
          console.log('⚠️ Usando slug gerado do título:', slug);
        }

        if (slug) {
          url = `https://store.epicgames.com/pt-BR/p/${slug}`;
          console.log('🔗 URL construída:', url);
        } else {
          // Fallback final: busca pelo título
          const title = gameDetails?.name || gameTitle || '';
          const encodedTitle = encodeURIComponent(title);
          url = `https://store.epicgames.com/pt-BR/browse?q=${encodedTitle}`;
          console.log('🔗 Usando fallback de busca:', url);
        }
      } else if (store === 'steam' && appId) {
        url = `https://store.steampowered.com/app/${appId}`;
      }
    } catch (e) {
      console.error('❌ Erro ao construir URL:', e);
      // Fallback: tentar construir URL baseado na loja
      if (store === 'steam' && appId) {
        url = `https://store.steampowered.com/app/${appId}`;
      } else if (store === 'epic') {
        const title = gameDetails?.name || gameTitle || '';
        const encodedTitle = encodeURIComponent(title);
        url = `https://store.epicgames.com/pt-BR/browse?q=${encodedTitle}`;
      }
    }

    if (url) {
      Linking.openURL(url);
    } else {
      console.warn('openStorePage: nenhum URL disponível para este jogo');
    }
  };

    const fixMojibake = (s: string) => {
      return String(s)
        // common bullets
        .replace(/â€¢/g, '•')
        // accented vowels
        .replace(/Ã¡/g, 'á')
        .replace(/Ã¢/g, 'â')
        .replace(/Ã£/g, 'ã')
        .replace(/Ã©/g, 'é')
        .replace(/Ãª/g, 'ê')
        .replace(/Ã­/g, 'í')
        .replace(/Ã³/g, 'ó')
        .replace(/Ã´/g, 'ô')
        .replace(/Ãµ/g, 'õ')
        .replace(/Ãº/g, 'ú')
        .replace(/Ã€/g, 'À')
        .replace(/Ã /g, 'Á')
        .replace(/Ã©/g, 'é')
        .replace(/Ã‰/g, 'É')
        .replace(/Ãª/g, 'ê')
        // cedilla
        .replace(/Ã§/g, 'ç')
        // other control garbage
        .replace(/\uFFFD/g, '')
        .replace(/\u0092/g, "'")
        // common HTML encoded sequences sometimes double-encoded
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .trim()
    }

  const renderSystemRequirements = (requirements?: { minimum: string; recommended?: string }) => {
    if (!requirements) return null;

    const toList = (raw?: string): string[] => {
  if (!raw || typeof raw !== 'string') return []
      let s = raw
        // keep line breaks before stripping tags
        .replace(/<br\s*\/?\s*>/gi, '\n')
        .replace(/<\/?li\s*>/gi, '\n')
        .replace(/<\/?p\s*>/gi, '\n')
        .replace(/&quot;/g, '"')
      // strip remaining tags
   s = s.replace(/<[^>]*>/g, '')
      // insert breaks before common labels (pt/en)
   s = s.replace(/\s*(M[ií]nimos?:)/gi, '\n$1 ')
     .replace(/\s*(Recomendad[oa]s?:)/gi, '\n$1 ')
     .replace(/\s*(Sistema Operativo:|Sistema operacional:|OS:|Processor:|Processador:|CPU:|Mem[oó]ria:|Memory:|RAM:|Gr[aá]ficos?:|Placa (de )?v[ií]deo:|Graphics?:|GPU:|DirectX:|Rede:|Network:|Armazenamento:|Espa[cç]o (no )?disco:|Storage:|Som:|Sound:|Notas adicionais:|Additional Notes:|Vers[aã]o:|Version:)/gi, '\n$1 ')
      // normalize whitespace
      s = s.replace(/\r?\n+/g, '\n').replace(/\s{2,}/g, ' ').trim()
      // split into lines
      const lines = s.split('\n')
        .map(l => fixMojibake(l.trim()))
        .map(l => l.replace(/^(M[ií]nimos?:|Mínimos?:)\s*/i, ''))
        .map(l => l.replace(/^(Recomendad[oa]s?:|Recomendados?:)\s*/i, ''))
        .filter(l => l && l.length > 2)

      return lines
    }

    const minItems = toList(requirements.minimum)
    const recItems = toList(requirements.recommended)

    const BulletList = ({ items }: { items: string[] }) => (
      <View>
        {items.map((line, idx) => (
          <View style={{ flexDirection: 'row', marginBottom: 6 }} key={`bullet-${idx}`}>
            <Text style={{ color: '#9CA3AF', marginRight: 8 }}>•</Text>
            <Text style={{ color: '#D1D5DB', fontSize: 14, lineHeight: 20, flex: 1 }}>{line}</Text>
          </View>
        ))}
      </View>
    )

    // Função para formatar os requisitos com base no formato desejado
    const formatRequirements = (items: string[]) => {
      const formattedItems: string[] = [];
      
      // Adiciona o prefixo comum
      formattedItems.push("Requer um processador e sistema operacional de 64 bits");
      
      items.forEach(item => {
        // Verifica se o item contém alguma informação de sistema operacional
        if (item.toLowerCase().includes("windows")) {
          const osMatch = item.match(/(Windows\s*(?:7|8|8\.1|10|11).*)/i);
          if (osMatch) {
            formattedItems.push(`SO *: ${osMatch[1]}`);
          } else {
            formattedItems.push(`SO: ${item}`);
          }
        } 
        // Verifica se o item contém informação de processador
        else if (item.toLowerCase().includes("processor") || item.toLowerCase().includes("cpu") || 
                 item.toLowerCase().includes("core") || item.toLowerCase().includes("intel") || 
                 item.toLowerCase().includes("amd")) {
          const procMatch = item.match(/(Intel.*|AMD.*|Core.*|Ryzen.*|Xeon.*)/i);
          if (procMatch) {
            formattedItems.push(`Processador: ${procMatch[1]}`);
          } else {
            formattedItems.push(`Processador: ${item}`);
          }
        } 
        // Verifica se o item contém informação de memória
        else if (item.toLowerCase().includes("memory") || item.toLowerCase().includes("ram")) {
          const ramMatch = item.match(/(\d+\s*GB.*RAM|\d+\s*MB.*RAM)/i);
          if (ramMatch) {
            formattedItems.push(`Memória: ${ramMatch[1]}`);
          } else {
            formattedItems.push(`Memória: ${item}`);
          }
        } 
        // Verifica se o item contém informação de placa de vídeo
        else if (item.toLowerCase().includes("graphics") || item.toLowerCase().includes("gpu") || 
                 item.toLowerCase().includes("video") || item.toLowerCase().includes("placa") || 
                 item.toLowerCase().includes("nvidia") || item.toLowerCase().includes("gtx") || 
                 item.toLowerCase().includes("rtx") || item.toLowerCase().includes("radeon") || 
                 item.toLowerCase().includes("amd")) {
          const gpuMatch = item.match(/(Nvidia.*|GTX.*|RTX.*|AMD.*|Radeon.*|Placa.*|Gráficos.*)/i);
          if (gpuMatch) {
            formattedItems.push(`Placa de vídeo: ${gpuMatch[1]}`);
          } else {
            formattedItems.push(`Placa de vídeo: ${item}`);
          }
        } 
        // Verifica se o item contém informação de DirectX
        else if (item.toLowerCase().includes("directx")) {
          const dxMatch = item.match(/(DirectX.*|Versão.*)/i);
          if (dxMatch) {
            formattedItems.push(`DirectX: ${dxMatch[1]}`);
          } else {
            formattedItems.push(`DirectX: ${item}`);
          }
        } 
        // Verifica se o item contém informação de armazenamento
        else if (item.toLowerCase().includes("storage") || item.toLowerCase().includes("armazenamento") || 
                 item.toLowerCase().includes("espaço") || item.toLowerCase().includes("disco")) {
          const storageMatch = item.match(/(\d+\s*GB.*|\d+\s*MB.*|\d+\s*TB.*|espaço.*disco.*)/i);
          if (storageMatch) {
            formattedItems.push(`Armazenamento: ${storageMatch[1]}`);
          } else {
            formattedItems.push(`Armazenamento: ${item}`);
          }
        } 
        // Verifica se o item contém informação de placa de som
        else if (item.toLowerCase().includes("sound") || item.toLowerCase().includes("áudio") || 
                 item.toLowerCase().includes("placa.*som")) {
          const soundMatch = item.match(/(DirectX.*sound|áudio.*|placa.*som.*)/i);
          if (soundMatch) {
            formattedItems.push(`Placa de som: ${soundMatch[1]}`);
          } else {
            formattedItems.push(`Placa de som: ${item}`);
          }
        } 
        // Adiciona o item original se não se encaixar nas categorias acima, mas só se não estiver vazio
        else if (item.trim() !== "" && !formattedItems.includes(item)) {
          formattedItems.push(item);
        }
      });

      return formattedItems;
    };

    const formattedMinItems = formatRequirements(minItems);
    const formattedRecItems = formatRequirements(recItems);

    return (
      <View style={{ marginVertical: 16 }}>
        <Text style={{ color: '#E5E7EB', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
          {t('gameDetails.systemRequirements')}
        </Text>
        
        <View style={{ backgroundColor: '#374151', borderRadius: 12, padding: 16 }}>
          {formattedMinItems.length > 0 && (
            <View style={{ marginBottom: formattedRecItems.length > 0 ? 12 : 0 }}>
              <Text style={{ color: '#F9FAFB', fontSize: 15, fontWeight: '700', marginBottom: 6 }}>
                {t('gameDetails.minimumRequirements')}
              </Text>
              <BulletList items={formattedMinItems} />
            </View>
          )}

          {formattedRecItems.length > 0 && (
            <View>
              <Text style={{ color: '#F9FAFB', fontSize: 15, fontWeight: '700', marginBottom: 6 }}>
                {t('gameDetails.recommendedRequirements')}
              </Text>
              <BulletList items={formattedRecItems} />
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: '#111827' }}>
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'center',
          paddingHorizontal: 20,
          paddingTop: 50,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#374151'
        }}>
          <TouchableOpacity 
            onPress={onClose} 
            style={{ position: 'absolute', left: 20, top: 50, padding: 8 }}
          >
            <Ionicons name="close" size={28} color="#E5E7EB" />
          </TouchableOpacity>
          
          <Text style={{ color: '#F9FAFB', fontSize: 18, fontWeight: '600' }}>
            {t('gameDetails.title')}
          </Text>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={{ color: '#9CA3AF', marginTop: 16 }}>{t('home.loading')}</Text>
          </View>
        ) : gameDetails ? (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* Hero Image */}
            <View style={{ position: 'relative' }}>
              <Image
                source={{ uri: gameDetails.header_image }}
                style={{ width: '100%', height: 200 }}
                resizeMode="cover"
                cachePolicy="disk"
                transition={200}
              />
              <LinearGradient
                colors={['transparent', 'rgba(17, 24, 39, 0.8)', '#111827']}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 100,
                }}
              />
            </View>

            <View style={{ padding: 20 }}>
              {/* Title and Price */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: '#F9FAFB', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
                  {gameDetails.name}
                </Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {discount > 0 && (
                      <View style={{
                        backgroundColor: '#3B82F6',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        marginRight: 8,
                      }}>
                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>-{discount}%</Text>
                      </View>
                    )}
                    <View>
            <Text style={{ color: '#10B981', backgroundColor: 'rgba(16,185,129,0.08)', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 4, fontSize: 18, fontWeight: '900', lineHeight: 18, textShadowColor: 'rgba(16,185,129,0.06)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 1, alignSelf: 'flex-start' }}>
              {formatPrice(currentPrice)}
            </Text>
                        {discount > 0 && ( 
                        <Text style={{ 
                          color: '#9CA3AF', 
                          fontSize: 14, 
                          textDecorationLine: 'line-through',
                        }}>
                            {formatPrice(originalPrice)}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Botão Vigiar - Apenas para jogos que não são grátis da Epic */}
                  {store !== 'epic' && (
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <TouchableOpacity
                        onPress={() => {
                          if (userId) {
                            // authenticated flow: open server lists modal
                            setShowAddToListModal(true)
                          } else {
                            // anonymous: local wishlist behavior
                            if (isInWishlist) {
                              handleRemoveFromWishlist()
                            } else {
                              setShowWishlistModal(true)
                            }
                          }
                        }}

                        style={{
                          backgroundColor: isInWishlist ? '#EF4444' : '#3B82F6',
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 20,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons
                          name={isInWishlist ? "eye" : "eye-outline"}
                          size={16}
                          color="white"
                          style={{ marginRight: 6 }}
                        />
                        <Text style={{ color: 'white', fontWeight: '600' }}>
                          {isInWishlist ? t('tab.watching') : t('gameDetails.watch')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              {/* Botão Acesse a loja oficial */}
              <TouchableOpacity
                onPress={openStorePage}
                style={{
                  backgroundColor: '#3B82F6',
                  paddingVertical: 15,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginBottom: 20
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
                  {store === 'epic' ? 'Abrir na Epic Games Store' : t('gameDetails.accessStore')}
                </Text>
              </TouchableOpacity>

              {/* Quick Info */}
              <View style={{ 
                flexDirection: 'row', 
                flexWrap: 'wrap', 
                marginBottom: 20,
                backgroundColor: '#1F2937',
                borderRadius: 12,
                padding: 16,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20, marginBottom: 8 }}>
                  <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                  <Text style={{ color: '#E5E7EB', marginLeft: 6 }}>
                    {gameDetails.release_date.date}
                  </Text>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20, marginBottom: 8 }}>
                  <Ionicons name="business-outline" size={16} color="#9CA3AF" />
                  <Text style={{ color: '#E5E7EB', marginLeft: 6 }} numberOfLines={1}>
                    {gameDetails.developers[0] || 'N/A'}
                  </Text>
                </View>

                {gameDetails.metacritic && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="star" size={16} color="#FCD34D" />
                    <Text style={{ color: '#E5E7EB', marginLeft: 6 }}>
                      {gameDetails.metacritic.score}/100
                    </Text>
                  </View>
                )}
              </View>

              {/* Platforms */}
              <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                <Text style={{ color: '#9CA3AF', marginRight: 12 }}>Plataformas:</Text>
                {gameDetails.platforms.windows && (
                  <Ionicons name="desktop-outline" size={20} color="#E5E7EB" style={{ marginRight: 8 }} />
                )}
                {gameDetails.platforms.mac && (
                  <Ionicons name="logo-apple" size={20} color="#E5E7EB" style={{ marginRight: 8 }} />
                )}
                {gameDetails.platforms.linux && (
                  <Text style={{ color: '#E5E7EB', fontSize: 16, marginRight: 8 }}>ðŸ§</Text>
                )}
              </View>

              {/* Description */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: '#E5E7EB', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
                  Sobre o Jogo
                </Text>
                <Text style={{ color: '#D1D5DB', fontSize: 14, lineHeight: 22 }}>
                  {gameDetails.short_description}
                </Text>
              </View>

              {/* Screenshots */}
              {len(gameDetails?.screenshots) > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: '#E5E7EB', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
                    Capturas de Tela
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={{ paddingBottom: 8 }}>
                    {arr(gameDetails?.screenshots).slice(0, 5).map((screenshot, index) => 
                      <TouchableOpacity 
                        key={`screenshot-${index}`}
                        onPress={() => {
                          setSelectedScreenshot(screenshot.path_full || screenshot.path_thumbnail);
                          setShowScreenshotModal(true);
                        }}
                      >
                        {React.createElement(Image, {
                          source: { uri: screenshot.path_thumbnail },
                          style: {
                            width: 280,
                            height: 160,
                            borderRadius: 12,
                            marginRight: 12,
                          },
                          contentFit: "cover" as const,
                          cachePolicy: "disk" as const,
                          transition: 200,
                        })}
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
              )}

              {/* System Requirements - Apenas para jogos que não são da Epic */}
              {store !== 'epic' && renderSystemRequirements(gameDetails.pc_requirements)}

              {/* Genres */}
              {len(gameDetails?.genres) > 0 && (
                <View style={{ marginVertical: 16 }}>
                  <Text style={{ color: '#E5E7EB', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
                    {t('gameDetails.genres')}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {arr(gameDetails?.genres).map((genre, index) => 
                      <View
                        key={`genre-${index}`}
                        style={{
                          backgroundColor: '#374151',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 16,
                          marginRight: 8,
                          marginBottom: 8,
                        }}
                      >
                        <Text style={{ color: '#E5E7EB', fontSize: 12 }}>{fixMojibake(genre.description)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#9CA3AF' }}>Erro ao carregar detalhes</Text>
          </View>
        )}

        {/* Wishlist Modal */}
        <Modal
          visible={showWishlistModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowWishlistModal(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}>
            <View style={{
              backgroundColor: '#1F2937',
              borderRadius: 16,
              padding: 0,
              width: '100%',
              maxWidth: 400,
              overflow: 'hidden'
            }}>
              {/* Cabeçalho do modal */}
              <View style={{
                backgroundColor: '#111827',
                paddingHorizontal: 24,
                paddingVertical: 20,
                borderBottomWidth: 1,
                borderBottomColor: '#374151'
              }}>
                <Text style={{
                  color: '#F9FAFB',
                  fontSize: 20,
                  fontWeight: 'bold',
                  marginBottom: 4,
                  textAlign: 'center',
                }}>
                  {t('watchPrice.title')}
                </Text>
                <Text style={{ color: '#D1D5DB', textAlign: 'center', fontSize: 14 }}>
                  {gameDetails?.name || gameTitle}
                </Text>
              </View>
              
              {/* Conteúdo principal */}
              <View style={{ padding: 24 }}>
                <View style={{
                  backgroundColor: '#374151',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}>
                  <Text style={{ color: '#9CA3AF', marginBottom: 8, fontSize: 14 }}>{t('watchPrice.currentPrice')}</Text>
                  <Text style={{ color: '#F9FAFB', fontSize: 20, fontWeight: 'bold' }}>
                    {formatPrice(currentPrice)}
                  </Text>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: '#F9FAFB', fontSize: 16, fontWeight: '600', marginBottom: 16, textAlign: 'center' }}>
                    {t('watchPrice.whatDoYouWant')}
                  </Text>
                  
                  {/* Opção: Notificar sobre qualquer promoção */}
                  <TouchableOpacity
                    onPress={() => {
                      // Define a opção para qualquer promoção
                      setWatchOption('any');
                      setDesiredPrice('');
                    }}
                    style={{
                      backgroundColor: watchOption === 'any' ? '#2D3748' : '#374151',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: watchOption === 'any' ? 2 : 1,
                      borderColor: watchOption === 'any' ? '#3B82F6' : '#4B5563',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        backgroundColor: watchOption === 'any' ? '#3B82F6' : '#4B5563',
                        borderRadius: 8,
                        padding: 8,
                        marginRight: 12
                      }}>
                        <Ionicons name="megaphone" size={20} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#F9FAFB', fontSize: 16, fontWeight: '600' }}>
                          {t('watchPrice.notifyAnyPromotion')}
                        </Text>
                        <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 4 }}>
                          {t('watchPrice.notifyAnyPromotionDesc')}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Opção: Definir preço desejado */}
                  <TouchableOpacity
                    onPress={() => {
                      // Define a opção para preço específico
                      setWatchOption('specific');
                    }}
                    style={{
                      backgroundColor: watchOption === 'specific' ? '#2D3748' : '#374151',
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: watchOption === 'specific' ? 2 : 1,
                      borderColor: watchOption === 'specific' ? '#3B82F6' : '#4B5563',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        backgroundColor: watchOption === 'specific' ? '#3B82F6' : '#4B5563',
                        borderRadius: 8,
                        padding: 8,
                        marginRight: 12
                      }}>
                        <Ionicons name="pricetag" size={20} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#F9FAFB', fontSize: 16, fontWeight: '600' }}>
                          {t('watchPrice.setDesiredPrice')}
                        </Text>
                        <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 4 }}>
                          {t('watchPrice.setDesiredPriceDesc')}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Campo de entrada de preço - mostrado apenas se a opção específica estiver selecionada */}
                  {watchOption === 'specific' && (
                    <View style={{ marginTop: 16 }}>
                      <Text style={{ color: '#D1D5DB', marginBottom: 8, fontSize: 14 }}>{t('watchPrice.enterDesiredPrice')}</Text>
                      <TextInput
                        style={{
                          backgroundColor: '#374151',
                          borderRadius: 12,
                          padding: 16,
                          color: '#F9FAFB',
                          fontSize: 16,
                          borderWidth: 1,
                          borderColor: '#4B5563',
                        }}
                        placeholder={t('watchPrice.pricePlaceholder')}
                        placeholderTextColor="#9CA3AF"
                        value={desiredPrice}
                        onChangeText={setDesiredPrice}
                        keyboardType="numeric"
                      />
                    </View>
                  )}
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => {
                  setShowWishlistModal(false);
                  setWatchOption(null); // Resetar a opção selecionada
                      setDesiredPrice(''); // Limpar o campo de preço
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: '#6B7280',
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>{t('watchPrice.cancel')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      if (watchOption === 'any') {
                        handleAddToWishlistAnyPromotion();
                      } else if (watchOption === 'specific' && desiredPrice) {
                        handleAddToWishlist();
                      } else if (!watchOption) {
                        // Se nenhuma opção foi selecionada, usar a opção padrão de qualquer promoção
                        handleAddToWishlistAnyPromotion();
                      }
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: '#3B82F6',
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>{t('watchPrice.watch')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Server lists modal for authenticated users */}
        {userId && (
          <AddToListModal
            visible={showAddToListModal}
            onClose={() => setShowAddToListModal(false)}
            gameId={appId.toString()}
            gameTitle={gameDetails?.name || gameTitle || ''}
            userId={userId}
          />
        )}

  {/* Modal para visualização ampliada das capturas de tela */}
        <Modal
          visible={showScreenshotModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowScreenshotModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)' }}>
            {/* Botão de fechar */}
            <TouchableOpacity 
              style={{ position: 'absolute', top: 40, right: 20, zIndex: 10 }}
              onPress={() => setShowScreenshotModal(false)}
            >
              <Ionicons name="close" size={32} color="#FFFFFF" />
            </TouchableOpacity>
            
            {/* Botões de navegação */}
            <View style={{ 
              position: 'absolute', 
              top: '50%', 
              left: 20, 
              zIndex: 10,
              transform: [{ translateY: -25 }] 
            }}>
              <TouchableOpacity 
                onPress={() => {
                  if (gameDetails?.screenshots && selectedScreenshot) {
                    const currentIndex = gameDetails.screenshots.findIndex(s => 
                      s.path_full === selectedScreenshot || s.path_thumbnail === selectedScreenshot
                    );
                    const prevIndex = (currentIndex - 1 + gameDetails.screenshots.length) % gameDetails.screenshots.length;
                    const prevScreenshot = gameDetails.screenshots[prevIndex];
                    setSelectedScreenshot(prevScreenshot.path_full || prevScreenshot.path_thumbnail);
                  }
                }}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 25, padding: 10 }}
              >
                <Ionicons name="chevron-back" size={32} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View style={{ 
              position: 'absolute', 
              top: '50%', 
              right: 20, 
              zIndex: 10,
              transform: [{ translateY: -25 }] 
            }}>
              <TouchableOpacity 
                onPress={() => {
                  if (gameDetails?.screenshots && selectedScreenshot) {
                    const currentIndex = gameDetails.screenshots.findIndex(s => 
                      s.path_full === selectedScreenshot || s.path_thumbnail === selectedScreenshot
                    );
                    const nextIndex = (currentIndex + 1) % gameDetails.screenshots.length;
                    const nextScreenshot = gameDetails.screenshots[nextIndex];
                    setSelectedScreenshot(nextScreenshot.path_full || nextScreenshot.path_thumbnail);
                  }
                }}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 25, padding: 10 }}
              >
                <Ionicons name="chevron-forward" size={32} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {selectedScreenshot && (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 20 }}>
                <Image
                  source={{ uri: selectedScreenshot }}
                  style={{ width: '95%', height: '80%', borderRadius: 8 }}
                  contentFit="contain"
                  cachePolicy="disk"
                  transition={300}
                />
              </View>
            )}
          </View>
        </Modal>

        {/* Modal de Upgrade para Premium */}
        <Modal
          visible={showUpgradeToPremiumModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowUpgradeToPremiumModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ 
              width: '100%', 
              maxWidth: 400, 
              backgroundColor: '#1F2937', 
              borderRadius: 20, 
              padding: 24 
            }}>
              {/* Ícone */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: 40, 
                  backgroundColor: '#EF4444', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  marginBottom: 16
                }}>
                  <Ionicons name="lock-closed" size={40} color="#FFFFFF" />
                </View>
                <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
                  Limite Atingido
                </Text>
              </View>

              {/* Descrição */}
              <Text style={{ color: '#9CA3AF', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 24 }}>
                Você atingiu o limite de <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>5 jogos vigiados</Text> na versão gratuita.
              </Text>

              <Text style={{ color: '#9CA3AF', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 24 }}>
                Com o <Text style={{ color: '#4F46E5', fontWeight: 'bold' }}>Looton Premium</Text>, você pode vigiar <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>quantos jogos quiser</Text>!
              </Text>

              {/* Benefícios */}
              <View style={{ backgroundColor: '#374151', borderRadius: 12, padding: 16, marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text style={{ color: '#E5E7EB', fontSize: 14, marginLeft: 12 }}>
                    Jogos vigiados ilimitados
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text style={{ color: '#E5E7EB', fontSize: 14, marginLeft: 12 }}>
                    Sem anúncios
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text style={{ color: '#E5E7EB', fontSize: 14, marginLeft: 12 }}>
                    Alertas avançados de preços
                  </Text>
                </View>
              </View>

              {/* Botões */}
              <TouchableOpacity
                onPress={async () => {
                  setShowUpgradeToPremiumModal(false);
                  
                  // Abrir tela nativa de assinaturas do Google Play
                  try {
                    const url = getGooglePlaySubscriptionDeepLink(SUBSCRIPTION_INFO.MONTHLY_SKU);
                    
                    const canOpen = await Linking.canOpenURL(url);
                    if (canOpen) {
                      await Linking.openURL(url);
                    } else {
                      Alert.alert(
                        'Assinar Premium',
                        'Por favor, acesse a Google Play Store para assinar o Looton Premium.',
                        [{ text: 'OK' }]
                      );
                    }
                  } catch (error) {
                    console.error('Erro ao abrir Google Play:', error);
                    Alert.alert(
                      'Erro',
                      'Não foi possível abrir a Google Play Store'
                    );
                  }
                }}
                style={{ 
                  backgroundColor: '#4F46E5', 
                  paddingVertical: 16, 
                  borderRadius: 12,
                  alignItems: 'center',
                  marginBottom: 12,
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="logo-google-playstore" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                  Assinar Premium
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowUpgradeToPremiumModal(false)}
                style={{ 
                  paddingVertical: 12,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
                  Agora não
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Local wishlist modal for anonymous users (already implemented above via showWishlistModal) */}
        

      </View>
    </Modal>
  );
};
