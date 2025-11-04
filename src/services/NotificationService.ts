import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
// Simplified device detection - assume always device
const Device = { isDevice: true }

// Configurar comportamento das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})


// Lightweight types and helpers for notification rules and evaluation

export type Currency = string

export type WatchRule = {
  id: string
  type: 'studio' | 'franchise' | 'game' | 'store'
  query: string // e.g. 'FromSoftware' or 'Dark Souls' or game id
  enabled?: boolean
}

export type PriceWindow = {
  id: string
  gameId?: string
  store?: string
  min?: number // inclusive
  max?: number // inclusive
  enabled?: boolean
}

export type MuteEntry = {
  id: string
  targetType: 'game' | 'store'
  targetId: string
  until: number // timestamp (ms)
}

export type Deal = {
  _id: string
  appId?: number
  url: string
  priceBase: number
  priceFinal: number
  discountPct: number
  game: { title: string; coverUrl?: string; developer?: string }
  store: { name: string }
}

const STORAGE_KEYS = {
  WATCHES: 'ntf:watches',
  WINDOWS: 'ntf:windows',
  MUTES: 'ntf:mutes',
  LAST_DIGEST: 'ntf:lastDigest'
}

// Simple in-memory cache to avoid frequent AsyncStorage reads
const cache: {
  watches: WatchRule[]
  windows: PriceWindow[]
  mutes: MuteEntry[]
  initialized: boolean
} = {
  watches: [],
  windows: [],
  mutes: [],
  initialized: false
}

async function loadAll() {
  if (cache.initialized) return
  try {
    const [wRaw, winRaw, mRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.WATCHES),
      AsyncStorage.getItem(STORAGE_KEYS.WINDOWS),
      AsyncStorage.getItem(STORAGE_KEYS.MUTES)
    ])
    cache.watches = wRaw ? JSON.parse(wRaw) : []
    cache.windows = winRaw ? JSON.parse(winRaw) : []
    cache.mutes = mRaw ? JSON.parse(mRaw) : []
  } catch (e) {
    console.warn('NotificationService: failed to load data', e)
    cache.watches = []
    cache.windows = []
    cache.mutes = []
  }
  cache.initialized = true
}

async function persist<T>(key: string, value: T) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('NotificationService: failed to persist', key, e)
  }
}

