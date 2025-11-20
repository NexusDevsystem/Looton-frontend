import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { api } from './api/client';

const ASK_FLAG = 'pushAsked.v1'; // mude versão se quiser reprompt no futuro
const PUSH_TOKEN_SAVED_FLAG = 'pushTokenSaved.v1';

async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notificações',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

/** Pede permissão apenas na primeira abertura. Retorna o Expo Push Token ou null. */
export async function askPushPermissionFirstLaunch(projectId: string): Promise<string | null> {
  // já perguntamos antes?
  const asked = await AsyncStorage.getItem(ASK_FLAG);
  if (asked) {
    // já perguntado: só retorna token se já estiver concedido
    const perm = await Notifications.getPermissionsAsync();
    if (perm.status !== 'granted') return null;
    await ensureAndroidChannel();
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data ?? null;
  }

  // 1ª vez: marca como perguntado (para não spammar caso o app reinicie)
  await AsyncStorage.setItem(ASK_FLAG, '1');

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: true },
      android: { alarm: true }, // Android 13+ mostra prompt nativo
    });
    status = req.status;
  }

  if (status !== 'granted') return null;

  await ensureAndroidChannel();
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  const pushToken = token.data ?? null;
  
  // Enviar token para o backend se não foi enviado antes
  if (pushToken) {
    await sendPushTokenToBackend(pushToken);
  }
  
  return pushToken;
}

/** Opcional: resetar o flag (útil num botão "tentar de novo") */
export async function resetPushAskFlag() {
  await AsyncStorage.removeItem(ASK_FLAG);
}

/** Verificar se já foi perguntado antes */
export async function hasAskedPushPermissionBefore(): Promise<boolean> {
  const asked = await AsyncStorage.getItem(ASK_FLAG);
  return asked !== null;
}

/** Tentar obter token atual sem perguntar novamente */
export async function getCurrentPushToken(projectId: string): Promise<string | null> {
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (perm.status !== 'granted') return null;
    
    await ensureAndroidChannel();
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data ?? null;
  } catch (error) {
    console.error('Erro ao obter push token:', error);
    return null;
  }
}

/** Forçar pedido de permissão (para botão "Ativar notificações" nas configurações) */
export async function forcePushPermissionRequest(projectId: string): Promise<string | null> {
  try {

    const req = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: true },
      android: { alarm: true },
    });

    if (req.status !== 'granted') return null;

    await ensureAndroidChannel();
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    const pushToken = token.data ?? null;
    
    // Enviar token para o backend se não foi enviado antes
    if (pushToken) {
      await sendPushTokenToBackend(pushToken);
    }
    
    return pushToken;
  } catch (error) {
    console.error('Erro ao forçar permissão:', error);
    return null;
  }
}

/** Enviar push token para o backend */
export async function sendPushTokenToBackend(pushToken: string, email?: string) {
  try {
    // Obter deviceId único e persistente
    const { ensureDeviceId } = await import('./services/AuthService');
    const userId = await ensureDeviceId();
    
    // SEMPRE enviar o token para garantir que está atualizado no backend
    console.log('📤 Enviando push token para o backend...');

    // Enviar para o backend com userId em vez de email
    await api('/users', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ 
        userId: userId,
        pushToken: pushToken 
      }) 
    });
    
    console.log('✅ Push token enviado para o backend com userId:', userId);
    console.log('✅ Token:', pushToken);
  } catch (error) {
    console.error('❌ Erro ao enviar push token para o backend:', error);
  }
}