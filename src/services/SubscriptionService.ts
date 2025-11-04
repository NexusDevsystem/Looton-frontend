// services/SubscriptionService.ts
/**
 * Serviço de Assinatura Premium
 * Usa Google Play Billing para abrir a tela nativa de compra DENTRO do app
 */
import * as RNIap from 'react-native-iap';

// IDs dos produtos de assinatura (configurados no Google Play Console)
const SUBSCRIPTION_SKUS = {
  MONTHLY: 'looton_premium_monthly',
  YEARLY: 'looton_premium_yearly',
};

export type SubscriptionPlan = 'monthly' | 'yearly' | null;

class SubscriptionServiceClass {
  private isInitialized = false;

  /**
   * Inicializar conexão com IAP
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔐 Inicializando Google Play Billing...');
      await RNIap.initConnection();
      this.isInitialized = true;
      console.log('✅ Google Play Billing conectado');
      return true;
    } catch (error) {
      console.warn('⚠️ Google Play Billing não disponível:', error.message);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Abrir tela nativa de assinatura do Google Play DENTRO do app
   * Esta é a tela que você viu na imagem!
   */
  async openSubscriptionScreen(sku: string = SUBSCRIPTION_SKUS.MONTHLY): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🛒 Abrindo tela de assinatura do Google Play...');
      
      // Isso abre a tela nativa DENTRO do app (igual à imagem que você mostrou)
      await RNIap.requestSubscription({ sku });
      
      console.log('✅ Tela de assinatura aberta');
    } catch (error) {
      console.error('❌ Erro ao abrir tela de assinatura:', error);
      throw error;
    }
  }

  /**
   * Verificar se o usuário tem assinatura ativa
   * A Google Play Billing mantém o status automaticamente
   */
  async isPremium(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.log('⚠️ Google Play Billing não disponível, usuário tratado como gratuito');
          return false;
        }
      }

      // Buscar compras/assinaturas ativas gerenciadas pela Google Play
      const purchases = await RNIap.getAvailablePurchases();
      
      // Verificar se há alguma assinatura ativa nos nossos SKUs
      const hasActiveSubscription = purchases.some(purchase => 
        Object.values(SUBSCRIPTION_SKUS).includes(purchase.productId)
      );

      if (hasActiveSubscription) {
        console.log('👑 Assinatura ativa detectada via Google Play');
      }

      return hasActiveSubscription;
    } catch (error) {
      console.warn('⚠️ Erro ao verificar assinaturas:', error.message);
      return false;
    }
  }

  /**
   * Limpar recursos
   */
  async cleanup() {
    try {
      if (this.isInitialized) {
        await RNIap.endConnection();
        this.isInitialized = false;
        console.log('🔐 Conexão Google Play Billing encerrada');
      }
    } catch (error) {
      console.error('❌ Erro ao limpar serviço:', error);
    }
  }
}

export const SubscriptionService = new SubscriptionServiceClass();
export { SUBSCRIPTION_SKUS };
