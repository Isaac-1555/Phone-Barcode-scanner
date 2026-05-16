import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

const STORE_NUMBER_KEY = 'store_number';
const STORE_ID_KEY = 'store_id';

export interface ScannedItem {
  barcode: string;
  comment: string;
}

export interface AppState {
  storeNumber: string;
  storeId: string;
  department: string;
  prefix: string;
  scannedItems: ScannedItem[];
}

interface AppContextType {
  state: AppState | null;
  loading: boolean;
  login: (storeNumber: string, storeId: string) => Promise<void>;
  setDepartment: (department: string, prefix: string) => void;
  addScannedItem: (barcode: string, comment?: string) => void;
  updateItemComment: (index: number, comment: string) => void;
  removeScannedItem: (index: number) => void;
  clearScannedItems: () => void;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storeNumber, storeId] = await Promise.all([
          SecureStore.getItemAsync(STORE_NUMBER_KEY),
          SecureStore.getItemAsync(STORE_ID_KEY),
        ]);
        if (storeNumber && storeId) {
          setState({
            storeNumber,
            storeId,
            department: '',
            prefix: '',
            scannedItems: [],
          });
        }
      } catch {
        // Failed to read - start fresh
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (storeNumber: string, storeId: string) => {
    await Promise.all([
      SecureStore.setItemAsync(STORE_NUMBER_KEY, storeNumber),
      SecureStore.setItemAsync(STORE_ID_KEY, storeId),
    ]);
    setState({
      storeNumber,
      storeId,
      department: '',
      prefix: '',
      scannedItems: [],
    });
  }, []);

  const setDepartment = useCallback((department: string, prefix: string) => {
    setState((prev) => (prev ? { ...prev, department, prefix } : null));
  }, []);

  const addScannedItem = useCallback((barcode: string, comment: string = '') => {
    setState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        scannedItems: [...prev.scannedItems, { barcode, comment }],
      };
    });
  }, []);

  const updateItemComment = useCallback((index: number, comment: string) => {
    setState((prev) => {
      if (!prev) return null;
      const items = [...prev.scannedItems];
      items[index] = { ...items[index], comment };
      return { ...prev, scannedItems: items };
    });
  }, []);

  const removeScannedItem = useCallback((index: number) => {
    setState((prev) => {
      if (!prev) return null;
      const items = prev.scannedItems.filter((_, i) => i !== index);
      return { ...prev, scannedItems: items };
    });
  }, []);

  const clearScannedItems = useCallback(() => {
    setState((prev) => (prev ? { ...prev, scannedItems: [] } : null));
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(STORE_NUMBER_KEY),
      SecureStore.deleteItemAsync(STORE_ID_KEY),
    ]);
    setState(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        loading,
        login,
        setDepartment,
        addScannedItem,
        updateItemComment,
        removeScannedItem,
        clearScannedItems,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
