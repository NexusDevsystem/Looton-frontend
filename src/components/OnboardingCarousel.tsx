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
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window')

// Função para solicitar permissão de notificação
async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
        android: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      
      return newStatus === 'granted';
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao solicitar permissão de notificação:', error);
    return false;
  }
}

interface OnboardingCarouselProps {
  onFinish: () => void
}

const slides = [
  {
    id: 1,
    icon: 'game-controller-outline' as const,
    title: 'Bem-vindo ao Looton',
    subtitle: 'Descubra os melhores deals em jogos',
    description: 'Encontre promoções incríveis na Steam e muito mais. Tudo em um só lugar.',
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
    icon: 'notifications-outline' as const,
    title: 'Fique por dentro',
    subtitle: 'Ative notificações para não perder ofertas',
    description: 'Receba alertas quando os jogos que você quer estiverem em promoção. Deseja ativar as notificações?',
    gradient: ['#8B5CF6', '#7C3AED'] as const,
  },
  {
    id: 4,
    icon: 'flask-outline' as const,
    title: 'Pronto para Começar',
    subtitle: 'Você está configurado!',
    description: 'Agora você pode aproveitar as melhores ofertas em jogos. Boas caçadas!',
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

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      // Se for o slide de notificações, solicitar permissão e registrar token
      if (currentIndex === 2) { // índice do slide de notificações
        const granted = await requestNotificationPermission();
        if (granted) {
          console.log('✅ Permissão de notificação concedida');
          
          // Registrar push token no backend
          try {
            const { getCurrentPushToken, sendPushTokenToBackend } = await import('../notifications');
            
            // Obter e enviar push token
            const pushToken = await getCurrentPushToken('41306841-8939-4568-a1a1-af93af0428d1');
            if (pushToken) {
              await sendPushTokenToBackend(pushToken);
              console.log('✅ Push token registrado no backend:', pushToken);
            }
          } catch (error) {
            console.error('❌ Erro ao registrar push token:', error);
          }
        } else {
          console.log('⚠️ Permissão de notificação negada');
        }
      }
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
          {/* Botão Skip - aparece em todos os slides exceto o de notificação e o último */}
          {currentIndex !== 2 && currentIndex < slides.length - 1 ? (
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
          ) : (
            <View />
          )}

          {/* Botões condicionais baseados no slide atual */}
          {currentIndex === 2 ? ( // slide de notificação (índice 2)
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', flex: 1 }}>
              <TouchableOpacity
                onPress={async () => {
                  // Pular notificações
                  handleNext(); // chama handleNext que ainda tenta pedir a permissão mas não bloqueia
                }}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 20,
                  marginRight: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.3)',
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                >
                  Não, obrigado
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNext}
                style={{
                  backgroundColor: '#10B981',
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#10B981',
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                >
                  Sim, quero notificações
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
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
                alignSelf: 'flex-end',
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
          )}
        </View>
      </Animated.View>
    </>
  )
}