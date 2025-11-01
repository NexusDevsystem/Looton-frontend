/**
 * Cliente API centralizado com cache, retry e timeout configuráveis
 * Melhora a confiabilidade das requisições e performance do app
 */

import { fetchWithRetry } from './fetchWithRetry';
import { GameDetailsCache } from './gameDetailsCache';

interface ApiClientOptions {
  /** Timeout em ms (padrão: 15000) */
  timeout?: number;
  /** Número de tentativas (padrão: 3) */
  retries?: number;
  /** Delay entre tentativas em ms (padrão: 1000) */
  retryDelay?: number;
  /** Usar cache (padrão: true) */
  useCache?: boolean;
  /** TTL do cache em ms (padrão: 30min) */
  cacheTTL?: number;
  /** Chave customizada para cache */
  cacheKey?: string;
  /** Headers adicionais */
  headers?: Record<string, string>;
  /** Callback para acompanhar tentativas */
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<Omit<ApiClientOptions, 'cacheKey' | 'headers' | 'onRetry'>> = {
  timeout: 15000,
  retries: 3,
  retryDelay: 1000,
  useCache: true,
  cacheTTL: 30 * 60 * 1000, // 30 minutos
};

/**
 * Executa uma requisição GET com cache, retry e timeout
 */
export async function apiGet<T = any>(
  url: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // 1. Verificar cache primeiro (se habilitado)
  if (opts.useCache) {
    const cacheKey = options.cacheKey || url;
    const cached = await GameDetailsCache.get<T>(cacheKey);
    
    if (cached) {
      console.log(`✅ Cache hit: ${url}`);
      return cached;
    }
  }

  // 2. Fazer requisição com retry
  console.log(`🌐 API Request: ${url}`);
  
  const response = await fetchWithRetry(url, {
    timeout: opts.timeout,
    retries: opts.retries,
    retryDelay: opts.retryDelay,
    onRetry: options.onRetry || ((attempt, error) => {
      console.log(`⚠️ Retry ${attempt}/3: ${error.message}`);
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data: T = await response.json();

  // 3. Salvar no cache (se habilitado)
  if (opts.useCache) {
    const cacheKey = options.cacheKey || url;
    await GameDetailsCache.set(cacheKey, data, opts.cacheTTL);
    console.log(`💾 Cached: ${url}`);
  }

  return data;
}

/**
 * Executa uma requisição POST (sem cache)
 */
export async function apiPost<T = any>(
  url: string,
  body: any,
  options: ApiClientOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options, useCache: false };

  console.log(`🌐 API POST: ${url}`);

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
    timeout: opts.timeout,
    retries: opts.retries,
    retryDelay: opts.retryDelay,
    onRetry: options.onRetry || ((attempt, error) => {
      console.log(`⚠️ Retry ${attempt}/3: ${error.message}`);
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Limpa o cache de uma URL específica ou todo o cache
 */
export async function clearApiCache(url?: string): Promise<void> {
  if (url) {
    await GameDetailsCache.remove(url);
    console.log(`🗑️ Cache cleared: ${url}`);
  } else {
    await GameDetailsCache.clear();
    console.log('🗑️ All cache cleared');
  }
}

/**
 * Verifica conectividade com o servidor
 */
export async function checkApiConnection(baseUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${baseUrl}/health`, {
      signal: controller.signal,
      method: 'HEAD',
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('❌ API não acessível');
    return false;
  }
}
