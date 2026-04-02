import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../stores/playerStore';
import { useArtistInfo } from '../../hooks/useArtistInfo';
import { useArtistImage } from '../../hooks/useArtistImage';
import { useUIStore } from '../../stores/uiStore';
import CoverArt from '../common/CoverArt';
import { useState } from 'react';

export default function NowPlayingArtist() {
  const navigate = useNavigate();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const hasApiKey = !!useUIStore((s) => s.lastfmApiKey);
  const { info, loading } = useArtistInfo(currentSong?.artist);
  const { imageUrl: artistImage, coverArt: artistCoverArt } = useArtistImage(currentSong?.artist);
  const [expanded, setExpanded] = useState(false);

  if (!hasApiKey) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-sm text-text-muted">Add a Last.fm API key in Settings to see artist info</p>
        <button
          onClick={() => navigate('/settings')}
          className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20"
        >
          Go to Settings
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-bg-tertiary border-t-accent" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-text-muted">No artist info available</p>
      </div>
    );
  }

  const bio = expanded ? info.bio.content : info.bio.summary;
  const showExpand = info.bio.content.length > info.bio.summary.length;

  return (
    <div className="overflow-y-auto px-4 py-4 space-y-4">
      {/* Artist header */}
      <div className="flex items-center gap-3">
        {artistCoverArt ? (
          <CoverArt coverArt={artistCoverArt} size={56} className="!rounded-full" />
        ) : artistImage ? (
          <img src={artistImage} alt="" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6 text-white/40">
              <path strokeLinecap="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-white">{info.name}</h3>
          <div className="flex gap-3 text-[10px] text-white/40">
            {info.listeners && <span>{Number(info.listeners).toLocaleString()} listeners</span>}
            {info.playcount && <span>{Number(info.playcount).toLocaleString()} plays</span>}
          </div>
        </div>
        {/* Navigate to full artist page */}
        {currentSong?.artistId && (
          <button
            onClick={() => navigate(`/artist/${currentSong.artistId}`)}
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/60 hover:bg-white/20"
          >
            View
          </button>
        )}
      </div>

      {/* Tags */}
      {info.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {info.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/40">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Bio */}
      {bio && (
        <div>
          <p className="text-xs leading-relaxed text-white/50">{bio}</p>
          {showExpand && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-[10px] font-medium text-accent hover:underline"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {/* Similar artists */}
      {info.similar.length > 0 && (
        <div>
          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">Similar Artists</h4>
          <div className="space-y-1">
            {info.similar.map((s) => (
              <SimilarArtistRow key={s.name} name={s.name} navigate={navigate} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SimilarArtistRow({ name, navigate }: { name: string; navigate: (path: string) => void }) {
  const { imageUrl, artistId, coverArt } = useArtistImage(name);

  return (
    <button
      onClick={() => {
        if (artistId) {
          navigate(`/artist/${artistId}`);
        } else {
          navigate(`/search?q=${encodeURIComponent(name)}`);
        }
      }}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/5"
    >
      {coverArt ? (
        <CoverArt coverArt={coverArt} size={32} className="!rounded-full shrink-0" />
      ) : imageUrl ? (
        <img src={imageUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/30">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
            <path strokeLinecap="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
      <span className="truncate text-xs font-medium text-white/60">{name}</span>
    </button>
  );
}
