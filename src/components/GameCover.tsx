import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  title: string;
  coverUrl?: string | null;
  aspect?: number;
  rounded?: number;
  width?: number | string;
  onPress?: () => void;
};

export const GameCover: React.FC<Props> = React.memo(({
  title,
  coverUrl,
  aspect = 16/9,
  rounded = 16,
  width = '100%',
  onPress
}) => {
  // Sanitiza URL
  const sanitizedUrl = coverUrl?.trim() || null;
  
  // Força HTTPS se for Steam/Epic
  const secureUrl = sanitizedUrl?.startsWith('http://') 
    ? sanitizedUrl.replace('http://', 'https://') 
    : sanitizedUrl;

  const containerStyle: ViewStyle = {
    width: width as any,
    aspectRatio: aspect,
    borderRadius: rounded,
    overflow: 'hidden',
    backgroundColor: '#122A4A',
  };

  const handleError = () => {
    // Silenciar warnings em produção para evitar spam no console
    if (__DEV__ && secureUrl && !secureUrl.includes('header.jpg')) {
      console.warn('GameCover error:', { title, url: secureUrl });
    }
  };

  const content = (
    <View style={containerStyle}>
      {secureUrl ? (
        <Image
          source={{ uri: secureUrl }}
          style={{ flex: 1 }}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
          onError={handleError}
          accessibilityLabel={`Capa do jogo: ${title}`}
        />
      ) : (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#122A4A',
          paddingHorizontal: 12,
        }}>
          <Ionicons 
            name="game-controller-outline" 
            size={Math.min(48, (typeof width === 'number' ? width : 200) * 0.2)} 
            color="#A9B8D4" 
          />
          <Text
            style={{
              color: '#A9B8D4',
              fontSize: 12,
              textAlign: 'center',
              marginTop: 8,
              lineHeight: 16,
            }}
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>
      )}
    </View>
  );

  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      {content}
    </TouchableOpacity>
  ) : content;
});

GameCover.displayName = 'GameCover';