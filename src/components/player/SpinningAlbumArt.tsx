import { usePlayerStore } from '../../stores/playerStore';
import { useUIStore } from '../../stores/uiStore';
import CoverArt from '../common/CoverArt';

interface SpinningAlbumArtProps {
  coverArt?: string;
  size?: number;
  className?: string;
}

export default function SpinningAlbumArt({ coverArt, size, className = '' }: SpinningAlbumArtProps) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const reduceMotion = useUIStore((s) => s.reduceMotion);

  const shouldSpin = isPlaying && !reduceMotion;

  return (
    <div
      className={`aspect-square ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Vinyl disc — fills parent */}
      <div
        className="h-full w-full rounded-full bg-black shadow-xl"
        style={{
          animation: shouldSpin ? 'spin-album 8s linear infinite' : 'none',
        }}
      >
        <div className="relative h-full w-full">
          {/* Vinyl grooves */}
          <div className="absolute inset-[8%] rounded-full border border-white/5" />
          <div className="absolute inset-[16%] rounded-full border border-white/5" />
          <div className="absolute inset-[24%] rounded-full border border-white/5" />
          <div className="absolute inset-[32%] rounded-full border border-white/5" />

          {/* Album art in center */}
          <div className="absolute inset-[15%] overflow-hidden rounded-full">
            <CoverArt
              coverArt={coverArt}
              className="!h-full !w-full !rounded-full"
            />
          </div>

          {/* Center hole */}
          <div className="absolute inset-[46%] rounded-full bg-bg-primary/80 shadow-inner" />
        </div>
      </div>
    </div>
  );
}
