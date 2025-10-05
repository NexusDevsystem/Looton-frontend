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
  
  const url = `${API_URL}/pc-deals?${q.toString()}`
  console.log('HardwareService: Fetching from', url)
  
  try {
    const res = await fetch(url)
    console.log('HardwareService: Response status', res.status)
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error('HardwareService: Error response', errorText)
      throw new Error(`HTTP ${res.status}: ${errorText}`)
    }
    
    const data = await res.json()
    console.log('HardwareService: Success, items count:', data.items?.length || 0)
    return data as { slotDate: string; items: PcOffer[] }
  } catch (error) {
    console.error('HardwareService: Fetch error', error)
    throw error
  }
}
