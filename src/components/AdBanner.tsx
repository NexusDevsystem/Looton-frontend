import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// ID do Ad Unit - substitua com o seu ID real quando publicar
// Para testar, usamos o ID de teste do Google
const adUnitId = 'ca-app-pub-2976862302591431/6962670889'; // Seu ID real de Ad Unit para o banner

interface AdBannerProps {
  visible?: boolean;
}

const AdBanner = ({ visible = true }: AdBannerProps) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });

    return () => subscription?.remove();
  }, []);

  // Ajustar largura do banner com base na largura da tela
  const getBannerSize = () => {
    if (screenWidth < 350) {
      return BannerAdSize.ANCHORED_ADAPTIVE_BANNER;
    } else if (screenWidth < 380) {
      return BannerAdSize.ADAPTIVE_BANNER;
    }
    return BannerAdSize.ADAPTIVE_BANNER;
  };

  // Não exibe o banner se não estiver visível ou se houver erro
  if (!visible || adError) {
    return null;
  }

  console.log('AdBanner renderizado com visibilidade:', visible, 'e adUnitId:', adUnitId);

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={getBannerSize()}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false, // Permitir anúncios personalizados
        }}
        onAdLoaded={() => {
          setAdLoaded(true);
          setAdError(false);
          console.log('Banner de anúncio carregado com sucesso');
        }}
        onAdFailedToLoad={(error) => {
          setAdError(true);
          setAdLoaded(false);
          console.log('Erro ao carregar banner de anúncio:', error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#374151', // Mesma cor de fundo do app para integração sutil
    paddingVertical: 4,
  },
});

export default AdBanner;