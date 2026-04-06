import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMultiSelect } from './useMultiSelect';

describe('useMultiSelect', () => {
  it('starts with no selection', () => {
    const { result } = renderHook(() => useMultiSelect<string>());
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.selectionMode).toBe(false);
  });

  it('enters selection mode', () => {
    const { result } = renderHook(() => useMultiSelect<string>());
    act(() => result.current.enterSelectionMode('item1'));

    expect(result.current.selectionMode).toBe(true);
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.isSelected('item1')).toBe(true);
  });

  it('toggles selection', () => {
    const { result } = renderHook(() => useMultiSelect<string>());
    act(() => result.current.enterSelectionMode());
    act(() => result.current.toggle('a'));

    expect(result.current.isSelected('a')).toBe(true);

    act(() => result.current.toggle('a'));
    expect(result.current.isSelected('a')).toBe(false);
  });

  it('selects all', () => {
    const { result } = renderHook(() => useMultiSelect<string>());
    act(() => result.current.selectAll(['a', 'b', 'c']));

    expect(result.current.selectedCount).toBe(3);
    expect(result.current.isSelected('a')).toBe(true);
    expect(result.current.isSelected('b')).toBe(true);
    expect(result.current.isSelected('c')).toBe(true);
  });

  it('clears all', () => {
    const { result } = renderHook(() => useMultiSelect<string>());
    act(() => result.current.selectAll(['a', 'b']));
    act(() => result.current.clearAll());

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.selectionMode).toBe(false);
  });

  it('handles multiple toggles', () => {
    const { result } = renderHook(() => useMultiSelect<string>());
    act(() => result.current.enterSelectionMode());
    act(() => result.current.toggle('a'));
    act(() => result.current.toggle('b'));
    act(() => result.current.toggle('c'));
    act(() => result.current.toggle('b'));

    expect(result.current.selectedCount).toBe(2);
    expect(result.current.isSelected('a')).toBe(true);
    expect(result.current.isSelected('b')).toBe(false);
    expect(result.current.isSelected('c')).toBe(true);
  });
});
