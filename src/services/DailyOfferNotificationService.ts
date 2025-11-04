import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Deal } from '../../app/index'; // Importar o tipo Deal do index

// Chave para armazenar a última data que a notificação foi enviada
const LAST_DAILY_OFFER_NOTIFICATION = 'lastDailyOfferNotification';
const DAILY_OFFER_NOTIFICATION_ENABLED = 'dailyOfferNotificationEnabled';

// Apenas para garantir que o canal exista - o canal já é configurado em App.tsx
const setupNotificationChannel = async () => {
  // O canal já é configurado em App.tsx, então esta função é apenas uma garantia adicional
  if (Platform.OS === 'android') {
    try {
      // Tentar obter o canal para verificar se está configurado corretamente
      const channel = await Notifications.getNotificationChannelAsync('daily-offers');
      if (!channel) {
        // Configurar novamente se não existir
        await Notifications.setNotificationChannelAsync('daily-offers', {
          name: 'Ofertas Diárias',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FFD700',
          enableLights: true,
          showBadge: true,
        });
      }
    } catch (error) {
      console.warn('Erro ao verificar canal de notificação:', error);
    }
  }
};

// Função para verificar se as notificações diárias estão habilitadas
export const isDailyOfferNotificationEnabled = async (): Promise<boolean> => {
  const enabled = await AsyncStorage.getItem(DAILY_OFFER_NOTIFICATION_ENABLED);
  return enabled === 'true';
};

// Função para habilitar/desabilitar notificações diárias
export const setDailyOfferNotificationEnabled = async (enabled: boolean) => {
  await AsyncStorage.setItem(DAILY_OFFER_NOTIFICATION_ENABLED, enabled.toString());
  if (!enabled) {
    // Cancelar agendamentos existentes se estiver desativando
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
};

// Função para verificar se já enviamos a notificação hoje
export const shouldSendDailyOfferNotification = async (): Promise<boolean> => {
  const lastNotificationDate = await AsyncStorage.getItem(LAST_DAILY_OFFER_NOTIFICATION);
  const today = new Date().toDateString();
  
  // Se for um novo dia ou se nunca foi enviado antes, enviar notificação
  return lastNotificationDate !== today;
};

// Função para marcar que a notificação foi enviada hoje
export const markDailyOfferNotificationSent = async () => {
  await AsyncStorage.setItem(LAST_DAILY_OFFER_NOTIFICATION, new Date().toDateString());
};

// Função para agendar notificação de oferta do dia
export const scheduleDailyOfferNotification = async (deal: Deal, timeHour: number = 12) => {
  // Verificar se opt-in está ativado
  const enabled = await isDailyOfferNotificationEnabled();
  if (!enabled) {
    console.log('Notificações de Oferta do Dia desabilitadas');
    return;
  }

  // Configurar o canal de notificação
  await setupNotificationChannel();

  // Cancelar todas as notificações anteriores de oferta do dia
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduledNotifications) {
    if (notification.content.data?.type === 'daily_offer') {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  // Calcular horário da primeira notificação (hoje às 12h ou amanhã se já passou)
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(timeHour, 0, 0, 0);

  // Se o horário já passou hoje, agendar para amanhã
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const secondsUntilFirst = Math.floor((scheduledTime.getTime() - now.getTime()) / 1000);

  console.log(`📅 Notificação diária programada para: ${scheduledTime.toLocaleString()}`);
  console.log(`⏰ Primeira notificação em ${secondsUntilFirst} segundos (${Math.floor(secondsUntilFirst / 3600)}h)`);

  try {
    // Agendar notificação DIÁRIA (repeats: true a cada 24h)
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Oferta do Dia! 🎮",
        body: `Confira ${deal.game?.title || 'esta oferta'} por apenas ${deal.priceFinal?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'preço especial'} na ${deal.store?.name || 'loja'}!`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { 
          dealId: deal._id,
          dealUrl: deal.url,
          type: 'daily_offer'
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: timeHour,
        minute: 0,
      },
    });

    console.log('✅ Notificação diária agendada com sucesso! ID:', notificationId);
    console.log('🔁 A notificação se repetirá todos os dias às', `${timeHour}:00`);
    
    return notificationId;
  } catch (error) {
    console.error('❌ Erro ao agendar notificação diária:', error);
  }
};

// Função para enviar imediatamente a notificação de oferta do dia
export const sendDailyOfferNotification = async (deal: Deal) => {
  // Configurar o canal de notificação ANTES
  await setupNotificationChannel();

  try {
    // Usar scheduleNotificationAsync com trigger: null para envio IMEDIATO
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Oferta do Dia! 🎮",
        body: `Confira ${deal.game?.title || 'esta oferta'} por apenas ${deal.priceFinal?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'preço especial'} na ${deal.store?.name || 'loja'}!`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        color: '#3B82F6', // Cor azul do Looton
        vibrate: [0, 250, 250, 250],
        badge: 1,
        data: { 
          dealId: deal._id,
          dealUrl: deal.url,
          type: 'daily_offer'
        },
      },
      trigger: null, // NULL = enviar IMEDIATAMENTE
    });

    console.log('✅ Notificação de Oferta do Dia enviada com sucesso! ID:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('❌ Erro ao enviar notificação de Oferta do Dia:', error);
    throw error;
  }
};

