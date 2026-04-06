import { describe, it, expect } from 'vitest';
import { fuzzyScore, fuzzyFilter } from './fuzzySearch';

describe('fuzzySearch', () => {
  describe('fuzzyScore', () => {
    it('exact match scores highest', () => {
      expect(fuzzyScore('hello', 'hello')).toBe(100);
    });

    it('prefix match scores high', () => {
      expect(fuzzyScore('hel', 'hello')).toBeGreaterThan(70);
    });

    it('substring match scores medium', () => {
      expect(fuzzyScore('llo', 'hello')).toBeGreaterThan(50);
    });

    it('no match returns -1', () => {
      expect(fuzzyScore('xyz', 'hello')).toBe(-1);
    });

    it('case insensitive', () => {
      expect(fuzzyScore('HELLO', 'hello')).toBe(100);
    });

    it('subsequence match scores low', () => {
      const score = fuzzyScore('hlo', 'hello');
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(60);
    });
  });

  describe('fuzzyFilter', () => {
    const items = [
      { name: 'Apple' },
      { name: 'Banana' },
      { name: 'Cherry' },
      { name: 'Avocado' },
    ];

    it('returns all items for empty query', () => {
      const result = fuzzyFilter(items, '', (i) => i.name);
      expect(result).toHaveLength(4);
    });

    it('filters matching items', () => {
      const result = fuzzyFilter(items, 'a', (i) => i.name);
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((r) => r.name.toLowerCase().includes('a'))).toBe(true);
    });

    it('sorts by score (best match first)', () => {
      const result = fuzzyFilter(items, 'app', (i) => i.name);
      expect(result[0].name).toBe('Apple');
    });

    it('returns empty for no matches', () => {
      const result = fuzzyFilter(items, 'zzz', (i) => i.name);
      expect(result).toHaveLength(0);
    });
  });
});
