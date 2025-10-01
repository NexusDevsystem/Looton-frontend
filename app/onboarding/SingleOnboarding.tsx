import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

type Props = {
  userId?: string
  onFinish: (prefs?: any) => void
}

export default function SingleOnboarding({ userId, onFinish }: Props) {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ color: '#fff', fontSize: 20, marginBottom: 12 }}>Onboarding (placeholder)</Text>
      <TouchableOpacity onPress={() => onFinish({ favoriteGenres: [], genreWeights: {} })} style={{ backgroundColor: '#3B82F6', padding: 12, borderRadius: 8 }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Concluir</Text>
      </TouchableOpacity>
    </View>
  )
}
