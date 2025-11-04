// AuthService removido - autenticação não é mais necessária
// Este arquivo é mantido apenas para evitar erros de importação
// As funções retornam valores padrão

interface AuthServiceType {
  isAuthenticated: () => Promise<boolean>;
  loadToken: () => Promise<string | null>;
  ensureDeviceId: () => Promise<string>;
}

export const isAuthenticated = async (): Promise<boolean> => {
  // Sem autenticação - sempre retorna falso
  return false;
};

export const loadToken = async (): Promise<string | null> => {
  // Sem tokens de autenticação - sempre retorna null
  return null;
};

export const ensureDeviceId = async (): Promise<string> => {
  // Gera um ID de dispositivo anônimo
  return `anon_device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const AuthService: AuthServiceType = {
  isAuthenticated,
  loadToken,
  ensureDeviceId
};

export default AuthService;