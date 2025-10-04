import React, { useEffect } from 'react'
import * as Notifications from 'expo-notifications'
import Home from './app/index'
import { checkUpdatesOnce } from './src/utils/updates-manager'
import { askPushPermissionFirstLaunch } from './src/notifications'

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
          // TODO: Enviar token para o backend quando tiver endpoint
        } else {
          console.log('📱 Permissão de notificação não concedida ou já perguntada antes');
        }
      } catch (error) {
        console.error('Erro ao configurar notificações:', error);
      }
    };

    initializeApp();
  }, []);

  return <Home />;
}