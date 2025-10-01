import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WishlistService, WishlistItem } from '../services/WishlistService';
import { AddToListModal } from './AddToListModal'

const { width, height } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface GameDetailsProps {
  appId: number;
  visible: boolean;
  onClose: () => void;
  currentPrice?: number;
  originalPrice?: number;
  discount?: number;
  gameTitle?: string;
  userId?: string;
}

interface GameDetails {
  appId: number;
  name: string;
  type: string;
  required_age: number;
  is_free: boolean;
  detailed_description: string;
  about_the_game: string;
  short_description: string;
  developers: string[];
  publishers: string[];
  platforms: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  metacritic?: {
    score: number;
    url: string;
  };
  categories: Array<{
    id: number;
    description: string;
  }>;
  genres: Array<{
    id: string;
    description: string;
  }>;
  screenshots: Array<{
    id: number;
    path_thumbnail: string;
    path_full: string;
  }>;
  movies?: Array<{
    id: number;
    name: string;
    thumbnail: string;
    webm: {
      '480': string;
      max: string;
    };
    mp4: {
      '480': string;
      max: string;
    };
    highlight: boolean;
  }>;
  recommendations?: {
    total: number;
  };
  achievements?: {
    total: number;
  };
  release_date: {
    coming_soon: boolean;
    date: string;
  };
  support_info: {
    url: string;
    email: string;
  };
  background: string;
  background_raw: string;
  pc_requirements?: {
    minimum: string;
    recommended?: string;
  };
  mac_requirements?: {
    minimum: string;
    recommended?: string;
  };
  linux_requirements?: {
    minimum: string;
    recommended?: string;
  };
  legal_notice?: string;
  price_overview?: {
    currency: string;
    initial: number;
    final: number;
    discount_percent: number;
    initial_formatted: string;
    final_formatted: string;
  };
  header_image: string;
  capsule_image: string;
  capsule_imagev5: string;
}

