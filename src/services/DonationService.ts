import AsyncStorage from '@react-native-async-storage/async-storage'

export interface DonationState {
  lastShown: number
  showCount: number
  dismissed: boolean
}

class DonationService {
  private static instance: DonationService
  private readonly STORAGE_KEY = '@looton_donation_modal'

  static getInstance(): DonationService {
    if (!DonationService.instance) {
      DonationService.instance = new DonationService()
    }
    return DonationService.instance
  }

  private constructor() {}

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

  private async getState(): Promise<DonationState> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Erro ao carregar estado da doação:', error)
    }
    
    return {
      lastShown: 0,
      showCount: 0,
      dismissed: false
    }
  }

  private async setState(state: DonationState) {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Erro ao salvar estado da doação:', error)
    }
  }
}

export default DonationService