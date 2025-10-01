import { useEffect, useState } from 'react'
import { api } from '../api/client'

export type Alert = {
  _id: string
  userId: string
  query?: string
  gameId?: string
  maxPrice: number
  stores: string[]
  isActive: boolean
}

export function useAlerts(userId: string) {
  const [data, setData] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setLoading(true)
    api<Alert[]>(`/alerts?userId=${userId}`)
      .then((res) => { if (!cancelled) setData(res) })
      .catch((e) => { if (!cancelled) setError(String(e)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [userId])

  return { data, loading, error }
}
