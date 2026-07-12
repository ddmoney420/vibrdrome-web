import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import FolderDetailScreen from './FolderDetailScreen';
import FolderBrowserScreen from './FolderBrowserScreen';
import { useMusicFolderStore } from '../stores/musicFolderStore';

// Music folder IDs and directory IDs are separate namespaces on Subsonic servers:
// a library root must be browsed with getIndexes, and only the directory IDs it
// returns are valid arguments to getMusicDirectory. Passing a music folder ID to
// getMusicDirectory is what caused the "Folder not found." bug (#92).

const mocks = vi.hoisted(() => ({
  getIndexes: vi.fn(),
  getMusicDirectory: vi.fn(),
  getMusicFolders: vi.fn(),
  playSongs: vi.fn(),
}));

vi.mock('../api/SubsonicClient', () => ({
  getSubsonicClient: () => ({
    getIndexes: mocks.getIndexes,
    getMusicDirectory: mocks.getMusicDirectory,
    getMusicFolders: mocks.getMusicFolders,
    getCoverArt: (id: string) => `https://music.example.com/art/${id}`,
    coverArtUrl: (id: string) => `https://music.example.com/art/${id}`,
  }),
}));

vi.mock('../stores/playerStore', () => {
  const state = { playSongs: mocks.playSongs, currentSong: null, isPlaying: false };
  const usePlayerStore = (selector?: (s: typeof state) => unknown) =>
    (selector ? selector(state) : state);
  usePlayerStore.getState = () => state;
  return { usePlayerStore };
});

