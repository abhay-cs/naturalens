import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Detection, FrameResults, Species } from '../types';

export type TabId = 'home' | 'map' | 'favorites' | 'profile' | 'camera';

interface AppStateContextValue {
  activeTab: TabId;
  setActiveTab: (id: TabId) => void;
  scoreThreshold: number;
  setScoreThreshold: (v: number) => void;
  showOnlyBears: boolean;
  setShowOnlyBears: (v: boolean) => void;
  initError: string | null;
  setInitError: (v: string | null) => void;
  filterDetections: (d: Detection[]) => Detection[];
  detectorOptions: { scoreThreshold: number };
  setFrameResults: (r: FrameResults | null) => void;
  setVideoDetections: (d: Detection[] | null) => void;
  setVideoFrameMeta: (m: { timestamp?: number; frameIndex?: number } | null) => void;
  displayFrame: FrameResults | { detections?: Detection[]; timestamp?: number; frameIndex?: number } | null;
  displayDetections: Detection[] | null;
  selectedSpecies: Species | null;
  setSelectedSpecies: (s: Species | null) => void;
  favoriteSpeciesIds: string[];
  toggleFavorite: (speciesId: string) => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [scoreThreshold, setScoreThreshold] = useState(0.4);
  const [showOnlyBears, setShowOnlyBears] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [frameResults, setFrameResults] = useState<FrameResults | null>(null);
  const [videoDetections, setVideoDetections] = useState<Detection[] | null>(null);
  const [videoFrameMeta, setVideoFrameMeta] = useState<{
    timestamp?: number;
    frameIndex?: number;
  } | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [favoriteSpeciesIds, setFavoriteSpeciesIds] = useState<string[]>([]);

  const toggleFavorite = useCallback((speciesId: string) => {
    setFavoriteSpeciesIds((prev) =>
      prev.includes(speciesId) ? prev.filter((id) => id !== speciesId) : [...prev, speciesId]
    );
  }, []);

  const filterDetections = useCallback(
    (detections: Detection[]): Detection[] => {
      let out = detections.filter((d) => d.score >= scoreThreshold);
      if (showOnlyBears) {
        out = out.filter((d) => d.label.toLowerCase() === 'bear');
      }
      return out;
    },
    [scoreThreshold, showOnlyBears]
  );

  const detectorOptions = useMemo(() => ({ scoreThreshold }), [scoreThreshold]);

  const displayFrame: AppStateContextValue['displayFrame'] =
    activeTab === 'camera' && videoDetections && videoFrameMeta
      ? { detections: videoDetections, ...videoFrameMeta }
      : frameResults ?? null;

  const displayDetections = displayFrame?.detections ?? null;

  const value: AppStateContextValue = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      scoreThreshold,
      setScoreThreshold,
      showOnlyBears,
      setShowOnlyBears,
      initError,
      setInitError,
      filterDetections,
      detectorOptions,
      setFrameResults,
      setVideoDetections,
      setVideoFrameMeta,
      displayFrame,
      displayDetections,
      selectedSpecies,
      setSelectedSpecies,
      favoriteSpeciesIds,
      toggleFavorite,
    }),
    [
      activeTab,
      scoreThreshold,
      showOnlyBears,
      initError,
      filterDetections,
      detectorOptions,
      displayFrame,
      displayDetections,
      selectedSpecies,
      favoriteSpeciesIds,
      toggleFavorite,
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
