interface VisualizerHudProps {
  presetName: string;
  /** Active Milkdrop engine, or null in shader mode (no engine/status badges). */
  engine: 'projectm' | 'butterchurn' | null;
  index: number; // 1-based position
  total: number;
  autoAdvance: boolean;
  shuffle: boolean;
  frozen: boolean;
  /** Whether the current preset is favorited — shows a leading ★ in Milkdrop mode. */
  isFavorite?: boolean;
}

const badge = 'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide';

/**
 * Top-center HUD: the current preset name plus, in Milkdrop mode, a row of
 * status badges (engine, position, auto/shuffle/frozen). Pure/presentational —
 * the toast and transition polish live in VisualizerScreen.
 */
export default function VisualizerHud({ presetName, engine, index, total, autoAdvance, shuffle, frozen, isFavorite = false }: VisualizerHudProps) {
  // The ★ is a passive indicator; favorites only apply in Milkdrop mode (engine set).
  const showFavorite = isFavorite && engine != null;
  return (
    <div className="flex max-w-[60%] flex-col items-center gap-1">
      <span className="flex min-w-0 items-center gap-1 text-sm font-medium text-white/90">
        {showFavorite && (
          <span role="img" aria-label="Favorited" className="shrink-0 text-amber-300">★</span>
        )}
        <span className="truncate">{presetName}</span>
      </span>
      {engine && (
        <div className="flex flex-wrap items-center justify-center gap-1">
          <span className={`${badge} flex items-center gap-1 bg-white/10 text-white/70`}>
            <span className={`h-1.5 w-1.5 rounded-full ${engine === 'projectm' ? 'bg-accent' : 'bg-sky-400'}`} />
            {engine === 'projectm' ? 'projectM' : 'butterchurn'}
          </span>
          {total > 0 && <span className={`${badge} bg-white/10 text-white/60`}>{index} / {total}</span>}
          {autoAdvance && <span className={`${badge} bg-accent/30 text-white/85`}>Auto</span>}
          {shuffle && <span className={`${badge} bg-accent/30 text-white/85`}>Shuffle</span>}
          {frozen && <span className={`${badge} bg-sky-500/30 text-white/85`}>Frozen</span>}
        </div>
      )}
    </div>
  );
}
