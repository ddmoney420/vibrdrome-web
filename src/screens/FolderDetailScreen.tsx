import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubsonicClient } from '../api/SubsonicClient';
import { usePlayerStore } from '../stores/playerStore';
import type { MusicDirectory, DirectoryChild, Song } from '../types/subsonic';
import { Header, SongRow, LoadingSpinner } from '../components/common';

/** Convert a DirectoryChild to a Song for playback. */
function childToSong(child: DirectoryChild): Song {
  return {
    id: child.id,
    title: child.title ?? 'Unknown',
    artist: child.artist,
    album: child.album,
    coverArt: child.coverArt,
    duration: child.duration,
    track: child.track,
    year: child.year,
    genre: child.genre,
    size: child.size,
    suffix: child.suffix,
    bitRate: child.bitRate,
    contentType: child.contentType,
    path: child.path,
    parent: child.parent,
    starred: child.starred,
    created: child.created,
  };
}

export default function FolderDetailScreen() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const playSongs = usePlayerStore((s) => s.playSongs);
  const [directory, setDirectory] = useState<MusicDirectory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!folderId) return;
    const load = async () => {
      try {
        const client = getSubsonicClient();
        const data = await client.getMusicDirectory(folderId);
        setDirectory(data);
      } catch (err) {
        console.error('Failed to load directory:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [folderId]);

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title="Folder" showBack />
        <LoadingSpinner />
      </div>
    );
  }

  if (!directory) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title="Folder" showBack />
        <p className="px-4 py-8 text-center text-text-muted">Folder not found.</p>
      </div>
    );
  }

  const children = directory.child ?? [];
  const subfolders = children.filter((c) => c.isDir);
  const files = children.filter((c) => !c.isDir);
  const fileSongs = files.map(childToSong);

  const handlePlayFrom = (index: number) => {
    playSongs(fileSongs, index);
  };

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title={directory.name ?? 'Folder'} showBack />

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Subfolders */}
        {subfolders.length > 0 && (
          <div>
            {subfolders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => navigate(`/folder/${folder.id}`)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-bg-tertiary active:bg-bg-tertiary"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5 text-accent"
                  >
                    <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
                  </svg>
                </div>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
                  {folder.title ?? 'Unknown folder'}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-text-muted">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Divider between folders and songs */}
        {subfolders.length > 0 && files.length > 0 && (
          <div className="mx-4 my-1 border-t border-border" />
        )}

        {/* Songs */}
        {files.length > 0 && (
          <div className="px-1">
            {fileSongs.map((song, i) => (
              <SongRow
                key={song.id}
                song={song}
                showTrackNumber
                showAlbum
                onPlay={() => handlePlayFrom(i)}
              />
            ))}
          </div>
        )}

        {children.length === 0 && (
          <p className="py-8 text-center text-text-muted">This folder is empty.</p>
        )}
      </div>
    </div>
  );
}
