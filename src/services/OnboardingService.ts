import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '../api/client'

const STORAGE_KEY = 'ONBOARDING_PREFS_v1'

export async function saveLocalPrefs(prefs: any) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

export async function loadLocalPrefs() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch (e) { return null }
}

export async function postAnswers(userId: string, answers: any) {
  // forwards answers to backend and returns computed favorites
  // Be defensive: if network fails or backend returns error, compute a local fallback
  const body = { userId, answers }
  try {
    return await api('/onboarding/answers', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.warn('postAnswers failed, falling back to local computation', err)
    // Compute simple genreWeights and favorites from provided answers
    try {
      const weights: Record<string, number> = {}
      for (const a of answers || []) {
        const gList: string[] = Array.isArray(a.genres) ? a.genres : (a.genres ? [a.genres] : [])
        const w = typeof a.weight === 'number' ? a.weight : 1
        for (const g of gList) {
          weights[g] = (weights[g] || 0) + Number(w)
        }
      }

      // normalize weights
      const total = Object.values(weights).reduce((s, v) => s + v, 0) || 0
      const normalized: Record<string, number> = {}
      if (total > 0) {
        for (const [k, v] of Object.entries(weights)) normalized[k] = v / total
      }

      // favoriteGenres: top 3 by weight
      const favoriteGenres = Object.entries(normalized).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0])

      return { favoriteGenres, genreWeights: normalized }
    } catch (err2) {
      console.warn('Fallback computation failed', err2)
      return { favoriteGenres: [], genreWeights: {} }
    }
  }
}

export async function getServerPrefs(userId: string) {
  if (!userId) return null
  return api(`/users/${userId}/genres`)
}

const TERMS_STORAGE_KEY = 'TERMS_ACCEPTED_v1'

export async function hasAcceptedTerms(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(TERMS_STORAGE_KEY)
    return value === 'true'
  } catch (error) {
    return false
  }
}

export async function setTermsAccepted(): Promise<void> {
  try {
    await AsyncStorage.setItem(TERMS_STORAGE_KEY, 'true')
  } catch (error) {
    console.error('Error saving terms acceptance:', error)
  }
}
