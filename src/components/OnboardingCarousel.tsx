import React, { useRef, useState } from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  Dimensions, 
  TouchableOpacity,
  Animated,
  StatusBar
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

const { width, height } = Dimensions.get('window')

interface OnboardingCarouselProps {
  onFinish: () => void
}

const slides = [
  {
    id: 1,
    icon: 'game-controller-outline' as const,
    title: 'Bem-vindo ao Looton',
    subtitle: 'Descubra os melhores deals em jogos',
    description: 'Encontre promoções incríveis na Steam, Epic Games e muito mais. Tudo em um só lugar.',
    gradient: ['#3B82F6', '#1D4ED8'] as const,
  },
  {
    id: 2,
    icon: 'trending-down-outline' as const,
    title: 'Acompanhe Preços',
    subtitle: 'Histórico e alertas inteligentes',
    description: 'Monitore o histórico de preços dos seus jogos favoritos e receba notificações quando o preço baixar.',
    gradient: ['#10B981', '#059669'] as const,
  },
  {
    id: 3,
    icon: 'flask-outline' as const,
    title: 'Versão Beta',
    subtitle: 'Você está testando o futuro',
    description: 'Esta é uma versão de teste. Sua opinião é muito importante para melhorarmos a experiência.',
    gradient: ['#F59E0B', '#D97706'] as const,
  },
]

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({ onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)
  const fadeAnim = useRef(new Animated.Value(1)).current

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize)
    setCurrentIndex(index)
  }

  const goToSlide = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * width,
      animated: true,
    })
  }

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      goToSlide(currentIndex + 1)
    } else {
      // Animação de saída
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onFinish()
      })
    }
  }

  const handleSkip = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onFinish()
    })
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
        >
          {slides.map((slide, index) => (
            <LinearGradient
              key={slide.id}
              colors={slide.gradient}
              style={{
                width,
                height,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 32,
              }}
            >
              <View style={{ alignItems: 'center', marginTop: -50 }}>
                {/* Ícone */}
                <View
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 40,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                    elevation: 8,
                  }}
                >
                  <Ionicons name={slide.icon} size={60} color="white" />
                </View>

                {/* Título */}
                <Text
                  style={{
                    fontSize: 32,
                    fontWeight: 'bold',
                    color: 'white',
                    textAlign: 'center',
                    marginBottom: 16,
                    textShadowColor: 'rgba(0,0,0,0.3)',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 4,
                  }}
                >
                  {slide.title}
                </Text>

                {/* Subtítulo */}
                <Text
                  style={{
                    fontSize: 18,
                    color: 'rgba(255,255,255,0.9)',
                    textAlign: 'center',
                    marginBottom: 24,
                    fontWeight: '600',
                  }}
                >
                  {slide.subtitle}
                </Text>

                {/* Descrição */}
                <Text
                  style={{
                    fontSize: 16,
                    color: 'rgba(255,255,255,0.8)',
                    textAlign: 'center',
                    lineHeight: 24,
                    maxWidth: 300,
                  }}
                >
                  {slide.description}
                </Text>
              </View>
            </LinearGradient>
          ))}
        </ScrollView>

        {/* Indicadores de página */}
        <View
          style={{
            position: 'absolute',
            bottom: 150,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {slides.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => goToSlide(index)}
              style={{
                width: currentIndex === index ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: currentIndex === index 
                  ? 'white' 
                  : 'rgba(255,255,255,0.4)',
                marginHorizontal: 4,
                transform: [{ scale: currentIndex === index ? 1 : 0.8 }],
              }}
            />
          ))}
        </View>

        {/* Botões de navegação */}
        <View
          style={{
            position: 'absolute',
            bottom: 60,
            left: 32,
            right: 32,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Botão Skip */}
          <TouchableOpacity
            onPress={handleSkip}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 24,
            }}
          >
            <Text
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              Pular
            </Text>
          </TouchableOpacity>

          {/* Botão Next/Finish */}
          <TouchableOpacity
            onPress={handleNext}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingVertical: 16,
              paddingHorizontal: 32,
              borderRadius: 25,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.3)',
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 16,
                fontWeight: 'bold',
                marginRight: 8,
              }}
            >
              {currentIndex === slides.length - 1 ? 'Começar' : 'Próximo'}
            </Text>
            <Ionicons 
              name={currentIndex === slides.length - 1 ? 'checkmark' : 'arrow-forward'} 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  )
}