export const GameDetailsModal: React.FC<GameDetailsProps> = ({
  appId,
  visible,
  onClose,
  currentPrice = 0,
  originalPrice = 0,
  discount = 0,
  gameTitle = '',
  userId,
}) => {
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [desiredPrice, setDesiredPrice] = useState('');
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistItem, setWishlistItem] = useState<WishlistItem | null>(null);

  useEffect(() => {
    if (visible && appId) {
      fetchGameDetails();
      checkWishlistStatus();
    }
  }, [visible, appId]);

  const fetchGameDetails = async () => {
    try {
      setLoading(true);
      console.log(`Buscando detalhes para appId: ${appId}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos timeout
      
      const response = await fetch(`${API_URL}/steam/details/${appId}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`Jogo com appId ${appId} não encontrado na Steam`);
          // Define dados mínimos para jogos não encontrados
          setGameDetails({
            appId,
            name: gameTitle || 'Jogo não encontrado',
            type: 'game',
            required_age: 0,
            is_free: false,
            detailed_description: 'Detalhes não disponíveis para este jogo.',
            about_the_game: 'Informações não disponíveis.',
            short_description: 'Jogo não encontrado na Steam.',
            developers: ['Desconhecido'],
            publishers: ['Desconhecido'],
            platforms: { windows: false, mac: false, linux: false },
            categories: [],
            genres: [],
            screenshots: [],
            movies: [],
            recommendations: { total: 0 },
            release_date: { coming_soon: false, date: 'Data não disponível' },
            support_info: { url: '', email: '' },
            background: '',
            background_raw: '',
            pc_requirements: { minimum: 'Requisitos não disponíveis' },
            mac_requirements: { minimum: 'Requisitos não disponíveis' },
            linux_requirements: { minimum: 'Requisitos não disponíveis' },
            header_image: '',
            capsule_image: '',
            capsule_imagev5: ''
          });
          return;
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Detalhes carregados para: ${data.name}`);
      setGameDetails(data);
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        Alert.alert('Timeout', 'A busca por detalhes demorou muito para responder');
      } else {
        console.log('Definindo dados básicos devido ao erro');
        // Define dados mínimos em caso de erro
        setGameDetails({
          appId,
          name: gameTitle || 'Erro ao carregar',
          type: 'game',
          required_age: 0,
          is_free: false,
          detailed_description: 'Não foi possível carregar os detalhes deste jogo.',
          about_the_game: 'Informações indisponíveis no momento.',
          short_description: 'Erro ao carregar informações.',
          developers: ['Desconhecido'],
          publishers: ['Desconhecido'],
          platforms: { windows: false, mac: false, linux: false },
          categories: [],
          genres: [],
          screenshots: [],
          movies: [],
          recommendations: { total: 0 },
          release_date: { coming_soon: false, date: 'Data não disponível' },
          support_info: { url: '', email: '' },
          background: '',
          background_raw: '',
          pc_requirements: { minimum: 'Requisitos não disponíveis' },
          mac_requirements: { minimum: 'Requisitos não disponíveis' },
          linux_requirements: { minimum: 'Requisitos não disponíveis' },
          header_image: '',
          capsule_image: '',
          capsule_imagev5: ''
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const checkWishlistStatus = async () => {
    const inWishlist = await WishlistService.isInWishlist(appId);
    setIsInWishlist(inWishlist);
    
    if (inWishlist) {
      const item = await WishlistService.getWishlistItem(appId);
      setWishlistItem(item);
      setDesiredPrice(item?.desiredPrice.toString() || '');
    }
  };

  const handleAddToWishlist = async () => {
    const price = parseFloat(desiredPrice.replace(',', '.'));
    
    if (isNaN(price) || price <= 0) {
      Alert.alert('Erro', 'Por favor, insira um preço válido');
      return;
    }

    try {
      const wishlistItem: Omit<WishlistItem, 'addedAt'> = {
        appId,
        title: gameDetails?.name || gameTitle,
        currentPrice,
        desiredPrice: price,
        coverUrl: gameDetails?.header_image || '',
        store: 'Steam',
        url: `https://store.steampowered.com/app/${appId}`,
        notified: false,
      };

      await WishlistService.addToWishlist(wishlistItem);
      setIsInWishlist(true);
      setShowWishlistModal(false);
      Alert.alert('Sucesso', `${gameDetails?.name || gameTitle} foi adicionado à sua lista de desejos!`);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar à lista de desejos');
    }
  };

  const handleRemoveFromWishlist = async () => {
    Alert.alert(
      'Remover da Lista',
      `Deseja remover "${gameDetails?.name || gameTitle}" da sua lista de desejos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await WishlistService.removeFromWishlist(appId);
            setIsInWishlist(false);
            setWishlistItem(null);
          },
        },
      ]
    );
  };

  // Use currency context for formatting
  let formatPrice: (p?: number | null) => string = (p) => 'Grátis'
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useCurrency } = require('../contexts/CurrencyContext') as any
    const ctx = useCurrency()
    formatPrice = (p?: number | null) => ctx.formatPrice(p ?? 0)
  } catch (e) {
    formatPrice = (p?: number | null) => {
      if (!p || isNaN(p) || p === 0) return 'Grátis'
      try {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p)
      } catch (e2) {
        return `${p.toFixed(2)} BRL`
      }
    }
  }

  const openSteamPage = () => {
    const url = `https://store.steampowered.com/app/${appId}`;
    Linking.openURL(url);
  };

  const renderSystemRequirements = (requirements?: { minimum: string; recommended?: string }) => {
    if (!requirements) return null;

    return (
      <View style={{ marginVertical: 16 }}>
        <Text style={{ color: '#E5E7EB', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
          Requisitos do Sistema
        </Text>
        
        <View style={{ backgroundColor: '#374151', borderRadius: 12, padding: 16 }}>
          <Text style={{ color: '#F9FAFB', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
            Requisitos Mínimos:
          </Text>
          <Text style={{ color: '#D1D5DB', fontSize: 14, lineHeight: 20 }}>
            {requirements.minimum.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"')}
          </Text>
          
          {requirements.recommended && (
            <>
              <Text style={{ color: '#F9FAFB', fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 16 }}>
                Requisitos Recomendados:
              </Text>
              <Text style={{ color: '#D1D5DB', fontSize: 14, lineHeight: 20 }}>
                {requirements.recommended.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"')}
              </Text>
            </>
          )}
        </View>
      </View>
    );
  };

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
            Detalhes do Jogo
          </Text>
          
          <TouchableOpacity onPress={openSteamPage}>
            <Ionicons name="open-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={{ color: '#9CA3AF', marginTop: 16 }}>Carregando detalhes...</Text>
          </View>
        ) : gameDetails ? (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* Hero Image */}
            <View style={{ position: 'relative' }}>
              <Image
                source={{ uri: gameDetails.header_image }}
                style={{ width: '100%', height: 200 }}
                contentFit="cover"
                cachePolicy="disk"
                transition={200}
              />
              <LinearGradient
                colors={['transparent', 'rgba(17, 24, 39, 0.8)', '#111827']}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 100,
                }}
              />
            </View>

            <View style={{ padding: 20 }}>
              {/* Title and Price */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: '#F9FAFB', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
                  {gameDetails.name}
                </Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {discount > 0 && (
                      <View style={{
                        backgroundColor: '#3B82F6',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        marginRight: 8,
                      }}>
                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>-{discount}%</Text>
                      </View>
                    )}
                    <View>
            <Text style={{ color: '#10B981', backgroundColor: 'rgba(16,185,129,0.08)', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 4, fontSize: 18, fontWeight: '900', lineHeight: 18, textShadowColor: 'rgba(16,185,129,0.06)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 1, alignSelf: 'flex-start' }}>
              {formatPrice(currentPrice)}
            </Text>
                        {discount > 0 && ( 
                        <Text style={{ 
                          color: '#9CA3AF', 
                          fontSize: 14, 
                          textDecorationLine: 'line-through',
                        }}>
                            {formatPrice(originalPrice)}
                        </Text>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      if (userId) {
                        // authenticated flow: open server lists modal
                        setShowAddToListModal(true)
                      } else {
                        // anonymous: local wishlist behavior
                        if (isInWishlist) {
                          handleRemoveFromWishlist()
                        } else {
                          setShowWishlistModal(true)
                        }
                      }
                    }}

                    style={{
                      backgroundColor: isInWishlist ? '#EF4444' : '#3B82F6',
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                    // We'll replace the handler in the next patch to avoid large hunks
                  >
                    <Ionicons 
                      name={isInWishlist ? "heart" : "heart-outline"} 
                      size={16} 
                      color="white" 
                      style={{ marginRight: 6 }}
                    />
                    <Text style={{ color: 'white', fontWeight: '600' }}>
                      {isInWishlist ? 'Na Lista' : 'Desejar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quick Info */}
              <View style={{ 
                flexDirection: 'row', 
                flexWrap: 'wrap', 
                marginBottom: 20,
                backgroundColor: '#1F2937',
                borderRadius: 12,
                padding: 16,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20, marginBottom: 8 }}>
                  <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                  <Text style={{ color: '#E5E7EB', marginLeft: 6 }}>
                    {gameDetails.release_date.date}
                  </Text>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20, marginBottom: 8 }}>
                  <Ionicons name="business-outline" size={16} color="#9CA3AF" />
                  <Text style={{ color: '#E5E7EB', marginLeft: 6 }} numberOfLines={1}>
                    {gameDetails.developers[0] || 'N/A'}
                  </Text>
                </View>

                {gameDetails.metacritic && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="star" size={16} color="#FCD34D" />
                    <Text style={{ color: '#E5E7EB', marginLeft: 6 }}>
                      {gameDetails.metacritic.score}/100
                    </Text>
                  </View>
                )}
              </View>

              {/* Platforms */}
              <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                <Text style={{ color: '#9CA3AF', marginRight: 12 }}>Plataformas:</Text>
                {gameDetails.platforms.windows && (
                  <Ionicons name="desktop-outline" size={20} color="#E5E7EB" style={{ marginRight: 8 }} />
                )}
                {gameDetails.platforms.mac && (
                  <Ionicons name="logo-apple" size={20} color="#E5E7EB" style={{ marginRight: 8 }} />
                )}
                {gameDetails.platforms.linux && (
                  <Text style={{ color: '#E5E7EB', fontSize: 16, marginRight: 8 }}>🐧</Text>
                )}
              </View>

              {/* Description */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: '#E5E7EB', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
                  Sobre o Jogo
                </Text>
                <Text style={{ color: '#D1D5DB', fontSize: 14, lineHeight: 22 }}>
                  {gameDetails.short_description}
                </Text>
              </View>

              {/* Screenshots */}
              {gameDetails.screenshots.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: '#E5E7EB', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
                    Capturas de Tela
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {gameDetails.screenshots.slice(0, 5).map((screenshot, index) => (
                      <Image
                        key={screenshot.id}
                        source={{ uri: screenshot.path_thumbnail }}
                        style={{
                          width: 150,
                          height: 90,
                          borderRadius: 8,
                          marginRight: 12,
                        }}
                        contentFit="cover"
                        cachePolicy="disk"
                        transition={200}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* System Requirements */}
              {renderSystemRequirements(gameDetails.pc_requirements)}

              {/* Genres */}
              {gameDetails.genres.length > 0 && (
                <View style={{ marginVertical: 16 }}>
                  <Text style={{ color: '#E5E7EB', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
                    Gêneros
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {gameDetails.genres.map((genre) => (
                      <View
                        key={genre.id}
                        style={{
                          backgroundColor: '#374151',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 16,
                          marginRight: 8,
                          marginBottom: 8,
                        }}
                      >
                        <Text style={{ color: '#E5E7EB', fontSize: 12 }}>
                          {genre.description}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#9CA3AF' }}>Erro ao carregar detalhes</Text>
          </View>
        )}

        {/* Wishlist Modal */}
        <Modal
          visible={showWishlistModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowWishlistModal(false)}
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
                Definir Preço Desejado
              </Text>
              
              <Text style={{ color: '#D1D5DB', marginBottom: 16, textAlign: 'center' }}>
                Você será notificado quando {gameDetails?.name || gameTitle} atingir este preço
              </Text>

              <View style={{
                backgroundColor: '#374151',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
              }}>
                <Text style={{ color: '#9CA3AF', marginBottom: 8 }}>Preço atual:</Text>
                <Text style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 'bold' }}>
                  {formatPrice(currentPrice)}
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
                value={desiredPrice}
                onChangeText={setDesiredPrice}
                keyboardType="numeric"
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowWishlistModal(false)}
                  style={{
                    flex: 1,
                    backgroundColor: '#6B7280',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleAddToWishlist}
                  style={{
                    flex: 1,
                    backgroundColor: '#3B82F6',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Server lists modal for authenticated users */}
        {userId && (
          <AddToListModal
            visible={showAddToListModal}
            onClose={() => setShowAddToListModal(false)}
            gameId={appId.toString()}
            gameTitle={gameDetails?.name || gameTitle || ''}
            userId={userId}
          />
        )}

        {/* Local wishlist modal for anonymous users (already implemented above via showWishlistModal) */}
      </View>
    </Modal>
  );
};