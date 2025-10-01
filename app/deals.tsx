import { View, Text, FlatList, SafeAreaView } from 'react-native'
import { useDeals } from '../src/hooks/useDeals'
import { tokens } from '../src/theme/tokens'
import { useCurrency } from '../src/contexts/CurrencyContext'

export default function DealsScreen() {
  const { data, loading, error } = useDeals(20, 20)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.bg }}>
      <View style={{ padding: 16 }}>
        <Text style={{ color: tokens.colors.text, fontSize: 22, fontWeight: '700' }}>Destaques</Text>
      </View>
      {loading && <Text style={{ color: tokens.colors.textDim, padding: 16 }}>Carregando…</Text>}
      {error && <Text style={{ color: 'tomato', padding: 16 }}>{error}</Text>}
      <FlatList
        data={data}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderBottomColor: tokens.colors.border, borderBottomWidth: 1 }}>
            <Text style={{ color: tokens.colors.text }}>{item.game.title}</Text>
            <Text style={{ color: tokens.colors.textDim }}>
              {item.store.name} · 
              <Text style={ (item.discountPct || 0) > 0 ? { color: '#10B981', backgroundColor: 'rgba(16,185,129,0.08)', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, fontWeight: '800' } : { color: tokens.colors.textDim } }>{useCurrency().formatPrice(item.priceFinal)}</Text>
              {' '}(-{item.discountPct}%)
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}
