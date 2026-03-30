export interface Artist {
  id: string;
  name: string;
  coverArt?: string;
  albumCount?: number;
  starred?: string;
  album?: Album[];
}

export interface ArtistIndex {
  name: string;
  artist?: Artist[];
}

export interface Album {
  id: string;
  name: string;
  artist?: string;
  artistId?: string;
  coverArt?: string;
  songCount?: number;
  duration?: number;
  year?: number;
  genre?: string;
  starred?: string;
  created?: string;
  song?: Song[];
  replayGain?: ReplayGain;
}

export interface Song {
  id: string;
  parent?: string;
  title: string;
  album?: string;
  artist?: string;
  albumId?: string;
  artistId?: string;
  track?: number;
  year?: number;
  genre?: string;
  coverArt?: string;
  size?: number;
  contentType?: string;
  suffix?: string;
  duration?: number;
  bitRate?: number;
  path?: string;
  discNumber?: number;
  created?: string;
  starred?: string;
  bpm?: number;
  replayGain?: ReplayGain;
  musicBrainzId?: string;
}

export interface ReplayGain {
  trackGain?: number;
  albumGain?: number;
  trackPeak?: number;
  albumPeak?: number;
  baseGain?: number;
}

export interface Playlist {
  id: string;
  name: string;
  songCount?: number;
  duration?: number;
  created?: string;
  changed?: string;
  coverArt?: string;
  owner?: string;
  public?: boolean;
  entry?: Song[];
}

export interface Genre {
  songCount?: number;
  albumCount?: number;
  value: string;
}

export interface InternetRadioStation {
  id: string;
  name: string;
  streamUrl: string;
  homePageUrl?: string;
}

export interface StructuredLyrics {
  displayArtist?: string;
  displayTitle?: string;
  lang: string;
  synced: boolean;
  offset?: number;
  line?: LyricLine[];
}

export interface LyricLine {
  start?: number;
  value: string;
}

export interface SearchResult3 {
  artist?: Artist[];
  album?: Album[];
  song?: Song[];
}

export interface Starred2 {
  artist?: Artist[];
  album?: Album[];
  song?: Song[];
}

export interface PlayQueue {
  current?: string;
  position?: number;
  changed?: string;
  changedBy?: string;
  entry?: Song[];
}

export interface MusicFolder {
  id: string;
  name?: string;
}

export interface MusicDirectory {
  id: string;
  name?: string;
  parent?: string;
  child?: DirectoryChild[];
}

export interface DirectoryChild {
  id: string;
  title?: string;
  isDir: boolean;
  artist?: string;
  album?: string;
  coverArt?: string;
  duration?: number;
  track?: number;
  year?: number;
  genre?: string;
  size?: number;
  suffix?: string;
  bitRate?: number;
  contentType?: string;
  path?: string;
  parent?: string;
  starred?: string;
  created?: string;
}

export type AlbumListType = 'random' | 'newest' | 'frequent' | 'recent' | 'starred'
  | 'alphabeticalByName' | 'alphabeticalByArtist' | 'byYear' | 'byGenre';

export interface ServerConfig {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
  useLegacyAuth?: boolean;
}
