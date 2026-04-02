import { useState, useCallback } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { Header } from '../components/common';

function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null) return '--:--';
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function QueueScreen() {
  const { queue, currentIndex, skipToIndex, removeFromQueue, clearQueue, reorderQueue } = usePlayerStore();
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      reorderQueue(dragIndex, index);
      setDragIndex(index);
    }
  }, [dragIndex, reorderQueue]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header
        title={`Queue${queue.length > 0 ? ` (${queue.length})` : ''}`}
        showBack
        rightActions={
          queue.length > 0 ? (
            <button
              onClick={clearQueue}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-400/10"
            >
              Clear All
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto pb-20">
        {queue.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-12 w-12 text-text-muted">
              <path strokeLinecap="round" d="M4 6h16M4 10h16M4 14h16M4 18h12" />
            </svg>
            <p className="text-text-muted">Queue is empty</p>
            <p className="text-sm text-text-muted">Add songs to start listening</p>
          </div>
        ) : (
          queue.map((song, index) => {
            const isCurrent = index === currentIndex;
            return (
              <div
                key={`${song.id}-${index}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center gap-2 px-2 py-2.5 min-h-[48px] transition-colors ${
                  dragIndex === index ? 'bg-accent/10' : 'hover:bg-bg-tertiary'
                } ${isCurrent ? 'border-l-2 border-accent bg-accent/5' : ''}`}
              >
                {/* Drag handle */}
                <span className="cursor-grab shrink-0 px-1 text-text-muted active:cursor-grabbing">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                  </svg>
                </span>

                {/* Song info — clickable */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => skipToIndex(index)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skipToIndex(index); } }}
                  className="min-w-0 flex-1 cursor-pointer"
                >
                  <p className={`truncate text-sm font-medium ${isCurrent ? 'text-accent' : 'text-text-primary'}`}>
                    {song.title}
                  </p>
                  <p className="truncate text-xs text-text-secondary">{song.artist}</p>
                </div>

                <span className="shrink-0 text-xs text-text-muted">
                  {formatDuration(song.duration)}
                </span>

                {/* Move up/down for touch */}
                <button
                  onClick={(e) => { e.stopPropagation(); if (index > 0) reorderQueue(index, index - 1); }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-text-muted opacity-0 hover:text-text-primary group-hover:opacity-100 disabled:opacity-20"
                  disabled={index === 0}
                  aria-label="Move up"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (index < queue.length - 1) reorderQueue(index, index + 1); }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-text-muted opacity-0 hover:text-text-primary group-hover:opacity-100 disabled:opacity-20"
                  disabled={index === queue.length - 1}
                  aria-label="Move down"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Remove */}
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromQueue(index); }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-text-muted opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                  aria-label="Remove from queue"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                    <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
