import React, { useState, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

interface PriceHistoryEntry {
  date: string
  price: number
  store: string
  discount?: number
}

interface PriceHistoryModalProps {
  gameId?: number
  gameName?: string
  visible: boolean
  onClose: () => void
}

const { width } = Dimensions.get('window')

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({
  gameId,
  gameName,
  visible,
  onClose,
}) => {
  const [history, setHistory] = useState<PriceHistoryEntry[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Simula busca de histórico (depois integrar com API real)
  const loadPriceHistory = async (id: number): Promise<PriceHistoryEntry[]> => {
    // Simula delay de API
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Simula dados de histórico
    const now = new Date()
    const mockHistory: PriceHistoryEntry[] = []
    
    // Gera 10 pontos de dados dos últimos 30 dias
    for (let i = 0; i < 10; i++) {
      const daysAgo = Math.floor(Math.random() * 30)
      const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      const basePrice = 50 + Math.random() * 100
      const discount = Math.random() * 50
      
      mockHistory.push({
        date: date.toISOString().split('T')[0],
        price: Math.round(basePrice * 100) / 100,
        store: ['Steam', 'Epic', 'GOG'][Math.floor(Math.random() * 3)],
        discount: discount > 5 ? Math.round(discount) : undefined,
      })
    }

    // Ordena por data
    return mockHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  // Carrega histórico quando modal abre
  useEffect(() => {
    if (visible && gameId && !history) {
      setLoading(true)
      setError(null)
      
      loadPriceHistory(gameId)
        .then(setHistory)
        .catch((err) => {
          console.error('Erro ao carregar histórico:', err)
          setError('Erro ao carregar histórico de preços')
        })
        .finally(() => setLoading(false))
    }
  }, [visible, gameId, history])

  // Reset quando modal fecha
  useEffect(() => {
    if (!visible) {
      setHistory(null)
      setError(null)
    }
  }, [visible])

  const renderSimpleChart = () => {
    if (!history || history.length === 0) return null

    const prices = history.map(h => h.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice

    return (
      <View style={{ marginVertical: 20 }}>
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
          Gráfico de Preços (Últimos 30 dias)
        </Text>
        
        <View style={{
          height: 120,
          backgroundColor: '#374151',
          borderRadius: 12,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
        }}>
          {history.map((entry, index) => {
            const heightPercent = priceRange > 0 ? ((entry.price - minPrice) / priceRange) : 0.5
            const barHeight = Math.max(20, heightPercent * 80)
            
            return (
              <View key={index} style={{ alignItems: 'center', flex: 1 }}>
                <View style={{
                  width: 8,
                  height: barHeight,
                  backgroundColor: entry.price === minPrice ? '#10B981' : '#3B82F6',
                  borderRadius: 4,
                  marginBottom: 4,
                }} />
                <Text style={{ 
                  color: '#9CA3AF', 
                  fontSize: 8,
                  transform: [{ rotate: '-45deg' }],
                  width: 30,
                  textAlign: 'center'
                }}>
                  {entry.date.split('-')[2]}
                </Text>
              </View>
            )
          })}
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={{ color: '#10B981', fontSize: 12 }}>
            Min: R$ {minPrice.toFixed(2)}
          </Text>
          <Text style={{ color: '#EF4444', fontSize: 12 }}>
            Max: R$ {maxPrice.toFixed(2)}
          </Text>
        </View>
      </View>
    )
  }

  const renderStatistics = () => {
    if (!history || history.length === 0) return null

    const prices = history.map(h => h.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
    const currentEntry = history[history.length - 1]

    return (
      <View style={{ marginVertical: 20 }}>
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 15 }}>
          Estatísticas
        </Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <View style={{ 
            backgroundColor: '#374151', 
            padding: 12, 
            borderRadius: 8, 
            flex: 1, 
            minWidth: '45%' 
          }}>
            <Text style={{ color: '#10B981', fontSize: 12, fontWeight: 'bold' }}>
              MENOR PREÇO
            </Text>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
              R$ {minPrice.toFixed(2)}
            </Text>
          </View>
          
          <View style={{ 
            backgroundColor: '#374151', 
            padding: 12, 
            borderRadius: 8, 
            flex: 1, 
            minWidth: '45%' 
          }}>
            <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: 'bold' }}>
              MAIOR PREÇO
            </Text>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
              R$ {maxPrice.toFixed(2)}
            </Text>
          </View>
          
          <View style={{ 
            backgroundColor: '#374151', 
            padding: 12, 
            borderRadius: 8, 
            flex: 1, 
            minWidth: '45%' 
          }}>
            <Text style={{ color: '#3B82F6', fontSize: 12, fontWeight: 'bold' }}>
              PREÇO MÉDIO
            </Text>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
              R$ {avgPrice.toFixed(2)}
            </Text>
          </View>
          
          <View style={{ 
            backgroundColor: '#374151', 
            padding: 12, 
            borderRadius: 8, 
            flex: 1, 
            minWidth: '45%' 
          }}>
            <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: 'bold' }}>
              ATUAL
            </Text>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
              R$ {currentEntry?.price.toFixed(2) || 'N/A'}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#374151',
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                Histórico de Preços
              </Text>
              {gameName && (
                <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 2 }}>
                  {gameName}
                </Text>
              )}
            </View>
            
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={{ flex: 1, padding: 20 }}>
            {loading && (
              <View style={{ alignItems: 'center', marginTop: 50 }}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={{ color: '#9CA3AF', marginTop: 16 }}>
                  Carregando histórico...
                </Text>
              </View>
            )}

            {error && (
              <View style={{ alignItems: 'center', marginTop: 50 }}>
                <Ionicons name="warning-outline" size={48} color="#EF4444" />
                <Text style={{ color: '#EF4444', marginTop: 16, textAlign: 'center' }}>
                  {error}
                </Text>
              </View>
            )}

            {history && !loading && !error && (
              <>
                {renderSimpleChart()}
                {renderStatistics()}
                
                {/* Lista de preços */}
                <View style={{ marginTop: 20 }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 15 }}>
                    Histórico Detalhado
                  </Text>
                  
                  {history.map((entry, index) => (
                    <View key={index} style={{
                      backgroundColor: '#374151',
                      padding: 12,
                      borderRadius: 8,
                      marginBottom: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <View>
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>
                          R$ {entry.price.toFixed(2)}
                        </Text>
                        <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
                          {entry.store} • {new Date(entry.date).toLocaleDateString('pt-BR')}
                        </Text>
                      </View>
                      
                      {entry.discount && (
                        <View style={{
                          backgroundColor: '#10B981',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 4,
                        }}>
                          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                            -{entry.discount}%
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  )
}