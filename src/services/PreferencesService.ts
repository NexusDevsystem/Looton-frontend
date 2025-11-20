/**
 * PreferencesService
 * Gerencia preferências do usuário (local + backend)
 * Garante sincronização e deviceId para anônimos
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences, DEFAULT_PREFERENCES } from '../types/preferences';
import { api } from '../api/client';

const PREFERENCES_STORAGE_KEY = '@looton_user_preferences';
const DEVICE_ID_STORAGE_KEY = '@looton_device_id';

/**
 * Gera um deviceId único para usuários anônimos
 */
function generateDeviceId(): string {
  return `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Carrega preferências locais
 */
export async function loadLocalPreferences(): Promise<UserPreferences | null> {
  try {
    const stored = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!stored) return null;
    
    const prefs: UserPreferences = JSON.parse(stored);
    
    // Validar estrutura
    if (!prefs.deviceId || !prefs.lastUpdated) {
      console.warn('PreferencesService: Preferências inválidas, resetando');
      return null;
    }
    
    return prefs;
  } catch (error) {
    console.error('PreferencesService: Erro ao carregar preferências locais', error);
    return null;
  }
}

/**
 * Salva preferências localmente
 */
export async function saveLocalPreferences(preferences: UserPreferences): Promise<void> {
  try {
    const toSave = {
      ...preferences,
      lastUpdated: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(toSave));
    console.log('PreferencesService: Preferências salvas localmente');
  } catch (error) {
    console.error('PreferencesService: Erro ao salvar preferências locais', error);
    throw error;
  }
}

/**
 * Obtém ou cria deviceId
 */
export async function getOrCreateDeviceId(): Promise<string> {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
    
    if (!deviceId) {
      deviceId = generateDeviceId();
      await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
      console.log('PreferencesService: Novo deviceId gerado', deviceId.substring(0, 20) + '...');
    }
    
    return deviceId;
  } catch (error) {
    console.error('PreferencesService: Erro ao obter deviceId', error);
    return generateDeviceId();
  }
}

/**
 * Reseta deviceId (para privacidade)
 */
export async function resetDeviceId(): Promise<string> {
  try {
    const newDeviceId = generateDeviceId();
    await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, newDeviceId);
    console.log('PreferencesService: DeviceId resetado');
    return newDeviceId;
  } catch (error) {
    console.error('PreferencesService: Erro ao resetar deviceId', error);
    throw error;
  }
}

/**
 * Carrega preferências (local primeiro, depois tenta sync com backend)
 */
export async function loadPreferences(userId?: string): Promise<UserPreferences> {
  try {
    // 1. Carregar local
    const localPrefs = await loadLocalPreferences();
    
    // 2. Obter deviceId
    const deviceId = await getOrCreateDeviceId();
    
    // 3. Se não tem local, criar default
    if (!localPrefs) {
      const defaultPrefs: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        deviceId,
        userId,
      };
      await saveLocalPreferences(defaultPrefs);
      return defaultPrefs;
    }
    
    // 4. Se tem userId, tentar sync com backend
    if (userId) {
      try {
        const serverPrefs = await api<{ preferences: UserPreferences }>(`/api/preferences/${userId}`);
        if (serverPrefs && serverPrefs.preferences) {
          const mergedPrefs: UserPreferences = {
            ...serverPrefs.preferences,
            deviceId,
            userId,
          };
          
          // Merge: servidor wins mas mantém deviceId local
          await saveLocalPreferences(mergedPrefs);
          return mergedPrefs;
        }
      } catch (backendError: any) {
        console.warn('PreferencesService: Backend indisponível, usando local', backendError.message);
      }
    }
    
    // 5. Retornar local
    return { ...localPrefs, deviceId, userId };
  } catch (error) {
    console.error('PreferencesService: Erro ao carregar preferências', error);
    
    // Fallback: retornar default
    const deviceId = await getOrCreateDeviceId();
    return {
      ...DEFAULT_PREFERENCES,
      deviceId,
      userId,
    };
  }
}

/**
 * Salva preferências (local + backend se userId disponível)
 */
export async function savePreferences(
  preferences: Partial<UserPreferences>,
  userId?: string
): Promise<UserPreferences> {
  try {
    const deviceId = await getOrCreateDeviceId();
    
    const fullPrefs: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      ...preferences,
      deviceId,
      userId,
      lastUpdated: new Date().toISOString(),
      version: 1,
    };
    
    // 1. Salvar local sempre
    await saveLocalPreferences(fullPrefs);
    
    // 2. Tentar salvar no backend
    if (userId) {
      try {
        await api('/api/preferences', {
          method: 'POST',
          body: JSON.stringify({
            userId,
            preferences: fullPrefs,
          }),
        });
        console.log('PreferencesService: Preferências sincronizadas com backend');
      } catch (backendError) {
        console.warn('PreferencesService: Falha ao sincronizar com backend, salvo localmente', backendError);
        // Não lançar erro - local é suficiente
      }
    } else {
      // Anônimo: salvar com deviceId
      try {
        await api('/api/preferences/anonymous', {
          method: 'POST',
          body: JSON.stringify({
            deviceId,
            preferences: fullPrefs,
          }),
        });
      } catch (backendError) {
        // Ignorar erro silenciosamente para anônimos
        console.warn('PreferencesService: Falha ao sync anônimo, continuando', backendError);
      }
    }
    
    return fullPrefs;
  } catch (error) {
    console.error('PreferencesService: Erro ao salvar preferências', error);
    throw error;
  }
}

/**
 * Marca onboarding como completo
 */
export async function completeOnboarding(
  genres: string[],
  subPreferences?: any,
  userId?: string
): Promise<UserPreferences> {
  const prefs = await savePreferences(
    {
      genres: genres as any,
      subPreferences,
      onboardingCompleted: true,
    },
    userId
  );
  
  return prefs;
}

/**
 * Verifica se onboarding foi completo
 */
export async function isOnboardingCompleted(): Promise<boolean> {
  try {
    const prefs = await loadLocalPreferences();
    return prefs?.onboardingCompleted ?? false;
  } catch (error) {
    return false;
  }
}

/**
 * Reseta todas as preferências (para testes ou privacidade)
 */
export async function resetPreferences(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFERENCES_STORAGE_KEY);
    console.log('PreferencesService: Preferências resetadas');
  } catch (error) {
    console.error('PreferencesService: Erro ao resetar preferências', error);
    throw error;
  }
}
