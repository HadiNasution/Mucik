export type QueueStatus = 'queued' | 'converting' | 'done' | 'failed';

export type QueueErrorCode =
  | 'INVALID_URL'
  | 'NETWORK_ERROR'
  | 'VIDEO_UNAVAILABLE'
  | 'INSUFFICIENT_STORAGE'
  | 'CONVERSION_FAILED';

export interface QueueJob {
  id: string;
  videoId: string;
  sourceUrl: string;
  title: string;
  status: QueueStatus;
  attempts: number;
  progress: number;
  errorCode?: QueueErrorCode;
  errorMessage?: string;
  createdAt: number;
}
