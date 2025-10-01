import { View, Text } from 'react-native'
import { tokens } from '../theme/tokens'

export function StoreBadge({ name }: { name: string }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: tokens.colors.chip, borderRadius: 999 }}>
      <Text style={{ color: tokens.colors.textDim, fontSize: 12 }}>{name}</Text>
    </View>
  )
}
