import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFavorites } from '../hooks/useFavorites'
import { useLists, useListItems } from '../hooks/useLists'
import { FavoriteButton } from './FavoriteButton'
import { useCurrency } from '../contexts/CurrencyContext'
import { Favorite, List } from '../types'

interface FavoritesAndListsScreenProps {
  visible: boolean
  onClose: () => void
  userId: string
}

export function FavoritesAndListsScreen({ visible, onClose, userId }: FavoritesAndListsScreenProps) {
  const [activeTab, setActiveTab] = useState<'watching' | 'lists'>('watching')
  const [selectedList, setSelectedList] = useState<List | null>(null)
  const [storeFilter, setStoreFilter] = useState<'all' | 'steam' | 'epic'>('all')
  const [changeFilter, setChangeFilter] = useState<'all' | 'down' | 'up'>('all')

  const { 
    favorites, 
    loading: favoritesLoading, 
    error: favoritesError,
    refresh: refreshFavorites 
  } = useFavorites(userId)

  const { 
    lists, 
    loading: listsLoading, 
    error: listsError,
    refresh: refreshLists,
    deleteList 
  } = useLists(userId)

  const { 
    items: listItems,
    loading: itemsLoading,
    refresh: refreshItems
  } = useListItems(selectedList?._id || null)

  if (!visible) return null

  const { formatPrice } = useCurrency() as any

  const filteredFavorites = favorites.filter(favorite => {
    let matchesStore = true
    let matchesChange = true

    if (storeFilter !== 'all') {
      matchesStore = favorite.stores?.includes(storeFilter) || false
    }

    // Para o filtro de mudança, seria necessário ter dados de histórico
    // Por ora, vamos manter todos
    
    return matchesStore && matchesChange
  })

  const handleDeleteList = async (list: List) => {
    Alert.alert(
      'Excluir Lista',
      `Tem certeza que deseja excluir a lista "${list.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteList(list._id)
              if (selectedList?._id === list._id) {
                setSelectedList(null)
              }
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a lista')
            }
          }
        }
      ]
    )
  }

  const renderWatchingTab = () => (
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={favoritesLoading}
          onRefresh={refreshFavorites}
          tintColor="#007AFF"
        />
      }
    >
      {/* Filtros */}
      <View style={{
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f8f8f8'
      }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* Filtro de loja */}
            {['all', 'steam', 'epic'].map((store) => (
              <TouchableOpacity
                key={store}
                onPress={() => setStoreFilter(store as any)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: storeFilter === store ? '#007AFF' : '#fff',
                  borderWidth: 1,
                  borderColor: storeFilter === store ? '#007AFF' : '#ddd'
                }}
              >
                <Text style={{
                  color: storeFilter === store ? '#fff' : '#333',
                  fontSize: 14,
                  fontWeight: '600'
                }}>
                  {store === 'all' ? 'Todas' : store.charAt(0).toUpperCase() + store.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Filtro de mudança */}
            {['all', 'down', 'up'].map((change) => (
              <TouchableOpacity
                key={change}
                onPress={() => setChangeFilter(change as any)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: changeFilter === change ? '#3B82F6' : '#fff',
                  borderWidth: 1,
                  borderColor: changeFilter === change ? '#3B82F6' : '#ddd'
                }}
              >
                <Text style={{
                  color: changeFilter === change ? '#fff' : '#333',
                  fontSize: 14,
                  fontWeight: '600'
                }}>
                  {change === 'all' ? 'Todas' : change === 'down' ? 'Preço ↓' : 'Preço ↑'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Lista de favoritos */}
      <View style={{ padding: 16 }}>
        {favoritesError && (
          <Text style={{
            color: '#DC2626',
            textAlign: 'center',
            marginBottom: 16,
            fontSize: 16
          }}>
            {favoritesError}
          </Text>
        )}

        {filteredFavorites.length === 0 ? (
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 64
          }}>
            <Ionicons name="heart-outline" size={64} color="#ccc" />
            <Text style={{
              fontSize: 18,
              color: '#666',
              textAlign: 'center',
              marginTop: 16
            }}>
              {favorites.length === 0 
                ? 'Nenhum jogo nos favoritos ainda.\nToque no ❤️ nos cards para favoritar!'
                : 'Nenhum favorito encontrado com os filtros selecionados.'
              }
            </Text>
          </View>
        ) : (
          filteredFavorites.map((favorite) => (
            <View
              key={favorite._id}
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                marginBottom: 12,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3
              }}
            >
              <View style={{
                flexDirection: 'row',
                padding: 16
              }}>
                {/* Imagem do jogo */}
                <Image
                  source={{ uri: favorite.gameId.coverUrl }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    backgroundColor: '#f0f0f0'
                  }}
                  resizeMode="cover"
                />

                {/* Informações do jogo */}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: 4
                  }}>
                    {favorite.gameId.title}
                  </Text>

                  {/* Configurações de notificação */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8
                  }}>
                    <Ionicons 
                      name={favorite.notifyDown ? 'notifications' : 'notifications-off'} 
                      size={16} 
                      color={favorite.notifyDown ? '#3B82F6' : '#666'} 
                    />
                    <Text style={{
                      fontSize: 12,
                      color: '#666',
                      marginLeft: 4
                    }}>
                      Queda ≥{favorite.pctThreshold || 10}%
                    </Text>
                  </View>

                  {/* Lojas */}
                  {favorite.stores && favorite.stores.length > 0 && (
                    <View style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 4
                    }}>
                      {favorite.stores.map((store) => (
                        <View
                          key={store}
                          style={{
                            backgroundColor: '#f0f0f0',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 12
                          }}
                        >
                          <Text style={{
                            fontSize: 10,
                            color: '#666',
                            textTransform: 'uppercase'
                          }}>
                            {store}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Botão de favorito */}
                <FavoriteButton
                  gameId={favorite.gameId._id}
                  userId={userId}
                  size={20}
                />
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )

  const renderListsTab = () => {
    if (selectedList) {
      return (
        <View style={{ flex: 1 }}>
          {/* Header da lista */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            backgroundColor: '#fff',
            borderBottomWidth: 1,
            borderBottomColor: '#eee'
          }}>
            <TouchableOpacity
              onPress={() => setSelectedList(null)}
              style={{ marginRight: 16 }}
            >
              <Ionicons name="chevron-back" size={24} color="#007AFF" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#333'
              }}>
                {selectedList.name}
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#666'
              }}>
                {selectedList.itemCount || 0} {(selectedList.itemCount || 0) === 1 ? 'jogo' : 'jogos'}
              </Text>
            </View>
          </View>

          {/* Items da lista */}
          <ScrollView
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={itemsLoading}
                onRefresh={refreshItems}
                tintColor="#007AFF"
              />
            }
          >
            <View style={{ padding: 16 }}>
              {listItems.length === 0 ? (
                <View style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 64
                }}>
                  <Ionicons name="list-outline" size={64} color="#ccc" />
                  <Text style={{
                    fontSize: 18,
                    color: '#666',
                    textAlign: 'center',
                    marginTop: 16
                  }}>
                    Esta lista está vazia.{'\n'}
                    Adicione jogos usando o botão de lista nos cards!
                  </Text>
                </View>
              ) : (
                listItems.map((item) => (
                  <View
                    key={item._id}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 12,
                      marginBottom: 12,
                      overflow: 'hidden',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3
                    }}
                  >
                    <View style={{
                      flexDirection: 'row',
                      padding: 16
                    }}>
                      <Image
                        source={{ uri: item.gameId.coverUrl }}
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 8,
                          backgroundColor: '#f0f0f0'
                        }}
                        resizeMode="cover"
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: '#333',
                          marginBottom: 4
                        }}>
                          {item.gameId.title}
                        </Text>
                        {item.notes && (
                          <Text style={{
                            fontSize: 14,
                            color: '#666',
                            fontStyle: 'italic'
                          }}>
                            {item.notes}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      )
    }

    return (
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={listsLoading}
            onRefresh={refreshLists}
            tintColor="#007AFF"
          />
        }
      >
        <View style={{ padding: 16 }}>
          {listsError && (
            <Text style={{
              color: '#DC2626',
              textAlign: 'center',
              marginBottom: 16,
              fontSize: 16
            }}>
              {listsError}
            </Text>
          )}

          {lists.length === 0 ? (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 64
            }}>
              <Ionicons name="list-outline" size={64} color="#ccc" />
              <Text style={{
                fontSize: 18,
                color: '#666',
                textAlign: 'center',
                marginTop: 16
              }}>
                Nenhuma lista criada ainda.{'\n'}
                Use o botão de lista nos cards para criar sua primeira lista!
              </Text>
            </View>
          ) : (
            lists.map((list) => (
              <TouchableOpacity
                key={list._id}
                onPress={() => setSelectedList(list)}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3
                }}
              >
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16
                }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    backgroundColor: '#f0f0f0',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Ionicons name="list" size={24} color="#666" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: 2
                    }}>
                      {list.name}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: '#666'
                    }}>
                      {list.itemCount || 0} {(list.itemCount || 0) === 1 ? 'jogo' : 'jogos'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation()
                      handleDeleteList(list)
                    }}
                    style={{
                      padding: 8,
                      marginRight: 8
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  </TouchableOpacity>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    )
  }

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#f8f8f8',
      zIndex: 1000
    }}>
      {/* Header */}
      <View style={{
        backgroundColor: '#fff',
        paddingTop: 44,
        paddingHorizontal: 16,
        paddingBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#333'
          }}>
            {selectedList ? selectedList.name : 'Favoritos & Listas'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        {!selectedList && (
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#f0f0f0',
            borderRadius: 8,
            padding: 4,
            marginTop: 16
          }}>
            <TouchableOpacity
              onPress={() => setActiveTab('watching')}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 6,
                backgroundColor: activeTab === 'watching' ? '#fff' : 'transparent'
              }}
            >
              <Text style={{
                textAlign: 'center',
                fontWeight: '600',
                color: activeTab === 'watching' ? '#007AFF' : '#666'
              }}>
                Vigiando
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('lists')}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 6,
                backgroundColor: activeTab === 'lists' ? '#fff' : 'transparent'
              }}
            >
              <Text style={{
                textAlign: 'center',
                fontWeight: '600',
                color: activeTab === 'lists' ? '#007AFF' : '#666'
              }}>
                Listas
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {selectedList ? renderListsTab() : (
          activeTab === 'watching' ? renderWatchingTab() : renderListsTab()
        )}
      </View>
    </View>
  )
}