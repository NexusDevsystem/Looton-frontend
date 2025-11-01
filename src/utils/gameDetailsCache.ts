import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_PREFIX = 'game_details_cache_';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

export class GameDetailsCache {
  /**
   * Salva dados no cache
   */
  static async set<T>(key: string, data: T, customTTL?: number): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        `${CACHE_PREFIX}${key}`,
        JSON.stringify(entry)
      );
    } catch (error) {
      console.error('Erro ao salvar cache:', error);
    }
  }

  /**
   * Busca dados do cache
   * Retorna null se não existir ou estiver expirado
   */
  static async get<T>(key: string, customTTL?: number): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      const ttl = customTTL || CACHE_TTL;
      const isExpired = Date.now() - entry.timestamp > ttl;

      if (isExpired) {
        // Remove cache expirado
        await this.remove(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Erro ao ler cache:', error);
      return null;
    }
  }

  /**
   * Remove um item específico do cache
   */
  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (error) {
      console.error('Erro ao remover cache:', error);
    }
  }

  /**
   * Limpa todo o cache de detalhes de jogos
   */
  static async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`🗑️ ${cacheKeys.length} itens removidos do cache`);
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }
}
