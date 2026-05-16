import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { login as loginApi } from '../services/supabase';
import { Brute } from '../constants/theme';
import { ScanBarcode, LogIn } from 'lucide-react-native';
import { ScanSpinner } from '../components/Spinner';

export default function LoginScreen() {
  const [storeNumber, setStoreNumber] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { state, loading, login } = useApp();

  useEffect(() => {
    if (!loading && state) {
      router.replace(state.department ? '/scanner' : '/department');
    }
  }, [loading, state]);

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ScanSpinner size={24} color={Brute.muted} />
      </View>
    );
  }

  if (state) return null;

  async function handleLogin() {
    if (!storeNumber.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter store number and password');
      return;
    }
    setSubmitting(true);
    try {
      const result = await loginApi(storeNumber.trim(), password);
      await login(storeNumber.trim(), result.storeId);
      router.replace('/department');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <ScanBarcode size={48} color={Brute.accent} strokeWidth={2.5} />
          <Text style={styles.title}>Phone Scanner</Text>
          <Text style={styles.subtitle}>Sign in to your store</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Store Number</Text>
          <TextInput
            style={styles.input}
            value={storeNumber}
            onChangeText={setStoreNumber}
            placeholder="e.g. Store 12345"
            placeholderTextColor={Brute.muted}
            keyboardType="default"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor={Brute.muted}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ScanSpinner size={20} color={Brute.text} />
            ) : (
              <>
                <LogIn size={20} color={Brute.text} strokeWidth={2.5} />
                <Text style={styles.buttonText}>Sign In</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brute.base,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Brute.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Brute.muted,
  },
  form: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Brute.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: Brute.surface,
    borderWidth: Brute.borderW,
    borderColor: Brute.border,
    borderRadius: Brute.radius,
    padding: 16,
    fontSize: 18,
    color: Brute.text,
    marginBottom: 16,
  },
  button: {
    backgroundColor: Brute.accent,
    borderWidth: Brute.borderW,
    borderColor: Brute.accent,
    borderRadius: Brute.radius,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Brute.text,
  },
});
