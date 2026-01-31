import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'pt' | 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = '@app_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('pt');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && ['pt', 'en', 'es'].includes(savedLanguage)) {
        setLanguageState(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    return getTranslation(key, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Translations
const translations: Record<Language, Record<string, string>> = {
  pt: {
    // Tabs
    'tab.games': 'Games',
    'tab.hardware': 'Hardware',
    'tab.search': 'Buscar',
    'tab.watching': 'Vigiando',
    'tab.config': 'Config',
    
    // Header
    'header.title': 'Looton',
    'header.subtitle': 'Ofertas do Dia',
    
    // Home
    'home.loading': 'Carregando ofertas...',
    'home.error': 'Erro ao carregar ofertas',
    'home.noDeals': 'Nenhuma oferta encontrada',
    'home.refresh': 'Atualizar',
    'home.filters': 'Filtros',
    'home.clearFilters': 'Limpar Filtros',
    'home.sortBy': 'Ordenar por',
    'home.bestPrice': 'Melhor Preço',
    'home.biggestDiscount': 'Maior Desconto',
    
    // Game Card
    'game.free': 'Grátis',
    'game.off': 'OFF',
    'game.viewDeal': 'Ver Oferta',
    'game.addToWishlist': 'Adicionar à Lista',
    'game.removeFromWishlist': 'Remover da Lista',
    
    // Search
    'search.placeholder': 'Procure por jogos',
    'search.searching': 'Buscando...',
    'search.noResults': 'Nenhum resultado encontrado',
    'search.games': 'Jogos',
    'search.dlcs': 'DLCs',
    'search.all': 'Todos',
    
    // Wishlist
    'wishlist.title': 'Lista de Observação',
    'wishlist.empty': 'Sua lista está vazia',
    'wishlist.emptyDesc': 'Adicione jogos para receber notificações quando entrarem em promoção',
    'wishlist.currentPrice': 'Preço Atual',
    'wishlist.desiredPrice': 'Preço Desejado',
    'wishlist.updatePrice': 'Atualizar Preço',
    'wishlist.remove': 'Remover',
    
    // Settings
    'settings.title': 'Configurações',
    'settings.getPro': 'Obtenha a versão Pro',
    'settings.getProDesc': 'Acesse recursos exclusivos',
    'settings.rateApp': 'Avalie o aplicativo',
    'settings.rateAppDesc': 'Deixe sua avaliação na Play Store',
    'settings.language': 'Idioma',
    'settings.languageDesc': 'Português / English / Español',
    'settings.currency': 'Moeda',
    'settings.share': 'Compartilhar',
    'settings.shareDesc': 'Compartilhe com seus amigos',
    'settings.reportBug': 'Informar um bug',
    'settings.reportBugDesc': 'Relate problemas que encontrou',
    'settings.notifications': 'Notificações',
    'settings.help': 'Ajuda',
    'settings.privacy': 'Privacidade',
    'settings.privacyDesc': 'Nossas políticas de privacidade',
    'settings.about': 'Sobre',
    
    // Pro Modal
    'pro.title': 'Versão Pro',
    'pro.description': 'Aproveite uma experiência sem anúncios atualizando para a versão Pro',
    'pro.button': 'Obtenha o Pro por R$ 11,99',
    'pro.continueButton': 'Continuar usando a versão gratuita',
    
    // Language
    'language.portuguese': 'Português',
    'language.english': 'English',
    'language.spanish': 'Español',
    
    // Currency
    'currency.title': 'Selecione a Moeda',
    'currency.search': 'Buscar moeda...',
    
    // Notifications
    'notifications.title': 'Notificações',
    'notifications.dailyOffers': 'Oferta do Dia',
    'notifications.dailyOffersDesc': 'Receba notificações de ofertas especiais todo dia ao meio-dia',
    'notifications.watchedGames': 'Jogos Vigiados',
    'notifications.watchedGamesDesc': 'Receba alertas quando jogos da sua lista entrarem em promoção',
    'notifications.test': 'Testar Notificação',
    'notifications.history': 'Histórico',
    'notifications.empty': 'Nenhuma notificação ainda',
    'notifications.emptyDesc': 'Você receberá notificações quando jogos vigiados entrarem em promoção',
    'notifications.clearAll': 'Limpar Todas',
    
    // Buttons
    'button.close': 'Fechar',
    'button.save': 'Salvar',
    'button.cancel': 'Cancelar',
    'button.confirm': 'Confirmar',
    'button.ok': 'OK',
    'button.yes': 'Sim',
    'button.no': 'Não',
    
    // Toast Messages
    'toast.success': 'Sucesso!',
    'toast.error': 'Erro!',
    'toast.copied': 'Copiado!',
    'toast.saved': 'Salvo!',
    
    // Hardware
    'hardware.title': 'Hardware',
    'hardware.search': 'Buscar hardware (ex: RTX 4060, i5, SSD, fonte, memor',
    
    // Price Analysis
    'price.lowest': 'PREÇO MAIS BAIXO',
    'price.good': 'PREÇO BOM',
    'price.average': 'PREÇO MÉDIO',
    'price.high': 'PREÇO ALTO',
    'price.veryHigh': 'PREÇO MUITO ALTO',
    'price.normal': 'PREÇO NORMAL',
    
    // About/Version
    'about.title': 'Sobre o Looton',
    'about.version': 'Versão',
    'about.description': 'O melhor aplicativo para encontrar ofertas de jogos.',
    'about.tagline': 'Desenvolvido com amor para gamers',
    
    // Watchlist Empty State
    'watchlist.emptyTitle': 'Nenhum jogo na lista de observação',
    'watchlist.emptyMessage': 'Adicione jogos à sua lista de observação para acompanhar mudanças de preço',
    
    // Game Details
    'gameDetails.title': 'Detalhes do Jogo',
    'gameDetails.tabs.games': 'Jogos',
    'gameDetails.tabs.dlcs': 'DLCs & Expansões',
    'gameDetails.searchPlaceholder': 'Procure por jogos',
    'gameDetails.searchSteam': 'Procure por jogos na Steam Store',
    'gameDetails.accessStore': 'Acesse a loja oficial',
    'gameDetails.watch': 'Vigiar',
    'gameDetails.systemRequirements': 'Requisitos do Sistema',
    'gameDetails.minimumRequirements': 'Requisitos Mínimos',
    'gameDetails.recommendedRequirements': 'Requisitos Recomendados',
    'gameDetails.genres': 'Gêneros',
    
    // Price Tags
    'price.veryLow': 'PREÇO MUITO BAIXO',
    'price.free': 'Grátis',
    'price.earlyAccess': 'Acesso antecipado',
    
    // Watchlist/Favorites
    'favorites.title': 'Lista de Observação',
    'favorites.empty': 'Nenhum jogo na lista de observação',
    'favorites.emptyMessage': 'Adicione jogos à sua lista de observação para acompanhar mudanças de preço',
    
    // Watch Price Modal
    'watchPrice.title': 'Vigiar Preço',
    'watchPrice.currentPrice': 'Preço atual:',
    'watchPrice.whatDoYouWant': 'O que você deseja?',
    'watchPrice.notifyAnyPromotion': 'Notificar sobre qualquer promoção',
    'watchPrice.notifyAnyPromotionDesc': 'Receba notificações quando houver qualquer desconto',
    'watchPrice.setDesiredPrice': 'Definir preço desejado',
    'watchPrice.setDesiredPriceDesc': 'Receba notificação quando o preço atingir seu valor',
    'watchPrice.enterDesiredPrice': 'Digite o preço desejado:',
    'watchPrice.pricePlaceholder': 'Ex: 29,99',
    'watchPrice.cancel': 'Cancelar',
    'watchPrice.watch': 'Vigiar',
    
    // Watched Game Deal Modal
    'dealModal.specialOffer': 'OFERTA ESPECIAL',
    'dealModal.from': 'De',
    'dealModal.to': 'Por',
    'dealModal.save': 'Economize',
    'dealModal.viewStore': 'Ver na Loja Oficial',
    'dealModal.viewDetails': 'Ver Detalhes Completos',
    'dealModal.urgency': 'Promoções podem acabar a qualquer momento!',
    
    // Onboarding de Preferências
    'onboarding.title': 'Quais tipos de jogos você curte?',
    'onboarding.subtitle': 'Isso ajuda o Looton a te mostrar ofertas mais relevantes.',
    'onboarding.selectGenres': 'Selecione seus gêneros favoritos',
    'onboarding.searchGenres': 'Buscar gêneros...',
    'onboarding.continue': 'Continuar',
    'onboarding.skipNow': 'Pular agora',
    'onboarding.skipMessage': 'Você pode configurar isso depois em Configurações',
    'onboarding.selectAtLeastOne': 'Selecione pelo menos 1 gênero para continuar',
    'onboarding.subPreferences': 'Preferências Adicionais (opcional)',
    'onboarding.multiplayer': 'Preferir Multiplayer',
    'onboarding.coop': 'Preferir Co-op',
    'onboarding.singleplayer': 'Preferir Single-player',
    'onboarding.ptBr': 'Preferir PT-BR',
    'onboarding.maxPrice': 'Preço máximo',
    'onboarding.maxPricePlaceholder': 'Ex: 50,00',
    'onboarding.saved': 'Preferências atualizadas! 🎮',
    
    // Badges de Preferências
    'badge.matchedPreferences': 'Bateu suas preferências',
    'badge.exploration': 'Exploração',
    'badge.trending': 'Em alta',
    'badge.highDiscount': 'Super desconto',
    
    // Feed de Preferências
    'feed.explorationNotice': 'Incluímos algumas ofertas fora das suas preferências para você descobrir novidades.',
    'feed.adjustPreferences': 'Ajustar preferências',
    'feed.noPreferences': 'Configure suas preferências para ver ofertas personalizadas',
    
    // Configurações de Preferências
    'preferences.title': 'Preferências de Jogos',
    'preferences.description': 'Personalize as ofertas que você vê',
    'preferences.genres': 'Gêneros Favoritos',
    'preferences.edit': 'Editar Preferências',
    'preferences.reset': 'Resetar Preferências',
    'preferences.resetConfirm': 'Tem certeza? Isso removerá todas as suas preferências.',
    'preferences.privacy': 'Privacidade',
    'preferences.resetDeviceId': 'Resetar ID do Dispositivo',
    'preferences.resetDeviceIdDesc': 'Gera um novo identificador anônimo',
  },
  
  en: {
    // Tabs
    'tab.games': 'Games',
    'tab.hardware': 'Hardware',
    'tab.search': 'Search',
    'tab.watching': 'Watching',
    'tab.config': 'Settings',
    
    // Header
    'header.title': 'Looton',
    'header.subtitle': 'Daily Deals',
    
    // Home
    'home.loading': 'Loading deals...',
    'home.error': 'Error loading deals',
    'home.noDeals': 'No deals found',
    'home.refresh': 'Refresh',
    'home.filters': 'Filters',
    'home.clearFilters': 'Clear Filters',
    'home.sortBy': 'Sort by',
    'home.bestPrice': 'Best Price',
    'home.biggestDiscount': 'Biggest Discount',
    
    // Game Card
    'game.free': 'Free',
    'game.off': 'OFF',
    'game.viewDeal': 'View Deal',
    'game.addToWishlist': 'Add to Wishlist',
    'game.removeFromWishlist': 'Remove from Wishlist',
    
    // Search
    'search.placeholder': 'Search for games',
    'search.searching': 'Searching...',
    'search.noResults': 'No results found',
    'search.games': 'Games',
    'search.dlcs': 'DLCs',
    'search.all': 'All',
    
    // Wishlist
    'wishlist.title': 'Watchlist',
    'wishlist.empty': 'Your watchlist is empty',
    'wishlist.emptyDesc': 'Add games to receive notifications when they go on sale',
    'wishlist.currentPrice': 'Current Price',
    'wishlist.desiredPrice': 'Desired Price',
    'wishlist.updatePrice': 'Update Price',
    'wishlist.remove': 'Remove',
    
    // Settings
    'settings.title': 'Settings',
    'settings.getPro': 'Get Pro version',
    'settings.getProDesc': 'Access exclusive features',
    'settings.rateApp': 'Rate the app',
    'settings.rateAppDesc': 'Leave your review on Play Store',
    'settings.language': 'Language',
    'settings.languageDesc': 'Português / English / Español',
    'settings.currency': 'Currency',
    'settings.share': 'Share',
    'settings.shareDesc': 'Share with your friends',
    'settings.reportBug': 'Report a bug',
    'settings.reportBugDesc': 'Report problems you found',
    'settings.notifications': 'Notifications',
    'settings.help': 'Help',
    'settings.privacy': 'Privacy',
    'settings.privacyDesc': 'Our privacy policies',
    'settings.about': 'About',
    
    // Pro Modal
    'pro.title': 'Pro Version',
    'pro.description': 'Enjoy an ad-free experience by upgrading to Pro version',
    'pro.button': 'Get Pro for R$ 11.99',
    'pro.continueButton': 'Continue using free version',
    
    // Language
    'language.portuguese': 'Português',
    'language.english': 'English',
    'language.spanish': 'Español',
    
    // Currency
    'currency.title': 'Select Currency',
    'currency.search': 'Search currency...',
    
    // Notifications
    'notifications.title': 'Notifications',
    'notifications.dailyOffers': 'Daily Offer',
    'notifications.dailyOffersDesc': 'Receive notifications of special offers every day at noon',
    'notifications.watchedGames': 'Watched Games',
    'notifications.watchedGamesDesc': 'Receive alerts when games on your list go on sale',
    'notifications.test': 'Test Notification',
    'notifications.history': 'History',
    'notifications.empty': 'No notifications yet',
    'notifications.emptyDesc': 'You will receive notifications when watched games go on sale',
    'notifications.clearAll': 'Clear All',
    
    // Buttons
    'button.close': 'Close',
    'button.save': 'Save',
    'button.cancel': 'Cancel',
    'button.confirm': 'Confirm',
    'button.ok': 'OK',
    'button.yes': 'Yes',
    'button.no': 'No',
    
    // Toast Messages
    'toast.success': 'Success!',
    'toast.error': 'Error!',
    'toast.copied': 'Copied!',
    'toast.saved': 'Saved!',
    
    // Hardware
    'hardware.title': 'Hardware',
    'hardware.search': 'Search hardware (e.g., RTX 4060, i5, SSD, power supply, memory)',
    
    // Price Analysis
    'price.lowest': 'LOWEST PRICE',
    'price.good': 'GOOD PRICE',
    'price.average': 'AVERAGE PRICE',
    'price.high': 'HIGH PRICE',
    'price.veryHigh': 'VERY HIGH PRICE',
    'price.normal': 'NORMAL PRICE',
    
    // About/Version
    'about.title': 'About Looton',
    'about.version': 'Version',
    'about.description': 'The best app to find game deals.',
    'about.tagline': 'Developed with love for gamers',
    
    // Watchlist Empty State
    'watchlist.emptyTitle': 'No games on watchlist',
    'watchlist.emptyMessage': 'Add games to your watchlist to track price changes',
    
    // Game Details
    'gameDetails.title': 'Game Details',
    'gameDetails.tabs.games': 'Games',
    'gameDetails.tabs.dlcs': 'DLCs & Expansions',
    'gameDetails.searchPlaceholder': 'Search for games',
    'gameDetails.searchSteam': 'Search for games on Steam Store',
    'gameDetails.accessStore': 'Access official store',
    'gameDetails.watch': 'Watch',
    'gameDetails.systemRequirements': 'System Requirements',
    'gameDetails.minimumRequirements': 'Minimum Requirements',
    'gameDetails.recommendedRequirements': 'Recommended Requirements',
    'gameDetails.genres': 'Genres',
    
    // Price Tags
    'price.veryLow': 'VERY LOW PRICE',
    'price.free': 'Free',
    'price.earlyAccess': 'Early Access',
    
    // Watchlist/Favorites
    'favorites.title': 'Watchlist',
    'favorites.empty': 'No games in watchlist',
    'favorites.emptyMessage': 'Add games to your watchlist to track price changes',
    
    // Watch Price Modal
    'watchPrice.title': 'Watch Price',
    'watchPrice.currentPrice': 'Current price:',
    'watchPrice.whatDoYouWant': 'What do you want?',
    'watchPrice.notifyAnyPromotion': 'Notify about any promotion',
    'watchPrice.notifyAnyPromotionDesc': 'Receive notifications when there is any discount',
    'watchPrice.setDesiredPrice': 'Set desired price',
    'watchPrice.setDesiredPriceDesc': 'Receive notification when price reaches your value',
    'watchPrice.enterDesiredPrice': 'Enter desired price:',
    'watchPrice.pricePlaceholder': 'Ex: 29.99',
    'watchPrice.cancel': 'Cancel',
    'watchPrice.watch': 'Watch',
    
    // Watched Game Deal Modal
    'dealModal.specialOffer': 'SPECIAL OFFER',
    'dealModal.from': 'From',
    'dealModal.to': 'For',
    'dealModal.save': 'Save',
    'dealModal.viewStore': 'View in Official Store',
    'dealModal.viewDetails': 'View Full Details',
    'dealModal.urgency': 'Promotions may end at any time!',
    
    // Onboarding de Preferências
    'onboarding.title': 'What types of games do you enjoy?',
    'onboarding.subtitle': 'This helps Looton show you more relevant offers.',
    'onboarding.selectGenres': 'Select your favorite genres',
    'onboarding.searchGenres': 'Search genres...',
    'onboarding.continue': 'Continue',
    'onboarding.skipNow': 'Skip for now',
    'onboarding.skipMessage': 'You can configure this later in Settings',
    'onboarding.selectAtLeastOne': 'Select at least 1 genre to continue',
    'onboarding.subPreferences': 'Additional Preferences (optional)',
    'onboarding.multiplayer': 'Prefer Multiplayer',
    'onboarding.coop': 'Prefer Co-op',
    'onboarding.singleplayer': 'Prefer Single-player',
    'onboarding.ptBr': 'Prefer PT-BR',
    'onboarding.maxPrice': 'Maximum price',
    'onboarding.maxPricePlaceholder': 'Ex: 50.00',
    'onboarding.saved': 'Preferences updated! 🎮',
    
    // Badges de Preferências
    'badge.matchedPreferences': 'Matched your preferences',
    'badge.exploration': 'Discovery',
    'badge.trending': 'Trending',
    'badge.highDiscount': 'Great deal',
    
    // Feed de Preferências
    'feed.explorationNotice': 'We included some offers outside your preferences for you to discover new games.',
    'feed.adjustPreferences': 'Adjust preferences',
    'feed.noPreferences': 'Set up your preferences to see personalized offers',
    
    // Configurações de Preferências
    'preferences.title': 'Game Preferences',
    'preferences.description': 'Customize the offers you see',
    'preferences.genres': 'Favorite Genres',
    'preferences.edit': 'Edit Preferences',
    'preferences.reset': 'Reset Preferences',
    'preferences.resetConfirm': 'Are you sure? This will remove all your preferences.',
    'preferences.privacy': 'Privacy',
    'preferences.resetDeviceId': 'Reset Device ID',
    'preferences.resetDeviceIdDesc': 'Generates a new anonymous identifier',
  },
  
  es: {
    // Tabs
    'tab.games': 'Juegos',
    'tab.hardware': 'Hardware',
    'tab.search': 'Buscar',
    'tab.watching': 'Vigilando',
    'tab.config': 'Ajustes',
    
    // Header
    'header.title': 'Looton',
    'header.subtitle': 'Ofertas del Día',
    
    // Home
    'home.loading': 'Cargando ofertas...',
    'home.error': 'Error al cargar ofertas',
    'home.noDeals': 'No se encontraron ofertas',
    'home.refresh': 'Actualizar',
    'home.filters': 'Filtros',
    'home.clearFilters': 'Limpiar Filtros',
    'home.sortBy': 'Ordenar por',
    'home.bestPrice': 'Mejor Precio',
    'home.biggestDiscount': 'Mayor Descuento',
    
    // Game Card
    'game.free': 'Gratis',
    'game.off': 'DESC',
    'game.viewDeal': 'Ver Oferta',
    'game.addToWishlist': 'Agregar a la Lista',
    'game.removeFromWishlist': 'Quitar de la Lista',
    
    // Search
    'search.placeholder': 'Buscar juegos',
    'search.searching': 'Buscando...',
    'search.noResults': 'No se encontraron resultados',
    'search.games': 'Juegos',
    'search.dlcs': 'DLCs',
    'search.all': 'Todos',
    
    // Wishlist
    'wishlist.title': 'Lista de Observación',
    'wishlist.empty': 'Tu lista está vacía',
    'wishlist.emptyDesc': 'Agrega juegos para recibir notificaciones cuando estén en oferta',
    'wishlist.currentPrice': 'Precio Actual',
    'wishlist.desiredPrice': 'Precio Deseado',
    'wishlist.updatePrice': 'Actualizar Precio',
    'wishlist.remove': 'Quitar',
    
    // Settings
    'settings.title': 'Ajustes',
    'settings.getPro': 'Obtener versión Pro',
    'settings.getProDesc': 'Accede a recursos exclusivos',
    'settings.rateApp': 'Calificar la aplicación',
    'settings.rateAppDesc': 'Deja tu reseña en Play Store',
    'settings.language': 'Idioma',
    'settings.languageDesc': 'Português / English / Español',
    'settings.currency': 'Moneda',
    'settings.share': 'Compartir',
    'settings.shareDesc': 'Comparte con tus amigos',
    'settings.reportBug': 'Informar un error',
    'settings.reportBugDesc': 'Informa problemas que encontraste',
    'settings.notifications': 'Notificaciones',
    'settings.help': 'Ayuda',
    'settings.privacy': 'Privacidad',
    'settings.privacyDesc': 'Nuestras políticas de privacidad',
    'settings.about': 'Acerca de',
    
    // Pro Modal
    'pro.title': 'Versión Pro',
    'pro.description': 'Disfruta de una experiencia sin anuncios actualizando a la versión Pro',
    'pro.button': 'Obtener Pro por R$ 11,99',
    'pro.continueButton': 'Continuar usando la versión gratuita',
    
    // Language
    'language.portuguese': 'Português',
    'language.english': 'English',
    'language.spanish': 'Español',
    
    // Currency
    'currency.title': 'Seleccionar Moneda',
    'currency.search': 'Buscar moneda...',
    
    // Notifications
    'notifications.title': 'Notificaciones',
    'notifications.dailyOffers': 'Oferta del Día',
    'notifications.dailyOffersDesc': 'Recibe notificaciones de ofertas especiales todos los días al mediodía',
    'notifications.watchedGames': 'Juegos Vigilados',
    'notifications.watchedGamesDesc': 'Recibe alertas cuando los juegos de tu lista estén en oferta',
    'notifications.test': 'Probar Notificación',
    'notifications.history': 'Historial',
    'notifications.empty': 'Aún no hay notificaciones',
    'notifications.emptyDesc': 'Recibirás notificaciones cuando los juegos vigilados estén en oferta',
    'notifications.clearAll': 'Limpiar Todas',
    
    // Buttons
    'button.close': 'Cerrar',
    'button.save': 'Guardar',
    'button.cancel': 'Cancelar',
    'button.confirm': 'Confirmar',
    'button.ok': 'OK',
    'button.yes': 'Sí',
    'button.no': 'No',
    
    // Toast Messages
    'toast.success': '¡Éxito!',
    'toast.error': '¡Error!',
    'toast.copied': '¡Copiado!',
    'toast.saved': '¡Guardado!',
    
    // Hardware
    'hardware.title': 'Hardware',
    'hardware.search': 'Buscar hardware (ej: RTX 4060, i5, SSD, fuente, memoria)',
    
    // Price Analysis
    'price.lowest': 'PRECIO MÁS BAJO',
    'price.good': 'BUEN PRECIO',
    'price.average': 'PRECIO MEDIO',
    'price.high': 'PRECIO ALTO',
    'price.veryHigh': 'PRECIO MUY ALTO',
    'price.normal': 'PRECIO NORMAL',
    
    // About/Version
    'about.title': 'Acerca de Looton',
    'about.version': 'Versión',
    'about.description': 'La mejor aplicación para encontrar ofertas de juegos.',
    'about.tagline': 'Desarrollado con amor para gamers',
    
    // Watchlist Empty State
    'watchlist.emptyTitle': 'Ningún juego en la lista de observación',
    'watchlist.emptyMessage': 'Agrega juegos a tu lista de observación para seguir cambios de precio',
    
    // Game Details
    'gameDetails.title': 'Detalles del Juego',
    'gameDetails.tabs.games': 'Juegos',
    'gameDetails.tabs.dlcs': 'DLCs y Expansiones',
    'gameDetails.searchPlaceholder': 'Buscar juegos',
    'gameDetails.searchSteam': 'Buscar juegos en Steam Store',
    'gameDetails.accessStore': 'Acceder a la tienda oficial',
    'gameDetails.watch': 'Vigilar',
    'gameDetails.systemRequirements': 'Requisitos del Sistema',
    'gameDetails.minimumRequirements': 'Requisitos Mínimos',
    'gameDetails.recommendedRequirements': 'Requisitos Recomendados',
    'gameDetails.genres': 'Géneros',
    
    // Price Tags
    'price.veryLow': 'PRECIO MUY BAJO',
    'price.free': 'Gratis',
    'price.earlyAccess': 'Acceso anticipado',
    
    // Watchlist/Favorites
    'favorites.title': 'Lista de Observación',
    'favorites.empty': 'Ningún juego en la lista de observación',
    'favorites.emptyMessage': 'Agrega juegos a tu lista de observación para seguir cambios de precio',
    
    // Watch Price Modal
    'watchPrice.title': 'Vigilar Precio',
    'watchPrice.currentPrice': 'Precio actual:',
    'watchPrice.whatDoYouWant': '¿Qué deseas?',
    'watchPrice.notifyAnyPromotion': 'Notificar sobre cualquier promoción',
    'watchPrice.notifyAnyPromotionDesc': 'Recibe notificaciones cuando haya cualquier descuento',
    'watchPrice.setDesiredPrice': 'Establecer precio deseado',
    'watchPrice.setDesiredPriceDesc': 'Recibe notificación cuando el precio alcance tu valor',
    'watchPrice.enterDesiredPrice': 'Ingresa el precio deseado:',
    'watchPrice.pricePlaceholder': 'Ej: 29,99',
    'watchPrice.cancel': 'Cancelar',
    'watchPrice.watch': 'Vigilar',
    
    // Watched Game Deal Modal
    'dealModal.specialOffer': 'OFERTA ESPECIAL',
    'dealModal.from': 'De',
    'dealModal.to': 'Por',
    'dealModal.save': 'Ahorra',
    'dealModal.viewStore': 'Ver en Tienda Oficial',
    'dealModal.viewDetails': 'Ver Detalles Completos',
        'dealModal.urgency': '¡Las promociones pueden terminar en cualquier momento!',
    
    // Onboarding de Preferências
    'onboarding.title': '¿Qué tipos de juegos te gustan?',
    'onboarding.subtitle': 'Esto ayuda a Looton a mostrarte ofertas más relevantes.',
    'onboarding.selectGenres': 'Selecciona tus géneros favoritos',
    'onboarding.searchGenres': 'Buscar géneros...',
    'onboarding.continue': 'Continuar',
    'onboarding.skipNow': 'Omitir ahora',
    'onboarding.skipMessage': 'Puedes configurar esto más tarde en Ajustes',
    'onboarding.selectAtLeastOne': 'Selecciona al menos 1 género para continuar',
    'onboarding.subPreferences': 'Preferencias Adicionales (opcional)',
    'onboarding.multiplayer': 'Preferir Multijugador',
    'onboarding.coop': 'Preferir Cooperativo',
    'onboarding.singleplayer': 'Preferir Un jugador',
    'onboarding.ptBr': 'Preferir PT-BR',
    'onboarding.maxPrice': 'Precio máximo',
    'onboarding.maxPricePlaceholder': 'Ej: 50,00',
    'onboarding.saved': '¡Preferencias actualizadas! 🎮',
    
    // Badges de Preferências
    'badge.matchedPreferences': 'Coincide con tus preferencias',
    'badge.exploration': 'Exploración',
    'badge.trending': 'Tendencia',
    'badge.highDiscount': 'Gran descuento',
    
    // Feed de Preferências
    'feed.explorationNotice': 'Incluimos algunas ofertas fuera de tus preferencias para que descubras nuevos juegos.',
    'feed.adjustPreferences': 'Ajustar preferencias',
    'feed.noPreferences': 'Configura tus preferencias para ver ofertas personalizadas',
    
    // Configurações de Preferências
    'preferences.title': 'Preferencias de Juegos',
    'preferences.description': 'Personaliza las ofertas que ves',
    'preferences.genres': 'Géneros Favoritos',
    'preferences.edit': 'Editar Preferencias',
    'preferences.reset': 'Restablecer Preferencias',
    'preferences.resetConfirm': '¿Estás seguro? Esto eliminará todas tus preferencias.',
    'preferences.privacy': 'Privacidad',
    'preferences.resetDeviceId': 'Restablecer ID del Dispositivo',
    'preferences.resetDeviceIdDesc': 'Genera un nuevo identificador anónimo',
  }
};

function getTranslation(key: string, language: Language): string {
  return translations[language][key] || key;
}
