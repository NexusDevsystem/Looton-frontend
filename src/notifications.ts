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
    // Verificar se o token já foi enviado antes para evitar envios duplicados
    const tokenSaved = await AsyncStorage.getItem(PUSH_TOKEN_SAVED_FLAG);
    if (tokenSaved === pushToken) {
      console.log('Push token já foi enviado para o backend');
      return;
    }

    // Se não tiver email, tentar obter do AsyncStorage ou usar um valor padrão
    let userEmail = email;
    if (!userEmail) {
      // Aqui você pode implementar a lógica para obter o email do usuário logado
      // Por enquanto, vamos usar um placeholder - em produção isso viria da sessão do usuário
      userEmail = 'user@looton.app'; // Placeholder - substituir com valor real do usuário
    }

    // Enviar para o backend
    await api('/users', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ 
        email: userEmail, 
        pushToken: pushToken 
      }) 
    });
    
    // Salvar flag indicando que o token foi enviado
    await AsyncStorage.setItem(PUSH_TOKEN_SAVED_FLAG, pushToken);
    console.log('Push token enviado para o backend com sucesso');
  } catch (error) {
    console.error('Erro ao enviar push token para o backend:', error);
  }
}