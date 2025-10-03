import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

// 🔥 VERSÃO ULTRA-SIMPLES - SEM MODAL, SEM COMPLEXIDADE
export function PriceAnalysisModal({ 
  visible, 
  onClose, 
  gameId, 
  gameTitle, 
  currentPrice 
}: PriceAnalysisModalProps) {
  const [loading, setLoading] = useState(false);
  const [priceInfo, setPriceInfo] = useState<string>('');

  useEffect(() => {
    if (visible && gameId) {
      loadSimpleHistory();
    }
  }, [visible, gameId]);

  const loadSimpleHistory = async () => {
    setLoading(true);
    try {
      // Simulação simples - substituir por API real depois
      setTimeout(() => {
        setPriceInfo(`Histórico de preços para ${gameTitle}

Preço atual: ${formatSafePrice(currentPrice)}

Esta é uma versão simplificada.
Sem crashes, sem complexidade.

📊 Histórico básico disponível
🔄 Versão completa em breve`);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setPriceInfo('Erro ao carregar dados');
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.simpleContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Histórico de Preços</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        ) : (
          <Text style={styles.priceText}>{priceInfo}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  simpleContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    maxHeight: 400,
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
    padding: 20,
    backgroundColor: '#374151',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
    minHeight: 200,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 14,
  },
  priceText: {
    color: '#E5E7EB',
    fontSize: 16,
    lineHeight: 24,
  },
});