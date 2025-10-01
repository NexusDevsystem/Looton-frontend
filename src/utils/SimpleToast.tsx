import { ToastAndroid, Platform, Alert } from 'react-native'

export function showToast(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT)
  } else {
    // Simple fallback for iOS / web during dev
    Alert.alert(message)
  }
}
