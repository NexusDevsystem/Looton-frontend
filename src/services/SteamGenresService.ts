// Steam Genres API Service
export interface SteamGenre {
  id: string
  name: string
}

export interface UserPreferences {
  preferredSteamGenreIds: string[]
  minDiscount?: number
  stores?: string[]
}

import Constants from 'expo-constants'

function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL
  if (fromEnv && !fromEnv.includes('localhost')) return fromEnv
  // Try to infer LAN IP from Expo host
  try {
    const hostUri: string | undefined = (Constants as any)?.expoConfig?.hostUri
    if (hostUri) {
      const host = hostUri.split(':')[0]
      if (host && host !== 'localhost') return `http://${host}:3000`
    }
  } catch {}
  return fromEnv || 'http://localhost:3000'
}

const API_URL = resolveApiUrl()

/**
 * Busca o feed de curadoria (sem banco), direto da Steam via backend
 */
export async function fetchCuratedFeed(limit = 50): Promise<any[]> {
  try {
    const res = await fetch(`${API_URL}/feed/curated`)
    if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)
    const data = await res.json()
    const items = Array.isArray(data?.items) ? data.items : []
    const cut = items.slice(0, limit)
    console.log(`Curated feed recebido: ${cut.length} itens (slot: ${data?.slotDate || '-'})`)
    return cut
  } catch (e) {
    console.warn('Falha ao buscar curated feed:', e)
    return []
  }
}

/**
 * Busca os gêneros oficiais da Steam disponíveis
 */
export async function fetchSteamGenres(): Promise<SteamGenre[]> {
  try {
    console.log('Buscando gêneros oficiais da Steam...')
    const response = await fetch(`${API_URL}/steam/genres`)
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    const genres = Array.isArray(data) ? data : data.genres || []
    console.log(`Gêneros Steam carregados: ${genres.length}`)
    
    return genres
  } catch (error) {
    console.error('Erro ao buscar gêneros da Steam:', error)
    
    // Fallback expandido com gêneros comuns da Steam em português
    const fallbackGenres = [
      { id: '1', name: 'Ação' },
      { id: '2', name: 'Aventura' },
      { id: '3', name: 'Casual' },
      { id: '4', name: 'Indie' },
      { id: '5', name: 'Multijogador Massivo' },
      { id: '6', name: 'Corrida' },
      { id: '7', name: 'RPG' },
      { id: '8', name: 'Simulação' },
      { id: '9', name: 'Esportes' },
      { id: '10', name: 'Estratégia' },
      { id: '11', name: 'Puzzle' },
      { id: '12', name: 'Plataforma' },
      { id: '13', name: 'Luta' },
      { id: '14', name: 'Terror' },
      { id: '15', name: 'Sobrevivência' }
    ]
    
    console.log('Usando fallback com gêneros locais:', fallbackGenres.length)
    return fallbackGenres
  }
}

/**
 * Salva as preferências do usuário no backend
 */
export async function saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
  try {
    console.log('Salvando preferências:', preferences)
    
    const response = await fetch(`${API_URL}/users/me/preferences`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userId}` // Placeholder para token real
      },
      body: JSON.stringify(preferences)
    })
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`)
    }
    
    console.log('Preferências salvas com sucesso')
  } catch (error) {
    console.error('Erro ao salvar preferências:', error)
    throw error
  }
}

/**
 * Carrega as preferências do usuário do backend
 */
export async function loadUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    console.log('Carregando preferências do usuário...')
    
    const response = await fetch(`${API_URL}/users/me/preferences`, {
      headers: {
        'Authorization': `Bearer ${userId}` // Placeholder para token real
      }
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('Preferências não encontradas - usuário novo')
        return null
      }
      throw new Error(`Erro ${response.status}: ${response.statusText}`)
    }
    
    const preferences = await response.json()
    console.log('Preferências carregadas:', preferences)
    
    return preferences
  } catch (error) {
    console.error('Erro ao carregar preferências:', error)
    return null
  }
}

/**
 * Busca deals com boost personalizado baseado nas preferências do usuário
 */
export async function fetchDealsFromAPI(userId?: string, limit = 50) {
  try {
    console.log('Buscando deals da API...', userId ? 'com boost personalizado' : 'sem personalização')
    
    let url = `${API_URL}/deals?limit=${limit}`
    
    // Se há userId, buscar preferências e aplicar boost
    if (userId) {
      try {
        const userPrefs = await loadUserPreferences(userId)
        if (userPrefs && userPrefs.preferredSteamGenreIds.length > 0) {
          // Buscar nomes dos gêneros baseado nos IDs
          const allGenres = await fetchSteamGenres()
          const preferredGenres = userPrefs.preferredSteamGenreIds
            .map((id: string) => allGenres.find(g => g.id === id)?.name)
            .filter(Boolean)
          
          if (preferredGenres.length > 0) {
            const boostParam = preferredGenres.join(',')
            url += `&boost=${encodeURIComponent(boostParam)}`
            console.log(`🚀 Boost ativo para gêneros: ${preferredGenres.join(', ')}`)
          }
        }
      } catch (error) {
        console.warn('Erro ao buscar preferências do usuário:', error)
        // Continuar sem boost em caso de erro
      }
    }
    
    console.log('URL da requisição:', url)
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log(`${data.length} deals recebidos`)
    
    // Log se sistema de boost está ativo
    if (data.length > 0 && data[0].score !== undefined) {
      console.log('✅ Sistema de boost ativo!')
      console.log('Top 3 deals:', data.slice(0, 3).map((d: any) => ({ 
        title: d.title, 
        score: d.score, 
        genres: d.steamGenres?.map((g: any) => g.name) || [] 
      })))
    }
    
    return data
  } catch (error) {
    console.error('Erro ao buscar deals:', error)
    throw error
  }
}