import md5 from 'md5';
import type {
  Album,
  AlbumListType,
  Artist,
  ArtistIndex,
  Genre,
  InternetRadioStation,
  MusicDirectory,
  MusicFolder,
  Playlist,
  PlayQueue,
  SearchResult3,
  ServerConfig,
  Song,
  Starred2,
  StructuredLyrics,
} from '../types/subsonic';

const API_VERSION = '1.16.1';
const CLIENT_NAME = 'vibrdrome';

function generateSalt(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = crypto.getRandomValues(new Uint32Array(length));
  let salt = '';
  for (let i = 0; i < length; i++) {
    salt += chars.charAt(randomValues[i] % chars.length);
  }
  return salt;
}

function toHex(str: string): string {
  return Array.from(str)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
}

class SubsonicClient {
  private config: ServerConfig | null = null;
  private useLegacyAuth = false;

  private extensionsCache: import('../types/subsonic').OpenSubsonicExtension[] | null = null;

  setConfig(config: ServerConfig): void {
    this.config = config;
    this.useLegacyAuth = config.useLegacyAuth ?? false;
    this.extensionsCache = null;
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  private getBaseUrl(): string {
    if (!this.config) throw new Error('SubsonicClient is not configured');
    return this.config.url.replace(/\/+$/, '');
  }

  private buildAuthParams(): string {
    if (!this.config) throw new Error('SubsonicClient is not configured');

    const common = `u=${encodeURIComponent(this.config.username)}&v=${API_VERSION}&c=${CLIENT_NAME}&f=json`;

    if (this.useLegacyAuth) {
      const hexPassword = `enc:${toHex(this.config.password)}`;
      return `${common}&p=${encodeURIComponent(hexPassword)}`;
    }

    const salt = generateSalt();
    const token = md5(this.config.password + salt);
    return `${common}&t=${token}&s=${salt}`;
  }

  private buildUrl(endpoint: string, params: Record<string, string | number | boolean | undefined> = {}): string {
    const base = `${this.getBaseUrl()}/rest/${endpoint}`;
    const authParams = this.buildAuthParams();

    const extraParams = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');

    const query = extraParams ? `${authParams}&${extraParams}` : authParams;
    return `${base}?${query}`;
  }

  private buildUrlWithMultiValue(
    endpoint: string,
    params: Record<string, string | number | boolean | undefined> = {},
    multiParams: Record<string, (string | number)[]> = {},
  ): string {
    const base = `${this.getBaseUrl()}/rest/${endpoint}`;
    const authParams = this.buildAuthParams();

    const singleParts = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);

    const multiParts = Object.entries(multiParams).flatMap(([k, values]) =>
      values.map((v) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`),
    );

    const allParts = [...singleParts, ...multiParts].join('&');
    const query = allParts ? `${authParams}&${allParts}` : authParams;
    return `${base}?${query}`;
  }

  private async request<T>(endpoint: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
    const url = this.buildUrl(endpoint, params);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    const subsonicResponse = json['subsonic-response'];

    if (!subsonicResponse) {
      throw new Error('Invalid Subsonic response format');
    }

    if (subsonicResponse.status !== 'ok') {
      const error = subsonicResponse.error;
      // Error code 40 = wrong username/password - try legacy auth fallback
      if (error?.code === 40 && !this.useLegacyAuth) {
        this.useLegacyAuth = true;
        return this.request<T>(endpoint, params);
      }
      throw new Error(`Subsonic error ${error?.code}: ${error?.message ?? 'Unknown error'}`);
    }

    return subsonicResponse as T;
  }

  private async requestMultiValue<T>(
    endpoint: string,
    params: Record<string, string | number | boolean | undefined> = {},
    multiParams: Record<string, (string | number)[]> = {},
  ): Promise<T> {
    const url = this.buildUrlWithMultiValue(endpoint, params, multiParams);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    const subsonicResponse = json['subsonic-response'];

    if (!subsonicResponse) {
      throw new Error('Invalid Subsonic response format');
    }

    if (subsonicResponse.status !== 'ok') {
      const error = subsonicResponse.error;
      if (error?.code === 40 && !this.useLegacyAuth) {
        this.useLegacyAuth = true;
        return this.requestMultiValue<T>(endpoint, params, multiParams);
      }
      throw new Error(`Subsonic error ${error?.code}: ${error?.message ?? 'Unknown error'}`);
    }

    return subsonicResponse as T;
  }

  // --- System ---

  async ping(): Promise<void> {
    await this.request('ping');
  }

  // --- Browsing ---

  async getArtists(musicFolderId?: string): Promise<ArtistIndex[]> {
    const data = await this.request<{ artists: { index?: ArtistIndex[] } }>('getArtists', {
      musicFolderId,
    });
    return data.artists?.index ?? [];
  }

  async getArtist(id: string): Promise<Artist> {
    const data = await this.request<{ artist: Artist }>('getArtist', { id });
    return data.artist;
  }

  async getAlbum(id: string): Promise<Album> {
    const data = await this.request<{ album: Album }>('getAlbum', { id });
    return data.album;
  }

  async getSong(id: string): Promise<Song> {
    const data = await this.request<{ song: Song }>('getSong', { id });
    return data.song;
  }

  async getGenres(): Promise<Genre[]> {
    const data = await this.request<{ genres: { genre?: Genre[] } }>('getGenres');
    return data.genres?.genre ?? [];
  }

  async getMusicFolders(): Promise<MusicFolder[]> {
    const data = await this.request<{ musicFolders: { musicFolder?: MusicFolder[] } }>('getMusicFolders');
    return data.musicFolders?.musicFolder ?? [];
  }

  async getIndexes(musicFolderId?: string): Promise<ArtistIndex[]> {
    const data = await this.request<{ indexes: { index?: ArtistIndex[] } }>('getIndexes', {
      musicFolderId,
    });
    return data.indexes?.index ?? [];
  }

  async getMusicDirectory(id: string): Promise<MusicDirectory> {
    const data = await this.request<{ directory: MusicDirectory }>('getMusicDirectory', { id });
    return data.directory;
  }

  // --- Album/Song Lists ---

  async getAlbumList2(
    type: AlbumListType,
    size: number,
    offset?: number,
    genre?: string,
    fromYear?: number,
    toYear?: number,
    musicFolderId?: string,
  ): Promise<Album[]> {
    const data = await this.request<{ albumList2: { album?: Album[] } }>('getAlbumList2', {
      type,
      size,
      offset,
      genre,
      fromYear,
      toYear,
      musicFolderId,
    });
    return data.albumList2?.album ?? [];
  }

  async getRandomSongs(size: number, genre?: string, musicFolderId?: string): Promise<Song[]> {
    const data = await this.request<{ randomSongs: { song?: Song[] } }>('getRandomSongs', {
      size,
      genre,
      musicFolderId,
    });
    return data.randomSongs?.song ?? [];
  }

  async getStarred2(): Promise<Starred2> {
    const data = await this.request<{ starred2: Starred2 }>('getStarred2');
    return data.starred2 ?? { artist: [], album: [], song: [] };
  }

  // --- Search ---

  async search3(
    query: string,
    artistCount?: number,
    albumCount?: number,
    songCount?: number,
    musicFolderId?: string,
  ): Promise<SearchResult3> {
    const data = await this.request<{ searchResult3: SearchResult3 }>('search3', {
      query,
      artistCount,
      albumCount,
      songCount,
      musicFolderId,
    });
    return data.searchResult3 ?? { artist: [], album: [], song: [] };
  }

  // --- Starring / Rating ---

  async star(id?: string, albumId?: string, artistId?: string): Promise<void> {
    await this.request('star', { id, albumId, artistId });
  }

  async unstar(id?: string, albumId?: string, artistId?: string): Promise<void> {
    await this.request('unstar', { id, albumId, artistId });
  }

  async setRating(id: string, rating: number): Promise<void> {
    await this.request('setRating', { id, rating });
  }

  async scrobble(id: string, submission: boolean): Promise<void> {
    await this.request('scrobble', { id, submission });
  }

  // --- Playlists ---

  async getPlaylists(): Promise<Playlist[]> {
    const data = await this.request<{ playlists: { playlist?: Playlist[] } }>('getPlaylists');
    return data.playlists?.playlist ?? [];
  }

  async getPlaylist(id: string): Promise<Playlist> {
    const data = await this.request<{ playlist: Playlist }>('getPlaylist', { id });
    return data.playlist;
  }

  async createPlaylist(name: string, songIds: string[]): Promise<Playlist> {
    const data = await this.requestMultiValue<{ playlist: Playlist }>(
      'createPlaylist',
      { name },
      { songId: songIds },
    );
    return data.playlist;
  }

  async updatePlaylist(
    playlistId: string,
    params: {
      name?: string;
      comment?: string;
      public?: boolean;
      songIdsToAdd?: string[];
      songIndexesToRemove?: number[];
    },
  ): Promise<void> {
    await this.requestMultiValue(
      'updatePlaylist',
      {
        playlistId,
        name: params.name,
        comment: params.comment,
        public: params.public,
      },
      {
        ...(params.songIdsToAdd?.length ? { songIdToAdd: params.songIdsToAdd } : {}),
        ...(params.songIndexesToRemove?.length ? { songIndexToRemove: params.songIndexesToRemove } : {}),
      },
    );
  }

  async deletePlaylist(id: string): Promise<void> {
    await this.request('deletePlaylist', { id });
  }

  // --- Media Retrieval (URL builders) ---

  streamUrl(id: string, maxBitRate?: number, format?: string): string {
    return this.buildUrl('stream', { id, maxBitRate, format });
  }

  downloadUrl(id: string): string {
    return this.buildUrl('download', { id });
  }

  coverArtUrl(id: string, size?: number): string {
    return this.buildUrl('getCoverArt', { id, size });
  }

  // Aliases matching the spec
  stream(id: string, maxBitRate?: number, format?: string): string {
    return this.streamUrl(id, maxBitRate, format);
  }

  download(id: string): string {
    return this.downloadUrl(id);
  }

  getCoverArt(id: string, size?: number): string {
    return this.coverArtUrl(id, size);
  }

  // --- Lyrics ---

  async getLyricsBySongId(id: string): Promise<StructuredLyrics[]> {
    const data = await this.request<{ lyricsList?: { structuredLyrics?: StructuredLyrics[] } }>(
      'getLyricsBySongId',
      { id },
    );
    return data.lyricsList?.structuredLyrics ?? [];
  }

  // --- Internet Radio ---

  async getInternetRadioStations(): Promise<InternetRadioStation[]> {
    const data = await this.request<{ internetRadioStations: { internetRadioStation?: InternetRadioStation[] } }>(
      'getInternetRadioStations',
    );
    return data.internetRadioStations?.internetRadioStation ?? [];
  }

  async createInternetRadioStation(streamUrl: string, name: string, homepageUrl?: string): Promise<void> {
    await this.request('createInternetRadioStation', {
      streamUrl,
      name,
      homepageUrl,
    });
  }

  async deleteInternetRadioStation(id: string): Promise<void> {
    await this.request('deleteInternetRadioStation', { id });
  }

  // --- Play Queue ---

  async getPlayQueue(): Promise<PlayQueue> {
    const data = await this.request<{ playQueue: PlayQueue }>('getPlayQueue');
    return data.playQueue ?? { entry: [] };
  }

  async savePlayQueue(ids: string[], current?: string, position?: number): Promise<void> {
    await this.requestMultiValue(
      'savePlayQueue',
      { current, position },
      { id: ids },
    );
  }

  // --- Index-Based Queue (OpenSubsonic) ---

  async getOpenSubsonicExtensions(): Promise<import('../types/subsonic').OpenSubsonicExtension[]> {
    if (this.extensionsCache !== null) return this.extensionsCache;
    try {
      const data = await this.request<{
        openSubsonicExtensions?: import('../types/subsonic').OpenSubsonicExtension[];
      }>('getOpenSubsonicExtensions');
      this.extensionsCache = data.openSubsonicExtensions ?? [];
    } catch {
      this.extensionsCache = [];
    }
    return this.extensionsCache;
  }

  async supportsIndexBasedQueue(): Promise<boolean> {
    const exts = await this.getOpenSubsonicExtensions();
    return exts.some((e) => e.name === 'indexBasedQueue');
  }

  async getPlayQueueByIndex(): Promise<import('../types/subsonic').PlayQueueByIndex> {
    const data = await this.request<{ playQueue: import('../types/subsonic').PlayQueueByIndex }>('getPlayQueueByIndex');
    return data.playQueue ?? { entry: [] };
  }

  async savePlayQueueByIndex(ids: string[], currentIndex: number, position?: number): Promise<void> {
    await this.requestMultiValue(
      'savePlayQueueByIndex',
      { currentIndex, position },
      { id: ids },
    );
  }

  // --- Similar / Top Songs ---

  async getSimilarSongs2(id: string, count?: number): Promise<Song[]> {
    const data = await this.request<{ similarSongs2: { song?: Song[] } }>('getSimilarSongs2', {
      id,
      count,
    });
    return data.similarSongs2?.song ?? [];
  }

  async getTopSongs(artist: string, count?: number): Promise<Song[]> {
    const data = await this.request<{ topSongs: { song?: Song[] } }>('getTopSongs', {
      artist,
      count,
    });
    return data.topSongs?.song ?? [];
  }
}

// Singleton
let clientInstance: SubsonicClient | null = null;

export function getSubsonicClient(): SubsonicClient {
  if (!clientInstance) {
    clientInstance = new SubsonicClient();
  }
  return clientInstance;
}

export default SubsonicClient;
