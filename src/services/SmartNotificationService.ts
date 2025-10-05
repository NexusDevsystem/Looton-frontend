import AsyncStorage from '@react-native-async-storage/async-storage'
import { Alert } from 'react-native'
import { WishlistService } from './WishlistService'

export interface SmartNotification {
  id: string
  title: string
  message: string
  type: 'price_drop' | 'new_deal' | 'wishlist_alert' | 'daily_deals' | 'donation_reminder'
  data?: any
  timestamp: number
  shown: boolean
}

class SmartNotificationService {
  private static instance: SmartNotificationService
  private notifications: SmartNotification[] = []
  private lastNotificationTime = 0
  private readonly STORAGE_KEY = '@looton_notifications'
  private readonly MIN_INTERVAL = 30 * 60 * 1000 // 30 minutos entre notificações

  static getInstance(): SmartNotificationService {
    if (!SmartNotificationService.instance) {
      SmartNotificationService.instance = new SmartNotificationService()
    }
    return SmartNotificationService.instance
  }

  private constructor() {
    this.loadNotificationsFromStorage()
  }

  private async loadNotificationsFromStorage() {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        this.notifications = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    }
  }

  private async saveNotificationsToStorage() {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notifications))
    } catch (error) {
      console.error('Erro ao salvar notificações:', error)
    }
  }

  // Adicionar nova notificação
  async addNotification(notification: Omit<SmartNotification, 'id' | 'timestamp' | 'shown'>) {
    const newNotification: SmartNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      shown: false
    }

    this.notifications.unshift(newNotification)
    
    // Manter apenas as últimas 50 notificações
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50)
    }

    await this.saveNotificationsToStorage()
    return newNotification
  }

  // Verificar e mostrar notificações pendentes
  async checkAndShowNotifications() {
    const now = Date.now()
    
    // Respeitar intervalo mínimo entre notificações
    if (now - this.lastNotificationTime < this.MIN_INTERVAL) {
      return
    }

    // Encontrar próxima notificação não mostrada
    const pendingNotification = this.notifications.find(n => !n.shown)
    
    if (pendingNotification) {
      this.showNotification(pendingNotification)
      pendingNotification.shown = true
      this.lastNotificationTime = now
      await this.saveNotificationsToStorage()
    }
  }

  private showNotification(notification: SmartNotification) {
    Alert.alert(
      notification.title,
      notification.message,
      [
        { text: 'Ok', style: 'default' }
      ]
    )
  }

  // Gerar notificações inteligentes baseadas no contexto do app
  async generateSmartNotifications(deals: any[], wishlistCount: number) {
    const now = Date.now()
    const today = new Date()
    const isWeekend = today.getDay() === 0 || today.getDay() === 6
    
    // Verificar ofertas imperdíveis (desconto > 70%)
    const superDeals = deals.filter(deal => deal.discountPct >= 70)
    if (superDeals.length > 0) {
      await this.addNotification({
        type: 'new_deal',
        title: '🔥 Ofertas Imperdíveis!',
        message: `${superDeals.length} jogos com mais de 70% de desconto disponíveis!`,
        data: { count: superDeals.length }
      })
    }

    // Notificação de wishlist
    if (wishlistCount > 0) {
      await this.addNotification({
        type: 'wishlist_alert',
        title: '👁️ Lista de Observação',
        message: `Você tem ${wishlistCount} jogos na lista. Que tal verificar se algum baixou de preço?`,
        data: { count: wishlistCount }
      })
    }

    // Notificação de fim de semana
    if (isWeekend) {
      await this.addNotification({
        type: 'daily_deals',
        title: '🎮 Fim de Semana Gamer!',
        message: 'Aproveite o fim de semana com as melhores ofertas de jogos!',
        data: { weekend: true }
      })
    }

    // Verificar jogos novos (simulado - em produção seria baseado em timestamp)
    const newDeals = deals.filter(deal => deal.discountPct >= 50).slice(0, 5)
    if (newDeals.length >= 3) {
      await this.addNotification({
        type: 'new_deal',
        title: '✨ Novos Deals Encontrados!',
        message: `${newDeals.length} novos jogos com ótimos descontos adicionados!`,
        data: { count: newDeals.length }
      })
    }
  }

  // Obter todas as notificações
  getNotifications(): SmartNotification[] {
    return this.notifications
  }

  // Marcar notificação como lida
  async markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.shown = true
      await this.saveNotificationsToStorage()
    }
  }

  // Limpar notificações antigas (mais de 7 dias)
  async clearOldNotifications() {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    this.notifications = this.notifications.filter(n => n.timestamp > sevenDaysAgo)
    await this.saveNotificationsToStorage()
  }
}

export default SmartNotificationService