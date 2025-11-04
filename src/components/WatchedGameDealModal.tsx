import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  StyleSheet,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { EventBus } from '../lib/EventBus';
import { useLanguage } from '../contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WatchedGameDealModalProps {
  visible: boolean;
  onClose: () => void;
  gameData: {
    title: string;
    coverUrl?: string;
    oldPrice: number;
    newPrice: number;
    discount: number;
    store: string;
    url: string;
    appId?: string;
  } | null;
}

export const WatchedGameDealModal: React.FC<WatchedGameDealModalProps> = ({
  visible,
  onClose,
  gameData,
}) => {
  const { t } = useLanguage();
  
  if (!gameData) return null;

  const handleOpenStore = () => {
    if (gameData.url) {
      Linking.openURL(gameData.url);
      onClose();
    }
  };

  const handleViewDetails = () => {
    // Emitir evento para abrir o modal de detalhes do jogo
    if (gameData.appId) {
      EventBus.emit('openGameDetails', { appId: gameData.appId });
    }
    onClose();
  };

  const savings = gameData.oldPrice - gameData.newPrice;
  const savingsPercent = ((savings / gameData.oldPrice) * 100).toFixed(0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.blurOverlay}>
          <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
            {/* Imagem do Jogo com Gradient */}
            <View style={styles.imageContainer}>
              {gameData.coverUrl ? (
                <Image
                  source={{ uri: gameData.coverUrl }}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="game-controller" size={64} color={tokens.colors.textDim} />
                </View>
              )}
              
              {/* Gradient Overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(17, 24, 39, 0.95)', tokens.colors.bg]}
                style={styles.imageGradient}
              />

              {/* Badge de Desconto */}
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{gameData.discount}%</Text>
              </View>

              {/* Botão Fechar */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Conteúdo */}
            <View style={styles.content}>
              {/* Tag de Promoção */}
              <View style={styles.promotionTag}>
                <Ionicons name="flash" size={16} color="#FBBF24" />
                <Text style={styles.promotionText}>{t('dealModal.specialOffer')}</Text>
              </View>

              {/* Título do Jogo */}
              <Text style={styles.title} numberOfLines={2}>
                {gameData.title}
              </Text>

              {/* Loja */}
              <View style={styles.storeContainer}>
                <Ionicons name="storefront-outline" size={16} color={tokens.colors.textDim} />
                <Text style={styles.storeText}>{gameData.store}</Text>
              </View>

              {/* Preços */}
              <View style={styles.priceContainer}>
                <View style={styles.priceRow}>
                  {/* Preço Original */}
                  <View style={styles.oldPriceContainer}>
                    <Text style={styles.oldPriceLabel}>{t('dealModal.from')}</Text>
                    <Text style={styles.oldPrice}>
                      R$ {gameData.oldPrice.toFixed(2)}
                    </Text>
                  </View>

                  {/* Seta */}
                  <Ionicons name="arrow-forward" size={20} color={tokens.colors.primary} />

                  {/* Preço Novo */}
                  <View style={styles.newPriceContainer}>
                    <Text style={styles.newPriceLabel}>{t('dealModal.to')}</Text>
                    <Text style={styles.newPrice}>
                      R$ {gameData.newPrice.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Economia */}
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.savingsContainer}
                >
                  <Ionicons name="trending-down" size={18} color="#FFF" />
                  <Text style={styles.savingsText}>
                    {t('dealModal.save')} R$ {savings.toFixed(2)} ({savingsPercent}%)
                  </Text>
                </LinearGradient>
              </View>

              {/* Botões de Ação */}
              <View style={styles.actionButtons}>
                {/* Botão Principal - Ver na Loja */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleOpenStore}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButtonGradient}
                  >
                    <Ionicons name="cart" size={22} color="#FFF" />
                    <Text style={styles.primaryButtonText}>{t('dealModal.viewStore')}</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>

                {/* Botão Secundário - Ver Detalhes */}
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleViewDetails}
                  activeOpacity={0.7}
                >
                  <Ionicons name="information-circle-outline" size={20} color={tokens.colors.primary} />
                  <Text style={styles.secondaryButtonText}>{t('dealModal.viewDetails')}</Text>
                </TouchableOpacity>
              </View>

              {/* Texto de Incentivo */}
              <View style={styles.urgencyContainer}>
                <Ionicons name="time-outline" size={16} color="#F59E0B" />
                <Text style={styles.urgencyText}>
                  {t('dealModal.urgency')}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  blurOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  container: {
    width: SCREEN_WIDTH - 32,
    maxWidth: 420,
    backgroundColor: tokens.colors.bg,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  imageContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: tokens.colors.chip,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  discountText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    padding: 20,
  },
  promotionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 6,
  },
  promotionText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: tokens.colors.text,
    marginBottom: 8,
    lineHeight: 30,
  },
  storeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  storeText: {
    fontSize: 14,
    color: tokens.colors.textDim,
    fontWeight: '500',
  },
  priceContainer: {
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  oldPriceContainer: {
    flex: 1,
  },
  oldPriceLabel: {
    fontSize: 12,
    color: tokens.colors.textDim,
    marginBottom: 2,
    fontWeight: '500',
  },
  oldPrice: {
    fontSize: 18,
    color: tokens.colors.textDim,
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  newPriceContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  newPriceLabel: {
    fontSize: 12,
    color: tokens.colors.primary,
    marginBottom: 2,
    fontWeight: '500',
  },
  newPrice: {
    fontSize: 28,
    color: '#10B981',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  savingsText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: tokens.colors.chip,
    gap: 8,
  },
  secondaryButtonText: {
    color: tokens.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  urgencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  urgencyText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
