import React from 'react';
import { View, Text, TouchableOpacity, Modal, Linking, Alert } from 'react-native';
import { tokens } from '../theme/tokens';

interface UpdateAlertModalProps {
  visible: boolean;
  currentVersion: string;
  latestVersion: string;
  storeUrl?: string;
  onClose: () => void;
}

export const UpdateAlertModal: React.FC<UpdateAlertModalProps> = ({
  visible,
  currentVersion,
  latestVersion,
  storeUrl,
  onClose
}) => {
  const handleUpdatePress = () => {
    if (storeUrl) {
      Linking.openURL(storeUrl);
    } else {
      Alert.alert('Erro', 'Não foi possível encontrar a URL da atualização.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0, 0, 0, 0.5)' 
      }}>
        <View style={{ 
          backgroundColor: tokens.colors.card,
          borderRadius: 16,
          padding: 20,
          width: '80%',
          maxWidth: 400,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 8
        }}>
          <Text style={{ 
            fontSize: 20, 
            fontWeight: 'bold', 
            color: tokens.colors.text,
            marginBottom: 10,
            textAlign: 'center'
          }}>
            Nova Atualização Disponível!
          </Text>
          
          <Text style={{ 
            fontSize: 16, 
            color: tokens.colors.text,
            marginBottom: 20,
            textAlign: 'center'
          }}>
            Sua versão: {currentVersion}
          </Text>
          
          <Text style={{ 
            fontSize: 16, 
            fontWeight: 'bold',
            color: '#10B981',
            marginBottom: 20,
            textAlign: 'center'
          }}>
            Nova versão: {latestVersion}
          </Text>
          
          <Text style={{ 
            fontSize: 14, 
            color: tokens.colors.text,
            marginBottom: 20,
            textAlign: 'center',
            lineHeight: 20
          }}>
            Baixe a nova versão para aproveitar as últimas funcionalidades e melhorias!
          </Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <TouchableOpacity
              onPress={onClose}
              style={{ 
                flex: 1, 
                padding: 12, 
                backgroundColor: tokens.colors.warning, // Usando a cor de warning
                borderRadius: 8,
                alignItems: 'center',
                marginRight: 8
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Depois</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleUpdatePress}
              style={{ 
                flex: 1, 
                padding: 12, 
                backgroundColor: tokens.colors.accent, // Usando a cor de destaque
                borderRadius: 8,
                alignItems: 'center',
                marginLeft: 8
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Atualizar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};