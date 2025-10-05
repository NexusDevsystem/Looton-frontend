import React from 'react'
import { View, Text, Image, TouchableOpacity, Linking, Alert } from 'react-native'
import { tokens } from '../theme/tokens'
import { useCurrency } from '../contexts/CurrencyContext'
import type { PcOffer } from '../services/HardwareService'

export function PcDealCard({ item, variant = 'grid' }: { item: PcOffer; variant?: 'grid' | 'list' }) {
  const { formatPrice } = useCurrency() as any
  const pct = typeof item.discountPct === 'number'
    ? item.discountPct
    : (item.priceBaseCents && item.priceBaseCents > 0 ? Math.max(0, Math.round((1 - item.priceFinalCents / item.priceBaseCents) * 100)) : 0)

  const imgHeight = variant === 'grid' ? 120 : 160
  const labelRight = (item.category || item.store || '').toString().toUpperCase()

  const priceBase = (c?: number) => (typeof c === 'number' ? formatPrice(c / 100) : '—')
  const priceFinal = (c: number) => formatPrice(c / 100)
  const installment = item.priceFinalCents ? priceFinal(Math.round(item.priceFinalCents / 12)) : '—'

  // Função para abrir oferta no navegador
  const handleOpenInBrowser = () => {
    Alert.alert(
      'Abrir Oferta',
      `Você será redirecionado para o site da loja ${item.store || 'desconhecida'} para ver mais detalhes sobre este produto.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Continuar',
          onPress: () => Linking.openURL(item.url || '')
        }
      ]
    )
  }

  return (
    <View style={{ backgroundColor: tokens.colors.card, borderRadius: 12, overflow: 'hidden', ...tokens.shadow.card }}>
      <View style={{ position: 'relative' }}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={{ width: '100%', height: imgHeight, backgroundColor: '#0f172a' }} />
        ) : (
          <View style={{ width: '100%', height: imgHeight, backgroundColor: '#0f172a' }} />
        )}
        <View style={{ position: 'absolute', top: 6, left: 6 }}>
          {typeof pct === 'number' && pct > 0 && (
            <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#16A34A', borderRadius: 6 }}>
              <Text style={{ color: '#032617', fontWeight: '800', fontSize: 12 }}>{pct}% OFF</Text>
            </View>
          )}
        </View>
        {labelRight ? (
          <View style={{ position: 'absolute', top: 6, right: 6, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#3F3F46', borderRadius: 6 }}>
            <Text style={{ color: '#E5E7EB', fontSize: 12, fontWeight: '700' }}>{labelRight}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ padding: 10 }}>
        <Text style={{ color: tokens.colors.text, fontWeight: '800', fontSize: 14 }} numberOfLines={2}>{item.title || 'Produto sem título'}</Text>
        <View style={{ marginTop: 8 }}>
          {item.priceBaseCents && item.priceBaseCents > 0 && item.priceFinalCents !== item.priceBaseCents ? (
            <Text style={{ color: tokens.colors.textDim, textDecorationLine: 'line-through', fontSize: 12 }}>De: {priceBase(item.priceBaseCents)}</Text>
          ) : null}
          <Text style={{ marginTop: 2, color: '#10B981', fontSize: 16, fontWeight: '900' }}>por: {priceFinal(item.priceFinalCents)} <Text style={{ color: '#10B981', fontWeight: '700' }}>à vista</Text></Text>
          <Text style={{ marginTop: 2, color: tokens.colors.textDim, fontSize: 12 }}>em até 12x de {installment} sem juros</Text>
        </View>
        <TouchableOpacity 
          onPress={handleOpenInBrowser} 
          style={{ 
            marginTop: 10, 
            backgroundColor: '#3B82F6', 
            paddingVertical: 8, 
            borderRadius: 8, 
            alignItems: 'center' 
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '800' }}>Ver oferta</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}