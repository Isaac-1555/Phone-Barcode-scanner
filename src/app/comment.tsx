import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../context/AppContext';

export default function CommentScreen() {
  const { barcode, index } = useLocalSearchParams<{ barcode: string; index: string }>();
  const [comment, setComment] = useState('');
  const { state, addScannedItem, updateItemComment } = useApp();

  const itemIndex = parseInt(index || '0', 10);

  useEffect(() => {
    if (!state) {
      router.replace('/login');
    }
  }, [state]);

  const handleContinue = () => {
    if (!state) return;

    if (itemIndex > 0 && state.scannedItems[itemIndex]) {
      updateItemComment(itemIndex, comment);
    } else {
      addScannedItem(barcode, comment);
    }
    
    router.replace('/scanner');
  };

  const handleAddComment = () => {
    if (!state) return;

    if (itemIndex > 0 && state.scannedItems[itemIndex]) {
      updateItemComment(itemIndex, comment);
    } else {
      addScannedItem(barcode, comment);
    }
    
    router.replace('/scanner');
  };

  if (!state) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Scanned Barcode</Text>
          <Text style={styles.barcode}>{barcode}</Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Add Comment (optional)</Text>
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="Enter comment..."
            placeholderTextColor="#666"
            multiline
            maxLength={250}
          />
          <Text style={styles.charCount}>{comment.length}/250</Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
          
          {comment.trim() ? (
            <TouchableOpacity style={styles.addButton} onPress={handleAddComment}>
              <Text style={styles.addText}>Add Comment</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.skipButton} onPress={handleContinue}>
              <Text style={styles.skipText}>Skip Comment</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 18,
    color: '#888',
    marginBottom: 12,
  },
  barcode: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  inputSection: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 8,
  },
  buttons: {
    gap: 12,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  continueText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  addText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  skipText: {
    color: '#888',
    fontSize: 18,
    fontWeight: '600',
  },
});