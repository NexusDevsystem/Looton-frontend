import { useState, useEffect } from 'react'
import { FavoritesService } from '../services/FavoritesService'
import { List, ListItem } from '../types'

export function useLists(userId: string) {
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadLists = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await FavoritesService.getLists(userId)
      setLists(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar listas')
    } finally {
      setLoading(false)
    }
  }

  const createList = async (name: string) => {
    try {
      const list = await FavoritesService.createList(userId, name)
      setLists(prev => [list, ...prev])
      return list
    } catch (err) {
      throw err
    }
  }

  const deleteList = async (listId: string) => {
    try {
      await FavoritesService.deleteList(listId)
      setLists(prev => prev.filter(l => l._id !== listId))
    } catch (err) {
      throw err
    }
  }

  const addGameToList = async (listId: string, gameId: string, options?: {
    notes?: string
    sortIndex?: number
  }) => {
    try {
      const item = await FavoritesService.addGameToList(listId, gameId, options)
      // Update list item count
      setLists(prev => prev.map(list => 
        list._id === listId 
          ? { ...list, itemCount: (list.itemCount || 0) + 1 }
          : list
      ))
      return item
    } catch (err) {
      throw err
    }
  }

  const removeFromList = async (listId: string, itemId: string) => {
    try {
      await FavoritesService.removeFromList(listId, itemId)
      // Update list item count
      setLists(prev => prev.map(list => 
        list._id === listId 
          ? { ...list, itemCount: Math.max((list.itemCount || 1) - 1, 0) }
          : list
      ))
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    if (userId) {
      loadLists()
    }
  }, [userId])

  return {
    lists,
    loading,
    error,
    createList,
    deleteList,
    addGameToList,
    removeFromList,
    refresh: loadLists
  }
}

export function useListItems(listId: string | null) {
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadItems = async () => {
    if (!listId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await FavoritesService.getListItems(listId)
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar itens')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [listId])

  return {
    items,
    loading,
    error,
    refresh: loadItems
  }
}