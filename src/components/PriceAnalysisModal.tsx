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

// Função para gerar dados mock dos últimos 30 dias
const generateMockPriceHistory = (basePrice: number): PriceHistory[] => {
  const history: PriceHistory[] = [];
  const stores = ['Steam', 'Epic Games', 'GOG', 'Microsoft Store'];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Histórico de Preços</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
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
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Carregando histórico...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Resumo */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Menor Preço (30 dias)</Text>
                <Text style={styles.summaryValue}>{formatPrice(getLowestPrice())}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Maior Preço (30 dias)</Text>
                <Text style={styles.summaryValue}>{formatPrice(getHighestPrice())}</Text>
              </View>
            </View>

            {/* Lista de Histórico */}
            <View style={styles.historyContainer}>
              <Text style={styles.sectionTitle}>Últimos 30 dias</Text>
              {priceHistory.map((item, index) => (
                <View key={index} style={styles.historyItem}>
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  gameInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  content: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  historyContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    marginBottom: 8,
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  historyStore: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  historyPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  lowestPrice: {
    color: '#4CAF50',
  },
  highestPrice: {
    color: '#F44336',
  },
});

export default PriceAnalysisModal;