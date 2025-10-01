import AsyncStorage from '@react-native-async-storage/async-storage'
// simple UUIDv4 generator (no external dependency)
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Keys used by the app session (per spec)
const KEY_TOKEN = '@session/token'
const KEY_REFRESH = '@session/refresh'
const KEY_USER = '@session/user'
const KEY_DEVICE = '@session/deviceId'

export async function saveToken(token: string) {
  await AsyncStorage.setItem(KEY_TOKEN, token)
}

export async function loadToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEY_TOKEN)
}

export async function clearToken() {
  await AsyncStorage.removeItem(KEY_TOKEN)
}

export async function saveRefresh(refresh: string) {
  await AsyncStorage.setItem(KEY_REFRESH, refresh)
}

export async function loadRefresh(): Promise<string | null> {
  return AsyncStorage.getItem(KEY_REFRESH)
}

export async function clearRefresh() {
  await AsyncStorage.removeItem(KEY_REFRESH)
}

export async function saveUser(user: string) {
  // user can be the user id or serialized JSON depending on usage
  await AsyncStorage.setItem(KEY_USER, user)
}

export async function loadUser(): Promise<string | null> {
  return AsyncStorage.getItem(KEY_USER)
}

export async function clearUser() {
  await AsyncStorage.removeItem(KEY_USER)
}

export async function saveDeviceId(deviceId: string) {
  await AsyncStorage.setItem(KEY_DEVICE, deviceId)
}

export async function loadDeviceId(): Promise<string | null> {
  return AsyncStorage.getItem(KEY_DEVICE)
}

export async function ensureDeviceId(): Promise<string> {
  let id = await loadDeviceId()
  if (!id) {
    id = uuidv4()
    await saveDeviceId(id)
  }
  return id as string
}

export async function clearAll() {
  await Promise.all([
    AsyncStorage.removeItem(KEY_TOKEN),
    AsyncStorage.removeItem(KEY_REFRESH),
    AsyncStorage.removeItem(KEY_USER),
    AsyncStorage.removeItem(KEY_DEVICE)
  ])
}
