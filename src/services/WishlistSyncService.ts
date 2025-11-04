import { WishlistService } from './WishlistService'
import { API_URL } from '../api/client'

export class WishlistSyncService {
  // Read local wishlist and sync to server favorites via /favorites/sync
  static async syncToServer(userId: string) {
    if (!userId) throw new Error('userId is required')

    const list = await WishlistService.getWishlist()

    const payload = list.map(item => {
      // map appId -> gameId expected by server: the mobile app stores Steam numeric ids as numbers
      // server expects gameId as a Mongo ObjectId string; we can't fabricate a proper ObjectId for Steam games,
      // so the app must map Steam appId to a Game document id on the server. For now assume frontend and backend
      // use Game documents whose _id is stored as string of form "steam-<appid>" or similar. If your server uses
      // actual ObjectIds for games, you'll need a server-side endpoint to resolve steam appIds to game IDs before sync.

      // Default fallback: send `gameId` as the Steam id string prefixed with `steam-` so backend can translate.
      const gameId = `steam-${item.appId}`

      return {
        gameId,
        stores: item.store ? [item.store.toLowerCase()] : ['steam'],
        notifyDown: true,
        notifyUp: false,
        pctThreshold: undefined,
        desiredPriceCents: item.desiredPrice ? Math.round(item.desiredPrice * 100) : undefined
      }
    })

    const response = await fetch(`${API_URL}/favorites/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, favorites: payload })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'unknown' }))
      throw new Error(err.error || 'Failed to sync wishlist')
    }

    return response.json()
  }
}
