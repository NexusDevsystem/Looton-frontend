// components/SubscriptionModal.tsx
/**
 * Modal de Assinatura Premium
 * Abre a tela NATIVA do Google Play Billing dentro do app
 */
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SubscriptionService } from '../services/SubscriptionService';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  visible,
  onClose,
}) => {
  const [loading, setLoading] = React.useState(false);

  /**
   * Abre a tela NATIVA do Google Play Billing
   * Esta é a tela que você viu na imagem!
   */
  const handleSubscribe = async () => {
    try {
      setLoading(true);
      
      // Isso abre a tela NATIVA do Google Play DENTRO do app
      // Igual à imagem que você mostrou!
      await SubscriptionService.openSubscriptionScreen();
      
      // Após o usuário assinar (ou cancelar), fechamos o modal
      onClose();
    } catch (error) {
      console.error('Erro ao abrir assinatura:', error);
      alert('Erro ao abrir tela de assinatura. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: 'eye-off-outline' as const,
      title: 'Sem Anúncios',
      description: 'Navegue sem interrupções de propagandas',
    },
    {
      icon: 'list-outline' as const,
      title: 'Vigiar Jogos Ilimitados',
      description: 'Adicione quantos jogos quiser à sua lista de vigilância',
    },
    {
      icon: 'notifications-outline' as const,
      title: 'Notificações Prioritárias',
      description: 'Seja o primeiro a saber sobre ofertas incríveis',
    },
    {
      icon: 'rocket-outline' as const,
      title: 'Acesso Antecipado',
      description: 'Experimente novos recursos antes de todos',
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Ionicons name="trophy" size={60} color="#FFD700" />
              <Text style={styles.title}>Looton Pro</Text>
              <Text style={styles.subtitle}>
                Aproveite uma experiência sem anúncios atualizando para a versão Pro
              </Text>
            </View>
          </View>

          {/* Benefits List */}
          <ScrollView style={styles.benefitsContainer}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <View style={styles.benefitIconContainer}>
                  <Ionicons name={benefit.icon} size={24} color="#4A90E2" />
                </View>
                <View style={styles.benefitTextContainer}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitDescription}>{benefit.description}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Subscribe Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.subscribeButton, loading && styles.subscribeButtonDisabled]}
              onPress={handleSubscribe}
              disabled={loading}
            >
              <Text style={styles.subscribeButtonText}>
                {loading ? 'Abrindo...' : 'Obtenha o Pro por R$ 3,00'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
            
            <Text style={styles.disclaimer}>
              A assinatura será gerenciada pela Google Play.{'\n'}
              Cancele a qualquer momento nas configurações da sua conta.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#2a2a2a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  benefitsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  benefitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 13,
    color: '#aaa',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  subscribeButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  disclaimer: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    lineHeight: 16,
  },
});
