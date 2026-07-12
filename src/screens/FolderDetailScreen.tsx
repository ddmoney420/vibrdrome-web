import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubsonicClient } from '../api/SubsonicClient';
import { usePlayerStore } from '../stores/playerStore';
import { useMusicFolderStore } from '../stores/musicFolderStore';
import type { DirectoryChild, Song } from '../types/subsonic';
import { Header, SongRow, LoadingSpinner } from '../components/common';

/** Normalized folder contents, from either a music folder root or a directory. */
interface FolderContents {
  /** Only a directory response carries its own name; a root's comes from the folder list. */
  name?: string;
  subfolders: { id: string; name: string }[];
  songs: Song[];
}

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
  // Exactly one of these is set, depending on the matched route. Music folder IDs
  // (library roots) and directory IDs are separate namespaces on Subsonic servers
  // and are browsed with different endpoints.
  const { folderId, musicFolderId } = useParams<{ folderId?: string; musicFolderId?: string }>();
  const navigate = useNavigate();
  const playSongs = usePlayerStore((s) => s.playSongs);
  const musicFolders = useMusicFolderStore((s) => s.folders);
  const foldersLoaded = useMusicFolderStore((s) => s.loaded);
  const loadFolders = useMusicFolderStore((s) => s.loadFolders);
  const [contents, setContents] = useState<FolderContents | null>(null);
  const [loading, setLoading] = useState(true);

  // A library root's name comes from the music folder list, not from getIndexes,
  // so it has to be fetched separately when someone deep-links to /folders/:id.
  useEffect(() => {
    if (musicFolderId && !foldersLoaded) loadFolders();
  }, [musicFolderId, foldersLoaded, loadFolders]);

  useEffect(() => {
    if (!folderId && !musicFolderId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const client = getSubsonicClient();
        let next: FolderContents;

        if (musicFolderId) {
          const indexes = await client.getIndexes(musicFolderId);
          next = {
            subfolders: (indexes.index ?? []).flatMap((idx) =>
              (idx.artist ?? []).map((a) => ({ id: a.id, name: a.name })),
            ),
            songs: (indexes.child ?? []).filter((c) => !c.isDir).map(childToSong),
          };
        } else {
          const dir = await client.getMusicDirectory(folderId!);
          const children = dir.child ?? [];
          next = {
            name: dir.name,
            subfolders: children
              .filter((c) => c.isDir)
              .map((c) => ({ id: c.id, name: c.title ?? 'Unknown folder' })),
            songs: children.filter((c) => !c.isDir).map(childToSong),
          };
        }

        if (!cancelled) setContents(next);
      } catch (err) {
        console.error('Failed to load folder:', err);
        if (!cancelled) setContents(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [folderId, musicFolderId]);

  // Derived, not fetched: the folder list arriving late must not refetch contents.
  const title = musicFolderId
    ? musicFolders.find((f) => f.id === musicFolderId)?.name ?? 'Folder'
    : contents?.name ?? 'Folder';

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title={title} showBack />
        <LoadingSpinner />
      </div>
    );
  }

  if (!contents) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title={title} showBack />
        <p className="px-4 py-8 text-center text-text-muted">Folder not found.</p>
      </div>
    );
  }

  const { subfolders, songs: fileSongs } = contents;
  const isEmpty = subfolders.length === 0 && fileSongs.length === 0;

  const handlePlayFrom = (index: number) => {
    playSongs(fileSongs, index);
  };

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title={title} showBack />

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
                  {folder.name}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-text-muted">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Divider between folders and songs */}
        {subfolders.length > 0 && fileSongs.length > 0 && (
          <div className="mx-4 my-1 border-t border-border" />
        )}

        {/* Songs */}
        {fileSongs.length > 0 && (
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

        {isEmpty && (
          <p className="py-8 text-center text-text-muted">This folder is empty.</p>
        )}
      </div>
    </div>
  );
}