// Public API
export const NotificationService = {
  // Initialize notifications: request permissions and configure Android channel
  async initNotifications() {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync()
        let finalStatus = existingStatus
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync()
          finalStatus = status
        }

        if (finalStatus !== 'granted') {
          console.warn('NotificationService: permissions not granted')
          return false
        }

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.DEFAULT,
          })
        }

        return true
      } else {
        console.warn('NotificationService: must use physical device for notifications')
        return false
      }
    } catch (e) {
      console.warn('NotificationService.initNotifications error', e)
      return false
    }
  },

  // Send a local immediate notification (appears in the system notification center)
  // Função sendLocalNotification removida conforme requisitos - mantendo apenas notificação de oferta do dia

  async listWatches(): Promise<WatchRule[]> {
    await loadAll()
    return cache.watches
  },

  async addWatch(rule: WatchRule) {
    await loadAll()
    cache.watches = [...cache.watches.filter(r => r.id !== rule.id), rule]
    await persist(STORAGE_KEYS.WATCHES, cache.watches)
  },

  async removeWatch(id: string) {
    await loadAll()
    cache.watches = cache.watches.filter(r => r.id !== id)
    await persist(STORAGE_KEYS.WATCHES, cache.watches)
  },

  async listPriceWindows(): Promise<PriceWindow[]> {
    await loadAll()
    return cache.windows
  },

  async addPriceWindow(w: PriceWindow) {
    await loadAll()
    cache.windows = [...cache.windows.filter(x => x.id !== w.id), w]
    await persist(STORAGE_KEYS.WINDOWS, cache.windows)
  },

  async removePriceWindow(id: string) {
    await loadAll()
    cache.windows = cache.windows.filter(w => w.id !== id)
    await persist(STORAGE_KEYS.WINDOWS, cache.windows)
  },

  async listMutes(): Promise<MuteEntry[]> {
    await loadAll()
    // prune expired mutes
    const now = Date.now()
    cache.mutes = cache.mutes.filter(m => m.until > now)
    await persist(STORAGE_KEYS.MUTES, cache.mutes)
    return cache.mutes
  },

  async addMute(m: MuteEntry) {
    await loadAll()
    cache.mutes = [...cache.mutes.filter(x => x.id !== m.id), m]
    await persist(STORAGE_KEYS.MUTES, cache.mutes)
  },

  async removeMute(id: string) {
    await loadAll()
    cache.mutes = cache.mutes.filter(m => m.id !== id)
    await persist(STORAGE_KEYS.MUTES, cache.mutes)
  },

  // Evaluate a deal against configured rules and return matches (without sending notifications)
  // The caller can then decide how to notify (local push, aggregated digest, server-side push)
  async evaluateDeal(deal: Deal) {
    await loadAll()
    const now = Date.now()

    // if muted by store or game, skip
    const isMuted = cache.mutes.some(m => (m.targetType === 'store' && m.targetId === deal.store.name) || (m.targetType === 'game' && (deal.appId ? String(deal.appId) === m.targetId : deal._id === m.targetId)) && m.until > now)
    if (isMuted) return { matches: [], muted: true }

    const matches: Array<{ type: string; ruleId?: string; reason: string }> = []

    // watch rules: studio/franchise/game/store
    for (const w of cache.watches) {
      if (!w.enabled) continue
      const q = w.query.toLowerCase()
      if (w.type === 'studio' || w.type === 'franchise') {
        const dev = (deal.game.developer || '').toLowerCase()
        if (dev && dev.includes(q)) matches.push({ type: w.type, ruleId: w.id, reason: `developer:${w.query}` })
      }
      if (w.type === 'game') {
        if ((deal.game.title || '').toLowerCase().includes(q) || String(deal.appId || deal._id).includes(q)) matches.push({ type: 'game', ruleId: w.id, reason: `title:${w.query}` })
      }
      if (w.type === 'store') {
        if ((deal.store.name || '').toLowerCase().includes(q)) matches.push({ type: 'store', ruleId: w.id, reason: `store:${w.query}` })
      }
    }

    // price windows
    for (const pw of cache.windows) {
      if (!pw.enabled) continue
      if (pw.gameId && pw.gameId !== String(deal.appId || deal._id)) continue
      if (pw.store && pw.store !== deal.store.name) continue
      const p = deal.priceFinal
      if ((pw.min === undefined || p >= pw.min) && (pw.max === undefined || p <= pw.max)) {
        matches.push({ type: 'price-window', ruleId: pw.id, reason: `price:${pw.min || '-'}-${pw.max || '-'}` })
      }
    }

    return { matches, muted: false }
  },

  // Notify matches immediately: builds a short payload and sends a local notification
  async notifyMatchesImmediate(deal: Deal) {
    // Função desativada conforme requisitos - mantendo apenas notificação de oferta do dia
  },

  // Schedule a daily digest at a given hour (local time). Call buildDigest with accumulated matches.
  async scheduleDailyDigest(hour = 20, minute = 0) {
    // Função desativada conforme requisitos - mantendo apenas notificação de oferta do dia
  },

  // Build a digest for a list of matched deals (small summary), returns a payload suitable for a single consolidated notification
  buildDigest(matches: Array<{ deal: Deal; reasons: string[] }>, frequency: 'daily' | 'weekly' = 'daily') {
    // Keep digest small: top N offers, include title, store, final price, discount
    const top = matches.slice(0, 5)
    const lines = top.map(m => `${m.deal.game.title} — ${m.deal.store.name} — ${m.deal.priceFinal.toFixed(2)} (${Math.round(m.deal.discountPct)}%)`)
    return {
      title: frequency === 'daily' ? `Top ${top.length} ofertas hoje` : `Resumo semanal: ${top.length} ofertas`,
      body: lines.join('\n'),
      count: top.length,
      items: top
    }
  },

  // Convenience: mute a target (game or store) for X days
  async muteTarget(targetType: 'game' | 'store', targetId: string, days = 30) {
    const until = Date.now() + days * 24 * 60 * 60 * 1000
    const id = `${targetType}:${targetId}`
    await this.addMute({ id, targetType, targetId, until })
  },

  async getPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync()
      return token.data
    } catch (error) {
      console.error('Erro ao obter push token:', error)
      return null
    }
  }
}

export default NotificationService
