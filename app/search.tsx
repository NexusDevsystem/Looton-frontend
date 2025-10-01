import React, { useState } from 'react'
import { View, TextInput, Text, FlatList, SafeAreaView, ActivityIndicator } from 'react-native'
import { useSearch } from '../src/hooks/useSearch'
import { DealCard } from '../src/components/DealCard'
import { tokens } from '../src/theme/tokens'

export default function SearchScreen() {
  const [q, setQ] = useState('')
  // useSearch returns Deal[] (adapter-level or DB-level normalized to Deal)
  const { data, loading } = useSearch(q, ['steam'])

  const renderItem = ({ item }: { item: any }) => {
    return <DealCard deal={item} />
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.bg }}>
      <View style={{ padding: 12 }}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Buscar jogos"
          placeholderTextColor={tokens.colors.textDim}
          style={{ backgroundColor: tokens.colors.bgElev, color: tokens.colors.text, padding: 12, borderRadius: 8 }}
        />
      </View>

      {loading ? (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <ActivityIndicator color={tokens.colors.accent} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={() => (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: tokens.colors.textDim }}>Nenhum jogo encontrado</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  )
}
