import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { getNextListNumber, submitList, markCategoryImportant } from '../services/supabase';

export default function ReviewScreen() {
  const [loading, setLoading] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const { state, clearScannedItems, removeScannedItem } = useApp();

  useEffect(() => {
    if (!state) {
      router.replace('/login');
      return;
    }
    loadCategoryName();
  }, [state]);

  const loadCategoryName = async () => {
    if (!state) return;
    try {
      const nextNum = await getNextListNumber(state.storeId, state.prefix);
      setCategoryName(nextNum);
    } catch (error) {
      setCategoryName(`${state.prefix}-01`);
    }
  };

  const handleSubmit = async () => {
    if (!state || state.scannedItems.length === 0) {
      Alert.alert('Error', 'No items to submit');
      return;
    }

    setLoading(true);
    try {
      await submitList(state.storeId, categoryName, state.scannedItems);
      if (isImportant) {
        await markCategoryImportant(state.storeId, categoryName, true);
      }
      router.replace({ pathname: '/submitted', params: { isImportant: isImportant ? 'true' : 'false' } });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (index: number) => {
    Alert.alert('Delete Item', 'Remove this barcode?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeScannedItem(index),
      },
    ]);
  };

  if (!state) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.listInfo}>
        <Text style={styles.listName}>{categoryName}</Text>
        <Text style={styles.itemCount}>{state.scannedItems.length} items</Text>
      </View>

      <TouchableOpacity
        style={[styles.importantToggle, isImportant && styles.importantToggleActive]}
        onPress={() => setIsImportant(!isImportant)}
      >
        <Text style={[styles.importantStar, isImportant && styles.importantStarActive]}>
          {isImportant ? '✦' : '☆'}
        </Text>
        <Text style={[styles.importantLabel, isImportant && styles.importantLabelActive]}>
          {isImportant ? 'Marked as Important' : 'Mark as Important'}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.list}>
        {state.scannedItems.map((item, idx) => (
          <View key={idx} style={styles.item}>
            <View style={styles.itemInfo}>
              <Text style={styles.barcode}>{item.barcode}</Text>
              {item.comment ? (
                <Text style={styles.comment}>{item.comment}</Text>
              ) : null}
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => router.push({ pathname: '/comment', params: { barcode: item.barcode, index: idx.toString(), isEdit: 'true' } })}
              >
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(idx)}
              >
                <Text style={styles.deleteText}>X</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitText}>
          {loading ? 'Submitting...' : `Submit ${categoryName}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  backText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  listInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  listName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  itemCount: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  itemInfo: {
    flex: 1,
  },
  barcode: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  comment: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  editButton: {
    padding: 8,
  },
  editText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  importantToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    backgroundColor: '#111113',
  },
  importantToggleActive: {
    borderColor: '#f87171',
    backgroundColor: '#1f1414',
  },
  importantStar: {
    fontSize: 20,
    color: '#888',
    marginRight: 10,
  },
  importantStarActive: {
    color: '#f87171',
  },
  importantLabel: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500',
  },
  importantLabelActive: {
    color: '#f87171',
  },
});