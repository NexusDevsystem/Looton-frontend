import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { AdsConsent, AdsConsentStatus, requestPermissionsAsync, MobileAds } from 'react-native-google-mobile-ads';
import Home from './app/index';
import { checkUpdatesOnce } from './src/utils/updates-manager';
import { askPushPermissionFirstLaunch, sendPushTokenToBackend } from './src/notifications';

// Configurar handler de notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true, 
    shouldSetBadge: false,
  }),
});

// Inicializar o AdMob com o Application ID
MobileAds().initialize();

export default function App() {
  useEffect(() => {
    const initializeApp = async () => {
      // Verificar updates (desabilitado para estabilidade)
      try {
        checkUpdatesOnce(true);
      } catch (error) {
        console.log('Updates check skipped:', error);
      }
      
      // Pedir permissão de notificações na primeira execução
      try {
        const projectId = '41306841-8939-4568-a1a1-af93af0428d1';
        const token = await askPushPermissionFirstLaunch(projectId);
        
        if (token) {
          console.log('📱 Push token obtido:', token);
          // Enviar token para o backend
          await sendPushTokenToBackend(token);
        } else {
          console.log('📱 Permissão de notificação não concedida ou já perguntada antes');
        }
      } catch (error) {
        console.error('Erro ao configurar notificações:', error);
      }
      
      // Configurar consentimento de anúncios (para GDPR e outras regulamentações)
      try {
        await requestPermissionsAsync();
        const consentInfo = await AdsConsent.getConsentInfo();
        if (consentInfo.status === AdsConsentStatus.REQUIRED) {
          const formResult = await AdsConsent.showForm({
            privacyPolicy: 'https://looton.app/privacy',
            withPersonalizedAds: true,
            withNonPersonalizedAds: true,
          });
          console.log('Formulário de consentimento exibido:', formResult);
        }
      } catch (error) {
        console.error('Erro ao configurar consentimento de anúncios:', error);
      }
    };

    initializeApp();
  }, []);

  return <Home />;
}