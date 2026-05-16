import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { Brute } from '../constants/theme';
import { ChevronRight, Store } from 'lucide-react-native';

const departments = [
  { name: 'Frontend', prefix: 'FE' },
  { name: 'Produce', prefix: 'PR' },
  { name: 'Bakery', prefix: 'BA' },
  { name: 'Deli', prefix: 'DE' },
  { name: 'Meat', prefix: 'ME' },
];

export default function DepartmentScreen() {
  const { state, setDepartment } = useApp();

  if (!state) {
    router.replace('/login');
    return null;
  }

  function handleSelect(name: string, prefix: string) {
    setDepartment(name, prefix);
    router.replace('/scanner');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Store size={28} color={Brute.accent} strokeWidth={2} />
        <Text style={styles.title}>Select Department</Text>
        <Text style={styles.subtitle}>Store #{state.storeNumber}</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {departments.map((dept) => (
          <TouchableOpacity
            key={dept.prefix}
            style={styles.card}
            onPress={() => handleSelect(dept.name, dept.prefix)}
            activeOpacity={0.85}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.cardText}>{dept.name}</Text>
              <View style={styles.badge}>
                <Text style={styles.cardPrefix}>{dept.prefix}</Text>
              </View>
            </View>
            <ChevronRight size={24} color={Brute.muted} strokeWidth={2.5} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brute.base,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: Brute.borderW,
    borderBottomColor: Brute.border,
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
  list: {
    flex: 1,
  },
  listContent: {
    padding: 24,
    gap: 12,
  },
  card: {
    backgroundColor: Brute.surface,
    borderWidth: Brute.borderW,
    borderColor: Brute.border,
    borderRadius: Brute.radius,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 6,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardText: {
    fontSize: 20,
    fontWeight: '600',
    color: Brute.text,
  },
  badge: {
    backgroundColor: Brute.base,
    borderWidth: Brute.borderW,
    borderColor: Brute.accent,
    borderRadius: Brute.radius,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cardPrefix: {
    fontSize: 14,
    fontWeight: '700',
    color: Brute.accent,
  },
});
