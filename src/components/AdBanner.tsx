import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

// ID do Ad Unit - usando o ID real
const adUnitId = 'ca-app-pub-2976862302591431/6962670889';

const AdBanner = () => {
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

  // Não exibe o banner se houver erro
  if (adError) {
    return null;
  }

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
        }}
        onAdFailedToLoad={(error) => {
          setAdError(true);
          setAdLoaded(false);
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