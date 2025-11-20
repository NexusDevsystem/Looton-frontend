// AuthService removido - autenticação não é mais necessária
// Este arquivo é mantido apenas para evitar erros de importação
// As funções retornam valores padrão

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

const DEVICE_ID_KEY = '@looton:device_id';

interface AuthServiceType {
  isAuthenticated: () => Promise<boolean>;
  loadToken: () => Promise<string | null>;
  ensureDeviceId: () => Promise<string>;
}

export const isAuthenticated = async (): Promise<boolean> => {
  // Sem autenticação - sempre retorna falso
  return false;
};

export const loadToken = async (): Promise<string | null> => {
  // Sem tokens de autenticação - sempre retorna null
  return null;
};

export const ensureDeviceId = async (): Promise<string> => {
  try {
    // Verificar se já existe um deviceId salvo
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    
    if (deviceId) {
      return deviceId;
    }
    
    // Gerar um ID único baseado em informações do dispositivo
    const androidId = await Application.getAndroidId();
    const installationId = Constants.sessionId || Constants.installationId;
    
    // Usar androidId se disponível, senão usar installationId com timestamp
    if (androidId) {
      deviceId = `android_${androidId}`;
    } else if (installationId) {
      deviceId = `device_${installationId}`;
    } else {
      // Fallback: gerar ID único baseado em timestamp + random
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 11);
      deviceId = `anon_${timestamp}_${random}`;
    }
    
    // Salvar para uso futuro
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    console.log('✅ Device ID gerado e salvo:', deviceId);
    
    return deviceId;
  } catch (error) {
    console.error('❌ Erro ao obter device ID:', error);
    // Fallback em caso de erro
    return `fallback_${Date.now()}`;
  }
};

export const AuthService: AuthServiceType = {
  isAuthenticated,
  loadToken,
  ensureDeviceId
};

export default AuthService;