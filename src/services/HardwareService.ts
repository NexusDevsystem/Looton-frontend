import { API_URL } from '../api/client'

export type PcOffer = {
  store: string
  title: string
  url: string
  image?: string
  category?: string
  priceBaseCents?: number
  priceFinalCents: number
  discountPct?: number
  availability?: 'in_stock' | 'out_of_stock' | 'preorder' | 'unknown'
  sku?: string
  ean?: string
  updatedAt: string
}

export async function fetchPcDeals(params?: { limit?: number; offset?: number; store?: string[]; category?: string[]; full?: boolean; q?: string }) {
  const q = new URLSearchParams()
  if (params?.limit) q.set('limit', String(params.limit))
  if (params?.offset) q.set('offset', String(params.offset))
  if (params?.store?.length) q.set('store', params.store.join(','))
  if (params?.category?.length) q.set('category', params.category.join(','))
  if (params?.full) q.set('full', '1')
  if (params?.q) q.set('q', params.q)
  const res = await fetch(`${API_URL}/pc-deals?${q.toString()}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<{ slotDate: string; items: PcOffer[] }>
}
