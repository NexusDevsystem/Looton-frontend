import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, RefreshControl } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { GameCover } from '../src/components/GameCover'
import { WishlistService, WishlistItem } from '../src/services/WishlistService'
import { useLanguage } from '../src/contexts/LanguageContext'

export default function WatchingScreen() {
  const { t } = useLanguage();
  const [watchingList, setWatchingList] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

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
      t('wishlist.remove'),
      `${t('wishlist.remove')} "${item.title}"?`,
      [
        { text: t('button.cancel'), style: 'cancel' },
        { 
          text: t('wishlist.remove'), 
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

  const filteredItems = watchingList;

  const renderWatchingItem = (item: WishlistItem) => {
    // Calcular se o preço atual atingiu ou está abaixo do desejado
    const isTargetReached = item.desiredPrice > 0 && item.currentPrice <= item.desiredPrice;
    
    return (
      <View
        key={item.appId}
        style={{
          backgroundColor: '#374151',
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
          flexDirection: 'row',
        }}
      >
        <View style={{ width: 80, marginRight: 12 }}>
          <GameCover
            imageUrls={[item.coverUrl]}
            height={100}
            style={{ borderRadius: 6 }}
          />
        </View>
        
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 }}>
              {item.title}
            </Text>
            
            <TouchableOpacity
              onPress={() => handleRemoveFromWatching(item)}
              style={{
                padding: 4,
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          
          <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 8 }}>
            {item.store?.toUpperCase() || 'STEAM'}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ color: '#10B981', fontSize: 16, fontWeight: '700' }}>
                R$ {item.currentPrice.toFixed(2)}
              </Text>
              {item.desiredPrice > 0 ? (
                <Text style={{ 
                  color: isTargetReached ? '#10B981' : '#F59E0B', 
                  fontSize: 12, 
                  fontWeight: '500',
                  textDecorationLine: isTargetReached ? 'line-through' : 'none'
                }}>
                  Desejado: R$ {item.desiredPrice.toFixed(2)}
                </Text>
              ) : (
                <Text style={{ color: '#3B82F6', fontSize: 12, fontWeight: '500' }}>
                  Qualquer promoção
                </Text>
              )}
              
              {item.desiredPrice > 0 && isTargetReached && (
                <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '600', marginTop: 2 }}>
                  OBJETIVO ATINGIDO!
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1F2937' }}>
      <StatusBar style="light" />
      
      <View
        style={{ flex: 1, backgroundColor: '#1F2937' }}
      >
        <View style={{ padding: 20, paddingBottom: 0 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '700', marginBottom: 16 }}>
            {t('favorites.title')}
          </Text>
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
                {t('home.loading')}
              </Text>
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="eye-off-outline" size={64} color="#4B5563" />
              <Text style={{ color: '#9CA3AF', fontSize: 18, marginTop: 16, textAlign: 'center' }}>
                {watchingList.length === 0 
                  ? t('favorites.empty')
                  : t('search.noResults')
                }
              </Text>
              <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                {t('favorites.emptyMessage')}
              </Text>
            </View>
          ) : (
            <View style={{ paddingBottom: 20 }}>
              {filteredItems.map(renderWatchingItem)}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}
