import ytdl, { type videoInfo } from 'react-native-ytdl';
import ytpl from 'ytpl';
import type {
  YoutubePlaylistEntry,
  YoutubeVideoInfo,
} from '../../types/youtube';

function getArtist(info: videoInfo): string {
  const author = info.videoDetails.author;
  if (author && typeof author === 'object' && 'name' in author) {
    return author.name ?? '';
  }
  return typeof author === 'string' ? author : '';
}

export async function getVideoInfo(
  videoId: string,
): Promise<YoutubeVideoInfo> {
  const info = await ytdl.getInfo(videoId);
  const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
  if (!format?.url) {
    throw new Error('No audio stream available for this video');
  }
  return {
    videoId,
    title: info.videoDetails.title,
    artist: getArtist(info),
    album: '',
    thumbnailUrl: info.videoDetails.thumbnails?.at(-1)?.url ?? null,
    durationMs: Number(info.videoDetails.lengthSeconds) * 1000 || 0,
    streamUrl: format.url,
    container: format.container ?? 'm4a',
  };
}

export async function listPlaylist(
  playlistId: string,
): Promise<YoutubePlaylistEntry[]> {
  const playlist = await ytpl(playlistId, { limit: Infinity });
  return playlist.items.map(item => ({
    videoId: item.id,
    title: item.title,
  }));
}
