import { View, Text, FlatList, SafeAreaView } from 'react-native'
import { useAlerts } from '../src/hooks/useAlerts'
import { tokens } from '../src/theme/tokens'
import { useCurrency } from '../src/contexts/CurrencyContext'

const DEMO_USER_ID = '000000000000000000000000'

export default function AlertsScreen() {
  const { data, loading } = useAlerts(DEMO_USER_ID)
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.bg }}>
      <View style={{ padding: 16 }}>
        <Text style={{ color: tokens.colors.text, fontSize: 22, fontWeight: '700' }}>Alertas</Text>
      </View>
      {loading && <Text style={{ color: tokens.colors.textDim, padding: 16 }}>Carregando…</Text>}
      <FlatList
        data={data}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderBottomColor: tokens.colors.border, borderBottomWidth: 1 }}>
            <Text style={{ color: tokens.colors.text }}>{item.query || item.gameId}</Text>
            <Text style={{ color: tokens.colors.textDim }}>Até {useCurrency().formatPrice(item.maxPrice)} · {item.stores.join(', ')}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}
