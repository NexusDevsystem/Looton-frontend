import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { WishlistService, WishlistItem } from './WishlistService';
import { api } from '../api/client';

// Chaves de armazenamento
const WATCHED_GAMES_ENABLED = 'watchedGamesNotificationsEnabled';
const LAST_PRICES_CACHE = 'lastKnownPricesCache';
const LAST_CHECK_TIMESTAMP = 'lastWatchedGamesCheckTimestamp';

// Interface para cache de preços
interface PriceCache {
  [gameId: string]: {
    price: number;
    discount: number;
    timestamp: number;
    store: string;
  };
}

// Configurar canal de notificação
const setupWatchedGamesChannel = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('watched-games', {
      name: 'Jogos Vigiados',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
      enableLights: true,
      showBadge: true,
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    console.log('✅ Canal "watched-games" configurado');
  }
};

// Verificar se as notificações estão habilitadas
export const isWatchedGamesNotificationEnabled = async (): Promise<boolean> => {
  const enabled = await AsyncStorage.getItem(WATCHED_GAMES_ENABLED);
  return enabled !== 'false'; // Habilitado por padrão
};

// Habilitar/desabilitar notificações
export const setWatchedGamesNotificationEnabled = async (enabled: boolean) => {
  await AsyncStorage.setItem(WATCHED_GAMES_ENABLED, enabled.toString());
};

// Obter cache de preços
const getPriceCache = async (): Promise<PriceCache> => {
  try {
    const cache = await AsyncStorage.getItem(LAST_PRICES_CACHE);
    return cache ? JSON.parse(cache) : {};
  } catch {
    return {};
  }
};

// Salvar cache de preços
const savePriceCache = async (cache: PriceCache) => {
  await AsyncStorage.setItem(LAST_PRICES_CACHE, JSON.stringify(cache));
};

