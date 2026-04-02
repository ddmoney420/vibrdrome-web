import { usePlayerStore } from '../../stores/playerStore';

function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null) return '--:--';
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function NowPlayingQueue() {
  const { queue, currentIndex, skipToIndex, removeFromQueue } = usePlayerStore();

  if (queue.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 text-text-muted">
          <path strokeLinecap="round" d="M4 6h16M4 10h16M4 14h16M4 18h12" />
        </svg>
        <p className="text-sm text-text-muted">Queue is empty</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {queue.map((song, index) => {
        const isCurrent = index === currentIndex;
        return (
          <div
            key={`${song.id}-${index}`}
            role="button"
            tabIndex={0}
            onClick={() => skipToIndex(index)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skipToIndex(index); } }}
            className={`group flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white/5 ${
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
              onClick={(e) => { e.stopPropagation(); removeFromQueue(index); }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
              aria-label="Remove"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
