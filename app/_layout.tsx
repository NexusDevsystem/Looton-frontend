import React from 'react';
import { Stack } from 'expo-router';
import { LayoutProvider } from '../src/contexts/LayoutContext';

export default function RootLayout() {
  return (
    <LayoutProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ title: 'Buscar Jogos' }} />
        <Stack.Screen name="deals" options={{ title: 'Ofertas' }} />
        <Stack.Screen name="favorites" options={{ title: 'Favoritos' }} />
        <Stack.Screen name="alerts" options={{ title: 'Alertas' }} />
        <Stack.Screen name="hardware" options={{ title: 'Hardware' }} />
        <Stack.Screen name="[id]" options={{ title: 'Detalhes' }} />
      </Stack>
    </LayoutProvider>
  );
}