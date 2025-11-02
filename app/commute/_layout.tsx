import { Stack } from 'expo-router';
import React from 'react';

export default function CommuteLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ title: 'Buscar Destino' }} />
    </Stack>
  );
}