// Buscar preço atual do jogo via API
const fetchCurrentGamePrice = async (title: string, appId: number, store: string): Promise<{
  price: number;
  discount: number;
  basePrice: number;
} | null> => {
  try {
    // Buscar pelo título do jogo via API
    const searchQuery = encodeURIComponent(title);
    const searchResults = await api<any[]>(`/search?q=${searchQuery}&limit=10`);
    
    console.log(`🔍 Buscando: "${title}" (appId: ${appId})`);
    
    if (searchResults && Array.isArray(searchResults)) {
      // Tentar encontrar por appId exato (campo 'id' na resposta)
      let game = searchResults.find((g: any) => 
        String(g.id) === String(appId)
      );
      
      // Se não encontrar por ID, buscar por título similar
      if (!game) {
        const titleLower = title.toLowerCase();
        game = searchResults.find((g: any) => 
          g.title?.toLowerCase() === titleLower
        );
      }
      
      // Fallback: primeiro resultado se tiver match parcial no título
      if (!game && searchResults.length > 0) {
        const titleLower = title.toLowerCase();
        game = searchResults.find((g: any) => 
          g.title?.toLowerCase().includes(titleLower) ||
          titleLower.includes(g.title?.toLowerCase())
        );
      }
      
      if (game) {
        // Preços vêm em centavos, converter para reais
        const priceFinal = game.priceFinalCents ? game.priceFinalCents / 100 : 0;
        const priceOriginal = game.priceOriginalCents ? game.priceOriginalCents / 100 : priceFinal;
        
        console.log(`✅ Jogo encontrado: "${game.title}" - R$ ${priceFinal.toFixed(2)} (${game.discountPct || 0}% OFF)`);
        
        return {
          price: priceFinal,
          discount: game.discountPct || 0,
          basePrice: priceOriginal,
        };
      } else {
        console.log(`⚠️ Nenhum resultado encontrado para "${title}" nos ${searchResults.length} resultados`);
      }
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Erro ao buscar preço do jogo "${title}":`, error);
    return null;
  }
};

// Enviar notificação de promoção
const sendPromotionNotification = async (
  game: WishlistItem,
  oldPrice: number,
  newPrice: number,
  discount: number,
  store: string
) => {
  await setupWatchedGamesChannel();

  try {
    const priceReduction = oldPrice - newPrice;
    const discountText = discount > 0 ? ` (${discount}% OFF)` : '';
    
    // Preparar conteúdo da notificação
    const notificationContent: any = {
      title: `🔥 ${game.title} em Promoção!`,
      body: `De R$ ${oldPrice.toFixed(2)} por R$ ${newPrice.toFixed(2)}${discountText} na ${store}! Economize R$ ${priceReduction.toFixed(2)}!`,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      color: '#10B981',
      vibrate: [0, 250, 250, 250],
      badge: 1,
      data: {
        appId: game.appId,
        title: game.title,
        url: game.url,
        oldPrice,
        newPrice,
        discount,
        store,
        coverUrl: game.coverUrl,
        type: 'watched_game_deal'
      },
      categoryIdentifier: 'WATCHED_GAME_PROMOTION',
      subtitle: `${store} • ${discount}% OFF`,
    };

    // Adicionar imagem grande apenas no Android (Big Picture Style)
    if (Platform.OS === 'android' && game.coverUrl) {
      notificationContent.body = notificationContent.body + `\n\n[Imagem do jogo será exibida]`;
    }
    
    // Criar notificação rica com imagem e botões de ação
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
        repeats: false,
      },
    });

    console.log(`✅ Notificação enviada para ${game.title}! ID:`, notificationId);
    return notificationId;
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error);
    throw error;
  }
};

// Verificar TODOS os jogos vigiados automaticamente
export const checkWatchedGamesForDeals = async (): Promise<number> => {
  const enabled = await isWatchedGamesNotificationEnabled();
  if (!enabled) {
    console.log('⏸️ Notificações de jogos vigiados desabilitadas');
    return 0;
  }

  try {
    const wishlist = await WishlistService.getWishlist();
    
    if (wishlist.length === 0) {
      console.log('📭 Nenhum jogo sendo vigiado');
      return 0;
    }

    const priceCache = await getPriceCache();
    let notificationsSent = 0;

    console.log(`🔍 Verificando ${wishlist.length} jogo(s) vigiado(s)...`);

    for (const item of wishlist) {
      try {
        // Buscar preço atual
        const currentData = await fetchCurrentGamePrice(item.title, item.appId, item.store);
        
        if (!currentData) {
          console.log(`⚠️ Não foi possível obter preço de ${item.title}`);
          continue;
        }

        const { price: currentPrice, discount, basePrice } = currentData;
        const gameKey = `${item.appId}-${item.store}`;
        const cachedData = priceCache[gameKey];
        const lastKnownPrice = cachedData?.price || item.currentPrice;

        // Log detalhado para debug
        console.log(`📊 Análise de preço para "${item.title}":`);
        console.log(`   - Preço atual: R$ ${currentPrice.toFixed(2)}`);
        console.log(`   - Último preço conhecido: R$ ${lastKnownPrice.toFixed(2)}`);
        console.log(`   - Desconto atual: ${discount}%`);
        console.log(`   - Já notificado antes?: ${!!cachedData}`);

        // NOVA LÓGICA SIMPLIFICADA:
        // Notificar se:
        // 1. Tem desconto ativo (> 0%)
        // 2. E (não temos cache OU o preço caiu)
        const hasDiscount = discount > 0;
        const isFirstCheck = !cachedData;
        const priceDropped = currentPrice < lastKnownPrice;
        const shouldNotify = hasDiscount && (isFirstCheck || priceDropped);

        console.log(`🎯 Condições:`);
        console.log(`   - hasDiscount (${discount}% > 0): ${hasDiscount}`);
        console.log(`   - isFirstCheck: ${isFirstCheck}`);
        console.log(`   - priceDropped (${currentPrice} < ${lastKnownPrice}): ${priceDropped}`);
        console.log(`   - shouldNotify: ${shouldNotify}`);

        if (shouldNotify) {
          // PROMOÇÃO DETECTADA!
          console.log(`🎯 PROMOÇÃO DETECTADA: ${item.title} - R$ ${currentPrice.toFixed(2)} (${discount}% OFF)`);
          
          await sendPromotionNotification(
            item,
            basePrice, // Usar preço base (sem desconto) como "preço antigo"
            currentPrice,
            discount,
            item.store
          );

          notificationsSent++;
        }

        // Atualizar cache com o preço atual
        priceCache[gameKey] = {
          price: currentPrice,
          discount,
          timestamp: Date.now(),
          store: item.store,
        };

      } catch (error) {
        console.error(`❌ Erro ao verificar ${item.title}:`, error);
      }
    }

    // Salvar cache atualizado
    await savePriceCache(priceCache);
    await AsyncStorage.setItem(LAST_CHECK_TIMESTAMP, Date.now().toString());

    console.log(`✅ Verificação concluída: ${notificationsSent} notificação(ões) enviada(s)`);
    return notificationsSent;

  } catch (error) {
    console.error('❌ Erro geral na verificação:', error);
    return 0;
  }
};

// Obter timestamp da última verificação
export const getLastCheckTimestamp = async (): Promise<number> => {
  const timestamp = await AsyncStorage.getItem(LAST_CHECK_TIMESTAMP);
  return timestamp ? parseInt(timestamp, 10) : 0;
};

// Limpar cache de preços (útil para reset)
export const clearPriceCache = async () => {
  await AsyncStorage.removeItem(LAST_PRICES_CACHE);
  console.log('🗑️ Cache de preços limpo');
};
