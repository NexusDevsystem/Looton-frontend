import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  PriceHistoryService, 
  PriceHistoryResponse, 
  PriceHistoryEntry 
} from '../services/PriceHistoryService';

const { width, height } = Dimensions.get('window');

// 🔒 FUNÇÕES UTILITÁRIAS PARA BLINDAGEM TOTAL CONTRA .length EM UNDEFINED
const isArr = (v: any): v is any[] => Array.isArray(v);
const len = (v: any) => (Array.isArray(v) ? v.length : 0);
const arr = <T,>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : []);
const obj = <T extends object>(v: T | undefined | null): T => (v ?? ({} as T));

// Função helper para formatação segura de moeda
function formatSafePrice(cents?: number, currency = 'BRL'): string {
  if (cents == null || !Number.isFinite(cents)) return '—';
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency });
}

interface PriceAnalysisModalProps {
  visible: boolean;
  onClose: () => void;
  gameId: string;
  gameTitle: string;
  currentPrice?: number;
}

export function PriceAnalysisModal({ 
  visible, 
  onClose, 
  gameId, 
  gameTitle, 
  currentPrice 
}: PriceAnalysisModalProps) {
  // 🛡️ EARLY RETURN - Evita renderização com props inválidas
  if (!visible || !gameId || !gameTitle) {
    return null;
  }

  const [data, setData] = useState<PriceHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(90);

  // 🔒 SEMPRE arrays/objetos válidos - BLINDAGEM TOTAL
  const priceHistory = arr(data?.history);
  const currentPrices = obj(data?.currentPrices);
  const stats = obj(data?.stats);
  const analysis = obj(data?.analysis);
  const series = arr((data as any)?.series); // às vezes vem como "series"
  const points = arr((analysis as any)?.series); // ou series dentro de analysis
  
  // Debug payload com funções seguras
  useEffect(() => {
    if (visible && data && __DEV__) {
      console.log('🔒 PriceAnalysis payload safe:', {
        keys: data ? Object.keys(data) : [],
        priceHistory: len(priceHistory),
        currentPrices: len(Object.keys(currentPrices)),
        seriesTop: len(series),
        seriesInAnalysis: len(points),
        hasStats: len(Object.keys(stats)) > 0,
        hasAnalysis: len(Object.keys(analysis)) > 0
      });
    }
  }, [visible, data]);  // removido history.length - usar len()

  useEffect(() => {
    if (visible && gameId) {
      loadPriceHistory();
    }
  }, [visible, gameId, selectedPeriod]);

  const loadPriceHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await PriceHistoryService.getGamePriceHistory(gameId, selectedPeriod);
      setData(response);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const renderSimpleChart = () => {
    const safeHistory = arr(priceHistory).filter(h => h && typeof h.price === 'number' && Number.isFinite(h.price));
    if (len(safeHistory) === 0) return null;

    const prices = arr(safeHistory).map(h => h.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Evolução de Preços (Últimos {selectedPeriod} dias)</Text>
        
        <View style={styles.chartArea}>
          {arr(safeHistory).slice(-30).map((entry, index) => {
            const height = ((entry.price - minPrice) / range) * 100;
            const isLowest = entry.price === minPrice;
            
            return (
              <View key={index} style={styles.chartBar}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: Math.max(height, 2), 
                      backgroundColor: isLowest ? '#10B981' : '#3B82F6' 
                    }
                  ]} 
                />
              </View>
            );
          })}
        </View>
        
        <View style={styles.chartLabels}>
          <Text style={styles.chartLabel}>
            Min: {formatSafePrice(minPrice * 100)}
          </Text>
          <Text style={styles.chartLabel}>
            Max: {formatSafePrice(maxPrice * 100)}
          </Text>
        </View>
      </View>
    );
  };

  const renderAnalysis = () => {
    if (len(Object.keys(stats)) === 0 || len(Object.keys(analysis)) === 0) return null;
    const recommendation = analysis.recommendation;
    const color = PriceHistoryService.getRecommendationColor(recommendation);

    return (
      <View style={styles.analysisContainer}>
        <Text style={styles.analysisTitle}>Análise de Preço</Text>
        
        <View style={[styles.recommendationBadge, { backgroundColor: color + '20' }]}>
          <Ionicons 
            name={analysis.isCurrentBestPrice ? "checkmark-circle" : "information-circle"} 
            size={20} 
            color={color} 
          />
          <Text style={[styles.recommendationText, { color }]}>
            {recommendation.toUpperCase()}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Menor Preço</Text>
            <Text style={styles.statValue}>
              {formatSafePrice(stats.lowest)}
            </Text>
            <Text style={styles.statDate}>
              {PriceHistoryService.formatDate(stats.lowestDate)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Preço Atual</Text>
            <Text style={styles.statValue}>
              {formatSafePrice(stats.current)}
            </Text>
            <Text style={styles.statExtra}>
              {analysis.percentageFromLowest > 0 
                ? `+${analysis.percentageFromLowest.toFixed(0)}% do menor`
                : 'Menor preço histórico!'
              }
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Preço Médio</Text>
            <Text style={styles.statValue}>
              {formatSafePrice(stats.average)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCurrentPrices = () => {
    const stores = Object.entries(obj(currentPrices));
    if (len(stores) === 0) return null;

    return (
      <View style={styles.currentPricesContainer}>
        <Text style={styles.sectionTitle}>Preços Atuais por Loja</Text>
        
        {arr(stores).filter(([store, info]) => store && info && typeof info.price === 'number' && Number.isFinite(info.price)).map(([store, info]) => (
          <View key={store} style={styles.priceRow}>
            <Text style={styles.storeName}>{store}</Text>
            <Text style={styles.storePrice}>
              {formatSafePrice(info.price)}
            </Text>
          </View>
        ))}
      </View>
    );
  };



  // Estado vazio quando não há histórico - usando len() para segurança
  const hasHistory = len(priceHistory) > 0;
  const hasCurrentPrices = len(Object.keys(currentPrices)) > 0;
  const hasAnyData = hasHistory || hasCurrentPrices || len(series) > 0 || len(points) > 0;
  
  // Sem histórico → estado vazio, não renderize gráfico/lista
  if (!loading && !error && data && !hasAnyData) {


    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <LinearGradient colors={['#1F2937', '#111827']} style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={2}>{gameTitle}</Text>
              </View>
            </View>
          </LinearGradient>
          <View style={styles.emptyContainer}>
            <Ionicons name="analytics-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Sem histórico ainda</Text>
            <Text style={styles.emptySubtitle}>
              Quando tivermos dados de preço para este jogo, a análise aparece aqui.
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>Entendi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#1F2937', '#111827']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle} numberOfLines={2}>
                {gameTitle}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Período Selector */}
          <View style={styles.periodSelector}>
            {[30, 90, 180].map(days => (
              <TouchableOpacity
                key={days}
                onPress={() => setSelectedPeriod(days)}
                style={[
                  styles.periodButton,
                  selectedPeriod === days && styles.periodButtonActive
                ]}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === days && styles.periodButtonTextActive
                ]}>
                  {days} dias
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Carregando histórico...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={loadPriceHistory} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Tentar Novamente</Text>
              </TouchableOpacity>
            </View>
          )}

          {data && !loading && !error && (
            <>
              {renderSimpleChart()}
              {renderAnalysis()}
              {renderCurrentPrices()}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: 'white',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 12,
  },
  chartBar: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    marginHorizontal: 1,
  },
  bar: {
    backgroundColor: '#3B82F6',
    borderRadius: 1,
    minHeight: 2,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  analysisContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  recommendationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  recommendationText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  statDate: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  statExtra: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  currentPricesContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  storeName: {
    fontSize: 14,
    color: '#4B5563',
  },
  storePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
