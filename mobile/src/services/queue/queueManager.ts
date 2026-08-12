import type { QueueErrorCode, QueueJob } from '../../types/queue';

type ConvertRunner = (
  job: QueueJob,
  onProgress: (fraction: number) => void,
) => Promise<void>;

export interface QueueJobEntry {
  videoId: string;
  title: string;
  sourceUrl: string;
}

let idCounter = 0;

function generateId(): string {
  return `${Date.now().toString(36)}-${(idCounter++).toString(36)}`;
}

interface QueueManagerOptions {
  maxAttempts?: number;
}

export class QueueManager {
  private readonly convertRunner: ConvertRunner;
  private readonly maxAttempts: number;
  private jobs: QueueJob[] = [];
  private readonly listeners = new Set<(jobs: QueueJob[]) => void>();
  private isProcessing = false;

  constructor(
    convertRunner: ConvertRunner,
    options: QueueManagerOptions = {},
  ) {
    this.convertRunner = convertRunner;
    this.maxAttempts = options.maxAttempts ?? 3;
  }

  subscribe(listener: (jobs: QueueJob[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getJobs(): QueueJob[] {
    return this.jobs;
  }

  enqueue(entries: QueueJobEntry[]): void {
    for (const entry of entries) {
      this.jobs.push({
        id: generateId(),
        videoId: entry.videoId,
        title: entry.title,
        sourceUrl: entry.sourceUrl,
        status: 'queued',
        attempts: 0,
        progress: 0,
        createdAt: Date.now(),
      });
    }
    this.emit();
    void this.processNext();
  }

  retry(jobId: string): void {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job) {
      return;
    }
    job.status = 'queued';
    job.attempts = 0;
    job.progress = 0;
    delete job.errorCode;
    delete job.errorMessage;
    this.emit();
    void this.processNext();
  }

  remove(jobId: string): void {
    this.jobs = this.jobs.filter(j => j.id !== jobId);
    this.emit();
  }

  clearDone(): void {
    this.jobs = this.jobs.filter(j => j.status !== 'done');
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.jobs);
    }
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing) {
      return;
    }
    const next = this.jobs.find(j => j.status === 'queued');
    if (!next) {
      return;
    }
    this.isProcessing = true;
    next.status = 'converting';
    next.attempts += 1;
    next.progress = 0;
    this.emit();
    try {
      await this.convertRunner(next, fraction => {
        next.progress = fraction;
        this.emit();
      });
      next.status = 'done';
      next.progress = 1;
    } catch (error) {
      const code = (error as { code?: QueueErrorCode })?.code;
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      next.errorCode = code ?? 'CONVERSION_FAILED';
      next.errorMessage = message;
      if (next.attempts < this.maxAttempts) {
        next.status = 'queued';
      } else {
        next.status = 'failed';
      }
    }
    this.emit();
    this.isProcessing = false;
    void this.processNext();
  }
}
