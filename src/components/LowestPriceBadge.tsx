import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface LowestPriceBadgeProps {
  isLowestPrice: boolean
  onPress?: () => void
  compact?: boolean
}

export const LowestPriceBadge: React.FC<LowestPriceBadgeProps> = ({ 
  isLowestPrice, 
  onPress, 
  compact = false 
}) => {
  if (!isLowestPrice) return null

  if (compact) {
    return (
      <TouchableOpacity
        style={{
          backgroundColor: '#FF6B35',
          borderRadius: 12,
          paddingHorizontal: 6,
          paddingVertical: 2,
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          elevation: 2,
          shadowColor: '#FF6B35',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        }}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Ionicons name="flame" size={12} color="#FFFFFF" />
        <Text style={{
          color: '#FFFFFF',
          fontSize: 10,
          fontWeight: 'bold',
          marginLeft: 2,
        }}>
          MENOR PREÇO
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      style={{
        backgroundColor: '#FF6B35',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        elevation: 3,
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        marginBottom: 8,
      }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name="flame" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
      <View>
        <Text style={{
          color: '#FFFFFF',
          fontSize: 12,
          fontWeight: 'bold',
          lineHeight: 14,
        }}>
          🔥 MENOR PREÇO HISTÓRICO
        </Text>
        <Text style={{
          color: '#FFFFFF',
          fontSize: 10,
          opacity: 0.9,
          lineHeight: 12,
        }}>
          Toque para ver histórico
        </Text>
      </View>
    </TouchableOpacity>
  )
}

interface PriceHistoryIndicatorProps {
  isLowestPrice: boolean
  daysTracked?: number
  onPress?: () => void
}

export const PriceHistoryIndicator: React.FC<PriceHistoryIndicatorProps> = ({ 
  isLowestPrice, 
  daysTracked,
  onPress 
}) => {
  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isLowestPrice ? '#FF6B35' : '#374151',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignSelf: 'flex-start',
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={isLowestPrice ? "flame" : "trending-down"} 
        size={12} 
        color="#FFFFFF" 
        style={{ marginRight: 4 }}
      />
      <Text style={{
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '600',
      }}>
        {isLowestPrice ? 'MENOR PREÇO' : 'HISTÓRICO'}
      </Text>
      {daysTracked && (
        <Text style={{
          color: '#FFFFFF',
          fontSize: 9,
          opacity: 0.8,
          marginLeft: 2,
        }}>
          ({daysTracked}d)
        </Text>
      )}
    </TouchableOpacity>
  )
}