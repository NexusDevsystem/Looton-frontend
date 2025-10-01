import { View, Text } from 'react-native'
import { tokens } from '../theme/tokens'

export function DiscountPill({ pct }: { pct: number }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: tokens.colors.accent, borderRadius: 8 }}>
      <Text style={{ color: '#032617', fontWeight: '700' }}>{pct}% OFF</Text>
    </View>
  )
}
