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
  const [data, setData] = useState<PriceHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(90);

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

  const renderSimpleChart = (history: PriceHistoryEntry[]) => {
    if (history.length === 0) return null;

    const prices = history.map(h => h.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Evolução de Preços (Últimos {selectedPeriod} dias)</Text>
        
        <View style={styles.chartArea}>
          {history.slice(-30).map((entry, index) => {
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
            Min: {PriceHistoryService.formatPrice(minPrice)}
          </Text>
          <Text style={styles.chartLabel}>
            Max: {PriceHistoryService.formatPrice(maxPrice)}
          </Text>
        </View>
      </View>
    );
  };

  const renderAnalysis = () => {
    if (!data?.stats || !data?.analysis) return null;

    const { stats, analysis } = data;
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
              {PriceHistoryService.formatPrice(stats.lowest)}
            </Text>
            <Text style={styles.statDate}>
              {PriceHistoryService.formatDate(stats.lowestDate)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Preço Atual</Text>
            <Text style={styles.statValue}>
              {PriceHistoryService.formatPrice(stats.current)}
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
              {PriceHistoryService.formatPrice(stats.average)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCurrentPrices = () => {
    if (!data?.currentPrices) return null;

    const stores = Object.entries(data.currentPrices);
    if (stores.length === 0) return null;

    return (
      <View style={styles.currentPricesContainer}>
        <Text style={styles.sectionTitle}>Preços Atuais por Loja</Text>
        
        {stores.map(([store, info]) => (
          <View key={store} style={styles.priceRow}>
            <Text style={styles.storeName}>{store}</Text>
            <Text style={styles.storePrice}>
              {PriceHistoryService.formatPrice(info.price)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

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
              {renderSimpleChart(data.history)}
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
});
