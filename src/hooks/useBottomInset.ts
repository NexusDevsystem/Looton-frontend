import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

/**
 * Hook personalizado para detectar o tipo de navegação do Android
 * e ajustar o padding inferior da bottom navigation bar
 * 
 * Comportamento:
 * - Navegação por GESTOS: inset.bottom é pequeno (0-20px) → adiciona paddingBottom menor
 * - Navegação por BOTÕES: inset.bottom é maior (>20px) → adiciona paddingBottom maior
 * - iOS: sempre usa safe area padrão
 */
export const useBottomInset = () => {
  const insets = useSafeAreaInsets();

  if (Platform.OS === 'ios') {
    // No iOS, sempre usar o safe area padrão
    return {
      paddingBottom: insets.bottom || 0,
      isGestureNavigation: false,
      bottomInset: insets.bottom,
    };
  }

  // Android: detectar tipo de navegação baseado no tamanho do inset
  const isGestureNavigation = insets.bottom <= 20;

  // Ajuste do padding baseado no tipo de navegação
  const paddingBottom = isGestureNavigation 
    ? 8  // Navegação por gestos: padding mínimo
    : Math.max(insets.bottom, 16); // Navegação por botões: usar safe area + padding mínimo

  return {
    paddingBottom,
    isGestureNavigation,
    bottomInset: insets.bottom,
  };
};
