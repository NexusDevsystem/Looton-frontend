import React, { useEffect, useState } from 'react'
import { 
  View, 
  Text, 
  Modal, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions 
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { PriceHistoryService, GamePriceHistory } from '../services/PriceHistoryService'
import { tokens } from '../theme/tokens'

interface PriceHistoryModalProps {
  visible: boolean
  onClose: () => void
  appId: number
  gameTitle: string
}

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({
  visible,
  onClose,
  appId,
  gameTitle
}) => {
  const [history, setHistory] = useState<GamePriceHistory | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible && appId) {
      loadPriceHistory()
    }
  }, [visible, appId])

  const loadPriceHistory = async () => {
    setLoading(true)
    try {
      const [gameHistory, priceStats] = await Promise.all([
        PriceHistoryService.getGamePriceHistory(appId),
        PriceHistoryService.getPriceStats(appId)
      ])
      
      setHistory(gameHistory)
      setStats(priceStats)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      year: '2-digit'
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStoreBadgeColor = (store: string) => {
    const colors: Record<string, string> = {
      'steam': '#1B2838',
      'epic': '#000000',
      'gog': '#8A2BE2',
      'ubisoft': '#0088CC',
      'origin': '#FF6600',
      'default': '#374151'
    }
    return colors[store.toLowerCase()] || colors.default
  }

  const renderPriceChart = () => {
    if (!history || history.history.length === 0) return null

    const prices = history.history.map(h => h.price)
    const maxPrice = Math.max(...prices)
    const minPrice = Math.min(...prices)
    const priceRange = maxPrice - minPrice

    return (
      <View style={{ marginVertical: 20 }}>
        <Text style={{ 
          color: tokens.colors.text, 
          fontSize: 16, 
          fontWeight: 'bold', 
          marginBottom: 12 
        }}>
          Gráfico de Preços (Últimos {history.history.length} registros)
        </Text>
        
        <View style={{
          height: 150,
          backgroundColor: tokens.colors.bgElev,
          borderRadius: 12,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'flex-end',
        }}>
          {history.history.slice(-30).map((entry, index) => {
            const heightPercent = priceRange > 0 ? 
              ((entry.price - minPrice) / priceRange) * 100 : 50
            const isLowest = entry.price === history.lowestPrice
            
            return (
              <View key={index} style={{ flex: 1, alignItems: 'center' }}>
                <View
                  style={{
                    height: `${Math.max(heightPercent, 5)}%`,
                    backgroundColor: isLowest ? '#FF6B35' : '#3B82F6',
                    width: '80%',
                    borderRadius: 2,
                    marginHorizontal: 1,
                  }}
                />
                {index % 5 === 0 && (
                  <Text style={{
                    color: tokens.colors.textDim,
                    fontSize: 8,
                    marginTop: 4,
                    transform: [{ rotate: '-45deg' }]
                  }}>
                    {formatDate(entry.date)}
                  </Text>
                )}
              </View>
            )
          })}
        </View>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 8,
          paddingHorizontal: 12,
        }}>
          <Text style={{ color: tokens.colors.textDim, fontSize: 12 }}>
            Min: {formatCurrency(minPrice)}
          </Text>
          <Text style={{ color: tokens.colors.textDim, fontSize: 12 }}>
            Max: {formatCurrency(maxPrice)}
          </Text>
        </View>
      </View>
    )
  }

  const renderStats = () => {
    if (!stats) return null

    return (
      <View style={{ marginVertical: 20 }}>
        <Text style={{ 
          color: tokens.colors.text, 
          fontSize: 16, 
          fontWeight: 'bold', 
          marginBottom: 12 
        }}>
          Estatísticas
        </Text>
        
        <View style={{
          backgroundColor: tokens.colors.bgElev,
          borderRadius: 12,
          padding: 16,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: tokens.colors.textDim, fontSize: 12 }}>Menor Preço</Text>
              <Text style={{ color: '#FF6B35', fontSize: 16, fontWeight: 'bold' }}>
                {formatCurrency(stats.lowestPrice)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: tokens.colors.textDim, fontSize: 12 }}>Maior Preço</Text>
              <Text style={{ color: tokens.colors.text, fontSize: 16, fontWeight: 'bold' }}>
                {formatCurrency(stats.highestPrice)}
              </Text>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: tokens.colors.textDim, fontSize: 12 }}>Preço Médio</Text>
              <Text style={{ color: tokens.colors.text, fontSize: 16, fontWeight: 'bold' }}>
                {formatCurrency(stats.averagePrice)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: tokens.colors.textDim, fontSize: 12 }}>Economia Máxima</Text>
              <Text style={{ color: '#10B981', fontSize: 16, fontWeight: 'bold' }}>
                {stats.priceDropPercentage.toFixed(1)}%
              </Text>
            </View>
          </View>
          
          <View style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={{ color: tokens.colors.textDim, fontSize: 12 }}>
              Acompanhado por {stats.daysTracked} dias
            </Text>
          </View>
        </View>
      </View>
    )
  }

  const renderPriceHistory = () => {
    if (!history || history.history.length === 0) {
      return (
        <View style={{ alignItems: 'center', padding: 40 }}>
          <Ionicons name="trending-down-outline" size={60} color={tokens.colors.border} />
          <Text style={{ 
            color: tokens.colors.textDim, 
            fontSize: 16, 
            marginTop: 16, 
            textAlign: 'center' 
          }}>
            Nenhum histórico de preços disponível ainda.{'\n'}
            Continue navegando para que possamos rastrear os preços!
          </Text>
        </View>
      )
    }

    return (
      <View style={{ marginVertical: 20 }}>
        <Text style={{ 
          color: tokens.colors.text, 
          fontSize: 16, 
          fontWeight: 'bold', 
          marginBottom: 12 
        }}>
          Histórico Detalhado
        </Text>
        
        {history.history.slice().reverse().slice(0, 20).map((entry, index) => {
          const isLowest = entry.price === history.lowestPrice
          
          return (
            <View key={index} style={{
              backgroundColor: isLowest ? 'rgba(255, 107, 53, 0.1)' : tokens.colors.bgElev,
              borderRadius: 8,
              padding: 12,
              marginBottom: 8,
              borderLeftWidth: isLowest ? 4 : 0,
              borderLeftColor: '#FF6B35',
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    color: tokens.colors.text, 
                    fontSize: 16, 
                    fontWeight: 'bold' 
                  }}>
                    {formatCurrency(entry.price)}
                    {isLowest && (
                      <Text style={{ color: '#FF6B35', fontSize: 12 }}> 🔥 MENOR</Text>
                    )}
                  </Text>
                  <Text style={{ color: tokens.colors.textDim, fontSize: 12 }}>
                    {formatDate(entry.date)}
                  </Text>
                </View>
                
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{
                    backgroundColor: getStoreBadgeColor(entry.store),
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    marginBottom: 4,
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>
                      {entry.store.toUpperCase()}
                    </Text>
                  </View>
                  
                  {entry.discount && (
                    <Text style={{ color: '#10B981', fontSize: 12, fontWeight: 'bold' }}>
                      -{entry.discount}%
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )
        })}
        
        {history.history.length > 20 && (
          <Text style={{ 
            color: tokens.colors.textDim, 
            fontSize: 12, 
            textAlign: 'center',
            marginTop: 8 
          }}>
            Mostrando os 20 registros mais recentes de {history.history.length} total
          </Text>
        )}
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
        colors={[tokens.colors.bg, tokens.colors.bgElev]}
        style={{ flex: 1 }}
      >
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 20,
          paddingTop: 60,
          borderBottomWidth: 1,
          borderBottomColor: tokens.colors.border,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: tokens.colors.text,
              fontSize: 20,
              fontWeight: 'bold',
            }}>
              Histórico de Preços
            </Text>
            <Text style={{
              color: tokens.colors.textDim,
              fontSize: 14,
              marginTop: 4,
            }}>
              {gameTitle}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: tokens.colors.bgElev,
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="close" size={20} color={tokens.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          {loading ? (
            <View style={{ alignItems: 'center', padding: 40 }}>
              <ActivityIndicator size="large" color={tokens.colors.primary} />
              <Text style={{ 
                color: tokens.colors.textDim, 
                fontSize: 16, 
                marginTop: 16 
              }}>
                Carregando histórico...
              </Text>
            </View>
          ) : (
            <>
              {history?.isCurrentlyLowest && (
                <View style={{
                  backgroundColor: 'rgba(255, 107, 53, 0.1)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: '#FF6B35',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="flame" size={24} color="#FF6B35" />
                    <Text style={{
                      color: '#FF6B35',
                      fontSize: 18,
                      fontWeight: 'bold',
                      marginLeft: 8,
                    }}>
                      MENOR PREÇO HISTÓRICO!
                    </Text>
                  </View>
                  <Text style={{
                    color: tokens.colors.text,
                    fontSize: 14,
                    marginTop: 8,
                  }}>
                    Este jogo está atualmente com o menor preço já registrado em nosso sistema!
                  </Text>
                </View>
              )}
              
              {renderStats()}
              {renderPriceChart()}
              {renderPriceHistory()}
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </Modal>
  )
}