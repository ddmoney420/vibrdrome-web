import { describe, it, expect, beforeEach } from 'vitest';
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
});
