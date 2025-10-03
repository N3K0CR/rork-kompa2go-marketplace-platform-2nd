import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '@/context-package/design-system';

export default function CommuteLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary[500],
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitle: 'Atrás',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Kommute',
          headerShown: true
        }} 
      />
      <Stack.Screen 
        name="search" 
        options={{ 
          title: 'Buscar Viaje',
          headerShown: true
        }} 
      />
      <Stack.Screen 
        name="driver" 
        options={{ 
          title: 'Modo Conductor',
          headerShown: true
        }} 
      />
      <Stack.Screen 
        name="trip/[tripId]" 
        options={{ 
          title: 'Detalles del Viaje',
          headerShown: true
        }} 
      />
    </Stack>
  );
}