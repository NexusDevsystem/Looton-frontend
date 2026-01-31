import { Favorite, Game, List, ListItem } from '../types'
import { API_URL } from '../api/client'

export class FavoritesService {
  // Favoritos
  static async addFavorite(userId: string, gameId: string, options?: {
    stores?: string[]
    notifyUp?: boolean
    notifyDown?: boolean
    pctThreshold?: number
    desiredPriceCents?: number
    listId?: string
  }): Promise<Favorite> {
    const body: any = { userId, gameId }
    if (options) {
      if (options.stores) body.stores = options.stores
      if (options.notifyUp !== undefined) body.notifyUp = options.notifyUp
      if (options.notifyDown !== undefined) body.notifyDown = options.notifyDown
      if (options.pctThreshold !== undefined) body.pctThreshold = options.pctThreshold
      if (options.desiredPriceCents !== undefined) body.desiredPriceCents = options.desiredPriceCents
      if (options.listId !== undefined) body.listId = options.listId
    }

    const response = await fetch(`${API_URL}/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao adicionar favorito')
    }

    return response.json()
  }

  static async getFavorites(userId: string, filters?: {
    store?: 'steam'
    changed?: 'down' | 'up'
  }): Promise<Favorite[]> {
    const params = new URLSearchParams({ userId })
    if (filters?.store) params.append('store', filters.store)
    if (filters?.changed) params.append('changed', filters.changed)

    const response = await fetch(`${API_URL}/favorites?${params}`)
    
    if (!response.ok) {
      throw new Error('Erro ao buscar favoritos')
    }

    return response.json()
  }

  static async removeFavorite(favoriteId: string): Promise<void> {
    const response = await fetch(`${API_URL}/favorites/${favoriteId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Erro ao remover favorito')
    }
  }

  // Listas
  static async createList(userId: string, name: string): Promise<List> {
    const body: any = { name }
    if (userId) body.userId = userId

    const response = await fetch(`${API_URL}/lists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao criar lista')
    }

    return response.json()
  }

  static async getLists(userId: string): Promise<List[]> {
    const url = userId ? `${API_URL}/lists?userId=${userId}` : `${API_URL}/lists`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error('Erro ao buscar listas')
    }

    return response.json()
  }

  static async addGameToList(listId: string, gameId: string, options?: {
    notes?: string
    sortIndex?: number
  }): Promise<ListItem> {
    const response = await fetch(`${API_URL}/lists/${listId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameId,
        ...options
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao adicionar jogo à lista')
    }

    return response.json()
  }

  static async getListItems(listId: string): Promise<ListItem[]> {
    const response = await fetch(`${API_URL}/lists/${listId}/items`)
    
    if (!response.ok) {
      throw new Error('Erro ao buscar itens da lista')
    }

    return response.json()
  }

  static async removeFromList(listId: string, itemId: string): Promise<void> {
    const response = await fetch(`${API_URL}/lists/${listId}/items/${itemId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Erro ao remover item da lista')
    }
  }

  static async deleteList(listId: string): Promise<void> {
    const response = await fetch(`${API_URL}/lists/${listId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Erro ao excluir lista')
    }
  }

  // Filtros e busca
  static async getFilteredDeals(filters: {
    genres?: string[]
    tags?: string[]
    stores?: string[]
    minDiscount?: number
    maxPrice?: number
    page?: number
    limit?: number
  }) {
    const params = new URLSearchParams()
    
    if (filters.genres?.length) params.append('genres', filters.genres.join(','))
    if (filters.tags?.length) params.append('tags', filters.tags.join(','))
    if (filters.stores?.length) params.append('stores', filters.stores.join(','))
    if (filters.minDiscount) params.append('minDiscount', filters.minDiscount.toString())
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const response = await fetch(`${API_URL}/deals/filter?${params}`)
    
    if (!response.ok) {
      throw new Error('Erro ao buscar ofertas filtradas')
    }

    return response.json()
  }

  static async searchGames(filters: {
    q?: string
    genres?: string[]
    tags?: string[]
    stores?: string[]
    page?: number
    limit?: number
  }) {
    const params = new URLSearchParams()
    
    if (filters.q) params.append('q', filters.q)
    if (filters.genres?.length) params.append('genres', filters.genres.join(','))
    if (filters.tags?.length) params.append('tags', filters.tags.join(','))
    if (filters.stores?.length) params.append('stores', filters.stores.join(','))
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const response = await fetch(`${API_URL}/games/search?${params}`)
    
    if (!response.ok) {
      throw new Error('Erro ao buscar jogos')
    }

    return response.json()
  }
}