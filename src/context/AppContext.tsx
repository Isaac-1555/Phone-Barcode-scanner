import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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
  login: (storeNumber: string, storeId: string) => void;
  setDepartment: (department: string, prefix: string) => void;
  addScannedItem: (barcode: string, comment?: string) => void;
  updateItemComment: (index: number, comment: string) => void;
  removeScannedItem: (index: number) => void;
  clearScannedItems: () => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);

  const login = useCallback((storeNumber: string, storeId: string) => {
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

  const logout = useCallback(() => {
    setState(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
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