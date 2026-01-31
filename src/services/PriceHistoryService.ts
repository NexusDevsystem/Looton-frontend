import { api } from '../api/client';

export interface PriceHistoryEntry {
  price: number;
  date: string;
  store: string;
}

export interface PriceStats {
  lowest: number;
  highest: number;
  average: number;
  current: number;
  lowestDate: string;
  lowestStore: string;
}

export interface PriceHistoryResponse {
  gameId: string;
  gameTitle: string;
  history: PriceHistoryEntry[];
  chartData: Array<{
    date: string;
    lowestPrice: number;
    stores: Record<string, number>;
  }>;
  stats: PriceStats | null;
  currentPrices: Record<string, { price: number; date: string }>;
  analysis: {
    isCurrentBestPrice: boolean;
    percentageFromLowest: number;
    recommendation: string;
  };
}

export class PriceHistoryService {
  static async getGamePriceHistory(gameId: string, days: number = 90): Promise<PriceHistoryResponse> {
    try {
      const response = await api<PriceHistoryResponse>(
        `/price-history/${gameId}?days=${days}`
      );
      return response;
    } catch (error) {
      console.error('Erro ao buscar histórico de preços:', error);
      throw new Error('Não foi possível carregar o histórico de preços');
    }
  }

  static formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }

  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  static getRecommendationColor(recommendation: string): string {
    switch (recommendation.toLowerCase()) {
      case 'excelente':
        return '#10B981'; // green
      case 'boa':
        return '#3B82F6'; // blue
      case 'regular':
        return '#F59E0B'; // yellow
      case 'ruim':
        return '#EF4444'; // red
      default:
        return '#6B7280'; // gray
    }
  }
}