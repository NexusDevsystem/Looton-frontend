import { View, Text, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { tokens } from '../theme/tokens'
import { useCurrency } from '../contexts/CurrencyContext'
import { StoreBadge } from './StoreBadge'
import { DiscountPill } from './DiscountPill'
import { GameCover } from './GameCover'
import { Ionicons } from '@expo/vector-icons'

export type Deal = {
  _id: string
  url: string
  priceBase: number
  priceFinal: number
  discountPct: number
  game?: { title: string; coverUrl?: string }
  imageUrls?: string[]
  store?: { name: string }
}

export function DealCard({ deal, onPress }: { deal: Deal; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={{ backgroundColor: tokens.colors.card, borderRadius: tokens.radius, overflow: 'hidden', margin: 8, ...tokens.shadow.card }}>
      {/* Barra superior com a loja */}
      <LinearGradient
        colors={deal.store?.name?.toLowerCase().includes('epic') ? ['#000000', '#1a1a1a'] : ['#60a5fa', '#3b82f6']} // Gradiente preto para jogos da Epic Games, azul para Steam
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderTopLeftRadius: tokens.radius,
          borderTopRightRadius: tokens.radius
        }}
      >
        <View style={{ 
          width: 24, 
          height: 24, 
          borderRadius: 12, 
          backgroundColor: '#FFFFFF', // Fundo branco para o ícone para melhor contraste
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Ionicons name="storefront-outline" size={14} color="#3b82f6" /> {/* Azul escuro para contraste com fundo branco */}
        </View>
        <Text style={{ 
          color: '#FFFFFF', 
          fontSize: 16, 
          fontWeight: 'bold', 
          marginLeft: 8,
          textShadowColor: 'rgba(0, 0, 0, 0.3)', // Adiciona sombra para melhor contraste
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 1
        }}>
          {deal.store?.name || 'Loja'}
        </Text>
      </LinearGradient>
      <GameCover
        imageUrls={(deal.imageUrls && deal.imageUrls.length > 0) ? deal.imageUrls : [deal.game?.coverUrl]}
        height={140}
        style={{ width: '100%', height: 140, borderTopLeftRadius: 0, borderTopRightRadius: 0 }} 
      />
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <DiscountPill pct={deal.discountPct} />
        </View>
        <Text style={{ color: tokens.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 6 }} numberOfLines={2}>
          {deal.game?.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ color: '#EF4444', textDecorationLine: 'line-through', marginRight: 8 }}>
            {useCurrency().formatPrice(deal.priceBase)}
          </Text>
          <Text style={{ color: '#10B981', backgroundColor: 'rgba(16,185,129,0.08)', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 4, fontSize: 18, fontWeight: '900', lineHeight: 18, textShadowColor: 'rgba(16,185,129,0.06)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 1, alignSelf: 'flex-start' }}>{useCurrency().formatPrice(deal.priceFinal)}</Text>
        </View>
        <TouchableOpacity onPress={() => onPress?.()} style={{ backgroundColor: tokens.colors.accent, paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}>
          <Text style={{ color: '#032617', fontWeight: '800' }}>Ver oferta</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}
