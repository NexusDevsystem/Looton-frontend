import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { SubscriptionService } from './SubscriptionService';

// ID do anúncio intersticial - SEMPRE usa IDs reais (tanto em dev quanto em produção)
const INTERSTITIAL_AD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-2976862302591431/8433830309',
  android: 'ca-app-pub-2976862302591431/8433830309',
}) || 'ca-app-pub-2976862302591431/8433830309';

// Configurações de controle
const MIN_TIME_BETWEEN_ADS = 10 * 60 * 1000; // 10 minutos entre anúncios
const MIN_ACTIONS_BEFORE_AD = 3; // Mínimo de 3 ações antes de mostrar anúncio
const STORAGE_KEY_LAST_AD = '@last_interstitial_ad';
const STORAGE_KEY_ACTION_COUNT = '@action_count';

class InterstitialAdService {
  private interstitialAd: InterstitialAd | null = null;
  private isAdLoaded = false;
  private isAdLoading = false;
  private lastAdTime = 0;
  private actionCount = 0;
  private isPremiumUser = false;

  constructor() {
    // Log do tipo de anúncio sendo usado
    if (__DEV__) {
      console.log(`🎬 Interstitial Ads initialized - REAL ADS`);
      console.log(`📱 Ad Unit ID: ${INTERSTITIAL_AD_UNIT_ID}`);
    }

    this.initializeAd();
    this.loadState();
    this.checkPremiumStatus();
  }

  /**
   * Verifica se o usuário é premium
   */
  private async checkPremiumStatus() {
    try {
      this.isPremiumUser = await SubscriptionService.isPremium();
      if (this.isPremiumUser) {
        console.log('👑 Usuário premium detectado - anúncios intersticiais desativados');
      }
    } catch (error) {
      console.error('Erro ao verificar status premium:', error);
      this.isPremiumUser = false;
    }
  }

  /**
   * Atualiza o status premium (chamado quando o usuário assina)
   */
  public async updatePremiumStatus() {
    await this.checkPremiumStatus();
  }

  /**
   * Inicializa o anúncio intersticial
   */
  private initializeAd() {
    try {
      this.interstitialAd = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: false,
      });

