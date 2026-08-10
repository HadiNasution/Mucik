export interface Song {
  id: number;
  youtubeId: string;
  title: string;
  artist: string;
  album: string;
  artworkPath: string | null;
  filePath: string;
  durationMs: number;
  sourceUrl: string;
  createdAt: number;
}

export interface SongInput {
  youtubeId: string;
  title: string;
  artist: string;
  album: string;
  artworkPath: string | null;
  filePath: string;
  durationMs: number;
  sourceUrl: string;
}

export type SongFields = Partial<
  Pick<Song, 'title' | 'artist' | 'album' | 'artworkPath'>
>;
