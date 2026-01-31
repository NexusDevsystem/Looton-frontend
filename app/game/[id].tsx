import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { View, Text, FlatList, SafeAreaView } from 'react-native'
import { api } from '../../src/api/client'
import { tokens } from '../../src/theme/tokens'
import { useCurrency } from '../../src/contexts/CurrencyContext'

type Offer = { _id: string; url: string; priceBase: number; priceFinal: number; discountPct: number; store: { name: string } }
type Hist = { _id: string; priceFinal: number; discountPct: number; seenAt: string }

export default function GameDetail() {
  // useLocalSearchParams from expo-router may be untyped in this workspace.
  // Use a local type assertion instead of passing a type argument to the call.
  const params = useLocalSearchParams() as { id?: string } | undefined
  const id = params?.id
  const [offers, setOffers] = useState<Offer[]>([])
  const [hist, setHist] = useState<Hist[]>([])

  useEffect(() => {
    if (!id) return
    api<Offer[]>(`/games/${id}/offers`).then(setOffers).catch(console.error)
    api<Hist[]>(`/games/${id}/history`).then(setHist).catch(console.error)
  }, [id])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.bg }}>
      <View style={{ padding: 16 }}>
        <Text style={{ color: tokens.colors.text, fontSize: 22, fontWeight: '700' }}>Ofertas</Text>
      </View>
      <FlatList
        data={offers}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderBottomColor: tokens.colors.border, borderBottomWidth: 1 }}>
          <Text style={{ color: tokens.colors.text }}>{item.store.name}</Text>
          <Text style={{ color: tokens.colors.textDim }}>{useCurrency().formatPrice(item.priceFinal)} (-{item.discountPct}%)</Text>
          </View>
        )}
        ListFooterComponent={() => (
          <View style={{ padding: 16 }}>
            <Text style={{ color: tokens.colors.text, fontSize: 18, fontWeight: '700' }}>Histórico</Text>
            {hist.map((h) => (
              <Text key={h._id} style={{ color: tokens.colors.textDim, marginTop: 4 }}>
                {new Date(h.seenAt).toLocaleDateString()}  {useCurrency().formatPrice(h.priceFinal)} (-{h.discountPct}%)
              </Text>
            ))}
          </View>
        )}
      />
    </SafeAreaView>
  )
}
