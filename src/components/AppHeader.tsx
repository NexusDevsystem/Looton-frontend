import { View, Text } from 'react-native'
import { tokens } from '../theme/tokens'

export function AppHeader({ title = 'Looton' }: { title?: string }) {
  return (
    <View style={{ padding: 16, backgroundColor: tokens.colors.bgElev, borderBottomColor: tokens.colors.border, borderBottomWidth: 1 }}>
      <Text style={{ color: tokens.colors.text, fontSize: 20, fontWeight: '700' }}>{title}</Text>
    </View>
  )
}

