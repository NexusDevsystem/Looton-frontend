import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GameCover } from './GameCover';
import { useCurrency } from '../contexts/CurrencyContext'

const { width } = Dimensions.get('window');

interface Deal {
  _id: string;
  url: string;
  priceBase: number;
  priceFinal: number;
  discountPct: number;
  game: {
    title: string;
    coverUrl: string;
  };
  imageUrls?: string[];
  store: {
    name: string;
  };
}

interface DailyDealBannerProps {
  deal: Deal;
  onPress: (deal: Deal) => void;
}

export const DailyDealBanner: React.FC<DailyDealBannerProps> = ({ deal, onPress }) => {
  const { formatPrice } = useCurrency() as any
  const displayPrice = (deal as any).formattedPrice || (deal.priceFinal === 0 ? 'GRÁTIS' : formatPrice(deal.priceFinal))
  const displayOriginalPrice = (deal as any).originalFormattedPrice && (deal as any).originalFormattedPrice !== displayPrice
    ? (deal as any).originalFormattedPrice
    : (deal.priceBase > 0 && deal.priceBase !== deal.priceFinal ? formatPrice(deal.priceBase) : null)

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginVertical: 16,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
      }}
    >
      {/* GameCover com overlay */}
      <View style={{ position: 'relative' }}>
        <TouchableOpacity onPress={() => onPress(deal)}>
          <GameCover
            imageUrls={(deal.imageUrls && deal.imageUrls.length > 0) ? deal.imageUrls : [deal.game.coverUrl]}
            height={140}
          />
        </TouchableOpacity>
        
        {/* Overlay gradiente */}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
        
        {/* Badge "Oferta do Dia" */}
      <View
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          backgroundColor: '#FF6B35',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Ionicons name="flash" size={16} color="#FFFFFF" />
        <Text style={{
          color: '#FFFFFF',
          fontSize: 12,
          fontWeight: '700',
          marginLeft: 4,
        }}>
          OFERTA DO DIA
        </Text>
      </View>

      {/* Badge de desconto */}
      <View
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          backgroundColor: '#DC2626',
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 25,
        }}
      >
        <Text style={{
          color: '#FFFFFF',
          fontSize: 18,
          fontWeight: '900',
        }}>
          -{deal.discountPct}%
        </Text>
      </View>
      </View>

      {/* Conteúdo do banner */}
      <View
        style={{
          height: 140,
          justifyContent: 'flex-end',
          padding: 16,
        }}
      >
        {/* Título do jogo */}
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 20,
            fontWeight: '800',
            marginBottom: 6,
            textShadowColor: 'rgba(0,0,0,0.8)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 4,
          }}
          numberOfLines={2}
        >
          {deal.game.title}
        </Text>

        {/* Container de preços */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          {/* Preço original */}
          {displayOriginalPrice && displayOriginalPrice !== displayPrice && (
            <Text
              style={{
                color: '#9CA3AF',
                fontSize: 16,
                textDecorationLine: 'line-through',
                marginRight: 12,
                textShadowColor: 'rgba(0,0,0,0.8)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
            >
              {displayOriginalPrice}
            </Text>
          )}

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#9CA3AF', fontSize: 16, textDecorationLine: 'line-through', marginRight: 12 }}>{displayOriginalPrice}</Text>
              <Text style={{ color: '#10B981', backgroundColor: 'rgba(16,185,129,0.08)', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 4, fontSize: 24, fontWeight: '900', lineHeight: 24, textShadowColor: 'rgba(16,185,129,0.06)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 1, alignSelf: 'flex-start' }}>{displayPrice}</Text>
            </View>
        </View>

        {/* Botão de ação */}
        <View
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.9)',
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 25,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'flex-start',
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: '700',
              marginRight: 8,
            }}
          >
            VER DETALHES
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </View>

        {/* Indicador da loja */}
        <View
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            backgroundColor: 'rgba(75, 85, 99, 0.9)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 15,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: '600',
            }}
          >
            {deal.store.name}
          </Text>
        </View>
      </View>
    </View>
  );
};