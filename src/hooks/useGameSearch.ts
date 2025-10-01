import { useEffect, useRef, useState } from 'react'
import { API_URL, api } from '../api/client'

export type GameItem = {
  id: string
  title: string
  coverUrl?: string | null
  genres?: string[]
  tags?: string[]
  bestOffer?: {
    store: string
    priceFinalCents: number
    discountPct: number
    url: string
  } | null
}

type Options = {
  apiBaseUrl: string
  minChars?: number
  delayMs?: number
  limit?: number
  extraParams?: string
}

export function useGameSearch(query: string, options: Options) {
  const { apiBaseUrl, minChars = 2, delayMs = 250, limit = 24, extraParams = '' } = options
  const [data, setData] = useState<GameItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const seq = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<any>(null)

  useEffect(() => {
    // clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    // if query too short, clear
    if (!query || query.length < minChars) {
      // cancel ongoing request
      if (abortRef.current) {
        abortRef.current.abort()
        abortRef.current = null
      }
      setData([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const currentSeq = ++seq.current

    timerRef.current = setTimeout(async () => {
      // abort previous request
      if (abortRef.current) abortRef.current.abort()
      const ac = new AbortController()
      abortRef.current = ac

      try {
        const url = `${apiBaseUrl}/steam/search?q=${encodeURIComponent(query)}&limit=${limit}${extraParams}`
        const res = await fetch(url, { signal: ac.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()

        // Only accept if sequence matches (prevent race)
        if (currentSeq !== seq.current) return

        // normalize items
        // /steam/search returns { games: [...] }
        const raw = json.games || []
        const items: GameItem[] = raw.map((g: any) => ({
          id: String(g.appId || g.id || g._id || g.storeAppId || ''),
          title: g.title || g.name || '',
          coverUrl: g.imageUrl || g.coverUrl || g.header_image || null,
          genres: g.genres || g.tags || [],
          tags: g.tags || g.genres || [],
          bestOffer: g.bestOffer ? {
            store: g.bestOffer.store || g.bestOffer.storeName || 'store',
            priceFinalCents: g.bestOffer.priceFinalCents || g.bestOffer.priceFinal || 0,
            discountPct: g.bestOffer.discountPct || 0,
            url: g.bestOffer.url || g.url || ''
          } : null
        }))

        setData(items)
      } catch (err: any) {
        if (err.name === 'AbortError') return
        setError(String(err.message || err))
      } finally {
        if (currentSeq === seq.current) setLoading(false)
      }
    }, delayMs)

    return () => {
      // cleanup timer
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, apiBaseUrl, minChars, delayMs, limit, extraParams])

  useEffect(() => {
    return () => {
      // final cleanup on unmount
      if (abortRef.current) abortRef.current.abort()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { data, loading, error }
}

export default useGameSearch
