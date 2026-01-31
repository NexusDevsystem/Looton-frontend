/**
 * Utilities for rendering store icons and store-related UI
 */

import React from 'react';
import { View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const isTablet = require('react-native').Dimensions.get('window').width >= 768;

/**
 * Render a store icon as a circular logo
 * @param storeName - Name of the store (Steam, Epic Games, etc.)
 * @returns React element with store icon
 */
export const renderStoreIcon = (storeName: string | undefined): JSX.Element => {
  const iconSize = isTablet ? 28 : 24;
  const iconInnerSize = isTablet ? 16 : 14;

  if (!storeName) {
    return (
      <View
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: iconSize / 2,
          backgroundColor: '#4B5563',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name="storefront-outline" size={iconInnerSize} color="#FFFFFF" />
      </View>
    );
  }

  switch (storeName) {
    case 'Steam':
      return (
        <Image
          source={require('../../assets/images/steam.png')}
          style={{ width: iconSize, height: iconSize }}
          resizeMode="contain"
        />
      );
    case 'Epic Games':
      return (
        <Image
          source={require('../../assets/images/epicgames.png')}
          style={{ width: iconSize, height: iconSize }}
          resizeMode="contain"
        />
      );

    case 'Origin':
      return (
        <View
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: iconSize / 2,
            backgroundColor: '#F56C26',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="logo-game-controller" size={iconInnerSize} color="#FFFFFF" />
        </View>
      );
    case 'Uplay':
      return (
        <View
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: iconSize / 2,
            backgroundColor: '#000000',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="key" size={iconInnerSize} color="#FFFFFF" />
        </View>
      );
    case 'Humble Bundle':
      return (
        <View
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: iconSize / 2,
            backgroundColor: '#ab6441',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="cube" size={iconInnerSize} color="#FFFFFF" />
        </View>
      );
    case 'Green Man Gaming':
      return (
        <View
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: iconSize / 2,
            backgroundColor: '#8BBC3E',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="leaf" size={iconInnerSize} color="#FFFFFF" />
        </View>
      );
    default:
      return (
        <View
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: iconSize / 2,
            backgroundColor: '#4B5563',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="storefront-outline" size={iconInnerSize} color="#FFFFFF" />
        </View>
      );
  }
};
