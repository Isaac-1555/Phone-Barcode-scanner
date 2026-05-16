import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../context/AppContext';

export default function SubmittedScreen() {
  const { isImportant } = useLocalSearchParams<{ isImportant?: string }>();
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
      {isImportant === 'true' && (
        <Text style={styles.importantBadge}>✦ Marked as important</Text>
      )}
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
  importantBadge: {
    fontSize: 18,
    color: '#f87171',
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 4,
  },
});