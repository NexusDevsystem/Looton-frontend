import * as AuthService from '../services/AuthService'
import Constants from 'expo-constants'

// Prefer EXPO_PUBLIC_API_URL when set and not pointing to localhost. Otherwise, try Expo host for device testing.
export const API_URL = (() => {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL as string | undefined
  if (fromEnv && !fromEnv.includes('localhost')) return fromEnv
  try {
    const hostUri: any = (Constants as any)?.expoConfig?.hostUri
    if (hostUri) {
      const host = String(hostUri).split(':')[0]
      if (host && host !== 'localhost') return `http://${host}:3000`
    }
  } catch {}
  return fromEnv || 'http://localhost:3000'
})()

async function buildInit(init?: RequestInit) {
  const token = await AuthService.loadToken?.()
  const headers: any = init?.headers ? { ...(init?.headers as any) } : {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return { ...(init || {}), headers }
}

async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, timeout = 10000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(input, { ...(init || {}), signal: controller.signal } as any)
    clearTimeout(id)
    return res
  } catch (err: any) {
    clearTimeout(id)
    if (err.name === 'AbortError') throw new Error('Request timed out')
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

export async function authRegister(email: string, password: string, username?: string) {
  try {
    const deviceId = await AuthService.ensureDeviceId()
    const body = { email, password, username, deviceId }
    const res = await fetchWithTimeout(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
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

export async function authLogin(email: string, password: string) {
  try {
    const deviceId = await AuthService.ensureDeviceId()
    const res = await fetchWithTimeout(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, deviceId }) })
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

export async function authGoogle(idToken: string) {
  try {
    const deviceId = await AuthService.ensureDeviceId()
    const res = await fetchWithTimeout(`${API_URL}/auth/google`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken, deviceId }) })
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
