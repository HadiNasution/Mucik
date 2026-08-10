import { QueueManager } from '../src/services/queue/queueManager';

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

describe('QueueManager', () => {
  it('processes jobs sequentially in enqueue order', async () => {
    const calls: string[] = [];
    const manager = new QueueManager(async job => {
      calls.push(job.videoId);
    });
    manager.enqueue([
      { videoId: 'a', title: 'A', sourceUrl: '' },
      { videoId: 'b', title: 'B', sourceUrl: '' },
      { videoId: 'c', title: 'C', sourceUrl: '' },
    ]);
    await flush();
    await flush();
    expect(calls).toEqual(['a', 'b', 'c']);
    expect(manager.getJobs().map(j => j.status)).toEqual(['done', 'done', 'done']);
  });

  it('notifies subscribers on job updates', async () => {
    const manager = new QueueManager(async () => {});
    const snapshots: string[][] = [];
    manager.subscribe(jobs => snapshots.push(jobs.map(j => j.status)));
    manager.enqueue([{ videoId: 'a', title: 'A', sourceUrl: '' }]);
    await flush();
    await flush();
    expect(snapshots.length).toBeGreaterThanOrEqual(2);
    expect(snapshots[0]).toEqual(['queued']);
    expect(snapshots[snapshots.length - 1]).toEqual(['done']);
  });

  it('reports download progress via callback', async () => {
    const seen: number[] = [];
    const manager = new QueueManager(async (job, onProgress) => {
      onProgress(0.5);
      onProgress(0.9);
    });
    manager.subscribe(jobs => {
      seen.push(jobs[0]?.progress ?? -1);
    });
    manager.enqueue([{ videoId: 'a', title: 'A', sourceUrl: '' }]);
    await flush();
    await flush();
    expect(seen).toContain(0.5);
    expect(seen).toContain(0.9);
    expect(manager.getJobs()[0].progress).toBe(1);
  });

  it('fails a job permanently after max attempts', async () => {
    let attempts = 0;
    const manager = new QueueManager(
      async () => {
        attempts += 1;
        throw new Error('boom');
      },
      { maxAttempts: 3 },
    );
    manager.enqueue([{ videoId: 'a', title: 'A', sourceUrl: '' }]);
    await flush();
    await flush();
    await flush();
    await flush();
    expect(attempts).toBe(3);
    const job = manager.getJobs()[0];
    expect(job.status).toBe('failed');
    expect(job.errorMessage).toBe('boom');
  });

  it('retries automatically on transient failure within the attempt limit', async () => {
    let attempts = 0;
    const manager = new QueueManager(async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new Error('network hiccup');
      }
    });
    manager.enqueue([{ videoId: 'a', title: 'A', sourceUrl: '' }]);
    await flush();
    await flush();
    await flush();
    await flush();
    expect(attempts).toBe(3);
    expect(manager.getJobs()[0].status).toBe('done');
  });

  it('manual retry resets a failed job', async () => {
    let calls = 0;
    const manager = new QueueManager(
      async () => {
        calls += 1;
        throw new Error('nope');
      },
      { maxAttempts: 1 },
    );
    manager.enqueue([{ videoId: 'a', title: 'A', sourceUrl: '' }]);
    await flush();
    expect(manager.getJobs()[0].status).toBe('failed');

    manager.retry(manager.getJobs()[0].id);
    await flush();
    expect(calls).toBe(2);
    expect(manager.getJobs()[0].status).toBe('failed');
    expect(manager.getJobs()[0].attempts).toBe(1);
  });

  it('remove drops a job from the queue', async () => {
    const manager = new QueueManager(async job => {
      if (job.videoId === 'slow') {
        await new Promise<void>(resolve => setTimeout(() => resolve(), 10));
      }
    });
    manager.enqueue([
      { videoId: 'a', title: 'A', sourceUrl: '' },
      { videoId: 'slow', title: 'Slow', sourceUrl: '' },
    ]);
    await flush();
    manager.remove(manager.getJobs()[1].id);
    expect(manager.getJobs().length).toBe(1);
  });
});
