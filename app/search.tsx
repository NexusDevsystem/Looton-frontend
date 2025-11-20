import React, { useState } from 'react';
import { View, TextInput, Text, FlatList, SafeAreaView, ActivityIndicator, Dimensions } from 'react-native';
import { useSearch } from '../src/hooks/useSearch';
import { DealCard, Deal } from '../src/components/DealCard';
import { tokens } from '../src/theme/tokens';

export default function SearchScreen() {
  const [q, setQ] = useState('');
  // useSearch returns Deal[] (adapter-level or DB-level normalized to Deal)
  const { data, loading } = useSearch(q, ['steam']);

  const { width } = Dimensions.get('window');
  // Calcular largura do card para garantir duas colunas consistentes
  const horizontalPadding = 12 * 2; // padding do container
  const gap = 8;
  const cardWidth = (width - horizontalPadding - gap) / 2;

  const renderItem = ({ item }: { item: Deal }) => {
    return (
      <View style={{ width: cardWidth, marginBottom: 8 }}>
        <DealCard deal={item} variant="grid" />
      </View>
    );
  };

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
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 12 }}
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
          ListEmptyComponent={() => (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: tokens.colors.textDim }}>Nenhum jogo encontrado</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
