// services/SubscriptionService.ts
/**
 * Serviço de Assinatura Premium
 * Usa Google Play Billing para abrir a tela nativa de compra DENTRO do app
 *
 * OBS: Google Billing / react-native-iap está TEMPORARIAMENTE desabilitado para
 * permitir builds e liberações no Play Console. Reinstale e remova os
 * trechos marcados quando precisar reativar assinaturas.
 */
// TEMPORARILY DISABLED: react-native-iap removed to avoid Kotlin/native build issues
// import * as RNIap from 'react-native-iap';

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
    // IAP disabled: pretend initialization failed so app treats user as non-premium
    console.warn('⚠️ Google Play Billing temporariamente desabilitado (react-native-iap removido)');
    this.isInitialized = false;
    return false;
  }

  /**
   * Abrir tela nativa de assinatura do Google Play DENTRO do app
   * Esta é a tela que você viu na imagem!
   */
  async openSubscriptionScreen(sku: string = SUBSCRIPTION_SKUS.MONTHLY): Promise<void> {
    // IAP disabled: surface a clear error so UI can show fallback / upsell
    console.warn('⚠️ Assinaturas temporariamente desabilitadas (react-native-iap removido)');
    throw new Error('Assinaturas não disponíveis no momento');
  }

  /**
   * Verificar se o usuário tem assinatura ativa
   * A Google Play Billing mantém o status automaticamente
   */
  async isPremium(): Promise<boolean> {
    // IAP disabled: always return false until re-enabled
    console.warn('⚠️ Verificação de assinatura desabilitada (react-native-iap removido)');
    return false;
  }

  /**
   * Limpar recursos
   */
  async cleanup() {
    // Nothing to cleanup when IAP is disabled, but reset state
    if (this.isInitialized) {
      this.isInitialized = false;
      console.log('🔐 Conexão Google Play Billing (simulada) encerrada');
    }
  }
}

export const SubscriptionService = new SubscriptionServiceClass();
export { SUBSCRIPTION_SKUS };
