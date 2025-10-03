import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const DONATION_STORAGE_KEY = '@donation_banner'
const SHOW_INTERVAL_DAYS = 7 // Mostrar a cada 7 dias
const DISMISS_DURATION_DAYS = 3 // Não mostrar por 3 dias após dismiss

interface DonationBannerState {
  lastShown: number
  lastDismissed: number
  showCount: number
}

export function useDonationBanner() {
  const [shouldShow, setShouldShow] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)

  useEffect(() => {
    checkShouldShowBanner()
  }, [])

  const checkShouldShowBanner = async () => {
    try {
      const stored = await AsyncStorage.getItem(DONATION_STORAGE_KEY)
      const state: DonationBannerState = stored 
        ? JSON.parse(stored)
        : { lastShown: 0, lastDismissed: 0, showCount: 0 }

      const now = Date.now()
      const daysSinceLastShown = (now - state.lastShown) / (1000 * 60 * 60 * 24)
      const daysSinceLastDismissed = (now - state.lastDismissed) / (1000 * 60 * 60 * 24)

      // Não mostrar se foi dismissado recentemente
      if (state.lastDismissed > 0 && daysSinceLastDismissed < DISMISS_DURATION_DAYS) {
        setShouldShow(false)
        return
      }

      // Mostrar se nunca foi mostrado ou passou o intervalo
      if (state.lastShown === 0 || daysSinceLastShown >= SHOW_INTERVAL_DAYS) {
        setShouldShow(true)
        
        // Atualizar estado
        const newState: DonationBannerState = {
          ...state,
          lastShown: now,
          showCount: state.showCount + 1
        }
        
        await AsyncStorage.setItem(DONATION_STORAGE_KEY, JSON.stringify(newState))
      } else {
        setShouldShow(false)
      }
    } catch (error) {
      console.error('Erro ao verificar banner de doação:', error)
      setShouldShow(false)
    }
  }

  const handleDismiss = async () => {
    try {
      const stored = await AsyncStorage.getItem(DONATION_STORAGE_KEY)
      const state: DonationBannerState = stored 
        ? JSON.parse(stored)
        : { lastShown: 0, lastDismissed: 0, showCount: 0 }

      const newState: DonationBannerState = {
        ...state,
        lastDismissed: Date.now()
      }

      await AsyncStorage.setItem(DONATION_STORAGE_KEY, JSON.stringify(newState))
      setShouldShow(false)
    } catch (error) {
      console.error('Erro ao dismissar banner de doação:', error)
    }
  }

  const handleDonatePress = () => {
    setIsModalVisible(true)
  }

  const handleModalClose = () => {
    setIsModalVisible(false)
    setShouldShow(false) // Esconder banner após abrir modal
  }

  // Para testes - forçar mostrar banner
  const forceShowBanner = async () => {
    setShouldShow(true)
    try {
      const stored = await AsyncStorage.getItem(DONATION_STORAGE_KEY)
      const state: DonationBannerState = stored 
        ? JSON.parse(stored)
        : { lastShown: 0, lastDismissed: 0, showCount: 0 }

      const newState: DonationBannerState = {
        ...state,
        lastShown: Date.now(),
        showCount: state.showCount + 1
      }

      await AsyncStorage.setItem(DONATION_STORAGE_KEY, JSON.stringify(newState))
    } catch (error) {
      console.error('Erro ao forçar banner:', error)
    }
  }

  return {
    shouldShow,
    isModalVisible,
    handleDismiss,
    handleDonatePress,
    handleModalClose,
    forceShowBanner // Para debug/testes
  }
}