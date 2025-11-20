import AsyncStorage from '@react-native-async-storage/async-storage';
import { PcOffer } from './HardwareService';

const HARDWARE_CACHE_KEY = 'hardware_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas em milissegundos

export interface CachedHardwareData {
  items: PcOffer[];
  timestamp: number;
}

export class LocalHardwareCacheService {
  static async saveToCache(items: PcOffer[]): Promise<void> {
    try {
      const cachedData: CachedHardwareData = {
        items,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(HARDWARE_CACHE_KEY, JSON.stringify(cachedData));
    } catch (error) {
      console.error('Erro ao salvar cache de hardware:', error);
    }
  }

  static async getFromCache(): Promise<PcOffer[] | null> {
    try {
      const cachedData = await AsyncStorage.getItem(HARDWARE_CACHE_KEY);
      if (!cachedData) return null;

      const { items, timestamp }: CachedHardwareData = JSON.parse(cachedData);
      
      // Verificar se o cache está expirado
      if (Date.now() - timestamp > CACHE_DURATION) {
        await AsyncStorage.removeItem(HARDWARE_CACHE_KEY);
        return null;
      }

      return items;
    } catch (error) {
      console.error('Erro ao ler cache de hardware:', error);
      return null;
    }
  }

  static async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HARDWARE_CACHE_KEY);
    } catch (error) {
      console.error('Erro ao limpar cache de hardware:', error);
    }
  }
}