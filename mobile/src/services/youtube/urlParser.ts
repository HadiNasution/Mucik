import type { ParsedYoutubeUrl } from '../../types/youtube';

const VIDEO_ID_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
const PLAYLIST_ID_REGEX = /[?&]list=([A-Za-z0-9_-]+)/;

export function parseYoutubeUrl(url: string): ParsedYoutubeUrl {
  if (!url || !url.trim()) {
    return { type: 'invalid' };
  }
  const trimmed = url.trim();
  const videoMatch = trimmed.match(VIDEO_ID_REGEX);
  if (videoMatch && videoMatch[1]) {
    return { type: 'video', videoId: videoMatch[1] };
  }
  const playlistMatch = trimmed.match(PLAYLIST_ID_REGEX);
  if (playlistMatch && playlistMatch[1]) {
    return { type: 'playlist', playlistId: playlistMatch[1] };
  }
  return { type: 'invalid' };
}
