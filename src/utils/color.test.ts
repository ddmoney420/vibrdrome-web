import { describe, it, expect } from 'vitest';
import { hexToHsl, hslToHex, darkenHex, isValidHex } from './color';

describe('color utils', () => {
  describe('hexToHsl', () => {
    it('converts white', () => {
      const { l, s } = hexToHsl('#ffffff');
      expect(l).toBe(100);
      expect(s).toBe(0);
    });

    it('converts black', () => {
      const { l } = hexToHsl('#000000');
      expect(l).toBe(0);
    });

    it('converts pure red', () => {
      const result = hexToHsl('#ff0000');
      expect(result.h).toBe(0);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('handles 3-digit hex', () => {
      const result = hexToHsl('#fff');
      expect(result.l).toBe(100);
    });
  });

  describe('hslToHex', () => {
    it('converts back from HSL', () => {
      const hex = hslToHex(0, 100, 50);
      expect(hex).toBe('#ff0000');
    });
  });

  describe('darkenHex', () => {
    it('darkens a color', () => {
      const darker = darkenHex('#8b5cf6', 10);
      const original = hexToHsl('#8b5cf6');
      const result = hexToHsl(darker);
      expect(result.l).toBeLessThan(original.l);
    });

    it('does not go below 0', () => {
      const result = darkenHex('#000000', 50);
      const { l } = hexToHsl(result);
      expect(l).toBeGreaterThanOrEqual(0);
    });
  });

  describe('isValidHex', () => {
    it('accepts valid 6-digit hex', () => {
      expect(isValidHex('#8b5cf6')).toBe(true);
      expect(isValidHex('#FFFFFF')).toBe(true);
    });

    it('accepts valid 3-digit hex', () => {
      expect(isValidHex('#fff')).toBe(true);
      expect(isValidHex('#abc')).toBe(true);
    });

    it('rejects invalid', () => {
      expect(isValidHex('8b5cf6')).toBe(false);
      expect(isValidHex('#xyz')).toBe(false);
      expect(isValidHex('')).toBe(false);
      expect(isValidHex('#12345')).toBe(false);
    });
  });
});
