import AsyncStorage from '@react-native-async-storage/async-storage'
import { Alert } from 'react-native'
import { WishlistService } from './WishlistService'
import * as Notifications from 'expo-notifications'

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

  // Adicionar nova notificação - com opção de enviar como push remote
  async addNotification(notification: Omit<SmartNotification, 'id' | 'timestamp' | 'shown'>, sendAsPush: boolean = false) {
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
    
    // Se deve ser enviado como notificação push remota
    if (sendAsPush) {
      await this.sendRemotePushNotification(notification.title, notification.message, {
        ...notification.data,
        type: notification.type,
        notificationId: newNotification.id
      })
    }
    
    return newNotification
  }

  // Enviar notificação como push remoto
  private async sendRemotePushNotification(title: string, message: string, data: any = {}) {
    try {
      // This will send to the backend which will handle the push notification delivery
      // The actual push will be handled by the backend service when it receives relevant data
      console.log('Enviando notificação push remota:', { title, message, data });
    } catch (error) {
      console.error('Erro ao enviar notificação push remota:', error);
    }
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
    // Fallback to Alert if needed for immediate user attention
    Alert.alert(
      notification.title,
      notification.message,
      [
        { text: 'Ok', style: 'default' }
      ]
    )
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