// Versão separada para uso em testes que ignora a lógica de controle diário
export const sendDailyOfferNotificationTest = async (deal: Deal) => {
  // Configurar o canal de notificação ANTES
  await setupNotificationChannel();

  try {
    // Usar scheduleNotificationAsync com delay mínimo para aparecer na barra
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🧪 TESTE: Oferta do Dia!",
        body: `${deal.game?.title || 'Jogo de Teste'} por ${deal.priceFinal?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'} na ${deal.store?.name || 'loja'}! 🎮`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        color: '#3B82F6', // Cor azul do Looton
        vibrate: [0, 250, 250, 250],
        badge: 1,
        sticky: false,
        autoDismiss: true,
        data: { 
          dealId: deal._id,
          dealUrl: deal.url,
          type: 'daily_offer_test'
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1, // 1 segundo de delay para garantir que apareça na barra
        repeats: false,
      },
    });

    console.log('✅ Notificação de TESTE agendada para 1s! ID:', notificationId);
    console.log('💡 Minimize o app ou aguarde 1 segundo para ver a notificação na barra!');
    return notificationId;
  } catch (error) {
    console.error('❌ Erro ao enviar notificação de teste:', error);
    throw error;
  }
};

// Função para enviar notificação de jogo vigiado em promoção
export const sendWatchedGamePromotionNotification = async (game: any, oldPrice: number, newPrice: number) => {
  // Configurar o canal de notificação ANTES
  await setupNotificationChannel();

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🎉 Promoção Detectada!",
        body: `${game.title || 'Jogo em Vigilância'} está em promoção! De R$${oldPrice.toFixed(2)} por R$${newPrice.toFixed(2)} na ${game.store || 'loja'}! 🎮`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        color: '#10B981', // Cor verde para promoções
        vibrate: [0, 250, 250, 250],
        badge: 1,
        data: { 
          dealId: game._id || game.appId,
          dealUrl: game.url,
          type: 'watched_game_promotion'
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1, // 1 segundo de delay para garantir que apareça na barra
        repeats: false,
      },
    });

    console.log('✅ Notificação de jogo vigiado em promoção enviada! ID:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('❌ Erro ao enviar notificação de jogo vigiado em promoção:', error);
    throw error;
  }
};

// Função para verificar e enviar notificação de oferta do dia se for hora
export const checkAndSendDailyOfferNotification = async (getCurrentDeal: () => Deal | null) => {
  // Verificar se notificações diárias estão habilitadas
  const enabled = await isDailyOfferNotificationEnabled();
  if (!enabled) {
    console.log('Notificações de Oferta do Dia desabilitadas pelo usuário');
    return;
  }

  // Verificar a hora atual
  const now = new Date();
  const currentHour = now.getHours();
  
  // Só enviar notificação se estiver entre 12h e 13h (janela de 1 hora ao meio-dia)
  const isNoonTime = currentHour >= 12 && currentHour < 13;
  
  if (!isNoonTime) {
    console.log('Fora do horário de notificação de Oferta do Dia (12h-13h). Hora atual:', currentHour);
    return;
  }

  // Verificar se já enviamos hoje
  const shouldSend = await shouldSendDailyOfferNotification();
  if (!shouldSend) {
    console.log('Notificação de Oferta do Dia já foi enviada hoje');
    return;
  }

  // Obter a oferta do dia (você precisa de uma função para pegar a oferta atual)
  const dailyDeal = getCurrentDeal();
  if (dailyDeal) {
    await sendDailyOfferNotification(dailyDeal);
    await markDailyOfferNotificationSent(); // Marcar como enviada
    console.log('✅ Notificação de Oferta do Dia enviada ao meio-dia!');
  } else {
    console.log('Nenhuma oferta do dia disponível para notificação');
  }
};

// Função para TESTE: agendar notificação para daqui a 2 minutos (usa TIME_INTERVAL recorrente)
export const scheduleDailyOfferNotificationTestInterval = async () => {
  console.log('🧪 TESTE: Agendando notificação para daqui a 2 minutos...');
  
  // Configurar o canal de notificação
  await setupNotificationChannel();

  // Cancelar todas as notificações anteriores de teste
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduledNotifications) {
    if (notification.content.data?.type === 'daily_offer_test_interval') {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  try {
    // Agendar notificação para 2 minutos (120 segundos)
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🧪 TESTE: Oferta do Dia! 🎮",
        body: "Esta é uma notificação de teste! Você receberá isso a cada 2 minutos enquanto o teste estiver ativo.",
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { 
          type: 'daily_offer_test_interval'
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 120, // 2 minutos
        repeats: true, // Repetir a cada 2 minutos
      },
    });

    console.log('✅ Notificação de TESTE agendada! ID:', notificationId);
    console.log('📅 Você receberá notificações a cada 2 minutos');
    console.log('💡 FECHE O APP AGORA para testar notificação com app fechado!');
    
    return notificationId;
  } catch (error) {
    console.error('❌ Erro ao agendar notificação de teste:', error);
  }
};

// Função para cancelar o teste de notificações
export const cancelDailyOfferNotificationTest = async () => {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  let canceledCount = 0;
  
  for (const notification of scheduledNotifications) {
    if (notification.content.data?.type === 'daily_offer_test_interval') {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      canceledCount++;
    }
  }
  
  console.log(`🛑 Canceladas ${canceledCount} notificações de teste`);
  return canceledCount;
};