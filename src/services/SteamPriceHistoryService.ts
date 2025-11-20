import AsyncStorage from '@react-native-async-storage/async-storage'

export interface PriceHistoryEntry {
  price: number
  date: string
  timestamp: number
}

export interface GamePriceHistory {
  appId: number
  title: string
  currentPrice: number
  history: PriceHistoryEntry[]
  lastUpdated: number
  isLowestPrice: boolean
  lowestPriceEver: number
  averagePrice: number
}

class SteamPriceHistoryService {
  private static instance: SteamPriceHistoryService
  private readonly STORAGE_KEY = '@looton_price_history'
  private readonly CACHE_DURATION = 4 * 60 * 60 * 1000 // 4 horas
  private priceCache: Map<number, GamePriceHistory> = new Map()

  static getInstance(): SteamPriceHistoryService {
    if (!SteamPriceHistoryService.instance) {
      SteamPriceHistoryService.instance = new SteamPriceHistoryService()
    }
    return SteamPriceHistoryService.instance
  }

  private constructor() {
    this.loadCacheFromStorage()
  }

  private async loadCacheFromStorage() {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        this.priceCache = new Map(Object.entries(data).map(([key, value]) => [parseInt(key), value as GamePriceHistory]))
      }
    } catch (error) {
      console.error('Erro ao carregar cache de preços:', error)
    }
  }

  private async saveCacheToStorage() {
    try {
      const data = Object.fromEntries(this.priceCache)
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Erro ao salvar cache de preços:', error)
    }
  }

  // Simulação de busca de histórico da Steam (em produção conectaria com Steam API)
  private async fetchSteamPriceHistory(appId: number): Promise<PriceHistoryEntry[]> {
    // TODO: Implementar conexão real com Steam API
    // Por enquanto, simulamos dados históricos
    const now = Date.now()
    const days = 30
    const basePrice = Math.random() * 50 + 10 // Preço base entre 10-60
    const history: PriceHistoryEntry[] = []

    for (let i = days; i >= 0; i--) {
      const date = new Date(now - (i * 24 * 60 * 60 * 1000))
      const variation = (Math.random() - 0.5) * 0.3 // Variação de ±30%
      const price = Math.max(0.99, basePrice * (1 + variation))
      
      history.push({
        price: Math.round(price * 100) / 100,
        date: date.toISOString().split('T')[0],
        timestamp: date.getTime()
      })
    }

    return history.sort((a, b) => a.timestamp - b.timestamp)
  }

  async getPriceHistory(appId: number, title: string, currentPrice: number): Promise<GamePriceHistory> {
    const cached = this.priceCache.get(appId)
    const now = Date.now()

    // Verificar se o cache é válido
    if (cached && (now - cached.lastUpdated) < this.CACHE_DURATION) {
      return cached
    }

    try {
      // Buscar histórico atualizado
      const history = await this.fetchSteamPriceHistory(appId)
      
      // Calcular estatísticas
      const prices = history.map(h => h.price)
      const lowestPriceEver = Math.min(...prices)
      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
      const isLowestPrice = currentPrice <= lowestPriceEver * 1.05 // Margem de 5%

      const gameHistory: GamePriceHistory = {
        appId,
        title,
        currentPrice,
        history,
        lastUpdated: now,
        isLowestPrice,
        lowestPriceEver,
        averagePrice: Math.round(averagePrice * 100) / 100
      }

      // Atualizar cache
      this.priceCache.set(appId, gameHistory)
      await this.saveCacheToStorage()

      return gameHistory
    } catch (error) {
      console.error('Erro ao buscar histórico de preços:', error)
      
      // Retornar dados básicos em caso de erro
      return {
        appId,
        title,
        currentPrice,
        history: [],
        lastUpdated: now,
        isLowestPrice: false,
        lowestPriceEver: currentPrice,
        averagePrice: currentPrice
      }
    }
  }

  // Obter análise rápida de preço
  async getPriceAnalysis(appId: number, title: string, currentPrice: number): Promise<{
    isGoodDeal: boolean
    priceStatus: 'lowest' | 'good' | 'average' | 'high'
    savingsFromAverage: number
    lastSeenLower: string | null
  }> {
    const history = await this.getPriceHistory(appId, title, currentPrice)
    
    let priceStatus: 'lowest' | 'good' | 'average' | 'high' = 'average'
    let isGoodDeal = false

    if (history.isLowestPrice) {
      priceStatus = 'lowest'
      isGoodDeal = true
    } else if (currentPrice <= history.averagePrice * 0.8) {
      priceStatus = 'good'
      isGoodDeal = true
    } else if (currentPrice >= history.averagePrice * 1.2) {
      priceStatus = 'high'
    }

    const savingsFromAverage = Math.round((history.averagePrice - currentPrice) * 100) / 100

    // Encontrar quando foi visto por último abaixo do preço atual
    const lowerPriceEntries = history.history.filter(h => h.price < currentPrice)
    const lastSeenLower = lowerPriceEntries.length > 0 
      ? lowerPriceEntries[lowerPriceEntries.length - 1].date 
      : null

    return {
      isGoodDeal,
      priceStatus,
      savingsFromAverage,
      lastSeenLower
    }
  }

  // Limpar cache antigo
  async clearOldCache() {
    const now = Date.now()
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000)

    for (const [appId, history] of this.priceCache.entries()) {
      if (history.lastUpdated < oneWeekAgo) {
        this.priceCache.delete(appId)
      }
    }

    await this.saveCacheToStorage()
  }

  // Obter histórico em cache para múltiplos jogos
  async getBulkPriceAnalysis(games: Array<{appId: number, title: string, currentPrice: number}>) {
    const analyses = await Promise.all(
      games.map(game => this.getPriceAnalysis(game.appId, game.title, game.currentPrice))
    )

    return games.map((game, index) => ({
      ...game,
      analysis: analyses[index]
    }))
  }
}

export default SteamPriceHistoryService