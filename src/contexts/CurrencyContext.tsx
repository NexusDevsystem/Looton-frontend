import React, { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = '@looton:selected_currency'
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

type CurrencyContextValue = {
  currency: string
  setCurrency: (c: string) => Promise<void>
  /** Returns a formatted string for display (uses Intl) */
  formatPrice: (priceInBRL?: number | null) => string
  /** Returns numeric converted value in the selected currency (not formatted) */
  convertPrice: (priceInBRL?: number | null) => number
  loading: boolean
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'BRL',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setCurrency: async () => {},
  formatPrice: () => 'Grátis',
  convertPrice: () => 0,
  loading: true
})

const DEFAULT_CURRENCY = 'BRL'

const localeMap: Record<string, string> = {
  BRL: 'pt-BR',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  AUD: 'en-AU',
  CAD: 'en-CA',
  CHF: 'de-CH',
  CNY: 'zh-CN',
  ARS: 'es-AR'
}

type CurrencyProviderProps = {
  children?: React.ReactNode;
};

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>(DEFAULT_CURRENCY)
  const [rates, setRates] = useState<Record<string, number>>({ BRL: 1 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY)
        const initial = stored || DEFAULT_CURRENCY
        setCurrencyState(initial)
        await fetchRate(initial)
      } catch (e) {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const fetchRate = async (base: string) => {
    try {
      if (base === 'BRL') {
        setRates((s) => ({ ...s, BRL: 1 }))
        return 1
      }
      const res = await fetch(`${API_URL}/currency?base=${encodeURIComponent(base)}`)
      if (res.ok) {
        const data = await res.json()
        // backend returns rate: BRL per base unit (e.g. BRL per USD)
        const rate = typeof data.rate === 'number' ? data.rate : 1
        setRates((s) => ({ ...s, [base]: rate }))
        return rate
      }

      // If backend failed, fall back to a public rates API so the app can still convert
      // exchangerate.host returns rates object where rates.BRL is BRL per base currency
      try {
        const ext = await fetch(`https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=BRL`)
        if (ext.ok) {
          const extData = await ext.json()
          const extRate = extData && extData.rates && typeof extData.rates.BRL === 'number' ? extData.rates.BRL : undefined
          if (extRate && typeof extRate === 'number') {
            setRates((s) => ({ ...s, [base]: extRate }))
            return extRate
          }
        }
      } catch (e) {
        // ignore fallback error
      }

      throw new Error('failed')
    } catch (e) {
      // fallback keep existing rate or 1
      return rates[base] ?? 1
    }
  }

  const convertPrice = (priceInBRL?: number | null) => {
    if (priceInBRL === null || priceInBRL === undefined) return 0
    if (isNaN(priceInBRL)) return 0
    if (priceInBRL === 0) return 0

    const target = currency || DEFAULT_CURRENCY
    const rate = rates[target] ?? 1
    // rate is BRL per unit of target currency -> to convert BRL -> target: divide
    if (target === 'BRL') return priceInBRL
    if (!rate || rate === 0) return priceInBRL
    return priceInBRL / rate
  }

  const setCurrency = async (c: string) => {
    setLoading(true)
    try {
      await AsyncStorage.setItem(STORAGE_KEY, c)
      setCurrencyState(c)
      await fetchRate(c)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (priceInBRL?: number | null) => {
    if (priceInBRL === null || priceInBRL === undefined) return 'Grátis'
    if (isNaN(priceInBRL)) return 'Grátis'
    if (priceInBRL === 0) return 'Grátis'

    // SEMPRE MOSTRA EM BRL (R$)
    try {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(priceInBRL)
    } catch (e) {
      // fallback to simple formatting
      return `R$ ${priceInBRL.toFixed(2)}`
    }
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, convertPrice, loading }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)

export default CurrencyContext
