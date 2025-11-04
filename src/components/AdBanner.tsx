import React from 'react';
import { View, Platform, ActivityIndicator } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// ID do banner AdMob - SEMPRE usa IDs reais (tanto em dev quanto em produção)
const BANNER_AD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-2976862302591431/5778912653',
  android: 'ca-app-pub-2976862302591431/5778912653',
}) || 'ca-app-pub-2976862302591431/5778912653';

// Altura do banner padrão (50dp)
const BANNER_HEIGHT = 50;

interface AdBannerProps {
  isPremium?: boolean;
}

export const AdBanner: React.FC<AdBannerProps> = ({ isPremium = false }) => {
  const [adError, setAdError] = React.useState<string | null>(null);
  const [adLoaded, setAdLoaded] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(true);

  // Se o usuário é premium, não mostra anúncios
  if (isPremium) {
    console.log('👑 Usuário premium - anúncios desativados');
    return null;
  }

  // Log do tipo de anúncio (apenas no primeiro render)
  React.useEffect(() => {
    console.log(`🎯 Banner Ads initialized - REAL ADS`);
    console.log(`📱 Banner Ad Unit ID: ${BANNER_AD_UNIT_ID}`);
  }, []);

  // Retry logic quando falha
  const handleAdFailedToLoad = React.useCallback((error: any) => {
    const errorMsg = JSON.stringify(error);
    console.error('❌ Banner ad failed to load:', errorMsg);
    setAdError(errorMsg);
    setAdLoaded(false);
    
    // Retry até 3 vezes com backoff exponencial
    if (retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 10000; // 10s, 20s, 40s
      console.log(`🔄 Tentando recarregar banner em ${delay/1000}s (tentativa ${retryCount + 1}/3)`);
      
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setIsVisible(false);
        // Força re-render do componente BannerAd
        setTimeout(() => setIsVisible(true), 100);
      }, delay);
    }
  }, [retryCount]);

  return (
    <View style={{ 
      width: '100%', 
      alignItems: 'center',
      minHeight: BANNER_HEIGHT, // Garante espaço mínimo para evitar "pulo"
      justifyContent: 'center',
      backgroundColor: '#1F2937', // Cor de fundo para manter consistência
    }}>
      {isVisible ? (
        <BannerAd
          unitId={BANNER_AD_UNIT_ID}
          size={BannerAdSize.BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: false,
            keywords: ['games', 'gaming', 'deals', 'offers', 'discounts'], // Palavras-chave para melhor targeting
          }}
          onAdFailedToLoad={handleAdFailedToLoad}
          onAdLoaded={() => {
            console.log('✅ Banner ad loaded successfully');
            setAdLoaded(true);
            setAdError(null);
            setRetryCount(0); // Reset retry count on success
          }}
          onAdOpened={() => {
            console.log('👆 Banner ad opened');
          }}
          onAdClosed={() => {
            console.log('👋 Banner ad closed');
          }}
        />
      ) : (
        <ActivityIndicator size="small" color="#9CA3AF" />
      )}
    </View>
  );
};
