import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../context/AppContext';
import { Brute } from '../constants/theme';
import { X, ArrowRight, SkipForward } from 'lucide-react-native';

const MAX_COMMENT = 250;

export default function CommentScreen() {
  const { barcode, index, isEdit } = useLocalSearchParams<{
    barcode: string;
    index: string;
    isEdit?: string;
  }>();
  const { addScannedItem, removeScannedItem, updateItemComment, state } = useApp();
  const [comment, setComment] = useState('');

  function handleCancel() {
    if (isEdit === 'true' && barcode && index !== undefined) {
      router.back();
    } else if (barcode) {
      removeScannedItem(Number(index));
      router.back();
    } else {
      router.back();
    }
  }

  function handleContinue() {
    if (!barcode) return;

    if (isEdit === 'true') {
      updateItemComment(Number(index), comment);
      router.back();
    } else {
      addScannedItem(barcode, comment);
      router.replace('/scanner');
    }
  }

  const isSkip = !comment.trim();
  const itemCount = state?.scannedItems.length ?? 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn} activeOpacity={0.7}>
            <X size={24} color={Brute.muted} strokeWidth={3} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Comment</Text>
          <View style={styles.cancelBtn} />
        </View>

        <Text style={styles.label}>Scanned Barcode</Text>
        <Text style={styles.barcode}>{barcode ?? '---'}</Text>

        <Text style={styles.label}>Comment (optional)</Text>
        <TextInput
          style={styles.input}
          value={comment}
          onChangeText={setComment}
          placeholder="Type a note for this item..."
          placeholderTextColor={Brute.muted}
          multiline
          maxLength={MAX_COMMENT}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{comment.length}/{MAX_COMMENT}</Text>

        <TouchableOpacity
          style={[styles.button, isSkip ? styles.skipButton : styles.continueButton]}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          {isSkip ? (
            <>
              <SkipForward size={20} color={Brute.text} strokeWidth={2.5} />
              <Text style={styles.buttonText}>Skip Comment</Text>
            </>
          ) : (
            <>
              <ArrowRight size={20} color={Brute.text} strokeWidth={2.5} />
              <Text style={styles.buttonText}>Continue</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.count}>Items scanned: {itemCount}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brute.base,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  cancelBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Brute.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Brute.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  barcode: {
    fontSize: 28,
    fontWeight: '700',
    color: Brute.text,
    letterSpacing: 2,
    marginBottom: 32,
  },
  input: {
    backgroundColor: Brute.surface,
    borderWidth: Brute.borderW,
    borderColor: Brute.border,
    borderRadius: Brute.radius,
    padding: 16,
    fontSize: 16,
    color: Brute.text,
    minHeight: 120,
    fontFamily: Platform.OS === 'ios' ? 'system-ui' : 'normal',
  },
  charCount: {
    fontSize: 12,
    color: Brute.muted,
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 24,
  },
  button: {
    borderWidth: Brute.borderW,
    borderRadius: Brute.radius,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 6,
  },
  skipButton: {
    backgroundColor: Brute.surface,
    borderColor: Brute.border,
  },
  continueButton: {
    backgroundColor: Brute.accent,
    borderColor: Brute.accent,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Brute.text,
  },
  count: {
    fontSize: 14,
    color: Brute.muted,
    textAlign: 'center',
    marginTop: 16,
  },
});
