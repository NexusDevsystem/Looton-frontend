// constants/app.ts

/**
 * Configurações do aplicativo
 */

// Package name do app (usado para links do Google Play)
// TODO: Atualize com o package name real do seu app quando publicar na Play Store
export const APP_PACKAGE_NAME = 'com.looton.app';

// URL da Google Play Store para a página do app
export const getGooglePlayUrl = (locale: string = 'pt_BR') => 
  `https://play.google.com/store/apps/details?id=${APP_PACKAGE_NAME}&hl=${locale}`;

// Deep link para assinaturas do Google Play (abre a tela nativa de assinatura)
export const getGooglePlaySubscriptionDeepLink = (sku: string) => 
  `https://play.google.com/store/account/subscriptions?sku=${sku}&package=${APP_PACKAGE_NAME}`;

// Limites de recursos
export const FREE_TIER_LIMITS = {
  MAX_WATCHED_GAMES: 5,
};

// SKUs de assinatura (já definidos em SubscriptionService, mas mantidos aqui para referência)
export const SUBSCRIPTION_INFO = {
  MONTHLY_SKU: 'looton_premium_monthly',
  YEARLY_SKU: 'looton_premium_yearly',
};
