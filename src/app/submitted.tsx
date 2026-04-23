import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';

export default function SubmittedScreen() {
  const { state, clearScannedItems } = useApp();

  useEffect(() => {
    setTimeout(() => {
      clearScannedItems();
      router.replace('/scanner');
    }, 2000);
  }, []);

  if (!state) {
    router.replace('/login');
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.checkmark}>✓</Text>
      <Text style={styles.title}>Submitted Successfully</Text>
      <Text style={styles.subtitle}>Redirecting to scanner...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  checkmark: {
    fontSize: 80,
    color: '#34C759',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
});