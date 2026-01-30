import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WishlistService, WishlistItem } from '../services/WishlistService';
import { GameCover } from './GameCover';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';

const { width } = Dimensions.get('window');

interface WishlistTabProps {
  visible: boolean;
  onClose: () => void;
}

export const WishlistTab: React.FC<WishlistTabProps> = ({ visible, onClose }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [newDesiredPrice, setNewDesiredPrice] = useState('');
  const { formatPrice, convertPrice } = useCurrency();
  const { t } = useLanguage();

  useEffect(() => {
    if (visible) {
      loadWishlist();
    }
  }, [visible]);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const items = await WishlistService.getWishlist();
      setWishlist(items);
    } catch (error) {
      console.error('Erro ao carregar wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = (item: WishlistItem) => {
    Alert.alert(
      t('wishlist.remove'),
      `${t('wishlist.remove')} "${item.title}"?`,
      [
        { text: t('button.cancel'), style: 'cancel' },
        {
          text: t('wishlist.remove'),
          style: 'destructive',
          onPress: async () => {
            await WishlistService.removeFromWishlist(item.appId);
            loadWishlist();
          },
        },
      ]
    );
  };

  const handleEditPrice = (item: WishlistItem) => {
    setEditingItem(item);
    setNewDesiredPrice(item.desiredPrice.toString());
  };

  const handleSavePrice = async () => {
    if (!editingItem) return;

    const price = parseFloat(newDesiredPrice.replace(',', '.'));
    
    if (isNaN(price) || price <= 0) {
      Alert.alert(t('toast.error'), t('wishlist.updatePrice'));
      return;
    }

    try {
      await WishlistService.updateDesiredPrice(editingItem.appId, price);
      setEditingItem(null);
      loadWishlist();
      Alert.alert(t('toast.success'), t('toast.saved'));
    } catch (error) {
      Alert.alert(t('toast.error'), t('toast.error'));
    }
  };


  // price status and progress will be computed per-item inside the render loop

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: '#111827' }}>
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 50,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#374151'
        }}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#E5E7EB" />
          </TouchableOpacity>
          
          <Text style={{ color: '#F9FAFB', fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center' }}>
            Lista de Desejos
          </Text>
          
          <View style={{
            backgroundColor: '#3B82F6',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
          }}>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
              {wishlist.length}
            </Text>
          </View>
        </View>

        {wishlist.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <Ionicons name="heart-outline" size={64} color="#6B7280" />
            <Text style={{ color: '#9CA3AF', fontSize: 18, textAlign: 'center', marginTop: 16 }}>
              {t('wishlist.empty')}
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
              {t('wishlist.emptyDesc')}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={loadWishlist}
                tintColor="#3B82F6"
              />
            }
            showsVerticalScrollIndicator={false}
          >
            <View style={{ padding: 20 }}>
              {wishlist.map((item, index) => {
                const curr = convertPrice(item.currentPrice);
                const desired = convertPrice(item.desiredPrice);
                const reached = curr <= desired;
                const remainingBRL = Math.max(item.desiredPrice - item.currentPrice, 0)
                const priceStatus = reached
                  ? { color: '#3B82F6', text: 'Preço atingido!' }
                  : { color: '#F59E0B', text: `Faltam ${formatPrice(remainingBRL)}` };

                const percent = reached
                  ? 100
                  : (desired > 0 ? Math.min((curr / desired) * 100, 100) : 0);

                return (
                  <View
                    style={{
                      backgroundColor: '#1F2937',
                      borderRadius: 16,
                      marginBottom: 16,
                      overflow: 'hidden',
                      borderWidth: reached ? 2 : 0,
                      borderColor: reached ? '#3B82F6' : 'transparent',
                    }}
                  >
                    <View style={{ flexDirection: 'row', padding: 16 }}>
                      {/* Game Image */}
                      <GameCover
                        imageUrls={[item.coverUrl]}
                        height={45}
                      />

                      {/* Game Info */}
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ color: '#F9FAFB', fontSize: 16, fontWeight: '600' }} numberOfLines={1}>
                          {item.title}
                        </Text>
                        
                        <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>
                          {item.store}
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={{ color: '#E5E7EB', fontSize: 14, fontWeight: '600' }}>Atual:&nbsp;</Text>
                              <Text style={item.currentPrice <= item.desiredPrice ? { color: '#10B981', backgroundColor: 'rgba(16,185,129,0.08)', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, fontWeight: '800' } : { color: '#E5E7EB', fontWeight: '700' }}>
                                {formatPrice(item.currentPrice)}
                              </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                              <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Desejado:&nbsp;</Text>
                              <Text style={{ color: '#F9FAFB', fontSize: 12, fontWeight: '700' }}>{formatPrice(item.desiredPrice)}</Text>
                            </View>
                          </View>

                          <View style={{ flex: 0, alignItems: 'flex-end' }}>
                            <Text style={{ color: priceStatus.color, fontSize: 12, fontWeight: '600' }}>{priceStatus.text}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Actions */}
                      <View style={{ alignItems: 'center', justifyContent: 'space-between', paddingLeft: 8 }}>
                        <TouchableOpacity
                          onPress={() => handleEditPrice(item)}
                          style={{
                            backgroundColor: '#374151',
                            padding: 8,
                            borderRadius: 20,
                          }}
                        >
                          <Ionicons name="pencil" size={16} color="#E5E7EB" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleRemoveItem(item)}
                          style={{
                            backgroundColor: '#EF4444',
                            padding: 8,
                            borderRadius: 20,
                            marginTop: 8,
                          }}
                        >
                          <Ionicons name="trash" size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                      <View style={{
                        backgroundColor: '#374151',
                        height: 4,
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}>
                        <View style={{
                          backgroundColor: reached ? '#3B82F6' : '#F59E0B',
                          height: '100%',
                          width: `${percent}%`,
                          borderRadius: 2,
                        }} />
                      </View>
                    </View>

                    {/* Price Alert Badge */}
                    {reached && (
                      <View style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: '#3B82F6',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}>
                        <Ionicons name="notifications" size={12} color="white" />
                        <Text style={{ color: 'white', fontSize: 10, marginLeft: 4, fontWeight: '600' }}>
                          ALERTA
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* Edit Price Modal */}
        <Modal
          visible={!!editingItem}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setEditingItem(null)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}>
            <View style={{
              backgroundColor: '#1F2937',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 400,
            }}>
              <Text style={{
                color: '#F9FAFB',
                fontSize: 20,
                fontWeight: 'bold',
                marginBottom: 16,
                textAlign: 'center',
              }}>
                {t('wishlist.updatePrice')}
              </Text>
              
              <Text style={{ color: '#D1D5DB', marginBottom: 16, textAlign: 'center' }}>
                {editingItem?.title}
              </Text>

              <View style={{
                backgroundColor: '#374151',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
              }}>
                <Text style={{ color: '#9CA3AF', marginBottom: 8 }}>{t('wishlist.currentPrice')}:</Text>
                <Text style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 'bold' }}>
                  {editingItem && formatPrice(editingItem.currentPrice)}
                </Text>
              </View>

              <TextInput
                style={{
                  backgroundColor: '#374151',
                  borderRadius: 12,
                  padding: 16,
                  color: '#F9FAFB',
                  fontSize: 16,
                  marginBottom: 20,
                }}
                placeholder="Ex: 29,99"
                placeholderTextColor="#9CA3AF"
                value={newDesiredPrice}
                onChangeText={setNewDesiredPrice}
                keyboardType="numeric"
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setEditingItem(null)}
                  style={{
                    flex: 1,
                    backgroundColor: '#6B7280',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>{t('button.cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSavePrice}
                  style={{
                    flex: 1,
                    backgroundColor: '#3B82F6',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>{t('button.save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};