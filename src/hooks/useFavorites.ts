import { useState, useEffect } from 'react'
import { FavoritesService } from '../services/FavoritesService'
import { Favorite } from '../types'

export function useFavorites(userId: string) {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFavorites = async () => {
    if (!userId) {
      setLoading(false)
      setFavorites([])
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      const data = await FavoritesService.getFavorites(userId)
      setFavorites(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar favoritos')
    } finally {
      setLoading(false)
    }
  }

  const addFavorite = async (gameId: string, options?: {
    stores?: string[]
    notifyUp?: boolean
    notifyDown?: boolean
    pctThreshold?: number
  }) => {
    try {
      const favorite = await FavoritesService.addFavorite(userId, gameId, options)
      setFavorites(prev => [...prev, favorite])
      return favorite
    } catch (err) {
      throw err
    }
  }

  const removeFavorite = async (favoriteId: string) => {
    try {
      await FavoritesService.removeFavorite(favoriteId)
      setFavorites(prev => prev.filter(f => f._id !== favoriteId))
    } catch (err) {
      throw err
    }
  }

  const isFavorite = (gameId: string) => {
    return favorites.some(f => f.gameId._id === gameId)
  }

  const getFavoriteByGameId = (gameId: string) => {
    return favorites.find(f => f.gameId._id === gameId)
  }

  useEffect(() => {
    if (userId) {
      loadFavorites()
    }
  }, [userId])

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    isFavorite,
    getFavoriteByGameId,
    refresh: loadFavorites
  }
}