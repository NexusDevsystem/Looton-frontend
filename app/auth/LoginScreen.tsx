import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, SafeAreaView } from 'react-native'
import * as AuthService from '../../src/services/AuthService'

export default function LoginScreen({ onLogged }: { onLogged: (id: string) => void }) {
  const [id, setId] = useState('')

  const handleContinue = async () => {
    const uid = id.trim() || ''
    if (!uid) return
    try {
      await AuthService.saveUser(uid)
      // ensure deviceId exists
      await AuthService.ensureDeviceId()
      onLogged(uid)
    } catch (e) {
      console.warn('Failed saving user in LoginScreen', e)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b1020', padding: 20 }}>
      <View style={{ marginTop: 80 }}>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 12 }}>Bem-vindo ao Looton</Text>
        <Text style={{ color: '#9CA3AF', marginBottom: 24 }}>Digite um identificador de usuário para testar a aplicação (ex: id de dev)</Text>

        <TextInput
          placeholder="User id (ex: 64a7f6b2...)"
          placeholderTextColor="#9CA3AF"
          value={id}
          onChangeText={setId}
          style={{ backgroundColor: '#26272b', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 12 }}
        />

        <TouchableOpacity onPress={handleContinue} style={{ backgroundColor: '#3B82F6', padding: 14, borderRadius: 10, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Continuar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
