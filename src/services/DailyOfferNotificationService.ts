import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Deal } from '../../app/index'; // Importar o tipo Deal do index

// Chave para armazenar a última data que a notificação foi enviada
const LAST_DAILY_OFFER_NOTIFICATION = 'lastDailyOfferNotification';
const DAILY_OFFER_NOTIFICATION_ENABLED = 'dailyOfferNotificationEnabled';

// Configuração inicial do canal de notificação
const setupNotificationChannel = async () => {
  if (Platform.OS === 'android') {
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

  // Verificar se já enviamos hoje
  const shouldSend = await shouldSendDailyOfferNotification();
  if (!shouldSend) {
    console.log('Notificação de Oferta do Dia já enviada hoje');
    return;
  }

  // Configurar o canal de notificação
  await setupNotificationChannel();

  // Obter horário atual e definir para o horário especificado (padrão 12h)
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(timeHour, 0, 0, 0); // Hoje no horário especificado

  // Se o horário já passou hoje, agendar para amanhã
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const timeUntilNotification = scheduledTime.getTime() - now.getTime();

  console.log(`Notificação programada para: ${scheduledTime.toLocaleString()}`);
  console.log(`Tempo até notificação: ${timeUntilNotification} ms`);

  try {
    // Agendar notificação local
    await Notifications.scheduleNotificationAsync({
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
      trigger: null,
    });

    console.log('Notificação de Oferta do Dia agendada com sucesso');
  } catch (error) {
    console.error('Erro ao agendar notificação de Oferta do Dia:', error);
  }
};

// Função para enviar imediatamente a notificação de oferta do dia
export const sendDailyOfferNotification = async (deal: Deal) => {
  // Verificar se opt-in está ativado
  const enabled = await isDailyOfferNotificationEnabled();
  if (!enabled) {
    console.log('Notificações de Oferta do Dia desabilitadas');
    return;
  }

  // Verificar se já enviamos hoje
  const shouldSend = await shouldSendDailyOfferNotification();
  if (!shouldSend) {
    console.log('Notificação de Oferta do Dia já enviada hoje');
    return;
  }

  // Configurar o canal de notificação
  await setupNotificationChannel();

  try {
    await Notifications.scheduleNotificationAsync({
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
      trigger: null, // Enviar imediatamente
    });

    // Marcar que a notificação foi enviada hoje
    await markDailyOfferNotificationSent();
    console.log('Notificação de Oferta do Dia enviada com sucesso');
  } catch (error) {
    console.error('Erro ao enviar notificação de Oferta do Dia:', error);
  }
};

import { Platform } from 'react-native';

// Função para verificar e enviar notificação de oferta do dia se for hora
export const checkAndSendDailyOfferNotification = async (getCurrentDeal: () => Deal | null) => {
  // Verificar se notificações diárias estão habilitadas
  const enabled = await isDailyOfferNotificationEnabled();
  if (!enabled) {
    console.log('Notificações de Oferta do Dia desabilitadas pelo usuário');
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
  } else {
    console.log('Nenhuma oferta do dia disponível para notificação');
  }
};