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
import {
  addHistoryEntry as persistHistoryEntry,
  deleteHistoryEntry as persistDeleteHistoryEntry,
  setHistoryEntryInfo,
  loadHistory,
} from '../lib/history';
import { fetchSpeciesInfo } from '../lib/detector';

export type TabId = 'camera' | 'history';

interface AppStateContextValue {
  activeTab: TabId;
  setActiveTab: (id: TabId) => void;
  initError: string | null;
  setInitError: (v: string | null) => void;
  history: HistoryEntry[];
  historyLoading: boolean;
  addHistoryEntry: (detection: Detection, photoUri: string) => Promise<void>;
  deleteHistoryEntry: (id: string) => Promise<void>;
  /** Looks up the species details of a find saved before we fetched them. */
  backfillSpeciesInfo: (id: string, label: string) => Promise<void>;
  /** The find open in the detail view, if any. */
  selectedEntry: HistoryEntry | null;
  setSelectedEntryId: (id: string | null) => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>('camera');
  const [initError, setInitError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

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

  const deleteHistoryEntry = useCallback(async (id: string) => {
    await persistDeleteHistoryEntry(id);
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const backfillSpeciesInfo = useCallback(async (id: string, label: string) => {
    const info = await fetchSpeciesInfo(label);
    const updated = await setHistoryEntryInfo(id, info);

    // Deleted while the lookup was in flight — nothing left to update.
    if (!updated) return;

    setHistory((prev) => prev.map((entry) => (entry.id === id ? updated : entry)));
  }, []);

  // Derived from the id rather than held as its own entry, so deleting the open find
  // closes the detail view on its own.
  const selectedEntry = useMemo(
    () => history.find((entry) => entry.id === selectedEntryId) ?? null,
    [history, selectedEntryId]
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
      deleteHistoryEntry,
      backfillSpeciesInfo,
      selectedEntry,
      setSelectedEntryId,
    }),
    [
      activeTab,
      initError,
      history,
      historyLoading,
      addHistoryEntry,
      deleteHistoryEntry,
      backfillSpeciesInfo,
      selectedEntry,
    ]
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
