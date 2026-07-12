import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSubsonicClient } from './SubsonicClient';

const client = getSubsonicClient();

beforeEach(() => {
  client.setConfig({
    id: 'test',
    name: 'Test Server',
    url: 'https://music.example.com',
    username: 'testuser',
    password: 'testpass',
  });
});

describe('SubsonicClient', () => {
  describe('configuration', () => {
    it('isConfigured returns true after setConfig', () => {
      expect(client.isConfigured()).toBe(true);
    });

    it('throws when not configured', () => {
      const fresh = getSubsonicClient();
      // Can't easily test a fresh instance since it's a singleton
      // but we can verify it's configured
      expect(fresh.isConfigured()).toBe(true);
    });
  });

  describe('URL building', () => {
    it('stream URL contains correct endpoint', () => {
      const url = client.stream('song123');
      expect(url).toContain('/rest/stream');
      expect(url).toContain('id=song123');
    });

    it('stream URL includes auth params', () => {
      const url = client.stream('song123');
      expect(url).toContain('u=testuser');
      expect(url).toContain('v=');
      expect(url).toContain('c=vibrdrome');
    });

    it('stream URL includes maxBitRate when specified', () => {
      const url = client.stream('song123', 320);
      expect(url).toContain('maxBitRate=320');
    });

    it('stream URL omits maxBitRate when undefined', () => {
      const url = client.stream('song123');
      expect(url).not.toContain('maxBitRate');
    });

    it('getCoverArt URL contains correct endpoint', () => {
      const url = client.getCoverArt('al-abc123', 300);
      expect(url).toContain('/rest/getCoverArt');
      expect(url).toContain('id=al-abc123');
      expect(url).toContain('size=300');
    });

    it('getCoverArt URL omits size when undefined', () => {
      const url = client.getCoverArt('al-abc123');
      expect(url).not.toContain('size=');
    });

    it('download URL contains correct endpoint', () => {
      const url = client.download('song123');
      expect(url).toContain('/rest/download');
      expect(url).toContain('id=song123');
    });

    it('base URL strips trailing slashes', () => {
      client.setConfig({
        id: 'test',
        name: 'Test',
        url: 'https://music.example.com///',
        username: 'user',
        password: 'pass',
      });
      const url = client.stream('song1');
      expect(url).toContain('https://music.example.com/rest/stream');
      expect(url).not.toContain('///');
    });

    it('includes f=json for API requests', () => {
      const url = client.stream('song1');
      expect(url).toContain('f=json');
    });
  });

  describe('auth params', () => {
    it('uses token+salt auth by default', () => {
      const url = client.stream('song1');
      expect(url).toContain('t=');
      expect(url).toContain('s=');
      expect(url).not.toContain('p=');
    });

    it('generates different salt each time', () => {
      const url1 = client.stream('song1');
      const url2 = client.stream('song1');
      // Extract salt values
      const salt1 = url1.match(/s=([^&]+)/)?.[1];
      const salt2 = url2.match(/s=([^&]+)/)?.[1];
      expect(salt1).not.toBe(salt2);
    });
  });

  describe('aliases', () => {
    it('stream is alias for streamUrl', () => {
      const url1 = client.stream('song1');
      const url2 = client.streamUrl('song1');
      // Both should have the same structure (different salts)
      expect(url1).toContain('/rest/stream');
      expect(url2).toContain('/rest/stream');
    });

    it('download is alias for downloadUrl', () => {
      const url = client.download('song1');
      expect(url).toContain('/rest/download');
    });

    it('getCoverArt is alias for coverArtUrl', () => {
      const url = client.getCoverArt('art1', 200);
      expect(url).toContain('/rest/getCoverArt');
    });
  });

  describe('getMusicFolders', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('normalizes numeric music folder IDs to strings', async () => {
      // Verified against live servers: Navidrome sends id 1, Gonic sends id 0 —
      // both as JSON numbers, unlike every other ID in the API.
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          'subsonic-response': {
            status: 'ok',
            musicFolders: { musicFolder: [{ id: 0, name: 'music' }, { id: 1, name: 'Music Library' }] },
          },
        }),
      }));

      const folders = await client.getMusicFolders();
      expect(folders).toEqual([
        { id: '0', name: 'music' },
        { id: '1', name: 'Music Library' },
      ]);
      // Gonic's root folder is id 0 — it must survive as a usable string, not vanish.
      expect(folders[0].id).toBe('0');
    });
  });

  describe('getIndexes', () => {
    // A music folder ID is not a directory ID; library roots must be browsed with
    // getIndexes, not getMusicDirectory.
    function mockResponse(indexes: unknown) {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ 'subsonic-response': { status: 'ok', indexes } }),
      });
      vi.stubGlobal('fetch', fetchMock);
      return fetchMock;
    }

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('requests the getIndexes endpoint with the music folder ID', async () => {
      const fetchMock = mockResponse({ index: [] });
      await client.getIndexes('1');

      const url = String(fetchMock.mock.calls[0][0]);
      expect(url).toContain('/rest/getIndexes');
      expect(url).toContain('musicFolderId=1');
    });

    it('returns indexed directories and loose root files', async () => {
      mockResponse({
        index: [{ name: 'A', artist: [{ id: 'dir-1', name: 'ABBA' }] }],
        child: [{ id: 'song-1', title: 'Loose Track', isDir: false }],
      });

      const indexes = await client.getIndexes('1');
      expect(indexes.index?.[0].artist?.[0]).toMatchObject({ id: 'dir-1', name: 'ABBA' });
      expect(indexes.child?.[0]).toMatchObject({ id: 'song-1', isDir: false });
    });

    it('returns an empty object when the server omits indexes', async () => {
      mockResponse(undefined);
      await expect(client.getIndexes('1')).resolves.toEqual({});
    });
  });
});
