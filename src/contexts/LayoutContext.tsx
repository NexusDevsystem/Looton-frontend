import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LayoutType = 'column' | 'grid';

interface LayoutContextType {
  layoutType: LayoutType;
  setLayoutType: (layout: LayoutType) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [layoutType, setLayoutType] = useState<LayoutType>('column');

  // Carregar preferência salva ao inicializar
  React.useEffect(() => {
    const loadLayoutPreference = async () => {
      try {
        const savedLayout = await AsyncStorage.getItem('@layout_preference');
        if (savedLayout === 'grid' || savedLayout === 'column') {
          setLayoutType(savedLayout);
        }
      } catch (error) {
        console.error('Erro ao carregar preferência de layout:', error);
      }
    };

    loadLayoutPreference();
  }, []);

  // Salvar preferência quando mudar
  React.useEffect(() => {
    const saveLayoutPreference = async () => {
      try {
        await AsyncStorage.setItem('@layout_preference', layoutType);
      } catch (error) {
        console.error('Erro ao salvar preferência de layout:', error);
      }
    };

    saveLayoutPreference();
  }, [layoutType]);

  return (
    <LayoutContext.Provider value={{ layoutType, setLayoutType }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};