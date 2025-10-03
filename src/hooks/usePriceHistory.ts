import { useState, useEffect } from 'react'
import { PriceHistoryService, GamePriceHistory } from '../services/PriceHistoryService'

export const usePriceHistory = (appId?: number) => {
  const [history, setHistory] = useState<GamePriceHistory | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = async (gameAppId?: number) => {
    if (!gameAppId && !appId) return

    setLoading(true)
    setError(null)
    
    try {
      const gameHistory = await PriceHistoryService.getGamePriceHistory(gameAppId || appId!)
      setHistory(gameHistory)
    } catch (err) {
      setError('Erro ao carregar histórico de preços')
      console.error('Erro ao carregar histórico:', err)
    } finally {
      setLoading(false)
    }
  }

  const checkIfLowestPrice = async (gameAppId: number, currentPrice: number): Promise<boolean> => {
    try {
      return await PriceHistoryService.isGameAtLowestPrice(gameAppId, currentPrice)
    } catch (err) {
      console.error('Erro ao verificar menor preço:', err)
      return false
    }
  }

  const addPriceEntry = async (
    gameAppId: number,
    title: string,
    price: number,
    store: string,
    coverUrl?: string,
    discount?: number
  ): Promise<boolean> => {
    try {
      const success = await PriceHistoryService.addPriceEntry(
        gameAppId,
        title,
        price,
        store,
        coverUrl,
        discount
      )
      
      if (success && appId === gameAppId) {
        // Recarrega o histórico se for o jogo atual
        await loadHistory(gameAppId)
      }
      
      return success
    } catch (err) {
      console.error('Erro ao adicionar entrada de preço:', err)
      return false
    }
  }

  const processDeals = async (deals: any[]) => {
    try {
      await PriceHistoryService.processDeals(deals)
      
      // Se há um appId específico sendo monitorado, recarrega o histórico
      if (appId) {
        await loadHistory(appId)
      }
    } catch (err) {
      console.error('Erro ao processar deals:', err)
    }
  }

  useEffect(() => {
    if (appId) {
      loadHistory(appId)
    }

    // Subscribe to price history changes
    const unsubscribe = PriceHistoryService.subscribe(() => {
      if (appId) {
        loadHistory(appId)
      }
    })

    return unsubscribe
  }, [appId])

  return {
    history,
    loading,
    error,
    loadHistory,
    checkIfLowestPrice,
    addPriceEntry,
    processDeals,
    isLowestPrice: history?.isCurrentlyLowest || false,
    lowestPrice: history?.lowestPrice,
    daysTracked: history?.history.length || 0
  }
}

export const useLowestPriceGames = () => {
  const [lowestPriceGames, setLowestPriceGames] = useState<GamePriceHistory[]>([])
  const [loading, setLoading] = useState(false)

  const loadLowestPriceGames = async () => {
    setLoading(true)
    try {
      const games = await PriceHistoryService.getLowestPriceGames()
      setLowestPriceGames(games)
    } catch (err) {
      console.error('Erro ao carregar jogos com menor preço:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLowestPriceGames()

    // Subscribe to changes
    const unsubscribe = PriceHistoryService.subscribe(loadLowestPriceGames)
    return unsubscribe
  }, [])

  return {
    lowestPriceGames,
    loading,
    refresh: loadLowestPriceGames
  }
}