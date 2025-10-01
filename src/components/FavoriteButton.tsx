import React from 'react'
import { TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFavorites } from '../hooks/useFavorites'

interface FavoriteButtonProps {
  gameId: string
  userId: string
  size?: number
  style?: any
}

export function FavoriteButton({ gameId, userId, size = 24, style }: FavoriteButtonProps) {
  const { isFavorite, addFavorite, removeFavorite, getFavoriteByGameId } = useFavorites(userId)

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite(gameId)) {
        const favorite = getFavoriteByGameId(gameId)
        if (favorite) {
          await removeFavorite(favorite._id)
        }
      } else {
        await addFavorite(gameId)
      }
    } catch (error) {
      Alert.alert(
        'Erro',
        error instanceof Error ? error.message : 'Erro ao atualizar favorito'
      )
    }
  }

  const isGameFavorite = isFavorite(gameId)

  return (
    <TouchableOpacity
      onPress={handleToggleFavorite}
      style={[
        {
          padding: 8,
          borderRadius: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        },
        style
      ]}
      accessibilityLabel={isGameFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      accessibilityRole="button"
    >
      <Ionicons
        name={isGameFavorite ? 'heart' : 'heart-outline'}
        size={size}
        color={isGameFavorite ? '#FF6B6B' : '#666'}
      />
    </TouchableOpacity>
  )
}