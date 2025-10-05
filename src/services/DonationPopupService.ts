import AsyncStorage from '@react-native-async-storage/async-storage'

export interface DonationPopupState {
  lastShown: number
  showCount: number
  dismissed: boolean
}

class DonationPopupService {
  private static instance: DonationPopupService
  private readonly STORAGE_KEY = '@looton_donation_popup'
  private readonly SHOW_INTERVAL = 60 * 60 * 1000 // 1 hora em millisegundos
  private readonly MAX_DAILY_SHOWS = 3 // Máximo 3 vezes por dia

  static getInstance(): DonationPopupService {
    if (!DonationPopupService.instance) {
      DonationPopupService.instance = new DonationPopupService()
    }
    return DonationPopupService.instance
  }

  private constructor() {}

  private async getState(): Promise<DonationPopupState> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Erro ao carregar estado do popup de doação:', error)
    }
    
    return {
      lastShown: 0,
      showCount: 0,
      dismissed: false
    }
  }

  private async setState(state: DonationPopupState) {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Erro ao salvar estado do popup de doação:', error)
    }
  }

  async shouldShowPopup(): Promise<boolean> {
    const state = await this.getState()
    const now = Date.now()
    const today = new Date().toDateString()
    const lastShownDate = new Date(state.lastShown).toDateString()

    // Resetar contador se for um novo dia
    if (today !== lastShownDate) {
      state.showCount = 0
      state.dismissed = false
    }

    // Verificar se já foi mostrado o máximo de vezes hoje
    if (state.showCount >= this.MAX_DAILY_SHOWS) {
      return false
    }

    // Verificar se foi dispensado recentemente (menos de 2 horas)
    if (state.dismissed && (now - state.lastShown) < (2 * 60 * 60 * 1000)) {
      return false
    }

    // Verificar se passou o intervalo mínimo
    const timeSinceLastShow = now - state.lastShown
    return timeSinceLastShow >= this.SHOW_INTERVAL
  }

  async markAsShown() {
    const state = await this.getState()
    state.lastShown = Date.now()
    state.showCount += 1
    state.dismissed = false
    await this.setState(state)
  }

  async markAsDismissed() {
    const state = await this.getState()
    state.dismissed = true
    state.lastShown = Date.now()
    await this.setState(state)
  }

  async resetDaily() {
    const state = await this.getState()
    state.showCount = 0
    state.dismissed = false
    await this.setState(state)
  }
}

export default DonationPopupService