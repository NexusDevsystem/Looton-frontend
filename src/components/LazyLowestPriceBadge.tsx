import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface LazyLowestPriceBadgeProps {
  gameId?: number
  currentPrice: number
  gameName?: string
  onPress?: () => void
}

interface PriceData {
  lowestPrice: number
  lastChecked: number
}

const CACHE_KEY = 'price_cache'
const CACHE_TTL = 1000 * 60 * 60 * 24 // 24 horas

export const LazyLowestPriceBadge: React.FC<LazyLowestPriceBadgeProps> = ({
  gameId,
  currentPrice,
  gameName,
  onPress
}) => {
  const [isLowest, setIsLowest] = useState<boolean | null>(null)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  // Função para buscar preço do cache local
  const getCachedPrice = async (id: number): Promise<number | null> => {
    try {
      const cacheData = await AsyncStorage.getItem(`${CACHE_KEY}_${id}`)
      if (cacheData) {
        const parsed: PriceData = JSON.parse(cacheData)
        const now = Date.now()
        
        // Se cache ainda é válido (menos de 24h)
        if (now - parsed.lastChecked < CACHE_TTL) {
          return parsed.lowestPrice
        }
      }
      return null
    } catch {
      return null
    }
  }

  // Função para salvar preço no cache
  const setCachedPrice = async (id: number, price: number) => {
    try {
      const data: PriceData = {
        lowestPrice: price,
        lastChecked: Date.now()
      }
      await AsyncStorage.setItem(`${CACHE_KEY}_${id}`, JSON.stringify(data))
    } catch {
      // Ignora erros de cache
    }
  }

  // Simula busca de menor preço (depois integraremos com API real)
  const checkLowestPrice = async (id: number): Promise<number> => {
    // Primeiro tenta cache
    const cached = await getCachedPrice(id)
    if (cached !== null) {
      return cached
    }

    // Simula API call - depois substituir por API real
    await new Promise(resolve => setTimeout(resolve, 100 * Math.random()))
    
    // Por enquanto, simula menor preço como 80-95% do preço atual
    const simulatedLowest = currentPrice * (0.8 + Math.random() * 0.15)
    
    // Salva no cache
    await setCachedPrice(id, simulatedLowest)
    
    return simulatedLowest
  }

  // Verifica se é menor preço quando badge fica visível
  useEffect(() => {
    if (visible && gameId && isLowest === null && !loading) {
      setLoading(true)
      
      // Adiciona delay aleatório para evitar picos de carga
      const delay = Math.random() * 2000 // 0-2 segundos
      
      setTimeout(async () => {
        try {
          const lowestPrice = await checkLowestPrice(gameId)
          const tolerance = 1.05 // 5% de tolerância
          setIsLowest(currentPrice <= lowestPrice * tolerance)
        } catch (error) {
          console.warn('Erro ao verificar menor preço:', error)
          setIsLowest(false)
        } finally {
          setLoading(false)
        }
      }, delay)
    }
  }, [visible, gameId, currentPrice, isLowest, loading])

  // Só renderiza se for menor preço
  if (!isLowest) {
    return (
      <View onLayout={() => setVisible(true)} style={{ height: 0 }} />
    )
  }

  return (
    <View onLayout={() => setVisible(true)}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{
          backgroundColor: '#FF6B35',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          marginTop: 4,
          alignSelf: 'flex-start',
        }}
      >
        <Text style={{
          color: 'white',
          fontSize: 10,
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          🔥 Menor Preço!
        </Text>
      </TouchableOpacity>
    </View>
  )
}