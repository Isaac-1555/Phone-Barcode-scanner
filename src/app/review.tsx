import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { getNextListNumber, submitList, markCategoryImportant } from '../services/supabase';
import { Brute } from '../constants/theme';
import { ArrowLeft, Pencil, Trash2, SendHorizontal, Star } from 'lucide-react-native';
import { ScanSpinner } from '../components/Spinner';

export default function ReviewScreen() {
  const { state, removeScannedItem } = useApp();
  const [categoryName, setCategoryName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isImportant, setIsImportant] = useState(false);

  const loadCategoryName = useCallback(async () => {
    if (!state?.storeId || !state?.prefix) return;
    try {
      const name = await getNextListNumber(state.storeId, state.prefix);
      setCategoryName(name);
    } catch {
      setCategoryName(`${state.prefix}-01`);
    }
  }, [state?.storeId, state?.prefix]);

  useEffect(() => {
    loadCategoryName();
  }, [loadCategoryName]);

  if (!state) {
    router.replace('/login');
    return null;
  }

  const s = state;
  const items = s.scannedItems;

  async function handleSubmit() {
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      await submitList(s.storeId, categoryName, items);
      if (isImportant) {
        await markCategoryImportant(s.storeId, categoryName, true);
      }
      router.replace({ pathname: '/submitted', params: { important: isImportant ? 'true' : 'false' } });
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Submit failed');
      setSubmitting(false);
    }
  }

  function handleDelete(index: number) {
    Alert.alert('Delete', 'Remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeScannedItem(index) },
    ]);
  }

  function handleEdit(index: number, barcode: string) {
    const item = items[index];
    router.push({
      pathname: '/comment',
      params: { barcode, index: index.toString(), isEdit: 'true', existingComment: item.comment },
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={24} color={Brute.accent} strokeWidth={2.5} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Review</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.listInfo}>
        <Text style={styles.listName}>{categoryName || 'Loading...'}</Text>
        <Text style={styles.itemCount}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
      </View>

      <TouchableOpacity
        style={[styles.importantToggle, isImportant && styles.importantActive]}
        onPress={() => setIsImportant(!isImportant)}
        activeOpacity={0.8}
      >
        <Star
          size={18}
          color={isImportant ? Brute.accent : Brute.muted}
          strokeWidth={2.5}
          fill={isImportant ? Brute.accent : 'none'}
        />
        <Text style={[styles.importantText, isImportant && styles.importantTextActive]}>
          {isImportant ? 'Marked important' : 'Mark as important'}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {items.map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.barcode}>{item.barcode}</Text>
              {item.comment ? (
                <Text style={styles.comment}>{item.comment}</Text>
              ) : null}
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity
                onPress={() => handleEdit(index, item.barcode)}
                style={styles.actionBtn}
                activeOpacity={0.7}
              >
                <Pencil size={18} color={Brute.muted} strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(index)}
                style={styles.actionBtn}
                activeOpacity={0.7}
              >
                <Trash2 size={18} color={Brute.danger} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitting || items.length === 0}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ScanSpinner size={20} color={Brute.text} />
          ) : (
            <>
              <SendHorizontal size={20} color={Brute.text} strokeWidth={2.5} />
              <Text style={styles.submitText}>Submit List</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brute.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: Brute.borderW,
    borderBottomColor: Brute.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 80,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: Brute.accent,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Brute.text,
  },
  listInfo: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 4,
  },
  listName: {
    fontSize: 24,
    fontWeight: '700',
    color: Brute.text,
  },
  itemCount: {
    fontSize: 14,
    color: Brute.muted,
    marginTop: 2,
  },
  importantToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: Brute.borderW,
    borderColor: Brute.border,
    borderRadius: Brute.radius,
    backgroundColor: Brute.surface,
  },
  importantActive: {
    borderColor: Brute.accent,
    backgroundColor: '#2d1a10',
  },
  importantText: {
    fontSize: 14,
    fontWeight: '600',
    color: Brute.muted,
  },
  importantTextActive: {
    color: Brute.accent,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 24,
    paddingTop: 4,
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brute.surface,
    borderWidth: Brute.borderW,
    borderColor: Brute.border,
    borderRadius: Brute.radius,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 4,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  barcode: {
    fontSize: 16,
    fontWeight: '600',
    color: Brute.text,
    fontFamily: 'monospace',
  },
  comment: {
    fontSize: 14,
    color: Brute.muted,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 12,
  },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: Brute.borderW,
    borderColor: Brute.border,
    borderRadius: Brute.radius,
    backgroundColor: Brute.base,
  },
  bottom: {
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: Brute.borderW,
    borderTopColor: Brute.border,
  },
  submitButton: {
    backgroundColor: Brute.accent,
    borderWidth: Brute.borderW,
    borderColor: Brute.accent,
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
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 18,
    fontWeight: '700',
    color: Brute.text,
  },
});
