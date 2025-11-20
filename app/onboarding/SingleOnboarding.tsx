import React, { useState, useRef } from 'react'
import { View, Text, TouchableOpacity, Dimensions, Animated, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

type Props = {
  userId?: string
  onFinish: (prefs?: any) => void
}

const { width, height } = Dimensions.get('window')

const slides = [
  {
    icon: 'game-controller' as const,
    title: 'Bem-vindo ao Looton',
    description: 'Encontre os melhores deals de jogos e hardware em um só lugar',
    gradient: ['#667eea', '#764ba2'] as const
  },
  {
    icon: 'pricetag' as const,
    title: 'Ofertas Incríveis',
    description: 'Monitore promoções da Steam, Epic Games e muito mais',
    gradient: ['#f093fb', '#f5576c'] as const
  },
  {
    icon: 'notifications' as const,
    title: 'Notificações Inteligentes',
    description: 'Receba alertas quando seus jogos favoritos entrarem em promoção',
    gradient: ['#4facfe', '#00f2fe'] as const
  }
]

export default function SingleOnboarding({ userId, onFinish }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const fadeAnim = useRef(new Animated.Value(1)).current
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      // Animação de saída
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true
        })
      ]).start(() => {
        setCurrentIndex(currentIndex + 1)
        // Animação de entrada
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          })
        ]).start()
      })
    } else {
      onFinish({ favoriteGenres: [], genreWeights: {} })
    }
  }

  const handleSkip = () => {
    onFinish({ favoriteGenres: [], genreWeights: {} })
  }

  const currentSlide = slides[currentIndex]

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={currentSlide.gradient}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Skip Button */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity 
          onPress={handleSkip}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Pular</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name={currentSlide.icon} size={120} color="#FFFFFF" />
        </View>

        {/* Title */}
        <Text style={styles.title}>{currentSlide.title}</Text>

        {/* Description */}
        <Text style={styles.description}>{currentSlide.description}</Text>

        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive
              ]}
            />
          ))}
        </View>

        {/* Next/Finish Button */}
        <TouchableOpacity
          onPress={handleNext}
          style={styles.button}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? 'Começar' : 'Próximo'}
          </Text>
          <Ionicons 
            name={currentIndex === slides.length - 1 ? 'checkmark' : 'arrow-forward'} 
            size={24} 
            color="#FFFFFF" 
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1020',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 26,
    marginBottom: 60,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 60,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    opacity: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
})
