import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Detection, HistoryEntry } from '../types';
import { addHistoryEntry as persistHistoryEntry, loadHistory } from '../lib/history';

export type TabId = 'camera' | 'history';

interface AppStateContextValue {
  activeTab: TabId;
  setActiveTab: (id: TabId) => void;
  initError: string | null;
  setInitError: (v: string | null) => void;
  history: HistoryEntry[];
  historyLoading: boolean;
  addHistoryEntry: (detection: Detection, photoUri: string) => Promise<void>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>('camera');
  const [initError, setInitError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    loadHistory()
      .then(setHistory)
      .finally(() => setHistoryLoading(false));
  }, []);

  const addHistoryEntry = useCallback(
    async (detection: Detection, photoUri: string) => {
      const entry = await persistHistoryEntry(detection, photoUri);
      setHistory((prev) => [entry, ...prev]);
    },
    []
  );

  const value: AppStateContextValue = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      initError,
      setInitError,
      history,
      historyLoading,
      addHistoryEntry,
    }),
    [activeTab, initError, history, historyLoading, addHistoryEntry]
  );

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