      // Evento quando o anúncio é carregado
      this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        if (__DEV__) console.log('✅ Interstitial ad loaded successfully');
        this.isAdLoaded = true;
        this.isAdLoading = false;
      });

      // Evento quando o anúncio é fechado
      this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        if (__DEV__) console.log('🔄 Interstitial ad closed, preloading next ad');
        this.isAdLoaded = false;
        this.lastAdTime = Date.now();
        this.actionCount = 0;
        this.saveState();
        // Pré-carregar próximo anúncio
        setTimeout(() => this.loadAd(), 1000);
      });

      // Evento quando há erro ao carregar
      this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
        // "no-fill" é normal - significa que não há anúncios disponíveis no momento
        const errorMessage = error?.message || String(error);
        const isNoFill = errorMessage.includes('no-fill') || errorMessage.includes('No fill');

        if (isNoFill) {
          // No-fill é esperado, apenas log em dev e retry mais tarde
          if (__DEV__) console.log('📭 No interstitial ads available (no-fill) - will retry later');
        } else {
          // Outros erros são mais importantes
          if (__DEV__) console.error('❌ Interstitial ad error:', error);
        }

        this.isAdLoaded = false;
        this.isAdLoading = false;
        // Tentar novamente depois de 60 segundos (aumentado para reduzir tentativas)
        setTimeout(() => this.loadAd(), 60000);
      });

      // Pré-carregar primeiro anúncio
      this.loadAd();
    } catch (error) {
      console.error('Error initializing interstitial ad:', error);
    }
  }

  /**
   * Carrega o anúncio
   */
  private loadAd() {
    if (this.isAdLoading || this.isAdLoaded || !this.interstitialAd) {
      return;
    }

    try {
      this.isAdLoading = true;
      this.interstitialAd.load();
      if (__DEV__) console.log('📥 Loading interstitial ad...');
    } catch (error) {
      if (__DEV__) console.error('Error loading interstitial ad:', error);
      this.isAdLoading = false;
    }
  }

  /**
   * Carrega estado do AsyncStorage
   */
  private async loadState() {
    try {
      const lastAdStr = await AsyncStorage.getItem(STORAGE_KEY_LAST_AD);
      const actionCountStr = await AsyncStorage.getItem(STORAGE_KEY_ACTION_COUNT);

      if (lastAdStr) {
        this.lastAdTime = parseInt(lastAdStr, 10);
      }
      if (actionCountStr) {
        this.actionCount = parseInt(actionCountStr, 10);
      }

      if (__DEV__) console.log(`📊 Ad state loaded: Last ad ${((Date.now() - this.lastAdTime) / 60000).toFixed(1)}min ago, ${this.actionCount} actions`);
    } catch (error) {
      console.error('Error loading ad state:', error);
    }
  }

  /**
   * Salva estado no AsyncStorage
   */
  private async saveState() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_LAST_AD, this.lastAdTime.toString());
      await AsyncStorage.setItem(STORAGE_KEY_ACTION_COUNT, this.actionCount.toString());
    } catch (error) {
      console.error('Error saving ad state:', error);
    }
  }

  /**
   * Registra uma ação do usuário
   * Ações incluem: trocar de aba, abrir jogo, favoritar, adicionar à lista, etc.
   */
  public trackAction() {
    this.actionCount++;
    this.saveState();
    // Removido log para evitar spam no console
  }

  /**
   * Verifica se pode mostrar o anúncio
   */
  private canShowAd(): boolean {
    // Se o usuário é premium, nunca mostra anúncios
    if (this.isPremiumUser) {
      console.log('👑 Anúncio bloqueado: usuário premium');
      return false;
    }

    const timeSinceLastAd = Date.now() - this.lastAdTime;
    const hasEnoughTimePassed = timeSinceLastAd >= MIN_TIME_BETWEEN_ADS;
    const hasEnoughActions = this.actionCount >= MIN_ACTIONS_BEFORE_AD;

    if (!hasEnoughTimePassed) {
      console.log(`⏱️ Cannot show ad: Only ${(timeSinceLastAd / 60000).toFixed(1)}min passed (need ${MIN_TIME_BETWEEN_ADS / 60000}min)`);
      return false;
    }

    if (!hasEnoughActions) {
      console.log(`🎯 Cannot show ad: Only ${this.actionCount} actions (need ${MIN_ACTIONS_BEFORE_AD})`);
      return false;
    }

    if (!this.isAdLoaded) {
      console.log('📭 Cannot show ad: Ad not loaded yet');
      return false;
    }

    return true;
  }

  /**
   * Tenta mostrar o anúncio intersticial
   * @returns true se o anúncio foi mostrado, false caso contrário
   */
  public async tryShowAd(): Promise<boolean> {
    if (!this.canShowAd()) {
      return false;
    }

    try {
      if (this.interstitialAd && this.isAdLoaded) {
        console.log('🎬 Showing interstitial ad');
        await this.interstitialAd.show();
        return true;
      }
    } catch (error) {
      console.error('Error showing interstitial ad:', error);
      this.isAdLoaded = false;
      this.loadAd();
    }

    return false;
  }

  /**
   * Força o carregamento de um novo anúncio (use com moderação)
   */
  public forceLoadAd() {
    this.isAdLoaded = false;
    this.isAdLoading = false;
    this.loadAd();
  }

  /**
   * Reseta contadores (útil para testes)
   */
  public async resetCounters() {
    this.actionCount = 0;
    this.lastAdTime = 0;
    await this.saveState();
    console.log('🔄 Ad counters reset');
  }

  /**
   * Retorna informações sobre o estado atual
   */
  public getStatus() {
    return {
      isAdLoaded: this.isAdLoaded,
      isAdLoading: this.isAdLoading,
      timeSinceLastAd: Date.now() - this.lastAdTime,
      actionCount: this.actionCount,
      canShow: this.canShowAd(),
    };
  }
}

// Exportar instância singleton
export const interstitialAdService = new InterstitialAdService();
