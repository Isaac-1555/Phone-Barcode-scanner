import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { useApp } from '../context/AppContext';
import { Brute } from '../constants/theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import { ScanSpinner } from '../components/Spinner';
import {
  ChevronDown,
  SendHorizontal,
  Keyboard,
  LogOut,
  X,
  ScanBarcode,
} from 'lucide-react-native';

const SCAN_W = 280;
const SCAN_H = 180;
const CORNER_SIZE = 36;
const BORDER_W = 3;

const departments = [
  { name: 'Frontend', prefix: 'FE' },
  { name: 'Produce', prefix: 'PR' },
  { name: 'Bakery', prefix: 'BA' },
  { name: 'Deli', prefix: 'DE' },
  { name: 'Meat', prefix: 'ME' },
];

function ScanCorner({ side, progress }: { side: 'tl' | 'tr' | 'bl' | 'br'; progress: SharedValue<number> }) {
  const basePos = {
    tl: { left: -BORDER_W, top: -BORDER_W, borderLeftWidth: BORDER_W, borderTopWidth: BORDER_W },
    tr: { right: -BORDER_W, top: -BORDER_W, borderRightWidth: BORDER_W, borderTopWidth: BORDER_W },
    bl: { left: -BORDER_W, bottom: -BORDER_W, borderLeftWidth: BORDER_W, borderBottomWidth: BORDER_W },
    br: { right: -BORDER_W, bottom: -BORDER_W, borderRightWidth: BORDER_W, borderBottomWidth: BORDER_W },
  }[side];

  const dirX = side === 'tr' || side === 'br' ? -1 : 1;
  const dirY = side === 'bl' || side === 'br' ? -1 : 1;
  const maxTravelX = (SCAN_W - CORNER_SIZE) / 2;
  const maxTravelY = (SCAN_H - CORNER_SIZE) / 2;

  const animStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      width: CORNER_SIZE * (1 - p),
      height: CORNER_SIZE * (1 - p),
      transform: [
        { translateX: dirX * maxTravelX * p },
        { translateY: dirY * maxTravelY * p },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        { position: 'absolute', borderColor: Brute.text, zIndex: 10 },
        basePos,
        animStyle,
      ]}
    />
  );
}

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanBorderColor, setScanBorderColor] = useState<string>(Brute.text);
  const scanProgress = useSharedValue(0);
  const { state, logout, setDepartment } = useApp();

  const scanSession = useRef({ active: false, targetData: '', lastSeen: 0 });

  const resetScanning = useCallback(() => {
    scanSession.current = { active: false, targetData: '', lastSeen: 0 };
    setScanned(false);
    setScanBorderColor(Brute.text);
    scanProgress.value = 0;
  }, [scanProgress]);

  useFocusEffect(
    useCallback(() => { resetScanning(); }, [resetScanning])
  );

  useEffect(() => {
    if (!state) router.replace('/login');
  }, [state]);

  const navigateToComment = useCallback((barcode: string) => {
    const cleanBarcode = barcode.replace(/\D/g, '');
    const finalBarcode = cleanBarcode.length > 1
      ? cleanBarcode.slice(0, -1)
      : cleanBarcode;

    router.push({
      pathname: '/comment',
      params: {
        barcode: finalBarcode,
        index: state?.scannedItems.length?.toString() || '0',
      },
    });
  }, [state?.scannedItems.length]);

  useEffect(() => {
    const id = setInterval(() => {
      const s = scanSession.current;
      if (s.active && Date.now() - s.lastSeen > 400) {
        s.active = false;
        s.targetData = '';
        setScanned(false);
        setScanBorderColor(Brute.text);
        scanProgress.value = 0;
      }
    }, 200);
    return () => clearInterval(id);
  }, [scanProgress]);

  const handleBarCodeScanned = useCallback(({ data }: { data: string }) => {
    const now = Date.now();
    const s = scanSession.current;

    if (!s.active) {
      s.active = true;
      s.targetData = data;
      s.lastSeen = now;
      setScanned(true);

      scanProgress.value = withTiming(
        1,
        { duration: 750, easing: Easing.inOut(Easing.ease) },
        (finished) => {
          if (finished) {
            runOnJS(setScanBorderColor)(Brute.success);
            setTimeout(() => { runOnJS(navigateToComment)(data); }, 300);
          }
        }
      );
    } else if (s.targetData === data) {
      s.lastSeen = now;
    }
  }, [scanProgress, navigateToComment]);

  function handleTypeBarcode() {
    if (scanSession.current.active) resetScanning();
    setShowBarcodeModal(true);
  }

  function handleManualSubmit() {
    if (!manualBarcode.trim()) return;
    setShowBarcodeModal(false);
    setManualBarcode('');
    navigateToComment(manualBarcode.trim());
  }

  function handleSelectDepartment(name: string, prefix: string) {
    setDepartment(name, prefix);
    setShowDeptModal(false);
  }

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>Requesting camera permission...</Text>
        <ScanSpinner size={20} color={Brute.muted} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <ScanBarcode size={48} color={Brute.muted} strokeWidth={1.5} />
        <Text style={styles.centerText}>Camera permission required</Text>
        <TouchableOpacity style={styles.grantBtn} onPress={requestPermission} activeOpacity={0.8}>
          <Text style={styles.grantBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!state) return null;

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93', 'itf14', 'codabar'],
        }}
        onBarcodeScanned={handleBarCodeScanned}
      />

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.deptBtn}
            onPress={() => setShowDeptModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.deptBtnText}>{state.prefix}</Text>
            <ChevronDown size={18} color={Brute.text} strokeWidth={3} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => router.push('/review')}
            activeOpacity={0.8}
          >
            <SendHorizontal size={18} color={Brute.text} strokeWidth={2.5} />
            <Text style={styles.submitBtnText}>Submit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scanAreaWrapper}>
          <View style={[styles.scanArea, { borderColor: scanBorderColor }]}>
            <ScanCorner side="tl" progress={scanProgress} />
            <ScanCorner side="tr" progress={scanProgress} />
            <ScanCorner side="bl" progress={scanProgress} />
            <ScanCorner side="br" progress={scanProgress} />
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.footerBtn}
            onPress={handleTypeBarcode}
            activeOpacity={0.8}
          >
            <Keyboard size={20} color={Brute.text} strokeWidth={2.5} />
            <Text style={styles.footerBtnText}>Type</Text>
          </TouchableOpacity>

          <View style={styles.footerCenter}>
            <Text style={styles.scanLabel}>
              {scanned ? 'Locking...' : 'Scan Barcode'}
            </Text>
            <Text style={styles.countText}>
              {state.scannedItems.length} item{state.scannedItems.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LogOut size={20} color={Brute.danger} strokeWidth={2.5} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showDeptModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Department</Text>
            {departments.map((dept) => (
              <TouchableOpacity
                key={dept.prefix}
                style={[
                  styles.deptOption,
                  state.prefix === dept.prefix && styles.deptOptionActive,
                ]}
                onPress={() => handleSelectDepartment(dept.name, dept.prefix)}
                activeOpacity={0.85}
              >
                <Text style={styles.deptOptionText}>{dept.name}</Text>
                <View style={styles.deptOptionBadge}>
                  <Text style={styles.deptOptionPrefix}>{dept.prefix}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowDeptModal(false)}
              activeOpacity={0.85}
            >
              <X size={20} color={Brute.text} strokeWidth={3} />
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showBarcodeModal} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Type Barcode</Text>
            <TextInput
              style={styles.modalInput}
              value={manualBarcode}
              onChangeText={setManualBarcode}
              placeholder="Enter barcode number"
              placeholderTextColor={Brute.muted}
              keyboardType="number-pad"
              maxLength={14}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setShowBarcodeModal(false); setManualBarcode(''); }}
                activeOpacity={0.85}
              >
                <X size={20} color={Brute.text} strokeWidth={3} />
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, !manualBarcode.trim() && styles.modalSubmitDisabled]}
                onPress={handleManualSubmit}
                disabled={!manualBarcode.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSubmitText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brute.base,
  },
  center: {
    flex: 1,
    backgroundColor: Brute.base,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  centerText: {
    fontSize: 16,
    color: Brute.muted,
    textAlign: 'center',
  },
  grantBtn: {
    backgroundColor: Brute.accent,
    borderWidth: Brute.borderW,
    borderColor: Brute.accent,
    borderRadius: Brute.radius,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  grantBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Brute.text,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: 20,
  },
  deptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brute.surface,
    borderWidth: Brute.borderW,
    borderColor: Brute.border,
    borderRadius: Brute.radius,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 4,
  },
  deptBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: Brute.text,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brute.accent,
    borderWidth: Brute.borderW,
    borderColor: Brute.accent,
    borderRadius: Brute.radius,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Brute.text,
  },
  scanAreaWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    width: SCAN_W,
    height: SCAN_H,
    borderWidth: BORDER_W,
    borderRadius: 0,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brute.surface,
    borderWidth: Brute.borderW,
    borderColor: Brute.border,
    borderRadius: Brute.radius,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 4,
  },
  footerBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Brute.text,
  },
  footerCenter: {
    alignItems: 'center',
    gap: 2,
  },
  scanLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Brute.text,
  },
  countText: {
    fontSize: 12,
    color: Brute.muted,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brute.surface,
    borderWidth: Brute.borderW,
    borderColor: Brute.border,
    borderRadius: Brute.radius,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 4,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: Brute.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 23, 0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Brute.surface,
    borderWidth: Brute.borderW,
    borderColor: Brute.border,
    borderRadius: Brute.radius,
    padding: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Brute.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  deptOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brute.base,
    borderWidth: Brute.borderW,
    borderColor: Brute.border,
    borderRadius: Brute.radius,
    padding: 16,
  },
  deptOptionActive: {
    borderColor: Brute.accent,
  },
  deptOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: Brute.text,
  },
  deptOptionBadge: {
    borderWidth: Brute.borderW,
    borderColor: Brute.accent,
    borderRadius: Brute.radius,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  deptOptionPrefix: {
    fontSize: 14,
    fontWeight: '700',
    color: Brute.accent,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Brute.base,
    borderWidth: Brute.borderW,
    borderColor: Brute.border,
    borderRadius: Brute.radius,
    padding: 16,
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Brute.text,
  },
  modalInput: {
    backgroundColor: Brute.base,
    borderWidth: Brute.borderW,
    borderColor: Brute.border,
    borderRadius: Brute.radius,
    padding: 16,
    fontSize: 24,
    color: Brute.text,
    textAlign: 'center',
    fontFamily: 'monospace',
    letterSpacing: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Brute.base,
    borderWidth: Brute.borderW,
    borderColor: Brute.border,
    borderRadius: Brute.radius,
    padding: 16,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: Brute.text,
  },
  modalSubmitBtn: {
    flex: 1,
    backgroundColor: Brute.accent,
    borderWidth: Brute.borderW,
    borderColor: Brute.accent,
    borderRadius: Brute.radius,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitDisabled: {
    opacity: 0.5,
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '700',
    color: Brute.text,
  },
});
