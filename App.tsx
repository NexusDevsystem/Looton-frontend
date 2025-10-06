import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import Home from './app/index';
import { checkUpdatesOnce } from './src/utils/updates-manager';
import { askPushPermissionFirstLaunch, sendPushTokenToBackend } from './src/notifications';
import { checkAndSendDailyOfferNotification } from './src/services/DailyOfferNotificationService';

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

export default function App() {
  useEffect(() => {
    const initializeApp = async () => {
      // Inicializar o AdMob com o Application ID - removido para evitar crash
      
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
      
      // Não verificar notificação de oferta do dia imediatamente
      // Isso será feito na Home quando os dados estiverem disponíveis
    };

    initializeApp();
    
    // Configurar a Navigation Bar do Android automaticamente
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setBackgroundColorAsync('#374151'); // Mesma cor da tab bar
        NavigationBar.setButtonStyleAsync('light'); // Coerente com o tema escuro
      } catch (error) {
        console.log('Erro ao configurar Navigation Bar:', error);
      }
    }
  }, []);

  return (
    <SafeAreaProvider>
      <Home />
    </SafeAreaProvider>
  );
}