import { usePlayerStore } from '../stores/playerStore';
import { Header } from '../components/common';

function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function QueueScreen() {
  const { queue, currentIndex, skipToIndex, removeFromQueue, clearQueue } = usePlayerStore();

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header
        title="Queue"
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

      <div className="flex-1 overflow-y-auto">
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
                onClick={() => skipToIndex(index)}
                className={`group flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-bg-tertiary ${
                  isCurrent ? 'border-l-2 border-accent bg-accent/5' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${isCurrent ? 'text-accent' : 'text-text-primary'}`}>
                    {song.title}
                  </p>
                  <p className="truncate text-xs text-text-secondary">{song.artist}</p>
                </div>

                <span className="shrink-0 text-xs text-text-muted">
                  {formatDuration(song.duration)}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromQueue(index);
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted opacity-0 transition-all hover:bg-bg-secondary hover:text-red-400 group-hover:opacity-100"
                  aria-label="Remove from queue"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
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
