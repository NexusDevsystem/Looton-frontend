import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

type Weight = { genre: string; weight: number }

type Props = {
  initial?: Weight[]
  onSubmit: (weights: Weight[]) => void
}

export default function OnboardingStep2({ initial = [], onSubmit }: Props) {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ color: '#fff', fontSize: 20, marginBottom: 12 }}>Ajuste os pesos (placeholder)</Text>
      <TouchableOpacity onPress={() => onSubmit(initial)} style={{ backgroundColor: '#3B82F6', padding: 12, borderRadius: 8 }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Enviar</Text>
      </TouchableOpacity>
    </View>
  )
}
