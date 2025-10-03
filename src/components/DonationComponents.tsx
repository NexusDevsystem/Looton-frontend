import React, { useState } from 'react'
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Dimensions,
  SafeAreaView 
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

const { width, height } = Dimensions.get('window')

interface DonationModalProps {
  visible: boolean
  onClose: () => void
}

export function DonationModal({ visible, onClose }: DonationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#1F2937', '#111827']}
              style={styles.gradient}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Ionicons name="heart" size={32} color="#EF4444" />
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text style={styles.title}>
                  Ajude a manter o Looton funcionando! 💝
                </Text>
                
                <Text style={styles.description}>
                  Este app é gratuito e desenvolvido com amor. Sua doação nos ajuda a:
                </Text>

                <View style={styles.benefitsList}>
                  <View style={styles.benefit}>
                    <Ionicons name="server" size={16} color="#10B981" />
                    <Text style={styles.benefitText}>Manter os servidores rodando</Text>
                  </View>
                  <View style={styles.benefit}>
                    <Ionicons name="code-slash" size={16} color="#10B981" />
                    <Text style={styles.benefitText}>Desenvolver novas funcionalidades</Text>
                  </View>
                  <View style={styles.benefit}>
                    <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                    <Text style={styles.benefitText}>Garantir estabilidade e segurança</Text>
                  </View>
                </View>

                <Text style={styles.anyValue}>
                  ✨ Qualquer valor é muito bem-vindo! ✨
                </Text>

                {/* QR Code */}
                <View style={styles.qrContainer}>
                  <Image 
                    source={require('../../assets/images/qrcode.jpeg')} 
                    style={styles.qrCode}
                    resizeMode="contain"
                  />
                  <Text style={styles.qrLabel}>PIX para doação</Text>
                </View>

                <Text style={styles.gratitude}>
                  Muito obrigado pelo seu apoio! 🙏
                </Text>
              </View>
            </LinearGradient>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

interface DonationBannerProps {
  onPress: () => void
  onDismiss: () => void
}

export function DonationBanner({ onPress, onDismiss }: DonationBannerProps) {
  return (
    <View style={styles.banner}>
      <LinearGradient
        colors={['#DC2626', '#B91C1C']}
        style={styles.bannerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.bannerContent}>
          <View style={styles.bannerLeft}>
            <Ionicons name="heart" size={20} color="#FFFFFF" />
            <Text style={styles.bannerText}>
              Ajude a manter o app funcionando
            </Text>
          </View>
          
          <View style={styles.bannerButtons}>
            <TouchableOpacity style={styles.donateButton} onPress={onPress}>
              <Text style={styles.donateButtonText}>Doar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
              <Ionicons name="close" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  // Modal styles
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Math.min(width - 40, 400),
    maxHeight: height * 0.8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  benefitsList: {
    width: '100%',
    marginBottom: 20,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  benefitText: {
    fontSize: 14,
    color: '#E5E7EB',
    marginLeft: 12,
    flex: 1,
  },
  anyValue: {
    fontSize: 16,
    color: '#FCD34D',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 24,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrCode: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 8,
  },
  qrLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'center',
  },
  gratitude: {
    fontSize: 16,
    color: '#10B981',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Banner styles
  banner: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  bannerGradient: {
    padding: 16,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  bannerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  donateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  donateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissButton: {
    padding: 8,
  },
})