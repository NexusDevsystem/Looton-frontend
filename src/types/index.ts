export interface Game {
  _id: string
  title: string
  slug: string
  publisher?: string
  coverUrl?: string
  genres: string[]
  tags: string[]
  storeId: string
  storeAppId: string
  createdAt: string
}

export interface Favorite {
  _id: string
  userId: string
  gameId: Game
  stores?: string[]
  notifyUp?: boolean
  notifyDown?: boolean
  pctThreshold?: number
  lastNotifiedAt?: string
  createdAt: string
}

export interface List {
  _id: string
  userId: string
  name: string
  slug: string
  coverUrl?: string
  itemCount?: number
  createdAt: string
}

export interface ListItem {
  _id: string
  listId: string
  gameId: Game
  notes?: string
  sortIndex?: number
  createdAt: string
}

export interface Deal {
  _id: string
  appId?: number
  url: string
  priceBase: number
  priceFinal: number
  discountPct: number
  game: Game
  store: {
    name: string
  }
}

export interface FilterState {
  genres: string[]
  tags: string[]
  stores: string[]
  minDiscount?: number
  maxPrice?: number
}