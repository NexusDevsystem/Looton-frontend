import { useEffect, useState } from 'react'
import { api } from '../api/client'

export type Deal = {
  _id: string
  url: string
  priceBase: number
  priceFinal: number
  discountPct: number
  game: { title: string; coverUrl?: string }
  store: { name: string }
}

export function useDeals(minDiscount = 0, limit = 20) {
  const [data, setData] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<Deal[]>(`/deals?minDiscount=${minDiscount}&limit=${limit}`)
      .then((res) => { if (!cancelled) setData(res) })
      .catch((e) => { if (!cancelled) setError(String(e)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [minDiscount, limit])

  return { data, loading, error }
}
