import * as Notifications from 'expo-notifications'
import { api, API_URL } from '../api/client'

export async function registerPush(email: string) {
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') {
    throw new Error('Push notification permission not granted')
  }
  const tokenData = await Notifications.getExpoPushTokenAsync()
  const token = tokenData.data
  
  if (!token) {
    throw new Error('Could not obtain push token')
  }
  
  // Register the token with the backend
  await api('/users', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ email, pushToken: token }) 
  })
  
  return token
}
