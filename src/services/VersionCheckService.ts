import { Platform } from 'react-native';
import VersionCheck from 'react-native-version-check';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';

interface VersionInfo {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  storeUrl?: string;
}

// Função auxiliar para comparar versões (retorna: 1 se v1 > v2, -1 se v1 < v2, 0 se iguais)
function compareVersions(v1: string, v2: string): number {
  // Validar se as versões são válidas
  if (!v1 || !v2 || typeof v1 !== 'string' || typeof v2 !== 'string') {
    console.warn('⚠️ Versões inválidas para comparação:', v1, v2);
    return 0;
  }
  
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

export class VersionCheckService {
  private static instance: VersionCheckService;
  private currentVersion: string;

  private constructor() {
    this.currentVersion = Constants.expoConfig?.version || '1.0.0';
  }

  public static getInstance(): VersionCheckService {
    if (!VersionCheckService.instance) {
      VersionCheckService.instance = new VersionCheckService();
    }
    return VersionCheckService.instance;
  }

  public async checkForUpdates(): Promise<VersionInfo> {
    try {
      // Para Android, verificar na Play Store
      if (Platform.OS === 'android') {
        const latestVersion = await VersionCheck.getLatestVersion({ 
          provider: 'playStore',
          packageName: 'com.nexusdevsystem.looton' // O mesmo nome do package no app.json
        });

        const currentVersion = this.currentVersion;
        
        // Validar se latestVersion é válido
        if (!latestVersion || typeof latestVersion !== 'string') {
          console.log('⚠️ App não encontrado na Play Store ainda');
          return {
            currentVersion,
            latestVersion: currentVersion,
            updateAvailable: false,
            storeUrl: undefined
          };
        }
        
        const updateAvailable = compareVersions(latestVersion, currentVersion) > 0;

        let storeUrl;
        if (updateAvailable) {
          storeUrl = await VersionCheck.getStoreUrl({
            provider: 'playStore',
            packageName: 'com.nexusdevsystem.looton'
          });
        }

        return {
          currentVersion,
          latestVersion,
          updateAvailable,
          storeUrl
        };
      } 
      // Para iOS, verificar na App Store
      else if (Platform.OS === 'ios') {
        const latestVersion = await VersionCheck.getLatestVersion({ 
          provider: 'appStore',
          packageName: Constants.expoConfig?.ios?.bundleIdentifier
        });

        const currentVersion = this.currentVersion;
        
        // Validar se latestVersion é válido
        if (!latestVersion || typeof latestVersion !== 'string') {
          console.log('⚠️ App não encontrado na App Store ainda');
          return {
            currentVersion,
            latestVersion: currentVersion,
            updateAvailable: false,
            storeUrl: undefined
          };
        }
        
        const updateAvailable = compareVersions(latestVersion, currentVersion) > 0;

        let storeUrl;
        if (updateAvailable) {
          storeUrl = await VersionCheck.getStoreUrl({
            provider: 'appStore',
            packageName: Constants.expoConfig?.ios?.bundleIdentifier
          });
        }

        return {
          currentVersion,
          latestVersion,
          updateAvailable,
          storeUrl
        };
      }

      return {
        currentVersion: this.currentVersion,
        latestVersion: this.currentVersion,
        updateAvailable: false
      };
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      return {
        currentVersion: this.currentVersion,
        latestVersion: this.currentVersion,
        updateAvailable: false
      };
    }
  }

  public async checkForUpdatesAndShowAlert(): Promise<boolean> {
    const { updateAvailable, latestVersion, storeUrl } = await this.checkForUpdates();
    
    if (updateAvailable) {
      console.log(`Nova versão disponível: ${latestVersion}`);
      return true;
    }
    
    console.log('Nenhuma atualização disponível no momento.');
    return false;
  }

  public getCurrentVersion(): string {
    return this.currentVersion;
  }
}