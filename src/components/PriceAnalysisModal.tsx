import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchPriceHistory, PriceHistoryData } from '../api/client';

interface PriceHistory {
  date: string;
  price: number;
  storeName: string;
}

interface PriceAnalysisModalProps {
  visible: boolean;
  onClose: () => void;
  gameId: string;
  gameTitle: string;
  currentPrice?: number;
}

// Função para formatar preço com detecção automática de formato
const formatPrice = (price: number | undefined): string => {
  if (price === undefined || price === null || isNaN(price)) {
    return 'R$ 0,00';
  }
  
  // Se o preço é muito alto (provavelmente em centavos), dividir por 100
  // Se é menor que 1000, assumir que já está em formato decimal
  const actualPrice = price > 1000 ? price / 100 : price;
  return actualPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Função para formatar data
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

// Função para transformar dados da API em formato do componente (Steam e Epic)
const transformApiDataToHistory = (apiData: PriceHistoryData): PriceHistory[] => {
  const history: PriceHistory[] = [];
  
  console.log('🔍 Dados REAIS da Steam recebidos:', apiData.chartData.length, 'entradas');
  
  // Converter APENAS dados reais da Steam
  apiData.chartData.forEach((entry, index) => {
    console.log(`📅 Entrada ${index}:`, entry.date, 'preços Steam:', entry.prices);
    
    // Adicionar APENAS dados reais da Steam
    if (entry.prices.steam) {
      const steamPrice = entry.prices.steam;
      console.log(`🎮 Steam REAL: R$ ${steamPrice} em ${entry.date}`);
      history.push({
        date: entry.date,
        price: steamPrice,
        storeName: 'Steam'
      });
    }
  });
  
  console.log('🎯 Total de dados REAIS processados:', history.length);
  return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const PriceAnalysisModal: React.FC<PriceAnalysisModalProps> = ({
  visible,
  onClose,
  gameId,
  gameTitle,
  currentPrice = 49.99 // valor padrão para teste
}) => {
  const [loading, setLoading] = useState(true);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [apiData, setApiData] = useState<PriceHistoryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && gameId) {
      setLoading(true);
      setError(null);
      
      fetchPriceHistory(gameId, 30) // Buscar últimos 30 dias
        .then((data) => {
          console.log('📊 Dados da API recebidos:', data);
          setApiData(data);
          const history = transformApiDataToHistory(data);
          console.log('📈 Histórico transformado:', history.length, 'items');
          setPriceHistory(history);
          setLoading(false);
        })
        .catch((err) => {
          console.error('❌ Erro ao buscar histórico de preços:', err);
          setError(err.message || 'Erro ao carregar histórico');
          setLoading(false);
        });
    }
  }, [visible, gameId]);

  const getLowestPrice = () => {
    if (apiData?.statistics) {
      return apiData.statistics.lowest;
    }
    if (priceHistory.length === 0) return 0;
    return Math.min(...priceHistory.map(h => h.price));
  };

  const getHighestPrice = () => {
    if (apiData?.statistics) {
      return apiData.statistics.highest;
    }
    if (priceHistory.length === 0) return 0;
    return Math.max(...priceHistory.map(h => h.price));
  };

  const getAveragePrice = () => {
    if (apiData?.statistics) {
      return apiData.statistics.average;
    }
    if (priceHistory.length === 0) return 0;
    const sum = priceHistory.reduce((acc, h) => acc + h.price, 0);
    return sum / priceHistory.length;
  };

  if (!visible) return null;

  return (
    <Modal 
      visible={visible} 
      animationType="fade" 
      transparent={true}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>📊 Análise de Preços</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Game Info */}
          <View style={styles.gameInfo}>
            <Text style={styles.gameTitle} numberOfLines={2}>{gameTitle}</Text>
            <Text style={styles.currentPrice}>
              Preço Atual: {formatPrice(currentPrice)}
            </Text>
          </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Carregando histórico...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={48} color="#F59E0B" />
            <Text style={styles.errorTitle}>Erro ao carregar dados</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                if (gameId) {
                  setError(null);
                  setLoading(true);
                  fetchPriceHistory(gameId, 30)
                    .then((data) => {
                      setApiData(data);
                      const history = transformApiDataToHistory(data);
                      setPriceHistory(history);
                      setLoading(false);
                    })
                    .catch((err) => {
                      setError(err.message || 'Erro ao carregar histórico');
                      setLoading(false);
                    });
                }
              }}
            >
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : priceHistory.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Ionicons name="analytics-outline" size={64} color="#6B7280" />
            <Text style={styles.noDataTitle}>Histórico não disponível</Text>
            <Text style={styles.noDataText}>
              Não há dados de histórico de preços disponíveis para este jogo ainda.
            </Text>
            <Text style={styles.noDataSubtext}>
              Os dados de preços são coletados automaticamente. Tente novamente mais tarde.
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Resumo */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>💰 Preço Atual</Text>
                <Text style={styles.summaryValue}>{formatPrice(getLowestPrice())}</Text>
                <Text style={styles.summaryStore}>🎮 Steam</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>💸 Preço Original</Text>
                <Text style={styles.summaryValue}>{formatPrice(getHighestPrice())}</Text>
                <Text style={styles.summaryStore}>Steam Store</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>🔥 Desconto</Text>
                <Text style={styles.summaryValue}>
                  {getHighestPrice() > getLowestPrice() 
                    ? Math.round(((getHighestPrice() - getLowestPrice()) / getHighestPrice()) * 100)
                    : 0}%
                </Text>
                <Text style={styles.summaryStore}>Desconto atual</Text>
              </View>
            </View>

            {/* Lista de Histórico */}
            <View style={styles.historyContainer}>
              <Text style={styles.sectionTitle}>📊 Dados Atuais da Steam ({priceHistory.length} registros reais)</Text>
              {apiData?.notice && (
                <View style={{ backgroundColor: '#374151', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <Text style={{ color: '#F59E0B', fontSize: 12, textAlign: 'center' }}>
                    ℹ️ {apiData.notice}
                  </Text>
                </View>
              )}
              {priceHistory.length > 0 ? (
                priceHistory.slice(0, 50).map((item, index) => 
                  React.createElement(View, 
                    { 
                      key: `${item.date}-${item.storeName}-${index}`,
                      style: [
                        styles.historyItem,
                        item.storeName === 'Steam' && styles.steamHistoryItem,
                        item.storeName === 'Epic Games' && styles.epicHistoryItem
                      ]
                    },
                    React.createElement(View, { style: styles.historyLeft },
                      React.createElement(Text, { style: styles.historyDate }, formatDate(item.date)),
                      React.createElement(Text, { 
                        style: [
                          styles.historyStore,
                          item.storeName === 'Steam' && styles.steamStore,
                          item.storeName === 'Epic Games' && styles.epicStore
                        ] 
                      }, item.storeName === 'Steam' ? '🎮 Steam' : '🎯 Epic Games')
                    ),
                    React.createElement(Text, {
                      style: [
                        styles.historyPrice,
                        item.price === getLowestPrice() && styles.lowestPrice,
                        item.price === getHighestPrice() && styles.highestPrice
                      ]
                    }, formatPrice(item.price))
                  )
                )
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>
                    {apiData ? 'Nenhum dado de histórico encontrado nos últimos 30 dias' : 'Nenhum dado de histórico disponível'}
                  </Text>
                </View>
              )}
            </View>

            {/* Preço Atual da Steam */}
            {apiData?.currentPrices?.steam && (
              <View style={styles.currentPricesContainer}>
                <Text style={styles.sectionTitle}>Preço Atual</Text>
                {React.createElement(View, 
                  { 
                    key: 'steam',
                    style: styles.currentPriceItem 
                  },
                  React.createElement(View, { style: styles.storeInfo },
                    React.createElement(Text, { style: styles.storeName }, '🎮 Steam'),
                    React.createElement(Text, { style: styles.priceDate }, formatDate(apiData.currentPrices.steam.date))
                  ),
                  React.createElement(Text, {
                    style: [
                      styles.currentPrice,
                      apiData.currentPrices.steam.price === getLowestPrice() && styles.lowestPrice
                    ]
                  }, formatPrice(apiData.currentPrices.steam.price))
                )}
              </View>
            )}

            {/* Informações adicionais */}
            {apiData?.statistics && (
              <View style={styles.additionalInfo}>
                <Text style={styles.sectionTitle}>Estatísticas</Text>
                <Text style={styles.infoText}>
                  📊 Total de registros: {apiData.statistics.dataPoints}
                </Text>
                {apiData.statistics.lowestDate && (
                  <Text style={styles.infoText}>
                    🏆 Melhor preço em: {formatDate(apiData.statistics.lowestDate)}
                    {apiData.statistics.lowestStore && ` (${apiData.statistics.lowestStore})`}
                  </Text>
                )}
                {apiData.alerts.isBestPriceEver && (
                  <Text style={styles.bestPriceAlert}>
                    🔥 Melhor preço histórico disponível!
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
        )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    width: '90%',
    minHeight: '70%',
    maxHeight: '85%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  closeButton: {
    padding: 4,
  },
  gameInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 6,
  },
  currentPrice: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
    maxHeight: 800,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  summaryItem: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#374151',
    borderRadius: 10,
    marginHorizontal: 3,
    marginVertical: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  historyContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: '#374151',
    borderRadius: 10,
    marginBottom: 10,
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F9FAFB',
  },
  historyStore: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 3,
  },
  historyPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  lowestPrice: {
    color: '#4CAF50',
  },
  highestPrice: {
    color: '#F44336',
  },
  // Estilos para tratamento de erro
  errorContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginTop: 12,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '500',
  },
  // Estilos para dados vazios
  noDataContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  noDataSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // Estilos para informações adicionais
  additionalInfo: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  bestPriceAlert: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 4,
  },
  summaryStore: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  // Estilos para preços atuais
  currentPricesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: 8,
  },
  currentPriceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#374151',
    borderRadius: 6,
    marginBottom: 6,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  priceDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  // Estilos específicos por loja
  steamHistoryItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#1B4F72', // Azul Steam
  },
  epicHistoryItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#7B2CBF', // Roxo Epic
  },
  steamStore: {
    color: '#5DADE2', // Azul claro Steam
  },
  epicStore: {
    color: '#BB86FC', // Roxo claro Epic
  },
});

export default PriceAnalysisModal;