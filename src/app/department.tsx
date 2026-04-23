import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';

const departments = [
  { name: 'Frontend', prefix: 'FE' },
  { name: 'Produce', prefix: 'PR' },
  { name: 'Bakery', prefix: 'BA' },
  { name: 'Deli', prefix: 'DE' },
  { name: 'Meat', prefix: 'ME' },
];

export default function DepartmentScreen() {
  const { state, setDepartment } = useApp();

  const handleSelect = (name: string, prefix: string) => {
    setDepartment(name, prefix);
    router.replace('/scanner');
  };

  if (!state) {
    router.replace('/login');
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Department</Text>
        <Text style={styles.subtitle}>Store: {state.storeNumber}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {departments.map((dept) => (
          <TouchableOpacity
            key={dept.prefix}
            style={styles.card}
            onPress={() => handleSelect(dept.name, dept.prefix)}
          >
            <Text style={styles.cardText}>{dept.name}</Text>
            <Text style={styles.cardPrefix}>{dept.prefix}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  list: {
    padding: 24,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '500',
  },
  cardPrefix: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
});