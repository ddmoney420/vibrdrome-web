import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useUIStore } from './uiStore';

beforeEach(() => {
  useUIStore.setState({
    theme: 'system',
    accentColor: '#8b5cf6',
    reduceMotion: false,
    keyboardShortcutsEnabled: true,
    streamQuality: 0,
    lastfmApiKey: '',
    epilepsyWarningDismissed: false,
    commandPaletteOpen: false,
    popOutPlayerOpen: false,
  });
});

describe('uiStore', () => {
  describe('theme', () => {
    it('defaults to system', () => {
      expect(useUIStore.getState().theme).toBe('system');
    });

    it('sets theme', () => {
      useUIStore.getState().setTheme('dark');
      expect(useUIStore.getState().theme).toBe('dark');
    });

    it('accepts all valid themes', () => {
      const themes = ['system', 'dark', 'light', 'apple', 'apple-dark', 'retro', 'terminal', 'midnight', 'sunset'] as const;
      for (const t of themes) {
        useUIStore.getState().setTheme(t);
        expect(useUIStore.getState().theme).toBe(t);
      }
    });
  });

  describe('accentColor', () => {
    it('defaults to purple', () => {
      expect(useUIStore.getState().accentColor).toBe('#8b5cf6');
    });

    it('sets accent color', () => {
      useUIStore.getState().setAccentColor('#ff0000');
      expect(useUIStore.getState().accentColor).toBe('#ff0000');
    });
  });

  describe('reduceMotion', () => {
    it('defaults to false', () => {
      expect(useUIStore.getState().reduceMotion).toBe(false);
    });

    it('toggles', () => {
      useUIStore.getState().setReduceMotion(true);
      expect(useUIStore.getState().reduceMotion).toBe(true);
    });
  });

  describe('keyboardShortcuts', () => {
    it('defaults to enabled', () => {
      expect(useUIStore.getState().keyboardShortcutsEnabled).toBe(true);
    });

    it('can be disabled', () => {
      useUIStore.getState().setKeyboardShortcutsEnabled(false);
      expect(useUIStore.getState().keyboardShortcutsEnabled).toBe(false);
    });
  });

  describe('streamQuality', () => {
    it('defaults to 0 (original)', () => {
      expect(useUIStore.getState().streamQuality).toBe(0);
    });

    it('sets quality', () => {
      useUIStore.getState().setStreamQuality(320);
      expect(useUIStore.getState().streamQuality).toBe(320);
    });
  });

  describe('commandPalette', () => {
    it('opens and closes', () => {
      expect(useUIStore.getState().commandPaletteOpen).toBe(false);
      useUIStore.getState().openCommandPalette();
      expect(useUIStore.getState().commandPaletteOpen).toBe(true);
      useUIStore.getState().closeCommandPalette();
      expect(useUIStore.getState().commandPaletteOpen).toBe(false);
    });
  });

  describe('popOutPlayer', () => {
    it('opens and closes', () => {
      expect(useUIStore.getState().popOutPlayerOpen).toBe(false);
      useUIStore.getState().setPopOutPlayerOpen(true);
      expect(useUIStore.getState().popOutPlayerOpen).toBe(true);
      useUIStore.getState().setPopOutPlayerOpen(false);
      expect(useUIStore.getState().popOutPlayerOpen).toBe(false);
    });
  });

  describe('lastfmApiKey', () => {
    it('defaults to empty', () => {
      expect(useUIStore.getState().lastfmApiKey).toBe('');
    });

    it('sets key', () => {
      useUIStore.getState().setLastfmApiKey('test123');
      expect(useUIStore.getState().lastfmApiKey).toBe('test123');
    });
  });

  describe('epilepsyWarning', () => {
    it('defaults to not dismissed', () => {
      expect(useUIStore.getState().epilepsyWarningDismissed).toBe(false);
    });

    it('can be dismissed', () => {
      useUIStore.getState().setEpilepsyWarningDismissed(true);
      expect(useUIStore.getState().epilepsyWarningDismissed).toBe(true);
    });
  });

  describe('visualizerFavoritesOnly', () => {
    it('defaults to off', () => {
      expect(useUIStore.getState().visualizerFavoritesOnly).toBe(false);
    });

    it('toggles', () => {
      useUIStore.getState().setVisualizerFavoritesOnly(true);
      expect(useUIStore.getState().visualizerFavoritesOnly).toBe(true);
      useUIStore.getState().setVisualizerFavoritesOnly(false);
      expect(useUIStore.getState().visualizerFavoritesOnly).toBe(false);
    });
  });
});

// visualizerMode persistence: the init reads localStorage at module-load time,
// so the load/fallback cases re-import the module with a stubbed localStorage.
describe('uiStore visualizerMode persistence', () => {
  const MODE_KEY = 'vibrdrome_visualizer_mode';
  const stub = (initial: Record<string, string> = {}) => {
    const backing: Record<string, string> = { ...initial };
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => (k in backing ? backing[k] : null),
      setItem: (k: string, v: string) => { backing[k] = String(v); },
      removeItem: (k: string) => { delete backing[k]; },
      clear: () => { for (const k of Object.keys(backing)) delete backing[k]; },
    });
    return backing;
  };
  const freshStore = async () => {
    vi.resetModules();
    return (await import('./uiStore')).useUIStore;
  };
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

  it('defaults to shader when nothing is persisted', async () => {
    stub({});
    expect((await freshStore()).getState().visualizerMode).toBe('shader');
  });

  it('loads a persisted milkdrop value', async () => {
    stub({ [MODE_KEY]: 'milkdrop' });
    expect((await freshStore()).getState().visualizerMode).toBe('milkdrop');
  });

  it('loads a persisted shader value', async () => {
    stub({ [MODE_KEY]: 'shader' });
    expect((await freshStore()).getState().visualizerMode).toBe('shader');
  });

  it('falls back to shader for an invalid persisted value', async () => {
    stub({ [MODE_KEY]: 'bogus-engine' });
    expect((await freshStore()).getState().visualizerMode).toBe('shader');
  });

  it('setter persists milkdrop', async () => {
    const backing = stub({});
    const store = await freshStore();
    store.getState().setVisualizerMode('milkdrop');
    expect(store.getState().visualizerMode).toBe('milkdrop');
    expect(backing[MODE_KEY]).toBe('milkdrop');
  });

  it('setter persists shader', async () => {
    const backing = stub({ [MODE_KEY]: 'milkdrop' });
    const store = await freshStore();
    store.getState().setVisualizerMode('shader');
    expect(store.getState().visualizerMode).toBe('shader');
    expect(backing[MODE_KEY]).toBe('shader');
  });
});
