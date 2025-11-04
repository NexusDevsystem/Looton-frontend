import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { checkWatchedGamesForDeals } from './WatchedGamesNotificationService';

const BACKGROUND_FETCH_TASK = 'WATCHED_GAMES_BACKGROUND_CHECK';

// Definir a tarefa de background
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('🔄 Background Task: Verificando jogos vigiados...');
    
    const notificationCount = await checkWatchedGamesForDeals();
    
    console.log(`✅ Background Task concluída: ${notificationCount} notificação(ões) enviada(s)`);
    
    // Retornar sucesso
    return notificationCount > 0 
      ? BackgroundFetch.BackgroundFetchResult.NewData 
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('❌ Erro na Background Task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Registrar a tarefa de background
export const registerBackgroundFetch = async () => {
  try {
    // Verificar se já está registrada
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    
    if (isRegistered) {
      console.log('✅ Background fetch já está registrada');
      return;
    }

    // Registrar a tarefa para rodar em background
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60 * 60, // 1 hora em segundos (mínimo: 15 minutos)
      stopOnTerminate: false, // Continuar mesmo se o app for fechado
      startOnBoot: true, // Iniciar quando o dispositivo for reiniciado
    });

    console.log('✅ Background fetch registrada com sucesso! Intervalo: 1 hora');
  } catch (error) {
    console.error('❌ Erro ao registrar background fetch:', error);
  }
};

// Desregistrar a tarefa de background
export const unregisterBackgroundFetch = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('✅ Background fetch desregistrada');
  } catch (error) {
    console.error('❌ Erro ao desregistrar background fetch:', error);
  }
};

// Verificar status da tarefa
export const getBackgroundFetchStatus = async () => {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    
    return {
      status,
      isRegistered,
      statusText: getStatusText(status),
    };
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    return null;
  }
};

const getStatusText = (status: BackgroundFetch.BackgroundFetchStatus) => {
  switch (status) {
    case BackgroundFetch.BackgroundFetchStatus.Available:
      return 'Disponível';
    case BackgroundFetch.BackgroundFetchStatus.Denied:
      return 'Negado (usuário desabilitou)';
    case BackgroundFetch.BackgroundFetchStatus.Restricted:
      return 'Restrito (configurações do sistema)';
    default:
      return 'Desconhecido';
  }
};
