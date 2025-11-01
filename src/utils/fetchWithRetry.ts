/**
 * Utilitário para fazer fetch com retry automático e timeout
 */

interface FetchWithRetryOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Faz fetch com retry automático em caso de falha
 * 
 * @param url - URL para fazer o fetch
 * @param options - Opções de configuração
 * @returns Promise com a Response
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    method,
    headers,
    body,
    timeout = 15000, // 15 segundos (aumentado de 8s)
    retries = 3,
    retryDelay = 1000,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Criar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...headers,
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Se resposta OK, retorna
      if (response.ok) {
        return response;
      }

      // Se erro 404, não tenta novamente
      if (response.status === 404) {
        throw new Error(`Recurso não encontrado: ${url}`);
      }

      // Para outros erros HTTP, tenta novamente
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;

      // Se foi AbortError (timeout) ou erro de rede, tenta novamente
      const isRetryableError =
        lastError.name === 'AbortError' ||
        lastError.message.includes('Network request failed') ||
        lastError.message.includes('Failed to fetch');

      // Se não é erro tentável ou última tentativa, lança erro
      if (!isRetryableError || attempt === retries) {
        throw lastError;
      }

      // Notifica sobre retry
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Aguarda antes de tentar novamente (exponential backoff)
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Se chegou aqui, todas as tentativas falharam
  throw lastError || new Error('Falha desconhecida após todas as tentativas');
}
