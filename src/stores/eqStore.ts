import { create } from 'zustand';

const EQ_KEY = 'vibrdrome_eq';

const FLAT = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const EQ_PRESETS: Record<string, number[]> = {
  'Flat':          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Rock':          [5, 4, 3, 1, -1, -1, 0, 2, 3, 4],
  'Pop':           [-1, 2, 4, 5, 4, 2, 0, -1, -1, -1],
  'Jazz':          [4, 3, 1, 2, -1, -1, 0, 1, 3, 4],
  'Classical':     [5, 4, 3, 2, -1, -1, 0, 2, 3, 5],
  'Hip Hop':       [5, 4, 1, 3, -1, -1, 1, 0, 1, 3],
  'Electronic':    [4, 3, 1, 0, -2, 0, 1, 2, 4, 5],
  'Vocal':         [-2, -1, 0, 2, 4, 4, 3, 1, 0, -1],
  'Bass Boost':    [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  'Treble Boost':  [0, 0, 0, 0, 0, 0, 2, 4, 5, 6],
};

interface EQState {
  enabled: boolean;
  bands: number[];
  currentPreset: string | null;

  setEnabled: (enabled: boolean) => void;
  setBand: (index: number, gain: number) => void;
  setPreset: (name: string) => void;
  resetBands: () => void;
}

function persistEQ(state: EQState) {
  try {
    localStorage.setItem(EQ_KEY, JSON.stringify({
      enabled: state.enabled,
      bands: state.bands,
      currentPreset: state.currentPreset,
    }));
  } catch { /* storage full or unavailable */ }
}

function loadPersistedEQ(): Partial<EQState> {
  try {
    const raw = localStorage.getItem(EQ_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return {
      enabled: data.enabled ?? false,
      bands: Array.isArray(data.bands) && data.bands.length === 10 ? data.bands : [...FLAT],
      currentPreset: data.currentPreset ?? null,
    };
  } catch {
    return {};
  }
}

const persisted = loadPersistedEQ();

export const useEQStore = create<EQState>((set, get) => ({
  enabled: persisted.enabled ?? false,
  bands: persisted.bands ?? [...FLAT],
  currentPreset: persisted.currentPreset ?? null,

  setEnabled: (enabled) => {
    set({ enabled });
    persistEQ(get());
  },

  setBand: (index, gain) => {
    if (index < 0 || index > 9) return;
    const clamped = Math.max(-12, Math.min(12, gain));
    const bands = [...get().bands];
    bands[index] = clamped;
    set({ bands, currentPreset: null });
    persistEQ(get());
  },

  setPreset: (name) => {
    const preset = EQ_PRESETS[name];
    if (!preset) return;
    set({ bands: [...preset], currentPreset: name });
    persistEQ(get());
  },

  resetBands: () => {
    set({ bands: [...FLAT], currentPreset: 'Flat' });
    persistEQ(get());
  },
}));

export { EQ_PRESETS };
