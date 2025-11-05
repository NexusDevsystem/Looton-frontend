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

// Configurar handler para PERMITIR que notifica├º├Áes apare├ºam nativamente
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
    // Configurar categorias de notifica├º├úo com bot├Áes de a├º├úo
    const setupNotificationCategories = async () => {
      await Notifications.setNotificationCategoryAsync('WATCHED_GAME_PROMOTION', [
        {
          identifier: 'VIEW_DEAL',
          buttonTitle: '­ƒøÆ Ver Oferta',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'SHARE_DEAL',
          buttonTitle: '­ƒôñ Compartilhar',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);
      console.log('Ô£à Categorias de notifica├º├úo configuradas');
    };

    // Garantir que os canais de notifica├º├úo estejam configurados desde o in├¡cio
    const setupNotificationChannels = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Notifica├º├Áes',
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
          name: 'Ofertas Di├írias',
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
          description: 'Notifica├º├Áes para voc├¬ n├úo perder as melhores ofertas',
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
      // Configurar canais de notifica├º├úo primeiro
      await setupNotificationChannels();
      
      // Configurar categorias de notifica├º├úo com bot├Áes de a├º├úo
      await setupNotificationCategories();
      
      // Inicializar o AdMob com o Application ID - removido para evitar crash
      
      // Verificar updates (desabilitado para estabilidade)
      try {
        checkUpdatesOnce(true);
      } catch (error) {
        console.log('Updates check skipped:', error);
      }
      
      // Pedir permiss├úo de notifica├º├Áes na primeira execu├º├úo
      try {
        const projectId = '41306841-8939-4568-a1a1-af93af0428d1';
        const token = await askPushPermissionFirstLaunch(projectId);
        
        if (token) {
          console.log('­ƒô▒ Push token obtido:', token);
          
          // Enviar token para o backend - ├ÜNICO PASSO NECESS├üRIO!
          // Backend cuidar├í de TODAS as notifica├º├Áes automaticamente
          await sendPushTokenToBackend(token);
          
          console.log('Ô£à Push token registrado no backend');
          console.log('Ô£à Voc├¬ receber├í notifica├º├Áes automaticamente:');
          console.log('   - Ofertas do Dia: 12h e 18h');
          console.log('   - Jogos Vigiados: quando pre├ºo cair');
        } else {
          console.log('­ƒô▒ Permiss├úo de notifica├º├úo n├úo concedida ou j├í perguntada antes');
        }
      } catch (error) {
        console.error('Erro ao configurar notifica├º├Áes:', error);
      }
      
      // Ô£à TODAS as notifica├º├Áes s├úo enviadas pelo BACKEND!
      // N├úo h├í mais notifica├º├Áes locais ou background fetch
      // Sistema 100% remoto e confi├ível
    };

    initializeApp();
    
    // Verificar se h├í atualiza├º├Áes dispon├¡veis
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
        console.error('Erro ao verificar atualiza├º├Áes:', error);
      }
    };
    
    // Executar verifica├º├úo de atualiza├º├Áes ap├│s a inicializa├º├úo do app
    setTimeout(() => {
      checkForAppUpdates();
    }, 2000); // Pequeno atraso para garantir que o app esteja totalmente carregado
    
    // ÔÜá´©Å REMOVIDO: Listener de reagendamento (causava notifica├º├Áes duplicadas)
    // As notifica├º├Áes push J├ü aparecem nativamente no Android
    // O hist├│rico ├® gerenciado em app/index.tsx
    
    // Listener APENAS para a├º├Áes de notifica├º├úo (quando usu├írio clica)
    const notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const { actionIdentifier, notification } = response;
      const data = notification.request.content.data;
      
      console.log('­ƒöö A├º├úo de notifica├º├úo:', actionIdentifier);
      console.log('­ƒôª Dados:', data);
      
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
          console.log('­ƒøÆ Bot├úo "Ver Oferta" pressionado');
          // O modal j├í vai lidar com isso
        } else if (actionIdentifier === 'SHARE_DEAL') {
          console.log('­ƒôñ Compartilhando:', data.title);
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
        
        {/* Modal de Atualiza├º├úo de App */}
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
