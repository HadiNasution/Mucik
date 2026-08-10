import { getVideoInfo } from '../youtube/youtubeClient';
import { convertToMp3 } from './ffmpeg';
import { storageService } from '../storage/storageService';
import { songRepository } from '../../db/repositories/songRepository';
import { ConversionError, toConversionError } from './conversionError';
import type { QueueJob } from '../../types/queue';

const FREE_SPACE_BUFFER = 5 * 1024 * 1024;

export async function runConversionJob(
  job: QueueJob,
  onProgress: (fraction: number) => void,
): Promise<void> {
  try {
    await storageService.ensureReady();
    onProgress(0.05);

    const info = await getVideoInfo(job.videoId);
    onProgress(0.15);

    const existing = await songRepository.findByYoutubeId(job.videoId);
    if (existing) {
      throw new ConversionError(
        'CONVERSION_FAILED',
        'Song already in library',
      );
    }

    const freeSpace = await storageService.getFreeSpace();
    const estimatedBytes =
      (info.durationMs / 1000) * 16000 + FREE_SPACE_BUFFER;
    if (freeSpace < estimatedBytes) {
      throw new ConversionError(
        'INSUFFICIENT_STORAGE',
        'Not enough storage space',
      );
    }

    const cachePath = `${storageService.getCacheDir()}/${job.videoId}.${
      info.container || 'm4a'
    }`;
    await storageService.deleteFile(cachePath);
    await storageService.downloadFile(info.streamUrl, cachePath, fraction => {
      onProgress(0.15 + fraction * 0.35);
    });
    onProgress(0.5);

    const mp3Path = storageService.getSongPath(job.videoId);
    await storageService.deleteFile(mp3Path);
    await convertToMp3(cachePath, mp3Path);
    onProgress(0.9);

    let artworkPath: string | null = null;
    if (info.thumbnailUrl) {
      try {
        artworkPath = storageService.getArtworkPath(job.videoId);
        await storageService.deleteFile(artworkPath);
        await storageService.downloadFile(info.thumbnailUrl, artworkPath);
      } catch {
        artworkPath = null;
      }
    }

    await songRepository.insert({
      youtubeId: info.videoId,
      title: info.title,
      artist: info.artist,
      album: info.album,
      artworkPath,
      filePath: mp3Path,
      durationMs: info.durationMs,
      sourceUrl: job.sourceUrl,
    });

    await storageService.deleteFile(cachePath);
    onProgress(1);
  } catch (error) {
    throw toConversionError(error);
  }
}
