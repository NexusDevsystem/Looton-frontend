import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubscriptionService } from './SubscriptionService';

export interface WishlistItem {
  appId: number;
  title: string;
  currentPrice: number;
  desiredPrice: number;
  coverUrl: string;
  addedAt: string;
  notified: boolean;
  store: string;
  url: string;
}

const WISHLIST_STORAGE_KEY = '@looton_wishlist';
// const FREE_TIER_LIMIT = 5; // TEMPORARIAMENTE DESABILITADO - Sem limite de jogos vigiados
const FREE_TIER_LIMIT = 999; // Limite alto temporário (ilimitado na prática)

export class WishlistService {
  // Simple in-memory subscribers for changes to the wishlist
  private static listeners: Array<() => void> = []

  static subscribe(listener: () => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private static notifyChange() {
    for (const l of this.listeners) {
      try { l() } catch (e) { /* swallow */ }
    }
  }

  static async getWishlist(): Promise<WishlistItem[]> {
    try {
      const wishlistJson = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
      return wishlistJson ? JSON.parse(wishlistJson) : [];
    } catch (error) {
      console.error('Erro ao carregar wishlist:', error);
      return [];
    }
  }

  static async addToWishlist(item: Omit<WishlistItem, 'addedAt'>): Promise<void> {
    try {
      const wishlist = await this.getWishlist();
      
      // Verificar se o jogo já está na wishlist
      const existingIndex = wishlist.findIndex(w => w.appId === item.appId);
      
      // TEMPORARIAMENTE DESABILITADO - Sem limite de jogos vigiados
      // if (existingIndex === -1) {
      //   const isPremium = await SubscriptionService.isPremium();
      //   
      //   if (!isPremium && wishlist.length >= FREE_TIER_LIMIT) {
      //     throw new Error('LIMIT_REACHED');
      //   }
      // }
      
      const wishlistItem: WishlistItem = {
        ...item,
        addedAt: new Date().toISOString(),
        notified: false,
      };

      if (existingIndex >= 0) {
        // Atualizar item existente
        wishlist[existingIndex] = wishlistItem;
      } else {
        // Adicionar novo item
        wishlist.push(wishlistItem);
      }

      await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
      this.notifyChange()
    } catch (error) {
      console.error('Erro ao adicionar à wishlist:', error);
      throw error;
    }
  }

  static async removeFromWishlist(appId: number): Promise<void> {
    try {
      const wishlist = await this.getWishlist();
      const filteredWishlist = wishlist.filter(item => item.appId !== appId);
      await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(filteredWishlist));
      this.notifyChange()
    } catch (error) {
      console.error('Erro ao remover da wishlist:', error);
      throw error;
    }
  }

  static async updateDesiredPrice(appId: number, newDesiredPrice: number): Promise<void> {
    try {
      const wishlist = await this.getWishlist();
      const itemIndex = wishlist.findIndex(w => w.appId === appId);
      
      if (itemIndex >= 0) {
        wishlist[itemIndex].desiredPrice = newDesiredPrice;
        wishlist[itemIndex].notified = false; // Reset notification status
        await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
        this.notifyChange()
      }
    } catch (error) {
      console.error('Erro ao atualizar preço desejado:', error);
      throw error;
    }
  }

  static async isInWishlist(appId: number): Promise<boolean> {
    try {
      const wishlist = await this.getWishlist();
      return wishlist.some(item => item.appId === appId);
    } catch (error) {
      console.error('Erro ao verificar wishlist:', error);
      return false;
    }
  }

  static async getWishlistItem(appId: number): Promise<WishlistItem | null> {
    try {
      const wishlist = await this.getWishlist();
      return wishlist.find(item => item.appId === appId) || null;
    } catch (error) {
      console.error('Erro ao buscar item da wishlist:', error);
      return null;
    }
  }

  static async updateCurrentPrice(appId: number, newPrice: number): Promise<void> {
    try {
      const wishlist = await this.getWishlist();
      const itemIndex = wishlist.findIndex(w => w.appId === appId);
      
      if (itemIndex >= 0) {
        wishlist[itemIndex].currentPrice = newPrice;
        await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
        this.notifyChange()
      }
    } catch (error) {
      console.error('Erro ao atualizar preço atual:', error);
      throw error;
    }
  }

  static async checkPriceAlerts(currentDeals: any[]): Promise<WishlistItem[]> {
    try {
      const wishlist = await this.getWishlist();
      const alerts: WishlistItem[] = [];

      for (const wishlistItem of wishlist) {
        const currentDeal = currentDeals.find(deal => deal._id === `steam-${wishlistItem.appId}`);
        
        if (currentDeal && !wishlistItem.notified) {
          const currentPrice = currentDeal.priceFinal;
          
          if (currentPrice <= wishlistItem.desiredPrice) {
            // Marcar como notificado
            wishlistItem.notified = true;
            wishlistItem.currentPrice = currentPrice;
            alerts.push(wishlistItem);
          } else if (currentPrice !== wishlistItem.currentPrice) {
            // Atualizar preço atual sem notificar
            wishlistItem.currentPrice = currentPrice;
          }
        }
      }

      if (alerts.length > 0) {
        // Salvar atualizações
        await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
        this.notifyChange()
      }

      return alerts;
    } catch (error) {
      console.error('Erro ao verificar alertas de preço:', error);
      return [];
    }
  }

  static async clearNotifications(): Promise<void> {
    try {
      const wishlist = await this.getWishlist();
      const updatedWishlist = wishlist.map(item => ({ ...item, notified: false }));
      await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updatedWishlist));
      this.notifyChange()
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  }
}