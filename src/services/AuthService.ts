import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@looton_device_id';
const TOKEN_KEY = '@looton_auth_token';

// Individual functions for direct import/export
export const login = async (credentials: { email: string; password: string }) => {
  // Mock login implementation
  console.log('Login attempt with:', credentials);
  const token = `mock-jwt-token-${Date.now()}`;
  await AsyncStorage.setItem(TOKEN_KEY, token);
  return {
    success: true,
    user: {
      id: 'mock-user-id',
      email: credentials.email,
      name: 'Mock User'
    },
    token: token
  };
};

export const logout = async () => {
  // Mock logout implementation
  console.log('User logged out');
  await AsyncStorage.removeItem(TOKEN_KEY);
  return { success: true };
};

export const getCurrentUser = () => {
  // Mock current user
  return {
    id: 'mock-user-id',
    email: 'user@example.com',
    name: 'Mock User'
  };
};

export const isAuthenticated = async () => {
  const token = await loadToken();
  return !!token; // Return true if token exists
};

export const loadToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error loading token:', error);
    return null;
  }
};

export const ensureDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      // Generate a simple random device ID
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('Error ensuring device ID:', error);
    // Fallback: generate a temporary ID
    return `temp_device_${Date.now()}`;
  }
};

// Define the interface for AuthService
interface AuthServiceType {
  login: (credentials: { email: string; password: string }) => Promise<any>;
  logout: () => Promise<any>;
  getCurrentUser: () => any;
  isAuthenticated: () => Promise<boolean>;
  loadToken: () => Promise<string | null>;
  ensureDeviceId: () => Promise<string>;
}

// Create the service object
export const AuthService: AuthServiceType = {
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  loadToken,
  ensureDeviceId
};

export default AuthService;