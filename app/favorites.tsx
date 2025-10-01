import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator, Alert } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { GameCover } from '../src/components/GameCover'
import { useFavorites } from '../src/hooks/useFavorites'
import { WishlistService } from '../src/services/WishlistService'
import { useLists } from '../src/hooks/useLists'
import { tokens } from '../src/theme/tokens'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export default function FavoritesAndLists() {
  const [activeTab, setActiveTab] = useState<'watching' | 'lists'>('watching')
  const [filterStore, setFilterStore] = useState<'all' | 'steam' | 'epic'>('all')
  const [filterChanged, setFilterChanged] = useState<'all' | 'down' | 'up'>('all')
  const [newListName, setNewListName] = useState('')
  const [showCreateList, setShowCreateList] = useState(false)
  const [expandedList, setExpandedList] = useState<string | null>(null)

  // Mock user ID - em um app real viria do contexto de autenticação
  // For now keep empty to indicate not logged in; the app expects users to be authenticated
  const userId = ''

  const { 
    favorites, 
    loading: favoritesLoading, 
    removeFavorite, 
    refresh: refreshFavorites
  } = useFavorites(userId)

  const { 
    lists, 
    loading: listsLoading, 
    createList, 
    deleteList, 
    refresh: refreshLists 
  } = useLists(userId)

  // Local wishlist for anonymous users
  const [localWishlist, setLocalWishlist] = useState<any[]>([])
  const [loadingLocalWishlist, setLoadingLocalWishlist] = useState(false)

  // Show server favorites when user is authenticated, otherwise show local wishlist
  const allFavorites = userId ? favorites : localWishlist
  const isLoading = (userId ? favoritesLoading : loadingLocalWishlist) || listsLoading

  useEffect(() => {
    const init = async () => {
      refreshLists()
      if (userId) {
        refreshFavorites()
      } else {
        // load local wishlist and map to favorite-like objects
        setLoadingLocalWishlist(true)
        try {
          const list = await WishlistService.getWishlist()
          setLocalWishlist(list.map(item => ({
            _id: `local-${item.appId}`,
            _local: true,
            desiredPrice: item.desiredPrice,
            gameId: { _id: String(item.appId), title: item.title, coverUrl: item.coverUrl },
            stores: item.store ? [item.store] : [],
            pctThreshold: undefined,
            notifyDown: true
          })))
        } catch (err) {
          console.error('Erro ao carregar wishlist local', err)
        } finally {
          setLoadingLocalWishlist(false)
        }
      }
    }

    init()

    // subscribe to wishlist changes so UI updates when items are added/removed elsewhere
    const unsub = WishlistService.subscribe(async () => {
      setLoadingLocalWishlist(true)
      try {
        const list = await WishlistService.getWishlist()
        setLocalWishlist(list.map(item => ({
          _id: `local-${item.appId}`,
          _local: true,
          desiredPrice: item.desiredPrice,
          gameId: { _id: String(item.appId), title: item.title, coverUrl: item.coverUrl },
          stores: item.store ? [item.store] : [],
          pctThreshold: undefined,
          notifyDown: true
        })))
      } catch (err) {
        console.error('Erro ao recarregar wishlist local', err)
      } finally {
        setLoadingLocalWishlist(false)
      }
    })

    return () => {
      try { unsub() } catch (e) {}
    }
  }, [])

  const handleRemoveFavorite = async (favoriteId: string) => {
    // If this is a local wishlist item (anonymous mode) remove from AsyncStorage
    if (favoriteId.startsWith('local-')) {
      const appId = Number(favoriteId.replace('local-', ''))
      Alert.alert(
        'Remover do Desejo',
        'Tem certeza que deseja remover este jogo dos seus desejos?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: async () => {
              try {
                await WishlistService.removeFromWishlist(appId)
                // refresh local list (subscription will also update but keep for immediate UX)
                const list = await WishlistService.getWishlist()
                setLocalWishlist(list.map(item => ({
                  _id: `local-${item.appId}`,
                  _local: true,
                  desiredPrice: item.desiredPrice,
                  gameId: { _id: String(item.appId), title: item.title, coverUrl: item.coverUrl },
                  stores: item.store ? [item.store] : [],
                  pctThreshold: undefined,
                  notifyDown: true
                })))
              } catch (err) {
                console.error('Erro ao remover da wishlist local', err)
                Alert.alert('Erro', 'Não foi possível remover do desejo')
              }
            }
          }
        ]
      )
      return
    }
    // Remove favorito no servidor
    Alert.alert(
      'Remover dos Favoritos',
      'Tem certeza que deseja remover este jogo dos seus favoritos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: () => removeFavorite(favoriteId)
        }
      ]
    )
  }

  const handleCreateList = async () => {
    if (newListName.trim()) {
      await createList(newListName.trim())
      setNewListName('')
      setShowCreateList(false)
    }
  }

  const handleDeleteList = async (listId: string, listName: string) => {
    Alert.alert(
      'Excluir Lista',
      `Tem certeza que deseja excluir a lista \"${listName}\"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => deleteList(listId)
        }
      ]
    )
  }

  const getFilteredFavorites = () => {
    const source = allFavorites || []

    let filtered = source

    if (filterStore !== 'all') {
      filtered = filtered.filter((fav: any) => 
        fav.stores?.includes(filterStore) || !fav.stores
      )
    }

    return filtered
  }

  const renderTabButton = (tab: 'watching' | 'lists', title: string, icon: string) => (
    <TouchableOpacity
      style={{
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
  backgroundColor: activeTab === tab ? tokens.colors.primary : 'transparent',
        borderRadius: 8,
        marginHorizontal: 4,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center'
      }}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons 
        name={icon as any} 
        size={20} 
        color={activeTab === tab ? tokens.colors.bg : tokens.colors.textDim} 
        style={{ marginRight: 8 }}
      />
      <Text style={{
        color: activeTab === tab ? tokens.colors.bg : tokens.colors.textDim,
        fontWeight: activeTab === tab ? 'bold' : 'normal'
      }}>
        {title}
      </Text>
    </TouchableOpacity>
  )

  const renderFilterChip = (filter: string, label: string, currentFilter: string, setFilter: (filter: any) => void) => (
    <TouchableOpacity
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
  backgroundColor: currentFilter === filter ? tokens.colors.primary : tokens.colors.bgElev,
        borderRadius: 16,
        marginRight: 8
      }}
      onPress={() => setFilter(filter)}
    >
      <Text style={{
  color: currentFilter === filter ? tokens.colors.bg : tokens.colors.text,
        fontSize: 12,
        fontWeight: currentFilter === filter ? 'bold' : 'normal'
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  )

  const renderFavoriteItem = (favorite: any) => (
    <View key={favorite._id} style={{
      backgroundColor: tokens.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center'
    }}>
      <GameCover 
        title={favorite.gameId?.title || 'Jogo'}
        coverUrl={favorite.gameId?.coverUrl}
        width={60}
        aspect={4/3}
        rounded={8}
      />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: tokens.colors.text, fontSize: 16, fontWeight: 'bold' }}>
          {favorite.gameId?.title}
        </Text>
        <Text style={{ color: tokens.colors.textDim, fontSize: 12, marginTop: 4 }}>
          Threshold: {favorite.pctThreshold || 10}% • 
          {favorite.notifyDown ? ' Quedas' : ''}
          {favorite.notifyUp ? ' Altas' : ''}
        </Text>
        {favorite.stores && (
          <Text style={{ color: tokens.colors.primary, fontSize: 12, marginTop: 2 }}>
            Lojas: {favorite.stores.join(', ')}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={{
          padding: 8,
          backgroundColor: tokens.colors.danger,
          borderRadius: 8
        }}
        onPress={() => handleRemoveFavorite(favorite._id)}
      >
        <Ionicons name="trash" size={16} color="#FFF" />
      </TouchableOpacity>
    </View>
  )

  const renderListItem = (list: any) => (
    <View key={list._id} style={{
      backgroundColor: tokens.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12
    }}>
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
        onPress={() => setExpandedList(expandedList === list._id ? null : list._id)}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>
            {list.name}
          </Text>
          <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
            {list.itemCount || 0} jogos
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={{
              padding: 8,
              backgroundColor: tokens.colors.bgElev,
              borderRadius: 8,
              marginRight: 8
            }}
            onPress={() => handleDeleteList(list._id, list.name)}
          >
            <Ionicons name="trash" size={16} color="#ff4444" />
          </TouchableOpacity>
          <Ionicons 
            name={expandedList === list._id ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#888" 
          />
        </View>
      </TouchableOpacity>
      
      {expandedList === list._id && (
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: tokens.colors.border }}>
          <Text style={{ color: tokens.colors.textDim, fontSize: 12 }}>
            Itens da lista apareceriam aqui...
          </Text>
        </View>
      )}
    </View>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.bg }}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={{
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333'
      }}>
        <Text style={{
          color: '#FFF',
          fontSize: 24,
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          Desejos & Listas
        </Text>
      </View>

      {/* Tabs */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: tokens.colors.bgElev
      }}>
        {renderTabButton('watching', 'Vigiando', 'heart')}
        {renderTabButton('lists', 'Listas', 'list')}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Tab Vigiando */}
        {activeTab === 'watching' && (
          <View>
            {/* Filtros */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
                Filtros
              </Text>
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                {renderFilterChip('all', 'Todas as Lojas', filterStore, setFilterStore)}
                {renderFilterChip('steam', 'Steam', filterStore, setFilterStore)}
                {renderFilterChip('epic', 'Epic', filterStore, setFilterStore)}
              </View>
              <View style={{ flexDirection: 'row' }}>
                {renderFilterChip('all', 'Todas', filterChanged, setFilterChanged)}
                {renderFilterChip('down', 'Preço Caiu', filterChanged, setFilterChanged)}
                {renderFilterChip('up', 'Preço Subiu', filterChanged, setFilterChanged)}
              </View>
            </View>

            {/* Lista de Favoritos */}
            {isLoading ? (
                <ActivityIndicator size="large" color={tokens.colors.primary} style={{ marginTop: 50 }} />
            ) : (
              <View>
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
                  Seus Favoritos ({getFilteredFavorites().length})
                </Text>
                {getFilteredFavorites().length === 0 ? (
                  <View style={{
                    padding: 40,
                    alignItems: 'center'
                  }}>
                    <Ionicons name="heart-outline" size={60} color={tokens.colors.border} />
                    <Text style={{ color: tokens.colors.textDim, fontSize: 16, marginTop: 16, textAlign: 'center' }}>
                      Nenhum jogo favoritado ainda.{'\n'}
                      Adicione jogos aos favoritos para acompanhar mudanças de preço!
                    </Text>
                  </View>
                ) : (
                  getFilteredFavorites().map(renderFavoriteItem)
                )}
              </View>
            )}
          </View>
        )}

        {/* Tab Listas */}
        {activeTab === 'lists' && (
          <View>
            {/* Botão Criar Lista */}
            <TouchableOpacity
              style={{
                backgroundColor: tokens.colors.primary,
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 8,
                marginBottom: 20,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center'
              }}
              onPress={() => setShowCreateList(true)}
            >
              <Ionicons name="add" size={20} color={tokens.colors.bg} style={{ marginRight: 8 }} />
              <Text style={{ color: tokens.colors.bg, fontWeight: 'bold' }}>
                Criar Nova Lista
              </Text>
            </TouchableOpacity>

            {/* Input para criar lista */}
            {showCreateList && (
              <View style={{
                backgroundColor: tokens.colors.card,
                borderRadius: 12,
                padding: 16,
                marginBottom: 20
              }}>
                <TextInput
                  style={{
                    backgroundColor: tokens.colors.bgElev,
                    color: tokens.colors.text,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    marginBottom: 12
                  }}
                  placeholder="Nome da lista"
                  placeholderTextColor={tokens.colors.textDim}
                  value={newListName}
                  onChangeText={setNewListName}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: tokens.colors.bgElev,
                      paddingVertical: 8,
                      alignItems: 'center',
                      borderRadius: 8,
                      marginRight: 8
                    }}
                    onPress={() => {
                      setShowCreateList(false)
                      setNewListName('')
                    }}
                  >
                    <Text style={{ color: tokens.colors.text }}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: tokens.colors.primary,
                      paddingVertical: 8,
                      alignItems: 'center',
                      borderRadius: 8,
                      marginLeft: 8
                    }}
                    onPress={handleCreateList}
                  >
                      <Text style={{ color: tokens.colors.bg, fontWeight: 'bold' }}>Criar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Lista de Listas */}
            {listsLoading ? (
              <ActivityIndicator size="large" color={tokens.colors.primary} style={{ marginTop: 50 }} />
            ) : (
              <View>
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
                  Suas Listas ({lists.length})
                </Text>
                {lists.length === 0 ? (
                  <View style={{
                    padding: 40,
                    alignItems: 'center'
                  }}>
                    <Ionicons name="list-outline" size={60} color={tokens.colors.border} />
                    <Text style={{ color: tokens.colors.textDim, fontSize: 16, marginTop: 16, textAlign: 'center' }}>
                      Nenhuma lista criada ainda.{'\n'}
                      Crie listas para organizar seus jogos favoritos!
                    </Text>
                  </View>
                ) : (
                  lists.map(renderListItem)
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}