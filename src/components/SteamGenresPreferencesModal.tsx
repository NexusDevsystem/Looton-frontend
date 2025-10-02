import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Dimensions,
  ActivityIndicator 
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { fetchSteamGenres, SteamGenre } from '../services/SteamGenresService'

interface Props {
  visible: boolean
  onClose: () => void
  currentPreferences: string[]
  onSave: (selectedGenreIds: string[]) => Promise<void>
}

const { height } = Dimensions.get('window')

export function SteamGenresPreferencesModal({ visible, onClose, currentPreferences, onSave }: Props) {
  const [availableGenres, setAvailableGenres] = useState<SteamGenre[]>([])
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>(currentPreferences)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Carregar gêneros quando modal abre
  useEffect(() => {
    if (visible) {
      loadGenres()
      setSelectedGenreIds(currentPreferences)
    }
  }, [visible, currentPreferences])

  const loadGenres = async () => {
    try {
      setLoading(true)
      const genres = await fetchSteamGenres()
      setAvailableGenres(genres)
    } catch (error) {
      console.error('Erro ao carregar gêneros:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleGenre = (genreId: string) => {
    setSelectedGenreIds(prev => 
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    )
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await onSave(selectedGenreIds)
    } catch (error) {
      console.error('Erro ao salvar:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'flex-end'
      }}>
        <SafeAreaView style={{ backgroundColor: 'transparent' }}>
          <View style={{
            backgroundColor: '#1F2937',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 40,
            minHeight: height * 0.6,
            maxHeight: height * 0.8
          }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 20,
                fontWeight: '600'
              }}>
                Gêneros Favoritos
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: '#374151'
                }}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text style={{
              color: '#9CA3AF',
              fontSize: 14,
              marginBottom: 20
            }}>
              Selecione os gêneros que mais te interessam. Ofertas desses gêneros terão prioridade na sua lista.
            </Text>

            {/* Conteúdo */}
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {loading ? (
                <View style={{ alignItems: 'center', padding: 40 }}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={{ color: '#9CA3AF', marginTop: 10 }}>
                    Carregando gêneros da Steam...
                  </Text>
                </View>
              ) : (
                <View style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 10
                }}>
                  {availableGenres.map((genre) => {
                    const isSelected = selectedGenreIds.includes(genre.id)
                    
                    return (
                      <TouchableOpacity
                        key={genre.id}
                        onPress={() => toggleGenre(genre.id)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 20,
                          backgroundColor: isSelected ? '#1E40AF' : '#374151',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          borderWidth: isSelected ? 2 : 0,
                          borderColor: isSelected ? '#3B82F6' : 'transparent'
                        }}
                      >
                        <Ionicons
                          name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                          size={16}
                          color={isSelected ? "#60A5FA" : "#9CA3AF"}
                        />
                        <Text style={{
                          color: isSelected ? '#FFFFFF' : '#E5E7EB',
                          fontSize: 14,
                          fontWeight: isSelected ? '600' : '500',
                        }}>
                          {genre.name}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              )}

              {/* Info sobre seleção */}
              {selectedGenreIds.length === 0 && !loading && (
                <View style={{
                  marginTop: 20,
                  padding: 15,
                  backgroundColor: '#374151',
                  borderRadius: 10,
                  borderLeftWidth: 4,
                  borderLeftColor: '#F59E0B'
                }}>
                  <Text style={{
                    color: '#F59E0B',
                    fontSize: 14,
                    fontWeight: '600',
                    marginBottom: 5
                  }}>
                    💡 Dica
                  </Text>
                  <Text style={{
                    color: '#D1D5DB',
                    fontSize: 13,
                    lineHeight: 18
                  }}>
                    Selecione pelo menos um gênero para receber ofertas mais relevantes!
                  </Text>
                </View>
              )}

              {selectedGenreIds.length > 0 && (
                <View style={{
                  marginTop: 20,
                  padding: 15,
                  backgroundColor: '#065F46',
                  borderRadius: 10,
                  borderLeftWidth: 4,
                  borderLeftColor: '#10B981'
                }}>
                  <Text style={{
                    color: '#10B981',
                    fontSize: 14,
                    fontWeight: '600',
                    marginBottom: 5
                  }}>
                    ✨ {selectedGenreIds.length} gênero{selectedGenreIds.length > 1 ? 's' : ''} selecionado{selectedGenreIds.length > 1 ? 's' : ''}
                  </Text>
                  <Text style={{
                    color: '#A7F3D0',
                    fontSize: 13,
                    lineHeight: 18
                  }}>
                    Ofertas desses gêneros aparecerão no topo da sua lista!
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Botão Salvar */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{
                backgroundColor: saving ? '#6B7280' : '#3B82F6',
                paddingVertical: 15,
                borderRadius: 10,
                alignItems: 'center',
                marginTop: 20,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8
              }}
            >
              {saving && <ActivityIndicator size="small" color="#FFFFFF" />}
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600'
              }}>
                {saving ? 'Salvando...' : 'Salvar Preferências'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  )
}