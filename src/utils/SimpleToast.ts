import { Alert } from 'react-native';

export const showToast = (message: string) => {
  Alert.alert('Notificação', message, [{ text: 'OK' }]);
};