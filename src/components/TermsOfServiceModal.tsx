import React from 'react'
import { Modal, View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface TermsOfServiceModalProps {
  visible: boolean
  onAccept: () => void
}

export function TermsOfServiceModal({ visible, onAccept }: TermsOfServiceModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1F2937' }}>
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={{
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#374151',
            alignItems: 'center'
          }}>
            <Text style={{
              color: '#FFFFFF',
              fontSize: 24,
              fontWeight: '700',
              textAlign: 'center'
            }}>
              Termos de Serviço
            </Text>
            <Text style={{
              color: '#9CA3AF',
              fontSize: 16,
              marginTop: 4,
              textAlign: 'center'
            }}>
              Looton - by Nexus DevSystem
            </Text>
          </View>

          {/* Content */}
          <ScrollView style={{ flex: 1, padding: 20 }}>
            <Text style={{
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: '700',
              marginBottom: 16
            }}>
              Bem-vindo ao Looton!
            </Text>

            <Text style={{
              color: '#E5E7EB',
              fontSize: 16,
              lineHeight: 24,
              marginBottom: 20
            }}>
              Ao utilizar este aplicativo, você concorda com os seguintes termos e condições:
            </Text>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                1. Uso do Aplicativo
              </Text>
              <Text style={{
                color: '#E5E7EB',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12
              }}>
                O Looton é um aplicativo gratuito para encontrar ofertas de jogos. Desenvolvido pela Nexus DevSystem, nosso objetivo é ajudar gamers a encontrar os melhores preços.
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                2. Dados e Privacidade
              </Text>
              <Text style={{
                color: '#E5E7EB',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12
              }}>
                Respeitamos sua privacidade. O aplicativo pode coletar dados básicos de uso para melhorar a experiência. Não compartilhamos informações pessoais com terceiros.
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                3. Ofertas e Preços
              </Text>
              <Text style={{
                color: '#E5E7EB',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12
              }}>
                As ofertas são coletadas de diferentes lojas e podem variar. Não somos responsáveis pela precisão dos preços ou disponibilidade dos produtos.
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                4. Suporte
              </Text>
              <Text style={{
                color: '#E5E7EB',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12
              }}>
                Para dúvidas ou suporte, entre em contato conosco através dos canais oficiais da Nexus DevSystem.
              </Text>
            </View>

            <View style={{
              backgroundColor: '#374151',
              padding: 16,
              borderRadius: 12,
              marginBottom: 30
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text style={{
                  color: '#3B82F6',
                  fontSize: 16,
                  fontWeight: '600',
                  marginLeft: 8
                }}>
                  Desenvolvido por Nexus DevSystem
                </Text>
              </View>
              <Text style={{
                color: '#9CA3AF',
                fontSize: 14,
                lineHeight: 18
              }}>
                Versão 1.0.0 - Todos os direitos reservados
              </Text>
            </View>
          </ScrollView>

          {/* Accept Button */}
          <View style={{
            padding: 20,
            borderTopWidth: 1,
            borderTopColor: '#374151'
          }}>
            <TouchableOpacity
              onPress={onAccept}
              style={{
                backgroundColor: '#3B82F6',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center'
              }}
            >
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '700'
              }}>
                Aceitar e Continuar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}