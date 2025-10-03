import React, { useEffect, useRef } from 'react'
import { 
  View, 
  Text, 
  Animated, 
  Dimensions, 
  StatusBar 
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

const { width, height } = Dimensions.get('window')

interface SplashScreenProps {
  onFinish: () => void
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.3)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  useEffect(() => {
    // Sequência de animações
    Animated.sequence([
      // Fade in do logo
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Slide in do texto
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      // Aguarda um pouco
      Animated.delay(1200),
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish()
    })
  }, [])

  return (
    <>
      <StatusBar hidden />
      <LinearGradient
        colors={['#111827', '#1F2937', '#374151']}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
            alignItems: 'center',
          }}
        >
          {/* Logo/Ícone */}
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 24,
              backgroundColor: '#3B82F6',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24,
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontSize: 48,
                fontWeight: 'bold',
                color: 'white',
                textShadowColor: 'rgba(0,0,0,0.3)',
                textShadowOffset: { width: 2, height: 2 },
                textShadowRadius: 4,
              }}
            >
              L
            </Text>
          </View>

          {/* Nome do App */}
          <Text
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: 'white',
              marginBottom: 8,
              letterSpacing: 2,
            }}
          >
            LOOTON
          </Text>

          {/* Tagline */}
          <Text
            style={{
              fontSize: 16,
              color: '#9CA3AF',
              textAlign: 'center',
              marginBottom: 32,
            }}
          >
            Descubra os melhores deals
          </Text>

          {/* Indicador de carregamento */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 20,
            }}
          >
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }}
            >
              <Ionicons name="refresh-outline" size={20} color="#3B82F6" />
            </Animated.View>
            <Text
              style={{
                color: '#6B7280',
                fontSize: 14,
                marginLeft: 8,
              }}
            >
              Carregando...
            </Text>
          </View>
        </Animated.View>

        {/* Versão no canto */}
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 50,
            opacity: fadeAnim,
          }}
        >
          <Text
            style={{
              color: '#4B5563',
              fontSize: 12,
              textAlign: 'center',
            }}
          >
            Beta v0.1.0
          </Text>
        </Animated.View>
      </LinearGradient>
    </>
  )
}