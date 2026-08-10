export type ParsedYoutubeUrl =
  | { type: 'video'; videoId: string }
  | { type: 'playlist'; playlistId: string }
  | { type: 'invalid' };

export interface YoutubeVideoInfo {
  videoId: string;
  title: string;
  artist: string;
  album: string;
  thumbnailUrl: string | null;
  durationMs: number;
  streamUrl: string;
  container: string;
}

export interface YoutubePlaylistEntry {
  videoId: string;
  title: string;
}
