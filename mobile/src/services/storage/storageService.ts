import RNFS from 'react-native-fs';

const SONGS_DIR = `${RNFS.ExternalDirectoryPath}/music`;
const ARTWORK_DIR = `${RNFS.ExternalDirectoryPath}/artwork`;
const CACHE_DIR = RNFS.CachesDirectoryPath;

async function ensureDirs(): Promise<void> {
  await RNFS.mkdir(SONGS_DIR);
  await RNFS.mkdir(ARTWORK_DIR);
}

export const storageService = {
  getSongsDir(): string {
    return SONGS_DIR;
  },

  getArtworkDir(): string {
    return ARTWORK_DIR;
  },

  getCacheDir(): string {
    return CACHE_DIR;
  },

  async ensureReady(): Promise<void> {
    await ensureDirs();
  },

  getSongPath(videoId: string): string {
    return `${SONGS_DIR}/${videoId}.mp3`;
  },

  getArtworkPath(videoId: string): string {
    return `${ARTWORK_DIR}/${videoId}.jpg`;
  },

  async getFreeSpace(): Promise<number> {
    const info = await RNFS.getFSInfo();
    return info.freeSpace;
  },

  async fileExists(path: string): Promise<boolean> {
    return RNFS.exists(path);
  },

  async deleteFile(path: string): Promise<void> {
    if (await RNFS.exists(path)) {
      await RNFS.unlink(path);
    }
  },

  async downloadFile(
    sourceUrl: string,
    destPath: string,
    onProgress?: (fraction: number) => void,
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const task = RNFS.downloadFile({
        fromUrl: sourceUrl,
        toFile: destPath,
        progressInterval: 500,
        progressDivider: 64,
        begin: () => {
          if (onProgress) {
            onProgress(0);
          }
        },
        progress: response => {
          if (onProgress && response.contentLength > 0) {
            onProgress(response.bytesWritten / response.contentLength);
          }
        },
      });
      task.promise
        .then(res => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(`Download failed with status ${res.statusCode}`));
          }
        })
        .catch(reject);
    });
  },
};
