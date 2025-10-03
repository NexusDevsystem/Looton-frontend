import AsyncStorage from '@react-native-async-storage/async-storage'

export interface PriceHistoryEntry {
  date: string
  price: number
  store: string
  discount?: number
}

export interface GamePriceHistory {
  appId: number
  title: string
  coverUrl?: string
  history: PriceHistoryEntry[]
  lowestPrice: number
  lowestPriceDate: string
  isCurrentlyLowest: boolean
}

const PRICE_HISTORY_KEY = 'price_history'

class PriceHistoryServiceClass {
  private listeners: (() => void)[] = []

  // Obtém o histórico de preços de todos os jogos
  async getAllPriceHistory(): Promise<Record<number, GamePriceHistory>> {
    try {
      const data = await AsyncStorage.getItem(PRICE_HISTORY_KEY)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('Erro ao obter histórico de preços:', error)
      return {}
    }
  }

  // Obtém o histórico de preços de um jogo específico
  async getGamePriceHistory(appId: number): Promise<GamePriceHistory | null> {
    try {
      const allHistory = await this.getAllPriceHistory()
      return allHistory[appId] || null
    } catch (error) {
      console.error('Erro ao obter histórico do jogo:', error)
      return null
    }
  }

  // Adiciona uma nova entrada no histórico de preços
  async addPriceEntry(
    appId: number, 
    title: string, 
    price: number, 
    store: string, 
    coverUrl?: string,
    discount?: number
  ): Promise<boolean> {
    try {
      const allHistory = await this.getAllPriceHistory()
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      
      // Se não existe histórico para este jogo, cria um novo
      if (!allHistory[appId]) {
        allHistory[appId] = {
          appId,
          title,
          coverUrl,
          history: [],
          lowestPrice: price,
          lowestPriceDate: today,
          isCurrentlyLowest: true
        }
      }

      const gameHistory = allHistory[appId]
      
      // Verifica se já existe entrada para hoje nesta loja
      const existingEntry = gameHistory.history.find(
        entry => entry.date === today && entry.store === store
      )

      if (existingEntry) {
        // Atualiza a entrada existente se o preço mudou
        if (existingEntry.price !== price) {
          existingEntry.price = price
          existingEntry.discount = discount
        }
      } else {
        // Adiciona nova entrada
        gameHistory.history.push({
          date: today,
          price,
          store,
          discount
        })
      }

      // Atualiza o menor preço se necessário
      if (price < gameHistory.lowestPrice) {
        gameHistory.lowestPrice = price
        gameHistory.lowestPriceDate = today
        gameHistory.isCurrentlyLowest = true
        
        // Dispara notificação de menor preço histórico
        this.notifyLowestPrice(gameHistory)
      } else {
        // Verifica se o preço atual ainda é o menor
        const currentLowestPrice = Math.min(...gameHistory.history.map(h => h.price))
        gameHistory.isCurrentlyLowest = price === currentLowestPrice
      }

      // Mantém apenas os últimos 365 dias de histórico
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      const cutoffDate = oneYearAgo.toISOString().split('T')[0]
      
      gameHistory.history = gameHistory.history.filter(
        entry => entry.date >= cutoffDate
      ).sort((a, b) => a.date.localeCompare(b.date))

      // Salva o histórico atualizado
      await AsyncStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(allHistory))
      
      // Notifica os listeners
      this.listeners.forEach(listener => listener())
      
      return true
    } catch (error) {
      console.error('Erro ao adicionar entrada de preço:', error)
      return false
    }
  }

  // Processa uma lista de deals para atualizar o histórico
  async processDeals(deals: any[]): Promise<void> {
    const promises = deals.map(deal => 
      this.addPriceEntry(
        deal.appId || parseInt(deal.gameId),
        deal.game?.title || deal.title,
        deal.priceFinal || deal.price,
        deal.store?.name || deal.store || 'unknown',
        deal.game?.coverUrl || deal.coverUrl,
        deal.discountPct || deal.discount
      )
    )
    
    await Promise.all(promises)
  }

  // Obtém jogos que estão atualmente no menor preço histórico
  async getLowestPriceGames(): Promise<GamePriceHistory[]> {
    try {
      const allHistory = await this.getAllPriceHistory()
      return Object.values(allHistory).filter(game => game.isCurrentlyLowest)
    } catch (error) {
      console.error('Erro ao obter jogos com menor preço:', error)
      return []
    }
  }

  // Verifica se um jogo específico está no menor preço
  async isGameAtLowestPrice(appId: number, currentPrice: number): Promise<boolean> {
    try {
      const gameHistory = await this.getGamePriceHistory(appId)
      if (!gameHistory) return true // Se não há histórico, assume que é o menor

      return currentPrice <= gameHistory.lowestPrice
    } catch (error) {
      console.error('Erro ao verificar menor preço:', error)
      return false
    }
  }

  // Obtém estatísticas do histórico de preços
  async getPriceStats(appId: number): Promise<{
    lowestPrice: number
    highestPrice: number
    averagePrice: number
    priceDropPercentage: number
    daysTracked: number
  } | null> {
    try {
      const gameHistory = await this.getGamePriceHistory(appId)
      if (!gameHistory || gameHistory.history.length === 0) return null

      const prices = gameHistory.history.map(h => h.price)
      const lowestPrice = Math.min(...prices)
      const highestPrice = Math.max(...prices)
      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length

      const priceDropPercentage = ((highestPrice - lowestPrice) / highestPrice) * 100

      return {
        lowestPrice,
        highestPrice,
        averagePrice: Math.round(averagePrice * 100) / 100,
        priceDropPercentage: Math.round(priceDropPercentage * 100) / 100,
        daysTracked: gameHistory.history.length
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      return null
    }
  }

  // Limpa histórico antigo (mais de 1 ano)
  async cleanOldHistory(): Promise<void> {
    try {
      const allHistory = await this.getAllPriceHistory()
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      const cutoffDate = oneYearAgo.toISOString().split('T')[0]

      Object.values(allHistory).forEach(gameHistory => {
        gameHistory.history = gameHistory.history.filter(
          entry => entry.date >= cutoffDate
        )
      })

      await AsyncStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(allHistory))
    } catch (error) {
      console.error('Erro ao limpar histórico antigo:', error)
    }
  }

  // Adiciona listener para mudanças no histórico
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // Notifica sobre menor preço histórico (integra com NotificationService)
  private async notifyLowestPrice(gameHistory: GamePriceHistory): Promise<void> {
    try {
      // Importação dinâmica para evitar dependência circular
      const { NotificationService } = await import('./NotificationService')
      
      await NotificationService.scheduleLowestPriceNotification(
        gameHistory.title,
        gameHistory.lowestPrice,
        gameHistory.coverUrl
      )
      
      console.log(`🔥 MENOR PREÇO HISTÓRICO: ${gameHistory.title} por R$ ${gameHistory.lowestPrice}`)
    } catch (error) {
      console.error('Erro ao notificar menor preço:', error)
    }
  }
}

export const PriceHistoryService = new PriceHistoryServiceClass()