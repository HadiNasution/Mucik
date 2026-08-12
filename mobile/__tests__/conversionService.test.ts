import { runConversionJob } from '../src/services/conversion/conversionService';
import { ConversionError } from '../src/services/conversion/conversionError';

jest.mock('../src/services/youtube/youtubeClient', () => ({
  getVideoInfo: jest.fn(),
}));

jest.mock('../src/services/conversion/ffmpeg', () => ({
  convertToMp3: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/services/storage/storageService', () => ({
  storageService: {
    ensureReady: jest.fn().mockResolvedValue(undefined),
    getCacheDir: jest.fn(() => '/cache'),
    getSongPath: jest.fn(videoId => `/songs/${videoId}.mp3`),
    getArtworkPath: jest.fn(videoId => `/artwork/${videoId}.jpg`),
    getFreeSpace: jest.fn().mockResolvedValue(1024 * 1024 * 1024),
    deleteFile: jest.fn().mockResolvedValue(undefined),
    downloadFile: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../src/db/repositories/songRepository', () => ({
  songRepository: {
    findByYoutubeId: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockResolvedValue({ id: 1 }),
  },
}));

import { getVideoInfo } from '../src/services/youtube/youtubeClient';
import { convertToMp3 } from '../src/services/conversion/ffmpeg';
import { storageService } from '../src/services/storage/storageService';
import { songRepository } from '../src/db/repositories/songRepository';

const mockGetVideoInfo = getVideoInfo as jest.Mock;
const mockInsert = songRepository.insert as jest.Mock;
const mockGetFreeSpace = storageService.getFreeSpace as jest.Mock;
const mockDownloadFile = storageService.downloadFile as jest.Mock;

function makeJob() {
  return {
    id: 'job-1',
    videoId: 'dQw4w9WgXcQ',
    title: 'placeholder',
    sourceUrl: 'https://youtu.be/dQw4w9WgXcQ',
    status: 'converting' as const,
    attempts: 1,
    progress: 0,
    createdAt: Date.now(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetVideoInfo.mockResolvedValue({
    videoId: 'dQw4w9WgXcQ',
    title: 'Never Gonna Give You Up',
    artist: 'Rick Astley',
    album: '',
    thumbnailUrl: 'https://i.ytimg.com/thumb.jpg',
    durationMs: 213000,
    streamUrl: 'https://example.com/audio.m4a',
    container: 'm4a',
  });
  (songRepository.findByYoutubeId as jest.Mock).mockResolvedValue(null);
  mockInsert.mockResolvedValue({ id: 1 });
  mockGetFreeSpace.mockResolvedValue(1024 * 1024 * 1024);
  mockDownloadFile.mockResolvedValue(undefined);
});

describe('runConversionJob', () => {
  it('downloads, converts, saves artwork and inserts the song', async () => {
    const onProgress = jest.fn();
    await runConversionJob(makeJob(), onProgress);

    expect(mockGetVideoInfo).toHaveBeenCalledWith('dQw4w9WgXcQ');
    expect(mockDownloadFile).toHaveBeenCalledWith(
      'https://example.com/audio.m4a',
      '/cache/dQw4w9WgXcQ.m4a',
      expect.any(Function),
    );
    expect(convertToMp3).toHaveBeenCalledWith(
      '/cache/dQw4w9WgXcQ.m4a',
      '/songs/dQw4w9WgXcQ.mp3',
    );
    expect(mockDownloadFile).toHaveBeenCalledWith(
      'https://i.ytimg.com/thumb.jpg',
      '/artwork/dQw4w9WgXcQ.jpg',
    );
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        youtubeId: 'dQw4w9WgXcQ',
        title: 'Never Gonna Give You Up',
        artist: 'Rick Astley',
        filePath: '/songs/dQw4w9WgXcQ.mp3',
        artworkPath: '/artwork/dQw4w9WgXcQ.jpg',
      }),
    );
    expect(onProgress).toHaveBeenLastCalledWith(1);
  });

  it('rejects with INSUFFICIENT_STORAGE when free space is too low', async () => {
    mockGetFreeSpace.mockResolvedValue(1024 * 1024); // 1MB free
    await expect(runConversionJob(makeJob(), () => {})).rejects.toMatchObject({
      code: 'INSUFFICIENT_STORAGE',
    });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('rejects with CONVERSION_FAILED when the song already exists', async () => {
    (songRepository.findByYoutubeId as jest.Mock).mockResolvedValue({ id: 9 });
    await expect(runConversionJob(makeJob(), () => {})).rejects.toMatchObject({
      code: 'CONVERSION_FAILED',
    });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('maps an unavailable-video error to VIDEO_UNAVAILABLE', async () => {
    mockGetVideoInfo.mockRejectedValue(
      new Error('This video is unavailable in your region'),
    );
    await expect(runConversionJob(makeJob(), () => {})).rejects.toMatchObject({
      code: 'VIDEO_UNAVAILABLE',
    });
  });

  it('maps network errors to NETWORK_ERROR', async () => {
    mockGetVideoInfo.mockRejectedValue(new Error('ECONNRESET'));
    await expect(runConversionJob(makeJob(), () => {})).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  it('preserves an existing ConversionError code', async () => {
    mockDownloadFile.mockRejectedValue(
      new ConversionError('CONVERSION_FAILED', 'already handled'),
    );
    const promise = runConversionJob(makeJob(), () => {});
    await expect(promise).rejects.toBeInstanceOf(ConversionError);
    try {
      await promise;
    } catch (error) {
      expect(error).toMatchObject({ code: 'CONVERSION_FAILED' });
      expect((error as Error).message).toBe('already handled');
    }
  });
});
