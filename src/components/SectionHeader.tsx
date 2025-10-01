import { View, Text } from 'react-native'
import { tokens } from '../theme/tokens'

export function SectionHeader({ title }: { title: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 16 }}>
      <Text style={{ color: tokens.colors.text, fontSize: 18, fontWeight: '700' }}>{title}</Text>
    </View>
  )
}
