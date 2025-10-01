import React from 'react'
import { Modal, View, Text, ActivityIndicator, SafeAreaView } from 'react-native'

export default function LoadingModal({ visible, message }: { visible: boolean; message?: string }) {
  if (!visible) return null
  return (
    <Modal visible={visible} transparent animationType='fade'>
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: '#1F2937', padding: 20, borderRadius: 12, alignItems: 'center' }}>
          <ActivityIndicator size='large' color='#3B82F6' />
          <Text style={{ color: '#E5E7EB', marginTop: 12, fontWeight: '700' }}>{message || 'Aguarde...'}</Text>
        </View>
      </SafeAreaView>
    </Modal>
  )
}
