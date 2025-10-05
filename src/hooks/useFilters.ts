import { useState, useEffect, useCallback, useMemo } from 'react'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export interface FilteredDealsResponse {
  deals: any[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface FilterOptions {
  genres?: string[]
  tags?: string[]
  stores?: string[]
  minDiscount?: number
  maxPrice?: number
  page?: number
  limit?: number
}

export const useFilters = () => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedStores, setSelectedStores] = useState<string[]>([])
  const [minDiscount, setMinDiscount] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined)
  const [filteredDeals, setFilteredDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Listas de gêneros e tags disponíveis (mock inicial - em um app real viria da API)
  const availableGenres = [
    'RPG', 'Ação', 'Aventura', 'Estratégia', 'Simulação', 'Esportes', 
    'Corrida', 'FPS', 'MOBA', 'Puzzle', 'Plataforma', 'Indie'
  ]

  const availableTags = [
    'Mundo Aberto', 'Singleplayer', 'Multiplayer', 'Cooperativo', 
    'Competitivo', 'História Rica', 'Fantasia', 'Sci-Fi', 'Soulslike',
    'Survival', 'Crafting', 'Free to Play', 'Early Access', 'Roguelike'
  ]

  const availableStores = ['steam', 'epic']

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    )
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const toggleStore = (store: string) => {
    setSelectedStores(prev => 
      prev.includes(store) 
        ? prev.filter(s => s !== store)
        : [...prev, store]
    )
  }

  const clearFilters = () => {
    setSelectedGenres([])
    setSelectedTags([])
    setSelectedStores([])
    setMinDiscount(0)
    setMaxPrice(undefined)
  }

  const hasActiveFilters = useMemo(() => {
    return selectedGenres.length > 0 || 
           selectedTags.length > 0 || 
           selectedStores.length > 0 || 
           minDiscount > 0 || 
           maxPrice !== undefined
  }, [selectedGenres.length, selectedTags.length, selectedStores.length, minDiscount, maxPrice])

  const fetchFilteredDeals = async (options: FilterOptions = {}) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      
      if (selectedGenres.length > 0 || options.genres?.length) {
        params.append('genres', (options.genres || selectedGenres).join(','))
      }
      
      if (selectedTags.length > 0 || options.tags?.length) {
        params.append('tags', (options.tags || selectedTags).join(','))
      }
      
      if (selectedStores.length > 0 || options.stores?.length) {
        params.append('stores', (options.stores || selectedStores).join(','))
      }
      
      if (options.minDiscount !== undefined || minDiscount > 0) {
        params.append('minDiscount', String(options.minDiscount ?? minDiscount))
      }
      
      if (options.maxPrice !== undefined || maxPrice !== undefined) {
        params.append('maxPrice', String(options.maxPrice ?? maxPrice))
      }
      
      params.append('page', String(options.page || 1))
      params.append('limit', String(options.limit || 24))

      const response = await fetch(`${API_URL}/deals/filter?${params}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar ofertas filtradas')
      }

      const data: FilteredDealsResponse = await response.json()
      setFilteredDeals(data.deals)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const searchGames = async (query: string, options: FilterOptions = {}) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      
      if (query) {
        params.append('q', query)
      }
      
      if (selectedGenres.length > 0 || options.genres?.length) {
        params.append('genres', (options.genres || selectedGenres).join(','))
      }
      
      if (selectedTags.length > 0 || options.tags?.length) {
        params.append('tags', (options.tags || selectedTags).join(','))
      }
      
      if (selectedStores.length > 0 || options.stores?.length) {
        params.append('stores', (options.stores || selectedStores).join(','))
      }
      
      params.append('page', String(options.page || 1))
      params.append('limit', String(options.limit || 24))

      const response = await fetch(`${API_URL}/games/search?${params}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar jogos')
      }

      const data = await response.json()
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    // Estados
    selectedGenres,
    selectedTags,
    selectedStores,
    minDiscount,
    maxPrice,
    filteredDeals,
    loading,
    error,
    
    // Listas disponíveis
    availableGenres,
    availableTags,
    availableStores,
    
    // Ações
    toggleGenre,
    toggleTag,
    toggleStore,
    setMinDiscount,
    setMaxPrice,
    clearFilters,
    hasActiveFilters,
    fetchFilteredDeals,
    searchGames
  }
}