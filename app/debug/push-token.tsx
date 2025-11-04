import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Clipboard } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ensureDeviceId } from '../../src/services/AuthService';

/**
 * Componente de Debug para Push Notifications
 * Use esta tela para obter seu push token e testar notificações
 */
export default function PushTokenDebug() {
  const [pushToken, setPushToken] = useState<string>('');
  const [deviceId, setDeviceId] = useState<string>('');
  const [permissionStatus, setPermissionStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInfo();
  }, []);

  const loadInfo = async () => {
    try {
      // Obter permissão
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);

      // Obter push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id' // Substitua pelo seu project ID
      });
      setPushToken(token.data);

      // Obter device ID
      const devId = await ensureDeviceId();
      setDeviceId(devId);

    } catch (error) {
      console.error('Erro ao carregar informações:', error);
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('✅ Copiado!', `${label} copiado para a área de transferência`);
  };

  const requestPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status);
    
    if (status === 'granted') {
      Alert.alert('✅ Sucesso!', 'Permissão de notificação concedida');
      loadInfo();
    } else {
      Alert.alert('❌ Negado', 'Permissão de notificação não foi concedida');
    }
  };

  const sendTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Notificação Local de Teste',
          body: 'Esta é uma notificação local (não do backend)',
          data: { type: 'test' },
        },
        trigger: null, // Enviar imediatamente
      });
      
      Alert.alert('✅ Enviada!', 'Notificação local deve aparecer agora');
    } catch (error: any) {
      Alert.alert('❌ Erro', error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🔔 Push Notifications Debug</Text>
        
        {/* Status da Permissão */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissão</Text>
          <View style={[
            styles.statusBadge,
            permissionStatus === 'granted' ? styles.statusGranted : styles.statusDenied
          ]}>
            <Text style={styles.statusText}>
              {permissionStatus === 'granted' ? '✅ Concedida' : '❌ Negada/Pendente'}
            </Text>
          </View>
          
          {permissionStatus !== 'granted' && (
            <TouchableOpacity style={styles.button} onPress={requestPermission}>
              <Text style={styles.buttonText}>Solicitar Permissão</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Push Token */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Token</Text>
          <Text style={styles.label}>Use este token no script de teste:</Text>
          <TouchableOpacity 
            style={styles.tokenBox}
            onPress={() => copyToClipboard(pushToken, 'Push Token')}
          >
            <Text style={styles.tokenText} selectable>
              {pushToken || 'Nenhum token disponível'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.hint}>Toque para copiar</Text>
        </View>

        {/* Device ID */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device ID</Text>
          <TouchableOpacity 
            style={styles.tokenBox}
            onPress={() => copyToClipboard(deviceId, 'Device ID')}
          >
            <Text style={styles.tokenText} selectable>
              {deviceId || 'Nenhum ID disponível'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.hint}>Toque para copiar</Text>
        </View>

        {/* Instruções */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Como Testar</Text>
          <Text style={styles.instruction}>
            1. Copie o Push Token acima{'\n'}
            2. No seu computador, execute:{'\n'}
            {'\n'}
            <Text style={styles.code}>
              cd c:\Looton\looton\backend{'\n'}
              npx tsx test-push.js [SEU_TOKEN]
            </Text>
            {'\n\n'}
            3. As notificações chegarão mesmo com o app fechado!
          </Text>
        </View>

        {/* Botão de Teste Local */}
        <TouchableOpacity 
          style={[styles.button, styles.buttonTest]} 
          onPress={sendTestNotification}
        >
          <Text style={styles.buttonText}>🧪 Enviar Notificação Local (Teste)</Text>
        </TouchableOpacity>

        {/* Info Adicional */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Informações</Text>
          <Text style={styles.info}>
            • Notificações locais só funcionam com app aberto{'\n'}
            • Notificações remotas (do backend) funcionam sempre{'\n'}
            • O backend envia notificações a cada 6 horas{'\n'}
            • Daily Offers: 12h e 18h{'\n'}
            • Watched Games: 00h, 06h, 12h, 18h
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  loading: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusGranted: {
    backgroundColor: '#d4edda',
  },
  statusDenied: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  tokenBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 8,
  },
  tokenText: {
    fontSize: 12,
    color: '#495057',
    fontFamily: 'monospace',
  },
  hint: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  instruction: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 22,
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    color: '#d63384',
  },
  info: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonTest: {
    backgroundColor: '#28a745',
    marginTop: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
