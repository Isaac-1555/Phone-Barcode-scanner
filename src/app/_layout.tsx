import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '../context/AppContext';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1a1a1a' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="department" />
        <Stack.Screen name="scanner" />
        <Stack.Screen name="comment" />
        <Stack.Screen name="review" />
        <Stack.Screen name="submitted" />
      </Stack>
    </AppProvider>
  );
}