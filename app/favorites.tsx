import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, RefreshControl } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { GameCover } from '../src/components/GameCover'
import { WishlistService, WishlistItem } from '../src/services/WishlistService'

export default function WatchingScreen() {
  const [watchingList, setWatchingList] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [filterStore, setFilterStore] = useState<'all' | 'steam'>('all')

  const loadWatchingList = async () => {
    try {
      setLoading(true)
      const wishlist = await WishlistService.getWishlist()
      setWatchingList(wishlist)
    } catch (error) {
      console.error('Erro ao carregar lista de observação:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFromWatching = async (appId: number) => {
    try {
      await WishlistService.removeFromWishlist(appId)
      await loadWatchingList()
    } catch (error) {
      console.error('Erro ao remover da lista:', error)
    }
  }

  const handleRemoveFromWatching = async (item: WishlistItem) => {
    Alert.alert(
      'Remover da Lista',
      `Deseja remover "${item.title}" da sua lista de observação?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: () => removeFromWatching(item.appId)
        }
      ]
    )
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadWatchingList()
    setRefreshing(false)
  }

  useEffect(() => {
    loadWatchingList()
  }, [])

  useEffect(() => {
    const unsubscribe = WishlistService.subscribe(() => {
      loadWatchingList()
    })
    return unsubscribe
  }, [])

  const getFilteredItems = (items: WishlistItem[]) => {
    if (filterStore === 'all') return items
    return items.filter(item => {
      const store = (item.store || '').toLowerCase()
      return store === 'steam'
    })
  }

  const filteredItems = getFilteredItems(watchingList)

  const renderWatchingItem = (item: WishlistItem) => (
    <View
      key={item.appId}
      style={{
        backgroundColor: '#374151',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        // Adicionar leve sombreamento
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4
      }}
    >
      <View style={{ width: 60, marginRight: 12 }}>
        <GameCover
          imageUrls={[item.coverUrl]}
          height={80}
        />
      </View>
      
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
          {item.title}
        </Text>
        
        <Text style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 8 }}>
          {item.store?.toUpperCase() || 'STEAM'}
        </Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: '#10B981', fontSize: 14, fontWeight: '600' }}>
              Preço Atual: R$ {item.currentPrice.toFixed(2)}
            </Text>
            <Text style={{ color: '#F59E0B', fontSize: 12 }}>
              Preço Desejado: R$ {item.desiredPrice.toFixed(2)}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => handleRemoveFromWatching(item)}
            style={{
              backgroundColor: '#DC2626',
              padding: 8,
              borderRadius: 8
            }}
          >
            <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={{ flex: 1 }}
      >
        <View style={{ padding: 20, paddingBottom: 0 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '700', marginBottom: 16 }}>
            Lista de Observação 
          </Text>
          
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            {[
              { key: 'all', label: 'Todos' },
              { key: 'steam', label: 'Steam' }
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                onPress={() => setFilterStore(filter.key as any)}
                style={{
                  backgroundColor: filterStore === filter.key ? '#3B82F6' : '#374151',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  marginRight: 12
                }}
              >
                <Text style={{
                  color: filterStore === filter.key ? '#FFFFFF' : '#9CA3AF',
                  fontSize: 14,
                  fontWeight: '600'
                }}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView
          style={{ flex: 1, paddingHorizontal: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3B82F6"
            />
          }
        >
          {loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={{ color: '#9CA3AF', marginTop: 16 }}>
                Carregando lista...
              </Text>
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="eye-off-outline" size={64} color="#4B5563" />
              <Text style={{ color: '#9CA3AF', fontSize: 18, marginTop: 16, textAlign: 'center' }}>
                {watchingList.length === 0 
                  ? 'Nenhum jogo na lista de observação'
                  : 'Nenhum jogo encontrado com os filtros aplicados'
                }
              </Text>
              <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                Adicione jogos à sua lista de observação para acompanhar mudanças de preço
              </Text>
            </View>
          ) : (
            <View style={{ paddingBottom: 20 }}>
              {filteredItems.map(renderWatchingItem)}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  )
}
