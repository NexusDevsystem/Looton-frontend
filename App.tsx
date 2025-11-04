import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import Home from './app/index';
import { checkUpdatesOnce } from './src/utils/updates-manager';
import { askPushPermissionFirstLaunch, sendPushTokenToBackend } from './src/notifications';
import { WatchedGameDealModal } from './src/components/WatchedGameDealModal';
import { VersionCheckService } from './src/services/VersionCheckService';
import { UpdateAlertModal } from './src/components/UpdateAlertModal';
import { API_URL } from './src/api/client';
import { LanguageProvider } from './src/contexts/LanguageContext';

// Configurar handler para PERMITIR que notificações apareçam nativamente
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [dealModalVisible, setDealModalVisible] = useState(false);
  const [dealData, setDealData] = useState<any>(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('');
  const [latestVersion, setLatestVersion] = useState('');
  const [storeUrl, setStoreUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Configurar categorias de notificação com botões de ação
    const setupNotificationCategories = async () => {
      await Notifications.setNotificationCategoryAsync('WATCHED_GAME_PROMOTION', [
        {
          identifier: 'VIEW_DEAL',
          buttonTitle: '🛒 Ver Oferta',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'SHARE_DEAL',
          buttonTitle: '📤 Compartilhar',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);
      console.log('✅ Categorias de notificação configuradas');
    };

    // Garantir que os canais de notificação estejam configurados desde o início
    const setupNotificationChannels = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Notificações',
          importance: Notifications.AndroidImportance.MAX,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          lightColor: '#FFD700',
          enableLights: true,
          showBadge: true,
          enableVibrate: true,
        });
        
        await Notifications.setNotificationChannelAsync('test-notifications', {
          name: 'Notificacoes de Teste',
          importance: Notifications.AndroidImportance.MAX,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          lightColor: '#FFD700',
          enableLights: true,
          showBadge: true,
          enableVibrate: true,
        });
        
        await Notifications.setNotificationChannelAsync('daily-offers', {
          name: 'Ofertas Diárias',
          importance: Notifications.AndroidImportance.MAX,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          lightColor: '#FFD700',
          enableLights: true,
          showBadge: true,
          enableVibrate: true,
        });
        
        await Notifications.setNotificationChannelAsync('reengagement', {
          name: 'Lembretes e Novidades',
          description: 'Notificações para você não perder as melhores ofertas',
          importance: Notifications.AndroidImportance.MAX,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          lightColor: '#3B82F6',
          enableLights: true,
          showBadge: true,
          enableVibrate: true,
        });
      }
    };
    
    const initializeApp = async () => {
      // Configurar canais de notificação primeiro
      await setupNotificationChannels();
      
      // Configurar categorias de notificação com botões de ação
      await setupNotificationCategories();
      
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
          
          // Enviar token para o backend - ÚNICO PASSO NECESSÁRIO!
          // Backend cuidará de TODAS as notificações automaticamente
          await sendPushTokenToBackend(token);
          
          console.log('✅ Push token registrado no backend');
          console.log('✅ Você receberá notificações automaticamente:');
          console.log('   - Ofertas do Dia: 12h e 18h');
          console.log('   - Jogos Vigiados: quando preço cair');
        } else {
          console.log('📱 Permissão de notificação não concedida ou já perguntada antes');
        }
      } catch (error) {
        console.error('Erro ao configurar notificações:', error);
      }
      
      // ✅ TODAS as notificações são enviadas pelo BACKEND!
      // Não há mais notificações locais ou background fetch
      // Sistema 100% remoto e confiável
    };

    initializeApp();
    
    // Verificar se há atualizações disponíveis
    const checkForAppUpdates = async () => {
      try {
        const versionService = VersionCheckService.getInstance();
        const { updateAvailable, currentVersion, latestVersion, storeUrl } = await versionService.checkForUpdates();
        
        if (updateAvailable) {
          setCurrentVersion(currentVersion);
          setLatestVersion(latestVersion);
          setStoreUrl(storeUrl);
          setUpdateModalVisible(true);
        }
      } catch (error) {
        console.error('Erro ao verificar atualizações:', error);
      }
    };
    
    // Executar verificação de atualizações após a inicialização do app
    setTimeout(() => {
      checkForAppUpdates();
    }, 2000); // Pequeno atraso para garantir que o app esteja totalmente carregado
    
    // ⚠️ REMOVIDO: Listener de reagendamento (causava notificações duplicadas)
    // As notificações push JÁ aparecem nativamente no Android
    // O histórico é gerenciado em app/index.tsx
    
    // Listener APENAS para ações de notificação (quando usuário clica)
    const notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const { actionIdentifier, notification } = response;
      const data = notification.request.content.data;
      
      console.log('🔔 Ação de notificação:', actionIdentifier);
      console.log('📦 Dados:', data);
      
      if (data.type === 'watched_game_deal') {
        // Preparar dados para o modal
        setDealData({
          title: data.title,
          coverUrl: data.coverUrl,
          oldPrice: data.oldPrice,
          newPrice: data.newPrice,
          discount: data.discount,
          store: data.store,
          url: data.url,
          appId: data.appId,
        });
        
        // Abrir modal
        setDealModalVisible(true);
        
        if (actionIdentifier === 'VIEW_DEAL') {
          console.log('🛒 Botão "Ver Oferta" pressionado');
          // O modal já vai lidar com isso
        } else if (actionIdentifier === 'SHARE_DEAL') {
          console.log('📤 Compartilhando:', data.title);
          // Pode adicionar Share.share() aqui no futuro
        }
      }
    });
    
    // Configurar a Navigation Bar do Android automaticamente
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setBackgroundColorAsync('#374151'); // Mesma cor da tab bar
        NavigationBar.setButtonStyleAsync('light'); // Coerente com o tema escuro
      } catch (error) {
        console.log('Erro ao configurar Navigation Bar:', error);
      }
    }
    
    // Cleanup: remover listeners quando componente desmontar
    return () => {
      notificationResponseSubscription.remove();
    };
  }, []);

  return (
    <LanguageProvider>
      <SafeAreaProvider>
        <Home />
        
        {/* Modal de Oferta de Jogo Vigiado */}
        <WatchedGameDealModal
          visible={dealModalVisible}
          onClose={() => setDealModalVisible(false)}
          gameData={dealData}
        />
        
        {/* Modal de Atualização de App */}
        <UpdateAlertModal
          visible={updateModalVisible}
          currentVersion={currentVersion}
          latestVersion={latestVersion}
          storeUrl={storeUrl}
          onClose={() => setUpdateModalVisible(false)}
        />
      </SafeAreaProvider>
    </LanguageProvider>
  );
}