import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

type Props = {
  initial?: string[]
  onNext: (selected: string[]) => void
}

export default function OnboardingStep1({ initial = [], onNext }: Props) {
  // Minimal placeholder: immediately offers a "Next" with initial selection
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ color: '#fff', fontSize: 20, marginBottom: 12 }}>Escolha seus gêneros (placeholder)</Text>
      <TouchableOpacity onPress={() => onNext(initial)} style={{ backgroundColor: '#3B82F6', padding: 12, borderRadius: 8 }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Próximo</Text>
      </TouchableOpacity>
    </View>
  )
}
