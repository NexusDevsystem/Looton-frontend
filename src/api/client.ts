
import Constants from 'expo-constants'

// Prefer EXPO_PUBLIC_API_URL when set and not pointing to localhost. Otherwise, try Expo host for device testing.
export const API_URL = (() => {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL as string | undefined
  
  // Em modo de desenvolvimento local, usar localhost se não estivermos em produção
  if (__DEV__ && !process.env.EXPO_PUBLIC_EAS_BUILD) {
    // Se estiver em desenvolvimento local, verificar se temos uma URL de dev definida
    const devUrl = process.env.EXPO_PUBLIC_API_URL_DEV || process.env.EXPO_PUBLIC_API_URL_LOCAL
    if (devUrl) return devUrl
    
    // Caso contrário, tentar detectar automaticamente o host local
    try {
      const hostUri: any = (Constants as any)?.expoConfig?.hostUri
      if (hostUri) {
        const host = String(hostUri).split(':')[0]
        if (host && host !== 'localhost') return `http://${host}:3000`
      }
    } catch {}
    
    // Se nada funcionar, retornar localhost para desenvolvimento local
    return 'http://localhost:3000'
  }
  
  // Em produção ou durante build EAS, usar a URL configurada explicitamente
  if (fromEnv && !fromEnv.includes('localhost')) return fromEnv
  
  // Fallback para produção se nenhuma URL estiver definida
  if (!fromEnv) {
    console.error('⚠️ AVISO: EXPO_PUBLIC_API_URL não está definida. A API não funcionará corretamente.')
    // Retornar uma URL padrão que pode ser substituída por configuração posterior
    return 'https://looton-api-placeholder-url.com'
  }
  
  return fromEnv
})()

async function buildInit(init?: RequestInit) {
  const headers: any = init?.headers ? { ...(init?.headers as any) } : {}
  return { ...(init || {}), headers }
}

async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, timeout = 20000) { // Aumentei para 20 segundos
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    // Adicionando mais configurações para lidar com serviços Render
    const res = await fetch(input, { 
      ...(init || {}), 
      signal: controller.signal,
      headers: {
        ...((init?.headers as any) || {}),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Adicionando modo CORS explicitamente
      mode: 'cors',
      // Adicionando credenciais se necessário
      credentials: 'omit'
    } as any)
    clearTimeout(id)
    return res
  } catch (err: any) {
    clearTimeout(id)
    if (err.name === 'AbortError') throw new Error(`Request timed out after ${timeout}ms`)
    throw err
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const finalInit = await buildInit(init)
  let res: Response
  try {
    res = await fetchWithTimeout(`${API_URL}${path}`, finalInit)
  } catch (err: any) {
    throw new Error(`Network error: ${err.message || String(err)}`)
  }

  if (!res.ok) {
    let body: any = null
    try { body = await res.json() } catch (e) {}
    const msg = (body && (body.message || body.error)) || `HTTP ${res.status}`
    throw new Error(msg)
  }

  return res.json()
}



// Price History API
export interface PriceHistoryData {
  gameId: string
  gameTitle: string
  period: string
  chartData: Array<{
    date: string
    prices: Record<string, number>
  }>
  currentPrices: Record<string, { price: number; date: string }>
  statistics: {
    lowest: number
    highest: number
    average: number
    lowestDate: string
    lowestStore: string
    dataPoints: number
  } | null
  alerts: {
    isBestPriceEver: boolean
    bestPriceAlert: any | null
  }
  notice?: string // Informação sobre a fonte dos dados
}

export async function fetchPriceHistory(gameId: string, days = 90): Promise<PriceHistoryData> {
  try {
    const res = await fetchWithTimeout(`${API_URL}/price-history/${gameId}?days=${days}`)
    if (!res.ok) {
      let body: any = null
      try { body = await res.json() } catch (e) {}
      const msg = (body && (body.message || body.error)) || `HTTP ${res.status}`
      throw new Error(msg)
    }
    return res.json()
  } catch (err: any) {
    throw new Error(err.message || 'Network error')
  }
}
