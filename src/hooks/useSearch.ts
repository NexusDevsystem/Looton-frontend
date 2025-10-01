import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Deal } from './useDeals'

export function useSearch(query: string, stores?: string[]) {
  const [data, setData] = useState<Deal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Clear results when query is empty
    if (!query || query.length < 1) {
      setData([])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)

    // debounce
    const handle = setTimeout(() => {
      const params = new URLSearchParams()
      params.append('q', query)
      if (stores && stores.length > 0) {
        params.append('stores', stores.join(','))
      }

      api<any>(`/search?${params.toString()}`)
        .then((res) => {
          if (cancelled) return

          console.log('Resposta da API:', res);

          // Two possible responses:
          // 1) { games: [...] } -> DB search result with games and bestOffer
          // 2) [ ... ] -> adapter-level offers/DTOs

          const toDeals = (arr: any[]): Deal[] => arr.map((d, idx) => {
            // If item already matches Deal shape, try to use it
            if (d._id && d.priceFinal !== undefined && d.game) return d as Deal

            // If item is a game from DB (has bestOffer)
            if (d.bestOffer || d.game) {
              const gameObj = d.game || d
              const offer = d.bestOffer || {}
              return {
                _id: (d._id || gameObj._id || String(idx)),
                url: offer.url || '',
                priceBase: (offer.priceBase || 0),
                priceFinal: (offer.priceFinal || 0),
                discountPct: (offer.discountPct || 0),
                game: { title: gameObj.title || gameObj.name || 'Jogo', coverUrl: gameObj.coverUrl },
                store: { name: (offer.store?.name) || (d.store?.name) || 'steam' }
              } as Deal
            }

            // If adapter OfferDTO-like
            return {
              _id: d.storeAppId || d.id || String(idx),
              url: d.url || '',
              priceBase: d.priceBase || 0,
              priceFinal: d.priceFinal || 0,
              discountPct: d.discountPct || 0,
              game: { title: d.title || 'Jogo', coverUrl: d.coverUrl },
              store: { name: d.store || 'steam' }
            } as Deal
          })

          if (Array.isArray(res)) setData(toDeals(res))
          else if (res && Array.isArray(res.games)) setData(toDeals(res.games))
          else setData([])
        })
        .catch((e) => { if (!cancelled) setError(String(e)) })
        .finally(() => { if (!cancelled) setLoading(false) })
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [query, JSON.stringify(stores || [])])

  return { data, loading, error }
}
