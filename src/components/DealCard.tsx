import { View, Text, TouchableOpacity } from 'react-native'
import { tokens } from '../theme/tokens'
import { useCurrency } from '../contexts/CurrencyContext'
import { StoreBadge } from './StoreBadge'
import { DiscountPill } from './DiscountPill'
import { GameCover } from './GameCover'

export type Deal = {
  _id: string
  url: string
  priceBase: number
  priceFinal: number
  discountPct: number
  game?: { title: string; coverUrl?: string }
  store?: { name: string }
}

export function DealCard({ deal, onPress }: { deal: Deal; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={{ backgroundColor: tokens.colors.card, borderRadius: tokens.radius, overflow: 'hidden', margin: 8, ...tokens.shadow.card }}>
      <GameCover
        title={deal.game?.title || 'Jogo sem título'}
        coverUrl={deal.game?.coverUrl}
        aspect={140/300}
        width="100%"
        rounded={0}
      />
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <StoreBadge name={deal.store?.name || 'store'} />
          <DiscountPill pct={deal.discountPct} />
        </View>
        <Text style={{ color: tokens.colors.text, fontSize: 16, fontWeight: '700', marginTop: 8 }} numberOfLines={2}>
          {deal.game?.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <Text style={{ color: tokens.colors.textDim, textDecorationLine: 'line-through', marginRight: 8 }}>
            {useCurrency().formatPrice(deal.priceBase)}
          </Text>
          <Text style={{ color: '#10B981', backgroundColor: 'rgba(16,185,129,0.08)', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 4, fontSize: 18, fontWeight: '900', lineHeight: 18, textShadowColor: 'rgba(16,185,129,0.06)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 1, alignSelf: 'flex-start' }}>{useCurrency().formatPrice(deal.priceFinal)}</Text>
        </View>
        <TouchableOpacity onPress={() => onPress?.()} style={{ marginTop: 10, backgroundColor: tokens.colors.accent, paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}>
          <Text style={{ color: '#032617', fontWeight: '800' }}>Ver oferta</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}
