import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { Brute } from '../constants/theme';
import { CircleCheckBig } from 'lucide-react-native';
import { ScanSpinner } from '../components/Spinner';

export default function SubmittedScreen() {
  const { clearScannedItems, state } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => {
      clearScannedItems();
      router.replace('/scanner');
    }, 2000);
    return () => clearTimeout(timer);
  }, [clearScannedItems]);

  const isImportant = (state?.scannedItems?.length ?? 0) > 5;

  return (
    <View style={styles.container}>
      <CircleCheckBig size={80} color={Brute.success} strokeWidth={1.5} />
      <Text style={styles.title}>Submitted</Text>
      <Text style={styles.subtitle}>List sent successfully</Text>

      {isImportant && (
        <View style={styles.importantBadge}>
          <Text style={styles.importantText}>Marked as important</Text>
        </View>
      )}

      <View style={styles.spinnerRow}>
        <ScanSpinner size={16} color={Brute.muted} />
        <Text style={styles.redirect}>Redirecting to scanner...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brute.base,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Brute.text,
  },
  subtitle: {
    fontSize: 16,
    color: Brute.muted,
  },
  importantBadge: {
    marginTop: 8,
    borderWidth: Brute.borderW,
    borderColor: Brute.accent,
    borderRadius: Brute.radius,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Brute.surface,
  },
  importantText: {
    fontSize: 16,
    fontWeight: '600',
    color: Brute.accent,
  },
  spinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
  },
  redirect: {
    fontSize: 14,
    color: Brute.muted,
  },
});
