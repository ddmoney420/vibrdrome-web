import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubsonicClient } from '../api/SubsonicClient';
import { usePlayerStore } from '../stores/playerStore';
import { shareUrl } from '../utils/share';
import { useArtistInfo } from '../hooks/useArtistInfo';
import type { Artist, Song } from '../types/subsonic';
import { useArtistImage } from '../hooks/useArtistImage';
import { Header, AlbumCard, CoverArt, LoadingSpinner } from '../components/common';

export default function ArtistDetailScreen() {
  const { artistId } = useParams<{ artistId: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!artistId) return;
    const load = async () => {
      try {
        const client = getSubsonicClient();
        const data = await client.getArtist(artistId);
        setArtist(data);
      } catch (err) {
        console.error('Failed to load artist:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [artistId]);

  const handleRadio = async () => {
    if (!artist) return;
    try {
      const client = getSubsonicClient();
      const [similar, top] = await Promise.all([
        client.getSimilarSongs2(artist.id, 30).catch(() => [] as Song[]),
        client.getTopSongs(artist.name, 20).catch(() => [] as Song[]),
      ]);
      // Interleave and deduplicate
      const seen = new Set<string>();
      const songs: Song[] = [];
      const maxLen = Math.max(similar.length, top.length);
      for (let i = 0; i < maxLen && songs.length < 50; i++) {
        if (i < similar.length && !seen.has(similar[i].id)) {
          seen.add(similar[i].id);
          songs.push(similar[i]);
        }
        if (i < top.length && !seen.has(top[i].id)) {
          seen.add(top[i].id);
          songs.push(top[i]);
        }
      }
      if (songs.length > 0) {
        usePlayerStore.getState().playSongs(songs);
      }
    } catch (err) {
      console.error('Failed to start artist radio:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title="Artist" showBack />
        <LoadingSpinner />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title="Artist" showBack />
        <p className="px-4 py-8 text-center text-text-muted">Artist not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header
        title={artist.name}
        showBack
        rightActions={
          <>
          <button
            onClick={() => shareUrl(artist.name)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            aria-label="Share"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <button
            onClick={handleRadio}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            aria-label="Artist radio"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Artist bio from Last.fm */}
        <ArtistBio artistName={artist.name} />

        {/* Albums */}
        <h3 className="mb-3 mt-2 text-sm font-semibold uppercase tracking-wider text-text-muted">Discography</h3>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
          {artist.album?.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>

        {(!artist.album || artist.album.length === 0) && (
          <p className="py-8 text-center text-text-muted">No albums found.</p>
        )}
      </div>
    </div>
  );
}

function ArtistBio({ artistName }: { artistName: string }) {
  const navigate = useNavigate();
  const [viewingArtist, setViewingArtist] = useState(artistName);
  const [expanded, setExpanded] = useState(false);
  const [trackedName, setTrackedName] = useState(artistName);

  // Reset when parent artist changes (derived state)
  if (trackedName !== artistName) {
    setTrackedName(artistName);
    setViewingArtist(artistName);
    setExpanded(false);
  }

  const isViewingDifferent = viewingArtist !== artistName;
  const { info, loading, hasApiKey } = useArtistInfo(viewingArtist);
  const { imageUrl: artistImage, coverArt: artistCoverArt, artistId } = useArtistImage(viewingArtist);

  if (!hasApiKey) return null;
  if (loading) {
    return (
      <div className="mb-4 flex items-center gap-2 text-xs text-text-muted">
        <div className="h-3 w-3 animate-spin rounded-full border border-bg-tertiary border-t-accent" />
        Loading artist info...
      </div>
    );
  }
  if (!info) return null;

  const bio = expanded ? info.bio.content : info.bio.summary;
  const showExpand = info.bio.content.length > info.bio.summary.length;

  return (
    <div className="mb-6 space-y-4">
      {/* Back button when viewing different artist */}
      {isViewingDifferent && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewingArtist(artistName)}
            className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Back to {artistName}
          </button>
          {/* Header for the browsed artist */}
          <div className="flex items-center gap-2">
            {artistCoverArt ? (
              <CoverArt coverArt={artistCoverArt} size={32} className="!rounded-full" />
            ) : artistImage ? (
              <img src={artistImage} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : null}
            <span className="text-sm font-bold text-text-primary">{info.name}</span>
            {artistId && (
              <button
                onClick={() => navigate(`/artist/${artistId}`)}
                className="rounded-full bg-bg-tertiary px-2 py-0.5 text-[10px] font-medium text-text-secondary hover:text-text-primary"
              >
                View
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bio */}
      {bio && (
        <div>
          <p className="text-sm leading-relaxed text-text-secondary">
            {bio}
          </p>
          {showExpand && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-xs font-medium text-accent hover:underline"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {/* Tags */}
      {info.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {info.tags.slice(0, 6).map((tag) => (
            <span key={tag} className="rounded-full bg-bg-tertiary px-2.5 py-1 text-[10px] font-medium text-text-secondary">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      {(info.listeners || info.playcount) && (
        <div className="flex gap-4 text-xs text-text-muted">
          {info.listeners && <span>{Number(info.listeners).toLocaleString()} listeners</span>}
          {info.playcount && <span>{Number(info.playcount).toLocaleString()} plays</span>}
        </div>
      )}

      {/* Similar artists */}
      {info.similar.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-text-muted">Similar Artists</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {info.similar.map((s) => (
              <SimilarArtistCard key={s.name} name={s.name} onBrowse={setViewingArtist} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SimilarArtistCard({ name, onBrowse }: { name: string; onBrowse: (name: string) => void }) {
  const navigate = useNavigate();
  const { imageUrl, artistId, coverArt } = useArtistImage(name);

  return (
    <button
      onClick={() => {
        if (artistId) {
          navigate(`/artist/${artistId}`);
        } else {
          onBrowse(name);
        }
      }}
      className="flex w-20 shrink-0 flex-col items-center gap-1.5 text-center"
    >
      {coverArt ? (
        <CoverArt coverArt={coverArt} size={64} className="!rounded-full" />
      ) : imageUrl ? (
        <img src={imageUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-tertiary text-text-muted">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
            <path strokeLinecap="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
      <span className="truncate text-[10px] font-medium text-text-secondary w-full">{name}</span>
    </button>
  );
}