/** Renders the folder routes exactly as App.tsx wires them. */
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/folders" element={<FolderBrowserScreen />} />
        <Route path="/folders/:musicFolderId" element={<FolderDetailScreen />} />
        <Route path="/folder/:folderId" element={<FolderDetailScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useMusicFolderStore.setState({ folders: [], loaded: false });
  mocks.getMusicFolders.mockResolvedValue([{ id: '1', name: 'Music Library' }]);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('FolderDetailScreen', () => {
  describe('library root (/folders/:musicFolderId)', () => {
    it('browses with getIndexes and never with getMusicDirectory', async () => {
      mocks.getIndexes.mockResolvedValue({
        index: [{ name: 'A', artist: [{ id: 'dir-abba', name: 'ABBA' }] }],
      });

      renderAt('/folders/1');

      await screen.findByText('ABBA');
      expect(mocks.getIndexes).toHaveBeenCalledWith('1');
      // The regression: a music folder ID must never reach getMusicDirectory.
      expect(mocks.getMusicDirectory).not.toHaveBeenCalled();
    });

    it('lists directories from every index group', async () => {
      mocks.getIndexes.mockResolvedValue({
        index: [
          { name: 'A', artist: [{ id: 'dir-abba', name: 'ABBA' }] },
          { name: 'B', artist: [{ id: 'dir-beatles', name: 'The Beatles' }] },
        ],
      });

      renderAt('/folders/1');

      expect(await screen.findByText('ABBA')).toBeInTheDocument();
      expect(screen.getByText('The Beatles')).toBeInTheDocument();
    });

    it('renders loose files sitting at the library root', async () => {
      mocks.getIndexes.mockResolvedValue({
        index: [{ name: 'A', artist: [{ id: 'dir-abba', name: 'ABBA' }] }],
        child: [
          { id: 'song-1', title: 'Loose Track', isDir: false, duration: 65 },
          { id: 'dir-x', title: 'Not A Song', isDir: true },
        ],
      });

      renderAt('/folders/1');

      expect(await screen.findByText('Loose Track')).toBeInTheDocument();
      // A child marked isDir must not be rendered as a playable song.
      expect(screen.queryByText('Not A Song')).not.toBeInTheDocument();
    });

    it('titles a deep-linked root by loading the music folder list', async () => {
      mocks.getIndexes.mockResolvedValue({ index: [] });

      renderAt('/folders/1');

      // The name is not in the getIndexes payload, so it comes from getMusicFolders.
      expect(await screen.findByText('Music Library')).toBeInTheDocument();
      expect(mocks.getMusicFolders).toHaveBeenCalled();
    });

    it('does not refetch contents when the folder list arrives', async () => {
      mocks.getIndexes.mockResolvedValue({ index: [] });

      renderAt('/folders/1');

      await screen.findByText('Music Library');
      await waitFor(() => expect(useMusicFolderStore.getState().loaded).toBe(true));
      expect(mocks.getIndexes).toHaveBeenCalledTimes(1);
    });

    it('handles a music folder whose ID is "0" (Gonic)', async () => {
      // Gonic's only music folder is id 0. Any truthiness check on the ID would
      // drop this route into the directory branch and break browsing entirely.
      useMusicFolderStore.setState({ folders: [{ id: '0', name: 'music' }], loaded: true });
      mocks.getIndexes.mockResolvedValue({
        index: [{ name: 'A', artist: [{ id: 'al-2', name: 'ABBA' }] }],
      });

      renderAt('/folders/0');

      expect(await screen.findByText('ABBA')).toBeInTheDocument();
      expect(mocks.getIndexes).toHaveBeenCalledWith('0');
      expect(mocks.getMusicDirectory).not.toHaveBeenCalled();
      expect(screen.getByText('music')).toBeInTheDocument();
    });

    it('shows "Folder not found." when the server errors', async () => {
      mocks.getIndexes.mockRejectedValue(new Error('boom'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      renderAt('/folders/1');

      expect(await screen.findByText('Folder not found.')).toBeInTheDocument();
    });
  });

  describe('directory (/folder/:folderId)', () => {
    it('browses with getMusicDirectory and never with getIndexes', async () => {
      mocks.getMusicDirectory.mockResolvedValue({
        id: 'dir-abba',
        name: 'ABBA',
        child: [{ id: 'song-1', title: 'Waterloo', isDir: false, duration: 168 }],
      });

      renderAt('/folder/dir-abba');

      await screen.findByText('Waterloo');
      expect(mocks.getMusicDirectory).toHaveBeenCalledWith('dir-abba');
      expect(mocks.getIndexes).not.toHaveBeenCalled();
    });

    it('separates subdirectories from songs', async () => {
      mocks.getMusicDirectory.mockResolvedValue({
        id: 'dir-abba',
        name: 'ABBA',
        child: [
          { id: 'dir-gold', title: 'Gold', isDir: true },
          { id: 'song-1', title: 'Waterloo', isDir: false },
        ],
      });

      renderAt('/folder/dir-abba');

      expect(await screen.findByText('Gold')).toBeInTheDocument();
      expect(screen.getByText('Waterloo')).toBeInTheDocument();
    });

    it('reports an empty directory', async () => {
      mocks.getMusicDirectory.mockResolvedValue({ id: 'dir-x', name: 'Empty', child: [] });

      renderAt('/folder/dir-x');

      expect(await screen.findByText('This folder is empty.')).toBeInTheDocument();
    });
  });

  // The exact reproduction from issue #92: Folders -> library root -> child directory.
  describe('full flow from the Folders list (regression: issue #92)', () => {
    it('opens a library folder without passing its ID to getMusicDirectory', async () => {
      mocks.getIndexes.mockResolvedValue({
        index: [{ name: 'A', artist: [{ id: 'dir-abba', name: 'ABBA' }] }],
      });

      renderAt('/folders');
      fireEvent.click(await screen.findByText('Music Library'));

      // Previously this navigated to /folder/1, sending the music folder ID to
      // getMusicDirectory, which every server rejects -> "Folder not found."
      expect(await screen.findByText('ABBA')).toBeInTheDocument();
      expect(screen.queryByText('Folder not found.')).not.toBeInTheDocument();
      await waitFor(() => expect(mocks.getIndexes).toHaveBeenCalledWith('1'));
      expect(mocks.getMusicDirectory).not.toHaveBeenCalled();
    });

    it('descends from the library root into a child directory', async () => {
      mocks.getIndexes.mockResolvedValue({
        index: [{ name: 'A', artist: [{ id: 'dir-abba', name: 'ABBA' }] }],
      });
      mocks.getMusicDirectory.mockResolvedValue({
        id: 'dir-abba',
        name: 'ABBA',
        child: [{ id: 'song-1', title: 'Waterloo', isDir: false }],
      });

      renderAt('/folders');
      fireEvent.click(await screen.findByText('Music Library'));
      fireEvent.click(await screen.findByText('ABBA'));

      expect(await screen.findByText('Waterloo')).toBeInTheDocument();
      expect(mocks.getMusicDirectory).toHaveBeenCalledWith('dir-abba');
      expect(mocks.getMusicDirectory).not.toHaveBeenCalledWith('1');
    });
  });

  describe('navigation from root into a directory', () => {
    it('hands the directory ID from getIndexes to getMusicDirectory', async () => {
      mocks.getIndexes.mockResolvedValue({
        index: [{ name: 'A', artist: [{ id: 'dir-abba', name: 'ABBA' }] }],
      });
      mocks.getMusicDirectory.mockResolvedValue({
        id: 'dir-abba',
        name: 'ABBA',
        child: [{ id: 'song-1', title: 'Waterloo', isDir: false }],
      });

      renderAt('/folders/1');
      fireEvent.click(await screen.findByText('ABBA'));

      // The ID handed over must be the directory ID from getIndexes, not the root's "1".
      await waitFor(() => expect(mocks.getMusicDirectory).toHaveBeenCalledWith('dir-abba'));
      expect(await screen.findByText('Waterloo')).toBeInTheDocument();
    });
  });

  describe('cancellation guard', () => {
    it('ignores a response that resolves after unmount', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let resolveIndexes!: (v: unknown) => void;
      mocks.getIndexes.mockReturnValue(new Promise((res) => { resolveIndexes = res; }));

      const { unmount } = renderAt('/folders/1');
      unmount();

      // The in-flight request lands with nobody listening; it must not touch state.
      resolveIndexes({ index: [{ name: 'A', artist: [{ id: 'dir-abba', name: 'ABBA' }] }] });
      await Promise.resolve();

      expect(errorSpy).not.toHaveBeenCalled();
    });
  });
});
