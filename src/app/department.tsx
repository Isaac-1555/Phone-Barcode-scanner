import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useApp } from '../context/AppContext';
import { Brute } from '../constants/theme';
import { getCategories, getCategoryBarcodes, type CategoryInfo, type ScannedItem } from '../services/supabase';
import {
  ChevronRight,
  Plus,
  Store,
  ScanBarcode,
  X,
} from 'lucide-react-native';

const UNOPENED_KEY = 'opened_categories';

const departments = [
  { name: 'Frontend', prefix: 'FE' },
  { name: 'Produce', prefix: 'PR' },
  { name: 'Bakery', prefix: 'BA' },
  { name: 'Deli', prefix: 'DE' },
  { name: 'Meat', prefix: 'ME' },
];

function GlowCard({ children, glowColor, style }: {
  children: React.ReactNode;
  glowColor: string | null;
  style?: any;
}) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!glowColor) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 1200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [glowColor, opacity]);

  return (
    <View style={style}>
      {glowColor && (
        <Animated.View
          style={[
            styles.glowRing,
            { backgroundColor: glowColor, opacity },
          ]}
          pointerEvents="none"
        />
      )}
      {children}
    </View>
  );
}

const loadUnopened = async (storeId: string): Promise<Set<string>> => {
  try {
    const raw = await SecureStore.getItemAsync(`${UNOPENED_KEY}_${storeId}`);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
};

const saveUnopened = async (storeId: string, updated: Set<string>) => {
  try {
    await SecureStore.setItemAsync(
      `${UNOPENED_KEY}_${storeId}`,
      JSON.stringify([...updated])
    );
  } catch {}
};

export default function DepartmentScreen() {
  const { state, setDepartment } = useApp();
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [unopened, setUnopened] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [catBarcodes, setCatBarcodes] = useState<ScannedItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      const storeId = state?.storeId;
      if (!storeId) return;
      (async () => {
        const saved = await loadUnopened(storeId);
        setUnopened(saved);

        setLoading(true);
        try {
          const cats = await getCategories(storeId);
          setCategories(cats);

          const merged = new Set(saved);
          let changed = false;
          for (const cat of cats) {
            if (!merged.has(cat.name)) {
              merged.add(cat.name);
              changed = true;
            }
          }
          for (const name of merged) {
            if (!cats.some((c) => c.name === name)) {
              merged.delete(name);
              changed = true;
            }
          }
          if (changed) {
            setUnopened(new Set(merged));
            saveUnopened(storeId, merged);
          }
        } catch {} finally {
          setLoading(false);
        }
      })();
    }, [state?.storeId])
  );

  if (!state) {
    router.replace('/login');
    return null;
  }

  async function openCategory(name: string) {
    const updated = new Set(unopened);
    updated.delete(name);
    setUnopened(updated);
    saveUnopened(state.storeId, updated);

    setSelectedCat(name);
    setCatBarcodes([]);
    setShowCatModal(true);

    try {
      const barcodes = await getCategoryBarcodes(state.storeId, name);
      setCatBarcodes(barcodes);
    } catch {}
  }

  function startNewScan(prefix: string, name: string) {
    setDepartment(name, prefix);
    setShowDeptPicker(false);
    router.replace('/scanner');
  }

  function getGlowColor(cat: CategoryInfo): string | null {
    if (cat.important) return Brute.danger;
    if (unopened.has(cat.name)) return Brute.success;
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Store size={28} color={Brute.accent} strokeWidth={2} />
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.subtitle}>Store #{state.storeNumber}</Text>
      </View>

      <TouchableOpacity
        style={styles.newListBtn}
        onPress={() => setShowDeptPicker(true)}
        activeOpacity={0.85}
      >
        <Plus size={22} color={Brute.text} strokeWidth={2.5} />
        <Text style={styles.newListText}>Scan New List</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={Brute.muted} />
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.emptyState}>
          <ScanBarcode size={48} color={Brute.muted} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No lists yet</Text>
          <Text style={styles.emptySub}>Scan your first barcode list</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {categories.map((cat) => {
            const glowColor = getGlowColor(cat);
            return (
              <GlowCard key={cat.name} glowColor={glowColor}>
                <TouchableOpacity
                  style={[
                    styles.card,
                    glowColor && styles.cardGlow,
                  ]}
                  onPress={() => openCategory(cat.name)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardLeft}>
                    <View style={[
                      styles.glowDot,
                      cat.important && styles.glowDotImportant,
                      !cat.important && unopened.has(cat.name) && styles.glowDotNew,
                    ]} />
                    <View>
                      <Text style={styles.cardText}>{cat.name}</Text>
                      {cat.important && (
                        <Text style={styles.impLabel}>Important</Text>
                      )}
                      {!cat.important && unopened.has(cat.name) && (
                        <Text style={styles.newLabel}>New</Text>
                      )}
                    </View>
                  </View>
                  <ChevronRight size={24} color={Brute.muted} strokeWidth={2.5} />
                </TouchableOpacity>
              </GlowCard>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={showCatModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedCat}</Text>
              <TouchableOpacity onPress={() => setShowCatModal(false)} activeOpacity={0.7}>
                <X size={24} color={Brute.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {catBarcodes.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <ActivityIndicator color={Brute.muted} />
                  <Text style={styles.modalEmptyText}>Loading...</Text>
                </View>
              ) : (
                catBarcodes.map((item, i) => (
                  <View key={i} style={styles.barcodeRow}>
                    <Text style={styles.barcodeValue}>{item.barcode}</Text>
                    {item.comment ? (
                      <Text style={styles.barcodeComment}>{item.comment}</Text>
                    ) : null}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showDeptPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Department</Text>
              <TouchableOpacity onPress={() => setShowDeptPicker(false)} activeOpacity={0.7}>
                <X size={24} color={Brute.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {departments.map((dept) => (
                <TouchableOpacity
                  key={dept.prefix}
                  style={styles.deptCard}
                  onPress={() => startNewScan(dept.prefix, dept.name)}
                  activeOpacity={0.85}
                >
                  <View style={styles.deptLeft}>
                    <Text style={styles.deptName}>{dept.name}</Text>
                    <View style={styles.deptBadge}>
                      <Text style={styles.deptPrefix}>{dept.prefix}</Text>
                    </View>
                  </View>
                  <ChevronRight size={24} color={Brute.muted} strokeWidth={2.5} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  newListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: Brute.accent,
    borderRadius: Brute.radius,
    borderWidth: Brute.borderW,
    borderColor: Brute.accent,
  },
  newListText: {
    fontSize: 18,
    fontWeight: '700',
    color: Brute.text,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 24,
    paddingTop: 12,
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
    position: 'relative',
    zIndex: 1,
  },
  cardGlow: {
    borderColor: 'transparent',
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
  glowDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  glowDotImportant: {
    backgroundColor: Brute.danger,
  },
  glowDotNew: {
    backgroundColor: Brute.success,
  },
  impLabel: {
    fontSize: 12,
    color: Brute.danger,
    fontWeight: '600',
    marginTop: 2,
  },
  newLabel: {
    fontSize: 12,
    color: Brute.success,
    fontWeight: '600',
    marginTop: 2,
  },
  glowRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: Brute.radius + 2,
    zIndex: 0,
  },
  loadingRow: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Brute.muted,
  },
  emptySub: {
    fontSize: 14,
    color: Brute.muted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Brute.base,
    borderTopLeftRadius: Brute.radius || 16,
    borderTopRightRadius: Brute.radius || 16,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: Brute.borderW,
    borderBottomColor: Brute.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Brute.text,
  },
  modalBody: {
    padding: 20,
  },
  modalEmpty: {
    alignItems: 'center',
    gap: 12,
    padding: 40,
  },
  modalEmptyText: {
    color: Brute.muted,
    fontSize: 14,
  },
  barcodeRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Brute.border,
  },
  barcodeValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Brute.text,
    fontFamily: 'monospace',
  },
  barcodeComment: {
    fontSize: 13,
    color: Brute.muted,
    marginTop: 4,
  },
  deptCard: {
    backgroundColor: Brute.surface,
    borderWidth: Brute.borderW,
    borderColor: Brute.border,
    borderRadius: Brute.radius,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  deptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deptName: {
    fontSize: 20,
    fontWeight: '600',
    color: Brute.text,
  },
  deptBadge: {
    backgroundColor: Brute.base,
    borderWidth: Brute.borderW,
    borderColor: Brute.accent,
    borderRadius: Brute.radius,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deptPrefix: {
    fontSize: 14,
    fontWeight: '700',
    color: Brute.accent,
  },
});
