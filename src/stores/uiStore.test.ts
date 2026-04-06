import { describe, it, expect, beforeEach } from 'vitest';
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
});
