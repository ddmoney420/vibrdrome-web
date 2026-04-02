import { usePlayerStore } from '../../stores/playerStore';
import type { Song } from '../../types/subsonic';

interface BatchActionBarProps {
  selectedCount: number;
  songs: Song[];
  selectedIds: Set<string>;
  onClear: () => void;
}

export default function BatchActionBar({ selectedCount, songs, selectedIds, onClear }: BatchActionBarProps) {
  const playSongs = usePlayerStore((s) => s.playSongs);
  const playNext = usePlayerStore((s) => s.playNext);
  const addToQueue = usePlayerStore((s) => s.addToQueue);

  if (selectedCount === 0) return null;

  const selectedSongs = songs.filter((s) => selectedIds.has(s.id));

  const handlePlaySelected = () => {
    if (selectedSongs.length > 0) {
      playSongs(selectedSongs, 0);
      onClear();
    }
  };

  const handleAddToQueue = () => {
    for (const song of selectedSongs) {
      addToQueue(song);
    }
    onClear();
  };

  const handlePlayNext = () => {
    // Add in reverse so they maintain order
    for (let i = selectedSongs.length - 1; i >= 0; i--) {
      playNext(selectedSongs[i]);
    }
    onClear();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-bg-secondary/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
      <span className="text-sm font-medium text-text-primary">
        {selectedCount} selected
      </span>
      <div className="flex-1" />
      <button
        onClick={handlePlaySelected}
        className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
        </svg>
        Play
      </button>
      <button
        onClick={handlePlayNext}
        className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-bg-tertiary"
      >
        Play Next
      </button>
      <button
        onClick={handleAddToQueue}
        className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-bg-tertiary"
      >
        Add to Queue
      </button>
      <button
        onClick={onClear}
        className="rounded-full px-3 py-1.5 text-xs font-semibold text-text-muted hover:text-text-primary"
      >
        Cancel
      </button>
    </div>
  );
}
