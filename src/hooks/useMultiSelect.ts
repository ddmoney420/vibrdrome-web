import { useState, useCallback } from 'react';

export function useMultiSelect<T extends string>() {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  const toggle = useCallback((id: T) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: T[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearAll = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  const isSelected = useCallback((id: T) => selectedIds.has(id), [selectedIds]);

  const enterSelectionMode = useCallback((firstId?: T) => {
    setSelectionMode(true);
    if (firstId) setSelectedIds(new Set([firstId]));
  }, []);

  return {
    selectedIds,
    selectionMode,
    selectedCount: selectedIds.size,
    toggle,
    selectAll,
    clearAll,
    isSelected,
    enterSelectionMode,
  };
}
