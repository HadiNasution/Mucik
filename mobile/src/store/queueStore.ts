import { create } from 'zustand';
import { QueueManager, type QueueJobEntry } from '../services/queue/queueManager';
import { runConversionJob } from '../services/conversion/conversionService';
import { parseYoutubeUrl } from '../services/youtube/urlParser';
import { listPlaylist } from '../services/youtube/youtubeClient';
import type { QueueJob } from '../types/queue';

const queueManager = new QueueManager(runConversionJob);

interface ResolveResult {
  type: 'video' | 'playlist';
  entries: QueueJobEntry[];
}

type ResolveOutcome =
  | { ok: true; result: ResolveResult }
  | { ok: false; error: string };

interface QueueState {
  jobs: QueueJob[];
  resolveUrl: (url: string) => Promise<ResolveOutcome>;
  enqueue: (entries: QueueJobEntry[]) => void;
  retry: (jobId: string) => void;
  remove: (jobId: string) => void;
  clearDone: () => void;
}

function parseErrorToMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export const useQueueStore = create<QueueState>(set => ({
  jobs: queueManager.getJobs(),

  resolveUrl: async url => {
    const parsed = parseYoutubeUrl(url);
    if (parsed.type === 'invalid') {
      return { ok: false, error: 'Invalid YouTube URL' };
    }
    if (parsed.type === 'video') {
      return {
        ok: true,
        result: {
          type: 'video',
          entries: [
            {
              videoId: parsed.videoId,
              title: 'Converting video...',
              sourceUrl: url,
            },
          ],
        },
      };
    }
    try {
      const entries = await listPlaylist(parsed.playlistId);
      if (entries.length === 0) {
        return { ok: false, error: 'Playlist is empty or private' };
      }
      return {
        ok: true,
        result: {
          type: 'playlist',
          entries: entries.map(entry => ({
            videoId: entry.videoId,
            title: entry.title,
            sourceUrl: `https://youtu.be/${entry.videoId}`,
          })),
        },
      };
    } catch (error) {
      return { ok: false, error: parseErrorToMessage(error) };
    }
  },

  enqueue: entries => {
    queueManager.enqueue(entries);
    set({ jobs: queueManager.getJobs() });
  },

  retry: jobId => {
    queueManager.retry(jobId);
    set({ jobs: queueManager.getJobs() });
  },

  remove: jobId => {
    queueManager.remove(jobId);
    set({ jobs: queueManager.getJobs() });
  },

  clearDone: () => {
    queueManager.clearDone();
    set({ jobs: queueManager.getJobs() });
  },
}));

queueManager.subscribe(jobs => {
  useQueueStore.setState({ jobs });
});
