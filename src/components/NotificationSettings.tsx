// Exemplo de uso em uma tela de Configurações
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { 
  hasAskedPushPermissionBefore, 
  getCurrentPushToken, 
  forcePushPermissionRequest, 
  resetPushAskFlag 
} from '../notifications';

const PROJECT_ID = '41306841-8939-4568-a1a1-af93af0428d1';

export function NotificationSettings() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [hasAskedBefore, setHasAskedBefore] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    checkCurrentStatus();
  }, []);

  const checkCurrentStatus = async () => {
    try {
      // Verificar se já perguntamos antes
      const asked = await hasAskedPushPermissionBefore();
      setHasAskedBefore(asked);

      // Verificar permissão atual
      const perm = await Notifications.getPermissionsAsync();
      setHasPermission(perm.status === 'granted');

      // Obter token se tiver permissão
      if (perm.status === 'granted') {
        const currentToken = await getCurrentPushToken(PROJECT_ID);
        setToken(currentToken);
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  const handleActivateNotifications = async () => {
    try {
      const newToken = await forcePushPermissionRequest(PROJECT_ID);
      if (newToken) {
        Alert.alert('Sucesso!', 'Notificações ativadas com sucesso!');
        setToken(newToken);
        setHasPermission(true);
        // TODO: Enviar token para o backend
      } else {
        Alert.alert(
          'Permissão negada', 
          'Para ativar as notificações, você precisa ir nas configurações do sistema.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configurações', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível ativar as notificações.');
    }
  };

  const handleResetAndTryAgain = async () => {
    Alert.alert(
      'Resetar configuração',
      'Isso fará o app perguntar sobre notificações novamente na próxima inicialização.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Resetar', 
          onPress: async () => {
            await resetPushAskFlag();
            setHasAskedBefore(false);
            Alert.alert('Feito!', 'Reinicie o app para ser perguntado novamente.');
          }
        }
      ]
    );
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        Configurações de Notificação
      </Text>

      <View style={{ marginBottom: 15 }}>
        <Text>Status atual: {hasPermission ? '✅ Ativado' : '❌ Desativado'}</Text>
        <Text>Já perguntado antes: {hasAskedBefore ? 'Sim' : 'Não'}</Text>
        {token && <Text>Token: {token.substring(0, 20)}...</Text>}
      </View>

      {!hasPermission && (
        <TouchableOpacity
          onPress={handleActivateNotifications}
          style={{
            backgroundColor: '#3B82F6',
            padding: 15,
            borderRadius: 8,
            marginBottom: 10
          }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '500' }}>
            Ativar Notificações
          </Text>
        </TouchableOpacity>
      )}

      {hasAskedBefore && (
        <TouchableOpacity
          onPress={handleResetAndTryAgain}
          style={{
            backgroundColor: '#6B7280',
            padding: 15,
            borderRadius: 8
          }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '500' }}>
            Resetar e Perguntar Novamente
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}