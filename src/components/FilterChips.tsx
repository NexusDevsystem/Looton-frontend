import React from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface FilterChipsProps {
  selectedGenres: string[]
  selectedTags: string[]
  availableGenres: string[]
  availableTags: string[]
  onGenreToggle: (genre: string) => void
  onTagToggle: (tag: string) => void
  onClear: () => void
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  selectedGenres,
  selectedTags,
  availableGenres,
  availableTags,
  onGenreToggle,
  onTagToggle,
  onClear
}) => {
  const hasFilters = selectedGenres.length > 0 || selectedTags.length > 0

  const renderChip = (
    label: string, 
    isSelected: boolean, 
    onPress: () => void,
    type: 'genre' | 'tag'
  ) => (
    <TouchableOpacity
      key={`${type}-${label}`}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
  backgroundColor: isSelected ? '#3B82F6' : '#333',
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center'
      }}
      onPress={onPress}
    >
      <Text style={{
        color: isSelected ? '#000' : '#FFF',
        fontSize: 12,
        fontWeight: isSelected ? 'bold' : 'normal',
        marginRight: isSelected ? 4 : 0
      }}>
        {label}
      </Text>
      {isSelected && (
        <Ionicons 
          name="close" 
          size={12} 
          color="#000" 
        />
      )}
    </TouchableOpacity>
  )

  return (
    <View style={{ 
      backgroundColor: '#111', 
      paddingHorizontal: 20, 
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#333'
    }}>
      {/* Header com botão limpar */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
      }}>
        <Text style={{
          color: '#FFF',
          fontSize: 14,
          fontWeight: 'bold'
        }}>
          Filtros
        </Text>
        {hasFilters && (
          <TouchableOpacity
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              backgroundColor: '#ff4444',
              borderRadius: 4
            }}
            onPress={onClear}
          >
            <Text style={{ color: '#FFF', fontSize: 10 }}>
              Limpar
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Gêneros */}
      {availableGenres.length > 0 && (
        <View style={{ marginBottom: 8 }}>
          <Text style={{
            color: '#888',
            fontSize: 12,
            marginBottom: 6
          }}>
            Gêneros:
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}
          >
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {availableGenres.map(genre => 
                renderChip(
                  genre,
                  selectedGenres.includes(genre),
                  () => onGenreToggle(genre),
                  'genre'
                )
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Tags */}
      {availableTags.length > 0 && (
        <View>
          <Text style={{
            color: '#888',
            fontSize: 12,
            marginBottom: 6
          }}>
            Tags:
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}
          >
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {availableTags.map(tag => 
                renderChip(
                  tag,
                  selectedTags.includes(tag),
                  () => onTagToggle(tag),
                  'tag'
                )
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Contador de filtros ativos */}
      {hasFilters && (
        <View style={{
          marginTop: 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#333'
        }}>
          <Text style={{
            color: '#3B82F6',
            fontSize: 10,
            textAlign: 'center'
          }}>
            {selectedGenres.length + selectedTags.length} filtros ativos
          </Text>
        </View>
      )}
    </View>
  )
}