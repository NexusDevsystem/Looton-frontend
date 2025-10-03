import { useState } from 'react';
import { PriceHistoryService, PriceHistoryResponse } from '../services/PriceHistoryService';

export const usePriceHistory = () => {
  const [history, setHistory] = useState<PriceHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async (gameId: string, days: number = 90) => {
    setLoading(true);
    setError(null);
    
    try {
      const gameHistory = await PriceHistoryService.getGamePriceHistory(gameId, days);
      setHistory(gameHistory);
    } catch (err) {
      setError('Erro ao carregar histórico de preços');
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkIfLowestPrice = (currentPrice: number): boolean => {
    if (!history?.stats) return false;
    return currentPrice <= history.stats.lowest;
  };

  return {
    history,
    loading,
    error,
    loadHistory,
    checkIfLowestPrice,
    refresh: (gameId: string, days?: number) => loadHistory(gameId, days)
  };
};
