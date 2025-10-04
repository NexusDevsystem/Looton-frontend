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

// Função para formatar preço
const formatPrice = (cents: number): string => {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Função para formatar data
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

// Função para gerar dados mock dos últimos 15 dias (otimizado para modal menor)
const generateMockPriceHistory = (basePrice: number): PriceHistory[] => {
  const history: PriceHistory[] = [];
  const stores = ['Steam', 'Epic Games', 'GOG', 'Microsoft Store'];
  const today = new Date();
  
  for (let i = 14; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Simula variação de preço de -20% a +15%
    const variation = (Math.random() - 0.5) * 0.35;
    const price = Math.round(basePrice * (1 + variation));
    const store = stores[Math.floor(Math.random() * stores.length)];
    
    history.push({
      date: date.toISOString().split('T')[0],
      price,
      storeName: store
    });
  }
  
  return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const PriceAnalysisModal: React.FC<PriceAnalysisModalProps> = ({
  visible,
  onClose,
  gameId,
  gameTitle,
  currentPrice = 4999 // valor padrão para teste
}) => {
  const [loading, setLoading] = useState(true);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      
      // Simula carregamento dos dados
      setTimeout(() => {
        const history = generateMockPriceHistory(currentPrice);
        setPriceHistory(history);
        setLoading(false);
      }, 1000);
    }
  }, [visible, currentPrice]);

  const getLowestPrice = () => {
    if (priceHistory.length === 0) return 0;
    return Math.min(...priceHistory.map(h => h.price));
  };

  const getHighestPrice = () => {
    if (priceHistory.length === 0) return 0;
    return Math.max(...priceHistory.map(h => h.price));
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
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Resumo */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Menor Preço (15 dias)</Text>
                <Text style={styles.summaryValue}>{formatPrice(getLowestPrice())}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Maior Preço (15 dias)</Text>
                <Text style={styles.summaryValue}>{formatPrice(getHighestPrice())}</Text>
              </View>
            </View>

            {/* Lista de Histórico */}
            <View style={styles.historyContainer}>
              <Text style={styles.sectionTitle}>Últimos 15 dias</Text>
              {priceHistory.map((item, index) => (
                <View style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
                    <Text style={styles.historyStore}>{item.storeName}</Text>
                  </View>
                  <Text style={[
                    styles.historyPrice,
                    item.price === getLowestPrice() && styles.lowestPrice,
                    item.price === getHighestPrice() && styles.highestPrice
                  ]}>
                    {formatPrice(item.price)}
                  </Text>
                </View>
              ))}
            </View>
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
    padding: 20,
  },
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
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
    fontSize: 18,
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
    maxHeight: 400,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#374151',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  historyContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#374151',
    borderRadius: 6,
    marginBottom: 6,
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#F9FAFB',
  },
  historyStore: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  historyPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  lowestPrice: {
    color: '#4CAF50',
  },
  highestPrice: {
    color: '#F44336',
  },
});

export default PriceAnalysisModal;